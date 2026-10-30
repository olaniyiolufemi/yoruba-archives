export function FileLinks({ id, fileName, fileType }: { id: string; fileName: string; fileType: string }) {
  const kind = fileType === 'application/pdf' ? 'PDF' : 'JPEG';
  return (
    <section className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs text-muted">{kind} file</p>
        <p className="truncate text-sm font-medium">{fileName}</p>
      </div>
      <div className="flex gap-2">
        <a href={`/api/files/${id}`} target="_blank" rel="noopener" className="btn-secondary">View</a>
        <a href={`/api/files/${id}?download=1`} className="btn-primary">Download</a>
      </div>
    </section>
  );
}
