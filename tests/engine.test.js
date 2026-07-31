import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, commitLaunch, previewLaunch, boardSignature, getDailySeed } from '../dist/src/engine/game.js';
import { emptyBoard, applyGravity } from '../dist/src/engine/gravity.js';
import { findQuints } from '../dist/src/engine/quints.js';
import { exportReplay, verifyReplay, stateChecksum } from '../dist/src/engine/replay.js';

function core(id, rank, row, column) {
  return { id, rank, row, column, anchorTurns: 0 };
}

test('the same seed creates the same Fluxquint™ state', () => {
  const first = createGame({ mode: 'endless', seed: 'DETERMINISM' });
  const second = createGame({ mode: 'endless', seed: 'DETERMINISM' });
  assert.equal(boardSignature(first.board), boardSignature(second.board));
  assert.deepEqual(first.queue.slice(0, 20), second.queue.slice(0, 20));
  assert.deepEqual(first.gravityPreview, second.gravityPreview);
});

test('findQuints detects basic and harmonic lines', () => {
  const board = emptyBoard();
  [1, 2, 3, 4, 5].forEach((rank, column) => { board[7][column] = core(`c${rank}`, rank, 7, column); });
  [1, 3, 5, 2, 4].forEach((rank, row) => { board[row][7] = core(`v${rank}`, rank, row, 7); });
  const lines = findQuints(board);
  assert.equal(lines.length, 2);
  assert.equal(lines.filter((line) => line.harmonic).length, 1);
});

test('gravity compacts Cores while preserving order', () => {
  const board = emptyBoard();
  board[0][2] = core('a', 1, 0, 2);
  board[3][2] = core('b', 2, 3, 2);
  const result = applyGravity(board, 'DOWN');
  assert.equal(result.board[7][2].id, 'b');
  assert.equal(result.board[6][2].id, 'a');
  assert.equal(result.movedIds.size, 2);
});

test('a captured equal Core fuses selectively', () => {
  const state = createGame({ mode: 'lab', seed: 'FUSION-TEST' });
  state.board = emptyBoard();
  state.queue = [1, 2, 3, 4, 1, 2, 3, 4];
  state.gravity = 'DOWN';
  state.gravityPreview = ['LEFT', 'UP'];
  state.launchesUntilShift = 5;
  state.board[7][3] = core('target', 1, 7, 3);
  const command = { launcherIndex: 3, angleIndex: 0, powerIndex: 2, bounce: 'NONE', fusionDirection: 'DOWN' };
  const preview = previewLaunch(state, command);
  assert.equal(preview.valid, true);
  assert.deepEqual(preview.cell, { row: 6, column: 3 });
  commitLaunch(state, command);
  assert.equal(state.board[6][3].rank, 2);
  assert.equal(state.board[7][3], null);
  assert.equal(state.stats.fusions, 1);
});

test('a completed 1–5 line clears and scores', () => {
  const state = createGame({ mode: 'lab', seed: 'QUINT-TEST' });
  state.board = emptyBoard();
  state.queue = [5, 1, 2, 3, 4, 1, 2, 3];
  state.gravity = 'DOWN';
  state.gravityPreview = ['LEFT', 'UP'];
  state.launchesUntilShift = 5;
  [1, 2, 3, 4].forEach((rank, column) => { state.board[7][column] = core(`q${rank}`, rank, 7, column); });
  const result = commitLaunch(state, { launcherIndex: 4, angleIndex: 0, powerIndex: 2, bounce: 'NONE' });
  assert.equal(result.error, undefined);
  assert.equal(state.stats.quints, 1);
  assert.equal(state.stats.harmonicQuints, 1);
  assert.equal(state.board[7].slice(0, 5).every((cell) => cell === null), true);
  assert.ok(state.score >= 1000);
});

