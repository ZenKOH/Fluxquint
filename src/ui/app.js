import { BRAND, BOARD_SIZE, DIRECTION_LABEL, DIRECTION_SYMBOL } from '../engine/constants.js';
import { createGame, commitLaunch, previewLaunch, cycleLabCell, objectiveProgress } from '../engine/game.js';
import { exportReplay, stateChecksum } from '../engine/replay.js';
import { CAMPAIGN_LEVELS } from '../engine/campaign.js';
import { loadProgress, loadSettings, saveProgress, saveSettings } from './storage.js';
import { playQuint, playTone } from './sound.js';

const ICONS = {
  endless: '<path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4m14-2v2a4 4 0 01-4 4H3"/>',
  daily: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4m8-4v4M3 10h18"/>',
  campaign: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20V3H6.5A2.5 2.5 0 004 5.5v14z"/><path d="M8 7h8m-8 4h6"/>',
  lab: '<path d="M9 3h6m-5 0v6l-5.5 9.5A2 2 0 006.2 22h11.6a2 2 0 001.7-3.5L14 9V3"/><path d="M8 15h8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.6V21h-4v-.1A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 00.3-1.9A1.7 1.7 0 003 14H3v-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 009 4.6 1.7 1.7 0 0010 3V3h4v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 00-.3 1.9A1.7 1.7 0 0021 10h.1v4H21a1.7 1.7 0 00-1.6 1z"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 115.8 1c0 2-3 2-3 4m.1 4h.01"/>'
};

function icon(name, size = 20) {
  return `<svg aria-hidden="true" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ''}</svg>`;
}

function brandMark() {
  return `<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" opacity=".24"/><circle cx="32" cy="32" r="19" class="brand-orb"/><circle cx="32" cy="32" r="10" fill="var(--surface-0)" opacity=".88"/><path d="M17 32h30M32 17v30" stroke="white" stroke-width="2.8" stroke-linecap="round"/><circle cx="32" cy="32" r="3" fill="white"/></svg>`;
}

function coreGlyph(rank, symbolic) {
  const symbols = ['•', 'Ⅱ', '△', '✣', '✦'];
  return symbolic ? symbols[rank - 1] : rank;
}

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
}

