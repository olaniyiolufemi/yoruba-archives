import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { isDemoMode } from '@/lib/demo-data';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      intro="Enter the email you registered with. We will send a link to that inbox, and only someone who can open it can choose a new password."
      art="/art/opon-ifa.svg"
    >
      {isDemoMode() ? (
        <p className="card text-sm" role="status">Password reset is not available in demo mode. Create a new demo account instead.</p>
      ) : (
        <ForgotPasswordForm />
      )}
      <p className="text-sm text-muted">
        Remembered it? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
