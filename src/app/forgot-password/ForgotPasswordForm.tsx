'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ForgotPasswordForm() {
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // The same message shows whether or not the email has an account, so the form
  // cannot be used to find out who is registered.
  if (sent) {
    return (
      <p className="card text-sm" role="status">
        If an account exists for that email, a reset link is on its way. It works once and expires within an hour.
      </p>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError(undefined);
        const { error } = await createClient().auth.resetPasswordForEmail(String(form.get('email')), {
          redirectTo: `${location.origin}/auth/confirm?next=/reset-password`,
        });
        setBusy(false);
        if (error && (error.name === 'AuthRetryableFetchError' || /fetch/i.test(error.message))) {
          return setError('Could not reach the account service. Check your connection and try again.');
        }
        if (error?.status === 429) return setError('Too many reset requests. Please wait a few minutes and try again.');
        setSent(true);
      }}
    >
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
    </form>
  );
}
