import { jsonError, readJson } from '@/lib/api';
import { createDemoAccount, startDemoSession } from '@/lib/demo-auth';
import { isDemoMode } from '@/lib/demo-data';
import { parseRole } from '@/lib/validation';

export async function POST(request: Request) {
  if (!isDemoMode()) return jsonError(404, 'Not found.');
  const body = await readJson(request);
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const result = createDemoAccount({
    email: str(body.email),
    password: str(body.password),
    full_name: str(body.full_name),
    institution: str(body.institution),
    role: parseRole(body.role) ?? 'researcher',
  });
  if (result.error) return jsonError(400, result.error);
  await startDemoSession(result.account!.id);
  return Response.json({ role: result.account!.role }, { status: 201 });
}
