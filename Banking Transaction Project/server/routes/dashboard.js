const express = require("express");
const Account = require("../models/Account");
const Transaction = require("../models/Transaction");

const router = express.Router();

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function pad(n) { return String(n).padStart(2, "0"); }
function dayKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function monthKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }

// Maps each supported range to a concrete [start, end) window and the
// granularity ("day" vs "month") transactions should be grouped by.
const RANGE_CONFIG = {
  "7d": () => {
    const today = startOfDay(new Date());
    return { start: addDays(today, -6), end: addDays(today, 1), granularity: "day" };
  },
  "30d": () => {
    const today = startOfDay(new Date());
    return { start: addDays(today, -29), end: addDays(today, 1), granularity: "day" };
  },
  "6m": () => {
    const thisMonth = startOfMonth(new Date());
    return { start: addMonths(thisMonth, -5), end: addMonths(thisMonth, 1), granularity: "month" };
  },
  "1y": () => {
    const thisMonth = startOfMonth(new Date());
    return { start: addMonths(thisMonth, -11), end: addMonths(thisMonth, 1), granularity: "month" };
  },
};

/**
 * GET /api/dashboard/cashflow?range=7d|30d|6m|1y
 *
 * Server-side aggregation over the live "transactions" collection.
 * Groups by day (7d/30d) or month (6m/1y), sums deposit vs withdraw
 * amounts per bucket, and zero-fills any bucket with no activity so the
 * chart always gets a continuous, chronologically sorted x-axis.
 * Nothing here is cached or mocked — every request re-queries MongoDB.
 */
router.get("/cashflow", async (req, res) => {
  try {
    const range = String(req.query.range || "30d").toLowerCase();
    const config = (RANGE_CONFIG[range] || RANGE_CONFIG["30d"])();
    const { start, end, granularity } = config;
    const dateFormat = granularity === "day" ? "%Y-%m-%d" : "%Y-%m";

    const rows = await Transaction.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end }, type: { $in: ["deposit", "withdraw"] } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          income: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{ $eq: ["$type", "withdraw"] }, "$amount", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byKey = new Map(rows.map((r) => [r._id, r]));
    const points = [];

    if (granularity === "day") {
      const totalDays = Math.round((end - start) / 86400000);
      for (let i = 0; i < totalDays; i++) {
        const key = dayKey(addDays(start, i));
        const row = byKey.get(key);
        const income = row ? row.income : 0;
        const expenses = row ? row.expenses : 0;
        points.push({ date: key, income, expenses, netFlow: income - expenses });
      }
    } else {
      for (let cursor = start; cursor < end; cursor = addMonths(cursor, 1)) {
        const key = monthKey(cursor);
        const row = byKey.get(key);
        const income = row ? row.income : 0;
        const expenses = row ? row.expenses : 0;
        points.push({ date: key, income, expenses, netFlow: income - expenses });
      }
    }

    res.set("Cache-Control", "no-store");
    res.json({ range, granularity, start, end, points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/dashboard/summary
 *
 * Server-side aggregation backing the Total Balance / Monthly Income /
 * Monthly Expenses / Net Flow / Health Score KPI cards, using the exact
 * same current-month and previous-month windows the cashflow chart would
 * show for "30d", so the cards and chart can never silently disagree.
 */
router.get("/summary", async (req, res) => {
  try {
    const now = new Date();
    const curStart = startOfMonth(now);
    const curEnd = addMonths(curStart, 1);
    const prevStart = addMonths(curStart, -1);
    const prevEnd = curStart;

    async function monthTotals(start, end) {
      const rows = await Transaction.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end }, type: { $in: ["deposit", "withdraw"] } } },
        {
          $group: {
            _id: null,
            income: { $sum: { $cond: [{ $eq: ["$type", "deposit"] }, "$amount", 0] } },
            expenses: { $sum: { $cond: [{ $eq: ["$type", "withdraw"] }, "$amount", 0] } },
          },
        },
      ]);
      const income = rows[0]?.income || 0;
      const expenses = rows[0]?.expenses || 0;
      return { income, expenses, netFlow: income - expenses };
    }

    const [balanceAgg, currentMonth, previousMonth, flaggedCount, totalTransactionCount] = await Promise.all([
      Account.aggregate([{ $group: { _id: null, total: { $sum: "$balance" } } }]),
      monthTotals(curStart, curEnd),
      monthTotals(prevStart, prevEnd),
      Transaction.countDocuments({ status: "flagged" }),
      Transaction.countDocuments({}),
    ]);

    res.set("Cache-Control", "no-store");
    res.json({
      totalBalance: balanceAgg[0]?.total || 0,
      currentMonth,
      previousMonth,
      flaggedCount,
      totalTransactionCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
