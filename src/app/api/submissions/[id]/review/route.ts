import { randomBytes } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { authorize, jsonError, readJson } from '@/lib/api';
import { logSecurityEvent } from '@/lib/audit';
import { notify } from '@/lib/notify';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid, parseReview, slugify } from '@/lib/validation';

// FR4: the designated reviewer (or an admin) approves, rejects or returns a
// submission against the Section 3.4 checklist. FR5: the author is notified.
// FR6: approval issues the permanent public link.
export async function POST(request: NextRequest, ctx: RouteContext<'/api/submissions/[id]/review'>) {
  const auth = await authorize(['reviewer', 'admin']);
  if (auth.error) return auth.error;
  const { viewer } = auth;
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'Submission not found.');

  const review = parseReview(await readJson(request));
  if (!review.ok) return jsonError(400, review.error);

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from('research_submissions')
    .select('id, user_id, title, assigned_reviewer_id')
    .eq('id', id)
    .maybeSingle();
  if (!sub) return jsonError(404, 'Submission not found.');
  if (viewer.role !== 'admin' && sub.assigned_reviewer_id !== viewer.id) {
    await logSecurityEvent('access_denied', { userId: viewer.id, details: { action: 'review', submission_id: id, reason: 'not_assigned' } });
    return jsonError(403, 'This submission is assigned to another reviewer.');
  }
  if (sub.user_id === viewer.id) {
    await logSecurityEvent('access_denied', { userId: viewer.id, details: { action: 'review', submission_id: id, reason: 'own_submission' } });
    return jsonError(403, 'You cannot review your own submission.');
  }

  const r = review.value;
  const { data: updated, error } = await admin.rpc('record_review', {
    p_submission: id,
    p_reviewer: viewer.id,
    p_decision: r.decision,
    p_authorship: r.authorship_check,
    p_source: r.source_check,
    p_cultural: r.cultural_relevance_check,
    p_sensitivity: r.sensitivity_check,
    p_comments: r.comments,
    p_public_link: slugify(sub.title, randomBytes(3).toString('hex')),
  });
  if (error) {
    if (error.code === 'P0001') return jsonError(409, error.message);
    if (error.code === 'P0002') return jsonError(404, 'Submission not found.');
    console.error('[review] record_review failed', error.message);
    return jsonError(500, 'Could not record the decision.');
  }

  const publicLink = (updated as { public_link: string | null }).public_link;
  const messages = {
    verified: {
      title: 'Your research is verified',
      message: `"${sub.title}" passed review and is now public.`,
      link: `/research/${publicLink}`,
    },
    rejected: {
      title: 'Submission not accepted',
      message: `"${sub.title}" was not accepted. Reviewer comments: ${r.comments}`,
      link: `/dashboard/submissions/${id}`,
    },
    revision_requested: {
      title: 'Revision requested',
      message: `"${sub.title}" needs changes before it can be verified. Reviewer comments: ${r.comments}`,
      link: `/dashboard/submissions/${id}`,
    },
  }[r.decision];

  await notify(admin, [{ user_id: sub.user_id, type: `status_${r.decision}`, submission_id: id, ...messages }]);

  return Response.json({ status: r.decision, public_link: publicLink });
}
