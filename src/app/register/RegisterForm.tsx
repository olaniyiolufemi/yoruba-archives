'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from '@/lib/fetch-json';
import { createClient } from '@/lib/supabase/client';

export function RegisterForm({ demo }: { demo?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [sentTo, setSentTo] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (sentTo) {
    return (
      <p className="card text-sm" role="status">
        Check <strong>{sentTo}</strong> for a confirmation link, then sign in.
      </p>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const email = String(form.get('email'));
        setBusy(true);
        setError(undefined);
        if (demo) {
          const res = await sendJson('/api/demo/register', 'POST', Object.fromEntries(form));
          setBusy(false);
          if (!res.ok) return setError(res.error);
          router.push(form.get('role') === 'public' ? '/search' : form.get('role') === 'researcher' ? '/dashboard' : form.get('role') === 'admin' ? '/admin' : '/review');
          router.refresh();
          return;
        }
        const { data, error } = await createClient().auth.signUp({
          email,
          password: String(form.get('password')),
          options: {
            emailRedirectTo: `${location.origin}/auth/confirm`,
            data: {
              full_name: String(form.get('full_name')),
              institution: String(form.get('institution') ?? ''),
              role: String(form.get('role')),
            },
          },
        });
        setBusy(false);
        if (error) {
          return setError(
            error.name === 'AuthRetryableFetchError' || /fetch/i.test(error.message)
              ? 'Could not reach the account service. Check your connection and try again.'
              : error.code === 'user_already_exists' || error.code === 'email_exists'
                ? 'An account with this email already exists. Sign in instead.'
                : error.code === 'weak_password'
                  ? 'That password is too weak. Use at least 10 characters, with letters and numbers.'
                  : error.code === 'over_email_send_rate_limit' || error.status === 429
                    ? 'Too many attempts. Please wait a few minutes and try again.'
                    : error.code === 'email_address_invalid' || error.code === 'validation_failed'
                      ? 'Check your email address and try again.'
                      : 'Could not create your account. Please try again.',
          );
        }
        if (data.session) {
          router.push('/dashboard');
          router.refresh();
        } else {
          setSentTo(email);
        }
      }}
    >
      <div>
        <label htmlFor="full_name" className="label">Full name</label>
        <input id="full_name" name="full_name" autoComplete="name" required maxLength={120} className="input" />
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      <div>
        <label htmlFor="institution" className="label">Institution or affiliation <span className="font-normal text-muted">(optional)</span></label>
        <input id="institution" name="institution" maxLength={200} className="input" placeholder="e.g. University of Ibadan, or independent" />
      </div>
      <fieldset>
        <legend className="label">I want to</legend>
        <div className="space-y-2 text-sm">
          <label className="flex items-start gap-2">
            <input type="radio" name="role" value="researcher" defaultChecked className="mt-1" />
            <span><strong>Contribute research</strong>: upload work for review</span>
          </label>
          <label className="flex items-start gap-2">
            <input type="radio" name="role" value="public" className="mt-1" />
            <span><strong>Read and follow</strong>: browse and report problems</span>
          </label>
          {demo && (
            <>
              <label className="flex items-start gap-2">
                <input type="radio" name="role" value="reviewer" className="mt-1" />
                <span><strong>Review research</strong> (preview only)</span>
              </label>
              <label className="flex items-start gap-2">
                <input type="radio" name="role" value="admin" className="mt-1" />
                <span><strong>Administer the archive</strong> (preview only)</span>
              </label>
            </>
          )}
        </div>
      </fieldset>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className="input" />
        <p className="hint">At least 10 characters, with letters and numbers.</p>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
  );
}
