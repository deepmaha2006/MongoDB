require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const customerRoutes = require("./routes/customers");
const accountRoutes = require("./routes/accounts");
const transactionRoutes = require("./routes/transactions");
const statsRoutes = require("./routes/stats");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const publicDir = path.join(__dirname, "..", "public");

app.use(cors());
app.use(express.json());

app.use("/api/customers", customerRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Cache-busting: stamp index.html's asset links with each file's current
// mtime so a browser can never render a page against a stale CSS/JS body.
// Static assets are then safe to cache aggressively (their URL changes the
// instant the file does), while index.html itself is never cached.
function assetVersion(file) {
  try {
    return Math.round(fs.statSync(file).mtimeMs);
  } catch {
    return Date.now();
  }
}
app.get(["/", "/index.html"], (req, res) => {
  const html = fs
    .readFileSync(path.join(publicDir, "index.html"), "utf8")
    .replace("__CSS_VERSION__", assetVersion(path.join(publicDir, "style.css")))
    .replace("__JS_VERSION__", assetVersion(path.join(publicDir, "app.js")));
  res.set("Cache-Control", "no-cache");
  res.type("html").send(html);
});

app.use(express.static(publicDir, { maxAge: "1h" }));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Banking Transaction server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
