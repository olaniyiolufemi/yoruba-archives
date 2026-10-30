// Seeds a Supabase project with demo accounts, categories and sample research
// covering every workflow state. Usage: SEED_PASSWORD=... npm run seed [-- --reset]
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
if (!password || password.length < 8) throw new Error('Set SEED_PASSWORD (8+ characters) for the demo accounts');

const db = createClient(url, key, { auth: { persistSession: false } });
const BUCKET = 'research-files';
const reset = process.argv.includes('--reset');

const users = [
  { email: 'admin@yoruba-archives.test', full_name: 'Olaniyi Olufemi', role: 'admin', institution: null },
  { email: 'reviewer1@yoruba-archives.test', full_name: 'Dr. Adebayo Ogunleye', role: 'reviewer', institution: 'Obafemi Awolowo University' },
  { email: 'reviewer2@yoruba-archives.test', full_name: 'Dr. Funmilayo Adeyemi', role: 'reviewer', institution: 'University of Ibadan' },
  { email: 'researcher1@yoruba-archives.test', full_name: 'Tunde Bakare', role: 'researcher', institution: 'University of Lagos' },
  { email: 'researcher2@yoruba-archives.test', full_name: 'Simisola Adeleke', role: 'researcher', institution: 'Independent researcher' },
  { email: 'public@yoruba-archives.test', full_name: 'Kehinde Balogun', role: 'public', institution: null },
] as const;

const categories = [
  ['Art & Sculpture', 'Bronze, terracotta, beadwork, carving and textiles.'],
  ['Language & Literature', 'Orthography, tone, dialects, proverbs and written literature.'],
  ['Religion & Philosophy', 'Ifá, òrìṣà worship and Yoruba thought.'],
  ['History & Kingdoms', 'Ife, Oyo, Ijebu and other polities, wars and migrations.'],
  ['Music & Oral Poetry', 'Oríkì, ìjálá, drumming and performance.'],
  ['Festivals & Masquerades', 'Egúngún, Gẹ̀lẹ̀dẹ́, Ọ̀ṣun-Ọ̀ṣogbo and community rites.'],
  ['Medicine & Botany', 'Ewé àti egbògi: plants, healing and the natural world.'],
] as const;

type Seed = {
  title: string;
  abstract: string;
  keywords: string[];
  language: 'yoruba' | 'english' | 'both';
  category: string;
  author: 3 | 4;
  outcome: 'verified' | 'pending' | 'revision_requested' | 'rejected';
  comment?: string;
};

