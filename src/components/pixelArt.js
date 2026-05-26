// Pixel art decorations generated with CSS/HTML

export function createPixelClouds() {
  const container = document.createElement('div');
  container.className = 'pixel-clouds';

  for (let i = 0; i < 5; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'pixel-cloud';
    cloud.style.top = `${5 + Math.random() * 25}%`;
    cloud.style.animationDuration = `${18 + Math.random() * 20}s`;
    cloud.style.animationDelay = `${-Math.random() * 20}s`;
    cloud.style.opacity = `${0.15 + Math.random() * 0.25}`;
    cloud.style.transform = `scale(${0.5 + Math.random() * 1})`;
    container.appendChild(cloud);
  }

  return container;
}

export function createPixelWaves() {
  const container = document.createElement('div');
  container.className = 'pixel-waves';

  for (let i = 0; i < 4; i++) {
    const wave = document.createElement('div');
    wave.className = 'pixel-wave';
    wave.style.bottom = `${i * 12}px`;
    wave.style.animationDelay = `${i * -0.8}s`;
    wave.style.opacity = `${0.5 - i * 0.1}`;
    container.appendChild(wave);
  }

  return container;
}

export function createPixelStars() {
  const container = document.createElement('div');
  container.className = 'pixel-stars';

  for (let i = 0; i < 25; i++) {
    const star = document.createElement('div');
    star.className = 'pixel-star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 60}%`;
    star.style.animationDelay = `${Math.random() * 3}s`;
    star.style.animationDuration = `${1.5 + Math.random() * 2}s`;
    container.appendChild(star);
  }

  return container;
}

export function createPixelBubbles() {
  const container = document.createElement('div');
  container.className = 'pixel-bubbles';

  for (let i = 0; i < 12; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'pixel-bubble';
    bubble.style.left = `${Math.random() * 100}%`;
    bubble.style.animationDuration = `${4 + Math.random() * 6}s`;
    bubble.style.animationDelay = `${Math.random() * 5}s`;
    bubble.style.width = bubble.style.height = `${4 + Math.random() * 8}px`;
    container.appendChild(bubble);
  }

  return container;
}

export function createHearts(count) {
  const container = document.createElement('div');
  container.className = 'pixel-hearts';
  container.id = 'lives-display';

  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('span');
    heart.className = `pixel-heart ${i < count ? 'alive' : 'dead'}`;
    heart.textContent = i < count ? '❤️' : '🖤';
    heart.id = `heart-${i}`;
    container.appendChild(heart);
  }

  return container;
}

export function createConfetti(parentEl) {
  const colors = ['#FFD700', '#FF6B6B', '#76FF03', '#4FC3F7', '#FF80AB', '#B388FF'];
  const container = document.createElement('div');
  container.className = 'confetti-container';

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.animationDuration = `${1 + Math.random() * 2}s`;
    container.appendChild(piece);
  }

  parentEl.appendChild(container);

  setTimeout(() => {
    container.remove();
  }, 3500);
}

export function createPixelCharacter(mood = 'happy') {
  const el = document.createElement('div');
  el.className = `pixel-character ${mood}`;

  if (mood === 'happy') {
    el.innerHTML = `
      <div class="pc-body">
        <div class="pc-face">
          <div class="pc-eye left"></div>
          <div class="pc-eye right"></div>
          <div class="pc-mouth happy"></div>
        </div>
      </div>
    `;
  } else if (mood === 'sad') {
    el.innerHTML = `
      <div class="pc-body sad-body">
        <div class="pc-face">
          <div class="pc-eye left sad-eye"></div>
          <div class="pc-eye right sad-eye"></div>
          <div class="pc-mouth sad"></div>
        </div>
        <div class="pc-tear left"></div>
        <div class="pc-tear right"></div>
      </div>
    `;
  } else if (mood === 'cool') {
    el.innerHTML = `
      <div class="pc-body cool-body">
        <div class="pc-face">
          <div class="pc-sunglasses"></div>
          <div class="pc-mouth cool"></div>
        </div>
        <div class="pc-headphones"></div>
      </div>
    `;
  }

  return el;
}
