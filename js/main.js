const EMAIL_TO = "cdrrmotabaco2014@gmail.com, gelmolatojunior@gmail.com";
const SHEETS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwcEUHuhBh00drO_P-IcBvZIdEcA0lFEwdrp5TfI0ajPl2KYR24wlyWyDxAVEfDRAYo/exec";

function resourceOptions() {
    return `
        <option value="">-- Select Resource --</option>
        <option>EMS</option>
        <option>884 STARIA</option>
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
        <option>Padyak (Motorcycle w/ Sidecar)</option>
        <option>Motor Tricycle</option>
        <option>Pedicab</option>
        <option>Bicycle</option>
        <option>Car / Van / SUV</option>
        <option>Jeepney</option>
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
        <option>In-Patient</option>
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

function driverOptions() {
    return `
        <option value="">-- Select Driver --</option>
        <option>Al C. Asis</option>
        <option>Jomar B. Belo</option>
        <option>Eugenio S. Cao Jr.</option>
        <option>Warren B. Henson</option>
        <option>Antonio B. Buison Jr.</option>
        <option>Ariel C. Bolaños</option>
        <option>Christopher Jeorge B. Lacerna</option>
        <option>Reynaldo B. Belgica Jr.</option>
        <option>Jaime II B. Benosa Jr.</option>
        <option>Segundo B. Ballon Jr.</option>
        <option>Jonel A. Buendia</option>
        <option>Angelo B. Baraero</option>
        <option>Marlon B. Belda</option>
        <option>Jophen B. Bragais</option>
        <option>Pablito M. Amortizado Jr.</option>
        <option>Wynel B. De Mesa</option>`;
}
function responderOptions() {
    return `
        <option value="">-- Select Responder --</option>
        <option>Wynel B. De Mesa</option>
        <option>Jonel B. Bocalbos</option>
        <option>Herman B. Bonaobra</option>
        <option>Vicente B. Carale Jr.</option>
        <option>Romulo P. Bolilan Jr.</option>
        <option>Ero B. Obreros</option>
        <option>Jaime V. Buensoceso</option>
        <option>Adrian C. Callao</option>
        <option>Noah M. Altavano</option>
        <option>Ferdinand P. San Juan</option>
        <option>Arnel C. Camata</option>
        <option>Roberto S. Villegas</option>
        <option>Levi Martin B. Madrid</option>
        <option>Francis R. Tañang</option>
        <option>Shay Marie Luz R. Benavides</option>
        <option>Joan B. Sayago</option>
        <option>Janine Eve Q. Base</option>
        <option>Salvacion Amor B. Campit</option>
        <option>Pedro G. Boringot, I</option>`;
}
function addDriver() {
    const div = document.createElement("div");
    div.className = "team-item driver-item";
    div.innerHTML = `
        <select name="driver[]" class="required" required>${driverOptions()}</select>
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
        <select name="responder[]" class="required" required>${responderOptions()}</select>
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

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
    }[c]));
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
        </tr>`).join("");

    return `
        <table class="report-table">
            <tr><th>Nature of Incident</th><td>${esc(document.getElementById("nature").value)}</td>
                <th>Assigned Team</th><td>${esc(document.getElementById("assignedTeam").value)}</td></tr>
            <tr><th>Shift-In-Charge (SIC)</th><td>${esc(document.querySelector('[name="sic"]').value)}</td>
                <th>Operator in Charge</th><td>${esc(document.querySelector('[name="operator"]').value)}</td></tr>
            <tr><th>Dispatched Resource(s)</th><td colspan="3">${resources.map(esc).join("<br>")}</td></tr>
            <tr><th>Incident Caller / Informant</th><td>${esc(document.querySelector('[name="caller"]').value)}</td>
                <th>Contact No.</th><td>${esc(document.querySelector('[name="contact"]').value)}</td></tr>
            <tr><th>Call Date</th><td>${esc(document.querySelector('[name="callDate"]').value)}</td>
                <th>Call Time</th><td>${esc(document.querySelector('[name="callTime"]').value)}</td></tr>
            <tr><th>Dispatched Time</th><td>${esc(document.querySelector('[name="dispatchedTime"]').value)}</td>
                <th>Arrival at Scene</th><td>${esc(document.querySelector('[name="arrivalTime"]').value)}</td></tr>
            <tr><th>Take Off from Scene</th><td>${esc(document.querySelector('[name="takeoffTime"]').value)}</td>
                <th>Arrival at Hospital</th><td>${esc(document.querySelector('[name="hospitalTime"]').value)}</td></tr>
            <tr><th>Barangay</th><td>${esc(document.querySelector('[name="barangay"]').value)}</td>
                <th>Municipality</th><td>${esc(document.querySelector('[name="municipality"]').value)}</td></tr>
            <tr><th>Patients / Victims</th><td colspan="3">
                <table class="report-table">
                    <tr><th>No.</th><th>Patient / Victim</th><th>Age</th><th>Address</th><th>Injuries Description</th><th>Status of Victim</th><th>Initial Impression</th><th>Disposition</th></tr>
                    ${patientRows}
                </table>
            </td></tr>
            <tr><th>Involved Vehicle Type</th><td colspan="3">${vehicleTypes.map(esc).join("<br>")}</td></tr>
            <tr><th>First Aid Provided</th><td colspan="3">${esc(document.querySelector('[name="firstAid"]').value)}</td></tr>
            <tr><th>Remarks</th><td colspan="3">${esc(document.querySelector('[name="remarks"]').value)}</td></tr>
            <tr><th>Driver(s)</th><td>${drivers.map(esc).join("<br>")}</td>
                <th>Responder(s)</th><td>${responders.map(esc).join("<br>")}</td></tr>
        </table>`;
}

let reportHTML = "";

document.getElementById("incidentForm").addEventListener("submit", function(e) {
    e.preventDefault();
    if (!validateForm()) return;

    reportHTML = buildReport();
    document.getElementById("reportContent").innerHTML = reportHTML;
    document.getElementById("reportModal").style.display = "block";
});

function buildReportData() {
    const val = name => document.querySelector(`[name="${name}"]`).value;
    const patients = getValues("patient[]");
    const ages = getValues("age[]");
    const addresses = getValues("address[]");
    const injuries = getValues("injury[]");
    const victimStatuses = getValues("victimStatus[]");
    const initialImpressions = getValues("initialImpression[]");
    const dispositions = getValues("disposition[]");

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
            disposition: dispositions[i]
        })),
        vehicleType: getValues("vehicleType[]"),
        firstAid: val("firstAid"),
        remarks: val("remarks"),
        drivers: getValues("driver[]"),
        responders: getValues("responder[]")
    };
}

function saveToSheet() {
    if (!SHEETS_WEB_APP_URL) {
        alert("Google Sheets is not configured yet. Open js/main.js and paste your Apps Script Web App URL into SHEETS_WEB_APP_URL.");
        return;
    }

    fetch(SHEETS_WEB_APP_URL, {
        method: "POST",
        mode: "cors",
        body: JSON.stringify(buildReportData())
    })
        .then(r => r.json())
        .then(res => {
            if (res.ok) alert("Report saved to Google Sheets.");
            else alert("Save failed: " + (res.error || "unknown error"));
        })
        .catch(err => alert("Save failed: " + err));
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
            <select name="driver[]" class="required" required>${driverOptions()}</select>
            <button type="button" class="add-btn" onclick="addDriver()" title="Add driver">+</button>
        </div>`;

    document.getElementById("responders").innerHTML = `
        <div class="team-item responder-item">
            <select name="responder[]" class="required" required>${responderOptions()}</select>
            <button type="button" class="add-btn" onclick="addResponder()" title="Add responder">+</button>
        </div>`;

    document.querySelectorAll(".required-empty").forEach(el => el.classList.remove("required-empty"));
    document.querySelectorAll(".check-required-empty").forEach(el => el.classList.remove("check-required-empty"));
}
