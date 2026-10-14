// Sistem bantuan berpandu: butang "?" kecil di sebelah istilah / butang yang rumit, dan "Bantuan halaman" di bar atas.
// Semua teks dalam bahasa biasa (bukan bahasa undang-undang). Rujukan "Perenggan " ialah Garis Panduan Kenaikan Pangkat Staf Akademik UPNM.
import { raw, esc, icon, openDrawer, html, $ } from './util.js';

// t = tajuk, b = penjelasan, eg = contoh (pilihan), ref = rujukan (pilihan)
export const HELP = {
  // ---------- Kenaikan pangkat: konsep ----------
  readiness: { t: 'Apakah "kesediaan"?', b: 'Peratusan ini menunjukkan sejauh mana rekod anda memenuhi syarat wajib minimum bagi gred seterusnya. 100% bermakna semua syarat wajib dipenuhi. Ia hanyalah panduan awal — keputusan sebenar dibuat oleh jawatankuasa.', ref: 'Perenggan 2.3.2(c), Bahagian VI' },
  or_branch: { t: '"Pilih satu" bermaksud apa?', b: 'Garis Panduan memberi beberapa cara untuk memenuhi satu syarat dan anda hanya perlu memenuhi SATU daripadanya (ATAU). Sistem menunjukkan cara yang paling hampir dengan keadaan anda.', ref: 'Bahagian VI' },
  window: { t: 'Aktiviti dari tahun bila yang dikira?', b: 'Bergantung pada gred yang dipohon: ke DS13 hanya aktiviti ketika anda di Gred DS11; ke DS14 dan VK7 dikira kumulatif sejak lantikan di UPNM; ke VK6 dan VK5 dikira sejak anda di Gred VK7. Rekod yang lebih awal tidak dikira.', ref: 'Perenggan 6.2–6.6 nota' },
  equivalence: { t: 'Apakah "setara"?', b: 'Sebahagian penerbitan dan penyeliaan boleh ditukar nilai kepada ukuran asas. Contoh: 1 bab buku = 1 artikel SCOPUS; 1 buku = 3; 1 artikel WoS/ISI = 2. Bagi penyeliaan, 1 pelajar Sarjana (Penyelidikan) = 3 pelajar Sarjana (Kerja Kursus), tetapi tidak boleh sebaliknya.', ref: 'Perenggan 6.7' },
  verdict: { t: 'Maksud status', b: '"Bersedia untuk memohon" = semua syarat wajib dan syarat umum yang dapat disemak sistem telah dipenuhi. "Hampir bersedia" = kurang sedikit lagi. "Belum bersedia" = masih banyak yang perlu ditambah. Status ini hanya panduan; Fakulti dan Pejabat Pendaftar akan mengesahkan.' },
  ppi: { t: 'Berdaftar di PPI', b: 'Penyeliaan, penyelidikan, penerbitan dan perundingan hanya dikira jika didaftarkan di bawah Pusat Pengurusan Penyelidikan dan Inovasi (PPI) UPNM.', ref: 'Perenggan 2.1(v), 6.3 nota (a)' },

  // ---------- Komponen penilaian ----------
  comp_pengajaran: { t: 'Pengajaran', b: 'Anda mesti memenuhi beban tugas pengajaran minimum dan aktif dalam pengajaran teradun (blended). Bagi DS14 ke atas, ini perlu untuk tiga tahun (6 semester). Catat setiap semester dalam "Aktiviti Akademik".', ref: 'Perenggan 6.2–6.6' },
  comp_penyeliaan: { t: 'Penyeliaan', b: 'Bilangan pelajar yang anda selia sehingga bergraduat sebagai Penyelia Utama (atau bersama / setara). Bilangan berbeza mengikut gred. Pelajar yang belum bergraduat tidak dikira kecuali bagi DS13.', ref: 'Perenggan 6.2–6.7.3' },
  comp_penyelidikan: { t: 'Penyelidikan', b: 'Jumlah nilai geran sebagai Ketua Penyelidik dan bilangan projek yang diketuai, termasuk berapa daripadanya geran luar (industri, KPT, agensi kerajaan, antarabangsa). Hanya projek berdaftar di PPI dikira.', ref: 'Perenggan 6.2–6.6' },
  comp_penerbitan: { t: 'Penerbitan', b: 'H-indeks SCOPUS dan bilangan artikel jurnal SCOPUS sebagai penulis utama / corresponding dalam bidang kepakaran anda. Penerbitan lain boleh disetarakan (buku, bab buku, WoS/ISI, dan lain-lain).', ref: 'Perenggan 6.2–6.7' },
  comp_pengiktirafan: { t: 'Pengiktirafan Akademik', b: 'Sanjungan pihak luar terhadap kepakaran anda — contohnya editor atau penilai jurnal, penilai buku, pemeriksa luar tesis, ucaptama, MOOC atau micro-credential yang anda ketuai. Anda hanya perlu memenuhi SATU pilihan.', ref: 'Perenggan 2.1(w), 6.3–6.6' },
  comp_kepimpinan: { t: 'Kepimpinan, Khidmat & Perundingan', b: 'Penglibatan dalam jawatankuasa, jawatan pentadbiran, program pembangunan pelajar, serta projek perundingan dalam bidang kepakaran yang berdaftar di PPI.', ref: 'Perenggan 2.1(v)(x), 6.3–6.6' },
  comp_syarahan: { t: 'Syarahan Perdana & Monograf', b: 'Untuk VK6: anda mesti telah menyampaikan Syarahan Perdana dan menghasilkan Monograf semasa berada di Gred VK7. Pejabat Pendaftar akan merekodkannya.', ref: 'Perenggan 6.5' },

  // ---------- Syarat umum ----------
  gc_confirmed: { t: 'Disahkan dalam perkhidmatan', b: 'Anda mesti telah disahkan dalam jawatan. Tarikh pengesahan direkodkan oleh Pejabat Pendaftar. Jika kosong, hubungi Pentadbir.', ref: 'Perenggan 2.3.1(a)' },
  gc_permanent: { t: 'Lantikan tetap', b: 'Hanya staf lantikan tetap boleh dipertimbangkan. Staf kontrak dan pinjaman mengikut garis panduan ini hanya bagi pelantikan ke gred lebih tinggi.', ref: 'Perenggan 2.3.4(b), 1.4' },
  gc_lppt: { t: 'Markah LPPT', b: 'Laporan Penilaian Prestasi Tahunan (LPPT) tiga tahun terkini mesti ada dan puratanya sekurang-kurangnya 80%. Markah dimasukkan oleh Pentadbir.', ref: 'Perenggan 2.3.2(a)' },
  gc_discipline: { t: 'Hukuman tatatertib', b: 'Calon yang pernah dihukum tidak layak untuk satu tempoh: Amaran 12 bulan, Denda 18, Lucut Hak Emolumen 24, Tangguh Pergerakan Gaji 30, Turun Gaji 36, Turun Pangkat 48 bulan — dikira dari tarikh hukuman.', ref: 'Perenggan 2.3.5–2.3.8' },
  gc_service: { t: 'Tempoh perkhidmatan (hanya ke DS13)', b: 'Calon yang memiliki PhD layak dipertimbangkan. Tanpa PhD: perlu 12 tahun di Gred DS11. Tanpa PhD tetapi ada kelayakan profesional (contoh Ir.): perlu 10 tahun perkhidmatan.', ref: 'Perenggan 6.2 nota (c)–(e)' },
  gc_asset: { t: 'Pengisytiharan harta', b: 'Surat kelulusan pengisytiharan harta mesti dilampirkan. Disahkan oleh Pejabat Pendaftar.', ref: 'Perenggan 2.3.1(e), 5.2.2' },
  gc_sprm: { t: 'Tapisan keutuhan SPRM', b: 'Calon mesti lulus tapisan keutuhan Suruhanjaya Pencegahan Rasuah Malaysia. Borang tapisan dilampirkan dalam permohonan.', ref: 'Perenggan 2.3.1(f)' },
  gc_loan: { t: 'Peminjam pendidikan tegar', b: 'Calon tidak boleh disenaraikan sebagai peminjam pendidikan tegar oleh institusi pinjaman.', ref: 'Perenggan 2.3.1(g)' },
  gc_dean: { t: 'Perakuan Dekan / Pengarah', b: 'Dekan atau Pengarah Pusat/Akademi mengesahkan Borang Permohonan dan Senarai Semak.', ref: 'Perenggan 2.3.1(c), 3.2' },
  gc_kesepakaran: { t: 'Perakuan Jawatankuasa Kesepakaran', b: 'Jawatankuasa di peringkat Fakulti menilai permohonan dan hanya memperakukan calon yang benar-benar layak.', ref: 'Perenggan 4.3' },

  // ---------- Semakan setiap langkah (pentadbir) ----------
  chk_lengkap: { t: 'Kelengkapan permohonan', b: 'Semak bahawa Lampiran 1 (CV), Lampiran 2, Lampiran 3 dan dokumen sokongan bagi setiap komponen telah dikemukakan.', ref: 'Perenggan 5.2.2.1' },
  chk_dean: { t: 'Pengesahan Dekan', b: 'Dekan / Pengarah perlu menandatangani dan mengecap Borang Permohonan serta Senarai Semak.', ref: 'Perenggan 3.2.1' },
  chk_kesepakaran: { t: 'Penilaian Jawatankuasa Kesepakaran', b: 'Jawatankuasa menilai dengan Borang Lampiran 2 dan memperakukan calon. Bagi Profesor Madya / Profesor, ia juga menamakan Penilai Luar.', ref: 'Perenggan 4.3.4' },
  chk_minit: { t: 'Minit mesyuarat', b: 'Minit mesyuarat Jawatankuasa Kesepakaran Fakulti mesti disertakan bersama permohonan.', ref: 'Perenggan 5.2.2.1(ii)' },
  chk_beban: { t: 'Beban tugas & penilaian pengajaran', b: 'Lampiran beban tugas akademik dan penilaian pengajaran pensyarah untuk 3 tahun (6 semester).', ref: 'Perenggan 5.2.2.1(vii)(viii)' },
  chk_layak: { t: 'Layak ke temuduga?', b: 'Jawatankuasa Saringan memastikan calon menepati syarat skim dan kriteria minimum, kemudian memperakukan siapa yang dibawa ke temuduga.', ref: 'Perenggan 4.2, 5.3.2' },
  chk_tiga: { t: 'Tiga Penilai Luar', b: 'Fakulti mencalonkan 5 penilai; 3 daripadanya dipilih dan mesti memenuhi semua kriteria pemilihan (lihat panel Penilai Luar).', ref: 'Perenggan 3.5.4–3.5.8' },
  chk_laporan: { t: 'Laporan Penilai Luar', b: 'Setiap penilai menghantar laporan mengikut format Universiti. Ketiga-tiga laporan diperlukan sebelum calon ke Jawatankuasa Pemilih.', ref: 'Perenggan 3.5.7' },
  chk_temuduga: { t: 'Temuduga', b: 'Urus Setia memaklumkan calon terpilih untuk menghadiri temuduga.', ref: 'Perenggan 5.3.2' },
  chk_pilih: { t: 'Jawatankuasa Pemilih', b: 'Jawatankuasa Pemilih bersidang dan memilih calon yang layak dinaikkan pangkat; gaji permulaan juga ditetapkan.', ref: 'Perenggan 4.1' },
  chk_lpu: { t: 'Mesyuarat LPU', b: 'Selain Profesor: dibawa ke LPU untuk pemakluman. Profesor: dibawa untuk pertimbangan dan kelulusan.', ref: 'Perenggan 5.3.3' },
  chk_syarahan: { t: 'Syarahan', b: 'VK7: Syarahan Ilmiah selepas berjaya temuduga. VK6/VK5: Syarahan Perdana. Gaji VK7 hanya bergerak selepas syarahan.', ref: 'Perenggan 2.1(z)' },

  // ---------- Penilai Luar ----------
  as_h: { t: 'H-Index SCOPUS penilai', b: 'Penilai Luar mesti mempunyai H-Index SCOPUS sekurang-kurangnya 10 (Sains & Teknologi / Klinikal) atau 7 (Sains Sosial).', ref: 'Perenggan 3.5.8(ii)' },
  as_sameInst: { t: 'Institusi sama?', b: 'Penilai tidak boleh dari institusi pengajian yang sama dengan calon semasa tempoh pengajian calon.', ref: 'Perenggan 3.5.8(i)' },
  as_neverUpnm: { t: 'Pernah berkhidmat di UPNM?', b: 'Penilai tidak pernah berkhidmat di UPNM (kontrak atau tetap) dalam tempoh yang sama dengan perkhidmatan calon.', ref: 'Perenggan 3.5.8(iii)' },
  as_neverSuper: { t: 'Pernah menjadi penyelia calon?', b: 'Penilai tidak pernah menjadi penyelia projek ilmiah, disertasi atau tesis (Sarjana / PhD) calon.', ref: 'Perenggan 3.5.8(iv)' },
  as_noRelation: { t: 'Hubungan dengan calon', b: 'Penilai bukan penyelia tesis calon, bukan rakan atau bekas rakan setugas calon, dan bukan suami / isteri penyelia tesis calon.', ref: 'Perenggan 3.5.8(v)' },
  as_institution: { t: 'Taraf institusi', b: 'Penilai mesti dari institusi pengajian tinggi yang setaraf UPNM atau lebih tinggi.', ref: 'Perenggan 3.5.8(vi)' },

  // ---------- Medan borang ----------
  f_res_role: { t: 'Peranan dalam projek', b: 'Pilih "Ketua Penyelidik" jika anda mengetuai projek; "Ahli" jika anda penyelidik bersama. Hanya projek yang anda ketuai dikira bagi jumlah nilai geran (DS14 ke atas).' },
  f_res_source: { t: 'Sumber geran', b: 'Geran Dalam = geran UPNM yang diluluskan PPI. Geran Luar = industri, Kementerian Pendidikan Tinggi (KPT), agensi kerajaan atau antarabangsa. Sebahagian syarat meminta bilangan geran luar.', ref: 'Perenggan 6.3 nota (b)(c)' },
  f_res_amount: { t: 'Nilai geran', b: 'Masukkan nilai dalam Ringgit seperti tercatat dalam surat tawaran. Nilai setiap geran mesti sekurang-kurangnya RM20,000 (RM5,000 bagi Sains Sosial) untuk dikira dalam jumlah, mulai DS14.' },
  f_ppi: { t: 'Berdaftar di PPI?', b: 'Hanya projek / perundingan yang didaftarkan di Pusat Pengurusan Penyelidikan dan Inovasi UPNM dikira untuk kenaikan pangkat. Pilih "Tidak" jika belum berdaftar.', ref: 'Perenggan 2.1(v)' },
  f_pub_type: { t: 'Jenis penerbitan', b: 'Pilih jenis yang paling tepat. Jenis berlainan dinilai berbeza (contoh: bab buku dan buku boleh disetarakan dengan artikel SCOPUS).', ref: 'Perenggan 6.7' },
  f_pub_index: { t: 'Pengindeksan', b: 'Pilih pangkalan data yang mengindeks penerbitan ini. Hanya artikel berindeks SCOPUS dikira terus; WoS/ISI disetarakan (1 = 2 SCOPUS).', ref: 'Perenggan 6.7.2' },
  f_pub_role: { t: 'Peranan sebagai penulis', b: '"Penulis Utama / Corresponding" dikira bagi kebanyakan syarat. "Penulis Bersama" hanya dikira dalam bahagian "penerbitan setara / penulis bersama".', ref: 'Perenggan 6.3–6.6' },
  f_pub_status: { t: 'Status penerbitan', b: 'Hanya penerbitan berstatus "Diterbitkan" dikira.' },
  f_con_role: { t: 'Peranan perundingan', b: '"Perunding Utama" = anda ketua projek perundingan. Syarat gred lebih tinggi meminta bilangan projek sebagai Perunding Utama.', ref: 'Perenggan 6.3–6.6' },
  f_con_kind: { t: 'Adakah ini perundingan yang dikira?', b: 'Perundingan ialah khidmat dalam bidang kepakaran untuk menyelesaikan masalah pihak yang melantik. TIDAK dikira: ceramah / pembentangan, pemeriksa tesis, penilai kenaikan pangkat, penyunting jurnal, tenaga pengajar program eksekutif, hakim / juri dan semua lantikan dalaman UPNM.', ref: 'Perenggan 2.1(v)' },
  f_con_amount: { t: 'Nilai perundingan', b: 'Perundingan yang menjana kewangan amat digalakkan. Anda boleh mengosongkan nilai jika tiada kewangan. Satu syarat meminta jumlah nilai projek sebagai Perunding Utama (contoh RM20,000).' },
  f_act_kind: { t: 'Pilih jenis aktiviti', b: 'Jenis menentukan medan yang perlu diisi. Contoh: "Penyeliaan pelajar PhD" meminta nama pelajar dan sama ada telah bergraduat; "Ahli jawatankuasa" meminta peringkat jawatankuasa.' },
  f_act_level: { t: 'Peringkat', b: 'Antarabangsa, Kebangsaan, Negeri, Universiti atau Fakulti/Pusat/Akademi. Sesetengah syarat hanya mengira peringkat kebangsaan / antarabangsa.' },
  f_act_role: { t: 'Peranan penyelia', b: '"Penyelia Utama" bagi pelajar yang anda selia utama; "Penyelia Bersama" jika anda hanya penyelia bersama. Hampir semua syarat meminta Penyelia Utama.', ref: 'Perenggan 6.3–6.6' },
  f_act_grad: { t: 'Telah bergraduat?', b: 'Bagi DS14 ke atas, hanya pelajar yang telah bergraduat dikira. Pilih "Ya" hanya selepas pelajar tamat pengajian.' },
  f_act_workload: { t: 'Beban tugas minimum', b: 'Pilih "Ya" jika beban tugas pengajaran anda pada semester ini memenuhi minimum fakulti. Pengesahan rasmi dibuat oleh Fakulti.' },
  f_act_blended: { t: 'Pengajaran teradun (blended)', b: 'Pilih "Ya" jika sekurang-kurangnya satu kursus anda menggunakan platform maya (contoh MS Teams, Al-Fateh eLearning) bersama pengajaran bersemuka.' },
  f_act_terms: { t: 'Bilangan penggal', b: 'Jumlah penggal anda memegang jawatan pentadbiran berelaun di UPNM (contoh: Timbalan Dekan 1 penggal).' },
  f_act_bukti: { t: 'Bukti sokongan', b: 'Muat naik surat lantikan, sijil atau bukti lain. Jawatankuasa menilai berdasarkan bukti yang dikemukakan.', ref: 'Perenggan 3.1.1(iv)' },
  f_lppt: { t: 'Markah LPPT', b: 'Masukkan markah peratus tahunan. Sistem mengira purata tiga tahun terkini.' },
  f_dis_case: { t: 'No. kes', b: 'Beberapa hukuman bagi pertuduhan yang sama diberi nombor kes yang sama — sistem mengambil hukuman yang paling berat. Kes berlainan yang bertindih digabungkan sehingga semuanya tamat.', ref: 'Perenggan 2.3.7–2.3.8' },
  f_dis_penalty: { t: 'Jenis hukuman', b: 'Tempoh tidak layak: Amaran 12 bulan, Denda 18, Lucut Hak Emolumen 24, Tangguh Pergerakan Gaji 30, Turun Gaji 36, Turun Pangkat 48.', ref: 'Perenggan 2.3.5' },
  f_grade: { t: 'Gred semasa', b: 'Gred hakiki pensyarah. Sistem menentukan gred seterusnya secara automatik (DS11→DS13→DS14→VK7→VK6→VK5).', ref: 'Perenggan 1.3' },
  f_grade_since: { t: 'Tarikh masuk gred semasa', b: 'Digunakan untuk menentukan aktiviti yang dikira (contoh: ke DS13 hanya aktiviti sejak masuk DS11).', ref: 'Perenggan 6.2 nota (b)' },
  f_appointed: { t: 'Tarikh lantikan di UPNM', b: 'Aktiviti dikira kumulatif sejak tarikh ini bagi permohonan ke DS14 dan VK7.', ref: 'Perenggan 6.3 nota (a)' },
  f_confirmed: { t: 'Tarikh disahkan dalam perkhidmatan', b: 'Syarat umum: calon mesti telah disahkan dalam perkhidmatan.', ref: 'Perenggan 2.3.1(a)' },
  f_vk7: { t: 'Tarikh masuk Gred VK7', b: 'Diperlukan bagi permohonan ke VK6 dan VK5: aktiviti dikira kumulatif sejak di VK7.', ref: 'Perenggan 6.5–6.6 nota (b)' },
  f_field: { t: 'Bidang', b: 'Menentukan angka syarat: Sains & Teknologi / Pra-klinikal (semua pensyarah FSTP), Sains Sosial, atau Klinikal. Jika tidak pasti, rujuk Jawatankuasa Kesepakaran Fakulti.', ref: 'Perenggan 2.1(y)' },
  f_phd: { t: 'Memiliki PhD?', b: 'Menentukan syarat tempoh perkhidmatan ke DS13.', ref: 'Perenggan 6.2 nota (c)–(e)' },
  f_profq: { t: 'Kelayakan profesional', b: 'Contoh Ir. atau setara. Bagi calon tanpa PhD, 10 tahun perkhidmatan memadai (bukannya 12).', ref: 'Perenggan 6.2 nota (e)' },
  f_employment: { t: 'Jenis lantikan', b: 'Hanya lantikan tetap layak dipertimbangkan kenaikan pangkat.', ref: 'Perenggan 2.3.4(b)' },
  f_syarahan: { t: 'Syarahan Perdana', b: 'Direkodkan oleh Pejabat Pendaftar. Diperlukan bagi permohonan ke VK6.', ref: 'Perenggan 6.5' },
  f_monograf: { t: 'Monograf', b: 'Direkodkan oleh Pejabat Pendaftar. Diperlukan bersama Syarahan Perdana bagi permohonan ke VK6.', ref: 'Perenggan 6.5' },
  f_hindex: { t: 'H-indeks SCOPUS', b: 'Ambil nombor daripada profil SCOPUS anda dan kemas kini apabila ia berubah. Bukti (tangkapan skrin) perlu dilampirkan semasa permohonan.', ref: 'Perenggan 6.3–6.6, C33' },

  // ---------- Halaman rekod ----------
  ent_activities: { t: 'Aktiviti Akademik', b: 'Tempat mencatat penyeliaan pelajar, semester pengajaran, jawatankuasa, jawatan pentadbiran dan pengiktirafan akademik. Rekod-rekod ini digunakan oleh semakan Kenaikan Pangkat — anda tidak perlu mengisinya dua kali.' },
  ent_lppt: { t: 'Markah LPPT', b: 'Pentadbir memasukkan markah LPPT setiap tahun. Tiga tahun terkini mesti ada dan puratanya sekurang-kurangnya 80%.', ref: 'Perenggan 2.3.2(a)' },
  ent_disciplinary: { t: 'Hukuman Tatatertib', b: 'Hanya rekod hukuman yang menjejaskan kelayakan. Sistem mengira tarikh calon boleh dipertimbangkan semula.', ref: 'Perenggan 2.3.5–2.3.8' },

  // ---------- Butang & ciri sedia ada ----------
  btn_export_csv: { t: 'Eksport CSV', b: 'Memuat turun senarai di bawah (selepas carian / penapis) sebagai fail CSV yang boleh dibuka dalam Excel atau Google Sheets.' },
  btn_galaxy: { t: 'Galaksi 3D', b: 'Paparan 3D kepakaran fakulti. Setiap bulatan besar ialah satu kategori kepakaran; setiap titik ialah seorang pensyarah. Seret untuk memutar, tatal untuk zum, klik titik untuk membuka profil.' },
  btn_view_toggle: { t: 'Kad atau Galaksi 3D', b: '"Kad" menunjukkan senarai pensyarah yang sepadan. "Galaksi 3D" menunjukkan taburan yang sama secara visual; carian dan penapis di atas turut menyerlahkan titik yang sepadan.' },
  tm_search: { t: 'Cara mencari', b: 'Taip nama pensyarah, bidang kepakaran atau topik penyelidikan. Gunakan penapis Jabatan dan Tahap untuk mengecilkan hasil, atau klik satu kategori di sebelah kiri.' },
  tm_sort: { t: 'Isih', b: '"Kaitan" meletakkan pakar yang paling sepadan di atas (tahap tinggi, pengalaman lama). "Pengalaman" mengikut tahun pengalaman.' },
  users_reset_pw: { t: 'Tetap semula kata laluan', b: 'Menetapkan kata laluan baharu bagi pengguna ini (minimum 8 aksara dengan huruf dan nombor). Sampaikan kata laluan kepada pengguna dan minta mereka menukarnya.' },
  users_delete: { t: 'Padam pengguna', b: 'Memadam akaun DAN semua rekod pensyarah itu secara kekal. Jika hanya mahu menghalang log masuk, ubah status kepada "Tidak Aktif" sebaliknya.' },
  users_role: { t: 'Peranan', b: '"Pensyarah" boleh mengurus rekod sendiri. "Pentadbir" boleh melihat semua rekod, mengurus akaun dan kategori, serta memproses permohonan kenaikan pangkat. Peranan tidak boleh ditukar selepas akaun dicipta.' },
  cat_color: { t: 'Warna kategori', b: 'Warna digunakan dalam carta dan galaksi 3D. Masukkan kod hex 6 digit seperti #1d5fd1.' },
  reports_filters: { t: 'Penapis laporan', b: 'Pilih jenis laporan, kemudian tapis mengikut jabatan, tahap atau tahun. Pratonton dipaparkan terus; gunakan Eksport CSV atau Cetak untuk menyimpan.' },
  reports_print: { t: 'Cetak / PDF', b: 'Membuka dialog cetak pelayar. Pilih "Simpan sebagai PDF" untuk mendapatkan fail PDF.' },
  sample_load: { t: 'Muatkan pensyarah contoh', b: 'Menambah 100 pensyarah fiksyen (lengkap dengan rekod kenaikan pangkat) untuk melihat sistem pada skala sebenar. Baris contoh ditandakan supaya boleh dibuang tanpa menjejaskan data sebenar.' },
  sample_clear: { t: 'Buang data contoh', b: 'Memadam hanya pensyarah dan rekod contoh. Akaun dan data sebenar tidak terjejas.' },
  demo_reset: { t: 'Tetap semula data demo', b: 'Memulihkan data contoh asal dalam pelayar ini dan melog keluar semua pengguna.' },
  theme_toggle: { t: 'Tema', b: 'Tukar antara paparan cerah dan gelap. Pilihan anda diingati dalam pelayar ini.' },
  profile_photo: { t: 'Gambar profil', b: 'Pilih gambar JPG atau PNG (maksimum 2 MB). Gambar dipotong kepada petak dan dikecilkan secara automatik.' },
  remember_me: { t: 'Ingat saya', b: 'Kekalkan log masuk pada pelayar ini selepas ia ditutup. Jangan tandakan pada komputer yang dikongsi.' },
  doc_upload: { t: 'Muat naik dokumen', b: 'Fail PDF, JPG, PNG atau DOC sehingga 5 MB. Fail hanya boleh dilihat oleh anda dan pentadbir.' },

  // ---------- Kenaikan pangkat: halaman & butang ----------
  kp_start: { t: 'Mulakan permohonan', b: 'Mencipta draf permohonan untuk gred seterusnya. Anda boleh mengisi dan menyimpannya beberapa kali sebelum menghantar kepada Fakulti. Anda tidak boleh mengubahnya selepas dihantar.' },
  kp_preview: { t: 'Cetak borang', b: 'Menjana borang rasmi (Lampiran 1: CV, Lampiran 3: Senarai Semak) daripada rekod anda, siap untuk dicetak atau disimpan sebagai PDF.' },
  kp_stepper: { t: 'Carta proses', b: 'Menunjukkan langkah-langkah permohonan mengikut Garis Panduan. Langkah yang dilampaui bagi gred anda (contoh Penilai Luar untuk DS13) tidak dipaparkan.', ref: 'Perenggan 5.3' },
  kp_appeal: { t: 'Rayuan', b: 'Jika terkilan dengan keputusan, anda boleh merayu secara bertulis dalam tempoh 30 hari dari tarikh keputusan dimaklumkan. Keputusan Jawatankuasa Rayuan adalah muktamad.', ref: 'Perenggan 2.7–2.8' },
  kp_act: { t: 'Tindakan seterusnya', b: 'Pilih keputusan jawatankuasa bagi langkah ini. Setiap tindakan direkodkan dalam garis masa dengan nama dan peranan anda. Tandakan item semakan dahulu.' },
  kp_as: { t: 'Bertindak sebagai', b: 'Setiap langkah dilakukan oleh jawatankuasa atau pegawai tertentu. Pilih peranan yang sedang anda wakili supaya direkodkan dengan betul.' },
  kp_assessor_add: { t: 'Calonkan Penilai Luar', b: 'Fakulti mencalonkan 5 penilai bergred lebih tinggi, daripada mana 3 dipilih. Masukkan butiran dan semak setiap kriteria. Honorarium RM300 (dalam negara) atau USD100 (luar negara).', ref: 'Perenggan 3.5' },
  kp_candidates: { t: 'Calon berpotensi', b: 'Senarai pensyarah yang hampir atau sudah memenuhi syarat wajib minimum bagi gred seterusnya, dikira daripada rekod mereka. Gunakan untuk mengenal pasti calon yang boleh digalakkan memohon.' },
  kp_tatatertib_calc: { t: 'Kalkulator tempoh tatatertib', b: 'Masukkan hukuman dan tarikh; sistem mengira bila anda boleh dipertimbangkan semula mengikut Garis Panduan.', ref: 'Perenggan 2.3.5–2.3.8' },
  kp_demo: { t: 'Demo berpandu', b: 'Lihat satu permohonan dari awal hingga akhir dalam beberapa langkah ringkas, dengan penjelasan di setiap langkah. Data demo tidak menjejaskan rekod sebenar.' },
};

