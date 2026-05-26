// Underwater scene — interactive pixel art ocean world that reacts to music

import { getFrequencyData } from '../audio.js';

let scene = null;
let animFrameId = null;
let fishes = [];
let jellyfishes = [];
let isAnimating = false;

let fishScareCount = 0;

// ── Fish types ───────────────────────────────────────────────────────
const FISH_TYPES = [
  { emoji: '🐠', size: 26, speed: 0.6 },
  { emoji: '🐟', size: 22, speed: 0.9 },
  { emoji: '🐡', size: 20, speed: 0.4 },
  { emoji: '🦈', size: 32, speed: 1.1 },
  { emoji: '🐙', size: 28, speed: 0.3 },
  { emoji: '🦑', size: 26, speed: 0.5 },
  { emoji: '🦀', size: 18, speed: 0.2 },
  { emoji: '🐚', size: 16, speed: 0.1 },
  { emoji: '🐢', size: 28, speed: 0.35 },
  { emoji: '🐬', size: 30, speed: 1.2 },
  { emoji: '🦐', size: 16, speed: 0.7 },
  { emoji: '🐳', size: 36, speed: 0.25 },
  { emoji: '🦞', size: 20, speed: 0.3 },
];

const JELLYFISH_COLORS = [
  'rgba(79, 195, 247, 0.6)',
  'rgba(128, 222, 234, 0.5)',
  'rgba(255, 215, 0, 0.4)',
  'rgba(255, 107, 107, 0.3)',
  'rgba(179, 136, 255, 0.5)',
];

