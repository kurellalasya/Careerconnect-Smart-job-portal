import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a title."],
    minLength: [3, "Title must contain at least 3 Characters!"],
    maxLength: [30, "Title cannot exceed 30 Characters!"],
  },
  description: {
    type: String,
    required: [true, "Please provide decription."],
    minLength: [30, "Description must contain at least 30 Characters!"],
    maxLength: [500, "Description cannot exceed 500 Characters!"],
  },
  category: {
    type: String,
    required: [true, "Please provide a category."],
  },
  country: {
    type: String,
    required: [true, "Please provide a country name."],
  },
  city: {
    type: String,
    required: [true, "Please provide a city name."],
  },
  location: {
    type: String,
    required: [true, "Please provide location."],
    minLength: [10, "Location must contian at least 10 characters!"],
  },
  jobType: {
    type: String,
    required: [true, "Please provide job type."],
    enum: ["Full-time", "Part-time", "Contract", "Remote", "Internship"],
  },
  workMode: {
    type: String,
    required: [true, "Please provide work mode."],
    enum: ["Remote", "Hybrid", "Onsite"],
  },
  experienceLevel: {
    type: String,
    required: [true, "Please provide experience level."],
    enum: ["Entry Level", "Mid Level", "Senior Level", "Expert"],
  },
  companyType: {
    type: String,
    required: [true, "Please provide company type."],
    enum: ["Startup", "MNC", "Other"],
  },
  techStack: {
    type: [String],
    default: [],
  },
  qualifications: {
    type: String,
    required: [true, "Please provide qualifications."],
  },
  responsibilities: {
    type: String,
    required: [true, "Please provide responsibilities."],
  },
  benefits: {
    type: String,
  },
  companyWebsite: {
    type: String,
  },
  companyLogo: {
    type: String,
  },
  companyName: {
    type: String,
    required: [true, "Please provide company name."],
    minLength: [2, "Company name must contain at least 2 characters!"],
    maxLength: [100, "Company name cannot exceed 100 characters!"],
  },
  fixedSalary: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  salaryFrom: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  salaryTo: {
    type: Number,
    minLength: [4, "Salary must contain at least 4 digits"],
    maxLength: [9, "Salary cannot exceed 9 digits"],
  },
  expired: {
    type: Boolean,
    default: false,
  },
  jobPostedOn: {
    type: Date,
    default: Date.now,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  applicantLimit: {
    type: Number,
    default: 0, // 0 means no limit
  },
  applicantsCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
});

export const Job = mongoose.model("Job", jobSchema);
