const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const razorpayRoutes = require("./routes/razorpayRoutes");
const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./db/config");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Connect to MongoDB
connectDB();

// ✅ CORS Configuration (Now Fully Fixed)
const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:3000",  // Default frontend
    "http://192.168.101.45:50510" // Add frontend URL dynamically
];

const corsOptions = {
    origin: '*',  
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true
};

// ✅ CORS Middleware (MUST be before routes)
app.use(cors(corsOptions));

// ✅ Handle Preflight (OPTIONS) Requests
app.options("*", cors(corsOptions));

// ✅ Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ✅ Logger for Debugging (Use only in development)
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// ✅ Routes (AFTER CORS)
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
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Handle unhandled errors properly
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    server.close(() => process.exit(1));
});
