const API = "/api";

const state = {
  customers: [],
  accounts: [],
  transactions: [],
  filteredTxns: [],
  sort: { field: "date", dir: "desc" },
  page: 1,
  pageSize: 10,
  cashflowRange: "30D",
  reportPreset: "MONTH",
  txnOp: "deposit",
  txnPayload: null,
};

// ---------- Generic helpers ----------
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function money(n) {
  const v = Number(n || 0);
  const sign = v < 0 ? "-" : "";
  return sign + "₹" + Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(d) {
  return new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
function fmtDay(d) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}
function fmtMonth(d) {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}
async function api(path, options) {
  const res = await fetch(API + path, { headers: { "Content-Type": "application/json" }, ...options });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

// ---------- Toasts ----------
function toast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.textContent = message;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

// ---------- Field validation ----------
function setFieldError(id, message) {
  const input = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  if (err) err.textContent = message;
  if (input) input.setAttribute("aria-invalid", "true");
}
function clearFieldError(id) {
  const input = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  if (err) err.textContent = "";
  if (input) input.removeAttribute("aria-invalid");
}

// ---------- Generic confirm dialog (destructive actions) ----------
function confirmAction({ title, message, confirmLabel = "Confirm" }) {
  return new Promise((resolve) => {
    const dialog = document.getElementById("confirm-dialog");
    document.getElementById("confirm-dialog-title").textContent = title;
    document.getElementById("confirm-dialog-message").textContent = message;
    const okBtn = document.getElementById("confirm-dialog-ok");
    const cancelBtn = document.getElementById("confirm-dialog-cancel");
    okBtn.textContent = confirmLabel;

    function cleanup(result) {
      dialog.close();
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      dialog.removeEventListener("cancel", onCancel);
      dialog.removeEventListener("click", onBackdrop);
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }
    function onBackdrop(e) { if (e.target === dialog) onCancel(); }

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    dialog.addEventListener("cancel", onCancel);
    dialog.addEventListener("click", onBackdrop);
    dialog.showModal();
  });
}

// ---------- Icons ----------
const ICON_PATHS = {
  cart: "M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.44C4.52 15.37 5.48 17 7 17h12v-2H7l1.1-2h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z",
  bolt: "M7 2v11h3v9l7-12h-4l4-8z",
  people: "M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-2.7 0-8 1.34-8 4v2h16v-2c0-2.66-5.3-4-8-4z",
  building: "M4 22h16V2H4v20zm2-2V4h12v16H6zm2-13h3v3H8V7zm5 0h3v3h-3V7zm-5 5h3v3H8v-3zm5 0h3v3h-3v-3z",
  plane: "M21 16v-1.5l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5v6l-8 5V16l8-2.5V19l-2.5 1.5V22l4-1 4 1v-1.5L13 19v-5.5l8 2.5z",
  exchange: "M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z",
  tag: "M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z",
  briefcase: "M20 6h-4V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z",
  arrowDown: "M11 4h2v12.17l5.59-5.58L20 12l-8 8-8-8 1.41-1.41L11 16.17V4z",
  arrowUp: "M13 20h-2V7.83l-5.59 5.58L4 12l8-8 8 8-1.41 1.41L13 7.83V20z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z",
};
function svgIcon(key, size = 13) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}"><path fill="currentColor" d="${ICON_PATHS[key]}"/></svg>`;
}
function pulseIcon() {
  return `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="2,12 7,12 10,4 14,20 17,12 22,12"/></svg>`;
}
const CATEGORY_META = {
  "Deposit": { bg: "var(--color-success-bg)", fg: "var(--color-success)", icon: "arrowDown" },
  "Withdrawal": { bg: "var(--color-danger-bg)", fg: "var(--color-danger)", icon: "arrowUp" },
  "Transfer": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "exchange" },
  "Transfer In": { bg: "var(--color-success-bg)", fg: "var(--color-success)", icon: "exchange" },
  "Transfer Out": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "exchange" },
  "Marketing": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "briefcase" },
  "Consulting": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "people" },
  "Office Supplies": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "cart" },
  "Payroll": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "people" },
  "Utilities": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "bolt" },
  "Rent": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "building" },
  "Travel": { bg: "var(--color-accent-bg)", fg: "var(--color-accent)", icon: "plane" },
  "Other": { bg: "var(--color-surface-muted)", fg: "var(--color-text-muted)", icon: "tag" },
};
function categoryMeta(cat) {
  return CATEGORY_META[cat] || { bg: "var(--color-surface-muted)", fg: "var(--color-text-muted)", icon: "tag" };
}
// Single source of truth for "does this transaction show green or red" —
// driven strictly by the transaction's own `type` field. Never inspect
// category/merchant/description here; they're independent metadata.
function amountClassFor(t) {
  return t.type === "deposit" || t.type === "transfer-in" ? "positive" : "negative";
}

// ---------- Skeleton loaders ----------
function skeletonKpiRow(id, count = 5) {
  document.getElementById(id).innerHTML = Array.from({ length: count }).map(() => `<div class="kpi-card skeleton skel-kpi-card"></div>`).join("");
}
function skeletonRows(tbodyId, cols, rows = 4) {
  document.getElementById(tbodyId).innerHTML = Array.from({ length: rows }).map(() =>
    `<tr class="skel-row">${Array.from({ length: cols }).map(() => `<td><span class="skeleton skel-line w-60"></span></td>`).join("")}</tr>`
  ).join("");
}
function skeletonChart(id) {
  document.getElementById(id).innerHTML = `<div class="skeleton skel-chart"></div>`;
}

// ---------- Tabs ----------
document.querySelectorAll(".nav-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-tab").forEach((b) => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});
document.getElementById("view-all-txns").addEventListener("click", () => {
  document.querySelector('.nav-tab[data-tab="accounts-transactions"]').click();
});

