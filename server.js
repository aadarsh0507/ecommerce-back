const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./db/config");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Connect to MongoDB
connectDB();

// ✅ CORS Configuration - Allows all origins (Change for production)
app.use(cors({
  origin: "*", // Replace with your frontend URL in production
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));

// ✅ Middleware
app.use(express.json());

// ✅ Logger for Debugging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path} - ${JSON.stringify(req.body)}`);
  next();
});

// ✅ Handle Preflight (OPTIONS) Requests
app.options("*", (req, res) => {
  res.sendStatus(204); // No Content
});

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/razorpay", razorpayRoutes);

// ✅ Test API
app.get("/", (req, res) => {
  res.send("Welcome to the E-commerce API");
});

// ✅ Handle 404 Not Found
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ✅ Global Error Handling Middleware
app.use(errorHandler);

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
