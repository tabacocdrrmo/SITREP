let savedRows = [];
let filteredRows = [];
let currentPage = 1;
let currentSitrepNo = "";
let currentReportName = "";
const PAGE_SIZE = 10;
let sortOrder = "desc";

// "Assigned Team" may hold one team or several (e.g. "Alpha, Charlie") for
// multi-team responses. These helpers treat the string as a team list.
function teamNames(v) {
    return String(v || "").split(/[;,]/).map(s => s.trim()).filter(Boolean);
}

function teamMatches(v, team) {
    return teamNames(v).includes(team);
}

// Saved sitreps are cached for the tab session so the list survives a page
// reload, while fresh data is fetched in the background and replaces the copy.
// sessionStorage is deliberate: it is dropped when the tab/browser closes, so
// the records do not linger on a shared machine.
const CACHE_KEY = "sitrep-view-cache-v1";

function readRowCache() {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw);
        return data && Array.isArray(data.rows) ? data.rows : null;
    } catch (err) {
        return null;
    }
}

function writeRowCache(rows) {
    try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), rows: rows || [] }));
    } catch (err) {
        /* storage full or blocked - the cache is only a convenience */
    }
}

function clearRowCache() {
    try { sessionStorage.removeItem(CACHE_KEY); } catch (err) { /* ignore */ }
}

function viewSitreps() {
    const list = document.getElementById("savedList");
    const cached = readRowCache();
    if (cached) {
        renderSavedList(cached);
    } else {
        list.innerHTML = "Loading...";
    }

    invokeSitrepData("sitreps")
        .then(res => {
            if (!res || res.ok !== true) throw new Error((res && res.error) || "Failed to load");
            writeRowCache(res.rows);
            renderSavedList(res.rows);
        })
        .catch(err => {
            const msg = err && err.message ? err.message : String(err);
            const note = document.createElement("p");
            note.className = "load-warning";
            note.textContent = cached
                ? "Could not refresh (" + msg + ") - showing the last saved copy."
                : "Failed to load saved sitreps: " + msg;
            list.innerHTML = "";
            list.appendChild(note);
            if (cached) renderSavedList(cached);
        });
}

function renderSavedList(rows) {
    savedRows = rows || [];
    sortSitreps();
    const box = document.getElementById("savedList");
    if (!savedRows.length) {
        box.innerHTML = "<p>No saved sitreps found yet.</p>";
        return;
    }
    fillOptions("filterNature", uniqueSorted(savedRows.map(r => r["Nature of Incident"])));
    fillOptions("filterTeam", uniqueSorted(savedRows.flatMap(r => teamNames(r["Assigned Team"]))));
    applyFilters();
}

function fillOptions(id, values) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">All</option>' +
        values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join("");
}

function uniqueSorted(arr) {
    return [...new Set(arr.map(String).filter(Boolean).sort())];
}

// Sorts savedRows by SITREP #. The current order is newest-first by default.
function sitrepSortValue(r) {
    const m = /^(\d{4})-(\d+)$/.exec(String(r["SITREP #"] || ""));
    return m ? Number(m[1]) * 100000 + Number(m[2]) : 0;
}

function sortSitreps() {
    savedRows.sort((a, b) => {
        const av = sitrepSortValue(a);
        const bv = sitrepSortValue(b);
        return sortOrder === "desc" ? bv - av : av - bv;
    });
}

function toggleSort() {
    sortOrder = sortOrder === "desc" ? "asc" : "desc";
    sortSitreps();
    updateSortBtn();
    applyFilters();
}

function updateSortBtn() {
    const btn = document.getElementById("sortBtn");
    if (btn) btn.textContent = sortOrder === "desc" ? "Sort: Newest" : "Sort: Oldest";
}