// ---------- Date helpers ----------
function monthBounds(offset) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { start, end };
}
function inRange(date, start, end) {
  const d = new Date(date);
  return d >= start && d < end;
}
// ---------- Loaders ----------
async function loadCustomers() {
  state.customers = await api("/customers");
  renderCustomerSelect();
}
async function loadAccounts() {
  state.accounts = await api("/accounts");
  renderAccountsTable();
  renderAccountSelects();
}
async function loadTransactions() {
  state.transactions = await api("/transactions");
  renderCategoryFilterOptions();
}
// These two hit dedicated server-side MongoDB aggregation endpoints
// (server/routes/dashboard.js) — no client-side date-bucketing, no cache.
function fetchDashboardSummary() {
  return api("/dashboard/summary");
}
function fetchCashflow(range) {
  return api(`/dashboard/cashflow?range=${range.toLowerCase()}`);
}
async function refreshAll(resetPage = false) {
  await Promise.all([loadCustomers(), loadAccounts(), loadTransactions()]);
  await renderDashboard();
  renderCustomersTable();
  renderCustomerBalanceChart();
  renderReports();
  applyFilters(resetPage);
}

// ---------- KPI computation ----------
function pct(cur, prev) {
  if (!prev) return cur > 0 ? { dir: "up", text: "New this month" } : { dir: "flat", text: "No change" };
  const p = ((cur - prev) / Math.abs(prev)) * 100;
  return { dir: p >= 0 ? "up" : "down", text: `${p >= 0 ? "+" : ""}${p.toFixed(1)}% vs last month` };
}
// Health score is a client-side heuristic label applied to live
// server-aggregated numbers (not a stored/mocked value itself).
function computeHealthScore(summary) {
  const { totalBalance, currentMonth, flaggedCount, totalTransactionCount } = summary;
  const flaggedRatio = flaggedCount / (totalTransactionCount || 1);
  const bufferMonths = totalBalance / (currentMonth.expenses || 1);
  let risk = 60 + Math.min(30, bufferMonths * 5) - Math.min(30, flaggedRatio * 100 * 0.6) + (currentMonth.netFlow > 0 ? 10 : -10);
  return Math.max(0, Math.min(100, Math.round(risk)));
}
function buildDashboardKpiCards(summary) {
  const startOfMonthBalance = summary.totalBalance - summary.currentMonth.netFlow;
  const risk = computeHealthScore(summary);
  return [
    { label: "Total Balance", value: money(summary.totalBalance), iconBg: "var(--color-accent-bg)", iconFg: "var(--color-accent)", icon: `<span style="font-weight:800;font-size:14px;">₹</span>`, trendHtml: trendHtml(pct(summary.totalBalance, startOfMonthBalance)) },
    { label: "Monthly Income", value: money(summary.currentMonth.income), iconBg: "var(--color-success-bg)", iconFg: "var(--color-success)", icon: svgIcon("arrowUp"), trendHtml: trendHtml(pct(summary.currentMonth.income, summary.previousMonth.income)) },
    { label: "Monthly Expenses", value: money(summary.currentMonth.expenses), iconBg: "var(--color-danger-bg)", iconFg: "var(--color-danger)", icon: svgIcon("arrowDown"), trendHtml: trendHtml(pct(summary.currentMonth.expenses, summary.previousMonth.expenses), true) },
    { label: "Net Flow", value: money(summary.currentMonth.netFlow), iconBg: "var(--color-accent-bg)", iconFg: "var(--color-accent)", icon: pulseIcon(), trendHtml: trendHtml(pct(summary.currentMonth.netFlow, summary.previousMonth.netFlow)) },
    { label: "Health Score", value: `${risk}/100`, iconBg: "var(--color-surface-muted)", iconFg: "var(--color-navy-900)", icon: svgIcon("shield"), trendHtml: riskTrendHtml(risk) },
  ];
}
function trendHtml(trend, invert = false) {
  if (trend.dir === "flat") return `<span class="kpi-trend flat">${esc(trend.text)}</span>`;
  const isUp = trend.dir === "up";
  const good = invert ? !isUp : isUp;
  return `<span class="kpi-trend ${good ? "up" : "down"}">${isUp ? "▲" : "▼"} ${esc(trend.text)}</span>`;
}
function riskTrendHtml(score) {
  if (score >= 70) return `<span class="kpi-trend up">▲ Healthy</span>`;
  if (score >= 40) return `<span class="kpi-trend flat">● Moderate</span>`;
  return `<span class="kpi-trend down">▼ Needs attention</span>`;
}
function renderKpiRow(containerId, cards) {
  document.getElementById(containerId).innerHTML = cards.map((c) => `
    <div class="kpi-card">
      <div class="kpi-top">
        <span class="kpi-label">${esc(c.label)}</span>
        <span class="kpi-icon" style="background:${c.iconBg};color:${c.iconFg}">${c.icon}</span>
      </div>
      <div class="kpi-value">${c.value}</div>
      ${c.trendHtml || ""}
    </div>`).join("");
}

async function renderDashboard() {
  skeletonKpiRow("kpi-row", 5);
  skeletonChart("cashflow-chart");
  const [summary, cashflow] = await Promise.all([
    fetchDashboardSummary(),
    fetchCashflow(state.cashflowRange),
  ]);
  renderKpiRow("kpi-row", buildDashboardKpiCards(summary));
  renderCashflowChart(cashflow);
  renderDashboardRecent();
}
function renderDashboardRecent() {
  const rows = state.transactions.slice(0, 5);
  document.getElementById("dashboard-recent").innerHTML = rows.map((t) => `
    <tr>
      <td>${fmtDate(t.createdAt)}</td>
      <td>${esc(t.account?.accountNumber || "—")}</td>
      <td>${esc(t.category)}</td>
      <td class="amount-cell ${amountClassFor(t)}">${money(t.amount)}</td>
      <td><span class="status-pill ${t.status}" style="pointer-events:none;">${esc(t.status)}</span></td>
    </tr>`).join("") || `<tr><td colspan="5" class="empty-state">No transactions yet. Record your first one from "New Transaction".</td></tr>`;
}

