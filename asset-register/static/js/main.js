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
      "processor",
      "asset_owner",
      "dept",
      "location",
      "model",
      "service_tag",
      "warranty",
      "install_date",
      "os",
      "supt_vendor",
      "configuration",
      "contains_pii",
      "date_added_updated",
      "is_free",
    ],
    monitors: [
      "asset_type",
      "user",
      "model",
      "warranty",
      "install_date",
      "supt_vendor",
      "location",
      "dept",
      "asset_owner",
      "contains_pii",
      "date_added_updated",
      "is_free",
    ],
    networking: [
      "asset_type",
      "user",
      "model",
      "sn",
      "warranty",
      "supt_vendor",
      "location",
      "dept",
      "asset_owner",
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
      "is_free",
    ],
    ups: [
      "asset_type",
      "device_id",
      "model",
      "warranty",
      "install_date",
      "supt_vendor",
      "location",
      "dept",
      "asset_owner",
      "date_added_updated",
      "is_free",
    ],
    mobile_phones: [
      "asset_type",
      "model",
      "warranty",
      "supt_vendor",
      "location",
      "dept",
      "asset_owner",
      "contains_pii",
      "date_added_updated",
      "is_free",
    ],
    scanners_others: [
      "asset_type",
      "model",
      "sn",
      "warranty",
      "supt_vendor",
      "location",
      "dept",
      "asset_owner",
      "contains_pii",
      "date_added_updated",
      "is_free",
    ],
    admin: [
      "asset_type",
      "invoice_no",
      "warranty",
      "install_date",
      "supt_vendor",
      "location",
      "dept",
      "asset_owner",
      "contains_pii",
      "date_added_updated",
      "is_free",
    ],
  };

  const COLUMN_LABELS = {
    asset_type: "Asset Type",
    asset_manufacturer: "Manufacturer",
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
    contains_pii: "Contains PII",
    is_free: "Free?",
    asset: "Asset",
    asset_value: "Asset Value",
    asset_location: "Asset Location",
    asset_region: "Asset Region",
    sn: "S/N",
    configuration: "Configuration",
    device_id: "Device ID",
    invoice_no: "Invoice No",
    user: "User",
  };

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
    "gatepass_date",
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
  ];

  const GATEPASS_STATUS = ["Open", "Closed", "Cancelled"];

  const ASSET_STATUS_OPTIONS = ["Active", "Idle", "Offline", "Maintenance"];

  const metaByKey = Object.fromEntries(TABLE_META.map((m) => [m.key, m]));

  let currentTable = null;
  let editRowId = null;

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

  async function api(path, opts) {
    const res = await fetch(path, {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      ...opts,
    });
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

  function buildGatepassForm(row) {
    const isEdit = row && row.id;
    const today = new Date().toISOString().slice(0, 10);
    const r = row || {};
    const v = (k) => (r[k] == null ? "" : escapeHtml(String(r[k])));
    const d = (k) => toDateInputValue(r[k]);
    const tm = (k) => toTimeInputValue(r[k]);

    const roBlock = isEdit
      ? `<div class="field field-full field-readonly"><label>Gatepass No</label><input type="text" name="gatepass_no" readonly value="${v("gatepass_no")}"></div>`
      : `<div class="field field-full field-readonly"><label>Gatepass No</label><input type="text" readonly value="" placeholder="Auto-generated on save"></div>`;

    const stSel = String(r.status || "Open");
    const statusOpts = GATEPASS_STATUS.map(
      (s) =>
        `<option value="${escapeHtml(s)}" ${stSel === s ? "selected" : ""}>${escapeHtml(s)}</option>`
    ).join("");

    return (
      roBlock +
      `<div class="field"><label for="gp-date">Gatepass Date</label><input type="date" id="gp-date" name="gatepass_date" value="${isEdit ? d("gatepass_date") : today}"></div>
      <div class="field"><label for="gp-dept">Department</label><input type="text" id="gp-dept" name="department" value="${v("department")}"></div>
      <div class="field"><label for="gp-req">Requested By</label><input type="text" id="gp-req" name="requested_by" value="${v("requested_by")}"></div>
      <div class="field"><label for="gp-app">Approved By</label><input type="text" id="gp-app" name="approved_by" value="${v("approved_by")}"></div>
      <div class="field field-full"><label for="gp-purpose">Purpose</label><textarea id="gp-purpose" name="purpose">${r.purpose == null ? "" : escapeHtml(r.purpose)}</textarea></div>
      <div class="field field-full"><label for="gp-ad">Asset Description</label><textarea id="gp-ad" name="asset_description">${r.asset_description == null ? "" : escapeHtml(r.asset_description)}</textarea></div>
      <div class="field"><label for="gp-sn">Asset Serial No</label><input type="text" id="gp-sn" name="asset_serial_no" value="${v("asset_serial_no")}"></div>
      <div class="field"><label for="gp-qty">Quantity</label><input type="number" id="gp-qty" name="quantity" step="1" value="${r.quantity == null ? "" : escapeHtml(String(r.quantity))}"></div>
      <div class="field"><label for="gp-erd">Expected Return Date</label><input type="date" id="gp-erd" name="expected_return_date" value="${d("expected_return_date")}"></div>
      <div class="field"><label for="gp-ard">Actual Return Date</label><input type="date" id="gp-ard" name="actual_return_date" value="${d("actual_return_date")}"></div>
      <div class="field"><label for="gp-out">Gate Out Time</label><input type="time" id="gp-out" name="gate_out_time" value="${tm("gate_out_time")}"></div>
      <div class="field"><label for="gp-in">Gate In Time</label><input type="time" id="gp-in" name="gate_in_time" value="${tm("gate_in_time")}"></div>
      <div class="field"><label for="gp-guard">Security Guard</label><input type="text" id="gp-guard" name="security_guard" value="${v("security_guard")}"></div>
      <div class="field"><label for="gp-status">Status</label><select id="gp-status" name="status">${statusOpts}</select></div>
      <div class="field field-full"><label for="gp-rem">Remarks</label><textarea id="gp-rem" name="remarks">${r.remarks == null ? "" : escapeHtml(r.remarks)}</textarea></div>`
    );
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
    const payload = readGatepassPayload();
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
    $("#modal-overlay").hidden = false;
  }

  function openGatepassModalEdit(row) {
    gatepassModalMode = true;
    editGatepassId = row.id;
    $("#modal-title").textContent = "Edit Gatepass";
    const form = $("#modal-form");
    form.className = "modal-form gatepass-grid";
    form.innerHTML = buildGatepassForm(row);
    $("#modal-overlay").hidden = false;
  }

  async function loadGatepassRows() {
    const tbody = $("#gatepass-tbody");
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Loading…</td></tr>';
    try {
      const rows = await api("/api/gatepass");
      tbody.innerHTML = "";
      if (!rows.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No gatepass records yet.</td></tr>';
        return;
      }
      for (const row of rows) {
        const purposeShort =
          row.purpose && String(row.purpose).length > 40
            ? escapeHtml(String(row.purpose).slice(0, 40)) + "…"
            : escapeHtml(row.purpose || "");
        const ad = row.asset_description || "";
        const assetCell =
          ad.length > 35 ? escapeHtml(ad.slice(0, 35)) + "…" : escapeHtml(ad);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHtml(row.gatepass_no || "")}</td>
          <td>${escapeHtml(row.gatepass_date || "")}</td>
          <td>${escapeHtml(row.department || "")}</td>
          <td>${escapeHtml(row.requested_by || "")}</td>
          <td>${escapeHtml(row.approved_by || "")}</td>
          <td>${purposeShort}</td>
          <td>${assetCell}</td>
          <td>${escapeHtml(row.status || "")}</td>
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
      tbody.innerHTML = `<tr><td colspan="9" class="empty-state">${escapeHtml(e.message)}</td></tr>`;
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
      th.textContent = COLUMN_LABELS[c] || c;
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
    const f = $("#modal-form");
    f.innerHTML = "";
    f.className = "modal-form";
  }

  function fieldHtml(col, value) {
    const label = COLUMN_LABELS[col] || col;
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
    if (col === "asset_status" && currentTable === "laptops") {
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
