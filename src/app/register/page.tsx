import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { isDemoMode } from '@/lib/demo-data';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = { title: 'Create account' };

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create an account"
      intro="Anyone can search without an account. Create one to contribute research or report a problem."
      art="/art/ade.svg"
    >
      <RegisterForm demo={isDemoMode()} />
      <p className="text-sm text-muted">
        Already registered? <Link href="/login" className="underline">Sign in</Link>
      </p>
    </AuthShell>
  );
}
