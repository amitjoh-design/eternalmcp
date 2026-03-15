// Data Summary MCP — Handler
// Generates a full interactive BI dashboard HTML file from CSV data

import { createClient } from '@supabase/supabase-js'
import { CHART_JS } from './vendor/chart'
import { PAPA_PARSE } from './vendor/papaparse'

const DEMO_CSV = `Date,Description,Category,Type,Amount
2024-01-05,Salary Credit,Salary,Income,85000
2024-01-10,Freelance Payment,Freelance,Income,25000
2024-01-12,Rent Payment,Housing,Expense,18000
2024-01-14,Grocery Store,Food,Expense,4500
2024-01-15,Electricity Bill,Utilities,Expense,2200
2024-01-18,Netflix,Entertainment,Expense,649
2024-01-20,Restaurant Dinner,Food,Expense,1800
2024-01-22,Medical Insurance,Healthcare,Expense,3500
2024-01-25,Dividend Income,Investment,Income,8000
2024-01-28,Petrol,Transport,Expense,2100
2024-02-05,Salary Credit,Salary,Income,85000
2024-02-08,Online Course,Education,Expense,4999
2024-02-10,Consulting Fee,Freelance,Income,30000
2024-02-12,Rent Payment,Housing,Expense,18000
2024-02-15,Grocery Store,Food,Expense,5200
2024-02-17,Electricity Bill,Utilities,Expense,1900
2024-02-20,Movie Tickets,Entertainment,Expense,1200
2024-02-22,Gym Membership,Healthcare,Expense,2000
2024-02-25,Dividend Income,Investment,Income,8000
2024-02-28,Cab Rides,Transport,Expense,1600
2024-03-05,Salary Credit,Salary,Income,85000
2024-03-09,Bonus,Salary,Income,20000
2024-03-12,Rent Payment,Housing,Expense,18000
2024-03-14,Grocery Store,Food,Expense,4800
2024-03-16,Internet Bill,Utilities,Expense,999
2024-03-18,Electricity Bill,Utilities,Expense,2400
2024-03-20,Freelance Payment,Freelance,Income,15000
2024-03-22,Doctor Visit,Healthcare,Expense,1500
2024-03-25,Investment SIP,Investment,Expense,10000
2024-03-28,Petrol,Transport,Expense,1800`

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function generateDashboardHtml(csvData: string, title: string): string {
  const escapedCsv = JSON.stringify(csvData)
  const escapedTitle = JSON.stringify(title)

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<script>${CHART_JS}<\/script>
<script>${PAPA_PARSE}<\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#0f1117;--bg2:#161b27;--bg3:#1e2538;--border:#2a3148;
  --text:#e8eaf6;--muted:#8892b0;--primary:#6366f1;
  --income:#10b981;--expense:#f43f5e;--accent:#f59e0b;--purple:#a855f7;
  --blue:#3b82f6;--cyan:#06b6d4;
}
html{scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden}
::-webkit-scrollbar{width:6px;height:6px}
::-webkit-scrollbar-track{background:var(--bg2)}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}