export class GameApp {
  constructor(root) {
    this.root = root;
    this.settings = loadSettings();
    this.progress = loadProgress();
    this.mode = 'endless';
    this.levelId = CAMPAIGN_LEVELS[0].id;
    this.state = createGame({ mode: this.mode });
    this.controls = { launcherIndex: 3, angleIndex: 0, powerIndex: 2, bounce: 'NONE', fusionDirection: null, gravityChoice: null };
    this.showSettings = false;
    this.showHelp = !localStorage.getItem('fluxquint-trademark:welcomed');
    this.toastTimer = null;
    this.animationLock = false;
    this.eventLog = ['Session initialised. Read the field, then commit a launch.'];
    this.installPrompt = null;
    window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); this.installPrompt = event; this.render(); });
    this.bindKeyboard();
    this.render();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      if (event.target.matches('input, textarea, select')) return;
      if (this.showHelp || this.showSettings) {
        if (event.key === 'Escape') {
          if (this.showHelp) this.closeHelp();
          else this.closeSettings();
        }
        return;
      }
      if (event.key === 'ArrowLeft') this.controls.launcherIndex = Math.max(0, this.controls.launcherIndex - 1);
      else if (event.key === 'ArrowRight') this.controls.launcherIndex = Math.min(7, this.controls.launcherIndex + 1);
      else if (event.key === 'ArrowUp') this.controls.angleIndex = Math.min(4, this.controls.angleIndex + 1);
      else if (event.key === 'ArrowDown') this.controls.angleIndex = Math.max(-4, this.controls.angleIndex - 1);
      else if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); this.launch(); return; }
      else if (event.key.toLowerCase() === 'r') { this.restart(); return; }
      else return;
      this.render();
    });
  }

  setMode(mode, levelId = this.levelId) {
    this.mode = mode;
    this.levelId = levelId;
    this.state = createGame({ mode, levelId });
    this.controls = { launcherIndex: 3, angleIndex: 0, powerIndex: 2, bounce: 'NONE', fusionDirection: null, gravityChoice: null };
    this.eventLog = [`${mode === 'campaign' ? 'Campaign level' : mode[0].toUpperCase() + mode.slice(1)} initialised.`];
    this.render();
  }

  restart() {
    this.setMode(this.mode, this.levelId);
  }

  preview() {
    return previewLaunch(this.state, this.controls);
  }

  async launch() {
    if (this.animationLock || this.state.status !== 'PLAYING') return;
    const preview = this.preview();
    if (!preview.valid) { this.toast(preview.reason); return; }
    this.animationLock = true;
    this.render();
    await this.animateProjectile(preview);
    const result = commitLaunch(this.state, this.controls);
    this.controls.fusionDirection = null;
    if (result.events.some((item) => item.type === 'GRAVITY_SHIFTED')) this.controls.gravityChoice = null;
    this.describeEvents(result.events);
    this.persistProgress();
    this.animationLock = false;
    this.render();
  }

  animateProjectile(preview) {
    if (this.settings.reducedMotion) return Promise.resolve();
    return new Promise((resolve) => {
      const board = this.root.querySelector('.board-shell');
      if (!board) { resolve(); return; }
      const traveller = document.createElement('div');
      traveller.className = `traveller rank-${preview.rank}`;
      traveller.textContent = coreGlyph(preview.rank, this.settings.symbolic);
      board.appendChild(traveller);
      const start = preview.path[0];
      const end = preview.path[preview.path.length - 1];
      const x = (end.column + 0.5) / BOARD_SIZE * 100;
      const y = (end.row + 0.5) / BOARD_SIZE * 100;
      const startX = (start.column + 0.5) / BOARD_SIZE * 100;
      const startY = (start.row + 0.5) / BOARD_SIZE * 100;
      traveller.style.left = `${startX}%`;
      traveller.style.top = `${startY}%`;
      requestAnimationFrame(() => {
        traveller.style.left = `${x}%`;
        traveller.style.top = `${y}%`;
      });
      setTimeout(() => { traveller.remove(); resolve(); }, 360);
    });
  }

  describeEvents(events) {
    for (const item of events) {
      if (item.type === 'FUSION_RESOLVED') {
        this.eventLog.unshift(`Fusion: rank ${item.fromRank} became rank ${item.toRank}.`);
        if (this.settings.sound) playTone(item.toRank);
      } else if (item.type === 'QUINT_COMPLETED') {
        const harmonic = item.lines.some((line) => line.harmonic);
        this.eventLog.unshift(`${harmonic ? 'Harmonic ' : ''}${item.source === 'SHIFT' ? 'Shift ' : ''}Quint completed${item.cascade > 1 ? ` — cascade ${item.cascade}` : ''}.`);
        if (this.settings.sound) playQuint(harmonic);
      } else if (item.type === 'GRAVITY_SHIFTED') {
        this.eventLog.unshift(`Gravity shifted ${DIRECTION_LABEL[item.direction].toLowerCase()}.`);
      } else if (item.type === 'FLUX_BURST') {
        this.eventLog.unshift('Flux Burst earned one gravity intervention.');
      } else if (item.type === 'LEVEL_COMPLETE') {
        this.eventLog.unshift('Level complete. Resonance stabilised.');
      } else if (item.type === 'GAME_OVER') {
        this.eventLog.unshift('No legal entry lane remains.');
      }
    }
    this.eventLog = this.eventLog.slice(0, 8);
  }

  persistProgress() {
    const key = `${this.mode}:${this.levelId ?? this.state.seed}`;
    this.progress.best[key] = Math.max(this.progress.best[key] ?? 0, this.state.score);
    if (this.mode === 'campaign' && this.state.status === 'COMPLETE' && !this.progress.completedLevels.includes(this.levelId)) {
      this.progress.completedLevels.push(this.levelId);
    }
    saveProgress(this.progress);
  }

  toast(message) {
    clearTimeout(this.toastTimer);
    const toast = this.root.querySelector('.toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    this.toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  async share() {
    const replay = exportReplay(this.state);
    const text = `${BRAND} ${this.mode === 'daily' ? todayLabel() : this.mode}\nScore ${this.state.score.toLocaleString()} · Quints ${this.state.stats.quints} · Shift ${this.state.stats.shiftQuints}\nReplay ${replay.finalStateHash}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: BRAND, text });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        this.toast('Result copied to clipboard.');
        return;
      }
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      this.toast(copied ? 'Result copied to clipboard.' : text);
    } catch {
      this.toast('Sharing was cancelled or unavailable.');
    }
  }

  exportReplay() {
    const replay = JSON.stringify(exportReplay(this.state), null, 2);
    const blob = new Blob([replay], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fluxquint-trademark-${stateChecksum(this.state)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  closeHelp() {
    try { localStorage.setItem('fluxquint-trademark:welcomed', '1'); } catch {}
    this.showHelp = false;
    this.render();
  }

  closeSettings(event = null) {
    if (event?.currentTarget?.dataset.action === 'settings-backdrop' && event.target !== event.currentTarget) return;
    this.showSettings = false;
    this.render();
  }

  cycleLab(row, column) {
    if (this.mode !== 'lab') return;
    cycleLabCell(this.state, row, column);
    this.render();
  }

  setSetting(key, value) {
    this.settings[key] = value;
    saveSettings(this.settings);
    this.render();
  }

  async install() {
    if (!this.installPrompt) return;
    await this.installPrompt.prompt();
    this.installPrompt = null;
    this.render();
  }

  render() {
    document.documentElement.dataset.contrast = this.settings.highContrast ? 'high' : 'standard';
    document.documentElement.dataset.motion = this.settings.reducedMotion ? 'reduced' : 'full';
    const preview = this.preview();
    const objective = objectiveProgress(this.state);
    const level = CAMPAIGN_LEVELS.find((item) => item.id === this.levelId);
    this.root.innerHTML = `
      <div class="app-shell mode-${this.mode}">
        ${this.renderHeader()}
        <main class="workspace">
          ${this.renderMission(level, objective)}
          <section class="game-stage" aria-label="Fluxquint™ game stage">
            ${this.renderStatusBar()}
            ${this.renderBoard(preview)}
            ${this.renderQueue()}
          </section>
          ${this.renderControls(preview)}
        </main>
        ${this.renderFooter()}
        <div class="toast" role="status" aria-live="polite"></div>
        ${this.showSettings ? this.renderSettings() : ''}
        ${this.showHelp ? this.renderHelp() : ''}
        ${this.state.status !== 'PLAYING' ? this.renderResult() : ''}
      </div>`;
    this.attachEvents();
  }

  renderHeader() {
    return `<header class="topbar">
      <button class="brand" data-action="home" aria-label="Restart Fluxquint™">
        ${brandMark()}<span><strong>${BRAND}</strong><small>Kinetic logic strategy</small></span>
      </button>
      <nav class="mode-nav" aria-label="Game modes">
        ${this.modeButton('endless', 'Endless', 'endless')}
        ${this.modeButton('daily', 'Daily', 'daily')}
        ${this.modeButton('campaign', 'Campaign', 'campaign')}
        ${this.modeButton('lab', 'Laboratory', 'lab')}
      </nav>
      <div class="top-actions">
        ${this.installPrompt ? '<button class="button ghost compact" data-action="install">Install</button>' : ''}
        <button class="icon-button" data-action="help" aria-label="How to play">${icon('help')}</button>
        <button class="icon-button" data-action="settings" aria-label="Settings">${icon('settings')}</button>
      </div>
    </header>`;
  }

  modeButton(mode, label, iconName) {
    return `<button class="mode-button ${this.mode === mode ? 'active' : ''}" data-mode="${mode}" aria-pressed="${this.mode === mode}">${icon(iconName, 18)}<span>${label}</span></button>`;
  }

  renderMission(level, objective) {
    const missionTitle = this.mode === 'campaign' ? `${level.chapter} · ${level.title}`
      : this.mode === 'daily' ? `Daily Quint · ${todayLabel()}`
        : this.mode === 'lab' ? 'Creative Laboratory' : 'Endless Flux';
    const missionDescription = this.mode === 'campaign' ? level.description
      : this.mode === 'daily' ? 'One seed. Twenty-five launches. Build the strongest verified run.'
        : this.mode === 'lab' ? 'Click any lattice cell to cycle its rank. Design, test and reset freely.'
          : 'Survive the field. Build deliberate Quints before the lattice closes.';
    return `<aside class="mission-panel">
      <div class="eyebrow">Current mission</div>
      <h1>${missionTitle}</h1>
      <p>${missionDescription}</p>
      ${this.mode === 'campaign' ? `
        <div class="objective-card">
          <span>Objective</span><strong>${objective.current.toLocaleString()} / ${objective.target.toLocaleString()}</strong>
          <div class="progress"><i style="width:${Math.min(100, objective.target ? objective.current / objective.target * 100 : 0)}%"></i></div>
        </div>
        <div class="chapter-list">${CAMPAIGN_LEVELS.map((item) => `<button data-level="${item.id}" class="chapter ${item.id === this.levelId ? 'active' : ''} ${this.progress.completedLevels.includes(item.id) ? 'complete' : ''}"><span>${item.chapter}</span><b>${item.title}</b><em>${this.progress.completedLevels.includes(item.id) ? '✓' : ''}</em></button>`).join('')}</div>` : ''}
      <div class="rule-stack">
        <div><i>1</i><span><b>Fuse equals</b><small>Matching ranks compound.</small></span></div>
        <div><i>2</i><span><b>Complete 1–5</b><small>Any straight five-rank line clears.</small></span></div>
        <div><i>3</i><span><b>Read gravity</b><small>Plan around the forecast shift.</small></span></div>
      </div>
      <div class="event-log"><div class="eyebrow">Resolution log</div>${this.eventLog.map((entry) => `<p>${entry}</p>`).join('')}</div>
    </aside>`;
  }

  renderStatusBar() {
    return `<div class="status-bar">
      <div><span>Score</span><strong>${this.state.score.toLocaleString()}</strong></div>
      <div><span>Turn</span><strong>${this.state.turn}${this.mode === 'daily' ? '/25' : ''}</strong></div>
      <div><span>Quints</span><strong>${this.state.stats.quints}</strong></div>
      <div class="gravity-status"><span>Gravity</span><strong>${DIRECTION_SYMBOL[this.state.gravity]} ${DIRECTION_LABEL[this.state.gravity]}</strong></div>
      <div><span>Shift in</span><strong>${this.state.launchesUntilShift}</strong></div>
    </div>`;
  }

  renderBoard(preview) {
    const targetKey = preview.valid ? `${preview.cell.row}:${preview.cell.column}` : '';
    const fusionTargetKey = preview.selectedFusion ? `${preview.selectedFusion.row}:${preview.selectedFusion.column}` : '';
    const cells = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let column = 0; column < BOARD_SIZE; column += 1) {
        const core = this.state.board[row][column];
        const key = `${row}:${column}`;
        cells.push(`<button class="cell ${key === targetKey ? 'target' : ''} ${key === fusionTargetKey ? 'fusion-target' : ''}" data-cell="${row},${column}" aria-label="${core ? `Rank ${core.rank} Core at row ${row + 1}, column ${column + 1}` : `Empty cell row ${row + 1}, column ${column + 1}`}">
          ${core ? `<span class="core rank-${core.rank}" data-core-id="${core.id}"><i></i><b>${coreGlyph(core.rank, this.settings.symbolic)}</b></span>` : ''}
          ${key === targetKey && !core ? `<span class="capture-ghost rank-${preview.rank}">${coreGlyph(preview.rank, this.settings.symbolic)}</span>` : ''}
        </button>`);
      }
    }
    return `<div class="board-zone gravity-${this.state.gravity.toLowerCase()}">
      ${this.renderLauncher()}
      <div class="board-shell" id="game-board" role="grid" aria-label="8 by 8 magnetic lattice">
        <div class="field-lines" aria-hidden="true"></div>
        <svg class="trajectory" viewBox="0 0 800 800" preserveAspectRatio="none" aria-hidden="true">${preview.valid ? this.renderPath(preview.path) : ''}</svg>
        <div class="board-grid">${cells.join('')}</div>
      </div>
      <div class="gravity-orbit" aria-label="Current gravity ${DIRECTION_LABEL[this.state.gravity]}">${DIRECTION_SYMBOL[this.state.gravity]}</div>
    </div>`;
  }

  renderPath(path) {
    const points = path.map((point) => `${(point.column + 0.5) * 100},${(point.row + 0.5) * 100}`).join(' ');
    return `<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="10 12" vector-effect="non-scaling-stroke"/><circle cx="${(path.at(-1).column + 0.5) * 100}" cy="${(path.at(-1).row + 0.5) * 100}" r="12" fill="none" stroke="currentColor" stroke-width="4" vector-effect="non-scaling-stroke"/>`;
  }

  renderLauncher() {
    const positions = Array.from({ length: 8 }, (_, index) => `<button class="launcher-node ${this.controls.launcherIndex === index ? 'active' : ''}" data-launcher="${index}" aria-label="Launcher position ${index + 1}"><span>${index + 1}</span></button>`).join('');
    return `<div class="launcher-rail" aria-label="Launcher rail">${positions}</div>`;
  }

  renderQueue() {
    return `<div class="queue-panel">
      <span class="eyebrow">Incoming sequence</span>
      <div class="queue">${this.state.queue.slice(0, 5).map((rank, index) => `<div class="queue-core rank-${rank} ${index === 0 ? 'next' : ''}"><span>${coreGlyph(rank, this.settings.symbolic)}</span><small>${index === 0 ? 'NEXT' : `+${index}`}</small></div>`).join('')}</div>
      <div class="forecast"><span>Forecast</span>${this.state.gravityPreview.map((direction, index) => `<button disabled title="Forecast gravity"><b>${DIRECTION_SYMBOL[direction]}</b><small>${index === 0 ? 'Next' : 'Later'}</small></button>`).join('')}<em>${this.state.fluxChoices} Flux Choice${this.state.fluxChoices === 1 ? '' : 's'}</em></div>
      ${this.state.fluxChoices > 0 ? `<div class="gravity-programmer"><span>Program next shift</span>${['UP','RIGHT','DOWN','LEFT'].map((direction) => `<button data-gravity="${direction}" class="${this.controls.gravityChoice === direction ? 'active' : ''}" aria-label="Program next gravity ${DIRECTION_LABEL[direction]}">${DIRECTION_SYMBOL[direction]}</button>`).join('')}</div>` : ''}
    </div>`;
  }

  renderControls(preview) {
    const fusionOptions = preview.valid ? preview.fusionOptions : [];
    return `<aside class="control-panel">
      <div class="control-heading"><div><span class="eyebrow">Launch console</span><h2>Commit one precise move</h2></div><span class="checksum">${stateChecksum(this.state)}</span></div>
      <div class="control-group">
        <label>Launcher position <output>${this.controls.launcherIndex + 1}</output></label>
        <input data-control="launcherIndex" type="range" min="0" max="7" step="1" value="${this.controls.launcherIndex}" />
        <div class="scale"><span>1</span><span>8</span></div>
      </div>
      <div class="control-group">
        <label>Aim vector <output>${this.controls.angleIndex > 0 ? '+' : ''}${this.controls.angleIndex}</output></label>
        <input data-control="angleIndex" type="range" min="-4" max="4" step="1" value="${this.controls.angleIndex}" />
        <div class="scale"><span>Counter</span><span>Direct</span><span>Clockwise</span></div>
      </div>
      <div class="control-group segmented-group">
        <label>Impulse</label>
        <div class="segmented">${[1, 2, 3].map((power) => `<button data-power="${power}" class="${this.controls.powerIndex === power ? 'active' : ''}">${['Soft', 'True', 'Deep'][power - 1]}</button>`).join('')}</div>
      </div>
      <div class="control-group segmented-group">
        <label>Bank protocol</label>
        <div class="segmented">${['NONE', 'COUNTER', 'CLOCKWISE'].map((bounce) => `<button data-bounce="${bounce}" class="${this.controls.bounce === bounce ? 'active' : ''}">${bounce === 'NONE' ? 'Direct' : bounce === 'COUNTER' ? 'Counter bank' : 'Clockwise bank'}</button>`).join('')}</div>
      </div>
      <div class="control-group">
        <label>Selective fusion</label>
        <div class="fusion-options">${fusionOptions.length ? fusionOptions.map((option) => `<button data-fusion="${option.direction}" class="${(this.controls.fusionDirection ?? fusionOptions[0].direction) === option.direction ? 'active' : ''}">${DIRECTION_SYMBOL[option.direction]} ${option.direction.toLowerCase()}</button>`).join('') : '<span>No equal neighbour at capture.</span>'}</div>
      </div>
      <div class="prediction ${preview.valid ? 'valid' : 'invalid'}">
        <span>${preview.valid ? 'Predicted capture' : 'Trajectory unavailable'}</span>
        <strong>${preview.valid ? `R${preview.cell.row + 1} · C${preview.cell.column + 1}` : preview.reason}</strong>
        ${preview.valid ? `<small>${preview.bounced ? 'One controlled bank · ' : ''}${preview.selectedFusion ? `Fusion ${preview.selectedFusion.direction.toLowerCase()}` : 'Stable capture'}</small>` : ''}
      </div>
      <button class="button launch-button" data-action="launch" ${!preview.valid || this.animationLock ? 'disabled' : ''}>
        <span>Launch rank ${this.state.queue[0]}</span><kbd>Space</kbd>
      </button>
      <div class="secondary-actions">
        <button class="button ghost" data-action="restart">Restart</button>
        <button class="button ghost" data-action="share">Share</button>
        <button class="button ghost" data-action="export">Replay</button>
      </div>
      <p class="control-note">Arrow keys adjust position and vector. Space commits. R restarts.</p>
    </aside>`;
  }

  renderFooter() {
    return `<footer><span>${BRAND} · Ruleset ${this.state.rulesetVersion}</span><span>Deterministic by design · Offline ready · No personal data required</span></footer>`;
  }

  renderSettings() {
    return `<div class="modal-backdrop" data-action="settings-backdrop"><section class="modal settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" data-modal>
      <div class="modal-head"><div><span class="eyebrow">Interface</span><h2 id="settings-title">Settings</h2></div><button class="icon-button" data-action="close-settings" aria-label="Close settings">×</button></div>
      ${this.settingToggle('sound', 'Sound cues', 'Hear rank intervals, fusion and Quint resolution.')}
      ${this.settingToggle('reducedMotion', 'Reduced motion', 'Replace projectile travel and pulses with immediate state changes.')}
      ${this.settingToggle('highContrast', 'High contrast', 'Increase field, text and trajectory contrast.')}
      ${this.settingToggle('symbolic', 'Symbolic ranks', 'Use geometric glyphs in addition to colour differentiation.')}
      <p class="fine-print">Every critical cue remains available visually. Fluxquint™ does not require colour or sound to play.</p>
    </section></div>`;
  }

  settingToggle(key, title, description) {
    return `<label class="setting-row"><span><b>${title}</b><small>${description}</small></span><input type="checkbox" data-setting="${key}" ${this.settings[key] ? 'checked' : ''}/><i></i></label>`;
  }

  renderHelp() {
    return `<div class="modal-backdrop"><section class="modal help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title">
      <div class="help-visual">${brandMark()}<div class="mini-quint">${[1, 2, 3, 4, 5].map((rank) => `<span class="rank-${rank}">${coreGlyph(rank, this.settings.symbolic)}</span>`).join('')}</div></div>
      <span class="eyebrow">Welcome to</span><h2 id="help-title">${BRAND}</h2>
      <p>Launch ranked Cores into a shifting magnetic lattice. The field is deterministic: every forecasted move resolves the same way.</p>
      <div class="help-rules">
        <div><i>01</i><span><b>Aim and capture</b><small>The dotted path marks the authoritative destination.</small></span></div>
        <div><i>02</i><span><b>Fuse equal ranks</b><small>1 + 1 becomes 2, continuing until rank 5.</small></span></div>
        <div><i>03</i><span><b>Complete the five</b><small>A straight line containing 1, 2, 3, 4 and 5 clears.</small></span></div>
        <div><i>04</i><span><b>Control the shift</b><small>Every five launches, forecast gravity reorganises the lattice.</small></span></div>
      </div>
      <button class="button launch-button" data-action="close-help">Enter the lattice</button>
    </section></div>`;
  }

  renderResult() {
    const complete = this.state.status === 'COMPLETE';
    const nextLevelIndex = CAMPAIGN_LEVELS.findIndex((item) => item.id === this.levelId) + 1;
    const hasNextLevel = this.mode === 'campaign' && nextLevelIndex < CAMPAIGN_LEVELS.length;
    return `<div class="modal-backdrop"><section class="modal result-modal" role="dialog" aria-modal="true">
      <div class="result-orb">${complete ? '✦' : '×'}</div>
      <span class="eyebrow">${complete ? 'Field stabilised' : 'Lattice closed'}</span>
      <h2>${complete ? 'Resonance achieved' : 'Run complete'}</h2>
      <p>${complete ? 'The objective has been satisfied with a fully reproducible result.' : 'No legal entry lane remains. The next run starts from a clean deterministic field.'}</p>
      <div class="result-stats"><div><span>Score</span><b>${this.state.score.toLocaleString()}</b></div><div><span>Quints</span><b>${this.state.stats.quints}</b></div><div><span>Cascades</span><b>${this.state.stats.cascades}</b></div></div>
      <div class="result-actions">
        <button class="button ghost" data-action="share">Share result</button>
        ${hasNextLevel ? `<button class="button launch-button" data-next-level="${CAMPAIGN_LEVELS[nextLevelIndex].id}">Next level</button>` : '<button class="button launch-button" data-action="restart">Run again</button>'}
      </div>
    </section></div>`;
  }

  attachEvents() {
    this.root.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => this.setMode(button.dataset.mode)));
    this.root.querySelectorAll('[data-level]').forEach((button) => button.addEventListener('click', () => this.setMode('campaign', button.dataset.level)));
    this.root.querySelectorAll('[data-next-level]').forEach((button) => button.addEventListener('click', () => this.setMode('campaign', button.dataset.nextLevel)));
    this.root.querySelectorAll('[data-launcher]').forEach((button) => button.addEventListener('click', () => { this.controls.launcherIndex = Number(button.dataset.launcher); this.render(); }));
    this.root.querySelectorAll('[data-control]').forEach((input) => input.addEventListener('input', () => { this.controls[input.dataset.control] = Number(input.value); this.render(); }));
    this.root.querySelectorAll('[data-power]').forEach((button) => button.addEventListener('click', () => { this.controls.powerIndex = Number(button.dataset.power); this.render(); }));
    this.root.querySelectorAll('[data-bounce]').forEach((button) => button.addEventListener('click', () => { this.controls.bounce = button.dataset.bounce; this.render(); }));
    this.root.querySelectorAll('[data-fusion]').forEach((button) => button.addEventListener('click', () => { this.controls.fusionDirection = button.dataset.fusion; this.render(); }));
    this.root.querySelectorAll('[data-gravity]').forEach((button) => button.addEventListener('click', () => { this.controls.gravityChoice = button.dataset.gravity; this.toast(`Next gravity queued ${button.dataset.gravity.toLowerCase()}.`); this.render(); }));
    this.root.querySelectorAll('[data-cell]').forEach((button) => button.addEventListener('click', () => { const [row, column] = button.dataset.cell.split(',').map(Number); this.cycleLab(row, column); }));
    this.root.querySelectorAll('[data-setting]').forEach((input) => input.addEventListener('change', () => this.setSetting(input.dataset.setting, input.checked)));
    this.root.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', (event) => {
      const action = button.dataset.action;
      if (action === 'launch') this.launch();
      if (action === 'restart' || action === 'home') this.restart();
      if (action === 'share') this.share();
      if (action === 'export') this.exportReplay();
      if (action === 'settings') { this.showSettings = true; this.render(); }
      if (action === 'close-settings' || action === 'settings-backdrop') this.closeSettings(event);
      if (action === 'help') { this.showHelp = true; this.render(); }
      if (action === 'close-help') this.closeHelp();
      if (action === 'install') this.install();
    }));
  }
}
