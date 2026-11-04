import type { Metadata } from 'next';
import { RoleSelect } from '@/components/admin/RoleSelect';
import { requireViewer } from '@/lib/auth';
import type { Role } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { createAdminClient } from '@/lib/supabase/admin';
import { filterTerm } from '@/lib/validation';

export const metadata: Metadata = { title: 'Users' };

type Row = { id: string; full_name: string; email: string; role: Role; institution: string | null; created_at: string };

// FR8: manage users and reviewers. Promote lecturers to reviewer here.
export default async function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  const viewer = await requireViewer(['admin']);
  const q = filterTerm((await searchParams).q);
  const admin = createAdminClient();

  let query = admin.from('profiles').select('id, full_name, email, role, institution, created_at').order('created_at', { ascending: false }).limit(200);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  const [{ data: users }, { data: workload }] = await Promise.all([
    query,
    admin.from('research_submissions').select('assigned_reviewer_id').eq('status', 'pending').not('assigned_reviewer_id', 'is', null),
  ]);
  const load = new Map<string, number>();
  for (const w of workload ?? []) load.set(w.assigned_reviewer_id, (load.get(w.assigned_reviewer_id) ?? 0) + 1);

  return (
    <div className="space-y-4">
      <form className="flex max-w-md gap-2" role="search">
        <label htmlFor="user-q" className="sr-only">Search users</label>
        <input id="user-q" name="q" defaultValue={q} className="input" placeholder="Search name or email" />
        <button className="btn-secondary">Search</button>
      </form>
      <div className="overflow-x-auto rounded-[3px] border border-hairline">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-surface text-xs text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Joined</th>
              <th className="px-3 py-2 font-medium">Pending reviews</th>
              <th className="px-3 py-2 font-medium">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {((users ?? []) as Row[]).map((u) => (
              <tr key={u.id}>
                <td className="px-3 py-2">
                  <div className="font-medium">{u.full_name}</div>
                  {u.institution && <div className="text-xs text-muted">{u.institution}</div>}
                </td>
                <td className="px-3 py-2 text-ink-2">{u.email}</td>
                <td className="px-3 py-2 text-ink-2">{formatDate(u.created_at)}</td>
                <td className="px-3 py-2 text-ink-2">{u.role === 'reviewer' ? load.get(u.id) ?? 0 : '—'}</td>
                <td className="px-3 py-2">
                  <RoleSelect userId={u.id} role={u.role} disabled={u.id === viewer.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
