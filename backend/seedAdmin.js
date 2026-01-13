import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { User } from "./models/userSchema.js";
import { config } from "dotenv";

config({ path: "backend/.env" });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.DB_URL, {
      dbName: "Job_Portal",
    });
    console.log("Connected to database");

    const adminEmail = "admin@gmail.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 10);

    await User.create({
      name: "Admin",
      email: adminEmail,
      phone: "9999999999",
      password: "Admin@123", // Schema will hash it due to pre-save hook
      role: "Admin",
      isEmailVerified: true,
    });

    console.log("Admin created successfully");
    console.log("Email: admin@gmail.com");
    console.log("Password: Admin@123");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
