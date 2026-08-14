const EMAIL_TO = "cdrrmotabaco2014@gmail.com, gelmolatojunior@gmail.com";

const TEAMS = {
    Alpha: {
        sic: ["Ramon D. Rodriguez"],
        operator: ["Luis C. Borlagdan"],
        drivers: ["Al C. Asis", "Jomar B. Belo", "Eugenio S. Cao Jr.", "Warren B. Henson", "Antonio B. Buison Jr."],
        responders: [
            "Wynel B. De Mesa", "Vicente B. Carale Jr.", "Jaime V. Buensoceso",
            "Ferdinand P. San Juan", "Roberto S. Villegas", "Shay Marie Luz R. Benavides",
            "Maria Carmela B. Bien", "Romyna B. Bongat", "Claire B. Bobier",
            "Estiffunny S. Celestial", "Julius T. Bariso", "Joseph B. Riosa"
        ]
    },
    Bravo: {
        sic: ["Ambrocio V. Piolino"],
        operator: ["Domingo C. Bron Jr."],
        drivers: ["Ariel C. Bolaños", "Christopher Jeorge B. Lacerna", "Reynaldo B. Belgica Jr.", "Jaime II B. Benosa Jr.", "Segundo B. Ballon Jr."],
        responders: [
            "Jonel B. Bocalbos", "Romulo P. Bolilan Jr.", "Adrian C. Callao",
            "Arnel C. Camata", "Levi Martin B. Madrid", "Joan B. Sayago",
            "Maria Carmela B. Bien", "Romyna B. Bongat", "Claire B. Bobier",
            "Estiffunny S. Celestial", "Julius T. Bariso", "Joseph B. Riosa"
        ]
    },
    Charlie: {
        sic: ["Romar B. Bombon"],
        operator: ["Dennis R. Flores", "Imelda B. Castillo"],
        drivers: ["Jonel A. Buendia", "Angelo B. Baraero", "Marlon B. Belda", "Jophen B. Bragais", "Pablito M. Amortizado Jr."],
        responders: [
            "Herman B. Bonaobra", "Ero B. Obreros", "Noah M. Altavano",
            "Pedro G. Boringot, I", "Francis R. Tañang", "Janine Eve Q. Base",
            "Salvacion Amor B. Campit",
            "Maria Carmela B. Bien", "Romyna B. Bongat", "Claire B. Bobier",
            "Estiffunny S. Celestial", "Julius T. Bariso", "Joseph B. Riosa"
        ]
    }
};

const ALL_ROSTER = {
    sic: ["Ramon D. Rodriguez", "Ambrocio V. Piolino", "Romar B. Bombon"],
    operator: ["Imelda B. Castillo", "Luis C. Borlagdan", "Domingo C. Bron Jr.", "Dennis R. Flores"],
    drivers: [
        "Al C. Asis", "Jomar B. Belo", "Eugenio S. Cao Jr.", "Warren B. Henson",
        "Antonio B. Buison Jr.", "Ariel C. Bolaños", "Christopher Jeorge B. Lacerna",
        "Reynaldo B. Belgica Jr.", "Jaime II B. Benosa Jr.", "Segundo B. Ballon Jr.",
        "Jonel A. Buendia", "Angelo B. Baraero", "Marlon B. Belda", "Jophen B. Bragais",
        "Pablito M. Amortizado Jr."
    ],
    responders: [
        "Wynel B. De Mesa", "Jonel B. Bocalbos", "Herman B. Bonaobra",
        "Vicente B. Carale Jr.", "Romulo P. Bolilan Jr.", "Ero B. Obreros",
        "Jaime V. Buensoceso", "Adrian C. Callao", "Noah M. Altavano",
        "Ferdinand P. San Juan", "Arnel C. Camata", "Roberto S. Villegas",
        "Levi Martin B. Madrid", "Francis R. Tañang", "Shay Marie Luz R. Benavides",
        "Joan B. Sayago", "Janine Eve Q. Base", "Salvacion Amor B. Campit",
        "Pedro G. Boringot, I",
        "Maria Carmela B. Bien", "Romyna B. Bongat", "Claire B. Bobier",
        "Estiffunny S. Celestial", "Julius T. Bariso", "Joseph B. Riosa"
    ]
};

