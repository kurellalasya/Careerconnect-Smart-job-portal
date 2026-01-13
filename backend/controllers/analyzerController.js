import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/error.js";
import fs from "fs";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { analyzeResumeWithAI } from "../services/aiService.js";

const extractText = async (filePath, mimetype) => {
  const buffer = fs.readFileSync(filePath);
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }
  // For docx and other word formats, try mammoth
  try {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  } catch (err) {
    return buffer.toString("utf-8");
  }
};

const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 2);
};

export const analyzeResume = catchAsyncErrors(async (req, res, next) => {
  const { jobDescription } = req.body;
  if (!jobDescription) return next(new ErrorHandler("Job description required", 400));
  if (!req.files || !req.files.resume) return next(new ErrorHandler("Resume file required", 400));

  const resumeFile = req.files.resume;
  const allowedFormats = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
  if (!allowedFormats.includes(resumeFile.mimetype)) {
    return next(new ErrorHandler("Invalid file type. Please upload a PDF or DOCX file.", 400));
  }

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `${Date.now()}_${resumeFile.name}`;
  const savePath = path.join(uploadsDir, filename);
  await resumeFile.mv(savePath);

  const resumeText = await extractText(savePath, resumeFile.mimetype);

  // Try AI Analysis first
  const aiResult = await analyzeResumeWithAI(resumeText, jobDescription);

  if (aiResult) {
    return res.status(200).json({
      success: true,
      isAI: true,
      score: aiResult.score,
      matched: aiResult.matchedKeywords,
      missingKeywords: aiResult.missingKeywords,
      resumeUrl: `/uploads/${filename}`,
      suggestions: aiResult.suggestions,
      resumeQualityScore: aiResult.resumeQualityScore,
      summary: aiResult.summary,
      analysisSummary: {
        wordCount: resumeText.split(/\s+/).filter(Boolean).length,
        isAIPowered: true
      }
    });
  }

  // Fallback to Heuristic Analysis if AI fails or no API key
  const jdTokens = Array.from(new Set(tokenize(jobDescription)));
  const resumeTokens = new Set(tokenize(resumeText));

  const matched = jdTokens.filter((t) => resumeTokens.has(t));
  const score = jdTokens.length === 0 ? 0 : Math.round((matched.length / jdTokens.length) * 100);

  // Compute resume baseline quality score (heuristic)
  const totalSections = ["skills", "experience", "projects", "education", "certifications", "summary"].length;
  const sectionsPresentCount = [
    /(^|\n)skills?:/i.test(resumeText),
    /(^|\n)experience[:\n]/i.test(resumeText) || /(^|\n)work experience[:\n]/i.test(resumeText) || /(^|\n)employment[:\n]/i.test(resumeText),
    /(^|\n)projects?:/i.test(resumeText),
    /(^|\n)education?:/i.test(resumeText),
    /certif/i.test(resumeText.toLowerCase()),
    /(^|\n)summary[:\n]/i.test(resumeText) || /(^|\n)objective[:\n]/i.test(resumeText) || /(^|\n)about me[:\n]/i.test(resumeText),
  ].filter(Boolean).length;

  // skills count heuristic
  let skillsCount = 0;
  const skillsMatch = resumeText.match(/skills?:\s*([\s\S]{0,500})/i);
  if (skillsMatch && skillsMatch[1]) {
    skillsCount = skillsMatch[1].split(/[,\n|•]/).map(s => s.trim()).filter(Boolean).length;
  }

  // Action verbs detection
  const actionVerbs = ["developed", "managed", "led", "implemented", "created", "designed", "improved", "optimized", "increased", "decreased", "coordinated", "spearheaded", "executed", "built", "automated"];
  const resumeLower = resumeText.toLowerCase();
  const actionVerbsFound = actionVerbs.filter(v => resumeLower.includes(v));

  // quantified bullets heuristic
  const sentenceCandidates = resumeText.split(/[\.\n]+/).map(s => s.trim()).filter(Boolean);
  const quantifiedCount = sentenceCandidates.filter(s => /\d+%|\d+\s?%|[\$£]\d+|\d+\+/.test(s)).length;

  // word count
  const words = resumeText.split(/\s+/).filter(Boolean).length;

  // contact info detection
  const hasEmail = /[\w.-]+@[\w.-]+\.[A-Za-z]{2,6}/.test(resumeText);
  const hasPhone = /\+?\d[\d\s()-]{7,}\d/.test(resumeText);
  const hasLinkedIn = /linkedin\.com\/in\/[\w-]+/.test(resumeLower);
  const hasGitHub = /github\.com\/[\w-]+/.test(resumeLower);

  // Weighted scoring (total 100)
  const sectionsScore = (sectionsPresentCount / totalSections) * 20; // up to 20
  const skillsScore = Math.min(skillsCount, 15) / 15 * 20; // up to 20
  const quantifiedScore = Math.min(quantifiedCount, 8) / 8 * 20; // up to 20
  const actionVerbsScore = Math.min(actionVerbsFound.length, 10) / 10 * 15; // up to 15
  const lengthScore = (words >= 300 && words <= 800) ? 15 : (words > 800 ? 10 : 5); // up to 15
  const contactScore = (hasEmail && hasPhone) ? 10 : (hasEmail || hasPhone ? 5 : 0); // up to 10

  const resumeQualityScore = Math.round(sectionsScore + skillsScore + quantifiedScore + actionVerbsScore + lengthScore + contactScore);
  
  // heuristic suggestions
  const missingKeywords = jdTokens.filter((t) => !resumeTokens.has(t));

  // detect if resume contains common sections
  const sections = {
    skills: /(^|\n)skills?:/i.test(resumeText),
    experience: /(^|\n)experience[:\n]/i.test(resumeText) || /(^|\n)work experience[:\n]/i.test(resumeText) || /(^|\n)employment[:\n]/i.test(resumeText),
    projects: /(^|\n)projects?:/i.test(resumeText),
    education: /(^|\n)education?:/i.test(resumeText),
    certifications: /certif/i.test(resumeLower),
    summary: /(^|\n)summary[:\n]/i.test(resumeText) || /(^|\n)objective[:\n]/i.test(resumeText) || /(^|\n)about me[:\n]/i.test(resumeText),
  };

  const suggestions = [];

  // Suggest adding missing high-value keywords under Skills
  if (missingKeywords.length > 0) {
    suggestions.push({
      section: "Keywords",
      issue: `Missing ${missingKeywords.length} relevant keywords from the job description`,
      priority: "high",
      suggestion: `Integrate these keywords naturally into your experience or skills section: ${missingKeywords.slice(0, 15).join(", ")}`,
      example: missingKeywords.slice(0, 3).map(k => `Used ${k} to...`).join('; '),
    });
  }

  // Suggest adding Skills section if missing
  if (!sections.skills) {
    suggestions.push({
      section: "Skills",
      issue: "No explicit Skills section detected",
      priority: "high",
      suggestion: "Add a dedicated 'Skills' section to help ATS systems quickly identify your technical stack.",
      example: "Skills: React, Node.js, MongoDB, AWS, Docker",
    });
  }

  // Suggest adding Summary section if missing
  if (!sections.summary) {
    suggestions.push({
      section: "Summary",
      issue: "Missing professional summary or objective",
      priority: "medium",
      suggestion: "Add a 2-3 sentence summary at the top to highlight your years of experience and key achievements.",
      example: "Results-driven Software Engineer with 5+ years of experience in building scalable web applications...",
    });
  }

  // Suggest quantifying bullets in Experience
  if (quantifiedCount < 5) {
    suggestions.push({
      section: "Impact",
      issue: "Few quantifiable achievements found",
      priority: "high",
      suggestion: "Use more numbers, percentages, and metrics to demonstrate your impact.",
      example: "Instead of 'Improved website speed', use 'Optimized website performance, reducing load time by 40%'.",
    });
  }

  // Action Verbs
  if (actionVerbsFound.length < 5) {
    suggestions.push({
      section: "Tone",
      issue: "Limited use of strong action verbs",
      priority: "medium",
      suggestion: "Start your bullet points with strong action verbs like 'Spearheaded', 'Architected', or 'Transformed'.",
      example: "Spearheaded the development of a new microservice architecture...",
    });
  }

  // Contact Info
  if (!hasLinkedIn || !hasGitHub) {
    suggestions.push({
      section: "Contact",
      issue: "Missing professional links (LinkedIn/GitHub)",
      priority: "low",
      suggestion: "Include links to your LinkedIn profile and GitHub/Portfolio to provide more context to recruiters.",
      example: "LinkedIn: linkedin.com/in/yourprofile",
    });
  }

  // Word count check
  if (words < 300) {
    suggestions.push({
      section: "Length",
      issue: "Resume seems too short",
      priority: "medium",
      suggestion: "Your resume is under 300 words. Consider expanding on your responsibilities and projects.",
    });
  } else if (words > 1000) {
    suggestions.push({
      section: "Length",
      issue: "Resume might be too long",
      priority: "low",
      suggestion: "Your resume is over 1000 words. Ensure it's concise and ideally fits within 1-2 pages.",
    });
  }

  // return matched keywords, score, suggestions and resume quality
  res.status(200).json({ 
    success: true, 
    score, 
    matched, 
    missingKeywords: missingKeywords.slice(0, 20),
    totalKeywords: jdTokens.length, 
    resumeUrl: `/uploads/${filename}`, 
    suggestions, 
    resumeQualityScore,
    analysisSummary: {
      wordCount: words,
      sectionsFound: Object.keys(sections).filter(k => sections[k]),
      sectionsMissing: Object.keys(sections).filter(k => !sections[k]),
      quantifiedBullets: quantifiedCount,
      actionVerbsCount: actionVerbsFound.length
    }
  });
});

export default analyzeResume;
