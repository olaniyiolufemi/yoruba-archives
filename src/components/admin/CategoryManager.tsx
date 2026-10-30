'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendJson } from '@/lib/fetch-json';
import type { Category } from '@/lib/types';

export function NewCategoryForm() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  return (
    <form
      className="card grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const res = await sendJson('/api/admin/categories', 'POST', { name: data.get('name'), description: data.get('description') });
        if (!res.ok) return setError(res.error);
        setError(undefined);
        form.reset();
        router.refresh();
      }}
    >
      <div>
        <label htmlFor="new-name" className="label">New category</label>
        <input id="new-name" name="name" required minLength={2} maxLength={80} className="input" />
      </div>
      <div>
        <label htmlFor="new-desc" className="label">Description</label>
        <input id="new-desc" name="description" maxLength={500} className="input" />
      </div>
      <button className="btn-primary">Add</button>
      {error && <p className="error-text sm:col-span-3" role="alert">{error}</p>}
    </form>
  );
}

export function CategoryEditor({ category, count }: { category: Category; count: number }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="card grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const res = await sendJson(`/api/admin/categories/${category.id}`, 'PATCH', {
          name: data.get('name'),
          description: data.get('description'),
        });
        setSaved(res.ok);
        setError(res.ok ? undefined : res.error);
        router.refresh();
      }}
    >
      <div>
        <label htmlFor={`name-${category.id}`} className="label">Name <span className="font-normal text-muted">({count} items)</span></label>
        <input id={`name-${category.id}`} name="name" defaultValue={category.name} required className="input" />
      </div>
      <div>
        <label htmlFor={`desc-${category.id}`} className="label">Description</label>
        <input id={`desc-${category.id}`} name="description" defaultValue={category.description ?? ''} className="input" />
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary">{saved ? 'Saved' : 'Save'}</button>
        <button
          type="button"
          className="btn-danger"
          disabled={count > 0}
          title={count > 0 ? 'Categories with submissions cannot be deleted' : undefined}
          onClick={async () => {
            if (!confirm(`Delete “${category.name}”?`)) return;
            const res = await sendJson(`/api/admin/categories/${category.id}`, 'DELETE');
            if (!res.ok) return setError(res.error);
            router.refresh();
          }}
        >
          Delete
        </button>
      </div>
      {error && <p className="error-text sm:col-span-3" role="alert">{error}</p>}
    </form>
  );
}
