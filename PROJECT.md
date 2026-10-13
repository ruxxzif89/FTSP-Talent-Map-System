# PROJECT.md — Peta Bakat FSTP (FSTP Talent Map)

> **Purpose of this file.** A complete, self-contained handoff. A person or an AI agent with *only this file* (and no memory of earlier work) should be able to rebuild, run, deploy, extend, test and present this project. Everything the previous build learned the hard way is in §20 (Gotchas) and §21 (Build order).
>
> Last verified against the repository at commit range `5039787..` (see `git log`). When this file and the code disagree, **the code wins**; fix this file.

---

## 0. Quick facts

| | |
|---|---|
| Product name | **Peta Bakat FSTP** (internal code name "FSTP Talent Map") |
| Official title | *Web-Based Talent Mapping System for FSTP Lecturers* / *Sistem Pemetaan Bakat Berasaskan Web untuk Pensyarah FSTP* |
| Institution | Fakulti Sains dan Teknologi Pertahanan (FSTP), Universiti Pertahanan Nasional Malaysia (UPNM) |
| Course | TSK 3306 Projek Sarjana Muda (PSM / FYP), Semester I, Sesi 2026/2027, Jabatan Sains Komputer |
| Student | Lailati binti Mohd — No. Matrik 2241073 — Ijazah Sarjana Muda Sains Komputer (Kepujian) |
| Supervisor | Prof. Madya Dr. Nor Azliana Akmal Binti Jamaludin |
| **UI language** | **Bahasa Malaysia only** (hard requirement from the student). This file is in English so any AI can follow it. |
| Stack | Plain HTML/CSS/JavaScript (ES modules, **no build step**), Three.js r160 (CDN), Google Apps Script + Google Sheets/Drive (phase 1 backend), planned PHP + MySQL (phase 2) |
| Repo | https://github.com/ruxxzif89/FTSP-Talent-Map-System (public, branch `main`) |
| Live site | https://ruxxzif89.github.io/FTSP-Talent-Map-System/ (GitHub Pages, deploy from `main` `/`) |
| Sandbox demo | live site + `?backend=local` (private in-browser DB with 100 fictional lecturers) |
| Google Sheet (DB) | spreadsheet id `1LFZkj30JrlinLjcabWfZ-yEcO08EVwcDt2MPR0prRF0` |
| Apps Script web app | `https://script.google.com/macros/s/AKfycbyklWJ6Ttcj9gL11yeAIdT0mDv6VzdQgdhVZGR9UquD8Od2JS7gcZ1JOKDourKJcYZD/exec` (Execute as: Me · Access: Anyone) |
| Default admin | username `admin`, password `admin` (**first-phase default; change before real data**) |
| Sample lecturers | username = first name lower-case (+ index from the 5th lecturer), password `Lecturer@123`; the showcase account is `aisyah` |
| Presentation deck | 28-slide Malay FYP deck (claude.ai artifact "Pembentangan FYP - Peta Bakat FSTP"; also exported to `.pptx` locally, not committed) |

---

## 1. Origin and requirements

### 1.1 Source material (given by the student)
1. **Proposal PDF** "Propasal PSM_2241073_LAILATI MOHD.pdf" (Lampiran A, UPNM.PSM.1/2024).
2. **Two mockup images** (WhatsApp images): *A* = 11 forms (login, lecturer profile, add expertise / research / publication / certification / training / consultancy / achievement / document, add user); *B* = 6 pages (login, admin dashboard, lecturer dashboard, talent mapping search, lecturer profile, manage expertise). Brand shown there: navy header, gold crest "FSTP", pastel stat tiles (blue / green / purple / amber), donut + bar charts, blue "Login" button, sidebar with the same module list as below.
3. Instruction history: build the web app; **no SQL for now — use Apps Script** (Google Sheets as DB) but design so it can migrate to SQL later; "pro" UI/UX; use Three.js; later: Bahasa Malaysia everywhere; sample data of ~100 lecturers; 3D galaxy on the dashboard (lazy-loaded); a full FYP slide deck built from real screenshots.

### 1.2 Problem statement (from the proposal, paraphrased)
Lecturers' expertise, research, publications, professional certifications and experience live in CVs, department files, individual records and other documents. Not centralised → hard to access/update/manage, inconsistent, inefficient storage. Management cannot easily find lecturers with a given expertise (supervision, evaluation panels, consultancy, training, external collaboration); search is manual and memory-based. No expertise map → hard to plan human resources, form research groups, allocate duties, match people to projects.

### 1.3 Objectives (verbatim intent)
1. Design a **centralised database** storing lecturer expertise information systematically.
2. Build a **web-based talent mapping system** so lecturers can manage/update profile, expertise, research, publications and achievements online.
3. **Validate usability and functionality** with target users.

### 1.4 Scope (from the proposal)
- *System:* web app; front end HTML, CSS, Bootstrap, JavaScript; back end PHP; MySQL (phpMyAdmin); XAMPP localhost.
- *Users:* **Admin** — manage accounts; add/update/delete expertise categories; review lecturer updates; search & filter by expertise/department; reports; statistics. **Lecturer** — log in; update profile; add/edit expertise, research, publications, consultancy, training, professional certifications, achievements; upload supporting documents (certificates etc.); review own records.
- *Deviation (deliberate, disclosed in the deck):* **phase 1 uses JavaScript + Google Apps Script + Google Sheets** instead of PHP + MySQL so the UI and business rules can be built, shared and tested early. Schema + data-access layer are designed so **phase 2 (PSM II) swaps the backend to PHP + MySQL with no UI changes**. Bootstrap was **not** used (custom CSS design system instead).
- *Objective 3 status:* functional testing done (8 cases pass); **UAT with real lecturers not done yet** (planned PSM II). Never claim otherwise.

---

## 2. Architecture

```
Browser (index.html + ES modules)
 ├─ views/*  ── call ──► js/api.js  (ONLY data gateway; in-memory store + session cache)
 │                          │  transport(action, payload)
 │          ┌───────────────┴───────────────┐
 │   CONFIG.backend='gas'            CONFIG.backend='local'
 │   fetch POST text/plain           import('./local-server.js')  (same rules as Code.gs)
 │   → Google Apps Script (Code.gs)  → localStorage tables + IndexedDB file blobs
 │   → Google Sheets (12 tabs) + Drive folder (uploads)
 └─ three/*  Three.js scenes (login network, expertise galaxy) — lazy dynamic import()
```

