const MAIN_HEADERS = [
  "SITREP #", "Recorded At", "Call Date", "Call Time",
  "Nature of Incident", "Assigned Team", "Shift-In-Charge (SIC)", "Operator in Charge",
  "Dispatched Resources", "Incident Caller / Informant", "Contact No.",
  "Dispatched Time", "Arrival at Scene", "Take Off from Scene", "Arrival at Hospital",
  "Barangay", "Municipality", "Patient", "Age", "Address", "Injuries", "Victim Status",
  "Initial Impression", "Disposition", "Involved Vehicle Type",
  "First Aid Provided", "Remarks", "Drivers", "Responders", "Photos"
];

const LOG_SHEET_NAME = "Responder Log";
const LOG_HEADERS = ["SITREP #", "Recorded At", "Call Date", "Nature of Incident", "Name", "Role"];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    ensureMainHeader(sheet);
    const sitrepNo = nextSitrepNo(sheet);

    const patients = (data.patients || []).map(p => p.patient).join("; ");
    const ages = (data.patients || []).map(p => p.age).join("; ");
    const addresses = (data.patients || []).map(p => p.address).join("; ");
    const injuries = (data.patients || []).map(p => p.injury).join("; ");
    const victimStatuses = (data.patients || []).map(p => p.victimStatus).join("; ");
    const initialImpressions = (data.patients || []).map(p => p.initialImpression).join("; ");
    const dispositions = (data.patients || []).map(p => p.disposition).join("; ");

    const photoLinks = savePhotos(data.photos || [], sitrepNo, data.callDate);

    sheet.appendRow([
      sitrepNo,
      new Date(),
      data.callDate, data.callTime,
      data.nature, data.assignedTeam, data.sic, data.operator,
      (data.resources || []).join(", "),
      data.caller, data.contact,
      data.dispatchedTime, data.arrivalTime, data.takeoffTime, data.hospitalTime,
      data.barangay, data.municipality, patients, ages, addresses, injuries, victimStatuses,
      initialImpressions, dispositions, (data.vehicleType || []).join(", "),
      data.firstAid, data.remarks,
      (data.drivers || []).join(", "),
      (data.responders || []).join(", "),
      photoLinks.join("\n")
    ]);

    logPersonnel(sitrepNo, data);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

// Writes the header row on a fresh sheet, or inserts the SITREP # column into
// a sheet that was created before this column existed.
function ensureMainHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(MAIN_HEADERS);
  } else if (sheet.getRange(1, 1).getValue() !== "SITREP #") {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue("SITREP #");
  }
}

// Returns the next sequential number for the current year, e.g. "2026-001".
function nextSitrepNo(sheet) {
  const year = new Date().getFullYear();
  let max = 0;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    for (const row of values) {
      const m = /^(\d{4})-(\d+)$/.exec(String(row[0] || ""));
      if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
    }
  }
  return year + "-" + String(max + 1).padStart(3, "0");
}

// Appends one row per driver and per responder to the Responder Log sheet so
// each person's participation can be counted and filtered later.
function logPersonnel(sitrepNo, data) {
  const rows = [];
  (data.responders || []).forEach(name => {
    if (name && String(name).trim()) {
      rows.push([sitrepNo, new Date(), data.callDate, data.nature, String(name).trim(), "Responder"]);
    }
  });
  (data.drivers || []).forEach(name => {
    if (name && String(name).trim()) {
      rows.push([sitrepNo, new Date(), data.callDate, data.nature, String(name).trim(), "Driver"]);
    }
  });
  if (!rows.length) return;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let log = ss.getSheetByName(LOG_SHEET_NAME);
  if (!log) log = ss.insertSheet(LOG_SHEET_NAME);
  if (log.getLastRow() === 0) log.appendRow(LOG_HEADERS);

  const startRow = log.getLastRow() + 1;
  log.getRange(startRow, 1, rows.length, LOG_HEADERS.length).setValues(rows);
}

