// Generates the engraved-style line illustrations in public/art/.
// Run with: node scripts/generate-art.mts
import fs from 'node:fs';

const INK = '#9a9a9a';
const DARK = '#7a7a7a';
let seed = 7;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const f = (n: number) => n.toFixed(1);
const pt = (cx: number, cy: number, r: number, a: number) => [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
const svg = (w: number, h: number, body: string, title: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}"><title>${title}</title><g fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>\n`;

// ── Ọpọ́n Ifá: divination tray (hero) ─────────────────────────────────────────
function opon() {
  const c = 500;
  let s = '';
  // Engraved outer rim: tight concentric rings.
  for (let r = 488; r >= 446; r -= 3) s += `<circle cx="${c}" cy="${c}" r="${r}" stroke-width="${r % 9 === 0 ? 1.1 : 0.55}"/>`;
  // Rim shading: hatching on the lower-right arc.
  for (let a = -0.2; a < 1.9; a += 0.012) {
    const [x1, y1] = pt(c, c, 446, a), [x2, y2] = pt(c, c, 488, a + 0.03);
    s += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke-width="0.45"/>`;
  }
  // Carved border band divided into 16 panels, one per principal Odù.
  s += `<circle cx="${c}" cy="${c}" r="440" stroke-width="1.3" stroke="${DARK}"/><circle cx="${c}" cy="${c}" r="352" stroke-width="1.3" stroke="${DARK}"/>`;
  for (let i = 0; i < 16; i++) {
    const a0 = -Math.PI / 2 + (i - 0.5) * (Math.PI / 8), a1 = a0 + Math.PI / 8;
    const [x1, y1] = pt(c, c, 352, a0), [x2, y2] = pt(c, c, 440, a0);
    s += `<path d="M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}" stroke-width="1.1" stroke="${DARK}"/>`;
    if (i === 0) continue; // Èṣù's face sits at the top.
    const mid = (a0 + a1) / 2;
    if (i % 4 === 1 || i % 4 === 3) {
      // Interlace: nested chevrons.
      for (let k = 0; k < 9; k++) {
        const r = 362 + k * 9;
        const [ax, ay] = pt(c, c, r, a0 + 0.02), [bx, by] = pt(c, c, r + 16, mid), [dx, dy] = pt(c, c, r, a1 - 0.02);
        s += `<path d="M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}L${f(dx)} ${f(dy)}" stroke-width="0.7"/>`;
      }
    } else if (i % 4 === 2) {
      // Cross-hatched panel.
      for (let a = a0 + 0.01; a < a1; a += 0.018) {
        const [x3, y3] = pt(c, c, 356, a), [x4, y4] = pt(c, c, 436, a + 0.12);
        const [x5, y5] = pt(c, c, 356, a + 0.12), [x6, y6] = pt(c, c, 436, a);
        if (a + 0.12 < a1) s += `<path d="M${f(x3)} ${f(y3)}L${f(x4)} ${f(y4)}M${f(x5)} ${f(y5)}L${f(x6)} ${f(y6)}" stroke-width="0.45"/>`;
      }
    } else {
      // Cowrie shell motif with radiating grooves.
      const [cx, cy] = pt(c, c, 396, mid);
      s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="18" ry="30" transform="rotate(${f((mid * 180) / Math.PI + 90)} ${f(cx)} ${f(cy)})" stroke-width="1"/>`;
      s += `<path d="M${f(cx - 0)} ${f(cy)}" />`;
      for (let k = -4; k <= 4; k++) {
        const [gx, gy] = pt(cx, cy, 8, mid + k * 0.35), [hx, hy] = pt(cx, cy, 22, mid + k * 0.35);
        s += `<path d="M${f(gx)} ${f(gy)}L${f(hx)} ${f(hy)}" stroke-width="0.5"/>`;
      }
      for (let r = 362; r < 432; r += 6) {
        const [ax, ay] = pt(c, c, r, a0 + 0.015), [bx, by] = pt(c, c, r, a0 + 0.05);
        const [dx, dy] = pt(c, c, r, a1 - 0.05), [ex, ey] = pt(c, c, r, a1 - 0.015);
        s += `<path d="M${f(ax)} ${f(ay)}L${f(bx)} ${f(by)}M${f(dx)} ${f(dy)}L${f(ex)} ${f(ey)}" stroke-width="0.5"/>`;
      }
    }
  }
  // Èṣù face at the top of the tray.
  const fy = 104;
  s += `<path d="M450 ${fy - 40}Q500 ${fy - 66} 550 ${fy - 40}Q566 ${fy + 10} 540 ${fy + 48}Q500 ${fy + 70} 460 ${fy + 48}Q434 ${fy + 10} 450 ${fy - 40}Z" fill="#fff" stroke-width="1.4" stroke="${DARK}"/>`;
  for (let y = fy - 44; y < fy + 60; y += 4) s += `<path d="M${452 + Math.abs(y - fy) * 0.12} ${y}L${548 - Math.abs(y - fy) * 0.12} ${y}" stroke-width="0.35"/>`;
  s += `<path d="M466 ${fy - 6}Q478 ${fy - 16} 490 ${fy - 6}Q478 ${fy + 2} 466 ${fy - 6}ZM510 ${fy - 6}Q522 ${fy - 16} 534 ${fy - 6}Q522 ${fy + 2} 510 ${fy - 6}Z" fill="#fff" stroke-width="1.2" stroke="${DARK}"/>`;
  s += `<path d="M500 ${fy - 8}L494 ${fy + 18}Q500 ${fy + 24} 506 ${fy + 18}M484 ${fy + 34}Q500 ${fy + 28} 516 ${fy + 34}Q500 ${fy + 44} 484 ${fy + 34}Z" fill="#fff" stroke-width="1.2" stroke="${DARK}"/>`;
  s += `<path d="M470 ${fy - 52}L500 ${fy - 92}L530 ${fy - 52}" stroke-width="1.2" stroke="${DARK}"/>`;
  for (let k = 0; k < 6; k++) s += `<path d="M${476 + k * 2} ${fy - 56 - k * 6}L${524 - k * 2} ${fy - 56 - k * 6}" stroke-width="0.5"/>`;
  // Bead ring.
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 90) {
    const [x, y] = pt(c, c, 341, a);
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="3.2" stroke-width="0.7"/>`;
  }
  s += `<circle cx="${c}" cy="${c}" r="330" stroke-width="1.2" stroke="${DARK}"/>`;
  // Dusted centre (ìyẹ̀rọ̀sùn) with stipple, denser towards the edge.
  for (let i = 0; i < 2600; i++) {
    const r = 326 * Math.sqrt(rand()) ** 0.55, a = rand() * Math.PI * 2;
    if (rand() > r / 326 + 0.12) continue;
    const [x, y] = pt(c, c, r, a);
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.6 + rand() * 0.9)}" fill="${INK}" stroke="none"/>`;
  }
  // Odù marks drawn in the dust: Ogbè (left) and Ọ̀yẹ̀kú (right) columns.
  const mark = (x: number, y: number, double: boolean) =>
    double ? `<path d="M${x - 9} ${y}l0 34M${x + 9} ${y}l0 34" stroke-width="2.6" stroke="${DARK}"/>` : `<path d="M${x} ${y}l0 34" stroke-width="2.6" stroke="${DARK}"/>`;
  for (let k = 0; k < 4; k++) {
    s += mark(452, 400 + k * 58, false);
    s += mark(548, 400 + k * 58, true);
  }
  // Divider lines across the dust.
  s += `<path d="M230 500 Q500 476 770 500" stroke-width="0.6"/>`;
  return svg(1000, 1000, s, 'Engraving of an Ọpọ́n Ifá divination tray');
}

