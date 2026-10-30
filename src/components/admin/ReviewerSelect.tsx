'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from '@/lib/fetch-json';

type Option = { id: string; full_name: string; role: string };

export function ReviewerSelect({ submissionId, current, options }: { submissionId: string; current: string | null; options: Option[] }) {
  const router = useRouter();
  const [value, setValue] = useState(current ?? '');
  const [error, setError] = useState<string>();
  return (
    <div>
      <label htmlFor={`rev-${submissionId}`} className="sr-only">Designated reviewer</label>
      <select
        id={`rev-${submissionId}`}
        className="input min-h-9 py-1"
        value={value}
        onChange={async (e) => {
          const next = e.target.value;
          const previous = value;
          setValue(next);
          const res = await sendJson(`/api/admin/submissions/${submissionId}`, 'PATCH', { assigned_reviewer_id: next });
          if (!res.ok) {
            setValue(previous);
            return setError(res.error);
          }
          setError(undefined);
          router.refresh();
        }}
      >
        <option value="" disabled>Assign a reviewer…</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.full_name}
            {o.role === 'admin' ? ' (admin)' : ''}
          </option>
        ))}
      </select>
      {error && <p className="error-text" role="alert">{error}</p>}
    </div>
  );
}
