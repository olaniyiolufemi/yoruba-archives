import { authorize, jsonError, readJson } from '@/lib/api';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation';

// Marks one notification, or all of them, as read. RLS limits it to the owner.
export async function POST(request: Request) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  const body = await readJson(request);

  const supabase = await createClient();
  let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', auth.viewer.id);
  if (body.all !== true) {
    if (!isUuid(body.id)) return jsonError(400, 'Missing notification id.');
    query = query.eq('id', body.id);
  }
  const { error } = await query;
  if (error) return jsonError(500, 'Could not update notifications.');
  return Response.json({ ok: true });
}
