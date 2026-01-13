import express from "express";
import { 
  register, 
  login, 
  logout, 
  getUser, 
  updateProfile, 
  verifyEmail, 
  resendVerificationEmail,
  toggleAvailability,
  getAvailableJobSeekers,
  adminGetAllUsers,
  adminUpdateUserStatus,
  adminDeleteUser,
  adminGetStats
} from "../controllers/userController.js";
import { chat } from "../controllers/chatController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", isAuthenticated, logout);
router.get("/getuser", isAuthenticated, getUser);
router.put("/update", isAuthenticated, updateProfile);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);
router.post("/chat", isAuthenticated, chat);
router.put("/availability", isAuthenticated, toggleAvailability);
router.get("/available-job-seekers", isAuthenticated, getAvailableJobSeekers);

// ADMIN ROUTES
router.get("/admin/users", isAuthenticated, adminGetAllUsers);
router.put("/admin/user/status/:id", isAuthenticated, adminUpdateUserStatus);
router.delete("/admin/user/:id", isAuthenticated, adminDeleteUser);
router.get("/admin/stats", isAuthenticated, adminGetStats);

export default router;
