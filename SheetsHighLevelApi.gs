function checkIfInitialized() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  const cellA1Set = (sheet.getRange('A1').getValue() === 'Group Email');
  const cellA2Set = (sheet.getRange('A2').getValue()) !== "";
  const cellB1Set = (sheet.getRange('B1').getValue()) === 'Status';

  const cellA3Set = (sheet.getRange('A3').getValue()) === 'Member Email';
  const cellB3Set = (sheet.getRange('B3').getValue()) === 'Role';

  return cellA1Set && cellA2Set && cellB1Set && cellA3Set && cellB3Set
}

function checkIfValid() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const lastRow = sheet.getLastRow(); // Get the last row with data in the sheet

  // Only check from row 4 onwards
  if (lastRow < 4) {
    const errorMessage = 'This sheet is not initialized. Therefore, cannot check if it is valid.';
    throw new Error(errorMessage);
  }

  // Get values from column A and B starting from row 4
  const range = sheet.getRange(4, 1, lastRow - 3, 2); // (startRow, startCol, numRows, numCols)
  const values = range.getValues(); // 2D array: [[A4,B4], [A5,B5], ...]

  let violations = [];

  for (let i = 0; i < values.length; i++) {
    const rowNumber = i + 4;

    // If one of A / B has value
    const valA = values[i][0];
    const valB = values[i][1];

    if (!checkValidEmail(valA)) {
      violations.push(`Row ${rowNumber}: A = "${valA}" is not valid email.`);
      continue;
    }

    if (!['MEMBER', 'MANAGER', 'OWNER'].includes(valB)) {
      violations.push(`Row ${rowNumber}: B = "${valB}" is not in ['MEMBER', 'MANAGER', 'OWNER'].`);
      continue;
    }

    const hasA = valA !== "" && valA !== null;
    const hasB = valB !== "" && valB !== null;
    if ((hasA && !hasB) || (!hasA && hasB)) {
      violations.push(`Row ${rowNumber}: A = "${valA}", B = "${valB}"`);
    }
  }

  if (violations.length === 0) {
    // ✅ No validation violations found. 
    return
  } else {
    const errorMessage = `❌ Validation violations in the following rows:\n\n${violations.join('\n')}`;
    throw new Error(errorMessage);
  }
}

function initializeActiveSheet(groupEmail) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const reservedColumns = 2;

  // Set reservedColumns protected
  const protection = sheet.getRange(1, 1, 3, reservedColumns).protect().setDescription('Protected Area');
  protection.setWarningOnly(true); // This shows a warning instead of blocking
  
  // Set the value for the first 2 rows
  setHeaderCell(sheet, 'A1', 'Group Email');
  sheet.getRange('A2').setValue(groupEmail);

  setHeaderCell(sheet, 'B1', 'Status');

  // Set the value for the 3rd row
  setHeaderCell(sheet, 'A3', 'Member Email');
  setHeaderCell(sheet, 'B3', 'Role');

  sheet.setFrozenColumns(reservedColumns);

  // set rules for sheet
  setRules(sheet);

  setStatus(sheet, SyncStatus.SYNCING);
  const groupId = lookupGroupIdByGroupEmail(groupEmail);
  const memberships = listMembershipsByGroupId(groupId);

  for (let i = 0; i < memberships.length; i++) {
    memberEmail = memberships[i]['preferredMemberKey']['id'];
    sheet.getRange(`A${4+i}`).setValue(memberEmail);
    roles = memberships[i]['roles'];
    const highestRole = getHighestRole(roles);
    sheet.getRange(`B${4+i}`).setValue(highestRole);
  }

  sheet.autoResizeColumn(1);

  setStatus(sheet, SyncStatus.SYNCED);
}

function pullGroupInfoInActiveSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  setStatus(sheet, SyncStatus.SYNCING);
  
  const groupEmail = sheet.getRange('A2').getValue();
  const groupId = lookupGroupIdByGroupEmail(groupEmail);
  const memberships = listMembershipsByGroupId(groupId);

  let rowCount = 4;
  let memberEmail = sheet.getRange(`A${rowCount}`).getValue();
  while(memberEmail !== "") {
    const memberEmailIndex = memberships.findIndex(item => item.preferredMemberKey?.id === memberEmail);
    
    if (memberEmailIndex === -1) {
      // Item does not exists
      sheet.deleteRow(rowCount);
      memberEmail = sheet.getRange(`A${rowCount}`).getValue();
    } else {
      // Item exists
      const poppedMembership = memberships.splice(memberEmailIndex, 1)[0];
      sheet.getRange(`A${rowCount}`).setValue(memberEmail);
      roles = poppedMembership['roles'];
      const highestRole = getHighestRole(roles);
      sheet.getRange(`B${rowCount}`).setValue(highestRole);
      rowCount = rowCount + 1;
      memberEmail = sheet.getRange(`A${rowCount}`).getValue();
    }
  }

  for (let i = 0; i < memberships.length; i++) {
    memberEmail = memberships[i]['preferredMemberKey']['id'];
    roles = memberships[i]['roles'];
    sheet.getRange(`A${rowCount+i}`).setValue(memberEmail);
    const highestRole = getHighestRole(roles);
    sheet.getRange(`B${rowCount+i}`).setValue(highestRole);
  }

  // remove additional rows after (include) rowCount + memberships.length
  const lastRow = sheet.getLastRow();
  
  if (lastRow >= rowCount + memberships.length) {
    const range = sheet.getRange(rowCount + memberships.length, 1, lastRow - (rowCount + memberships.length) + 1, 2);
    range.clearContent();  // Clears only the content of the selected range
  }
  
  sheet.autoResizeColumn(1);
  setStatus(sheet, SyncStatus.SYNCED);
}

function pushGroupInfoInActiveSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  setStatus(sheet, SyncStatus.SYNCING);
  
  const groupEmail = sheet.getRange('A2').getValue();
  const groupId = lookupGroupIdByGroupEmail(groupEmail);
  const memberships = listMembershipsByGroupId(groupId);

  let processedMembershipNames = [];

  const columnValues = sheet.getRange(4, 1, sheet.getLastRow() - 4 + 1, 2).getValues();

  for (let i = 0; i < columnValues.length; i++) {
    userEmail = columnValues[i][0];
    userHighestRole = columnValues[i][1];
    membership = filterMembershipsByEmail(memberships, userEmail);
    if (membership === null) {
      // We will add the user
      result = addUserToGroup(groupId, userEmail, userHighestRole);
      processedMembershipNames.push(result.name);
    } else {
      // The user is already added, we update its role
      // (if the role does not change, it will be ignored within following function)
      updateUserRoleFromGroup(membership.name, membership.roles, userHighestRole);
      processedMembershipNames.push(membership.name);
    }
  }

  // remove users from memberships
  let membershipsToRemove = memberships.filter(x => !processedMembershipNames.includes(x.name));
  
  for (let i = 0; i < membershipsToRemove.length; i++) {
    membership = membershipsToRemove[i];
    deleteUserFromGroup(membership.name);
  }

  setStatus(sheet, SyncStatus.SYNCED);
}