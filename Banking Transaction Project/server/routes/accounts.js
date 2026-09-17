const express = require("express");
const Account = require("../models/Account");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");

const router = express.Router();

function generateAccountNumber() {
  const rand = Math.floor(1000000000 + Math.random() * 8999999999);
  return `BT${rand}`;
}

// GET all accounts
router.get("/", async (req, res) => {
  const accounts = await Account.find().populate("customer", "name email phone").sort({ createdAt: -1 });
  res.json(accounts);
});

// GET one account
router.get("/:id", async (req, res) => {
  const account = await Account.findById(req.params.id).populate("customer", "name email phone");
  if (!account) return res.status(404).json({ error: "Account not found" });
  res.json(account);
});

// CREATE account
router.post("/", async (req, res) => {
  try {
    const { customer, accountType, openingBalance } = req.body;
    const customerDoc = await Customer.findById(customer);
    if (!customerDoc) return res.status(400).json({ error: "Customer not found" });

    let accountNumber;
    let exists = true;
    while (exists) {
      accountNumber = generateAccountNumber();
      exists = await Account.exists({ accountNumber });
    }

    const account = await Account.create({
      accountNumber,
      customer,
      accountType: accountType || "Savings",
      balance: Number(openingBalance) || 0,
    });

    if (account.balance > 0) {
      await Transaction.create({
        account: account._id,
        type: "deposit",
        amount: account.balance,
        balanceAfter: account.balance,
        description: "Opening balance",
      });
    }

    const populated = await account.populate("customer", "name email phone");
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// UPDATE account (type/status only)
router.put("/:id", async (req, res) => {
  try {
    const { accountType, status } = req.body;
    const account = await Account.findByIdAndUpdate(
      req.params.id,
      { accountType, status },
      { new: true, runValidators: true }
    ).populate("customer", "name email phone");
    if (!account) return res.status(404).json({ error: "Account not found" });
    res.json(account);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE account (only if balance is 0)
router.delete("/:id", async (req, res) => {
  const account = await Account.findById(req.params.id);
  if (!account) return res.status(404).json({ error: "Account not found" });
  if (account.balance > 0) {
    return res.status(400).json({ error: "Cannot delete account with non-zero balance" });
  }
  await Transaction.deleteMany({ account: account._id });
  await account.deleteOne();
  res.json({ message: "Account deleted" });
});

module.exports = router;
