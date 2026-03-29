/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ERC Missions Form — Google Apps Script Backend
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Delete any existing code in Code.gs
 * 4. Paste this entire file
 * 5. Click "Deploy" → "New deployment"
 * 6. Choose type: "Web app"
 * 7. Set "Execute as": Me
 * 8. Set "Who has access": Anyone
 * 9. Click "Deploy" and copy the URL
 * 10. Paste the URL in your React app's APPS_SCRIPT_URL constant
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Configuration ───────────────────────────────────────────────────────────
const SHEET_NAME = 'مارس'; // Change this to match the active month tab name
const NAME_COLUMN = 2;     // Column B - الاسم رباعي
const ID_COLUMN = 3;       // Column C - رقم العضوية
const FIRST_DAY_COLUMN = 4; // Column D - first day column (1-مارس-2026)
const HEADER_ROW = 2;       // Row 2 has the column headers
const DATA_START_ROW = 3;   // Row 3 is where volunteer data starts

// ─── GET Handler — Returns volunteer list ────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'getVolunteers') {
      return sendJson(getVolunteers());
    }
    
    return sendJson({ error: 'Unknown action' });
  } catch (err) {
    return sendJson({ error: err.message });
  }
}

// ─── POST Handler — Logs mission hours ───────────────────────────────────────
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'logMission') {
      return sendJson(logMission(data));
    }
    
    return sendJson({ error: 'Unknown action' });
  } catch (err) {
    return sendJson({ error: err.message });
  }
}

// ─── Get All Volunteers ──────────────────────────────────────────────────────
function getVolunteers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { error: 'Sheet not found: ' + SHEET_NAME };
  
  const lastRow = sheet.getLastRow();
  if (lastRow < DATA_START_ROW) return { volunteers: [] };
  
  const numRows = lastRow - DATA_START_ROW + 1;
  const nameRange = sheet.getRange(DATA_START_ROW, NAME_COLUMN, numRows, 1).getValues();
  const idRange = sheet.getRange(DATA_START_ROW, ID_COLUMN, numRows, 1).getValues();
  
  const volunteers = [];
  for (let i = 0; i < numRows; i++) {
    const name = nameRange[i][0];
    const id = idRange[i][0];
    if (name && id) {
      volunteers.push({
        name: name.toString().trim(),
        id: id.toString().trim()
      });
    }
  }
  
  return { volunteers: volunteers };
}

// ─── Log Mission Hours ──────────────────────────────────────────────────────
function logMission(data) {
  const { date, hours, volunteerIds } = data;
  
  // Validate inputs
  if (!date || !hours || !volunteerIds || volunteerIds.length === 0) {
    return { success: false, error: 'بيانات غير مكتملة' };
  }
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return { success: false, error: 'الجدول غير موجود: ' + SHEET_NAME };
  
  // Parse the date to find the correct day column
  const missionDate = new Date(date);
  const dayOfMonth = missionDate.getDate();
  
  // The day column is: FIRST_DAY_COLUMN + (dayOfMonth - 1)
  // e.g., Day 1 is Column D (4), Day 2 is Column E (5), etc.
  const dayColumn = FIRST_DAY_COLUMN + (dayOfMonth - 1);
  
  // Verify the column exists
  const lastColumn = sheet.getLastColumn();
  if (dayColumn > lastColumn) {
    return { success: false, error: 'عمود اليوم ' + dayOfMonth + ' غير موجود في الجدول' };
  }
  
  // Build a map of volunteer ID → row number
  const lastRow = sheet.getLastRow();
  const numRows = lastRow - DATA_START_ROW + 1;
  const idRange = sheet.getRange(DATA_START_ROW, ID_COLUMN, numRows, 1).getValues();
  
  const idToRow = {};
  for (let i = 0; i < numRows; i++) {
    const id = idRange[i][0].toString().trim();
    idToRow[id] = DATA_START_ROW + i;
  }
  
  // Update hours for each volunteer
  let updated = 0;
  const notFound = [];
  
  for (const vid of volunteerIds) {
    const row = idToRow[vid.toString().trim()];
    if (row) {
      // Get existing value and ADD to it (accumulate hours)
      const cell = sheet.getRange(row, dayColumn);
      const existingValue = cell.getValue();
      const currentHours = (typeof existingValue === 'number') ? existingValue : 0;
      cell.setValue(currentHours + parseFloat(hours));
      updated++;
    } else {
      notFound.push(vid);
    }
  }
  
  // Flush all changes
  SpreadsheetApp.flush();
  
  const result = {
    success: true,
    updated: updated,
    total: volunteerIds.length,
    message: 'تم تسجيل ' + hours + ' ساعة لـ ' + updated + ' متطوع'
  };
  
  if (notFound.length > 0) {
    result.warnings = 'لم يتم العثور على: ' + notFound.join(', ');
  }
  
  return result;
}

// ─── Helper: Send JSON Response ─────────────────────────────────────────────
function sendJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Test Functions (Run from Apps Script editor) ────────────────────────────
function testGetVolunteers() {
  const result = getVolunteers();
  Logger.log(JSON.stringify(result, null, 2));
}

function testLogMission() {
  const result = logMission({
    date: '2026-03-15',
    hours: 3,
    volunteerIds: ['1', '2', '3']
  });
  Logger.log(JSON.stringify(result, null, 2));
}
