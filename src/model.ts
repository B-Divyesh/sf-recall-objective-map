export type EvidenceMode = 'explain' | 'solve' | 'recognize';
export type EvidenceLevel = 'thin' | 'building' | 'supported';

export interface Objective {
  id: string;
  title: string;
  description: string;
  parentId: string | null;
  prompt: string;
  evidenceTarget: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecallCheck {
  id: string;
  objectiveId: string;
  prompt: string;
  answer: string;
  mode: EvidenceMode;
  level: EvidenceLevel;
  note: string;
  checkedAt: string;
}

export interface AppState {
  version: 1;
  objectives: Objective[];
  checks: RecallCheck[];
  updatedAt: string;
}

export interface ObjectiveStats {
  objective: Objective;
  checks: RecallCheck[];
  windowChecks: RecallCheck[];
  evidenceScore: number;
  band: EvidenceLevel;
  missingModes: EvidenceMode[];
  lastChecked: string | null;
}

export const MODES: EvidenceMode[] = ['explain', 'solve', 'recognize'];
export const emptyState = (): AppState => ({ version: 1, objectives: [], checks: [], updatedAt: new Date().toISOString() });
export const makeId = () => crypto.randomUUID();

const levelValue: Record<EvidenceLevel, number> = { thin: 0, building: 1, supported: 2 };

export function objectiveStats(state: AppState, days = 7, now = new Date()): ObjectiveStats[] {
  const cutoff = now.getTime() - days * 86_400_000;
  return state.objectives.map(objective => {
    const checks = state.checks
      .filter(check => check.objectiveId === objective.id)
      .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt));
    const windowChecks = checks.filter(check => new Date(check.checkedAt).getTime() >= cutoff);
    const latestPerMode = MODES.map(mode => windowChecks.find(check => check.mode === mode)).filter(Boolean) as RecallCheck[];
    const evidenceScore = latestPerMode.length
      ? latestPerMode.reduce((total, check) => total + levelValue[check.level], 0) / (MODES.length * 2)
      : 0;
    const band: EvidenceLevel = evidenceScore >= .66 ? 'supported' : evidenceScore >= .24 ? 'building' : 'thin';
    const missingModes = MODES.filter(mode => !windowChecks.some(check => check.mode === mode));
    return { objective, checks, windowChecks, evidenceScore, band, missingModes, lastChecked: checks[0]?.checkedAt ?? null };
  });
}

export function weakestObjectives(state: AppState, days = 7, now = new Date()) {
  return objectiveStats(state, days, now).sort((a, b) => {
    if (a.evidenceScore !== b.evidenceScore) return a.evidenceScore - b.evidenceScore;
    if (a.windowChecks.length !== b.windowChecks.length) return a.windowChecks.length - b.windowChecks.length;
    return (a.lastChecked ?? '').localeCompare(b.lastChecked ?? '');
  });
}

export function validateImport(value: unknown): AppState {
  if (!value || typeof value !== 'object') throw new Error('That file does not contain an objective map.');
  const input = value as Partial<AppState>;
  if (input.version !== 1 || !Array.isArray(input.objectives) || !Array.isArray(input.checks)) {
    throw new Error('This export format is not supported. Choose a Recall Objective Map JSON file.');
  }
  if (input.objectives.length > 10_000 || input.checks.length > 100_000) {
    throw new Error('That file is too large to import safely.');
  }

  const isText = (item: unknown, max: number, allowEmpty = false): item is string =>
    typeof item === 'string' && item.length <= max && (allowEmpty || item.trim().length > 0);
  const isDate = (item: unknown): item is string =>
    typeof item === 'string' && item.trim().length > 0 && Number.isFinite(Date.parse(item));
  const objectiveIds = new Set<string>();
  const objectives: Objective[] = input.objectives.map(objective => {
    if (!objective || typeof objective !== 'object') throw new Error('One or more objectives in that file are incomplete.');
    const item = objective as Partial<Objective>;
    if (!isText(item.id, 200) || objectiveIds.has(item.id) || !isText(item.title, 100) ||
        !isText(item.description, 600, true) || !isText(item.prompt, 500) ||
        !isText(item.evidenceTarget, 500) || !isDate(item.createdAt) || !isDate(item.updatedAt) ||
        !(item.parentId === null || isText(item.parentId, 200))) {
      throw new Error('One or more objectives in that file are incomplete or invalid.');
    }
    objectiveIds.add(item.id);
    return {
      id: item.id,
      title: item.title.trim(),
      description: item.description.trim(),
      parentId: item.parentId,
      prompt: item.prompt.trim(),
      evidenceTarget: item.evidenceTarget.trim(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  for (const objective of objectives) {
    if (objective.parentId !== null && (!objectiveIds.has(objective.parentId) || objective.parentId === objective.id)) {
      throw new Error('One or more objective links in that file are invalid.');
    }
    const visited = new Set([objective.id]);
    let parentId = objective.parentId;
    while (parentId !== null) {
      if (visited.has(parentId)) throw new Error('That file contains an objective loop.');
      visited.add(parentId);
      parentId = objectives.find(item => item.id === parentId)?.parentId ?? null;
    }
  }

  const checkIds = new Set<string>();
  const checks: RecallCheck[] = input.checks.map(check => {
    if (!check || typeof check !== 'object') throw new Error('One or more recall checks in that file are incomplete.');
    const item = check as Partial<RecallCheck>;
    if (!isText(item.id, 200) || checkIds.has(item.id) || !isText(item.objectiveId, 200) ||
        !objectiveIds.has(item.objectiveId) || !isText(item.prompt, 500) || !isText(item.answer, 4000) ||
        !MODES.includes(item.mode as EvidenceMode) || !['thin', 'building', 'supported'].includes(item.level ?? '') ||
        !isText(item.note, 600, true) || !isDate(item.checkedAt)) {
      throw new Error('One or more recall checks in that file are incomplete or invalid.');
    }
    checkIds.add(item.id);
    return {
      id: item.id,
      objectiveId: item.objectiveId,
      prompt: item.prompt.trim(),
      answer: item.answer.trim(),
      mode: item.mode as EvidenceMode,
      level: item.level as EvidenceLevel,
      note: item.note.trim(),
      checkedAt: item.checkedAt,
    };
  });

  if (!isDate(input.updatedAt)) throw new Error('That file has an invalid update date.');
  return { version: 1, objectives, checks, updatedAt: input.updatedAt };
}

const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function weeklyCsv(state: AppState, days = 7, now = new Date()): string {
  const rows = [['objective', 'parent', 'evidence_band', 'checks_in_window', 'missing_evidence', 'last_check']];
  const byId = new Map(state.objectives.map(item => [item.id, item]));
  for (const stats of weakestObjectives(state, days, now)) {
    rows.push([
      stats.objective.title,
      stats.objective.parentId ? byId.get(stats.objective.parentId)?.title ?? '' : '',
      stats.band,
      String(stats.windowChecks.length),
      stats.missingModes.join('; '),
      stats.lastChecked ?? '',
    ]);
  }
  return rows.map(row => row.map(csvCell).join(',')).join('\n');
}
