import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Job } from "../models/jobSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { sendEmail } from "../utils/mailer.js";
import { savedJobTemplate, newJobNotificationTemplate } from "../utils/emailTemplates.js";

export const getAllJobs = catchAsyncErrors(async (req, res, next) => {
  // Support query params for searching and filtering
  const { q, category, country, city, company, minSalary, maxSalary, workMode, experienceLevel, companyType, techStack, page = 1, limit = 9 } = req.query;
  const filters = { expired: false };
  if (category) filters.category = category;
  if (country) filters.country = country;
  if (city) filters.city = city;
  if (company) filters.companyName = { $regex: company, $options: "i" };
  if (workMode) filters.workMode = workMode;
  if (experienceLevel) filters.experienceLevel = experienceLevel;
  if (companyType) filters.companyType = companyType;
  if (techStack) {
    const stackArray = techStack.split(",").map(s => s.trim());
    filters.techStack = { $all: stackArray };
  }

  // Salary filtering
  if (minSalary || maxSalary) {
    filters.$or = [
      { fixedSalary: { $gte: minSalary || 0, $lte: maxSalary || 999999999 } },
      {
        salaryFrom: { $lte: maxSalary || 999999999 },
        salaryTo: { $gte: minSalary || 0 }
      }
    ];
  }

  if (q) {
    const regex = new RegExp(q, "i");
    filters.$or = filters.$or || [];
    filters.$or.push({ title: regex }, { description: regex }, { companyName: regex });
  }

  const skip = (page - 1) * limit;
  const totalJobs = await Job.countDocuments(filters);
  const jobs = await Job.find(filters).sort({ jobPostedOn: -1 }).skip(skip).limit(Number(limit));

  res.status(200).json({
    success: true,
    jobs,
    totalJobs,
    totalPages: Math.ceil(totalJobs / limit),
    currentPage: Number(page),
  });
});

export const postJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const {
    title,
    description,
    category,
    country,
    city,
    location,
    companyName,
    fixedSalary,
    salaryFrom,
    salaryTo,
    jobType,
    workMode,
    experienceLevel,
    companyType,
    techStack,
    qualifications,
    responsibilities,
    benefits,
    companyWebsite,
    companyLogo,
    applicantLimit,
  } = req.body;

  if (
    !title || 
    !description || 
    !category || 
    !country || 
    !city || 
    !location || 
    !companyName ||
    !jobType ||
    !workMode ||
    !experienceLevel ||
    !companyType ||
    !qualifications ||
    !responsibilities
  ) {
    return next(new ErrorHandler("Please provide all required job details.", 400));
  }

  if ((!salaryFrom || !salaryTo) && !fixedSalary) {
    return next(
      new ErrorHandler(
        "Please either provide fixed salary or ranged salary.",
        400
      )
    );
  }

  if (salaryFrom && salaryTo && fixedSalary) {
    return next(
      new ErrorHandler("Cannot Enter Fixed and Ranged Salary together.", 400)
    );
  }
  const postedBy = req.user._id;
  const job = await Job.create({
    title,
    description,
    category,
    country,
    city,
    location,
    companyName,
    fixedSalary,
    salaryFrom,
    salaryTo,
    jobType,
    workMode,
    experienceLevel,
    companyType,
    techStack,
    qualifications,
    responsibilities,
    benefits,
    companyWebsite,
    companyLogo,
    postedBy,
    applicantLimit: applicantLimit || 0,
  });
  res.status(200).json({
    success: true,
    message: "Job Posted Successfully!",
    job,
  });

  // Notify all job seekers about the new job posting
  try {
    const jobSeekers = await User.find({ role: "Job Seeker" });
    for (const seeker of jobSeekers) {
      await sendEmail({
        to: seeker.email,
        subject: `New Job Alert: ${job.title} at ${job.companyName}`,
        html: newJobNotificationTemplate(seeker.name, job, job._id),
      });
    }
  } catch (err) {
    console.error("Failed to send new job notifications:", err.message);
  }
});

export const getMyJobs = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const myJobs = await Job.find({ postedBy: req.user._id });
  res.status(200).json({
    success: true,
    myJobs,
  });
});

export const updateJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  let job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  job = await Job.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    message: "Job Updated!",
  });
});

export const deleteJob = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Job Seeker") {
    return next(
      new ErrorHandler("Job Seeker not allowed to access this resource.", 400)
    );
  }
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) {
    return next(new ErrorHandler("OOPS! Job not found.", 404));
  }
  await job.deleteOne();
  res.status(200).json({
    success: true,
    message: "Job Deleted!",
  });
});

export const getSingleJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  try {
    const job = await Job.findById(id);
    if (!job) {
      return next(new ErrorHandler("Job not found.", 404));
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return next(new ErrorHandler(`Invalid ID / CastError`, 404));
  }
});

export const saveJob = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // job id
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) return next(new ErrorHandler("User not found", 404));
  const job = await Job.findById(id);
  if (!job) return next(new ErrorHandler("Job not found", 404));

  const idx = user.savedJobs.findIndex((j) => j.toString() === id.toString());
  let action = "saved";
  if (idx === -1) {
    user.savedJobs.push(id);
    action = "saved";
    // send email when job is saved
    try {
      await sendEmail({
        to: user.email,
        subject: `Job Saved: ${job.title} at ${job.companyName}`,
        html: savedJobTemplate(user.name, job, id),
      });
    } catch (mailErr) {
      console.error("Failed to send saved job email:", mailErr.message);
    }
  } else {
    user.savedJobs.splice(idx, 1);
    action = "removed";
  }
  await user.save({ validateBeforeSave: false });
  res.status(200).json({ success: true, message: `Job ${action}`, action, jobId: id });
});

export const getSavedJobs = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId).populate({ path: 'savedJobs', select: 'title companyName category city country description salaryFrom salaryTo fixedSalary' });
  if (!user) return next(new ErrorHandler("User not found", 404));
  res.status(200).json({ success: true, saved: user.savedJobs || [] });
});

// ADMIN CONTROLLERS

export const adminGetAllJobs = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role.toLowerCase() !== "admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  const jobs = await Job.find().sort({ jobPostedOn: -1 });
  res.status(200).json({ success: true, jobs });
});

export const adminUpdateJobStatus = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role.toLowerCase() !== "admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  const { id } = req.params;
  const { status } = req.body;
  const job = await Job.findByIdAndUpdate(id, { status }, { new: true });
  if (!job) return next(new ErrorHandler("Job not found", 404));
  res.status(200).json({ success: true, message: `Job status updated to ${status}`, job });
});

export const adminDeleteJob = catchAsyncErrors(async (req, res, next) => {
  if (req.user.role.toLowerCase() !== "admin") {
    return next(new ErrorHandler("Access denied. Admin only.", 403));
  }
  const { id } = req.params;
  const job = await Job.findById(id);
  if (!job) return next(new ErrorHandler("Job not found", 404));
  await job.deleteOne();
  res.status(200).json({ success: true, message: "Job deleted successfully" });
});
