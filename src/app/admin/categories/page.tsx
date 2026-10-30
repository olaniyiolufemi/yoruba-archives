import type { Metadata } from 'next';
import { CategoryEditor, NewCategoryForm } from '@/components/admin/CategoryManager';
import { requireViewer } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = { title: 'Categories' };

export default async function AdminCategoriesPage() {
  await requireViewer(['admin']);
  const admin = createAdminClient();
  const [{ data: categories }, { data: used }] = await Promise.all([
    admin.from('categories').select('id, name, description').order('name'),
    admin.from('research_submissions').select('category_id'),
  ]);
  const counts = new Map<string, number>();
  for (const u of used ?? []) counts.set(u.category_id, (counts.get(u.category_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <NewCategoryForm />
      <ul className="space-y-3">
        {(categories ?? []).map((c) => (
          <li key={c.id}>
            <CategoryEditor category={c} count={counts.get(c.id) ?? 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}
