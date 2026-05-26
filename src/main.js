// Main entry point for Pixel Music Player
import './style.css';
import { registerRoute, initRouter } from './router.js';
import { renderWelcomePage } from './pages/welcomePage.js';
import { renderQuizPage } from './pages/quizPage.js';
import { renderRoastPage } from './pages/roastPage.js';
import { renderPlayerPage } from './pages/playerPage.js';
import { createPixelClouds, createPixelWaves, createPixelStars } from './components/pixelArt.js';

// Register SPA routes
registerRoute('welcome', renderWelcomePage);
registerRoute('quiz', renderQuizPage);
registerRoute('gameover', renderRoastPage);
registerRoute('player', renderPlayerPage);

// Initialize background decorations
function initBackground() {
  const bg = document.getElementById('pixel-bg');
  if (!bg) return;

  // Add stars, clouds, and waves to the background layer
  document.body.appendChild(createPixelStars());
  document.body.appendChild(createPixelClouds());
  document.body.appendChild(createPixelWaves());
}

// Boot up
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  initBackground();
  initRouter(app);
});
