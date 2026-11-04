import type { Metadata } from 'next';
import { AuthShell } from '@/components/AuthShell';
import { requireViewer } from '@/lib/auth';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = { title: 'Choose a new password' };

// Reached from the emailed reset link: /auth/confirm verifies the one-time token
// and signs the person in, so only the inbox owner gets here.
export default async function ResetPasswordPage() {
  const viewer = await requireViewer();
  return (
    <AuthShell title="Choose a new password" intro={`Signed in as ${viewer.email}.`} art="/art/opon-ifa.svg">
      <ResetPasswordForm />
    </AuthShell>
  );
}
