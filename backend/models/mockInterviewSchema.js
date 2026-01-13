import mongoose from "mongoose";

const mockInterviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  interviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isPeerInterview: {
    type: Boolean,
    default: false,
  },
  category: {
    type: String,
    required: true,
  },
  interviewType: {
    type: String,
    enum: ["General", "DSA"],
    default: "General",
  },
  questions: [
    {
      question: String,
      problemStatement: String,
      constraints: String,
      inputFormat: String,
      outputFormat: String,
      sampleTestCases: String,
      testCases: [
        {
          input: String,
          expectedOutput: String,
          isHidden: { type: Boolean, default: false }
        }
      ],
      answer: String,
      code: String,
      language: String,
      feedback: String,
      score: Number,
    }
  ],
  overallScore: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Started", "Completed"],
    default: "Started",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const MockInterview = mongoose.model("MockInterview", mockInterviewSchema);
