import Image from 'next/image';
import Link from 'next/link';
import { getViewer } from '@/lib/auth';

export async function SiteFooter() {
  const viewer = await getViewer();

  const explore: { href: string; label: string }[] = [{ href: '/search', label: 'Browse the archive' }];
  if (viewer && viewer.role !== 'public') explore.push({ href: '/dashboard/submit', label: 'Contribute research' });
  if (viewer && (viewer.role === 'reviewer' || viewer.role === 'admin')) explore.push({ href: '/review', label: 'Review queue' });

  const account: { href: string; label: string }[] = viewer
    ? [
        ...(viewer.role !== 'public' ? [{ href: '/dashboard', label: 'My research' }] : []),
        { href: '/notifications', label: 'Notifications' },
        { href: '/account/security', label: 'Account security' },
      ]
    : [
        { href: '/login', label: 'Sign in' },
        { href: '/register', label: 'Create account' },
      ];

  return (
    <footer className="relative z-10 border-t border-hairline bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-[1fr_auto_auto] sm:gap-16">
        <div className="max-w-sm space-y-4">
          <Link href="/" aria-label="Yorùbá Archives, home" className="inline-block">
            <Image src="/logo.svg" alt="Yorùbá Archives" width={136} height={56} className="h-10 w-auto" />
          </Link>
          <p className="text-sm text-muted">
            A community-driven archive where researchers contribute Yorùbá cultural research and reviewers verify it.
          </p>
        </div>
        <FooterLinks title="Explore" links={explore} />
        <FooterLinks title="Account" links={account} />
      </div>
      <div className="container-page border-t border-hairline py-6 text-xs text-soft">
        © {new Date().getFullYear()} Yorùbá Archives
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="space-y-3">
      <p className="eyebrow">{title}</p>
      <ul className="space-y-2 text-sm text-muted">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
