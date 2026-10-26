import { PageHeader } from '@/components/PageHeader';
import { WorkforceBrowser } from '@/components/WorkforceBrowser';
import { getStore } from '@/lib/store';

export default async function WorkforcePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const store = await getStore();
  const tasks = await store.listTasks();
  const openByRole: Record<string, number> = {};
  for (const t of tasks) if (!['released', 'cancelled'].includes(t.status)) openByRole[t.role_id] = (openByRole[t.role_id] ?? 0) + 1;
  return (
    <>
      <PageHeader eyebrow="Workforce" title="Workforce" intro="Five division heads, ten team leads and sixty specialists. Open any character to see their responsibilities and assign work." />
      <WorkforceBrowser initialDivision={sp.division ?? 'All'} initialQuery={sp.q ?? ''} openByRole={openByRole} />
    </>
  );
}