test('exported replays reproduce the final checksum', () => {
  const state = createGame({ mode: 'endless', seed: 'REPLAY-TEST' });
  for (let turn = 0; turn < 3; turn += 1) {
    let committed = false;
    for (let launcherIndex = 0; launcherIndex < 8 && !committed; launcherIndex += 1) {
      const command = { launcherIndex, angleIndex: 0, powerIndex: 2, bounce: 'NONE' };
      if (previewLaunch(state, command).valid) {
        commitLaunch(state, command);
        committed = true;
      }
    }
    assert.equal(committed, true);
  }
  const replay = exportReplay(state);
  assert.equal(replay.finalStateHash, stateChecksum(state));
  const verified = verifyReplay(replay);
  assert.equal(verified.valid, true);
});

test('Campaign Shift level completes through forecast gravity', () => {
  const state = createGame({ mode: 'campaign', levelId: 'shift' });
  const result = commitLaunch(state, { launcherIndex: 4, angleIndex: 0, powerIndex: 2, bounce: 'NONE' });
  assert.equal(result.error, undefined);
  assert.equal(state.stats.shiftQuints, 1);
  assert.equal(state.status, 'COMPLETE');
});

test('a Flux Choice is replay-safe when used on a shift turn', () => {
  const state = createGame({ mode: 'lab', seed: 'FLUX-CHOICE' });
  state.board = emptyBoard();
  state.queue = [1, 2, 3, 4, 1, 2, 3, 4];
  state.gravity = 'DOWN';
  state.gravityPreview = ['LEFT', 'UP'];
  state.launchesUntilShift = 1;
  state.fluxChoices = 1;
  commitLaunch(state, { launcherIndex: 0, angleIndex: 0, powerIndex: 2, bounce: 'NONE', gravityChoice: 'RIGHT' });
  assert.equal(state.gravity, 'RIGHT');
  assert.equal(state.fluxChoices, 0);
});

test('Daily Quint uses one UTC seed across local time zones', () => {
  assert.equal(getDailySeed(new Date('2026-07-31T23:59:59-07:00')), 'FQ-DAILY-2026-08-01');
  assert.equal(getDailySeed(new Date('2026-08-01T07:00:00+08:00')), 'FQ-DAILY-2026-07-31');
});

test('Counter and clockwise banks are distinct and direction-gated', () => {
  const state = createGame({ mode: 'lab', seed: 'BANK-TEST' });
  state.board = emptyBoard();
  state.queue = [1, 2, 3, 4, 1, 2, 3, 4];
  state.gravity = 'DOWN';
  const counter = previewLaunch(state, { launcherIndex: 0, angleIndex: -4, powerIndex: 3, bounce: 'COUNTER' });
  const wrongCounter = previewLaunch(state, { launcherIndex: 0, angleIndex: -4, powerIndex: 3, bounce: 'CLOCKWISE' });
  const clockwise = previewLaunch(state, { launcherIndex: 7, angleIndex: 4, powerIndex: 3, bounce: 'CLOCKWISE' });
  const wrongClockwise = previewLaunch(state, { launcherIndex: 7, angleIndex: 4, powerIndex: 3, bounce: 'COUNTER' });
  assert.equal(counter.valid, true);
  assert.equal(counter.bank, 'COUNTER');
  assert.equal(counter.lane, 3);
  assert.equal(wrongCounter.valid, false);
  assert.equal(clockwise.valid, true);
  assert.equal(clockwise.bank, 'CLOCKWISE');
  assert.equal(clockwise.lane, 4);
  assert.equal(wrongClockwise.valid, false);
});

test('replay verification rejects mismatched rulesets and tampering', () => {
  const state = createGame({ mode: 'endless', seed: 'REPLAY-HARDENING' });
  const command = { launcherIndex: 0, angleIndex: 0, powerIndex: 2, bounce: 'NONE' };
  commitLaunch(state, command);
  const replay = exportReplay(state);
  assert.equal(verifyReplay(replay).valid, true);
  assert.equal(verifyReplay({ ...replay, rulesetVersion: '0.0.0' }).valid, false);
  assert.equal(verifyReplay({ ...replay, finalStateHash: '00000000' }).valid, false);
});
