import {
  BOARD_SIZE, DIRECTIONS, FUSION_SCORE, GRAVITY_INTERVAL, HARMONIC_SCORE,
  QUINT_SCORE, FLUX_BURST_SCORE, RULESET_VERSION
} from './constants.js';
import { createRandom, shuffle } from './prng.js';
import { emptyBoard, applyGravity, gravityOrder } from './gravity.js';
import { findQuints, quintUnion, hasCross } from './quints.js';
import { CAMPAIGN_LEVELS } from './campaign.js';

const ADJACENT = Object.freeze({
  UP: [-1, 0], RIGHT: [0, 1], DOWN: [1, 0], LEFT: [0, -1]
});
const FUSION_PRIORITY = Object.freeze(['UP', 'RIGHT', 'DOWN', 'LEFT']);

function cloneBoard(board) {
  return board.map((row) => row.map((core) => core ? { ...core } : null));
}

export function getDailySeed(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `FQ-DAILY-${year}-${month}-${day}`;
}

function nextId(state) {
  return `c${state.turn}-${state.nextCoreId++}`;
}

function makeBag(random) {
  return shuffle([1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4], random);
}

function ensureQueue(state, minimum = 8) {
  while (state.queue.length < minimum) state.queue.push(...makeBag(state.random));
}

function seedBoard(state, count = 7) {
  const candidateCells = [];
  for (let row = 5; row < BOARD_SIZE; row += 1) {
    for (let column = 0; column < BOARD_SIZE; column += 1) candidateCells.push({ row, column });
  }
  for (const cell of shuffle(candidateCells, state.random).slice(0, count)) {
    const rank = 1 + Math.floor(state.random() * 4);
    state.board[cell.row][cell.column] = { id: nextId(state), rank, ...cell, anchorTurns: 0 };
  }
  if (findQuints(state.board).length) {
    state.board = emptyBoard();
    seedBoard(state, count);
  }
}

function levelFromId(levelId) {
  return CAMPAIGN_LEVELS.find((level) => level.id === levelId) ?? CAMPAIGN_LEVELS[0];
}

export function createGame(options = {}) {
  const mode = options.mode ?? 'endless';
  const level = mode === 'campaign' ? levelFromId(options.levelId) : null;
  const seed = options.seed || (mode === 'daily' ? getDailySeed() : level?.seed ?? `FQ-${Date.now()}`);
  const random = createRandom(seed);
  const board = emptyBoard();
  const state = {
    rulesetVersion: RULESET_VERSION,
    seed,
    mode,
    levelId: level?.id ?? null,
    objective: level?.objective ?? (mode === 'daily' ? { type: 'score', target: 5000 } : null),
    board,
    queue: level?.queue ? [...level.queue] : [],
    gravity: level?.gravity ?? 'DOWN',
    gravityPreview: [],
    launchesUntilShift: level?.launchesUntilShift ?? GRAVITY_INTERVAL,
    score: 0,
    multiplier: 1,
    fluxChoices: 0,
    turn: 0,
    nextCoreId: 1,
    status: 'PLAYING',
    events: [],
    replay: [],
    random,
    stats: {
      launches: 0, fusions: 0, quints: 0, harmonicQuints: 0, shiftQuints: 0,
      crossQuints: 0, cascades: 0, fluxBursts: 0, gravityShifts: 0, maxOccupancy: 0
    }
  };

  state.gravityPreview = level?.gravityPreview ? [...level.gravityPreview] : [nextDirection(state.gravity, random), nextDirection(null, random)];
  if (level?.board?.length) {
    for (const item of level.board) {
      board[item.row][item.column] = { id: nextId(state), rank: item.rank, row: item.row, column: item.column, anchorTurns: 0 };
    }
  } else if (mode !== 'campaign' || level?.id === 'mastery') {
    seedBoard(state, mode === 'daily' ? 9 : 7);
  }
  ensureQueue(state);
  updateOccupancy(state);
  return state;
}

function nextDirection(current, random) {
  const options = current ? DIRECTIONS.filter((direction) => direction !== current) : DIRECTIONS;
  return options[Math.floor(random() * options.length)];
}

