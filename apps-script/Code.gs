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
    
    if (action === 'getVolunteerReport') {
      return sendJson(getVolunteerReport(e.parameter.volunteerId));
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
  const { date, hours, volunteerIds, missionName } = data;
  
  // Validate inputs
  if (!date || !hours || !volunteerIds || volunteerIds.length === 0 || !missionName) {
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
      
      // Update cell note with mission name
      const existingNote = cell.getNote();
      const newNoteEntry = `• ${missionName} (${hours} ساعة/ساعات)`;
      const updatedNote = existingNote ? `${existingNote}\n${newNoteEntry}` : newNoteEntry;
      cell.setNote(updatedNote);
      
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

// ─── Get Volunteer Report ───────────────────────────────────────────────────
function getVolunteerReport(volunteerId) {
  if (!volunteerId) return { error: 'Missing volunteerId parameter' };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  let totalHours = 0;
  const missions = [];
  const currentYear = new Date().getFullYear();
  
  for (const sheet of sheets) {
    const sheetName = sheet.getName();
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow < DATA_START_ROW || lastCol < FIRST_DAY_COLUMN) continue;
    
    const idRange = sheet.getRange(DATA_START_ROW, ID_COLUMN, lastRow - DATA_START_ROW + 1, 1).getValues();
    let targetRow = -1;
    
    for (let i = 0; i < idRange.length; i++) {
      if (idRange[i][0] && idRange[i][0].toString().trim() === volunteerId.toString().trim()) {
        targetRow = DATA_START_ROW + i;
        break;
      }
    }
    
    if (targetRow === -1) continue;
    
    // Ignore the last column as it contains 'Total Monthly Hours'
    const numDays = lastCol - FIRST_DAY_COLUMN;
    const daysDataRange = sheet.getRange(targetRow, FIRST_DAY_COLUMN, 1, numDays);
    const daysData = daysDataRange.getValues()[0];
    const daysNotes = daysDataRange.getNotes()[0];
    
    for (let j = 0; j < daysData.length; j++) {
      const cellValue = daysData[j];
      const cellHours = parseFloat(cellValue);
      
      if (!isNaN(cellHours) && cellHours > 0) {
        const dayOfMonth = j + 1;
        const dateStr = `${dayOfMonth} ${sheetName} ${currentYear}`;
        const note = daysNotes[j] || '';
        
        const noteLines = note.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const dailyMissions = [];
        
        if (noteLines.length > 0) {
          for (const line of noteLines) {
            const match = line.match(/^•?\s*(.+?)(?:\s*\(\s*([\d.]+)\s*ساعة\/ساعات\s*\))?$/);
            if (match) {
              const mName = match[1].trim();
              const hrs = parseFloat(match[2]) || cellHours;
              dailyMissions.push({ date: dateStr, missionName: mName, hours: hrs });
            } else {
              dailyMissions.push({ date: dateStr, missionName: line, hours: cellHours });
            }
          }
        }
        
        // Push parsed tasks to global missions list
        if (dailyMissions.length > 0) {
          missions.push(...dailyMissions);
        } else {
          // Fallback if there are hours but no notes
          missions.push({ date: dateStr, missionName: 'مهمة غير مسماة', hours: cellHours });
        }
        
        totalHours += cellHours;
      }
    }
  }
  
  return {
    success: true,
    totalHours: totalHours,
    missions: missions
  };
}

// ─── Test Functions (Run from Apps Script editor) ────────────────────────────
function testGetVolunteers() {
  const result = getVolunteers();
  Logger.log(JSON.stringify(result, null, 2));
}

function testLogMission() {
  const result = logMission({
    action: 'logMission',
    missionName: 'مهمة تجريبية',
    date: '2026-03-15',
    hours: 3,
    volunteerIds: ['1', '2', '3']
  });
  Logger.log(JSON.stringify(result, null, 2));
}
