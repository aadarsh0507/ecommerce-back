const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();

// **Reusable Email Sending Function**
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS, // Use App Password if 2FA is enabled
            },
        });

        const mailOptions = {
            from: `"E-commerce App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully to", to);
    } catch (error) {
        console.error("❌ Error sending email:", error);
        throw new Error("Could not send email. Please try again later.");
    }
};

// **Send Activation Email**
const sendActivationEmail = async (user) => {
    const activationUrl = `${process.env.FRONTEND_URL}/activate/${user.verificationToken}`;
    const emailContent = `
        <p>Hello ${user.name},</p>
        <p>Click the link below to activate your account:</p>
        <p><a href="${activationUrl}" target="_blank">Activate Account</a></p>
        <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail(user.email, "Activate Your Account", emailContent);
};

// **Signup Route**
exports.signup = async (req, res) => {
    try {
        const { name, phone, email, password } = req.body;

        if (!name || !phone || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already registered. Please log in." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = crypto.randomBytes(32).toString("hex");

        const newUser = new User({
            name,
            phone,
            email: email.toLowerCase(),
            password: hashedPassword,
            isVerified: false,
            verificationToken,
        });

        await newUser.save();
        console.log("✅ User saved:", newUser.email);

        // Send activation email
        await sendActivationEmail(newUser);

        res.status(201).json({
            success: true,
            message: "User registered successfully. Check your email to activate your account.",
        });
    } catch (error) {
        console.error("❌ Signup Error:", error);
        res.status(500).json({ success: false, message: "Server error, please try again." });
    }
};

// **Activate Account**
exports.activateAccount = async (req, res) => {
    try {
        const { token } = req.params;
        console.log("🔍 Activation request for token:", token);

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            console.log("❌ Invalid activation token");
            return res.status(400).json({ success: false, message: "Invalid or expired activation token." });
        }

        user.isVerified = true;
        user.verificationToken = null; // Remove token after activation
        await user.save();

        console.log("✅ Account activated:", user.email);

        return res.redirect(`${process.env.FRONTEND_URL}/login?activated=true`);
    } catch (error) {
        console.error("❌ Activation Error:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

// **Check Verification Status**
exports.checkVerificationStatus = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: "Email is required." });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "User not found." });

        res.status(200).json({ isVerified: user.isVerified });
    } catch (error) {
        console.error("❌ Verification Status Check Error:", error);
        res.status(500).json({ message: "Server error, please try again." });
    }
};

// **Resend Activation Email**
exports.resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required." });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "User not found." });
        if (user.isVerified) return res.status(400).json({ message: "Email already verified." });

        user.verificationToken = crypto.randomBytes(32).toString("hex");
        await user.save();

        await sendActivationEmail(user);
        res.status(200).json({ success: true, message: "Activation email sent again. Check your inbox." });
    } catch (error) {
        console.error("❌ Resend Activation Email Error:", error);
        res.status(500).json({ message: "Server error, please try again." });
    }
};

// **User Login**
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "User not found." });
        if (!user.isVerified) {
            return res.status(401).json({ message: "Please activate your account before logging in." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

        res.json({ success: true, message: "Login successful!" });
    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server error, please try again." });
    }
};
