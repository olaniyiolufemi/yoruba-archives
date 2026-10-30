import type { NextRequest } from 'next/server';
import { jsonError } from '@/lib/api';
import { STORAGE_BUCKET } from '@/lib/constants';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation';

// Files sit in a private bucket (NFR4). The lookup runs under the visitor's own
// session, so RLS decides access: anyone for verified work, otherwise only the
// author, the assigned reviewer and admins. Access is a 5-minute signed URL.
export async function GET(request: NextRequest, ctx: RouteContext<'/api/files/[id]'>) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'File not found.');

  const supabase = await createClient();
  const { data: sub } = await supabase
    .from('research_submissions')
    .select('file_path, file_name')
    .eq('id', id)
    .maybeSingle();
  if (!sub) return jsonError(404, 'File not found.');

  const download = request.nextUrl.searchParams.has('download') ? sub.file_name : undefined;
  const { data, error } = await createAdminClient()
    .storage.from(STORAGE_BUCKET)
    .createSignedUrl(sub.file_path, 300, download ? { download } : undefined);
  if (error || !data) return jsonError(404, 'File not found.');

  return Response.redirect(data.signedUrl, 302);
}
