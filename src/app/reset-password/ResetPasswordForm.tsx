'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const password = String(form.get('password'));
        if (password.length < 8) return setError('Use at least 8 characters.');
        if (password !== form.get('confirm')) return setError('The two passwords do not match.');
        setBusy(true);
        setError(undefined);
        const { error } = await createClient().auth.updateUser({ password });
        setBusy(false);
        if (error) {
          return setError(
            error.code === 'same_password'
              ? 'Choose a password you have not used for this account.'
              : error.code === 'weak_password'
                ? 'That password is too weak. Try a longer one with a mix of letters and numbers.'
                : 'Could not update your password. Request a new reset link and try again.',
          );
        }
        router.push('/');
        router.refresh();
      }}
    >
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="input" />
        <p className="hint">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm new password</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} className="input" />
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
    </form>
  );
}
