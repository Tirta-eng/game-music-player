// 🐠 Fish Catch Mini Game — Catch fish that swim to the music beat!

import { getFrequencyData } from '../audio.js';
import { getState, setState } from '../state.js';

// ── Fish Types ─────────────────────────────────────────────────────
const FISH_TYPES = [
  { emoji: '🐠', name: 'Tropical', points: 10, speed: 1.2, size: 32, weight: 30 },
  { emoji: '🐟', name: 'Blue Fish', points: 15, speed: 1.8, size: 28, weight: 25 },
  { emoji: '🐡', name: 'Puffer', points: 20, speed: 0.7, size: 34, weight: 15 },
  { emoji: '🐙', name: 'Octopus', points: 25, speed: 0.9, size: 36, weight: 10 },
  { emoji: '🦑', name: 'Squid', points: 25, speed: 1.4, size: 34, weight: 8 },
  { emoji: '🐢', name: 'Turtle', points: 30, speed: 0.5, size: 38, weight: 8 },
  { emoji: '🐬', name: 'Dolphin', points: 40, speed: 2.0, size: 40, weight: 5 },
  { emoji: '🦈', name: 'Shark', points: 50, speed: 2.2, size: 44, weight: 3 },
  { emoji: '🐳', name: 'Whale', points: 100, speed: 0.4, size: 56, weight: 1 },
];

const GOLDEN_FISH = { emoji: '⭐', name: 'Starfish', points: 150, speed: 1.0, size: 40, isGolden: true };

const COMBO_MULTIPLIERS = [1, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
const COMBO_TIMEOUT = 2500; // ms before combo resets

// ── Game State ─────────────────────────────────────────────────────
let gameContainer = null;
let hudScore = null;
let hudCombo = null;
let hudHigh = null;
let activeFish = [];
let particles = [];
let animFrameId = null;
let isRunning = false;
let spawnTimer = 0;
let lastTime = 0;
let comboTimeout = null;
let lastBassHit = 0;

// ── Weighted random fish picker ────────────────────────────────────
function pickFishType() {
  const totalWeight = FISH_TYPES.reduce((sum, f) => sum + f.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const fish of FISH_TYPES) {
    rand -= fish.weight;
    if (rand <= 0) return fish;
  }
  return FISH_TYPES[0];
}

// ── Create game area ───────────────────────────────────────────────
export function createFishGame() {
  gameContainer = document.createElement('div');
  gameContainer.className = 'fish-game';
  gameContainer.id = 'fishGame';

  // Light rays
  const rays = document.createElement('div');
  rays.className = 'fg-light-rays';
  for (let i = 0; i < 6; i++) {
    const ray = document.createElement('div');
    ray.className = 'fg-ray';
    ray.style.left = `${8 + i * 17}%`;
    ray.style.animationDelay = `${i * 1.2}s`;
    rays.appendChild(ray);
  }
  gameContainer.appendChild(rays);

  // Floating bubbles (ambient)
  const bubbles = document.createElement('div');
  bubbles.className = 'fg-bubbles';
  for (let i = 0; i < 20; i++) {
    const b = document.createElement('div');
    b.className = 'fg-bubble';
    b.style.left = `${Math.random() * 100}%`;
    b.style.animationDuration = `${4 + Math.random() * 6}s`;
    b.style.animationDelay = `${Math.random() * 5}s`;
    const size = 3 + Math.random() * 8;
    b.style.width = `${size}px`;
    b.style.height = `${size}px`;
    bubbles.appendChild(b);
  }
  gameContainer.appendChild(bubbles);

  // Coral reef at bottom
  const coral = document.createElement('div');
  coral.className = 'fg-coral-reef';
  coral.id = 'fgCoralReef';
  const coralEmojis = ['🪸', '🌿', '🪨', '🪸', '🌊', '🪸', '🌿', '🪨', '🪸', '🌿', '🪸', '🪨'];
  coralEmojis.forEach((emoji, i) => {
    const c = document.createElement('span');
    c.className = 'fg-coral-piece';
    c.textContent = emoji;
    c.style.animationDelay = `${i * 0.3}s`;
    coral.appendChild(c);
  });
  gameContainer.appendChild(coral);

  // Sand floor
  const sand = document.createElement('div');
  sand.className = 'fg-sand';
  gameContainer.appendChild(sand);

  // HUD overlay
  const hud = document.createElement('div');
  hud.className = 'fg-hud';
  hud.innerHTML = `
    <div class="fg-hud-left">
      <div class="fg-score-box">
        <span class="fg-score-label">SCORE</span>
        <span class="fg-score-value" id="fgScore">0</span>
      </div>
      <div class="fg-combo-box" id="fgComboBox">
        <span class="fg-combo-text" id="fgCombo"></span>
      </div>
    </div>
    <div class="fg-hud-right">
      <div class="fg-high-box">
        <span class="fg-high-label">⭐ BEST</span>
        <span class="fg-high-value" id="fgHigh">${getState().highScore}</span>
      </div>
    </div>
  `;
  gameContainer.appendChild(hud);

  // Hint text
  const hint = document.createElement('div');
  hint.className = 'fg-hint';
  hint.id = 'fgHint';
  hint.textContent = '🐠 Klik ikan untuk menangkapnya!';
  gameContainer.appendChild(hint);

  return gameContainer;
}

// ── Spawn a fish ───────────────────────────────────────────────────
function spawnFish(type = null) {
  if (!gameContainer || !isRunning) return;

  const fishType = type || pickFishType();
  const el = document.createElement('div');
  el.className = 'fg-fish';
  if (fishType.isGolden) el.classList.add('fg-fish-golden');
  el.textContent = fishType.emoji;
  el.style.fontSize = `${fishType.size}px`;

  // Spawn from left or right edge
  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -8 : 108;
  const direction = fromLeft ? 1 : -1;
  const startY = 8 + Math.random() * 60; // Keep fish in upper 70% of game area

  el.style.left = `${startX}%`;
  el.style.top = `${startY}%`;
  el.style.transform = fromLeft ? 'scaleX(1)' : 'scaleX(-1)';

  const fish = {
    el,
    x: startX,
    y: startY,
    baseY: startY,
    direction,
    speed: fishType.speed * (0.8 + Math.random() * 0.4),
    type: fishType,
    alive: true,
    age: 0,
    wobbleOffset: Math.random() * Math.PI * 2,
    // Movement pattern
    pattern: fishType.isGolden ? 'sine' : (['linear', 'sine', 'sine'][Math.floor(Math.random() * 3)]),
  };

  // Click handler
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    catchFish(fish);
  });
  el.addEventListener('touchstart', (e) => {
    e.preventDefault();
    e.stopPropagation();
    catchFish(fish);
  });

  gameContainer.appendChild(el);
  activeFish.push(fish);
}

