// Governance rules shared by the demo store and mirrored by database triggers in Supabase.
// Keep these in step with supabase/migrations/20261027000000_workforce_core.sql.
import { isVeraRole, roleById } from '@/data/workforce';
import type { Review, Source, Task, TaskStatus } from './types';

export class GovernanceError extends Error {}

// Statuses a person may set by hand. approved and released are only reachable through review and release.
const manualTransitions: Partial<Record<TaskStatus, TaskStatus[]>> = {
  draft: ['queued', 'cancelled'],
  queued: ['draft', 'cancelled'],
  needs_changes: ['queued', 'cancelled'],
  failed: ['queued', 'cancelled'],
  awaiting_review: ['cancelled'],
  cancelled: ['draft'],
};

export function allowedManualStatuses(status: TaskStatus): TaskStatus[] {
  return manualTransitions[status] ?? [];
}

export function assertManualTransition(from: TaskStatus, to: TaskStatus) {
  if (!allowedManualStatuses(from).includes(to)) {
    throw new GovernanceError(`A task cannot be moved from ${label(from)} to ${label(to)} by hand.`);
  }
}

export function assertRunnable(task: Task) {
  if (!['draft', 'queued', 'needs_changes', 'failed'].includes(task.status)) {
    throw new GovernanceError(`Agent runs can start only from draft, queued, needs changes or failed (task is ${label(task.status)}).`);
  }
}

export function assertCanIngest(source: Source) {
  if (source.rights_status !== 'approved') {
    throw new GovernanceError(`Source rights are ${source.rights_status}. Ingestion requires approved rights.`);
  }
  if (!source.permission_evidence?.trim()) throw new GovernanceError('Approved sources must have permission evidence on file.');
}

export function assertRightsChange(status: Source['rights_status'], evidence: string | null | undefined) {
  if (status === 'approved' && !evidence?.trim()) {
    throw new GovernanceError('Approving rights requires written permission evidence.');
  }
}

export function assertReviewer(task: Task, reviewerRoleId: string, producerRoleId?: string | null) {
  if (!isVeraRole(reviewerRoleId)) throw new GovernanceError('Reviews must be recorded by a Vera division role.');
  if (task.role_id === reviewerRoleId) throw new GovernanceError('A role cannot review its own task.');
  if (producerRoleId && producerRoleId === reviewerRoleId) throw new GovernanceError('A role cannot review its own run.');
}

export function latestReview(reviews: Review[]): Review | undefined {
  return [...reviews].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
}

export function assertReleasable(task: Task, reviews: Review[]) {
  if (task.status !== 'approved' || latestReview(reviews)?.verdict !== 'pass') {
    throw new GovernanceError('Release requires a passing Vera review first.');
  }
}

// Picks an independent Vera reviewer: the Citation Validator by default, the Claim Evidence Auditor
// when the task itself belongs to the Citation Validator.
export function pickReviewer(task: Task, producerRoleId?: string | null): string {
  const candidates = ['RF-063', 'RF-064', 'RF-062', 'RF-061'];
  const pick = candidates.find((id) => id !== task.role_id && id !== producerRoleId);
  if (!pick || !roleById(pick)) throw new GovernanceError('No independent Vera reviewer is available.');
  return pick;
}

export function label(status: string) {
  return status.replace(/_/g, ' ');
}
