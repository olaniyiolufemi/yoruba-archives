const db = require('./db');
const crypto = require('crypto');

const hashPw = (pw) => crypto.createHash('sha256').update(pw).digest('hex');

const users = [
  { name: 'Dr. Babatunde Lawal', email: 'blawal@unilag.edu.ng', password_hash: hashPw('pass123'), role: 'researcher', institution: 'University of Lagos' },
  { name: 'Prof. Wande Abimbola', email: 'wabimbola@oauife.edu.ng', password_hash: hashPw('pass123'), role: 'reviewer', institution: 'Obafemi Awolowo University' },
  { name: 'Olaniyi Olufemi', email: 'olufemi.o@alustudent.com', password_hash: hashPw('admin123'), role: 'admin', institution: 'African Leadership University' },
  { name: 'Simisola Adeleke', email: 'sadeleke@ui.edu.ng', password_hash: hashPw('pass123'), role: 'researcher', institution: 'University of Ibadan' },
  { name: 'Kehinde Balogun', email: 'kbalogun@gmail.com', password_hash: hashPw('pass123'), role: 'public', institution: 'Independent Cultural Enthusiast' }
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password_hash, role, institution)
  VALUES (@name, @email, @password_hash, @role, @institution)
`);

users.forEach(u => insertUser.run(u));

const categories = [
  'Art & Sculpture',
  'Linguistics & Orthography',
  'Cosmology & Philosophy',
  'Historical Monarchies & Wars',
  'Musical Traditions & Oral Poetry',
  'Indigenous Medicine & Botany'
];

const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (category_name)
  VALUES (?)
`);

categories.forEach(c => insertCategory.run(c));

const submissions = [
  {
    submission_id: 'sub_ife_bronze_01',
    user_id: 1,
    title: 'Metallurgical Analysis of 12th-Century Ife Terracotta and Brass Casting',
    abstract: 'An archeological and structural assessment of naturalistic lost-wax brass heads excavated from Wunmonije Compound in Ile-Ife, detailing indigenous copper smelting techniques and ceremonial coronation contexts.',
    category_id: 1,
    file_url: '/uploads/ife_lost_wax_metallurgy.pdf',
    file_name: 'ife_lost_wax_metallurgy.pdf',
    file_type: 'application/pdf',
    source_type: 'contributed',
    status: 'verified',
    shareable_link: 'ife-brass-casting-metallurgy-1938'
  },
  {
    submission_id: 'sub_tonal_morph_02',
    user_id: 4,
    title: 'Tonology and High Tone Contraction in Standard Yoruba Verbal Morphology',
    abstract: 'Investigating pitch register contours (Do, Re, Mi) and vowel elision rules across Western and Eastern dialect clusters, examining dialectal divergence between Oyo, Ijesha, and Ondo.',
    category_id: 2,
    file_url: '/uploads/yoruba_tonal_morphology.pdf',
    file_name: 'yoruba_tonal_morphology.pdf',
    file_type: 'application/pdf',
    source_type: 'contributed',
    status: 'verified',
    shareable_link: 'yoruba-tonology-verbal-morph'
  },
  {
    submission_id: 'sub_ifa_corpus_03',
    user_id: 1,
    title: 'Binary Computation Principles within the 256 Odu Ifa Divination Verses',
    abstract: 'An epistemological exploration analyzing mathematical parity, permutations, and systemic memory structures embedded within Odu Ifa oral archives and historical philosophical transmission.',
    category_id: 3,
    file_url: '/uploads/ifa_binary_permutations.pdf',
    file_name: 'ifa_binary_permutations.pdf',
    file_type: 'application/pdf',
    source_type: 'contributed',
    status: 'verified',
    shareable_link: 'ifa-binary-epistemology-odu'
  },
  {
    submission_id: 'sub_oyo_cavalry_04',
    user_id: 4,
    title: 'Logistics and Military Organization of the Oyo Empire Imperial Cavalry',
    abstract: 'Documenting veterinary practices, horse trading routes with the Hausa kingdoms, and tactical deployment strategies of the Oyo Mesi and the Aare Ona Kakanfo during the 17th century.',
    category_id: 4,
    file_url: '/uploads/oyo_imperial_cavalry.pdf',
    file_name: 'oyo_imperial_cavalry.pdf',
    file_type: 'application/pdf',
    source_type: 'contributed',
    status: 'pending',
    shareable_link: 'oyo-cavalry-military-logistics'
  },
  {
    submission_id: 'sub_aodl_gelede_05',
    user_id: 3,
    title: 'Gelede Masquerade Headpieces: Female Agency and Maternal Praise',
    abstract: 'Curated photographic and descriptive documentation of 19th-century Ketu and Egbado Gelede carved headdresses celebrating Iyami Aje, collected by the African Online Digital Library (AODL).',
    category_id: 1,
    file_url: 'https://aodl.org/matrix/media/gelede_headpiece_record_482.jpg',
    file_name: 'gelede_headpiece_record_482.jpg',
    file_type: 'image/jpeg',
    source_type: 'aggregated',
    status: 'verified',
    shareable_link: 'aodl-gelede-headpieces-maternal'
  },
  {
    submission_id: 'sub_ajol_herbal_06',
    user_id: 3,
    title: 'Ethnobotanical Survey of Indigenous Yoruba Phytomedicine in Osun Sacred Grove',
    abstract: 'Indexed documentation of 84 medicinal plant species cataloged by the African Journals Online (AJOL) botanical survey team, correlating traditional usage with bioactive compound yields.',
    category_id: 6,
    file_url: 'https://ajol.info/index.php/article/view/28491.pdf',
    file_name: 'ajol_ethnobotanical_survey.pdf',
    file_type: 'application/pdf',
    source_type: 'aggregated',
    status: 'verified',
    shareable_link: 'ajol-osun-phytomedicine-survey'
  }
];