// Bantuan halaman: apa fungsi halaman dan tiga tugas biasa
export const PAGE_HELP = {
  dashboard_admin: { t: 'Papan Pemuka Pentadbir', b: 'Gambaran keseluruhan bakat fakulti.', tasks: ['Lihat jumlah pensyarah, kategori, penerbitan dan pensijilan pada kad di atas.', 'Teroka Galaksi Kepakaran 3D (klik titik untuk membuka profil pensyarah).', 'Pergi ke Kenaikan Pangkat di menu kiri untuk memproses permohonan.'] },
  dashboard_lecturer: { t: 'Papan Pemuka Anda', b: 'Ringkasan rekod anda.', tasks: ['Semak peratus kelengkapan profil dan lengkapkan yang kurang.', 'Klik mana-mana kad untuk menambah atau melihat rekod.', 'Buka Kenaikan Pangkat untuk menyemak kelayakan anda.'] },
  profile: { t: 'Profil Saya', b: 'Maklumat peribadi dan profesional anda.', tasks: ['Tukar gambar profil.', 'Kemas kini telefon, lokasi dan biodata.', 'Kemas kini H-indeks SCOPUS anda (digunakan oleh semakan Kenaikan Pangkat).'] },
  lecturers: { t: 'Direktori Pensyarah', b: 'Semua pensyarah FSTP.', tasks: ['Cari mengikut nama, no. staf atau e-mel.', 'Tapis mengikut jabatan.', 'Klik seorang pensyarah untuk melihat profil dan menyunting maklumat perkhidmatan.'] },
  talent: { t: 'Pemetaan Bakat', b: 'Cari pakar mengikut kepakaran.', tasks: ['Taip kata kunci (contoh "forensik") atau pilih satu kategori di kiri.', 'Tapis jabatan dan tahap kepakaran.', 'Tukar ke Galaksi 3D untuk melihat taburan secara visual.'] },
  users: { t: 'Urus Pengguna', b: 'Akaun pengguna sistem.', tasks: ['Tambah akaun pensyarah atau pentadbir.', 'Tetap semula kata laluan bagi pengguna yang terlupa.', 'Ubah status kepada Tidak Aktif untuk menghalang log masuk.'] },
  categories: { t: 'Kategori Kepakaran', b: 'Bidang yang boleh dipetakan kepada pensyarah.', tasks: ['Tambah atau namakan semula kategori.', 'Pilih warna untuk carta dan galaksi.', 'Kategori yang sedang digunakan tidak boleh dipadam.'] },
  stats: { t: 'Statistik', b: 'Angka kepakaran dan output fakulti.', tasks: ['Lihat kategori yang paling ramai pakar.', 'Kenal pasti pensyarah yang belum merekodkan kepakaran.'] },
  reports: { t: 'Laporan', b: 'Jana laporan fakulti.', tasks: ['Pilih jenis laporan.', 'Tapis mengikut jabatan, tahap atau tahun.', 'Eksport CSV atau cetak ke PDF.'] },
  account: { t: 'Akaun & Kata Laluan', b: 'Tetapan akaun anda.', tasks: ['Tukar kata laluan anda (minimum 8 aksara dengan huruf dan nombor).'] },
  records: { t: 'Halaman Rekod', b: 'Senarai rekod anda.', tasks: ['Klik "Tambah" untuk rekod baharu — borang terbuka di sisi.', 'Gunakan kotak carian untuk menapis senarai.', 'Klik ikon pensil untuk mengubah atau tong sampah untuk memadam.'] },
  kp: { t: 'Kenaikan Pangkat Anda', b: 'Semak kesediaan anda dan mohon apabila bersedia.', tasks: ['Lihat status kesediaan dan perkara yang perlu dilengkapkan.', 'Klik "Tambah rekod" pada kad yang kurang — borang terbuka dengan jenis yang betul.', 'Apabila bersedia, klik "Mulakan permohonan".'] },
  kp_mohon: { t: 'Permohonan Kenaikan Pangkat', b: 'Empat langkah ringkas.', tasks: ['Semak maklumat peribadi dan kelayakan.', 'Semak aktiviti yang dikumpul daripada rekod anda.', 'Beri pengakuan dan hantar kepada Fakulti.'] },
  kp_admin: { t: 'Papan Kerja Kenaikan Pangkat', b: 'Semua permohonan mengikut langkah.', tasks: ['Klik "Perlu tindakan" untuk melihat apa yang menunggu anda.', 'Klik satu permohonan untuk melihat langkah seterusnya.', 'Gunakan "Calon berpotensi" untuk mencari pensyarah yang sudah hampir layak.'] },
  kp_detail: { t: 'Butiran Permohonan', b: 'Satu permohonan, satu tindakan seterusnya.', tasks: ['Baca "Apa berlaku di langkah ini".', 'Tandakan item semakan dan klik butang keputusan.', 'Semak garis masa dan penilai luar di sebelah kanan.'] },
  panduan: { t: 'Panduan Kenaikan Pangkat', b: 'Ringkasan Garis Panduan dalam bahasa biasa.', tasks: ['Cari soalan di kotak carian.', 'Gunakan Kalkulator tatatertib untuk mengira tempoh tidak layak.', 'Buka Demo berpandu untuk melihat proses dari awal ke akhir.'] },
  demo_kp: { t: 'Demo Kenaikan Pangkat', b: 'Cerita berpandu langkah demi langkah.', tasks: ['Pilih satu cerita.', 'Tekan "Seterusnya" atau ▶ untuk main automatik.', 'Cuba "Bagaimana jika" untuk melihat kesediaan berubah apabila rekod ditambah.'] },
  lppt_scores: { t: 'Markah LPPT', b: 'Markah prestasi tahunan.', tasks: ['Tambah markah setiap tahun bagi setiap pensyarah.'] },
  disciplinary: { t: 'Hukuman Tatatertib', b: 'Rekod hukuman yang menjejaskan kelayakan.', tasks: ['Tambah hukuman dengan tarikh dijatuhkan.', 'Nombor kes yang sama = satu pertuduhan.'] },
};

