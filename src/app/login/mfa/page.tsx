import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthShell } from '@/components/AuthShell';
import { getViewer, isMfaPending } from '@/lib/auth';
import { safeNextPath } from '@/lib/validation';
import { MfaChallengeForm } from './MfaChallengeForm';

export const metadata: Metadata = { title: 'Two-step sign-in' };

// Second step of sign-in for accounts with an authenticator app turned on.
export default async function MfaPage({ searchParams }: PageProps<'/login/mfa'>) {
  const next = safeNextPath((await searchParams).next);
  if (await getViewer()) redirect(next);
  if (!(await isMfaPending())) redirect('/login');
  return (
    <AuthShell title="Enter your code" intro="Open your authenticator app and enter the 6-digit code for Yorùbá Archives." art="/art/ife-head.svg">
      <MfaChallengeForm next={next} />
    </AuthShell>
  );
}
