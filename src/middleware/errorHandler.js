
exports.notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central error handler: every error leaves the API in the same JSON format.
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  // Malformed JSON body
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }
  // Mongoose validation (missing / invalid product fields)
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }
  // Wrong type, e.g. price: "abc"
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: [`invalid value for "${err.path}"`],
    });
  }
  // Duplicate key (unique index)
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "Duplicate value" });
  }

  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
};
