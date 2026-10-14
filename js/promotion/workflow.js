// Aliran kerja permohonan (Garis Panduan §5.3): peraturan peralihan, digunakan oleh UI dan bahagian belakang setempat.
// (backend/Code.gs mempunyai salinan kecil jadual ini — kemas kini kedua-duanya serentak.)
import { stepsFor, nextStepId, isProfessorGrade, APPEAL_DAYS, STEP } from './guideline.js';

export const ACTIVE_STATUSES = ['draf', 'fakulti', 'pendaftar', 'saringan', 'penilai', 'pemilih', 'lpu', 'syarahan', 'rayuan'];
export const FINAL_STATUSES = ['berjaya', 'tidak_berjaya', 'rayuan_berjaya', 'rayuan_ditolak', 'ditarik_balik'];
export const isActive = (s) => ACTIVE_STATUSES.includes(s);
export const isInProcess = (s) => isActive(s) && s !== 'draf';

// Tindakan yang dibenarkan pada setiap status (dilaksanakan oleh pentadbir yang bertindak bagi pihak jawatankuasa berkenaan).
const ALLOWED = {
  fakulti: ['lulus', 'kembali', 'gagal'], pendaftar: ['lulus', 'kembali', 'gagal'], saringan: ['lulus', 'gagal'], penilai: ['lulus'],
  pemilih: ['lulus', 'gagal'], lpu: ['lulus', 'gagal'], syarahan: ['lulus'], rayuan: ['rayuan_berjaya', 'rayuan_tolak'], berjaya: ['tarik_balik'],
};
export function allowedActs(status, toGrade) {
  let a = ALLOWED[status] || [];
  if (status === 'lpu' && !isProfessorGrade(toGrade)) a = a.filter((x) => x !== 'gagal'); // selain Profesor: LPU hanya untuk pemakluman (§5.3.3)
  return a;
}
export function nextStatus(status, act, toGrade) {
  if (!allowedActs(status, toGrade).includes(act)) throw new Error('Tindakan tidak dibenarkan pada langkah ini.');
  if (act === 'lulus') return nextStepId(toGrade, status);
  return { kembali: 'draf', gagal: 'tidak_berjaya', rayuan_berjaya: 'rayuan_berjaya', rayuan_tolak: 'rayuan_ditolak', tarik_balik: 'ditarik_balik' }[act];
}

// Teks butang mengikut langkah — ditulis dalam bahasa biasa. tone: primary | danger | ghost
const BTN = {
  fakulti: { lulus: ['Diperakukan — hantar ke Pejabat Pendaftar', 'primary'], kembali: ['Dokumen tidak lengkap — kembalikan kepada calon', 'ghost'], gagal: ['Tidak diperakukan oleh Jawatankuasa Kesepakaran', 'danger'] },
  pendaftar: { lulus: ['Syarat umum disahkan — hantar ke Jawatankuasa Saringan', 'primary'], kembali: ['Dokumen tidak lengkap — kembalikan kepada calon', 'ghost'], gagal: ['Tidak memenuhi syarat umum', 'danger'] },
  saringan: { lulus: ['Layak ke temuduga', 'primary'], gagal: ['Tidak layak ke temuduga', 'danger'] },
  penilai: { lulus: ['Laporan Penilai Luar lengkap — teruskan', 'primary'] },
  pemilih: { lulus: ['Dipilih untuk kenaikan pangkat', 'primary'], gagal: ['Tidak dipilih', 'danger'] },
  lpu: { lulus: ['Telah dibawa ke LPU — teruskan', 'primary'], gagal: ['LPU tidak meluluskan', 'danger'] },
  syarahan: { lulus: ['Syarahan telah disampaikan — keluarkan surat tawaran', 'primary'] },
  rayuan: { rayuan_berjaya: ['Jawatankuasa Rayuan meluluskan rayuan', 'primary'], rayuan_tolak: ['Jawatankuasa Rayuan menolak rayuan (muktamad)', 'danger'] },
  berjaya: { tarik_balik: ['Tarik balik kenaikan pangkat (kesilapan fakta)', 'danger'] },
};
export function actButtons(app) {
  return allowedActs(app.status, app.to_grade).map((act) => {
    const [label, tone] = (BTN[app.status] || {})[act] || [act, 'ghost'];
    const isLast = act === 'lulus' && nextStatus(app.status, act, app.to_grade) === 'berjaya';
    return { act, label: isLast ? 'Selesai — keluarkan surat tawaran' : label, tone };
  });
}

// Siapa yang bertindak (untuk pilihan "bertindak sebagai" dan paparan)
export const ACTOR_ROLES = {
  fakulti: ['Pentadbir Fakulti', 'Dekan / Pengarah', 'Jawatankuasa Kesepakaran'], pendaftar: ['Urus Setia'], saringan: ['Jawatankuasa Saringan'], penilai: ['Urus Setia'],
  pemilih: ['Jawatankuasa Pemilih'], lpu: ['Lembaga Pengarah Universiti'], syarahan: ['Urus Setia'], rayuan: ['Jawatankuasa Rayuan'], berjaya: ['Urus Setia'],
};

export function appealInfo(app, today = new Date()) {
  if (!app || app.status !== 'tidak_berjaya' || !app.decision_date) return { can: false };
  const deadline = new Date(new Date(app.decision_date).getTime() + APPEAL_DAYS * 864e5);
  const daysLeft = Math.ceil((deadline - today) / 864e5);
  return { can: daysLeft >= 0, deadline: deadline.toISOString().slice(0, 10), daysLeft };
}
export const stepIndex = (app) => { const seq = stepsFor(app.to_grade).map((s) => s.id); return seq.indexOf(app.status); };
export { STEP, stepsFor, APPEAL_DAYS };
