import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkFile,
  filterTerm,
  matchesFileSignature,
  normalizeKeywords,
  parseFileRef,
  parseReview,
  parseSearchFilters,
  parseSubmissionMetadata,
  safeNextPath,
  slugify,
  stripDiacritics,
} from './validation.ts';

const USER = '0b7c1f0e-6d0a-4a51-9a64-8a0a3f2b1c11';
const CATEGORY = '5e8f2c44-1e0b-4d6c-9f3a-2b7d1c0e9a77';

test('stripDiacritics removes Yoruba tone marks and under-dots', () => {
  assert.equal(stripDiacritics('Òrìṣà'), 'orisa');
  assert.equal(stripDiacritics('Ẹ̀kọ́ Ifá'), 'eko ifa');
  assert.equal(stripDiacritics('ỌYỌ́'), 'oyo');
});

test('slugify produces a URL-safe permanent link', () => {
  assert.equal(slugify('Oríkì of Ọ̀yọ́ Kings: A Study', 'a1b2c3'), 'oriki-of-oyo-kings-a-study-a1b2c3');
  assert.equal(slugify('!!!', 'x9'), 'research-x9');
  assert.ok(slugify('a'.repeat(200), 'z').length <= 62);
});

test('normalizeKeywords splits, trims, dedupes and caps at 10', () => {
  assert.deepEqual(normalizeKeywords('Ifá, oríkì; ifá\n Ile-Ife ,'), ['Ifá', 'oríkì', 'Ile-Ife']);
  assert.equal(normalizeKeywords(Array.from({ length: 15 }, (_, i) => `k${i}`)).length, 10);
  assert.deepEqual(normalizeKeywords(undefined), []);
});

test('parseSubmissionMetadata accepts a valid bilingual submission (FR1, FR2)', () => {
  const result = parseSubmissionMetadata({
    title: '  Ìtàn Ọ̀yọ́  ',
    abstract: 'A study of Oyo oral history drawn from palace bards.',
    keywords: 'oyo, oral history',
    language: 'both',
    category_id: CATEGORY,
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.title, 'Ìtàn Ọ̀yọ́');
    assert.deepEqual(result.value.keywords, ['oyo', 'oral history']);
  }
});

test('parseSubmissionMetadata rejects missing keywords, bad language and bad category', () => {
  const base = { title: 'Valid title', abstract: 'x'.repeat(30), keywords: 'a', language: 'english', category_id: CATEGORY };
  assert.equal(parseSubmissionMetadata({ ...base, keywords: '' }).ok, false);
  assert.equal(parseSubmissionMetadata({ ...base, language: 'french' }).ok, false);
  assert.equal(parseSubmissionMetadata({ ...base, category_id: '1' }).ok, false);
  assert.equal(parseSubmissionMetadata({ ...base, abstract: 'short' }).ok, false);
});

test('parseFileRef only accepts PDF/JPEG in the uploader folder', () => {
  const ok = parseFileRef({ file_path: `${USER}/abc-123.pdf`, file_name: 'paper.pdf', file_type: 'application/pdf' }, USER);
  assert.equal(ok.ok, true);
  assert.equal(parseFileRef({ file_path: `other/abc.pdf`, file_name: 'p.pdf', file_type: 'application/pdf' }, USER).ok, false);
  assert.equal(parseFileRef({ file_path: `${USER}/../x.pdf`, file_name: 'p.pdf', file_type: 'application/pdf' }, USER).ok, false);
  assert.equal(parseFileRef({ file_path: `${USER}/a.png`, file_name: 'a.png', file_type: 'image/png' }, USER).ok, false);
});

test('checkFile enforces type and size', () => {
  assert.equal(checkFile({ name: 'a.pdf', type: 'application/pdf', size: 1000 }), null);
  assert.equal(checkFile({ name: 'a.jpeg', type: 'image/jpeg', size: 1000 }), null);
  assert.notEqual(checkFile({ name: 'a.png', type: 'image/png', size: 1000 }), null);
  assert.notEqual(checkFile({ name: 'a.pdf', type: 'application/pdf', size: 21 * 1024 * 1024 }), null);
});

test('parseReview requires the full checklist to approve and comments otherwise (FR4)', () => {
  const allChecks = { authorship_check: true, source_check: true, cultural_relevance_check: true, sensitivity_check: true };
  assert.equal(parseReview({ decision: 'verified', ...allChecks }).ok, true);
  assert.equal(parseReview({ decision: 'verified', ...allChecks, sensitivity_check: false }).ok, false);
  assert.equal(parseReview({ decision: 'rejected' }).ok, false);
  assert.equal(parseReview({ decision: 'revision_requested', comments: 'Cite your informants.' }).ok, true);
  assert.equal(parseReview({ decision: 'publish' }).ok, false);
});

test('parseSearchFilters keeps valid FR7 filters and drops malformed ones', () => {
  const f = parseSearchFilters({ q: ' ifa ', category: CATEGORY, language: 'yoruba', from: '2026-01-01', to: 'tomorrow', page: '3' });
  assert.deepEqual(f, { q: 'ifa', category: CATEGORY, language: 'yoruba', from: '2026-01-01', to: null, page: 3 });
  const empty = parseSearchFilters({ category: 'abc', language: 'fr', page: '-2' });
  assert.deepEqual(empty, { q: '', category: null, language: null, from: null, to: null, page: 1 });
});

test('safeNextPath blocks open redirects', () => {
  assert.equal(safeNextPath('/review/abc?x=1'), '/review/abc?x=1');
  assert.equal(safeNextPath('//evil.com'), '/dashboard');
  assert.equal(safeNextPath('/\\evil.com'), '/dashboard');
  assert.equal(safeNextPath('https://evil.com'), '/dashboard');
  assert.equal(safeNextPath(undefined), '/dashboard');
});

test('filterTerm strips filter syntax and wildcards but keeps Yoruba names and emails', () => {
  assert.equal(filterTerm('Ọláníyì Olúfẹ́mi'), 'Ọláníyì Olúfẹ́mi');
  assert.equal(filterTerm("o'neil+test@example.com"), "o'neil+test@example.com");
  assert.equal(filterTerm('a%,role.eq.admin),(x'), 'arole.eq.adminx');
  assert.equal(filterTerm('*_"\\'), '');
  assert.equal(filterTerm(42), '');
});

test('parseSearchFilters treats LIKE wildcards as spaces', () => {
  assert.equal(parseSearchFilters({ q: 'ifa%_\\oriki' }).q, 'ifa   oriki');
});

test('matchesFileSignature checks the leading bytes, not the declared type', () => {
  const pdf = new TextEncoder().encode('%PDF-1.7\n');
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);
  const html = new TextEncoder().encode('<html><script>');
  assert.equal(matchesFileSignature(pdf, 'application/pdf'), true);
  assert.equal(matchesFileSignature(jpeg, 'image/jpeg'), true);
  assert.equal(matchesFileSignature(jpeg, 'application/pdf'), false);
  assert.equal(matchesFileSignature(html, 'application/pdf'), false);
  assert.equal(matchesFileSignature(new Uint8Array(), 'image/jpeg'), false);
});
