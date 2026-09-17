const express = require("express");
const Customer = require("../models/Customer");
const Account = require("../models/Account");

const router = express.Router();

// GET all customers
router.get("/", async (req, res) => {
  const customers = await Customer.find().sort({ createdAt: -1 });
  res.json(customers);
});

// GET one customer
router.get("/:id", async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

// CREATE customer
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, address, dob } = req.body;
    const customer = await Customer.create({ name, email, phone, address, dob });
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE customer
router.put("/:id", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE customer (only if no accounts)
router.delete("/:id", async (req, res) => {
  const accountCount = await Account.countDocuments({ customer: req.params.id });
  if (accountCount > 0) {
    return res.status(400).json({ error: "Cannot delete customer with existing accounts" });
  }
  const customer = await Customer.findByIdAndDelete(req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json({ message: "Customer deleted" });
});

module.exports = router;