function resourceOptions() {
    return `
        <option value="">-- Select Resource --</option>
        <option>EMS</option>
        <option>884</option>
        <option>STARIA</option>
        <option>FIRETRUCK</option>
        <option>028</option>
        <option>167</option>
        <option>133</option>
        <option>NAVARRA WHITE</option>
        <option>NAVARRA GRAY</option>`;
}

function vehicleTypeOptions() {
    return `
        <option value="">-- Select --</option>
        <option>Single Motorcycle</option>
        <option>Motor Tricycle</option>
        <option>Pedicab</option>
        <option>Bicycle</option>
        <option>Car</option>
        <option>Van / SUV</option>
        <option>Jeepney</option>
        <option>Pickup Truck</option>
        <option>Truck</option>
        <option>Bus</option>
        <option>Others</option>
        <option>N/A</option>`;
}

function addVehicleType() {
    const div = document.createElement("div");
    div.className = "vehicle-row";
    div.innerHTML = `
        <select name="vehicleType[]" class="required" required>${vehicleTypeOptions()}</select>
        <button type="button" class="remove-btn" onclick="removeVehicleType(this)" title="Remove vehicle type">&#8722;</button>`;
    document.getElementById("vehicleTypes").appendChild(div);
}

function removeVehicleType(btn) {
    btn.closest(".vehicle-row").remove();
}

function addResource() {
    const div = document.createElement("div");
    div.className = "row resource-row";
    div.innerHTML = `
        <span class="label">Dispatched Resource:</span>
        <select name="resource[]" class="resource-input required" required>${resourceOptions()}</select>
        <button type="button" class="remove-btn" onclick="removeResource(this)" title="Remove resource">&#8722;</button>
    `;
    document.getElementById("resources").appendChild(div);
}

function removeResource(btn) {
    btn.closest(".resource-row").remove();
}

function victimStatusOptions() {
    return `
        <option value="">-- Select --</option>
        <option>Conscious</option>
        <option>Alert</option>
        <option>Semi-Conscious</option>
        <option>Unconscious</option>
        <option>Responsive to Verbal Stimuli</option>
        <option>Responsive to Pain Stimuli</option>
        <option>Unresponsive</option>
        <option>Others</option>`;
}

function dispositionOptions() {
    return `
        <option value="">-- Select --</option>
        <option>Hospitalized</option>
        <option>Demised</option>
        <option>Declined Hospitalization</option>
        <option>N/A</option>`;
}

function victimItemHTML(letter, addRemoveBtn) {
    return `
        <div class="victim-row">
            <span class="patient-label">(${letter}) Patient / Victim</span>
            <input type="text" name="patient[]" class="required" required>
            <span style="text-align:right;">Age:</span>
            <input type="number" name="age[]" class="age required" min="0" required>
            <span style="text-align:right;">Address:</span>
            <input type="text" name="address[]" class="required" required>
            <span class="pcr-label">PCR By:</span>
            <select name="pcrBy[]"><option value="">-- Select Responder --</option>${responderOptions()}</select>
        </div>
        <div class="victim-status-row">
            <span class="inj-label">Injuries Description:</span>
            <input type="text" name="injury[]" class="required" required>
            <span>Status of Victim:</span>
            <select name="victimStatus[]" class="required" required>${victimStatusOptions()}</select>
            <span>Initial Impression:</span>
            <input type="text" name="initialImpression[]" placeholder="e.g., smells of alcohol">
            <span>Disposition of Victim:</span>
            <select name="disposition[]" class="required" required>${dispositionOptions()}</select>
            ${addRemoveBtn}
        </div>`;
}

function addVictim() {
    const count = document.querySelectorAll("#victims .victim-item").length;
    const letter = String.fromCharCode(65 + count);
    const div = document.createElement("div");
    div.className = "victim-item";
    div.dataset.index = count + 1;
    div.innerHTML = victimItemHTML(letter,
        `<button type="button" class="remove-btn" onclick="removeVictim(this)" title="Remove patient/victim">&#8722;</button>`);
    document.getElementById("victims").appendChild(div);
    renumberVictims();
}

function removeVictim(btn) {
    btn.closest(".victim-item").remove();
    renumberVictims();
}

function renumberVictims() {
    document.querySelectorAll("#victims .victim-item").forEach((row, i) => {
        const letter = String.fromCharCode(65 + i);
        const label = row.querySelector(".patient-label");
        if (label) label.textContent = `(${letter}) Patient / Victim`;
        row.dataset.index = i + 1;
    });
}

