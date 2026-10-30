import 'server-only';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { cookies } from 'next/headers';
import type { Viewer } from './auth';
import type { Role } from './constants';
import { DEMO_COOKIE, readDemoSession, signDemoSession } from './demo-session';

// Demo-only accounts kept in a local JSON file, so sign-up works before Supabase
// is linked. Never used when DEMO_MODE is off.
type DemoAccount = Viewer & { salt: string; password_hash: string; created_at: string };

const FILE = path.join(process.cwd(), '.demo-accounts.json');

function load(): DemoAccount[] {
  try {
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

const hash = (password: string, salt: string) => scryptSync(password, salt, 32).toString('hex');

export function createDemoAccount(input: { email: string; password: string; full_name: string; institution: string; role: Role }) {
  const email = input.email.trim().toLowerCase();
  const full_name = input.full_name.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (input.password.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (!full_name) return { error: 'Enter your name.' };

  const accounts = load();
  if (accounts.some((a) => a.email === email)) return { error: 'An account with this email already exists. Sign in instead.' };

  const salt = randomBytes(16).toString('hex');
  const account: DemoAccount = {
    id: randomUUID(),
    email,
    full_name,
    institution: input.institution.trim() || null,
    role: input.role,
    salt,
    password_hash: hash(input.password, salt),
    created_at: new Date().toISOString(),
  };
  fs.writeFileSync(FILE, JSON.stringify([...accounts, account], null, 2));
  return { account };
}

export function verifyDemoLogin(email: string, password: string) {
  const account = load().find((a) => a.email === email.trim().toLowerCase());
  if (!account) return null;
  const expected = Buffer.from(account.password_hash, 'hex');
  const given = Buffer.from(hash(password, account.salt), 'hex');
  return timingSafeEqual(expected, given) ? account : null;
}

export async function startDemoSession(id: string) {
  (await cookies()).set(DEMO_COOKIE, signDemoSession(id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function endDemoSession() {
  (await cookies()).delete(DEMO_COOKIE);
}

export async function getDemoViewer(): Promise<Viewer | null> {
  const id = readDemoSession((await cookies()).get(DEMO_COOKIE)?.value);
  const account = id ? load().find((a) => a.id === id) : undefined;
  if (!account) return null;
  const { id: uid, email, full_name, role, institution } = account;
  return { id: uid, email, full_name, role, institution };
}
