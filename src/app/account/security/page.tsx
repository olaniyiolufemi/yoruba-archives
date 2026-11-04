import type { Metadata } from 'next';
import Link from 'next/link';
import { requireViewer } from '@/lib/auth';
import { isDemoMode } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/server';
import { MfaSettings } from './MfaSettings';

export const metadata: Metadata = { title: 'Account security' };

export default async function SecurityPage() {
  const viewer = await requireViewer();
  const demo = isDemoMode();
  const factors = demo ? null : (await (await createClient()).auth.mfa.listFactors()).data;
  const factorId = factors?.totp.find((f) => f.status === 'verified')?.id ?? null;
  return (
    <div className="container-page max-w-2xl space-y-8">
      <div>
        <h1 className="page-title">Account security</h1>
        <p className="mt-3 text-sm text-muted">Signed in as {viewer.email}.</p>
      </div>
      <section className="card space-y-4">
        <h2 className="text-lg">Two-step sign-in</h2>
        <p className="text-sm text-muted">
          Ask for a 6-digit code from an authenticator app (such as Google Authenticator, 1Password or Authy) after your password. Someone who learns your password still cannot get in.
        </p>
        {demo ? <p className="text-sm">Two-step sign-in is not available in demo mode.</p> : <MfaSettings initialFactorId={factorId} />}
      </section>
      <section className="card space-y-2">
        <h2 className="text-lg">Password</h2>
        <p className="text-sm text-muted">
          To change your password, <Link href="/forgot-password" className="underline">request a reset link</Link>. It is sent to your email so only you can use it.
        </p>
      </section>
    </div>
  );
}
