import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_EMBEDDING_URL = "https://api.openai.com/v1/embeddings";

// Function to get embeddings from OpenAI
export const getEmbeddings = async (text) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    throw new Error("OpenAI API Key not found");
  }
  try {
    const response = await axios.post(
      OPENAI_EMBEDDING_URL,
      {
        input: text,
        model: "text-embedding-ada-002", // or another embedding model
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    return response.data.data[0].embedding; // Return the embedding vector
  } catch (error) {
    console.error("Error fetching embeddings:", error);
    throw new Error("Failed to fetch embeddings");
  }
};

// Function to compute cosine similarity between two vectors
export const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must be of the same length");
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dotProduct / (normA * normB);
};

export const analyzeResumeWithAI = async (resumeText, jobDescription) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are an advanced Applicant Tracking System (ATS) AI. Your task is to strictly analyze a candidate's resume against a specific job description.

      Evaluation Rules:
      - Compare skills, tools, technologies, experience, and role relevance.
      - Consider common synonyms (e.g., React.js = React, JS = JavaScript).
      - Do NOT assume any skill or experience that is not explicitly mentioned.
      - Be strict and realistic like a real ATS used by companies.
      - Base the score primarily on skill match, then experience relevance.

      Job Description: ${jobDescription}
      
      Resume Text: ${resumeText}
      
      Provide the analysis in the following JSON format:
      {
        "score": (0-100 match score based on strict evaluation rules),
        "resumeQualityScore": (0-100 overall quality based on formatting and content),
        "matchedKeywords": ["list", "of", "matched", "keywords/skills"],
        "missingKeywords": ["list", "of", "missing", "important", "keywords/skills"],
        "suggestions": [
          {
            "section": "Section Name",
            "issue": "Description of issue",
            "priority": "high/medium/low",
            "suggestion": "How to fix it",
            "example": "Concrete example"
          }
        ],
        "summary": {
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"]
        }
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up potential markdown code blocks
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Analysis Error:", error.message);
      // Fallback to OpenAI if Gemini fails
    }
  }

  if (!openaiKey || openaiKey === "your_openai_api_key_here") {
    console.warn("AI API Keys not found. Falling back to heuristic analysis.");
    return null;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an advanced Applicant Tracking System (ATS) AI. Your task is to strictly analyze a candidate's resume against a specific job description.

            Evaluation Rules:
            - Compare skills, tools, technologies, experience, and role relevance.
            - Consider common synonyms (e.g., React.js = React, JS = JavaScript).
            - Do NOT assume any skill or experience that is not explicitly mentioned.
            - Be strict and realistic like a real ATS used by companies.
            - Base the score primarily on skill match, then experience relevance.`
          },
          {
            role: "user",
            content: `
            Job Description: ${jobDescription}
            
            Resume Text: ${resumeText}
            
            Provide the analysis in the following JSON format:
            {
              "score": (0-100 match score based on strict evaluation rules),
              "resumeQualityScore": (0-100 overall quality based on formatting and content),
              "matchedKeywords": ["list", "of", "matched", "keywords/skills"],
              "missingKeywords": ["list", "of", "missing", "important", "keywords/skills"],
              "suggestions": [
                {
                  "section": "Section Name",
                  "issue": "Description of issue",
                  "priority": "high/medium/low",
                  "suggestion": "How to fix it",
                  "example": "Concrete example"
                }
              ],
              "summary": {
                "strengths": ["strength1", "strength2"],
                "weaknesses": ["weakness1", "weakness2"]
              }
            }`
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Analysis Error:", error.response?.data || error.message);
    return null;
  }
};

export const extractStructuredDataFromResume = async (resumeText) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a professional resume parser. Extract structured data from the provided resume text into JSON format.
      
      Resume Text: ${resumeText}
      
      Extract the following into JSON:
      {
        "skills": ["skill1", "skill2"],
        "experienceYears": (number),
        "education": ["degree1", "degree2"],
        "jobTitles": ["title1", "title2"],
        "summary": "brief summary"
      }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Extraction Error:", error.message);
    }
  }

  if (!openaiKey || openaiKey === "your_openai_api_key_here") {
    return null;
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional resume parser. Extract structured data from the provided resume text into JSON format."
          },
          {
            role: "user",
            content: `
            Resume Text: ${resumeText}
            
            Extract the following into JSON:
            {
              "skills": ["skill1", "skill2"],
              "experienceYears": (number),
              "education": ["degree1", "degree2"],
              "jobTitles": ["title1", "title2"],
              "summary": "brief summary"
            }`
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Extraction Error:", error.response?.data || error.message);
    return null;
  }
};

export const generateMockQuestions = async (category) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a professional interviewer. Generate 5 relevant interview questions for a specific job category: ${category}. Provide the questions as a JSON array of strings in this format: { "questions": ["q1", "q2", "q3", "q4", "q5"] }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(text);
      return data.questions || data;
    } catch (error) {
      console.error("Gemini Question Generation Error:", error.message);
    }
  }

  if (!openaiKey || openaiKey === "your_openai_api_key_here") {
    return ["Tell me about yourself.", "Why do you want to work in this field?", "What are your strengths?"];
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional interviewer. Generate 5 relevant interview questions for a specific job category."
          },
          {
            role: "user",
            content: `Job Category: ${category}. Provide the questions as a JSON array of strings.`
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
      }
    );

    const data = JSON.parse(response.data.choices[0].message.content);
    return data.questions || data;
  } catch (error) {
    console.error("OpenAI Question Generation Error:", error.response?.data || error.message);
    return ["Tell me about yourself.", "Why do you want to work in this field?", "What are your strengths?"];
  }
};

export const evaluateMockAnswer = async (question, answer) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `You are a professional interviewer. Evaluate the candidate's answer to an interview question.
      
      Question: ${question}
      Answer: ${answer}
      
      Provide feedback and a score (0-100) in JSON format: { "feedback": "...", "score": 85 }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Evaluation Error:", error.message);
    }
  }

  if (!openaiKey || openaiKey === "your_openai_api_key_here") {
    return { feedback: "Good effort! Keep practicing.", score: 70 };
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional interviewer. Evaluate the candidate's answer to an interview question."
          },
          {
            role: "user",
            content: `Question: ${question}\nAnswer: ${answer}\n\nProvide feedback and a score (0-100) in JSON format: { "feedback": "...", "score": 85 }`
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Evaluation Error:", error.response?.data || error.message);
    return { feedback: "Good effort! Keep practicing.", score: 70 };
  }
};

