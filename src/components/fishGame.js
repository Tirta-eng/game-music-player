// 🐠 Fish Catch Mini Game v2 — Now with traps, targets & rounds!

import { getFrequencyData } from '../audio.js';
import { getState, setState } from '../state.js';

// ── Good Fish (catch for points!) ──────────────────────────────────
const GOOD_FISH = [
  { emoji: '🐠', name: 'Tropical', points: 10, speed: 1.2, size: 32, weight: 30 },
  { emoji: '🐟', name: 'Blue Fish', points: 15, speed: 1.8, size: 28, weight: 25 },
  { emoji: '🐙', name: 'Octopus', points: 25, speed: 0.9, size: 36, weight: 10 },
  { emoji: '🦑', name: 'Squid', points: 25, speed: 1.4, size: 34, weight: 8 },
  { emoji: '🐢', name: 'Turtle', points: 30, speed: 0.5, size: 38, weight: 8 },
  { emoji: '🐬', name: 'Dolphin', points: 40, speed: 2.0, size: 40, weight: 5 },
  { emoji: '🦈', name: 'Shark', points: 50, speed: 2.2, size: 44, weight: 3 },
  { emoji: '🐳', name: 'Whale', points: 100, speed: 0.4, size: 56, weight: 1 },
];

// ── Trap Fish (avoid these!) ───────────────────────────────────────
const TRAP_FISH = [
  { emoji: '🐡', name: 'Pufferfish', points: -30, speed: 0.6, size: 36, weight: 20, trap: true, effect: 'puff' },
  { emoji: '🪼', name: 'Jellyfish', points: -20, speed: 0.4, size: 34, weight: 15, trap: true, effect: 'sting' },
  { emoji: '💣', name: 'Sea Mine', points: -80, speed: 0.3, size: 38, weight: 5, trap: true, effect: 'explode' },
  { emoji: '☠️', name: 'Skull Fish', points: -50, speed: 1.0, size: 32, weight: 8, trap: true, effect: 'skull' },
];

const GOLDEN_FISH = { emoji: '⭐', name: 'Starfish', points: 150, speed: 1.0, size: 40, isGolden: true, weight: 0 };

