import io
import os
import textwrap
from datetime import datetime, timedelta
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
    send_file,
    session,
    url_for,
)
from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from werkzeug.security import check_password_hash

from database import (
    ALLOWED_TABLES,
    GATEPASS_MUTABLE_FIELDS,
    TABLE_COLUMNS,
    TABLE_ORDER,
    get_connection,
    migrate,
)
from export_common import (
    EXPORT_SHEET_TITLES,
    GATEPASS_COLUMN_ORDER,
    GATEPASS_LABELS,
    excel_value,
    header_labels_for_asset_table,
    summary_table_specs,
)

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
        gp = conn.execute("SELECT COUNT(*) AS c FROM gatepass").fetchone()["c"]
        result.append({"name": "gatepass", "row_count": gp})
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


# --- Excel export (openpyxl) ---
_EXCEL_HEADER_FILL = PatternFill(start_color="185FA5", end_color="185FA5", fill_type="solid")
_EXCEL_HEADER_FONT = Font(color="FFFFFF", bold=True)
_EXCEL_ALT_FILL = PatternFill(start_color="F5F5F5", end_color="F5F5F5", fill_type="solid")


def _autofit_worksheet(ws, max_width=55):
    for col in ws.iter_cols(min_row=1, max_row=ws.max_row):
        letter = get_column_letter(col[0].column)
        maxlen = 10
        for cell in col:
            if cell.value is None:
                continue
            maxlen = max(maxlen, min(max_width, len(str(cell.value)) + 2))
        ws.column_dimensions[letter].width = maxlen


def _style_header_row(ws, row_idx=1):
    for cell in ws[row_idx]:
        cell.fill = _EXCEL_HEADER_FILL
        cell.font = _EXCEL_HEADER_FONT
        cell.alignment = Alignment(vertical="center", wrap_text=True)


def _apply_alternating_rows(ws, start_row=2):
    for i, row in enumerate(ws.iter_rows(min_row=start_row, max_row=ws.max_row)):
        fill = _EXCEL_ALT_FILL if i % 2 == 1 else None
        if fill:
            for c in row:
                c.fill = fill


def _last_updated_for_table(conn, db_key: str):
    if db_key == "gatepass":
        q = "SELECT MAX(COALESCE(updated_at, created_at)) AS m FROM gatepass"
    else:
        q = f"SELECT MAX(created_at) AS m FROM {_qt(db_key)}"
    try:
        row = conn.execute(q).fetchone()
        v = row["m"] if row else None
        return v if v is not None else ""
    except Exception:
        return ""


def _write_summary_sheet(ws, conn):
    ws.append(["Table Name", "Total Rows", "Last Updated"])
    _style_header_row(ws, 1)
    for display_name, db_key in summary_table_specs():
        if db_key == "gatepass":
            cnt = conn.execute("SELECT COUNT(*) AS c FROM gatepass").fetchone()["c"]
        else:
            cnt = conn.execute(f"SELECT COUNT(*) AS c FROM {_qt(db_key)}").fetchone()["c"]
        lu = _last_updated_for_table(conn, db_key)
        ws.append([display_name, cnt, lu])
    _autofit_worksheet(ws)


def _write_asset_sheet(ws, conn, db_key: str):
    cols = TABLE_COLUMNS[db_key]
    headers = header_labels_for_asset_table(db_key)
    ws.append(headers)
    _style_header_row(ws, 1)
    cur = conn.execute(f"SELECT * FROM {_qt(db_key)} ORDER BY id ASC")
    for r in cur.fetchall():
        ws.append([excel_value(c, r[c]) for c in cols])
    _apply_alternating_rows(ws, 2)
    _autofit_worksheet(ws)


def _write_gatepass_data_sheet(ws, conn):
    headers = [GATEPASS_LABELS[c] for c in GATEPASS_COLUMN_ORDER]
    ws.append(headers)
    _style_header_row(ws, 1)
    cur = conn.execute("SELECT * FROM gatepass ORDER BY id ASC")
    for r in cur.fetchall():
        d = _row_to_dict(r)
        ws.append([d.get(c) for c in GATEPASS_COLUMN_ORDER])
    _apply_alternating_rows(ws, 2)
    _autofit_worksheet(ws)


