import { describe, expect, it } from 'vitest';
import { AppState, objectiveStats, validateImport, weakestObjectives, weeklyCsv } from '../src/model';

const now = new Date('2026-08-28T12:00:00.000Z');
const state: AppState = {
  version: 1,
  updatedAt: now.toISOString(),
  objectives: [
    { id: 'a', title: 'Explain closures', description: '', parentId: null, prompt: 'What does a closure retain?', evidenceTarget: 'Name lexical scope.', createdAt: now.toISOString(), updatedAt: now.toISOString() },
    { id: 'b', title: 'Solve scope traces', description: '', parentId: 'a', prompt: 'Trace this scope.', evidenceTarget: 'Correct values.', createdAt: now.toISOString(), updatedAt: now.toISOString() },
  ],
  checks: [
    { id: 'c', objectiveId: 'a', prompt: 'What does a closure retain?', answer: 'Its outer bindings.', mode: 'explain', level: 'supported', note: '', checkedAt: '2026-08-27T12:00:00.000Z' },
  ],
};

describe('objective evidence model', () => {
  it('ranks objectives with no evidence first', () => {
    expect(weakestObjectives(state, 7, now)[0].objective.id).toBe('b');
  });

  it('keeps missing evidence modes explicit', () => {
    const stats = objectiveStats(state, 7, now).find(item => item.objective.id === 'a')!;
    expect(stats.band).toBe('building');
    expect(stats.missingModes).toEqual(['solve', 'recognize']);
  });

  it('exports a readable objective and parent map', () => {
    const csv = weeklyCsv(state, 7, now);
    expect(csv).toContain('"Solve scope traces","Explain closures"');
    expect(csv).toContain('"missing_evidence"');
  });

  it('rejects unknown backup formats', () => {
    expect(() => validateImport({ version: 2, objectives: [], checks: [] })).toThrow(/not supported/);
    expect(validateImport(state)).toEqual(state);
  });
});
