Most Recent Tab
===============

Firefox extension that adds a keyboard shortcut to switch back to your most recently selected tab. Useful to alternate between two tabs and to easy go back to your last tab if you switch to another briefly.

This is rewrite built on Firefox's new [WebExtensions API](https://hacks.mozilla.org/2017/06/cross-browser-extensions-available-now-in-firefox/), replacing the old Addon SDK version.

It's distributed via the [Firefox addons.mozilla.org site](https://addons.mozilla.org/firefox/addon/most-recent-tab/).

To trigger the action programmatically from another addon, you can do so using the [browser.runtime.sendMessage](https://developer.mozilla.org/Add-ons/WebExtensions/API/runtime/sendMessage) API ([sample code](https://gist.github.com/thePaulV/df47bb3a086f027f2301c662baf78e6a));

The code is licensed under the Mozilla Public License 2.0.
