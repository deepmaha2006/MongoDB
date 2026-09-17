require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./db");
const Customer = require("./models/Customer");
const Account = require("./models/Account");
const Transaction = require("./models/Transaction");

function accNum() {
  return "BT" + Math.floor(1000000000 + Math.random() * 8999999999);
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
async function stampDate(txn, date) {
  await Transaction.updateOne({ _id: txn._id }, { createdAt: date, updatedAt: date }, { timestamps: false });
}

async function seed() {
  await connectDB();

  await Promise.all([
    Customer.deleteMany({}),
    Account.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  const customers = await Customer.insertMany([
    { name: "Aarav Sharma", email: "aarav.sharma@example.com", phone: "9876543210", address: "Mumbai, MH", dob: new Date("1992-04-12") },
    { name: "Priya Verma", email: "priya.verma@example.com", phone: "9123456780", address: "Delhi, DL", dob: new Date("1995-08-23") },
    { name: "Rohan Mehta", email: "rohan.mehta@example.com", phone: "9988776655", address: "Pune, MH", dob: new Date("1990-01-30") },
  ]);

  const accountsData = [
    { customer: customers[0]._id, accountType: "Current", balance: 0 },
    { customer: customers[1]._id, accountType: "Savings", balance: 0 },
    { customer: customers[2]._id, accountType: "Savings", balance: 0 },
  ];

  const accounts = [];
  for (const data of accountsData) {
    const account = await Account.create({ ...data, accountNumber: accNum() });
    accounts.push(account);
  }
  const [biz, savings1, savings2] = accounts;

  async function deposit(account, amount, { category, merchant, desc, days, status = "completed", tags = [] }) {
    account.balance += amount;
    await account.save();
    const txn = await Transaction.create({
      account: account._id, type: "deposit", amount, balanceAfter: account.balance,
      description: desc, category, merchant, status, tags,
    });
    await stampDate(txn, daysAgo(days));
  }
  async function withdraw(account, amount, { category, merchant, desc, days, status = "completed", tags = [] }) {
    account.balance -= amount;
    await account.save();
    const txn = await Transaction.create({
      account: account._id, type: "withdraw", amount, balanceAfter: account.balance,
      description: desc, category, merchant, status, tags,
    });
    await stampDate(txn, daysAgo(days));
  }
  async function transfer(from, to, amount, { category, desc, days, tags = [] }) {
    from.balance -= amount;
    to.balance += amount;
    await from.save();
    await to.save();
    const [outTxn, inTxn] = await Transaction.create([
      { account: from._id, type: "transfer-out", amount, balanceAfter: from.balance, relatedAccount: to._id, description: desc, category, tags },
      { account: to._id, type: "transfer-in", amount, balanceAfter: to.balance, relatedAccount: from._id, description: desc, category, tags },
    ]);
    await stampDate(outTxn, daysAgo(days));
    await stampDate(inTxn, daysAgo(days));
  }

  // Business current account: revenue + expenses across ~45 days
  await deposit(biz, 250000, { category: "Deposit", merchant: "Opening balance", desc: "Opening balance", days: 60 });
  await deposit(biz, 180000, { category: "Consulting", merchant: "Nimbus Retail Pvt Ltd", desc: "Consulting invoice #1042", days: 42, tags: ["invoice"] });
  await withdraw(biz, 42000, { category: "Payroll", merchant: "Payroll Run", desc: "Monthly payroll", days: 40, tags: ["recurring"] });
  await withdraw(biz, 15500, { category: "Marketing", merchant: "AdWorks Media", desc: "Campaign spend", days: 33, tags: ["Q3"] });
  await withdraw(biz, 8200, { category: "Office Supplies", merchant: "Staples India", desc: "Office restock", days: 29 });
  await deposit(biz, 95000, { category: "Consulting", merchant: "Bluepeak Systems", desc: "Consulting invoice #1043", days: 25, tags: ["invoice"] });
  await withdraw(biz, 26000, { category: "Rent", merchant: "Prestige Estates", desc: "Office rent", days: 20, tags: ["recurring"] });
  await withdraw(biz, 6400, { category: "Utilities", merchant: "State Power Co", desc: "Electricity bill", days: 18, status: "pending" });
  await withdraw(biz, 9800, { category: "Travel", merchant: "IndiGo Airlines", desc: "Client visit travel", days: 14, status: "flagged", tags: ["review"] });
  await withdraw(biz, 42000, { category: "Payroll", merchant: "Payroll Run", desc: "Monthly payroll", days: 10, tags: ["recurring"] });
  await deposit(biz, 120000, { category: "Consulting", merchant: "Nimbus Retail Pvt Ltd", desc: "Consulting invoice #1044", days: 6, tags: ["invoice"] });
  await withdraw(biz, 5200, { category: "Office Supplies", merchant: "Amazon Business", desc: "Printer supplies", days: 2 });

  // Personal savings accounts
  await deposit(savings1, 75000, { category: "Deposit", merchant: "Opening balance", desc: "Opening balance", days: 55 });
  await deposit(savings1, 32000, { category: "Deposit", merchant: "Salary", desc: "Monthly salary", days: 25, tags: ["recurring"] });
  await withdraw(savings1, 4200, { category: "Utilities", merchant: "City Gas Ltd", desc: "Gas bill", days: 12, status: "pending" });

  await deposit(savings2, 30000, { category: "Deposit", merchant: "Opening balance", desc: "Opening balance", days: 50 });
  await deposit(savings2, 18000, { category: "Deposit", merchant: "Salary", desc: "Monthly salary", days: 22, tags: ["recurring"] });

  await transfer(savings1, savings2, 5000, { category: "Transfer", desc: "Shared expenses", days: 8, tags: ["split"] });

  console.log(`Seeded ${customers.length} customers and ${accounts.length} accounts with a realistic ~60-day transaction history into "${mongoose.connection.name}".`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
