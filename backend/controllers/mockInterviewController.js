import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { MockInterview } from "../models/mockInterviewSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { generateMockQuestions, evaluateMockAnswer, generateDSAProblem, evaluateDSACode } from "../services/aiService.js";
import axios from "axios";

export const startMockInterview = catchAsyncErrors(async (req, res, next) => {
  const { category, interviewType } = req.body;
  if (!category) return next(new ErrorHandler("Category is required", 400));

  let questions = [];
  if (interviewType === "DSA") {
    // Generate 3 random DSA problems
    for (let i = 0; i < 3; i++) {
      const problem = await generateDSAProblem(category);
      questions.push(problem);
    }
  } else {
    const generatedQuestions = await generateMockQuestions(category);
    questions = generatedQuestions.map(q => ({ question: q }));
  }
  
  const mockInterview = await MockInterview.create({
    user: req.user._id,
    category,
    interviewType: interviewType || "General",
    questions,
  });

  res.status(200).json({
    success: true,
    mockInterview,
  });
});

export const submitMockAnswer = catchAsyncErrors(async (req, res, next) => {
  const { interviewId, questionId, answer, code, language } = req.body;
  const interview = await MockInterview.findById(interviewId);
  if (!interview) return next(new ErrorHandler("Interview not found", 404));

  const questionObj = interview.questions.id(questionId);
  if (!questionObj) return next(new ErrorHandler("Question not found", 404));

  let evaluation;
  if (interview.interviewType === "DSA") {
    // Run against test cases if they exist
    let testCaseScore = 0;
    let testResults = [];
    
    if (questionObj.testCases && questionObj.testCases.length > 0) {
      const langMapping = {
        javascript: { language: "javascript", version: "18.15.0" },
        python: { language: "python", version: "3.10.0" },
        cpp: { language: "cpp", version: "10.2.0" },
        java: { language: "java", version: "15.0.2" },
      };
      const selectedLang = langMapping[language] || langMapping.javascript;

      for (const tc of questionObj.testCases) {
        try {
          const { data } = await axios.post("https://emkc.org/api/v2/piston/execute", {
            language: selectedLang.language,
            version: selectedLang.version,
            files: [{ content: code }],
            stdin: tc.input,
          });
          const actualOutput = data.run.output.trim();
          const passed = actualOutput === tc.expectedOutput.trim();
          if (passed) testCaseScore++;
          testResults.push({ passed, isHidden: tc.isHidden });
        } catch (err) {
          testResults.push({ passed: false, isHidden: tc.isHidden, error: "Execution failed" });
        }
      }
      testCaseScore = Math.round((testCaseScore / questionObj.testCases.length) * 100);
    }

    evaluation = await evaluateDSACode(questionObj, code, language);
    
    // Combine AI score with test case score
    if (questionObj.testCases && questionObj.testCases.length > 0) {
      evaluation.score = Math.round((evaluation.score * 0.4) + (testCaseScore * 0.6));
      evaluation.feedback = `Test Cases: ${testResults.filter(r => r.passed).length}/${testResults.length} passed.\n\n${evaluation.feedback}`;
    }

    questionObj.code = code;
    questionObj.language = language;
  } else {
    evaluation = await evaluateMockAnswer(questionObj.question, answer);
    questionObj.answer = answer;
  }
  
  questionObj.feedback = evaluation.feedback;
  questionObj.score = evaluation.score;

  await interview.save();

  res.status(200).json({
    success: true,
    evaluation,
  });
});

export const getMyMockInterviews = catchAsyncErrors(async (req, res, next) => {
  const interviews = await MockInterview.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    interviews,
  });
});

export const getMockInterviewDetails = catchAsyncErrors(async (req, res, next) => {
  const interview = await MockInterview.findById(req.params.id);
  if (!interview) return next(new ErrorHandler("Interview not found", 404));
  res.status(200).json({
    success: true,
    interview,
  });
});

export const finishMockInterview = catchAsyncErrors(async (req, res, next) => {
  const { interviewId } = req.body;

  const interview = await MockInterview.findById(interviewId);
  if (!interview) return next(new ErrorHandler("Interview not found", 404));

  interview.status = "Completed";

  const totalScore = interview.questions.reduce(
    (acc, q) => acc + (q.score || 0),
    0
  );
  interview.overallScore = Math.round(totalScore / interview.questions.length);

  await interview.save();

  res.status(200).json({
    success: true,
    message: "Interview finished successfully",
  });
});

export const startPeerInterview = catchAsyncErrors(async (req, res, next) => {
  const { category, interviewType, interviewerId } = req.body;
  if (!category || !interviewerId) {
    return next(new ErrorHandler("Category and Interviewer ID are required", 400));
  }

  let questions = [];
  if (interviewType === "DSA") {
    for (let i = 0; i < 3; i++) {
      const problem = await generateDSAProblem(category);
      questions.push(problem);
    }
  } else {
    const generatedQuestions = await generateMockQuestions(category);
    questions = generatedQuestions.map(q => ({ question: q }));
  }

  const mockInterview = await MockInterview.create({
    user: req.user._id,
    interviewer: interviewerId,
    isPeerInterview: true,
    category,
    interviewType: interviewType || "General",
    questions,
  });

  res.status(200).json({
    success: true,
    mockInterview,
  });
});
