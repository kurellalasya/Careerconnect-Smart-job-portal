import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import { Experience } from "../models/experienceSchema.js";
import ErrorHandler from "../middlewares/error.js";

export const postExperience = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employers are not allowed to post experiences.", 400)
    );
  }
  const { title, description, company } = req.body;
  if (!title || !description || !company) {
    return next(new ErrorHandler("Please provide all details.", 400));
  }
  const postedBy = req.user._id;
  const userName = req.user.name;
  const experience = await Experience.create({
    title,
    description,
    company,
    postedBy,
    userName,
  });
  res.status(200).json({
    success: true,
    message: "Experience Posted Successfully!",
    experience,
  });
});

export const getAllExperiences = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employers are not allowed to view experiences.", 400)
    );
  }
  const { q, page = 1, limit = 6 } = req.query;
  let query = {};
  if (q) {
    query = {
      $or: [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { userName: { $regex: q, $options: "i" } },
      ],
    };
  }
  const skip = (page - 1) * limit;
  const totalExperiences = await Experience.countDocuments(query);
  const experiences = await Experience.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));

  res.status(200).json({
    success: true,
    experiences,
    totalExperiences,
    totalPages: Math.ceil(totalExperiences / limit),
    currentPage: Number(page),
  });
});

export const addCommentToExperience = catchAsyncErrors(async (req, res, next) => {
  const { role } = req.user;
  if (role === "Employer") {
    return next(
      new ErrorHandler("Employers are not allowed to comment on experiences.", 400)
    );
  }
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment) {
    return next(new ErrorHandler("Comment text is required.", 400));
  }

  const experience = await Experience.findById(id);
  if (!experience) {
    return next(new ErrorHandler("Experience not found.", 404));
  }

  const newComment = {
    user: req.user._id,
    userName: req.user.name,
    comment,
  };

  experience.comments.push(newComment);
  await experience.save();

  res.status(200).json({
    success: true,
    message: "Comment added successfully!",
    experience,
  });
});

export const getExperienceDetails = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const experience = await Experience.findById(id);
  if (!experience) {
    return next(new ErrorHandler("Experience not found.", 404));
  }
  res.status(200).json({
    success: true,
    experience,
  });
});
