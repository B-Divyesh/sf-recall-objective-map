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

  it('rejects objectives missing any required field before replacement', () => {
    const incomplete = {
      version: 1,
      updatedAt: now.toISOString(),
      objectives: [{ id: 'a', title: 'Explain closures', prompt: 'What is retained?' }],
      checks: [],
    };
    expect(() => validateImport(incomplete)).toThrow(/incomplete or invalid/);
  });

  it('rejects duplicate ids, missing parents, loops, and orphaned checks', () => {
    const duplicate = structuredClone(state);
    duplicate.objectives[1].id = 'a';
    expect(() => validateImport(duplicate)).toThrow(/incomplete or invalid/);

    const missingParent = structuredClone(state);
    missingParent.objectives[1].parentId = 'missing';
    expect(() => validateImport(missingParent)).toThrow(/links.*invalid/);

    const loop = structuredClone(state);
    loop.objectives[0].parentId = 'b';
    expect(() => validateImport(loop)).toThrow(/loop/);

    const orphan = structuredClone(state);
    orphan.checks[0].objectiveId = 'missing';
    expect(() => validateImport(orphan)).toThrow(/recall checks.*invalid/);
  });

  it('rejects invalid check values and dates', () => {
    const invalidLevel = structuredClone(state) as AppState;
    invalidLevel.checks[0].level = 'unknown' as 'thin';
    expect(() => validateImport(invalidLevel)).toThrow(/recall checks.*invalid/);

    const invalidDate = structuredClone(state);
    invalidDate.objectives[0].updatedAt = 'not a date';
    expect(() => validateImport(invalidDate)).toThrow(/incomplete or invalid/);
  });
});
