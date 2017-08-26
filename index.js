/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Initial Developer of the Original Code is: Paul Vet
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

let recents = new Map();

// callback for "go to last tab" shortcut
function shortcutHit() {
  console.log("shortcutHit() begin");

  // load the current window
  var getting = browser.windows.getCurrent({populate: true});
  getting.then((windowInfo) => {
    if (windowInfo.type != "normal") {
      console.log (`Current window is of type '${windowInfo.type}', ignoring`);
      return;
    }

    if (!recents.has(windowInfo.id)) {
      console.log (`Nothing known about ${windowInfo.id}`);
      return; //no info on this window to use
    }

    let oldState = recents.get(windowInfo.id);

    console.log("Activating tab id ", oldState.last);
    browser.tabs.update(oldState.last,{
      active: true
    });

  }, onError);
  
  console.log("shortcutHit() end");
}

// callback when a tab is activated
function tabActivated(newTabInfo) {
  console.log("tabActivated(newTabInfo) begin");
  // first tab for this window
  if (!recents.has(newTabInfo.windowId)) {
    recents.set(newTabInfo.windowId, {
      last: newTabInfo.tabId,
      current: newTabInfo.tabId
    });
    return;
  }

  // subsequent tabs
  let oldState = recents.get(newTabInfo.windowId);
  let newState = {
    last: oldState.current,
    current: newTabInfo.tabId
  };
  recents.set(newTabInfo.windowId, newState);
  console.log("tabActivated(newTabInfo) end");
}

// callback when a window is removed
function windowRemoved(windowId) {
  // the window has been destroyed, so we can stop tracking tabs for it
  console.log(`Window ${windowId} deleted, removing key.`);
  recents.delete(windowId);
}


// General error handler, logs the error for debugging.
function onError(error) {
  console.log(`Error: ${error}`);
}

// Hook the keyboard shortcut
browser.commands.onCommand.addListener((command) => {
  switch(command) {
    case "most-recent-tab-command":
      shortcutHit();
      break;
    default:
      console.log ("onCommand event received unknown message: ", command);
	};
});

// hook tab change to track history
browser.tabs.onActivated.addListener(tabActivated);

// on window destroy, remove it from recents
browser.windows.onRemoved.addListener(windowRemoved);

// hook the toolbar icon
browser.browserAction.onClicked.addListener(shortcutHit);