function currentTeam() {
    const el = document.getElementById("assignedTeam");
    return (el && TEAMS[el.value]) ? el.value : "";
}

function optionTags(names) {
    return names.map(n => `<option>${n}</option>`).join("");
}

function optionsFor(kind) {
    const team = currentTeam();
    return team ? TEAMS[team][kind] : ALL_ROSTER[kind];
}

function driverOptions() {
    return optionTags(optionsFor("drivers"));
}
function responderOptions() {
    return optionTags(optionsFor("responders"));
}

// Repopulate the SIC / Operator / Driver / Responder dropdowns for the current
// team (all names when no team is selected).
function refreshSelects(kind) {
    const names = optionsFor(kind);
    const selector = kind === "sic" ? "#sic" :
        kind === "operator" ? "#operator" :
        kind === "drivers" ? '#drivers select[name="driver[]"]' :
        '#responders select[name="responder[]"]';
    const placeholder = { sic: "-- Select SIC --", operator: "-- Select Operator --", drivers: "-- Select Driver --", responders: "-- Select Responder --" }[kind];
    document.querySelectorAll(selector).forEach(sel => {
        sel.innerHTML = `<option value="">${placeholder}</option>` + optionTags(names);
        if (currentTeam() && (
            (kind === "sic" && names.length === 1) ||
            (kind === "operator" && names.length === 1)
        )) sel.selectedIndex = 1;
    });
}

function refreshAllSelects() {
    refreshSelects("sic");
    refreshSelects("operator");
    refreshSelects("drivers");
    refreshSelects("responders");
    refreshPcrSelects();
}

// Repopulate the "PCR By" dropdowns in every patient/victim row for
// the current team.
function refreshPcrSelects() {
    document.querySelectorAll('#victims select[name="pcrBy[]"]').forEach(sel => {
        sel.innerHTML = `<option value="">-- Select Responder --</option>` + responderOptions();
    });
}
function addDriver() {
    const div = document.createElement("div");
    div.className = "team-item driver-item";
    div.innerHTML = `
        <select name="driver[]" class="required" required><option value="">-- Select Driver --</option>${driverOptions()}</select>
        <button type="button" class="remove-btn" onclick="removeDriver(this)" title="Remove driver">&#8722;</button>`;
    document.getElementById("drivers").appendChild(div);
}
function removeDriver(btn) {
    btn.closest(".driver-item").remove();
}
function addResponder() {
    const div = document.createElement("div");
    div.className = "team-item responder-item";
    div.innerHTML = `
        <select name="responder[]" class="required" required><option value="">-- Select Responder --</option>${responderOptions()}</select>
        <button type="button" class="remove-btn" onclick="removeResponder(this)" title="Remove responder">&#8722;</button>`;
    document.getElementById("responders").appendChild(div);
}
function removeResponder(btn) {
    btn.closest(".responder-item").remove();
}

function validateForm() {
    let valid = true;
    document.querySelectorAll(".required").forEach(el => {
        el.classList.remove("required-empty");
        if (!String(el.value || "").trim()) {
            el.classList.add("required-empty");
            valid = false;
        }
    });

    const firstEmpty = document.querySelector(".required-empty");
    if (firstEmpty) firstEmpty.scrollIntoView({behavior:"smooth", block:"center"});

    if (!valid) alert("Please fill all the required fields.");
    return valid;
}

function getValues(name) {
    return [...document.querySelectorAll(`[name="${name}"]`)].map(x => x.value);
}

