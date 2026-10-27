# MongoDB Learning & Work Log

A collection of practical MongoDB operations, queries, and class work logs conducted on MongoDB Atlas shell (`mongosh`), plus a full-stack project built to apply that learning.

---

## 📁 Contents

### 📂 CRT-1 — Class Round 1
- [`CRT-1/MongoDB Class - Monday Work Log.txt`](./CRT-1/MongoDB%20Class%20-%20Monday%20Work%20Log.txt) — Shell session covering collection setup and basic CRUD operations.
- [`CRT-1/MongoDB Class - Tuesday Work Log.txt`](./CRT-1/MongoDB%20Class%20-%20Tuesday%20Work%20Log.txt) — Shell session covering database navigation and query operators.
- [`CRT-1/MongoDB Class - Wednesday Work Log.txt`](./CRT-1/MongoDB%20Class%20-%20Wednesday%20Work%20Log.txt) — Shell session covering aggregation pipelines, grouping, and collection joins.
- [`CRT-1/MongoDB Class - Thursday Work Log.txt`](./CRT-1/MongoDB%20Class%20-%20Thursday%20Work%20Log.txt) — Shell session covering indexing and query performance analysis.

### 📂 CRT-2 — Class Round 2
- [`CRT-2/MongoDB Class - Tuesday Work Log.txt`](./CRT-2/MongoDB%20Class%20-%20Tuesday%20Work%20Log.txt) — Shell session covering advanced indexing: compound indexes, multikey indexes, hidden indexes, unique indexes, `explain()` analysis, and index statistics.

### 📂 Banking Transaction Project
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
- **Grouping**: `$group` with `$sum` and `$avg` accumulators to summarize documents (e.g. totals and counts per category)
- **Filtering Stages**: `$match` to filter documents before/after grouping
- **Shaping & Paging**: `$project`, `$sort`, `$skip`, `$limit`, and `$count`
- **Computed Fields**: `$addFields` and `$unset`, with expressions like `$multiply`, `$cond`, and `$toUpper`
- **Array Handling**: `$unwind` to break out `tags` arrays into one document per element
- **Collection Joins**: `$lookup` to combine data across related collections
- **Bucketing**: `$bucket` (fixed price ranges) and `$bucketAuto` (evenly distributed buckets)
- **Writing Results**: `$out` to save pipeline output to a new collection, `$merge` to upsert into an existing one
- **Multi-Stage Pipelines**: Chaining `$match`, `$group`, and `$lookup` together for real-world reporting queries

### 5. Indexing & Query Performance (CRT-1)
- **Single-Field Indexes**: `db.product.createIndex({ price: 1 })`
- **Compound Indexes**: Creating indexes across multiple fields
- **Query Plan Analysis**: `db.product.find({...}).explain("executionStats")` to compare scan efficiency with and without an index
- **Index Cleanup**: `db.product.dropIndex("price_1")`

### 6. Advanced Indexing & Index Management (CRT-2)
- **Single & Compound Indexes**: `createIndex({ name: 1 })`, `createIndex({ city: 1, course: 1 })`, `createIndex({ course: 1, marks: -1 })`
- **Multikey Indexes**: Indexing array fields (`skills`) for element-level queries
- **Hidden Indexes**: `hideIndex()` / `unhideIndex()` to test index removal impact without dropping
- **Unique Indexes**: Enforcing uniqueness with `{ unique: true }` and handling `E11000` duplicate key errors
- **explain() Deep Dive**: Reading `IXSCAN` vs `COLLSCAN`, `nReturned`, `totalKeysExamined`, `totalDocsExamined`
- **Index Hints**: Forcing a specific index with `.hint({ name: 1 })` and `.hint({ $natural: 1 })`
- **Index Statistics**: `db.students.aggregate([{ $indexStats: {} }])` to track usage per index
- **Index Naming & Conflicts**: Custom index names, and `IndexOptionsConflict` error when re-creating with different options

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
