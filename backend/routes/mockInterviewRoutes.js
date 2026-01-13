import express from "express";
import {
  startMockInterview,
  submitMockAnswer,
  getMyMockInterviews,
  getMockInterviewDetails,
  finishMockInterview,
  startPeerInterview,
} from "../controllers/mockInterviewController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/start", isAuthenticated, startMockInterview);
router.post("/start-peer", isAuthenticated, startPeerInterview);
router.post("/submit", isAuthenticated, submitMockAnswer);
router.post("/finish", isAuthenticated, finishMockInterview);
router.get("/my", isAuthenticated, getMyMockInterviews);
router.get("/:id", isAuthenticated, getMockInterviewDetails);

export default router;
