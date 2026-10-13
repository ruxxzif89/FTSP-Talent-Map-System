// Deterministic demo data (fictional people). Runs once in the local backend.
const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

const CATS = [
  ['Cybersecurity', '#1d5fd1', ['Digital Forensics', 'Network Security', 'Cyber Threat Intelligence', 'Penetration Testing', 'Incident Response']],
  ['Artificial Intelligence', '#7c3aed', ['Machine Learning', 'Computer Vision', 'Natural Language Processing', 'Deep Learning']],
  ['Networking', '#0891b2', ['Wireless Networks', 'Network Protocols', 'Software-Defined Networking', 'Network Monitoring']],
  ['Database', '#16a34a', ['Database Design', 'Data Warehousing', 'Query Optimization', 'NoSQL Systems']],
  ['Digital Forensics', '#e11d48', ['Mobile Forensics', 'Memory Forensics', 'Cloud Forensics', 'Evidence Handling']],
  ['Software Engineering', '#ea580c', ['Requirements Engineering', 'Software Testing', 'DevOps', 'Software Architecture']],
  ['Information Security', '#0f766e', ['Security Audit', 'Risk Management', 'Cryptography', 'Security Policy']],
  ['Data Science', '#ca8a04', ['Data Analytics', 'Big Data', 'Predictive Modelling', 'Data Visualization']],
  ['Internet of Things', '#4f46e5', ['Embedded Systems', 'Smart Sensors', 'IoT Security', 'Edge Computing']],
  ['Mathematics & Modelling', '#be185d', ['Numerical Methods', 'Operations Research', 'Statistics', 'Optimization']],
  ['Defence Technology', '#475569', ['Command & Control Systems', 'Military Simulation', 'Defence Analytics', 'Secure Communications']],
  ['Others', '#64748b', ['Education Technology', 'Human-Computer Interaction', 'E-Government']],
];

const MALE = ['Ahmad', 'Harun', 'Zulkifli', 'Faizal', 'Hafiz', 'Rashid', 'Imran', 'Syafiq', 'Nazri', 'Kamal', 'Azman', 'Shahrul', 'Khairul', 'Razak'];
const FEMALE = ['Aisyah', 'Farhana', 'Nurul', 'Siti', 'Zarina', 'Hidayah', 'Aminah', 'Najwa', 'Rohana', 'Liyana', 'Sofea', 'Marlina', 'Fatimah', 'Haslinda'];
const FATHER = ['Ismail', 'Omar', 'Zulkifli', 'Hassan', 'Yusof', 'Abdullah', 'Jamal', 'Rahman', 'Salleh', 'Mansor', 'Ibrahim', 'Karim', 'Aziz', 'Latif'];
const VENUES = ['IEEE Access', 'Journal of Information Security', 'Computers & Security', 'Pertanika Journal of Science & Technology', 'International Journal of Advanced Computer Science', 'Defence S&T Technical Bulletin', 'ACM Computing Surveys', 'Malaysian Journal of Computer Science'];
const ISSUERS = [['Certified Information Systems Security Professional (CISSP)', '(ISC)²'], ['Certified Ethical Hacker (CEH)', 'EC-Council'], ['CompTIA Security+', 'CompTIA'], ['AWS Certified Solutions Architect', 'Amazon Web Services'], ['Professional Scrum Master I', 'Scrum.org'], ['Cisco Certified Network Associate (CCNA)', 'Cisco'], ['TensorFlow Developer Certificate', 'Google'], ['Oracle Certified Professional, MySQL', 'Oracle'], ['GIAC Certified Forensic Analyst (GCFA)', 'GIAC']];
const COURSES = [['Ethical Hacking and Penetration Testing', 'EC-Council'], ['Advanced Digital Forensics Workshop', 'CyberSecurity Malaysia'], ['Machine Learning for Practitioners', 'MIMOS'], ['Teaching & Learning in Higher Education', 'UPNM Centre for Academic Excellence'], ['Research Methodology Bootcamp', 'Ministry of Higher Education'], ['Cloud Security Fundamentals', 'AWS Academy'], ['Network Defence Simulation', 'Malaysian Armed Forces Cyber Division'], ['Data Visualization with Python', 'Universiti Malaya']];
const CLIENTS = ['Agensi Keselamatan Negara', 'Malaysian Armed Forces', 'CyberSecurity Malaysia', 'MIMOS Berhad', 'Ministry of Defence', 'Royal Malaysia Police', 'TM Technology Services'];
const AWARDS = [['Best Researcher Award', 'Research'], ['Excellent Service Award', 'Service'], ['Gold Medal, Innovation Expo', 'Innovation'], ['Best Teaching Award', 'Teaching'], ['Faculty Leadership Award', 'Leadership']];
const TOPICS = ['Smart Cities', 'IoT Environments', 'Defence Networks', 'Cloud Platforms', 'Critical Infrastructure', 'Mobile Devices', 'Government Systems', 'Autonomous Systems', 'Healthcare Data', 'Supply Chains'];
const PT = ['A Review of {a} in {t}', 'Towards a Framework for {a} in {t}', 'Detecting Anomalies with {a} in {t}', '{a}: A Comparative Study for {t}', 'Machine Learning Approaches to {a} for {t}', 'A Secure Model for {a} in {t}'];

