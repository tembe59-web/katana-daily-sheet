/* ── Katana Daily Delivery Sheet — App JS ── */
'use strict';

/* ── State ── */
let sheets    = [];
let delRows   = [];
let prodRows  = [];
let editingId = null;
let viewingId = null;

/* ── Storage helpers (localStorage) ── */
const STORAGE_KEY = 'katana_daily_sheets';

function loadSheets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    sheets = raw ? JSON.parse(raw) : [];
  } catch (e) {
    sheets = [];
  }
}

function saveSheets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sheets));
  } catch (e) {
    console.error('Erro ao guardar dados:', e);
  }
}

/* ── Navigation ── */
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const page = document.getElementById('page-' + name);
  if (page) page.classList.add('active');

  const navItem = document.querySelector(`[data-page="${name}"]`);
  if (navItem) navItem.classList.add('active');

  const titles = {
    'dashboard': 'Dashboard',
    'new-sheet': editingId ? 'Editar Sheet' : 'Novo Sheet',
    'history':   'Histórico',
    'view':      'Detalhe do Sheet'
  };
  document.getElementById('topbar-title').textContent = titles[name] || '';

  const actions = document.getElementById('topbar-actions');
  actions.innerHTML = '';

  if (name === 'new-sheet') {
    actions.innerHTML = `
      <button class="btn" onclick="showPage('dashboard')"><i class="ti ti-arrow-left"></i> Voltar</button>
      <button class="btn btn-primary" onclick="saveSheet()"><i class="ti ti-device-floppy"></i> Guardar</button>`;
    if (!editingId) initNewSheet();
  }

  if (name === 'history') renderHistory();
  if (name === 'dashboard') updateDashboard();

  closeSidebar();
}

/* ── Sidebar toggle (mobile) ── */
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
}

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

/* ── Sidebar date ── */
function updateSidebarDate() {
  const now = new Date();
  const opts = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
  document.getElementById('sidebar-date').textContent =
    now.toLocaleDateString('pt-PT', opts);
}

/* ── Nav links ── */
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    showPage(item.dataset.page);
  });
});

/* ── Toast ── */
function showToast(msg, duration = 3000) {
  const el = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

/* ── Helpers ── */
function formatDate(str) {
  if (!str) return '—';
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Init new sheet ── */
function initNewSheet() {
  editingId = null;
  document.getElementById('f-date').value      = new Date().toISOString().split('T')[0];
  document.getElementById('f-driver').value    = '';
  document.getElementById('f-route').value     = '';
  document.getElementById('f-ref').value       = '';
  document.getElementById('f-vehicle').value   = '';
  document.getElementById('f-supervisor').value= '';
  document.getElementById('f-obs').value       = '';
  delRows  = [];
  prodRows = [];
  addDelRow(); addDelRow(); addDelRow();
  addProdRow(); addProdRow();
}

/* ── Delivery rows ── */
function addDelRow(data = {}) {
  delRows.push({
    client: data.client || '',
    addr:   data.addr   || '',
    zone:   data.zone   || '',
    time:   data.time   || '',
    status: data.status || 'Realizada',
    sign:   data.sign   || ''
  });
  renderDelRows();
}

function renderDelRows() {
  const tb = document.getElementById('del-tbody');
  tb.innerHTML = '';
  delRows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="row-num">${i + 1}</td>
      <td><input type="text" value="${escHtml(r.client)}" placeholder="Cliente" onchange="delRows[${i}].client=this.value"></td>
      <td><input type="text" value="${escHtml(r.addr)}"   placeholder="Endereço" onchange="delRows[${i}].addr=this.value"></td>
      <td><input type="text" value="${escHtml(r.zone)}"   placeholder="Zona" onchange="delRows[${i}].zone=this.value"></td>
      <td><input type="text" value="${escHtml(r.time)}"   placeholder="00:00" style="width:64px" onchange="delRows[${i}].time=this.value"></td>
      <td>
        <select onchange="delRows[${i}].status=this.value">
          <option ${r.status==='Realizada'?'selected':''}>Realizada</option>
          <option ${r.status==='Pendente' ?'selected':''}>Pendente</option>
          <option ${r.status==='Falhada'  ?'selected':''}>Falhada</option>
        </select>
      </td>
      <td><input type="text" value="${escHtml(r.sign)}" placeholder="Recepção" onchange="delRows[${i}].sign=this.value"></td>
      <td>
        <button class="btn-icon del" onclick="delRows.splice(${i},1);renderDelRows()" aria-label="Remover linha">
          <i class="ti ti-trash"></i>
        </button>
      </td>`;
    tb.appendChild(tr);
  });
}

/* ── Product rows ── */
function addProdRow(data = {}) {
  prodRows.push({
    code:   data.code   || '',
    desc:   data.desc   || '',
    client: data.client || '',
    boxes:  data.boxes  || '',
    units:  data.units  || '',
    hs:     data.hs     || ''
  });
  renderProdRows();
}

function renderProdRows() {
  const tb = document.getElementById('prod-tbody');
  tb.innerHTML = '';
  prodRows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="row-num">${i + 1}</td>
      <td><input type="text"   value="${escHtml(r.code)}"   placeholder="Código" onchange="prodRows[${i}].code=this.value"></td>
      <td><input type="text"   value="${escHtml(r.desc)}"   placeholder="Descrição do produto" onchange="prodRows[${i}].desc=this.value"></td>
      <td><input type="text"   value="${escHtml(r.client)}" placeholder="Cliente" onchange="prodRows[${i}].client=this.value"></td>
      <td><input type="number" value="${escHtml(r.boxes)}"  min="0" style="width:64px;text-align:right" onchange="prodRows[${i}].boxes=this.value"></td>
      <td><input type="number" value="${escHtml(r.units)}"  min="0" style="width:72px;text-align:right" onchange="prodRows[${i}].units=this.value"></td>
      <td><input type="text"   value="${escHtml(r.hs)}"     placeholder="HS Code" onchange="prodRows[${i}].hs=this.value"></td>
      <td>
        <button class="btn-icon del" onclick="prodRows.splice(${i},1);renderProdRows()" aria-label="Remover linha">
          <i class="ti ti-trash"></i>
        </button>
      </td>`;
    tb.appendChild(tr);
  });
}

