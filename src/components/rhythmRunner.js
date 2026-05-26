// 🛸 Submarine Rhythm Runner — Free Vertical Movement!
// Controls: Hold W/ArrowUp (Move Up), S/ArrowDown (Move Down) or hold/drag on canvas!
// Spawns items randomly on Y-axis in sync with bass beats!

import { getFrequencyData } from '../audio.js';

// ── Config ─────────────────────────────────────────────────────────
const SCROLL_SPEED = 3.6;
const TARGET_SCORE = 35;     // Score needed to win
const GAME_DURATION = 60;    // Game duration in seconds
const SPAWN_COOLDOWN = 320;   // Min ms between bass item spawns
const OBSTACLE_COOLDOWN = 1100; // Min ms between obstacle spawns

const ITEMS = [
  { emoji: '🪙', points: 1, color: '#FFD700', label: 'COIN' },
  { emoji: '🎵', points: 2, color: '#00F5FF', label: 'NOTE' },
  { emoji: '🌟', points: 3, color: '#E040FB', label: 'STAR' },
];

const OBSTACLES = [
  { emoji: '💣', points: -1, damage: 1, type: 'mine' },
  { emoji: '🐡', points: -2, damage: 1, type: 'puffer' },
];

// ── State ──────────────────────────────────────────────────────────
let canvas = null;
let ctx = null;
let gameContainer = null;
let animId = null;
let isRunning = false;
let gameOver = false;
let gameWon = false;
let lastTime = 0;
let isFreeMode = false; // Free play mode (no sanksi if lost)

// Submarine
let sub = {
  y: 150,        // Current Y coordinate
  x: 80,         // X coordinate (fixed)
  size: 40,
  speed: 240,    // Vertical move speed (px/sec)
  lives: 3,
};

let activeObjects = []; // { x, y, type, itemData, size, pulse }
let particles = [];
let score = 0;
let timer = GAME_DURATION;

let lastSpawnTime = 0;
let lastObstacleTime = 0;
let backgroundOffset = 0;

let onGameEndCallback = null;

// Input tracking
let keys = {};
let pointerActive = false;
let pointerY = 150;

// ── Create game ────────────────────────────────────────────────────
export function createRhythmRunner(onEnd, isFreePlay = false) {
  onGameEndCallback = onEnd;
  isFreeMode = isFreePlay;

  gameContainer = document.createElement('div');
  gameContainer.className = 'rr-game';
  gameContainer.id = 'rhythmRunner';

  canvas = document.createElement('canvas');
  canvas.className = 'rr-canvas';
  gameContainer.appendChild(canvas);
  ctx = canvas.getContext('2d');

  // HUD
  const hud = document.createElement('div');
  hud.className = 'rr-hud';
  hud.innerHTML = `
    <div class="rr-hud-left">
      <div class="rr-stat">
        <span class="rr-stat-label">SKOR</span>
        <span class="rr-stat-value" id="rrScore">0 / ${TARGET_SCORE}</span>
      </div>
    </div>
    <div class="rr-hud-center">
      <div class="rr-timer" id="rrTimer">⏱ ${GAME_DURATION}s</div>
      ${isFreeMode ? '<div class="rr-freeplay-badge">FREE PLAY</div>' : ''}
    </div>
    <div class="rr-hud-right">
      <div class="rr-stat">
        <span class="rr-stat-label">NYAWA</span>
        <span class="rr-stat-value rr-lives" id="rrLives">❤️ ❤️ ❤️</span>
      </div>
    </div>
  `;
  gameContainer.appendChild(hud);

  // Start Overlay
  const start = document.createElement('div');
  start.className = 'rr-start-overlay';
  start.id = 'rrStartOverlay';
  start.innerHTML = `
    <div class="rr-start-box">
      <div class="rr-start-emoji">🛸</div>
      <div class="rr-start-title">${isFreeMode ? 'FREE PLAY MODE' : 'SUBMARINE RHYTHM RUNNER'}</div>
      <div class="rr-start-desc">
        Kemudikan kapal selam secara BEBAS menembus gua dalam!<br>
        <span class="rr-key">Tahan W / ⬆</span> : Kemudikan ke Atas<br>
        <span class="rr-key">Tahan S / ⬇</span> : Kemudikan ke Bawah<br>
        <span class="rr-highlight">Atau seret/tahan jari/mouse Anda di layar!</span><br><br>
        Kumpulkan <span class="rr-gold">${TARGET_SCORE} poin</span> mengikuti ketukan musik!<br>
        Hindari ranjau laut 💣 & ikan buntal 🐡!
        ${isFreeMode ? '<br><span style="color:#00FF7F; font-size:9px;">👑 Mode Santai Aktif: Kalah tanpa sanksi!</span>' : ''}
      </div>
      <button class="rr-start-btn" id="rrStartBtn">LUNCURKAN KAPAL! 🚀</button>
    </div>
  `;
  gameContainer.appendChild(start);

  // Screen Flash
  const flash = document.createElement('div');
  flash.className = 'rr-flash';
  flash.id = 'rrFlash';
  gameContainer.appendChild(flash);

  return gameContainer;
}

