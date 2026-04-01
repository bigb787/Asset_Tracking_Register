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

async function fetchJSON(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    if (res.status === 401) {
      showLogin();
      throw new Error('Please login first');
    }
    const msg = data?.error || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

let activeUser = null;
let currentTable = TABLES[0];
let editingRowId = null;
let currentRows = [];
let editingGatepassId = null;

function getRegisterFormSection() {
  return $('#dynamic-form').closest('section');
}

function getRegisterTableSection() {
  return $('#table-title').closest('section');
}

function showLogin() {
  $('#login-view').classList.remove('hidden');
  $('#app-view').classList.add('hidden');
  $('#auth-bar').classList.add('hidden');
  $('#auth-user').textContent = '';
}

function showApp(user) {
  activeUser = user;
  $('#login-view').classList.add('hidden');
  $('#app-view').classList.remove('hidden');
  $('#auth-bar').classList.remove('hidden');
  $('#auth-user').textContent = `Logged in as ${user.username}`;
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

function renderTableSelector() {
  const select = $('#table-select');
  select.innerHTML = TABLES.map((t) => `<option value="${t.key}">${escapeHtml(t.label)}</option>`).join('');
  select.value = currentTable.key;
  select.addEventListener('change', async (ev) => {
    const selected = TABLES.find((t) => t.key === ev.target.value);
    if (!selected) return;
    await setCurrentTable(selected.key);
  });
}

function updateSectionSwitcher() {
  $('#show-assets-btn').classList.toggle('active', currentTable.key !== 'gatepasses');
  $('#show-gatepasses-btn').classList.toggle('active', currentTable.key === 'gatepasses');
}

async function setCurrentTable(tableKey) {
  const selected = TABLES.find((t) => t.key === tableKey);
  if (!selected) return;
  currentTable = selected;
  $('#table-select').value = currentTable.key;
  updateSectionSwitcher();
  renderDynamicForm();
  await refresh();
}

function renderDynamicForm() {
  $('#table-title').textContent = currentTable.label;
  $('#history-title').textContent =
    currentTable.key === 'gatepasses' ? 'Gate Passes History' : `${currentTable.label} History`;
  $('#history-panel').open = false;
  if (currentTable.key === 'gatepasses') {
    $('#gatepass-panel').classList.remove('hidden');
  } else {
    $('#gatepass-panel').classList.add('hidden');
  }
  const form = $('#dynamic-form');
  const registerFormSection = getRegisterFormSection();
  const registerTableSection = getRegisterTableSection();
  if (currentTable.key === 'gatepasses') {
    registerFormSection.classList.add('hidden');
    registerTableSection.classList.add('hidden');
    return;
  }
  registerFormSection.classList.remove('hidden');
  registerTableSection.classList.remove('hidden');
  const rowActionHelp =
    currentTable.key === 'laptops'
      ? 'After saving, each row will show Edit Row and Delete Row in the first column.'
      : 'After saving, each row will show Edit Row and Delete Row in the first column.';
  const fieldsHtml = currentTable.fields
    .map(
      ([key, label]) =>
        `<label>${escapeHtml(label)}<input name="${escapeHtml(key)}" /></label>`
    )
    .join('');
  form.innerHTML = `
    <div class="form-actions-bar">
      <button type="submit" class="btn">Save New Record</button>
      <button type="reset" class="btn secondary">Clear Form</button>
      <span class="form-help">Fill the fields and click Save New Record.</span>
    </div>
    <div class="form-actions-bar">
      <span class="form-help">${escapeHtml(rowActionHelp)}</span>
    </div>
    ${fieldsHtml}
    <div class="form-actions-bar">
      <button type="submit" class="btn">Save New Record</button>
      <button type="reset" class="btn secondary">Clear Form</button>
    </div>
  `;
}

async function loadCurrentTable() {
  if (currentTable.key === 'gatepasses') {
    currentRows = [];
    return;
  }
  const rows = await fetchJSON(`/api/register/${currentTable.key}`);
  currentRows = rows;
  const head = $('#data-head');
  const body = $('#data-rows');
  head.innerHTML = `<tr><th>Row Actions</th>${currentTable.fields
    .map(([, label]) => `<th>${escapeHtml(label)}</th>`)
    .join('')}</tr>`;
  if (!rows.length) {
    const emptyMessage =
      currentTable.key === 'laptops'
        ? 'No records yet. Add a Laptop record above, then Edit Row and Delete Row buttons will appear here.'
        : `No records yet. Add a ${escapeHtml(currentTable.label)} record above, then Edit Row and Delete Row buttons will appear here.`;
    body.innerHTML = `<tr><td colspan="${currentTable.fields.length + 1}" class="empty-state">${emptyMessage}</td></tr>`;
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
}

async function loadGatePasses() {
  if (currentTable.key !== 'laptops' && currentTable.key !== 'gatepasses') return;
  const status = $('#gp-status-filter').value || 'all';
  const laptopId = ($('#gp-laptop-filter').value || '').trim();
  const outDateFrom = ($('#gp-out-date-from').value || '').trim();
  const outDateTo = ($('#gp-out-date-to').value || '').trim();
  const q = new URLSearchParams();
  q.set('status', status);
  if (laptopId) q.set('laptop_id', laptopId);
  if (outDateFrom) q.set('out_date_from', outDateFrom);
  if (outDateTo) q.set('out_date_to', outDateTo);
  $('#gp-export-link').href = `/api/export/gatepasses.xlsx?${q.toString()}`;
  const rows = await fetchJSON(`/api/laptop-gatepasses?${q.toString()}`);
  renderGatepassBadges(rows);
  const tbody = $('#gp-rows');
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
          <a class="btn secondary" href="/api/laptop-gatepasses/${g.id}/pdf">Download Gate Pass PDF</a>
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
      window.open(`/api/laptop-gatepasses/${id}/print`, '_blank');
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
  const auditTable = currentTable.key === 'gatepasses' ? 'laptop_gatepasses' : currentTable.key;
  const entries = await fetchJSON(`/api/audit?limit=20&table=${encodeURIComponent(auditTable)}`);
  $('#audit-list').innerHTML = entries.length
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
  await loadGatePasses();
  await loadAudit();
}

$('#login-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  try {
    const data = await fetchJSON('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: fd.get('username'),
        password: fd.get('password'),
      }),
    });
    showApp(data.user);
    ev.target.reset();
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

$('#logout-btn').addEventListener('click', async () => {
  try {
    await fetchJSON('/api/auth/logout', { method: 'POST' });
  } catch (_e) {
    /* ignore */
  }
  activeUser = null;
  showLogin();
});

$('#dynamic-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  if (currentTable.key === 'gatepasses') return;
  const fd = new FormData(ev.target);
  const body = Object.fromEntries(fd.entries());
  try {
    await fetchJSON(`/api/register/${currentTable.key}`, {
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
    const res = await fetch(`/api/register/${currentTable.key}/${id}`, { method: 'DELETE' });
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
    await fetchJSON(`/api/register/${currentTable.key}/${id}`, {
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
    const gp = await fetchJSON('/api/laptop-gatepasses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    window.open(`/api/laptop-gatepasses/${gp.id}/print`, '_blank');
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
    await fetchJSON(`/api/laptop-gatepasses/${id}`, {
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
    const res = await fetch(`/api/laptop-gatepasses/${id}`, { method: 'DELETE' });
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
    const session = await fetchJSON('/api/auth/session');
    showApp(session.user);
    renderTableSelector();
    $('#show-assets-btn').addEventListener('click', () => {
      setCurrentTable('laptops').catch((e) => console.error(e));
    });
    $('#show-gatepasses-btn').addEventListener('click', () => {
      setCurrentTable('gatepasses').catch((e) => console.error(e));
    });
    $('#gp-back-btn').addEventListener('click', () => {
      setCurrentTable('laptops').catch((e) => console.error(e));
    });
    updateSectionSwitcher();
    renderDynamicForm();
    $('#gp-refresh-btn').addEventListener('click', () => {
      loadGatePasses().catch((e) => console.error(e));
    });
    $('#gp-status-filter').addEventListener('change', () => {
      loadGatePasses().catch((e) => console.error(e));
    });
    $('#gp-clear-btn').addEventListener('click', () => {
      $('#gp-status-filter').value = 'all';
      $('#gp-laptop-filter').value = '';
      $('#gp-out-date-from').value = '';
      $('#gp-out-date-to').value = '';
      $('#gp-export-link').href = '/api/export/gatepasses.xlsx';
      loadGatePasses().catch((e) => console.error(e));
    });
    $('#gp-laptop-filter').addEventListener('change', () => {
      loadGatePasses().catch((e) => console.error(e));
    });
    $('#gp-out-date-from').addEventListener('change', () => {
      loadGatePasses().catch((e) => console.error(e));
    });
    $('#gp-out-date-to').addEventListener('change', () => {
      loadGatePasses().catch((e) => console.error(e));
    });
    $('#gatepass-form').addEventListener('submit', (ev) => {
      onCreateLaptopGatepass(ev).catch((e) => console.error(e));
    });
    $('#gp-service-tag').addEventListener('change', (ev) => {
      fillGatepassFromServiceTag(ev.target.value);
    });
    $('#gp-out-date').value = new Date().toISOString().slice(0, 10);
    $('#gp-type').value = 'temporary';
    await refresh();
  } catch (_e) {
    showLogin();
  }
}

bootstrap().catch((e) => console.error(e));
