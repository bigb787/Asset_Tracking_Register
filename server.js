const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const { db, insertAuditTrail } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_COOKIE = 'asset_register_auth';
const AUTH_SECRET = process.env.AUTH_SECRET || 'replace-this-in-production';
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';

app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function ensureDefaultAuthUser() {
  const existing = db.prepare('SELECT id FROM auth_users LIMIT 1').get();
  if (existing) return;
  const passwordHash = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);
  db.prepare('INSERT INTO auth_users (username, password_hash, role) VALUES (?, ?, ?)').run(
    DEFAULT_ADMIN_USERNAME,
    passwordHash,
    'admin'
  );
  console.log(
    `[auth] Created default admin user "${DEFAULT_ADMIN_USERNAME}". Change password immediately.`
  );
}

function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 12,
  };
}

function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ error: 'authentication required' });
  try {
    const payload = jwt.verify(token, AUTH_SECRET);
    req.authUser = payload;
    return next();
  } catch (_e) {
    return res.status(401).json({ error: 'invalid session' });
  }
}

app.post('/api/auth/login', (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const user = db.prepare('SELECT * FROM auth_users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'invalid credentials' });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    AUTH_SECRET,
    { expiresIn: '12h' }
  );
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
  res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
});

app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(AUTH_COOKIE, authCookieOptions());
  res.json({ ok: true });
});

app.get('/api/auth/session', (req, res) => {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return res.status(401).json({ error: 'not authenticated' });
  try {
    const payload = jwt.verify(token, AUTH_SECRET);
    return res.json({
      authenticated: true,
      user: { id: payload.sub, username: payload.username, role: payload.role },
    });
  } catch (_e) {
    return res.status(401).json({ error: 'invalid session' });
  }
});

app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/auth/')) return next();
  return requireAuth(req, res, next);
});

function rowToAssetPayload(row) {
  if (!row) return null;
  return {
    id: row.id,
    asset_tag: row.asset_tag,
    name: row.name,
    asset_type: row.asset_type,
    classification: row.classification,
    location: row.location,
    status: row.status,
    owner_user_id: row.owner_user_id,
    assigned_user_id: row.assigned_user_id,
    description: row.description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function getAssetById(id) {
  return db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
}

function assetExistsByTag(tag, excludeId) {
  if (excludeId != null) {
    const row = db
      .prepare('SELECT id FROM assets WHERE asset_tag = ? AND id != ?')
      .get(tag, excludeId);
    return !!row;
  }
  const row = db.prepare('SELECT id FROM assets WHERE asset_tag = ?').get(tag);
  return !!row;
}

function getLaptopById(id) {
  return db.prepare('SELECT * FROM laptops WHERE id = ?').get(id);
}

function laptopExistsByServiceTag(tag, excludeId) {
  if (excludeId != null) {
    const row = db
      .prepare('SELECT id FROM laptops WHERE service_tag = ? AND id != ?')
      .get(tag, excludeId);
    return !!row;
  }
  const row = db.prepare('SELECT id FROM laptops WHERE service_tag = ?').get(tag);
  return !!row;
}

// --- Users ---
app.get('/api/users', (_req, res) => {
  const users = db.prepare('SELECT * FROM users ORDER BY name').all();
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name, email, department } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  try {
    const info = db
      .prepare('INSERT INTO users (name, email, department) VALUES (?, ?, ?)')
      .run(name.trim(), email.trim().toLowerCase(), department?.trim() || null);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(user);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'email already exists' });
    }
    throw e;
  }
});

// --- Assets ---
app.get('/api/assets', (_req, res) => {
  const rows = db
    .prepare(`
      SELECT a.*,
             ou.name AS owner_name, ou.email AS owner_email,
             au.name AS assigned_name, au.email AS assigned_email
      FROM assets a
      LEFT JOIN users ou ON ou.id = a.owner_user_id
      LEFT JOIN users au ON au.id = a.assigned_user_id
      ORDER BY a.asset_tag
    `)
    .all();
  res.json(rows);
});

