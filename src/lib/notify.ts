import 'server-only';
import { after } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail, siteUrl } from './email';

export type NotificationInput = {
  user_id: string;
  type: string;
  title: string;
  message: string;
  submission_id?: string | null;
  /** Path inside the site the email should link to. */
  link?: string;
};

/**
 * Writes dashboard notifications and emails the same people (FR5). Emails are
 * sent after the response so a slow provider never delays the user.
 */
export async function notify(admin: SupabaseClient, items: NotificationInput[]) {
  if (items.length === 0) return;

  const { error } = await admin.from('notifications').insert(
    items.map(({ user_id, type, title, message, submission_id }) => ({
      user_id,
      type,
      title,
      message,
      submission_id: submission_id ?? null,
    })),
  );
  if (error) console.error('[notify] insert failed', error.message);

  after(async () => {
    const ids = [...new Set(items.map((i) => i.user_id))];
    const { data: people } = await admin.from('profiles').select('id, email').in('id', ids);
    const emails = new Map((people ?? []).map((p) => [p.id as string, p.email as string]));
    await Promise.allSettled(
      items
        .filter((i) => emails.get(i.user_id))
        .map((i) =>
          sendEmail({
            to: emails.get(i.user_id)!,
            subject: `Yoruba Archives: ${i.title}`,
            text: i.message,
            link: i.link ? siteUrl(i.link) : undefined,
          }),
        ),
    );
  });
}

/** Admin ids, used when there is no reviewer to assign a submission to. */
export async function adminIds(admin: SupabaseClient): Promise<string[]> {
  const { data } = await admin.from('profiles').select('id').eq('role', 'admin');
  return (data ?? []).map((p) => p.id as string);
}
