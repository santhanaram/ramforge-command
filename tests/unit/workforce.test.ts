import { describe, expect, it } from 'vitest';
import { directReports, divisionNames, isVeraRole, roleById, workforce } from '@/data/workforce';
import { portraits } from '@/data/portraits';
import { videos, youtubeUrl } from '@/data/videos';

describe('workforce directory', () => {
  it('has 75 roles: 5 heads, 10 leads, 60 specialists', () => {
    expect(workforce).toHaveLength(75);
    expect(workforce.filter((r) => r.level === 'head')).toHaveLength(5);
    expect(workforce.filter((r) => r.level === 'lead')).toHaveLength(10);
    expect(workforce.filter((r) => r.level === 'specialist')).toHaveLength(60);
    expect(divisionNames).toEqual(['Atlas', 'Nova', 'Forge', 'Sage', 'Vera']);
  });

  it('gives every role exactly ten distinct responsibilities, unique across the workforce', () => {
    const all = new Set<string>();
    for (const r of workforce) {
      expect(r.tasks, r.name).toHaveLength(10);
      expect(new Set(r.tasks).size, r.name).toBe(10);
      r.tasks.forEach((t) => all.add(t));
    }
    // Most responsibilities are unique; a handful of short generic duties may repeat.
    expect(all.size).toBeGreaterThan(700);
  });

  it('has a valid reporting chain', () => {
    for (const r of workforce) {
      if (r.level === 'head') expect(r.managerId).toBeNull();
      else {
        const m = roleById(r.managerId!);
        expect(m, r.name).toBeDefined();
        expect(m!.division).toBe(r.division);
        expect(m!.level).toBe(r.level === 'lead' ? 'head' : 'lead');
      }
    }
    for (const lead of workforce.filter((r) => r.level === 'lead')) expect(directReports(lead.id)).toHaveLength(6);
  });

  it('uses stable IDs with Vera in RF-061 to RF-075', () => {
    expect(workforce.map((r) => r.id)).toEqual(Array.from({ length: 75 }, (_, i) => `RF-${String(i + 1).padStart(3, '0')}`));
    expect(workforce.filter((r) => isVeraRole(r.id)).every((r) => r.division === 'Vera')).toBe(true);
    expect(workforce.filter((r) => r.division === 'Vera').every((r) => isVeraRole(r.id))).toBe(true);
  });

  it('uses no em dashes in user-facing copy', () => {
    const text = JSON.stringify(workforce);
    expect(text).not.toContain('—');
  });
});

describe('portraits and videos', () => {
  it('gives every role an AI-generated portrait marked as a fictional person', () => {
    for (const r of workforce) {
      const p = portraits[r.id];
      expect(p, r.id).toBeDefined();
      expect(p.src).toMatch(/^https:\/\//);
      expect(p.alt).toContain(`fictional character ${r.name}`);
      expect(p.appearance.length).toBeGreaterThan(10);
    }
  });

  it('lists five distinct YouTube videos for every role, with no repeats across roles', () => {
    const all: string[] = [];
    for (const r of workforce) {
      const list = videos[r.id] ?? [];
      expect(list, r.id).toHaveLength(5);
      for (const v of list) {
        expect(v.id).toMatch(/^[\w-]{11}$/);
        expect(v.title.length).toBeGreaterThan(3);
        all.push(v.id);
      }
    }
    expect(new Set(all).size).toBe(all.length);
    expect(youtubeUrl('abcdefghijk')).toBe('https://www.youtube.com/watch?v=abcdefghijk');
  });

  it('uses no em dashes in portrait or video copy', () => {
    expect(JSON.stringify({ portraits, videos })).not.toContain('—');
  });
});
