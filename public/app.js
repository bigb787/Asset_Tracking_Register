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

function renderTableSelector() {
  const select = $('#table-select');
  select.innerHTML = TABLES.map((t) => `<option value="${t.key}">${escapeHtml(t.label)}</option>`).join('');
  select.value = currentTable.key;
  select.addEventListener('change', async (ev) => {
    const selected = TABLES.find((t) => t.key === ev.target.value);
    if (!selected) return;
    currentTable = selected;
    renderDynamicForm();
    await loadCurrentTable();
  });
}

function renderDynamicForm() {
  $('#table-title').textContent = currentTable.label;
  const form = $('#dynamic-form');
  form.innerHTML = currentTable.fields
    .map(
      ([key, label]) =>
        `<label>${escapeHtml(label)}<input name="${escapeHtml(key)}" /></label>`
    )
    .join('');
  form.insertAdjacentHTML('beforeend', '<button type="submit" class="btn">Add record</button>');
}

async function loadCurrentTable() {
  const rows = await fetchJSON(`/api/register/${currentTable.key}`);
  const head = $('#data-head');
  const body = $('#data-rows');
  head.innerHTML = `<tr>${currentTable.fields
    .map(([, label]) => `<th>${escapeHtml(label)}</th>`)
    .join('')}<th>Actions</th></tr>`;
  body.innerHTML = rows
    .map((r) => {
      const cols = currentTable.fields
        .map(([k]) => `<td>${escapeHtml(r[k] ?? '—')}</td>`)
        .join('');
      return `<tr>${cols}<td><button class="btn danger row-delete" data-id="${r.id}">Delete</button></td></tr>`;
    })
    .join('');
  body.querySelectorAll('.row-delete').forEach((btn) => {
    btn.addEventListener('click', onDeleteRow);
  });
}

async function loadAudit() {
  const entries = await fetchJSON('/api/audit?limit=20');
  $('#audit-list').innerHTML = entries.length
    ? entries
        .map(
          (e) =>
            `<li><strong>${escapeHtml(e.action_type)}</strong> asset #${e.entity_id} at ${escapeHtml(
              e.timestamp
            )} — changed_by ${escapeHtml(e.changed_by)}</li>`
        )
        .join('')
    : '<li>No audit entries yet.</li>';
}

async function refresh() {
  await loadCurrentTable();
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

async function bootstrap() {
  try {
    const session = await fetchJSON('/api/auth/session');
    showApp(session.user);
    renderTableSelector();
    renderDynamicForm();
    await refresh();
  } catch (_e) {
    showLogin();
  }
}

bootstrap().catch((e) => console.error(e));
