// Sample archive content for previewing the site without a Supabase project.
// Enabled with DEMO_MODE=1; remove this file once a real database is linked.
import type { Language } from './constants';
import type { Category, SearchRow } from './types';
import { stripDiacritics, type SearchFilters } from './validation';

export const isDemoMode = () => process.env.DEMO_MODE === '1';

export const DEMO_CATEGORIES: Category[] = [
  { id: '00000000-0000-4000-8000-000000000001', name: 'Art & Sculpture', description: 'Bronze, terracotta, beadwork, carving and textiles.' },
  { id: '00000000-0000-4000-8000-000000000002', name: 'Language & Literature', description: 'Orthography, tone, dialects, proverbs and written literature.' },
  { id: '00000000-0000-4000-8000-000000000003', name: 'Religion & Philosophy', description: 'Ifá, òrìṣà worship and Yoruba thought.' },
  { id: '00000000-0000-4000-8000-000000000004', name: 'History & Kingdoms', description: 'Ife, Oyo, Ijebu and other polities, wars and migrations.' },
  { id: '00000000-0000-4000-8000-000000000005', name: 'Music & Oral Poetry', description: 'Oríkì, ìjálá, drumming and performance.' },
  { id: '00000000-0000-4000-8000-000000000006', name: 'Festivals & Masquerades', description: 'Egúngún, Gẹ̀lẹ̀dẹ́, Ọ̀ṣun-Ọ̀ṣogbo and community rites.' },
  { id: '00000000-0000-4000-8000-000000000007', name: 'Medicine & Botany', description: 'Ewé àti egbògi: plants, healing and the natural world.' },
];

export type DemoItem = SearchRow & { institution: string | null; reviewer: string; created_at: string };

type Raw = [title: string, abstract: string, keywords: string[], language: Language, category: number, author: string, institution: string | null, verified: string];

const RAW: Raw[] = [
  ['Lost-wax brass casting in 12th-century Ile-Ife', 'A technical reading of the naturalistic brass heads from Wunmonije Compound, drawing on published metallurgical analyses and interviews with Ife bronze casters about inherited casting practice.', ['Ile-Ife', 'bronze', 'lost-wax', 'sculpture'], 'english', 1, 'Tunde Bakare', 'University of Lagos', '2026-10-21'],
  ['Ìtumọ̀ ohùn nínú èdè Yorùbá: High tone and verb morphology', 'Ìwádìí yìí ṣàyẹ̀wò bí ohùn òkè ṣe ń yí padà nínú ọ̀rọ̀-ìṣe. This study compares tone contraction across Oyo, Ijesha and Ondo dialects using recorded speech from twelve speakers.', ['tone', 'morphology', 'dialects', 'ohùn'], 'both', 2, 'Simisola Adeleke', 'Independent researcher', '2026-10-18'],
  ['Binary structure of the 256 Odù Ifá', 'An analysis of the sixteen principal Odù and their 240 combinations as a binary system, with transcriptions of verse recitations collected from three babaláwo in Osogbo.', ['Ifá', 'Odù', 'divination', 'babaláwo'], 'english', 3, 'Tunde Bakare', 'University of Lagos', '2026-10-14'],
  ['Oríkì àwọn Ọba Ọ̀yọ́', 'Àkójọpọ̀ oríkì àwọn ọba Ọ̀yọ́ tí àwọn arókin ń kì ní ààfin Ọ̀yọ́. Iṣẹ́ yìí kọ oríkì náà sílẹ̀ pẹ̀lú àlàyé lórí ìtàn tí wọ́n ń sọ.', ['oríkì', 'Ọ̀yọ́', 'arókin', 'ọba'], 'yoruba', 5, 'Simisola Adeleke', 'Independent researcher', '2026-10-09'],
  ['Gẹ̀lẹ̀dẹ́ headpieces and the praise of mothers', 'A study of carved Gẹ̀lẹ̀dẹ́ headdresses from Ketu and Egbado communities, the songs performed with them, and how they honour the power of mothers (àwọn ìyá wa).', ['Gẹ̀lẹ̀dẹ́', 'masquerade', 'Ketu', 'carving'], 'both', 6, 'Tunde Bakare', 'University of Lagos', '2026-10-02'],
  ['Medicinal plants of the Ọ̀ṣun-Ọ̀ṣogbo Sacred Grove', 'A field survey of 40 plant species used by healers around the Ọ̀ṣun-Ọ̀ṣogbo grove, recording Yoruba names, preparation and uses as described by four herbalists.', ['ewé', 'herbal medicine', 'Osogbo', 'botany'], 'english', 7, 'Simisola Adeleke', 'Independent researcher', '2026-09-27'],
  ['Ìjálá: chants of the hunters', 'Recordings and transcriptions of ìjálá chants performed at hunters’ gatherings in Ogbomoso, with notes on Ògún devotion and the poetic forms used.', ['ìjálá', 'Ògún', 'hunters', 'chant'], 'both', 5, 'Adewale Ojo', 'Ladoke Akintola University of Technology', '2026-09-19'],
  ['Sungbo’s Eredo: oral accounts of the Ijebu earthworks', 'Oral histories gathered in villages along the Eredo rampart, compared with archaeological surveys to date and explain its construction.', ['Eredo', 'Ijebu', 'earthworks', 'oral history'], 'english', 4, 'Simisola Adeleke', 'Independent researcher', '2026-09-11'],
  ['Òwe Yorùbá: proverbs on leadership', 'Àkójọ òwe tó jẹ mọ́ ìṣàkóso àti aṣáájú, pẹ̀lú ìtumọ̀ àti àpẹẹrẹ ìlò wọn nínú ìgbésí ayé ojoojúmọ́.', ['òwe', 'proverbs', 'leadership'], 'yoruba', 2, 'Tunde Bakare', 'University of Lagos', '2026-09-03'],
  ['Àdìrẹ: indigo resist-dyed cloth of Abeokuta', 'A study of àdìrẹ eléko and àdìrẹ oníko techniques, motifs and their meanings, based on interviews with dyers in Itoku market.', ['àdìrẹ', 'textiles', 'Abeokuta', 'indigo'], 'both', 1, 'Folake Ogundipe', 'Federal University of Agriculture, Abeokuta', '2026-08-26'],
  ['Ifẹ̀ terracotta heads in private collections', 'Catalogue notes on 14 terracotta heads attributed to Ile-Ife held in private collections, with provenance research and condition reports.', ['terracotta', 'Ile-Ife', 'provenance'], 'english', 1, 'Adewale Ojo', 'Ladoke Akintola University of Technology', '2026-08-15'],
  ['Bàtá drumming and the voice of Ṣàngó', 'How bàtá drummers in Oyo reproduce Yoruba speech tones to praise Ṣàngó, with transcriptions of drum phrases and their spoken equivalents.', ['bàtá', 'Ṣàngó', 'drumming', 'tone'], 'both', 5, 'Folake Ogundipe', 'Federal University of Agriculture, Abeokuta', '2026-07-30'],
  ['Ọ̀ṣun-Ọ̀ṣogbo festival: the 2025 procession', 'An account of the 2025 Ọ̀ṣun-Ọ̀ṣogbo festival, including the role of the Arugba, the order of the procession and changes since UNESCO listing.', ['Ọ̀ṣun', 'Osogbo', 'festival', 'Arugba'], 'english', 6, 'Simisola Adeleke', 'Independent researcher', '2026-07-12'],
  ['The fall of Old Oyo (Ọ̀yọ́-Ilé), 1817–1836', 'Reconstructs the collapse of Old Oyo from palace traditions, missionary records and oral accounts collected in Ilorin and Ago-Oja.', ['Old Oyo', 'Afonja', 'Ilorin', 'history'], 'english', 4, 'Tunde Bakare', 'University of Lagos', '2026-06-24'],
  ['Ìwé Ìròyìn: early Yoruba-language newspapers', 'A survey of surviving issues of Ìwé Ìròhìn (1859–1867) and what they reveal about early Yoruba orthography and Abeokuta politics.', ['newspapers', 'orthography', 'Abeokuta'], 'both', 2, 'Folake Ogundipe', 'Federal University of Agriculture, Abeokuta', '2026-05-30'],
  ['Àgbo: herbal infusions in Lagos markets', 'Documents 22 àgbo preparations sold in Mushin and Oshodi markets, the plants used and how sellers describe their purpose.', ['àgbo', 'herbal medicine', 'Lagos', 'markets'], 'english', 7, 'Adewale Ojo', 'Ladoke Akintola University of Technology', '2026-04-18'],
];

