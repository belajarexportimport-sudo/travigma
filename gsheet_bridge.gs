/**
 * TRAVIGMA - GSHEET BRIDGE
 * 
 * Instructions:
 * 1. Open a Google Sheet.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any code and paste this script.
 * 4. Click 'Save' and name it 'TravigmaBridge'.
 * 5. Click 'Deploy' > 'New Deployment'.
 * 6. Select Type: 'Web App'.
 * 7. Execute as: 'Me'.
 * 8. Who has access: 'Anyone'.
 * 9. Click 'Deploy' and Copy the 'Web App URL'.
 */

const SHEET_NAME = "Database";

function onOpen() {
  setup();
}

/**
 * Setup the spreadsheet: create the Database sheet if not exists.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["ID", "Type", "Date", "Client", "Amount", "Data"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#1a2b4a").setFontColor("white");
    sheet.setFrozenRows(1);
  }
}

/**
 * Handle POST request (Push data)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      setup();
      sheet = ss.getSheetByName(SHEET_NAME);
    }
    
    // Check if ID already exists (for update)
    const ids = sheet.getRange("A:A").getValues().flat();
    const rowIndex = ids.indexOf(data.id);
    
    const rowData = [
      data.id,
      data.type,
      new Date(),
      data.client,
      data.amount,
      JSON.stringify(data.fullData)
    ];
    
    if (rowIndex !== -1) {
      // Update existing row (index is 0-based, sheet rows are 1-based)
      sheet.getRange(rowIndex + 1, 1, 1, 6).setValues([rowData]);
    } else {
      // Add new row
      sheet.appendRow(rowData);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", id: data.id }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle GET request (Pull data)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    
    const vals = sheet.getDataRange().getValues();
    const headers = vals.shift();
    
    const result = vals.map(row => {
      return {
        id: row[0],
        type: row[1],
        date: row[2],
        client: row[3],
        amount: row[4],
        fullData: JSON.parse(row[5] || "{}")
      };
    });
    
    return ContentService.createTextOutput(JSON.stringify(result.reverse())) // Recent first
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
