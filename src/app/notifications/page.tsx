import type { Metadata } from 'next';
import { NotificationList } from '@/components/NotificationList';
import { requireViewer } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Notification } from '@/lib/types';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, message, submission_id, is_read, created_at')
    .eq('user_id', viewer.id)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="container-page max-w-3xl space-y-6">
      <h1 className="page-title">Notifications</h1>
      <NotificationList items={(data ?? []) as Notification[]} role={viewer.role} />
    </div>
  );
}
