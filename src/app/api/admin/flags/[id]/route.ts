import type { NextRequest } from 'next/server';
import { authorize, jsonError, readJson } from '@/lib/api';
import { notify } from '@/lib/notify';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid } from '@/lib/validation';

// FR8: resolve flagged content. "unpublish" hides the item and returns it to the
// author for revision; its permanent link is kept for when it is re-verified.
export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/admin/flags/[id]'>) {
  const auth = await authorize(['admin']);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'Flag not found.');

  const action = (await readJson(request)).action;
  if (action !== 'dismiss' && action !== 'unpublish') return jsonError(400, 'Choose dismiss or unpublish.');

  const admin = createAdminClient();
  const { data: flag } = await admin
    .from('content_flags')
    .select('id, submission_id, reason, status, research_submissions(title, user_id, status)')
    .eq('id', id)
    .maybeSingle();
  if (!flag) return jsonError(404, 'Flag not found.');
  if (flag.status !== 'open') return jsonError(409, 'This flag is already resolved.');

  const resolved = { resolved_by: auth.viewer.id, resolved_at: new Date().toISOString() };
  if (action === 'dismiss') {
    await admin.from('content_flags').update({ status: 'dismissed', ...resolved }).eq('id', id);
    return Response.json({ status: 'dismissed' });
  }

  const sub = flag.research_submissions as unknown as { title: string; user_id: string; status: string } | null;
  const comments = `Unpublished by an administrator after a content report: ${flag.reason}`;
  await admin.from('research_submissions').update({ status: 'revision_requested' }).eq('id', flag.submission_id);
  await admin.from('peer_reviews').insert({ submission_id: flag.submission_id, reviewer_id: auth.viewer.id, decision: 'revision_requested', comments });
  await admin
    .from('content_flags')
    .update({ status: 'actioned', ...resolved })
    .eq('submission_id', flag.submission_id)
    .eq('status', 'open');

  if (sub) {
    await notify(admin, [
      {
        user_id: sub.user_id,
        type: 'status_unpublished',
        title: 'Research unpublished for revision',
        message: `"${sub.title}" has been taken down after a report. ${comments}`,
        submission_id: flag.submission_id,
        link: `/dashboard/submissions/${flag.submission_id}`,
      },
    ]);
  }
  return Response.json({ status: 'actioned' });
}
