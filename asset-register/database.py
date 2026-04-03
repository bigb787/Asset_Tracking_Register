import os
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
_default_file = BASE_DIR / "data" / "asset_register.sqlite"
DB_PATH = Path(os.environ.get("DATABASE_PATH", str(_default_file)))

TABLE_ORDER = [
    "laptops",
    "desktops",
    "monitors",
    "networking",
    "cloud_assets",
    "infodesk_applications",
    "third_party_software",
    "ups",
    "mobile_phones",
    "scanners_others",
    "admin",
]

ALLOWED_TABLES = frozenset(TABLE_ORDER)

TABLE_COLUMNS = {
    "laptops": [
        "asset_type",
        "asset_manufacturer",
        "service_tag",
        "model",
        "pn",
        "asset_owner",
        "assigned_to",
        "asset_status",
        "last_owner",
        "dept",
        "location",
        "asset_health",
        "warranty",
        "install_date",
        "date_added_updated",
        "processor",
        "ram",
        "harddisk",
        "os",
        "supt_vendor",
        "keyboard",
        "mouse",
        "headphone",
        "usb_extender",
        "contains_pii",
        "is_free",
    ],
    "desktops": [
        "asset_type",
        "asset_manufacturer",
        "service_tag",
        "model",
        "pn",
        "asset_owner",
        "assigned_to",
        "asset_status",
        "last_owner",
        "dept",
        "location",
        "asset_health",
        "warranty",
        "install_date",
        "date_added_updated",
        "processor",
        "os",
        "supt_vendor",
        "configuration",
        "contains_pii",
        "is_free",
    ],
    "monitors": [
        "asset_type",
        "asset_manufacturer",
        "service_tag",
        "model",
        "pn",
        "asset_owner",
        "assigned_to",
        "asset_status",
        "dept",
        "location",
        "asset_health",
        "warranty",
        "install_date",
        "date_added_updated",
        "supt_vendor",
        "contains_pii",
        "is_free",
    ],
    "networking": [
        "asset_type",
        "asset_id",
        "mac_id",
        "asset_owner",
        "location",
        "model",
        "sn",
        "pn",
        "warranty",
        "install_date",
        "os",
        "supt_vendor",
        "dept",
        "configuration",
        "contains_pii",
        "date_added_updated",
        "is_free",
    ],
    "cloud_assets": [
        "asset",
        "asset_type",
        "asset_value",
        "asset_owner",
        "asset_location",
        "contains_pii",
        "asset_region",
        "date_added_updated",
        "is_free",
    ],
    "infodesk_applications": [
        "asset",
        "asset_type",
        "asset_value",
        "asset_owner",
        "asset_location",
        "contains_pii",
        "date_added_updated",
        "is_free",
    ],
    "third_party_software": [
        "asset",
        "asset_type",
        "asset_value",
        "asset_owner",
        "asset_location",
        "contains_pii",
        "date_added_updated",
        "cve_alert_setup",
        "billing_api",
        "is_free",
    ],
    "ups": [
        "asset_type",
        "device_id",
        "location",
        "model",
        "warranty",
        "install_date",
        "supt_vendor",
        "dept",
        "asset_owner",
        "contains_pii",
        "date_added_updated",
        "is_free",
    ],
    "mobile_phones": [
        "asset_type",
        "device_id",
        "location",
        "model",
        "pn",
        "warranty",
        "supt_vendor",
        "dept",
        "asset_owner",
        "contains_pii",
        "date_added_updated",
        "is_free",
    ],
    "scanners_others": [
        "asset_type",
        "device_id",
        "location",
        "model",
        "service_tag",
        "pn",
        "warranty",
        "supt_vendor",
        "dept",
        "description",
        "asset_owner",
        "contains_pii",
        "date_added_updated",
        "is_free",
    ],
    "admin": [
        "asset_type",
        "location",
        "invoice_no",
        "warranty",
        "install_date",
        "supt_vendor",
        "dept",
        "asset_owner",
        "contains_pii",
        "date_added_updated",
        "is_free",
    ],
}

