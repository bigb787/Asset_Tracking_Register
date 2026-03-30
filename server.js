const express = require('express');
const path = require('path');
const ExcelJS = require('exceljs');
const { db, insertAuditTrail } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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
    });
    db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  });
  tx();
  res.status(204).send();
});

// --- Excel export (ISO-oriented columns) ---
app.get('/api/export/assets.xlsx', async (_req, res) => {
  const rows = db
    .prepare(`
      SELECT a.id, a.asset_tag, a.name, a.status, a.location, a.classification, a.asset_type,
             ou.name AS owner_name
      FROM assets a
      LEFT JOIN users ou ON ou.id = a.owner_user_id
      ORDER BY a.asset_tag
    `)
    .all();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Asset Register';
  const sheet = workbook.addWorksheet('Asset Inventory', {
    properties: { defaultColWidth: 18 },
  });

  sheet.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Asset Tag', key: 'asset_tag', width: 16 },
    { header: 'Name', key: 'name', width: 28 },
    { header: 'Owner', key: 'owner_name', width: 22 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Location', key: 'location', width: 20 },
    { header: 'Classification', key: 'classification', width: 14 },
    { header: 'Type', key: 'asset_type', width: 12 },
  ];

  rows.forEach((r) =>
    sheet.addRow({
      id: r.id,
      asset_tag: r.asset_tag,
      name: r.name,
      owner_name: r.owner_name || '',
      status: r.status,
      location: r.location || '',
      classification: r.classification,
      asset_type: r.asset_type,
    })
  );

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
      `SELECT * FROM audit_trail WHERE entity_table = 'assets' ORDER BY id DESC LIMIT ?`
    )
    .all(limit);
  res.json(entries);
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'internal server error' });
});

app.listen(PORT, () => {
  console.log(`Asset register listening at http://localhost:${PORT}`);
});
