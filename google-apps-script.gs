function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Recorded At", "Call Date", "Call Time",
        "Nature of Incident", "Assigned Team", "Shift-In-Charge (SIC)", "Operator in Charge",
        "Dispatched Resources", "Incident Caller / Informant", "Contact No.",
        "Dispatched Time", "Arrival at Scene", "Take Off from Scene", "Arrival at Hospital",
        "Barangay", "Municipality", "Patient", "Age", "Address", "Injuries", "Victim Status",
        "Initial Impression", "Disposition", "Involved Vehicle Type",
        "First Aid Provided", "Remarks", "Drivers", "Responders"
      ]);
    }

    const patients = (data.patients || []).map(p => p.patient).join("; ");
    const ages = (data.patients || []).map(p => p.age).join("; ");
    const addresses = (data.patients || []).map(p => p.address).join("; ");
    const injuries = (data.patients || []).map(p => p.injury).join("; ");
    const victimStatuses = (data.patients || []).map(p => p.victimStatus).join("; ");
    const initialImpressions = (data.patients || []).map(p => p.initialImpression).join("; ");
    const dispositions = (data.patients || []).map(p => p.disposition).join("; ");

    sheet.appendRow([
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
      (data.responders || []).join(", ")
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
