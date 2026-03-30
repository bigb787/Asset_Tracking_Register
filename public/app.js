const $ = (sel) => document.querySelector(sel);

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
    const msg = data?.error || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

let users = [];

function userOptionsHtml(selectedId, includeEmpty = true) {
  let html = includeEmpty ? '<option value="">— none —</option>' : '';
  for (const u of users) {
    const sel = String(u.id) === String(selectedId) ? ' selected' : '';
    html += `<option value="${u.id}"${sel}>${escapeHtml(u.name)}</option>`;
  }
  return html;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadUsers() {
  users = await fetchJSON('/api/users');
  const owner = $('#owner-select');
  const assigned = $('#assigned-select');
  owner.innerHTML = userOptionsHtml(null, true);
  assigned.innerHTML = userOptionsHtml(null, true);
  $('#user-list').innerHTML = users
    .map(
      (u) =>
        `<li><strong>${escapeHtml(u.name)}</strong> — ${escapeHtml(u.email)}${
          u.department ? ` (${escapeHtml(u.department)})` : ''
        }</li>`
    )
    .join('');
}

async function loadAssets() {
  const assets = await fetchJSON('/api/assets');
  const tbody = $('#asset-rows');
  tbody.innerHTML = assets
    .map(
      (a) => `
    <tr data-id="${a.id}">
      <td>${escapeHtml(a.asset_tag)}</td>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.owner_name || '—')}</td>
      <td>
        <select class="assign-select" data-asset-id="${a.id}" aria-label="Assigned user">
          ${userOptionsHtml(a.assigned_user_id, true)}
        </select>
      </td>
      <td>${escapeHtml(a.status)}</td>
      <td>${escapeHtml(a.location || '—')}</td>
      <td><button type="button" class="btn danger btn-delete" data-asset-id="${a.id}">Delete</button></td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('.assign-select').forEach((sel) => {
    sel.addEventListener('change', onAssignChange);
  });
  tbody.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', onDeleteAsset);
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
  await loadUsers();
  await loadAssets();
  await loadAudit();
}

$('#user-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  try {
    await fetchJSON('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fd.get('name'),
        email: fd.get('email'),
        department: fd.get('department'),
      }),
    });
    ev.target.reset();
    await refresh();
  } catch (err) {
    alert(err.message);
  }
});

$('#asset-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const owner = fd.get('owner_user_id');
  const assigned = fd.get('assigned_user_id');
  const body = {
    asset_tag: fd.get('asset_tag'),
    name: fd.get('name'),
    asset_type: fd.get('asset_type'),
    classification: fd.get('classification'),
    location: fd.get('location'),
    status: fd.get('status'),
    description: fd.get('description'),
    owner_user_id: owner ? Number(owner) : null,
    assigned_user_id: assigned ? Number(assigned) : null,
  };
  try {
    await fetchJSON('/api/assets', {
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

async function onAssignChange(ev) {
  const select = ev.target;
  const id = select.getAttribute('data-asset-id');
  const val = select.value;
  try {
    await fetchJSON(`/api/assets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assigned_user_id: val === '' ? null : Number(val),
      }),
    });
    await loadAudit();
  } catch (err) {
    alert(err.message);
    await refresh();
  }
}

async function onDeleteAsset(ev) {
  const id = ev.target.getAttribute('data-asset-id');
  if (!confirm('Delete this asset? This is logged in the audit trail.')) return;
  try {
    const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
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

refresh().catch((e) => console.error(e));