function buildReport() {
    const resources = getValues("resource[]");
    const patients = getValues("patient[]");
    const ages = getValues("age[]");
    const addresses = getValues("address[]");
    const injuries = getValues("injury[]");
    const victimStatuses = getValues("victimStatus[]");
    const initialImpressions = getValues("initialImpression[]");
    const dispositions = getValues("disposition[]");
    const pcrBy = getValues("pcrBy[]");
    const vehicleTypes = getValues("vehicleType[]");
    const drivers = getValues("driver[]");
    const responders = getValues("responder[]");

    let patientRows = patients.map((p, i) => `
        <tr>
            <td>${i + 1}</td>
            <td>${esc(p)}</td>
            <td>${esc(ages[i])}</td>
            <td>${esc(addresses[i])}</td>
            <td>${esc(injuries[i])}</td>
            <td>${esc(victimStatuses[i])}</td>
            <td>${esc(initialImpressions[i])}</td>
            <td>${esc(dispositions[i])}</td>
            <td>${esc(pcrBy[i])}</td>
        </tr>`).join("");

    return `
        <table class="report-table report-table-main">
            <tr><th>Nature of Incident</th><td>${esc(document.getElementById("nature").value)}</td>
                <th>Assigned Team</th><td>${esc(document.getElementById("assignedTeam").value)}</td></tr>
            <tr><th>Shift-In-Charge</th><td>${esc(document.querySelector('[name="sic"]').value)}</td>
                <th>Operator in Charge</th><td>${esc(document.querySelector('[name="operator"]').value)}</td></tr>
            <tr><th>Dispatched Resource(s)</th><td colspan="3">${resources.map(esc).join(", ")}</td></tr>
            <tr><th>Incident Caller / Informant</th><td>${esc(document.querySelector('[name="caller"]').value)}</td>
                <th>Contact No.</th><td>${esc(document.querySelector('[name="contact"]').value)}</td></tr>
            <tr><th>Call Date</th><td>${esc(document.querySelector('[name="callDate"]').value)}</td>
                <th>Call Time</th><td>${esc(document.querySelector('[name="callTime"]').value)}</td></tr>
            <tr><th>Dispatched Time</th><td>${esc(document.querySelector('[name="dispatchedTime"]').value)}</td>
                <th>Arrival at Scene</th><td>${esc(document.querySelector('[name="arrivalTime"]').value)}</td></tr>
            <tr><th>Take Off from Scene</th><td>${esc(document.querySelector('[name="takeoffTime"]').value)}</td>
                <th>Arrival at Hospital</th><td>${esc(document.querySelector('[name="hospitalTime"]').value)}</td></tr>
            <tr><th>Place / Landmark</th><td>${esc(document.querySelector('[name="barangay"]').value)}</td>
                <th>Municipality</th><td>${esc(document.querySelector('[name="municipality"]').value)}</td></tr>
            <tr><th>Patients / Victims</th><td colspan="3">
                <div class="patients-wrap">
                <table class="report-table patients-table">
                    <tr><th style="width:5%">No.</th><th style="width:13%">Patient / Victim</th><th style="width:6%">Age</th><th style="width:14%">Address</th><th style="width:13%">Injuries Description</th><th style="width:11%">Status of Victim</th><th style="width:15%">Initial Impression</th><th style="width:14%">Disposition</th><th style="width:9%">PCR By</th></tr>
                    ${patientRows}
                </table>
                </div>
            </td></tr>
            <tr><th>Involved Vehicle Type</th><td colspan="3">${vehicleTypes.map(esc).join(", ")}</td></tr>
            <tr><th>First Aid Provided</th><td colspan="3">${esc(document.querySelector('[name="firstAid"]').value)}</td></tr>
            <tr><th>Remarks</th><td colspan="3">${esc(document.querySelector('[name="remarks"]').value)}</td></tr>
            <tr><th>Driver(s)</th><td>${drivers.map(esc).join("<br>")}</td>
                <th>Responder(s)</th><td>${responders.map(esc).join("<br>")}</td></tr>
        </table>
        ${photosSection()}`;
}

// Thumbnails of the attached photos (shown below the form, above the actions).
function photosSection() {
    if (!selectedPhotos.length) return "";
    return `
        <h3 class="report-title attachments-title">Attachments</h3>
        <div class="report-photos">
            ${selectedPhotos.map((p, i) => `
                <a href="data:${p.type};base64,${p.data}" target="_blank">
                    <img src="data:${p.type};base64,${p.data}" alt="Photo ${i + 1}">
                </a>`).join("")}
        </div>`;
}

let reportHTML = "";
let selectedPhotos = []; // { data: base64, type: mime, name }
let submissionId = ""; // unique id per report; prevents duplicate saves
let saving = false;
let reportSaved = false;

// Generates a unique id for one submission attempt. Kept per report so a
// retry of the same save cannot write a second row.
function newSubmissionId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "sitrep_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}

