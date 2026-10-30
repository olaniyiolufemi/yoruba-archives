/** Shows the research file inline: PDFs in the browser's viewer, images as-is. */
export function FilePreview({ id, fileName, fileType }: { id: string; fileName: string; fileType: string }) {
  const src = `/api/files/${id}`;
  if (fileType === 'application/pdf') {
    return (
      <div className="overflow-hidden rounded-[3px] bg-surface">
        <iframe src={`${src}#view=FitH`} title={fileName} className="block h-[80vh] min-h-[520px] w-full" />
        <p className="px-4 py-3 text-xs text-muted">
          PDF not showing?{' '}
          <a href={src} target="_blank" rel="noopener" className="underline">Open it in a new tab</a>.
        </p>
      </div>
    );
  }
  return (
    <a href={src} target="_blank" rel="noopener" className="block overflow-hidden rounded-[3px] bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={fileName} className="mx-auto block max-h-[80vh] w-auto" />
    </a>
  );
}