// ── Catch a fish ───────────────────────────────────────────────────
function catchFish(fish) {
  if (!fish.alive) return;
  fish.alive = false;

  const state = getState();

  // Combo system
  if (comboTimeout) clearTimeout(comboTimeout);
  const newCombo = state.combo + 1;
  const multiplier = COMBO_MULTIPLIERS[Math.min(newCombo, COMBO_MULTIPLIERS.length - 1)];
  const points = Math.floor(fish.type.points * multiplier);
  const newScore = state.gameScore + points;

  // Check high score
  let newHigh = state.highScore;
  if (newScore > newHigh) {
    newHigh = newScore;
    localStorage.setItem('fishCatchHighScore', String(newHigh));
  }

  setState({ gameScore: newScore, highScore: newHigh, combo: newCombo });

  // Reset combo after timeout
  comboTimeout = setTimeout(() => {
    setState({ combo: 0 });
    updateHUD();
  }, COMBO_TIMEOUT);

  // Animate catch
  fish.el.classList.add('fg-fish-caught');

  // Floating points text
  spawnPointsText(fish.x, fish.y, `+${points}`, fish.type.isGolden);

  // Spawn particles
  spawnCatchParticles(fish.el);

  // Remove after animation
  setTimeout(() => {
    fish.el.remove();
    activeFish = activeFish.filter(f => f !== fish);
  }, 400);

  // Hide hint after first catch
  const hint = document.getElementById('fgHint');
  if (hint) hint.style.display = 'none';

  updateHUD();
}

