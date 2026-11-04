'use client';

import './globals.css';

// Last resort when the root layout itself fails. Same rule as error.tsx: a
// generic message and a reference code, never the error details.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center">
        <div className="container-page max-w-xl space-y-4">
          <h1 className="page-title">Something went wrong</h1>
          <p className="text-ink-2">Yorùbá Archives is having trouble right now. Please try again in a moment.</p>
          {error.digest && <p className="text-xs text-soft">Reference: {error.digest}</p>}
          <button type="button" className="btn-primary" onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  );
}
