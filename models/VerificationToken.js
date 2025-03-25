const mongoose = require("mongoose");

const VerificationTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 86400 }, // Token expires in 24 hours
});

module.exports = mongoose.model("VerificationToken", VerificationTokenSchema);
