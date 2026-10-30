import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ReviewHistory } from '@/components/ReviewHistory';
import { SubmissionForm } from '@/components/SubmissionForm';
import { requireViewer } from '@/lib/auth';
import { getSubmissionDetail } from '@/lib/queries';
import { createClient } from '@/lib/supabase/server';
import type { Category } from '@/lib/types';
import { isUuid } from '@/lib/validation';

export const metadata: Metadata = { title: 'Edit submission' };

export default async function EditSubmissionPage({ params }: PageProps<'/dashboard/submissions/[id]/edit'>) {
  const viewer = await requireViewer();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { submission: s, reviews } = await getSubmissionDetail(id);
  if (!s || s.user_id !== viewer.id) notFound();
  if (s.status !== 'pending' && s.status !== 'revision_requested') redirect(`/dashboard/submissions/${id}`);

  const supabase = await createClient();
  const { data: categories } = await supabase.from('categories').select('id, name, description').order('name');
  const resubmit = s.status === 'revision_requested';

  return (
    <div className="container-page max-w-2xl space-y-6">
      <Link href={`/dashboard/submissions/${id}`} className="text-sm text-muted hover:underline">← Back</Link>
      <h1 className="page-title">{resubmit ? 'Revise and resubmit' : 'Edit submission'}</h1>
      {resubmit && reviews[0] && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Latest reviewer comments</h2>
          <ReviewHistory reviews={reviews.slice(0, 1)} />
        </section>
      )}
      <SubmissionForm
        userId={viewer.id}
        categories={(categories ?? []) as Category[]}
        initial={{
          id: s.id,
          title: s.title,
          abstract: s.abstract,
          keywords: s.keywords,
          language: s.language,
          category_id: s.category_id,
          file_name: s.file_name,
          resubmit,
        }}
      />
    </div>
  );
}
