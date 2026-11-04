'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Role } from '@/lib/constants';
import { sendJson } from '@/lib/fetch-json';
import { formatDateTime } from '@/lib/format';
import type { Notification } from '@/lib/types';

function hrefFor(n: Notification, role: Role) {
  if (n.type === 'security_alert') return role === 'admin' ? '/admin/security' : null;
  if (!n.submission_id) return null;
  if (n.type.startsWith('review_')) return `/review/${n.submission_id}`;
  if (n.type === 'content_flagged' && role === 'admin') return '/admin/flags';
  return `/dashboard/submissions/${n.submission_id}`;
}

export function NotificationList({ items, role }: { items: Notification[]; role: Role }) {
  const router = useRouter();
  const unread = items.filter((n) => !n.is_read).length;

  if (items.length === 0) return <p className="card text-sm text-muted">You have no notifications.</p>;

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <button
          type="button"
          className="btn-secondary"
          onClick={async () => {
            await sendJson('/api/notifications/read', 'POST', { all: true });
            router.refresh();
          }}
        >
          Mark all {unread} as read
        </button>
      )}
      <ul className="divide-y divide-hairline rounded-[3px] border border-hairline">
        {items.map((n) => {
          const href = hrefFor(n, role);
          return (
            <li key={n.id} className={`p-4 ${n.is_read ? '' : 'bg-surface'}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {!n.is_read && <span className="mr-2 inline-block size-2 rounded-full bg-ink" aria-label="Unread" />}
                  {n.title}
                </p>
                <p className="text-xs text-muted">{formatDateTime(n.created_at)}</p>
              </div>
              <p className="mt-1 text-sm text-ink-2">{n.message}</p>
              <div className="mt-2 flex gap-4 text-sm">
                {href && (
                  <Link
                    href={href}
                    className="underline"
                    onClick={() => {
                      if (!n.is_read) void sendJson('/api/notifications/read', 'POST', { id: n.id });
                    }}
                  >
                    Open
                  </Link>
                )}
                {!n.is_read && (
                  <button
                    type="button"
                    className="text-muted underline"
                    onClick={async () => {
                      await sendJson('/api/notifications/read', 'POST', { id: n.id });
                      router.refresh();
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