Design principles:
1. **Single data gateway** (`api.js`) + **identical action contract** in both backends → UI is backend-agnostic; swapping to PHP/MySQL later = new `transport()` + new server implementing the same actions.
2. **Schema-driven UI** (`schema.js` ENTITIES): forms, tables, reports, activity text, nav counts are generated from declarative config. Adding a record type = one config block.
3. **Server-side authorisation** (never trust the UI).
4. **Relational data model** (`id` + `*_id` foreign keys, snake_case) mirrored in `docs/schema.sql`.
5. **No build tooling**; Three.js via import map.

---

## 3. Repository layout

```
index.html              shell, fonts, theme bootstrap script, import map (three@0.160.0 via jsdelivr), <html lang="ms">
css/app.css             all styles: tokens, light/dark, shell, components, responsive, print
js/config.js            CONFIG {backend, gasUrl, appName}; ?backend=local|gas URL override
js/schema.js            ENTITIES + enums + labels (single source of truth)
js/api.js               gateway, store, session cache (stale-while-revalidate), selectors
js/local-server.js      in-browser backend (localStorage + IndexedDB), same actions as Code.gs
js/seed.js              deterministic Malay sample-data generator (buildSeed)
js/util.js              html`` escaping template, icons, logo, formatters, toast, drawer, confirm, SVG charts, avatar
js/main.js              shell, router, nav, popovers, theme, route guard, revalidate re-render
js/views/               login, dashboard, records(generic CRUD), profile, profileView, lecturers, talent,
                        users, categories, stats, reports, account, _ui.js (form/table helpers)
js/three/               login-scene.js (network backdrop), galaxy.js (3D expertise galaxy)
backend/Code.gs         Google Apps Script API (Sheets as DB)
backend/README.md       Google setup + migration notes (Malay)
docs/schema.sql         MySQL 8 target schema
tools/screenshots.mjs   Edge-headless (CDP) screenshot generator used for the deck
.nojekyll               REQUIRED on GitHub Pages (see §20)
.gitignore              ignores *.pdf, WhatsApp images, *.pptx, .claude/settings.local.json
README.md               short Malay README
PROJECT.md              this file
.claude/launch.json     dev server config (python -m http.server 5173)
```

Run locally: `python -m http.server 5173` → http://localhost:5173 (ES modules need http, not `file://`).

---

## 4. Data model (12 tables)

All ids are strings: `<prefix>_<random>` (server-generated). Timestamps are ISO-8601 strings. Table/column names are identical in: `Code.gs` (`T`), `local-server.js`/`schema.js`, `docs/schema.sql`.

| Table | Columns (in sheet order) |
|---|---|
| `users` | id, username, email, full_name, role, department, status, salt, password_hash, last_login, created_at, updated_at |
| `lecturers` | id, user_id, staff_id, full_name, email, department, position, phone, location, bio, photo, created_at, updated_at |
| `expertise_categories` | id, name, color, description, created_at, updated_at |
| `expertise` | id, lecturer_id, category_id, area, level, years, interest, document_id, created_at, updated_at |
| `research` | id, lecturer_id, title, area, category, year, status, description, document_id, created_at, updated_at |
| `publications` | id, lecturer_id, title, type, venue, year, status, doi, document_id, created_at, updated_at |
| `certifications` | id, lecturer_id, name, issuer, issue_date, expiry_date, cert_no, document_id, created_at, updated_at |
| `training` | id, lecturer_id, name, organizer, date, status, duration_days, description, document_id, created_at, updated_at |
| `consultancy` | id, lecturer_id, project, client, role, year, status, description, document_id, created_at, updated_at |
| `achievements` | id, lecturer_id, name, category, year, description, document_id, created_at, updated_at |
| `documents` | id, lecturer_id, doc_type, title, file_name, mime, size, file_ref, created_at, updated_at |
| `activity_log` | id, lecturer_id, message, created_at |

Relations: `users 1—1 lecturers` (user_id; only for role lecturer) · `lecturers 1—N` each of the 9 owned tables (`lecturer_id`) · `expertise_categories 1—N expertise` (`category_id`, **RESTRICT**: category in use cannot be deleted → HTTP 409) · `documents 1—N` the 7 record tables via `document_id` (nullable; deleting a document sets referencing `document_id` to `''`).
`OWNED = [expertise, research, publications, certifications, training, consultancy, achievements, documents, activity_log]`.

Notes:
- `users.salt`/`password_hash`: `password_hash = SHA-256_hex(salt + ":" + password)`; both **never** sent to clients (`safeUser_`). In Sheets those two columns are hidden.
- `lecturers.photo`: data-URL JPEG, 200×200 centre-crop, quality 0.82 (must fit one Sheets cell: ≤ 45,000 chars enforced).
- `documents.file_ref`: Drive file id (GAS) — **never returned to the browser**; local backend stores the file body in IndexedDB keyed by document id.
- Numeric columns: `years, year, duration_days, size`. Everything else is text. In Sheets all columns are pre-formatted as plain text (`@`) except those numeric ones (`0`) — otherwise Sheets converts `2026-10-13` to Date objects.
- Sample/demo rows have ids starting `demo_` (remote import) so they can be removed precisely.

### 4.1 Canonical stored values (Bahasa Malaysia)
Logic codes stay English and are translated **only on display**: `role ∈ {admin, lecturer}` → Pentadbir / Pensyarah; `users.status ∈ {Active, Inactive}` → Aktif / Tidak Aktif. All other descriptive values are stored in Malay:

