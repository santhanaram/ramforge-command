import { describe, expect, it } from 'vitest';
import { approvalClasses, candidateTools, forgeLeads, leadCharter } from '@/data/contextforge';

describe('ContextForge plan', () => {
  it('lists 30 unique candidate tools, all disabled and approval-gated', () => {
    expect(candidateTools).toHaveLength(30);
    expect(new Set(candidateTools.map((t) => t.id)).size).toBe(30);
    for (const t of candidateTools) {
      expect(t.enabled, t.name).toBe(false);
      expect(t.approval_required, t.name).toBe(true);
    }
  });

  it('only treats a tool as having a candidate link when a repository URL is recorded', () => {
    for (const t of candidateTools) {
      if (t.repository) {
        expect(t.repository).toMatch(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/);
        expect(t.verification).toBe('candidate_link_review_required');
      } else expect(t.verification).toBe('unverified_identity');
    }
  });

  it('has five leads with a ten-step charter and sign-off on P2 and P3', () => {
    expect(forgeLeads).toHaveLength(5);
    expect(leadCharter).toHaveLength(10);
    expect(approvalClasses.filter((c) => c.signOff).map((c) => c.code)).toEqual(['P2', 'P3']);
  });
});