export async function buildSeed(hashPw) {
  const r = rng(20261013);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const int = (a, b) => a + Math.floor(r() * (b - a + 1));
  const iso = (daysAgo) => new Date(Date.now() - daysAgo * 864e5).toISOString();
  const dateStr = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const out = { users: [], lecturers: [], expertise_categories: [], expertise: [], research: [], publications: [], certifications: [], training: [], consultancy: [], achievements: [], documents: [], activity_log: [] };
  let n = 0; const id = (p) => `${p}_${String(++n).padStart(4, '0')}`;

  const cats = CATS.map(([name, color, areas]) => { const c = { id: id('cat'), name, color, description: `${name} — ${areas.slice(0, 3).join(', ')} and related topics.`, created_at: iso(300), updated_at: iso(300) }; out.expertise_categories.push(c); return { ...c, areas }; });
  const cat = (name) => cats.find((c) => c.name === name);

  // admin
  const adminSalt = 's_admin';
  out.users.push({ id: 'usr_admin', username: 'admin', email: 'admin@fstp.upnm.edu.my', full_name: 'Faculty Administrator', role: 'admin', department: 'Faculty Office', status: 'Active', salt: adminSalt, password_hash: await hashPw(adminSalt, 'admin'), last_login: '', created_at: iso(300), updated_at: iso(300) });

  const specs = [
    { name: 'Dr. Aisyah Binti Ahmad', user: 'aisyah', dept: 'Computer Science', pos: 'Senior Lecturer', female: true, main: ['Cybersecurity', 'Expert', 8], extra: [['Digital Forensics', 'Advanced', 6], ['Networking', 'Intermediate', 4], ['Artificial Intelligence', 'Intermediate', 3], ['Database', 'Beginner', 2]], counts: { research: 8, pubs: 15, certs: 6, train: 10, cons: 4, ach: 5 } },
    { name: 'Prof. Dr. Harun Bin Ismail', user: 'harun', dept: 'Information Technology', pos: 'Professor', main: ['Cybersecurity', 'Expert', 15], extra: [['Information Security', 'Expert', 14]] },
    { name: 'Dr. Farhana Binti Omar', user: 'farhana', dept: 'Computer Science', pos: 'Senior Lecturer', female: true, main: ['Cybersecurity', 'Advanced', 6], extra: [['Digital Forensics', 'Advanced', 6]] },
    { name: 'Dr. Ahmad Bin Zulkifli', user: 'ahmadz', dept: 'Computer Science', pos: 'Senior Lecturer', main: ['Cybersecurity', 'Advanced', 7], extra: [['Information Security', 'Intermediate', 5]] },
  ];
  const used = new Set(specs.map((s) => s.name));
  const depts = ['Computer Science', 'Computer Science', 'Information Technology', 'Information Technology', 'Mathematics', 'Engineering', 'Others'];
  while (specs.length < 26) {
    const female = r() < 0.5;
    const first = pick(female ? FEMALE : MALE);
    const name = `${pick(['Dr.', 'Dr.', 'Dr.', 'Prof. Madya Dr.', 'Mr.', 'Ms.'].filter((t) => (female ? t !== 'Mr.' : t !== 'Ms.')))} ${first} ${female ? 'Binti' : 'Bin'} ${pick(FATHER)}`;
    if (used.has(name)) continue; used.add(name);
    const c1 = pick(cats), c2 = pick(cats);
    specs.push({ name, user: (first + specs.length).toLowerCase(), dept: pick(depts), pos: pick(['Lecturer', 'Senior Lecturer', 'Senior Lecturer', 'Associate Professor', 'Tutor']), female, main: [c1.name, pick(['Intermediate', 'Advanced', 'Advanced', 'Expert', 'Beginner']), int(1, 14)], extra: c2 !== c1 && r() < 0.8 ? [[c2.name, pick(['Beginner', 'Intermediate', 'Advanced']), int(1, 9)]] : [] });
  }

  const lecSalt = 's_lec';
  const lecHash = await hashPw(lecSalt, 'Lecturer@123');
  for (let i = 0; i < specs.length; i++) {
    const s = specs[i];
    const uidv = id('usr'), lid = id('lec');
    const email = `${s.user}@upnm.edu.my`;
    out.users.push({ id: uidv, username: s.user, email, full_name: s.name, role: 'lecturer', department: s.dept, status: i === 25 ? 'Inactive' : 'Active', salt: lecSalt, password_hash: lecHash, last_login: '', created_at: iso(250), updated_at: iso(250) });
    out.lecturers.push({ id: lid, user_id: uidv, staff_id: 'UPNM' + String(i + 1).padStart(3, '0'), full_name: s.name, email, department: s.dept, position: s.pos, phone: `+60 12-${int(300, 899)} ${int(1000, 9999)}`, location: 'Kuala Lumpur, Malaysia', bio: i === 0 ? 'Cybersecurity researcher focused on threat detection for IoT environments, digital forensics and incident response.' : '', photo: '', created_at: iso(250), updated_at: iso(int(1, 120)) });
    const c = s.counts || {};
    const areas = [s.main, ...s.extra];
    areas.forEach(([cn, level, years]) => {
      const cc = cat(cn);
      out.expertise.push({ id: id('exp'), lecturer_id: lid, category_id: cc.id, area: s.name.includes('Aisyah') && cn === 'Cybersecurity' ? 'Cybersecurity' : pick(cc.areas), level, years, interest: '', document_id: '', created_at: iso(200), updated_at: iso(200) });
    });
    const mainCat = cat(s.main[0]);
    const mk = (n2) => Array.from({ length: n2 }, (_, k) => k);
    mk(c.research ?? int(1, 3)).forEach(() => {
      const a = pick(mainCat.areas);
      out.research.push({ id: id('res'), lecturer_id: lid, title: pick(PT).replace('{a}', a).replace('{t}', pick(TOPICS)), area: mainCat.name, category: pick(['Applied Research', 'Basic Research', 'Experimental Development']), year: int(2019, 2026), status: pick(['Ongoing', 'Completed', 'Completed']), description: `Investigates ${a.toLowerCase()} techniques with practical evaluation.`, document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.pubs ?? int(1, 5)).forEach(() => {
      const a = pick(mainCat.areas);
      out.publications.push({ id: id('pub'), lecturer_id: lid, title: pick(PT).replace('{a}', a).replace('{t}', pick(TOPICS)), type: pick(['Journal Article', 'Journal Article', 'Conference Paper', 'Book Chapter']), venue: pick(VENUES), year: int(2018, 2026), status: pick(['Published', 'Published', 'Published', 'In Press', 'Under Review']), doi: `https://doi.org/10.1109/${int(1000, 9999)}.${int(2020, 2026)}.${int(100000, 999999)}`, document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.certs ?? int(0, 3)).forEach((_, k) => {
      const [nm, iss] = ISSUERS[(i + k * 3) % ISSUERS.length];
      const y = int(2021, 2026);
      const exp = r() < 0.75 ? dateStr(y + 3, int(1, 12), int(1, 28)) : '';
      out.certifications.push({ id: id('cer'), lecturer_id: lid, name: nm, issuer: iss, issue_date: dateStr(y, int(1, 9), int(1, 28)), expiry_date: k === 0 && i % 4 === 0 ? dateStr(2026, 11, 20) : exp, cert_no: `${iss.slice(0, 4).toUpperCase()}-${int(100000, 999999)}`, document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.train ?? int(1, 3)).forEach(() => {
      const [nm, org] = pick(COURSES);
      out.training.push({ id: id('trn'), lecturer_id: lid, name: nm, organizer: org, date: dateStr(int(2022, 2026), int(1, 9), int(1, 28)), status: pick(['Completed', 'Completed', 'Ongoing']), duration_days: int(1, 10), description: '', document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.cons ?? int(0, 2)).forEach(() => {
      out.consultancy.push({ id: id('con'), lecturer_id: lid, project: `${pick(['Security Assessment', 'System Review', 'Technical Advisory', 'Capability Audit'])} for ${pick(TOPICS)}`, client: pick(CLIENTS), role: pick(['Project Leader', 'Consultant', 'Advisor']), year: int(2020, 2026), status: pick(['Completed', 'Ongoing']), description: '', document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    mk(c.ach ?? int(0, 2)).forEach(() => {
      const [nm, cg] = pick(AWARDS);
      out.achievements.push({ id: id('ach'), lecturer_id: lid, name: nm, category: cg, year: int(2019, 2026), description: '', document_id: '', created_at: iso(int(10, 200)), updated_at: iso(int(1, 9)) });
    });
    if (i === 0) {
      [['CV', 'Latest CV 2024', 'CV_DrAisyah.pdf'], ['Portfolio', 'Teaching Portfolio', 'Teaching_Portfolio.pdf'], ['Report', 'Consultancy Report', 'Consultancy_Report.pdf']].forEach(([t, ti, f], k) => out.documents.push({ id: id('doc'), lecturer_id: lid, doc_type: t, title: ti, file_name: f, mime: 'application/pdf', size: 120000 + k * 40000, created_at: iso(60 + k * 30), updated_at: iso(60) }));
    }
  }
  // activity feed, newest first for Aisyah
  const aid = out.lecturers[0].id;
  [['Added new certification', 57], ['Updated research information', 59], ['Added new publication', 64], ['Updated profile photo', 66]].forEach(([m, d]) => out.activity_log.push({ id: id('act'), lecturer_id: aid, message: m, created_at: iso(d - 50 > 0 ? d - 50 : 1) }));
  out.lecturers.slice(1, 10).forEach((l, k) => out.activity_log.push({ id: id('act'), lecturer_id: l.id, message: pick(['Added new publication', 'Updated expertise information', 'Added new certification']), created_at: iso(k + 1) }));
  return out;
}
