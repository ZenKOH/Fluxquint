const PREFIX = 'fluxquint-trademark';

export function loadSettings() {
  try {
    return {
      sound: true,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      highContrast: false,
      symbolic: false,
      ...JSON.parse(localStorage.getItem(`${PREFIX}:settings`) || '{}')
    };
  } catch {
    return { sound: true, reducedMotion: false, highContrast: false, symbolic: false };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(`${PREFIX}:settings`, JSON.stringify(settings));
}

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(`${PREFIX}:progress`) || '{"completedLevels":[],"best":{}}');
  } catch {
    return { completedLevels: [], best: {} };
  }
}

export function saveProgress(progress) {
  localStorage.setItem(`${PREFIX}:progress`, JSON.stringify(progress));
}
