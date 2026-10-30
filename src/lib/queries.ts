import 'server-only';
import { DEMO_CATEGORIES, isDemoMode } from './demo-data';
import { createClient } from './supabase/server';
import type { Category, PeerReview, Submission } from './types';

export type SubmissionDetail = Submission & {
  categories: { name: string } | null;
  author: { full_name: string; institution: string | null } | null;
  reviewer: { full_name: string } | null;
};

/** A submission the visitor is allowed to see (RLS), with its review history. */
export async function getSubmissionDetail(id: string) {
  const supabase = await createClient();
  const [{ data: sub }, { data: reviews }] = await Promise.all([
    supabase
      .from('research_submissions')
      .select(
        '*, categories(name), author:profiles!research_submissions_user_id_fkey(full_name, institution), reviewer:profiles!research_submissions_assigned_reviewer_id_fkey(full_name)',
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('peer_reviews')
      .select('*, reviewer:profiles!peer_reviews_reviewer_id_fkey(full_name)')
      .eq('submission_id', id)
      .order('reviewed_at', { ascending: false }),
  ]);
  return {
    submission: sub as SubmissionDetail | null,
    reviews: (reviews ?? []) as (PeerReview & { reviewer: { full_name: string } | null })[],
  };
}

export async function getCategories(): Promise<Category[]> {
  if (isDemoMode()) return DEMO_CATEGORIES;
  const supabase = await createClient();
  const { data } = await supabase.from('categories').select('id, name, description').order('name');
  return (data ?? []) as Category[];
}