// Toggles the saving overlay + button state. The button is disabled and labeled
// "Saving…" mid-save, stays disabled as "Saved" after a success, and returns to
// normal after a failure.
function setSavingUI(isSaving) {
    const overlay = document.getElementById("savingOverlay");
    if (overlay) overlay.hidden = !isSaving;
    const btn = document.getElementById("saveBtn");
    if (!btn) return;
    if (isSaving) {
        btn.disabled = true;
        btn.textContent = "Saving\u2026";
    } else if (reportSaved) {
        btn.disabled = true;
        btn.textContent = "Saved";
    } else {
        btn.disabled = false;
        btn.textContent = "Save & Email";
    }
}

// Read and downscale the selected photos so the payload stays small.
function loadSelectedPhotos() {
    const input = document.getElementById("photos");
    if (!input || !input.files || !input.files.length) {
        selectedPhotos = [];
        return Promise.resolve();
    }

    const files = [...input.files].slice(0, 4);
    return Promise.all(files.map(file => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    const MAX = 640;
                    let { width, height } = img;
                    if (width > MAX || height > MAX) {
                        const scale = Math.min(MAX / width, MAX / height);
                        width = Math.round(width * scale);
                        height = Math.round(height * scale);
                    }
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                    const mime = "image/jpeg";
                    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
                    resolve({
                        data: canvas.toDataURL(mime, 0.5).split(",")[1],
                        type: mime,
                        name: name
                    });
                };
                img.onerror = () => resolve(null);
                img.src = ev.target.result;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    })).then(photos => {
        selectedPhotos = photos.filter(Boolean);
    });
}

document.getElementById("incidentForm").addEventListener("submit", function(e) {
    e.preventDefault();
    if (!validateForm()) return;
    if (!submissionId) submissionId = newSubmissionId();

    loadSelectedPhotos().then(() => {
        reportHTML = buildReport();
        document.getElementById("reportContent").innerHTML = reportHTML;
        document.getElementById("reportModal").style.display = "block";
    });
});

document.getElementById("assignedTeam").addEventListener("change", refreshAllSelects);

function buildReportData() {
    const val = name => document.querySelector(`[name="${name}"]`).value;
    const patients = getValues("patient[]");
    const ages = getValues("age[]");
    const addresses = getValues("address[]");
    const injuries = getValues("injury[]");
    const victimStatuses = getValues("victimStatus[]");
    const initialImpressions = getValues("initialImpression[]");
    const dispositions = getValues("disposition[]");
    const pcrBy = getValues("pcrBy[]");

    return {
        nature: val("nature"),
        assignedTeam: val("assignedTeam"),
        sic: val("sic"),
        operator: val("operator"),
        resources: getValues("resource[]"),
        caller: val("caller"),
        contact: val("contact"),
        callDate: val("callDate"),
        callTime: val("callTime"),
        dispatchedTime: val("dispatchedTime"),
        arrivalTime: val("arrivalTime"),
        takeoffTime: val("takeoffTime"),
        hospitalTime: val("hospitalTime"),
        barangay: val("barangay"),
        municipality: val("municipality"),
        patients: patients.map((p, i) => ({
            patient: p,
            age: ages[i],
            address: addresses[i],
            injury: injuries[i],
            victimStatus: victimStatuses[i],
            initialImpression: initialImpressions[i],
            disposition: dispositions[i],
            pcrBy: pcrBy[i]
        })),
        vehicleType: getValues("vehicleType[]"),
        firstAid: val("firstAid"),
        remarks: val("remarks"),
        drivers: getValues("driver[]"),
        responders: getValues("responder[]"),
        photos: selectedPhotos,
        submissionId: submissionId
    };
}

const MAX_SAVE_ATTEMPTS = 3;
const SAVE_TIMEOUT_MS = 90000;

// Sends one report through the authenticated edge function and classifies the
// result. Resolves to one of:
//   { type: "ok", res }         valid JSON from the server
//   { type: "server", error }   valid JSON reporting a server-side failure
//   { type: "transient", detail } network error / timeout / session problem
function attemptSave() {
    const timer = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timed out")), SAVE_TIMEOUT_MS)
    );

    return Promise.race([
        invokeSitrepData("submit", buildReportData()),
        timer
    ])
        .then(res => {
            if (!res || res.ok !== true) {
                return { type: "server", error: (res && res.error) || "unknown server error" };
            }
            return { type: "ok", res: res };
        })
        .catch(err => {
            if (err && err.message === "timed out") return { type: "transient", detail: "timed out" };
            return { type: "transient", detail: String(err && err.message || err) };
        });
}

