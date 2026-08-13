const MAIN_HEADERS = [
  "SITREP #", "Recorded At", "Call Date", "Call Time",
  "Nature of Incident", "Assigned Team", "Shift-In-Charge (SIC)", "Operator in Charge",
  "Dispatched Resources", "Incident Caller / Informant", "Contact No.",
  "Dispatched Time", "Arrival at Scene", "Take Off from Scene", "Arrival at Hospital",
  "Barangay", "Municipality", "Patient", "Age", "Address", "Injuries", "Victim Status",
  "Initial Impression", "Disposition", "PCR By", "Involved Vehicle Type",
  "First Aid Provided", "Remarks", "Drivers", "Responders", "Photos"
];

const LOG_SHEET_NAME = "Responder Log";
const LOG_HEADERS = ["SITREP #", "Recorded At", "Call Date", "Nature of Incident", "Name", "Role"];

const SUBMISSION_IDS_KEY = "SITREP_SUBMISSION_IDS";
const SUBMISSION_ID_LIMIT = 50;

function doPost(e) {
  let submissionId = "";
  try {
    const data = JSON.parse(e.postData.contents);
    submissionId = data.submissionId || "";

    // Return early for a repeat of an already-processed submission (e.g. a
    // lost-response retry) so the record is never saved twice.
    if (recentlySubmitted(submissionId)) {
      return jsonOut({ ok: true, duplicate: true });
    }

    const sheet = getMainSheet();

    ensureMainHeader(sheet);
    const sitrepNo = nextSitrepNo(sheet);

    const patients = (data.patients || []).map(p => p.patient).join("; ");
    const ages = (data.patients || []).map(p => p.age).join("; ");
    const addresses = (data.patients || []).map(p => p.address).join("; ");
    const injuries = (data.patients || []).map(p => p.injury).join("; ");
    const victimStatuses = (data.patients || []).map(p => p.victimStatus).join("; ");
    const initialImpressions = (data.patients || []).map(p => p.initialImpression).join("; ");
    const dispositions = (data.patients || []).map(p => p.disposition).join("; ");
    const pcrBy = (data.patients || []).map(p => p.pcrBy).join("; ");

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
      initialImpressions, dispositions, pcrBy, (data.vehicleType || []).join(", "),
      data.firstAid, data.remarks,
      (data.drivers || []).join(", "),
      (data.responders || []).join(", "),
      photoLinks.join("\n")
    ]);

    logPersonnel(sitrepNo, data);

    return jsonOut({ ok: true });
  } catch (err) {
    if (submissionId) forgetSubmission(submissionId);
    return jsonOut({ ok: false, error: String(err) });
  }
}

// Ensures the main sheet has a proper header row:
//  - an empty sheet gets the full MAIN_HEADERS row;
//  - a legacy sheet (headers present but no SITREP # column) gets the column
//    inserted in front;
//  - a sheet whose header row is missing or corrupted gets a header row
//    inserted above the existing data (data is preserved, not overwritten).
function ensureMainHeader(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(MAIN_HEADERS);
    return;
  }
  if (String(sheet.getRange(1, 1).getValue()) === "SITREP #") return;

  // Legacy sheet: header exists but was created before the SITREP # column.
  const row1 = sheet.getRange(1, 1, 1, MAIN_HEADERS.length).getValues()[0].map(String);
  if (row1.join("\u0001") === MAIN_HEADERS.slice(1).join("\u0001")) {
    sheet.insertColumnBefore(1);
    sheet.getRange(1, 1).setValue("SITREP #");
    return;
  }

  // Header row is missing or corrupted — insert a header row above the data.
  sheet.insertRowBefore(1);
  sheet.getRange(1, 1, 1, MAIN_HEADERS.length).setValues([MAIN_HEADERS]);
}

// One-time helper to repair the main sheet's header row (run from the Apps
// Script editor). Existing records are preserved below the inserted header.
function repairMainSheet() {
  const sheet = getMainSheet();
  ensureMainHeader(sheet);
}

// Returns the next sequential number for the current year, e.g. "2026-001".
// The counter is cached in script properties (guarded by a lock) so the sheet
// only needs to be scanned once per year instead of on every upload.
function nextSitrepNo(sheet) {
  const year = new Date().getFullYear();
  const props = PropertiesService.getScriptProperties();
  const key = "SITREP_COUNT_" + year;
  const lock = LockService.getScriptLock();

  // The sheet is the source of truth: if all records for the year were cleared,
  // the count restarts at 001 instead of continuing from the stale cache.
  const sheetMax = maxSitrepNoInSheet(sheet, year);

  let locked = false;
  try { locked = lock.tryLock(10000); } catch (e) { locked = false; }

  let last;
  if (locked) {
    try {
      last = Number(props.getProperty(key) || 0);
      if (sheetMax === 0) {
        last = 0;
      } else if (last < sheetMax) {
        last = sheetMax;
      }
      last += 1;
      props.setProperty(key, String(last));
    } finally {
      lock.releaseLock();
    }
  } else {
    last = sheetMax + 1;
  }

  return year + "-" + String(last).padStart(3, "0");
}

