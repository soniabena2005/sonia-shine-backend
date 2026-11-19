const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    const errors = [];
    if (typeof name !== "string" || name.trim().length < 2) {
      errors.push("name is required (at least 2 characters)");
    }
    if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
      errors.push("a valid email is required");
    }
    if (typeof password !== "string" || password.length < 6) {
      errors.push("password is required (at least 6 characters)");
    }
    if (errors.length) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    const normalizedEmail = email.trim().toLowerCase();
    // NOTE: any "role" sent in the body is ignored on purpose: new accounts are always "user".

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await User.create({ name: name.trim(), email: normalizedEmail, passwordHash });
    } catch (err) {
      // Two simultaneous requests can pass the check above; the unique index catches the second one.
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "An account with this email already exists" });
      }
      throw err;
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors: ["email and password are required"] });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    const ok = user && (await bcrypt.compare(password, user.passwordHash));

    // Same message for "unknown email" and "wrong password": do not reveal which accounts exist.
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const expiresIn = process.env.JWT_EXPIRES_IN || "1h";
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { token, tokenType: "Bearer", expiresIn, user },
    });
  } catch (err) {
    next(err);
  }
};
