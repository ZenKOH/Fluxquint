import { RULESET_VERSION } from './constants.js';
import { createGame, commitLaunch } from './game.js';

export const REPLAY_FORMAT_VERSION = '1.0';
const ALLOWED_MODES = new Set(['endless', 'daily', 'campaign', 'lab']);
const MAX_REPLAY_COMMANDS = 10000;

export function fnv1a(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function boardSnapshot(board) {
  return board.map((row) => row.map((core) => core ? {
    id: core.id,
    rank: core.rank,
    row: core.row,
    column: core.column,
    anchorTurns: core.anchorTurns ?? 0
  } : null));
}

export function stateChecksum(state) {
  return fnv1a(JSON.stringify({
    rulesetVersion: state.rulesetVersion,
    seed: state.seed,
    mode: state.mode,
    levelId: state.levelId,
    objective: state.objective,
    turn: state.turn,
    board: boardSnapshot(state.board),
    queue: state.queue,
    gravity: state.gravity,
    gravityPreview: state.gravityPreview,
    launchesUntilShift: state.launchesUntilShift,
    score: state.score,
    multiplier: state.multiplier,
    fluxChoices: state.fluxChoices,
    nextCoreId: state.nextCoreId,
    status: state.status,
    stats: state.stats,
    replayLength: state.replay.length
  }));
}

export function exportReplay(state) {
  return {
    formatVersion: REPLAY_FORMAT_VERSION,
    rulesetVersion: state.rulesetVersion,
    seed: state.seed,
    mode: state.mode,
    levelId: state.levelId,
    commands: state.replay.map((command) => ({ ...command })),
    finalStateHash: stateChecksum(state)
  };
}

export function verifyReplay(replay) {
  try {
    if (!replay || typeof replay !== 'object') return { valid: false, error: 'Replay must be an object.' };
    if (replay.formatVersion !== REPLAY_FORMAT_VERSION) return { valid: false, error: 'Unsupported replay format.' };
    if (replay.rulesetVersion !== RULESET_VERSION) return { valid: false, error: 'Replay ruleset does not match this build.' };
    if (!ALLOWED_MODES.has(replay.mode)) return { valid: false, error: 'Replay mode is invalid.' };
    if (!Array.isArray(replay.commands) || replay.commands.length > MAX_REPLAY_COMMANDS) {
      return { valid: false, error: 'Replay command list is invalid.' };
    }
    const state = createGame({ mode: replay.mode, levelId: replay.levelId, seed: replay.seed });
    for (const command of replay.commands) {
      if (!command || typeof command !== 'object') return { valid: false, error: 'Replay contains an invalid command.', state };
      const result = commitLaunch(state, command);
      if (result.error) return { valid: false, error: result.error, state };
    }
    const checksum = stateChecksum(state);
    return { valid: checksum === replay.finalStateHash, checksum, expected: replay.finalStateHash, state };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Replay verification failed.' };
  }
}
