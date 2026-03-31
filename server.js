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

function getLaptopByServiceTag(serviceTag) {
  return db.prepare('SELECT * FROM laptops WHERE service_tag = ?').get(serviceTag);
}

function nextLaptopGatepassNo() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const like = `GP-LAP-${datePart}-%`;
  const row = db
    .prepare(
      `SELECT gatepass_no FROM laptop_gatepasses
       WHERE gatepass_no LIKE ?
       ORDER BY id DESC LIMIT 1`
    )
    .get(like);
  let seq = 1;
  if (row?.gatepass_no) {
    const parts = row.gatepass_no.split('-');
    const last = parseInt(parts[parts.length - 1], 10);
    if (Number.isInteger(last)) seq = last + 1;
  }
  return `GP-LAP-${datePart}-${String(seq).padStart(4, '0')}`;
}

function buildGatepassFilters(query) {
  const status = String(query.status || '').trim().toLowerCase();
  const laptopId = query.laptop_id ? parseInt(String(query.laptop_id), 10) : null;
  const outDateFrom = String(query.out_date_from || '').trim();
  const outDateTo = String(query.out_date_to || '').trim();
  const clauses = [];
  const params = [];
  if (status && status !== 'all') {
    clauses.push('g.status = ?');
    params.push(status);
  }
  if (Number.isInteger(laptopId)) {
    clauses.push('g.laptop_id = ?');
    params.push(laptopId);
  }
  if (outDateFrom) {
    clauses.push('g.out_date >= ?');
    params.push(outDateFrom);
  }
  if (outDateTo) {
    clauses.push('g.out_date <= ?');
    params.push(outDateTo);
  }
  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

const TABLE_CONFIG = {
  laptops: { uniqueField: 'service_tag' },
  desktops: { uniqueField: 'service_tag' },
  monitors: {},
  networking: { uniqueField: 's_n' },
  cloud_asset_register: {},
  infodesk_applications: {},
  third_party_softwares: {},
  ups: { uniqueField: 'device_id' },
  mobile_phones: {},
  scanners_and_others: { uniqueField: 's_n' },
  admin_assets: { uniqueField: 'invoice_no' },
};

function normalizeInputRow(body) {
  const out = {};
  Object.keys(body || {}).forEach((k) => {
    if (k === 'id') return;
    const v = body[k];
    out[k] = v === '' ? null : v;
  });
  return out;
}

function existsByUniqueField(tableName, fieldName, fieldValue, excludeId) {
  if (!fieldName || !fieldValue) return false;
  if (excludeId != null) {
    const row = db
      .prepare(`SELECT id FROM ${tableName} WHERE ${fieldName} = ? AND id != ?`)
      .get(fieldValue, excludeId);
    return !!row;
  }
  const row = db.prepare(`SELECT id FROM ${tableName} WHERE ${fieldName} = ?`).get(fieldValue);
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

app.get('/api/laptops/:id/gatepasses', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  const rows = db
    .prepare('SELECT * FROM laptop_gatepasses WHERE laptop_id = ? ORDER BY id DESC')
    .all(id);
  res.json(rows);
});

app.get('/api/laptop-gatepasses', (req, res) => {
  const { where, params } = buildGatepassFilters(req.query);
  const rows = db
    .prepare(
      `SELECT g.*, l.service_tag, l.model, l.asset_owner
       FROM laptop_gatepasses g
       LEFT JOIN laptops l ON l.id = g.laptop_id
       ${where}
       ORDER BY g.id DESC
       LIMIT 300`
    )
    .all(...params);
  res.json(rows);
});

app.get('/api/export/gatepasses.xlsx', async (req, res) => {
  const { where, params } = buildGatepassFilters(req.query);
  const rows = db
    .prepare(
      `SELECT g.*, l.service_tag, l.model, l.asset_owner, l.dept, l.location
       FROM laptop_gatepasses g
       LEFT JOIN laptops l ON l.id = g.laptop_id
       ${where}
       ORDER BY g.id DESC`
    )
    .all(...params);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Register';
  const sheet = workbook.addWorksheet('Gate Passes', {
    properties: { defaultColWidth: 18 },
  });

  sheet.columns = [
    { header: 'Gate Pass No', key: 'gatepass_no', width: 20 },
    { header: 'Service Tag', key: 'service_tag', width: 18 },
    { header: 'Laptop ID', key: 'laptop_id', width: 12 },
    { header: 'Issued To', key: 'issued_to', width: 20 },
    { header: 'Purpose', key: 'purpose', width: 24 },
    { header: 'Out Date', key: 'out_date', width: 14 },
    { header: 'Expected Return Date', key: 'expected_return_date', width: 18 },
    { header: 'Approved By', key: 'approved_by', width: 18 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Keyboard', key: 'keyboard', width: 16 },
    { header: 'Mouse', key: 'mouse', width: 16 },
    { header: 'HeadPhone', key: 'headphone', width: 16 },
    { header: 'USB Extender', key: 'usb_extender', width: 16 },
    { header: 'Authority Signatory', key: 'authority_signatory', width: 20 },
    { header: 'Security Signatory', key: 'security_signatory', width: 20 },
    { header: 'User Signatory', key: 'user_signatory', width: 20 },
    { header: 'Remarks', key: 'remarks', width: 24 },
    { header: 'Asset Owner', key: 'asset_owner', width: 18 },
    { header: 'Dept', key: 'dept', width: 14 },
    { header: 'Location', key: 'location', width: 18 },
    { header: 'Created By', key: 'created_by', width: 18 },
    { header: 'Created At', key: 'created_at', width: 18 },
  ];

  rows.forEach((row) => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true };

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename="laptop-gatepasses.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

function createLaptopGatepass(laptop, body, authUser) {
  const issuedTo = String(body?.issued_to || '').trim();
  const purpose = String(body?.purpose || '').trim();
  const outDate = String(body?.out_date || '').trim();
  const expectedReturn = String(body?.expected_return_date || '').trim();
  const approvedBy = String(body?.approved_by || '').trim();
  const remarks = String(body?.remarks || '').trim();
  const keyboard = String(body?.keyboard || laptop.keyboard || '').trim();
  const mouse = String(body?.mouse || laptop.mouse || '').trim();
  const headphone = String(body?.headphone || laptop.headphone || '').trim();
  const usbExtender = String(body?.usb_extender || laptop.usb_extender || '').trim();
  const authoritySignatory = String(body?.authority_signatory || '').trim();
  const securitySignatory = String(body?.security_signatory || '').trim();
  const userSignatory = String(body?.user_signatory || '').trim();
  if (!issuedTo || !purpose || !outDate) {
    return { error: 'issued_to, purpose and out_date are required' };
  }
  const gatepassNo = nextLaptopGatepassNo();
  const info = db
    .prepare(
      `INSERT INTO laptop_gatepasses (
        gatepass_no, laptop_id, issued_to, purpose, out_date, expected_return_date,
        approved_by, status, remarks, created_by, keyboard, mouse, headphone, usb_extender,
        authority_signatory, security_signatory, user_signatory
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      gatepassNo,
      laptop.id,
      issuedTo,
      purpose,
      outDate,
      expectedReturn || null,
      approvedBy || null,
      remarks || null,
      authUser?.username || 'system',
      keyboard || null,
      mouse || null,
      headphone || null,
      usbExtender || null,
      authoritySignatory || null,
      securitySignatory || null,
      userSignatory || null
    );
  const created = db.prepare('SELECT * FROM laptop_gatepasses WHERE id = ?').get(info.lastInsertRowid);
  insertAuditTrail({
    entity_table: 'laptop_gatepasses',
    entity_id: created.id,
    action_type: 'CREATE',
    previous_value: null,
    new_value: JSON.stringify(created),
    changed_by: authUser?.username || 'system',
  });
  return { created };
}

app.post('/api/laptops/:id/gatepasses', (req, res) => {
  const laptopId = parseInt(req.params.id, 10);
  if (!Number.isInteger(laptopId)) return res.status(400).json({ error: 'invalid id' });
  const laptop = getLaptopById(laptopId);
  if (!laptop) return res.status(404).json({ error: 'laptop not found' });
  const result = createLaptopGatepass(laptop, req.body, req.authUser);
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result.created);
});

app.post('/api/laptop-gatepasses', (req, res) => {
  const serviceTag = String(req.body?.service_tag || '').trim();
  if (!serviceTag) return res.status(400).json({ error: 'service_tag is required' });
  const laptop = getLaptopByServiceTag(serviceTag);
  if (!laptop) return res.status(404).json({ error: 'laptop not found for service_tag' });
  const result = createLaptopGatepass(laptop, req.body, req.authUser);
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result.created);
});

app.patch('/api/laptop-gatepasses/:id/status', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  const prev = db.prepare('SELECT * FROM laptop_gatepasses WHERE id = ?').get(id);
  if (!prev) return res.status(404).json({ error: 'gatepass not found' });
  const nextStatus = String(req.body?.status || '').trim().toLowerCase();
  const allowed = ['draft', 'approved', 'returned', 'cancelled'];
  if (!allowed.includes(nextStatus)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  db.prepare("UPDATE laptop_gatepasses SET status = ?, updated_at = datetime('now') WHERE id = ?").run(
    nextStatus,
    id
  );
  const next = db.prepare('SELECT * FROM laptop_gatepasses WHERE id = ?').get(id);
  insertAuditTrail({
    entity_table: 'laptop_gatepasses',
    entity_id: id,
    action_type: 'UPDATE',
    previous_value: JSON.stringify(prev),
    new_value: JSON.stringify(next),
    changed_by: req.authUser?.username || 'system',
  });
  res.json(next);
});

app.get('/api/laptop-gatepasses/:id/print', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).send('invalid id');
  const row = db
    .prepare(
      `SELECT g.*, l.service_tag, l.model, l.asset_owner, l.dept, l.location
       FROM laptop_gatepasses g
       LEFT JOIN laptops l ON l.id = g.laptop_id
       WHERE g.id = ?`
    )
    .get(id);
  if (!row) return res.status(404).send('gatepass not found');

  const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>Gate Pass ${row.gatepass_no}</title>
<style>
body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#111}
h1{margin:0 0 8px} table{border-collapse:collapse;width:100%;margin-top:12px}
td,th{border:1px solid #222;padding:8px;text-align:left} .muted{color:#555}
.sig{margin-top:32px;display:flex;justify-content:space-between}
</style></head><body>
<h1>Laptop Gate Pass</h1>
<div class="muted">Gate Pass No: <strong>${row.gatepass_no}</strong></div>
<div class="muted">Status: <strong>${row.status}</strong></div>
<table>
<tr><th>Service Tag</th><td>${row.service_tag || ''}</td><th>Model</th><td>${row.model || ''}</td></tr>
<tr><th>Asset Owner</th><td>${row.asset_owner || ''}</td><th>Dept</th><td>${row.dept || ''}</td></tr>
<tr><th>Location</th><td>${row.location || ''}</td><th>Issued To</th><td>${row.issued_to}</td></tr>
<tr><th>Purpose</th><td>${row.purpose}</td><th>Out Date</th><td>${row.out_date}</td></tr>
<tr><th>Expected Return</th><td>${row.expected_return_date || ''}</td><th>Approved By</th><td>${row.approved_by || ''}</td></tr>
<tr><th>Keyboard</th><td>${row.keyboard || ''}</td><th>Mouse</th><td>${row.mouse || ''}</td></tr>
<tr><th>HeadPhone</th><td>${row.headphone || ''}</td><th>USB Extender</th><td>${row.usb_extender || ''}</td></tr>
<tr><th>Remarks</th><td colspan="3">${row.remarks || ''}</td></tr>
</table>
<div class="sig">
<div>User Signatory: ${row.user_signatory || '____________'}</div>
<div>Authority Signatory: ${row.authority_signatory || '____________'}</div>
<div>Security Signatory: ${row.security_signatory || '____________'}</div>
</div>
<script>window.onload=()=>window.print();</script>
</body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.get('/api/register/:table', (req, res) => {
  const table = req.params.table;
  if (!TABLE_CONFIG[table]) return res.status(404).json({ error: 'table not found' });
  const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
  res.json(rows);
});

app.post('/api/register/:table', (req, res) => {
  const table = req.params.table;
  const cfg = TABLE_CONFIG[table];
  if (!cfg) return res.status(404).json({ error: 'table not found' });

  const row = normalizeInputRow(req.body);
  if (cfg.uniqueField) {
    const uniqueValue = String(row[cfg.uniqueField] || '').trim();
    if (!uniqueValue) {
      return res.status(400).json({ error: `${cfg.uniqueField} is required` });
    }
    row[cfg.uniqueField] = uniqueValue;
    if (existsByUniqueField(table, cfg.uniqueField, uniqueValue)) {
      return res.status(409).json({ error: `${cfg.uniqueField} must be unique` });
    }
  }

  const keys = Object.keys(row);
  if (keys.length === 0) return res.status(400).json({ error: 'no fields provided' });
  const cols = keys.join(', ');
  const placeholders = keys.map(() => '?').join(', ');
  const values = keys.map((k) => row[k]);
  try {
    const info = db.prepare(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`).run(...values);
    const created = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
    insertAuditTrail({
      entity_table: table,
      entity_id: created.id,
      action_type: 'CREATE',
      previous_value: null,
      new_value: JSON.stringify(created),
      changed_by: req.authUser?.username || 'system',
    });
    res.status(201).json(created);
  } catch (e) {
    const message = String(e.message || '');
    if (message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'record must be unique for required fields' });
    }
    if (message.includes('has no column named')) {
      return res.status(400).json({ error: message });
    }
    throw e;
  }
});