// ── Ife bronze head ──────────────────────────────────────────────────────────
function ifeHead() {
  let s = '';
  const face = 'M200 158C282 158 300 236 293 300C286 368 252 424 200 428C148 424 114 368 107 300C100 236 118 158 200 158Z';
  s += `<defs><clipPath id="face"><path d="${face}"/></clipPath></defs>`;
  // Neck and rings.
  s += `<path d="M158 412L150 492M242 412L250 492" stroke-width="1.4" stroke="${DARK}"/>`;
  for (let y = 436; y < 490; y += 12) s += `<path d="M${154 - (y - 436) * 0.08} ${y}Q200 ${y + 10} ${246 + (y - 436) * 0.08} ${y}" stroke-width="1"/>`;
  for (let x = 152; x < 250; x += 3) s += `<path d="M${x} 470L${x + 2} 492" stroke-width="0.4"/>`;
  // Ears.
  s += `<path d="M108 270Q86 268 88 300Q90 330 112 334M292 270Q314 268 312 300Q310 330 288 334" stroke-width="1.3" stroke="${DARK}"/>`;
  // Face with vertical striations, as on the Ife heads.
  s += `<path d="${face}" fill="#fff" stroke-width="1.6" stroke="${DARK}"/>`;
  s += `<g clip-path="url(#face)">`;
  for (let x = 104; x < 298; x += 3.4) s += `<path d="M${f(x)} 150L${f(x + 1.5)} 432" stroke-width="0.55"/>`;
  // Shading on the right cheek.
  for (let y = 250; y < 420; y += 4) s += `<path d="M${250 + (y - 250) * 0.05} ${y}L298 ${y - 14}" stroke-width="0.4"/>`;
  s += `</g>`;
  // Eyes, nose, lips (filled white to break the striations).
  s += `<path d="M132 268Q158 248 186 268Q158 282 132 268ZM214 268Q242 248 268 268Q242 282 214 268Z" fill="#fff" stroke-width="1.4" stroke="${DARK}"/>`;
  s += `<path d="M134 262Q158 238 184 260M216 260Q242 238 266 262" stroke-width="1.1"/>`;
  s += `<path d="M150 268Q159 262 168 268M232 268Q241 262 250 268" stroke-width="0.9"/>`;
  s += `<path d="M200 270L190 330Q186 342 196 342Q200 348 204 342Q214 342 210 330L200 270" fill="#fff" stroke-width="1.3" stroke="${DARK}"/>`;
  s += `<path d="M168 368Q184 354 200 362Q216 354 232 368Q200 374 168 368ZM170 370Q200 398 230 370" fill="#fff" stroke-width="1.4" stroke="${DARK}"/>`;
  // Beaded crown.
  s += `<path d="M110 196Q114 70 200 54Q286 70 290 196Q200 172 110 196Z" fill="#fff" stroke-width="1.6" stroke="${DARK}"/>`;
  for (let row = 0; row < 12; row++) {
    const y = 70 + row * 10.5;
    const half = Math.min(88, 18 + Math.sqrt((y - 54) * 60));
    const sag = row * 0.9;
    for (let x = 200 - half + 5; x < 200 + half - 4; x += 8.5) {
      const yy = y + Math.abs(x - 200) * 0.06 - sag * 0.2;
      s += `<circle cx="${f(x)}" cy="${f(yy)}" r="3.4" stroke-width="0.7"/>`;
    }
  }
  // Crest and rosette.
  s += `<path d="M188 56L184 18Q200 6 216 18L212 56" fill="#fff" stroke-width="1.4" stroke="${DARK}"/>`;
  for (let y = 22; y < 56; y += 5) s += `<path d="M186 ${y}L214 ${y}" stroke-width="0.6"/>`;
  s += `<circle cx="200" cy="150" r="16" fill="#fff" stroke-width="1.2" stroke="${DARK}"/>`;
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    const [x, y] = pt(200, 150, 10, a);
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="3" stroke-width="0.7"/>`;
  }
  return svg(400, 500, s, 'Engraving of an Ife bronze head');
}

// ── Adé: beaded crown with veil ─────────────────────────────────────────────
function ade() {
  let s = '';
  // Veil strands.
  for (let x = 98; x <= 302; x += 8) {
    s += `<path d="M${x} 404L${x + (x - 200) * 0.04} 490" stroke-width="0.6"/>`;
    for (let y = 412; y < 488; y += 9) s += `<circle cx="${f(x + ((x - 200) * 0.04 * (y - 404)) / 86)}" cy="${y}" r="2.2" stroke-width="0.6"/>`;
  }
  // Cone with rows of beads.
  s += `<path d="M90 404L200 76L310 404Z" fill="#fff" stroke-width="1.6" stroke="${DARK}"/>`;
  for (let y = 94; y < 398; y += 9) {
    const half = ((y - 76) / 328) * 110 - 4;
    const offset = (y / 9) % 2 ? 0 : 4;
    for (let x = 200 - half + offset; x < 200 + half; x += 8) s += `<circle cx="${f(x)}" cy="${y}" r="3.1" stroke-width="0.65"/>`;
  }
  // Face panel on the front of the crown.
  s += `<path d="M160 222Q200 206 240 222Q248 268 228 300Q200 316 172 300Q152 268 160 222Z" fill="#fff" stroke-width="1.4" stroke="${DARK}"/>`;
  s += `<path d="M170 252Q181 244 192 252Q181 258 170 252ZM208 252Q219 244 230 252Q219 258 208 252Z" fill="#fff" stroke-width="1.2" stroke="${DARK}"/>`;
  s += `<path d="M200 256L196 278Q200 282 204 278M188 292Q200 288 212 292" stroke-width="1.1" stroke="${DARK}"/>`;
  for (let y = 214; y < 308; y += 4) s += `<path d="M${164 + Math.abs(y - 260) * 0.2} ${y}L${170 + Math.abs(y - 260) * 0.2} ${y}M${230 - Math.abs(y - 260) * 0.2} ${y}L${236 - Math.abs(y - 260) * 0.2} ${y}" stroke-width="0.4"/>`;
  // Base band.
  s += `<path d="M86 404L314 404M90 396L310 396" stroke-width="1.4" stroke="${DARK}"/>`;
  // Birds (ẹyẹ) on the crown: the apex and two sides.
  const bird = (x: number, y: number, k: number) =>
    `<path d="M${x - 16 * k} ${y}Q${x - 4 * k} ${y - 12 * k} ${x + 10 * k} ${y - 6 * k}L${x + 18 * k} ${y - 10 * k}L${x + 13 * k} ${y - 3 * k}Q${x + 2 * k} ${y + 6 * k} ${x - 16 * k} ${y}Z" fill="#fff" stroke-width="1.2" stroke="${DARK}"/><path d="M${x - 6 * k} ${y - 4 * k}L${x - 14 * k} ${y - 16 * k}" stroke-width="0.9"/>`;
  s += bird(200, 70, 1.3) + bird(150, 168, 0.9) + bird(252, 168, 0.9);
  return svg(400, 500, s, 'Engraving of an adé, a beaded Yoruba crown');
}

// ── Dùndún: talking drum ─────────────────────────────────────────────────────
function dundun() {
  let s = '';
  const top = 84, bot = 420, waist = 252, R = 110, W = 52, ry = 22;
  s += `<path d="M${200 - R} ${top}Q${200 - W * 0.6} ${waist} ${200 - R} ${bot}M${200 + R} ${top}Q${200 + W * 0.6} ${waist} ${200 + R} ${bot}" stroke-width="1.6" stroke="${DARK}"/>`;
  // Tension cords across the front.
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI;
    const x0 = 200 + R * Math.cos(t), y0 = top + ry * Math.sin(t);
    const x2 = 200 + R * Math.cos(t), y2 = bot + ry * Math.sin(t);
    const wx = 200 + W * Math.cos(t), wy = waist + 8 * Math.sin(t);
    const cx = 2 * wx - (x0 + x2) / 2, cy = 2 * wy - (y0 + y2) / 2;
    s += `<path d="M${f(x0)} ${f(y0)}Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}" stroke-width="${i % 2 ? 0.5 : 0.8}"/>`;
  }
  // Drum heads and rims.
  for (const y of [top, bot]) {
    s += `<ellipse cx="200" cy="${y}" rx="${R}" ry="${ry}" fill="#fff" stroke-width="1.6" stroke="${DARK}"/>`;
    s += `<ellipse cx="200" cy="${y}" rx="${R - 8}" ry="${ry - 5}" stroke-width="0.8"/>`;
  }
  for (let x = 110; x < 290; x += 5) s += `<path d="M${x} ${top - 6}L${x + 8} ${top + 6}" stroke-width="0.35"/>`;
  // Waist strap and bells.
  s += `<path d="M${200 - W - 6} ${waist - 8}Q200 ${waist + 10} ${200 + W + 6} ${waist - 8}M${200 - W - 6} ${waist + 4}Q200 ${waist + 22} ${200 + W + 6} ${waist + 4}" stroke-width="1.3" stroke="${DARK}"/>`;
  for (let k = -2; k <= 2; k++) s += `<circle cx="${200 + k * 18}" cy="${waist + 30 + Math.abs(k) * -3}" r="5" fill="#fff" stroke-width="1"/>`;
  // Curved beater (ọ̀pá).
  s += `<path d="M300 40Q360 70 338 150Q330 175 312 186" stroke-width="5" stroke="${DARK}"/><path d="M300 40Q360 70 338 150" stroke-width="1.5" stroke="#fff"/>`;
  return svg(400, 500, s, 'Engraving of a dùndún talking drum');
}

fs.writeFileSync('public/art/opon-ifa.svg', opon());
fs.writeFileSync('public/art/ife-head.svg', ifeHead());
fs.writeFileSync('public/art/ade.svg', ade());
fs.writeFileSync('public/art/dundun.svg', dundun());
for (const n of ['opon-ifa', 'ife-head', 'ade', 'dundun']) console.log(n, (fs.statSync(`public/art/${n}.svg`).size / 1024).toFixed(0), 'KB');
