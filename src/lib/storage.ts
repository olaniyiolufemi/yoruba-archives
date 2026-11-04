import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { STORAGE_BUCKET, type AllowedFileType } from './constants';
import { matchesFileSignature } from './validation';

/**
 * Checks an uploaded file really is the type it claims, from its first bytes.
 * The upload's Content-Type comes from the browser, so it is not trusted alone.
 */
export async function checkUploadedFile(
  admin: SupabaseClient,
  path: string,
  type: AllowedFileType,
): Promise<'ok' | 'missing' | 'mismatch'> {
  const { data } = await admin.storage.from(STORAGE_BUCKET).createSignedUrl(path, 60);
  if (!data) return 'missing';
  const res = await fetch(data.signedUrl, { headers: { Range: 'bytes=0-15' } });
  if (!res.ok || !res.body) return 'missing';

  // Read only the first chunk, in case the storage server ignores the Range header.
  const reader = res.body.getReader();
  const { value } = await reader.read();
  await reader.cancel();
  return matchesFileSignature(value ?? new Uint8Array(), type) ? 'ok' : 'mismatch';
}