// ---------- Cash flow chart ----------
// Parses the server's "YYYY-MM-DD" / "YYYY-MM" bucket keys as local dates
// (not via `new Date(str)`, which treats bare date strings as UTC and can
// shift the day/month in negative-offset timezones).
function parseDayKey(key) { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); }
function parseMonthKey(key) { const [y, m] = key.split("-").map(Number); return new Date(y, m - 1, 1); }

function smoothPath(points) {
  if (points.length < 2) return "";
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    d += ` Q${x0.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const last = points[points.length - 1];
  d += ` L${last[0].toFixed(1)},${last[1].toFixed(1)}`;
  return d;
}
// Renders the chart purely from the server's aggregation response —
// { granularity, points: [{ date, income, expenses, netFlow }, ...] }.
// No client-side bucketing or hardcoded values; the y-axis auto-scales to
// whatever range of real values comes back.
function renderCashflowChart(data) {
  const { granularity, points } = data;
  const income = points.map((p) => p.income);
  const expenses = points.map((p) => p.expenses);
  const net = points.map((p) => p.netFlow);
  const labels = points.map((p) =>
    granularity === "day" ? fmtDay(parseDayKey(p.date)) : fmtMonth(parseMonthKey(p.date))
  );

  if (!income.some((v) => v > 0) && !expenses.some((v) => v > 0)) {
    document.getElementById("cashflow-chart").innerHTML = `<div class="chart-empty">No transaction activity in this period yet.</div>`;
    return;
  }

  const w = 680, h = 230, padL = 54, padR = 14, padT = 14, padB = 26;
  const all = [...income, ...expenses, ...net];
  const max = Math.max(...all, 1);
  const min = Math.min(...all, 0);
  const spread = max - min || 1;
  const stepX = (w - padL - padR) / (points.length - 1 || 1);
  const scaleY = (v) => h - padB - ((v - min) / spread) * (h - padT - padB);
  const zeroY = scaleY(0);
  const xAt = (i) => padL + i * stepX;

  const incomePts = income.map((v, i) => [xAt(i), scaleY(v)]);
  const expensePts = expenses.map((v, i) => [xAt(i), scaleY(v)]);
  const netPts = net.map((v, i) => [xAt(i), scaleY(v)]);

  const incomeLine = smoothPath(incomePts);
  const expenseLine = smoothPath(expensePts);
  const netLine = smoothPath(netPts);
  const lastX = xAt(points.length - 1), firstX = xAt(0);
  const incomeArea = `${incomeLine} L${lastX.toFixed(1)},${zeroY.toFixed(1)} L${firstX.toFixed(1)},${zeroY.toFixed(1)} Z`;
  const expenseArea = `${expenseLine} L${lastX.toFixed(1)},${zeroY.toFixed(1)} L${firstX.toFixed(1)},${zeroY.toFixed(1)} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const val = min + f * spread;
    const y = scaleY(val);
    return `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - padR}" y2="${y.toFixed(1)}" stroke="#eef0f4" stroke-width="1"/>
      <text x="${padL - 8}" y="${(y + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--color-text-muted)">${money(val).replace("₹", "")}</text>`;
  }).join("");

  const skip = Math.max(1, Math.ceil(points.length / 7));
  const xLabels = labels.map((label, i) => (i % skip !== 0) ? "" :
    `<text x="${xAt(i).toFixed(1)}" y="${h - 6}" text-anchor="middle" font-size="10" fill="var(--color-text-muted)">${esc(label)}</text>`
  ).join("");

  const netDots = netPts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5" fill="#0f172a"><title>${esc(labels[i])}: Net ${money(net[i])}</title></circle>`).join("");

  document.getElementById("cashflow-chart").innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      ${gridLines}
      <line x1="${padL}" y1="${zeroY.toFixed(1)}" x2="${w - padR}" y2="${zeroY.toFixed(1)}" stroke="#c7cbd8" stroke-width="1" stroke-dasharray="3,3"/>
      <path d="${incomeArea}" fill="var(--color-accent)" opacity="0.16" stroke="none"/>
      <path d="${incomeLine}" fill="none" stroke="var(--color-accent)" stroke-width="2.25" stroke-linecap="round"/>
      <path d="${expenseArea}" fill="var(--color-danger)" opacity="0.14" stroke="none"/>
      <path d="${expenseLine}" fill="none" stroke="var(--color-danger)" stroke-width="2.25" stroke-linecap="round"/>
      <path d="${netLine}" fill="none" stroke="#0f172a" stroke-width="2.25" stroke-linecap="round"/>
      ${netDots}
      ${xLabels}
    </svg>`;
}
document.getElementById("range-toggle").addEventListener("click", async (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  document.querySelectorAll("#range-toggle .seg-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  state.cashflowRange = btn.dataset.range;
  skeletonChart("cashflow-chart");
  const data = await fetchCashflow(state.cashflowRange);
  renderCashflowChart(data);
});

// ---------- Generic horizontal bar chart ----------
function renderHBarChart(containerId, rows, emptyLabel) {
  if (!rows.length) {
    document.getElementById(containerId).innerHTML = `<div class="chart-empty">${esc(emptyLabel)}</div>`;
    return;
  }
  const w = 900, rowH = 32, padL = 170, padR = 90, padT = 10, padB = 10;
  const h = rows.length * rowH + padT + padB;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const barMaxW = w - padL - padR;
  const bars = rows.map((r, i) => {
    const y = padT + i * rowH;
    const barW = Math.max((r.value / max) * barMaxW, 2);
    return `
      <text x="${padL - 10}" y="${(y + rowH / 2 + 4).toFixed(1)}" text-anchor="end" font-size="11.5" fill="var(--color-navy-900)">${esc(r.label)}</text>
      <rect x="${padL}" y="${(y + 6).toFixed(1)}" width="${barW.toFixed(1)}" height="${rowH - 12}" rx="4" fill="${r.color || "var(--color-navy-900)"}">
        <title>${esc(r.label)}: ${money(r.value)}</title>
      </rect>
      <text x="${(padL + barW + 8).toFixed(1)}" y="${(y + rowH / 2 + 4).toFixed(1)}" font-size="11.5" font-weight="700" fill="var(--color-navy-900)">${money(r.value)}</text>`;
  }).join("");
  document.getElementById(containerId).innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">${bars}</svg>`;
}

