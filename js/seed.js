// Deterministic demo data (fictional people). Runs once in the local backend.
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const CATS = [
  ['Keselamatan Siber', '#1d5fd1', ['Forensik Digital', 'Keselamatan Rangkaian', 'Perisikan Ancaman Siber', 'Ujian Penembusan', 'Tindak Balas Insiden']],
  ['Kecerdasan Buatan', '#7c3aed', ['Pembelajaran Mesin', 'Penglihatan Komputer', 'Pemprosesan Bahasa Semula Jadi', 'Pembelajaran Mendalam']],
  ['Rangkaian', '#0891b2', ['Rangkaian Tanpa Wayar', 'Protokol Rangkaian', 'Rangkaian Tertakrif Perisian', 'Pemantauan Rangkaian']],
  ['Pangkalan Data', '#16a34a', ['Reka Bentuk Pangkalan Data', 'Gudang Data', 'Pengoptimuman Pertanyaan', 'Sistem NoSQL']],
  ['Forensik Digital', '#e11d48', ['Forensik Mudah Alih', 'Forensik Memori', 'Forensik Awan', 'Pengendalian Bukti']],
  ['Kejuruteraan Perisian', '#ea580c', ['Kejuruteraan Keperluan', 'Pengujian Perisian', 'DevOps', 'Seni Bina Perisian']],
  ['Keselamatan Maklumat', '#0f766e', ['Audit Keselamatan', 'Pengurusan Risiko', 'Kriptografi', 'Dasar Keselamatan']],
  ['Sains Data', '#ca8a04', ['Analitik Data', 'Data Raya', 'Pemodelan Ramalan', 'Visualisasi Data']],
  ['Internet Benda (IoT)', '#4f46e5', ['Sistem Terbenam', 'Penderia Pintar', 'Keselamatan IoT', 'Pengkomputeran Pinggir']],
  ['Matematik & Pemodelan', '#be185d', ['Kaedah Berangka', 'Penyelidikan Operasi', 'Statistik', 'Pengoptimuman']],
  ['Teknologi Pertahanan', '#475569', ['Sistem Perintah & Kawalan', 'Simulasi Ketenteraan', 'Analitik Pertahanan', 'Komunikasi Selamat']],
  ['Lain-lain', '#64748b', ['Teknologi Pendidikan', 'Interaksi Manusia-Komputer', 'E-Kerajaan']],
];
// Nama lama (Inggeris) -> supaya pangkalan data sedia ada yang belum diterjemah masih boleh dipadankan.
const CAT_EN = { 'Keselamatan Siber': 'Cybersecurity', 'Kecerdasan Buatan': 'Artificial Intelligence', 'Rangkaian': 'Networking', 'Pangkalan Data': 'Database', 'Forensik Digital': 'Digital Forensics', 'Kejuruteraan Perisian': 'Software Engineering', 'Keselamatan Maklumat': 'Information Security', 'Sains Data': 'Data Science', 'Internet Benda (IoT)': 'Internet of Things', 'Matematik & Pemodelan': 'Mathematics & Modelling', 'Teknologi Pertahanan': 'Defence Technology', 'Lain-lain': 'Others' };

