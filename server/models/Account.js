const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    accountType: { type: String, enum: ["Savings", "Current"], default: "Savings" },
    balance: { type: Number, required: true, default: 0, min: 0 },
    status: { type: String, enum: ["active", "closed"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Account", accountSchema);
