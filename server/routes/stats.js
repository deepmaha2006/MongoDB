const express = require("express");
const Customer = require("../models/Customer");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

const router = express.Router();

router.get("/", async (req, res) => {
  const [customerCount, accountCount, transactionCount, balanceAgg] = await Promise.all([
    Customer.countDocuments(),
    Account.countDocuments(),
    Transaction.countDocuments(),
    Account.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
  ]);

  res.json({
    customerCount,
    accountCount,
    transactionCount,
    totalBalance: balanceAgg[0]?.total || 0,
  });
});

module.exports = router;