const MALE = ['Ahmad', 'Harun', 'Zulkifli', 'Faizal', 'Hafiz', 'Rashid', 'Imran', 'Syafiq', 'Nazri', 'Kamal', 'Azman', 'Shahrul', 'Khairul', 'Razak'];
const FEMALE = ['Aisyah', 'Farhana', 'Nurul', 'Siti', 'Zarina', 'Hidayah', 'Aminah', 'Najwa', 'Rohana', 'Liyana', 'Sofea', 'Marlina', 'Fatimah', 'Haslinda'];
const FATHER = ['Ismail', 'Omar', 'Zulkifli', 'Hassan', 'Yusof', 'Abdullah', 'Jamal', 'Rahman', 'Salleh', 'Mansor', 'Ibrahim', 'Karim', 'Aziz', 'Latif'];
const CN_FIRST = ['Wei Ming', 'Jia Hui', 'Kah Seng', 'Mei Ling', 'Chee Keong', 'Siew Lan', 'Yong Jie', 'Pei Shan'];
const CN_LAST = ['Tan', 'Lim', 'Lee', 'Wong', 'Chong', 'Ng', 'Teh'];
const IN_FIRST = ['Kavitha', 'Suresh', 'Priya', 'Arun', 'Meena', 'Vikram', 'Deepa', 'Ganesh'];
const IN_FATHER = ['Rajan', 'Krishnan', 'Subramaniam', 'Nair', 'Pillai', 'Maniam'];
const VENUES = ['IEEE Access', 'Jurnal Keselamatan Maklumat Malaysia', 'Computers & Security', 'Pertanika Journal of Science & Technology', 'Jurnal Sains Komputer Malaysia', 'Buletin Teknikal Sains & Teknologi Pertahanan', 'ACM Computing Surveys', 'Jurnal Teknologi (Sains & Kejuruteraan)'];
const ISSUERS = [['Certified Information Systems Security Professional (CISSP)', '(ISC)²'], ['Certified Ethical Hacker (CEH)', 'EC-Council'], ['CompTIA Security+', 'CompTIA'], ['AWS Certified Solutions Architect', 'Amazon Web Services'], ['Professional Scrum Master I', 'Scrum.org'], ['Cisco Certified Network Associate (CCNA)', 'Cisco'], ['TensorFlow Developer Certificate', 'Google'], ['Oracle Certified Professional, MySQL', 'Oracle'], ['GIAC Certified Forensic Analyst (GCFA)', 'GIAC']];
const COURSES = [['Penggodaman Beretika dan Ujian Penembusan', 'EC-Council'], ['Bengkel Forensik Digital Lanjutan', 'CyberSecurity Malaysia'], ['Pembelajaran Mesin untuk Pengamal', 'MIMOS'], ['Pengajaran & Pembelajaran dalam Pendidikan Tinggi', 'Pusat Kecemerlangan Akademik UPNM'], ['Bengkel Metodologi Penyelidikan', 'Kementerian Pendidikan Tinggi'], ['Asas Keselamatan Awan', 'AWS Academy'], ['Simulasi Pertahanan Rangkaian', 'Bahagian Siber Angkatan Tentera Malaysia'], ['Visualisasi Data dengan Python', 'Universiti Malaya']];
const CLIENTS = ['Agensi Keselamatan Negara', 'Angkatan Tentera Malaysia', 'CyberSecurity Malaysia', 'MIMOS Berhad', 'Kementerian Pertahanan', 'Polis Diraja Malaysia', 'TM Technology Services'];
const AWARDS = [['Anugerah Penyelidik Terbaik', 'Penyelidikan'], ['Anugerah Perkhidmatan Cemerlang', 'Perkhidmatan'], ['Pingat Emas, Ekspo Inovasi', 'Inovasi'], ['Anugerah Pengajaran Terbaik', 'Pengajaran'], ['Anugerah Kepimpinan Fakulti', 'Kepimpinan']];
const TOPICS = ['Bandar Pintar', 'Persekitaran IoT', 'Rangkaian Pertahanan', 'Platform Awan', 'Infrastruktur Kritikal', 'Peranti Mudah Alih', 'Sistem Kerajaan', 'Sistem Autonomi', 'Data Kesihatan', 'Rantaian Bekalan'];
const PT = ['Kajian Semula {a} dalam {t}', 'Ke Arah Rangka Kerja {a} dalam {t}', 'Pengesanan Anomali dengan {a} dalam {t}', '{a}: Kajian Perbandingan untuk {t}', 'Pendekatan Pembelajaran Mesin terhadap {a} untuk {t}', 'Model Selamat bagi {a} dalam {t}'];