app.patch('/api/register/:table/:id', (req, res) => {
  const table = req.params.table;
  const cfg = TABLE_CONFIG[table];
  if (!cfg) return res.status(404).json({ error: 'table not found' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });

  const prev = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!prev) return res.status(404).json({ error: 'record not found' });

  const patch = normalizeInputRow(req.body);
  delete patch.id;
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'no fields provided' });
  }

  if (cfg.uniqueField && Object.prototype.hasOwnProperty.call(patch, cfg.uniqueField)) {
    const uniqueValue = String(patch[cfg.uniqueField] || '').trim();
    if (!uniqueValue) return res.status(400).json({ error: `${cfg.uniqueField} cannot be empty` });
    patch[cfg.uniqueField] = uniqueValue;
    if (existsByUniqueField(table, cfg.uniqueField, uniqueValue, id)) {
      return res.status(409).json({ error: `${cfg.uniqueField} must be unique` });
    }
  }

  const sets = Object.keys(patch)
    .map((k) => `${k} = @${k}`)
    .concat(["updated_at = datetime('now')"])
    .join(', ');

  const tx = db.transaction(() => {
    db.prepare(`UPDATE ${table} SET ${sets} WHERE id = @id`).run({ ...patch, id });
    const next = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
    insertAuditTrail({
      entity_table: table,
      entity_id: id,
      action_type: 'UPDATE',
      previous_value: JSON.stringify(prev),
      new_value: JSON.stringify(next),
      changed_by: req.authUser?.username || 'system',
    });
  });
  tx();
  res.json(db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id));
});

app.delete('/api/register/:table/:id', (req, res) => {
  const table = req.params.table;
  if (!TABLE_CONFIG[table]) return res.status(404).json({ error: 'table not found' });
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'invalid id' });
  const prev = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!prev) return res.status(404).json({ error: 'record not found' });

  const tx = db.transaction(() => {
    insertAuditTrail({
      entity_table: table,
      entity_id: id,
      action_type: 'DELETE',
      previous_value: JSON.stringify(prev),
      new_value: null,
      changed_by: req.authUser?.username || 'system',
    });
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
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
  const table = String(_req.query.table || '').trim();
  const clauses = [];
  const params = [];
  if (table) {
    clauses.push('entity_table = ?');
    params.push(table);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const entries = db.prepare(`SELECT * FROM audit_trail ${where} ORDER BY id DESC LIMIT ?`).all(...params, limit);
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
