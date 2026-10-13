// Backend switch.
//   'gas'   -> Google Apps Script web app + Google Sheets (see backend/README.md). Shared, live data.
//   'local' -> in-browser demo backend (localStorage + IndexedDB). Private sandbox per visitor.
// The UI only ever talks to js/api.js, so neither the UI nor the later swap to SQL changes.
// Append ?backend=local to the page URL to open the sandbox without editing this file.
const forced = new URLSearchParams(location.search).get('backend');
export const CONFIG = {
  backend: forced === 'local' || forced === 'gas' ? forced : 'gas',
  gasUrl: 'https://script.google.com/macros/s/AKfycbyklWJ6Ttcj9gL11yeAIdT0mDv6VzdQgdhVZGR9UquD8Od2JS7gcZ1JOKDourKJcYZD/exec',
  appName: 'FSTP Talent Map',
};