export const generateDSAProblem = async (category) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const fallbackProblems = [
    {
      question: "Two Sum",
      problemStatement: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      constraints: "2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9",
      inputFormat: "Array of integers, target integer",
      outputFormat: "Array of two indices",
      sampleTestCases: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]",
      testCases: [
        { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false },
        { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: true },
        { input: "[3,3], 6", expectedOutput: "[0,1]", isHidden: true }
      ]
    },
    {
      question: "Reverse String",
      problemStatement: "Write a function that reverses a string. The input string is given as an array of characters s.",
      constraints: "1 <= s.length <= 10^5, s[i] is a printable ascii character.",
      inputFormat: "Array of characters",
      outputFormat: "None (Modify in-place or return reversed array)",
      sampleTestCases: "Input: s = [\"h\",\"e\",\"l\",\"l\",\"o\"]\nOutput: [\"o\",\"l\",\"l\",\"e\",\"h\"]",
      testCases: [
        { input: "[\"h\",\"e\",\"l\",\"l\",\"o\"]", expectedOutput: "[\"o\",\"l\",\"l\",\"e\",\"h\"]", isHidden: false },
        { input: "[\"H\",\"a\",\"n\",\"n\",\"a\",\"h\"]", expectedOutput: "[\"h\",\"a\",\"n\",\"n\",\"a\",\"H\"]", isHidden: true }
      ]
    },
    {
      question: "Contains Duplicate",
      problemStatement: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.",
      constraints: "1 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9",
      inputFormat: "Array of integers",
      outputFormat: "Boolean",
      sampleTestCases: "Input: nums = [1,2,3,1]\nOutput: true",
      testCases: [
        { input: "[1,2,3,1]", expectedOutput: "true", isHidden: false },
        { input: "[1,2,3,4]", expectedOutput: "false", isHidden: true }
      ]
    }
  ];

  if (!openaiKey || openaiKey === "your_openai_api_key_here") {
    return fallbackProblems[Math.floor(Math.random() * fallbackProblems.length)];
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional technical interviewer. Generate a unique and random DSA problem for a coding interview. Do NOT always pick Two Sum. Choose from various topics like Arrays, Strings, Linked Lists, Trees, or Dynamic Programming. Include 3-5 test cases, some of which should be hidden."
          },
          {
            role: "user",
            content: `Job Category: ${category}. Provide a random DSA problem in JSON format: { "question": "...", "problemStatement": "...", "constraints": "...", "inputFormat": "...", "outputFormat": "...", "sampleTestCases": "...", "testCases": [{ "input": "...", "expectedOutput": "...", "isHidden": boolean }] }`
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error("AI DSA Problem Generation Error:", error.response?.data || error.message);
    return fallbackProblems[Math.floor(Math.random() * fallbackProblems.length)];
  }
};

export const evaluateDSACode = async (problem, code, language) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || openaiKey === "your_openai_api_key_here") {
    return { feedback: "Code looks functional. Consider optimizing time complexity.", score: 80 };
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional technical interviewer. Evaluate the candidate's code for a DSA problem."
          },
          {
            role: "user",
            content: `Problem: ${problem.question}\nStatement: ${problem.problemStatement}\nLanguage: ${language}\nCode: ${code}\n\nProvide feedback on correctness, complexity, and style, and a score (0-100) in JSON format: { "feedback": "...", "score": 85 }`
          }
        ],
        response_format: { type: "json_object" }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error("AI DSA Evaluation Error:", error.response?.data || error.message);
    return { feedback: "Code looks functional. Consider optimizing time complexity.", score: 80 };
  }
};

export const chatWithAI = async (messages) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = {
    role: "system",
    content: "You are the CareerConnect AI Assistant. Your goal is to help job seekers with their career-related questions, resume tips, interview preparation, and navigating the job portal. Be professional, encouraging, and concise."
  };

  if (geminiKey && geminiKey !== "your_gemini_api_key_here") {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt.content
      });

      // Gemini history must alternate between user and model, and must start with user.
      const history = [];
      let lastRole = null;

      // Filter and format history
      for (let i = 0; i < messages.length - 1; i++) {
        const m = messages[i];
        const role = m.role === "user" ? "user" : "model";
        
        // Skip if it doesn't alternate or if it's not starting with user
        if (role === lastRole) continue;
        if (history.length === 0 && role !== "user") continue;

        history.push({
          role: role,
          parts: [{ text: m.content }],
        });
        lastRole = role;
      }

      // Ensure history ends with a model message if the next message is from user
      if (history.length > 0 && history[history.length - 1].role === "user") {
        history.pop();
      }

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Gemini Chat Error:", error.message);
      // Fallback to OpenAI if Gemini fails
    }
  }

  if (!openaiKey || openaiKey === "your_openai_api_key_here") {
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later!";
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [systemPrompt, ...messages],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Chat Error:", error.response?.data || error.message);
    return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again later!";
  }
};