const REVIEWERS = ['Dr. Adebayo Ogunleye', 'Dr. Funmilayo Adeyemi'];

function slug(title: string, i: number) {
  return `${stripDiacritics(title).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)}-demo${i + 1}`;
}

export const DEMO_ITEMS: DemoItem[] = RAW.map(([title, abstract, keywords, language, cat, author, institution, verified], i) => {
  const category = DEMO_CATEGORIES[cat - 1];
  return {
    id: `00000000-0000-4000-9000-${String(i + 1).padStart(12, '0')}`,
    title,
    abstract,
    keywords,
    language,
    public_link: slug(title, i),
    verified_at: `${verified}T10:00:00Z`,
    created_at: `${verified}T08:00:00Z`,
    category_id: category.id,
    category_name: category.name,
    author_name: author,
    institution,
    reviewer: REVIEWERS[i % 2],
    total_count: 0,
  };
});

/** Same rules as the search_research SQL function, applied to the sample items. */
export function searchDemo(filters: SearchFilters, pageSize: number) {
  const terms = stripDiacritics(filters.q).split(/\s+/).filter(Boolean);
  const matches = DEMO_ITEMS.filter((item) => {
    const haystack = stripDiacritics(`${item.title} ${item.abstract} ${item.keywords.join(' ')}`);
    const day = item.verified_at.slice(0, 10);
    return (
      terms.every((t) => haystack.includes(t)) &&
      (!filters.category || item.category_id === filters.category) &&
      (!filters.language || item.language === filters.language || (filters.language !== 'both' && item.language === 'both')) &&
      (!filters.from || day >= filters.from) &&
      (!filters.to || day <= filters.to)
    );
  });
  const q = stripDiacritics(filters.q);
  matches.sort((a, b) => Number(q && stripDiacritics(b.title).includes(q)) - Number(q && stripDiacritics(a.title).includes(q)) || b.verified_at.localeCompare(a.verified_at));
  const start = (filters.page - 1) * pageSize;
  return { rows: matches.slice(start, start + pageSize), total: matches.length };
}
