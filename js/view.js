let savedRows = [];
let filteredRows = [];
let currentPage = 1;
let currentSitrepNo = "";
const PAGE_SIZE = 10;
let sortOrder = "desc";

function viewSitreps() {
    const list = document.getElementById("savedList");
    list.innerHTML = "Loading...";
    const url = SHEETS_WEB_APP_URL + "?action=sitreps";
    fetch(url)
        .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.text();
        })
        .then(text => {
            let res;
            try {
                res = JSON.parse(text);
            } catch (e) {
                throw new Error("Not JSON. URL: " + url + " | response: " + text.slice(0, 120));
            }
            if (!res.ok) throw new Error(res.error || "Failed to load");
            renderSavedList(res.rows);
        })
        .catch(err => {
            list.innerHTML = "<p>Failed to load saved sitreps: " + esc(err.message || err) + "</p>";
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
    fillOptions("filterTeam", uniqueSorted(savedRows.map(r => r["Assigned Team"])));
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
        if (team && r["Assigned Team"] !== team) return false;
        const cd = normDate(r["Call Date"]);
        if (from && cd < from) return false;
        if (to && cd > to) return false;
        if (q) {
            const hay = [r["SITREP #"], r["Nature of Incident"], r["Assigned Team"],
                r["Barangay"], r["Municipality"], r["Patient"], r["Drivers"], r["Responders"]]
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
                    <td data-label="Place / Landmark">${esc(r["Barangay"])}</td>
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
    currentSitrepNo = row["SITREP #"] || "";
    document.getElementById("reportContent").innerHTML = renderReportFromSheet(row);
    loadSavedPhotos(document.getElementById("reportContent"));
    document.getElementById("reportModal").style.display = "block";
}

function closeReport() {
    document.getElementById("reportModal").style.display = "none";
}

function downloadReportImage() {
    const box = document.getElementById("reportModal").querySelector(".report-box");
    if (!box) return;

    const hidden = document.createElement("div");
    hidden.className = "dl-capture-wrap";

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
        return html2canvas(hidden, {
            backgroundColor: "#ffffff",
            scale: 3,
            useCORS: true,
            logging: false,
            windowWidth: hidden.scrollWidth,
            windowHeight: hidden.scrollHeight
        });
    }).then(canvas => {
        const link = document.createElement("a");
        link.download = (currentSitrepNo ? "SITREP " + currentSitrepNo + ".png" : "sitrep.png");
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => {
        alert("Download Image failed: " + err);
    }).finally(() => {
        hidden.remove();
    });
}

// Converts an image URL to a data URL so html2canvas can draw it. Google Drive
// images don't send CORS headers from drive.google.com, so photos are fetched
// through CORS-safe sources in order: the Apps Script backend (after redeploy),
// then the images.weserv.nl proxy and Google's lh3 CDN (both send
// Access-Control-Allow-Origin), with the raw thumbnail last.
function photoDataUrl(url) {
    if (/^data:/i.test(url)) return Promise.resolve(url);
    const idMatch = /\/d\/([^/]+)/.exec(url || "") ||
        /thumbnail\?id=([^&\s]+)/.exec(url || "") ||
        /[\?&]id=([^&\s]+)/.exec(url || "");
    const id = idMatch && idMatch[1];
    const candidates = [];
    if (id) {
        candidates.push({ src: SHEETS_WEB_APP_URL + "?action=photo&id=" + id, proxy: true });
        candidates.push({ src: "https://images.weserv.nl/?url=" + encodeURIComponent("drive.google.com/thumbnail?id=" + id + "&sz=w600"), proxy: false });
        candidates.push({ src: "https://lh3.googleusercontent.com/d/" + id + "=s800", proxy: false });
    }
    candidates.push({ src: url, proxy: false });
    let i = 0;
    const next = () => {
        if (i >= candidates.length) return Promise.resolve(null);
        const c = candidates[i++];
        console.log("[photo] trying", c.src);
        return fetch(c.src, { mode: "cors" })
            .then(r => {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return c.proxy ? r.json() : r.blob();
            })
            .then(res => {
                if (c.proxy) {
                    if (!res.ok || !res.data) throw new Error("no data in proxy response");
                    return "data:" + res.type + ";base64," + res.data;
                }
                return new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(fr.result);
                    fr.onerror = () => reject(new Error("read failed"));
                    fr.readAsDataURL(res);
                });
            })
            .then(dataUrl => {
                console.log("[photo] OK via", c.src.slice(0, 80));
                return dataUrl;
            })
            .catch(err => {
                console.log("[photo] FAIL", c.src.slice(0, 80), "->", String(err));
                return next();
            });
    };
    return next();
}