@app.route("/api/export/all")
def export_all():
    conn = get_connection()
    try:
        wb = Workbook()
        wb.remove(wb.active)
        ws_sum = wb.create_sheet("Summary", 0)
        _write_summary_sheet(ws_sum, conn)
        for db_key in TABLE_ORDER:
            title = EXPORT_SHEET_TITLES[db_key]
            ws = wb.create_sheet(title)
            _write_asset_sheet(ws, conn, db_key)
        ws_g = wb.create_sheet(EXPORT_SHEET_TITLES["gatepass"])
        _write_gatepass_data_sheet(ws_g, conn)
        bio = io.BytesIO()
        wb.save(bio)
        bio.seek(0)
        fname = f"asset_register_export_{datetime.now().date().isoformat()}.xlsx"
        return send_file(
            bio,
            as_attachment=True,
            download_name=fname,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    finally:
        conn.close()


# --- Gatepass API ---
def _filter_gatepass_payload(data: dict) -> dict:
    out = {}
    for k, v in data.items():
        if k not in GATEPASS_MUTABLE_FIELDS:
            continue
        out[k] = None if v == "" else v
    return out


def _next_gatepass_no(conn):
    today = datetime.now().strftime("%Y%m%d")
    prefix = f"GP-{today}-"
    row = conn.execute(
        "SELECT gatepass_no FROM gatepass WHERE gatepass_no LIKE ? ORDER BY gatepass_no DESC LIMIT 1",
        (f"{prefix}%",),
    ).fetchone()
    if not row:
        return f"{prefix}001"
    try:
        n = int(str(row["gatepass_no"]).rsplit("-", 1)[-1]) + 1
    except (ValueError, IndexError):
        n = 1
    return f"{prefix}{n:03d}"


def _pdf_gatepass_buffer(row: dict):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    m = 2 * cm
    x_left = m
    x_right = w - m
    y_top = h - m
    y_bottom = m
    cw = x_right - x_left
    mid_x = x_left + cw / 2
    blue = colors.HexColor("#185FA5")

    def fmt_date(s):
        if not s:
            return ""
        try:
            if len(s) >= 10:
                d = datetime.strptime(str(s)[:10], "%Y-%m-%d")
                return d.strftime("%d-%b-%Y")
        except Exception:
            pass
        return str(s)

    gpno = str(row.get("gatepass_no") or "")
    box_pad = 0.5 * cm
    box_w = max(
        5.0 * cm,
        stringWidth(gpno, "Helvetica-Bold", 11) + box_pad * 2,
    )
    box_h = 1.05 * cm
    box_x1 = x_right
    box_x0 = box_x1 - box_w
    box_y1 = y_top - 0.35 * cm
    box_y0 = box_y1 - box_h

    c.setStrokeColor(colors.black)
    c.setLineWidth(1)
    c.rect(box_x0, box_y0, box_w, box_h, fill=0, stroke=1)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 11)
    tw_gp = stringWidth(gpno, "Helvetica-Bold", 11)
    c.drawString(box_x0 + (box_w - tw_gp) / 2, box_y0 + (box_h - 11) / 2 - 1, gpno)

    c.setFont("Helvetica", 9)
    c.setFillColor(colors.black)
    c.drawString(x_left, box_y0 + (box_h - 9) / 2, "[Company Logo / Company Name]")

    gap_below_top = 0.4 * cm
    bar_h = max(1.15 * cm, 28)  # room for 24 pt + padding
    bar_y1 = box_y0 - gap_below_top
    bar_y0 = bar_y1 - bar_h
    c.setFillColor(blue)
    c.rect(x_left, bar_y0, cw, bar_h, fill=1, stroke=0)
    title = "GATE PASS"
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    tw_t = stringWidth(title, "Helvetica-Bold", 24)
    tx = x_left + (cw - tw_t) / 2
    ty = bar_y0 + (bar_h - 24) / 2 + 5
    c.drawString(tx, ty, title)
    c.setFillColor(colors.black)

    yy = bar_y0 - 0.55 * cm
    lh = 0.5 * cm
    vx = x_left + 2.9 * cm

    def row_single(label, value):
        nonlocal yy
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_left, yy, label)
        c.setFont("Helvetica", 10)
        c.drawString(vx, yy, str(value or ""))
        yy -= lh

    def row_pair(label1, val1, label2, val2):
        nonlocal yy
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x_left, yy, label1)
        c.setFont("Helvetica", 10)
        c.drawString(vx, yy, str(val1 or ""))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(mid_x, yy, label2)
        c.setFont("Helvetica", 10)
        c.drawString(mid_x + 2.4 * cm, yy, str(val2 or ""))
        yy -= lh

    row_single("Date:", fmt_date(row.get("gatepass_date")))
    row_single("Department:", row.get("department"))
    row_pair(
        "Requested By:",
        row.get("requested_by"),
        "Approved By:",
        row.get("approved_by"),
    )

    c.setFont("Helvetica-Bold", 10)
    c.drawString(x_left, yy, "Purpose:")
    yy -= 0.35 * cm
    c.setFont("Helvetica", 10)
    wrap_w = max(20, int(cw / (6.5)))
    for line in textwrap.wrap(str(row.get("purpose") or ""), width=wrap_w) or [""]:
        c.drawString(x_left, yy, line)
        yy -= 0.4 * cm
    yy -= 0.15 * cm

    # Asset table: full grid
    row1_h = 0.62 * cm
    row2_h = 0.95 * cm
    w1 = 0.50 * cw
    w2 = 0.30 * cw
    w3 = cw - w1 - w2
    tbl_top = yy
    tbl_mid = tbl_top - row1_h
    tbl_bot = tbl_mid - row2_h
    x0, x1, x2, x3 = x_left, x_left + w1, x_left + w1 + w2, x_right

    c.setStrokeColor(colors.black)
    c.setLineWidth(0.75)
    c.line(x0, tbl_top, x3, tbl_top)
    c.line(x0, tbl_mid, x3, tbl_mid)
    c.line(x0, tbl_bot, x3, tbl_bot)
    c.line(x0, tbl_top, x0, tbl_bot)
    c.line(x1, tbl_top, x1, tbl_bot)
    c.line(x2, tbl_top, x2, tbl_bot)
    c.line(x3, tbl_top, x3, tbl_bot)

    header_mid_y = (tbl_top + tbl_mid) / 2 - 3
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x0 + 0.15 * cm, header_mid_y, "Asset Description")
    c.drawString(x1 + 0.12 * cm, header_mid_y, "Serial No")
    c.drawString(x2 + 0.12 * cm, header_mid_y, "Qty")
    c.setFont("Helvetica", 9)
    data_mid_y = (tbl_mid + tbl_bot) / 2 - 3
    desc_txt = str(row.get("asset_description") or "")
    c.drawString(x0 + 0.15 * cm, data_mid_y, desc_txt[:95] + ("…" if len(desc_txt) > 95 else ""))
    c.drawString(x1 + 0.12 * cm, data_mid_y, str(row.get("asset_serial_no") or ""))
    c.drawString(x2 + 0.12 * cm, data_mid_y, str(row.get("quantity") or ""))
    yy = tbl_bot - 0.45 * cm

    row_single("Expected Return:", fmt_date(row.get("expected_return_date")))
    row_single("Actual Return:", fmt_date(row.get("actual_return_date")))
    row_pair(
        "Gate Out Time:",
        row.get("gate_out_time"),
        "Gate In Time:",
        row.get("gate_in_time"),
    )

    c.setFont("Helvetica-Bold", 10)
    c.drawString(x_left, yy, "Remarks:")
    yy -= 0.35 * cm
    c.setFont("Helvetica", 10)
    for line in textwrap.wrap(str(row.get("remarks") or ""), width=wrap_w) or [""]:
        c.drawString(x_left, yy, line)
        yy -= 0.4 * cm
    yy -= 0.15 * cm

    row_pair(
        "Security Guard:",
        row.get("security_guard"),
        "Status:",
        row.get("status"),
    )

    sig_line_w = 6 * cm
    sig_gap_above_footer = 1.35 * cm
    label_off = 0.32 * cm
    sig_y = y_bottom + sig_gap_above_footer + 0.55 * cm
    c.setLineWidth(0.9)
    c.line(x_left, sig_y, x_left + sig_line_w, sig_y)
    c.line(x_right - sig_line_w, sig_y, x_right, sig_y)
    c.setFont("Helvetica", 9)
    c.drawCentredString(x_left + sig_line_w / 2, sig_y - label_off, "Requested By (Signature)")
    c.drawCentredString(x_right - sig_line_w / 2, sig_y - label_off, "Approved By (Signature)")

    ts = datetime.now().strftime("%d-%b-%Y %H:%M:%S")
    c.setFont("Helvetica", 8)
    c.setFillColor(colors.HexColor("#444444"))
    c.drawCentredString(
        w / 2,
        y_bottom + 0.45 * cm,
        "This is a system generated document",
    )
    c.drawCentredString(w / 2, y_bottom + 0.2 * cm, ts)
    c.setFillColor(colors.black)

    c.showPage()
    c.save()
    buf.seek(0)
    return buf


