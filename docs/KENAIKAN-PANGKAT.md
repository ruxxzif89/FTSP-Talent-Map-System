# Modul Kenaikan Pangkat — panduan reka bentuk dan penggunaan

Modul ini melaksanakan **Garis Panduan Kenaikan Pangkat Staf Akademik UPNM (Edisi 2025, LPU 28 Ogos 2025)** di dalam Peta Bakat FSTP. Dokumen PDF Garis Panduan tidak disertakan dalam repositori (fail peribadi); semua peraturan dikodkan sebagai **data** dalam `js/promotion/guideline.js` dengan rujukan perenggan (Perenggan ).

## Prinsip: mesti mesra pengguna dan mesra pentadbir

Garis Panduan itu rumit (108 halaman). Sistem ini menyembunyikan kerumitannya di belakang enjin peraturan, dan skrin hanya menunjukkan **satu perkara seterusnya**:

- **Pensyarah**: satu halaman (`#/kp`) — gred sekarang → sasaran, cincin kesediaan, "3 perkara paling penting", dan **satu** butang utama (Mulakan permohonan / Lihat status). Butang "Tambah rekod" membuka borang dengan jenis rekod yang betul.
- **Pentadbir**: papan kerja (`#/kp-admin`) dengan tab *Perlu tindakan / Semua / Calon berpotensi*; butiran permohonan menunjukkan **satu langkah semasa**, siapa yang bertindak, senarai semak, dan butang keputusan dalam bahasa biasa.
- **Butang "?"** di sebelah setiap istilah / butang yang kelihatan rumit (kira-kira 150 entri dalam `js/help.js`, dengan rujukan Perenggan ). Butang **Bantuan** di bar atas menerangkan halaman semasa. Borang menyembunyikan medan kenaikan pangkat di bawah bahagian pilihan yang dilipat, dan medan lain muncul hanya apabila relevan (contoh: jenis aktiviti).
- **Demo berpandu** (`#/demo-kp`): tiga cerita yang menjalankan **enjin sebenar** pada data fiksyen dalam ingatan.

## Laluan gred yang dilindungi

DS11 → DS13 → DS14 → VK7 → VK6 → VK5. (Laluan Guru Bahasa dan Pensyarah Perubatan "time-based" tidak dilaksanakan.)

## Tetingkap aktiviti (apa yang dikira)

| Ke gred | Aktiviti dikira |
|---|---|
| DS13 | hanya ketika di Gred DS11 (`grade_since`) |
| DS14, VK7 | kumulatif sejak lantikan di UPNM (`appointed_on`) |
| VK6, VK5 | kumulatif sejak di Gred VK7 (`vk7_since`) |

Hanya penerbitan berstatus *Diterbitkan*, penyelidikan / perundingan yang *berdaftar di PPI*, dan penyeliaan yang *bergraduat* dikira. Kesetaraan Perenggan 6.7 (1 bab = 1 SCOPUS, 1 buku = 3, 1 WoS = 2; 1 Sarjana Penyelidikan = 3 Kerja Kursus) dan penggabungan tempoh tatatertib (2.3.5–2.3.8) dilaksanakan dalam `engine.js` dan diuji.

## Aliran kerja permohonan

`draf → fakulti → pendaftar → saringan → [penilai]* → pemilih → lpu → [syarahan]** → berjaya`, dengan cabang `tidak_berjaya → rayuan (≤ 30 hari) → rayuan_berjaya | rayuan_ditolak` dan `ditarik_balik`.
\* hanya DS14 ke atas (3 Penilai Luar). \*\* hanya jawatan Profesor.

Jadual peralihan sah berada di `js/promotion/workflow.js` **dan** disalin dalam `backend/Code.gs` (kemas kini kedua-duanya serentak). Peraturan dikuatkuasakan di pelayan: pensyarah hanya boleh mencipta / menghantar / merayu permohonan sendiri; pentadbir "bertindak sebagai" jawatankuasa berkenaan dan setiap tindakan direkodkan dalam garis masa (`promotion_events`); sekurang-kurangnya 3 laporan Penilai Luar diperlukan sebelum meninggalkan langkah `penilai`; rayuan hanya dalam 30 hari.

## Peranan dan kebenaran

- Pensyarah: baca-sahaja pada `lppt_scores`, `disciplinary`, `promotion_assessors`; **tidak boleh** menulis maklumat perkhidmatan (`SERVICE_FIELDS`) kecuali `scopus_h_index`.
- Pentadbir: menulis `lppt_scores`, `disciplinary`, `promotion_assessors`, dan maklumat perkhidmatan (tab "Maklumat Perkhidmatan" dalam editor profil).
- `promotion_applications` / `promotion_events`: tiada CRUD generik — hanya tindakan `promo*`.

## Fail

| Fail | Peranan |
|---|---|
| `js/promotion/guideline.js` | Garis Panduan sebagai data (RULES, STEPS, FAQ, jawatankuasa, kod Lampiran) |
| `js/promotion/engine.js` | `evaluate()`, `disciplineBlocks()`, `compileLampiran()`, `quickReadiness()` — tulen, tanpa DOM |
| `js/promotion/workflow.js` | jadual peralihan, label butang, tempoh rayuan |
| `js/promotion/demo.js` | data fiksyen untuk demo |
| `js/help.js` | daftar bantuan "?" dan bantuan halaman |
| `js/views/kp*.js`, `panduan.js`, `demoKp.js`, `lampiran.js` | skrin |
| `js/seed-career.js` | data demo kerjaya (gred, LPPT, tatatertib, aktiviti, ~10 permohonan pelbagai status) |
| `tools/test-engine.mjs` | 21 ujian unit yang memetik perenggan Garis Panduan |

Jalankan ujian: `node tools/test-engine.mjs`.

## Had dan andaian (jujur)

- Belum diuji dengan pensyarah / pegawai sebenar (UAT dirancang).
- Laluan Guru Bahasa dan Pensyarah Perubatan "time-based" tidak dilaksanakan.
- Andaian: pengajaran DS13 = sekurang-kurangnya 1 semester + 1 kursus teradun; "kategori kecil" pengiktirafan dipermudah; bendera Syarahan Perdana / Monograf (VK6, VK5) direkodkan pada rekod pensyarah oleh Pejabat Pendaftar.
- Semakan sistem hanyalah panduan: keputusan sebenar dibuat oleh Fakulti, Pejabat Pendaftar dan jawatankuasa.

## Pemasangan di Apps Script

Tampal `backend/Code.gs` yang baharu, jalankan fungsi `setup()` (mencipta 6 helaian baharu dan lajur tambahan), kemudian **Deploy → Manage deployments → New version**.
