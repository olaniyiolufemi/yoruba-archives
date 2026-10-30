'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LANGUAGES, LANGUAGE_LABELS, STORAGE_BUCKET, type Language } from '@/lib/constants';
import { sendJson } from '@/lib/fetch-json';
import { createClient } from '@/lib/supabase/client';
import type { Category } from '@/lib/types';
import { checkFile } from '@/lib/validation';

type Initial = {
  id: string;
  title: string;
  abstract: string;
  keywords: string[];
  language: Language;
  category_id: string;
  file_name: string;
  resubmit: boolean;
};

/**
 * FR1/FR2 submission form. The file goes straight to the contributor's private
 * storage folder, then the metadata is sent to the API, which queues it for review.
 */
export function SubmissionForm({ userId, categories, initial }: { userId: string; categories: Category[]; initial?: Initial }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<string>();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get('file');
    const hasFile = file instanceof File && file.size > 0;
    setError(undefined);

    if (!initial && !hasFile) return setError('Attach your research as a PDF or JPEG file.');

    const payload: Record<string, unknown> = {
      title: form.get('title'),
      abstract: form.get('abstract'),
      keywords: form.get('keywords'),
      language: form.get('language'),
      category_id: form.get('category_id'),
    };

    if (hasFile) {
      const problem = checkFile(file);
      if (problem) return setError(problem);
      setStatus('Uploading file…');
      const ext = file.type === 'application/pdf' ? 'pdf' : 'jpg';
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await createClient()
        .storage.from(STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) {
        setStatus(undefined);
        return setError(`Upload failed: ${uploadError.message}`);
      }
      Object.assign(payload, { file_path: path, file_name: file.name, file_type: file.type });
    }

    setStatus(initial ? 'Saving…' : 'Submitting…');
    const res = initial
      ? await sendJson(`/api/submissions/${initial.id}`, 'PATCH', payload)
      : await sendJson<{ id: string }>('/api/submissions', 'POST', payload);
    setStatus(undefined);
    if (!res.ok) return setError(res.error);

    const id = initial?.id ?? (res.data as { id: string }).id;
    router.push(`/dashboard/submissions/${id}?saved=1`);
    router.refresh();
  }

  const busy = Boolean(status);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="title" className="label">Title</label>
        <input id="title" name="title" required minLength={3} maxLength={300} defaultValue={initial?.title} className="input" />
        <p className="hint">You can write it in Yorùbá, English or both, e.g. “Oríkì Ọ̀yọ́ / Praise poetry of Oyo”.</p>
      </div>

      <div>
        <label htmlFor="abstract" className="label">Abstract</label>
        <textarea id="abstract" name="abstract" required minLength={20} maxLength={5000} rows={7} defaultValue={initial?.abstract} className="input" />
        <p className="hint">What the research covers, your sources or informants, and why it matters. 20–5000 characters.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category_id" className="label">Category</label>
          <select id="category_id" name="category_id" required defaultValue={initial?.category_id ?? ''} className="input">
            <option value="" disabled>Choose a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="label">Language of title and abstract</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-2 pt-2 text-sm">
            {LANGUAGES.map((l) => (
              <label key={l} className="flex items-center gap-2">
                <input type="radio" name="language" value={l} required defaultChecked={initial?.language === l} />
                {LANGUAGE_LABELS[l]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div>
        <label htmlFor="keywords" className="label">Keywords</label>
        <input id="keywords" name="keywords" required defaultValue={initial?.keywords.join(', ')} className="input" placeholder="Ifá, divination, Ile-Ife" />
        <p className="hint">Separate with commas. Up to 10.</p>
      </div>

      <div>
        <label htmlFor="file" className="label">Research file (PDF or JPEG, up to 20 MB)</label>
        <input id="file" name="file" type="file" accept="application/pdf,image/jpeg,.pdf,.jpg,.jpeg" required={!initial} className="input py-1.5" />
        {initial && <p className="hint">Current file: {initial.file_name}. Leave empty to keep it.</p>}
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={busy}>
        {status ?? (initial ? (initial.resubmit ? 'Save and resubmit for review' : 'Save changes') : 'Submit for review')}
      </button>
    </form>
  );
}
