// 8-bit synthesized sound effects using Web Audio API

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// Play a single tone
function playTone(freq, duration, type = 'square', volume = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// Play a sequence of tones
function playSequence(notes, tempo = 0.12) {
  notes.forEach(([freq, dur], i) => {
    setTimeout(() => {
      playTone(freq, dur || 0.15);
    }, i * tempo * 1000);
  });
}

// Correct answer — victory jingle (ascending triumph)
export function sfxCorrect() {
  playSequence([
    [523, 0.1],  // C5
    [659, 0.1],  // E5
    [784, 0.1],  // G5
    [1047, 0.25], // C6
  ], 0.1);
}

// Wrong answer — error buzz
export function sfxWrong() {
  playSequence([
    [200, 0.15],
    [150, 0.25],
  ], 0.15);
}

// Button click — blip
export function sfxClick() {
  playTone(880, 0.06, 'square', 0.08);
}

// Game over — sad descending
export function sfxGameOver() {
  playSequence([
    [523, 0.2],  // C5
    [466, 0.2],  // Bb4
    [392, 0.2],  // G4
    [262, 0.4],  // C4
  ], 0.2);
}

// Navigation / page transition
export function sfxNavigate() {
  playSequence([
    [660, 0.05],
    [880, 0.08],
  ], 0.06);
}

// Heart lost
export function sfxHeartLost() {
  playTone(180, 0.3, 'sawtooth', 0.12);
}

// Victory fanfare for reaching the player
export function sfxVictory() {
  playSequence([
    [523, 0.12],
    [523, 0.06],
    [523, 0.12],
    [659, 0.12],
    [784, 0.12],
    [659, 0.08],
    [784, 0.12],
    [1047, 0.35],
  ], 0.12);
}

// Resume audio context (must be called from user gesture)
export function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}
