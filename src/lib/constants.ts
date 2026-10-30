export const ROLES = ['researcher', 'public', 'reviewer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export const LANGUAGES = ['yoruba', 'english', 'both'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<Language, string> = {
  yoruba: 'Yorùbá',
  english: 'English',
  both: 'Yorùbá & English',
};

export const STATUSES = ['pending', 'verified', 'rejected', 'revision_requested'] as const;
export type SubmissionStatus = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
  revision_requested: 'Revision requested',
};

export const DECISIONS = ['verified', 'rejected', 'revision_requested'] as const;
export type Decision = (typeof DECISIONS)[number];

export const DECISION_LABELS: Record<Decision, string> = {
  verified: 'Approve',
  rejected: 'Reject',
  revision_requested: 'Return for revision',
};

// FR1: research is uploaded as a PDF or JPEG file.
export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg'] as const;
export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];
export const MAX_FILE_BYTES = 20 * 1024 * 1024;

export const STORAGE_BUCKET = 'research-files';

// Section 3.4 reviewer checklist.
export const CHECKLIST = [
  { key: 'authorship_check', label: 'Authorship', hint: 'The contributor is the author or holds the right to share this work.' },
  { key: 'source_check', label: 'Sources and citations', hint: 'Claims are supported by cited sources, informants or fieldwork.' },
  { key: 'cultural_relevance_check', label: 'Relevance to Yoruba culture', hint: 'The work is about Yoruba art, history, language, religion or tradition.' },
  { key: 'sensitivity_check', label: 'Cultural sensitivity', hint: 'Restricted or sacred knowledge is handled respectfully.' },
] as const;
export type ChecklistKey = (typeof CHECKLIST)[number]['key'];
