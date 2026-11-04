'use client';

import Link from 'next/link';

// Shown when a page throws. It never displays the error itself: the reference
// code matches the full error in the server logs, so it can be traced there.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-page max-w-xl space-y-4">
      <h1 className="page-title">Something went wrong</h1>
      <p className="text-ink-2">This page could not be loaded. Please try again in a moment.</p>
      {error.digest && <p className="text-xs text-soft">Reference: {error.digest}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={reset}>Try again</button>
        <Link href="/" className="btn-secondary">Go to the home page</Link>
      </div>
    </div>
  );
}
