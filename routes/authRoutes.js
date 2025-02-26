const express = require("express");
const router = express.Router();
const authController = require("../controller/authController");

// Authentication Routes
router.post("/signup", authController.signup);
router.post("/login", authController.loginUser);
router.get("/activate/:token", authController.activateAccount); // ✅ Activation route added
router.get("/check-verification", authController.checkVerificationStatus);
router.post("/resend-verification", authController.resendVerificationEmail);

module.exports = router;
