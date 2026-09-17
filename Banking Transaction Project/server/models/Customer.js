const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
    dob: { type: Date },
    status: { type: String, enum: ["active", "blocked"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);
