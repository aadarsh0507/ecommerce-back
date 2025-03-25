const express = require("express");
const router = express.Router();
const { 
    signup, 
    verifyOTP, 
    resendOTP, 
    loginUser 
} = require("../controller/authController"); 

// Define authentication routes
router.post("/signup", signup); // Register & send OTP
router.post("/verify-otp", verifyOTP); // Verify OTP
router.post("/resend-otp", resendOTP); // Resend OTP
router.post("/login", loginUser); // Login after verification

module.exports = router;