// ── Init Game ──────────────────────────────────────────────────────
function initGameState() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width || 450;
  canvas.height = rect.height || 350;

  sub = {
    y: canvas.height / 2,
    x: 80,
    size: 42,
    speed: 250,
    lives: 3,
  };

  activeObjects = [];
  particles = [];
  score = 0;
  timer = GAME_DURATION;
  gameOver = false;
  gameWon = false;
  backgroundOffset = 0;
  lastTime = 0;
  lastSpawnTime = 0;
  lastObstacleTime = 0;
  keys = {};
  pointerActive = false;
}

// ── Input Listeners ────────────────────────────────────────────────
function handleKeyDown(e) {
  if (['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
  keys[e.code] = true;
}

function handleKeyUp(e) {
  keys[e.code] = false;
}

function handlePointerDown(e) {
  if (gameOver || !isRunning) return;
  if (e.target.closest('.rr-start-btn, .rr-hud')) return;
  pointerActive = true;
  updatePointerY(e);
}

function handlePointerMove(e) {
  if (pointerActive) {
    updatePointerY(e);
  }
}

function handlePointerUp() {
  pointerActive = false;
}

function updatePointerY(e) {
  const rect = canvas.getBoundingClientRect();
  const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY);
  if (clientY !== undefined) {
    pointerY = clientY - rect.top;
  }
}

// ── Start the Game ─────────────────────────────────────────────────
export function startRhythmRunner() {
  if (isRunning) return;

  const startBtn = document.getElementById('rrStartBtn');
  const overlay = document.getElementById('rrStartOverlay');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      overlay.classList.add('rr-overlay-hide');
      setTimeout(() => overlay.style.display = 'none', 400);
      beginGame();
    });
  }
}

function beginGame() {
  initGameState();
  isRunning = true;

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  canvas.addEventListener('mousedown', handlePointerDown);
  canvas.addEventListener('mousemove', handlePointerMove);
  window.addEventListener('mouseup', handlePointerUp);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handlePointerDown(e.touches[0]);
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    handlePointerMove(e.touches[0]);
  }, { passive: false });
  window.addEventListener('touchend', handlePointerUp);

  animId = requestAnimationFrame(gameLoop);
}