function saveToSheet() {
    if (reportSaved || saving) return Promise.resolve(reportSaved);

    saving = true;
    setSavingUI(true);

    return new Promise(resolve => {
        const retry = attempt => {
            attemptSave().then(result => {
                if (result.type === "ok") {
                    reportSaved = true;
                    saving = false;
                    setSavingUI(false);
                    alert(result.res.duplicate ? "This report was already saved." : "Report saved to Google Sheets.");
                    resolve(true);
                    return;
                }
                if (result.type === "server") {
                    saving = false;
                    setSavingUI(false);
                    alert("Save failed: " + result.error);
                    resolve(false);
                    return;
                }
                // Transient failure (HTML / network / timeout). The submission id
                // makes retries safe: the server either returns duplicate (already
                // saved) or processes the record exactly once.
                if (attempt < MAX_SAVE_ATTEMPTS - 1) {
                    setTimeout(() => retry(attempt + 1), 1200 * Math.pow(2, attempt));
                } else {
                    saving = false;
                    setSavingUI(false);
                    alert("Could not confirm the save - please check the sheet. Re-saving this report cannot create a duplicate.");
                    resolve(false);
                }
            });
        };
        retry(0);
    });
}

function saveAndEmail() {
    if (saving || reportSaved) return;
    saveToSheet().then(ok => {
        if (ok) sendReport();
    });
}

function sendReport() {
    // Opens Gmail's compose window (requires being signed in to Gmail in this
    // browser) with the recipient, subject, and report body pre-filled.
    const text = document.getElementById("reportContent").innerText;
    const subject = "Tabaco CDRRMO Situation Report - " +
        document.querySelector('[name="callDate"]').value;
    const body = text;
    const gmailUrl =
        "https://mail.google.com/mail/?view=cm&fs=1" +
        "&to=" + encodeURIComponent(EMAIL_TO) +
        "&su=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    window.open(gmailUrl, "_blank");
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
        return new Promise(resolve => {
            if (img.complete && img.naturalWidth) return resolve();
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
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
        link.download = "sitrep.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    }).catch(err => {
        alert("Download Image failed: " + err);
    }).finally(() => {
        hidden.remove();
    });
}

function clearForm() {
    if (!confirm("Are you sure you want to clear all fields?")) return;
    const form = document.getElementById("incidentForm");
    form.reset();

    // Restore dynamic sections to one initial row.
    document.getElementById("resources").innerHTML = `
        <div class="row resource-row">
            <span class="label">Dispatched Resource:</span>
            <select name="resource[]" class="resource-input required" required>${resourceOptions()}</select>
            <button type="button" class="add-btn" onclick="addResource()" title="Add resource">+</button>
        </div>`;

    document.getElementById("victims").innerHTML = `
        <div class="victim-item" data-index="1">
            ${victimItemHTML("A", `<button type="button" class="add-btn" onclick="addVictim()" title="Add patient/victim">+</button>`)}
        </div>`;

    document.getElementById("vehicleTypes").innerHTML = `
        <div class="vehicle-row">
            <select name="vehicleType[]" class="required" required>${vehicleTypeOptions()}</select>
            <button type="button" class="add-btn" onclick="addVehicleType()" title="Add vehicle type">+</button>
        </div>`;

    document.getElementById("drivers").innerHTML = `
        <div class="team-item driver-item">
            <select name="driver[]" class="required" required><option value="">-- Select Driver --</option>${driverOptions()}</select>
            <button type="button" class="add-btn" onclick="addDriver()" title="Add driver">+</button>
        </div>`;

    document.getElementById("responders").innerHTML = `
        <div class="team-item responder-item">
            <select name="responder[]" class="required" required><option value="">-- Select Responder --</option>${responderOptions()}</select>
            <button type="button" class="add-btn" onclick="addResponder()" title="Add responder">+</button>
        </div>`;

    refreshAllSelects();

    const photosInput = document.getElementById("photos");
    if (photosInput) photosInput.value = "";
    selectedPhotos = [];

    document.querySelectorAll(".required-empty").forEach(el => el.classList.remove("required-empty"));
    document.querySelectorAll(".check-required-empty").forEach(el => el.classList.remove("check-required-empty"));

    submissionId = "";
    saving = false;
    reportSaved = false;
    setSavingUI(false);
}