// ── Points floating text ───────────────────────────────────────────
function spawnPointsText(x, y, text, isSpecial = false) {
  const el = document.createElement('div');
  el.className = `fg-points-text${isSpecial ? ' fg-points-special' : ''}`;
  el.textContent = text;
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;
  gameContainer.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ── Catch particles ────────────────────────────────────────────────
function spawnCatchParticles(fishEl) {
  const rect = fishEl.getBoundingClientRect();
  const gameRect = gameContainer.getBoundingClientRect();
  const cx = rect.left - gameRect.left + rect.width / 2;
  const cy = rect.top - gameRect.top + rect.height / 2;

  const sparkles = ['✨', '💫', '⚡', '💥', '🌟'];
  for (let i = 0; i < 6; i++) {
    const p = document.createElement('div');
    p.className = 'fg-particle';
    p.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
    p.style.left = `${cx}px`;
    p.style.top = `${cy}px`;

    const angle = (i / 6) * Math.PI * 2;
    const dist = 30 + Math.random() * 40;
    p.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--py', `${Math.sin(angle) * dist}px`);

    gameContainer.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

// ── Update HUD ─────────────────────────────────────────────────────
function updateHUD() {
  const state = getState();

  if (!hudScore) hudScore = document.getElementById('fgScore');
  if (!hudCombo) hudCombo = document.getElementById('fgCombo');
  if (!hudHigh) hudHigh = document.getElementById('fgHigh');

  if (hudScore) {
    hudScore.textContent = state.gameScore;
    hudScore.classList.remove('fg-score-pop');
    void hudScore.offsetWidth; // force reflow
    hudScore.classList.add('fg-score-pop');
  }

  if (hudCombo) {
    const comboBox = document.getElementById('fgComboBox');
    if (state.combo >= 2) {
      const mult = COMBO_MULTIPLIERS[Math.min(state.combo, COMBO_MULTIPLIERS.length - 1)];
      hudCombo.textContent = `🔥 x${mult} COMBO!`;
      if (comboBox) comboBox.classList.add('fg-combo-active');
    } else {
      hudCombo.textContent = '';
      if (comboBox) comboBox.classList.remove('fg-combo-active');
    }
  }

  if (hudHigh) hudHigh.textContent = state.highScore;
}

// ── Game Loop ──────────────────────────────────────────────────────
function gameLoop(timestamp) {
  if (!isRunning) return;
  animFrameId = requestAnimationFrame(gameLoop);

  const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
  lastTime = timestamp;

  // Get music data
  const freqData = getFrequencyData();
  const hasAudio = freqData.length > 0 && freqData.some(v => v > 0);

  // Calculate audio intensity
  let bassAvg = 0, midAvg = 0, overallAvg = 0;
  if (hasAudio) {
    bassAvg = (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / 4 / 255;
    midAvg = (freqData[8] + freqData[9] + freqData[10] + freqData[11]) / 4 / 255;
    overallAvg = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
  }

  // ── Spawn logic ──────────────────────────────────────────────
  const baseSpawnRate = hasAudio ? 1.5 : 3; // seconds between spawns
  const spawnMultiplier = hasAudio ? (1 + overallAvg * 2) : 1;
  spawnTimer += dt * spawnMultiplier;

  if (spawnTimer >= baseSpawnRate && activeFish.length < 25) {
    spawnTimer = 0;
    spawnFish();

    // Bass drop → golden fish!
    if (hasAudio && bassAvg > 0.75 && timestamp - lastBassHit > 5000) {
      lastBassHit = timestamp;
      setTimeout(() => spawnFish(GOLDEN_FISH), 300);
    }
  }

  // ── Move fish ────────────────────────────────────────────────
  activeFish.forEach(fish => {
    if (!fish.alive) return;
    fish.age += dt;

    // Horizontal movement
    fish.x += fish.direction * fish.speed * dt * 12;

    // Vertical wobble based on pattern
    if (fish.pattern === 'sine') {
      fish.y = fish.baseY + Math.sin(fish.age * 1.5 + fish.wobbleOffset) * 4;
    }

    // Speed boost from music
    if (hasAudio) {
      fish.x += fish.direction * midAvg * 3 * dt;
    }

    // Update DOM position
    fish.el.style.left = `${fish.x}%`;
    fish.el.style.top = `${fish.y}%`;

    // Remove if off screen
    if (fish.x > 115 || fish.x < -15) {
      fish.el.remove();
      fish.alive = false;
    }
  });

  // Clean up dead fish
  activeFish = activeFish.filter(f => f.alive);

  // ── Coral EQ effect ──────────────────────────────────────────
  if (hasAudio) {
    const coralReef = document.getElementById('fgCoralReef');
    if (coralReef) {
      const pieces = coralReef.children;
      for (let i = 0; i < pieces.length; i++) {
        const freqIdx = Math.floor((i / pieces.length) * freqData.length * 0.5);
        const val = freqData[freqIdx] / 255;
        const scale = 1 + val * 0.5;
        pieces[i].style.transform = `scaleY(${scale})`;
        pieces[i].style.filter = `brightness(${1 + val * 0.8})`;
      }
    }
  }
}

// ── Start / Stop ───────────────────────────────────────────────────
export function startFishGame() {
  if (isRunning) return;
  isRunning = true;
  lastTime = 0;
  spawnTimer = 0;
  hudScore = null;
  hudCombo = null;
  hudHigh = null;
  animFrameId = requestAnimationFrame(gameLoop);
}

export function stopFishGame() {
  isRunning = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (comboTimeout) {
    clearTimeout(comboTimeout);
    comboTimeout = null;
  }
}

export function destroyFishGame() {
  stopFishGame();
  activeFish.forEach(f => f.el.remove());
  activeFish = [];
  particles = [];
  gameContainer = null;
}

export function resetGameScore() {
  setState({ gameScore: 0, combo: 0 });
  updateHUD();
}
