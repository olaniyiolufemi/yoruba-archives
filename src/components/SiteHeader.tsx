import Image from 'next/image';
import Link from 'next/link';
import { getViewer } from '@/lib/auth';
import { isDemoMode } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from './SignOutButton';

export async function SiteHeader() {
  const viewer = await getViewer();
  let unread = 0;
  if (viewer && !isDemoMode()) {
    const supabase = await createClient();
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', viewer.id)
      .eq('is_read', false);
    unread = count ?? 0;
  }

  const links: { href: string; label: string }[] = [{ href: '/search', label: 'Archive' }];
  if (viewer && viewer.role !== 'public') links.push({ href: '/dashboard', label: 'My research' });
  if (viewer && (viewer.role === 'reviewer' || viewer.role === 'admin')) links.push({ href: '/review', label: 'Review' });
  if (viewer?.role === 'admin') links.push({ href: '/admin', label: 'Admin' });

  return (
    <header className="relative z-30">
      <div className="container-page flex min-h-[72px] flex-wrap items-center justify-between gap-x-8 gap-y-3 py-3">
        <Link href="/" aria-label="Yorùbá Archives, home" className="shrink-0">
          <Image src="/logo.svg" alt="Yorùbá Archives" width={136} height={56} priority className="h-11 w-auto" />
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
          {viewer ? (
            <>
              <Link href="/notifications" className="hover:text-ink">
                Notifications
                {unread > 0 && (
                  <span className="ml-1.5 inline-block min-w-5 rounded-[3px] bg-blue px-1 text-center text-[11px] text-white" aria-label={`${unread} unread`}>
                    {unread}
                  </span>
                )}
              </Link>
              <SignOutButton demo={isDemoMode()} />
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-ink">Sign in</Link>
              <Link href="/register" className="btn-primary">Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
