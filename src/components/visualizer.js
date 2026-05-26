// Pixel-style audio visualizer using canvas

import { getFrequencyData, getAnalyser } from '../audio.js';

let canvas = null;
let ctx = null;
let animationId = null;
let isRunning = false;

export function createVisualizer() {
  const container = document.createElement('div');
  container.className = 'visualizer-container';
  container.id = 'visualizer';

  canvas = document.createElement('canvas');
  canvas.className = 'visualizer-canvas';
  canvas.width = 400;
  canvas.height = 120;
  container.appendChild(canvas);

  ctx = canvas.getContext('2d');

  return container;
}

export function startVisualizer() {
  if (isRunning) return;
  isRunning = true;

  try {
    getAnalyser();
  } catch (e) {
    // Analyser not ready yet
  }

  draw();
}

export function stopVisualizer() {
  isRunning = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

function draw() {
  if (!isRunning || !canvas || !ctx) return;

  animationId = requestAnimationFrame(draw);

  const data = getFrequencyData();
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Number of bars
  const barCount = 32;
  const barWidth = Math.floor(w / barCount) - 2;
  const step = Math.floor(data.length / barCount);

  // Pixel-style bar colors (ocean gradient)
  const colors = [
    '#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1',
    '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7',
    '#00838F', '#006064', '#4FC3F7', '#29B6F6',
    '#03A9F4', '#039BE5', '#0288D1', '#0277BD',
    '#FFD700', '#FFC107', '#FF9800', '#FF6B6B',
    '#4FC3F7', '#29B6F6', '#03A9F4', '#039BE5',
    '#0288D1', '#0277BD', '#01579B', '#0D47A1',
    '#1565C0', '#1976D2', '#1E88E5', '#2196F3',
  ];

  for (let i = 0; i < barCount; i++) {
    const value = data[i * step] || 0;
    const barHeight = (value / 255) * h * 0.9;

    // Draw pixelated bar (stacked blocks)
    const blockSize = 6;
    const blocks = Math.floor(barHeight / blockSize);

    for (let j = 0; j < blocks; j++) {
      const x = i * (barWidth + 2) + 1;
      const y = h - (j + 1) * blockSize;

      // Color gradient based on height
      const colorIdx = Math.min(Math.floor((j / blocks) * 6), 5);
      const baseColors = ['#01579B', '#0288D1', '#4FC3F7', '#FFD700', '#FF9800', '#FF6B6B'];
      ctx.fillStyle = baseColors[colorIdx] || colors[i % colors.length];

      ctx.fillRect(x, y, barWidth, blockSize - 1);
    }
  }

  // Draw baseline
  ctx.fillStyle = 'rgba(79, 195, 247, 0.3)';
  ctx.fillRect(0, h - 2, w, 2);
}

export function resizeVisualizer() {
  if (!canvas) return;
  const container = canvas.parentElement;
  if (container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight || 120;
  }
}