@app.route("/api/gatepass", methods=["GET"])
def gatepass_list():
    conn = get_connection()
    try:
        cur = conn.execute("SELECT * FROM gatepass ORDER BY id DESC")
        return jsonify([_row_to_dict(r) for r in cur.fetchall()])
    finally:
        conn.close()


@app.route("/api/gatepass", methods=["POST"])
def gatepass_create():
    data = request.get_json(silent=True) or {}
    payload = _filter_gatepass_payload(data)
    conn = get_connection()
    try:
        gno = _next_gatepass_no(conn)
        cols = ["gatepass_no"] + list(payload.keys())
        values = [gno] + [payload[k] for k in payload.keys()]
        ph = ", ".join("?" * len(values))
        colsql = ", ".join(_qi(c) for c in cols)
        cur = conn.execute(f"INSERT INTO gatepass ({colsql}) VALUES ({ph})", values)
        conn.commit()
        rid = cur.lastrowid
        row = conn.execute("SELECT * FROM gatepass WHERE id = ?", (rid,)).fetchone()
        return jsonify(_row_to_dict(row)), 201
    finally:
        conn.close()


@app.route("/api/gatepass/<int:row_id>", methods=["PUT"])
def gatepass_update(row_id):
    data = request.get_json(silent=True) or {}
    payload = _filter_gatepass_payload(data)
    if not payload:
        return jsonify({"error": "No valid fields"}), 400
    conn = get_connection()
    try:
        if conn.execute("SELECT id FROM gatepass WHERE id = ?", (row_id,)).fetchone() is None:
            abort(404)
        sets = ", ".join(f"{_qi(k)} = ?" for k in payload) + ", updated_at = datetime('now')"
        vals = list(payload.values()) + [row_id]
        conn.execute(f"UPDATE gatepass SET {sets} WHERE id = ?", vals)
        conn.commit()
        row = conn.execute("SELECT * FROM gatepass WHERE id = ?", (row_id,)).fetchone()
        return jsonify(_row_to_dict(row))
    finally:
        conn.close()


