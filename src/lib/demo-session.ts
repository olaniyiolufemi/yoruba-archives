// Signed session cookie for demo accounts (DEMO_MODE=1 only). Crypto-only so the
// proxy can verify it too.
import { createHmac, timingSafeEqual } from 'node:crypto';

export const DEMO_COOKIE = 'demo_session';
const SECRET = process.env.DEMO_SECRET || 'yoruba-archives-local-demo';

const sig = (id: string) => createHmac('sha256', SECRET).update(id).digest('base64url');

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