function applyFilters() {
    const q = (document.getElementById("filterSearch").value || "").trim().toLowerCase();
    const nature = document.getElementById("filterNature").value;
    const team = document.getElementById("filterTeam").value;
    const from = document.getElementById("filterDateFrom").value;
    const to = document.getElementById("filterDateTo").value;

    const rows = savedRows.filter(r => {
        if (nature && r["Nature of Incident"] !== nature) return false;
        if (team && !teamMatches(r["Assigned Team"], team)) return false;
        const cd = normDate(r["Call Date"]);
        if (from && cd < from) return false;
        if (to && cd > to) return false;
        if (q) {
            const hay = [r["SITREP #"], r["Nature of Incident"], r["Cause of Incident"], r["Assigned Team"],
                r["Barangay"], r["Place / Landmark"], r["Municipality"], r["Patient"], r["Drivers"], r["Responders"],
                r["PCR By"]]
                .join(" ").toLowerCase();
            if (hay.indexOf(q) === -1) return false;
        }
        return true;
    });
    filteredRows = rows;
    currentPage = 1;
    renderPage();
}

function normDate(v) {
    if (v instanceof Date) {
        const p = n => String(n).padStart(2, "0");
        return v.getFullYear() + "-" + p(v.getMonth() + 1) + "-" + p(v.getDate());
    }
    return String(v || "").slice(0, 10);
}

function renderPage() {
    const box = document.getElementById("savedList");
    if (!filteredRows.length) {
        box.innerHTML = "<p>No sitreps match the filters.</p>";
        return;
    }
    const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = filteredRows.slice(start, start + PAGE_SIZE);

    box.innerHTML = `
        <table class="report-table">
            <tr>
                <th>SITREP #</th><th>Recorded At</th><th>Call Date</th>
                <th>Nature of Incident</th><th>Assigned Team</th>
                <th>Place / Landmark</th><th>Municipality</th><th>View</th>
            </tr>
            ${pageRows.map(r => {
                const i = savedRows.indexOf(r);
                return `
                <tr>
                    <td data-label="SITREP #">${esc(r["SITREP #"])}</td>
                    <td data-label="Recorded At">${esc(formatDate(r["Recorded At"]))}</td>
                    <td data-label="Call Date">${esc(fmt(r["Call Date"]))}</td>
                    <td data-label="Nature">${esc(r["Nature of Incident"])}</td>
                    <td data-label="Assigned Team">${esc(r["Assigned Team"])}</td>
                    <td data-label="Place / Landmark">${esc(r["Barangay"] || r["Place / Landmark"] || "")}</td>
                    <td data-label="Municipality">${esc(r["Municipality"])}</td>
                    <td data-label=""><button type="button" onclick="showSavedReport(${i})">View</button></td>
                </tr>`;
            }).join("")}
        </table>
        <div class="pagination">
            <button type="button" onclick="changePage(-1)" ${currentPage <= 1 ? "disabled" : ""}>Prev</button>
            <span>Page ${currentPage} of ${totalPages} (${filteredRows.length} records)</span>
            <button type="button" onclick="changePage(1)" ${currentPage >= totalPages ? "disabled" : ""}>Next</button>
        </div>`;
}

function changePage(delta) {
    currentPage += delta;
    renderPage();
}

function clearFilters() {
    ["filterSearch", "filterNature", "filterTeam", "filterDateFrom", "filterDateTo"]
        .forEach(id => document.getElementById(id).value = "");
    applyFilters();
}

function showSavedReport(i) {
    const row = savedRows[i];
    if (!row) return;
    useLetterheadHeader();
    currentSitrepNo = row["SITREP #"] || "";
    document.getElementById("reportContent").innerHTML = renderReportFromSheet(row);
    loadSavedPhotos(document.getElementById("reportContent"));
    document.getElementById("reportModal").style.display = "block";
}

function closeReport() {
    document.getElementById("reportModal").style.display = "none";
    useLetterheadHeader();
}

