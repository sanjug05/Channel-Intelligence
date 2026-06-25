'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
//  Channel Intelligence — app.js
//  Auth · State · Calculations · Render · Charts · Filters · Excel · Integrations
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Config ──────────────────────────────────────────────────────────────────
const APP = {
  CY: 2026, LY: 2025, CM: 6,
  MONTHS: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  // Integration placeholders — fill in to activate
  FIREBASE: {
    apiKey:      'YOUR_API_KEY',
    authDomain:  'YOUR_PROJECT.firebaseapp.com',
    projectId:   'YOUR_PROJECT_ID',
    // Collections: /partners, /sales_data, /users
  },
  SHEETS: {
    apiKey:  'YOUR_SHEETS_API_KEY',
    sheetId: 'YOUR_SHEET_ID',
    // Endpoint: GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}?key={apiKey}
  },
};

// ─── Application State ────────────────────────────────────────────────────────
const S = {
  user:             null,
  dataSource:       'demo',
  partners:         [],
  salesData:        [],
  filteredPartners: [],
  charts:           {},
  currentPage:      'dashboard',
  filters: {
    zone:'all', territory:'all', state:'all',
    asm:'all', rm:'all', verification:'all', tier:'all',
    search: '',
  },
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
const CREDS = {
  admin: { pass:'admin123', role:'admin',  display:'Admin User'   },
  demo:  { pass:'demo123',  role:'viewer', display:'Demo Viewer'  },
};

function handleLogin() {
  const u = el('login-user').value.trim();
  const p = el('login-pass').value;
  const c = CREDS[u];
  if (c && c.pass === p) boot({ username:u, role:c.role, display:c.display });
  else showLoginErr('Invalid credentials. Try admin / admin123');
}

function demoLogin(type) {
  if (type === 'admin')  boot({ username:'admin', role:'admin',  display:'Admin User'  });
  else                   boot({ username:'demo',  role:'viewer', display:'Demo Viewer' });
}

function boot(user) {
  S.user = user;
  el('login-screen').classList.add('hidden');
  el('app-shell').classList.remove('hidden');

  const init = user.display.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  el('sidebar-avatar').textContent = init;
  el('topbar-avatar').textContent  = init;
  el('sidebar-uname').textContent  = user.display;
  el('topbar-uname').textContent   = user.display.split(' ')[0];
  el('sidebar-urole').textContent  = user.role === 'admin' ? 'Administrator' : 'View-Only';

  initApp();
}

function showLoginErr(msg) {
  const e = el('login-error');
  e.textContent = msg;
  e.classList.remove('hidden');
  setTimeout(() => e.classList.add('hidden'), 4000);
}

function logout() {
  S.user = null;
  el('app-shell').classList.add('hidden');
  el('login-screen').classList.remove('hidden');
  el('login-user').value = '';
  el('login-pass').value = '';
  destroyAllCharts();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function initApp() {
  loadDemoData();
  populateFilters();
  renderDashboard();
  setTimeout(initDashboardCharts, 80);
  renderAllPartners();
}

function loadDemoData() {
  S.partners         = [...PARTNERS];
  S.salesData        = [...SALES_DATA];
  S.filteredPartners = [...S.partners];
  S.dataSource       = 'demo';
  setBadge('demo');
}

// ─── DOM Helper ───────────────────────────────────────────────────────────────
function el(id)       { return document.getElementById(id); }
function qs(sel)      { return document.querySelector(sel); }
function qsa(sel)     { return document.querySelectorAll(sel); }
function html(id, h)  { el(id).innerHTML = h; }

// ─── Formatting ───────────────────────────────────────────────────────────────
function fmtINR(v) {
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v/100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v/1000).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
}
function fmtPct(v)   { return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`; }
function fmtN(v)     { return Math.round(v).toLocaleString('en-IN'); }
function dCls(v)     { return v > 0 ? 'up' : v < 0 ? 'down' : 'flat'; }
function vcls(s)     { return { Verified:'verified', Pending:'pending', Rejected:'rejected', 'Under Review':'under-review' }[s] || 'pending'; }

// ─── Business Calculations ────────────────────────────────────────────────────
const CY = APP.CY, LY = APP.LY, CM = APP.CM;

function rows(pc, yr, m1 = 1, m2 = 12) {
  return S.salesData.filter(d =>
    (pc ? d.partnerCode === pc : true) &&
    d.year === yr && d.month >= m1 && d.month <= m2
  );
}

function sum(arr, f) { return arr.reduce((s, d) => s + (d[f] || 0), 0); }

function totalSalesLastYear(pc)      { return sum(rows(pc, LY),        'sales'); }
function totalSalesCYTD(pc)          { return sum(rows(pc, CY, 1, CM), 'sales'); }
function salesCurrentMonth(pc)       { return sum(rows(pc, CY, CM, CM),'sales'); }
function salesPrevMonth(pc)          {
  const pm = CM > 1 ? CM - 1 : 12;
  const py = CM > 1 ? CY     : LY;
  return sum(rows(pc, py, pm, pm), 'sales');
}
function salesSameMonthLY(pc)        { return sum(rows(pc, LY, CM, CM), 'sales'); }
function salesLYYTD(pc)              { return sum(rows(pc, LY, 1, CM),  'sales'); }

function sameStoreSalesGrowth(pc) {
  const ly = salesLYYTD(pc), cy = totalSalesCYTD(pc);
  return ly === 0 ? 0 : ((cy - ly) / ly) * 100;
}
function cmVsPm(pc) {
  const cm = salesCurrentMonth(pc), pm = salesPrevMonth(pc);
  return pm === 0 ? 0 : ((cm - pm) / pm) * 100;
}
function cmVsSameMonthLY(pc) {
  const cm = salesCurrentMonth(pc), lym = salesSameMonthLY(pc);
  return lym === 0 ? 0 : ((cm - lym) / lym) * 100;
}
function ytdGrowth(pc) {
  const ly = salesLYYTD(pc), cy = totalSalesCYTD(pc);
  return ly === 0 ? 0 : ((cy - ly) / ly) * 100;
}

function totalOBK(pc, yr, m1 = 1, m2 = 12)  { return sum(rows(pc, yr, m1, m2), 'obk');  }
function totalUEOB(pc, yr, m1 = 1, m2 = 12) { return sum(rows(pc, yr, m1, m2), 'ueob'); }

function totalAIS(pc)  { return sum(rows(pc, CY, 1, CM), 'aisLeads'); }
function totalWork(pc) { return sum(rows(pc, CY, 1, CM), 'leadsWorked'); }
function totalGen(pc)  { return sum(rows(pc, CY, 1, CM), 'leadsGenerated'); }
function totalCRM(pc)  { return sum(rows(pc, CY, 1, CM), 'leadsCRM'); }

function verPending(partners) {
  return partners.filter(p => ['Pending','Under Review'].includes(p.verificationStatus)).length;
}

function aggregateKPIs(partners) {
  const pcs   = partners.map(p => p.partnerCode);
  const all   = S.salesData.filter(d => pcs.includes(d.partnerCode));
  const f     = (yr, m1, m2) => all.filter(d => d.year===yr && d.month>=m1 && d.month<=m2);
  const pm    = CM > 1 ? CM - 1 : 12;
  const pmYr  = CM > 1 ? CY : LY;

  return {
    totalPartners:   partners.length,
    lyFullSales:     sum(f(LY, 1, 12), 'sales'),
    cytdSales:       sum(f(CY, 1, CM), 'sales'),
    lytdSales:       sum(f(LY, 1, CM), 'sales'),
    cmSales:         sum(f(CY, CM, CM),'sales'),
    pmSales:         sum(all.filter(d => d.year===pmYr && d.month===pm), 'sales'),
    obkCY:           sum(f(CY, 1, CM), 'obk'),
    ueobCY:          sum(f(CY, 1, CM), 'ueob'),
    aisLeads:        sum(f(CY, 1, CM), 'aisLeads'),
    leadsWorked:     sum(f(CY, 1, CM), 'leadsWorked'),
    leadsGenerated:  sum(f(CY, 1, CM), 'leadsGenerated'),
    leadsCRM:        sum(f(CY, 1, CM), 'leadsCRM'),
    verPending:      verPending(partners),
  };
}

// ─── Filters ──────────────────────────────────────────────────────────────────
function populateFilters() {
  const opts = (id, vals) => {
    el(id).innerHTML = `<option value="all">All</option>` +
      vals.map(v => `<option value="${v}">${v}</option>`).join('');
  };

  el('f-year').innerHTML = `<option value="all">All</option><option value="${CY}">${CY}</option><option value="${LY}">${LY}</option>`;
  el('f-month').innerHTML = `<option value="all">All Months</option>` +
    APP.MONTHS.map((m, i) => `<option value="${i+1}">${i+1} — ${m}</option>`).join('');

  const uniq = k => [...new Set(PARTNERS.map(p => p[k]).filter(Boolean))].sort();
  opts('f-zone',         uniq('zone'));
  opts('f-territory',    uniq('territory'));
  opts('f-state',        uniq('state'));
  opts('f-asm',          uniq('asm'));
  opts('f-rm',           uniq('rm'));
  opts('f-verification', ['Verified','Pending','Under Review','Rejected']);
  opts('f-tier',         ['Tier 1','Tier 2','Tier 3']);
}

function applyFilters() {
  const f  = S.filters;
  const q  = f.search.toLowerCase();
  S.filteredPartners = S.partners.filter(p => {
    if (f.zone         !== 'all' && p.zone               !== f.zone)         return false;
    if (f.territory    !== 'all' && p.territory           !== f.territory)    return false;
    if (f.state        !== 'all' && p.state               !== f.state)        return false;
    if (f.asm          !== 'all' && p.asm                 !== f.asm)          return false;
    if (f.rm           !== 'all' && p.rm                  !== f.rm)           return false;
    if (f.verification !== 'all' && p.verificationStatus  !== f.verification) return false;
    if (f.tier         !== 'all' && p.tier                !== f.tier)         return false;
    if (q && !`${p.firmName} ${p.partnerName} ${p.partnerCode} ${p.city} ${p.state}`.toLowerCase().includes(q)) return false;
    return true;
  });
  renderDashboard();
  updateDashboardCharts();
}

function resetFilters() {
  S.filters = { zone:'all', territory:'all', state:'all', asm:'all', rm:'all', verification:'all', tier:'all', search:'' };
  ['f-zone','f-territory','f-state','f-asm','f-rm','f-verification','f-tier','f-year','f-month']
    .forEach(id => { const e = el(id); if (e) e.value = 'all'; });
  el('global-search').value = '';
  S.filteredPartners = [...S.partners];
  renderDashboard();
  updateDashboardCharts();
}

// ─── Render Dashboard ─────────────────────────────────────────────────────────
function renderDashboard() {
  const k   = aggregateKPIs(S.filteredPartners);
  const sg  = k.lytdSales === 0 ? 0 : ((k.cytdSales - k.lytdSales) / k.lytdSales) * 100;
  const cmp = k.pmSales   === 0 ? 0 : ((k.cmSales   - k.pmSales)   / k.pmSales)   * 100;
  const wkPct = k.aisLeads === 0 ? 0 : Math.round(k.leadsWorked / k.aisLeads * 100);

  const kpiDefs = [
    { lbl:'Total Partners',    val: fmtN(k.totalPartners),   ico:'🤝',  sub:'Active in system',        d: null },
    { lbl:'AIS Leads (CY)',    val: fmtN(k.aisLeads),        ico:'📥',  sub:`Jan–Jun ${CY}`,           d: null },
    { lbl:'Leads Worked',      val: fmtN(k.leadsWorked),     ico:'⚙️',  sub:`${wkPct}% of AIS leads`,  d: null },
    { lbl:'Leads Generated',   val: fmtN(k.leadsGenerated),  ico:'✨',  sub:'Self-sourced CY',          d: null },
    { lbl:'Added to CRM',      val: fmtN(k.leadsCRM),        ico:'🗂️',  sub:'CY pipeline',             d: null },
    { lbl:`Full Year ${LY}`,   val: fmtINR(k.lyFullSales),   ico:'📅',  sub:`Complete ${LY}`,          d: null },
    { lbl:'CY Sales YTD',      val: fmtINR(k.cytdSales),     ico:'📈',  sub:`Jan–Jun ${CY}`,           d: { v: sg,  l:'vs LY YTD' } },
    { lbl:'Same Store Growth', val: fmtPct(sg),              ico:'📊',  sub:'YoY same period',          d: { v: sg,  l:'' }, alert: sg < 0 },
    { lbl:`${APP.MONTHS[CM-1]} ${CY}`, val: fmtINR(k.cmSales), ico:'🗓️', sub:'Current month',         d: { v: cmp, l:'vs prev month' } },
    { lbl:'Total OBK (CY)',    val: fmtINR(k.obkCY),         ico:'💰',  sub:'Jan–Jun 2026',            d: null },
    { lbl:'Total UEOB (CY)',   val: fmtINR(k.ueobCY),        ico:'🏦',  sub:'Jan–Jun 2026',            d: null },
    { lbl:'Verification Pending', val: fmtN(k.verPending),   ico:'⚠️',  sub:'Needs attention',         d: null, danger: k.verPending > 0 },
  ];

  el('kpi-grid').innerHTML = kpiDefs.map(k => `
    <div class="kpi-card">
      <div class="kpi-head">
        <span class="kpi-label">${k.lbl}</span>
        <span class="kpi-ico">${k.ico}</span>
      </div>
      <div class="kpi-val${k.val.length > 9 ? ' sm' : ''}${k.danger ? ' danger' : ''}">${k.val}</div>
      <div class="kpi-foot">
        ${k.d ? `<span class="delta ${dCls(k.d.v)}">${fmtPct(k.d.v)}</span>` : ''}
        <span class="kpi-sub">${k.sub}</span>
      </div>
    </div>`).join('');

  renderCards(S.filteredPartners, 'partner-grid');
  el('partner-count').textContent = `${S.filteredPartners.length} partner${S.filteredPartners.length !== 1 ? 's' : ''}`;
}

function renderCards(partners, containerId) {
  const g = el(containerId);
  if (!g) return;

  if (!partners.length) {
    g.innerHTML = `<div class="empty-state">
      <div class="ei">🔍</div>
      <h3>No partners found</h3>
      <p>Try adjusting your filters or search query.</p>
    </div>`;
    return;
  }

  g.innerHTML = partners.map(p => {
    const cyS    = totalSalesCYTD(p.partnerCode);
    const lyS    = totalSalesLastYear(p.partnerCode);
    const growth = sameStoreSalesGrowth(p.partnerCode);
    const vc     = vcls(p.verificationStatus);

    return `<div class="partner-card" onclick="openPartnerModal('${p.partnerCode}')">
      <span class="tier-chip">${p.tier}</span>
      <div class="pc-head">
        <div>
          <div class="pc-name">${p.firmName}</div>
          <div class="pc-code">${p.partnerCode}</div>
        </div>
        <span class="vbadge ${vc}">${p.verificationStatus}</span>
      </div>
      <div class="pc-meta">
        <div class="meta-row"><span class="meta-lbl">Zone</span><span class="meta-val">${p.zone}</span></div>
        <div class="meta-row"><span class="meta-lbl">Territory</span><span class="meta-val">${p.territory}</span></div>
        <div class="meta-row"><span class="meta-lbl">ASM</span><span class="meta-val">${p.asm}</span></div>
        <div class="meta-row"><span class="meta-lbl">City</span><span class="meta-val">${p.city}, ${p.state}</span></div>
      </div>
      <div class="pc-divider"></div>
      <div class="pc-financials">
        <div class="fin-col">
          <span class="fin-lbl">CY YTD Sales</span>
          <span class="fin-val">${fmtINR(cyS)}</span>
          <span class="fin-delta ${dCls(growth)}">${fmtPct(growth)} YoY</span>
        </div>
        <div class="fin-col" style="text-align:right">
          <span class="fin-lbl">Last Year (${LY})</span>
          <span class="fin-val">${fmtINR(lyS)}</span>
          <span class="fin-delta flat">Full Year</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderAllPartners() {
  renderCards(S.partners, 'all-partner-grid');
  el('all-count').textContent = `${S.partners.length} partners`;
}

// ─── Partner Modal ────────────────────────────────────────────────────────────
function openPartnerModal(pc) {
  const p = S.partners.find(x => x.partnerCode === pc);
  if (!p) return;

  el('m-name').textContent  = p.firmName;
  el('m-meta').textContent  = `${p.partnerCode} · ${p.zone} Zone · ${p.territory}`;
  el('m-source').className  = `source-badge ${S.dataSource}`;
  el('m-source').textContent = S.dataSource.toUpperCase();

  // Info table
  el('m-info').innerHTML = [
    ['Partner Name',   p.partnerName],
    ['Partner Code',   `<span style="font-family:monospace;font-size:12px">${p.partnerCode}</span>`],
    ['Zone',           p.zone],
    ['Territory',      p.territory],
    ['State',          p.state],
    ['City',           p.city],
    ['Tier',           p.tier],
    ['ASM',            p.asm],
    ['RM',             p.rm],
    ['Verification',   `<span class="vbadge ${vcls(p.verificationStatus)}">${p.verificationStatus}</span>`],
  ].map(([l, v]) => `<div class="ir"><span class="ir-lbl">${l}</span><span class="ir-val">${v}</span></div>`).join('');

  // Sales stats
  const lyFull = totalSalesLastYear(pc);
  const cytd   = totalSalesCYTD(pc);
  const lytd   = salesLYYTD(pc);
  const sg     = sameStoreSalesGrowth(pc);
  const cm     = salesCurrentMonth(pc);
  const cpv    = cmVsPm(pc);
  const clym   = cmVsSameMonthLY(pc);
  const yg     = ytdGrowth(pc);

  el('m-sales').innerHTML = [
    { lbl:`Full Year ${LY}`,               val: fmtINR(lyFull), sub:`Complete ${LY}`,                   d: null },
    { lbl:`CY YTD (Jan–${APP.MONTHS[CM-1]})`, val: fmtINR(cytd), sub:`${CY} to date`,                  d: { v:sg, l:'vs LY YTD' } },
    { lbl:'Same Store Growth',             val: fmtPct(sg),     sub:'YoY same period',                   d: { v:sg, l:'' } },
    { lbl:`${APP.MONTHS[CM-1]} ${CY}`,     val: fmtINR(cm),     sub:'Current month',                     d: { v:cpv, l:'vs prev mo.' } },
    { lbl:`vs ${APP.MONTHS[CM-1]} ${LY}`,  val: fmtPct(clym),   sub:'Same month last year',              d: { v:clym, l:'' } },
    { lbl:'LY YTD vs CY YTD',             val: fmtPct(yg),     sub:`Jan–${APP.MONTHS[CM-1]} comparison`, d: { v:yg, l:'' } },
  ].map(k => `<div class="stat-box">
    <div class="sb-lbl">${k.lbl}</div>
    <div class="sb-val">${k.val}</div>
    <div class="sb-sub">${k.sub}</div>
    ${k.d ? `<div class="sb-delta ${dCls(k.d.v)}">${fmtPct(k.d.v)} ${k.d.l}</div>` : ''}
  </div>`).join('');

  // OBK / UEOB
  const obkCY = totalOBK(pc, CY, 1, CM), obkLY = totalOBK(pc, LY);
  const ubCY  = totalUEOB(pc, CY, 1, CM), ubLY  = totalUEOB(pc, LY);
  el('m-obk').innerHTML = [
    { lbl:`OBK ${CY} YTD`,  val: fmtINR(obkCY), sub:`Full ${LY}: ${fmtINR(obkLY)}` },
    { lbl:`UEOB ${CY} YTD`, val: fmtINR(ubCY),  sub:`Full ${LY}: ${fmtINR(ubLY)}`  },
  ].map(k => `<div class="stat-box"><div class="sb-lbl">${k.lbl}</div><div class="sb-val">${k.val}</div><div class="sb-sub">${k.sub}</div></div>`).join('');

  // Leads
  el('m-leads').innerHTML = [
    { lbl:'AIS Leads',      val: fmtN(totalAIS(pc)),  ico:'📥' },
    { lbl:'Worked',         val: fmtN(totalWork(pc)), ico:'⚙️' },
    { lbl:'Generated',      val: fmtN(totalGen(pc)),  ico:'✨' },
    { lbl:'CRM Added',      val: fmtN(totalCRM(pc)),  ico:'🗂️' },
  ].map(k => `<div class="stat-box"><div class="sb-lbl">${k.ico} ${k.lbl}</div><div class="sb-val">${k.val}</div></div>`).join('');

  // Verification
  el('m-notes').textContent = p.verificationNotes || 'No notes recorded.';

  el('partner-modal').classList.remove('hidden');
  setTimeout(() => initModalCharts(pc), 80);
}

function closePartnerModal() {
  el('partner-modal').classList.add('hidden');
  destroyChart('m-trend-chart');
  destroyChart('m-leads-chart');
}

// ─── Charts ───────────────────────────────────────────────────────────────────
function destroyChart(id) {
  if (S.charts[id]) { S.charts[id].destroy(); delete S.charts[id]; }
}
function destroyAllCharts() {
  Object.keys(S.charts).forEach(id => S.charts[id].destroy());
  S.charts = {};
}
function mkChart(id, cfg) {
  destroyChart(id);
  const c = el(id);
  if (!c) return null;
  S.charts[id] = new Chart(c, cfg);
  return S.charts[id];
}

function themeTokens() {
  const dk = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid: dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tick: dk ? '#94A3B8' : '#64748B',
  };
}

function baseOpts(yFmt = fmtINR) {
  const t = themeTokens();
  return {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
      legend: { labels: { color: t.tick, font: { size: 11, family: 'Inter' }, boxWidth: 12, padding: 10 } },
      tooltip: { bodyFont: { family: 'Inter', size: 12 }, titleFont: { family: 'Inter', size: 12 } },
    },
    scales: {
      x: { grid: { color: t.grid }, ticks: { color: t.tick, font: { size: 11 } } },
      y: { grid: { color: t.grid }, ticks: { color: t.tick, font: { size: 11 }, callback: yFmt } },
    },
  };
}

