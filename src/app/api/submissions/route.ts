import { authorize, jsonError, readJson } from '@/lib/api';
import { STORAGE_BUCKET } from '@/lib/constants';
import { adminIds, notify } from '@/lib/notify';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseFileRef, parseSubmissionMetadata } from '@/lib/validation';

// FR1–FR3: a contributor submits metadata for a file they already uploaded to
// their own storage folder; the submission is queued for a designated reviewer.
export async function POST(request: Request) {
  const auth = await authorize(['researcher', 'reviewer', 'admin']);
  if (auth.error) return auth.error;
  const { viewer } = auth;

  const body = await readJson(request);
  const meta = parseSubmissionMetadata(body);
  if (!meta.ok) return jsonError(400, meta.error);
  const file = parseFileRef(body, viewer.id);
  if (!file.ok) return jsonError(400, file.error);

  const admin = createAdminClient();
  const { data: category } = await admin.from('categories').select('id').eq('id', meta.value.category_id).maybeSingle();
  if (!category) return jsonError(400, 'That category no longer exists.');

  const { data: uploaded } = await admin.storage.from(STORAGE_BUCKET).exists(file.value.file_path);
  if (!uploaded) return jsonError(400, 'The file upload did not finish. Please attach it again.');

  const { data: reviewerId } = await admin.rpc('pick_reviewer', { p_author: viewer.id });

  const { data: submission, error } = await admin
    .from('research_submissions')
    .insert({ ...meta.value, ...file.value, user_id: viewer.id, assigned_reviewer_id: reviewerId ?? null })
    .select('id, title')
    .single();
  if (error || !submission) {
    console.error('[submissions] insert failed', error?.message);
    return jsonError(500, 'Could not save your submission. Please try again.');
  }

  const reviewers = reviewerId ? [reviewerId as string] : await adminIds(admin);
  await notify(admin, [
    {
      user_id: viewer.id,
      type: 'submission_received',
      title: 'Submission received',
      message: `"${submission.title}" is in the review queue. You will be notified when a reviewer decides.`,
      submission_id: submission.id,
      link: `/dashboard/submissions/${submission.id}`,
    },
    ...reviewers.map((id) => ({
      user_id: id,
      type: reviewerId ? 'review_assigned' : 'review_unassigned',
      title: reviewerId ? 'New submission to review' : 'Submission needs a reviewer',
      message: reviewerId
        ? `You have been assigned "${submission.title}".`
        : `"${submission.title}" was submitted but no reviewer is available. Assign one from the admin panel.`,
      submission_id: submission.id,
      link: reviewerId ? `/review/${submission.id}` : '/admin/submissions',
    })),
  ]);

  return Response.json({ id: submission.id }, { status: 201 });
}
