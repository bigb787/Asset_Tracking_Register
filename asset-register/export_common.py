"""Shared labels for Excel export (aligned with frontend COLUMN_LABELS)."""

import re

from database import TABLE_COLUMNS, TABLE_ORDER


def _normalize_import_header(s) -> str:
    return re.sub(r"\s+", " ", str(s).strip().lower())


def column_for_excel_import_header(
    header_cell, columns: list[str], header_labels: list[str]
) -> str | None:
    """Map an Excel header cell to a column name using the same labels as export."""
    if header_cell is None:
        return None
    h = _normalize_import_header(header_cell)
    if not h:
        return None
    for col, lab in zip(columns, header_labels):
        if _normalize_import_header(lab) == h:
            return col
    for col in columns:
        if _normalize_import_header(col) == h:
            return col
    return None

COLUMN_LABELS = {
    "asset_type": "Asset Type",
    "asset_manufacturer": "Asset Manufacturer",
    "service_tag": "Service Tag",
    "model": "Model",
    "pn": "P/N",
    "asset_owner": "Asset Owner",
    "assigned_to": "Assigned To",
    "asset_status": "Asset Status",
    "last_owner": "Last Owner",
    "dept": "Dept",
    "location": "Location",
    "asset_health": "Asset Health",
    "warranty": "Warranty",
    "install_date": "Install Date",
    "date_added_updated": "Date Added/Updated",
    "processor": "Processor",
    "ram": "RAM",
    "harddisk": "Hard Disk",
    "os": "O/S",
    "supt_vendor": "Supt Vendor",
    "keyboard": "Keyboard",
    "mouse": "Mouse",
    "headphone": "Headphone",
    "usb_extender": "USB Extender",
    "contains_pii": "Contains PII (Yes/No)",
    "is_free": "Free?",
    "asset": "Asset",
    "asset_value": "Asset Value",
    "asset_location": "Asset Location",
    "asset_region": "Asset Region",
    "sn": "S/N",
    "configuration": "Configuration",
    "device_id": "Device Id",
    "asset_id": "Asset Id",
    "mac_id": "MAC ID",
    "description": "Description",
    "cve_alert_setup": "CVE alert Setup",
    "billing_api": "Billing API",
    "invoice_no": "Invoice No",
    "user": "User",
    "id": "ID",
    "created_at": "Created At",
}


# Per-table header text where it differs from COLUMN_LABELS (e.g. cloud PII wording).
COLUMN_LABEL_OVERRIDES_BY_TABLE = {
    "cloud_assets": {
        "contains_pii": "Contains PII data?",
        "date_added_updated": "Date Added/ Updated",
    },
    "infodesk_applications": {
        "contains_pii": "Contains PII data?",
        "date_added_updated": "Date Added/ Updated",
    },
    "third_party_software": {
        "contains_pii": "Contains PII data?",
        "date_added_updated": "Date Added/ Updated",
    },
}

# DB key → exact Excel sheet name (11 asset tables + gatepass last in export_all)
EXPORT_SHEET_TITLES = {
    "laptops": "Laptop",
    "desktops": "Desktop",
    "monitors": "Monitor",
    "networking": "Networking",
    "cloud_assets": "Cloud Assets",
    "infodesk_applications": "Infodesk Applications",
    "third_party_software": "Third Party Software",
    "ups": "UPS",
    "mobile_phones": "Mobile Phones",
    "scanners_others": "Scanners & Others",
    "admin": "Admin",
    "gatepass": "Gatepass",
}

GATEPASS_COLUMN_ORDER = [
    "id",
    "gatepass_no",
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
    "created_at",
    "updated_at",
]

GATEPASS_LABELS = {
    "id": "ID",
    "gatepass_no": "Gatepass No",
    "gatepass_date": "Gatepass Date",
    "pass_type": "Pass Type",
    "issued_to": "Issued To",
    "person": "Person (accompanying)",
    "department_head": "Department Head",
    "security_incharge": "Security Incharge",
    "receiver_name": "Receiver Name",
    "asset_items": "Asset Items (JSON)",
    "department": "Department",
    "requested_by": "Requested By",
    "approved_by": "Approved By",
    "purpose": "Purpose",
    "asset_description": "Asset Description",
    "asset_serial_no": "Asset Serial No",
    "quantity": "Quantity",
    "expected_return_date": "Expected Return Date",
    "actual_return_date": "Actual Return Date",
    "gate_out_time": "Gate Out Time",
    "gate_in_time": "Gate In Time",
    "security_guard": "Security Guard",
    "remarks": "Remarks",
    "status": "Status",
    "created_at": "Created At",
    "updated_at": "Updated At",
}

# Summary tab display names (same as sheet titles)
def summary_table_specs():
    """(summary_name, db_key) for 11 asset tables + gatepass."""
    rows = [(EXPORT_SHEET_TITLES[k], k) for k in TABLE_ORDER]
    rows.append((EXPORT_SHEET_TITLES["gatepass"], "gatepass"))
    return rows


def header_labels_for_asset_table(db_key: str):
    cols = TABLE_COLUMNS[db_key]
    ovr = COLUMN_LABEL_OVERRIDES_BY_TABLE.get(db_key, {})
    return [ovr.get(c, COLUMN_LABELS.get(c, c)) for c in cols]


def excel_value(col: str, val):
    if val is None:
        return ""
    if col == "is_free":
        return "Yes" if val in (1, True, "1") else "No"
    return val
