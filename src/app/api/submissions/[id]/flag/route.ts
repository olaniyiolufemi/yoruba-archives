import type { NextRequest } from 'next/server';
import { authorize, jsonError, overLimit, readJson } from '@/lib/api';
import { adminIds, notify } from '@/lib/notify';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/validation';

// Any signed-in visitor can flag verified research for an administrator (FR8).
export async function POST(request: NextRequest, ctx: RouteContext<'/api/submissions/[id]/flag'>) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  const { viewer } = auth;
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'Submission not found.');

  const body = await readJson(request);
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 5 || reason.length > 1000) return jsonError(400, 'Describe the problem in 5–1000 characters.');

  const admin = createAdminClient();
  if (await overLimit(admin, { table: 'content_flags', column: 'reporter_id', userId: viewer.id, max: 20, windowMinutes: 24 * 60 })) {
    return jsonError(429, 'You have sent a lot of reports today. Please try again tomorrow.');
  }
  const { data: sub } = await admin
    .from('research_submissions')
    .select('id, title, status')
    .eq('id', id)
    .maybeSingle();
  if (!sub || sub.status !== 'verified') return jsonError(404, 'Submission not found.');

  const { data: existing, error: existingError } = await admin
    .from('content_flags')
    .select('id')
    .eq('submission_id', id)
    .eq('reporter_id', viewer.id)
    .eq('status', 'open')
    .maybeSingle();
  if (existingError) return jsonError(500, 'Could not save the flag. Please try again.');
  if (existing) return jsonError(409, 'You have already flagged this item. An administrator will look at it.');

  const { error } = await admin.from('content_flags').insert({ submission_id: id, reporter_id: viewer.id, reason });
  if (error) return jsonError(500, 'Could not save the flag.');

  await notify(
    admin,
    (await adminIds(admin)).map((adminId) => ({
      user_id: adminId,
      type: 'content_flagged',
      title: 'Content flagged',
      message: `"${sub.title}" was flagged: ${reason}`,
      submission_id: id,
      link: '/admin/flags',
    })),
  );

  return Response.json({ flagged: true }, { status: 201 });
}