@app.route("/api/gatepass/<int:row_id>", methods=["DELETE"])
def gatepass_delete(row_id):
    conn = get_connection()
    try:
        cur = conn.execute("DELETE FROM gatepass WHERE id = ?", (row_id,))
        conn.commit()
        if cur.rowcount == 0:
            abort(404)
        return "", 204
    finally:
        conn.close()


@app.route("/api/gatepass/<int:row_id>/pdf")
def gatepass_pdf(row_id):
    conn = get_connection()
    try:
        row = conn.execute("SELECT * FROM gatepass WHERE id = ?", (row_id,)).fetchone()
        if not row:
            abort(404)
        d = _row_to_dict(row)
        pdf = _pdf_gatepass_buffer(d)
        safe = str(d.get("gatepass_no") or row_id).replace("/", "-")
        return send_file(
            pdf,
            as_attachment=True,
            download_name=f"gatepass_{safe}.pdf",
            mimetype="application/pdf",
        )
    finally:
        conn.close()


@app.route("/api/gatepass/export")
def gatepass_export_excel():
    conn = get_connection()
    try:
        wb = Workbook()
        ws = wb.active
        ws.title = "Gatepass"
        _write_gatepass_data_sheet(ws, conn)
        bio = io.BytesIO()
        wb.save(bio)
        bio.seek(0)
        fname = f"gatepass_export_{datetime.now().date().isoformat()}.xlsx"
        return send_file(
            bio,
            as_attachment=True,
            download_name=fname,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    finally:
        conn.close()


with app.app_context():
    migrate()


if __name__ == "__main__":
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug, host="127.0.0.1", port=int(os.environ.get("PORT", "5000")))