// ── Create the full underwater scene ─────────────────────────────────
export function createUnderwaterScene() {
  scene = document.createElement('div');
  scene.className = 'underwater-scene';
  scene.id = 'underwaterScene';

  // Light rays from above
  const rays = document.createElement('div');
  rays.className = 'uw-light-rays';
  for (let i = 0; i < 5; i++) {
    const ray = document.createElement('div');
    ray.className = 'uw-ray';
    ray.style.left = `${10 + i * 20}%`;
    ray.style.animationDelay = `${i * 0.8}s`;
    ray.style.opacity = `${0.03 + Math.random() * 0.04}`;
    rays.appendChild(ray);
  }
  scene.appendChild(rays);

  // Fish score counter
  const scoreDiv = document.createElement('div');
  scoreDiv.className = 'uw-fish-score';
  scoreDiv.id = 'fishScore';
  scoreDiv.innerHTML = '🐟 <span id="fishScoreNum">0</span>';
  scene.appendChild(scoreDiv);

  // Fish (lots of them!)
  fishes = [];
  fishScareCount = 0;
  for (let i = 0; i < 18; i++) {
    const fishType = FISH_TYPES[Math.floor(Math.random() * FISH_TYPES.length)];
    const fish = document.createElement('div');
    fish.className = 'uw-fish';
    fish.textContent = fishType.emoji;
    fish.style.fontSize = `${fishType.size}px`;

    const startY = 10 + Math.random() * 65;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const speed = fishType.speed + Math.random() * 0.4;

    fish.style.top = `${startY}%`;
    fish.style.transform = direction < 0 ? 'scaleX(-1)' : 'scaleX(1)';
    fish.dataset.direction = direction;
    fish.dataset.speed = speed;
    fish.dataset.baseY = startY;
    fish.dataset.x = Math.random() * 100;
    fish.style.left = `${fish.dataset.x}%`;

    // Click to scare fish
    fish.addEventListener('click', () => scareFish(fish));
    fish.addEventListener('touchstart', (e) => {
      e.preventDefault();
      scareFish(fish);
    });

    scene.appendChild(fish);
    fishes.push(fish);
  }

  // Jellyfish
  jellyfishes = [];
  for (let i = 0; i < 4; i++) {
    const jf = document.createElement('div');
    jf.className = 'uw-jellyfish';
    jf.innerHTML = `
      <div class="uw-jf-head"></div>
      <div class="uw-jf-tentacles">
        <div class="uw-jf-tent"></div>
        <div class="uw-jf-tent"></div>
        <div class="uw-jf-tent"></div>
        <div class="uw-jf-tent"></div>
      </div>
    `;

    const color = JELLYFISH_COLORS[i % JELLYFISH_COLORS.length];
    jf.style.setProperty('--jf-color', color);
    jf.style.left = `${10 + i * 22}%`;
    jf.style.animationDelay = `${i * 2}s`;
    jf.dataset.baseGlow = '0';

    scene.appendChild(jf);
    jellyfishes.push(jf);
  }

  // Seaweed
  const seaweedContainer = document.createElement('div');
  seaweedContainer.className = 'uw-seaweed-container';
  for (let i = 0; i < 10; i++) {
    const seaweed = document.createElement('div');
    seaweed.className = 'uw-seaweed';
    seaweed.style.left = `${5 + i * 10}%`;
    seaweed.style.height = `${40 + Math.random() * 50}px`;
    seaweed.style.animationDelay = `${Math.random() * 2}s`;
    seaweed.style.animationDuration = `${2 + Math.random() * 2}s`;
    seaweedContainer.appendChild(seaweed);
  }
  scene.appendChild(seaweedContainer);

  // Coral reef (visual bars at bottom — doubles as visual EQ)
  const coralReef = document.createElement('div');
  coralReef.className = 'uw-coral-reef';
  coralReef.id = 'coralReef';
  const coralColors = ['#FF6B6B', '#FFD700', '#FF80AB', '#4FC3F7', '#76FF03', '#B388FF', '#FF9800', '#00BCD4'];
  for (let i = 0; i < 16; i++) {
    const coral = document.createElement('div');
    coral.className = 'uw-coral';
    coral.style.backgroundColor = coralColors[i % coralColors.length];
    coral.style.height = `${15 + Math.random() * 25}px`;
    coral.dataset.baseHeight = coral.style.height;
    coralReef.appendChild(coral);
  }
  scene.appendChild(coralReef);

  // Sand floor
  const sand = document.createElement('div');
  sand.className = 'uw-sand';
  scene.appendChild(sand);

  // Enhanced bubbles
  const bubbles = document.createElement('div');
  bubbles.className = 'uw-bubbles';
  for (let i = 0; i < 15; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'uw-bubble';
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.animationDuration = `${3 + Math.random() * 5}s`;
    bubble.style.animationDelay = `${Math.random() * 4}s`;
    const size = 4 + Math.random() * 10;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubbles.appendChild(bubble);
  }
  scene.appendChild(bubbles);

  return scene;
}

// ── Scare fish on click ──────────────────────────────────────────────
function scareFish(fishEl, isChain = false) {
  if (fishEl.classList.contains('uw-fish-scared')) return;
  fishEl.classList.add('uw-fish-scared');
  fishEl.style.transition = 'all 0.5s ease-out';

  // Increment score
  if (!isChain) {
    fishScareCount++;
    const scoreNum = document.getElementById('fishScoreNum');
    if (scoreNum) scoreNum.textContent = fishScareCount;

    // Show splash text
    const splash = document.createElement('div');
    splash.className = 'uw-splash-text';
    const splashTexts = ['SPLASH! 💦', 'KABUR! 🏃', 'HIYAA! 😱', 'NOOOO! 😭', 'BYE! 👋', '*panik*', 'HELP! 🆘'];
    splash.textContent = splashTexts[Math.floor(Math.random() * splashTexts.length)];
    splash.style.left = fishEl.style.left;
    splash.style.top = fishEl.style.top;
    scene.appendChild(splash);
    setTimeout(() => splash.remove(), 1000);
  }

  // Dash in opposite direction
  const dir = parseInt(fishEl.dataset.direction);
  const currentX = parseFloat(fishEl.dataset.x);
  const newX = currentX + (dir * -40);
  fishEl.dataset.x = Math.max(-10, Math.min(110, newX));
  fishEl.style.left = `${fishEl.dataset.x}%`;
  fishEl.style.transform = `scaleX(${-dir}) scale(1.3)`;

  // Flip direction
  fishEl.dataset.direction = -dir;

  // Chain scare: nearby fish also flee!
  if (!isChain) {
    const fx = parseFloat(fishEl.dataset.x);
    const fy = parseFloat(fishEl.dataset.baseY);
    fishes.forEach(otherFish => {
      if (otherFish === fishEl) return;
      const ox = parseFloat(otherFish.dataset.x);
      const oy = parseFloat(otherFish.dataset.baseY);
      const dist = Math.sqrt((fx - ox) ** 2 + (fy - oy) ** 2);
      if (dist < 20) {
        setTimeout(() => scareFish(otherFish, true), 100 + Math.random() * 200);
      }
    });
  }

  setTimeout(() => {
    fishEl.classList.remove('uw-fish-scared');
    fishEl.style.transition = '';
    fishEl.style.transform = `scaleX(${-dir})`;
  }, 800);
}