const items: Seed[] = [
  { title: 'Lost-wax brass casting in 12th-century Ile-Ife', abstract: 'A technical reading of the naturalistic brass heads from Wunmonije Compound, drawing on published metallurgical analyses and interviews with Ife bronze casters about inherited casting practice.', keywords: ['Ile-Ife', 'bronze', 'lost-wax', 'sculpture'], language: 'english', category: 'Art & Sculpture', author: 3, outcome: 'verified' },
  { title: 'Ìtumọ̀ ohùn nínú èdè Yorùbá: High tone and verb morphology', abstract: 'Ìwádìí yìí ṣàyẹ̀wò bí ohùn òkè ṣe ń yí padà nínú ọ̀rọ̀-ìṣe. This study compares tone contraction across Oyo, Ijesha and Ondo dialects using recorded speech from twelve speakers.', keywords: ['tone', 'morphology', 'dialects', 'ohùn'], language: 'both', category: 'Language & Literature', author: 4, outcome: 'verified' },
  { title: 'Binary structure of the 256 Odù Ifá', abstract: 'An analysis of the sixteen principal Odù and their 240 combinations as a binary system, with transcriptions of verse recitations collected from three babaláwo in Osogbo.', keywords: ['Ifá', 'Odù', 'divination', 'babaláwo'], language: 'english', category: 'Religion & Philosophy', author: 3, outcome: 'verified' },
  { title: 'Oríkì àwọn Ọba Ọ̀yọ́', abstract: 'Àkójọpọ̀ oríkì àwọn ọba Ọ̀yọ́ tí àwọn arókin ń kì ní ààfin Ọ̀yọ́. Iṣẹ́ yìí kọ oríkì náà sílẹ̀ pẹ̀lú àlàyé lórí ìtàn tí wọ́n ń sọ.', keywords: ['oríkì', 'Ọ̀yọ́', 'arókin', 'ọba'], language: 'yoruba', category: 'Music & Oral Poetry', author: 4, outcome: 'verified' },
  { title: 'Gẹ̀lẹ̀dẹ́ headpieces and the praise of mothers', abstract: 'A study of carved Gẹ̀lẹ̀dẹ́ headdresses from Ketu and Egbado communities, the songs performed with them, and how they honour the power of mothers (àwọn ìyá wa).', keywords: ['Gẹ̀lẹ̀dẹ́', 'masquerade', 'Ketu', 'carving'], language: 'both', category: 'Festivals & Masquerades', author: 3, outcome: 'verified' },
  { title: 'Medicinal plants of the Ọ̀ṣun-Ọ̀ṣogbo Sacred Grove', abstract: 'A field survey of 40 plant species used by healers around the Ọ̀ṣun-Ọ̀ṣogbo grove, recording Yoruba names, preparation and uses as described by four herbalists.', keywords: ['ewé', 'herbal medicine', 'Osogbo', 'botany'], language: 'english', category: 'Medicine & Botany', author: 4, outcome: 'verified' },
  { title: 'Ìjálá: chants of the hunters', abstract: 'Recordings and transcriptions of ìjálá chants performed at hunters’ gatherings in Ogbomoso, with notes on Ògún devotion and the poetic forms used.', keywords: ['ìjálá', 'Ògún', 'hunters', 'chant'], language: 'both', category: 'Music & Oral Poetry', author: 3, outcome: 'verified' },
  { title: 'Sungbo’s Eredo: oral accounts of the Ijebu earthworks', abstract: 'Oral histories gathered in villages along the Eredo rampart, compared with archaeological surveys to date and explain its construction.', keywords: ['Eredo', 'Ijebu', 'earthworks', 'oral history'], language: 'english', category: 'History & Kingdoms', author: 4, outcome: 'verified' },
  { title: 'Owe Yorùbá: proverbs on leadership', abstract: 'Àkójọ òwe tó jẹ mọ́ ìṣàkóso àti aṣáájú, pẹ̀lú ìtumọ̀ àti àpẹẹrẹ ìlò wọn nínú ìgbésí ayé ojoojúmọ́.', keywords: ['òwe', 'proverbs', 'leadership'], language: 'yoruba', category: 'Language & Literature', author: 3, outcome: 'verified' },
  { title: 'The Oyo cavalry: horses, trade and war', abstract: 'Documents horse trading with northern neighbours, stabling and veterinary practice, and how the Oyo cavalry was organised under the Aláàfin and the Ààrẹ Ọ̀nà Kakanfò.', keywords: ['Oyo empire', 'cavalry', 'Kakanfo'], language: 'english', category: 'History & Kingdoms', author: 4, outcome: 'pending' },
  { title: 'Àdìrẹ: indigo resist-dyed cloth of Abeokuta', abstract: 'A study of àdìrẹ eléko and àdìrẹ oníko techniques, motifs and their meanings, based on interviews with dyers in Itoku market.', keywords: ['àdìrẹ', 'textiles', 'Abeokuta', 'indigo'], language: 'both', category: 'Art & Sculpture', author: 3, outcome: 'pending' },
  { title: 'Egúngún festival in Ibadan, 2025', abstract: 'Observations from the 2025 Egúngún festival in Ibadan, describing the masquerades, lineages and the order of the procession.', keywords: ['Egúngún', 'Ibadan', 'festival'], language: 'english', category: 'Festivals & Masquerades', author: 4, outcome: 'revision_requested', comment: 'Please name your informants (or explain why they asked not to be named) and remove the photograph of the restricted shrine interior.' },
  { title: 'Untitled notes', abstract: 'Some notes copied from a website about Yoruba history without sources.', keywords: ['history'], language: 'english', category: 'History & Kingdoms', author: 3, outcome: 'rejected', comment: 'The text appears to be copied from another site and gives no sources. Please submit your own research with citations.' },
];

