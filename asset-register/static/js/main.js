(function () {
  "use strict";

  const TABLE_COLUMNS = {
    laptops: [
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
    desktops: [
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
    monitors: [
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
    networking: [
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
    cloud_assets: [
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
    infodesk_applications: [
      "asset",
      "asset_type",
      "asset_value",
      "asset_owner",
      "asset_location",
      "contains_pii",
      "date_added_updated",
      "is_free",
    ],
    third_party_software: [
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
    ups: [
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
    mobile_phones: [
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
    scanners_others: [
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
    admin: [
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
  };

  const COLUMN_LABELS = {
    asset_type: "Asset Type",
    asset_manufacturer: "Asset Manufacturer",
    service_tag: "Service Tag",
    model: "Model",
    pn: "P/N",
    asset_owner: "Asset Owner",
    assigned_to: "Assigned To",
    asset_status: "Asset Status",
    last_owner: "Last Owner",
    dept: "Dept",
    location: "Location",
    asset_health: "Asset Health",
    warranty: "Warranty",
    install_date: "Install Date",
    date_added_updated: "Date Added/Updated",
    processor: "Processor",
    ram: "RAM",
    harddisk: "Hard Disk",
    os: "O/S",
    supt_vendor: "Supt Vendor",
    keyboard: "Keyboard",
    mouse: "Mouse",
    headphone: "Headphone",
    usb_extender: "USB Extender",
    contains_pii: "Contains PII (Yes/No)",
    is_free: "Free?",
    asset: "Asset",
    asset_value: "Asset Value",
    asset_location: "Asset Location",
    asset_region: "Asset Region",
    sn: "S/N",
    configuration: "Configuration",
    device_id: "Device Id",
    asset_id: "Asset Id",
    mac_id: "MAC ID",
    description: "Description",
    cve_alert_setup: "CVE alert Setup",
    billing_api: "Billing API",
    invoice_no: "Invoice No",
    user: "User",
  };

  const COLUMN_LABEL_OVERRIDES_BY_TABLE = {
    cloud_assets: {
      contains_pii: "Contains PII data?",
      date_added_updated: "Date Added/ Updated",
    },
    infodesk_applications: {
      contains_pii: "Contains PII data?",
      date_added_updated: "Date Added/ Updated",
    },
    third_party_software: {
      contains_pii: "Contains PII data?",
      date_added_updated: "Date Added/ Updated",
    },
  };

  function columnLabel(tableKey, col) {
    const o = COLUMN_LABEL_OVERRIDES_BY_TABLE[tableKey];
    if (o && o[col]) return o[col];
    return COLUMN_LABELS[col] || col;
  }

  const TABLE_META = [
    { key: "laptops", label: "Laptop", color: "#185FA5" },
    { key: "desktops", label: "Desktop", color: "#3B6D11" },
    { key: "monitors", label: "Monitor", color: "#854F0B" },
    { key: "networking", label: "Networking", color: "#0F6E56" },
    { key: "cloud_assets", label: "Cloud assets", color: "#3C3489" },
    { key: "infodesk_applications", label: "Infodesk applications", color: "#72243E" },
    { key: "third_party_software", label: "Third party software", color: "#0C447C" },
    { key: "ups", label: "UPS", color: "#712B13" },
    { key: "mobile_phones", label: "Mobile phones", color: "#085041" },
    { key: "scanners_others", label: "Scanners & others", color: "#A32D2D" },
    { key: "admin", label: "Admin", color: "#444441" },
    { key: "gatepass", label: "Gatepass", color: "#534AB7" },
  ];

  const GATEPASS_FORM_KEYS = [
    "pass_type",
    "gatepass_date",
    "issued_to",
    "person",
    "department_head",
    "security_incharge",
    "receiver_name",
  ];

  const ASSET_STATUS_OPTIONS = ["Active", "Idle", "Offline", "Maintenance"];

  const metaByKey = Object.fromEntries(TABLE_META.map((m) => [m.key, m]));

  let currentTable = null;
  let editRowId = null;
  let gatepassModalMode = false;
  let editGatepassId = null;

  const $ = (sel) => document.querySelector(sel);

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toDateInputValue(v) {
    if (v == null || v === "") return "";
    const s = String(v);
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    return s;
  }

  function toTimeInputValue(v) {
    if (v == null || v === "") return "";
    const s = String(v);
    const m = s.match(/^(\d{1,2}:\d{2})/);
    if (m) return m[1].length === 4 ? "0" + m[1] : m[1].slice(0, 5);
    return s.slice(0, 5);
  }

  function badgeIsFree(val) {
    const yes = val === 1 || val === true || val === "1";
    return yes
      ? '<span class="badge badge-yes-free">Yes</span>'
      : '<span class="badge badge-no-free">No</span>';
  }

  function badgePii(val) {
    const s = String(val == null ? "" : val).toLowerCase();
    const yes = s === "yes" || s === "y" || s === "1" || s === "true";
    return yes
      ? '<span class="badge badge-pii-yes">Yes</span>'
      : '<span class="badge badge-pii-no">No</span>';
  }

  function renderCell(col, val) {
    if (col === "is_free") return badgeIsFree(val);
    if (col === "contains_pii") return badgePii(val);
    return escapeHtml(val);
  }

  async function api(path, opts = {}) {
    const { headers: hdrIn, ...rest } = opts;
    const isForm = rest.body instanceof FormData;
    const headers = {
      Accept: "application/json",
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(hdrIn || {}),
    };
    const res = await fetch(path, { ...rest, headers });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (res.status === 401) {
      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname);
      throw new Error("Unauthorized");
    }
    if (!res.ok) {
      const msg = (data && data.error) || res.statusText || "Request failed";
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
    return data;
  }

  function exportAll() {
    const btn = document.getElementById("exportAllBtn");
    if (!btn) return;
    btn.textContent = "Exporting...";
    btn.disabled = true;
    window.location.href = "/api/export/all";
    setTimeout(() => {
      btn.textContent = "Export All Tables";
      btn.disabled = false;
    }, 3000);
  }

  function showHome() {
    closeModal();
    currentTable = null;
    $("#view-home").hidden = false;
    $("#view-register").hidden = true;
    $("#view-gatepass").hidden = true;
    $("#page-title").textContent = "Asset Register — Select a Table";
    $("#header-sub").hidden = true;
    document.title = "Asset Register — Select a Table";
    loadHome();
  }

  async function loadHome() {
    const list = $("#table-list");
    list.innerHTML = '<li class="empty-state">Loading…</li>';
    try {
      const counts = await api("/api/tables");
      const countMap = Object.fromEntries(counts.map((c) => [c.name, c.row_count]));
      list.innerHTML = "";
      for (const m of TABLE_META) {
        const n = countMap[m.key] ?? 0;
        const li = document.createElement("li");
        li.innerHTML = `
          <button type="button" data-table="${escapeHtml(m.key)}">
            <span class="dot" style="background:${escapeHtml(m.color)}"></span>
            <span class="name">${escapeHtml(m.label)}</span>
            <span class="count">${n} rows</span>
            <span class="chev" aria-hidden="true">›</span>
          </button>`;
        list.appendChild(li);
      }
      list.querySelectorAll("button[data-table]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const k = btn.getAttribute("data-table");
          if (k === "gatepass") openGatepassView();
          else openRegister(k);
        });
      });
    } catch (e) {
      list.innerHTML = `<li class="empty-state">${escapeHtml(e.message)}</li>`;
    }
  }

  function downloadGatepassPDF(id) {
    window.location.href = `/api/gatepass/${id}/pdf`;
  }

  function printGatepass(id) {
    window.open(`/api/gatepass/${id}/pdf`, "_blank");
  }

  function parseGatepassItems(raw) {
    if (raw == null || raw === "") return [];
    if (Array.isArray(raw)) return raw;
    try {
      const j = JSON.parse(String(raw));
      return Array.isArray(j) ? j : [];
    } catch {
      return [];
    }
  }

  function renumberGatepassItemRows() {
    const tbody = document.getElementById("itemsBody");
    if (!tbody) return;
    tbody.querySelectorAll("tr").forEach((tr, i) => {
      const c0 = tr.cells[0];
      if (c0) c0.textContent = String(i + 1);
    });
  }

  function gatepassItemRowHtml(desc, unit, qty, remarks) {
    const d = desc == null ? "" : escapeHtml(String(desc));
    const u = unit == null ? "" : escapeHtml(String(unit));
    const q = qty == null ? "" : escapeHtml(String(qty));
    const rmk = remarks == null ? "" : escapeHtml(String(remarks));
    return `<tr>
      <td style="text-align:center;padding:6px;">0</td>
      <td><input type="text" class="gp-item-desc" style="width:100%;border:none;outline:none;font-size:13px;" value="${d}"></td>
      <td><input type="text" class="gp-item-unit" style="width:100%;border:none;outline:none;font-size:13px;" value="${u}"></td>
      <td><input type="text" class="gp-item-qty" style="width:100%;border:none;outline:none;font-size:13px;" value="${q}"></td>
      <td><input type="text" class="gp-item-remarks" style="width:100%;border:none;outline:none;font-size:13px;" value="${rmk}"></td>
      <td style="text-align:center;"><button type="button" class="gp-item-remove" aria-label="Remove row">×</button></td>
    </tr>`;
  }

  function addGatepassItemRow(data) {
    const tbody = document.getElementById("itemsBody");
    if (!tbody) return;
    const wrap = document.createElement("tbody");
    wrap.innerHTML = gatepassItemRowHtml(
      data && data.description,
      data && data.unit,
      data && data.qty,
      data && data.remarks
    );
    tbody.appendChild(wrap.firstElementChild);
    renumberGatepassItemRows();
  }

  function collectGatepassItems() {
    const tbody = document.getElementById("itemsBody");
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll("tr"))
      .map((row) => ({
        description: (row.querySelector(".gp-item-desc") && row.querySelector(".gp-item-desc").value) || "",
        unit: (row.querySelector(".gp-item-unit") && row.querySelector(".gp-item-unit").value) || "",
        qty: (row.querySelector(".gp-item-qty") && row.querySelector(".gp-item-qty").value) || "",
        remarks: (row.querySelector(".gp-item-remarks") && row.querySelector(".gp-item-remarks").value) || "",
      }))
      .filter((item) => String(item.description).trim() !== "");
  }

  function wireGatepassItemsUi() {
    const addBtn = document.getElementById("btnAddItemRow");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        addGatepassItemRow(null);
      });
    }
    const tbody = document.getElementById("itemsBody");
    if (tbody) {
      tbody.addEventListener("click", (ev) => {
        const t = ev.target;
        if (!t || !t.classList || !t.classList.contains("gp-item-remove")) return;
        ev.preventDefault();
        const rows = tbody.querySelectorAll("tr");
        if (rows.length <= 1) return;
        const tr = t.closest("tr");
        if (tr) tr.remove();
        renumberGatepassItemRows();
      });
    }
  }

  function buildGatepassForm(row) {
    const isEdit = row && row.id;
    const today = new Date().toISOString().slice(0, 10);
    const r = row || {};
    const v = (k) => (r[k] == null ? "" : escapeHtml(String(r[k])));
    const d = (k) => toDateInputValue(r[k]);

    const roBlock = isEdit
      ? `<div class="field field-full field-readonly"><label>Gatepass No</label><input type="text" name="gatepass_no" readonly value="${v("gatepass_no")}"></div>`
      : `<div class="field field-full field-readonly"><label>Gatepass No</label><input type="text" readonly value="" placeholder="Auto-generated on save (GP-442, GP-443, …)"></div>`;

    const passType = String(r.pass_type || "Returnable / Outward");
    const passSel = (val, label) =>
      `<option value="${escapeHtml(val)}" ${passType === val ? "selected" : ""}>${escapeHtml(label)}</option>`;

    const items = parseGatepassItems(r.asset_items);
    const nRows = isEdit ? Math.max(3, items.length) : 3;
    let itemsBody = "";
    for (let i = 0; i < nRows; i++) {
      const it = items[i] || {};
      itemsBody += gatepassItemRowHtml(it.description, it.unit, it.qty, it.remarks);
    }

    const html =
      roBlock +
      `<div class="field">
        <label for="gp-pass-type">Pass type</label>
        <select id="gp-pass-type" name="pass_type">${passSel("Returnable / Outward", "Returnable")}${passSel(
          "Outward",
          "Outward"
        )}</select>
      </div>
      <div class="field"><label for="gp-date">Date</label><input type="date" id="gp-date" name="gatepass_date" value="${
        isEdit ? d("gatepass_date") : today
      }"></div>
      <div class="field field-full"><label for="gp-issued">Issued to</label><input type="text" id="gp-issued" name="issued_to" value="${v(
        "issued_to"
      )}" placeholder="Person receiving the pass"></div>
      <div class="field field-full"><label for="gp-person">Person</label><input type="text" id="gp-person" name="person" value="${v(
        "person"
      )}" placeholder="Person accompanying"></div>
      <div class="gatepass-items-wrap field-full">
        <label>Items</label>
        <table class="gatepass-items-table">
          <thead><tr><th>Sr.No</th><th>Description</th><th>Unit</th><th>Qty</th><th>Remarks</th><th></th></tr></thead>
          <tbody id="itemsBody">${itemsBody}</tbody>
        </table>
        <div class="gp-add-item-row"><button type="button" class="btn-gp-add-row" id="btnAddItemRow">+ Add Row</button></div>
      </div>
      <div class="field"><label for="gp-dept-head">Department Head</label><input type="text" id="gp-dept-head" name="department_head" value="${v(
        "department_head"
      )}"></div>
      <div class="field"><label for="gp-sec">Security Incharge</label><input type="text" id="gp-sec" name="security_incharge" value="${v(
        "security_incharge"
      )}"></div>
      <div class="field field-full"><label for="gp-recv">Receiver Name</label><input type="text" id="gp-recv" name="receiver_name" value="${v(
        "receiver_name"
      )}"></div>`;
    return html;
  }

  function readGatepassPayload() {
    const form = $("#modal-form");
    const data = {};
    for (const k of GATEPASS_FORM_KEYS) {
      const el = form.elements.namedItem(k);
      if (!el) continue;
      let val = el.value;
      if (val === "") val = "";
      data[k] = val;
    }
    return data;
  }

  async function submitGatepassForm() {
    const payload = { ...readGatepassPayload(), asset_items: collectGatepassItems() };
    try {
      if (editGatepassId == null) {
        await api("/api/gatepass", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await api(`/api/gatepass/${editGatepassId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      await loadGatepassRows();
      loadHome();
    } catch (e) {
      alert(e.message);
    }
  }

  function openGatepassModalAdd() {
    gatepassModalMode = true;
    editGatepassId = null;
    $("#modal-title").textContent = "New Gatepass";
    const form = $("#modal-form");
    form.className = "modal-form gatepass-grid";
    form.innerHTML = buildGatepassForm(null);
    renumberGatepassItemRows();
    wireGatepassItemsUi();
    const panel = document.getElementById("modal-panel");
    if (panel) panel.classList.add("modal-wide");
    $("#modal-overlay").hidden = false;
  }

  function openGatepassModalEdit(row) {
    gatepassModalMode = true;
    editGatepassId = row.id;
    $("#modal-title").textContent = "Edit Gatepass";
    const form = $("#modal-form");
    form.className = "modal-form gatepass-grid";
    form.innerHTML = buildGatepassForm(row);
    renumberGatepassItemRows();
    wireGatepassItemsUi();
    const panel = document.getElementById("modal-panel");
    if (panel) panel.classList.add("modal-wide");
    $("#modal-overlay").hidden = false;
  }

  async function loadGatepassRows() {
    const tbody = $("#gatepass-tbody");
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Loading…</td></tr>';
    try {
      const rows = await api("/api/gatepass");
      tbody.innerHTML = "";
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No gatepass records yet.</td></tr>';
        return;
      }
      for (const row of rows) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(row.gatepass_no || "")}</td>
          <td>${escapeHtml(row.gatepass_date || "")}</td>
          <td>${escapeHtml(row.pass_type || "")}</td>
          <td>${escapeHtml(row.issued_to || "")}</td>
          <td>${escapeHtml(row.person || "")}</td>
          <td class="actions-cell">
            <button type="button" class="btn btn-sm btn-edit-primary gp-edit" data-id="${row.id}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm gp-del" data-id="${row.id}">Delete</button>
            <button type="button" class="btn btn-sm btn-pdf gp-pdf" data-id="${row.id}">PDF</button>
            <button type="button" class="btn btn-sm btn-print gp-print" data-id="${row.id}">Print</button>
          </td>`;
        tbody.appendChild(tr);
      }
      tbody.querySelectorAll(".gp-edit").forEach((b) => {
        b.addEventListener("click", () => {
          const id = Number(b.getAttribute("data-id"));
          const row = rows.find((x) => x.id === id);
          if (row) openGatepassModalEdit(row);
        });
      });
      tbody.querySelectorAll(".gp-del").forEach((b) => {
        b.addEventListener("click", () => deleteGatepass(Number(b.getAttribute("data-id"))));
      });
      tbody.querySelectorAll(".gp-pdf").forEach((b) => {
        b.addEventListener("click", () => downloadGatepassPDF(Number(b.getAttribute("data-id"))));
      });
      tbody.querySelectorAll(".gp-print").forEach((b) => {
        b.addEventListener("click", () => printGatepass(Number(b.getAttribute("data-id"))));
      });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(e.message)}</td></tr>`;
    }
  }

  async function deleteGatepass(id) {
    if (!confirm("Delete this gatepass?")) return;
    try {
      await api(`/api/gatepass/${id}`, { method: "DELETE" });
      await loadGatepassRows();
      loadHome();
    } catch (e) {
      alert(e.message);
    }
  }

  async function openGatepassView() {
    closeModal();
    currentTable = null;
    $("#view-home").hidden = true;
    $("#view-register").hidden = true;
    $("#view-gatepass").hidden = false;
    $("#page-title").textContent = "Gatepass";
    $("#header-sub").hidden = false;
    $("#header-sub").textContent = "Tables › Gatepass";
    document.title = "Tables › Gatepass";
    await loadGatepassRows();
  }

  async function openRegister(tableKey) {
    currentTable = tableKey;
    const meta = metaByKey[tableKey];
    $("#view-home").hidden = true;
    $("#view-gatepass").hidden = true;
    $("#view-register").hidden = false;
    $("#page-title").textContent = meta ? meta.label : tableKey;
    $("#header-sub").hidden = false;
    $("#header-sub").textContent = "Tables › " + (meta ? meta.label : tableKey);
    document.title = "Tables › " + (meta ? meta.label : tableKey);
    $("#register-breadcrumb").textContent = meta ? `${meta.label} register` : tableKey;
    await loadRows();
  }

  async function loadRows() {
    const thead = $("#data-thead");
    const tbody = $("#data-tbody");
    const cols = TABLE_COLUMNS[currentTable];
    if (!cols) return;

    thead.innerHTML = "";
    tbody.innerHTML = '<tr><td colspan="99" class="empty-state">Loading…</td></tr>';

    const trh = document.createElement("tr");
    for (const c of cols) {
      const th = document.createElement("th");
      th.textContent = columnLabel(currentTable, c);
      trh.appendChild(th);
    }
    const thAct = document.createElement("th");
    thAct.textContent = "Actions";
    trh.appendChild(thAct);
    thead.appendChild(trh);

    try {
      const rows = await api(`/api/tables/${encodeURIComponent(currentTable)}/rows`);
      tbody.innerHTML = "";
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="99" class="empty-state">No rows yet. Add one with “Add row”.</td></tr>';
        return;
      }
      for (const row of rows) {
        const tr = document.createElement("tr");
        tr.dataset.rowId = String(row.id);
        for (const c of cols) {
          const td = document.createElement("td");
          td.innerHTML = renderCell(c, row[c]);
          tr.appendChild(td);
        }
        const tdAct = document.createElement("td");
        tdAct.className = "actions-cell";
        tdAct.innerHTML = `
          <button type="button" class="btn btn-ghost btn-sm btn-edit" data-id="${row.id}">Edit</button>
          <button type="button" class="btn btn-danger btn-sm btn-delete" data-id="${row.id}">Delete</button>`;
        tr.appendChild(tdAct);
        tbody.appendChild(tr);
      }
      tbody.querySelectorAll(".btn-edit").forEach((b) => {
        b.addEventListener("click", () => {
          const id = Number(b.getAttribute("data-id"));
          const row = rows.find((r) => r.id === id);
          if (row) openModalEdit(row);
        });
      });
      tbody.querySelectorAll(".btn-delete").forEach((b) => {
        b.addEventListener("click", () => deleteRow(Number(b.getAttribute("data-id"))));
      });
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="99" class="empty-state">${escapeHtml(e.message)}</td></tr>`;
    }
  }

  async function deleteRow(id) {
    if (!confirm("Delete this row?")) return;
    try {
      await api(`/api/tables/${encodeURIComponent(currentTable)}/rows/${id}`, { method: "DELETE" });
      await loadRows();
      loadHome();
    } catch (e) {
      alert(e.message);
    }
  }

  function closeModal() {
    $("#modal-overlay").hidden = true;
    editRowId = null;
    gatepassModalMode = false;
    editGatepassId = null;
    const panel = document.getElementById("modal-panel");
    if (panel) panel.classList.remove("modal-wide");
    const f = $("#modal-form");
    f.innerHTML = "";
    f.className = "modal-form";
  }

  function fieldHtml(col, value) {
    const label = columnLabel(currentTable, col);
    const id = `field-${col}`;
    if (col === "contains_pii" || col === "is_free") {
      const y = col === "contains_pii"
        ? String(value || "").toLowerCase() === "yes" || value === 1 || value === "1"
        : value === 1 || value === true || value === "1";
      const yesSel = y ? "selected" : "";
      const noSel = y ? "" : "selected";
      return `<div class="field"><label for="${id}">${escapeHtml(label)}</label>
        <select id="${id}" name="${escapeHtml(col)}">
          <option value="Yes" ${yesSel ? "selected" : ""}>Yes</option>
          <option value="No" ${noSel ? "selected" : ""}>No</option>
        </select></div>`;
    }
    if (
      col === "asset_status" &&
      (currentTable === "laptops" ||
        currentTable === "desktops" ||
        currentTable === "monitors")
    ) {
      const opts = ASSET_STATUS_OPTIONS.map(
        (o) =>
          `<option value="${escapeHtml(o)}" ${String(value) === o ? "selected" : ""}>${escapeHtml(
            o
          )}</option>`
      ).join("");
      return `<div class="field"><label for="${id}">${escapeHtml(label)}</label>
        <select id="${id}" name="${escapeHtml(col)}">${opts}</select></div>`;
    }
    if (col === "install_date" || col === "date_added_updated") {
      const v = toDateInputValue(value);
      return `<div class="field"><label for="${id}">${escapeHtml(label)}</label>
        <input type="date" id="${id}" name="${escapeHtml(col)}" value="${escapeHtml(v)}"></div>`;
    }
    const v = value == null ? "" : escapeHtml(value);
    return `<div class="field"><label for="${id}">${escapeHtml(label)}</label>
      <input type="text" id="${id}" name="${escapeHtml(col)}" value="${v}"></div>`;
  }

  function openModalAdd() {
    if (!currentTable || !TABLE_COLUMNS[currentTable]) {
      alert("Open a table from the list first (e.g. Laptop), then use Add row.");
      return;
    }
    gatepassModalMode = false;
    editGatepassId = null;
    editRowId = null;
    $("#modal-title").textContent = "Add row";
    const cols = TABLE_COLUMNS[currentTable];
    const form = $("#modal-form");
    form.className = "modal-form";
    try {
      form.innerHTML = cols.map((c) => fieldHtml(c, "")).join("");
    } catch (e) {
      console.error(e);
      alert("Could not build the form. Check the console.");
      return;
    }
    $("#modal-overlay").hidden = false;
  }

  function openModalEdit(row) {
    if (!currentTable || !TABLE_COLUMNS[currentTable]) {
      alert("Table context is missing. Go back and open a table again.");
      return;
    }
    gatepassModalMode = false;
    editGatepassId = null;
    editRowId = row.id;
    $("#modal-title").textContent = "Edit row";
    const cols = TABLE_COLUMNS[currentTable];
    $("#modal-form").className = "modal-form";
    try {
      $("#modal-form").innerHTML = cols.map((c) => fieldHtml(c, row[c])).join("");
    } catch (e) {
      console.error(e);
      alert("Could not build the form. Check the console.");
      return;
    }
    $("#modal-overlay").hidden = false;
  }

  function readFormPayload() {
    const cols = TABLE_COLUMNS[currentTable];
    const form = $("#modal-form");
    const data = {};
    for (const c of cols) {
      const el = form.elements.namedItem(c);
      if (!el) continue;
      let v = el.value;
      if (c === "is_free") {
        const yn = String(v).toLowerCase();
        data[c] = yn === "yes" || yn === "y" ? 1 : 0;
      } else if (c === "contains_pii") {
        data[c] = v;
      } else {
        data[c] = v === "" ? "" : v;
      }
    }
    return data;
  }

  $("#btn-back").addEventListener("click", showHome);
  $("#btn-add").addEventListener("click", () => openModalAdd());
  const importFileInput = document.getElementById("import-excel-file");
  document.getElementById("btn-import-excel")?.addEventListener("click", () => importFileInput?.click());
  importFileInput?.addEventListener("change", async () => {
    const file = importFileInput.files && importFileInput.files[0];
    importFileInput.value = "";
    if (!file || !currentTable) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const data = await api(`/api/tables/${encodeURIComponent(currentTable)}/import`, {
        method: "POST",
        body: fd,
      });
      let msg = `Imported ${data.imported} row(s).`;
      if (data.skipped_empty) msg += ` Skipped ${data.skipped_empty} empty row(s).`;
      if (data.sheet_used) msg += `\nSheet used: ${data.sheet_used}`;
      if (data.errors && data.errors.length) {
        const sample = data.errors
          .slice(0, 10)
          .map((e) => `Row ${e.row}: ${e.error}`)
          .join("\n");
        msg += `\n\nErrors (${data.errors.length}):\n${sample}`;
        if (data.errors.length > 10) msg += `\n… and ${data.errors.length - 10} more`;
      }
      await loadRows();
      await loadHome();
      alert(msg);
    } catch (e) {
      alert(e.message);
    }
  });
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-cancel").addEventListener("click", closeModal);

  $("#modal-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (gatepassModalMode) {
      await submitGatepassForm();
      return;
    }
    if (!currentTable || !TABLE_COLUMNS[currentTable]) {
      alert("No table is selected. Close this dialog and open a table from the home list.");
      return;
    }
    const payload = readFormPayload();
    try {
      if (editRowId == null) {
        await api(`/api/tables/${encodeURIComponent(currentTable)}/rows`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      } else {
        await api(`/api/tables/${encodeURIComponent(currentTable)}/rows/${editRowId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      }
      closeModal();
      await loadRows();
      loadHome();
    } catch (e) {
      alert(e.message);
    }
  });

  const exportBtn = document.getElementById("exportAllBtn");
  if (exportBtn) exportBtn.addEventListener("click", exportAll);

  document.getElementById("btn-gatepass-back").addEventListener("click", showHome);
  document.getElementById("btn-gatepass-add").addEventListener("click", openGatepassModalAdd);
  document.getElementById("btn-gatepass-export").addEventListener("click", () => {
    window.location.href = "/api/gatepass/export";
  });

  showHome();
})();
