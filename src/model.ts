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
  for (const objective of input.objectives) {
    if (!objective || typeof objective.id !== 'string' || typeof objective.title !== 'string' || typeof objective.prompt !== 'string') {
      throw new Error('One or more objectives in that file are incomplete.');
    }
  }
  for (const check of input.checks) {
    if (!check || typeof check.id !== 'string' || typeof check.objectiveId !== 'string' || !MODES.includes(check.mode)) {
      throw new Error('One or more recall checks in that file are incomplete.');
    }
  }
  return input as AppState;
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