// Saves the rendered report as an image. On devices that support sharing files
// (phones/tablets) this opens the system share sheet so the image can be saved
// to the photo gallery or sent straight to Messenger / WhatsApp. Elsewhere it
// falls back to a normal download.
function saveOrShareImage(canvas, filename) {
    const fallbackDownload = () => {
        const link = document.createElement("a");
        link.download = filename;
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    canvas.toBlob(blob => {
        if (!blob) { fallbackDownload(); return; }
        const file = new File([blob], filename, { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({ title: filename.replace(/\.png$/, ""), files: [file] })
                .catch(err => {
                    if (err && err.name === "AbortError") return;
                    alert("Share failed: " + err);
                });
        } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.download = filename;
            link.href = url;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
        }
    }, "image/png");
}

function downloadReportImage() {
    const box = document.getElementById("reportModal").querySelector(".report-box");
    if (!box) return;

    const hidden = document.createElement("div");
    hidden.className = "dl-capture-wrap" + (currentReportName ? " landscape-report" : "");

    const clone = box.cloneNode(true);
    const actions = clone.querySelector(".report-actions");
    if (actions) actions.remove();

    hidden.appendChild(clone);
    document.body.appendChild(hidden);

    const images = [...clone.querySelectorAll("img")];
    const ready = images.map(img => {
        return photoDataUrl(img.src).then(dataUrl => {
            if (!dataUrl) return;
            img.src = dataUrl;
            return new Promise(resolve => {
                if (img.complete && img.naturalWidth) return resolve();
                img.addEventListener("load", () => resolve(), { once: true });
                img.addEventListener("error", () => resolve(), { once: true });
            });
        });
    });

    Promise.all(ready).then(() => {
        // Scale down automatically for very long reports so the canvas never
        // exceeds the browser's maximum image size.
        const scale = Math.max(1, Math.min(3, Math.floor(8000 / Math.max(1, hidden.scrollHeight))));
        return html2canvas(hidden, {
            backgroundColor: "#ffffff",
            scale: scale,
            useCORS: true,
            logging: false,
            windowWidth: hidden.scrollWidth,
            windowHeight: hidden.scrollHeight
        });
    }).then(canvas => {
        const filename = (currentReportName || (currentSitrepNo ? "SITREP " + currentSitrepNo : "sitrep")) + ".png";
        saveOrShareImage(canvas, filename);
    }).catch(err => {
        alert("Download Image failed: " + err);
    }).finally(() => {
        hidden.remove();
    });
}

// Converts an image URL to a data URL so html2canvas can draw it. Photos live
// in a private Drive folder and are served only through the authenticated
// sitrep-data edge function (the Apps Script photo action runs as the script
// owner, so the folder stays private and CORS is not an issue).
function photoDataUrl(url) {
    if (/^data:/i.test(url)) return Promise.resolve(url);
    const idMatch = /\/d\/([^/]+)/.exec(url || "") ||
        /thumbnail\?id=([^&\s]+)/.exec(url || "") ||
        /[\?&]id=([^&\s]+)/.exec(url || "");
    const id = idMatch && idMatch[1];
    if (!id) return Promise.resolve(null);
    return invokeSitrepData("photo", { id: id })
        .then(res => {
            if (!res || !res.ok || !res.data) throw new Error("no photo data");
            return "data:" + res.type + ";base64," + res.data;
        })
        .catch(err => {
            console.log("[photo] FAIL", String(err));
            return null;
        });
}

function formatDate(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleString();
}

function fmt(v) {
    if (typeof v === "string") {
        const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(v);
        if (m && m[1] === "1899") {
            // Time-only cell serialized from the sheet as an ISO instant (UTC).
            // Reconstruct the wall-clock in the browser's timezone instead of
            // returning the raw UTC hour:minute.
            const d = new Date(v);
            if (!isNaN(d.getTime())) {
                const p = n => String(n).padStart(2, "0");
                return p(d.getHours()) + ":" + p(d.getMinutes());
            }
            return m[4] + ":" + m[5];
        }
    }
    if (!(v instanceof Date) || isNaN(v)) return v;
    const p = n => String(n).padStart(2, "0");
    if (v.getFullYear() >= 2000) {
        return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
    }
    return `${p(v.getHours())}:${p(v.getMinutes())}`;
}

function splitJoined(s) {
    return String(s ?? "").split(/;\s*|,\s*|\n/).map(x => x.trim()).filter(Boolean);
}

// Normalizes a cell value to clean display text: "undefined"/"null"/missing
// values become an empty string, and surrounding whitespace is trimmed.
function safeText(v) {
    if (v === null || v === undefined) return "";
    return String(v).trim();
}

// Parses a sheet date value (Date object or YYYY-MM-DD string) into a Date.
function parseDay(v) {
    if (!safeText(v)) return null;
    const d = v instanceof Date ? v : new Date(String(v).slice(0, 10) + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
}

// Formats a call date as MM/DD/YYYY.
function toUSDate(v) {
    const d = parseDay(v);
    if (!d) return safeText(v);
    const p = n => String(n).padStart(2, "0");
    return p(d.getMonth() + 1) + "/" + p(d.getDate()) + "/" + d.getFullYear();
}

// Formats a call time as 24-hour HH:MMH (e.g. 14:30H).
function callTimeH(v) {
    const s = safeText(fmt(v));
    if (!s) return "";
    const m = /^(\d{1,2}):(\d{2})$/.exec(s);
    if (!m) return s + "H";
    return String(m[1]).padStart(2, "0") + ":" + m[2] + "H";
}

// Position-preserving split for the per-patient columns. Unlike splitJoined,
// empty slots are kept so a patient with no value (e.g. no PCR) still lines up
// with the same patient in the other columns.
function splitSlots(s) {
    return String(s ?? "").split(/;\s*|\n/).map(x => x.trim());
}

function savedPhotosSection(links) {
    const urls = String(links ?? "").split("\n").map(s => s.trim()).filter(Boolean);
    if (!urls.length) return "";
    return `
        <h3 class="report-title attachments-title">Attachments</h3>
        <div class="report-photos">
            ${urls.map((u, i) => `
                <a href="${esc(u)}" target="_blank">
                    <img class="saved-photo" data-photo="${esc(u)}" alt="Photo ${i + 1}">
                </a>`).join("")}
        </div>`;
}

// Resolves each saved photo through the private serving endpoint and sets the
// image src (and its link) once the data URL is ready.
function loadSavedPhotos(scope) {
    if (!scope) return;
    scope.querySelectorAll(".report-photos img.saved-photo").forEach(img => {
        photoDataUrl(img.dataset.photo).then(dataUrl => {
            if (!dataUrl) return;
            img.src = dataUrl;
            const link = img.closest("a");
            if (link) link.href = dataUrl;
        });
    });
}

function renderReportFromSheet(row) {
    const patients = splitSlots(row["Patient"]);
    const sexes = splitSlots(row["Sex"]);
    const ages = splitSlots(row["Age"]);
    const addresses = splitSlots(row["Address"]);
    const injuries = splitSlots(row["Injuries"]);
    const statuses = splitSlots(row["Victim Status"]);
    const impressions = splitSlots(row["Initial Impression"]);
    const dispositions = splitSlots(row["Disposition"]);
    const pcrBy = splitSlots(row["PCR By"]);
    const br = arr => arr.map(esc).join("<br>");

    const patientRows = patients.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${esc(p)}</td>
            <td>${esc(sexes[i] || "")}</td>
            <td>${esc(ages[i] || "")}</td>
            <td>${esc(addresses[i] || "")}</td>
            <td>${esc(injuries[i] || "")}</td>
            <td>${esc(statuses[i] || "")}</td>
            <td>${esc(impressions[i] || "")}</td>
            <td>${esc(dispositions[i] || "")}</td>
            <td>${esc(pcrBy[i] || "")}</td>
        </tr>`).join("");

    return `
        ${row["SITREP #"] ? `<div class="report-title" style="text-align:right;font-size:13px;margin-bottom:4px;">SITREP No. ${esc(row["SITREP #"])}</div>` : ""}
        <table class="report-table report-table-main">
            <tr><th>Nature of Incident</th><td>${esc(row["Nature of Incident"])}</td>
                <th>Assigned Team</th><td>${esc(row["Assigned Team"])}</td></tr>
            <tr><th>Cause of Incident</th><td colspan="3">${esc(row["Cause of Incident"] || "")}</td></tr>
            <tr><th>Shift-In-Charge</th><td>${esc(row["Shift-In-Charge (SIC)"])}</td>
                <th>Dispatch Operator</th><td>${esc(row["Operator in Charge"])}</td></tr>
            <tr><th>Dispatched Resource(s)</th><td colspan="3">${splitJoined(row["Dispatched Resources"]).map(esc).join(", ")}</td></tr>
            <tr><th>Incident Caller / Informant</th><td>${esc(row["Incident Caller / Informant"])}</td>
                <th>Contact No.</th><td>${esc(row["Contact No."])}</td></tr>
            <tr><th>Call Date</th><td>${esc(fmt(row["Call Date"]))}</td>
                <th>Call Time</th><td>${esc(fmt(row["Call Time"]))}</td></tr>
            <tr><th>Dispatched Time</th><td>${esc(fmt(row["Dispatched Time"]))}</td>
                <th>Arrival at Scene</th><td>${esc(fmt(row["Arrival at Scene"]))}</td></tr>
            <tr><th>Take Off from Scene</th><td>${esc(fmt(row["Take Off from Scene"]))}</td>
                <th>Arrival at Hospital</th><td>${esc(fmt(row["Arrival at Hospital"]))}</td></tr>
            <tr><th>Barangay</th><td>${esc(row["Barangay"] || "")}</td>
                <th>Municipality</th><td>${esc(row["Municipality"])}</td></tr>
            <tr><th>Place / Landmark</th><td colspan="3">${esc(row["Place / Landmark"] || row["Barangay"] || "")}</td></tr>
            <tr><th colspan="4">Patients / Victims / Involved Details:</th></tr>
            <tr><td colspan="4">
                <div class="patients-wrap">
                <table class="report-table patients-table">
                    <tr><th style="width:5%">No.</th><th style="width:12%">Name</th><th style="width:5%">Sex</th><th style="width:6%">Age</th><th style="width:12%">Address</th><th style="width:12%">Injuries Description</th><th style="width:11%">Status of Victim</th><th style="width:13%">Initial Impression</th><th style="width:13%">Disposition</th><th style="width:11%">PCR By</th></tr>
                    ${patientRows}
                </table>
                </div>
            </td></tr>
            <tr><th>Involved Vehicle Type</th><td colspan="3">${splitJoined(row["Involved Vehicle Type"]).map(esc).join(", ")}</td></tr>
            <tr><th>First Aid Provided</th><td colspan="3">${esc(row["First Aid Provided"])}</td></tr>
            <tr><th>Remarks</th><td colspan="3">${esc(row["Remarks"])}</td></tr>
            <tr><th>Driver(s)</th><td>${br(splitJoined(row["Drivers"]))}</td>
                <th>Responder(s)</th><td>${br(splitJoined(row["Responders"]))}</td></tr>
        </table>
        ${savedPhotosSection(row["Photos"])}`;
}

// ---------------------------------------------------------------------------
// Report header modes
// The single-sitrep report keeps the standard letterhead; the monthly archive
// report swaps it for a landscape header with the logo on the left and the
// report text pinned to the right.
// ---------------------------------------------------------------------------
const MONTH_NAMES = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY",
    "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
let letterheadSnapshot = null;
let monthlyPageStyle = null;

// Page orientation is a document-level CSS setting, so the landscape @page
// rule is injected only while the monthly report is open and removed after.
function enableLandscapePrint(on) {
    if (on) {
        if (monthlyPageStyle) return;
        monthlyPageStyle = document.createElement("style");
        monthlyPageStyle.textContent = "@media print { @page { size: A4 landscape; margin: 10mm; } }";
        document.head.appendChild(monthlyPageStyle);
    } else if (monthlyPageStyle) {
        monthlyPageStyle.remove();
        monthlyPageStyle = null;
    }
}

function reportHeaderEl() {
    return document.querySelector("#reportModal .report-header");
}

// Reporting period for the header: "MAY 2026" for a single month, or a range
// like "JANUARY - SEPTEMBER 2026" ("NOVEMBER 2025 - FEBRUARY 2026" across
// years). Uses the filter dates, falling back to the earliest/latest call date
// in the result set.
function reportPeriodLabel(rows) {
    const callDates = (rows || []).map(r => parseDay(r["Call Date"])).filter(Boolean);
    const fromInput = parseDay(document.getElementById("filterDateFrom").value);
    const toInput = parseDay(document.getElementById("filterDateTo").value);
    const start = fromInput || (callDates.length ? new Date(Math.min.apply(null, callDates.map(d => d.getTime()))) : null);
    const end = toInput || (callDates.length ? new Date(Math.max.apply(null, callDates.map(d => d.getTime()))) : null);
    if (!start && !end) return "";
    const first = start || end;
    const last = end || start;
    if (first.getFullYear() === last.getFullYear() && first.getMonth() === last.getMonth()) {
        return MONTH_NAMES[first.getMonth()] + " " + first.getFullYear();
    }
    if (first.getFullYear() === last.getFullYear()) {
        return MONTH_NAMES[first.getMonth()] + " - " + MONTH_NAMES[last.getMonth()] + " " + last.getFullYear();
    }
    return MONTH_NAMES[first.getMonth()] + " " + first.getFullYear() +
        " - " + MONTH_NAMES[last.getMonth()] + " " + last.getFullYear();
}

function useMonthlyReportHeader(period) {
    const head = reportHeaderEl();
    if (!head) return;
    if (!letterheadSnapshot) letterheadSnapshot = head.outerHTML;
    head.className = "report-header doc-header monthly-report-header";
    head.innerHTML =
        '<img src="CDRRMO Logo.png" alt="CDRRMO Logo" class="doc-logo" onerror="this.style.display=\'none\'">' +
        '<div class="monthly-header-text">' +
        '<div class="monthly-org">TABACO CDRRMO</div>' +
        '<div class="monthly-heading">MONTHLY INCIDENT REPORT:' +
        (period ? "&nbsp;&nbsp;" + esc(period) : "") + "</div>" +
        '<div class="monthly-generated">Generated on: ' +
        esc(new Date().toISOString().slice(0, 10)) + "</div>" +
        "</div>";
    const title = document.getElementById("reportModalTitle");
    if (title) title.style.display = "none";
    document.body.classList.add("monthly-report");
    enableLandscapePrint(true);
}

function useLetterheadHeader() {
    const head = reportHeaderEl();
    if (head && letterheadSnapshot) head.outerHTML = letterheadSnapshot;
    const title = document.getElementById("reportModalTitle");
    if (title) title.style.display = "";
    document.body.classList.remove("monthly-report");
    enableLandscapePrint(false);
    currentReportName = "";
}

// Summary table of every incident in the filtered set. No separate S.N. or
// Ref. No. columns - the SITREP number is the identifier for each row.
function renderMainIncidentTable(rows) {
    const heads = ["SITREP No.", "Nature of Incident", "Place of Incident", "Call Date",
        "Call Time", "Patient / Victim", "Injuries Description", "Remarks"];
    const headRow = heads.map(h => "<th>" + esc(h) + "</th>").join("");
    const bodyRows = rows.map(r => {
        const patients = splitSlots(r["Patient"]).map(safeText).filter(Boolean).join(", ");
        const cells = [
            safeText(r["SITREP #"]),
            safeText(r["Nature of Incident"]),
            safeText(r["Place / Landmark"] || r["Barangay"]),
            toUSDate(r["Call Date"]),
            callTimeH(r["Call Time"]),
            patients,
            safeText(r["Injuries"]),
            safeText(r["Remarks"])
        ];
        return "<tr>" + cells.map(c => "<td>" + esc(c) + "</td>").join("") + "</tr>";
    }).join("");
    return `
        <table class="main-incident-table">
            <colgroup>
                <col style="width:8%"><col style="width:13%"><col style="width:15%">
                <col style="width:9%"><col style="width:8%"><col style="width:14%">
                <col style="width:17%"><col style="width:16%">
            </colgroup>
            <thead><tr>${headRow}</tr></thead>
            <tbody>${bodyRows}</tbody>
        </table>`;
}

// Renders the report body for every sitrep matching the current filters: a
// summary note plus one MAIN INCIDENT TABLE covering every filtered record
// (all pages, not just the current page).
function generateCombinedReport() {
    if (!filteredRows.length) {
        alert("No sitreps match the current filters.");
        return;
    }
    const from = document.getElementById("filterDateFrom").value;
    const to = document.getElementById("filterDateTo").value;
    const range = [from, to].filter(Boolean).join(" to ");
    currentReportName = "SITREP Report" + (range ? " " + range : "");
    currentSitrepNo = "";
    useMonthlyReportHeader(reportPeriodLabel(filteredRows));

    const note = '<div class="report-note">' +
        (range ? "Covering: " + esc(range) + " &nbsp;|&nbsp; " : "") +
        filteredRows.length + " record(s)</div>";

    document.getElementById("reportContent").innerHTML =
        note + '<div class="report-title" style="text-align:center;">MAIN INCIDENT TABLE</div>' +
        renderMainIncidentTable(filteredRows);

    document.getElementById("reportModal").style.display = "block";
}

// Exports the full filtered set (not just the current page) as CSV, readable by
// spreadsheet apps. Multi-value cells are joined with "; ".
// Quotes a value for CSV. Values starting with = + - @ are prefixed with an
// apostrophe so spreadsheet apps treat them as text instead of executing them
// as formulas (CSV/formula injection).
function csvCell(v) {
    let s = String(v === null || v === undefined ? "" : v).replace(/\s+/g, " ").trim();
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function exportFilteredCsv() {
    if (!filteredRows.length) {
        alert("No sitreps match the current filters.");
        return;
    }
    const FIELDS = ["SITREP #", "Recorded At", "Call Date", "Nature of Incident", "Cause of Incident",
        "Assigned Team", "Shift-In-Charge (SIC)", "Operator in Charge", "Dispatched Resources",
        "Incident Caller / Informant", "Contact No.", "Call Time", "Dispatched Time", "Arrival at Scene",
        "Take Off from Scene", "Arrival at Hospital", "Barangay", "Place / Landmark", "Municipality",
        "Patient", "Sex", "Age", "Address", "Injuries", "Victim Status", "Initial Impression",
        "Disposition", "PCR By", "Involved Vehicle Type", "First Aid Provided", "Remarks",
        "Drivers", "Responders", "Photos"];
    const line = row => FIELDS.map(f => {
        const v = row[f];
        const s = Array.isArray(v) ? v.map(safeText).filter(Boolean).join("; ") : safeText(v);
        return csvCell(s);
    }).join(",");
    const csv = "\uFEFF" + [FIELDS.map(csvCell).join(",")].concat(filteredRows.map(line)).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const from = document.getElementById("filterDateFrom").value;
    const to = document.getElementById("filterDateTo").value;
    const range = [from, to].filter(Boolean).join("_");
    const a = document.createElement("a");
    a.href = url;
    a.download = "SITREP Records" + (range ? " " + range : "") + ".csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

document.addEventListener("DOMContentLoaded", () => {
    ["filterSearch", "filterDateFrom", "filterDateTo"].forEach(id =>
        document.getElementById(id).addEventListener("input", applyFilters));
    ["filterNature", "filterTeam"].forEach(id =>
        document.getElementById(id).addEventListener("change", applyFilters));
    document.addEventListener("sitrep-logout", clearRowCache);
    window.onLoginReady = viewSitreps;
});