// ---------- Accounts ----------
function renderAccountsTable() {
  document.getElementById("accounts-table").innerHTML = state.accounts.map((a) => `
    <tr>
      <td>${esc(a.accountNumber)}</td>
      <td>${a.customer ? esc(a.customer.name) : "—"}</td>
      <td>${esc(a.accountType)}</td>
      <td class="amount-cell">${money(a.balance)}</td>
      <td><span class="badge ${a.status}">${esc(a.status)}</span></td>
    </tr>`).join("") || `<tr><td colspan="5" class="empty-state">No accounts yet. Open one above to get started.</td></tr>`;
}
function renderAccountSelects() {
  const opts = state.accounts.map((a) => `<option value="${a._id}">${esc(a.accountNumber)} — ${a.customer ? esc(a.customer.name) : ""} (${money(a.balance)})</option>`).join("");
  ["txn-account", "txn-to-account"].forEach((id) => { document.getElementById(id).innerHTML = opts; });
  const filterSel = document.getElementById("f-account");
  const prev = filterSel.value;
  filterSel.innerHTML = `<option value="">All accounts</option>` + opts;
  filterSel.value = state.accounts.some((a) => a._id === prev) ? prev : "";
}
function renderCustomerSelect() {
  document.getElementById("a-customer").innerHTML = state.customers.map((c) => `<option value="${c._id}">${esc(c.name)} (${esc(c.email)})</option>`).join("");
}
document.getElementById("toggle-account-form").addEventListener("click", (e) => {
  const form = document.getElementById("account-form");
  form.hidden = !form.hidden;
  e.currentTarget.setAttribute("aria-expanded", String(!form.hidden));
});