GATEPASS_MUTABLE_FIELDS = frozenset(
    {
        "gatepass_date",
        "pass_type",
        "issued_to",
        "person",
        "department_head",
        "security_incharge",
        "receiver_name",
        "asset_items",
        "department",
        "requested_by",
        "approved_by",
        "purpose",
        "asset_description",
        "asset_serial_no",
        "quantity",
        "expected_return_date",
        "actual_return_date",
        "gate_out_time",
        "gate_in_time",
        "security_guard",
        "remarks",
        "status",
    }
)

_EXTRA_GATEPASS_COLS = (
    ("pass_type", "TEXT DEFAULT 'Returnable / Outward'"),
    ("issued_to", "TEXT"),
    ("person", "TEXT"),
    ("department_head", "TEXT"),
    ("security_incharge", "TEXT"),
    ("receiver_name", "TEXT"),
    ("asset_items", "TEXT"),
)


def _ensure_gatepass_columns(conn):
    cur = conn.execute("PRAGMA table_info(gatepass)")
    have = {row[1] for row in cur.fetchall()}
    for name, decl in _EXTRA_GATEPASS_COLS:
        if name not in have:
            conn.execute(f"ALTER TABLE gatepass ADD COLUMN {name} {decl}")


_EXTRA_ASSET_COLUMNS = {
    "desktops": [
        ("pn", "TEXT"),
        ("assigned_to", "TEXT"),
        ("asset_status", "TEXT"),
        ("last_owner", "TEXT"),
        ("asset_health", "TEXT"),
    ],
    "monitors": [
        ("asset_manufacturer", "TEXT"),
        ("service_tag", "TEXT"),
        ("pn", "TEXT"),
        ("assigned_to", "TEXT"),
        ("asset_status", "TEXT"),
        ("asset_health", "TEXT"),
    ],
    "networking": [
        ("asset_id", "TEXT"),
        ("mac_id", "TEXT"),
        ("pn", "TEXT"),
        ("install_date", "TEXT"),
        ("os", "TEXT"),
        ("configuration", "TEXT"),
    ],
    "infodesk_applications": [
        ("asset_value", "TEXT"),
    ],
    "third_party_software": [
        ("cve_alert_setup", "TEXT"),
        ("billing_api", "TEXT"),
    ],
    "ups": [
        ("contains_pii", "TEXT"),
    ],
    "mobile_phones": [
        ("device_id", "TEXT"),
        ("pn", "TEXT"),
    ],
    "scanners_others": [
        ("device_id", "TEXT"),
        ("service_tag", "TEXT"),
        ("pn", "TEXT"),
        ("description", "TEXT"),
    ],
}


def _ensure_asset_table_columns(conn):
    for table, cols in _EXTRA_ASSET_COLUMNS.items():
        cur = conn.execute(f"PRAGMA table_info({table})")
        have = {row[1] for row in cur.fetchall()}
        if not have:
            continue
        for name, decl in cols:
            if name not in have:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {name} {decl}")


def _run_asset_row_migrations(conn):
    for sql in (
        """UPDATE monitors SET assigned_to = "user" WHERE """
        """(assigned_to IS NULL OR trim(assigned_to) = '') """
        """AND "user" IS NOT NULL AND trim("user") != ''""",
        """UPDATE networking SET asset_owner = "user" WHERE """
        """(asset_owner IS NULL OR trim(asset_owner) = '') """
        """AND "user" IS NOT NULL AND trim("user") != ''""",
        """UPDATE scanners_others SET service_tag = sn WHERE """
        """(service_tag IS NULL OR trim(service_tag) = '') """
        """AND sn IS NOT NULL AND trim(sn) != ''""",
    ):
        try:
            conn.execute(sql)
        except sqlite3.OperationalError:
            pass