// ── Animate scene with music data ────────────────────────────────────
export function startSceneAnimation() {
  if (isAnimating) return;
  isAnimating = true;
  animateScene();
}

export function stopSceneAnimation() {
  isAnimating = false;
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
}

function animateScene() {
  if (!isAnimating) return;
  animFrameId = requestAnimationFrame(animateScene);

  const data = getFrequencyData();
  const hasAudio = data.length > 0 && data.some(v => v > 0);

  // Move fish
  fishes.forEach(fish => {
    if (fish.classList.contains('uw-fish-scared')) return;
    const dir = parseInt(fish.dataset.direction);
    const speed = parseFloat(fish.dataset.speed);
    let x = parseFloat(fish.dataset.x);

    x += dir * speed * 0.15;

    // Wrap around
    if (x > 105) { x = -5; }
    if (x < -5) { x = 105; }

    fish.dataset.x = x;
    fish.style.left = `${x}%`;

    // Gentle vertical bobbing
    const baseY = parseFloat(fish.dataset.baseY);
    const bobAmount = hasAudio ? 3 : 1.5;
    const bob = Math.sin(Date.now() / 1000 * speed + parseFloat(fish.dataset.baseY)) * bobAmount;
    fish.style.top = `${baseY + bob}%`;
  });

  // React jellyfish to bass frequencies
  if (hasAudio) {
    const bassAvg = (data[0] + data[1] + data[2] + data[3]) / 4;
    const midAvg = (data[10] + data[11] + data[12] + data[13]) / 4;

    jellyfishes.forEach((jf, i) => {
      const intensity = (i % 2 === 0 ? bassAvg : midAvg) / 255;
      const glow = Math.floor(intensity * 30);
      const scale = 1 + intensity * 0.15;
      jf.style.filter = `brightness(${1 + intensity * 0.5}) drop-shadow(0 0 ${glow}px var(--jf-color))`;
      jf.style.transform = `scale(${scale})`;
    });

    // Coral reef reacts as EQ bars
    const coralReef = document.getElementById('coralReef');
    if (coralReef) {
      const corals = coralReef.children;
      const step = Math.floor(data.length / corals.length);
      for (let i = 0; i < corals.length; i++) {
        const value = data[i * step] || 0;
        const baseH = parseInt(corals[i].dataset.baseHeight) || 20;
        const boost = (value / 255) * 40;
        corals[i].style.height = `${baseH + boost}px`;
        corals[i].style.opacity = `${0.6 + (value / 255) * 0.4}`;
      }
    }
  } else {
    // Reset jellyfish glow when no audio
    jellyfishes.forEach(jf => {
      jf.style.filter = '';
      jf.style.transform = '';
    });
  }
}

// Cleanup
export function destroyUnderwaterScene() {
  stopSceneAnimation();
  fishes = [];
  jellyfishes = [];
  scene = null;
}