// ---------- Transactions: filter + sort + paginate ----------
function renderCategoryFilterOptions() {
  const sel = document.getElementById("f-category");
  const prev = sel.value;
  const categories = [...new Set(state.transactions.map((t) => t.category).filter(Boolean))].sort();
  sel.innerHTML = `<option value="">All categories</option>` + categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
  sel.value = categories.includes(prev) ? prev : "";
}
function compareTxns(a, b) {
  const { field, dir } = state.sort;
  let av, bv;
  if (field === "date") { av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); }
  else if (field === "amount") { av = a.amount; bv = b.amount; }
  else { av = a.status; bv = b.status; }
  const cmp = av > bv ? 1 : av < bv ? -1 : 0;
  return dir === "asc" ? cmp : -cmp;
}
function applyFilters(resetPage = true) {
  const search = document.getElementById("f-search").value.trim().toLowerCase();
  const type = document.getElementById("f-type").value;
  const category = document.getElementById("f-category").value;
  const account = document.getElementById("f-account").value;
  const status = document.getElementById("f-status").value;
  const from = document.getElementById("f-from").value ? new Date(document.getElementById("f-from").value) : null;
  const to = document.getElementById("f-to").value ? new Date(document.getElementById("f-to").value) : null;
  if (to) to.setHours(23, 59, 59, 999);
  const min = document.getElementById("f-min").value ? Number(document.getElementById("f-min").value) : null;
  const max = document.getElementById("f-max").value ? Number(document.getElementById("f-max").value) : null;

  state.filteredTxns = state.transactions.filter((t) => {
    if (type && t.type !== type) return false;
    if (category && t.category !== category) return false;
    if (account && t.account?._id !== account) return false;
    if (status && t.status !== status) return false;
    const created = new Date(t.createdAt);
    if (from && created < from) return false;
    if (to && created > to) return false;
    if (min !== null && t.amount < min) return false;
    if (max !== null && t.amount > max) return false;
    if (search) {
      const haystack = [t.account?.accountNumber, t.account?.customer?.name, t.merchant, t.description, t.category].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  }).sort(compareTxns);

  if (resetPage) state.page = 1;
  renderTransactionsPage();
}
["f-search", "f-type", "f-category", "f-account", "f-status", "f-from", "f-to", "f-min", "f-max"].forEach((id) =>
  document.getElementById(id).addEventListener("input", () => applyFilters(true))
);
document.getElementById("f-clear").addEventListener("click", () => {
  document.getElementById("filter-form").reset();
  applyFilters(true);
});

document.querySelectorAll("th.sortable").forEach((th) => {
  th.querySelector(".th-btn").addEventListener("click", () => {
    const field = th.dataset.sort;
    if (state.sort.field === field) state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
    else { state.sort.field = field; state.sort.dir = "asc"; }
    document.querySelectorAll("th.sortable").forEach((t) => t.removeAttribute("aria-sort"));
    document.querySelectorAll(".sort-arrow").forEach((s) => { s.textContent = ""; });
    th.setAttribute("aria-sort", state.sort.dir === "asc" ? "ascending" : "descending");
    th.querySelector(".sort-arrow").textContent = state.sort.dir === "asc" ? "▲" : "▼";
    applyFilters(true);
  });
});

function renderTransactionsPage() {
  const total = state.filteredTxns.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;
  const start = (state.page - 1) * state.pageSize;
  renderTransactionsTable(state.filteredTxns.slice(start, start + state.pageSize));
  document.getElementById("transactions-count").textContent = `${total} result${total === 1 ? "" : "s"}`;
  renderPagination(total, totalPages);
}
function renderPagination(total, totalPages) {
  const startIdx = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const endIdx = Math.min(state.page * state.pageSize, total);
  document.getElementById("pagination").innerHTML = `
    <span class="pagination-info">Showing ${startIdx}–${endIdx} of ${total}</span>
    <div class="pagination-controls">
      <select id="page-size-select" aria-label="Rows per page">
        ${[10, 25, 50].map((n) => `<option value="${n}" ${n === state.pageSize ? "selected" : ""}>${n} / page</option>`).join("")}
      </select>
      <button class="page-btn" id="prev-page" ${state.page <= 1 ? "disabled" : ""}>Prev</button>
      <span class="pagination-info">Page ${state.page} of ${totalPages}</span>
      <button class="page-btn" id="next-page" ${state.page >= totalPages ? "disabled" : ""}>Next</button>
    </div>`;
  document.getElementById("page-size-select").addEventListener("change", (e) => { state.pageSize = Number(e.target.value); state.page = 1; renderTransactionsPage(); });
  document.getElementById("prev-page").addEventListener("click", () => { if (state.page > 1) { state.page--; renderTransactionsPage(); } });
  document.getElementById("next-page").addEventListener("click", () => { if (state.page < totalPages) { state.page++; renderTransactionsPage(); } });
}
function renderTransactionsTable(rows) {
  const tbody = document.getElementById("transactions-table");
  tbody.innerHTML = rows.map((t) => {
    const meta = categoryMeta(t.category);
    const amountCls = amountClassFor(t);
    const tags = (t.tags || []).map((tag) => `<span class="tag-chip">${esc(tag)}</span>`).join("") || "—";
    return `
      <tr>
        <td><div class="cat-cell"><span class="cat-icon" style="background:${meta.bg};color:${meta.fg}">${svgIcon(meta.icon, 12)}</span>${esc(t.category)}</div></td>
        <td>${esc(t.merchant || "—")}</td>
        <td>${esc(t.description || "—")}</td>
        <td>${fmtDate(t.createdAt)}</td>
        <td class="amount-cell ${amountCls}">${money(t.amount)}</td>
        <td>
          <select class="status-pill ${t.status}" data-txn-id="${t._id}" aria-label="Change status">
            <option value="completed" ${t.status === "completed" ? "selected" : ""}>Completed</option>
            <option value="pending" ${t.status === "pending" ? "selected" : ""}>Pending</option>
            <option value="flagged" ${t.status === "flagged" ? "selected" : ""}>Flagged</option>
          </select>
        </td>
        <td>${tags}</td>
      </tr>`;
  }).join("") || `<tr><td colspan="7" class="empty-state">No transactions match these filters. Try clearing one.</td></tr>`;

  tbody.querySelectorAll(".status-pill").forEach((sel) => {
    const original = sel.value;
    sel.addEventListener("change", async () => {
      const id = sel.dataset.txnId;
      const newStatus = sel.value;
      try {
        await api(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
        const t = state.transactions.find((x) => x._id === id);
        if (t) t.status = newStatus;
        sel.className = `status-pill ${newStatus}`;
        toast("Status updated.", "success");
      } catch (err) {
        sel.value = original;
        toast(err.message, "error");
      }
    });
  });
}

// ---------- Customer Insights ----------
function customerStats(customerId) {
  const accts = state.accounts.filter((a) => a.customer && a.customer._id === customerId);
  const acctIds = new Set(accts.map((a) => a._id));
  const totalBalance = accts.reduce((s, a) => s + a.balance, 0);
  const txnCount = state.transactions.filter((t) => t.account && acctIds.has(t.account._id)).length;
  return { accounts: accts, totalBalance, txnCount };
}
function renderCustomersTable() {
  const tbody = document.getElementById("customers-table");
  tbody.innerHTML = state.customers.map((c) => {
    const s = customerStats(c._id);
    return `
      <tr>
        <td>${esc(c.name)}</td>
        <td>${esc(c.email)}<br/><span class="muted-text">${esc(c.phone)}</span></td>
        <td>${s.accounts.length}</td>
        <td class="amount-cell">${money(s.totalBalance)}</td>
        <td>${fmtDate(c.createdAt)}</td>
        <td>
          <button class="btn btn-secondary" data-view-customer="${c._id}">View</button>
          <button class="btn btn-secondary" data-del-customer="${c._id}" data-name="${esc(c.name)}">Delete</button>
        </td>
      </tr>`;
  }).join("") || `<tr><td colspan="6" class="empty-state">No customers yet. Add one to get started.</td></tr>`;

  tbody.querySelectorAll("[data-view-customer]").forEach((btn) => {
    btn.addEventListener("click", () => openCustomerDialog(btn.dataset.viewCustomer));
  });
  tbody.querySelectorAll("[data-del-customer]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await confirmAction({
        title: "Delete this customer?",
        message: `This permanently deletes ${btn.dataset.name} and cannot be undone. Customers with open accounts can't be deleted.`,
        confirmLabel: "Delete customer",
      });
      if (!ok) return;
      try {
        await api(`/customers/${btn.dataset.delCustomer}`, { method: "DELETE" });
        toast("Customer deleted.", "success");
        await refreshAll();
      } catch (e) {
        toast(e.message, "error");
      }
    });
  });
}
function openCustomerDialog(customerId) {
  const c = state.customers.find((x) => x._id === customerId);
  if (!c) return;
  const s = customerStats(customerId);
  const acctIds = new Set(s.accounts.map((a) => a._id));
  const recentTxns = state.transactions.filter((t) => t.account && acctIds.has(t.account._id)).slice(0, 8);

  document.getElementById("customer-dialog-title").textContent = c.name;
  document.getElementById("customer-dialog-body").innerHTML = `
    <p class="muted-text">${esc(c.email)} · ${esc(c.phone)}${c.address ? " · " + esc(c.address) : ""}</p>
    <h3 style="font-size:14px;color:var(--color-navy-900);margin:var(--space-4) 0 var(--space-2);">Accounts</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th scope="col">Account #</th><th scope="col">Type</th><th scope="col">Balance</th></tr></thead>
        <tbody>
          ${s.accounts.map((a) => `<tr><td>${esc(a.accountNumber)}</td><td>${esc(a.accountType)}</td><td class="amount-cell">${money(a.balance)}</td></tr>`).join("") || `<tr><td colspan="3" class="empty-state">No accounts.</td></tr>`}
        </tbody>
      </table>
    </div>
    <h3 style="font-size:14px;color:var(--color-navy-900);margin:var(--space-4) 0 var(--space-2);">Recent Transactions</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th scope="col">Date</th><th scope="col">Category</th><th scope="col">Amount</th><th scope="col">Status</th></tr></thead>
        <tbody>
          ${recentTxns.map((t) => {
            const amountCls = amountClassFor(t);
            return `<tr><td>${fmtDate(t.createdAt)}</td><td>${esc(t.category)}</td><td class="amount-cell ${amountCls}">${money(t.amount)}</td><td><span class="status-pill ${t.status}" style="pointer-events:none;">${esc(t.status)}</span></td></tr>`;
          }).join("") || `<tr><td colspan="4" class="empty-state">No transactions yet.</td></tr>`}
        </tbody>
      </table>
    </div>`;
  document.getElementById("customer-dialog").showModal();
}
document.getElementById("close-customer-dialog").addEventListener("click", () => document.getElementById("customer-dialog").close());
document.getElementById("customer-dialog").addEventListener("click", (e) => { if (e.target.id === "customer-dialog") e.currentTarget.close(); });

