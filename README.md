# Peta Bakat FSTP

Sistem Pemetaan Bakat Berasaskan Web untuk Pensyarah FSTP (Fakulti Sains dan Teknologi Pertahanan, UPNM). Pensyarah menyimpan profil, kepakaran, penyelidikan, penerbitan, pensijilan, latihan, konsultansi, pencapaian dan dokumen di satu tempat; pentadbir mencari dan memetakan bakat, mengurus akaun dan kategori, melihat statistik serta mengeksport laporan.

HTML/CSS/JS biasa (modul ES) dengan Three.js untuk paparan 3D. **Tiada langkah binaan (build).**

**Bahasa:** seluruh antara muka, mesej ralat, log aktiviti, data contoh, format tarikh (`ms-MY`) dan dokumentasi ini dalam Bahasa Malaysia.

## Cara menjalankan

Modul ES memerlukan pelayan web (bukan `file://`):

```bash
python -m http.server 5173
```

Buka <http://localhost:5173>. Akaun demo (data demo setempat):

| Peranan | Nama pengguna | Kata laluan |
|---|---|---|
| Pentadbir | `admin` | `admin` |
| Pensyarah | `aisyah` (Dr. Aisyah) | `Lecturer@123` |

## Bahagian belakang (satu suis dalam `js/config.js`)

| `backend` | Storan | Kegunaan |
|---|---|---|
| `'gas'` (lalai, langsung) | Google Sheets + Drive melalui Apps Script (`backend/Code.gs`) | Data bersama yang sebenar buat masa ini |
| `'local'` | `localStorage` + IndexedDB pelayar, 100 pensyarah fiksyen | Demo / kerja UI, tanpa persediaan |
| *(kemudian)* SQL | MySQL — skema dalam `docs/schema.sql` | Sistem akhir |

Tambah `?backend=local` pada URL untuk membuka kotak pasir peribadi tanpa menyunting fail. Lihat [`backend/README.md`](backend/README.md) untuk persediaan Google dan laluan migrasi ke SQL.

## Struktur

```
index.html            cangkerang aplikasi + import map (three.js dari CDN)
css/app.css           token reka bentuk, tema cerah/gelap, reka letak responsif
js/schema.js          sumber rujukan tunggal: jadual, medan, label (menggerakkan borang, jadual, laporan)
js/api.js             satu-satunya pintu data yang digunakan UI (tukar pengangkutan di sini)
js/local-server.js    bahagian belakang dalam pelayar, peraturan sama seperti Code.gs
js/seed.js            data demo (Bahasa Malaysia)
js/views/*            satu modul bagi setiap skrin (records.js ialah CRUD generik untuk 8 jenis rekod)
js/three/             rangkaian log masuk + galaksi kepakaran 3D
backend/Code.gs       API Apps Script (Sheets sebagai pangkalan data)
docs/schema.sql       skema sasaran MySQL
```

## Peranan

- **Pentadbir** — urus pengguna & kategori, semua rekod, Pemetaan Bakat (carian + galaksi 3D), Statistik, Laporan (CSV / cetak ke PDF).
- **Pensyarah** — profil dan rekod sendiri sahaja. Pemilikan dikuatkuasakan di bahagian pelayan (`Code.gs` / `local-server.js`), bukan sekadar disembunyikan dalam UI.

## Konvensyen bahasa data

Nilai yang menggerakkan logik sistem kekal sebagai kod: `role` (`admin` | `lecturer`) dan status akaun (`Active` | `Inactive`); ia diterjemah semasa paparan (Pentadbir/Pensyarah, Aktif/Tidak Aktif). Semua nilai deskriptif yang disimpan (tahap kepakaran, status penyelidikan/penerbitan, jenis, jabatan, jawatan, kategori) ialah Bahasa Malaysia — lihat `js/schema.js`.

## Nota keselamatan

- Kata laluan dicincang SHA-256 dengan garam — memadai buat sementara; gunakan `password_hash()` (bcrypt/argon2) dalam versi PHP/MySQL.
- Sesi ialah token rawak yang dikeluarkan pelayan (6 jam). Muat naik: PDF/JPG/PNG/DOC(X), ≤ 5 MB, disimpan dalam Drive (ID Drive tidak didedahkan).
- Semua output UI di-escape HTML melalui tag templat `html`; eksport CSV meneutralkan suntikan formula.
- Tukar kata laluan `admin` lalai selepas log masuk pertama.