const COMBO_MULTIPLIERS = [1, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
const COMBO_TIMEOUT = 2500;
const ROUND_TARGETS = [200, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 99999];

// ── Game State ─────────────────────────────────────────────────────
let gameContainer = null;
let hudScore = null;
let hudCombo = null;
let hudHigh = null;
let hudTarget = null;
let hudRound = null;
let activeFish = [];
let animFrameId = null;
let isRunning = false;
let spawnTimer = 0;
let lastTime = 0;
let comboTimeout = null;
let lastBassHit = 0;
let currentRound = 0;

// ── Weighted random picker ─────────────────────────────────────────
function pickFromPool(pool) {
  const totalWeight = pool.reduce((sum, f) => sum + f.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const fish of pool) {
    rand -= fish.weight;
    if (rand <= 0) return fish;
  }
  return pool[0];
}

function pickFishType() {
  // 25% chance of trap, 75% good fish — increases with round
  const trapChance = Math.min(0.25 + currentRound * 0.03, 0.45);
  if (Math.random() < trapChance) {
    return pickFromPool(TRAP_FISH);
  }
  return pickFromPool(GOOD_FISH);
}

// ── Create game area ───────────────────────────────────────────────
export function createFishGame() {
  gameContainer = document.createElement('div');
  gameContainer.className = 'fish-game';
  gameContainer.id = 'fishGame';

  // Light rays
  const rays = document.createElement('div');
  rays.className = 'fg-light-rays';
  for (let i = 0; i < 5; i++) {
    const ray = document.createElement('div');
    ray.className = 'fg-ray';
    ray.style.left = `${8 + i * 20}%`;
    ray.style.animationDelay = `${i * 1.2}s`;
    rays.appendChild(ray);
  }
  gameContainer.appendChild(rays);

  // Floating bubbles
  const bubbles = document.createElement('div');
  bubbles.className = 'fg-bubbles';
  for (let i = 0; i < 15; i++) {
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

  // Coral reef
  const coral = document.createElement('div');
  coral.className = 'fg-coral-reef';
  coral.id = 'fgCoralReef';
  const coralEmojis = ['🪸', '🌿', '🪨', '🪸', '🌊', '🪸', '🌿', '🪨'];
  coralEmojis.forEach((emoji, i) => {
    const c = document.createElement('span');
    c.className = 'fg-coral-piece';
    c.textContent = emoji;
    c.style.animationDelay = `${i * 0.3}s`;
    coral.appendChild(c);
  });
  gameContainer.appendChild(coral);

  // Sand
  const sand = document.createElement('div');
  sand.className = 'fg-sand';
  gameContainer.appendChild(sand);

  // HUD
  const hud = document.createElement('div');
  hud.className = 'fg-hud';
  hud.innerHTML = `
    <div class="fg-hud-row">
      <div class="fg-stat">
        <span class="fg-stat-label">SCORE</span>
        <span class="fg-stat-value fg-score-val" id="fgScore">0</span>
      </div>
      <div class="fg-stat fg-target-stat">
        <span class="fg-stat-label">TARGET</span>
        <span class="fg-stat-value fg-target-val" id="fgTarget">${ROUND_TARGETS[0]}</span>
      </div>
      <div class="fg-stat">
        <span class="fg-stat-label">⭐ BEST</span>
        <span class="fg-stat-value fg-high-val" id="fgHigh">${getState().highScore}</span>
      </div>
    </div>
    <div class="fg-hud-bottom">
      <div class="fg-round-badge" id="fgRound">ROUND 1</div>
      <div class="fg-combo-box" id="fgComboBox">
        <span class="fg-combo-text" id="fgCombo"></span>
      </div>
    </div>
  `;
  gameContainer.appendChild(hud);

  // Screen flash overlay (for traps)
  const flash = document.createElement('div');
  flash.className = 'fg-screen-flash';
  flash.id = 'fgFlash';
  gameContainer.appendChild(flash);

  // Hint
  const hint = document.createElement('div');
  hint.className = 'fg-hint';
  hint.id = 'fgHint';
  hint.innerHTML = '🐠 Tangkap ikan! &nbsp; 🐡 Hindari jebakan!';
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
  if (fishType.trap) el.classList.add('fg-fish-trap');
  el.textContent = fishType.emoji;
  el.style.fontSize = `${fishType.size}px`;

  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -8 : 108;
  const direction = fromLeft ? 1 : -1;
  const startY = 8 + Math.random() * 55;

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
    pattern: fishType.trap ? 'sine' : (['linear', 'sine'][Math.floor(Math.random() * 2)]),
  };

  el.addEventListener('click', (e) => { e.stopPropagation(); handleFishClick(fish); });
  el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handleFishClick(fish); });

  gameContainer.appendChild(el);
  activeFish.push(fish);
}

// ── Handle click (good fish vs trap) ───────────────────────────────
function handleFishClick(fish) {
  if (!fish.alive) return;
  fish.alive = false;

  if (fish.type.trap) {
    hitTrap(fish);
  } else {
    catchFish(fish);
  }
}

// ── Catch good fish ────────────────────────────────────────────────
function catchFish(fish) {
  const state = getState();

  if (comboTimeout) clearTimeout(comboTimeout);
  const newCombo = state.combo + 1;
  const multiplier = COMBO_MULTIPLIERS[Math.min(newCombo, COMBO_MULTIPLIERS.length - 1)];
  const points = Math.floor(fish.type.points * multiplier);
  const newScore = state.gameScore + points;

  let newHigh = state.highScore;
  if (newScore > newHigh) {
    newHigh = newScore;
    localStorage.setItem('fishCatchHighScore', String(newHigh));
  }

  setState({ gameScore: newScore, highScore: newHigh, combo: newCombo });

  comboTimeout = setTimeout(() => {
    setState({ combo: 0 });
    updateHUD();
  }, COMBO_TIMEOUT);

  // Animations
  fish.el.classList.add('fg-fish-caught');
  spawnPointsText(fish.x, fish.y, `+${points}`, fish.type.isGolden);
  spawnCatchParticles(fish.el, false);

  setTimeout(() => { fish.el.remove(); activeFish = activeFish.filter(f => f !== fish); }, 400);

  // Hide hint
  const hint = document.getElementById('fgHint');
  if (hint) hint.style.display = 'none';

  // Check round target
  checkRoundProgress(newScore);
  updateHUD();
}

