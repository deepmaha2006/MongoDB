# MongoDB Learning & Work Log

A collection of practical MongoDB operations, queries, and class work logs conducted on MongoDB Atlas shell (`mongosh`), plus a full-stack project built to apply that learning.

---

## 📁 Contents

- [`MongoDB Class - Monday Work Log.txt`](./MongoDB%20Class%20-%20Monday%20Work%20Log.txt) — Raw shell session log covering collection setup and basic CRUD operations.
- [`MongoDB Class - Tuesday Work Log.txt`](./MongoDB%20Class%20-%20Tuesday%20Work%20Log.txt) — Raw shell session log covering database navigation and query operators.
- [`MongoDB Class - Wednesday Work Log.txt`](./MongoDB%20Class%20-%20Wednesday%20Work%20Log.txt) — Raw shell session log covering aggregation pipelines, grouping, and collection joins.
- [`Banking Transaction Project/`](./Banking%20Transaction%20Project) — Full-stack Node.js + Express + MongoDB banking system built using these concepts, deployed live on Render.

---

## 🚀 Summary of Operations Covered

### 1. `students` Collection (`test` Database)
- **Create Collection**: `db.createCollection("students")`
- **Insert Single Document**: `db.students.insertOne({...})`
- **Insert Multiple Documents**: `db.students.insertMany([...])`
- **Retrieve All Documents**: `db.students.find()`
- **Show Collections**: `show collections`

### 2. `ecommerce` Database
- **Switch/Create Database**: `use ecommerce`
- **Batch Document Insertion**: Insert product documents with attributes: `product_id`, `product_name`, `category`, `price`, `stock`, `brand`, and `rating`.
- **Query All Products**: `db.products.find()`
- **Filtered Queries**: Retrieve specific category products with `db.products.find({ category: "Electronics" })`
- **Database Inspection**: `show dbs`, `show collections`

### 3. `students` Collection (Custom Database)
- **Database Switching**: `use <dbName>` and `use("<dbName>")`
- **Bulk Insertion**: `db.students.insertMany([...])` with nested `address` objects and `skills` arrays
- **Document Count**: `db.students.countDocuments()`
- **Collection Cleanup**: `db.student.drop()`
- **Comparison Operators**: `$gt`, `$lt`, `$gte`, `$lte`, `$eq`
- **Logical Operators**: `$and`, `$or`

### 4. Aggregation Pipelines
- **Grouping**: `$group` to summarize documents (e.g. totals and counts per category)
- **Filtering Stages**: `$match` to filter documents before/after grouping
- **Collection Joins**: `$lookup` to combine data across related collections
- **Multi-Stage Pipelines**: Chaining `$match`, `$group`, and `$lookup` together for real-world reporting queries

---

## 🏦 Banking Transaction Project

A full-stack banking/transaction management system built on top of everything above, using **Node.js**, **Express**, **Mongoose**, and **MongoDB Atlas**, with a vanilla HTML/CSS/JS frontend.

- **Source**: [`Banking Transaction Project/`](./Banking%20Transaction%20Project)
- **Live Demo**: [banking-transaction-project.onrender.com](https://banking-transaction-project.onrender.com)
- **Features**: Customers, accounts, and transactions with a dashboard and stats API
- **Stack**: Express REST API + MongoDB (Mongoose models) + static frontend, deployed on Render with MongoDB Atlas as the database

See the [project's own README](./Banking%20Transaction%20Project/README.md) for setup and API details.

---

## 👤 Author
- **GitHub**: [@deepmaha2006](https://github.com/deepmaha2006)
- **Email**: deepeshmahawar2006@gmail.com
