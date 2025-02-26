const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Logs error in console

  // Set status code
  const statusCode = err.status || 500;

  // Custom handling for JWT authentication errors
  if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token. Please log in again." });
  }

  if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
  }

  // Custom handling for validation errors (e.g., Mongoose validation)
  if (err.name === "ValidationError") {
      return res.status(400).json({ success: false, message: err.message });
  }

  res.status(statusCode).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Something went wrong!" : err.message,
  });
};

module.exports = errorHandler;
