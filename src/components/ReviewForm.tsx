'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CHECKLIST, DECISIONS, DECISION_LABELS, type ChecklistKey, type Decision } from '@/lib/constants';
import { sendJson } from '@/lib/fetch-json';

// FR4 with the Section 3.4 checklist. Approval unlocks only when every check passes.
export function ReviewForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [checks, setChecks] = useState<Record<ChecklistKey, boolean>>({
    authorship_check: false,
    source_check: false,
    cultural_relevance_check: false,
    sensitivity_check: false,
  });
  const [decision, setDecision] = useState<Decision>('verified');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const allPass = Object.values(checks).every(Boolean);
  const effective: Decision = decision === 'verified' && !allPass ? 'revision_requested' : decision;
  const needsComments = effective !== 'verified';

  return (
    <form
      className="card space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(undefined);
        const res = await sendJson(`/api/submissions/${submissionId}/review`, 'POST', { decision: effective, comments, ...checks });
        setBusy(false);
        if (!res.ok) return setError(res.error);
        router.push('/review');
        router.refresh();
      }}
    >
      <h2 className="display text-2xl">Your decision</h2>
      <fieldset className="space-y-3">
        <legend className="label">Checklist</legend>
        {CHECKLIST.map((item) => (
          <label key={item.key} className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={checks[item.key]}
              onChange={(e) => setChecks((c) => ({ ...c, [item.key]: e.target.checked }))}
            />
            <span>
              <span className="font-medium">{item.label}</span>
              <span className="block text-xs text-muted">{item.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="label">Decision</legend>
        {DECISIONS.map((d) => (
          <label key={d} className={`flex items-center gap-2 text-sm ${d === 'verified' && !allPass ? 'text-soft' : ''}`}>
            <input
              type="radio"
              name="decision"
              value={d}
              checked={effective === d}
              disabled={d === 'verified' && !allPass}
              onChange={() => setDecision(d)}
            />
            {DECISION_LABELS[d]}
            {d === 'verified' && !allPass && <span className="text-xs">(tick every check first)</span>}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor="comments" className="label">
          Comments for the researcher {needsComments ? '(required)' : '(optional)'}
        </label>
        <textarea
          id="comments"
          rows={5}
          className="input"
          required={needsComments}
          maxLength={5000}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder={needsComments ? 'Explain what is missing or what to change.' : 'Optional note to the researcher.'}
        />
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy ? 'Saving…' : `Confirm: ${DECISION_LABELS[effective]}`}
      </button>
    </form>
  );
}
