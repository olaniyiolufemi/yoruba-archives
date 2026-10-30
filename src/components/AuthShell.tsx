/** Split layout for sign-in and registration: form on the left, engraving on the right. */
export function AuthShell({ title, intro, art, children }: { title: string; intro?: string; art: string; children: React.ReactNode }) {
  return (
    <div className="container-page grid gap-12 lg:grid-cols-2">
      <div className="max-w-md space-y-8 pt-6">
        <div>
          <h1 className="page-title">{title}</h1>
          {intro && <p className="mt-3 text-sm text-muted">{intro}</p>}
        </div>
        {children}
      </div>
      <div aria-hidden className="dot-grid relative hidden min-h-[560px] overflow-hidden rounded-[3px] bg-surface lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={art} alt="" className="art-fade-down absolute bottom-0 left-1/2 h-[92%] w-auto -translate-x-1/2 mix-blend-multiply" />
      </div>
    </div>
  );
}
