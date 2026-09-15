# MongoDB Learning & Work Log

A collection of practical MongoDB operations, queries, and class work logs conducted on MongoDB Atlas shell (`mongosh`).

---

## 📁 Contents

- [`MongoDB Class - Monday Work Log.txt`](./MongoDB%20Class%20-%20Monday%20Work%20Log.txt) — Raw shell session log covering collection setup and basic CRUD operations.
- [`MongoDB Class - Tuesday Work Log.txt`](./MongoDB%20Class%20-%20Tuesday%20Work%20Log.txt) — Raw shell session log covering database navigation and query operators.

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

---

## 👤 Author
- **GitHub**: [@deepmaha2006](https://github.com/deepmaha2006)
- **Email**: deepeshmahawar2006@gmail.com
