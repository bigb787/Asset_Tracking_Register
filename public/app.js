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
    if (res.status === 401) {
      showLogin();
      throw new Error('Please login first');
    }
    const msg = data?.error || res.statusText || 'Request failed';
    throw new Error(msg);
  }
  return data;
}

let users = [];
let activeUser = null;

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
  $('#user-list').innerHTML = users
    .map(
      (u) =>
        `<li><strong>${escapeHtml(u.name)}</strong> — ${escapeHtml(u.email)}${
          u.department ? ` (${escapeHtml(u.department)})` : ''
        }</li>`
    )
    .join('');
}

async function loadLaptops() {
  const laptops = await fetchJSON('/api/laptops');
  const tbody = $('#laptop-rows');
  tbody.innerHTML = laptops
    .map(
      (a) => `
    <tr data-id="${a.id}">
      <td>${escapeHtml(a.service_tag || '—')}</td>
      <td>${escapeHtml(a.asset_manufacturer || '—')}</td>
      <td>${escapeHtml(a.model || '—')}</td>
      <td>${escapeHtml(a.asset_owner || '—')}</td>
      <td>${escapeHtml(a.assigned_to || '—')}</td>
      <td>${escapeHtml(a.asset_status || '—')}</td>
      <td>${escapeHtml(a.dept || '—')}</td>
      <td>${escapeHtml(a.location || '—')}</td>
      <td><button type="button" class="btn danger btn-delete" data-laptop-id="${a.id}">Delete</button></td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', onDeleteLaptop);
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
  await loadLaptops();
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

$('#laptop-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(ev.target);
  const body = Object.fromEntries(fd.entries());
  try {
    await fetchJSON('/api/laptops', {
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

async function onDeleteLaptop(ev) {
  const id = ev.target.getAttribute('data-laptop-id');
  if (!confirm('Delete this laptop record? This is logged in the audit trail.')) return;
  try {
    const res = await fetch(`/api/laptops/${id}`, { method: 'DELETE' });
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
    await refresh();
  } catch (_e) {
    showLogin();
  }
}

bootstrap().catch((e) => console.error(e));