_MIGRATION_SQL = """
DROP TABLE IF EXISTS assets;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS example;

CREATE TABLE IF NOT EXISTS laptops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_type TEXT, asset_manufacturer TEXT, service_tag TEXT,
  model TEXT, pn TEXT, asset_owner TEXT, assigned_to TEXT,
  asset_status TEXT, last_owner TEXT, dept TEXT, location TEXT,
  asset_health TEXT, warranty TEXT, install_date TEXT,
  date_added_updated TEXT, processor TEXT, ram TEXT, harddisk TEXT,
  os TEXT, supt_vendor TEXT, keyboard TEXT, mouse TEXT,
  headphone TEXT, usb_extender TEXT, contains_pii TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS desktops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_type TEXT, asset_manufacturer TEXT, service_tag TEXT, model TEXT, pn TEXT,
  asset_owner TEXT, assigned_to TEXT, asset_status TEXT, last_owner TEXT,
  dept TEXT, location TEXT, asset_health TEXT, warranty TEXT, install_date TEXT,
  date_added_updated TEXT, processor TEXT, os TEXT, supt_vendor TEXT,
  configuration TEXT, contains_pii TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_type TEXT, asset_manufacturer TEXT, service_tag TEXT, model TEXT, pn TEXT,
  asset_owner TEXT, assigned_to TEXT, asset_status TEXT, dept TEXT, location TEXT,
  asset_health TEXT, warranty TEXT, install_date TEXT, date_added_updated TEXT,
  supt_vendor TEXT, contains_pii TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS networking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_type TEXT, asset_id TEXT, mac_id TEXT, asset_owner TEXT, location TEXT,
  model TEXT, sn TEXT, pn TEXT, warranty TEXT, install_date TEXT, os TEXT,
  supt_vendor TEXT, dept TEXT, configuration TEXT, contains_pii TEXT,
  date_added_updated TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cloud_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset TEXT, asset_type TEXT, asset_value TEXT, asset_owner TEXT,
  asset_location TEXT, contains_pii TEXT, asset_region TEXT,
  date_added_updated TEXT, is_free INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS infodesk_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset TEXT, asset_type TEXT, asset_value TEXT, asset_owner TEXT, asset_location TEXT,
  contains_pii TEXT, date_added_updated TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS third_party_software (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset TEXT, asset_type TEXT, asset_value TEXT, asset_owner TEXT, asset_location TEXT,
  contains_pii TEXT, date_added_updated TEXT, cve_alert_setup TEXT, billing_api TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_type TEXT, device_id TEXT, location TEXT, model TEXT, warranty TEXT,
  install_date TEXT, supt_vendor TEXT, dept TEXT, asset_owner TEXT, contains_pii TEXT,
  date_added_updated TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mobile_phones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_type TEXT, device_id TEXT, location TEXT, model TEXT, pn TEXT, warranty TEXT,
  supt_vendor TEXT, dept TEXT, asset_owner TEXT, contains_pii TEXT, date_added_updated TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scanners_others (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_type TEXT, device_id TEXT, location TEXT, model TEXT, service_tag TEXT, pn TEXT,
  warranty TEXT, supt_vendor TEXT, dept TEXT, description TEXT, asset_owner TEXT,
  contains_pii TEXT, date_added_updated TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_type TEXT, location TEXT, invoice_no TEXT, warranty TEXT, install_date TEXT,
  supt_vendor TEXT, dept TEXT, asset_owner TEXT, contains_pii TEXT, date_added_updated TEXT,
  is_free INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gatepass (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gatepass_no TEXT UNIQUE NOT NULL,
  gatepass_date TEXT,
  pass_type TEXT DEFAULT 'Returnable / Outward',
  issued_to TEXT,
  person TEXT,
  department_head TEXT,
  security_incharge TEXT,
  receiver_name TEXT,
  asset_items TEXT,
  department TEXT,
  requested_by TEXT,
  approved_by TEXT,
  purpose TEXT,
  asset_description TEXT,
  asset_serial_no TEXT,
  quantity TEXT,
  expected_return_date TEXT,
  actual_return_date TEXT,
  gate_out_time TEXT,
  gate_in_time TEXT,
  security_guard TEXT,
  remarks TEXT,
  status TEXT DEFAULT 'Open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"""


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def migrate():
    """Create / refresh schema: legacy drops + 11 asset tables + gatepass."""
    conn = get_connection()
    try:
        conn.executescript(_MIGRATION_SQL)
        _ensure_gatepass_columns(conn)
        _ensure_asset_table_columns(conn)
        _run_asset_row_migrations(conn)
        conn.commit()
    finally:
        conn.close()


def init_db():
    migrate()


if __name__ == "__main__":
    migrate()
