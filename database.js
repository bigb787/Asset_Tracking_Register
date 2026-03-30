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
  `);
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

module.exports = { db, insertAuditTrail };