const insertSub = db.prepare(`
  INSERT OR IGNORE INTO research_submissions (
    submission_id, user_id, title, abstract, category_id, file_url, file_name, file_type, source_type, status, shareable_link
  ) VALUES (
    @submission_id, @user_id, @title, @abstract, @category_id, @file_url, @file_name, @file_type, @source_type, @status, @shareable_link
  )
`);

submissions.forEach(s => insertSub.run(s));

const reviews = [
  {
    submission_id: 'sub_ife_bronze_01',
    reviewer_id: 2,
    decision: 'verified',
    comments: 'Exceptional archival rigor. Cross-references well with Frank Willett archaeological notes from 1958. Approved for public discovery.'
  },
  {
    submission_id: 'sub_tonal_morph_02',
    reviewer_id: 2,
    decision: 'verified',
    comments: 'Phonological notation adheres strictly to Bamgbose Yoruba orthography conventions. Verified and published.'
  },
  {
    submission_id: 'sub_ifa_corpus_03',
    reviewer_id: 2,
    decision: 'verified',
    comments: 'Mathematically sound and preserves oral corpus citations accurately. Recommended for public index.'
  }
];

const insertReview = db.prepare(`
  INSERT OR IGNORE INTO peer_reviews (submission_id, reviewer_id, decision, comments)
  VALUES (@submission_id, @reviewer_id, @decision, @comments)
`);

reviews.forEach(r => insertReview.run(r));

const requests = [
  {
    user_id: 5,
    topic: 'Documenting Ancient Ijebu Eredo Earthworks and Boundary Moats',
    description: 'The 160-kilometer protective rampart surrounding ancient Ijebu remains poorly digitized. We need LIDAR or ground-penetrating satellite surveys and oral accounts from surrounding communities before erosion destroys more segments.',
    vote_count: 14,
    status: 'prioritized'
  },
  {
    user_id: 4,
    topic: 'Historical Phonology of Extinct Dialects in Northeast Yoruba Borders',
    description: 'Borders near Kabba, Akoko, and Yagba feature archaic vowel harmonies rapidly assimilating into Standard Yoruba. Audio recordings and morphological lexicons are urgently needed.',
    vote_count: 9,
    status: 'open'
  },
  {
    user_id: 1,
    topic: 'Pre-Colonial Iron Smelting Forges of Oyo-Ile',
    description: 'Excavation records of slag heaps and furnace tuyeres in Old Oyo National Park to authenticate production volume prior to the 1835 Fulani incursions.',
    vote_count: 6,
    status: 'open'
  }
];

const insertReq = db.prepare(`
  INSERT OR IGNORE INTO research_requests (user_id, topic, description, vote_count, status)
  VALUES (@user_id, @topic, @description, @vote_count, @status)
`);

requests.forEach(rq => insertReq.run(rq));

const sources = [
  { name: 'African Online Digital Library (AODL)', base_url: 'https://aodl.org', submission_id: 'sub_aodl_gelede_05' },
  { name: 'African Journals Online (AJOL)', base_url: 'https://ajol.info', submission_id: 'sub_ajol_herbal_06' },
  { name: 'Internet Archive - Yoruba Collection', base_url: 'https://archive.org/details/yorubacollection', submission_id: null },
  { name: 'British Museum West Africa Archives', base_url: 'https://britishmuseum.org/collection', submission_id: null }
];

const insertSource = db.prepare(`
  INSERT OR IGNORE INTO external_sources (name, base_url, last_indexed_at, submission_id)
  VALUES (@name, @base_url, CURRENT_TIMESTAMP, @submission_id)
`);

sources.forEach(src => insertSource.run(src));

const notifications = [
  {
    user_id: 1,
    title: 'Submission Verified',
    message: 'Your submission "Metallurgical Analysis of 12th-Century Ife Terracotta" has been verified and published.',
    submission_id: 'sub_ife_bronze_01'
  },
  {
    user_id: 4,
    title: 'Submission Under Review',
    message: 'Your research "Logistics and Military Organization of the Oyo Empire Imperial Cavalry" has been assigned to reviewer queue.',
    submission_id: 'sub_oyo_cavalry_04'
  }
];

const insertNotif = db.prepare(`
  INSERT OR IGNORE INTO notifications (user_id, title, message, submission_id)
  VALUES (@user_id, @title, @message, @submission_id)
`);

notifications.forEach(n => insertNotif.run(n));

console.log('Seeding completed successfully.');
