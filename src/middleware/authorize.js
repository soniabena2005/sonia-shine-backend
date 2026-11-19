// Role check. Must run AFTER authenticate (it needs req.user).
// Usage: router.post("/", authenticate, authorize("admin"), handler)
module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ success: false, message: `Forbidden: requires role ${roles.join(" or ")}` });
  }
  next();
};