// Scans the SITREP # column for the highest number in the given year.
function maxSitrepNoInSheet(sheet, year) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let max = 0;
  for (const row of values) {
    const m = /^(\d{4})-(\d+)$/.exec(String(row[0] || ""));
    if (m && Number(m[1]) === year) max = Math.max(max, Number(m[2]));
  }
  return max;
}

// Records a submission id and returns true if it was already seen (i.e. this
// submission was processed before). A capped list of recent ids is kept in
// script properties so repeat saves are blocked without storing anything in the
// sheet itself.
function recentlySubmitted(id) {
  if (!id) return false;
  const lock = LockService.getScriptLock();
  let locked = false;
  try { locked = lock.tryLock(10000); } catch (e) { locked = false; }
  if (!locked) return false;

  try {
    const props = PropertiesService.getScriptProperties();
    let ids = readSubmissionIds(props);
    if (ids.indexOf(id) !== -1) return true;
    ids.push(id);
    if (ids.length > SUBMISSION_ID_LIMIT) {
      ids = ids.slice(ids.length - SUBMISSION_ID_LIMIT);
    }
    props.setProperty(SUBMISSION_IDS_KEY, JSON.stringify(ids));
    return false;
  } finally {
    lock.releaseLock();
  }
}

// Removes a submission id so a failed save can be retried instead of being
// treated as a duplicate.
function forgetSubmission(id) {
  if (!id) return;
  const lock = LockService.getScriptLock();
  let locked = false;
  try { locked = lock.tryLock(10000); } catch (e) { locked = false; }
  if (!locked) return;

  try {
    const props = PropertiesService.getScriptProperties();
    const ids = readSubmissionIds(props);
    const i = ids.indexOf(id);
    if (i !== -1) {
      ids.splice(i, 1);
      props.setProperty(SUBMISSION_IDS_KEY, JSON.stringify(ids));
    }
  } finally {
    lock.releaseLock();
  }
}

function readSubmissionIds(props) {
  const raw = props.getProperty(SUBMISSION_IDS_KEY);
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw);
    return Array.isArray(ids) ? ids : [];
  } catch (e) {
    return [];
  }
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

// Finds the main SITREP sheet (the one with the "SITREP #" header). The
// Responder Log sheet is skipped even though its header also starts with
// "SITREP #". Falls back to the first non-log sheet, creating a fresh one if
// none exists.
function getMainSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  for (const s of sheets) {
    if (s.getSheetName() !== LOG_SHEET_NAME && String(s.getRange(1, 1).getValue()) === "SITREP #") return s;
  }
  for (const s of sheets) {
    if (s.getSheetName() !== LOG_SHEET_NAME) return s;
  }
  return ss.insertSheet("Sheet1");
}

// Reads every row of the main sheet into an array of objects keyed by header.
// The header row is repaired first if it is missing or corrupted.
function listSitreps() {
  const sheet = getMainSheet();
  ensureMainHeader(sheet);
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
// viewable links. Files are stored under a sub-folder named after the upload
// date ("MM-DD-YYYY") and named "MM-DD_SITREP#_N.jpg"
// (e.g. 08-11_2026-001_1.jpg). Files are private; the front-end serves them
// through the ?action=photo endpoint so they don't need to be publicly shared.
function savePhotos(photos, sitrepNo, callDate) {
  if (!photos || !photos.length) return [];

  const folder = getPhotosFolder();

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
      return file.getUrl();
    } catch (err) {
      return "";
    }
  });

  return links;
}

// Resolves the "SITREP Photos" folder plus the "MM-DD-YYYY" sub-folder for the
// current upload date. Both ids are cached in script properties so the root
// lookup and each day's sub-folder are only created/found once.
function getPhotosFolder() {
  const props = PropertiesService.getScriptProperties();

  let root;
  const rootId = props.getProperty("SITREP_PHOTO_FOLDER_ID");
  if (rootId) {
    try { root = DriveApp.getFolderById(rootId); } catch (e) { /* look up again */ }
  }
  if (!root) {
    const folders = DriveApp.getFoldersByName("SITREP Photos");
    root = folders.hasNext() ? folders.next() : DriveApp.createFolder("SITREP Photos");
    props.setProperty("SITREP_PHOTO_FOLDER_ID", root.getId());
  }

  ensurePhotoFolderShared(root, props);

  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const dateKey = pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + "-" + now.getFullYear();

  const subKey = "SITREP_PHOTO_SUBFOLDER_" + dateKey;
  const subId = props.getProperty(subKey);
  if (subId) {
    try { return DriveApp.getFolderById(subId); } catch (e) { /* create again */ }
  }

  const subs = root.getFoldersByName(dateKey);
  const sub = subs.hasNext() ? subs.next() : root.createFolder(dateKey);
  props.setProperty(subKey, sub.getId());
  return sub;
}

// Shares the root "SITREP Photos" folder with "Anyone with the link can view",
// so every photo (current and future) is viewable/downloadable via its link.
// This runs one time instead of once per photo. A failure to share never
// blocks a save; the app still serves photos through the ?action=photo endpoint.
function ensurePhotoFolderShared(folder, props) {
  if (!folder) return;
  if (props.getProperty("SITREP_PHOTO_FOLDER_SHARED")) return;
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    props.setProperty("SITREP_PHOTO_FOLDER_SHARED", "true");
  } catch (err) {
    console.warn("Photo folder sharing failed: " + String(err));
  }
}
