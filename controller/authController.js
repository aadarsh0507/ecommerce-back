const nodemailer = require("nodemailer");
require("dotenv").config();
const User = require("../models/user");
const OTPModel = require("../models/OTPModel"); // Create OTP Schema
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// **Generate and Send OTP**
const sendOTP = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
    const expiresAt = Date.now() + 10 * 60 * 1000; // OTP expires in 10 mins

    // Store OTP in database (hashed for security)
    const hashedOTP = await bcrypt.hash(otp.toString(), 10);
    await OTPModel.findOneAndUpdate(
        { email },
        { otp: hashedOTP, expiresAt },
        { upsert: true, new: true }
    );

    // Send OTP via email
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP Code",
        html: `<p>Your OTP for verification is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });

    return true;
};

// **Signup User & Send OTP**
exports.signup = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;
        if (!name || !phone || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, phone, email: email.toLowerCase(), password: hashedPassword, isVerified: false });
        await newUser.save();

        // Send OTP
        await sendOTP(newUser.email);

        res.status(201).json({ success: true, message: "Registration successful. Check your email for OTP." });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// **Verify OTP & Activate Account**
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: "Email and OTP are required." });
        }

        const otpRecord = await OTPModel.findOne({ email });
        if (!otpRecord) {
            return res.status(400).json({ success: false, message: "OTP expired or invalid." });
        }

        const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect OTP." });
        }

        // OTP is correct, verify user
        await User.findOneAndUpdate({ email }, { isVerified: true });
        await OTPModel.deleteOne({ email });

        res.status(200).json({ success: true, message: "Account verified successfully!" });
    } catch (error) {
        console.error("❌ OTP Verification Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// **Resend OTP**
exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required." });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ success: false, message: "User not found." });
        if (user.isVerified) return res.status(400).json({ success: false, message: "User already verified." });

        await sendOTP(user.email);
        res.status(200).json({ success: true, message: "New OTP sent successfully!" });
    } catch (error) {
        console.error("❌ Resend OTP Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// **User Login (Only Verified Users)**
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "User not found." });
        if (!user.isVerified) {
            return res.status(401).json({ message: "Please verify your email before logging in." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

        res.json({ success: true, message: "Login successful!" });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server error, please try again." });
    }
};
