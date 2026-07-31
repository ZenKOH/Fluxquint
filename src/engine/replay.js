import { createGame, commitLaunch, boardSignature } from './game.js';

export function fnv1a(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function stateChecksum(state) {
  return fnv1a(JSON.stringify({
    rulesetVersion: state.rulesetVersion,
    seed: state.seed,
    turn: state.turn,
    board: boardSignature(state.board),
    queue: state.queue.slice(0, 12),
    gravity: state.gravity,
    gravityPreview: state.gravityPreview,
    launchesUntilShift: state.launchesUntilShift,
    score: state.score,
    stats: state.stats
  }));
}

export function exportReplay(state) {
  return {
    formatVersion: '1.0',
    rulesetVersion: state.rulesetVersion,
    seed: state.seed,
    mode: state.mode,
    levelId: state.levelId,
    commands: state.replay,
    finalStateHash: stateChecksum(state)
  };
}

export function verifyReplay(replay) {
  const state = createGame({ mode: replay.mode, levelId: replay.levelId, seed: replay.seed });
  for (const command of replay.commands) {
    const result = commitLaunch(state, command);
    if (result.error) return { valid: false, error: result.error, state };
  }
  const checksum = stateChecksum(state);
  return { valid: checksum === replay.finalStateHash, checksum, expected: replay.finalStateHash, state };
}
