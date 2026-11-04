'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Enrolment = { factorId: string; qr: string; secret: string };

/** `initialFactorId` is the verified authenticator factor, read on the server. */
export function MfaSettings({ initialFactorId }: { initialFactorId: string | null }) {
  const [factorId, setFactorId] = useState(initialFactorId);
  const [enrolment, setEnrolment] = useState<Enrolment>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await createClient().auth.mfa.listFactors();
    setFactorId(data?.totp.find((f) => f.status === 'verified')?.id ?? null);
  };

  if (factorId) {
    return (
      <div className="space-y-3">
        <p className="text-sm"><span className="badge bg-green/30 text-ink">On</span> Your account asks for an authenticator code at sign-in.</p>
        {error && <p className="error-text" role="alert">{error}</p>}
        <button
          type="button"
          className="btn-danger"
          disabled={busy}
          onClick={async () => {
            if (!confirm('Turn off two-step sign-in? Your password alone will be enough to sign in.')) return;
            setBusy(true);
            setError(undefined);
            const { error } = await createClient().auth.mfa.unenroll({ factorId });
            setBusy(false);
            if (error) return setError('Could not turn it off. Sign out, sign in again with your code, and retry.');
            await load();
          }}
        >
          Turn off
        </button>
      </div>
    );
  }

  if (enrolment) {
    return (
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const code = String(new FormData(e.currentTarget).get('code')).replace(/\s/g, '');
          setBusy(true);
          setError(undefined);
          const { error } = await createClient().auth.mfa.challengeAndVerify({ factorId: enrolment.factorId, code });
          setBusy(false);
          if (error) return setError('That code is not right. Check the time on your phone and try again.');
          setEnrolment(undefined);
          await load();
        }}
      >
        <p className="text-sm">1. Scan this QR code with your authenticator app.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={enrolment.qr} alt="QR code for your authenticator app" width={180} height={180} className="rounded-[3px] bg-white p-2" />
        <p className="text-sm text-muted">
          Can&apos;t scan it? Enter this key instead: <code className="break-all font-mono text-ink">{enrolment.secret}</code>
        </p>
        <div>
          <label htmlFor="mfa-code" className="label">2. Enter the 6-digit code it shows</label>
          <input id="mfa-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required className="input max-w-48" />
        </div>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>{busy ? 'Checking…' : 'Turn on'}</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={async () => {
              await createClient().auth.mfa.unenroll({ factorId: enrolment.factorId });
              setEnrolment(undefined);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      {error && <p className="error-text" role="alert">{error}</p>}
      <button
        type="button"
        className="btn-primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(undefined);
          const supabase = createClient();
          // Clear any half-finished setup first, so a fresh QR code can be issued.
          const { data: factors } = await supabase.auth.mfa.listFactors();
          for (const f of factors?.all ?? []) {
            if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
          const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
          setBusy(false);
          if (error || !data) return setError('Could not start setup. Please try again.');
          setEnrolment({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
        }}
      >
        Set up an authenticator app
      </button>
    </div>
  );
}
