// 1. Path fixed: Just look in the current folder for .env
require('dotenv').config(); 

const mongoose = require('mongoose');

// 2. Path fixed: Look for models folder in the current directory
const User = require('./models/User'); 

const createAdmin = async () => {
  try {
    // Check if Mongo URI is loaded
    if (!process.env.MONGO_URI) {
      console.error("❌ Error: MONGO_URI is missing from .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB...");

    // Check if admin exists
    const adminExists = await User.findOne({ email: "admin@velocity.in" });
    if (adminExists) {
      console.log("⚠️ Admin already exists");
      process.exit();
    }

    // Create Admin
    const user = await User.create({
      name: "Velocity Super Admin",
      email: "admin@velocity.in",
      password: "Password@123", // You can change this later
      role: "admin"
    });

    console.log(`✅ Admin Created Successfully: ${user.email}`);
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

createAdmin();