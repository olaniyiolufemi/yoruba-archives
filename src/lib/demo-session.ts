// Signed session cookie for demo accounts (DEMO_MODE=1 only). Crypto-only so the
// proxy can verify it too.
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DEMO_COOKIE = 'demo_session';
const SECRET_FILE = path.join(process.cwd(), '.demo-secret');

let secret: string | undefined;

// DEMO_SECRET when set; otherwise a random secret generated once per machine and
// kept next to the demo accounts, so there is no shared default to forge with.
function getSecret() {
  if (secret) return secret;
  if (process.env.DEMO_SECRET) return (secret = process.env.DEMO_SECRET);
  try {
    return (secret = fs.readFileSync(SECRET_FILE, 'utf8').trim());
  } catch {
    const fresh = randomBytes(32).toString('hex');
    try {
      fs.writeFileSync(SECRET_FILE, fresh, { flag: 'wx', mode: 0o600 });
      return (secret = fresh);
    } catch {
      // Another request created it first.
      return (secret = fs.readFileSync(SECRET_FILE, 'utf8').trim());
    }
  }
}

const sig = (id: string) => createHmac('sha256', getSecret()).update(id).digest('base64url');

export function signDemoSession(id: string) {
  return `${id}.${sig(id)}`;
}

export function readDemoSession(value: string | undefined): string | null {
  if (!value) return null;
  const [id, mac] = value.split('.');
  if (!id || !mac) return null;
  const expected = Buffer.from(sig(id));
  const given = Buffer.from(mac);
  return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}
