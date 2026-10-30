import type { NextRequest } from 'next/server';
import { authorize, jsonError, readJson } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid, parseCategory } from '@/lib/validation';

export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/admin/categories/[id]'>) {
  const auth = await authorize(['admin']);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'Category not found.');
  const parsed = parseCategory(await readJson(request));
  if (!parsed.ok) return jsonError(400, parsed.error);

  const { error } = await createAdminClient().from('categories').update(parsed.value).eq('id', id);
  if (error) return jsonError(error.code === '23505' ? 409 : 500, error.code === '23505' ? 'That category already exists.' : 'Could not update the category.');
  return Response.json({ id });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/admin/categories/[id]'>) {
  const auth = await authorize(['admin']);
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'Category not found.');

  const { error } = await createAdminClient().from('categories').delete().eq('id', id);
  if (error?.code === '23503') return jsonError(409, 'This category still has submissions. Move them first.');
  if (error) return jsonError(500, 'Could not delete the category.');
  return Response.json({ deleted: id });
}
