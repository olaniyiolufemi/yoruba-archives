'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from '@/lib/fetch-json';

export function WithdrawButton({ id, label = 'Withdraw', redirectTo = '/dashboard' }: { id: string; label?: string; redirectTo?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  return (
    <>
      <button
        type="button"
        className="btn-danger"
        onClick={async () => {
          if (!confirm('Delete this submission and its file? This cannot be undone.')) return;
          const res = await sendJson(`/api/submissions/${id}`, 'DELETE');
          if (!res.ok) return setError(res.error);
          router.push(redirectTo);
          router.refresh();
        }}
      >
        {label}
      </button>
      {error && <p className="error-text" role="alert">{error}</p>}
    </>
  );
}
