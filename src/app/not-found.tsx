import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-page max-w-xl space-y-4">
      <h1 className="page-title">Not found</h1>
      <p className="text-ink-2">This page does not exist, or the research is not public.</p>
      <Link href="/search" className="btn-secondary">Search the archive</Link>
    </div>
  );
}
