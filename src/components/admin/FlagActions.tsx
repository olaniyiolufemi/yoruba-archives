'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from '@/lib/fetch-json';

export function FlagActions({ flagId }: { flagId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const act = async (action: 'dismiss' | 'unpublish') => {
    if (action === 'unpublish' && !confirm('Unpublish this item and return it to the author for revision?')) return;
    setBusy(true);
    const res = await sendJson(`/api/admin/flags/${flagId}`, 'PATCH', { action });
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className="btn-secondary min-h-9" disabled={busy} onClick={() => act('dismiss')}>Dismiss</button>
      <button type="button" className="btn-danger min-h-9" disabled={busy} onClick={() => act('unpublish')}>Unpublish for revision</button>
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}