// ---------- Komponen UI ----------
export const helpBtn = (key, name = '') => raw(`<button type="button" class="hp" data-help="${esc(key)}" aria-label="Penerangan${name ? ': ' + esc(name) : ''}" aria-haspopup="dialog" aria-expanded="false">?</button>`);

let pop = null, popBtn = null;
function closePop() { if (pop) { pop.remove(); pop = null; } if (popBtn) { popBtn.setAttribute('aria-expanded', 'false'); const b = popBtn; popBtn = null; try { b.focus({ preventScroll: true }); } catch { /* elemen sudah tiada */ } } }
function openPop(btn) {
  const c = HELP[btn.dataset.help];
  if (!c) { console.warn('Bantuan tiada:', btn.dataset.help); return; }
  closePop();
  pop = document.createElement('div'); pop.className = 'hp-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', c.t); pop.tabIndex = -1;
  pop.innerHTML = `<h4>${esc(c.t)}</h4><p>${esc(c.b)}</p>${c.eg ? `<p class="eg"><b>Contoh:</b> ${esc(c.eg)}</p>` : ''}${c.ref ? `<p class="ref">Rujukan Garis Panduan: ${esc(c.ref)}</p>` : ''}<button type="button" class="btn ghost sm" data-hp-close>Faham</button>`;
  document.body.append(pop); popBtn = btn; btn.setAttribute('aria-expanded', 'true');
  const r = btn.getBoundingClientRect(), w = Math.min(340, innerWidth - 24);
  pop.style.width = w + 'px';
  let left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2));
  pop.style.left = left + 'px';
  const h = pop.offsetHeight; let top = r.bottom + 10;
  if (top + h > innerHeight - 12) top = Math.max(12, r.top - h - 10);
  pop.style.top = top + 'px';
  pop.focus({ preventScroll: true });
}
let wired = false;
export function wireHelp() {
  if (wired) return; wired = true;
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.hp');
    if (b) { e.preventDefault(); e.stopPropagation(); const k = b.dataset.help; if (!HELP[k] && PAGE_HELP[k]) { closePop(); openPageHelp(k); return; } if (popBtn === b) closePop(); else openPop(b); return; }
    if (e.target.closest('[data-hp-close]')) { closePop(); return; }
    if (pop && !e.target.closest('.hp-pop')) closePop();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pop) { e.stopPropagation(); closePop(); } }, true);
  addEventListener('hashchange', closePop); addEventListener('resize', closePop);
}

export function openPageHelp(key) {
  const h = PAGE_HELP[key] || PAGE_HELP.records;
  openDrawer({
    title: 'Bantuan halaman',
    body: html`<div class="stack"><div><h3 style="font-size:20px;font-weight:800;margin-bottom:6px">${h.t}</h3><p class="muted">${h.b}</p></div><div><h4 class="small" style="text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);margin-bottom:8px">Apa yang biasa anda lakukan di sini</h4><ol class="steps-list">${h.tasks.map((t) => html`<li>${t}</li>`)}</ol></div><p class="small muted">Lihat butang <span class="hp" aria-hidden="true" style="pointer-events:none">?</span> di sebelah istilah atau butang yang kurang jelas untuk penjelasan ringkas.</p></div>`,
  });
}
