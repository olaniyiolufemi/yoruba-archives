'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton({ demo }: { demo?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="hover:text-ink"
      onClick={async () => {
        if (demo) await fetch('/api/demo/logout', { method: 'POST' });
        else await createClient().auth.signOut();
        router.push('/');
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
