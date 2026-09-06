const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // role drives what the frontend/backend allow the user to do -- mirrors the
    // three actors described in the synopsis (owners, verifiers, regulatory authorities)
    role: {
      type: String,
      enum: ["owner", "verifier", "regulator"],
      default: "owner",
    },
    walletAddress: { type: String, default: null }, // linked after MetaMask connect
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