function normalizeLane(lane, bounce) {
  if (lane >= 0 && lane < BOARD_SIZE) return { lane, bounced: false, bank: null };
  if (lane < 0 && bounce === 'COUNTER') {
    return { lane: Math.min(BOARD_SIZE - 1, (-lane) - 1), bounced: true, bank: 'COUNTER' };
  }
  if (lane >= BOARD_SIZE && bounce === 'CLOCKWISE') {
    return { lane: Math.max(0, (BOARD_SIZE * 2) - lane - 1), bounced: true, bank: 'CLOCKWISE' };
  }
  return null;
}

export function previewLaunch(state, command) {
  if (state.status !== 'PLAYING') return { valid: false, reason: 'The session is not active.' };
  const angleDelta = command.angleIndex ?? 0;
  const power = command.powerIndex ?? 2;
  const rawLane = (command.launcherIndex ?? 3) + Math.round((angleDelta * power) / 3);
  const laneResult = normalizeLane(rawLane, command.bounce ?? 'NONE');
  if (!laneResult) {
    const requiredBank = rawLane < 0 ? 'Counter bank' : 'Clockwise bank';
    return { valid: false, reason: `Trajectory exits the lattice. Select ${requiredBank}.` };
  }
  const { lane, bounced, bank } = laneResult;
  const cell = findCaptureCell(state.board, state.gravity, lane);
  if (!cell) return { valid: false, reason: 'The entry lane is blocked.' };
  const rank = state.queue[0];
  const fusionOptions = getFusionOptions(state.board, cell.row, cell.column, rank);
  const selectedFusion = fusionOptions.find((option) => option.direction === command.fusionDirection) ?? fusionOptions[0] ?? null;
  return {
    valid: true,
    lane,
    rawLane,
    cell,
    rank,
    bounced,
    bank,
    fusionOptions,
    selectedFusion,
    path: makePath(state.gravity, command.launcherIndex ?? 3, cell, bank)
  };
}

function makePath(direction, launcherIndex, cell, bank) {
  const start = direction === 'DOWN' ? { row: -0.8, column: launcherIndex }
    : direction === 'UP' ? { row: BOARD_SIZE - 0.2, column: launcherIndex }
      : direction === 'RIGHT' ? { row: launcherIndex, column: -0.8 }
        : { row: launcherIndex, column: BOARD_SIZE - 0.2 };
  if (!bank) return [start, cell];
  const counterEdge = bank === 'COUNTER';
  const edge = direction === 'DOWN' || direction === 'UP'
    ? { row: (start.row + cell.row) / 2, column: counterEdge ? -0.15 : BOARD_SIZE - 0.85 }
    : { row: counterEdge ? -0.15 : BOARD_SIZE - 0.85, column: (start.column + cell.column) / 2 };
  return [start, edge, cell];
}

export function findCaptureCell(board, direction, lane) {
  if (direction === 'DOWN') {
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      if (board[row][lane]) return row === 0 ? null : { row: row - 1, column: lane };
    }
    return { row: BOARD_SIZE - 1, column: lane };
  }
  if (direction === 'UP') {
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      if (board[row][lane]) return row === BOARD_SIZE - 1 ? null : { row: row + 1, column: lane };
    }
    return { row: 0, column: lane };
  }
  if (direction === 'RIGHT') {
    for (let column = 0; column < BOARD_SIZE; column += 1) {
      if (board[lane][column]) return column === 0 ? null : { row: lane, column: column - 1 };
    }
    return { row: lane, column: BOARD_SIZE - 1 };
  }
  for (let column = BOARD_SIZE - 1; column >= 0; column -= 1) {
    if (board[lane][column]) return column === BOARD_SIZE - 1 ? null : { row: lane, column: column + 1 };
  }
  return { row: lane, column: 0 };
}

function getFusionOptions(board, row, column, rank) {
  const options = [];
  for (const direction of FUSION_PRIORITY) {
    const [rowStep, columnStep] = ADJACENT[direction];
    const targetRow = row + rowStep;
    const targetColumn = column + columnStep;
    if (targetRow < 0 || targetRow >= BOARD_SIZE || targetColumn < 0 || targetColumn >= BOARD_SIZE) continue;
    const target = board[targetRow][targetColumn];
    if (target?.rank === rank) options.push({ direction, targetId: target.id, row: targetRow, column: targetColumn });
  }
  return options;
}

function event(state, type, detail = {}) {
  state.events.push({ type, turn: state.turn, ...detail });
}

function addScore(state, points, reason) {
  const delta = Math.round(points * state.multiplier);
  state.score += delta;
  event(state, 'SCORE_CHANGED', { delta, reason });
}

