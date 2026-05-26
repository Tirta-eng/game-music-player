// Welcome / Landing page — asks user if they want to play
// If they say no... well, they don't really have a choice 😈

import { navigate } from '../router.js';
import { sfxClick, sfxNavigate, resumeAudio } from '../sfx.js';
import { createPixelCharacter, createPixelStars, createPixelClouds } from '../components/pixelArt.js';

// Stage 0: Initial question
// Stage 1-5: Progressively more desperate confirmations
// Stage 6+: No button transforms or disappears

const STAGES = [
  {
    // Stage 0: Normal greeting
    title: '🐠 OCEAN BEATS ARCADE',
    subtitle: 'Selamat datang di dunia musik bawah laut 8-bit!',
    question: 'Mau main teka-teki musik dulu?',
    yesText: 'MAU DONG! 🎵',
    noText: 'NGGAK AH 😒',
  },
  {
    // Stage 1: Surprised
    question: 'Eh serius nih nggak mau? 😮',
    yesText: 'OKE DEH, MAU 🙄',
    noText: 'NGGAK. 😤',
  },
  {
    // Stage 2: Begging
    question: 'Please... soalnya gampang kok! 🥺',
    yesText: 'YA YA MAU 😅',
    noText: 'TETEP NGGAK 🙅',
  },
  {
    // Stage 3: Threatening
    question: 'Kamu yakin? Ntar nyesel loh... 😈',
    yesText: 'IYA DEH MAU! 😰',
    noText: 'NGGAK TAKUT 💪',
  },
  {
    // Stage 4: Guilt trip
    question: 'Kasihan aku dong, udah capek ngoding ini... 😭',
    yesText: 'AAAH OKE MAU! 😫',
    noText: 'BIARIN 😎',
  },
  {
    // Stage 5: Last warning
    question: 'Ini kesempatan terakhir kamu... ⚠️',
    yesText: 'MAU MAU MAU! 🏳️',
    noText: 'NGGAK NGGAK NGGAK 🚫',
  },
  {
    // Stage 6: No button starts running away
    question: 'Yaudah kalo gitu... 😏',
    yesText: 'OKE FINE, MAU! 😤',
    noText: 'NGG— eh kok— 😳',
    noRunsAway: true,
  },
  {
    // Stage 7: No button shrinks
    question: 'Tombolnya udah capek ditolak terus 😂',
    yesText: 'MAU!!! 🎉',
    noText: '... 🥲',
    noShrinks: true,
  },
  {
    // Stage 8: No button becomes yes
    question: 'Kayaknya kamu emang mau deh! 😏',
    yesText: 'MAU! ✅',
    noText: 'MAU JUGA! ✅',
    noBecomeYes: true,
  },
];

let currentStage = 0;

export function renderWelcomePage(container) {
  currentStage = 0;
  renderStage(container);
}

function renderStage(container) {
  const stage = STAGES[Math.min(currentStage, STAGES.length - 1)];
  const isFirstStage = currentStage === 0;

  container.innerHTML = `
    <div class="welcome-page">
      <div class="welcome-bg-stars" id="welcomeStars"></div>
      <div class="welcome-bg-clouds" id="welcomeClouds"></div>

      <div class="welcome-content">
        ${isFirstStage ? `
          <h1 class="welcome-title">${stage.title}</h1>
          <p class="welcome-subtitle">${stage.subtitle}</p>
        ` : ''}

        <div class="welcome-character" id="welcomeChar"></div>

        <div class="welcome-question-box pixel-border">
          <p class="welcome-question">${stage.question}</p>
          ${currentStage > 0 && currentStage < STAGES.length - 1 ? `
            <p class="welcome-attempt-count">Penolakan ke-${currentStage}... 🙄</p>
          ` : ''}
        </div>

        <div class="welcome-buttons" id="welcomeButtons">
          <button class="pixel-btn gold welcome-yes" id="btnYes">${stage.yesText}</button>
          <button class="pixel-btn coral welcome-no" id="btnNo"
            ${stage.noRunsAway ? 'data-runaway="true"' : ''}
            ${stage.noShrinks ? 'data-shrink="true"' : ''}
            ${stage.noBecomeYes ? 'data-become-yes="true"' : ''}
          >${stage.noText}</button>
        </div>

        ${currentStage >= 3 ? `
          <p class="welcome-hint">💡 Psst... tombol emas itu terlihat lebih menarik loh...</p>
        ` : ''}
      </div>
    </div>
  `;

  // Inject decorations
  const starsSlot = container.querySelector('#welcomeStars');
  if (starsSlot && isFirstStage) starsSlot.appendChild(createPixelStars());

  const cloudsSlot = container.querySelector('#welcomeClouds');
  if (cloudsSlot && isFirstStage) cloudsSlot.appendChild(createPixelClouds());

  const charSlot = container.querySelector('#welcomeChar');
  if (charSlot) {
    const mood = currentStage === 0 ? 'happy' : currentStage < 5 ? 'sad' : 'cool';
    charSlot.appendChild(createPixelCharacter(mood));
  }

  // YES button — always goes to quiz
  const btnYes = container.querySelector('#btnYes');
  btnYes.addEventListener('click', () => {
    resumeAudio();
    sfxClick();
    sfxNavigate();
    navigate('quiz');
  });

  // Make yes button pulse to attract attention after stage 2
  if (currentStage >= 2) {
    btnYes.classList.add('pulse-attract');
  }

  // NO button — various trolling behaviors
  const btnNo = container.querySelector('#btnNo');

  if (stage.noBecomeYes) {
    // Both buttons now go to quiz
    btnNo.addEventListener('click', () => {
      resumeAudio();
      sfxClick();
      sfxNavigate();
      navigate('quiz');
    });
    return;
  }

  if (stage.noRunsAway) {
    // Button runs away from mouse
    let moveCount = 0;
    const runAway = () => {
      moveCount++;
      const maxX = window.innerWidth - 200;
      const maxY = window.innerHeight - 100;
      const randX = Math.floor(Math.random() * maxX);
      const randY = Math.floor(Math.random() * maxY);
      btnNo.style.position = 'fixed';
      btnNo.style.left = `${randX}px`;
      btnNo.style.top = `${randY}px`;
      btnNo.style.zIndex = '9999';
      btnNo.style.transition = 'all 0.2s ease-out';

      // After running away 4 times, go to next stage
      if (moveCount >= 4) {
        currentStage++;
        setTimeout(() => renderStage(container), 300);
      }
    };

    btnNo.addEventListener('mouseenter', runAway);
    btnNo.addEventListener('touchstart', (e) => {
      e.preventDefault();
      runAway();
    });
    btnNo.addEventListener('click', () => {
      sfxClick();
      currentStage++;
      renderStage(container);
    });
    return;
  }

  if (stage.noShrinks) {
    // Button shrinks until invisible
    let shrinkCount = 0;
    btnNo.addEventListener('click', () => {
      sfxClick();
      shrinkCount++;
      const scale = Math.max(0, 1 - shrinkCount * 0.25);
      btnNo.style.transform = `scale(${scale})`;
      btnNo.style.opacity = `${scale}`;

      if (shrinkCount >= 4) {
        currentStage++;
        setTimeout(() => renderStage(container), 300);
      }
    });
    return;
  }

  // Default: go to next stage
  btnNo.addEventListener('click', () => {
    sfxClick();
    currentStage++;

    // Shake the question box for drama
    const box = container.querySelector('.welcome-question-box');
    if (box) {
      box.classList.add('shake');
      setTimeout(() => box.classList.remove('shake'), 500);
    }

    setTimeout(() => renderStage(container), 400);
  });
}
