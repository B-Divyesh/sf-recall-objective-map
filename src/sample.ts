import { AppState } from './model';

const sampledAt = new Date().toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const sampleState = (): AppState => ({
  version: 1,
  updatedAt: sampledAt,
  objectives: [
    {
      id: 'sample-orbits',
      title: 'Explain why planets stay in orbit',
      description: 'Build a working explanation of circular and elliptical orbits.',
      parentId: null,
      prompt: 'Why does a planet fall toward the Sun without crashing into it?',
      evidenceTarget: 'Connect gravity, sideways velocity, continuous free fall, and the curved path.',
      createdAt: daysAgo(12),
      updatedAt: sampledAt,
    },
    {
      id: 'sample-speed',
      title: 'Solve circular orbit speed',
      description: 'Use force balance to calculate speed at a given orbital radius.',
      parentId: 'sample-orbits',
      prompt: 'How do you derive circular orbit speed from gravity and centripetal acceleration?',
      evidenceTarget: 'Set GMm/r² equal to mv²/r, cancel mass, and reach v = √(GM/r).',
      createdAt: daysAgo(12),
      updatedAt: sampledAt,
    },
    {
      id: 'sample-energy',
      title: 'Compare orbital energy changes',
      description: 'Predict how a burn changes orbital speed and altitude.',
      parentId: 'sample-orbits',
      prompt: 'Why can speeding up at one point raise the opposite side of an orbit?',
      evidenceTarget: 'Explain the added orbital energy and identify the burn point as one end of the new ellipse.',
      createdAt: daysAgo(12),
      updatedAt: sampledAt,
    },
    {
      id: 'sample-graphs',
      title: 'Recognize position and velocity graphs',
      description: 'Read common motion graphs before using orbital models.',
      parentId: null,
      prompt: 'What does the slope of a position-time graph show?',
      evidenceTarget: 'Name velocity and use the slope direction and steepness correctly.',
      createdAt: daysAgo(13),
      updatedAt: sampledAt,
    },
  ],
  checks: [
    {
      id: 'sample-check-1', objectiveId: 'sample-orbits',
      prompt: 'Why does a planet fall toward the Sun without crashing into it?',
      answer: 'Gravity turns the velocity toward the Sun while sideways motion carries the planet forward.',
      mode: 'explain', level: 'building', note: 'I left out why the path closes.', checkedAt: daysAgo(2),
    },
    {
      id: 'sample-check-2', objectiveId: 'sample-speed',
      prompt: 'How do you derive circular orbit speed from gravity and centripetal acceleration?',
      answer: 'Balance GMm/r² with mv²/r and solve for v.',
      mode: 'solve', level: 'supported', note: 'Derivation was correct without notes.', checkedAt: daysAgo(3),
    },
    {
      id: 'sample-check-3', objectiveId: 'sample-graphs',
      prompt: 'What does the slope of a position-time graph show?',
      answer: 'Velocity, including direction from the sign of the slope.',
      mode: 'recognize', level: 'supported', note: 'Read three example graphs correctly.', checkedAt: daysAgo(4),
    },
    {
      id: 'sample-check-4', objectiveId: 'sample-energy',
      prompt: 'Why can speeding up at one point raise the opposite side of an orbit?',
      answer: 'The burn adds energy and makes the old circular path one end of a new ellipse.',
      mode: 'explain', level: 'building', note: 'Review the direction of the burn.', checkedAt: daysAgo(18),
    },
  ],
});
