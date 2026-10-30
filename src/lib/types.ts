import type { Language, Role, SubmissionStatus, Decision } from './constants';

export type Profile = {
  id: string;
  full_name: string;
  role: Role;
  institution: string | null;
  created_at: string;
};

export type Category = { id: string; name: string; description: string | null };

export type Submission = {
  id: string;
  user_id: string;
  category_id: string;
  assigned_reviewer_id: string | null;
  title: string;
  abstract: string;
  keywords: string[];
  language: Language;
  file_path: string;
  file_name: string;
  file_type: string;
  status: SubmissionStatus;
  public_link: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PeerReview = {
  id: string;
  submission_id: string;
  reviewer_id: string | null;
  decision: Decision;
  authorship_check: boolean;
  source_check: boolean;
  cultural_relevance_check: boolean;
  sensitivity_check: boolean;
  comments: string | null;
  reviewed_at: string;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  submission_id: string | null;
  is_read: boolean;
  created_at: string;
};

export type SearchRow = {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  language: Language;
  public_link: string;
  verified_at: string;
  category_id: string;
  category_name: string;
  author_name: string;
  total_count: number;
};
