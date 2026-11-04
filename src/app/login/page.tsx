import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { isDemoMode } from '@/lib/demo-data';
import { safeNextPath } from '@/lib/validation';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const error = typeof params.error === 'string' ? params.error : undefined;
  return (
    <AuthShell title="Sign in" art="/art/ife-head.svg">
      <LoginForm demo={isDemoMode()} next={next} initialError={error} />
      <p className="text-sm text-muted">
        <Link href="/forgot-password" className="underline">Forgot your password?</Link>
      </p>
      <p className="text-sm text-muted">
        New here? <Link href="/register" className="underline">Create an account</Link>
      </p>
    </AuthShell>
  );
}
