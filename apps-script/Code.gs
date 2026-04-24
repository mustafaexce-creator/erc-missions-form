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

// Arabic month tab names (0-indexed: January=0, February=1, ...)
const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const NAME_COLUMN = 2;     // Column B - الاسم رباعي
const ID_COLUMN = 3;       // Column C - رقم العضوية
const FIRST_DAY_COLUMN = 4; // Column D - first day column
const HEADER_ROW = 2;       // Row 2 has the column headers
const DATA_START_ROW = 3;   // Row 3 is where volunteer data starts

// Helper: get the sheet for a given month index (0-11)
function getMonthSheet(monthIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const targetName = MONTH_NAMES[monthIndex].trim();
  // Try exact match first
  var sheet = ss.getSheetByName(targetName);
  if (sheet) return sheet;
  // Fuzzy match: trim and compare all sheet names
  const allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    if (allSheets[i].getName().trim() === targetName) return allSheets[i];
  }
  return null;
}

// Helper: find the first available month sheet (for loading volunteers)
function getFirstAvailableSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const name of MONTH_NAMES) {
    const sheet = ss.getSheetByName(name);
    if (sheet) return sheet;
  }
  return null;
}

// Convert Western digits to Arabic-Indic digits
function toAr(val) {
  return String(val).replace(/\d/g, function(d) { return '٠١٢٣٤٥٦٧٨٩'[d]; });
}

// Convert 24h time string ("14:00") to 12h Arabic format ("٢:٠٠ م")
function to12h(time24) {
  if (!time24) return '';
  var parts = time24.split(':');
  var h = parseInt(parts[0], 10);
  var m = parts[1];
  var period = h >= 12 ? 'م' : 'ص';
  var hour12 = h % 12 || 12;
  return toAr(hour12) + ':' + toAr(m) + ' ' + period;
}

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
    
    // Debug: list all sheet names in the spreadsheet
    if (action === 'debugSheets') {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const names = ss.getSheets().map(s => s.getName());
      return sendJson({ sheetNames: names, expectedNames: MONTH_NAMES });
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
  const sheet = getFirstAvailableSheet();
  if (!sheet) return { error: 'لا يوجد أي شيت شهر متاح' };
  
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
  const { date, hours, volunteerIds, missionName, timeFrom, timeTo } = data;
  
  // Validate inputs
  if (!date || !hours || !volunteerIds || volunteerIds.length === 0 || !missionName) {
    return { success: false, error: 'بيانات غير مكتملة' };
  }
  
  // Determine the correct month sheet from the mission date
  const missionDate = new Date(date);
  const monthIndex = missionDate.getMonth(); // 0-11
  const sheet = getMonthSheet(monthIndex);
  if (!sheet) return { success: false, error: 'شيت شهر ' + MONTH_NAMES[monthIndex] + ' غير موجود' };
  
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
      
      // Update cell note with mission name and time range
      // Use two lines to avoid BiDi rendering issues in Google Sheets:
      // Line 1: Arabic (mission name + hours)
      // Line 2: Pure LTR (time range)
      const existingNote = cell.getNote();
      let newNoteEntry = `• ${missionName} — ${toAr(hours)} ساعة`;
      if (timeFrom && timeTo) {
        newNoteEntry += `\n  ${to12h(timeFrom)} — ${to12h(timeTo)}`;
      }
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
          var i = 0;
          while (i < noteLines.length) {
            var line = noteLines[i];
            // Normalize Arabic-Indic digits to Western for parsing
            var normLine = line.replace(/[٠-٩]/g, function(d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
            
            // Check if this is a mission header line: • missionName — X ساعة (new format)
            var matchNewFormat = normLine.match(/^•?\s*(.+?)\s*—\s*([\d.]+)\s*ساعة$/);
            if (matchNewFormat) {
              var mName = matchNewFormat[1].trim();
              var hrs = parseFloat(matchNewFormat[2]) || 0;
              var timeRange = '';
              
              // Check if next line is a time range (may have invisible marks or Arabic digits)
              if (i + 1 < noteLines.length) {
                var nextLine = noteLines[i + 1].replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '').trim();
                // Keep original Arabic text for display, just check if it's a time line
                var normNext = nextLine.replace(/[٠-٩]/g, function(d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); });
                var timeMatch = normNext.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|[صم])?)\s*[→—]\s*(\d{1,2}:\d{2}\s*(?:AM|PM|[صم])?)$/);
                if (timeMatch) {
                  timeRange = nextLine; // keep original Arabic display
                  i++; // skip the time line
                }
              }
              
              dailyMissions.push({ date: dateStr, missionName: mName, hours: hrs, timeRange: timeRange });
              i++;
              continue;
            }
            
            // Legacy: • missionName (8:00 AM - 4:00 PM | X ساعة/ساعات)
            var matchWithTime = line.match(/^•?\s*(.+?)\s*\(\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM|[صم]))?)\s*-\s*(\d{1,2}:\d{2}(?:\s*(?:AM|PM|[صم]))?)\s*\|\s*([\d.]+)\s*ساعة\/ساعات\s*\)$/);
            if (matchWithTime) {
              dailyMissions.push({ date: dateStr, missionName: matchWithTime[1].trim(), hours: parseFloat(matchWithTime[4]) || cellHours, timeRange: matchWithTime[2].trim() + ' → ' + matchWithTime[3].trim() });
              i++;
              continue;
            }
            
            // Legacy: • missionName (X ساعة/ساعات)
            var matchOld = line.match(/^•?\s*(.+?)(?:\s*\(\s*([\d.]+)\s*ساعة\/ساعات\s*\))?$/);
            if (matchOld) {
              dailyMissions.push({ date: dateStr, missionName: matchOld[1].trim(), hours: parseFloat(matchOld[2]) || cellHours, timeRange: '' });
            } else {
              dailyMissions.push({ date: dateStr, missionName: line, hours: cellHours, timeRange: '' });
            }
            i++;
          }
        }
        
        // Push parsed tasks to global missions list
        if (dailyMissions.length > 0) {
          missions.push(...dailyMissions);
        } else {
          // Fallback if there are hours but no notes
          missions.push({ date: dateStr, missionName: 'مهمة غير مسماة', hours: cellHours, timeRange: '' });
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

// ─── Clear All Hours & Notes ─────────────────────────────────────────────────
// Run this from the Apps Script editor: Select "clearAllHoursAndNotes" → Run
// It clears ALL day-column values and notes across ALL sheets.
// Volunteer names and IDs are NOT touched.
function clearAllHoursAndNotes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  
  for (const sheet of sheets) {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow < DATA_START_ROW || lastCol < FIRST_DAY_COLUMN) continue;
    
    const numRows = lastRow - DATA_START_ROW + 1;
    const numCols = lastCol - FIRST_DAY_COLUMN + 1;
    
    const range = sheet.getRange(DATA_START_ROW, FIRST_DAY_COLUMN, numRows, numCols);
    range.clearContent();  // clears values
    range.clearNote();     // clears notes
    
    Logger.log('Cleared: ' + sheet.getName() + ' (' + numRows + ' rows × ' + numCols + ' cols)');
  }
  
  SpreadsheetApp.flush();
  Logger.log('✅ Done! All hours and notes have been cleared.');
}