function renderCustomerBalanceChart() {
  const rows = state.customers
    .map((c) => ({ label: c.name, value: customerStats(c._id).totalBalance, color: "var(--color-navy-900)" }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  renderHBarChart("customer-balance-chart", rows, "No customer balances yet.");
}

// ---------- Reports & Export ----------
function reportPresetBounds(key) {
  const now = new Date();
  if (key === "7D") return { start: new Date(now.getTime() - 7 * 86400000), end: new Date(now.getTime() + 86400000) };
  if (key === "MONTH") return monthBounds(0);
  if (key === "YEAR") return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear() + 1, 0, 1) };
  return { start: new Date(0), end: new Date(now.getTime() + 86400000) };
}
function currentReportBounds() {
  const fromVal = document.getElementById("report-from").value;
  const toVal = document.getElementById("report-to").value;
  if (fromVal && toVal) {
    const start = new Date(fromVal);
    const end = new Date(toVal);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
  return reportPresetBounds(state.reportPreset);
}
function fmtRangeLabel(start, end) {
  const opts = { day: "2-digit", month: "short", year: "numeric" };
  return `${start.toLocaleDateString("en-IN", opts)} – ${new Date(end.getTime() - 86400000).toLocaleDateString("en-IN", opts)}`;
}
function getReportRangeTxns() {
  const { start, end } = currentReportBounds();
  return state.transactions.filter((t) => inRange(t.createdAt, start, end));
}
function renderReports() {
  const { start, end } = currentReportBounds();
  const inWindow = getReportRangeTxns();
  const deposits = inWindow.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
  const withdrawals = inWindow.filter((t) => t.type === "withdraw").reduce((s, t) => s + t.amount, 0);
  const transfers = inWindow.filter((t) => t.type === "transfer-out").reduce((s, t) => s + t.amount, 0);
  const net = deposits - withdrawals;

  renderKpiRow("report-kpi-row", [
    { label: "Total Deposits", value: money(deposits), iconBg: "var(--color-success-bg)", iconFg: "var(--color-success)", icon: svgIcon("arrowUp") },
    { label: "Total Withdrawals", value: money(withdrawals), iconBg: "var(--color-danger-bg)", iconFg: "var(--color-danger)", icon: svgIcon("arrowDown") },
    { label: "Total Transfers", value: money(transfers), iconBg: "var(--color-accent-bg)", iconFg: "var(--color-accent)", icon: svgIcon("exchange") },
    { label: "Net Flow", value: money(net), iconBg: "var(--color-accent-bg)", iconFg: "var(--color-accent)", icon: pulseIcon() },
    { label: "Transactions", value: String(inWindow.length), iconBg: "var(--color-surface-muted)", iconFg: "var(--color-navy-900)", icon: svgIcon("tag") },
  ]);

  const catTotals = {};
  inWindow.filter((t) => t.type === "withdraw" || t.type === "transfer-out").forEach((t) => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const rows = Object.entries(catTotals).map(([label, value]) => ({ label, value, color: "var(--color-navy-900)" })).sort((a, b) => b.value - a.value).slice(0, 10);
  renderHBarChart("category-chart", rows, "No spending recorded for this period.");
  document.getElementById("report-print-range").textContent = fmtRangeLabel(start, end);
}
document.getElementById("report-preset-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (!btn) return;
  document.querySelectorAll("#report-preset-toggle .seg-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  state.reportPreset = btn.dataset.range;
  document.getElementById("report-from").value = "";
  document.getElementById("report-to").value = "";
  renderReports();
});
["report-from", "report-to"].forEach((id) => document.getElementById(id).addEventListener("change", () => {
  const fromVal = document.getElementById("report-from").value;
  const toVal = document.getElementById("report-to").value;
  if (fromVal && toVal) document.querySelectorAll("#report-preset-toggle .seg-btn").forEach((b) => b.classList.remove("active"));
  renderReports();
}));

function toCsv(headers, rows) {
  const wrap = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.map(wrap).join(","), ...rows.map((r) => r.map(wrap).join(","))].join("\r\n");
}
function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
document.getElementById("export-transactions").addEventListener("click", () => {
  const rows = getReportRangeTxns().map((t) => [fmtDate(t.createdAt), t.account?.accountNumber, t.account?.customer?.name, t.category, t.merchant, t.description, t.amount, t.status, (t.tags || []).join("; ")]);
  downloadCsv("transactions.csv", toCsv(["Date", "Account", "Customer", "Category", "Merchant", "Description", "Amount", "Status", "Tags"], rows));
  toast("Transactions CSV downloaded.", "success");
});
document.getElementById("export-accounts").addEventListener("click", () => {
  const rows = state.accounts.map((a) => [a.accountNumber, a.customer?.name, a.accountType, a.balance, a.status]);
  downloadCsv("accounts.csv", toCsv(["Account Number", "Customer", "Type", "Balance", "Status"], rows));
  toast("Accounts CSV downloaded.", "success");
});
document.getElementById("export-customers").addEventListener("click", () => {
  const rows = state.customers.map((c) => [c.name, c.email, c.phone, c.address, c.status, fmtDate(c.createdAt)]);
  downloadCsv("customers.csv", toCsv(["Name", "Email", "Phone", "Address", "Status", "Joined"], rows));
  toast("Customers CSV downloaded.", "success");
});
document.getElementById("export-pdf").addEventListener("click", () => window.print());

// ---------- New Transaction dialog ----------
const txnDialog = document.getElementById("txn-dialog");
function switchDialogStep(step) {
  document.querySelectorAll(".dialog-step").forEach((el) => { el.hidden = el.dataset.step !== step; });
}
function setOpType(op) {
  state.txnOp = op;
  document.querySelectorAll("#op-type-toggle .seg-btn").forEach((b) => {
    const active = b.dataset.op === op;
    b.classList.toggle("active", active);
    b.setAttribute("aria-checked", String(active));
  });
  document.getElementById("field-to-account").hidden = op !== "transfer";
  document.getElementById("field-merchant").hidden = op === "transfer";
  document.querySelector('#field-account label').textContent = op === "transfer" ? "From account" : "Account";
  // Point the category autocomplete at the datalist for this operation only,
  // so it can never suggest "Withdrawal" while Deposit is selected (or vice
  // versa) — the mix-up that caused a real deposit to end up mislabeled.
  document.getElementById("txn-category").setAttribute("list", `category-list-${op}`);
  ["txn-account", "txn-to-account", "txn-amount"].forEach(clearFieldError);
}
document.getElementById("op-type-toggle").addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-btn");
  if (btn) setOpType(btn.dataset.op);
});
function openTxnDialog() {
  setOpType("deposit");
  switchDialogStep("form");
  txnDialog.showModal();
}
function closeTxnDialog() { txnDialog.close(); }
document.getElementById("open-txn-dialog").addEventListener("click", openTxnDialog);
document.getElementById("close-txn-dialog").addEventListener("click", closeTxnDialog);
txnDialog.addEventListener("click", (e) => { if (e.target === txnDialog) closeTxnDialog(); });
txnDialog.addEventListener("close", () => {
  document.getElementById("txn-dialog-form").reset();
  setOpType("deposit");
  switchDialogStep("form");
});

