import type { Metadata } from 'next';
import { SubmissionForm } from '@/components/SubmissionForm';
import { requireViewer } from '@/lib/auth';
import { getCategories } from '@/lib/queries';

export const metadata: Metadata = { title: 'Submit research' };

export default async function SubmitPage() {
  const viewer = await requireViewer(['researcher', 'reviewer', 'admin']);
  const categories = await getCategories();

  return (
    <div className="container-page max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">Submit research</h1>
        <p className="mt-1 text-sm text-muted">
          A reviewer checks authorship, sources, relevance to Yoruba culture and cultural sensitivity. You keep ownership of
          your work, and you will be emailed when the review is done.
        </p>
      </div>
      <SubmissionForm userId={viewer.id} categories={categories} />
    </div>
  );
}