/* ── Save sheet ── */
function saveSheet() {
  const date = document.getElementById('f-date').value;
  if (!date) { showToast('⚠ Seleccione a data antes de guardar.'); return; }

  const sheet = {
    id:         editingId || Date.now(),
    date,
    driver:     document.getElementById('f-driver').value.trim(),
    route:      document.getElementById('f-route').value.trim(),
    ref:        document.getElementById('f-ref').value.trim(),
    vehicle:    document.getElementById('f-vehicle').value.trim(),
    supervisor: document.getElementById('f-supervisor').value.trim(),
    obs:        document.getElementById('f-obs').value.trim(),
    deliveries: JSON.parse(JSON.stringify(delRows)),
    products:   JSON.parse(JSON.stringify(prodRows)),
    createdAt:  editingId
      ? (sheets.find(s => s.id === editingId) || {}).createdAt || Date.now()
      : Date.now()
  };

  if (editingId) {
    const idx = sheets.findIndex(s => s.id === editingId);
    if (idx >= 0) sheets[idx] = sheet;
    else sheets.unshift(sheet);
  } else {
    sheets.unshift(sheet);
  }

  saveSheets();
  editingId = null;
  showToast('Sheet guardado com sucesso!');
  showPage('dashboard');
}

/* ── View sheet ── */
function viewSheet(id) {
  const s = sheets.find(x => x.id === id);
  if (!s) return;
  viewingId = id;

  const deliveries = s.deliveries || [];
  const products   = s.products   || [];
  const done  = deliveries.filter(d => d.status === 'Realizada').length;
  const total = deliveries.length;
  const boxes = products.reduce((a, p) => a + (+p.boxes || 0), 0);
  const units = products.reduce((a, p) => a + (+p.units || 0), 0);

  let html = `
    <div class="section-card" style="margin-bottom:16px">
      <div class="section-header">
        <h2 class="section-title"><i class="ti ti-file-description"></i> ${formatDate(s.date)}${s.ref ? ' · ' + escHtml(s.ref) : ''}</h2>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" onclick="showPage('history')"><i class="ti ti-arrow-left"></i> Voltar</button>
          <button class="btn btn-sm" onclick="editSheet(${id})"><i class="ti ti-edit"></i> Editar</button>
          <button class="btn btn-sm btn-danger" onclick="deleteSheet(${id})"><i class="ti ti-trash"></i> Eliminar</button>
          <button class="btn btn-sm btn-primary" onclick="printSheet(${id})"><i class="ti ti-printer"></i> Imprimir</button>
        </div>
      </div>

      <!-- Metrics mini -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px">
        <div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:12px 14px">
          <div style="font-size:11px;color:var(--gray-400);margin-bottom:3px">Total entregas</div>
          <div style="font-size:22px;font-weight:600">${total}</div>
        </div>
        <div style="background:#E2EFDA;border:1px solid #C6DFAE;border-radius:8px;padding:12px 14px">
          <div style="font-size:11px;color:#0F6E56;margin-bottom:3px">Realizadas</div>
          <div style="font-size:22px;font-weight:600;color:#0F6E56">${done}</div>
        </div>
        <div style="background:var(--amber-lt);border:1px solid #F0C060;border-radius:8px;padding:12px 14px">
          <div style="font-size:11px;color:var(--amber);margin-bottom:3px">Caixas</div>
          <div style="font-size:22px;font-weight:600;color:var(--amber)">${boxes}</div>
        </div>
        <div style="background:var(--blue-lt);border:1px solid #A0C4E8;border-radius:8px;padding:12px 14px">
          <div style="font-size:11px;color:var(--blue);margin-bottom:3px">Unidades</div>
          <div style="font-size:22px;font-weight:600;color:var(--blue)">${units}</div>
        </div>
      </div>

      <!-- Info grid -->
      <div class="view-info-grid">
        <div class="view-info-item"><div class="vii-label">Motorista</div><div class="vii-value">${escHtml(s.driver) || '—'}</div></div>
        <div class="view-info-item"><div class="vii-label">Rota</div><div class="vii-value">${escHtml(s.route) || '—'}</div></div>
        <div class="view-info-item"><div class="vii-label">Referência</div><div class="vii-value">${escHtml(s.ref) || '—'}</div></div>
        <div class="view-info-item"><div class="vii-label">Veículo / Matrícula</div><div class="vii-value">${escHtml(s.vehicle) || '—'}</div></div>
        <div class="view-info-item"><div class="vii-label">Supervisor</div><div class="vii-value">${escHtml(s.supervisor) || '—'}</div></div>
      </div>
    </div>`;

  /* Deliveries table */
  if (deliveries.length) {
    html += `<div class="section-card" style="margin-bottom:16px">
      <div class="section-header"><h2 class="section-title"><i class="ti ti-map-pin"></i> Entregas</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Cliente</th><th>Endereço</th><th>Zona</th><th>Hora</th><th>Estado</th><th>Recepção</th></tr></thead>
          <tbody>`;
    deliveries.forEach((d, i) => {
      const bc = d.status === 'Realizada' ? 'badge-ok' : d.status === 'Pendente' ? 'badge-pend' : 'badge-fail';
      html += `<tr>
        <td class="row-num">${i + 1}</td>
        <td>${escHtml(d.client) || '—'}</td>
        <td>${escHtml(d.addr)   || '—'}</td>
        <td>${escHtml(d.zone)   || '—'}</td>
        <td><span style="font-family:'DM Mono',monospace;font-size:12px">${escHtml(d.time) || '—'}</span></td>
        <td><span class="badge ${bc}">${escHtml(d.status)}</span></td>
        <td>${escHtml(d.sign)   || '—'}</td>
      </tr>`;
    });
    html += `</tbody></table></div></div>`;
  }

  /* Products table */
  if (products.length) {
    html += `<div class="section-card" style="margin-bottom:16px">
      <div class="section-header"><h2 class="section-title"><i class="ti ti-box"></i> Produtos entregues</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Código</th><th>Descrição</th><th>Cliente</th><th style="text-align:right">Caixas</th><th style="text-align:right">Unidades</th><th>HS Code</th></tr></thead>
          <tbody>`;
    products.forEach((p, i) => {
      html += `<tr>
        <td class="row-num">${i + 1}</td>
        <td><span style="font-family:'DM Mono',monospace;font-size:12px">${escHtml(p.code) || '—'}</span></td>
        <td>${escHtml(p.desc)   || '—'}</td>
        <td>${escHtml(p.client) || '—'}</td>
        <td style="text-align:right;font-weight:500">${(+p.boxes || 0)}</td>
        <td style="text-align:right;font-weight:500">${(+p.units || 0)}</td>
        <td><span style="font-family:'DM Mono',monospace;font-size:12px">${escHtml(p.hs) || '—'}</span></td>
      </tr>`;
    });
    html += `<tr class="tfoot-total">
      <td colspan="4" style="text-align:right;padding:9px 12px">Total</td>
      <td style="text-align:right">${boxes}</td>
      <td style="text-align:right">${units}</td>
      <td></td>
    </tr>`;
    html += `</tbody></table></div></div>`;
  }

  /* Obs */
  if (s.obs) {
    html += `<div class="section-card">
      <div class="section-header"><h2 class="section-title"><i class="ti ti-notes"></i> Observações</h2></div>
      <p style="font-size:13.5px;line-height:1.7;color:var(--gray-600)">${escHtml(s.obs).replace(/\n/g,'<br>')}</p>
    </div>`;
  }

  document.getElementById('view-content').innerHTML = html;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-view').classList.add('active');
  document.getElementById('topbar-title').textContent = 'Detalhe do Sheet';
  document.getElementById('topbar-actions').innerHTML = '';
}

