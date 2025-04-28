// See docs https://developers.google.com/apps-script/guides/dialogs
function onIntall(e) {
  onOpen(e)
}

function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addItem("Initialize", "onInitialize")
    .addItem("Pull", "onPull")
    .addItem("Push", "onPush")
    .addToUi();
}

function onInitialize() {
  var ui = SpreadsheetApp.getUi(); // Same variations.

  if (checkIfInitialized()) {
    ui.alert(
      "Already Initialized",
      "This sheet is already initialzied, please use 'Pull' to sync group list.",
      ui.ButtonSet.OK,
    )
    return
  };

  var result = ui.prompt(
    "Initialize Sync",
    "Please enter the group email you want to sync with this sheet:",
    ui.ButtonSet.OK_CANCEL,
  );

  // Process the user's response.
  var button = result.getSelectedButton();
  var text = result.getResponseText();
  if (button == ui.Button.OK) {
    // User clicked "OK".
    
    // Safe check for missing or empty input
    const isEmailMissing = !text;

    if (isEmailMissing) {
      const errorMessage = "Group email is required. Please enter a valid email.";
      ui.alert("Invalid Input", errorMessage, ui.ButtonSet.OK);
      return;
    }

    if (!checkValidEmail(text)) {
      const errorMessage = `"${text}" is not a valid email address. Please enter a valid email.`;
      ui.alert("Invalid Input", errorMessage, ui.ButtonSet.OK);
      return;
    }

    try {
      initializeActiveSheet(text);
    } catch (error) {
      ui.alert("Initialization Failed", error.message, ui.ButtonSet.OK);
      return;
    }
  } else if (button == ui.Button.CANCEL) {
    // User clicked "Cancel".
    // Do nothing
    return;
  } else if (button == ui.Button.CLOSE) {
    // User clicked X in the title bar.
    // Do nothing
    return;
  }
}

function onPull() {
  var ui = SpreadsheetApp.getUi(); // Same variations.

  if (!checkIfInitialized()) {
    ui.alert(
      "Not Initialized",
      "This sheet is not initialzied, please use 'Initialize' to set up a group conenction.",
      ui.ButtonSet.OK,
    )
    return;
  };

  try {
    pullGroupInfoInActiveSheet();
  } catch (error) {
    ui.alert("Pull Failed", error.message, ui.ButtonSet.OK);
    return;
  }
}

function onPush() {
  var ui = SpreadsheetApp.getUi(); // Same variations.
  
  if (!checkIfInitialized()) {
    ui.alert(
      "Not Initialized",
      "This sheet is not initialzied, please use 'Initialize' to set up a group conenction.",
      ui.ButtonSet.OK,
    )
    return;
  };
  try {
    checkIfValid();
    pushGroupInfoInActiveSheet();
  } catch (error) {
    ui.alert("Push Failed", error.message, ui.ButtonSet.OK);
    return;
  }
}
