export const CAMPAIGN_LEVELS = [
  {
    id: 'capture', chapter: '01', title: 'First Contact', subtitle: 'Capture a Core on the lattice.',
    description: 'Learn how launcher position, angle and power determine a capture cell.', objective: { type: 'turns', target: 1 },
    seed: 'FQ-CAMPAIGN-01', gravity: 'DOWN', gravityPreview: ['LEFT', 'UP'], launchesUntilShift: 5, queue: [1, 2, 3, 4, 1, 2], board: []
  },
  {
    id: 'fusion', chapter: '02', title: 'Like Meets Like', subtitle: 'Complete one fusion.',
    description: 'Place an equal-ranked Core beside its match and select a fusion route.', objective: { type: 'fusions', target: 1 },
    seed: 'FQ-CAMPAIGN-02', gravity: 'DOWN', gravityPreview: ['LEFT', 'UP'], launchesUntilShift: 5, queue: [1, 2, 3, 4, 1, 2],
    board: [{ row: 7, column: 3, rank: 1 }]
  },
  {
    id: 'quint', chapter: '03', title: 'Complete the Five', subtitle: 'Create one Basic Quint.',
    description: 'Fill the open cell with rank 5 to complete a 1–5 line.', objective: { type: 'quints', target: 1 },
    seed: 'FQ-CAMPAIGN-03', gravity: 'DOWN', gravityPreview: ['LEFT', 'UP'], launchesUntilShift: 5, queue: [5, 1, 2, 3, 4],
    board: [
      { row: 7, column: 1, rank: 1 }, { row: 7, column: 2, rank: 2 },
      { row: 7, column: 3, rank: 3 }, { row: 7, column: 4, rank: 4 }
    ]
  },
  {
    id: 'shift', chapter: '04', title: 'Read the Field', subtitle: 'Complete a Shift Quint.',
    description: 'Prepare the board so the next gravity shift completes a Quint.', objective: { type: 'shiftQuints', target: 1 },
    seed: 'FQ-CAMPAIGN-04', gravity: 'UP', gravityPreview: ['DOWN', 'LEFT'], launchesUntilShift: 1, queue: [5, 2, 3, 1, 4],
    board: [
      { row: 7, column: 0, rank: 1 }, { row: 7, column: 1, rank: 2 },
      { row: 7, column: 2, rank: 3 }, { row: 7, column: 3, rank: 4 }
    ]
  },
  {
    id: 'harmonic', chapter: '05', title: 'Harmonic Order', subtitle: 'Create an ordered Quint.',
    description: 'Complete either 1–2–3–4–5 or 5–4–3–2–1.', objective: { type: 'harmonicQuints', target: 1 },
    seed: 'FQ-CAMPAIGN-05', gravity: 'DOWN', gravityPreview: ['LEFT', 'UP'], launchesUntilShift: 4, queue: [5, 1, 4, 2, 3],
    board: [
      { row: 7, column: 0, rank: 1 }, { row: 7, column: 1, rank: 2 },
      { row: 7, column: 2, rank: 3 }, { row: 7, column: 3, rank: 4 }
    ]
  },
  {
    id: 'burst', chapter: '06', title: 'Control the Shift', subtitle: 'Trigger one Flux Burst.',
    description: 'Fuse two rank-5 Cores to earn a Flux Choice.', objective: { type: 'fluxBursts', target: 1 },
    seed: 'FQ-CAMPAIGN-06', gravity: 'DOWN', gravityPreview: ['RIGHT', 'UP'], launchesUntilShift: 3, queue: [5, 2, 1, 4, 3],
    board: [{ row: 7, column: 4, rank: 5 }]
  },
  {
    id: 'mastery', chapter: '07', title: 'Resonance', subtitle: 'Score 2,500 points.',
    description: 'Combine fusion, order and gravity planning into one complete run.', objective: { type: 'score', target: 2500 },
    seed: 'FQ-CAMPAIGN-07', gravity: 'DOWN', gravityPreview: ['LEFT', 'UP'], launchesUntilShift: 5, queue: [], board: []
  }
];
