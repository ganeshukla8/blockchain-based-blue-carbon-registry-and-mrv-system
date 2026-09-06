const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Issuance", "Transfer", "Retirement"], required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", default: null },
    from: { type: String, default: null },
    to: { type: String, default: null },
    amount: { type: Number, required: true },
    txHash: { type: String, required: true }, // on-chain tx hash
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