// opts: count (lecturers), prefix (id prefix, 'demo_' for remote import), categories (reuse existing rows), includeAdmin, docs
export async function buildSeed(hashPw, opts = {}) {
  const { count = 100, prefix = '', categories = null, includeAdmin = true, docs = true } = opts;
  const r = rng(20261013);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const iso = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString();
  const dateStr = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const out = { users: [], lecturers: [], expertise_categories: [], expertise: [], research: [], publications: [], certifications: [], training: [], consultancy: [], achievements: [], documents: [], activity_log: [] };
  let n = 0; const id = (p) => `${prefix}${p}_${String(++n).padStart(4, '0')}`;

  const cats = categories
    ? categories.map((c) => { const row = CATS.find((x) => x[0] === c.name || CAT_EN[x[0]] === c.name); return { ...c, key: row ? row[0] : c.name, areas: row ? row[2] : ['Amalan Am'] }; })
    : CATS.map(([name, color, areas]) => { const c = { id: id('cat'), name, color, description: `${name} — ${areas.slice(0, 3).join(', ')} dan topik berkaitan.`, created_at: iso(300), updated_at: iso(300) }; out.expertise_categories.push(c); return { ...c, key: name, areas }; });
  const cat = (name) => cats.find((c) => c.key === name) || cats[0];

  // admin
  const adminSalt = 's_admin';
  if (includeAdmin) out.users.push({ id: 'usr_admin', username: 'admin', email: 'admin@fstp.upnm.edu.my', full_name: 'Pentadbir Fakulti', role: 'admin', department: 'Pejabat Fakulti', status: 'Active', salt: adminSalt, password_hash: await hashPw(adminSalt, 'admin'), last_login: '', created_at: iso(300), updated_at: iso(300) });

  const specs = [
    { name: 'Dr. Aisyah Binti Ahmad', user: 'aisyah', dept: 'Sains Komputer', pos: 'Pensyarah Kanan', female: true, main: ['Keselamatan Siber', 'Pakar', 8], extra: [['Forensik Digital', 'Mahir', 6], ['Rangkaian', 'Pertengahan', 4], ['Kecerdasan Buatan', 'Pertengahan', 3], ['Pangkalan Data', 'Asas', 2]], counts: { research: 8, pubs: 15, certs: 6, train: 10, cons: 4, ach: 5 } },
    { name: 'Prof. Dr. Harun Bin Ismail', user: 'harun', dept: 'Teknologi Maklumat', pos: 'Profesor', main: ['Keselamatan Siber', 'Pakar', 15], extra: [['Keselamatan Maklumat', 'Pakar', 14]] },
    { name: 'Dr. Farhana Binti Omar', user: 'farhana', dept: 'Sains Komputer', pos: 'Pensyarah Kanan', female: true, main: ['Keselamatan Siber', 'Mahir', 6], extra: [['Forensik Digital', 'Mahir', 6]] },
    { name: 'Dr. Ahmad Bin Zulkifli', user: 'ahmadz', dept: 'Sains Komputer', pos: 'Pensyarah Kanan', main: ['Keselamatan Siber', 'Mahir', 7], extra: [['Keselamatan Maklumat', 'Pertengahan', 5]] },
  ];
  const used = new Set(specs.map((s) => s.name));
  const depts = ['Sains Komputer', 'Sains Komputer', 'Teknologi Maklumat', 'Teknologi Maklumat', 'Matematik', 'Kejuruteraan', 'Lain-lain'];
  const POS_W = ['Pensyarah', 'Pensyarah', 'Pensyarah Kanan', 'Pensyarah Kanan', 'Pensyarah Kanan', 'Profesor Madya', 'Profesor', 'Tutor'];
  while (specs.length < count) {
    const eth = r(); let first, name, female = r() < 0.5, handle;
    if (eth < 0.72) { first = pick(female ? FEMALE : MALE); name = `${first} ${female ? 'Binti' : 'Bin'} ${pick(FATHER)}`; handle = first; }
    else if (eth < 0.86) { first = pick(CN_FIRST); name = `${pick(CN_LAST)} ${first}`; handle = first.split(' ')[0]; }
    else { first = pick(IN_FIRST); const f = ['Priya', 'Meena', 'Deepa', 'Kavitha'].includes(first); female = f; name = `${first} ${f ? 'a/p' : 'a/l'} ${pick(IN_FATHER)}`; handle = first; }
    const pos = pick(POS_W);
    const title = pos === 'Profesor' ? 'Prof. Dr.' : pos === 'Profesor Madya' ? 'Prof. Madya Dr.' : pos === 'Tutor' ? (female ? 'Puan' : 'Encik') : r() < 0.8 ? 'Dr.' : (female ? 'Puan' : 'Encik');
    const full = `${title} ${name}`;
    if (used.has(full)) continue; used.add(full);
    const c1 = pick(cats), c2 = pick(cats), c3 = pick(cats);
    const senior = pos === 'Profesor' ? 8 : pos === 'Profesor Madya' ? 5 : pos === 'Tutor' ? 0 : 2;
    const lvl = () => pick(['Asas', 'Pertengahan', 'Pertengahan', 'Mahir', 'Mahir', 'Pakar']);
    specs.push({ name: full, user: (handle.toLowerCase().replace(/[^a-z]/g, '') + specs.length), dept: pick(depts), pos, female, main: [c1.key, pos === 'Tutor' ? 'Asas' : lvl(), int(1 + senior, 8 + senior * 1.6)],
      extra: [c2, c3].filter((c, i) => c.key !== c1.key && r() < (i ? 0.35 : 0.8)).map((c) => [c.name, lvl(), int(1, 9 + senior)]), counts: count > 40 ? { research: int(0, 4 + (senior > 4 ? 3 : 0)), pubs: int(0, 6 + senior), certs: int(0, 4), train: int(0, 4), cons: int(0, 2 + (senior > 4 ? 2 : 0)), ach: int(0, 3) } : undefined });
  }

  const lecSalt = 's_lec';
  const lecHash = await hashPw(lecSalt, 'Lecturer@123');
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const uidv = id('usr'), lid = id('lec');
    const email = `${s.user}@upnm.edu.my`;
    out.users.push({ id: uidv, username: s.user, email, full_name: s.name, role: 'lecturer', department: s.dept, status: count > 40 ? (i % 31 === 30 ? 'Inactive' : 'Active') : (i === 25 ? 'Inactive' : 'Active'), salt: lecSalt, password_hash: lecHash, last_login: '', created_at: iso(250), updated_at: iso(250) });
    out.lecturers.push({ id: lid, user_id: uidv, staff_id: 'UPNM' + String(i + 1).padStart(3, '0'), full_name: s.name, email, department: s.dept, position: s.pos, phone: `+60 12-${int(300, 899)} ${int(1000, 9999)}`, location: 'Kuala Lumpur, Malaysia', bio: i === 0 ? 'Penyelidik keselamatan siber yang menumpukan pengesanan ancaman untuk persekitaran IoT, forensik digital dan tindak balas insiden.' : count > 40 ? `${s.pos} di Jabatan ${s.dept}. Mengusahakan ${pick(cat(s.main[0]).areas).toLowerCase()} dan ${s.main[0].toLowerCase()} dengan tumpuan kepada aplikasi pertahanan dan keselamatan negara.` : '', photo: '', created_at: iso(250), updated_at: iso(int(1, 120)) });
    const c = s.counts || {};
    const areas = [s.main, ...s.extra];
    areas.forEach(([cn, level, years]) => {
      const cc = cat(cn);
      out.expertise.push({ id: id('exp'), lecturer_id: lid, category_id: cc.id, area: s.name.includes('Aisyah') && cn === 'Keselamatan Siber' ? 'Keselamatan Siber' : pick(cc.areas), level, years, interest: '', document_id: '', created_at: iso(200), updated_at: iso(200) });
    });
    const mainCat = cat(s.main[0]);
    const mk = (n2) => Array.from({ length: n2 }, (_, k) => k);
    mk(c.research ?? int(1, 3)).forEach(() => {
      const a = pick(mainCat.areas);
      out.research.push({ id: id('res'), lecturer_id: lid, title: pick(PT).replace('{a}', a).replace('{t}', pick(TOPICS)), area: mainCat.key, category: pick(['Penyelidikan Gunaan', 'Penyelidikan Asas', 'Pembangunan Eksperimen']), year: int(2019, 2026), status: pick(['Sedang Berjalan', 'Selesai', 'Selesai']), description: `Mengkaji teknik ${a.toLowerCase()} dengan penilaian praktikal.`, document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.pubs ?? int(1, 5)).forEach(() => {
      const a = pick(mainCat.areas);
      out.publications.push({ id: id('pub'), lecturer_id: lid, title: pick(PT).replace('{a}', a).replace('{t}', pick(TOPICS)), type: pick(['Artikel Jurnal', 'Artikel Jurnal', 'Kertas Persidangan', 'Bab Buku']), venue: pick(VENUES), year: int(2018, 2026), status: pick(['Diterbitkan', 'Diterbitkan', 'Diterbitkan', 'Dalam Percetakan', 'Dalam Semakan']), doi: `https://doi.org/10.1109/${int(1000, 9999)}.${int(2020, 2026)}.${int(100000, 999999)}`, document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.certs ?? int(0, 3)).forEach((_, k) => {
      const [nm, iss] = ISSUERS[(i + k * 3) % ISSUERS.length];
      const y = int(2021, 2026);
      const exp = r() < 0.75 ? dateStr(y + 3, int(1, 12), int(1, 28)) : '';
      out.certifications.push({ id: id('cer'), lecturer_id: lid, name: nm, issuer: iss, issue_date: dateStr(y, int(1, 9), int(1, 28)), expiry_date: k === 0 && i % 4 === 0 ? dateStr(2026, 11, 20) : exp, cert_no: `${iss.slice(0, 4).toUpperCase()}-${int(100000, 999999)}`, document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.train ?? int(1, 3)).forEach(() => {
      const [nm, org] = pick(COURSES);
      out.training.push({ id: id('trn'), lecturer_id: lid, name: nm, organizer: org, date: dateStr(int(2022, 2026), int(1, 9), int(1, 28)), status: pick(['Selesai', 'Selesai', 'Sedang Berjalan']), duration_days: int(1, 10), description: '', document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.cons ?? int(0, 2)).forEach(() => {
      out.consultancy.push({ id: id('con'), lecturer_id: lid, project: `${pick(['Penilaian Keselamatan', 'Semakan Sistem', 'Nasihat Teknikal', 'Audit Keupayaan'])} bagi ${pick(TOPICS)}`, client: pick(CLIENTS), role: pick(['Ketua Projek', 'Perunding', 'Penasihat']), year: int(2020, 2026), status: pick(['Selesai', 'Sedang Berjalan']), description: '', document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.ach ?? int(0, 2)).forEach(() => {
      const [nm, cg] = pick(AWARDS);
      out.achievements.push({ id: id('ach'), lecturer_id: lid, name: nm, category: cg, year: int(2019, 2026), description: '', document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    if (i === 0 && docs) {
      [['CV', 'CV Terkini 2024', 'CV_DrAisyah.pdf'], ['Portfolio', 'Portfolio Pengajaran', 'Portfolio_Pengajaran.pdf'], ['Laporan', 'Laporan Konsultansi', 'Laporan_Konsultansi.pdf']].forEach(([t, ti, f], k) => out.documents.push({ id: id('doc'), lecturer_id: lid, doc_type: t, title: ti, file_name: f, mime: 'application/pdf', size: 120000 + k * 40000, created_at: iso(60 + k * 30), updated_at: iso(60) }));
    }
  }
  // activity feed, newest first for Aisyah
  const aid = out.lecturers[0].id;
  [['Menambah pensijilan baharu', 57], ['Mengemas kini maklumat penyelidikan', 59], ['Menambah penerbitan baharu', 64], ['Mengemas kini gambar profil', 66]].forEach(([m, d]) => out.activity_log.push({ id: id('act'), lecturer_id: aid, message: m, created_at: iso(d - 50 > 0 ? d - 50 : 1) }));
  out.lecturers.slice(1, count > 40 ? 40 : 10).forEach((l, k) => out.activity_log.push({ id: id('act'), lecturer_id: l.id, message: pick(['Menambah penerbitan baharu', 'Mengemas kini maklumat kepakaran', 'Menambah pensijilan baharu']), created_at: iso(k * 0.4 + 0.2) }));
  return out;
}
