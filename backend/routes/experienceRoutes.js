import express from "express";
import {
  postExperience,
  getAllExperiences,
  addCommentToExperience,
  getExperienceDetails,
} from "../controllers/experienceController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/post", isAuthenticated, postExperience);
router.get("/getall", isAuthenticated, getAllExperiences);
router.get("/:id", isAuthenticated, getExperienceDetails);
router.post("/comment/:id", isAuthenticated, addCommentToExperience);

export default router;