// Endpoint for the front-end: ?action=sitreps returns the main SITREP sheet
// rows; otherwise returns the Responder Log rows (for the stats website).
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "";

    if (action === "sitreps") {
      return jsonOut({ ok: true, rows: listSitreps() });
    }

    if (action === "photo") {
      return servePhoto((e && e.parameter && e.parameter.id) || "");
    }

    const log = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET_NAME);
    if (!log || log.getLastRow() <= 1) return jsonOut({ ok: true, rows: [] });

    const values = log.getRange(2, 1, log.getLastRow() - 1, LOG_HEADERS.length).getValues();
    const rows = values.map(r => ({
      sitrepNo: r[0],
      recordedAt: formatCell("Recorded At", r[1]),
      callDate: r[2],
      nature: r[3],
      name: r[4],
      role: r[5]
    }));
    return jsonOut({ ok: true, rows: rows });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

// Finds the main SITREP sheet (the one with the "SITREP #" header), falling
// back to the active sheet.
function getMainSheet() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (const s of sheets) {
    if (String(s.getRange(1, 1).getValue()) === "SITREP #") return s;
  }
  return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
}

// Reads every row of the main sheet into an array of objects keyed by header.
function listSitreps() {
  const sheet = getMainSheet();
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1) return [];

  const values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  const headers = values[0].map(String);
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = {};
    headers.forEach((h, c) => {
      row[h] = formatCell(h, values[i][c]);
    });
    rows.push(row);
  }
  return rows;
}

// Converts Date cells to display strings in the sheet's timezone so the
// front-end never sees raw ISO timestamps. Time columns become "HH:MM",
// Call Date becomes "YYYY-MM-DD", Recorded At becomes "YYYY-MM-DD HH:MM".
function formatCell(header, value) {
  if (!(value instanceof Date)) return value;
  const pad = n => String(n).padStart(2, "0");
  if (header.indexOf("Time") !== -1) {
    return pad(value.getHours()) + ":" + pad(value.getMinutes());
  }
  if (header === "Call Date") {
    return value.getFullYear() + "-" + pad(value.getMonth() + 1) + "-" + pad(value.getDate());
  }
  if (header === "Recorded At") {
    return value.getFullYear() + "-" + pad(value.getMonth() + 1) + "-" + pad(value.getDate()) +
      " " + pad(value.getHours()) + ":" + pad(value.getMinutes());
  }
  return value;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Serves a Drive photo back as base64 JSON. The web app response includes
// Access-Control-Allow-Origin so the front-end can fetch photos cross-origin
// and draw them on a canvas (drive.google.com thumbnails don't send CORS).
function servePhoto(id) {
  try {
    const file = DriveApp.getFileById(id);
    const blob = file.getBlob();
    return jsonOut({
      ok: true,
      type: blob.getContentType(),
      data: Utilities.base64Encode(blob.getBytes())
    });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

// Saves base64 images into a "SITREP Photos" folder in Drive and returns
// viewable links. Anyone with the link can view the photo. Files are named
// "MM-DD_SITREP#_N.jpg" (e.g. 08-11_2026-001_1.jpg).
function savePhotos(photos, sitrepNo, callDate) {
  if (!photos || !photos.length) return [];

  let folder;
  const folders = DriveApp.getFoldersByName("SITREP Photos");
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder("SITREP Photos");
  }

  const mmdd = (callDate || "").slice(5) || "";

  const links = photos.map(function (p, i) {
    try {
      const name = (mmdd && sitrepNo)
        ? mmdd + "_" + sitrepNo + "_" + (i + 1) + ".jpg"
        : ("photo_" + (i + 1) + ".jpg");
      const blob = Utilities.newBlob(
        Utilities.base64Decode(p.data),
        p.type || "image/jpeg",
        name
      );
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return file.getUrl();
    } catch (err) {
      return "";
    }
  });

  return links;
}
