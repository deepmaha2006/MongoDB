const express = require("express");
const mongoose = require("mongoose");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

const router = express.Router();

const TYPE_CATEGORY_LABEL = {
  deposit: "Deposit",
  withdraw: "Withdrawal",
  "transfer-in": "Transfer In",
  "transfer-out": "Transfer Out",
};

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === "string") return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
}

// Fills in category/merchant for legacy documents saved before these fields existed.
function withDisplayFallbacks(txn) {
  const obj = txn.toObject ? txn.toObject() : txn;
  if (!obj.category) obj.category = TYPE_CATEGORY_LABEL[obj.type] || "Other";
  if (!obj.merchant) obj.merchant = obj.description || obj.account?.customer?.name || "—";
  return obj;
}

// GET all transactions (optionally filter by account)
router.get("/", async (req, res) => {
  const filter = {};
  if (req.query.account) filter.account = req.query.account;

  const transactions = await Transaction.find(filter)
    .populate({ path: "account", select: "accountNumber customer", populate: { path: "customer", select: "name" } })
    .populate("relatedAccount", "accountNumber")
    .sort({ createdAt: -1 })
    .limit(500);
  res.json(transactions.map(withDisplayFallbacks));
});

// PATCH status/category/merchant/tags (back-office review actions)
router.patch("/:id", async (req, res) => {
  try {
    const update = {};
    if (req.body.status !== undefined) update.status = req.body.status;
    if (req.body.category !== undefined) update.category = req.body.category;
    if (req.body.merchant !== undefined) update.merchant = req.body.merchant;
    if (req.body.tags !== undefined) update.tags = normalizeTags(req.body.tags);

    const txn = await Transaction.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate({ path: "account", select: "accountNumber customer", populate: { path: "customer", select: "name" } });

    if (!txn) return res.status(404).json({ error: "Transaction not found" });
    res.json(withDisplayFallbacks(txn));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DEPOSIT
router.post("/deposit", async (req, res) => {
  try {
    const { accountId, amount, description, category, merchant, tags } = req.body;
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });
    if (account.status !== "active") return res.status(400).json({ error: "Account is not active" });

    account.balance += amt;
    await account.save();

    const txn = await Transaction.create({
      account: account._id,
      type: "deposit",
      amount: amt,
      balanceAfter: account.balance,
      description: description || "Deposit",
      category: category || TYPE_CATEGORY_LABEL.deposit,
      merchant: merchant || "",
      tags: normalizeTags(tags),
    });

    res.status(201).json({ account, transaction: txn });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// WITHDRAW
router.post("/withdraw", async (req, res) => {
  try {
    const { accountId, amount, description, category, merchant, tags } = req.body;
    const amt = Number(amount);
    if (!amt || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });
    if (account.status !== "active") return res.status(400).json({ error: "Account is not active" });
    if (account.balance < amt) return res.status(400).json({ error: "Insufficient balance" });

    account.balance -= amt;
    await account.save();

    const txn = await Transaction.create({
      account: account._id,
      type: "withdraw",
      amount: amt,
      balanceAfter: account.balance,
      description: description || "Withdrawal",
      category: category || TYPE_CATEGORY_LABEL.withdraw,
      merchant: merchant || "",
      tags: normalizeTags(tags),
    });

    res.status(201).json({ account, transaction: txn });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// TRANSFER
router.post("/transfer", async (req, res) => {
  const { fromAccountId, toAccountId, amount, description, category, merchant, tags } = req.body;
  const amt = Number(amount);

  if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
    return res.status(400).json({ error: "Invalid source/destination accounts" });
  }
  if (!amt || amt <= 0) return res.status(400).json({ error: "Invalid amount" });

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const fromAccount = await Account.findById(fromAccountId).session(session);
      const toAccount = await Account.findById(toAccountId).session(session);

      if (!fromAccount || !toAccount) throw new Error("Account not found");
      if (fromAccount.status !== "active" || toAccount.status !== "active") {
        throw new Error("Both accounts must be active");
      }
      if (fromAccount.balance < amt) throw new Error("Insufficient balance");

      fromAccount.balance -= amt;
      toAccount.balance += amt;
      await fromAccount.save({ session });
      await toAccount.save({ session });

      const normalizedTags = normalizeTags(tags);

      const [outTxn, inTxn] = await Transaction.create(
        [
          {
            account: fromAccount._id,
            type: "transfer-out",
            amount: amt,
            balanceAfter: fromAccount.balance,
            relatedAccount: toAccount._id,
            description: description || `Transfer to ${toAccount.accountNumber}`,
            category: category || TYPE_CATEGORY_LABEL["transfer-out"],
            merchant: merchant || "",
            tags: normalizedTags,
          },
          {
            account: toAccount._id,
            type: "transfer-in",
            amount: amt,
            balanceAfter: toAccount.balance,
            relatedAccount: fromAccount._id,
            description: description || `Transfer from ${fromAccount.accountNumber}`,
            category: category || TYPE_CATEGORY_LABEL["transfer-in"],
            merchant: merchant || "",
            tags: normalizedTags,
          },
        ],
        { session, ordered: true }
      );

      result = { fromAccount, toAccount, outTxn, inTxn };
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
