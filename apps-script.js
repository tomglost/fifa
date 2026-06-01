// ─── FIFA TOURNAMENT — Google Apps Script Backend ─────────────────────────────
// Paste this entire file into your Google Apps Script editor (script.google.com)
// then Deploy > New Deployment > Web App (Anyone can access, execute as Me)

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Results");
  const data = JSON.parse(e.postData.contents);

  const { matchId, homeGoals, awayGoals, clear } = data;

  // Find existing row for this matchId
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === matchId) {
      rowIndex = i + 1; // 1-indexed
      break;
    }
  }

  if (clear) {
    // Delete the row if it exists
    if (rowIndex > -1) {
      sheet.deleteRow(rowIndex);
    }
  } else {
    if (rowIndex > -1) {
      // Update existing row
      sheet.getRange(rowIndex, 2).setValue(homeGoals);
      sheet.getRange(rowIndex, 3).setValue(awayGoals);
    } else {
      // Append new row
      sheet.appendRow([matchId, homeGoals, awayGoals]);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional: GET handler to verify the script is deployed
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "FIFA Tournament backend running" }))
    .setMimeType(ContentService.MimeType.JSON);
}
