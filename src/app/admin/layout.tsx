import Link from 'next/link';
import { requireViewer } from '@/lib/auth';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/submissions', label: 'Submissions' },
  { href: '/admin/users', label: 'Users & reviewers' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/flags', label: 'Flagged content' },
];

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  await requireViewer(['admin']);
  return (
    <div className="container-page space-y-6">
      <h1 className="page-title">Administration</h1>
      <nav aria-label="Admin" className="flex flex-wrap gap-2 border-b border-hairline pb-3 text-sm">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-md px-3 py-1.5 text-ink-2 hover:bg-surface">
            {t.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