// ── Game Loop ──────────────────────────────────────────────────────
function gameLoop(timestamp) {
  if (!isRunning) return;
  animId = requestAnimationFrame(gameLoop);

  const dt = lastTime ? Math.min((timestamp - lastTime) / 1000, 0.05) : 0.016;
  lastTime = timestamp;

  if (gameOver) return;

  // Timer
  timer -= dt;
  if (timer <= 0) {
    timer = 0;
    // Check if score goal met
    if (score >= TARGET_SCORE) {
      endGame(true);
    } else {
      endGame(false);
    }
    return;
  }

  // Get real-time audio bass data
  const freqData = getFrequencyData();
  const hasAudio = freqData.length > 0 && freqData.some(v => v > 0);
  let bassVal = 0;
  if (hasAudio) {
    bassVal = (freqData[0] + freqData[1] + freqData[2] + freqData[3]) / 4 / 255;
  }

  const w = canvas.width;
  const h = canvas.height;

  // Scroll speed reacts to bass beats
  const speedMult = hasAudio ? (1 + bassVal * 0.75) : 1;
  const currentSpeed = SCROLL_SPEED * speedMult;

  // ── Physics: Submarine FREE Vertical Movement ──────────────────
  if (keys['KeyW'] || keys['ArrowUp']) {
    sub.y -= sub.speed * dt;
  } else if (keys['KeyS'] || keys['ArrowDown']) {
    sub.y += sub.speed * dt;
  } else if (pointerActive) {
    // Smooth drag tracking
    const dy = pointerY - sub.y;
    if (Math.abs(dy) > 4) {
      sub.y += Math.sign(dy) * sub.speed * dt;
    }
  }

  // Clamp Y to canvas bounds
  const topBound = sub.size / 2 + 10;
  const botBound = h - sub.size / 2 - 15;
  sub.y = Math.max(topBound, Math.min(botBound, sub.y));

  // Spawning bubbles from submarine propeller
  if (Math.random() < 0.25) {
    particles.push({
      x: sub.x - 20,
      y: sub.y + 4 + (Math.random() - 0.5) * 6,
      vx: -currentSpeed * 0.8 - Math.random() * 2,
      vy: (Math.random() - 0.5) * 1.5,
      life: 0.8,
      size: 2 + Math.random() * 4,
      type: 'bubble',
    });
  }

  // ── Spawning Objects (Bass beat based & Random Y-Axis) ──────────
  const now = Date.now();

  // Spawning good items on bass hit
  if (hasAudio && bassVal > 0.65 && (now - lastSpawnTime > SPAWN_COOLDOWN)) {
    lastSpawnTime = now;
    const spawnY = topBound + Math.random() * (botBound - topBound);
    const itemData = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    activeObjects.push({
      x: w + 40,
      y: spawnY,
      type: 'item',
      data: itemData,
      size: 28,
      pulse: 0,
    });
  } else if (!hasAudio && (now - lastSpawnTime > 1300)) {
    // Fallback if no audio playing
    lastSpawnTime = now;
    const spawnY = topBound + Math.random() * (botBound - topBound);
    const itemData = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    activeObjects.push({
      x: w + 40,
      y: spawnY,
      type: 'item',
      data: itemData,
      size: 28,
      pulse: 0,
    });
  }

  // Spawning obstacles periodically
  if (now - lastObstacleTime > OBSTACLE_COOLDOWN) {
    lastObstacleTime = now;
    const spawnY = topBound + Math.random() * (botBound - topBound);
    const obsData = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
    
    // Avoid double spawning directly overlayed
    const tooClose = activeObjects.some(o => Math.abs(o.y - spawnY) < 40 && o.x > w - 80);
    if (!tooClose) {
      activeObjects.push({
        x: w + 40,
        y: spawnY,
        type: 'obstacle',
        data: obsData,
        size: 32,
        pulse: 0,
      });
    }
  }

  // ── Object Physics & Collision ──────────────────────────────
  for (let i = activeObjects.length - 1; i >= 0; i--) {
    const obj = activeObjects[i];
    obj.x -= currentSpeed;
    obj.pulse += dt * 5;

    // Check collision with submarine
    const dx = Math.abs(obj.x - sub.x);
    const dy = Math.abs(obj.y - sub.y);
    
    if (dx < sub.size * 0.7 && dy < sub.size * 0.55) {
      // Collision!
      if (obj.type === 'item') {
        // Collect Item!
        score += obj.data.points;
        spawnSparkleEffect(obj.x, obj.y, obj.data.color, obj.data.emoji);
        triggerScorePop();
        updateHUD();

        // Check victory
        if (score >= TARGET_SCORE) {
          endGame(true);
          return;
        }
      } else {
        // Hit Obstacle!
        sub.lives -= obj.data.damage;
        score = Math.max(0, score + obj.data.points); // deduct score but min 0
        triggerScreenFlash(false);
        spawnSparkleEffect(obj.x, obj.y, '#FF0000', '💥');
        triggerScorePop();
        updateHUD();

        // Check game over
        if (sub.lives <= 0) {
          endGame(false);
          return;
        }
      }

      // Remove object
      activeObjects.splice(i, 1);
      continue;
    }

    // Remove if offscreen
    if (obj.x < -50) {
      activeObjects.splice(i, 1);
    }
  }

  // ── Draw ─────────────────────────────────────────────────────
  draw(w, h, hasAudio, bassVal);
}

