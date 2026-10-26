// Keyword retrieval (BM25) over approved source chunks. Small, dependency-free and easy to test.
// Callers must pass only chunks from approved sources; the store enforces that.
import type { SourceChunk } from './types';

const STOP = new Set('a an and are as at be but by for from has have how i if in into is it its of on or our so that the their them then there these they this to was we what when which who why will with you your'.split(' '));

export function tokenize(text: string): string[] {
  return text.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((t) => t.length > 1 && !STOP.has(t));
}

export type Scored<T> = { item: T; score: number };

export function search<T extends Pick<SourceChunk, 'content'>>(chunks: T[], query: string, k = 5): Scored<T>[] {
  const q = [...new Set(tokenize(query))];
  if (!q.length || !chunks.length) return [];
  const docs = chunks.map((c) => tokenize(c.content));
  const avg = docs.reduce((s, d) => s + d.length, 0) / docs.length || 1;
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const k1 = 1.2, b = 0.75, N = docs.length;
  const scored = docs.map((d, i) => {
    const tf = new Map<string, number>();
    for (const t of d) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of q) {
      const f = tf.get(t);
      if (!f) continue;
      const idf = Math.log(1 + (N - (df.get(t) ?? 0) + 0.5) / ((df.get(t) ?? 0) + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.length) / avg)));
    }
    return { item: chunks[i], score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}
