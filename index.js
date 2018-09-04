/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";
const DEFAULT = "Ctrl+Shift+1";

/** Global state, stores recent tabs for each window.
  Each entry has a key = window id
  value = {current, last}
  where current is the current tab and last is the previous tab
  */
let recents = new Map();
const debugging = true;

function getMostRecentTab(windowId) {
  debug_log("BEGIN getMostRecentTab");
  if (!recents.has(windowId)) {
    debug_log (`Nothing known about ${windowId}`);
    return; //no info on this window to use
  }

  let oldState = recents.get(windowId);

  debug_log("END getMostRecentTab");
  return oldState.last;
}

function setMostRecentTab(windowId, tabId) {
  // first tab for this window
  if (!recents.has(windowId)) {
    recents.set(windowId, {
      last: tabId,
      current: tabId
    });
    return;
  }

  // subsequent tabs
  let oldState = recents.get(windowId);
  let newState = {
    last: oldState.current,
    current: tabId
  };
  recents.set(windowId, newState);
}

function removeTab(windowId, tabId) {

}


function debug_log(...rest) {
  if (debugging)
    console.log.apply(console, rest);
}

// callback for "go to last tab" shortcut
function shortcutHit() {
  debug_log("shortcutHit() begin");

  // load the current window
  var getting = browser.windows.getCurrent({populate: true});
  getting.then((windowInfo) => {
    if (windowInfo.type != "normal") {
      debug_log (`Current window is of type '${windowInfo.type}', ignoring`);
      return;
    }

    let newTab = getMostRecentTab(windowInfo.id);

    debug_log("Activating tab id ", newTab);
    browser.tabs.update(newTab, {
      active: true
    });

  }, onError);
  
  debug_log("shortcutHit() end");
}

// callback when a tab is activated
function tabActivated(newTabInfo) {
  debug_log("tabActivated(newTabInfo) begin");

  setMostRecentTab(newTabInfo.windowId, newTabInfo.tabId);

  debug_log("tabActivated(newTabInfo) end");
}

// callback when a window is removed
function windowRemoved(windowId) {
  // the window has been destroyed, so we can stop tracking tabs for it
  debug_log(`Window ${windowId} deleted, removing key.`);
  recents.delete(windowId);
}
// on window destroy, remove it from recents
browser.windows.onRemoved.addListener(windowRemoved);

// when a tab is destroyed, take it off the list
function handleTabRemoved(tabId, removeInfo) {
  debug_log("Tab: " + tabId + " is closing");
  debug_log("Window ID: " + removeInfo.windowId);
  debug_log("Window is closing: " + removeInfo.isWindowClosing);  

  // if the whole window is closing, don't bother removing each element cleat it all up at once later
  if (removeInfo.isWindowClosing) return;

  remoteTab(removeInfo.windowId, tabId);
}

browser.tabs.onRemoved.addListener(handleTabRemoved);

// General error handler, logs the error for debugging.
function onError(error) {
  debug_log(`Error: ${error}`);
}

// Hook the keyboard shortcut
browser.commands.onCommand.addListener((command) => {
  switch(command) {
    case "most-recent-tab-command":
      shortcutHit();
      break;
    default:
      debug_log ("onCommand event received unknown message: ", command);
	};
});

function updateFromOptions() {
  var gettingItem = browser.storage.local.get("shortcut");
  return gettingItem.then((res) => {
    let shortcut = res.shortcut || DEFAULT;
    debug_log("Updating command: " + shortcut);

    browser.commands.update({
      name: "most-recent-tab-command",
      shortcut: shortcut
    });
  });
}

browser.storage.onChanged.addListener(updateFromOptions);

// hook tab change to track history
browser.tabs.onActivated.addListener(tabActivated);

// hook the toolbar icon
browser.browserAction.onClicked.addListener(shortcutHit);

// hook the external message API to allow other addons to trigger the action
browser.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {shortcutHit(); return false});

// initialize the state with the current tab for each window
function initAWindow(windowInfoArray) {
  for (let windowInfo of windowInfoArray) {
    let windowId = windowInfo.id;
    let activeTab = windowInfo.tabs.filter((e) => e.active == true);
    if (activeTab.length != 1) {
      debug_log (`Error, no active tab for window ${windowId}`);
      continue;
    }
    let tabId = activeTab[0].id;
    debug_log (`Window ${windowId} has active tab ${tabId}`);

    setMostRecentTab(windowId, tabId);
  }
}

function initWindows() {
  var getting = browser.windows.getAll({
    populate: true,
    windowTypes: ["normal"]
  });
  getting.then(initAWindow, onError);
}

initWindows();
updateFromOptions();

