import { jsonError, readJson } from '@/lib/api';
import { startDemoSession, verifyDemoLogin } from '@/lib/demo-auth';
import { isDemoMode } from '@/lib/demo-data';

export async function POST(request: Request) {
  if (!isDemoMode()) return jsonError(404, 'Not found.');
  const body = await readJson(request);
  const account = verifyDemoLogin(String(body.email ?? ''), String(body.password ?? ''));
  if (!account) return jsonError(401, 'Incorrect email or password.');
  await startDemoSession(account.id);
  return Response.json({ role: account.role });
}
