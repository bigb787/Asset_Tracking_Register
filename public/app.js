const $ = (sel) => document.querySelector(sel);
const TABLES = [
  {
    key: 'laptops',
    label: 'Laptop',
    fields: [
      ['asset_type', 'Asset type'],
      ['asset_manufacturer', 'Asset Manufacturer'],
      ['service_tag', 'Service Tag'],
      ['model', 'Model'],
      ['p_n', 'P/N'],
      ['asset_owner', 'Asset Owner'],
      ['assigned_to', 'Assigned To'],
      ['asset_status', 'Asset Status'],
      ['last_owner', 'Last Owner'],
      ['dept', 'Dept'],
      ['location', 'Location'],
      ['asset_health', 'Asset Health'],
      ['warranty', 'Warranty'],
      ['install_date', 'Install date'],
      ['date_added_updated', 'Date Added/Updated'],
      ['processor', 'Processor'],
      ['ram', 'RAM'],
      ['harddisk', 'HardDisk'],
      ['o_s', 'O/S'],
      ['supt_vendor', 'Supt Vendor'],
      ['keyboard', 'Keyboard'],
      ['mouse', 'Mouse'],
      ['headphone', 'HeadPhone'],
      ['usb_extender', 'USB Extender'],
      ['contains_pii', 'Contains PII (Yes/No)'],
      ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'desktops',
    label: 'Desktop',
    fields: [
      ['asset_type', 'Asset type'], ['asset_manufacturer', 'Asset Manufacturer'], ['processor', 'Processor'],
      ['asset_owner', 'Asset Owner'], ['dept', 'Dept'], ['location', 'Location'], ['model', 'Model'],
      ['service_tag', 'Service Tag'], ['warranty', 'Warranty'], ['install_date', 'Install date'],
      ['o_s', 'O/S'], ['supt_vendor', 'Supt Vendor'], ['configuration', 'Configuration'],
      ['contains_pii', 'Contains PII (Yes/No)'], ['date_added_updated', 'Date Added/Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'monitors',
    label: 'Monitor',
    fields: [
      ['asset_type', 'Asset type'], ['user_name', 'User'], ['model', 'Model'], ['warranty', 'Warranty'],
      ['install_date', 'INSTALL DATE'], ['supt_vendor', 'Supt Vendor'], ['location', 'Location'], ['dept', 'Dept'],
      ['asset_owner', 'Asset Owner'], ['contains_pii', 'Contains PII (Yes/No)'], ['date_added_updated', 'Date Added/Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'networking',
    label: 'Networking',
    fields: [
      ['asset_type', 'Asset type'], ['user_name', 'User'], ['model', 'Model'], ['s_n', 'S/N'],
      ['warranty', 'Warranty'], ['supt_vendor', 'Supt Vendor'], ['location', 'Location'], ['dept', 'Dept'],
      ['asset_owner', 'Asset Owner'], ['contains_pii', 'Contains PII (Yes/No)'], ['date_added_updated', 'Date Added/Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'cloud_asset_register',
    label: 'Cloud Asset Register',
    fields: [
      ['asset', 'Asset'], ['asset_type', 'Asset Type'], ['asset_value', 'Asset Value'], ['asset_owner', 'Asset Owner'],
      ['asset_location', 'Asset Location'], ['contains_pii_data', 'Contains PII data?'], ['asset_region', 'Asset Region'],
      ['date_added_updated', 'Date Added/ Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'infodesk_applications',
    label: 'Infodesk Applications',
    fields: [
      ['asset', 'Asset'], ['asset_type', 'Asset Type'], ['asset_owner', 'Asset Owner'], ['asset_location', 'Asset Location'],
      ['contains_pii_data', 'Contains PII data?'], ['date_added_updated', 'Date Added/ Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'third_party_softwares',
    label: 'Third Party Softwares',
    fields: [
      ['asset', 'Asset'], ['asset_type', 'Asset Type'], ['asset_value', 'Asset Value'], ['asset_owner', 'Asset Owner'],
      ['asset_location', 'Asset Location'], ['contains_pii_data', 'Contains PII data?'], ['date_added_updated', 'Date Added/ Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'ups',
    label: 'UPS',
    fields: [
      ['asset_type', 'Asset type'], ['device_id', 'Device Id'], ['model', 'Model'], ['warranty', 'Warranty'],
      ['install_date', 'INSTALL DATE'], ['supt_vendor', 'Supt Vendor'], ['location', 'Location'], ['dept', 'Dept'],
      ['asset_owner', 'Asset Owner'], ['date_added_updated', 'Date Added/Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'mobile_phones',
    label: 'Mobile Phones',
    fields: [
      ['asset_type', 'Asset type'], ['model', 'Model'], ['warranty', 'Warranty'], ['supt_vendor', 'Supt Vendor'],
      ['location', 'Location'], ['dept', 'Dept'], ['asset_owner', 'Asset Owner'], ['contains_pii', 'Contains PII (Yes/No)'],
      ['date_added_updated', 'Date Added/Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'scanners_and_others',
    label: 'Scanners and Others',
    fields: [
      ['asset_type', 'Asset type'], ['model', 'Model'], ['s_n', 'S/N'], ['warranty', 'Warranty'], ['supt_vendor', 'Supt Vendor'],
      ['location', 'Location'], ['dept', 'Dept'], ['asset_owner', 'Asset Owner'], ['contains_pii', 'Contains PII (Yes/No)'],
      ['date_added_updated', 'Date Added/Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'admin_assets',
    label: 'Admin',
    fields: [
      ['asset_type', 'Asset type'], ['invoice_no', 'Invoice No'], ['warranty', 'Warranty'], ['install_date', 'INSTALL DATE'],
      ['supt_vendor', 'Supt Vendor'], ['location', 'Location'], ['dept', 'Dept'], ['asset_owner', 'Asset Owner'],
      ['contains_pii', 'Contains PII (Yes/No)'], ['date_added_updated', 'Date Added/Updated'], ['free_note', 'Free (?)'],
    ],
  },
  {
    key: 'gatepasses',
    label: 'Gate Passes',
    fields: [],
  },
];

/** When the UI is served under a path prefix (e.g. https://host/asset-register/), set
 * <meta name="asset-register-base" content="/asset-register" /> in index.html (overrides auto-detect).
 * If meta is empty, base is inferred from location so /api and static links work behind a reverse proxy path. */
function inferAssetRegisterBasePath() {
  try {
    let path = window.location.pathname || '/';
    if (path.endsWith('/')) path = path.slice(0, -1);
    const lower = path.toLowerCase();
    if (lower.endsWith('/index.html')) path = path.slice(0, -'/index.html'.length);
    if (!path || path === '/') return '';
    return path;
  } catch {
    return '';
  }
}

const META_BASE = (
  document.querySelector('meta[name="asset-register-base"]')?.getAttribute('content') || ''
)
  .trim()
  .replace(/\/$/, '');
const APP_BASE = META_BASE || inferAssetRegisterBasePath();
function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${APP_BASE}${p}`;
}

const AUTH_TOKEN_KEY = 'asset_register_jwt';
/** When sessionStorage is blocked, keep JWT in memory for this tab so API calls still work. */
let authTokenMemory = '';

function getAuthToken() {
  try {
    const fromStore = sessionStorage.getItem(AUTH_TOKEN_KEY) || '';
    if (fromStore) return fromStore;
  } catch {
    /* private mode / blocked storage */
  }
  return authTokenMemory || '';
}

function setAuthToken(token) {
  authTokenMemory = token || '';
  try {
    if (token) sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    else sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* still have authTokenMemory */
  }
}

function clearAuthToken() {
  setAuthToken('');
}

function buildFetchInit(opts = {}) {
  const rawHeaders = opts.headers;
  const { headers: _omit, ...rest } = opts;
  const init = { credentials: 'same-origin', cache: 'no-store', ...rest };
  const headers = new Headers(rawHeaders || undefined);
  const token = getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  init.headers = headers;
  return init;
}

function filenameFromContentDisposition(cd, fallback) {
  if (!cd) return fallback;
  const star = cd.match(/filename\*=UTF-8''([^;\s]+)/i);
  if (star) {
    try {
      return decodeURIComponent(star[1]);
    } catch {
      return star[1];
    }
  }
  const quoted = cd.match(/filename="([^"]+)"/i);
  if (quoted) return quoted[1];
  const plain = cd.match(/filename=([^;\s]+)/i);
  if (plain) return plain[1].replace(/['"]/g, '');
  return fallback;
}

async function downloadAuthenticatedFile(url, fallbackName) {
  const res = await fetch(url, buildFetchInit());
  if (!res.ok) {
    const text = await res.text();
    let msg = res.statusText;
    try {
      msg = JSON.parse(text).error || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const name = filenameFromContentDisposition(res.headers.get('Content-Disposition'), fallbackName);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

async function openAuthenticatedHtml(url) {
  const res = await fetch(url, buildFetchInit());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text?.slice(0, 240) || res.statusText);
  }
  const html = await res.text();
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, '_blank');
  setTimeout(() => URL.revokeObjectURL(objectUrl), 120_000);
}

async function getSessionUser() {
  const res = await fetch(apiUrl('/api/auth/session'), buildFetchInit());
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    if (res.status === 401) clearAuthToken();
    return null;
  }
  if (!data?.user) return null;
  return data.user;
}

async function fetchJSON(url, opts) {
  const res = await fetch(url, buildFetchInit(opts));
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
      if (!serverAuthDisabled) showLogin();
      throw new Error(data?.error || 'Please login first');
    }
    const msg = data?.error || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

async function loginWithPassword(username, password) {
  const res = await fetch(
    apiUrl('/api/auth/login'),
    buildFetchInit({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  );
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(data?.error || res.statusText || 'Login failed');
  }
  if (!data?.user || typeof data.user.username !== 'string') {
    const hint = text && text.length > 0 && text.length < 400 ? text.slice(0, 400) : '';
    throw new Error(
      hint
        ? `Server returned an unexpected response (not JSON). ${hint}`
        : 'Login succeeded but the server response was missing user data. Redeploy the latest API, or clear cache and retry.'
    );
  }
  if (data.authDisabled) serverAuthDisabled = true;
  return data;
}

let activeUser = null;
/** Set when server returns authDisabled (temporary open API). */
let serverAuthDisabled = false;
let currentTable = TABLES[0];
let editingRowId = null;
let currentRows = [];
let editingGatepassId = null;
let currentTableSearch = '';
let currentGatepassSearch = '';
let laptopStatusFilter = 'all';
let tableSearchDebounce = null;

function showHome() {
  $('#homeScreen').classList.remove('hidden');
  $('#regScreen').classList.add('hidden');
}

function showRegister() {
  $('#homeScreen').classList.add('hidden');
  $('#regScreen').classList.remove('hidden');
}

function tableMetaForPicker(tableKey) {
  if (tableKey === 'gatepasses') {
    return {
      key: 'gatepasses',
      name: 'Gate Passes',
      loc: 'Laptop gate pass register',
      iconBg: '#E6F1FB',
      iconColor: '#185FA5',
    };
  }
  const t = TABLES.find((x) => x.key === tableKey) || TABLES[0];
  const slug = t.key.replace(/_/g, ' ');
  return {
    key: t.key,
    name: t.label,
    loc: `Asset register · ${slug}`,
    iconBg: '#EAF3DE',
    iconColor: '#3B6D11',
  };
}

function wireTablePickerNavigation() {
  const list = document.querySelector('#tablePickerList');
  if (!list || list.dataset.navWired === '1') return;
  list.dataset.navWired = '1';
  list.addEventListener('click', (ev) => {
    const row = ev.target.closest('.tbl-picker-row');
    if (!row || !list.contains(row)) return;
    const key = row.getAttribute('data-key');
    if (!key) return;
    openTableView(key).catch((e) => {
      console.error(e);
      alert(
        e && typeof e === 'object' && 'message' in e && e.message
          ? String(e.message)
          : 'Could not open this table. Check that you are still signed in and try again.'
      );
    });
  });
  list.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    const row = ev.target.closest('.tbl-picker-row');
    if (!row || !list.contains(row)) return;
    ev.preventDefault();
    const key = row.getAttribute('data-key');
    if (!key) return;
    openTableView(key).catch((e) => {
      console.error(e);
      alert(
        e && typeof e === 'object' && 'message' in e && e.message
          ? String(e.message)
          : 'Could not open this table.'
      );
    });
  });
}

function renderTablePickerList(query) {
  const q = String(query || '').trim().toLowerCase();
  const items = [
    ...TABLES.filter((t) => t.key !== 'gatepasses').map((t) => tableMetaForPicker(t.key)),
    tableMetaForPicker('gatepasses'),
  ].filter((w) => !q || w.name.toLowerCase().includes(q) || w.loc.toLowerCase().includes(q));

  const list = $('#tablePickerList');
  if (!list) return;
  wireTablePickerNavigation();
  list.innerHTML = items
    .map(
      (w) => `
      <div class="tbl-picker-row" role="listitem" tabindex="0" data-key="${escapeHtml(w.key)}"
        aria-label="Open ${escapeHtml(w.name)} table">
        <span class="tbl-picker-dot tbl-picker-dot--pending" data-tbl-dot aria-hidden="true"></span>
        <div class="tbl-picker-main">
          <div class="tbl-picker-name">${escapeHtml(w.name)}</div>
          <div class="tbl-picker-desc">${escapeHtml(w.loc)}</div>
        </div>
        <div class="tbl-picker-count" data-tbl-count>…</div>
        <span class="tbl-picker-badge tbl-picker-badge--pending" data-tbl-badge>…</span>
      </div>`
    )
    .join('');
}

async function hydrateTablePickerSummaries() {
  const rows = document.querySelectorAll('#tablePickerList .tbl-picker-row[data-key]');
  await Promise.all(
    Array.from(rows).map(async (row) => {
      const key = row.getAttribute('data-key');
      if (!key) return;
      const countEl = row.querySelector('[data-tbl-count]');
      const badgeEl = row.querySelector('[data-tbl-badge]');
      const dotEl = row.querySelector('[data-tbl-dot]');
      try {
        const s = await fetchJSON(apiUrl(`/api/workspace/${encodeURIComponent(key)}/summary`));
        const total = typeof s.total === 'number' && !Number.isNaN(s.total) ? s.total : null;
        if (countEl) {
          countEl.textContent =
            total == null ? '—' : `${total} ${total === 1 ? 'asset' : 'assets'}`;
        }
        if (badgeEl) {
          if (s.alertCount > 0) {
            const n = s.alertCount;
            badgeEl.textContent = `${n} alert${n === 1 ? '' : 's'}`;
            badgeEl.className = 'tbl-picker-badge tbl-picker-badge--alert';
          } else {
            badgeEl.textContent = 'All clear';
            badgeEl.className = 'tbl-picker-badge tbl-picker-badge--ok';
          }
        }
        if (dotEl) {
          dotEl.classList.remove('tbl-picker-dot--pending', 'tbl-picker-dot--ok', 'tbl-picker-dot--alert');
          dotEl.classList.add(s.alertCount > 0 ? 'tbl-picker-dot--alert' : 'tbl-picker-dot--ok');
        }
      } catch (_e) {
        if (countEl) countEl.textContent = '—';
        if (badgeEl) {
          badgeEl.textContent = '—';
          badgeEl.className = 'tbl-picker-badge tbl-picker-badge--muted';
        }
        if (dotEl) {
          dotEl.classList.remove('tbl-picker-dot--pending', 'tbl-picker-dot--ok', 'tbl-picker-dot--alert');
          dotEl.classList.add('tbl-picker-dot--muted');
        }
      }
    })
  );
}

function scheduleTablePickerRefresh() {
  clearTimeout(tableSearchDebounce);
  tableSearchDebounce = setTimeout(() => {
    const q = String(document.querySelector('#tableSearch')?.value || '');
    renderTablePickerList(q);
    hydrateTablePickerSummaries().catch((e) => console.error(e));
  }, 280);
}

async function openTableView(tableKey) {
  const meta = tableMetaForPicker(tableKey);
  $('#breadName').textContent = meta.name;
  $('#regTitle').textContent = meta.name;
  $('#regSub').textContent = meta.loc;
  $('#regIcon').style.background = meta.iconBg;
  $('#regIcon').innerHTML = `<svg width="18" height="18" viewBox="0 0 20 20" fill="${escapeHtml(
    meta.iconColor
  )}"><rect x="2" y="8" width="16" height="10" rx="1.5"/><path d="M1 8l9-6 9 6" fill="none" stroke="${escapeHtml(
    meta.iconColor
  )}" stroke-width="1.5"/></svg>`;

  showRegister();
  await setCurrentTable(tableKey);
}

function setLoginError(message) {
  const el = document.querySelector('#login-error');
  if (!el) return;
  if (!message) {
    el.textContent = '';
    el.classList.add('hidden');
    return;
  }
  el.textContent = message;
  el.classList.remove('hidden');
}

function showLogin() {
  if (serverAuthDisabled) {
    showApp(activeUser || { id: 0, username: 'dev', role: 'admin' });
    showHome();
    return;
  }
  $('#session-warning')?.classList?.add('hidden');
  $('#login-view').classList.remove('hidden');
  $('#app-view').classList.add('hidden');
  $('#auth-user').textContent = '';
}

function showApp(user) {
  activeUser = user;
  setLoginError('');
  $('#session-warning')?.classList?.add('hidden');
  $('#login-view').classList.add('hidden');
  $('#app-view').classList.remove('hidden');
  const name = user && typeof user.username === 'string' ? user.username : 'user';
  $('#auth-user').textContent = serverAuthDisabled
    ? `Open access (auth off) · ${name}`
    : `Logged in as ${name}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeDisplayValue(value) {
  return value == null || value === '' ? '—' : String(value);
}

function summarizeImportResult(result) {
  const parts = [`Imported: ${result.imported || 0}`, `Skipped: ${result.skipped || 0}`];
  if (result.skippedRows?.length) {
    parts.push(`Skipped rows: ${result.skippedRows.length}`);
    parts.push(result.skippedRows.slice(0, 5).join('\n'));
  }
  if (result.errors?.length) {
    parts.push(`Errors: ${result.errors.length}`);
    parts.push(result.errors.slice(0, 5).join('\n'));
  }
  return parts.join('\n');
}

async function uploadImport(tableKey, file) {
  const formData = new FormData();
  formData.append('file', file);
  return fetchJSON(apiUrl(`/api/import/${tableKey}`), {
    method: 'POST',
    body: formData,
  });
}

function renderCellInput(key, value) {
  return `<input class="row-edit-input" data-key="${escapeHtml(key)}" value="${escapeHtml(
    value ?? ''
  )}" />`;
}

function renderGatepassInput(key, value) {
  if (key === 'status') {
    const statuses = ['draft', 'approved', 'returned', 'cancelled'];
    return `<select class="row-edit-input" data-key="status">${statuses
      .map(
        (status) =>
          `<option value="${status}"${String(value || '').toLowerCase() === status ? ' selected' : ''}>${status}</option>`
      )
      .join('')}</select>`;
  }
  if (key === 'gatepass_type') {
    const types = ['temporary', 'permanent'];
    return `<select class="row-edit-input" data-key="gatepass_type">${types
      .map(
        (type) =>
          `<option value="${type}"${String(value || '').toLowerCase() === type ? ' selected' : ''}>${type}</option>`
      )
      .join('')}</select>`;
  }
  return `<input class="row-edit-input" data-key="${escapeHtml(key)}" value="${escapeHtml(value ?? '')}" />`;
}

let tableSelectChangeWired = false;
function renderTableSelector() {
  const select = $('#table-select');
  if (!select) return;
  select.innerHTML = TABLES.map((t) => `<option value="${t.key}">${escapeHtml(t.label)}</option>`).join('');
  select.value = currentTable.key;
  if (tableSelectChangeWired) return;
  tableSelectChangeWired = true;
  select.addEventListener('change', async (ev) => {
    const selected = TABLES.find((t) => t.key === ev.target.value);
    if (!selected) return;
    await setCurrentTable(selected.key);
  });
}

function updateSectionSwitcher() {
  // no-op in new UI (table list drives navigation)
}

async function setCurrentTable(tableKey) {
  const selected = TABLES.find((t) => t.key === tableKey);
  if (!selected) return;
  currentTable = selected;
  $('#table-select').value = currentTable.key;
  if (currentTable.key !== 'gatepasses') {
    $('#table-search-input').value = currentTableSearch;
  }
  updateSectionSwitcher();
  renderDynamicForm();
  await refresh();
}

function renderAddAssetForm() {
  const form = $('#dynamic-form');
  if (!form) return;
  if (currentTable.key === 'gatepasses') {
    form.innerHTML = '';
    return;
  }
  const fields = currentTable.fields
    .map(
      ([k, label]) =>
        `<label class="add-field">${escapeHtml(label)}<input name="${escapeHtml(
          k
        )}" type="text" autocomplete="off" /></label>
`
    )
    .join('');
  form.innerHTML = `${fields}<div class="add-form-actions"><button type="submit" class="primary-btn">Save record</button></div>`;
}

function updateRegScreenStats() {
  const regStats = $('#reg-stats');
  const pageInfo = $('#reg-page-info');
  if (currentTable.key === 'gatepasses') {
    if (regStats) regStats.classList.add('hidden');
    if (pageInfo) {
      pageInfo.textContent = '';
      pageInfo.classList.add('hidden');
    }
    return;
  }
  if (regStats) regStats.classList.remove('hidden');
  if (pageInfo) pageInfo.classList.remove('hidden');
  const set = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
  };
  const n = currentRows.length;
  set('reg-stat-total', String(n));
  if (currentTable.key === 'laptops') {
    const norm = (s) => String(s || '').trim().toLowerCase();
    let a = 0;
    let b = 0;
    let c = 0;
    currentRows.forEach((r) => {
      const st = norm(r.asset_status);
      if (st === 'available') a += 1;
      else if (st === 'allocated') b += 1;
      else if (st === 'to be scrapped' || st === 'under repairing') c += 1;
    });
    set('reg-stat-s1', String(a));
    set('reg-stat-s2', String(b));
    set('reg-stat-s3', String(c));
    set('reg-stat-lbl-s1', 'Available');
    set('reg-stat-lbl-s2', 'Allocated');
    set('reg-stat-lbl-s3', 'Attention');
  } else {
    set('reg-stat-s1', '—');
    set('reg-stat-s2', '—');
    set('reg-stat-s3', '—');
    set('reg-stat-lbl-s1', '—');
    set('reg-stat-lbl-s2', '—');
    set('reg-stat-lbl-s3', '—');
  }
  const filtered =
    Boolean(currentTableSearch) ||
    (currentTable.key === 'laptops' && laptopStatusFilter && laptopStatusFilter !== 'all');
  if (pageInfo) {
    pageInfo.textContent = `Showing ${n} record${n === 1 ? '' : 's'}${filtered ? ' (filtered)' : ''}`;
  }
}

function renderDynamicForm() {
  $('#history-title').textContent =
    currentTable.key === 'gatepasses' ? 'Gate Passes History' : `${currentTable.label} History`;
  $('#history-panel').open = false;
  $('#add-asset-panel')?.classList?.add('hidden');
  if (currentTable.key === 'gatepasses') {
    $('#gatepass-panel').classList.remove('hidden');
    $('#asset-table-wrap').classList.add('hidden');
    $('#reg-add-asset-btn')?.classList?.add('hidden');
  } else {
    $('#gatepass-panel').classList.add('hidden');
    $('#asset-table-wrap').classList.remove('hidden');
    $('#reg-add-asset-btn')?.classList?.remove('hidden');
  }
  renderAddAssetForm();
  if (currentTable.key === 'laptops') {
    $('#laptop-status-filter').classList.remove('hidden');
    $('#laptop-status-filter').value = laptopStatusFilter;
  } else {
    $('#laptop-status-filter').classList.add('hidden');
  }
  if (currentTable.key === 'gatepasses') {
    $('#table-import-btn').disabled = true;
    $('#table-search-btn').disabled = true;
    $('#table-search-clear-btn').disabled = true;
    return;
  }
  $('#table-import-btn').disabled = false;
  $('#table-search-btn').disabled = false;
  $('#table-search-clear-btn').disabled = false;
}

async function loadCurrentTable() {
  if (currentTable.key === 'gatepasses') {
    currentRows = [];
    updateRegScreenStats();
    return;
  }
  const q = new URLSearchParams();
  if (currentTableSearch) q.set('search', currentTableSearch);
  if (currentTable.key === 'laptops' && laptopStatusFilter && laptopStatusFilter !== 'all') {
    q.set('status', laptopStatusFilter);
  }
  const rows = await fetchJSON(apiUrl(`/api/register/${currentTable.key}?${q.toString()}`));
  if (!Array.isArray(rows)) {
    throw new Error('Server returned invalid data for this table (expected a list).');
  }
  currentRows = rows;
  const head = $('#data-head');
  const body = $('#data-rows');
  head.innerHTML = `<tr><th>Row Actions</th>${currentTable.fields
    .map(([, label]) => `<th>${escapeHtml(label)}</th>`)
    .join('')}</tr>`;
  if (!rows.length) {
    const emptyMessage =
      currentTable.key === 'laptops'
        ? 'No records yet. Use Add new asset or Import Excel, then Edit Row / Delete Row will appear here.'
        : `No records yet. Use Add new asset or Import Excel for ${escapeHtml(
            currentTable.label
          )}, then Edit Row / Delete Row will appear here.`;
    body.innerHTML = `<tr><td colspan="${currentTable.fields.length + 1}" class="empty-state">${emptyMessage}</td></tr>`;
    updateRegScreenStats();
    return;
  }
  body.innerHTML = rows
    .map((r) => {
      const cols = currentTable.fields
        .map(([k]) =>
          editingRowId === r.id
            ? `<td>${renderCellInput(k, r[k])}</td>`
            : `<td>${escapeHtml(normalizeDisplayValue(r[k]))}</td>`
        )
        .join('');
      const actionButtons =
        editingRowId === r.id
          ? `<button class="btn row-save" data-id="${r.id}">Save Changes</button>
             <button class="btn secondary row-cancel" data-id="${r.id}">Cancel</button>`
          : `<button class="btn secondary row-edit" data-id="${r.id}">Edit Row</button>
             <button class="btn danger row-delete" data-id="${r.id}">Delete Row</button>`;
      return `<tr><td>
        <div class="row-actions">
          ${actionButtons}
        </div>
      </td>${cols}</tr>`;
    })
    .join('');
  body.querySelectorAll('.row-edit').forEach((btn) => {
    btn.addEventListener('click', onEditRow);
  });
  body.querySelectorAll('.row-save').forEach((btn) => {
    btn.addEventListener('click', onSaveRow);
  });
  body.querySelectorAll('.row-cancel').forEach((btn) => {
    btn.addEventListener('click', onCancelEdit);
  });
  body.querySelectorAll('.row-delete').forEach((btn) => {
    btn.addEventListener('click', onDeleteRow);
  });
  updateRegScreenStats();
}

async function loadGatePasses() {
  if (currentTable.key !== 'laptops' && currentTable.key !== 'gatepasses') return;
  const statusEl = $('#gp-status-filter');
  const tbody = $('#gp-rows');
  const exportLink = $('#gp-export-link');
  const badgesEl = $('#gp-badges');
  if (!statusEl || !tbody || !exportLink) return;
  const status = statusEl.value || 'all';
  const laptopId = ($('#gp-laptop-filter')?.value || '').trim();
  const outDateFrom = ($('#gp-out-date-from')?.value || '').trim();
  const outDateTo = ($('#gp-out-date-to')?.value || '').trim();
  const q = new URLSearchParams();
  q.set('status', status);
  if (currentGatepassSearch) q.set('search', currentGatepassSearch);
  if (laptopId) q.set('laptop_id', laptopId);
  if (outDateFrom) q.set('out_date_from', outDateFrom);
  if (outDateTo) q.set('out_date_to', outDateTo);
  exportLink.href = apiUrl(`/api/export/gatepasses.xlsx?${q.toString()}`);
  const rows = await fetchJSON(apiUrl(`/api/laptop-gatepasses?${q.toString()}`));
  if (!Array.isArray(rows)) {
    throw new Error('Server returned invalid data for gate passes (expected a list).');
  }
  if (badgesEl) renderGatepassBadges(rows);
  tbody.innerHTML = rows
    .map((g) => {
      const isEditing = editingGatepassId === g.id;
      const cells = isEditing
        ? `
        <td>${escapeHtml(g.gatepass_no)}</td>
        <td>${escapeHtml(g.laptop_id)}</td>
        <td>${escapeHtml(g.service_tag || '—')}</td>
        <td>${renderGatepassInput('issued_to', g.issued_to)}</td>
        <td>${renderGatepassInput('out_date', g.out_date)}</td>
        <td>${renderGatepassInput('gatepass_type', g.gatepass_type || 'temporary')}</td>
        <td>${renderGatepassInput('status', g.status)}</td>
      `
        : `
        <td>${escapeHtml(g.gatepass_no)}</td>
        <td>${escapeHtml(g.laptop_id)}</td>
        <td>${escapeHtml(g.service_tag || '—')}</td>
        <td>${escapeHtml(g.issued_to || '—')}</td>
        <td>${escapeHtml(g.out_date || '—')}</td>
        <td>${escapeHtml(g.gatepass_type || 'temporary')}</td>
        <td>${escapeHtml(g.status || '—')}</td>
      `;
      const actions = isEditing
        ? `
          <button class="btn gp-save" data-id="${g.id}">Save</button>
          <button class="btn secondary gp-cancel" data-id="${g.id}">Cancel</button>
          <button class="btn danger gp-delete" data-id="${g.id}">Delete</button>
        `
        : `
          <button class="btn secondary gp-print" data-id="${g.id}">Print</button>
          <button type="button" class="btn secondary gp-pdf" data-id="${g.id}">Download Gate Pass PDF</button>
          <button class="btn secondary gp-edit" data-id="${g.id}">Edit</button>
          <button class="btn danger gp-delete" data-id="${g.id}">Delete</button>
        `;
      return `<tr>
        ${cells}
        <td>${actions}</td>
      </tr>`;
    })
    .join('');
  tbody.querySelectorAll('.gp-print').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      const id = ev.target.getAttribute('data-id');
      openAuthenticatedHtml(apiUrl(`/api/laptop-gatepasses/${id}/print`)).catch((e) => alert(e.message));
    });
  });
  tbody.querySelectorAll('.gp-pdf').forEach((btn) => {
    btn.addEventListener('click', (ev) => {
      const id = ev.target.getAttribute('data-id');
      downloadAuthenticatedFile(apiUrl(`/api/laptop-gatepasses/${id}/pdf`), `gatepass-${id}.pdf`).catch((e) =>
        alert(e.message)
      );
    });
  });
  tbody.querySelectorAll('.gp-edit').forEach((btn) => {
    btn.addEventListener('click', onEditGatepass);
  });
  tbody.querySelectorAll('.gp-save').forEach((btn) => {
    btn.addEventListener('click', onSaveGatepass);
  });
  tbody.querySelectorAll('.gp-cancel').forEach((btn) => {
    btn.addEventListener('click', onCancelGatepassEdit);
  });
  tbody.querySelectorAll('.gp-delete').forEach((btn) => {
    btn.addEventListener('click', onDeleteGatepass);
  });
}

function renderGatepassBadges(rows) {
  const counts = { total: rows.length, draft: 0, approved: 0, returned: 0, cancelled: 0 };
  rows.forEach((r) => {
    const s = String(r.status || '').toLowerCase();
    if (Object.prototype.hasOwnProperty.call(counts, s)) counts[s] += 1;
  });
  $('#gp-badges').innerHTML = [
    `Total: ${counts.total}`,
    `Draft: ${counts.draft}`,
    `Approved: ${counts.approved}`,
    `Returned: ${counts.returned}`,
    `Cancelled: ${counts.cancelled}`,
  ]
    .map((t) => `<span class="badge">${escapeHtml(t)}</span>`)
    .join('');
}

async function loadAudit() {
  const listEl = $('#audit-list');
  if (!listEl) return;
  const auditTable = currentTable.key === 'gatepasses' ? 'laptop_gatepasses' : currentTable.key;
  const entries = await fetchJSON(apiUrl(`/api/audit?limit=20&table=${encodeURIComponent(auditTable)}`));
  if (!Array.isArray(entries)) {
    throw new Error('Server returned invalid data for audit (expected a list).');
  }
  listEl.innerHTML = entries.length
    ? entries
        .map(
          (e) =>
            `<li><strong>${escapeHtml(e.action_type)}</strong> record #${e.entity_id} at ${escapeHtml(
              e.timestamp
            )} — changed_by ${escapeHtml(e.changed_by)}</li>`
        )
        .join('')
    : '<li>No audit entries yet.</li>';
}

async function refresh() {
  await loadCurrentTable();
  try {
    await loadGatePasses();
  } catch (e) {
    console.error('[refresh gate passes]', e);
  }
  try {
    await loadAudit();
  } catch (e) {
    console.error('[refresh audit]', e);
  }
}

function readLoginForm() {
  const form = document.querySelector('#login-form');
  if (!form) return { username: '', password: '' };
  const fd = new FormData(form);
  return {
    username: String(fd.get('username') || '').trim(),
    password: String(fd.get('password') || ''),
  };
}

async function performLogin() {
  setLoginError('');
  const btn = document.querySelector('#login-submit-btn');
  const { username, password } = readLoginForm();
  if (!username || !password) {
    setLoginError('Enter username and password.');
    return;
  }
  if (btn) {
    btn.disabled = true;
  }
  try {
    const data = await loginWithPassword(username, password);
    if (data.token) setAuthToken(data.token);
    if (data.authDisabled) serverAuthDisabled = true;
    showApp(data.user);
    showHome();
    renderTablePickerList(String(document.querySelector('#tableSearch')?.value || ''));
    hydrateTablePickerSummaries().catch((e) => console.error(e));
    if (serverAuthDisabled) $('#logout-btn')?.classList?.add('hidden');
    else $('#logout-btn')?.classList?.remove('hidden');
    const form = document.querySelector('#login-form');
    if (form) form.reset();
    try {
      await refresh();
    } catch (refreshErr) {
      console.error('[login refresh]', refreshErr);
      const rmsg =
        refreshErr && typeof refreshErr === 'object' && 'message' in refreshErr && refreshErr.message
          ? String(refreshErr.message)
          : String(refreshErr || 'Could not load data');
      const warn = document.getElementById('session-warning');
      if (warn) {
        warn.textContent = `Signed in, but some data did not load (${rmsg}). You can still pick a table below. If this persists, check the Network tab for failed /api requests.`;
        warn.classList.remove('hidden');
      } else {
        alert(`Signed in, but refresh failed: ${rmsg}`);
      }
    }
  } catch (err) {
    const msg =
      err && typeof err === 'object' && 'message' in err && err.message
        ? String(err.message)
        : String(err || 'Sign-in failed.');
    setLoginError(msg);
    console.error('[login]', err);
  } finally {
    if (btn) btn.disabled = false;
  }
}

document.querySelector('#login-form')?.addEventListener('submit', (ev) => {
  ev.preventDefault();
});
document.querySelector('#login-form')?.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Enter') return;
  ev.preventDefault();
  performLogin().catch((e) => console.error(e));
});
document.querySelector('#login-submit-btn')?.addEventListener('click', () => {
  performLogin().catch((e) => console.error(e));
});

$('#logout-btn')?.addEventListener('click', async () => {
  if (serverAuthDisabled) return;
  clearAuthToken();
  try {
    await fetch(apiUrl('/api/auth/logout'), buildFetchInit({ method: 'POST' }));
  } catch (_e) {
    /* ignore */
  }
  activeUser = null;
  setLoginError('');
  showLogin();
});

$('#dynamic-form')?.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (currentTable.key === 'gatepasses') return;
  const fd = new FormData(ev.target);
  const body = Object.fromEntries(fd.entries());
  try {
    await fetchJSON(apiUrl(`/api/register/${currentTable.key}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    ev.target.reset();
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

async function onDeleteRow(ev) {
  if (currentTable.key === 'gatepasses') return;
  const id = ev.target.getAttribute('data-id');
  if (!confirm(`Delete this ${currentTable.label} record?`)) return;
  try {
    const res = await fetch(apiUrl(`/api/register/${currentTable.key}/${id}`), buildFetchInit({ method: 'DELETE' }));
    if (!res.ok) {
      const text = await res.text();
      let msg = res.statusText;
      try {
        msg = JSON.parse(text).error || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    await refresh();
  } catch (err) {
    alert(err.message);
  }
}

async function onEditRow(ev) {
  if (currentTable.key === 'gatepasses') return;
  editingRowId = Number(ev.target.getAttribute('data-id'));
  await loadCurrentTable();
}

async function onSaveRow(ev) {
  if (currentTable.key === 'gatepasses') return;
  const id = ev.target.getAttribute('data-id');
  const rowEl = ev.target.closest('tr');
  if (!id || !rowEl) return;
  const patch = {};
  rowEl.querySelectorAll('.row-edit-input').forEach((input) => {
    patch[input.getAttribute('data-key')] = input.value.trim();
  });
  try {
    await fetchJSON(apiUrl(`/api/register/${currentTable.key}/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    editingRowId = null;
    await refresh();
  } catch (err) {
    alert(err.message);
  }
}

async function onCancelEdit() {
  if (currentTable.key === 'gatepasses') return;
  editingRowId = null;
  await loadCurrentTable();
}

function fillGatepassFromServiceTag(serviceTag) {
  const laptop = currentRows.find((row) => String(row.service_tag || '').trim() === String(serviceTag || '').trim());
  if (!laptop) return;
  $('#gp-keyboard').value = laptop.keyboard || '';
  $('#gp-mouse').value = laptop.mouse || '';
  $('#gp-headphone').value = laptop.headphone || '';
  $('#gp-usb-extender').value = laptop.usb_extender || '';
}

async function onCreateLaptopGatepass(ev) {
  ev.preventDefault();
  const fd = new FormData($('#gatepass-form'));
  const body = Object.fromEntries(fd.entries());
  try {
    const gp = await fetchJSON(apiUrl('/api/laptop-gatepasses'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    openAuthenticatedHtml(apiUrl(`/api/laptop-gatepasses/${gp.id}/print`)).catch((e) => alert(e.message));
    alert(`Gate pass created: ${gp.gatepass_no}`);
    $('#gatepass-form').reset();
    $('#gp-out-date').value = new Date().toISOString().slice(0, 10);
    $('#gp-type').value = 'temporary';
    await loadGatePasses();
  } catch (err) {
    alert(err.message);
  }
}

async function onEditGatepass(ev) {
  editingGatepassId = Number(ev.target.getAttribute('data-id'));
  await loadGatePasses();
}

async function onSaveGatepass(ev) {
  const id = ev.target.getAttribute('data-id');
  const rowEl = ev.target.closest('tr');
  if (!id || !rowEl) return;
  const patch = {};
  rowEl.querySelectorAll('.row-edit-input').forEach((input) => {
    patch[input.getAttribute('data-key')] = input.value.trim();
  });
  try {
    await fetchJSON(apiUrl(`/api/laptop-gatepasses/${id}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    editingGatepassId = null;
    await loadGatePasses();
    await loadAudit();
  } catch (err) {
    alert(err.message);
  }
}

async function onCancelGatepassEdit() {
  editingGatepassId = null;
  await loadGatePasses();
}

async function onDeleteGatepass(ev) {
  const id = ev.target.getAttribute('data-id');
  if (!confirm('Delete this gatepass?')) return;
  try {
    const res = await fetch(apiUrl(`/api/laptop-gatepasses/${id}`), buildFetchInit({ method: 'DELETE' }));
    if (!res.ok) {
      const text = await res.text();
      let msg = res.statusText;
      try {
        msg = JSON.parse(text).error || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    editingGatepassId = null;
    await loadGatePasses();
    await loadAudit();
  } catch (err) {
    alert(err.message);
  }
}

async function bootstrap() {
  try {
  renderTableSelector();
  $('#table-back-btn')?.addEventListener('click', () => {
    showHome();
    renderTablePickerList(String(document.querySelector('#tableSearch')?.value || ''));
    hydrateTablePickerSummaries().catch((e) => console.error(e));
  });
  $('#tableSearch')?.addEventListener('input', () => {
    scheduleTablePickerRefresh();
  });
  renderTablePickerList('');
  hydrateTablePickerSummaries().catch((e) => console.error(e));
  showHome();
  document.querySelectorAll('a.js-auth-download').forEach((a) => {
    const h = a.getAttribute('href');
    if (h && h !== '#' && h.startsWith('/api/')) {
      const q = h.includes('?') ? h.slice(h.indexOf('?')) : '';
      a.href = apiUrl(h.split('?')[0]) + q;
    }
  });
  document.querySelectorAll('a.js-auth-download').forEach((a) => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      downloadAuthenticatedFile(href, 'export.xlsx').catch((e) => alert(e.message));
    });
  });
  $('#table-import-btn')?.addEventListener('click', async () => {
    if (currentTable.key === 'gatepasses') return;
    const file = $('#table-import-file').files?.[0];
    if (!file) {
      alert('Choose an Excel file first.');
      return;
    }
    try {
      const result = await uploadImport(currentTable.key, file);
      $('#table-import-file').value = '';
      await refresh();
      alert(summarizeImportResult(result));
    } catch (err) {
      alert(err.message);
    }
  });
  $('#gp-import-btn')?.addEventListener('click', async () => {
    const file = $('#gp-import-file').files?.[0];
    if (!file) {
      alert('Choose an Excel file first.');
      return;
    }
    try {
      const result = await uploadImport('gatepasses', file);
      $('#gp-import-file').value = '';
      await refresh();
      alert(summarizeImportResult(result));
    } catch (err) {
      alert(err.message);
    }
  });
  $('#table-search-btn')?.addEventListener('click', () => {
    currentTableSearch = ($('#table-search-input').value || '').trim();
    refresh().catch((e) => console.error(e));
  });
  $('#table-search-clear-btn')?.addEventListener('click', () => {
    currentTableSearch = '';
    $('#table-search-input').value = '';
    refresh().catch((e) => console.error(e));
  });
  $('#table-search-input')?.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    currentTableSearch = (ev.target.value || '').trim();
    refresh().catch((e) => console.error(e));
  });
  $('#laptop-status-filter')?.addEventListener('change', (ev) => {
    laptopStatusFilter = String(ev.target.value || 'all');
    refresh().catch((e) => console.error(e));
  });
  $('#gp-search-btn')?.addEventListener('click', () => {
    currentGatepassSearch = ($('#gp-search-input').value || '').trim();
    loadGatePasses().catch((e) => console.error(e));
  });
  $('#gp-search-clear-search-btn')?.addEventListener('click', () => {
    currentGatepassSearch = '';
    $('#gp-search-input').value = '';
    loadGatePasses().catch((e) => console.error(e));
  });
  $('#gp-search-input')?.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    currentGatepassSearch = (ev.target.value || '').trim();
    loadGatePasses().catch((e) => console.error(e));
  });
  updateSectionSwitcher();
  renderDynamicForm();
  $('#gp-refresh-btn')?.addEventListener('click', () => {
    loadGatePasses().catch((e) => console.error(e));
  });
  $('#gp-status-filter')?.addEventListener('change', () => {
    loadGatePasses().catch((e) => console.error(e));
  });
  $('#gp-clear-btn')?.addEventListener('click', () => {
    $('#gp-status-filter').value = 'all';
    $('#gp-laptop-filter').value = '';
    $('#gp-out-date-from').value = '';
    $('#gp-out-date-to').value = '';
    $('#gp-export-link').href = apiUrl('/api/export/gatepasses.xlsx');
    loadGatePasses().catch((e) => console.error(e));
  });
  $('#gp-laptop-filter')?.addEventListener('change', () => {
    loadGatePasses().catch((e) => console.error(e));
  });
  $('#gp-out-date-from')?.addEventListener('change', () => {
    loadGatePasses().catch((e) => console.error(e));
  });
  $('#gp-out-date-to')?.addEventListener('change', () => {
    loadGatePasses().catch((e) => console.error(e));
  });
  $('#gatepass-form')?.addEventListener('submit', (ev) => {
    onCreateLaptopGatepass(ev).catch((e) => console.error(e));
  });
  $('#gp-service-tag')?.addEventListener('change', (ev) => {
    fillGatepassFromServiceTag(ev.target.value);
  });
  const gpOut = $('#gp-out-date');
  const gpTy = $('#gp-type');
  if (gpOut) gpOut.value = new Date().toISOString().slice(0, 10);
  if (gpTy) gpTy.value = 'temporary';

  $('#reg-add-asset-btn')?.addEventListener('click', () => {
    const p = $('#add-asset-panel');
    if (!p || currentTable.key === 'gatepasses') return;
    const opening = p.classList.contains('hidden');
    if (opening) {
      p.classList.remove('hidden');
      renderAddAssetForm();
      p.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      p.classList.add('hidden');
    }
  });

  let user = await getSessionUser();
  if (!user) {
    await new Promise((r) => setTimeout(r, 0));
    user = await getSessionUser();
  }
  if (user) {
    showApp(user);
    showHome();
    renderTablePickerList(String(document.querySelector('#tableSearch')?.value || ''));
    hydrateTablePickerSummaries().catch((e) => console.error(e));
    if (serverAuthDisabled) {
      $('#logout-btn')?.classList?.add('hidden');
    } else {
      $('#logout-btn')?.classList?.remove('hidden');
    }
    try {
      await refresh();
    } catch (refreshErr) {
      console.error('[bootstrap refresh]', refreshErr);
      const rmsg =
        refreshErr && typeof refreshErr === 'object' && 'message' in refreshErr && refreshErr.message
          ? String(refreshErr.message)
          : String(refreshErr || 'unknown error');
      const warn = document.getElementById('session-warning');
      if (warn) {
        warn.textContent = `Could not load register data (${rmsg}). You can still pick a table; check Network for /api errors or refresh the page.`;
        warn.classList.remove('hidden');
      }
    }
  } else {
    showLogin();
  }
  } catch (bootErr) {
    console.error('[bootstrap]', bootErr);
    const banner = document.getElementById('boot-error');
    if (banner) {
      const msg =
        bootErr && typeof bootErr === 'object' && 'message' in bootErr
          ? String(bootErr.message)
          : String(bootErr);
      banner.textContent = `Application failed to start (${msg}). Check the browser console. If the app is under a sub-path, set meta asset-register-base or env ASSET_REGISTER_STATIC_PREFIX on the server.`;
      banner.classList.remove('hidden');
    }
    try {
      document.getElementById('login-view')?.classList.remove('hidden');
      document.getElementById('app-view')?.classList.add('hidden');
    } catch (_e) {
      /* ignore */
    }
  }
}

bootstrap().catch((e) => console.error(e));
