// Pure validation helpers shared by the API routes and forms. No framework or
// Supabase imports here, so `node --test` can run the tests directly.
import {
  ALLOWED_FILE_TYPES,
  DECISIONS,
  LANGUAGES,
  MAX_FILE_BYTES,
  ROLES,
  type AllowedFileType,
  type Decision,
  type Language,
  type Role,
} from './constants.ts';

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Splits "ifá, oríkì; Ile-Ife" or an array into at most 10 unique keywords. */
export function normalizeKeywords(input: unknown): string[] {
  const raw = Array.isArray(input) ? input : typeof input === 'string' ? input.split(/[,;\n]/) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const kw = text(item).replace(/\s+/g, ' ').slice(0, 40);
    const key = kw.toLocaleLowerCase();
    if (kw && !seen.has(key)) {
      seen.add(key);
      out.push(kw);
    }
    if (out.length === 10) break;
  }
  return out;
}

/** Lower-cases and strips tone marks / under-dots: "Òrìṣà" → "orisa". */
export function stripDiacritics(value: string): string {
  return value.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function slugify(title: string, suffix: string): string {
  const base = stripDiacritics(title)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return `${base || 'research'}-${suffix}`;
}

export type SubmissionMetadata = {
  title: string;
  abstract: string;
  keywords: string[];
  language: Language;
  category_id: string;
};

export function parseSubmissionMetadata(body: Record<string, unknown>): Result<SubmissionMetadata> {
  const title = text(body.title);
  const abstract = text(body.abstract);
  const keywords = normalizeKeywords(body.keywords);
  const language = body.language;
  const category_id = body.category_id;

  if (title.length < 3 || title.length > 300) return { ok: false, error: 'Title must be 3–300 characters.' };
  if (abstract.length < 20 || abstract.length > 5000) return { ok: false, error: 'Abstract must be 20–5000 characters.' };
  if (keywords.length === 0) return { ok: false, error: 'Add at least one keyword.' };
  if (!LANGUAGES.includes(language as Language)) return { ok: false, error: 'Choose Yorùbá, English or both.' };
  if (!isUuid(category_id)) return { ok: false, error: 'Choose a category.' };

  return { ok: true, value: { title, abstract, keywords, language: language as Language, category_id } };
}

export type FileRef = { file_path: string; file_name: string; file_type: AllowedFileType };

/** Checks an uploaded file reference belongs to the uploader's own folder. */
export function parseFileRef(body: Record<string, unknown>, userId: string): Result<FileRef> {
  const file_path = text(body.file_path);
  const file_name = text(body.file_name).slice(0, 200);
  const file_type = body.file_type;

  if (!ALLOWED_FILE_TYPES.includes(file_type as AllowedFileType)) {
    return { ok: false, error: 'Only PDF or JPEG files are accepted.' };
  }
  const parts = file_path.split('/');
  if (parts.length !== 2 || parts[0] !== userId || !/^[\w-]+\.(pdf|jpe?g)$/i.test(parts[1])) {
    return { ok: false, error: 'Invalid file reference.' };
  }
  if (!file_name) return { ok: false, error: 'Missing file name.' };
  return { ok: true, value: { file_path, file_name, file_type: file_type as AllowedFileType } };
}

// Leading "magic" bytes: PDFs start with "%PDF-", JPEGs with FF D8 FF.
const FILE_SIGNATURES: Record<AllowedFileType, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46, 0x2d],
  'image/jpeg': [0xff, 0xd8, 0xff],
};

/** True when the file's first bytes match its declared type. */
export function matchesFileSignature(bytes: Uint8Array, type: AllowedFileType): boolean {
  const signature = FILE_SIGNATURES[type];
  return Boolean(signature) && signature.every((byte, i) => bytes[i] === byte);
}

/** Client-side check before uploading to storage. */
export function checkFile(file: { type: string; size: number; name: string }): string | null {
  const isJpegName = /\.jpe?g$/i.test(file.name);
  const isPdfName = /\.pdf$/i.test(file.name);
  if (!((file.type === 'application/pdf' && isPdfName) || (file.type === 'image/jpeg' && isJpegName))) {
    return 'Only PDF or JPEG files are accepted.';
  }
  if (file.size > MAX_FILE_BYTES) return 'Files must be 20 MB or smaller.';
  if (file.size === 0) return 'The file is empty.';
  return null;
}

export type ReviewInput = {
  decision: Decision;
  authorship_check: boolean;
  source_check: boolean;
  cultural_relevance_check: boolean;
  sensitivity_check: boolean;
  comments: string;
};

export function parseReview(body: Record<string, unknown>): Result<ReviewInput> {
  const decision = body.decision;
  if (!DECISIONS.includes(decision as Decision)) return { ok: false, error: 'Choose a decision.' };
  const review: ReviewInput = {
    decision: decision as Decision,
    authorship_check: body.authorship_check === true,
    source_check: body.source_check === true,
    cultural_relevance_check: body.cultural_relevance_check === true,
    sensitivity_check: body.sensitivity_check === true,
    comments: text(body.comments).slice(0, 5000),
  };
  const allPass =
    review.authorship_check && review.source_check && review.cultural_relevance_check && review.sensitivity_check;
  if (review.decision === 'verified' && !allPass) {
    return { ok: false, error: 'Every checklist item must pass before you approve.' };
  }
  if (review.decision !== 'verified' && !review.comments) {
    return { ok: false, error: 'Add comments so the researcher knows what to change.' };
  }
  return { ok: true, value: review };
}

export function parseCategory(body: Record<string, unknown>): Result<{ name: string; description: string | null }> {
  const name = text(body.name);
  const description = text(body.description).slice(0, 500);
  if (name.length < 2 || name.length > 80) return { ok: false, error: 'Category names must be 2–80 characters.' };
  return { ok: true, value: { name, description: description || null } };
}

/** Only same-site paths, so `?next=` cannot redirect to another origin. */
export function safeNextPath(value: unknown, fallback = '/dashboard'): string {
  return typeof value === 'string' && /^\/(?![/\\])/.test(value) ? value : fallback;
}

/**
 * Keeps letters (any script, with tone marks), digits, spaces and the few symbols
 * names and emails use. Everything else is dropped, so the term can be placed in a
 * PostgREST filter string without adding conditions or LIKE wildcards.
 */
export function filterTerm(value: unknown, max = 100): string {
  return text(value).replace(/[^\p{L}\p{M}\p{N}\s@.'+-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export function parseRole(value: unknown): Role | null {
  return ROLES.includes(value as Role) ? (value as Role) : null;
}

export type SearchFilters = {
  q: string;
  category: string | null;
  language: Language | null;
  from: string | null;
  to: string | null;
  page: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in YYYY-MM-DD form; "2026-02-30" and "2026-13-45" are rejected. */
function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function first(value: string | string[] | undefined | null): string {
  return (Array.isArray(value) ? value[0] : value ?? '').trim();
}

/** Reads FR7 filters from a query string, discarding anything malformed. */
export function parseSearchFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const category = first(params.category);
  const language = first(params.language);
  const from = first(params.from);
  const to = first(params.to);
  const page = Number.parseInt(first(params.page), 10);
  return {
    // % and _ are LIKE wildcards in the search function, so they are treated as spaces.
    q: first(params.q).replace(/[%_\\]/g, ' ').slice(0, 200),
    category: isUuid(category) ? category : null,
    language: LANGUAGES.includes(language as Language) ? (language as Language) : null,
    from: isRealDate(from) ? from : null,
    to: isRealDate(to) ? to : null,
    page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
  };
}
