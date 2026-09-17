const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account", required: true },
    type: {
      type: String,
      enum: ["deposit", "withdraw", "transfer-in", "transfer-out"],
      required: true,
    },
    amount: { type: Number, required: true, min: 0.01 },
    balanceAfter: { type: Number, required: true },
    relatedAccount: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null },
    description: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    merchant: { type: String, trim: true, default: "" },
    tags: { type: [String], default: [] },
    status: { type: String, enum: ["completed", "pending", "flagged"], default: "completed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
