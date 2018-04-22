const DEFAULT = "Ctrl+Shift+1";

function validate(candidate) {
  let patterns = [
    /^\s*(Alt|Ctrl|Command|MacCtrl)\s*\+\s*(Shift\s*\+\s*)?([A-Z0-9]|Comma|Period|Home|End|PageUp|PageDown|Space|Insert|Delete|Up|Down|Left|Right)\s*$/,
    /^\s*((Alt|Ctrl|Command|MacCtrl)\s*\+\s*)?(Shift\s*\+\s*)?(F[1-9]|F1[0-2])\s*$/, 
    /^(MediaNextTrack|MediaPlayPause|MediaPrevTrack|MediaStop)$/
  ];
  for (let pattern of patterns) {
    if (candidate.match(pattern)) {
      return true;
    }
  }  
  return false;
}

function checkValidity() {
  let shortcut = document.querySelector('#shortcut').value;
  if (validate(shortcut)) {
    document.querySelector('#valid').innerText = "ok";
    document.querySelector('#save').removeAttribute("disabled");
  }
  else {
    document.querySelector('#valid').innerText = "invalid";
    document.querySelector('#save').setAttribute("disabled", "disabled");
  }
}

async function saveOptions(e) {
  let shortcut = document.querySelector('#shortcut').value;

  let isValid = validate(shortcut);

  if (!isValid) return;

  let rv = await browser.storage.local.set({
    "shortcut": shortcut
  });

  if (e) e.preventDefault();
}

async function restoreOptions() {
  var gettingItem = browser.storage.local.get("shortcut");
  return gettingItem.then((res) => {
    let shortcut = res.shortcut;
    document.getElementById('shortcut').value = shortcut || DEFAULT;
    checkValidity();
  });
}

function setKey (key) {
  document.querySelector('#shortcut').value = key;
}

async function reset() {
  document.getElementById('shortcut').value = DEFAULT;
  await browser.storage.local.clear();
  await restoreOptions();
  saveOptions();
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
document.querySelector("#shortcut").addEventListener("input", checkValidity);
document.querySelector("form").addEventListener("change", checkValidity);
document.querySelector("#reset").addEventListener("click", reset);
