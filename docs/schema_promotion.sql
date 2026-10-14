-- Tambahan skema MySQL 8 untuk modul Kenaikan Pangkat (selaras dengan tab Sheet dalam backend/Code.gs).
-- Jalankan SELEPAS docs/schema.sql.

-- Lajur baharu pada `lecturers` (maklumat perkhidmatan = data Pejabat Pendaftar; hanya pentadbir menulis, kecuali scopus_h_index)
ALTER TABLE lecturers
  ADD COLUMN grade ENUM('DS11','DS13','DS14','VK7','VK6','VK5') NULL,
  ADD COLUMN grade_since DATE NULL, ADD COLUMN appointed_on DATE NULL, ADD COLUMN confirmed_on DATE NULL, ADD COLUMN vk7_since DATE NULL,
  ADD COLUMN field ENUM('Sains & Teknologi','Sains Sosial','Klinikal') NULL,
  ADD COLUMN has_phd ENUM('Ya','Tidak') NULL, ADD COLUMN has_prof_qual ENUM('Ya','Tidak') NULL,
  ADD COLUMN employment ENUM('Tetap','Kontrak','Pinjaman') NULL,
  ADD COLUMN syarahan_perdana ENUM('Ya','Tidak') NULL, ADD COLUMN monograf ENUM('Ya','Tidak') NULL,
  ADD COLUMN scopus_h_index SMALLINT NULL;

-- Lajur baharu pada rekod sedia ada (semuanya pilihan; digunakan hanya oleh semakan kenaikan pangkat)
ALTER TABLE research ADD COLUMN role ENUM('Ketua Penyelidik','Ahli') NULL, ADD COLUMN grant_source VARCHAR(60) NULL, ADD COLUMN amount DECIMAL(14,2) NULL, ADD COLUMN registered_ppi ENUM('Ya','Tidak') NULL;
ALTER TABLE publications ADD COLUMN indexing VARCHAR(30) NULL, ADD COLUMN author_role VARCHAR(40) NULL;
ALTER TABLE consultancy ADD COLUMN kind VARCHAR(80) NULL, ADD COLUMN amount DECIMAL(14,2) NULL, ADD COLUMN registered_ppi ENUM('Ya','Tidak') NULL;

CREATE TABLE activities (          -- pengajaran, penyeliaan, pengiktirafan akademik, kepimpinan & khidmat (lihat ACTIVITY_KINDS dalam js/promotion/guideline.js)
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, kind VARCHAR(30) NOT NULL, title VARCHAR(255), year SMALLINT,
  level VARCHAR(40), role VARCHAR(30), student VARCHAR(120), graduated ENUM('Ya','Tidak') NULL, semester VARCHAR(30),
  workload_met ENUM('Ya','Tidak') NULL, blended ENUM('Ya','Tidak') NULL, score DECIMAL(3,1) NULL, terms TINYINT NULL, document_id VARCHAR(40) NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL, INDEX (lecturer_id, kind, year)
);
CREATE TABLE lppt_scores (         -- pentadbir sahaja menulis
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, year SMALLINT NOT NULL, score DECIMAL(5,2) NOT NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL, UNIQUE (lecturer_id, year),
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
);
CREATE TABLE disciplinary (        -- pentadbir sahaja menulis; tempoh tidak layak dikira dalam enjin (PENALTY_MONTHS)
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, case_no VARCHAR(40) NOT NULL,
  penalty ENUM('Amaran','Denda','Lucut Hak Emolumen','Tangguh Pergerakan Gaji','Turun Gaji','Turun Pangkat') NOT NULL, date DATE NOT NULL, note TEXT,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
);
CREATE TABLE promotion_applications (   -- TIADA CRUD generik: hanya melalui tindakan promoSave/promoSubmit/promoAct/promoAppeal/promoRemove
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, from_grade VARCHAR(6) NOT NULL, to_grade VARCHAR(6) NOT NULL, field VARCHAR(30),
  status ENUM('draf','fakulti','pendaftar','saringan','penilai','pemilih','lpu','syarahan','berjaya','tidak_berjaya','rayuan','rayuan_berjaya','rayuan_ditolak','ditarik_balik') NOT NULL DEFAULT 'draf',
  step_since DATETIME, submitted_at DATETIME NULL, decision_date DATE NULL, effective_date DATE NULL,
  qualifications TEXT, work_history TEXT, thesis_title VARCHAR(255), note_candidate TEXT,
  checks JSON NULL,                 -- {"fakulti.lengkap":"2026-10-14", ...} item semakan yang ditandakan
  appeal_reason TEXT, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, INDEX (status)
);
CREATE TABLE promotion_events (    -- garis masa tambah-sahaja (audit)
  id VARCHAR(40) PRIMARY KEY, application_id VARCHAR(40) NOT NULL, lecturer_id VARCHAR(40) NOT NULL, at DATETIME NOT NULL,
  actor VARCHAR(120), actor_role VARCHAR(60), action VARCHAR(30) NOT NULL, from_status VARCHAR(20), to_status VARCHAR(20), note TEXT,
  FOREIGN KEY (application_id) REFERENCES promotion_applications(id) ON DELETE CASCADE, INDEX (application_id, at)
);
CREATE TABLE promotion_assessors ( -- Penilai Luar (DS14 ke atas); pentadbir sahaja menulis
  id VARCHAR(40) PRIMARY KEY, application_id VARCHAR(40) NOT NULL, lecturer_id VARCHAR(40) NOT NULL, name VARCHAR(120) NOT NULL, institution VARCHAR(160),
  country ENUM('Dalam Negara','Luar Negara') NULL, position VARCHAR(80), h_index SMALLINT,
  checks JSON NULL,                 -- {"sameInst":"Ya","neverUpnm":"Ya","neverSuper":"Ya","noRelation":"Ya","institution":"Ya"}
  status ENUM('Dicalonkan','Dipilih','Laporan diterima','Ditolak') NOT NULL DEFAULT 'Dicalonkan', recommendation VARCHAR(40), report_note TEXT,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (application_id) REFERENCES promotion_applications(id) ON DELETE CASCADE
);
