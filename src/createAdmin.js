// Usage: npm run create-admin
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

(async () => {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = (process.env.ADMIN_NAME || "Administrator").trim();

  if (!email || password.length < 6) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 6 characters) in .env first.");
    process.exit(1);
  }

  try {
    await connectDB();
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await User.findOne({ email });
    if (existing) {
      existing.role = "admin";
      existing.passwordHash = passwordHash;
      await existing.save();
      console.log(`User ${email} is now an admin (password updated from .env).`);
    } else {
      await User.create({ name, email, passwordHash, role: "admin" });
      console.log(`Admin account created: ${email}`);
    }
  } catch (err) {
    console.error("Could not create the admin:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
