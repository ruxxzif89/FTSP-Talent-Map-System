// Backend switch.
//   'local' -> in-browser demo backend (localStorage + IndexedDB). Zero setup.
//   'gas'   -> Google Apps Script web app + Google Sheets (see backend/README.md).
// The UI only ever talks to js/api.js, so neither the UI nor the swap to SQL later changes.
export const CONFIG = {
  backend: 'gas',
  gasUrl: 'https://script.google.com/macros/s/AKfycbyklWJ6Ttcj9gL11yeAIdT0mDv6VzdQgdhVZGR9UquD8Od2JS7gcZ1JOKDourKJcYZD/exec',
  appName: 'FSTP Talent Map',
};
