import express from "express";
import {
  deleteJob,
  getAllJobs,
  getMyJobs,
  getSingleJob,
  postJob,
  updateJob,
  saveJob,
  getSavedJobs,
  adminGetAllJobs,
  adminUpdateJobStatus,
  adminDeleteJob,
} from "../controllers/jobController.js";
import { recommendJobs } from "../controllers/recommendationsController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/getall", getAllJobs);
router.post("/save/:id", isAuthenticated, saveJob);
router.get("/saved", isAuthenticated, getSavedJobs);
router.get("/recommendations", recommendJobs);
router.post("/post", isAuthenticated, postJob);
router.get("/getmyjobs", isAuthenticated, getMyJobs);
router.put("/update/:id", isAuthenticated, updateJob);
router.delete("/delete/:id", isAuthenticated, deleteJob);
router.get("/:id", isAuthenticated, getSingleJob);

// ADMIN ROUTES
router.get("/admin/jobs", isAuthenticated, adminGetAllJobs);
router.put("/admin/job/status/:id", isAuthenticated, adminUpdateJobStatus);
router.delete("/admin/job/:id", isAuthenticated, adminDeleteJob);

export default router;