- `LEVELS` = Asas, Pertengahan, Mahir, Pakar (rank 1–4; bar % 25/55/80/100; badge classes: Pakar=blue, Mahir=green, Pertengahan=amber, Asas=grey)
- `DEPARTMENTS` = Sains Komputer, Teknologi Maklumat, Matematik, Kejuruteraan, Lain-lain (admin may also be "Pejabat Fakulti")
- `POSITIONS` = Profesor, Profesor Madya, Pensyarah Kanan, Pensyarah, Tutor
- Project status (research, training, consultancy) = Sedang Berjalan, Selesai, Dirancang
- Publication status = Diterbitkan, Dalam Percetakan, Dalam Semakan, Draf
- Research category = Penyelidikan Asas, Penyelidikan Gunaan, Pembangunan Eksperimen, Penyelidikan Dasar
- Publication type = Artikel Jurnal, Kertas Persidangan, Buku, Bab Buku, Paten, Laporan Teknikal
- Consultancy role = Ketua Projek, Perunding, Penyelidik Bersama, Penasihat, Jurulatih
- Achievement category = Penyelidikan, Pengajaran, Inovasi, Perkhidmatan, Kepimpinan
- Document type = CV, Portfolio, Sijil, Laporan, Penerbitan, Laporan Penyelidikan, Anugerah, Lain-lain
- Default 12 expertise categories (name · colour): Keselamatan Siber #1d5fd1 · Kecerdasan Buatan #7c3aed · Rangkaian #0891b2 · Pangkalan Data #16a34a · Forensik Digital #e11d48 · Kejuruteraan Perisian #ea580c · Keselamatan Maklumat #0f766e · Sains Data #ca8a04 · Internet Benda (IoT) #4f46e5 · Matematik & Pemodelan #be185d · Teknologi Pertahanan #475569 · Lain-lain #64748b. (Older DBs may still hold the English names; `terjemahDataKeBM()` in Code.gs renames them. English level/status keys are still tolerated by the badge/colour helpers for legacy rows.)

### 4.2 Record types (the `ENTITIES` config — drives forms/tables/reports)
Each entity: table, icon, tint, singular/plural/"mine" labels (Malay), `title(row)`, `columns[{key,label,fmt}]`, `fields[{name,label,type,required,options,min,max,placeholder,docType}]`. Field types: `text number date url textarea select category file`. `fmt`: `level status category date expiry num size`.

| Entity (table) | singular / mine | Fields (label → name, type) |
|---|---|---|
| expertise | Kepakaran / Kepakaran Saya | Kategori Kepakaran→category_id (category, req) · Bidang Kepakaran→area (req) · Tahap Kepakaran→level (select LEVELS, req) · Tahun Pengalaman→years (number 0–60, req) · Minat Penyelidikan (Pilihan)→interest (textarea) · Dokumen Sokongan→document_id (file, docType Sijil) |
| research | Penyelidikan / Penyelidikan Saya | Tajuk Penyelidikan→title (req) · Bidang→area (req) · Kategori→category (select, req) · Tahun→year (1990–2100, req) · Status→status (req) · Abstrak / Penerangan→description · file (Laporan Penyelidikan) |
| publications | Penerbitan / Penerbitan Saya | Tajuk→title · Jenis→type · Jurnal / Penerbit→venue · Tahun→year · Status→status · DOI / Pautan (Pilihan)→doi (url) · file (Penerbitan) |
| certifications | Pensijilan / Pensijilan Saya | Nama Pensijilan→name · Badan Pengeluar→issuer · Tarikh Dikeluarkan→issue_date (date, req) · Tarikh Tamat Tempoh→expiry_date (date) · Nombor Sijil (Pilihan)→cert_no · file (Sijil) |
| training | Latihan / Latihan Saya | Nama→name · Penganjur→organizer · Tarikh→date · Status→status (Selesai/Sedang Berjalan/Dirancang) · Tempoh (hari)→duration_days (0–365) · Penerangan→description · file |
| consultancy | Konsultansi / Konsultansi Saya | Nama Projek→project · Organisasi / Klien→client · Peranan→role · Tahun→year · Status→status · Penerangan→description · file (Laporan) |
| achievements | Pencapaian / Pencapaian Saya | Nama→name · Kategori→category · Tahun→year · Penerangan→description · file (Anugerah) |
| documents | Dokumen / Dokumen Saya | Jenis Dokumen→doc_type · Tajuk / Penerangan→title · Fail→file (standalone upload row) |

