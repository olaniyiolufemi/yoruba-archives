import type { NextRequest } from 'next/server';
import { authorize, jsonError, readJson } from '@/lib/api';
import { logSecurityEvent } from '@/lib/audit';
import { notify } from '@/lib/notify';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/validation';

// FR8: admins (re)assign the designated reviewer for a submission.
export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/admin/submissions/[id]'>) {
  const auth = await authorize(['admin']);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  const reviewerId = (await readJson(request)).assigned_reviewer_id;
  if (!isUuid(id) || !isUuid(reviewerId)) return jsonError(400, 'Choose a reviewer.');

  const admin = createAdminClient();
  const [{ data: sub }, { data: reviewer }] = await Promise.all([
    admin.from('research_submissions').select('id, title, user_id, status').eq('id', id).maybeSingle(),
    admin.from('profiles').select('id, role').eq('id', reviewerId).maybeSingle(),
  ]);
  if (!sub) return jsonError(404, 'Submission not found.');
  if (!reviewer || (reviewer.role !== 'reviewer' && reviewer.role !== 'admin')) return jsonError(400, 'That user is not a reviewer.');
  if (reviewer.id === sub.user_id) return jsonError(400, 'Authors cannot review their own work.');

  const { error } = await admin.from('research_submissions').update({ assigned_reviewer_id: reviewerId }).eq('id', id);
  if (error) return jsonError(500, 'Could not assign the reviewer.');
  await logSecurityEvent('reviewer_assigned', { userId: auth.viewer.id, details: { submission_id: id, reviewer_id: reviewerId } });

  if (sub.status === 'pending') {
    await notify(admin, [
      {
        user_id: reviewerId,
        type: 'review_assigned',
        title: 'New submission to review',
        message: `You have been assigned "${sub.title}".`,
        submission_id: id,
        link: `/review/${id}`,
      },
    ]);
  }
  return Response.json({ assigned_reviewer_id: reviewerId });
}
