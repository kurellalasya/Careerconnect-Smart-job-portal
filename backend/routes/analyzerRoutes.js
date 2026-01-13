import express from "express";
import { analyzeResume } from "../controllers/analyzerController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Job seeker should be authenticated to use analyzer
router.post("/resume", isAuthenticated, analyzeResume);

export default router;
