'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from '@/lib/fetch-json';
import { createClient } from '@/lib/supabase/client';

export function LoginForm({ next, initialError, demo }: { next: string; initialError?: string; demo?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(initialError);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError(undefined);
        if (demo) {
          const res = await sendJson('/api/demo/login', 'POST', { email: form.get('email'), password: form.get('password') });
          if (!res.ok) {
            setBusy(false);
            return setError(res.error);
          }
          router.push(next);
          router.refresh();
          return;
        }
        const { error } = await createClient().auth.signInWithPassword({
          email: String(form.get('email')),
          password: String(form.get('password')),
        });
        if (error) {
          setBusy(false);
          setError(
            error.message === 'Email not confirmed'
              ? 'Please confirm your email first. Check your inbox.'
              : error.name === 'AuthRetryableFetchError' || /fetch/i.test(error.message)
                ? 'Could not reach the account service. Check your connection and try again.'
                : 'Incorrect email or password.',
          );
          return;
        }
        router.push(next);
        router.refresh();
      }}
    >
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  );
}