// ── Draw Frame ─────────────────────────────────────────────────────
function draw(w, h, hasAudio, bassVal) {
  ctx.clearRect(0, 0, w, h);

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#030616');
  grad.addColorStop(0.5, '#060f27');
  grad.addColorStop(1, '#0c2242');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // ── Organic Flow Lines (Replaces Rigid Lanes) ──────────────────
  ctx.save();
  ctx.strokeStyle = 'rgba(79, 195, 247, 0.06)';
  ctx.lineWidth = 2;
  const lineCount = 4;
  for (let i = 0; i <= lineCount; i++) {
    const ly = (h / lineCount) * i;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    for (let cx = 0; cx <= w; cx += 30) {
      const wave = Math.sin(cx * 0.02 + Date.now() * 0.002 + i) * 6;
      ctx.lineTo(cx, ly + wave);
    }
    ctx.stroke();
  }
  ctx.restore();

  // ── Light Rays ───────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.05 + (hasAudio ? bassVal * 0.05 : 0);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#4FC3F7';
    ctx.beginPath();
    const rx = w * 0.15 + i * w * 0.25 + Math.sin(Date.now() / 2200 + i) * 12;
    ctx.moveTo(rx - 25, 0);
    ctx.lineTo(rx + 25, 0);
    ctx.lineTo(rx + 60, h);
    ctx.lineTo(rx - 60, h);
    ctx.fill();
  }
  ctx.restore();

  // ── Draw Active Objects (Items & Obstacles) ────────────────────
  activeObjects.forEach(obj => {
    ctx.save();
    ctx.font = `${obj.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const bounce = Math.sin(obj.pulse) * 4;
    
    if (obj.type === 'item') {
      ctx.shadowColor = obj.data.color;
      ctx.shadowBlur = 15;
      ctx.fillText(obj.data.emoji, obj.x, obj.y + bounce);
    } else {
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 18;
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.pulse * 0.2);
      ctx.fillText(obj.data.emoji, 0, 0);
    }
    ctx.restore();
  });

  // ── Update & Draw Particles ──────────────────────────────────
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.02;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = p.life;

    if (p.type === 'bubble') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(79, 195, 247, 0.4)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();
    } else if (p.type === 'sparkle') {
      ctx.font = `${p.size}px serif`;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillText(p.emoji, p.x, p.y);
    }
    ctx.restore();
  }

  // ── Draw Submarine 🛸 ─────────────────────────────────────────
  ctx.save();
  ctx.font = `${sub.size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Hovering effect
  const subHover = Math.sin(Date.now() / 150) * 1.5;
  ctx.translate(sub.x, sub.y + subHover);

  // Soft rotation based on key press (tilt up/down)
  let subTilt = 0;
  if (keys['KeyW'] || keys['ArrowUp']) {
    subTilt = -0.15;
  } else if (keys['KeyS'] || keys['ArrowDown']) {
    subTilt = 0.15;
  } else if (pointerActive) {
    const dy = pointerY - sub.y;
    if (Math.abs(dy) > 10) {
      subTilt = Math.sign(dy) * 0.12;
    }
  }
  ctx.rotate(subTilt);

  // Submarine glow (Yellow Neon)
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 15;
  ctx.fillText('🛸', 0, 0);
  ctx.restore();

  // ── Draw Coral Decorations ───────────────────────────────────
  ctx.save();
  ctx.font = '24px serif';
  ctx.textAlign = 'center';
  const coralCount = Math.ceil(w / 60);
  for (let i = 0; i <= coralCount; i++) {
    const cx = (i * 60) - (backgroundOffset % 60);
    const emoji = i % 2 === 0 ? '🪸' : '🌿';
    ctx.globalAlpha = 0.4;
    ctx.fillText(emoji, cx, h - 16);
  }
  ctx.restore();

  backgroundOffset += SCROLL_SPEED * (hasAudio ? (1 + bassVal * 0.3) : 1) * 0.2;

  // Sandy Floor
  ctx.fillStyle = '#182e44';
  ctx.fillRect(0, h - 8, w, 8);
}

// ── Particle Effects ───────────────────────────────────────────────
function spawnSparkleEffect(x, y, color, emoji) {
  const sparkles = ['✨', '💫', '🌟', emoji];
  for (let i = 0; i < 6; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1.0,
      size: 14 + Math.random() * 8,
      type: 'sparkle',
      emoji: sparkles[Math.floor(Math.random() * sparkles.length)],
      color: color,
    });
  }

  // Floating text overlay
  const el = document.createElement('div');
  el.className = 'rr-points-text';
  el.textContent = emoji === '💥' ? '-1 💥' : `+${emoji === '🪙' ? '1' : emoji === '🎵' ? '2' : '3'} ${emoji}`;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  el.style.color = color;
  el.style.textShadow = `0 0 8px ${color}`;
  gameContainer.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

// Screen Flash Effect
function triggerScreenFlash(won) {
  const flash = document.getElementById('rrFlash');
  if (flash) {
    flash.style.background = won ? 'rgba(0, 245, 255, 0.25)' : 'rgba(255, 40, 40, 0.3)';
    flash.classList.remove('rr-flash-active');
    void flash.offsetWidth;
    flash.classList.add('rr-flash-active');
  }
}

// Score Pop Animation
function triggerScorePop() {
  const scoreEl = document.getElementById('rrScore');
  if (scoreEl) {
    scoreEl.classList.remove('rr-score-pop');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('rr-score-pop');
  }
}

// ── Update HUD ─────────────────────────────────────────────────────
function updateHUD() {
  const scoreEl = document.getElementById('rrScore');
  const timerEl = document.getElementById('rrTimer');
  const livesEl = document.getElementById('rrLives');

  if (scoreEl) {
    scoreEl.textContent = `${score} / ${TARGET_SCORE}`;
  }

  if (timerEl) {
    timerEl.textContent = `⏱ ${Math.ceil(timer)}s`;
    if (timer <= 10) timerEl.classList.add('rr-timer-critical');
  }

  if (livesEl) {
    let hearts = '';
    for (let i = 0; i < 3; i++) {
      hearts += i < sub.lives ? '❤️ ' : '🖤 ';
    }
    livesEl.textContent = hearts.trim();
  }
}

// ── End Game ───────────────────────────────────────────────────────
function endGame(won) {
  gameOver = true;
  gameWon = won;

  triggerScreenFlash(won);

  // Notify parent
  setTimeout(() => {
    if (onGameEndCallback) {
      // Pass isFreeMode status so that parent knows to skip sanksi
      onGameEndCallback(won, score, isFreeMode);
    }
  }, 1200);
}

// ── Cleanup ────────────────────────────────────────────────────────
export function stopRhythmRunner() {
  isRunning = false;
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  document.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('keyup', handleKeyUp);
  if (canvas) {
    canvas.removeEventListener('mousedown', handlePointerDown);
    canvas.removeEventListener('mousemove', handlePointerMove);
  }
  window.removeEventListener('mouseup', handlePointerUp);
}

export function destroyRhythmRunner() {
  stopRhythmRunner();
  canvas = null;
  ctx = null;
  gameContainer = null;
}

// HUD updates periodic
setInterval(() => {
  if (isRunning && !gameOver) {
    updateHUD();
  }
}, 250);
