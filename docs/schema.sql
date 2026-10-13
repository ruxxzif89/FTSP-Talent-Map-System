-- MySQL 8 schema: the target for migrating off Google Sheets.
-- Table and column names are identical to the Sheet tabs in backend/Code.gs, so a migration is:
--   export each tab as CSV -> LOAD DATA INFILE (or import via phpMyAdmin) -> done.
-- Then replace backend/Code.gs with a PHP/REST API exposing the same actions (see README "Migrating to SQL").

CREATE TABLE users (
  id VARCHAR(40) PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  role ENUM('admin','lecturer') NOT NULL,
  department VARCHAR(80),
  status ENUM('Active','Inactive') NOT NULL DEFAULT 'Active',
  salt VARCHAR(40) NOT NULL,
  password_hash VARCHAR(64) NOT NULL,   -- SHA-256(salt:password). Re-hash to bcrypt/argon2 (password_hash()) on first login after migration.
  last_login DATETIME NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL
);
CREATE TABLE lecturers (
  id VARCHAR(40) PRIMARY KEY,
  user_id VARCHAR(40) NOT NULL UNIQUE,
  staff_id VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL, email VARCHAR(120) NOT NULL,
  department VARCHAR(80) NOT NULL, position VARCHAR(60) NOT NULL,
  phone VARCHAR(40), location VARCHAR(120), bio TEXT,
  photo MEDIUMTEXT,                     -- data URL today; store a file path after migration
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE expertise_categories (
  id VARCHAR(40) PRIMARY KEY, name VARCHAR(80) NOT NULL UNIQUE, color CHAR(7) NOT NULL DEFAULT '#1d5fd1', description TEXT,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL
);
CREATE TABLE documents (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL,
  doc_type VARCHAR(40) NOT NULL, title VARCHAR(200) NOT NULL, file_name VARCHAR(200) NOT NULL, mime VARCHAR(100) NOT NULL, size INT NOT NULL,
  file_ref VARCHAR(255) NOT NULL,       -- Drive file id today; filesystem/S3 path after migration
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE
);
CREATE TABLE expertise (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, category_id VARCHAR(40) NOT NULL,
  area VARCHAR(150) NOT NULL, level ENUM('Beginner','Intermediate','Advanced','Expert') NOT NULL, years SMALLINT NOT NULL DEFAULT 0, interest TEXT,
  document_id VARCHAR(40) NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES expertise_categories(id) ON DELETE RESTRICT,   -- mirrors "category in use" rule
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL,
  INDEX (category_id), INDEX (level)
);
CREATE TABLE research (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, title VARCHAR(255) NOT NULL, area VARCHAR(120), category VARCHAR(60),
  year SMALLINT, status ENUM('Ongoing','Completed','Planned') NOT NULL, description TEXT, document_id VARCHAR(40) NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);
CREATE TABLE publications (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, title VARCHAR(255) NOT NULL, type VARCHAR(40) NOT NULL, venue VARCHAR(200),
  year SMALLINT, status ENUM('Published','In Press','Under Review','Draft') NOT NULL, doi VARCHAR(255), document_id VARCHAR(40) NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);
CREATE TABLE certifications (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, name VARCHAR(200) NOT NULL, issuer VARCHAR(150) NOT NULL,
  issue_date DATE, expiry_date DATE NULL, cert_no VARCHAR(80), document_id VARCHAR(40) NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);
CREATE TABLE training (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, name VARCHAR(200) NOT NULL, organizer VARCHAR(150),
  date DATE, status ENUM('Ongoing','Completed','Planned') NOT NULL, duration_days SMALLINT, description TEXT, document_id VARCHAR(40) NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);
CREATE TABLE consultancy (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, project VARCHAR(255) NOT NULL, client VARCHAR(150), role VARCHAR(60),
  year SMALLINT, status ENUM('Ongoing','Completed','Planned') NOT NULL, description TEXT, document_id VARCHAR(40) NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);
CREATE TABLE achievements (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, name VARCHAR(200) NOT NULL, category VARCHAR(40),
  year SMALLINT, description TEXT, document_id VARCHAR(40) NULL,
  created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);
CREATE TABLE activity_log (
  id VARCHAR(40) PRIMARY KEY, lecturer_id VARCHAR(40) NOT NULL, message VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL,
  FOREIGN KEY (lecturer_id) REFERENCES lecturers(id) ON DELETE CASCADE, INDEX (created_at)
);
