const rateLimit = require("express-rate-limit");

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const make = (limit, message) =>
  rateLimit({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: "draft-7", // sends RateLimit-* headers (useful for screenshots)
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message }),
  });

// General limiter: applied to every /api route (default 100 requests / 15 min / IP)
exports.apiLimiter = make(
  Number(process.env.API_RATE_LIMIT_MAX) || 100,
  "Too many requests from this IP, please try again after 15 minutes."
);

// Stricter limiter for login: default 5 requests / 15 min / IP (brute-force protection)
exports.loginLimiter = make(
  Number(process.env.LOGIN_RATE_LIMIT_MAX) || 5,
  "Too many login attempts from this IP, please try again after 15 minutes."
);
