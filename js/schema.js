// Single source of truth for the data model.
// Table/column names are snake_case and relational (id + *_id foreign keys) so the
// same shapes map 1:1 onto MySQL later (see docs/schema.sql and backend/Code.gs).

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const DEPARTMENTS = ['Computer Science', 'Information Technology', 'Mathematics', 'Engineering', 'Others'];
export const POSITIONS = ['Professor', 'Associate Professor', 'Senior Lecturer', 'Lecturer', 'Tutor'];

export const TABLES = [
  'users', 'lecturers', 'expertise_categories', 'expertise', 'research', 'publications',
  'certifications', 'training', 'consultancy', 'achievements', 'documents', 'activity_log',
];
// Tables whose rows belong to a lecturer (lecturer_id FK).
export const OWNED = ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'documents', 'activity_log'];

const STATUS_RESEARCH = ['Ongoing', 'Completed', 'Planned'];

// Declarative CRUD config: drives list pages, forms, reports and the activity feed.
// fmt: how a cell renders. field.type: text | number | date | url | textarea | select | category | file
export const ENTITIES = {
  expertise: {
    table: 'expertise', icon: 'brain', tint: 'blue', singular: 'Expertise', plural: 'Expertise', mine: 'My Expertise',
    title: (r) => r.area,
    columns: [
      { key: 'area', label: 'Expertise' }, { key: 'category_id', label: 'Category', fmt: 'category' },
      { key: 'level', label: 'Level', fmt: 'level' }, { key: 'years', label: 'Years', fmt: 'num' },
    ],
    fields: [
      { name: 'category_id', label: 'Expertise Category', type: 'category', required: true },
      { name: 'area', label: 'Expertise Area', type: 'text', required: true, placeholder: 'e.g. Digital Forensics' },
      { name: 'level', label: 'Expertise Level', type: 'select', options: LEVELS, required: true },
      { name: 'years', label: 'Years of Experience', type: 'number', required: true, min: 0, max: 60 },
      { name: 'interest', label: 'Research Interest (Optional)', type: 'textarea' },
      { name: 'document_id', label: 'Supporting Document', type: 'file', docType: 'Certificate' },
    ],
  },
  research: {
    table: 'research', icon: 'flask', tint: 'green', singular: 'Research', plural: 'Research', mine: 'My Research',
    title: (r) => r.title,
    columns: [
      { key: 'title', label: 'Title' }, { key: 'area', label: 'Area' }, { key: 'category', label: 'Category' },
      { key: 'year', label: 'Year', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Research Title', type: 'text', required: true },
      { name: 'area', label: 'Research Area', type: 'text', required: true },
      { name: 'category', label: 'Research Category', type: 'select', options: ['Basic Research', 'Applied Research', 'Experimental Development', 'Policy Research'], required: true },
      { name: 'year', label: 'Year', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_RESEARCH, required: true },
      { name: 'description', label: 'Abstract / Description', type: 'textarea' },
      { name: 'document_id', label: 'Supporting Document', type: 'file', docType: 'Research Report' },
    ],
  },
  publications: {
    table: 'publications', icon: 'book', tint: 'purple', singular: 'Publication', plural: 'Publications', mine: 'My Publications',
    title: (r) => r.title,
    columns: [
      { key: 'title', label: 'Title' }, { key: 'type', label: 'Type' }, { key: 'venue', label: 'Journal / Publisher' },
      { key: 'year', label: 'Year', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'title', label: 'Publication Title', type: 'text', required: true },
      { name: 'type', label: 'Publication Type', type: 'select', options: ['Journal Article', 'Conference Paper', 'Book', 'Book Chapter', 'Patent', 'Technical Report'], required: true },
      { name: 'venue', label: 'Journal / Publisher', type: 'text', required: true },
      { name: 'year', label: 'Year', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'status', label: 'Status', type: 'select', options: ['Published', 'In Press', 'Under Review', 'Draft'], required: true },
      { name: 'doi', label: 'DOI / Link (Optional)', type: 'url', placeholder: 'https://doi.org/…' },
      { name: 'document_id', label: 'Upload Document', type: 'file', docType: 'Publication' },
    ],
  },
  certifications: {
    table: 'certifications', icon: 'award', tint: 'amber', singular: 'Certification', plural: 'Certifications', mine: 'My Certifications',
    title: (r) => r.name,
    columns: [
      { key: 'name', label: 'Certification' }, { key: 'issuer', label: 'Issuing Body' },
      { key: 'issue_date', label: 'Issued', fmt: 'date' }, { key: 'expiry_date', label: 'Expires', fmt: 'expiry' },
    ],
    fields: [
      { name: 'name', label: 'Certification Name', type: 'text', required: true },
      { name: 'issuer', label: 'Issuing Body', type: 'text', required: true },
      { name: 'issue_date', label: 'Issue Date', type: 'date', required: true },
      { name: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { name: 'cert_no', label: 'Certificate Number (Optional)', type: 'text' },
      { name: 'document_id', label: 'Supporting Document', type: 'file', docType: 'Certificate' },
    ],
  },
  training: {
    table: 'training', icon: 'cap', tint: 'teal', singular: 'Training', plural: 'Training', mine: 'My Training',
    title: (r) => r.name,
    columns: [
      { key: 'name', label: 'Training / Course' }, { key: 'organizer', label: 'Organizer' },
      { key: 'date', label: 'Date', fmt: 'date' }, { key: 'duration_days', label: 'Days', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'name', label: 'Training / Course Name', type: 'text', required: true },
      { name: 'organizer', label: 'Organizer', type: 'text', required: true },
      { name: 'date', label: 'Date', type: 'date', required: true },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_RESEARCH, required: true },
      { name: 'duration_days', label: 'Duration (days)', type: 'number', min: 0, max: 365 },
      { name: 'description', label: 'Description (Optional)', type: 'textarea' },
      { name: 'document_id', label: 'Supporting Document', type: 'file', docType: 'Certificate' },
    ],
  },
  consultancy: {
    table: 'consultancy', icon: 'briefcase', tint: 'rose', singular: 'Consultancy', plural: 'Consultancy', mine: 'My Consultancy',
    title: (r) => r.project,
    columns: [
      { key: 'project', label: 'Project' }, { key: 'client', label: 'Organization / Client' },
      { key: 'role', label: 'Role' }, { key: 'year', label: 'Year', fmt: 'num' }, { key: 'status', label: 'Status', fmt: 'status' },
    ],
    fields: [
      { name: 'project', label: 'Project / Consultancy Name', type: 'text', required: true },
      { name: 'client', label: 'Organization / Client', type: 'text', required: true },
      { name: 'role', label: 'Role', type: 'select', options: ['Project Leader', 'Consultant', 'Co-Researcher', 'Advisor', 'Trainer'], required: true },
      { name: 'year', label: 'Year', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'status', label: 'Status', type: 'select', options: STATUS_RESEARCH, required: true },
      { name: 'description', label: 'Description (Optional)', type: 'textarea' },
      { name: 'document_id', label: 'Supporting Document', type: 'file', docType: 'Report' },
    ],
  },
  achievements: {
    table: 'achievements', icon: 'star', tint: 'indigo', singular: 'Achievement', plural: 'Achievements', mine: 'My Achievements',
    title: (r) => r.name,
    columns: [
      { key: 'name', label: 'Achievement' }, { key: 'category', label: 'Category' }, { key: 'year', label: 'Year', fmt: 'num' },
    ],
    fields: [
      { name: 'name', label: 'Achievement Name', type: 'text', required: true },
      { name: 'category', label: 'Category', type: 'select', options: ['Research', 'Teaching', 'Innovation', 'Service', 'Leadership'], required: true },
      { name: 'year', label: 'Year', type: 'number', required: true, min: 1990, max: 2100 },
      { name: 'description', label: 'Description (Optional)', type: 'textarea' },
      { name: 'document_id', label: 'Supporting Document', type: 'file', docType: 'Award' },
    ],
  },
  documents: {
    table: 'documents', icon: 'file', tint: 'slate', singular: 'Document', plural: 'Documents', mine: 'My Documents',
    title: (r) => r.title,
    columns: [
      { key: 'title', label: 'Document Name' }, { key: 'doc_type', label: 'Type' },
      { key: 'created_at', label: 'Upload Date', fmt: 'date' }, { key: 'size', label: 'Size', fmt: 'size' },
    ],
    fields: [
      { name: 'doc_type', label: 'Document Type', type: 'select', options: ['CV', 'Portfolio', 'Certificate', 'Report', 'Publication', 'Research Report', 'Award', 'Other'], required: true },
      { name: 'title', label: 'Title / Description', type: 'text', required: true },
      { name: 'file', label: 'File', type: 'file', required: true, standalone: true },
    ],
  },
};

export const ENTITY_ORDER = ['expertise', 'research', 'publications', 'certifications', 'training', 'consultancy', 'achievements', 'documents'];

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
