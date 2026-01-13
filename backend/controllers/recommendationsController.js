import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import axios from "axios";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { Job } from "../models/jobSchema.js";
import { Application } from "../models/applicationSchema.js";
import { User } from "../models/userSchema.js";
import { getEmbeddings, cosineSimilarity, extractStructuredDataFromResume } from "../services/aiService.js";
import { scrapeLinkedInJobs } from "../services/scraperService.js";

const tokenize = (text = "") => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 2);
};

const extractRemoteText = async (url) => {
  try {
    let buffer;
    if (url.startsWith("/")) {
      // Local file path
      const filePath = path.join(process.cwd(), url);
      if (fs.existsSync(filePath)) {
        buffer = fs.readFileSync(filePath);
      } else {
        return "";
      }
    } else {
      // Remote URL
      const resp = await axios.get(url, { responseType: "arraybuffer" });
      buffer = Buffer.from(resp.data);
    }

    if (url.toLowerCase().endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      return data.text || "";
    }
    // try mammoth for docx
    try {
      const { value } = await mammoth.extractRawText({ buffer });
      return value || buffer.toString("utf-8");
    } catch (e) {
      return buffer.toString("utf-8");
    }
  } catch (err) {
    console.error("Extraction error:", err.message);
    return "";
  }
};