/* ── Edit sheet ── */
function editSheet(id) {
  const s = sheets.find(x => x.id === id);
  if (!s) return;
  editingId = s.id;

  document.getElementById('f-date').value       = s.date       || '';
  document.getElementById('f-driver').value     = s.driver     || '';
  document.getElementById('f-route').value      = s.route      || '';
  document.getElementById('f-ref').value        = s.ref        || '';
  document.getElementById('f-vehicle').value    = s.vehicle    || '';
  document.getElementById('f-supervisor').value = s.supervisor || '';
  document.getElementById('f-obs').value        = s.obs        || '';

  delRows  = JSON.parse(JSON.stringify(s.deliveries || []));
  prodRows = JSON.parse(JSON.stringify(s.products   || []));
  renderDelRows();
  renderProdRows();

  showPage('new-sheet');
  document.getElementById('topbar-title').textContent = 'Editar Sheet';
}

/* ── Delete sheet ── */
function deleteSheet(id) {
  if (!confirm('Eliminar este sheet? Esta acção não pode ser desfeita.')) return;
  sheets = sheets.filter(s => s.id !== id);
  saveSheets();
  viewingId = null;
  showToast('Sheet eliminado.');
  showPage('history');
}

/* ── Print sheet ── */
function printSheet(id) {
  const s = sheets.find(x => x.id === id);
  if (!s) return;

  const deliveries = s.deliveries || [];
  const products   = s.products   || [];
  const done  = deliveries.filter(d => d.status === 'Realizada').length;
  const boxes = products.reduce((a, p) => a + (+p.boxes || 0), 0);
  const units = products.reduce((a, p) => a + (+p.units || 0), 0);

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html lang="pt"><head><meta charset="UTF-8">
<title>Katana · Daily Sheet · ${formatDate(s.date)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'DM Sans',sans-serif;font-size:11pt;color:#1C1C1A;background:#fff;padding:2cm}
  h1{font-size:16pt;font-weight:600;color:#1F4E79;margin-bottom:2px}
  .sub{font-size:9pt;color:#888;margin-bottom:16px}
  .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;background:#F8F8F7;border:1px solid #E2E0DA;border-radius:6px;padding:12px 14px;margin-bottom:18px}
  .info-item .lbl{font-size:8pt;color:#9B9990;text-transform:uppercase;letter-spacing:.06em;font-weight:600}
  .info-item .val{font-size:11pt;font-weight:500;margin-top:2px}
  .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}
  .mc{border:1px solid #E2E0DA;border-radius:6px;padding:10px 12px}
  .mc .ml{font-size:8pt;color:#9B9990;margin-bottom:3px}
  .mc .mv{font-size:18pt;font-weight:600}
  h2{font-size:10pt;font-weight:600;color:#5F5E5A;text-transform:uppercase;letter-spacing:.06em;margin:18px 0 8px;display:flex;align-items:center;gap:6px}
  table{width:100%;border-collapse:collapse;font-size:10pt;margin-bottom:16px}
  th{background:#F8F8F7;padding:7px 10px;text-align:left;font-size:8.5pt;font-weight:600;color:#9B9990;text-transform:uppercase;letter-spacing:.05em;border-bottom:1.5px solid #E2E0DA}
  td{padding:6px 10px;border-bottom:1px solid #F0EFEB;vertical-align:middle}
  tr:last-child td{border-bottom:none}
  .badge{padding:2px 8px;border-radius:99px;font-size:9pt;font-weight:500}
  .ok{background:#E2EFDA;color:#0F6E56}.pend{background:#FFF2CC;color:#BA7517}.fail{background:#FCEBEB;color:#A32D2D}
  .tfoot td{font-weight:600;background:#F8F8F7;border-top:2px solid #E2E0DA}
  .sigs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:28px}
  .sig{border-top:1.5px solid #1C1C1A;padding-top:6px;font-size:8.5pt;color:#9B9990;text-align:center}
  .obs-box{border:1px solid #E2E0DA;border-radius:6px;padding:10px 14px;min-height:60px;font-size:10pt;line-height:1.6;margin-bottom:16px;white-space:pre-wrap}
  .mono{font-family:'DM Mono',monospace;font-size:9.5pt}
  @media print{@page{margin:1.5cm}body{padding:0}}
</style></head><body>

<h1>Katana Trading · Daily Delivery Sheet</h1>
<div class="sub">Maputo · Mozambique &nbsp;·&nbsp; ${formatDate(s.date)}${s.ref ? ' &nbsp;·&nbsp; Ref: ' + escHtml(s.ref) : ''}</div>

<div class="info-grid">
  <div class="info-item"><div class="lbl">Motorista</div><div class="val">${escHtml(s.driver)||'—'}</div></div>
  <div class="info-item"><div class="lbl">Rota</div><div class="val">${escHtml(s.route)||'—'}</div></div>
  <div class="info-item"><div class="lbl">Veículo</div><div class="val">${escHtml(s.vehicle)||'—'}</div></div>
  <div class="info-item"><div class="lbl">Supervisor</div><div class="val">${escHtml(s.supervisor)||'—'}</div></div>
  <div class="info-item"><div class="lbl">Data</div><div class="val">${formatDate(s.date)}</div></div>
  <div class="info-item"><div class="lbl">Referência</div><div class="val">${escHtml(s.ref)||'—'}</div></div>
</div>

<div class="metrics">
  <div class="mc"><div class="ml">Total entregas</div><div class="mv">${deliveries.length}</div></div>
  <div class="mc"><div class="ml">Realizadas</div><div class="mv" style="color:#0F6E56">${done}</div></div>
  <div class="mc"><div class="ml">Caixas</div><div class="mv" style="color:#BA7517">${boxes}</div></div>
  <div class="mc"><div class="ml">Unidades</div><div class="mv" style="color:#2E75B6">${units}</div></div>
</div>

<h2>Entregas realizadas</h2>
<table>
  <thead><tr><th>#</th><th>Cliente</th><th>Endereço</th><th>Zona</th><th>Hora</th><th>Estado</th><th>Assinatura</th></tr></thead>
  <tbody>
    ${deliveries.map((d,i)=>`<tr>
      <td style="color:#9B9990;font-size:9pt">${i+1}</td>
      <td>${escHtml(d.client)||'—'}</td>
      <td>${escHtml(d.addr)||'—'}</td>
      <td>${escHtml(d.zone)||'—'}</td>
      <td class="mono">${escHtml(d.time)||'—'}</td>
      <td><span class="badge ${d.status==='Realizada'?'ok':d.status==='Pendente'?'pend':'fail'}">${escHtml(d.status)}</span></td>
      <td>${escHtml(d.sign)||''}</td>
    </tr>`).join('')}
  </tbody>
</table>

<h2>Produtos entregues</h2>
<table>
  <thead><tr><th>#</th><th>Código</th><th>Descrição</th><th>Cliente</th><th>Caixas</th><th>Unidades</th><th>HS Code</th></tr></thead>
  <tbody>
    ${products.map((p,i)=>`<tr>
      <td style="color:#9B9990;font-size:9pt">${i+1}</td>
      <td class="mono">${escHtml(p.code)||'—'}</td>
      <td>${escHtml(p.desc)||'—'}</td>
      <td>${escHtml(p.client)||'—'}</td>
      <td style="text-align:right;font-weight:500">${+p.boxes||0}</td>
      <td style="text-align:right;font-weight:500">${+p.units||0}</td>
      <td class="mono">${escHtml(p.hs)||'—'}</td>
    </tr>`).join('')}
    <tr class="tfoot">
      <td colspan="4" style="text-align:right">Total</td>
      <td style="text-align:right">${boxes}</td>
      <td style="text-align:right">${units}</td>
      <td></td>
    </tr>
  </tbody>
</table>

${s.obs ? `<h2>Observações</h2><div class="obs-box">${escHtml(s.obs)}</div>` : ''}

<div class="sigs">
  <div class="sig">Motorista / Entregador</div>
  <div class="sig">Supervisor</div>
  <div class="sig">Cliente (Recepção)</div>
</div>

<script>window.onload=()=>{window.print();}<\/script>
</body></html>`);
  win.document.close();
}

/* ── Dashboard ── */
function updateDashboard() {
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();

  const thisMonth = sheets.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const allDel  = sheets.flatMap(s => s.deliveries || []);
  const allProd = sheets.flatMap(s => s.products   || []);

  document.getElementById('m-sheets').textContent = thisMonth.length;
  document.getElementById('m-total').textContent  = allDel.length;
  document.getElementById('m-done').textContent   = allDel.filter(d => d.status === 'Realizada').length;
  document.getElementById('m-boxes').textContent  = allProd.reduce((a, p) => a + (+p.boxes || 0), 0);

  const recentList = document.getElementById('recent-list');
  if (!sheets.length) {
    recentList.innerHTML = `<div class="empty-state">
      <i class="ti ti-inbox"></i>
      <p>Nenhum sheet criado ainda.</p>
      <button class="btn btn-primary" onclick="showPage('new-sheet')">Criar primeiro sheet</button>
    </div>`;
    return;
  }

  const recent = sheets.slice(0, 8);
  recentList.innerHTML = `<div class="sheet-list">${recent.map(sheetItemHTML).join('')}</div>`;
}

/* ── History ── */
function renderHistory() {
  const q = (document.getElementById('search-input') || {}).value || '';
  const filtered = sheets.filter(s => {
    if (!q) return true;
    const txt = [s.date, s.driver, s.route, s.ref, s.vehicle, s.supervisor].join(' ').toLowerCase();
    return txt.includes(q.toLowerCase());
  });

  const histList = document.getElementById('history-list');
  if (!filtered.length) {
    histList.innerHTML = `<div class="empty-state">
      <i class="ti ti-search"></i>
      <p>Nenhum sheet encontrado${q ? ' para "' + escHtml(q) + '"' : ''}.</p>
    </div>`;
    return;
  }

  histList.innerHTML = `<div class="sheet-list">${filtered.map(sheetItemHTML).join('')}</div>`;
}

/* ── Sheet item HTML ── */
function sheetItemHTML(s) {
  const deliveries = s.deliveries || [];
  const products   = s.products   || [];
  const done  = deliveries.filter(d => d.status === 'Realizada').length;
  const pend  = deliveries.filter(d => d.status === 'Pendente').length;
  const fail  = deliveries.filter(d => d.status === 'Falhada').length;
  const total = deliveries.length;
  const boxes = products.reduce((a, p) => a + (+p.boxes || 0), 0);

  const badgesHtml = `
    ${total > 0 ? `<span class="badge badge-ok"><i class="ti ti-check" style="font-size:11px"></i> ${done}</span>` : ''}
    ${pend  > 0 ? `<span class="badge badge-pend">${pend} pend.</span>` : ''}
    ${fail  > 0 ? `<span class="badge badge-fail">${fail} falh.</span>` : ''}`;

  return `<div class="sheet-item" onclick="viewSheet(${s.id})">
    <div class="sheet-item-left">
      <div class="sheet-date">${formatDate(s.date)}${s.ref ? ' <span style="font-weight:400;color:var(--gray-400)">· ' + escHtml(s.ref) + '</span>' : ''}</div>
      <div class="sheet-meta">${escHtml(s.driver) || 'Sem motorista'}${s.route ? ' · ' + escHtml(s.route) : ''} · ${total} entregas · ${boxes} caixas</div>
    </div>
    <div class="sheet-right">
      ${badgesHtml}
      <i class="ti ti-chevron-right" style="color:var(--gray-400);font-size:18px"></i>
    </div>
  </div>`;
}

/* ── Boot ── */
(function init() {
  loadSheets();
  updateSidebarDate();
  updateDashboard();
  showPage('dashboard');
})();
