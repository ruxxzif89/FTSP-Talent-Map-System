# Apps Script backend (Google Sheets database)

Your spreadsheet: `1LFZkj30JrlinLjcabWfZ-yEcO08EVwcDt2MPR0prRF0` (hard-coded as `SPREADSHEET_ID` in `Code.gs`).

## One-time setup

1. Open the spreadsheet → **Extensions → Apps Script** (this must be the script behind your `/exec` URL).
2. Replace the contents of `Code.gs` with [`Code.gs`](Code.gs) from this folder. Save.
3. In the function dropdown pick **`setup`** → **Run**. Approve the permission prompts (Sheets, Drive, external-request not needed).
   This creates all 12 tabs with headers (`users`, `lecturers`, `expertise_categories`, `expertise`, `research`, `publications`, `certifications`, `training`, `consultancy`, `achievements`, `documents`, `activity_log`), seeds 12 expertise categories and the first admin (`admin` / `Admin@123`), and creates a Drive folder `FSTP_Talent_Map_Files` for uploads.
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** Execute as **Me**, access **Anyone**. The URL stays the same.
5. Check it: open the `/exec` URL in a browser — you should see `{"ok":true,"data":{"service":"FSTP Talent Map API",...}}`.
6. In `js/config.js` set `backend: 'gas'` (the URL is already filled in) and sign in as `admin`.

Re-deploy a **new version** every time you edit `Code.gs`, otherwise the URL keeps serving the old code.

## Why "Anyone" access is still safe-ish

The web app URL is public, but every action except `login` needs a server-issued session token, and every write is authorised server-side (lecturers can only touch their own rows; admin-only actions check the role). Do not put real sensitive data here until it moves to SQL + HTTPS hosting you control.

## Limits to know about (Sheets is a stop-gap)

- Each request reads whole tabs: fine for a faculty (hundreds of rows), slow beyond a few thousand.
- A cell holds 50,000 characters → profile photos are resized to 200 px JPEG in the browser.
- Apps Script caps a script run at 6 minutes, and sessions at 6 hours (CacheService).
- `resetAllData()` wipes everything — run by hand only.

## Migrating to SQL later

1. Create the schema: `docs/schema.sql` (same table/column names as the tabs).
2. Export every tab as CSV → import into the same-named MySQL table.
3. Write a PHP API exposing the actions in `Code.gs` (`login`, `snapshot`, `create`, `update`, `remove`, `upload`, `download`, `createUser`, …) with the same JSON envelope `{ok, data | error, code}`.
4. In `js/api.js` point `transport()` at the new endpoint. **No view code changes.**
5. Move uploads from Drive to disk/S3 (`documents.file_ref`) and re-hash passwords to bcrypt on first login.
