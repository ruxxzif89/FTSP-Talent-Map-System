# Bahagian belakang Apps Script (pangkalan data Google Sheets)

Hamparan anda: `1LFZkj30JrlinLjcabWfZ-yEcO08EVwcDt2MPR0prRF0` (dikodkan keras sebagai `SPREADSHEET_ID` dalam `Code.gs`).

## Persediaan sekali sahaja

1. Buka hamparan → **Extensions → Apps Script** (mestilah skrip di sebalik URL `/exec` anda).
2. Gantikan kandungan `Code.gs` dengan [`Code.gs`](Code.gs) dalam folder ini. Simpan.
3. Dalam senarai fungsi pilih **`setup`** → **Run**. Luluskan kebenaran yang diminta (Sheets, Drive).
   Ini mencipta kesemua 12 tab berserta pengepala (`users`, `lecturers`, `expertise_categories`, `expertise`, `research`, `publications`, `certifications`, `training`, `consultancy`, `achievements`, `documents`, `activity_log`), memasukkan 12 kategori kepakaran (Bahasa Malaysia) dan pentadbir pertama (`admin` / `admin`), serta mencipta folder Drive `FSTP_Talent_Map_Files` untuk muat naik.
4. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** Execute as **Me**, access **Anyone**. URL kekal sama.
5. Semak: buka URL `/exec` dalam pelayar — anda patut melihat `{"ok":true,"data":{"service":"FSTP Talent Map API",...}}`.
6. Dalam `js/config.js` tetapkan `backend: 'gas'` (URL sudah diisi) dan log masuk sebagai `admin`.

Deploy **versi baharu** setiap kali `Code.gs` disunting, jika tidak URL terus menyajikan kod lama.

## Pangkalan data yang dicipta sebelum versi Bahasa Malaysia

Jalankan fungsi **`terjemahDataKeBM`** sekali (kemudian deploy versi baharu): ia menukar nama 12 kategori kepakaran asal (Inggeris) dan akaun pentadbir kepada Bahasa Malaysia. Jika anda sudah memuatkan data contoh versi lama (rekod berbahasa Inggeris), pilih **Akaun → Buang data contoh**, kemudian **Muatkan 100 pensyarah contoh** semula. Fungsi `resetAdminPassword` pula menetapkan kata laluan admin kepada `admin`.

## Mengapa akses "Anyone" masih agak selamat

URL aplikasi web ialah awam, tetapi setiap tindakan kecuali `login` memerlukan token sesi yang dikeluarkan pelayan, dan setiap penulisan disahkan di pelayan (pensyarah hanya boleh menyentuh baris sendiri; tindakan khusus pentadbir menyemak peranan). Jangan letakkan data yang benar-benar sensitif di sini sehingga ia berpindah ke SQL + pengehosan HTTPS yang anda kawal.

## Had yang perlu diketahui (Sheets ialah penyelesaian sementara)

- Setiap permintaan membaca keseluruhan tab: sesuai untuk sebuah fakulti (ratusan baris), perlahan melebihi beberapa ribu.
- Satu sel memuatkan 50,000 aksara → gambar profil diubah saiz kepada JPEG 200 px dalam pelayar.
- Apps Script menghadkan satu larian skrip kepada 6 minit, dan sesi kepada 6 jam (CacheService).
- `resetAllData()` memadam SEMUA data — jalankan secara manual sahaja.

## Berpindah ke SQL kemudian

1. Cipta skema: `docs/schema.sql` (nama jadual/lajur sama dengan tab; nilai ENUM ialah nilai Bahasa Malaysia).
2. Eksport setiap tab sebagai CSV → import ke jadual MySQL yang bernama sama.
3. Tulis API PHP yang menyediakan tindakan dalam `Code.gs` (`login`, `snapshot`, `create`, `update`, `remove`, `upload`, `download`, `createUser`, …) dengan sampul JSON yang sama `{ok, data | error, code}`.
4. Dalam `js/api.js` halakan `transport()` ke titik akhir baharu. **Tiada perubahan kod paparan.**
5. Pindahkan muat naik daripada Drive ke cakera/S3 (`documents.file_ref`) dan cincang semula kata laluan kepada bcrypt pada log masuk pertama.

## Data contoh (100 pensyarah fiksyen)

Log masuk sebagai admin → **Akaun → Data contoh → Muatkan 100 pensyarah contoh**. Ia menggunakan tindakan `bulkImport` (memerlukan `Code.gs` terkini di-deploy sebagai versi baharu). Setiap id baris contoh bermula dengan `demo_`, jadi **Buang data contoh** (`clearDemo`) memadam baris tersebut sahaja dan tidak menyentuh data sebenar. Pensyarah contoh log masuk dengan nama pengguna mereka + `Lecturer@123`.

Petua: buka laman dengan `?backend=local` untuk menggunakan kotak pasir peribadi dalam pelayar dan bukannya Sheet bersama.