function validateTxnForm() {
  let ok = true;
  ["txn-account", "txn-to-account", "txn-amount"].forEach(clearFieldError);
  const op = state.txnOp;
  const accountId = document.getElementById("txn-account").value;
  if (!accountId) { setFieldError("txn-account", "Choose an account."); ok = false; }
  let toAccountId = null;
  if (op === "transfer") {
    toAccountId = document.getElementById("txn-to-account").value;
    if (!toAccountId) { setFieldError("txn-to-account", "Choose a destination account."); ok = false; }
    else if (toAccountId === accountId) { setFieldError("txn-to-account", "Choose a different account than the source."); ok = false; }
  }
  const amount = Number(document.getElementById("txn-amount").value);
  if (!amount || amount <= 0) { setFieldError("txn-amount", "Enter an amount greater than zero."); ok = false; }
  else if (op !== "deposit" && accountId) {
    const acct = state.accounts.find((a) => a._id === accountId);
    if (acct && amount > acct.balance) { setFieldError("txn-amount", `Amount exceeds the available balance of ${money(acct.balance)}.`); ok = false; }
  }
  return ok ? { accountId, toAccountId, amount } : null;
}
function renderConfirmStep(payload) {
  const op = state.txnOp;
  const acct = state.accounts.find((a) => a._id === payload.accountId);
  const toAcct = payload.toAccountId ? state.accounts.find((a) => a._id === payload.toAccountId) : null;
  const category = document.getElementById("txn-category").value || (op === "deposit" ? "Deposit" : op === "withdraw" ? "Withdrawal" : "Transfer");
  const note = document.getElementById("txn-note").value;
  const rows = [
    ["Type", op === "deposit" ? "Deposit" : op === "withdraw" ? "Withdrawal" : "Transfer"],
    [op === "transfer" ? "From account" : "Account", acct ? `${acct.accountNumber} — ${acct.customer?.name || ""}` : "—"],
  ];
  if (toAcct) rows.push(["To account", `${toAcct.accountNumber} — ${toAcct.customer?.name || ""}`]);
  rows.push(["Amount", money(payload.amount)]);
  rows.push(["Category", category]);
  if (note) rows.push(["Note", note]);
  document.getElementById("confirm-summary").innerHTML = `<dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;

  const warningEl = document.getElementById("confirm-warning");
  if (op === "withdraw") {
    warningEl.hidden = false;
    warningEl.textContent = `This will withdraw ${money(payload.amount)} from ${acct?.accountNumber || "this account"}. This action cannot be undone.`;
  } else if (op === "transfer") {
    warningEl.hidden = false;
    warningEl.textContent = `This will move ${money(payload.amount)} out of ${acct?.accountNumber || "the source account"}. This action cannot be undone.`;
  } else {
    warningEl.hidden = true;
  }
}
document.getElementById("txn-review-btn").addEventListener("click", () => {
  const payload = validateTxnForm();
  if (!payload) return;
  state.txnPayload = payload;
  renderConfirmStep(payload);
  switchDialogStep("confirm");
});
document.getElementById("txn-back-btn").addEventListener("click", () => switchDialogStep("form"));

function submitTxn(op, payload) {
  const category = document.getElementById("txn-category").value;
  const merchant = document.getElementById("txn-merchant").value;
  const note = document.getElementById("txn-note").value;
  const tags = document.getElementById("txn-tags").value;
  if (op === "deposit") return api("/transactions/deposit", { method: "POST", body: JSON.stringify({ accountId: payload.accountId, amount: payload.amount, category, merchant, description: note, tags }) });
  if (op === "withdraw") return api("/transactions/withdraw", { method: "POST", body: JSON.stringify({ accountId: payload.accountId, amount: payload.amount, category, merchant, description: note, tags }) });
  return api("/transactions/transfer", { method: "POST", body: JSON.stringify({ fromAccountId: payload.accountId, toAccountId: payload.toAccountId, amount: payload.amount, category, description: note, tags }) });
}
function renderResultStep(success, op, detailOrMessage) {
  const body = document.getElementById("txn-result-body");
  const retryBtn = document.getElementById("txn-retry-btn");
  if (success) {
    body.innerHTML = `
      <div class="result-success">
        <div class="result-icon success" aria-hidden="true">✓</div>
        <p class="result-title">Transaction recorded successfully</p>
        <p class="result-detail">${esc(detailOrMessage)}</p>
      </div>`;
    retryBtn.hidden = true;
  } else {
    body.innerHTML = `
      <div class="result-success">
        <div class="result-icon error" aria-hidden="true">!</div>
        <p class="result-title">We couldn't complete this transaction</p>
        <p class="result-detail">${esc(detailOrMessage)}</p>
      </div>`;
    retryBtn.hidden = false;
  }
}
document.getElementById("txn-confirm-btn").addEventListener("click", async () => {
  const btn = document.getElementById("txn-confirm-btn");
  const backBtn = document.getElementById("txn-back-btn");
  btn.disabled = true; backBtn.disabled = true;
  const original = btn.textContent; btn.textContent = "Processing…";
  try {
    const result = await submitTxn(state.txnOp, state.txnPayload);
    await refreshAll(true);
    const detail = state.txnOp === "transfer"
      ? `New balance — ${result.fromAccount.accountNumber}: ${money(result.fromAccount.balance)}`
      : `New balance — ${result.account.accountNumber}: ${money(result.account.balance)}`;
    renderResultStep(true, state.txnOp, detail);
    toast("Transaction recorded successfully.", "success");
  } catch (err) {
    renderResultStep(false, state.txnOp, err.message);
  } finally {
    btn.disabled = false; backBtn.disabled = false; btn.textContent = original;
    switchDialogStep("result");
  }
});
document.getElementById("txn-retry-btn").addEventListener("click", () => switchDialogStep("form"));
document.getElementById("txn-done-btn").addEventListener("click", closeTxnDialog);

// ---------- Customer / Account forms ----------
function validateCustomerForm() {
  let ok = true;
  ["c-name", "c-email", "c-phone"].forEach(clearFieldError);
  const name = document.getElementById("c-name").value.trim();
  const email = document.getElementById("c-email").value.trim();
  const phone = document.getElementById("c-phone").value.trim();
  if (!name) { setFieldError("c-name", "Enter the customer's full name."); ok = false; }
  if (!email) { setFieldError("c-email", "Enter an email address."); ok = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError("c-email", "Enter a valid email address."); ok = false; }
  if (!phone) { setFieldError("c-phone", "Enter a phone number."); ok = false; }
  return ok;
}
document.getElementById("customer-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateCustomerForm()) return;
  try {
    await api("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("c-name").value,
        email: document.getElementById("c-email").value,
        phone: document.getElementById("c-phone").value,
        address: document.getElementById("c-address").value,
        dob: document.getElementById("c-dob").value || undefined,
      }),
    });
    e.target.reset();
    toast("Customer created.", "success");
    await refreshAll();
  } catch (err) {
    toast(err.message, "error");
  }
});
document.getElementById("account-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/accounts", {
      method: "POST",
      body: JSON.stringify({
        customer: document.getElementById("a-customer").value,
        accountType: document.getElementById("a-type").value,
        openingBalance: document.getElementById("a-balance").value,
      }),
    });
    e.target.reset();
    document.getElementById("account-form").hidden = true;
    document.getElementById("toggle-account-form").setAttribute("aria-expanded", "false");
    toast("Account opened.", "success");
    await refreshAll();
  } catch (err) {
    toast(err.message, "error");
  }
});

// ---------- Init ----------
function renderInitialSkeletons() {
  skeletonKpiRow("kpi-row", 5);
  skeletonChart("cashflow-chart");
  skeletonRows("dashboard-recent", 5, 3);
  skeletonRows("accounts-table", 5, 3);
  skeletonRows("transactions-table", 7, 5);
  skeletonRows("customers-table", 6, 3);
  skeletonChart("customer-balance-chart");
  skeletonKpiRow("report-kpi-row", 5);
  skeletonChart("category-chart");
}
async function init() {
  renderInitialSkeletons();
  try {
    await refreshAll(true);
  } catch (err) {
    toast("Couldn't load data from the server. Check your connection and reload.", "error");
  }
}
init();
