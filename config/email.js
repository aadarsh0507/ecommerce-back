const nodemailer = require("nodemailer");
require("dotenv").config();

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

module.exports = sendEmail;