function findCore(board, id) {
  for (const row of board) for (const core of row) if (core?.id === id) return core;
  return null;
}

function resolveFusionChain(state, activeId, preferredDirection, eligibleIds = null) {
  let current = findCore(state.board, activeId);
  let preferred = preferredDirection;
  let safety = 0;
  while (current && safety < 8) {
    safety += 1;
    if (eligibleIds && !eligibleIds.has(current.id)) break;
    const options = getFusionOptions(state.board, current.row, current.column, current.rank);
    if (!options.length) break;
    const selected = options.find((option) => option.direction === preferred) ?? options[0];
    const target = state.board[selected.row][selected.column];
    if (!target) break;
    state.board[current.row][current.column] = null;
    state.board[selected.row][selected.column] = null;

    if (current.rank === 5) {
      state.stats.fusions += 1;
      state.stats.fluxBursts += 1;
      state.fluxChoices += 1;
      addScore(state, FLUX_BURST_SCORE, 'Flux Burst');
      event(state, 'FLUX_BURST', { cells: [{ row: current.row, column: current.column }, { row: target.row, column: target.column }] });
      current = null;
      break;
    }

    const nextRank = current.rank + 1;
    const nextCore = { id: current.id, rank: nextRank, row: current.row, column: current.column, anchorTurns: 0 };
    state.board[nextCore.row][nextCore.column] = nextCore;
    state.stats.fusions += 1;
    addScore(state, FUSION_SCORE[current.rank], `Rank ${current.rank} fusion`);
    event(state, 'FUSION_RESOLVED', { fromRank: current.rank, toRank: nextRank, cells: [{ row: current.row, column: current.column }, { row: target.row, column: target.column }] });
    current = nextCore;
    if (eligibleIds) eligibleIds.add(nextCore.id);
    preferred = null;
  }
}

function resolveQuints(state, source) {
  let cascade = 0;
  let totalLines = 0;
  while (cascade < 8) {
    const lines = findQuints(state.board);
    if (!lines.length) break;
    cascade += 1;
    totalLines += lines.length;
    const cross = hasCross(lines);
    const shift = source === 'SHIFT';
    const harmonicCount = lines.filter((line) => line.harmonic).length;
    const base = lines.reduce((sum, line) => sum + (line.harmonic ? HARMONIC_SCORE : QUINT_SCORE), 0);
    const shiftMultiplier = shift ? 1.5 : 1;
    const crossMultiplier = cross ? 1.75 : 1;
    const cascadeMultiplier = 1 + (cascade - 1) * 0.5;
    addScore(state, base * shiftMultiplier * crossMultiplier * cascadeMultiplier, `${source.toLowerCase()} Quint cascade`);
    const cells = quintUnion(lines);
    for (const cell of cells) state.board[cell.row][cell.column] = null;
    state.stats.quints += lines.length;
    state.stats.harmonicQuints += harmonicCount;
    if (shift) state.stats.shiftQuints += lines.length;
    if (cross) state.stats.crossQuints += 1;
    event(state, 'QUINT_COMPLETED', { lines, cells, source, cascade, cross });
    const gravityResult = applyGravity(state.board, state.gravity);
    state.board = gravityResult.board;
    resolveShiftFusions(state, gravityResult.movedIds);
  }
  if (cascade > 1) state.stats.cascades += 1;
  return totalLines;
}

function resolveShiftFusions(state, movedIds) {
  let safety = 0;
  while (safety < BOARD_SIZE * BOARD_SIZE) {
    safety += 1;
    let fused = false;
    for (const cell of gravityOrder(state.gravity)) {
      const core = state.board[cell.row][cell.column];
      if (!core || !movedIds.has(core.id)) continue;
      if (getFusionOptions(state.board, core.row, core.column, core.rank).length) {
        resolveFusionChain(state, core.id, null, movedIds);
        fused = true;
        break;
      }
    }
    if (!fused) break;
  }
}

function updateOccupancy(state) {
  const occupancy = state.board.flat().filter(Boolean).length;
  state.stats.maxOccupancy = Math.max(state.stats.maxOccupancy, occupancy);
  return occupancy;
}

