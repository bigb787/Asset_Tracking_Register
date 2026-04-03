import os
from datetime import timedelta
from hmac import compare_digest
from pathlib import Path

from dotenv import load_dotenv
from flask import (
    Flask,
    abort,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash

from database import ALLOWED_TABLES, TABLE_COLUMNS, TABLE_ORDER, get_connection, migrate

load_dotenv(Path(__file__).resolve().parent / ".env")

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-change-me")
app.permanent_session_lifetime = timedelta(days=7)


def _auth_user():
    return (os.environ.get("ASSET_REGISTER_AUTH_USER") or "").strip()


def auth_configured():
    if not _auth_user():
        return False
    if os.environ.get("ASSET_REGISTER_AUTH_PASSWORD_HASH"):
        return True
    return bool(os.environ.get("ASSET_REGISTER_AUTH_PASSWORD"))


def _password_ok(plain: str) -> bool:
    ph = os.environ.get("ASSET_REGISTER_AUTH_PASSWORD_HASH")
    if ph:
        return check_password_hash(ph, plain or "")
    expected = os.environ.get("ASSET_REGISTER_AUTH_PASSWORD", "")
    if not expected or plain is None:
        return False
    try:
        a = plain.encode("utf-8")
        b = expected.encode("utf-8")
        if len(a) != len(b):
            return False
        return compare_digest(a, b)
    except Exception:
        return False


def _safe_next(target: str):
    if not target or not target.startswith("/") or target.startswith("//"):
        return url_for("index")
    return target


@app.context_processor
def inject_auth():
    return {"auth_enabled": auth_configured()}


@app.before_request
def require_login():
    if not auth_configured():
        return None
    if request.endpoint in ("login", "static"):
        return None
    if request.path.startswith("/static/"):
        return None
    if session.get("auth_ok") is True:
        return None
    if request.path.startswith("/api/"):
        return jsonify({"error": "Unauthorized"}), 401
    return redirect(url_for("login", next=request.path))


@app.route("/login", methods=["GET", "POST"])
def login():
    if not auth_configured():
        return redirect(url_for("index"))
    error = None
    next_url = request.args.get("next") or ""
    if request.method == "POST":
        next_url = request.form.get("next") or next_url
        username = (request.form.get("username") or "").strip()
        password = request.form.get("password") or ""
        if username == _auth_user() and _password_ok(password):
            session.clear()
            session["auth_ok"] = True
            session.permanent = True
            return redirect(_safe_next(next_url))
        error = "Invalid username or password."
    return render_template("login.html", error=error, next=next_url)


@app.route("/logout")
def logout():
    session.clear()
    if auth_configured():
        return redirect(url_for("login"))
    return redirect(url_for("index"))


def _validate_table(name: str) -> str:
    if name not in ALLOWED_TABLES:
        abort(404)
    return name


def _qi(ident: str) -> str:
    return '"' + ident.replace('"', '""') + '"'


def _qt(table: str) -> str:
    return '"' + table.replace('"', '""') + '"'


def _normalize_is_free(val):
    if val is None or val == "":
        return 0
    if isinstance(val, bool):
        return 1 if val else 0
    if isinstance(val, int):
        return 1 if val else 0
    s = str(val).strip().lower()
    if s in ("yes", "y", "1", "true"):
        return 1
    return 0


def _row_to_dict(row):
    return {k: row[k] for k in row.keys()}


def _filter_payload(table: str, data: dict) -> dict:
    allowed = set(TABLE_COLUMNS[table])
    out = {}
    for key, val in data.items():
        if key not in allowed:
            continue
        if key == "is_free":
            out[key] = _normalize_is_free(val)
        elif val == "":
            out[key] = None
        else:
            out[key] = val
    return out


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/tables", methods=["GET"])
def api_tables_list():
    conn = get_connection()
    try:
        result = []
        for t in TABLE_ORDER:
            cur = conn.execute(f"SELECT COUNT(*) AS c FROM {_qt(t)}")
            n = cur.fetchone()["c"]
            result.append({"name": t, "row_count": n})
        return jsonify(result)
    finally:
        conn.close()


@app.route("/api/tables/<table_name>/rows", methods=["GET"])
def api_rows_list(table_name):
    t = _validate_table(table_name)
    conn = get_connection()
    try:
        cur = conn.execute(f"SELECT * FROM {_qt(t)} ORDER BY id ASC")
        rows = [_row_to_dict(r) for r in cur.fetchall()]
        return jsonify(rows)
    finally:
        conn.close()


@app.route("/api/tables/<table_name>/rows", methods=["POST"])
def api_rows_create(table_name):
    t = _validate_table(table_name)
    data = request.get_json(silent=True) or {}
    payload = _filter_payload(t, data)
    if not payload:
        return jsonify({"error": "No valid fields"}), 400
    cols = list(payload.keys())
    placeholders = ", ".join("?" * len(cols))
    col_sql = ", ".join(_qi(c) for c in cols)
    values = [payload[c] for c in cols]
    conn = get_connection()
    try:
        cur = conn.execute(
            f"INSERT INTO {_qt(t)} ({col_sql}) VALUES ({placeholders})",
            values,
        )
        conn.commit()
        rid = cur.lastrowid
        cur2 = conn.execute(f"SELECT * FROM {_qt(t)} WHERE id = ?", (rid,))
        row = cur2.fetchone()
        return jsonify(_row_to_dict(row)), 201
    finally:
        conn.close()


@app.route("/api/tables/<table_name>/rows/<int:row_id>", methods=["PUT"])
def api_rows_update(table_name, row_id):
    t = _validate_table(table_name)
    data = request.get_json(silent=True) or {}
    payload = _filter_payload(t, data)
    if not payload:
        return jsonify({"error": "No valid fields"}), 400
    conn = get_connection()
    try:
        cur = conn.execute(f"SELECT id FROM {_qt(t)} WHERE id = ?", (row_id,))
        if cur.fetchone() is None:
            abort(404)
        sets = ", ".join(f"{_qi(c)} = ?" for c in payload)
        values = list(payload.values()) + [row_id]
        conn.execute(f"UPDATE {_qt(t)} SET {sets} WHERE id = ?", values)
        conn.commit()
        cur2 = conn.execute(f"SELECT * FROM {_qt(t)} WHERE id = ?", (row_id,))
        return jsonify(_row_to_dict(cur2.fetchone()))
    finally:
        conn.close()


@app.route("/api/tables/<table_name>/rows/<int:row_id>", methods=["DELETE"])
def api_rows_delete(table_name, row_id):
    t = _validate_table(table_name)
    conn = get_connection()
    try:
        cur = conn.execute(f"DELETE FROM {_qt(t)} WHERE id = ?", (row_id,))
        conn.commit()
        if cur.rowcount == 0:
            abort(404)
        return "", 204
    finally:
        conn.close()


with app.app_context():
    migrate()


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug, host="127.0.0.1", port=int(os.environ.get("PORT", "5000")))
