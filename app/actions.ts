'use server';
// Server actions. Every write is validated here and then enforced again by the store
// (in code for demo mode, by row-level security and triggers in Supabase).
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { roleById } from '@/data/workforce';
import { aiConfig, emailAllowed, supabaseConfigured } from '@/lib/env';
import { assertManualTransition, GovernanceError } from '@/lib/governance';
import { chunkText } from '@/lib/ingest';
import { reviewTask, runAgent } from '@/lib/orchestrator';
import { providerFor } from '@/lib/ai/provider';
import { getStore } from '@/lib/store';
import { createClient } from '@/lib/supabase/server';
import { TASK_STATUSES } from '@/lib/types';

const roleId = z.string().regex(/^RF-\d{3}$/).refine((id) => Boolean(roleById(id)), 'Unknown role');
const text = (max: number) => z.string().trim().max(max);

function back(path: string, kind: 'ok' | 'error', message: string): never {
  redirect(`${path}${path.includes('?') ? '&' : '?'}${kind}=${encodeURIComponent(message)}`);
}

// Runs an action, turning expected failures into a readable message on the same page.
async function attempt(path: string, fn: () => Promise<string | void>) {
  let message: string | void;
  try {
    message = await fn();
  } catch (err) {
    if (err instanceof GovernanceError) back(path, 'error', err.message);
    if (err instanceof z.ZodError) back(path, 'error', err.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; '));
    throw err;
  }
  revalidatePath('/', 'layout');
  if (message) back(path, 'ok', message);
}

const NewTask = z.object({
  title: text(500).min(1, 'Title is required'),
  description: text(8000),
  acceptance_criteria: text(4000),
  role_id: roleId,
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});

export async function createTaskAction(form: FormData) {
  const store = await getStore();
  let id = '';
  await attempt('/tasks', async () => {
    const input = NewTask.parse({
      title: form.get('title') ?? '', description: form.get('description') ?? '', acceptance_criteria: form.get('acceptance_criteria') ?? '',
      role_id: form.get('role_id'), priority: form.get('priority') ?? 'normal', due_date: (form.get('due_date') as string) || null,
    });
    const task = await store.createTask(input);
    await store.addEvent({ task_id: task.id, event_type: 'created', actor_type: 'human', to_role_id: task.role_id, message: `Assigned to ${roleById(task.role_id)?.name}.` });
    id = task.id;
  });
  redirect(`/tasks/${id}?ok=${encodeURIComponent('Task created.')}`);
}

export async function changeStatusAction(form: FormData) {
  const id = z.string().uuid().parse(form.get('id'));
  const path = `/tasks/${id}`;
  await attempt(path, async () => {
    const status = z.enum(TASK_STATUSES).parse(form.get('status'));
    const store = await getStore();
    const task = await store.getTask(id);
    if (!task) throw new GovernanceError('Task not found.');
    assertManualTransition(task.status, status);
    await store.setTaskStatus(id, status);
    await store.addEvent({ task_id: id, event_type: 'status_changed', actor_type: 'human', message: `Status changed from ${task.status.replace(/_/g, ' ')} to ${status.replace(/_/g, ' ')}.` });
    return 'Status updated.';
  });
}

export async function handoffAction(form: FormData) {
  const id = z.string().uuid().parse(form.get('id'));
  const path = `/tasks/${id}`;
  await attempt(path, async () => {
    const to = roleId.parse(form.get('role_id'));
    const note = text(2000).min(1, 'Add a short handoff note').parse(form.get('note') ?? '');
    const store = await getStore();
    const task = await store.getTask(id);
    if (!task) throw new GovernanceError('Task not found.');
    if (['running', 'approved', 'released'].includes(task.status)) throw new GovernanceError(`A ${task.status} task cannot be handed off.`);
    if (to === task.role_id) throw new GovernanceError('The task is already assigned to that role.');
    await store.setTaskRole(id, to);
    await store.addEvent({ task_id: id, event_type: 'handoff', actor_type: 'human', from_role_id: task.role_id, to_role_id: to, message: note });
    return `Handed off to ${roleById(to)?.name}.`;
  });
}

export async function addNoteAction(form: FormData) {
  const id = z.string().uuid().parse(form.get('id'));
  await attempt(`/tasks/${id}`, async () => {
    const note = text(2000).min(1, 'Note is empty').parse(form.get('note') ?? '');
    const store = await getStore();
    await store.addEvent({ task_id: id, event_type: 'note', actor_type: 'human', message: note });
    return 'Note added.';
  });
}

export async function runTaskAction(form: FormData) {
  const id = z.string().uuid().parse(form.get('id'));
  await attempt(`/tasks/${id}`, async () => {
    const store = await getStore();
    const cfg = aiConfig();
    const runId = await runAgent(store, id, providerFor(cfg), cfg);
    const run = await store.getRun(runId);
    return run?.status === 'succeeded'
      ? `${cfg.live ? 'Live' : 'Simulated'} run finished and was handed to Vera for review.`
      : `Run ${run?.status ?? 'ended'}. See the run log for details.`;
  });
}

export async function reviewTaskAction(form: FormData) {
  const id = z.string().uuid().parse(form.get('id'));
  await attempt(`/tasks/${id}`, async () => {
    const store = await getStore();
    const result = await reviewTask(store, id);
    return `Vera review recorded: ${result.summary}`;
  });
}

export async function decideReleaseAction(form: FormData) {
  const id = z.string().uuid().parse(form.get('id'));
  await attempt(`/tasks/${id}`, async () => {
    const decision = z.enum(['approved', 'requested_changes', 'rejected']).parse(form.get('decision'));
    const rationale = text(2000).min(1, 'RAM must record a rationale').parse(form.get('rationale') ?? '');
    const store = await getStore();
    await store.decideRelease(id, decision, rationale);
    return decision === 'approved' ? 'Released by RAM.' : decision === 'requested_changes' ? 'Sent back for changes.' : 'Rejected and cancelled.';
  });
}

const NewSource = z.object({
  title: text(300).min(1, 'Title is required'),
  creator: text(200).nullable(),
  source_url: z.string().trim().url().max(1000).nullable(),
  permitted_use: text(500).nullable(),
  notes: text(2000).nullable(),
});

export async function createSourceAction(form: FormData) {
  await attempt('/knowledge', async () => {
    const v = (k: string) => ((form.get(k) as string) ?? '').trim() || null;
    const input = NewSource.parse({ title: v('title') ?? '', creator: v('creator'), source_url: v('source_url'), permitted_use: v('permitted_use'), notes: v('notes') });
    const store = await getStore();
    await store.createSource(input);
    return 'Source added with rights pending. Nothing can be ingested until rights are approved.';
  });
}

export async function setRightsAction(form: FormData) {
  await attempt('/knowledge', async () => {
    const id = z.string().uuid().parse(form.get('id'));
    const status = z.enum(['pending', 'approved', 'rejected', 'restricted']).parse(form.get('rights_status'));
    const evidence = text(2000).parse(form.get('permission_evidence') ?? '') || null;
    const rationale = text(2000).min(1, 'Record why you made this rights decision').parse(form.get('rationale') ?? '');
    const store = await getStore();
    await store.setSourceRights(id, status, evidence, rationale);
    return status === 'approved' ? 'Rights approved. You can now add text from this source.' : `Rights set to ${status}. Any indexed text was removed.`;
  });
}

export async function ingestAction(form: FormData) {
  await attempt('/knowledge', async () => {
    const id = z.string().uuid().parse(form.get('id'));
    const body = z.string().trim().min(20, 'Paste at least a few sentences').parse(form.get('text') ?? '');
    const store = await getStore();
    const source = await store.getSource(id);
    if (!source) throw new GovernanceError('Source not found.');
    if (source.rights_status !== 'approved') throw new GovernanceError(`Source rights are ${source.rights_status}. Ingestion requires approved rights.`);
    let chunks;
    try { chunks = chunkText(body); } catch (e) { throw new GovernanceError((e as Error).message); }
    const n = await store.addChunks(id, chunks);
    return `Stored ${n} passage(s) from "${source.title}".`;
  });
}

export async function signInAction(form: FormData) {
  if (!supabaseConfigured()) back('/login', 'error', 'Supabase is not configured, so the app is running in demo mode.');
  const parsed = z.string().trim().email().safeParse(form.get('email'));
  if (!parsed.success) back('/login', 'error', 'Enter a valid email address.');
  // Same message whether or not the address is allowed, so the form does not reveal who has access.
  if (!emailAllowed(parsed.data)) back('/login', 'ok', 'If this address has access, a sign-in link is on its way.');
  const h = await headers();
  const origin = h.get('origin') ?? `${h.get('x-forwarded-proto') ?? 'http'}://${h.get('host')}`;
  const db = await createClient();
  const { error } = await db.auth.signInWithOtp({ email: parsed.data, options: { emailRedirectTo: `${origin}/auth/callback`, shouldCreateUser: process.env.ALLOW_SIGNUPS === 'true' } });
  if (error) back('/login', 'error', error.message);
  back('/login', 'ok', 'If this address has access, a sign-in link is on its way.');
}

export async function signOutAction() {
  if (supabaseConfigured()) {
    const db = await createClient();
    await db.auth.signOut();
  }
  redirect('/login');
}
