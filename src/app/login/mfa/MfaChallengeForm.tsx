'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function MfaChallengeForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const code = String(new FormData(e.currentTarget).get('code')).replace(/\s/g, '');
        setBusy(true);
        setError(undefined);
        const supabase = createClient();
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const factor = factors?.totp.find((f) => f.status === 'verified');
        if (!factor) {
          setBusy(false);
          return setError('No authenticator app is set up for this account. Sign in again.');
        }
        const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
        if (error) {
          setBusy(false);
          return setError(error.status === 429 ? 'Too many attempts. Wait a minute and try again.' : 'That code is not right. Check your app and try again.');
        }
        router.push(next);
        router.refresh();
      }}
    >
      <div>
        <label htmlFor="code" className="label">6-digit code</label>
        <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus className="input" />
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Checking…' : 'Verify'}</button>
      <button
        type="button"
        className="text-sm text-muted underline"
        onClick={async () => {
          await createClient().auth.signOut();
          router.push('/login');
          router.refresh();
        }}
      >
        Use a different account
      </button>
    </form>
  );
}
