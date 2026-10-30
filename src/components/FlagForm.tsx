'use client';

import Link from 'next/link';
import { useState } from 'react';
import { sendJson } from '@/lib/fetch-json';

export function FlagForm({ submissionId, signedIn }: { submissionId: string; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [state, setState] = useState<{ busy?: boolean; error?: string; done?: boolean }>({});

  if (state.done) return <p className="text-sm text-muted">Thank you. An administrator will review your report.</p>;
  if (!open) {
    return (
      <button type="button" className="text-sm text-muted underline" onClick={() => setOpen(true)}>
        Report a problem with this item
      </button>
    );
  }
  if (!signedIn) {
    return (
      <p className="text-sm text-muted">
        <Link href="/login" className="underline">Sign in</Link> to report a problem.
      </p>
    );
  }

  return (
    <form
      className="card space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ busy: true });
        const res = await sendJson(`/api/submissions/${submissionId}/flag`, 'POST', { reason });
        setState(res.ok ? { done: true } : { error: res.error });
      }}
    >
      <label htmlFor="flag-reason" className="label">What is wrong with this item?</label>
      <textarea
        id="flag-reason"
        required
        minLength={5}
        maxLength={1000}
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input"
        placeholder="e.g. it reveals restricted knowledge, or it copies someone else's work"
      />
      {state.error && <p className="error-text" role="alert">{state.error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={state.busy}>Send report</button>
        <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