export const recommendJobs = catchAsyncErrors(async (req, res, next) => {
  const { _id, role } = req.user;
  if (role === "Employer") return next(new ErrorHandler("Employers cannot request recommendations", 403));

  // fetch user's resume url and past applications
  const user = await User.findById(_id).lean();
  const apps = await Application.find({ "applicantID.user": _id }).lean();

  // collect past signals
  const pastTitles = new Set(apps.map((a) => (a.jobTitle || "").toLowerCase()).filter(Boolean));
  const pastCompanies = new Set(apps.map((a) => (a.companyName || "").toLowerCase()).filter(Boolean));
  const pastCategories = new Set(apps.map((a) => (a.category || "").toLowerCase()).filter(Boolean));

  // prepare resume text if available
  let resumeText = "";
  if (user && user.resume) {
    resumeText = await extractRemoteText(user.resume);
  }

  // Extract structured data from resume using AI
  let structuredResume = null;
  if (resumeText.trim()) {
    structuredResume = await extractStructuredDataFromResume(resumeText);
  }

  // Fallback: If no structured resume but user has skills/bio, use them
  if (!structuredResume) {
    // Calculate experience years from profile if possible
    let profileExpYears = 0;
    if (user.experience && user.experience.length > 0) {
      user.experience.forEach(exp => {
        const match = exp.duration?.match(/(\d+)/);
        if (match) profileExpYears += parseInt(match[1]);
      });
    }

    structuredResume = {
      skills: user.skills || [],
      summary: user.bio || "",
      jobTitles: user.experience?.map(e => e.role) || [],
      experienceYears: profileExpYears
    };
  }

  // Create a comprehensive profile text for better matching
  const profileText = resumeText.trim() || [
    user.bio || "",
    ...(user.skills || []),
    ...(user.experience || []).map(e => `${e.role} at ${e.company}`),
    ...(user.education || []).map(e => `${e.degree} from ${e.institution}`)
  ].join(" ");

  // fetch jobs (limit to reasonable number)
  const internalJobs = await Job.find({ expired: false }).limit(200).lean();

  // Scrape external jobs based on user's past titles or structured resume titles
  let externalJobs = [];
  const searchKeywords = new Set();
  
  if (structuredResume) {
    if (structuredResume.jobTitles) structuredResume.jobTitles.forEach(t => searchKeywords.add(t));
    if (structuredResume.skills) structuredResume.skills.slice(0, 3).forEach(s => searchKeywords.add(s));
  }
  
  pastTitles.forEach(t => searchKeywords.add(t));
  
  // Add user's explicit skills to search keywords
  if (user.skills && user.skills.length > 0) {
    user.skills.slice(0, 3).forEach(s => searchKeywords.add(s));
  }

  // If still no keywords, use a generic one based on role or name as last resort
  if (searchKeywords.size === 0) {
    searchKeywords.add("Software Engineer"); // Default fallback
  }

  // If no keywords found, use a default or skip
  if (searchKeywords.size > 0) {
    const topKeywords = Array.from(searchKeywords).filter(Boolean).slice(0, 2);
    for (const keyword of topKeywords) {
      const scraped = await scrapeLinkedInJobs(keyword, user.location || "India");
      if (scraped && scraped.length > 0) {
        externalJobs = [...externalJobs, ...scraped];
      }
    }
  }

  const jobs = [...internalJobs, ...externalJobs];

  // get profile embedding for semantic matching
  let resumeEmbedding = null;
  if (profileText.trim()) {
    try {
      resumeEmbedding = await getEmbeddings(profileText);
    } catch (error) {
      console.error("Error fetching profile embedding:", error);
    }
  }

  const scored = await Promise.all(jobs.map(async (job) => {
    // For external jobs, we might not have a full description, so we use what we have
    const jobText = [
      job.title || "", 
      job.description || job.title || "", // Fallback to title if description is missing
      job.companyName || "", 
      job.category || ""
    ].join(" ");
    
    const jobTokens = Array.from(new Set(tokenize(jobText)));
    const profileTokens = new Set(tokenize(profileText));

    // 1. Semantic Score (Embeddings)
    let semanticScore = 0;
    if (resumeEmbedding) {
      try {
        const jobEmbedding = await getEmbeddings(jobText);
        semanticScore = cosineSimilarity(resumeEmbedding, jobEmbedding);
      } catch (error) {
        console.error("Error fetching job embedding:", error);
      }
    }

    // 2. Skill Overlap Score
    let skillScore = 0;
    const userSkills = structuredResume?.skills || user.skills || [];
    if (userSkills.length > 0) {
      const jobLower = jobText.toLowerCase();
      const matchedSkills = userSkills.filter(skill => jobLower.includes(skill.toLowerCase()));
      skillScore = matchedSkills.length / userSkills.length;
    } else {
      // Fallback to token overlap
      const matchedKeywords = jobTokens.filter((t) => resumeTokens.has(t));
      skillScore = jobTokens.length ? matchedKeywords.length / jobTokens.length : 0;
    }

    // 3. Experience Match
    let experienceScore = 0;
    if (structuredResume && structuredResume.experienceYears !== undefined) {
      // Heuristic: check if JD mentions years of experience
      const expMatch = job.description ? job.description.match(/(\d+)\+?\s*years?/i) : null;
      if (expMatch) {
        const requiredYears = parseInt(expMatch[1]);
        if (structuredResume.experienceYears >= requiredYears) experienceScore = 1;
        else experienceScore = structuredResume.experienceYears / requiredYears;
      } else {
        experienceScore = 0.5; // Neutral if not specified or external
      }
    }

    // 4. Title Relevance
    const titleTokens = tokenize(job.title || "");
    const titleMatch = titleTokens.filter((t) => profileTokens.has(t)).length;
    const titleScore = titleTokens.length ? titleMatch / titleTokens.length : 0;

    // 5. Past Application Boosts
    let boost = 0;
    if (pastTitles.has((job.title || "").toLowerCase())) boost += 0.15;
    if (pastCompanies.has((job.companyName || "").toLowerCase())) boost += 0.12;
    if (pastCategories.has((job.category || "").toLowerCase())) boost += 0.08;

    // Final Weighted Score
    // If semantic score is 0 (AI failed), we rely 100% on keyword/experience matching
    let finalScore;
    if (semanticScore > 0) {
      // Weights: Semantic 40%, Skills 30%, Experience 15%, Title 10%, Boost 5%
      finalScore = (0.4 * semanticScore) + (0.3 * skillScore) + (0.15 * experienceScore) + (0.1 * titleScore) + Math.min(boost, 0.05);
    } else {
      // Keyword-centric weights: Skills 60%, Experience 20%, Title 15%, Boost 5%
      finalScore = (0.6 * skillScore) + (0.2 * experienceScore) + (0.15 * titleScore) + Math.min(boost, 0.05);
    }
    
    finalScore = Math.round(finalScore * 100);

    // Identify exactly which keywords matched for transparency
    const userKeywords = Array.from(new Set([
      ...(structuredResume?.skills || []),
      ...(user.skills || []),
      ...(structuredResume?.jobTitles || [])
    ])).filter(Boolean);
    
    const matchedKeywords = userKeywords.filter(k => jobText.toLowerCase().includes(k.toLowerCase()));

    return {
      jobId: job._id || job.jobId,
      title: job.title,
      companyName: job.companyName,
      location: job.isExternal ? job.location : `${job.city || ""}, ${job.country || ""}`,
      category: job.category,
      score: finalScore,
      matchedSkills: matchedKeywords,
      isExternal: job.isExternal || false,
      link: job.link || null,
      source: job.source || "Internal",
    };
  }));

  // sort by score desc and return top 50
  scored.sort((a, b) => b.score - a.score);
  res.status(200).json({ success: true, recommendations: scored.slice(0, 50) });
});

export default recommendJobs;
