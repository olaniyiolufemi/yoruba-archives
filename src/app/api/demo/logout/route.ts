import { endDemoSession } from '@/lib/demo-auth';

export async function POST() {
  await endDemoSession();
  return Response.json({ ok: true });
}
