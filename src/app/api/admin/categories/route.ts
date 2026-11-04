import { authorize, jsonError, readJson } from '@/lib/api';
import { logSecurityEvent } from '@/lib/audit';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCategory } from '@/lib/validation';

// FR8: manage categories.
export async function POST(request: Request) {
  const auth = await authorize(['admin']);
  if (auth.error) return auth.error;
  const parsed = parseCategory(await readJson(request));
  if (!parsed.ok) return jsonError(400, parsed.error);

  const { data, error } = await createAdminClient().from('categories').insert(parsed.value).select('id').single();
  if (error) return jsonError(error.code === '23505' ? 409 : 500, error.code === '23505' ? 'That category already exists.' : 'Could not create the category.');
  await logSecurityEvent('category_changed', { userId: auth.viewer.id, details: { action: 'create', category_id: data.id, name: parsed.value.name } });
  return Response.json(data, { status: 201 });
}