File rules: ≤ 5 MB; extensions pdf/jpg/jpeg/png/doc/docx; server also checks MIME (pdf, png, jpeg, msword, docx). A file field uploads first (creating a `documents` row with the entity's `docType`) and stores the new `document_id` on the record.

---

## 5. Backend contract (identical in `Code.gs` and `local-server.js`)

**Transport (GAS):** `POST <exec URL>` with header `Content-Type: text/plain;charset=utf-8` (avoids CORS preflight, which Apps Script cannot answer) and body `JSON.stringify({action, payload, token})`. Response always JSON: `{ok:true,data}` or `{ok:false,error:"<Malay message>",code:<int>}`. `GET <exec>` returns a health JSON `{ok,data:{service,status,tables}}`.
Client treats `code===401` (except for `login`) as "session expired": clears session and routes to `#/login`.

| Action | Auth | Payload → result | Rules |
|---|---|---|---|
| `login` | none | `{username,password}` → `{token,user}` | username **or** e-mail, case-insensitive; reject inactive (403); token = random (2 UUIDs); session stored server-side (GAS CacheService 6 h; local 12 h); updates `last_login` |
| `logout` | token | → `true` | removes token |
| `me` | token | → `{user}` | |
| `snapshot` | token | → `{users,lecturers,expertise_categories,expertise,…,activity_log}` | admin: everything (users without salt/hash). lecturer: own `users` row, own `lecturers` row, all categories, own rows of the 9 owned tables |
| `create` | token | `{table,row}` → row | tables: categories (admin only) and owned tables except `documents` (use `upload`) and `activity_log` (server-written). Lecturer: `lecturer_id` forced to own; admin must pass `lecturer_id`. Category name unique (409). `document_id` must belong to same lecturer. Whitelists columns. Writes activity "Menambah <singular> baharu" |
| `update` | token | `{table,id,patch}` → row | tables: `lecturers`, categories (admin), owned (not `activity_log`). Lecturer only own rows; strips `id,lecturer_id,user_id,created_at`; `staff_id` editable only by admin; `documents` update only `title`,`doc_type`. Updating `lecturers` mirrors `full_name,email,department` to `users`. Activity "Mengemas kini maklumat …" |
| `remove` | token | `{table,id}` → `{id}` | categories admin-only and **409 if referenced by expertise**; owned: own rows (admin any). Removing a document deletes the file (Drive trash / IndexedDB) and blanks `document_id` references. Activity "Memadam …" |
| `upload` | token | `{lecturer_id,doc_type,title,file_name,mime,size,dataUrl}` → documents row (without `file_ref`) | lecturer: forced to own id. ≤5 MB, MIME whitelist; GAS stores in Drive folder `FSTP_Talent_Map_Files` (id kept in Script Property `DRIVE_FOLDER_ID`); filename sanitised |
| `download` | token | `{id}` → `{file_name,mime,dataUrl}` | owner or admin |
| `createUser` | admin | `{user:{username,email,full_name,role,department,status,password}}` → user | password ≥ 8; username/email unique (409). Role lecturer also creates a `lecturers` row: `staff_id = UPNM###` (count+1), position `Pensyarah` |
| `updateUser` | admin | `{id,patch}` → user | only `full_name,email,department,status`; cannot deactivate self; e-mail unique; mirrors to lecturer row |
| `resetPassword` | admin | `{id,password}` | ≥ 8 chars, new salt |
| `changePassword` | any | `{current,password}` | verifies current; ≥ 8 |
| `deleteUser` | admin | `{id}` | not self; cascades lecturer + all owned rows + Drive files |
| `bulkImport` | admin | `{tables:{table:[rows]}}` → counts | **every row id must start `demo_`**, users must be role lecturer, idempotent (skips existing ids). Used to load sample data in one request (single `setValues` per table in GAS) |
| `clearDemo` | admin | → counts | deletes every row whose `id` or `lecturer_id` starts `demo_`; real data untouched |
| `resetDemo` | none (local only) | | reseeds local DB |

Concurrency: GAS uses `LockService.getScriptLock()` for all write actions (`WRITES` map).
Limits: Sheets cell ≤ 50,000 chars (guard 45,000); activity_log trimmed (GAS keeps ~800 rows, local 400); Apps Script run ≤ 6 min.

Error messages (Malay) are part of the contract — see `ERR` list in `Code.gs`/`local-server.js` (e.g. "Nama pengguna atau kata laluan tidak sah.", "Sesi tamat. Sila log masuk semula.", "Untuk pentadbir sahaja.", "Kategori ini sedang digunakan oleh rekod kepakaran pensyarah dan tidak boleh dipadam.").

### 5.1 Apps Script setup (one time) — see `backend/README.md`
1. Open the Sheet → Extensions → Apps Script; paste `backend/Code.gs`; save.
2. Run `setup()` (creates 12 tabs/headers/text formats, 12 categories, admin `admin/admin`, Drive folder). Approve Sheets + Drive scopes.
3. Deploy → Manage deployments → Edit → **New version** → Execute as *Me*, Access *Anyone*. **Every code change needs a new version** or `/exec` keeps serving old code.
4. Helper functions (run manually from the editor): `resetAdminPassword()` (sets admin password to `admin`), `terjemahDataKeBM()` (renames legacy English categories/admin to Malay), `resetAllData()` (wipes ALL rows then re-runs setup — destructive).
5. In `js/config.js` keep `backend:'gas'` and the exec URL.

---

## 6. Frontend behaviour

### 6.1 Router (`js/main.js`) — hash routes, role-guarded
`#/login` · `#/dashboard` (admin+lecturer; different content) · `#/profile` (lecturer) · `#/lecturers` (admin) · `#/lecturer/:id` (admin, or lecturer for own id) · `#/talent` (admin) · `#/users` (admin) · `#/categories` (admin) · `#/stats` (admin) · `#/reports` (admin) · `#/account` (both) · `#/<entity>` for each of the 8 record types (both; admin sees all lecturers' rows with a lecturer column/filter, `?lecturer=<id>` preselects the filter).
Unknown/forbidden → card "Halaman tidak tersedia". Views are dynamic `import()`ed (`records:<entity>` maps to `records.js`). Query string is parsed and passed in params. Navigating away while a view loads discards the stale render. Views may return a cleanup function (disposes Three.js, observers).

### 6.2 Shell
Top bar (navy gradient): hamburger (mobile), crest + "PETA BAKAT FSTP / UPNM · Fakulti Sains dan Teknologi Pertahanan", bell (notifications: certifications expiring ≤ 90 days + last 5 activities; badge = expiring count), user chip → menu (Akaun & kata laluan · Tukar tema · Log keluar). Sidebar groups — **Admin:** Papan Pemuka; *Pengurusan*: Urus Pengguna, Pensyarah, Kategori Kepakaran, Pemetaan Bakat; *Rekod*: the 8 types (with counts); *Analisis*: Statistik, Laporan. **Lecturer:** Papan Pemuka, Profil Saya, the 8 types ("… Saya" labels, with counts). Mobile (<860px): sidebar becomes a drawer with scrim. Document-level popover listeners are registered **once** (prevents null-element crashes after re-login). Theme: `data-theme` on `<html>`, persisted in `localStorage['ftm:theme']`, applied by an inline script before CSS paints.

### 6.3 Session cache / performance (`api.js`)
`store` = in-memory snapshot (`me`, 12 tables). After every `snapshot`, a copy is saved to `sessionStorage['ftm:snap']`. On reload `restore()` paints **instantly from the cached snapshot** and re-validates in the background (`me` + `snapshot` in parallel); if data changed and no drawer is open, the current route re-renders once. Mutations patch the store locally and push a matching local activity row (no extra round trip). Token: `sessionStorage` (or `localStorage` if "Ingat saya"), key `ftm:token`; logout clears token + snapshot.

### 6.4 Screens
- **Login** — split layout; left hero (crest, "PETA BAKAT FSTP", tagline "Sistem pemetaan bakat berasaskan web untuk pensyarah FSTP — satu tempat untuk merekod, mengemas kini dan menemui kepakaran.", three bullets Hubungkan kepakaran / Temui bakat / Bina kolaborasi) over a Three.js network; right glass card (Nama Pengguna / E-mel, Kata Laluan with show/hide, Ingat saya, **Log Masuk**, inline error). Demo-account quick-fill buttons shown **only when backend = local**.
- **Dashboard (admin)** — 4 tinted stat tiles (Pensyarah, Kategori Kepakaran, Penerbitan Penyelidikan, Pensijilan; "Lihat Butiran →"); **Galaksi Kepakaran** card (3D, lazy: `IntersectionObserver` rootMargin 250 px + `requestIdleCallback` timeout 1500 ms; "Memuatkan galaksi 3D…" placeholder; WebGL-missing fallback text); bar chart "Taburan Kepakaran" (distinct lecturers per category, top 8, department filter); donut "Pensyarah Mengikut Jabatan"; "Aktiviti Terkini"; "Pensijilan Hampir Tamat Tempoh" (≤120 days).
- **Dashboard (lecturer)** — welcome card + **Kelengkapan Profil** progress, 4 tiles (Kepakaran, Penyelidikan, Penerbitan, Pensijilan), recent activities, "Kepakaran Saya (5 Teratas)" level bars, secondary tiles (Latihan, Konsultansi, Pencapaian, Dokumen). *Completion %* = round(100 × checks/11) over: photo, phone, bio, location, position, department, full_name, ≥1 expertise, ≥1 research, ≥1 publication, ≥1 certification.
- **Records (generic CRUD, 8 pages)** — page head + "Eksport CSV" + "Tambah <X>", search box (debounced), admin lecturer filter, sortable paged table (10/page), row actions download/edit/delete, empty state with CTA. Add/edit opens a **right-side drawer form** (focus-trapped, Esc closes, closes on route change). Delete uses a confirm dialog. Admin "add" shows a required "Pensyarah" select.
- **Profil Saya (lecturer)** — photo upload (JPG/PNG ≤ 2 MB → 200 px square JPEG data URL) + tabs "Maklumat Peribadi" (No. Staf [read-only for lecturer], Nama Penuh, E-mel, Nombor Telefon, Lokasi) / "Maklumat Profesional" (Jabatan, Jawatan, Biodata Ringkas).
- **Profil Pensyarah (`#/lecturer/:id`)** — header (avatar with gold ring, name, position · department · staff id, e-mail/phone/location, bio, category chips), 6 count tiles linking to the filtered record pages, expertise table, latest publications; "Kemas Kini Profil" opens the profile editor drawer.
- **Pensyarah (admin directory)** — searchable/sortable table with department filter, top expertise badge, record count.
- **Pemetaan Bakat** — search (name, expertise area/interest/category, research & publication titles), department + level filters, category sidebar with live counts, sort (Kaitan/Nama/Pengalaman), view toggle **Kad | Galaksi 3D**. Heading "Pakar <kategori> (N Pensyarah)" / "Keputusan carian (N Pensyarah)" / "Semua Pensyarah (N Pensyarah)". *Matching:* a lecturer qualifies if some expertise row matches (category/level/text) or the name matches (and no category/level filter) or a research/publication title matches (only when no category/level filter). *Score* = best.levelRank×10 + best.years + 50 (name hit) + number of matching works.
- **Urus Pengguna** — table (name, username, e-mail, role badge, department, status badge, last login), add/edit drawer, reset-password drawer, delete confirm (warns it cascades). Password rule UI: ≥ 8 chars incl. a letter and a number. Role cannot change after creation.
- **Kategori Kepakaran** — CRUD with colour hex (`#RRGGBB`) and lecturer count; delete blocked when in use.
- **Statistik** — 4 tiles (lecturers, expertise records, avg years, lecturers with no expertise), bars per category, donut by level, bars publications/year (last 8), donut publication types, donut by department, top 5 publishing lecturers, "Perlu perhatian" list.
- **Laporan** — 8 reports: Direktori pensyarah, Matriks kepakaran, + Penyelidikan/Penerbitan/Pensijilan/Latihan/Konsultansi/Pencapaian; filters department/level/year; preview (first 200 rows); **Eksport CSV** (UTF-8 BOM; cells starting `= + - @` are prefixed with `'` to neutralise formula injection) and **Cetak / PDF** (`window.print`, print CSS hides chrome).
- **Akaun & Kata Laluan** — change password; admin on remote backend sees **Data contoh** card (Muatkan 100 pensyarah contoh / Buang data contoh); admin on local backend sees "Tetap semula data demo".

### 6.5 Shared UI toolkit (`util.js`, `_ui.js`)
- `html\`\`` tagged template **escapes every interpolation** unless it is itself `html`/`raw` (XSS defence). `mount(el, tpl)`.
- Inline SVG icon set (24 px stroke), crest SVG, `avatar()` (photo or gradient initials; initials strip titles Dr./Prof./Prof. Madya/Encik/Puan/Cik and particles bin/binti/a/l/a/p), `fmtDate` (`ms-MY`, "13 Okt 2026"), `fmtSize`, CSV helpers, toasts (`role=status`), `openDrawer`/`confirmDialog` (focus trap, Esc, restore focus), SVG `barChart` and `donut` (no chart library).
- `fieldHtml`/`readForm`: label + required `*` + inline error (`role=alert`, `aria-invalid`), select options may be strings or `[value,label]`; validation: required, number range, `http(s)://` URL, e-mail, min length, file size/type; first invalid field is focused. `dataTable`: sort by header button, search, 10-row paging ("Sebelumnya / Seterusnya", "Halaman x / y"), empty states.

### 6.6 Three.js (r160 via import map; `three` + `three/addons/`)
- **`login-scene.js`**: ~120 points (60 on narrow screens) on a jittered Fibonacci sphere, additive-blended glow sprites (gold/blue/white), line segments between nodes closer than 4.6, 14 gold "pulses" travelling edges, slow rotation + mouse parallax, fog, group offset left on desktop. Pauses on `visibilitychange`; single static frame if `prefers-reduced-motion`; **disposes** geometries/materials/textures/renderer on teardown; pixel ratio ≤ 2.
- **`galaxy.js`**: category = glowing wireframe icosahedron hub + halo sprite + canvas-texture label, placed on a Fibonacci sphere (R=11, y squashed 0.8); lecturer = point at a random offset (1.6–3.8 units, smaller radius for higher level) around the hub of their **strongest expertise** (max level, then years), size ∝ level; faint tether lines to the other categories they cover; custom `ShaderMaterial` point sprites; `OrbitControls` (damping, auto-rotate stops on first interaction, min/max distance 8/50); hover tooltip (name, "<area> · <level> · <department>") and click → `#/lecturer/:id` using screen-space nearest-point picking (16 px); `setFilter(Set<ids>)` dims non-matching people; `dispose()` releases everything; visibility pause; reduced-motion respected; returns `null` if WebGL unavailable.

---

## 7. Design system

- **Font:** Plus Jakarta Sans (400/500/600/700/800) from Google Fonts, fallback system-ui.
- **Light tokens:** navy `#0b2a5b`, navy-2 `#143c7d`, blue `#1d5fd1`, gold `#f2b705`, bg `#f2f5fa`, card `#fff`, ink `#0f1b33`, ink-2 `#4a5878`, ink-3 `#7a88a6`, line `#e1e7f1`, field `#f6f8fc`. Status: ok `#168a5b`/`#e0f5ec`, info `#1d5fd1`/`#e5eefc`, warn `#a96a00`/`#fff2d6`, mute, danger `#c62f3d`/`#fde6e8`. Stat-tile tints: blue `#e6f0ff`, green `#e1f6ea`, purple `#efe8ff`, amber `#fff0cf`, teal `#dcf4f5`, rose `#ffe6ea`, indigo `#e6e8ff`, slate `#e8ecf3`.
- **Dark theme:** `:root[data-theme=dark]` overrides (bg `#0a1220`, card `#111c31`, ink `#e8eefb`, …); primary button becomes blue.
- Radius 14 (cards), 12 (inputs/buttons); shadows soft; easing `cubic-bezier(.2,.7,.2,1)`; min touch target 44 px; focus ring 3 px blue; `[hidden]{display:none!important}` (required — component `display` otherwise overrides `hidden`).
- Breakpoints: ≤1100 (grids collapse), ≤860 (sidebar drawer, single column, login stacks), ≤700 (welcome card single column), ≤520 (tiles 2-col). `prefers-reduced-motion` disables animations. Print CSS hides chrome.
- Accessibility baseline: skip link ("Langkau ke kandungan"), landmarks, `aria-*` on icon buttons, labelled inputs, error `role=alert`, focus trap in dialogs, visible focus, colour never the only signal (badges carry text).

---

## 8. Language / i18n (Bahasa Malaysia)

There is no i18n framework: the app is Malay-only; strings live next to the code (`schema.js` labels, views, `util.js`, server error lists). Rule: **any new user-visible string is Malay**. Display-only translations: `ROLE_LABEL`, `ACCOUNT_STATUS_LABEL` (schema.js). Dates `ms-MY`. Code comments may be English.

Core glossary (use consistently): Dashboard→Papan Pemuka · Lecturer→Pensyarah · Admin→Pentadbir · Manage Users→Urus Pengguna · Expertise→Kepakaran · Expertise Categories→Kategori Kepakaran · Talent Mapping→Pemetaan Bakat · Research→Penyelidikan · Publications→Penerbitan · Certifications→Pensijilan · Training→Latihan · Consultancy→Konsultansi · Achievements→Pencapaian · Documents→Dokumen · Statistics→Statistik · Reports→Laporan · Login→Log Masuk · Logout→Log keluar · Save→Simpan · Cancel→Batal · Add→Tambah · Edit→Kemas Kini · Delete→Padam · Search→Cari · Export→Eksport · Print→Cetak · Username→Nama Pengguna · Password→Kata Laluan · Remember me→Ingat saya · Level→Tahap · Years→Tahun · Status→Status · Ongoing/Completed/Planned→Sedang Berjalan/Selesai/Dirancang · Sample data→Data contoh · Required field→"Medan ini wajib diisi."

---

## 9. Sample data (`seed.js`)

`buildSeed(hashPw, {count=100, prefix='', categories=null, includeAdmin=true, docs=true})`, deterministic (mulberry32 seed `20261013`).
- Admin `admin/admin` (only when `includeAdmin`). Lecturers share one salt and password `Lecturer@123`.
- First four fixed: Dr. Aisyah Binti Ahmad (`aisyah`, UPNM001, Sains Komputer, Pensyarah Kanan; counts research 8 / publications 15 / certifications 6 / training 10 / consultancy 4 / achievements 5; 3 documents when `docs`), Prof. Dr. Harun Bin Ismail (`harun`), Dr. Farhana Binti Omar (`farhana`), Dr. Ahmad Bin Zulkifli (`ahmadz`).
- Remaining: mix of Malay (≈72 %: Bin/Binti), Chinese (≈14 %), Indian (≈14 %: a/l, a/p) names; titles by position (Profesor→"Prof. Dr.", Profesor Madya→"Prof. Madya Dr.", Tutor→Encik/Puan, others Dr. 80 % else Encik/Puan); usernames `<first-name-lowercase><index>`; unique full names.
- Per lecturer: 1 main expertise (level/years scaled by seniority) + 0–2 extras; research/publication/certification/training/consultancy/achievement counts vary by seniority; every 31st lecturer `Inactive`; bios for all; activity feed entries.
- Produces for 100 lecturers ≈ 224 expertise, 211 research, 497 publications, 203 certifications, 223 training, 122 consultancy, 147 achievements, 43 activity = **1,870 rows** (plus 100 users + 100 lecturers).
- Titles/venues/courses/clients/awards are Malay (journal names such as "IEEE Access", "Computers & Security", certification names like CISSP are proper nouns). Category lookup works whether the DB categories are Malay or legacy English (`CAT_EN` alias map).
- Local backend seeds 100 lecturers automatically (flag `localStorage['ftm:seeded']='5'`; bump the number to force a reseed). Remote: Akaun → *Muatkan 100 pensyarah contoh* (`bulkImport`, ids `demo_*`, no documents).

---

## 10. Security model

Server-side RBAC and ownership checks on every action; salted SHA-256 passwords (phase 2: `password_hash()` bcrypt/argon2, re-hash on first login); random server session tokens with expiry; HTML escaping via `html` tag; CSV formula neutralisation; upload size/type/MIME whitelist; Drive ids never exposed; column whitelisting on write; referential integrity (category in use); self-delete/self-deactivate blocked; demo import limited to `demo_` ids and lecturer role; generic error to client for unexpected server errors (details to Apps Script logs only).
Known weak points (disclosed in the deck): SHA-256 not bcrypt; public Apps Script URL ("Anyone") protected only by tokens; no rate limiting / lockout; no virus scan on uploads; default `admin/admin`; no 2FA; Sheets scaling.

---

## 11. Deployment

- **Frontend:** GitHub Pages — repo Settings → Pages → Deploy from branch `main` `/ (root)`. **Needs `.nojekyll`** (Jekyll otherwise silently drops files starting with `_`, i.e. `js/views/_ui.js` → every view fails with "Failed to fetch dynamically imported module"). All paths are relative so the `/<repo>/` sub-path works. After a push allow ~1 min; hard-refresh (Ctrl+Shift+R).
- **Backend:** Apps Script web app (see §5.1).
- **Sharing a demo safely:** `…/?backend=local` (sandbox, nothing leaves the browser). The live default uses the shared Sheet: anyone who can sign in as admin can edit everything → change the admin password (Akaun) before real use.

---

## 12. Migration plan to PHP + MySQL (phase 2 / PSM II)

1. Create DB from `docs/schema.sql` (same names; ENUMs use the Malay values from §4.1; FKs: lecturers→users CASCADE, owned tables→lecturers CASCADE, expertise.category_id RESTRICT, document_id SET NULL).
2. Export each Sheet tab to CSV and import to the same-named table (convert ISO strings to DATETIME/DATE; password hashes can be migrated as-is then upgraded).
3. Implement a PHP endpoint exposing the **same actions and envelope** as §5 (XAMPP/Apache). Use PDO prepared statements, `password_verify`/`password_hash`, sessions or signed tokens, `$_FILES`-based uploads to a non-public folder (`documents.file_ref` = path).
4. In `js/api.js` replace the GAS branch of `transport()` (or add a `'php'` backend in `config.js`). No view changes. Remove CORS workaround if same-origin.
5. Optional: server-side pagination/search for large tables.

---

## 13. Testing

Manual functional cases executed (all pass unless noted): **TC1** admin & lecturer login (live Sheet + sandbox) · **TC2** lecturer opening admin route is refused ("Halaman tidak tersedia") · **TC3** add certification with PDF upload · **TC4** empty form shows inline errors on every required field · **TC5** create then delete a lecturer account on the live Google Sheet · **TC6** load 100 lecturers (1,870 rows) and render dashboard/galaxy · **TC7** sweep all 17 routes without console errors · **TC8** 390 px mobile layout (drawer nav, 2-column tiles) · **TC9** UAT with real lecturers — **planned PSM II, not done**.
Tooling notes: `tools/screenshots.mjs` drives headless **Microsoft Edge over the DevTools protocol** (no npm install; uses Node's global `WebSocket`) to produce 1600×900 @1.25 DPR JPEGs of every key screen against `http://localhost:5173/?backend=local` (logs in as admin and as `aisyah`, includes a 390 px mobile run). Usage: start the dev server, then `node tools/screenshots.mjs <outDir>`. It must kill the whole Edge process tree at the end (`taskkill /T`), otherwise the next run silently attaches to the old browser/session. Edit the `EDGE` path for other machines. Automated test suite: not yet written (roadmap).

---

## 14. Presentation deck (FYP)

28 slides, Malay, 16:9, font Plus Jakarta Sans; palette navy `#0b2a5b` / dark `#071a3d` / light `#f4f6fb` / white cards / gold `#f2b705` (on dark) / blue `#1d5fd1`; footer "Peta Bakat FSTP · Projek Sarjana Muda · UPNM" + page "NN / 28"; speaker notes on every slide (Malay) incl. 5 anticipated Q&A on the last slide. Order (ids): cover, agenda, latar, masalah, objektif, skop, literatur, metodologi, keperluan, pengguna, seni-bina, erd, mockup, demo-login, demo-admin, demo-bakat, demo-galaksi, demo-pensyarah, demo-borang, demo-pengguna, demo-analisis, skala, keselamatan, pengujian, objektif-capai, had-akan-datang, pelan-kerja, penutup. Visuals = real screenshots of the running system + the student's two mockups + ERD/architecture diagrams drawn in slide primitives. **Placeholders the student must complete:** slide 7 literature references (none invented), methodology name alignment with the report (slide 8), optional dates (slide 27), UAT results (slide 24/25) when available.

---

## 15. Environment & workflow notes (Windows)

- Dev machine: Windows 11, Git Bash + PowerShell, Node 24, Python (for `http.server`), Edge at `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`. No `gh` CLI; git identity set per-repo.
- Commit trailer used: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Source documents (`*.pdf`, WhatsApp images, `*.pptx`) are git-ignored on purpose (personal data).

---

## 16. Roadmap / known gaps

1. Migrate to PHP + MySQL (§12). 2. UAT (SUS questionnaire) with real lecturers; add results to deck/report. 3. E-mail notifications for expiring certifications. 4. Server-side pagination/search; automated tests (Playwright/Vitest). 5. Hardening: bcrypt/argon2, login rate-limit/lockout, audit log, 2FA, upload virus scan, optional SSO with UPNM. 6. PDF export (server-rendered) instead of browser print. 7. Galaxy label overlap when hubs are close; chart category labels truncate (could wrap). 8. Literature review content for the report/deck.

---

## 17. Decision log (why things are the way they are)

- **Apps Script + Sheets first:** shareable, zero-server prototype; avoids local XAMPP for reviewers. Cost: slow cold requests and whole-tab reads → mitigated by one-shot `snapshot`, parallel session restore, cached snapshot paint, local patching.
- **text/plain POST:** the only way to call Apps Script from another origin without a preflight.
- **Stored values in Malay, logic codes in English:** user-facing correctness without touching permission logic.
- **Generic CRUD from schema:** 8 record types share one implementation → consistent UX, tiny code.
- **Sandbox `?backend=local`:** lets reviewers/demoers click everything safely.
- **Lazy galaxy on dashboard:** keeps first paint fast; Three.js (~700 KB) fetched only near viewport, after idle.
- **Bootstrap omitted:** custom tokens/components gave the "pro UI/UX" look and dark mode with less CSS weight.

---

## 18. Operational runbook

| Task | How |
|---|---|
| Run locally | `python -m http.server 5173` |
| Use sandbox | open `/?backend=local` (login `admin/admin`) |
| Reset sandbox | Akaun → Tetap semula data demo, or clear site data, or bump `ftm:seeded` |
| Load/remove sample data on live | Akaun → Muatkan 100 pensyarah contoh / Buang data contoh (admin) |
| Reset live admin password | run `resetAdminPassword()` in Apps Script, deploy new version |
| Wipe live DB | run `resetAllData()` (destructive) |
| Publish site | `git push` to `main` (Pages rebuilds ~1 min) |
| Regenerate screenshots | §13 |
| Check backend alive | open the `/exec` URL → JSON with `status:"running"` |

---

## 19. Acceptance checklist for any rebuild

- [ ] Admin and lecturer can log in; lecturer cannot read/write others' data (verify by calling the API with a lecturer token and another lecturer's id → 403).
- [ ] All 8 record types: create / edit / delete / export CSV / attach file; validation messages in Malay.
- [ ] Category in use cannot be deleted (409 message in Malay).
- [ ] Talent search across name/area/interest/titles with department+level filters, counts per category, card + 3D views.
- [ ] Dashboard (admin + lecturer), statistics, 8 reports with CSV + print.
- [ ] Users CRUD, password reset, cascade delete.
- [ ] Sample data 100 lecturers load and clear without touching real rows.
- [ ] Light/dark theme, responsive down to 360 px, keyboard-accessible dialogs/drawers.
- [ ] No English user-visible strings; dates in `ms-MY`.
- [ ] Works under GitHub Pages sub-path (relative URLs, `.nojekyll`).
- [ ] Swapping backend (`local` ⇄ `gas` ⇄ future PHP) requires no view changes.

---

## 20. Gotchas (hard-won)

1. **GitHub Pages + Jekyll drops `_`-prefixed files** → add `.nojekyll` (symptom: dynamic import of a view fails only on the hosted site).
2. **`hidden` attribute is overridden by component `display:flex`** → global `[hidden]{display:none!important}`.
3. **Apps Script CORS:** use `Content-Type: text/plain`; the response is a redirect that `fetch` follows (don't use `curl -X POST -L`; use `curl -L -d` so the redirect becomes a GET).
4. **Sheets auto-converts dates/numbers:** pre-format columns as plain text (`@`) at `setup()`.
5. **Sheets cell limit 50k chars** → resize avatars to 200 px JPEG; guard at 45k.
6. **Redeploy Apps Script as a *new version*** after every `Code.gs` change; the `/exec` URL stays constant but serves the last deployed version.
7. **`setup()` runs once with the password in force at that time** — changing the default in code does not change an existing admin; use `resetAdminPassword()`.
8. **Drawer overlays must close on `hashchange`** or they linger on other pages.
9. **Document-level event listeners in the shell must be registered once** (re-registering per login caused null `innerHTML` crashes).
10. **Seed idempotency:** loading the 100-lecturer sample on top of an already-seeded local DB duplicated the four fixed lecturers → local now seeds 100 directly and hides the sample card in local mode.
11. **Headless Edge:** `proc.kill()` kills only the launcher; kill the tree (`taskkill /PID <pid> /T /F`) or later runs reuse the old session on the same debug port.
12. **Slide format constraints (claude.ai Slides type):** no background on table cells (put it on `<tr>`), no `margin`/classes, min font 24 px, absolute positioning for footers, images only via uploaded `/_blob/<id>` assets.
13. **Three.js:** call `dispose()` on geometries/materials/textures/renderer on teardown; cap pixel ratio at 2; pause when hidden; point size = size × scale / −z (don't use the old 22× constant — it produced giant blobs).
14. **Stale browser cache of ES modules** during development: `fetch(url,{cache:'reload'})` then reload.
15. **Role vs status codes:** don't translate `Active`/`Inactive`/`admin`/`lecturer` in storage — server logic compares them.

---

## 21. Recommended build order for a from-scratch rebuild (with another AI)

Give the AI this file plus the proposal PDF and the two mockups, then proceed in these checkpoints (each ends with a runnable, testable state):

1. **Foundations:** `index.html` (import map, fonts, theme script, `lang="ms"`), `css/app.css` tokens + shell, `util.js` (`html` escaping, icons, toast, drawer, confirm, charts), `schema.js` (ENTITIES, enums, labels).
2. **Local backend:** `local-server.js` + `seed.js` implementing the §5 contract (auth, snapshot, CRUD, upload/download via IndexedDB, users) and `api.js` with store, selectors and session cache. *Check:* console-level calls succeed; authorisation tests per §19.
3. **Shell & router:** `main.js` (guards, nav, popovers, theme), login view.
4. **Generic records view** + `_ui.js` helpers (table, form builder/validator). *Check:* all 8 record types CRUD with files.
5. **Dashboards, profile, lecturers directory, users, categories.**
6. **Talent mapping** (search algorithm §6.4) → **statistics → reports**.
7. **Three.js:** login network, then galaxy (+ dashboard card with lazy loading).
8. **Malay audit:** grep every user-visible string, server errors, activity messages, seed text, README; verify with a page-text sweep.
9. **Apps Script backend:** `Code.gs` mirroring §5 (+ `setup`, `resetAdminPassword`, `terjemahDataKeBM`, `bulkImport`, `clearDemo`), deploy, flip `backend:'gas'`, retest TC1–TC5 against the live Sheet.
10. **Performance pass:** parallel session restore, snapshot cache, lazy galaxy.
11. **Docs & deploy:** README, `backend/README.md`, `docs/schema.sql`, `.nojekyll`, GitHub Pages.
12. **Deck:** capture screenshots with `tools/screenshots.mjs`, build the 28 slides (§14).

When in doubt, read the code: it is small (roughly 3,500 lines of JS, CSS and Apps Script, with no dependency besides Three.js).
