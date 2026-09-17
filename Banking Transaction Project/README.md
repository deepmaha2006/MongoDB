# 🏦 Banking Transaction Database

Fullstack banking system: Node.js/Express API + MongoDB Atlas + vanilla HTML/CSS/JS UI.

## Stack
- **Database:** MongoDB Atlas, database `BankingTransaction` (collections: `customers`, `accounts`, `transactions`)
- **Backend:** Express + Mongoose (`server/`)
- **Frontend:** Static HTML/CSS/JS served by Express (`public/`)

## Setup
```
npm install
```

Connection string lives in `.env` (`MONGODB_URI`). Note: this Atlas cluster's SRV DNS lookup
(`mongodb+srv://...`) is blocked in some sandboxed/corporate networks, so `.env` uses the
resolved standard connection string (`mongodb://host1,host2,host3/...&replicaSet=...`) instead.
If you move to a network where SRV works, either form is fine.

## Run
```
npm run seed   # (re)populates sample customers/accounts/transactions
npm start      # starts the server on http://localhost:5000
```

## Data model
- **Customer**: name, email, phone, address, dob, status
- **Account**: accountNumber, customer ref, accountType (Savings/Current), balance, status
- **Transaction**: account ref, type (deposit/withdraw/transfer-in/transfer-out), amount, balanceAfter, relatedAccount, description

## API
- `GET/POST/PUT/DELETE /api/customers[/:id]`
- `GET/POST/PUT/DELETE /api/accounts[/:id]`
- `GET /api/transactions?account=<id>`
- `POST /api/transactions/deposit` `{ accountId, amount, description }`
- `POST /api/transactions/withdraw` `{ accountId, amount, description }`
- `POST /api/transactions/transfer` `{ fromAccountId, toAccountId, amount, description }` (atomic, uses a Mongo session/transaction)
- `GET /api/stats` — dashboard totals

## UI
Open `http://localhost:5000` — tabs for Dashboard, Customers, Accounts, Transactions
(deposit/withdraw/transfer forms + full transaction history table).