function formatDate(v) {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d) ? String(v) : d.toLocaleString();
}

function fmt(v) {
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
    const patients = splitJoined(row["Patient"]);
    const ages = splitJoined(row["Age"]);
    const addresses = splitJoined(row["Address"]);
    const injuries = splitJoined(row["Injuries"]);
    const statuses = splitJoined(row["Victim Status"]);
    const impressions = splitJoined(row["Initial Impression"]);
    const dispositions = splitJoined(row["Disposition"]);
    const br = arr => arr.map(esc).join("<br>");

    const patientRows = patients.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${esc(p)}</td>
            <td>${esc(ages[i] || "")}</td>
            <td>${esc(addresses[i] || "")}</td>
            <td>${esc(injuries[i] || "")}</td>
            <td>${esc(statuses[i] || "")}</td>
            <td>${esc(impressions[i] || "")}</td>
            <td>${esc(dispositions[i] || "")}</td>
        </tr>`).join("");

    return `
        ${row["SITREP #"] ? `<div class="report-title" style="text-align:right;font-size:13px;margin-bottom:4px;">SITREP No. ${esc(row["SITREP #"])}</div>` : ""}
        <table class="report-table report-table-main">
            <tr><th>Nature of Incident</th><td>${esc(row["Nature of Incident"])}</td>
                <th>Assigned Team</th><td>${esc(row["Assigned Team"])}</td></tr>
            <tr><th>Shift-In-Charge (SIC)</th><td>${esc(row["Shift-In-Charge (SIC)"])}</td>
                <th>Operator in Charge</th><td>${esc(row["Operator in Charge"])}</td></tr>
            <tr><th>Dispatched Resource(s)</th><td colspan="3">${br(splitJoined(row["Dispatched Resources"]))}</td></tr>
            <tr><th>Incident Caller / Informant</th><td>${esc(row["Incident Caller / Informant"])}</td>
                <th>Contact No.</th><td>${esc(row["Contact No."])}</td></tr>
            <tr><th>Call Date</th><td>${esc(fmt(row["Call Date"]))}</td>
                <th>Call Time</th><td>${esc(fmt(row["Call Time"]))}</td></tr>
            <tr><th>Dispatched Time</th><td>${esc(fmt(row["Dispatched Time"]))}</td>
                <th>Arrival at Scene</th><td>${esc(fmt(row["Arrival at Scene"]))}</td></tr>
            <tr><th>Take Off from Scene</th><td>${esc(fmt(row["Take Off from Scene"]))}</td>
                <th>Arrival at Hospital</th><td>${esc(fmt(row["Arrival at Hospital"]))}</td></tr>
            <tr><th>Place / Landmark</th><td>${esc(row["Barangay"])}</td>
                <th>Municipality</th><td>${esc(row["Municipality"])}</td></tr>
            <tr><th>Patients / Victims</th><td colspan="3">
                <div class="patients-wrap">
                <table class="report-table patients-table">
                    <tr><th style="width:6%">No.</th><th style="width:14%">Patient / Victim</th><th style="width:6%">Age</th><th style="width:16%">Address</th><th style="width:14%">Injuries Description</th><th style="width:11%">Status of Victim</th><th style="width:17%">Initial Impression</th><th style="width:16%">Disposition</th></tr>
                    ${patientRows}
                </table>
                </div>
            </td></tr>
            <tr><th>Involved Vehicle Type</th><td colspan="3">${br(splitJoined(row["Involved Vehicle Type"]))}</td></tr>
            <tr><th>First Aid Provided</th><td colspan="3">${esc(row["First Aid Provided"])}</td></tr>
            <tr><th>Remarks</th><td colspan="3">${esc(row["Remarks"])}</td></tr>
            <tr><th>Driver(s)</th><td>${br(splitJoined(row["Drivers"]))}</td>
                <th>Responder(s)</th><td>${br(splitJoined(row["Responders"]))}</td></tr>
        </table>
        ${savedPhotosSection(row["Photos"])}`;
}

document.addEventListener("DOMContentLoaded", () => {
    ["filterSearch", "filterDateFrom", "filterDateTo"].forEach(id =>
        document.getElementById(id).addEventListener("input", applyFilters));
    ["filterNature", "filterTeam"].forEach(id =>
        document.getElementById(id).addEventListener("change", applyFilters));
    viewSitreps();
});
