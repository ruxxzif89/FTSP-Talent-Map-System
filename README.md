# FSTP Talent Map

Web-Based Talent Mapping System for FSTP Lecturers (UPNM). Lecturers keep their profile, expertise, research, publications, certifications, training, consultancy, achievements and documents in one place; admins search and map talent, manage accounts and categories, view statistics and export reports.

Plain HTML/CSS/JS (ES modules), Three.js for the 3D views. **No build step.**

## Run it

ES modules need a web server (not `file://`):

```bash
python -m http.server 5173
```

Open <http://localhost:5173>. Demo accounts (local demo data):

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin` |
| Lecturer | `aisyah` (Dr. Aisyah) | `Lecturer@123` |

## Backends (one switch in `js/config.js`)

| `backend` | Storage | Use for |
|---|---|---|
| `'local'` (default) | Browser `localStorage` + IndexedDB, 26 fictional lecturers | Demo / UI work, zero setup |
| `'gas'` | Google Sheets + Drive via Apps Script (`backend/Code.gs`) | Real shared data for now |
| *(later)* SQL | MySQL — schema in `docs/schema.sql` | Final system |

See [`backend/README.md`](backend/README.md) for the Google setup and the migration path to SQL.

## Structure

```
index.html            app shell + import map (three.js from CDN)
css/app.css           design tokens, light/dark theme, responsive layout
js/schema.js          single source of truth: tables, fields, labels (drives forms, tables, reports)
js/api.js             the ONLY data gateway the UI uses (swap transports here)
js/local-server.js    in-browser backend, same rules as Code.gs
js/seed.js            demo data
js/views/*            one module per screen (records.js is the generic CRUD for 8 record types)
js/three/             login network + 3D expertise galaxy
backend/Code.gs       Apps Script API (Sheets as DB)
docs/schema.sql       MySQL target schema
```

## Roles

- **Admin** — manage users & categories, all records, Talent Mapping (search + 3D galaxy), Statistics, Reports (CSV / print to PDF).
- **Lecturer** — own profile and records only. Ownership is enforced server-side (`Code.gs` / `local-server.js`), not just hidden in the UI.

## Security notes

- Passwords are salted SHA-256 — fine for the interim; use `password_hash()` (bcrypt/argon2) in the PHP/MySQL version.
- Sessions are server-issued random tokens (6 h). Uploads: PDF/JPG/PNG/DOC(X), ≤ 5 MB, stored in Drive (never exposed by Drive id).
- All UI output is HTML-escaped through the `html` template tag; CSV export neutralises formula injection.
- Change the default `admin` password after first login.
