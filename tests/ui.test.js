import test from 'node:test';
import assert from 'node:assert/strict';
import { GameApp } from '../dist/src/ui/app.js';

test('first-run help dismissal persists and immediately re-renders', () => {
  const previous = globalThis.localStorage;
  const writes = [];
  globalThis.localStorage = { setItem: (...args) => writes.push(args) };
  const subject = { showHelp: true, renders: 0, render() { this.renders += 1; } };
  GameApp.prototype.closeHelp.call(subject);
  assert.equal(subject.showHelp, false);
  assert.equal(subject.renders, 1);
  assert.deepEqual(writes[0], ['fluxquint-trademark:welcomed', '1']);
  globalThis.localStorage = previous;
});

test('settings backdrop ignores clicks inside the modal', () => {
  const subject = { showSettings: true, renders: 0, render() { this.renders += 1; } };
  const backdrop = { dataset: { action: 'settings-backdrop' } };
  GameApp.prototype.closeSettings.call(subject, { currentTarget: backdrop, target: {} });
  assert.equal(subject.showSettings, true);
  assert.equal(subject.renders, 0);
  GameApp.prototype.closeSettings.call(subject, { currentTarget: backdrop, target: backdrop });
  assert.equal(subject.showSettings, false);
  assert.equal(subject.renders, 1);
});
