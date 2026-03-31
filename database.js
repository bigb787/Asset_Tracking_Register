const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'asset_register.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      department TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_tag TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      asset_type TEXT NOT NULL DEFAULT 'hardware',
      classification TEXT NOT NULL DEFAULT 'internal',
      location TEXT,
      status TEXT NOT NULL DEFAULT 'in_use',
      owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_assets_owner ON assets(owner_user_id);
    CREATE INDEX IF NOT EXISTS idx_assets_assigned ON assets(assigned_user_id);

    CREATE TABLE IF NOT EXISTS audit_trail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_table TEXT NOT NULL,
      entity_id INTEGER,
      action_type TEXT NOT NULL,
      previous_value TEXT,
      new_value TEXT,
      changed_by TEXT NOT NULL DEFAULT 'system',
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail(entity_table, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_trail(timestamp);

    CREATE TABLE IF NOT EXISTS auth_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS laptops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT,
      asset_manufacturer TEXT,
      service_tag TEXT NOT NULL UNIQUE,
      model TEXT,
      p_n TEXT,
      asset_owner TEXT,
      assigned_to TEXT,
      asset_status TEXT,
      last_owner TEXT,
      dept TEXT,
      location TEXT,
      asset_health TEXT,
      warranty TEXT,
      install_date TEXT,
      date_added_updated TEXT,
      processor TEXT,
      ram TEXT,
      harddisk TEXT,
      o_s TEXT,
      supt_vendor TEXT,
      keyboard TEXT,
      mouse TEXT,
      headphone TEXT,
      usb_extender TEXT,
      contains_pii TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_laptops_service_tag ON laptops(service_tag);

    CREATE TABLE IF NOT EXISTS desktops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT,
      asset_manufacturer TEXT,
      processor TEXT,
      asset_owner TEXT,
      dept TEXT,
      location TEXT,
      model TEXT,
      service_tag TEXT UNIQUE,
      warranty TEXT,
      install_date TEXT,
      o_s TEXT,
      supt_vendor TEXT,
      configuration TEXT,
      contains_pii TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT,
      user_name TEXT,
      model TEXT,
      warranty TEXT,
      install_date TEXT,
      supt_vendor TEXT,
      location TEXT,
      dept TEXT,
      asset_owner TEXT,
      contains_pii TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS networking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT,
      user_name TEXT,
      model TEXT,
      s_n TEXT,
      warranty TEXT,
      supt_vendor TEXT,
      location TEXT,
      dept TEXT,
      asset_owner TEXT,
      contains_pii TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cloud_asset_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset TEXT,
      asset_type TEXT,
      asset_value TEXT,
      asset_owner TEXT,
      asset_location TEXT,
      contains_pii_data TEXT,
      asset_region TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS infodesk_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset TEXT,
      asset_type TEXT,
      asset_owner TEXT,
      asset_location TEXT,
      contains_pii_data TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS third_party_softwares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset TEXT,
      asset_type TEXT,
      asset_value TEXT,
      asset_owner TEXT,
      asset_location TEXT,
      contains_pii_data TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT,
      device_id TEXT,
      model TEXT,
      warranty TEXT,
      install_date TEXT,
      supt_vendor TEXT,
      location TEXT,
      dept TEXT,
      asset_owner TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mobile_phones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT,
      model TEXT,
      warranty TEXT,
      supt_vendor TEXT,
      location TEXT,
      dept TEXT,
      asset_owner TEXT,
      contains_pii TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS scanners_and_others (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT,
      model TEXT,
      s_n TEXT,
      warranty TEXT,
      supt_vendor TEXT,
      location TEXT,
      dept TEXT,
      asset_owner TEXT,
      contains_pii TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_type TEXT,
      invoice_no TEXT,
      warranty TEXT,
      install_date TEXT,
      supt_vendor TEXT,
      location TEXT,
      dept TEXT,
      asset_owner TEXT,
      contains_pii TEXT,
      date_added_updated TEXT,
      free_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS laptop_gatepasses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gatepass_no TEXT NOT NULL UNIQUE,
      laptop_id INTEGER NOT NULL REFERENCES laptops(id) ON DELETE CASCADE,
      issued_to TEXT NOT NULL,
      purpose TEXT NOT NULL,
      out_date TEXT NOT NULL,
      expected_return_date TEXT,
      approved_by TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      remarks TEXT,
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_laptop_gatepasses_laptop ON laptop_gatepasses(laptop_id);
  `);
}

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

/**
 * @param {{
 *   entity_table: string;
 *   entity_id: number | null;
 *   action_type: string;
 *   previous_value: string | null;
 *   new_value: string | null;
 *   changed_by?: string;
 * }} row
 */
function insertAuditTrail(row) {
  const stmt = db.prepare(`
    INSERT INTO audit_trail (entity_table, entity_id, action_type, previous_value, new_value, changed_by)
    VALUES (@entity_table, @entity_id, @action_type, @previous_value, @new_value, @changed_by)
  `);
  stmt.run({
    entity_table: row.entity_table,
    entity_id: row.entity_id,
    action_type: row.action_type,
    previous_value: row.previous_value,
    new_value: row.new_value,
    changed_by: row.changed_by ?? 'system',
  });
}

initSchema();
ensureColumn('laptops', 'free_note', 'TEXT');
ensureColumn('laptop_gatepasses', 'keyboard', 'TEXT');
ensureColumn('laptop_gatepasses', 'mouse', 'TEXT');
ensureColumn('laptop_gatepasses', 'headphone', 'TEXT');
ensureColumn('laptop_gatepasses', 'usb_extender', 'TEXT');

module.exports = { db, insertAuditTrail };
