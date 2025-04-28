function testInitializeActiveSheet() {
  var groupEmail = "test.group@ccc-munich.org";
  initializeActiveSheet(groupEmail);
}

// Enum-like object
const SyncStatus = {
  SYNCED: 'Synced',
  SYNCING: 'Syncing',
  OUTDATED: 'Pending Update'
}

// Define the levels for each role
const colors = {
  Synced: '#d9ead3',
  Syncing: '#c9daf8',
  Outdated: '#fff2cc',
  Error: '#f4cccc',
  Header: '#cccccc'
}

// Define the levels for each role
const icons = {
  Synced: '✅',
  Syncing: '🔄',
  Outdated: '⚠️'
}

function setHeaderCell(sheet, range, value) {
    cell = sheet.getRange(range);
    cell.setValue(value);
    cell.setBackground(colors.Header);
    cell.setFontWeight('bold');
}

function roleMemberValidationRule() {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(['MEMBER', 'MANAGER', 'OWNER'], true) // Dropdown options
    .setAllowInvalid(false) // Optionally, set to false to disallow invalid entries
    .build();
}

function emailValidationRule() {
  return SpreadsheetApp.newDataValidation()
    .requireTextIsEmail()
    .build();
}

function setRules(sheet) {
  var range = sheet.getRange("B4:B"); 
  range.setDataValidation(roleMemberValidationRule());

  var range = sheet.getRange("A4:A"); 
  range.setDataValidation(emailValidationRule());
}

function setStatus(sheet, status) {
  cell = sheet.getRange('B2');
  switch (status) {
    case SyncStatus.SYNCED:
      cell.setValue(icons.Synced + status);
      cell.setBackground(colors.Synced);
      return
    case SyncStatus.SYNCING:
      cell.setValue(icons.Syncing + status);
      cell.setBackground(colors.Syncing);
      return
    case SyncStatus.OUTDATED:
      cell.setValue(icons.Outdated + status);
      cell.setBackground(colors.Outdated);
      return
    default:
      const errorMessage = 'Not expected status.';
      throw new TypeError(errorMessage);
  }
}

function onEdit(e) {
  const range = e.range;
  const sheet = e.source.getActiveSheet();

  const row = range.getRow();
  const column = range.getColumn();

  if (row >= 4 && column >= 1 && column <= 2) {
    setStatus(sheet, SyncStatus.OUTDATED);
  }
}

function checkValidEmail(email) {
  // Simple email format validation using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}