app.post('/api/assets', (req, res) => {
  const {
    asset_tag,
    name,
    asset_type,
    classification,
    location,
    status,
    owner_user_id,
    assigned_user_id,
    description,
  } = req.body;

  if (!asset_tag?.trim() || !name?.trim()) {
    return res.status(400).json({ error: 'asset_tag and name are required' });
  }
  if (assetExistsByTag(asset_tag.trim())) {
    return res.status(409).json({ error: 'asset_tag must be unique' });
  }

  const info = db
    .prepare(`
      INSERT INTO assets (
        asset_tag, name, asset_type, classification, location, status,
        owner_user_id, assigned_user_id, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      asset_tag.trim(),
      name.trim(),
      asset_type || 'hardware',
      classification || 'internal',
      location?.trim() || null,
      status || 'in_use',
      owner_user_id ?? null,
      assigned_user_id ?? null,
      description?.trim() || null
    );

  const created = getAssetById(info.lastInsertRowid);
  res.status(201).json(created);
});

app.patch('/api/assets/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }

  const prev = getAssetById(id);
  if (!prev) {
    return res.status(404).json({ error: 'asset not found' });
  }

  const allowed = [
    'asset_tag',
    'name',
    'asset_type',
    'classification',
    'location',
    'status',
    'owner_user_id',
    'assigned_user_id',
    'description',
  ];
  const patch = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      patch[key] = req.body[key];
    }
  }

  if (patch.asset_tag !== undefined) {
    if (!String(patch.asset_tag).trim()) {
      return res.status(400).json({ error: 'asset_tag cannot be empty' });
    }
    if (assetExistsByTag(String(patch.asset_tag).trim(), id)) {
      return res.status(409).json({ error: 'asset_tag must be unique' });
    }
    patch.asset_tag = String(patch.asset_tag).trim();
  }
  if (patch.name !== undefined) {
    if (!String(patch.name).trim()) {
      return res.status(400).json({ error: 'name cannot be empty' });
    }
    patch.name = String(patch.name).trim();
  }
  if (patch.location !== undefined) {
    patch.location = patch.location ? String(patch.location).trim() : null;
  }
  if (patch.description !== undefined) {
    patch.description = patch.description ? String(patch.description).trim() : null;
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'no updatable fields provided' });
  }

  const sets = Object.keys(patch)
    .map((k) => `${k} = @${k}`)
    .concat(["updated_at = datetime('now')"])
    .join(', ');
  const tx = db.transaction(() => {
    db.prepare(`UPDATE assets SET ${sets} WHERE id = @id`).run({ ...patch, id });
    const updated = getAssetById(id);
    insertAuditTrail({
      entity_table: 'assets',
      entity_id: id,
      action_type: 'UPDATE',
      previous_value: JSON.stringify(rowToAssetPayload(prev)),
      new_value: JSON.stringify(rowToAssetPayload(updated)),
      changed_by: req.authUser?.username || 'system',
    });
  });

  tx();
  res.json(getAssetById(id));
});

app.delete('/api/assets/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const prev = getAssetById(id);
  if (!prev) {
    return res.status(404).json({ error: 'asset not found' });
  }

  const tx = db.transaction(() => {
    insertAuditTrail({
      entity_table: 'assets',
      entity_id: id,
      action_type: 'DELETE',
      previous_value: JSON.stringify(rowToAssetPayload(prev)),
      new_value: null,
      changed_by: req.authUser?.username || 'system',
    });
    db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  });
  tx();
  res.status(204).send();
});

// --- Laptop Register ---
app.get('/api/laptops', (_req, res) => {
  const rows = db.prepare('SELECT * FROM laptops ORDER BY service_tag').all();
  res.json(rows);
});

app.post('/api/laptops', (req, res) => {
  const body = req.body || {};
  const serviceTag = String(body.service_tag || '').trim();
  if (!serviceTag) {
    return res.status(400).json({ error: 'service_tag is required' });
  }
  if (laptopExistsByServiceTag(serviceTag)) {
    return res.status(409).json({ error: 'service_tag must be unique' });
  }

  const insert = db.prepare(`
    INSERT INTO laptops (
      asset_type, asset_manufacturer, service_tag, model, p_n, asset_owner, assigned_to,
      asset_status, last_owner, dept, location, asset_health, warranty, install_date,
      date_added_updated, processor, ram, harddisk, o_s, supt_vendor, keyboard, mouse,
      headphone, usb_extender, contains_pii
    ) VALUES (
      @asset_type, @asset_manufacturer, @service_tag, @model, @p_n, @asset_owner, @assigned_to,
      @asset_status, @last_owner, @dept, @location, @asset_health, @warranty, @install_date,
      @date_added_updated, @processor, @ram, @harddisk, @o_s, @supt_vendor, @keyboard, @mouse,
      @headphone, @usb_extender, @contains_pii
    )
  `);

  const payload = {
    asset_type: body.asset_type ?? null,
    asset_manufacturer: body.asset_manufacturer ?? null,
    service_tag: serviceTag,
    model: body.model ?? null,
    p_n: body.p_n ?? null,
    asset_owner: body.asset_owner ?? null,
    assigned_to: body.assigned_to ?? null,
    asset_status: body.asset_status ?? null,
    last_owner: body.last_owner ?? null,
    dept: body.dept ?? null,
    location: body.location ?? null,
    asset_health: body.asset_health ?? null,
    warranty: body.warranty ?? null,
    install_date: body.install_date ?? null,
    date_added_updated: body.date_added_updated ?? null,
    processor: body.processor ?? null,
    ram: body.ram ?? null,
    harddisk: body.harddisk ?? null,
    o_s: body.o_s ?? null,
    supt_vendor: body.supt_vendor ?? null,
    keyboard: body.keyboard ?? null,
    mouse: body.mouse ?? null,
    headphone: body.headphone ?? null,
    usb_extender: body.usb_extender ?? null,
    contains_pii: body.contains_pii ?? null,
  };

  const info = insert.run(payload);
  res.status(201).json(getLaptopById(info.lastInsertRowid));
});

app.patch('/api/laptops/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const prev = getLaptopById(id);
  if (!prev) {
    return res.status(404).json({ error: 'laptop not found' });
  }

  const allowed = [
    'asset_type',
    'asset_manufacturer',
    'service_tag',
    'model',
    'p_n',
    'asset_owner',
    'assigned_to',
    'asset_status',
    'last_owner',
    'dept',
    'location',
    'asset_health',
    'warranty',
    'install_date',
    'date_added_updated',
    'processor',
    'ram',
    'harddisk',
    'o_s',
    'supt_vendor',
    'keyboard',
    'mouse',
    'headphone',
    'usb_extender',
    'contains_pii',
  ];
  const patch = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) patch[key] = req.body[key];
  }
  if (patch.service_tag !== undefined) {
    patch.service_tag = String(patch.service_tag || '').trim();
    if (!patch.service_tag) return res.status(400).json({ error: 'service_tag cannot be empty' });
    if (laptopExistsByServiceTag(patch.service_tag, id)) {
      return res.status(409).json({ error: 'service_tag must be unique' });
    }
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'no updatable fields provided' });
  }

  const sets = Object.keys(patch)
    .map((k) => `${k} = @${k}`)
    .concat(["updated_at = datetime('now')"])
    .join(', ');
  const tx = db.transaction(() => {
    db.prepare(`UPDATE laptops SET ${sets} WHERE id = @id`).run({ ...patch, id });
    insertAuditTrail({
      entity_table: 'laptops',
      entity_id: id,
      action_type: 'UPDATE',
      previous_value: JSON.stringify(prev),
      new_value: JSON.stringify(getLaptopById(id)),
      changed_by: req.authUser?.username || 'system',
    });
  });
  tx();
  res.json(getLaptopById(id));
});

app.delete('/api/laptops/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'invalid id' });
  }
  const prev = getLaptopById(id);
  if (!prev) return res.status(404).json({ error: 'laptop not found' });

  const tx = db.transaction(() => {
    insertAuditTrail({
      entity_table: 'laptops',
      entity_id: id,
      action_type: 'DELETE',
      previous_value: JSON.stringify(prev),
      new_value: null,
      changed_by: req.authUser?.username || 'system',
    });
    db.prepare('DELETE FROM laptops WHERE id = ?').run(id);
  });
  tx();
  res.status(204).send();
});

// --- Excel export (ISO-oriented columns) ---
app.get('/api/export/assets.xlsx', async (_req, res) => {
  const rows = db
    .prepare(`
      SELECT *
      FROM laptops
      ORDER BY service_tag
    `)
    .all();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Register';
  const sheet = workbook.addWorksheet('Asset Inventory', {
    properties: { defaultColWidth: 18 },
  });

  sheet.columns = [
    { header: 'Asset type', key: 'asset_type', width: 14 },
    { header: 'Asset Manufacturer', key: 'asset_manufacturer', width: 20 },
    { header: 'Service Tag', key: 'service_tag', width: 18 },
    { header: 'Model', key: 'model', width: 14 },
    { header: 'P/N', key: 'p_n', width: 14 },
    { header: 'Asset Owner', key: 'asset_owner', width: 18 },
    { header: 'Assigned To', key: 'assigned_to', width: 18 },
    { header: 'Asset Status', key: 'asset_status', width: 14 },
    { header: 'Last Owner', key: 'last_owner', width: 16 },
    { header: 'Dept', key: 'dept', width: 12 },
    { header: 'Location', key: 'location', width: 16 },
    { header: 'Asset Health', key: 'asset_health', width: 14 },
    { header: 'Warranty', key: 'warranty', width: 12 },
    { header: 'Install date', key: 'install_date', width: 14 },
    { header: 'Date Added/Updated', key: 'date_added_updated', width: 18 },
    { header: 'Processor', key: 'processor', width: 16 },
    { header: 'RAM', key: 'ram', width: 10 },
    { header: 'HardDisk', key: 'harddisk', width: 14 },
    { header: 'O/S', key: 'o_s', width: 16 },
    { header: 'Supt Vendor', key: 'supt_vendor', width: 14 },
    { header: 'Keyboard', key: 'keyboard', width: 10 },
    { header: 'Mouse', key: 'mouse', width: 10 },
    { header: 'HeadPhone', key: 'headphone', width: 12 },
    { header: 'USB Extender', key: 'usb_extender', width: 12 },
    { header: 'Contains PII (Yes/No)', key: 'contains_pii', width: 18 },
  ];

  rows.forEach((r) => sheet.addRow(r));

  sheet.getRow(1).font = { bold: true };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="asset-inventory-report.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

app.get('/api/audit', (_req, res) => {
  const limit = Math.min(Number(_req.query.limit) || 100, 500);
  const entries = db
    .prepare(
      `SELECT * FROM audit_trail WHERE entity_table IN ('assets', 'laptops') ORDER BY id DESC LIMIT ?`
    )
    .all(limit);
  res.json(entries);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  ensureDefaultAuthUser();
  console.log(`Asset register listening at http://localhost:${PORT}`);
});