function objectiveValue(state) {
  const type = state.objective?.type;
  if (type === 'turns') return state.turn;
  if (type === 'score') return state.score;
  if (type === 'fusions') return state.stats.fusions;
  if (type === 'quints') return state.stats.quints;
  if (type === 'harmonicQuints') return state.stats.harmonicQuints;
  if (type === 'shiftQuints') return state.stats.shiftQuints;
  if (type === 'fluxBursts') return state.stats.fluxBursts;
  return 0;
}

export function objectiveProgress(state) {
  if (!state.objective) return { complete: false, current: 0, target: 0 };
  const current = objectiveValue(state);
  return { complete: current >= state.objective.target, current, target: state.objective.target };
}

function checkEndState(state) {
  const progress = objectiveProgress(state);
  if (state.mode === 'campaign' && progress.complete) {
    state.status = 'COMPLETE';
    event(state, 'LEVEL_COMPLETE', { objective: state.objective });
    return;
  }
  if (state.mode === 'daily' && state.turn >= 25) {
    state.status = 'COMPLETE';
    event(state, 'DAILY_COMPLETE');
    return;
  }
  const hasLegalMove = Array.from({ length: BOARD_SIZE }, (_, launcherIndex) => launcherIndex)
    .some((launcherIndex) => previewLaunch(state, { launcherIndex, angleIndex: 0, powerIndex: 2, bounce: 'NONE' }).valid);
  if (!hasLegalMove) {
    state.status = 'GAME_OVER';
    event(state, 'GAME_OVER', { reason: 'No legal entry lane remains.' });
  }
}

export function commitLaunch(state, command) {
  const preview = previewLaunch(state, command);
  if (!preview.valid) return { state, events: [], error: preview.reason };
  state.events = [];
  state.turn += 1;
  state.stats.launches += 1;
  const rank = state.queue.shift();
  ensureQueue(state);
  const core = { id: nextId(state), rank, row: preview.cell.row, column: preview.cell.column, anchorTurns: 0 };
  state.board[core.row][core.column] = core;
  event(state, 'CORE_LAUNCHED', { rank, command: { ...command }, path: preview.path });
  event(state, 'CORE_CAPTURED', { coreId: core.id, rank, cell: preview.cell });

  resolveFusionChain(state, core.id, command.fusionDirection);
  resolveQuints(state, 'LAUNCH');
  state.launchesUntilShift -= 1;

  if (state.launchesUntilShift <= 0) {
    const requestedDirection = command.gravityChoice;
    let nextGravity = state.gravityPreview.shift();
    if (requestedDirection && state.fluxChoices > 0 && DIRECTIONS.includes(requestedDirection)) {
      nextGravity = requestedDirection;
      state.fluxChoices -= 1;
    }
    state.gravity = nextGravity;
    state.gravityPreview.push(nextDirection(state.gravity, state.random));
    state.launchesUntilShift = GRAVITY_INTERVAL;
    state.stats.gravityShifts += 1;
    event(state, 'GRAVITY_SHIFTED', { direction: state.gravity });
    const gravityResult = applyGravity(state.board, state.gravity);
    state.board = gravityResult.board;
    resolveShiftFusions(state, gravityResult.movedIds);
    resolveQuints(state, 'SHIFT');
  }

  state.replay.push({
    launcherIndex: command.launcherIndex, angleIndex: command.angleIndex, powerIndex: command.powerIndex,
    bounce: command.bounce, fusionDirection: command.fusionDirection ?? null, gravityChoice: command.gravityChoice ?? null
  });
  updateOccupancy(state);
  checkEndState(state);
  return { state, events: [...state.events], preview };
}

export function cycleLabCell(state, row, column) {
  if (state.mode !== 'lab') return state;
  const current = state.board[row][column];
  if (!current) state.board[row][column] = { id: nextId(state), rank: 1, row, column, anchorTurns: 0 };
  else if (current.rank < 5) state.board[row][column] = { ...current, rank: current.rank + 1 };
  else state.board[row][column] = null;
  updateOccupancy(state);
  return state;
}

export function chooseGravity(state, direction) {
  if (state.fluxChoices <= 0 || !DIRECTIONS.includes(direction)) return false;
  state.gravityPreview[0] = direction;
  state.fluxChoices -= 1;
  event(state, 'GRAVITY_PROGRAMMED', { direction });
  return true;
}

export function cloneSerializableState(state) {
  const { random, events, ...serializable } = state;
  return JSON.parse(JSON.stringify(serializable));
}

export function boardSignature(board) {
  return board.map((row) => row.map((core) => core?.rank ?? 0).join('')).join('/');
}