// Dashboard: Monthly Trend
function renderTrendChart() {
  const pcs = S.filteredPartners.map(p => p.partnerCode);
  const allS = S.salesData.filter(d => pcs.includes(d.partnerCode));

  const ly = APP.MONTHS.map((_, i) => sum(allS.filter(d => d.year===LY && d.month===i+1), 'sales'));
  const cy = APP.MONTHS.map((_, i) => i+1 <= CM ? sum(allS.filter(d => d.year===CY && d.month===i+1), 'sales') : null);

  mkChart('trend-chart', {
    type: 'line',
    data: {
      labels: APP.MONTHS,
      datasets: [
        { label:`${LY}`, data: ly, borderColor:'#94A3B8', backgroundColor:'rgba(148,163,184,0.1)', tension:.4, pointRadius:3, borderWidth:2 },
        { label:`${CY}`, data: cy, borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)',  tension:.4, pointRadius:3, borderWidth:2, spanGaps:false },
      ],
    },
    options: baseOpts(),
  });
}

// Dashboard: Zone Doughnut
function renderZoneChart() {
  const zones = [...new Set(PARTNERS.map(p => p.zone))].sort();
  const pcs   = S.filteredPartners.map(p => p.partnerCode);
  const data  = zones.map(z => {
    const zPcs = S.filteredPartners.filter(p => p.zone === z).map(p => p.partnerCode);
    return sum(S.salesData.filter(d => zPcs.includes(d.partnerCode) && d.year===CY && d.month<=CM), 'sales');
  });

  const t = themeTokens();
  mkChart('zone-chart', {
    type: 'doughnut',
    data: { labels: zones, datasets: [{ data, backgroundColor:['#2563EB','#7C3AED','#059669','#D97706'], borderWidth:0, hoverOffset:8 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
      plugins: {
        legend: { position:'bottom', labels: { color: t.tick, font: { size: 11, family:'Inter' }, padding:10, boxWidth:12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmtINR(ctx.raw)}` } },
      },
    },
  });
}

function initDashboardCharts()  { renderTrendChart(); renderZoneChart(); }
function updateDashboardCharts(){ renderTrendChart(); renderZoneChart(); }

// Modal: Sales Trend Bar
function initModalCharts(pc) {
  const months = APP.MONTHS.slice(0, CM);

  const lyD  = APP.MONTHS.map((_, i) => sum(rows(pc, LY, i+1, i+1), 'sales'));
  const cyD  = APP.MONTHS.map((_, i) => i+1 <= CM ? sum(rows(pc, CY, i+1, i+1), 'sales') : null);

  mkChart('m-trend-chart', {
    type: 'bar',
    data: {
      labels: APP.MONTHS,
      datasets: [
        { label:`${LY}`, data: lyD, backgroundColor:'rgba(148,163,184,0.45)', borderRadius:3 },
        { label:`${CY}`, data: cyD, backgroundColor:'rgba(37,99,235,0.75)',   borderRadius:3 },
      ],
    },
    options: baseOpts(),
  });

  // Leads bar (stacked, current year)
  const fields   = ['aisLeads','leadsWorked','leadsGenerated','leadsCRM'];
  const labels   = ['AIS Provided','Worked','Generated','CRM Added'];
  const colors   = ['#2563EB','#7C3AED','#059669','#D97706'];
  const leadData = fields.map(f => months.map((_, i) => sum(rows(pc, CY, i+1, i+1), f)));

  mkChart('m-leads-chart', {
    type: 'bar',
    data: {
      labels: months,
      datasets: labels.map((lb, i) => ({ label:lb, data:leadData[i], backgroundColor:colors[i], borderRadius:3 })),
    },
    options: { ...baseOpts(v => fmtN(v)) },
  });
}

// Analytics page charts
function initAnalyticsCharts() {
  const zones  = [...new Set(PARTNERS.map(p => p.zone))].sort();
  const t      = themeTokens();

  // Zone bar chart
  const lyByZ = zones.map(z => sum(S.salesData.filter(d => S.partners.filter(p=>p.zone===z).map(p=>p.partnerCode).includes(d.partnerCode) && d.year===LY), 'sales'));
  const cyByZ = zones.map(z => sum(S.salesData.filter(d => S.partners.filter(p=>p.zone===z).map(p=>p.partnerCode).includes(d.partnerCode) && d.year===CY && d.month<=CM), 'sales'));
  mkChart('a-zone-chart', {
    type: 'bar',
    data: { labels: zones, datasets: [
      { label:`${LY} Full Year`, data: lyByZ, backgroundColor:'rgba(148,163,184,0.5)', borderRadius:4 },
      { label:`${CY} YTD`,      data: cyByZ, backgroundColor:'rgba(37,99,235,0.75)',   borderRadius:4 },
    ]},
    options: baseOpts(),
  });

  // Tier pie
  const tiers  = ['Tier 1','Tier 2','Tier 3'];
  const tData  = tiers.map(t => S.partners.filter(p => p.tier===t).length);
  mkChart('a-tier-chart', {
    type: 'pie',
    data: { labels: tiers, datasets: [{ data: tData, backgroundColor:['#2563EB','#7C3AED','#059669'], borderWidth:0 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
      plugins: { legend: { position:'bottom', labels: { color: t.tick, font:{size:11,family:'Inter'}, padding:10 } } },
    },
  });

  // Leads pipeline by partner
  const pLabels = S.partners.map(p => p.firmName.split(' ')[0]);
  mkChart('a-leads-chart', {
    type: 'bar',
    data: { labels: pLabels, datasets: [
      { label:'AIS Leads',  data: S.partners.map(p => totalAIS(p.partnerCode)),  backgroundColor:'rgba(37,99,235,0.75)',  borderRadius:3 },
      { label:'Worked',     data: S.partners.map(p => totalWork(p.partnerCode)), backgroundColor:'rgba(124,58,237,0.75)', borderRadius:3 },
      { label:'CRM Added',  data: S.partners.map(p => totalCRM(p.partnerCode)),  backgroundColor:'rgba(5,150,105,0.75)',  borderRadius:3 },
    ]},
    options: { ...baseOpts(v => fmtN(v)) },
  });

  // Top 10
  const top10 = [...S.partners]
    .map(p => ({ name: p.firmName.split(' ').slice(0,2).join(' '), sales: totalSalesCYTD(p.partnerCode) }))
    .sort((a,b) => b.sales - a.sales).slice(0, 10);

  mkChart('a-top-chart', {
    type: 'bar',
    data: { labels: top10.map(x=>x.name), datasets: [{ label:'CY Sales YTD', data: top10.map(x=>x.sales), backgroundColor:'#2563EB', borderRadius:4 }] },
    options: { ...baseOpts(), indexAxis:'y' },
  });
}

// ─── Navigation ───────────────────────────────────────────────────────────────
const PAGE_TITLES = { dashboard:'Dashboard', partners:'All Partners', analytics:'Analytics', 'data-sources':'Data Sources', 'excel-tools':'Excel Tools' };

function navigateTo(page) {
  S.currentPage = page;
  qsa('.page').forEach(p => p.classList.remove('active'));
  qsa('.nav-item').forEach(n => n.classList.remove('active'));

  const pe = el(`page-${page}`);
  const ne = qs(`[data-page="${page}"]`);
  if (pe) pe.classList.add('active');
  if (ne) ne.classList.add('active');
  el('page-title').textContent = PAGE_TITLES[page] || page;

  if (page === 'analytics') setTimeout(initAnalyticsCharts, 120);

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    el('app-shell').classList.add('sidebar-collapsed');
    el('sidebar-backdrop').style.display = 'none';
  }
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const isDk = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDk ? 'light' : 'dark');
  el('theme-toggle').textContent = isDk ? '🌙' : '☀️';
  setTimeout(() => {
    updateDashboardCharts();
    if (S.currentPage === 'analytics') initAnalyticsCharts();
  }, 120);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, type = 'inf') {
  const ico = { ok:'✅', err:'❌', inf:'ℹ️' };
  const t   = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${ico[type] || ico.inf}</span><span>${msg}</span>`;
  el('toast-wrap').appendChild(t);
  setTimeout(() => t.remove(), 3600);
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function setBadge(src) {
  S.dataSource = src;
  el('source-badge').className   = `source-badge ${src}`;
  el('source-badge').textContent = src.toUpperCase();
}

// ─── Excel: Download Sample ───────────────────────────────────────────────────
function downloadSampleExcel() {
  if (typeof XLSX === 'undefined') { toast('XLSX library not loaded', 'err'); return; }

  const wb = XLSX.utils.book_new();

  const pRows = PARTNERS.map((p, i) => ({
    'Serial Number':              i + 1,
    'Partner Code':               p.partnerCode,
    'ASM':                        p.asm,
    'RM':                         p.rm,
    'Territory':                  p.territory,
    'Zone':                       p.zone,
    'City':                       p.city,
    'State':                      p.state,
    'Tier':                       p.tier,
    'Channel Partner Firm Name':  p.firmName,
    'Channel Partner Name':       p.partnerName,
    'Verification Status':        p.verificationStatus,
    'Verification Notes':         p.verificationNotes,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pRows), 'Partner_Details');

  const sRows = SALES_DATA.map((d, i) => ({
    'Serial Number':      i + 1,
    'Partner Code':       d.partnerCode,
    'Year':               d.year,
    'Month':              d.month,
    'Sales':              d.sales,
    'OBK':                d.obk,
    'UEOB':               d.ueob,
    'AIS Leads Provided': d.aisLeads,
    'Leads Worked':       d.leadsWorked,
    'Leads Generated':    d.leadsGenerated,
    'Leads Added To CRM': d.leadsCRM,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sRows), 'Sales_Data');

  XLSX.writeFile(wb, 'ChannelIntel_Sample_Workbook.xlsx');
  toast('Sample workbook downloaded!', 'ok');
}

// ─── Excel: Upload & Parse ────────────────────────────────────────────────────
function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (typeof XLSX === 'undefined') { toast('XLSX library not loaded', 'err'); return; }

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type:'array' });

      const missing = ['Partner_Details','Sales_Data'].filter(s => !wb.SheetNames.includes(s));
      if (missing.length) {
        showUploadResult(false, `Missing sheets: ${missing.join(', ')}`);
        return;
      }

      const pSheet = XLSX.utils.sheet_to_json(wb.Sheets['Partner_Details']);
      const sSheet = XLSX.utils.sheet_to_json(wb.Sheets['Sales_Data']);

      const reqP = ['Partner Code','Channel Partner Firm Name','Zone','Territory','Verification Status'];
      const reqS = ['Partner Code','Year','Month','Sales'];
      const mpErr = reqP.filter(c => !Object.keys(pSheet[0] || {}).includes(c));
      const msErr = reqS.filter(c => !Object.keys(sSheet[0] || {}).includes(c));
      if (mpErr.length || msErr.length) {
        showUploadResult(false, `Missing columns — Partner_Details: [${mpErr.join(', ')}] Sales_Data: [${msErr.join(', ')}]`);
        return;
      }

      S.partners = pSheet.map((r, i) => ({
        id: i+1, partnerCode: r['Partner Code'], firmName: r['Channel Partner Firm Name'],
        partnerName: r['Channel Partner Name'] || '',
        asm: r['ASM'] || '', rm: r['RM'] || '',
        territory: r['Territory'] || '', zone: r['Zone'] || '',
        city: r['City'] || '', state: r['State'] || '',
        tier: r['Tier'] || 'Tier 3',
        verificationStatus: r['Verification Status'] || 'Pending',
        verificationNotes:  r['Verification Notes'] || '',
      }));

      S.salesData = sSheet.map(r => ({
        partnerCode:    r['Partner Code'],
        year:           parseInt(r['Year'])   || 0,
        month:          parseInt(r['Month'])  || 0,
        sales:          parseFloat(r['Sales'])|| 0,
        obk:            parseFloat(r['OBK'])  || 0,
        ueob:           parseFloat(r['UEOB']) || 0,
        aisLeads:       parseInt(r['AIS Leads Provided']) || 0,
        leadsWorked:    parseInt(r['Leads Worked'])       || 0,
        leadsGenerated: parseInt(r['Leads Generated'])    || 0,
        leadsCRM:       parseInt(r['Leads Added To CRM']) || 0,
      }));

      S.filteredPartners = [...S.partners];
      setBadge('excel');
      populateFilters();
      renderDashboard();
      renderAllPartners();
      updateDashboardCharts();
      el('excel-ds-status').textContent = `✔ ${S.partners.length} partners loaded`;
      el('excel-ds-status').className   = 'ds-status on';
      showUploadResult(true, `Loaded ${S.partners.length} partners · ${S.salesData.length} sales rows`);
      toast(`Imported ${S.partners.length} partners from Excel`, 'ok');
    } catch (err) {
      showUploadResult(false, `Parse error: ${err.message}`);
      toast('Failed to parse workbook', 'err');
    }
  };
  reader.readAsArrayBuffer(file);
}

function showUploadResult(ok, msg) {
  const r = el('upload-result');
  if (!r) return;
  r.className = `upload-result ${ok ? 'ok' : 'err'}`;
  r.textContent = `${ok ? '✅' : '❌'} ${msg}`;
  r.classList.remove('hidden');
}

// ─── Google Sheets Hook ───────────────────────────────────────────────────────
async function connectGoogleSheets() {
  const url = (el('sheets-url')?.value || '').trim();
  if (!url) { toast('Paste a Google Sheets URL first', 'err'); return; }

  toast('Sheets integration needs API key in APP_CONFIG.SHEETS — see README', 'inf');

  /* ── Production Implementation ──────────────────────────────────────────────
  const match   = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = match?.[1] || APP.SHEETS.sheetId;
  const API_KEY = APP.SHEETS.apiKey;
  const base    = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values`;
  try {
    const [pRes, sRes] = await Promise.all([
      fetch(`${base}/Partner_Details?key=${API_KEY}`),
      fetch(`${base}/Sales_Data?key=${API_KEY}`),
    ]);
    const [pData, sData] = await Promise.all([pRes.json(), sRes.json()]);
    // Map rows[0] as headers, rows[1..] as data
    const toObj = ({ values }) => {
      const [headers, ...data] = values;
      return data.map(row => Object.fromEntries(headers.map((h,i) => [h, row[i] || ''])));
    };
    S.partners   = toObj(pData).map(...);   // map to schema
    S.salesData  = toObj(sData).map(...);   // map to schema
    S.filteredPartners = [...S.partners];
    setBadge('sheets');
    populateFilters(); renderDashboard(); renderAllPartners(); updateDashboardCharts();
    toast('Google Sheets loaded!', 'ok');
  } catch(e) { toast('Fetch failed: ' + e.message, 'err'); }
  ─────────────────────────────────────────────────────────────────────────── */
}

// ─── Firebase Hook ────────────────────────────────────────────────────────────
function connectFirebase() {
  toast('Add Firebase credentials to APP_CONFIG.FIREBASE in app.js — see README', 'inf');

  /* ── Production Implementation ──────────────────────────────────────────────
  // 1. Add to index.html:
  //    <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-app-compat.js"></script>
  //    <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-auth-compat.js"></script>
  //    <script src="https://www.gstatic.com/firebasejs/10.x.x/firebase-firestore-compat.js"></script>
  //
  // 2. Initialize:
  //    firebase.initializeApp(APP.FIREBASE);
  //    const db   = firebase.firestore();
  //    const auth = firebase.auth();
  //
  // 3. Auth (admin/viewer roles stored in /users/{uid}.role):
  //    auth.signInWithEmailAndPassword(email, pass)
  //      .then(cred => db.collection('users').doc(cred.user.uid).get())
  //      .then(doc => boot({ ...doc.data() }));
  //
  // 4. Real-time listeners:
  //    db.collection('partners').onSnapshot(snap => {
  //      S.partners = snap.docs.map(d => ({ id:d.id, ...d.data() }));
  //      S.filteredPartners = [...S.partners];
  //      renderDashboard();
  //    });
  //    db.collection('sales_data').onSnapshot(snap => {
  //      S.salesData = snap.docs.map(d => d.data());
  //      updateDashboardCharts();
  //    });
  //
  // 5. Firestore schema:
  //    /partners/{partnerCode} → { firmName, partnerName, asm, rm, territory, zone, ... }
  //    /sales_data/{id}        → { partnerCode, year, month, sales, obk, ueob, ... }
  //    /users/{uid}            → { role: 'admin' | 'viewer', display: '...' }
  ─────────────────────────────────────────────────────────────────────────── */
}

// ─── Event Listeners ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Auth
  el('login-btn').addEventListener('click', handleLogin);
  el('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  el('demo-admin-btn').addEventListener('click',  () => demoLogin('admin'));
  el('demo-viewer-btn').addEventListener('click', () => demoLogin('viewer'));
  el('logout-btn').addEventListener('click', logout);

  // Sidebar
  el('sidebar-toggle').addEventListener('click', () => {
    const shell = el('app-shell');
    const isMobile = window.innerWidth <= 768;
    shell.classList.toggle('sidebar-collapsed');
    if (isMobile) {
      const collapsed = shell.classList.contains('sidebar-collapsed');
      el('sidebar-backdrop').style.display = collapsed ? 'none' : 'block';
    }
  });
  el('sidebar-backdrop').addEventListener('click', () => {
    el('app-shell').classList.add('sidebar-collapsed');
    el('sidebar-backdrop').style.display = 'none';
  });

  // Nav
  qsa('.nav-item[data-page]').forEach(n => n.addEventListener('click', () => navigateTo(n.dataset.page)));

  // Filters
  el('apply-btn').addEventListener('click', () => {
    const g = id => el(id).value;
    S.filters.zone         = g('f-zone');
    S.filters.territory    = g('f-territory');
    S.filters.state        = g('f-state');
    S.filters.asm          = g('f-asm');
    S.filters.rm           = g('f-rm');
    S.filters.verification = g('f-verification');
    S.filters.tier         = g('f-tier');
    applyFilters();
  });
  el('reset-btn').addEventListener('click', resetFilters);

  // Search
  el('global-search').addEventListener('input', e => { S.filters.search = e.target.value; applyFilters(); });

  // Theme
  el('theme-toggle').addEventListener('click', toggleTheme);

  // Modal
  el('modal-close').addEventListener('click', closePartnerModal);
  el('partner-modal').addEventListener('click', e => { if (e.target === el('partner-modal')) closePartnerModal(); });

  // Excel
  el('download-excel-btn').addEventListener('click', downloadSampleExcel);
  el('schema-toggle-btn').addEventListener('click', () => el('schema-info').classList.toggle('hidden'));

  const mainUpload = el('excel-upload-main');
  el('upload-area').addEventListener('click', () => mainUpload.click());
  mainUpload.addEventListener('change', handleExcelUpload);

  const dsUpload = el('excel-upload-ds');
  dsUpload.addEventListener('change', handleExcelUpload);

  // Upload drag & drop
  const ua = el('upload-area');
  ua.addEventListener('dragover', e => { e.preventDefault(); ua.classList.add('drag-over'); });
  ua.addEventListener('dragleave', () => ua.classList.remove('drag-over'));
  ua.addEventListener('drop', e => {
    e.preventDefault(); ua.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f) handleExcelUpload({ target: { files: [f] } });
  });

  // Data source buttons
  el('use-demo-btn').addEventListener('click', () => {
    loadDemoData(); populateFilters(); renderDashboard(); renderAllPartners();
    updateDashboardCharts(); toast('Demo data loaded', 'ok');
  });
  el('connect-sheets-btn').addEventListener('click', connectGoogleSheets);
  el('connect-firebase-btn').addEventListener('click', connectFirebase);
});

// ─── Global Exports (used in inline onclick) ─────────────────────────────────
window.openPartnerModal    = openPartnerModal;
window.demoLogin           = demoLogin;
window.connectGoogleSheets = connectGoogleSheets;
window.connectFirebase     = connectFirebase;
