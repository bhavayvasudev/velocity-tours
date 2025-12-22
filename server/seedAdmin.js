require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Import bcrypt
const User = require('./models/User');

const createAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ Error: MONGO_URI is missing from .env file");
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to DB...");

    const adminExists = await User.findOne({ email: "admin@velocity.in" });
    if (adminExists) {
      console.log("⚠️ Admin already exists. (Delete it from DB if you want to recreate it)");
      process.exit();
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Password@123", salt);

    const user = await User.create({
      name: "Velocity Super Admin",
      email: "admin@velocity.in",
      password: hashedPassword, // ✅ Save the HASHED password
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