// ── Hit a trap ─────────────────────────────────────────────────────
function hitTrap(fish) {
  const state = getState();
  const newScore = Math.max(0, state.gameScore + fish.type.points); // Can't go below 0

  setState({ gameScore: newScore, combo: 0 }); // Combo always resets on trap
  if (comboTimeout) clearTimeout(comboTimeout);

  // Effect based on trap type
  const effect = fish.type.effect;

  // Screen flash red
  const flash = document.getElementById('fgFlash');
  if (flash) {
    flash.classList.remove('fg-flash-active');
    void flash.offsetWidth;
    flash.classList.add('fg-flash-active');
  }

  // Shake game area
  if (gameContainer) {
    gameContainer.classList.add('fg-shake');
    setTimeout(() => gameContainer.classList.remove('fg-shake'), 500);
  }

  // Fish-specific animation
  if (effect === 'explode') {
    fish.el.classList.add('fg-fish-explode');
    spawnCatchParticles(fish.el, true);
  } else if (effect === 'puff') {
    fish.el.classList.add('fg-fish-puff');
  } else if (effect === 'sting') {
    fish.el.classList.add('fg-fish-sting');
  } else {
    fish.el.classList.add('fg-fish-skull');
  }

  spawnPointsText(fish.x, fish.y, `${fish.type.points}`, false, true);

  setTimeout(() => { fish.el.remove(); activeFish = activeFish.filter(f => f !== fish); }, 600);

  updateHUD();
}

// ── Check round progress ───────────────────────────────────────────
function checkRoundProgress(score) {
  const target = ROUND_TARGETS[currentRound];
  if (score >= target && currentRound < ROUND_TARGETS.length - 1) {
    currentRound++;

    // Show round clear
    const banner = document.createElement('div');
    banner.className = 'fg-round-clear';
    banner.innerHTML = `🎉 ROUND ${currentRound} CLEAR!`;
    gameContainer.appendChild(banner);
    setTimeout(() => banner.remove(), 2000);

    updateHUD();
  }
}

