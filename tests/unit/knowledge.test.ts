import { describe, expect, it } from 'vitest';
import { chunkText } from '@/lib/ingest';
import { search, tokenize } from '@/lib/retrieval';
import { verifyOutput, type SuppliedSource } from '@/lib/verification';
import { costUsd } from '@/lib/ai/pricing';

describe('ingestion', () => {
  it('keeps locators from page and timestamp markers', () => {
    const chunks = chunkText('[page 3]\nFirst idea.\n\nSecond idea.\n[00:12:30]\nSpoken point.');
    expect(chunks.map((c) => c.locator)).toEqual(['page 3', '00:12:30']);
    expect(chunks[0].content).toContain('Second idea.');
  });
  it('splits long paragraphs and numbers chunks in order', () => {
    const text = Array.from({ length: 60 }, (_, i) => `Sentence number ${i} explains a point.`).join(' ');
    const chunks = chunkText(text, 300);
    expect(chunks.length).toBeGreaterThan(5);
    chunks.forEach((c, i) => { expect(c.ordinal).toBe(i); expect(c.content.length).toBeLessThanOrEqual(300); });
  });
  it('labels chunks without markers as parts', () => {
    expect(chunkText('Just text.')[0].locator).toBe('part 1');
  });
});

describe('retrieval', () => {
  const chunks = [
    { id: '1', content: 'Pricing strategy and value perception for offers.' },
    { id: '2', content: 'Hiring a sales team and training them.' },
    { id: '3', content: 'Offer pricing experiments raised value.' },
  ];
  it('ranks relevant passages first and drops irrelevant ones', () => {
    const hits = search(chunks, 'offer pricing');
    expect(hits.map((h) => h.item.id)).toEqual(['3', '1']);
  });
  it('ignores stop words', () => {
    expect(tokenize('The value of an offer')).toEqual(['value', 'offer']);
  });
});

describe('Vera evidence verification', () => {
  const supplied: SuppliedSource[] = [{ marker: 'S1', chunk_id: 'c1', source_id: 's1', source_title: 'Policy', locator: 'section 1', content: 'Public availability is not permission to ingest.' }];
  const good = '## Summary\nA short but complete summary of the policy point.\n## Source-backed points\n- The policy says "Public availability is not permission" [S1]\n## Synthesis (not from sources)\n- Check rights early.';
  it('passes cited, exact quotes', () => {
    const r = verifyOutput(good, supplied, { simulated: false });
    expect(r.verdict).toBe('pass');
  });
  it('fails altered quotes', () => {
    const r = verifyOutput(good.replace('is not permission', 'is permission'), supplied, { simulated: false });
    expect(r.verdict).toBe('needs_changes');
    expect(r.checks.find((c) => c.id === 'quotes_exact')?.status).toBe('fail');
  });
  it('fails invented citation markers', () => {
    const r = verifyOutput(good + '\n- Another claim [S9]', supplied, { simulated: false });
    expect(r.checks.find((c) => c.id === 'citations_known')?.status).toBe('fail');
  });
  it('fails uncited source-backed points', () => {
    const r = verifyOutput(good.replace('- The policy says', '- Uncited claim here\n- The policy says'), supplied, { simulated: false });
    expect(r.checks.find((c) => c.id === 'claims_cited')?.status).toBe('fail');
  });
  it('fails impersonation or implied endorsement', () => {
    const r = verifyOutput(good + '\nAs Alex Hormozi, I recommend this.', supplied, { simulated: false });
    expect(r.checks.find((c) => c.id === 'identity')?.status).toBe('fail');
    expect(verifyOutput(good + '\nThis plan is endorsed by Alex Hormozi.', supplied, { simulated: false }).verdict).toBe('needs_changes');
  });
  it('fails outputs that contain credentials', () => {
    expect(verifyOutput(good + '\nkey: sk-ant-abcdefghijklmnop', supplied, { simulated: false }).verdict).toBe('needs_changes');
  });
  it('warns, not passes silently, on simulated output and missing evidence', () => {
    const r = verifyOutput('## Summary\nNothing sourced here, only a simulated placeholder text.', [], { simulated: true });
    expect(r.verdict).toBe('pass');
    expect(r.checks.filter((c) => c.status === 'warn').map((c) => c.id)).toEqual(['evidence_available', 'provider']);
  });
});

describe('pricing', () => {
  it('costs runs from per-million-token prices', () => {
    expect(costUsd('claude-opus-5-5', 1_000_000, 100_000)).toBeCloseTo(6);
    expect(costUsd('simulated-v1', 5000, 5000)).toBe(0);
    expect(costUsd('unknown-model', 1_000_000, 0)).toBe(10);
  });
});
