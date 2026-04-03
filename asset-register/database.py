import os
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
_default_file = BASE_DIR / "data" / "asset_register.sqlite"
DB_PATH = Path(os.environ.get("DATABASE_PATH", str(_default_file)))


def get_connection():
    """SQLite connection with dict-like rows."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    try:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS example (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );
            """
        )
        conn.commit()
    finally:
        conn.close()
