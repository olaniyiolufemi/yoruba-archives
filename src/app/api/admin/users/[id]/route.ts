import type { NextRequest } from 'next/server';
import { authorize, jsonError, readJson } from '@/lib/api';
import { notify } from '@/lib/notify';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid, parseRole } from '@/lib/validation';

// FR8: manage users and reviewers by changing roles. When someone stops being a
// reviewer, their pending queue is handed to the next available reviewer.
export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/admin/users/[id]'>) {
  const auth = await authorize(['admin']);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'User not found.');

  const role = parseRole((await readJson(request)).role);
  if (!role) return jsonError(400, 'Choose a valid role.');
  if (id === auth.viewer.id && role !== 'admin') return jsonError(409, 'You cannot remove your own admin role.');

  const admin = createAdminClient();
  const { data: before } = await admin.from('profiles').select('role').eq('id', id).maybeSingle();
  if (!before) return jsonError(404, 'User not found.');

  const { error } = await admin.from('profiles').update({ role }).eq('id', id);
  if (error) return jsonError(500, 'Could not update the role.');

  let reassigned = 0;
  if (before.role === 'reviewer' && role !== 'reviewer') {
    const { data: queue } = await admin
      .from('research_submissions')
      .select('id, title, user_id')
      .eq('assigned_reviewer_id', id)
      .eq('status', 'pending');
    for (const sub of queue ?? []) {
      const { data: next } = await admin.rpc('pick_reviewer', { p_author: sub.user_id });
      await admin.from('research_submissions').update({ assigned_reviewer_id: next ?? null }).eq('id', sub.id);
      if (next) {
        await notify(admin, [
          {
            user_id: next as string,
            type: 'review_assigned',
            title: 'New submission to review',
            message: `You have been assigned "${sub.title}".`,
            submission_id: sub.id,
            link: `/review/${sub.id}`,
          },
        ]);
      }
      reassigned += 1;
    }
  }

  return Response.json({ role, reassigned });
}