// ── Points floating text ───────────────────────────────────────────
function spawnPointsText(x, y, text, isSpecial = false, isTrap = false) {
  const el = document.createElement('div');
  el.className = 'fg-points-text';
  if (isSpecial) el.classList.add('fg-points-special');
  if (isTrap) el.classList.add('fg-points-trap');
  el.textContent = text;
  el.style.left = `${x}%`;
  el.style.top = `${y}%`;
  gameContainer.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// ── Catch particles ────────────────────────────────────────────────
function spawnCatchParticles(fishEl, isTrap = false) {
  const rect = fishEl.getBoundingClientRect();
  const gameRect = gameContainer.getBoundingClientRect();
  const cx = rect.left - gameRect.left + rect.width / 2;
  const cy = rect.top - gameRect.top + rect.height / 2;

  const sparkles = isTrap ? ['💥', '❌', '🔥', '💢'] : ['✨', '💫', '⚡', '🌟'];
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
  if (!hudTarget) hudTarget = document.getElementById('fgTarget');
  if (!hudRound) hudRound = document.getElementById('fgRound');

  if (hudScore) {
    hudScore.textContent = state.gameScore;
    hudScore.classList.remove('fg-score-pop');
    void hudScore.offsetWidth;
    hudScore.classList.add('fg-score-pop');
  }

  if (hudCombo) {
    const comboBox = document.getElementById('fgComboBox');
    if (state.combo >= 2) {
      const mult = COMBO_MULTIPLIERS[Math.min(state.combo, COMBO_MULTIPLIERS.length - 1)];
      hudCombo.textContent = `🔥 x${mult}`;
      if (comboBox) comboBox.classList.add('fg-combo-active');
    } else {
      hudCombo.textContent = '';
      if (comboBox) comboBox.classList.remove('fg-combo-active');
    }
  }

  if (hudHigh) hudHigh.textContent = state.highScore;
  if (hudTarget) hudTarget.textContent = ROUND_TARGETS[currentRound];
  if (hudRound) hudRound.textContent = `ROUND ${currentRound + 1}`;
}

// ── Game Loop ──────────────────────────────────────────────────────
function gameLoop(timestamp) {
  if (!isRunning) return;
  animFrameId = requestAnimationFrame(gameLoop);

  const dt = lastTime ? (timestamp - lastTime) / 1000 : 0.016;
  lastTime = timestamp;

  const freqData = getFrequencyData();
  const hasAudio = freqData.length > 0 && freqData.some(v => v > 0);

  let bassAvg = 0, midAvg = 0, overallAvg = 0;
  if (hasAudio) {
    bassAvg = (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / 4 / 255;
    midAvg = (freqData[8] + freqData[9] + freqData[10] + freqData[11]) / 4 / 255;
    overallAvg = freqData.reduce((a, b) => a + b, 0) / freqData.length / 255;
  }

  // Spawn
  const baseSpawnRate = hasAudio ? 1.5 : 3;
  const roundMultiplier = 1 + currentRound * 0.15;
  const spawnMultiplier = (hasAudio ? (1 + overallAvg * 2) : 1) * roundMultiplier;
  spawnTimer += dt * spawnMultiplier;

  if (spawnTimer >= baseSpawnRate && activeFish.length < 20) {
    spawnTimer = 0;
    spawnFish();

    if (hasAudio && bassAvg > 0.75 && timestamp - lastBassHit > 5000) {
      lastBassHit = timestamp;
      setTimeout(() => spawnFish(GOLDEN_FISH), 300);
    }
  }

  // Move fish
  activeFish.forEach(fish => {
    if (!fish.alive) return;
    fish.age += dt;

    fish.x += fish.direction * fish.speed * dt * 12;

    if (fish.pattern === 'sine') {
      fish.y = fish.baseY + Math.sin(fish.age * 1.5 + fish.wobbleOffset) * 5;
    }

    if (hasAudio) {
      fish.x += fish.direction * midAvg * 2 * dt;
    }

    fish.el.style.left = `${fish.x}%`;
    fish.el.style.top = `${fish.y}%`;

    if (fish.x > 115 || fish.x < -15) {
      fish.el.remove();
      fish.alive = false;
    }
  });

  activeFish = activeFish.filter(f => f.alive);

  // Coral EQ
  if (hasAudio) {
    const coralReef = document.getElementById('fgCoralReef');
    if (coralReef) {
      const pieces = coralReef.children;
      for (let i = 0; i < pieces.length; i++) {
        const freqIdx = Math.floor((i / pieces.length) * freqData.length * 0.5);
        const val = freqData[freqIdx] / 255;
        const scale = 1 + val * 0.5;
        pieces[i].style.transform = `scaleY(${scale})`;
        pieces[i].style.filter = `brightness(${0.7 + val * 0.8})`;
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
  currentRound = 0;
  hudScore = null;
  hudCombo = null;
  hudHigh = null;
  hudTarget = null;
  hudRound = null;
  animFrameId = requestAnimationFrame(gameLoop);
}

export function stopFishGame() {
  isRunning = false;
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (comboTimeout) { clearTimeout(comboTimeout); comboTimeout = null; }
}

export function destroyFishGame() {
  stopFishGame();
  activeFish.forEach(f => f.el.remove());
  activeFish = [];
  gameContainer = null;
}

export function resetGameScore() {
  currentRound = 0;
  setState({ gameScore: 0, combo: 0 });
  updateHUD();
}
