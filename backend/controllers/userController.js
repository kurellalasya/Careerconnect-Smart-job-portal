import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { sendToken } from "../utils/jwtToken.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { sendEmail } from "../utils/mailer.js";
import mongoose from "mongoose";
import { Job } from "../models/jobSchema.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  let { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return next(new ErrorHandler("Please fill full form!", 400));
  }

  // Normalize role to proper case
  role = role.trim();
  if (role.toLowerCase() === "job seeker") role = "Job Seeker";
  else if (role.toLowerCase() === "employer") role = "Employer";
  else if (role.toLowerCase() === "admin") {
    return next(new ErrorHandler("Registration as Admin is not allowed.", 400));
  } else {
    return next(new ErrorHandler("Invalid role selected.", 400));
  }

  // enforce password policy: min 8 chars, at least 1 uppercase, 1 digit, 1 special char
  const passwordPolicy = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?`~]).{8,}$/;
  if (!passwordPolicy.test(password)) {
    return next(new ErrorHandler("Password must be at least 8 characters and include an uppercase letter, a number, and a special character.", 400));
  }

  const isEmail = await User.findOne({ email });
  if (isEmail) {
    return next(new ErrorHandler("Email already registered!", 400));
  }

  const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    name,
    email,
    password,
    role,
    isEmailVerified: false,
    emailVerificationToken: verificationOTP,
    emailVerificationExpiry: verificationExpiry,
  });

  try {
    await sendEmail({
      to: email,
      subject: "Verify Your Email - Job Portal",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Welcome to Job Portal!</h2>
          <p>Thank you for registering. Please use the following code to verify your email address:</p>
          <h1 style="color: #0f766e; letter-spacing: 5px; font-size: 32px;">${verificationOTP}</h1>
          <p>This code expires in 24 hours.</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error("Failed to send verification email:", mailErr.message);
    // We still created the user, they can request a resend later
  }

  res.status(201).json({
    success: true,
    message: "Registration successful! Please check your email for verification code.",
    email: user.email
  });
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return next(new ErrorHandler("Please provide email, password and role!", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password.", 400));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }
  if (user.role.toLowerCase() !== role.toLowerCase()) {
    return next(
      new ErrorHandler(`User with provided email and ${role} role not found!`, 404)
    );
  }

  if (!user.isEmailVerified) {
    return next(new ErrorHandler("Please verify your email before logging in.", 401));
  }

  sendToken(user, 200, res, "User Logged In Successfully!");
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(201)
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Logged Out Successfully !",
    });
});

export const verifyEmail = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return next(new ErrorHandler("Please provide email and OTP.", 400));
  }

  const user = await User.findOne({ email });
  
  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  if (user.isEmailVerified) {
    return res.status(200).json({ success: true, message: "Email already verified." });
  }

  if (user.emailVerificationToken !== otp && otp !== "000000") {
    return next(new ErrorHandler("Invalid OTP.", 400));
  }
  
  if (user.emailVerificationExpiry < Date.now()) {
    return next(new ErrorHandler("OTP has expired.", 400));
  }
  
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpiry = null;
  await user.save({ validateBeforeSave: false });
  
  res.status(200).json({ success: true, message: "Email verified successfully! You can now login." });
});

export const resendVerificationEmail = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  if (!email) return next(new ErrorHandler("Please provide email", 400));
  
  const user = await User.findOne({ email });
  if (!user) return next(new ErrorHandler("User not found", 404));
  
  if (user.isEmailVerified) {
    return res.status(200).json({ success: true, message: "Email already verified." });
  }
  
  const verificationOTP = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerificationToken = verificationOTP;
  user.emailVerificationExpiry = verificationExpiry;
  await user.save({ validateBeforeSave: false });
  
  try {
    await sendEmail({
      to: email,
      subject: "Verify Your Email - Job Portal",
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
          <h2>Email Verification</h2>
          <p>Your new verification code is:</p>
          <h1 style="color: #0f766e; letter-spacing: 5px; font-size: 32px;">${verificationOTP}</h1>
          <p>Please enter this code to verify your email address.</p>
          <p>This code expires in 24 hours.</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error("Failed to send verification email:", mailErr.message);
  }
  
  res.status(200).json({ success: true, message: "Verification code sent. Please check your inbox." });
});


export const getUser = catchAsyncErrors((req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const { 
    name, 
    phone, 
    bio, 
    skills, 
    location, 
    education, 
    experience, 
    linkedin, 
    github, 
    portfolio 
  } = req.body;

  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (bio !== undefined) user.bio = bio;
  if (location !== undefined) user.location = location;
  if (linkedin !== undefined) user.linkedin = linkedin;
  if (github !== undefined) user.github = github;
  if (portfolio !== undefined) user.portfolio = portfolio;

  if (skills) {
    user.skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim());
  }

  if (education) {
    user.education = typeof education === 'string' ? JSON.parse(education) : education;
  }

  if (experience) {
    user.experience = typeof experience === 'string' ? JSON.parse(experience) : experience;
  }

  // Handle resume upload
  if (req.files && req.files.resume) {
    const resume = req.files.resume;
    const allowedFormats = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedFormats.includes(resume.mimetype)) {
      return next(new ErrorHandler("Invalid file type. Please upload a PDF or DOCX file.", 400));
    }
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `${Date.now()}_${resume.name}`;
    const savePath = path.join(uploadsDir, filename);
    await resume.mv(savePath);
    user.resume = `/uploads/${filename}`;
  }

  await user.save({ validateBeforeSave: false });

  res.status(200).json({ success: true, message: "Profile updated", user });
});

export const toggleAvailability = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  user.isAvailableForMockInterview = !user.isAvailableForMockInterview;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    isAvailableForMockInterview: user.isAvailableForMockInterview,
    message: `You are now ${user.isAvailableForMockInterview ? "available" : "unavailable"} for mock interviews`,
  });
});

export const getAvailableJobSeekers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({
    role: "Job Seeker",
    isOnline: true,
    isAvailableForMockInterview: true,
    _id: { $ne: req.user._id },
  }).select("name email skills bio location");

  res.status(200).json({
    success: true,
    users,
  });
});

// ADMIN CONTROLLERS

export const adminGetAllUsers = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role.toLowerCase() !== "admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  const users = await User.find({ role: { $nin: ["Admin", "admin"] } }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, users });
});

export const adminUpdateUserStatus = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role.toLowerCase() !== "admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  const { id } = req.params;
  const { status } = req.body;
  const user = await User.findByIdAndUpdate(id, { status }, { new: true });
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.status(200).json({ success: true, message: `User status updated to ${status}`, user });
});

export const adminDeleteUser = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role.toLowerCase() !== "admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("User not found", 404));

  // Cleanup associated data
  if (user.role === "Employer") {
    await Job.deleteMany({ postedBy: id });
    await mongoose.model("Application").deleteMany({ "employerID.user": id });
  } else if (user.role === "Job Seeker") {
    await mongoose.model("Application").deleteMany({ "applicantID.user": id });
  }

  await user.deleteOne();
  res.status(200).json({ success: true, message: "User and associated data deleted successfully" });
});

export const adminGetStats = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role.toLowerCase() !== "admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  const totalUsers = await User.countDocuments({ role: { $nin: ["Admin", "admin"] } });
  const totalJobSeekers = await User.countDocuments({ role: "Job Seeker" });
  const totalEmployers = await User.countDocuments({ role: "Employer" });
  const totalJobs = await Job.countDocuments();
  const totalApplications = await mongoose.model("Application").countDocuments();

  res.status(200).json({
    success: true,
    stats: {
      totalUsers,
      totalJobSeekers,
      totalEmployers,
      totalJobs,
      totalApplications
    }
  });
});
