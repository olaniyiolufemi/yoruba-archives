import type { NextRequest } from 'next/server';
import { authorize, jsonError, readJson } from '@/lib/api';
import { logSecurityEvent } from '@/lib/audit';
import { STORAGE_BUCKET } from '@/lib/constants';
import { notify } from '@/lib/notify';
import { checkUploadedFile } from '@/lib/storage';
import { createAdminClient } from '@/lib/supabase/admin';
import { isUuid, parseFileRef, parseSubmissionMetadata } from '@/lib/validation';

// Edit Submission use case: the author can edit while the item is pending or
// returned for revision. Saving a returned item resubmits it to the queue.
export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/submissions/[id]'>) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  const { viewer } = auth;
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'Submission not found.');

  const admin = createAdminClient();
  const { data: current } = await admin
    .from('research_submissions')
    .select('id, user_id, status, file_path, assigned_reviewer_id, title')
    .eq('id', id)
    .maybeSingle();
  if (!current) return jsonError(404, 'Submission not found.');
  if (current.user_id !== viewer.id) {
    await logSecurityEvent('access_denied', { userId: viewer.id, details: { action: 'edit', submission_id: id } });
    return jsonError(404, 'Submission not found.');
  }
  if (current.status !== 'pending' && current.status !== 'revision_requested') {
    return jsonError(409, 'Only pending or returned submissions can be edited.');
  }

  const body = await readJson(request);
  const meta = parseSubmissionMetadata(body);
  if (!meta.ok) return jsonError(400, meta.error);

  const update: Record<string, unknown> = { ...meta.value };
  if (body.file_path && body.file_path !== current.file_path) {
    const file = parseFileRef(body, viewer.id);
    if (!file.ok) return jsonError(400, file.error);
    const upload = await checkUploadedFile(admin, file.value.file_path, file.value.file_type);
    if (upload === 'missing') return jsonError(400, 'The file upload did not finish. Please attach it again.');
    if (upload === 'mismatch') {
      await logSecurityEvent('upload_rejected', { userId: viewer.id, details: { file_type: file.value.file_type, submission_id: id } });
      await admin.storage.from(STORAGE_BUCKET).remove([file.value.file_path]);
      return jsonError(400, 'That file is not a valid PDF or JPEG. Please attach the original file.');
    }
    Object.assign(update, file.value);
  }

  const resubmitting = current.status === 'revision_requested';
  let reviewerId = current.assigned_reviewer_id as string | null;
  if (resubmitting) {
    update.status = 'pending';
    if (!reviewerId) {
      const { data } = await admin.rpc('pick_reviewer', { p_author: viewer.id });
      reviewerId = (data as string | null) ?? null;
      update.assigned_reviewer_id = reviewerId;
    }
  }

  const { error } = await admin
    .from('research_submissions')
    .update(update)
    .eq('id', id)
    .in('status', ['pending', 'revision_requested']);
  if (error) return jsonError(500, 'Could not save your changes.');

  if (update.file_path) await admin.storage.from(STORAGE_BUCKET).remove([current.file_path]);

  if (resubmitting && reviewerId) {
    await notify(admin, [
      {
        user_id: reviewerId,
        type: 'review_resubmitted',
        title: 'Revised submission to review',
        message: `"${meta.value.title}" has been revised and is back in your queue.`,
        submission_id: id,
        link: `/review/${id}`,
      },
    ]);
  }

  return Response.json({ id, status: update.status ?? current.status });
}

// Admins remove any submission (FR8); authors may withdraw work that is not yet verified.
export async function DELETE(_request: NextRequest, ctx: RouteContext<'/api/submissions/[id]'>) {
  const auth = await authorize();
  if (auth.error) return auth.error;
  const { viewer } = auth;
  const { id } = await ctx.params;
  if (!isUuid(id)) return jsonError(404, 'Submission not found.');

  const admin = createAdminClient();
  const { data: current } = await admin
    .from('research_submissions')
    .select('id, user_id, status, file_path')
    .eq('id', id)
    .maybeSingle();
  if (!current) return jsonError(404, 'Submission not found.');

  const isAdmin = viewer.role === 'admin';
  const isOwner = current.user_id === viewer.id && current.status !== 'verified';
  if (!isAdmin && !isOwner) {
    await logSecurityEvent('access_denied', { userId: viewer.id, details: { action: 'delete', submission_id: id } });
    return jsonError(403, 'You do not have permission to delete this.');
  }

  const { error } = await admin.from('research_submissions').delete().eq('id', id);
  if (error) return jsonError(500, 'Could not delete the submission.');
  await admin.storage.from(STORAGE_BUCKET).remove([current.file_path]);
  await logSecurityEvent('submission_deleted', { userId: viewer.id, details: { submission_id: id, author_id: current.user_id, status: current.status, by_admin: isAdmin && current.user_id !== viewer.id } });
  return Response.json({ deleted: id });
}
