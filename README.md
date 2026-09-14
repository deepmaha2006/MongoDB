# MongoDB Learning & Work Log

A collection of practical MongoDB operations, queries, and class work logs conducted on MongoDB Atlas shell (`mongosh`).

---

## 📁 Contents

- [`MongoDB Class - Monday Work Log.txt`](./MongoDB%20Class%20-%20Monday%20Work%20Log.txt) — Raw shell session log with queries and outputs.

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

---

## 👤 Author
- **GitHub**: [@deepmaha2006](https://github.com/deepmaha2006)
- **Email**: deepeshmahawar2006@gmail.com