/* NAV */
.nav{position:sticky;top:0;z-index:100;background:rgba(15,17,23,0.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:0 24px;display:flex;align-items:center;gap:24px;height:60px}
.nav-logo{font-weight:800;font-size:1.1rem;background:linear-gradient(135deg,var(--primary),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap}
.nav-title{font-size:.85rem;color:var(--muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nav-tabs{display:flex;gap:4px;background:var(--bg2);border-radius:10px;padding:4px}
.tab-btn{padding:6px 16px;border-radius:7px;border:none;background:transparent;color:var(--muted);font-family:'Plus Jakarta Sans',sans-serif;font-size:.8rem;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
.tab-btn.active{background:var(--primary);color:#fff}
.upload-btn{padding:6px 14px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:'Plus Jakarta Sans',sans-serif;font-size:.78rem;cursor:pointer;transition:all .2s;white-space:nowrap}
.upload-btn:hover{border-color:var(--primary);color:var(--primary)}

/* PAGES */
.page{display:none;padding:24px;max-width:1400px;margin:0 auto}
.page.active{display:block;animation:fadeUp .4s ease}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}

/* KPI CARDS */
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
.kpi-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.kpi-card.income::before{background:linear-gradient(90deg,var(--income),var(--cyan))}
.kpi-card.expense::before{background:linear-gradient(90deg,var(--expense),var(--accent))}
.kpi-card.net::before{background:linear-gradient(90deg,var(--primary),var(--purple))}
.kpi-card.rate::before{background:linear-gradient(90deg,var(--accent),var(--income))}
.kpi-card:hover{transform:translateY(-2px);border-color:var(--primary)}
.kpi-label{font-size:.72rem;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.kpi-value{font-family:'DM Mono',monospace;font-size:1.7rem;font-weight:700;line-height:1}
.kpi-value.income{color:var(--income)}
.kpi-value.expense{color:var(--expense)}
.kpi-value.net{background:linear-gradient(135deg,var(--primary),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.kpi-value.rate{color:var(--accent)}
.kpi-sub{font-size:.72rem;color:var(--muted);margin-top:6px}

/* FILTERS */
.filter-bar{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:24px;display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.filter-label{font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}
.filter-chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{padding:4px 12px;border-radius:20px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:'Plus Jakarta Sans',sans-serif;font-size:.75rem;cursor:pointer;transition:all .15s}
.chip.active{background:var(--primary);border-color:var(--primary);color:#fff}
.chip.income-chip.active{background:var(--income);border-color:var(--income);color:#fff}
.chip.expense-chip.active{background:var(--expense);border-color:var(--expense);color:#fff}
.date-inputs{display:flex;gap:6px;align-items:center}
.date-inputs input{padding:5px 10px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;font-size:.75rem}
.reset-btn{margin-left:auto;padding:5px 14px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:'Plus Jakarta Sans',sans-serif;font-size:.75rem;cursor:pointer;transition:all .2s}
.reset-btn:hover{border-color:var(--expense);color:var(--expense)}
.search-input{padding:5px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg3);color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;font-size:.75rem;width:180px}

/* SECTIONS */
.section{margin-bottom:32px}
.section-header{display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-left:14px;border-left:4px solid var(--income)}
.section-header.expense-header{border-color:var(--expense)}
.section-title{font-size:1.1rem;font-weight:800}
.section-total{font-family:'DM Mono',monospace;font-size:.9rem;font-weight:600;padding:4px 12px;border-radius:8px;background:rgba(16,185,129,.12);color:var(--income)}
.section-total.expense-total{background:rgba(244,63,94,.12);color:var(--expense)}

/* CHARTS GRID */
.charts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px}
.chart-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px}
.chart-title{font-size:.8rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px}
.chart-wrap{position:relative;height:220px}
.chart-wrap.tall{height:280px}

/* SUB-CATEGORY GRID */
.sub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:16px}
.sub-card{background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:14px;cursor:pointer;transition:all .15s}
.sub-card:hover{border-color:var(--primary);transform:translateY(-1px)}
.sub-name{font-size:.75rem;font-weight:600;color:var(--muted);margin-bottom:4px}
.sub-amount{font-family:'DM Mono',monospace;font-size:1rem;font-weight:700}
.sub-pct{font-size:.68rem;color:var(--muted);margin-top:2px}

/* DATA TABLE */
.table-wrap{background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-top:24px}
.table-header{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
.table-header-title{font-size:.8rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
table{width:100%;border-collapse:collapse}
th{padding:10px 16px;text-align:left;font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--border);background:var(--bg3)}
td{padding:10px 16px;font-size:.82rem;border-bottom:1px solid rgba(42,49,72,.5)}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--bg3)}
.badge{display:inline-flex;padding:2px 8px;border-radius:6px;font-size:.68rem;font-weight:700}
.badge.income{background:rgba(16,185,129,.15);color:var(--income)}
.badge.expense{background:rgba(244,63,94,.15);color:var(--expense)}
.amount-cell{font-family:'DM Mono',monospace;font-weight:600}

/* SCENARIO PLANNER */
.scenario-layout{display:grid;grid-template-columns:340px 1fr;gap:24px}
@media(max-width:900px){.scenario-layout{grid-template-columns:1fr}}
.scenario-controls{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px}
.scenario-title{font-size:.9rem;font-weight:800;margin-bottom:4px}
.scenario-subtitle{font-size:.75rem;color:var(--muted);margin-bottom:20px}
.slider-group{margin-bottom:18px}
.slider-label{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.slider-name{font-size:.78rem;font-weight:600}
.slider-pct{font-family:'DM Mono',monospace;font-size:.78rem;color:var(--accent);font-weight:600}
input[type=range]{width:100%;-webkit-appearance:none;height:4px;border-radius:2px;background:var(--border);outline:none}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--primary);cursor:pointer;transition:transform .1s}
input[type=range]::-webkit-slider-thumb:hover{transform:scale(1.2)}
.scenario-btns{display:flex;gap:8px;margin-top:20px}
.btn-primary{flex:1;padding:8px;border-radius:8px;border:none;background:var(--primary);color:#fff;font-family:'Plus Jakarta Sans',sans-serif;font-size:.78rem;font-weight:700;cursor:pointer;transition:all .2s}
.btn-primary:hover{opacity:.85}
.btn-ghost{flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-family:'Plus Jakarta Sans',sans-serif;font-size:.78rem;cursor:pointer;transition:all .2s}
.btn-ghost:hover{border-color:var(--muted);color:var(--text)}
.impact-box{background:linear-gradient(135deg,rgba(99,102,241,.12),rgba(168,85,247,.12));border:1px solid rgba(99,102,241,.3);border-radius:10px;padding:14px;margin-top:16px}
.impact-title{font-size:.72rem;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.impact-text{font-size:.8rem;color:var(--text);line-height:1.6}
.scenario-right{display:flex;flex-direction:column;gap:16px}
.comparison-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.comparison-card{background:var(--bg2);border:1px solid var(--border);border-radius:14px;padding:20px}
.comparison-card-title{font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;display:flex;align-items:center;gap:6px}
.dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.dot.baseline{background:var(--blue)}
.dot.adjusted{background:var(--income)}
.comp-value{font-family:'DM Mono',monospace;font-size:1.6rem;font-weight:700}
.comp-label{font-size:.75rem;color:var(--muted);margin-top:4px}
.delta-positive{color:var(--income)}
.delta-negative{color:var(--expense)}
.summary-table-wrap{background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden}

/* UPLOAD OVERLAY */
.upload-overlay{display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);align-items:center;justify-content:center}
.upload-overlay.show{display:flex}
.upload-modal{background:var(--bg2);border:1px solid var(--border);border-radius:16px;padding:32px;width:560px;max-width:90vw}
.upload-modal h3{font-size:1.1rem;font-weight:800;margin-bottom:8px}
.upload-modal p{font-size:.8rem;color:var(--muted);margin-bottom:20px}
textarea.csv-input{width:100%;height:200px;background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--text);font-family:'DM Mono',monospace;font-size:.78rem;resize:vertical}
.upload-actions{display:flex;gap:10px;margin-top:16px}
.file-label{flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:.78rem;cursor:pointer;text-align:center;transition:all .2s;display:flex;align-items:center;justify-content:center}
.file-label:hover{border-color:var(--primary);color:var(--primary)}
#file-input{display:none}
.close-overlay{position:absolute;top:16px;right:16px;background:transparent;border:none;color:var(--muted);font-size:1.2rem;cursor:pointer}

.empty-state{text-align:center;padding:60px 20px;color:var(--muted)}
.empty-state-icon{font-size:3rem;margin-bottom:12px}
.empty-state h3{font-size:1rem;font-weight:700;margin-bottom:6px;color:var(--text)}

@media(max-width:640px){
  .charts-grid{grid-template-columns:1fr}
  .kpi-grid{grid-template-columns:repeat(2,1fr)}
  .nav{gap:12px;padding:0 12px}
  .nav-title{display:none}
}
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <div class="nav-logo">📊 EternalMCP</div>
  <div class="nav-title" id="dash-title">Loading...</div>
  <div class="nav-tabs">
    <button class="tab-btn active" onclick="showPage('analysis')">Analysis</button>
    <button class="tab-btn" onclick="showPage('scenario')">Scenario Planner</button>
  </div>
  <button class="upload-btn" onclick="showUpload()">⬆ Upload CSV</button>
</nav>

<!-- UPLOAD OVERLAY -->
<div class="upload-overlay" id="upload-overlay">
  <div class="upload-modal" style="position:relative">
    <button class="close-overlay" onclick="hideUpload()">✕</button>
    <h3>Upload Your Data</h3>
    <p>Paste CSV text below, or click "Choose File" to upload a .csv file. The dashboard rebuilds instantly.</p>
    <textarea class="csv-input" id="csv-paste" placeholder="Date,Category,Type,Amount&#10;2024-01-01,Salary,Income,85000&#10;..."></textarea>
    <div class="upload-actions">
      <label class="file-label" for="file-input">📁 Choose File</label>
      <input type="file" id="file-input" accept=".csv,.txt" onchange="handleFile(event)"/>
      <button class="btn-primary" onclick="loadFromPaste()">Build Dashboard</button>
      <button class="btn-ghost" onclick="hideUpload()">Cancel</button>
    </div>
  </div>
</div>

<!-- ANALYSIS PAGE -->
<div class="page active" id="page-analysis">
  <div class="kpi-grid" id="kpi-grid"></div>
  <div class="filter-bar" id="filter-bar"></div>
  <div id="sections-container"></div>
  <div class="table-wrap" id="table-wrap">
    <div class="table-header"><span class="table-header-title">All Transactions</span><span id="row-count" style="font-size:.75rem;color:var(--muted)"></span></div>
    <div style="overflow-x:auto"><table id="data-table"><thead><tr id="table-head"></tr></thead><tbody id="table-body"></tbody></table></div>
  </div>
</div>

<!-- SCENARIO PAGE -->
<div class="page" id="page-scenario">
  <div class="scenario-layout">
    <div>
      <div class="scenario-controls">
        <div class="scenario-title">What-If Scenario Planner</div>
        <div class="scenario-subtitle">Adjust category amounts and see the impact instantly.</div>
        <div id="sliders-container"></div>
        <div class="impact-box" id="impact-box">
          <div class="impact-title">Impact Summary</div>
          <div class="impact-text" id="impact-text">Move sliders to see impact.</div>
        </div>
        <div class="scenario-btns">
          <button class="btn-primary" onclick="applyScenario()">Apply</button>
          <button class="btn-ghost" onclick="resetScenario()">Reset</button>
        </div>
      </div>
    </div>
    <div class="scenario-right">
      <div class="comparison-grid">
        <div class="comparison-card">
          <div class="comparison-card-title"><span class="dot baseline"></span> Baseline</div>
          <div class="comp-value" id="baseline-total">—</div>
          <div class="comp-label">Net Balance</div>
        </div>
        <div class="comparison-card">
          <div class="comparison-card-title"><span class="dot adjusted"></span> Adjusted</div>
          <div class="comp-value delta-positive" id="adjusted-total">—</div>
          <div class="comp-label">Net Balance</div>
        </div>
      </div>
      <div class="chart-card">
        <div class="chart-title">Before vs After — by Category</div>
        <div class="chart-wrap tall"><canvas id="scenario-bar-chart"></canvas></div>
      </div>
      <div class="summary-table-wrap">
        <div class="table-header"><span class="table-header-title">Scenario Summary</span></div>
        <div style="overflow-x:auto"><table><thead><tr><th>Category</th><th>Baseline</th><th>Adjusted</th><th>Delta</th><th>% Change</th></tr></thead><tbody id="scenario-tbody"></tbody></table></div>
      </div>
    </div>
  </div>
</div>

<script>
// ─── STATE ──────────────────────────────────────────────────────────────────
var RAW_CSV = ${escapedCsv};
var TITLE   = ${escapedTitle};
var allRows = [];
var filteredRows = [];
var charts = {};
var activeFilters = { type: 'all', category: 'all', search: '', dateFrom: '', dateTo: '' };
var sliderValues = {};
var scenarioChart = null;

// ─── BOOT ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('dash-title').textContent = TITLE;
  loadCSV(RAW_CSV);
});

function showPage(name) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('page-' + name).classList.add('active');
  event.target.classList.add('active');
  if (name === 'scenario') buildScenarioPage();
}

function showUpload() { document.getElementById('upload-overlay').classList.add('show'); }
function hideUpload() { document.getElementById('upload-overlay').classList.remove('show'); }

function handleFile(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) { document.getElementById('csv-paste').value = ev.target.result; };
  reader.readAsText(file);
}

function loadFromPaste() {
  var csv = document.getElementById('csv-paste').value.trim();
  if (!csv) return;
  RAW_CSV = csv;
  hideUpload();
  loadCSV(csv);
}

// ─── PARSE + DETECT ──────────────────────────────────────────────────────────
function loadCSV(csv) {
  var result = Papa.parse(csv.trim(), { header: true, skipEmptyLines: true, dynamicTyping: true });
  allRows = result.data.filter(function(r) { return Object.values(r).some(function(v) { return v !== null && v !== ''; }); });
  filteredRows = allRows.slice();
  buildAll();
}

function detectTypeCol(headers) {
  var candidates = ['type','Type','TYPE','kind','Kind'];
  for (var i = 0; i < candidates.length; i++) { if (headers.indexOf(candidates[i]) >= 0) return candidates[i]; }
  return null;
}

function detectAmountCol(headers) {
  var candidates = ['amount','Amount','AMOUNT','value','Value','total','Total','price','Price'];
  for (var i = 0; i < candidates.length; i++) { if (headers.indexOf(candidates[i]) >= 0) return candidates[i]; }
  for (var i = 0; i < headers.length; i++) { if (allRows.length > 0 && typeof allRows[0][headers[i]] === 'number') return headers[i]; }
  return null;
}

function detectDateCol(headers) {
  var candidates = ['date','Date','DATE','datetime','Datetime','time','Time'];
  for (var i = 0; i < candidates.length; i++) { if (headers.indexOf(candidates[i]) >= 0) return candidates[i]; }
  return null;
}

function detectCategoryCol(headers) {
  var candidates = ['category','Category','CATEGORY','type','Type','group','Group','tag','Tag'];
  for (var i = 0; i < candidates.length; i++) {
    if (headers.indexOf(candidates[i]) >= 0) {
      var col = candidates[i];
      var uniq = Array.from(new Set(allRows.map(function(r) { return r[col]; })));
      if (uniq.length >= 2 && uniq.length <= 30) return col;
    }
  }
  return null;
}

var COLS = {};

function detectColumns() {
  if (allRows.length === 0) return;
  var headers = Object.keys(allRows[0]);
  COLS.type = detectTypeCol(headers);
  COLS.amount = detectAmountCol(headers);
  COLS.date = detectDateCol(headers);
  COLS.category = detectCategoryCol(headers);
  COLS.headers = headers;
}

// ─── FORMAT ──────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (Math.abs(n) >= 100000) return '₹' + (n/100000).toFixed(1) + 'L';
  if (Math.abs(n) >= 1000) return '₹' + n.toLocaleString('en-IN');
  return '₹' + n.toFixed(0);
}

function fmtRaw(n) { return n !== null && !isNaN(n) ? n.toLocaleString('en-IN') : '—'; }

// ─── BUILD ALL ───────────────────────────────────────────────────────────────
function buildAll() {
  detectColumns();
  buildKPIs();
  buildFilters();
  buildSections();
  buildTable();
}

function applyFilters() {
  filteredRows = allRows.filter(function(r) {
    if (activeFilters.type !== 'all' && COLS.type) {
      if (String(r[COLS.type]).toLowerCase() !== activeFilters.type.toLowerCase()) return false;
    }
    if (activeFilters.category !== 'all' && COLS.category) {
      if (String(r[COLS.category]) !== activeFilters.category) return false;
    }
    if (activeFilters.search) {
      var s = activeFilters.search.toLowerCase();
      var match = Object.values(r).some(function(v) { return String(v).toLowerCase().indexOf(s) >= 0; });
      if (!match) return false;
    }
    if (activeFilters.dateFrom && COLS.date) {
      if (r[COLS.date] < activeFilters.dateFrom) return false;
    }
    if (activeFilters.dateTo && COLS.date) {
      if (r[COLS.date] > activeFilters.dateTo) return false;
    }
    return true;
  });
  buildKPIs();
  buildSections();
  buildTable();
}

// ─── KPI CARDS ───────────────────────────────────────────────────────────────
function buildKPIs() {
  var el = document.getElementById('kpi-grid');
  var rows = filteredRows;
  var totalIncome = 0, totalExpense = 0, count = rows.length;
  if (COLS.type && COLS.amount) {
    rows.forEach(function(r) {
      var t = String(r[COLS.type]).toLowerCase();
      var a = parseFloat(r[COLS.amount]) || 0;
      if (t === 'income') totalIncome += a;
      else if (t === 'expense') totalExpense += a;
    });
  } else if (COLS.amount) {
    rows.forEach(function(r) { totalIncome += parseFloat(r[COLS.amount]) || 0; });
  }
  var net = totalIncome - totalExpense;
  var savingsRate = totalIncome > 0 ? ((net / totalIncome) * 100).toFixed(1) : 0;
  var kpis = [];
  if (COLS.type) {
    kpis = [
      { label: 'Total Income', value: fmt(totalIncome), cls: 'income', sub: count + ' transactions' },
      { label: 'Total Expenses', value: fmt(totalExpense), cls: 'expense', sub: 'from ' + rows.filter(function(r) { return String(r[COLS.type]).toLowerCase() === 'expense'; }).length + ' items' },
      { label: 'Net Balance', value: fmt(net), cls: 'net', sub: net >= 0 ? 'Surplus' : 'Deficit' },
      { label: 'Savings Rate', value: savingsRate + '%', cls: 'rate', sub: 'of total income' },
    ];
  } else if (COLS.amount) {
    var amounts = rows.map(function(r) { return parseFloat(r[COLS.amount]) || 0; });
    var sum = amounts.reduce(function(a,b) { return a+b; }, 0);
    var avg = amounts.length ? sum / amounts.length : 0;
    var max = Math.max.apply(null, amounts);
    var min = Math.min.apply(null, amounts);
    kpis = [
      { label: 'Total', value: fmt(sum), cls: 'income', sub: count + ' records' },
      { label: 'Average', value: fmt(avg), cls: 'net', sub: 'per record' },
      { label: 'Maximum', value: fmt(max), cls: 'rate', sub: 'single record' },
      { label: 'Count', value: count.toString(), cls: 'expense', sub: 'total records' },
    ];
  } else {
    kpis = [{ label: 'Total Records', value: count.toString(), cls: 'net', sub: 'rows loaded' }];
  }
  el.innerHTML = kpis.map(function(k) {
    return '<div class="kpi-card ' + k.cls + '" onclick="kpiDrilldown(this)">'
         + '<div class="kpi-label">' + k.label + '</div>'
         + '<div class="kpi-value ' + k.cls + '">' + k.value + '</div>'
         + '<div class="kpi-sub">' + k.sub + '</div></div>';
  }).join('');
}

function kpiDrilldown(el) {
  el.style.transform = 'scale(0.97)';
  setTimeout(function() { el.style.transform = ''; }, 200);
}

// ─── FILTERS ─────────────────────────────────────────────────────────────────
function buildFilters() {
  var el = document.getElementById('filter-bar');
  var html = '';
  if (COLS.type) {
    var typeVals = Array.from(new Set(allRows.map(function(r) { return r[COLS.type]; }))).filter(Boolean);
    html += '<div><div class="filter-label">Type</div><div class="filter-chips">';
    html += '<button class="chip active" data-filter="type" data-val="all">All</button>';
    typeVals.forEach(function(t) {
      var cls = String(t).toLowerCase() === 'income' ? 'income-chip' : String(t).toLowerCase() === 'expense' ? 'expense-chip' : '';
      html += '<button class="chip ' + cls + '" data-filter="type" data-val="' + t + '">' + t + '</button>';
    });
    html += '</div></div>';
  }
  if (COLS.date) {
    var dates = allRows.map(function(r) { return r[COLS.date]; }).filter(Boolean).sort();
    var minD = dates[0] || '';
    var maxD = dates[dates.length-1] || '';
    html += '<div><div class="filter-label">Date Range</div>'
          + '<div class="date-inputs">'
          + '<input type="date" id="f-from" value="' + minD + '" onchange="setDateFilter()">'
          + '<span style="color:var(--muted);font-size:.75rem">to</span>'
          + '<input type="date" id="f-to" value="' + maxD + '" onchange="setDateFilter()">'
          + '</div></div>';
  }
  html += '<input class="search-input" placeholder="Search..." oninput="setSearch(this.value)">';
  html += '<button class="reset-btn" onclick="resetFilters()">Reset All</button>';
  el.innerHTML = html;
  // Wire chip clicks via event delegation (avoids inline string quoting issues)
  el.querySelectorAll('[data-filter]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var fKey = btn.getAttribute('data-filter');
      var fVal = btn.getAttribute('data-val');
      setFilter(fKey, fVal, btn);
    });
  });
}

