const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function makePdf(title, author, content) {
  const stream = [
    '%PDF-1.4\n',
    '1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n',
    '2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n',
    '3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources <</Font <</F1 5 0 R>>>>>> endobj\n',
    '4 0 obj <</Length 250>> stream\n',
    'BT\n',
    '/F1 18 Tf\n',
    '50 720 Td\n',
    `(${title}) Tj\n`,
    '/F1 12 Tf\n',
    '0 -30 Td\n',
    `(${author}) Tj\n`,
    '0 -30 Td\n',
    `(${content.slice(0, 100)}) Tj\n`,
    'ET\n',
    'endstream\n',
    'endobj\n',
    '5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n',
    'xref\n',
    '0 6\n',
    '0000000000 65535 f \n',
    '0000000010 00000 n \n',
    '0000000060 00000 n \n',
    '0000000117 00000 n \n',
    '0000000244 00000 n \n',
    '0000000550 00000 n \n',
    'trailer <</Size 6 /Root 1 0 R>>\n',
    'startxref\n',
    '620\n',
    '%%EOF'
  ].join('');
  return Buffer.from(stream, 'utf8');
}

const files = [
  { name: 'ife_lost_wax_metallurgy.pdf', title: 'Yoruba Archives: Ife Metallurgy Study', author: 'Dr. Babatunde Lawal', text: 'Lost-wax brass casting from 12th-century Ile-Ife metallurgical sites.' },
  { name: 'yoruba_tonal_morphology.pdf', title: 'Yoruba Archives: Tonal Morphology', author: 'Simisola Adeleke', text: 'Phonological contours and high tone contractions across dialects.' },
  { name: 'ifa_binary_permutations.pdf', title: 'Yoruba Archives: Odu Ifa Binary Principles', author: 'Dr. Babatunde Lawal', text: 'Mathematical parity and 256 permutations in oral corpus preservation.' },
  { name: 'oyo_imperial_cavalry.pdf', title: 'Yoruba Archives: Oyo Imperial Cavalry', author: 'Simisola Adeleke', text: 'Organization and logistical strategy of the historical Oyo Mesi cavalry.' }
];

files.forEach(f => {
  const filePath = path.join(uploadDir, f.name);
  fs.writeFileSync(filePath, makePdf(f.title, f.author, f.text));
});

console.log('Sample files generated successfully.');
