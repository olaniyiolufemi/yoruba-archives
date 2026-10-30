'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ROLES, type Role } from '@/lib/constants';
import { sendJson } from '@/lib/fetch-json';

export function RoleSelect({ userId, role, disabled }: { userId: string; role: Role; disabled?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [message, setMessage] = useState<string>();

  return (
    <div>
      <label className="sr-only" htmlFor={`role-${userId}`}>Role</label>
      <select
        id={`role-${userId}`}
        className="input min-h-9 py-1 capitalize"
        value={value}
        disabled={disabled}
        onChange={async (e) => {
          const next = e.target.value as Role;
          const previous = value;
          setValue(next);
          setMessage(undefined);
          const res = await sendJson<{ reassigned: number }>(`/api/admin/users/${userId}`, 'PATCH', { role: next });
          if (!res.ok) {
            setValue(previous);
            return setMessage(res.error);
          }
          if (res.data.reassigned) setMessage(`${res.data.reassigned} review(s) reassigned`);
          router.refresh();
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      {message && <p className="mt-1 text-xs text-muted" role="status">{message}</p>}
    </div>
  );
}