function setFilter(fType, val, btn) {
  activeFilters[fType] = val;
  btn.closest('.filter-chips').querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
  btn.classList.add('active');
  applyFilters();
}

function setDateFilter() {
  activeFilters.dateFrom = document.getElementById('f-from').value;
  activeFilters.dateTo = document.getElementById('f-to').value;
  applyFilters();
}

function setSearch(val) {
  activeFilters.search = val;
  applyFilters();
}

function resetFilters() {
  activeFilters = { type: 'all', category: 'all', search: '', dateFrom: '', dateTo: '' };
  buildFilters();
  filteredRows = allRows.slice();
  buildKPIs();
  buildSections();
  buildTable();
}

// ─── SECTIONS ────────────────────────────────────────────────────────────────
function getSectionData() {
  if (!COLS.type || !COLS.amount) return null;
  var groups = {};
  filteredRows.forEach(function(r) {
    var t = String(r[COLS.type]);
    if (!groups[t]) groups[t] = [];
    groups[t].push(r);
  });
  return groups;
}

function buildSections() {
  var container = document.getElementById('sections-container');
  Object.values(charts).forEach(function(c) { if (c && c.destroy) c.destroy(); });
  charts = {};

  var groups = getSectionData();
  if (!groups) {
    var rows = filteredRows;
    if (COLS.amount) {
      var cats = COLS.category ? Array.from(new Set(rows.map(function(r) { return r[COLS.category]; }))) : [];
      container.innerHTML = '<div class="section"><div class="section-header"><div class="section-title">Data Overview</div></div>'
        + buildGenericCharts(rows, cats) + '</div>';
    }
    return;
  }

  var html = '';
  var sectionKeys = Object.keys(groups);
  var colorMap = { 'income': 'income', 'expense': 'expense' };
  sectionKeys.forEach(function(key, idx) {
    var rows = groups[key];
    var isExpense = key.toLowerCase().indexOf('expense') >= 0 || key.toLowerCase().indexOf('cost') >= 0 || key.toLowerCase().indexOf('debit') >= 0;
    var headerCls = isExpense ? 'expense-header' : '';
    var totalCls = isExpense ? 'expense-total' : '';
    var total = rows.reduce(function(s,r) { return s + (parseFloat(r[COLS.amount]) || 0); }, 0);
    var cats = COLS.category ? Array.from(new Set(rows.map(function(r) { return r[COLS.category]; }))) : [];
    var catTotals = {};
    if (COLS.category) {
      cats.forEach(function(c) {
        catTotals[c] = rows.filter(function(r) { return r[COLS.category] === c; }).reduce(function(s,r) { return s + (parseFloat(r[COLS.amount]) || 0); }, 0);
      });
    }
    html += '<div class="section" id="section-' + idx + '">';
    html += '<div class="section-header ' + headerCls + '">'
          + '<div class="section-title">' + key + '</div>'
          + '<div class="section-total ' + totalCls + '">' + fmt(total) + '</div></div>';
    if (COLS.category && cats.length > 0) {
      html += '<div class="sub-grid">';
      cats.slice(0,12).forEach(function(c) {
        var pct = total > 0 ? ((catTotals[c] / total) * 100).toFixed(1) : 0;
        html += '<div class="sub-card" data-cat="' + c + '">'
              + '<div class="sub-name">' + c + '</div>'
              + '<div class="sub-amount" style="color:' + (isExpense ? 'var(--expense)' : 'var(--income)') + '">' + fmt(catTotals[c]) + '</div>'
              + '<div class="sub-pct">' + pct + '% of ' + key.toLowerCase() + '</div></div>';
      });
      html += '</div>';
    }
    html += '<div class="charts-grid" id="charts-' + idx + '">';
    if (COLS.category && cats.length > 1) {
      html += '<div class="chart-card"><div class="chart-title">Distribution</div><div class="chart-wrap"><canvas id="donut-' + idx + '"></canvas></div></div>';
      html += '<div class="chart-card"><div class="chart-title">By Category</div><div class="chart-wrap"><canvas id="bar-' + idx + '"></canvas></div></div>';
    }
    if (COLS.date) {
      html += '<div class="chart-card"><div class="chart-title">Trend Over Time</div><div class="chart-wrap"><canvas id="line-' + idx + '"></canvas></div></div>';
    }
    if (COLS.category && cats.length > 1) {
      html += '<div class="chart-card"><div class="chart-title">Ranked (Highest → Lowest)</div><div class="chart-wrap"><canvas id="hbar-' + idx + '"></canvas></div></div>';
    }
    html += '</div></div>';
  });
  container.innerHTML = html;

  // Wire sub-card clicks via event delegation (avoids inline string quoting issues)
  container.querySelectorAll('[data-cat]').forEach(function(card) {
    card.addEventListener('click', function() { filterByCategory(card.getAttribute('data-cat')); });
  });

  // Render charts after DOM update
  setTimeout(function() {
    sectionKeys.forEach(function(key, idx) {
      var rows = groups[key];
      var isExpense = key.toLowerCase().indexOf('expense') >= 0;
      var primaryColor = isExpense ? 'rgba(244,63,94,' : 'rgba(16,185,129,';
      var cats = COLS.category ? Array.from(new Set(rows.map(function(r) { return r[COLS.category]; }))) : [];
      var catTotals = {};
      cats.forEach(function(c) {
        catTotals[c] = rows.filter(function(r) { return r[COLS.category] === c; }).reduce(function(s,r) { return s + (parseFloat(r[COLS.amount]) || 0); }, 0);
      });
      var palette = ['#6366f1','#10b981','#f59e0b','#f43f5e','#3b82f6','#a855f7','#06b6d4','#84cc16','#fb923c','#ec4899','#14b8a6','#8b5cf6'];
      if (COLS.category && cats.length > 1) {
        // Donut
        var dEl = document.getElementById('donut-' + idx);
        if (dEl) {
          charts['donut-' + idx] = new Chart(dEl, {
            type: 'doughnut',
            data: { labels: cats, datasets: [{ data: cats.map(function(c) { return catTotals[c]; }), backgroundColor: palette.map(function(c) { return c + 'cc'; }), borderColor: '#0f1117', borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#8892b0', font: { family: 'Plus Jakarta Sans', size: 11 }, padding: 8 } } } }
          });
        }
        // Bar
        var bEl = document.getElementById('bar-' + idx);
        if (bEl) {
          charts['bar-' + idx] = new Chart(bEl, {
            type: 'bar',
            data: { labels: cats, datasets: [{ data: cats.map(function(c) { return catTotals[c]; }), backgroundColor: cats.map(function(c,i) { return palette[i % palette.length] + 'cc'; }), borderRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8892b0', font: { size: 10 } }, grid: { color: 'rgba(42,49,72,.5)' } }, y: { ticks: { color: '#8892b0', font: { size: 10 }, callback: function(v) { return fmt(v); } }, grid: { color: 'rgba(42,49,72,.5)' } } } }
          });
        }
        // Horizontal bar
        var hEl = document.getElementById('hbar-' + idx);
        if (hEl) {
          var sortedCats = cats.slice().sort(function(a,b) { return catTotals[b] - catTotals[a]; });
          charts['hbar-' + idx] = new Chart(hEl, {
            type: 'bar',
            data: { labels: sortedCats, datasets: [{ data: sortedCats.map(function(c) { return catTotals[c]; }), backgroundColor: primaryColor + '0.7)', borderRadius: 4 }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8892b0', font: { size: 10 }, callback: function(v) { return fmt(v); } }, grid: { color: 'rgba(42,49,72,.5)' } }, y: { ticks: { color: '#8892b0', font: { size: 10 } }, grid: { color: 'rgba(42,49,72,.5)' } } } }
          });
        }
      }
      // Line chart
      if (COLS.date) {
        var lEl = document.getElementById('line-' + idx);
        if (lEl) {
          var byDate = {};
          rows.forEach(function(r) {
            var d = String(r[COLS.date]).substring(0,7); // YYYY-MM
            if (!byDate[d]) byDate[d] = 0;
            byDate[d] += parseFloat(r[COLS.amount]) || 0;
          });
          var dateLabels = Object.keys(byDate).sort();
          charts['line-' + idx] = new Chart(lEl, {
            type: 'line',
            data: { labels: dateLabels, datasets: [{ data: dateLabels.map(function(d) { return byDate[d]; }), borderColor: isExpense ? '#f43f5e' : '#10b981', backgroundColor: isExpense ? 'rgba(244,63,94,.12)' : 'rgba(16,185,129,.12)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: isExpense ? '#f43f5e' : '#10b981' }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8892b0', font: { size: 10 } }, grid: { color: 'rgba(42,49,72,.5)' } }, y: { ticks: { color: '#8892b0', font: { size: 10 }, callback: function(v) { return fmt(v); } }, grid: { color: 'rgba(42,49,72,.5)' } } } }
          });
        }
      }
    });
  }, 50);
}

function buildGenericCharts(rows, cats) {
  return '';
}

function filterByCategory(cat) {
  activeFilters.category = cat;
  applyFilters();
}

// ─── TABLE ───────────────────────────────────────────────────────────────────
function buildTable() {
  var rows = filteredRows.slice(0, 200);
  var headers = COLS.headers || (rows.length > 0 ? Object.keys(rows[0]) : []);
  document.getElementById('row-count').textContent = filteredRows.length + ' rows';
  var thead = document.getElementById('table-head');
  thead.innerHTML = headers.map(function(h) { return '<th>' + h + '</th>'; }).join('');
  var tbody = document.getElementById('table-body');
  tbody.innerHTML = rows.map(function(r) {
    return '<tr>' + headers.map(function(h) {
      var v = r[h];
      if (COLS.type && h === COLS.type) {
        var cls = String(v).toLowerCase() === 'income' ? 'income' : 'expense';
        return '<td><span class="badge ' + cls + '">' + v + '</span></td>';
      }
      if (COLS.amount && h === COLS.amount) {
        return '<td class="amount-cell">' + fmt(parseFloat(v)) + '</td>';
      }
      return '<td>' + (v !== null && v !== undefined ? v : '—') + '</td>';
    }).join('') + '</tr>';
  }).join('');
}

// ─── SCENARIO PLANNER ────────────────────────────────────────────────────────
function buildScenarioPage() {
  if (!COLS.category || !COLS.amount) {
    document.getElementById('sliders-container').innerHTML = '<p style="color:var(--muted);font-size:.8rem">No categorical data detected for scenario planning.</p>';
    return;
  }
  var catRows = {};
  allRows.forEach(function(r) {
    var c = r[COLS.category];
    if (!catRows[c]) catRows[c] = [];
    catRows[c].push(parseFloat(r[COLS.amount]) || 0);
  });
  var categories = Object.keys(catRows).slice(0, 12);
  categories.forEach(function(c) {
    if (sliderValues[c] === undefined) sliderValues[c] = 0;
  });
  var html = '';
  categories.forEach(function(c) {
    var total = catRows[c].reduce(function(a,b) { return a+b; }, 0);
    html += '<div class="slider-group">'
          + '<div class="slider-label">'
          + '<span class="slider-name">' + c + ' <span style="color:var(--muted);font-size:.7rem">(' + fmt(total) + ')</span></span>'
          + '<span class="slider-pct" id="pct-' + c.replace(/\s+/g,'_') + '">' + (sliderValues[c] >= 0 ? '+' : '') + sliderValues[c] + '%</span>'
          + '</div>'
          + '<input type="range" min="-50" max="100" value="' + sliderValues[c] + '" '
          + 'oninput="updateSlider(\'' + c + '\',this.value)" id="sl-' + c.replace(/\s+/g,'_') + '">'
          + '</div>';
  });
  document.getElementById('sliders-container').innerHTML = html;
  updateScenarioCharts();
}

function updateSlider(cat, val) {
  sliderValues[cat] = parseInt(val);
  var id = cat.replace(/\s+/g,'_');
  var el = document.getElementById('pct-' + id);
  if (el) el.textContent = (val >= 0 ? '+' : '') + val + '%';
  updateScenarioCharts();
}

function applyScenario() { updateScenarioCharts(); }

function resetScenario() {
  Object.keys(sliderValues).forEach(function(k) { sliderValues[k] = 0; });
  buildScenarioPage();
}

function updateScenarioCharts() {
  if (!COLS.category || !COLS.amount) return;

  var catTotals = {};
  allRows.forEach(function(r) {
    var c = r[COLS.category];
    catTotals[c] = (catTotals[c] || 0) + (parseFloat(r[COLS.amount]) || 0);
  });

  var baselineNet = 0, adjustedNet = 0;
  if (COLS.type) {
    allRows.forEach(function(r) {
      var a = parseFloat(r[COLS.amount]) || 0;
      var t = String(r[COLS.type]).toLowerCase();
      var adj = (sliderValues[r[COLS.category]] || 0) / 100;
      if (t === 'income') { baselineNet += a; adjustedNet += a * (1 + adj); }
      else { baselineNet -= a; adjustedNet -= a * (1 + adj); }
    });
  }

  document.getElementById('baseline-total').textContent = fmt(baselineNet);
  var adjEl = document.getElementById('adjusted-total');
  adjEl.textContent = fmt(adjustedNet);
  adjEl.className = 'comp-value ' + (adjustedNet >= baselineNet ? 'delta-positive' : 'delta-negative');

  var diff = adjustedNet - baselineNet;
  var pctChange = baselineNet !== 0 ? ((diff / Math.abs(baselineNet)) * 100).toFixed(1) : 0;
  document.getElementById('impact-text').textContent =
    'Adjusted net balance: ' + fmt(adjustedNet) + '\n' +
    'Change from baseline: ' + fmt(diff) + ' (' + (diff >= 0 ? '+' : '') + pctChange + '%)';

  var categories = Object.keys(catTotals).slice(0, 12);
  var baseVals = categories.map(function(c) { return catTotals[c] || 0; });
  var adjVals = categories.map(function(c) { return (catTotals[c] || 0) * (1 + (sliderValues[c] || 0) / 100); });

  var palette = ['#6366f1','#10b981','#f59e0b','#f43f5e','#3b82f6','#a855f7','#06b6d4','#84cc16'];
  var ctx = document.getElementById('scenario-bar-chart');
  if (ctx) {
    if (scenarioChart) { scenarioChart.destroy(); }
    scenarioChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [
          { label: 'Baseline', data: baseVals, backgroundColor: 'rgba(59,130,246,.7)', borderRadius: 4 },
          { label: 'Adjusted', data: adjVals, backgroundColor: 'rgba(16,185,129,.7)', borderRadius: 4 },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8892b0', font: { family: 'Plus Jakarta Sans' } } } }, scales: { x: { ticks: { color: '#8892b0', font: { size: 10 } }, grid: { color: 'rgba(42,49,72,.5)' } }, y: { ticks: { color: '#8892b0', font: { size: 10 }, callback: function(v) { return fmt(v); } }, grid: { color: 'rgba(42,49,72,.5)' } } } }
    });
  }

  var tbody = document.getElementById('scenario-tbody');
  if (tbody) {
    tbody.innerHTML = categories.map(function(c, i) {
      var base = baseVals[i], adj = adjVals[i], delta = adj - base;
      var pct = base !== 0 ? ((delta / base) * 100).toFixed(1) : 0;
      return '<tr><td>' + c + '</td>'
           + '<td class="amount-cell">' + fmt(base) + '</td>'
           + '<td class="amount-cell">' + fmt(adj) + '</td>'
           + '<td class="amount-cell" style="color:' + (delta >= 0 ? 'var(--income)' : 'var(--expense)') + '">' + (delta >= 0 ? '+' : '') + fmt(delta) + '</td>'
           + '<td style="color:' + (pct >= 0 ? 'var(--income)' : 'var(--expense)') + '">' + (pct >= 0 ? '+' : '') + pct + '%</td></tr>';
    }).join('');
  }
}
<\/script>
</body>
</html>`
}

export async function handleDataSummaryTool(
  install: Record<string, unknown>,
  toolName: string,
  args: Record<string, unknown>,
  writeLog: (status: 'success' | 'error', msg?: string) => void
) {
  if (toolName !== 'create_dashboard') {
    writeLog('error', `Unknown tool: ${toolName}`)
    return {
      content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
      isError: true,
    }
  }

  const csvData = (args.csv_data as string | undefined)?.trim() || DEMO_CSV
  const title = (args.title as string | undefined) || 'Business Intelligence Dashboard'
  const userId = install.user_id as string

  const html = generateDashboardHtml(csvData, title)
  const htmlBytes = Buffer.from(html, 'utf-8')

  if (htmlBytes.length > 5 * 1024 * 1024) {
    writeLog('error', 'Dashboard HTML too large')
    return {
      content: [{ type: 'text', text: '❌ Data too large. Please limit CSV to 5,000 rows.' }],
      isError: true,
    }
  }

  const db = getServiceClient()
  const ts = Date.now()
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 40) || 'dashboard'
  const storagePath = `dashboards/${userId}/${ts}_${slug}.html`

  const { error: uploadErr } = await db.storage
    .from('research-pdfs')
    .upload(storagePath, htmlBytes, {
      contentType: 'text/html',
      upsert: false,
    })

  if (uploadErr) {
    writeLog('error', uploadErr.message)
    return {
      content: [{ type: 'text', text: `❌ Upload failed: ${uploadErr.message}` }],
      isError: true,
    }
  }

  const expiresAt = new Date(Date.now() + 86400 * 1000).toISOString()
  await db.from('storage_files').insert({
    user_id: userId,
    filename: `${slug}.html`,
    storage_path: storagePath,
    mime_type: 'text/html',
    file_size: htmlBytes.length,
    expires_at: expiresAt,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.eternalmcp.com'
  const renderUrl = `${appUrl}/api/render/${storagePath}`

  writeLog('success')

  return {
    content: [
      {
        type: 'text',
        text: `✅ **Interactive Dashboard Created!**\n\n🔗 [Open Dashboard](${renderUrl})\n\n📊 **What's inside:**\n- KPI summary cards (Total Income, Expenses, Net Balance, Savings Rate)\n- Live filter panel — filter by type, date range, search\n- Charts: Donut, Bar, Trend Line, Ranked Bar (per section)\n- Scenario Planner — adjust any category and see instant impact\n\n⏱️ Link valid for **24 hours**. Use Storage Manager to keep it longer.`,
      },
    ],
  }
}