function makePdf(title: string, body: string) {
  const ascii = (s: string) => s.normalize('NFKD').replace(/[^\x20-\x7e]/g, '').replace(/[()\\]/g, '');
  const lines = [ascii(title), '', ...ascii(body).match(/.{1,80}(\s|$)/g)!.map((l) => l.trim()), '', 'Sample file generated for Yoruba Archives testing.'];
  const text = lines.map((l, i) => `BT /F1 ${i === 0 ? 14 : 11} Tf 56 ${780 - i * 18} Td (${l}) Tj ET`).join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${text.length} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((obj, i) => {
    const at = pdf.length;
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    return at;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function slug(title: string) {
  const base = title.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  return `${base}-${randomBytes(3).toString('hex')}`;
}

async function must<R extends { data: unknown; error: { message: string } | null }>(label: string, p: PromiseLike<R>) {
  const { data, error } = await p;
  if (error) throw new Error(`${label}: ${error.message}`);
  return data as NonNullable<R['data']>;
}

const { count } = await db.from('research_submissions').select('id', { count: 'exact', head: true });
if (count && !reset) {
  console.log(`The database already has ${count} submissions. Re-run with --reset to wipe and reseed.`);
  process.exit(0);
}
if (reset) {
  console.log('Resetting…');
  const { data: files } = await db.storage.from(BUCKET).list('', { limit: 1000 });
  for (const folder of files ?? []) {
    const { data: inner } = await db.storage.from(BUCKET).list(folder.name, { limit: 1000 });
    if (inner?.length) await db.storage.from(BUCKET).remove(inner.map((f) => `${folder.name}/${f.name}`));
  }
  await must('clear submissions', db.from('research_submissions').delete().not('id', 'is', null));
  await must('clear categories', db.from('categories').delete().not('id', 'is', null));
}

// Accounts (the signup trigger creates profiles; roles are then set directly).
const { data: existing } = await db.auth.admin.listUsers({ perPage: 1000 });
const ids: string[] = [];
for (const u of users) {
  let id = existing?.users.find((e) => e.email === u.email)?.id;
  if (!id) {
    const created = await must(`create ${u.email}`, db.auth.admin.createUser({
      email: u.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, institution: u.institution, role: u.role === 'public' ? 'public' : 'researcher' },
    }));
    id = created.user!.id;
  }
  await must(`role ${u.email}`, db.from('profiles').update({ role: u.role, full_name: u.full_name, institution: u.institution }).eq('id', id));
  ids.push(id);
}
const [, rev1, rev2] = ids;
console.log(`✓ ${users.length} accounts`);

const cats = await must('categories', db.from('categories').upsert(categories.map(([name, description]) => ({ name, description })), { onConflict: 'name' }).select('id, name'));
const catId = new Map(cats.map((c) => [c.name, c.id]));
console.log(`✓ ${cats.length} categories`);

for (const [i, item] of items.entries()) {
  const userId = ids[item.author];
  const reviewer = i % 2 === 0 ? rev1 : rev2;
  const path = `${userId}/${crypto.randomUUID()}.pdf`;
  await must('upload', db.storage.from(BUCKET).upload(path, makePdf(item.title, item.abstract), { contentType: 'application/pdf' }));

  const sub = await must('insert', db.from('research_submissions').insert({
    user_id: userId,
    category_id: catId.get(item.category),
    assigned_reviewer_id: reviewer,
    title: item.title,
    abstract: item.abstract,
    keywords: item.keywords,
    language: item.language,
    file_path: path,
    file_name: `${slug(item.title).slice(0, 40)}.pdf`,
    file_type: 'application/pdf',
  }).select('id').single());

  if (item.outcome !== 'pending') {
    const pass = item.outcome === 'verified';
    await must('review', db.rpc('record_review', {
      p_submission: sub.id,
      p_reviewer: reviewer,
      p_decision: item.outcome,
      p_authorship: true,
      p_source: pass,
      p_cultural: true,
      p_sensitivity: pass,
      p_comments: item.comment ?? 'Well sourced and respectful. Approved.',
      p_public_link: slug(item.title),
    }));
  }
  await must('notify', db.from('notifications').insert({
    user_id: item.outcome === 'pending' ? reviewer : userId,
    type: item.outcome === 'pending' ? 'review_assigned' : `status_${item.outcome}`,
    title: item.outcome === 'pending' ? 'New submission to review' : 'Review decision',
    message: `"${item.title}" — ${item.outcome.replace('_', ' ')}.`,
    submission_id: sub.id,
  }));
}
console.log(`✓ ${items.length} submissions (verified, pending, revision requested and rejected)`);
console.log(`\nDemo accounts (password from SEED_PASSWORD):\n${users.map((u) => `  ${u.role.padEnd(10)} ${u.email}`).join('\n')}`);
