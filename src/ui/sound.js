let context = null;

function getContext() {
  if (!context) context = new AudioContext();
  return context;
}

export function playTone(rank = 1, duration = 0.12, volume = 0.035) {
  try {
    const audio = getContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = [261.63, 329.63, 392, 493.88, 587.33][Math.max(0, Math.min(4, rank - 1))];
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch {
    // Audio is enhancement-only.
  }
}

export function playQuint(harmonic = false) {
  const ranks = harmonic ? [1, 2, 3, 4, 5] : [1, 3, 5];
  ranks.forEach((rank, index) => window.setTimeout(() => playTone(rank, 0.22, 0.045), index * 80));
}
