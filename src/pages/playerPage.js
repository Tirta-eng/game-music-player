// 🎮 Music Player Page — Split View: Player + Submarine Rhythm Runner
// Featuring: Live Webcam Comparison Sanksi (Jokowi/Monkey) & VIP Neon Party Mode Hadiah!
// Now with Free Play Mode (No Sanksi) & Minimize Game panel!

import { getState, setState, resetQuiz, resetPlayer, loadSongsFromManifest } from '../state.js';
import { sfxClick, sfxCorrect, sfxVictory, sfxNavigate } from '../sfx.js';
import { navigate } from '../router.js';
import * as audio from '../audio.js';
import { createVisualizer, startVisualizer, stopVisualizer, resizeVisualizer } from '../components/visualizer.js';
import { createRhythmRunner, startRhythmRunner, stopRhythmRunner, destroyRhythmRunner } from '../components/rhythmRunner.js';

const CONGRATS_MESSAGES = [
  '🧠 Selamat! IQ anda setara Albert Einstein!',
  '🎓 Profesor musik terdeteksi!',
  '🏆 Otak kamu encer banget! 🌊',
  '🔥 Kamu terlalu pintar!',
  '👑 Raja/Ratu musik telah tiba!',
  '🐠 Ikan-ikan aja kagum sama kamu!',
];

const REWARD_MESSAGES = [
  'KAMU EMANG LEGEND! RHYTHM MASTER SEJATI! 🏆',
  'POSEIDON AJA KALAH SAMA KAMU! 🔱',
  'KAMU RESMI JADI RAJA LAUTAN! 👑',
  'PRO DIVING MUSICIAN UPGRADED! 🤿',
  'RHYTHM RUNNER LEGENDARY! RESPECT! 💎',
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function getVolumeIcon(vol) {
  if (vol <= 0) return '🔇';
  if (vol < 0.3) return '🔈';
  if (vol < 0.7) return '🔉';
  return '🔊';
}

export async function renderPlayerPage(container) {
  const ac = new AbortController();
  const signal = ac.signal;

  const state = getState();
  const showCongrats = state.quizCompleted;

  if (showCongrats) {
    sfxVictory();
    setState({ quizCompleted: false });
  }

  await loadSongsFromManifest();

  const congrats = pickRandom(CONGRATS_MESSAGES);
  const currentSong = state.songs[state.currentSongIndex];

  // Set default neon party mode to false
  setState({ neonPartyMode: false });

  container.innerHTML = `
    <div class="split-player" id="splitPlayerContainer">

      <!-- Toast -->
      ${showCongrats ? `
      <div class="ap-toast" id="congratsToast">
        <span class="ap-toast-icon">🏆</span>
        <span class="ap-toast-msg">${congrats}</span>
        <button class="ap-toast-close" id="toastClose">✕</button>
      </div>
      ` : ''}

      <!-- LEFT: Music Player -->
      <div class="sp-player-side" id="playerSide">
        <div class="sp-player-inner">

          <div class="sp-header">
            <button class="sp-back-btn" id="btnRestart">← KEMBALI</button>
            <button class="sp-back-btn rr-restore-game-btn" id="btnRestoreGame" style="display:none; color:#00F5FF; border-color:rgba(0,245,255,0.35);">🎮 TAMPILKAN GAME</button>
            <div class="vip-badge" id="vipBadge" style="display:none;">👑 VIP UNLOCKED</div>
          </div>

          <div class="sp-album-area">
            <div class="sp-disc" id="spDisc">
              <div class="sp-disc-inner"><span class="sp-disc-emoji" id="discEmoji">🎵</span></div>
              <div class="sp-disc-ring"></div>
              <div class="sp-disc-ring sp-disc-ring-2"></div>
            </div>
          </div>

          <div class="sp-song-info">
            <div class="sp-song-title" id="songTitle">${currentSong.title}</div>
            <div class="sp-song-artist" id="songArtist">${currentSong.artist}</div>
          </div>

          <div class="sp-visualizer" id="vizSlot"></div>

          <div class="sp-progress">
            <span class="sp-time" id="currentTime">0:00</span>
            <div class="sp-progress-track" id="progressBar">
              <div class="sp-progress-fill" id="progressFill"></div>
              <div class="sp-progress-thumb" id="progressThumb"></div>
            </div>
            <span class="sp-time" id="totalTime">0:00</span>
          </div>

          <div class="sp-controls">
            <button class="sp-btn" id="btnShuffle">🔀</button>
            <button class="sp-btn" id="btnPrev">⏮</button>
            <button class="sp-btn sp-btn-play" id="playBtn">▶</button>
            <button class="sp-btn" id="btnNext">⏭</button>
            <button class="sp-btn" id="btnRepeat">🔁</button>
          </div>

          <div class="sp-volume">
            <button class="sp-btn sp-vol-icon" id="volumeIcon">${getVolumeIcon(state.volume)}</button>
            <input type="range" class="sp-volume-slider" id="volumeSlider"
                   min="0" max="1" step="0.01" value="${state.volume}">
          </div>

          <div class="sp-playlist-section">
            <div class="sp-playlist-title">📜 PLAYLIST</div>
            <div class="sp-playlist-list" id="playlistList"></div>
          </div>

        </div>
      </div>

      <!-- RIGHT: Submarine Rhythm Runner Game -->
      <div class="sp-game-side" id="gameArea"></div>

      <!-- Result / Reward / Punishment Overlay -->
      <div class="rr-result-overlay" id="resultOverlay" style="display:none;">
        <div class="rr-result-card" id="resultCard">
          
          <!-- Win State View -->
          <div id="winView" style="display:none;">
            <div class="rr-win-header">
              <img class="rr-result-img pulse" src="/images/trophy.png" alt="Trophy">
              <div class="rr-result-title">🎉 VICTORY! HADIAH UNLOCKED</div>
            </div>
            <div class="rr-result-msg">${pickRandom(REWARD_MESSAGES)}</div>
            
            <!-- Digital Certificate -->
            <div class="rr-certificate pixel-border">
              <div class="cert-gold-star">⭐</div>
              <div class="cert-title">SERTIFIKAT KELULUSAN KERAJAAN LAUT</div>
              <div class="cert-desc">Dengan ini menyatakan bahwa user adalah</div>
              <div class="cert-name">🏆 DEEP SEA RHYTHM MASTER 🏆</div>
              <div class="cert-footer">Diverifikasi oleh Poseidon & Keong Racun 🐚</div>
            </div>

            <div class="rr-reward-actions">
              <button class="pixel-btn gold rr-party-btn" id="btnPartyToggle">🌈 AKTIFKAN VIP PARTY MODE</button>
              <div class="post-win-options" style="margin-top:12px; display:flex; justify-content:center; gap:8px; flex-wrap:wrap;">
                <button class="rr-result-btn" id="btnPlayAgainFree" style="background:rgba(0, 230, 118, 0.15); border-color:#00E676; color:#00E676;">🎮 MAIN LAGI (FREE PLAY)</button>
                <button class="rr-result-btn rr-result-btn-close" id="btnMinimizeGame">🎵 FOKUS DENGERIN (MINIMIZE)</button>
              </div>
            </div>
          </div>

          <!-- Lose State View -->
          <div id="loseView" style="display:none;">
            <div class="rr-result-title" id="loseTitleText">💀 GAME OVER! SANKSINYA TIBA!</div>
            <div class="rr-result-msg" id="loseMsgText">Kemampuan mengemudimu payah! Kamu harus dihukum!</div>
            
            <div class="punish-select-box">
              <p class="punish-prompt">Pilih cermin kembaran hukumanmu:</p>
              <div class="punish-buttons">
                <button class="pixel-btn coral punish-opt-btn" data-type="monkey">🐒 Wajah Monyet</button>
                <button class="pixel-btn gold punish-opt-btn" data-type="jokowi">👨‍✈️ Wajah Jokowi</button>
              </div>
            </div>

            <!-- Webcam Live Comparison Container -->
            <div class="webcam-comparison-container" id="webcamComparison" style="display:none;">
              <div class="comparison-row">
                <div class="comparison-box webcam-feed">
                  <div class="box-label">KAMERA ANDA</div>
                  <video id="webcamVideo" autoplay playsinline></video>
                  <!-- Fallback Stick Figure SVG -->
                  <div id="cameraFallback" class="camera-fallback-silhouette" style="display:none;">
                    <svg viewBox="0 0 100 100" class="fallback-svg">
                      <circle cx="50" cy="35" r="15" fill="none" stroke="#FF4444" stroke-width="4"/>
                      <line x1="50" y1="50" x2="50" y2="80" stroke="#FF4444" stroke-width="4"/>
                      <line x1="50" y1="60" x2="25" y2="50" stroke="#FF4444" stroke-width="4"/>
                      <line x1="50" y1="60" x2="75" y2="50" stroke="#FF4444" stroke-width="4"/>
                      <line x1="50" y1="80" x2="30" y2="95" stroke="#FF4444" stroke-width="4"/>
                      <line x1="50" y1="80" x2="70" y2="95" stroke="#FF4444" stroke-width="4"/>
                      <!-- Crying tears -->
                      <circle cx="45" cy="35" r="1.5" fill="#4FC3F7"/>
                      <circle cx="55" cy="35" r="1.5" fill="#4FC3F7"/>
                      <path d="M 45 42 Q 50 38 55 42" fill="none" stroke="#FF4444" stroke-width="2"/>
                    </svg>
                    <p class="fallback-text">Crying Silhouette (Camera Blocked)</p>
                  </div>
                </div>
                <div class="comparison-vs">VS</div>
                <div class="comparison-box comparison-target">
                  <div class="box-label" id="targetLabel">KEMBARAN</div>
                  <img id="comparisonTargetImg" src="" alt="Target">
                </div>
              </div>
              <div class="similarity-scanner">
                <div class="scanner-bar"></div>
                <div class="similarity-result" id="similarityResult">Mencocokkan kemiripan wajah...</div>
              </div>
            </div>

            <div class="rr-lose-actions" style="margin-top:16px;">
              <button class="rr-result-btn" id="loseRetry">🔄 COBA LAGI (TEBUS DOSA)</button>
              <button class="rr-result-btn rr-result-btn-close" id="loseClose">🎵 TERIMA NASIB & DENGERIN</button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;

  // ── DOM refs ────────────────────────────────────────────────────
  const songTitle             = container.querySelector('#songTitle');
  const songArtist            = container.querySelector('#songArtist');
  const progressBar           = container.querySelector('#progressBar');
  const progressFill          = container.querySelector('#progressFill');
  const progressThumb         = container.querySelector('#progressThumb');
  const currentTimeEl         = container.querySelector('#currentTime');
  const totalTimeEl           = container.querySelector('#totalTime');
  const playBtn               = container.querySelector('#playBtn');
  const btnShuffle            = container.querySelector('#btnShuffle');
  const btnPrev               = container.querySelector('#btnPrev');
  const btnNext               = container.querySelector('#btnNext');
  const btnRepeat             = container.querySelector('#btnRepeat');
  const volumeSlider          = container.querySelector('#volumeSlider');
  const volumeIcon            = container.querySelector('#volumeIcon');
  const playlistList          = container.querySelector('#playlistList');
  const spDisc                = container.querySelector('#spDisc');
  const discEmoji             = container.querySelector('#discEmoji');
  const splitPlayerContainer  = container.querySelector('#splitPlayerContainer');
  const vipBadge              = container.querySelector('#vipBadge');
  const btnRestoreGame        = container.querySelector('#btnRestoreGame');
  const gameArea              = container.querySelector('#gameArea');

  // Result UI
  const resultOverlay         = container.querySelector('#resultOverlay');
  const resultCard            = container.querySelector('#resultCard');
  const winView               = container.querySelector('#winView');
  const loseView              = container.querySelector('#loseView');

  // Webcam Elements
  const webcamComparison      = container.querySelector('#webcamComparison');
  const webcamVideo           = container.querySelector('#webcamVideo');
  const cameraFallback        = container.querySelector('#cameraFallback');
  const comparisonTargetImg   = container.querySelector('#comparisonTargetImg');
  const targetLabel           = container.querySelector('#targetLabel');
  const similarityResult      = container.querySelector('#similarityResult');

  let localWebcamStream = null;
  let activeFreePlayMode = false; // Tracks if game session is a Free Play (no-punish) session

  // ── Stop Webcam Track Helper ────────────────────────────────────
  function stopWebcam() {
    if (localWebcamStream) {
      localWebcamStream.getTracks().forEach(track => track.stop());
      localWebcamStream = null;
    }
    if (webcamVideo) {
      webcamVideo.srcObject = null;
    }
  }

  // ── Camera access setup ──────────────────────────────────────────
  function triggerWebcamPunishment(type) {
    sfxClick();
    webcamComparison.style.display = 'block';
    similarityResult.textContent = 'Mencari kecocokan AI... 🔍';
    similarityResult.className = 'similarity-result scanning';

    if (type === 'monkey') {
      comparisonTargetImg.src = '/images/monkey.png';
      targetLabel.textContent = 'MONYET HUKUMAN 🐒';
    } else {
      comparisonTargetImg.src = '/images/jokowi.png';
      targetLabel.textContent = 'BAPAK JOKOWI 👨‍✈️';
    }

    // Stop current stream if any
    stopWebcam();

    navigator.mediaDevices.getUserMedia({ video: { width: 200, height: 150 } })
      .then(stream => {
        localWebcamStream = stream;
        webcamVideo.style.display = 'block';
        cameraFallback.style.display = 'none';
        webcamVideo.srcObject = stream;
        webcamVideo.play();

        setTimeout(() => {
          similarityResult.className = 'similarity-result match';
          if (type === 'monkey') {
            similarityResult.innerHTML = 'Kecocokan AI: <strong style="color:#FF4444;">99.85%! 🐒</strong> (Monyet identik)';
          } else {
            similarityResult.innerHTML = 'Kecocokan AI: <strong style="color:#FFD700;">99.92%! 👨‍✈️</strong> (Presiden Kecewa)';
          }
        }, 2200);
      })
      .catch(err => {
        console.warn('Webcam blocked or unavailable:', err);
        webcamVideo.style.display = 'none';
        cameraFallback.style.display = 'block';

        setTimeout(() => {
          similarityResult.className = 'similarity-result match';
          similarityResult.innerHTML = 'Kecocokan AI Siluet: <strong style="color:#FF4444;">100.0%! 😭</strong> (Kamera Diblokir)';
        }, 1500);
      });
  }

  // ── Game End Callback ───────────────────────────────────────────
  function onGameEnd(won, finalScore, isFreePlay) {
    resultOverlay.style.display = 'flex';
    resultCard.classList.remove('rr-win-layout', 'rr-lose-layout');

    // Clean any camera
    stopWebcam();
    webcamComparison.style.display = 'none';

    if (won) {
      sfxCorrect();
      resultCard.classList.add('rr-win-layout');
      winView.style.display = 'block';
      loseView.style.display = 'none';
      vipBadge.style.display = 'block'; // Show VIP unlock badge
    } else {
      resultCard.classList.add('rr-lose-layout');
      winView.style.display = 'none';
      loseView.style.display = 'block';

      const punishBox = container.querySelector('.punish-select-box');
      const loseMsgText = container.querySelector('#loseMsgText');
      const loseTitleText = container.querySelector('#loseTitleText');

      if (isFreePlay || activeFreePlayMode) {
        // Free Play mode: No punishment!
        punishBox.style.display = 'none';
        loseTitleText.textContent = '🌊 KAPAL SELAM KARAM!';
        loseTitleText.style.color = '#00F5FF';
        loseMsgText.innerHTML = `
          Tenang! Karena kamu sudah menjadi <strong>Diver Musik Legenda</strong>,<br>
          kamu <span style="color:#00FF7F; font-weight:bold;">KEBAL SANKSI</span> dan tidak perlu membandingkan wajah! 😎<br>
          Skor akhir: <strong>${finalScore} / 35</strong>
        `;
        container.querySelector('#loseClose').textContent = '🎵 LANJUT DENGERIN';
      } else {
        // Standard mode: Show sanksi webcam options
        punishBox.style.display = 'block';
        loseTitleText.textContent = '💀 GAME OVER! SANKSINYA TIBA!';
        loseTitleText.style.color = '#FF4444';
        loseMsgText.textContent = 'Kemampuan mengemudimu payah! Kamu harus dihukum!';
        container.querySelector('#loseClose').textContent = '🎵 TERIMA NASIB & DENGERIN';
      }
    }

    resultOverlay.classList.add('rr-result-show');
  }

  // ── Minimize & Restore Game Panel Helpers ──────────────────────
  function minimizeGamePanel() {
    splitPlayerContainer.classList.add('game-minimized');
    btnRestoreGame.style.display = 'block';

    // Stop and destroy game loop while minimized to conserve client performance
    destroyRhythmRunner();
    gameArea.innerHTML = '';

    setTimeout(() => {
      resizeVisualizer();
    }, 180);
  }

  function restoreGamePanel() {
    splitPlayerContainer.classList.remove('game-minimized');
    btnRestoreGame.style.display = 'none';

    // Recreate the game immediately based on current activeFreePlayMode status
    destroyRhythmRunner();
    gameArea.innerHTML = '';
    gameArea.appendChild(createRhythmRunner(onGameEnd, activeFreePlayMode));
    startRhythmRunner();

    setTimeout(() => {
      resizeVisualizer();
    }, 180);
  }

  // ── Inject Submarine Rhythm Runner ────────────────────────────────
  gameArea.appendChild(createRhythmRunner(onGameEnd, activeFreePlayMode));
  startRhythmRunner();

  // ── Action Listeners ─────────────────────────────────────────────
  
  // Restore Game Button (only visible when minimized)
  btnRestoreGame.addEventListener('click', () => {
    restoreGamePanel();
  }, { signal });

  // Punishment Selection Buttons
  container.querySelectorAll('.punish-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-type');
      triggerWebcamPunishment(type);
    }, { signal });
  });

  // VIP Party Mode Toggle
  const btnPartyToggle = container.querySelector('#btnPartyToggle');
  btnPartyToggle.addEventListener('click', () => {
    sfxClick();
    const isParty = getState().neonPartyMode;
    const nextParty = !isParty;
    setState({ neonPartyMode: nextParty });

    if (nextParty) {
      splitPlayerContainer.classList.add('neon-party-active');
      btnPartyToggle.textContent = '🌈 MATIKAN PARTY MODE';
      btnPartyToggle.classList.remove('gold');
      btnPartyToggle.classList.add('coral');
      discEmoji.textContent = '👑';
    } else {
      splitPlayerContainer.classList.remove('neon-party-active');
      btnPartyToggle.textContent = '🌈 AKTIFKAN VIP PARTY MODE!';
      btnPartyToggle.classList.remove('coral');
      btnPartyToggle.classList.add('gold');
      discEmoji.textContent = '🎵';
    }
  }, { signal });

  // Victory Overlay options
  // 1. Play Again (Free Play Mode)
  container.querySelector('#btnPlayAgainFree').addEventListener('click', () => {
    sfxClick();
    activeFreePlayMode = true; // Permanent free mode
    resultOverlay.classList.remove('rr-result-show');
    setTimeout(() => {
      resultOverlay.style.display = 'none';
      destroyRhythmRunner();
      gameArea.innerHTML = '';
      gameArea.appendChild(createRhythmRunner(onGameEnd, true));
      startRhythmRunner();
    }, 300);
  }, { signal });

  // 2. Minimize Game & Focus Music
  container.querySelector('#btnMinimizeGame').addEventListener('click', () => {
    sfxClick();
    resultOverlay.classList.remove('rr-result-show');
    resultOverlay.style.display = 'none';
    minimizeGamePanel();
  }, { signal });


  // Lose close button (Accept fate)
  container.querySelector('#loseClose').addEventListener('click', () => {
    sfxClick();
    stopWebcam();
    resultOverlay.classList.remove('rr-result-show');
    setTimeout(() => {
      resultOverlay.style.display = 'none';
    }, 300);
  }, { signal });

  // Lose retry (standard try again)
  container.querySelector('#loseRetry').addEventListener('click', () => {
    sfxClick();
    stopWebcam();
    resultOverlay.classList.remove('rr-result-show');
    setTimeout(() => {
      resultOverlay.style.display = 'none';
      destroyRhythmRunner();
      gameArea.innerHTML = '';
      // Retain active free mode status
      gameArea.appendChild(createRhythmRunner(onGameEnd, activeFreePlayMode));
      startRhythmRunner();
    }, 300);
  }, { signal });

  // ── Inject Visualizer ───────────────────────────────────────────
  const vizSlot = container.querySelector('#vizSlot');
  vizSlot.appendChild(createVisualizer());

  // ── Toast ───────────────────────────────────────────────────────
  const toast = container.querySelector('#congratsToast');
  if (toast) {
    const toastTimer = setTimeout(() => {
      toast.classList.add('ap-toast-hide');
      setTimeout(() => toast.style.display = 'none', 400);
    }, 4000);

    const toastClose = container.querySelector('#toastClose');
    if (toastClose) {
      toastClose.addEventListener('click', () => {
        sfxClick();
        clearTimeout(toastTimer);
        toast.classList.add('ap-toast-hide');
        setTimeout(() => toast.style.display = 'none', 300);
      }, { signal });
    }
  }

  // ── Playlist ────────────────────────────────────────────────────
  function renderPlaylist() {
    const s = getState();
    playlistList.innerHTML = '';
    s.songs.forEach((song, i) => {
      const isActive = i === s.currentSongIndex;
      const item = document.createElement('div');
      item.className = `sp-pl-item${isActive ? ' active' : ''}`;
      item.innerHTML = `
        <span class="sp-pl-num">${String(i + 1).padStart(2, '0')}</span>
        <div class="sp-pl-info">
          <span class="sp-pl-name">${song.title}</span>
          <span class="sp-pl-artist">${song.artist}</span>
        </div>
        ${isActive ? '<span class="sp-pl-playing">♫</span>' : ''}
      `;
      item.addEventListener('click', () => { sfxClick(); loadAndPlay(i); }, { signal });
      playlistList.appendChild(item);
    });
  }

  // ── Play state ──────────────────────────────────────────────────
  function updatePlayState(playing) {
    setState({ isPlaying: playing });
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.classList.toggle('playing', playing);
    if (spDisc) spDisc.classList.toggle('spinning', playing);
    if (playing) startVisualizer(); else stopVisualizer();
  }

  function updateShuffleUI() { btnShuffle.classList.toggle('active', getState().shuffle); }
  function updateRepeatUI() { btnRepeat.classList.toggle('active', getState().repeat); }

  // ── Load & play ─────────────────────────────────────────────────
  function loadAndPlay(index) {
    const s = getState();
    const len = s.songs.length;
    const idx = ((index % len) + len) % len;
    setState({ currentSongIndex: idx });
    const song = s.songs[idx];
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    audio.loadSong(song.file);
    audio.play().then(() => updatePlayState(true));
    renderPlaylist();
    resizeVisualizer();
  }

  function getNextIndex(dir = 1) {
    const s = getState();
    const len = s.songs.length;
    if (s.shuffle) {
      let n; do { n = Math.floor(Math.random() * len); } while (n === s.currentSongIndex && len > 1);
      return n;
    }
    return ((s.currentSongIndex + dir) % len + len) % len;
  }

  // ── Controls ────────────────────────────────────────────────────
  playBtn.addEventListener('click', () => { sfxClick(); audio.togglePlay(); updatePlayState(!getState().isPlaying); }, { signal });
  btnNext.addEventListener('click', () => { sfxClick(); loadAndPlay(getNextIndex(1)); }, { signal });
  btnPrev.addEventListener('click', () => { sfxClick(); audio.getCurrentTime() > 3 ? audio.seek(0) : loadAndPlay(getNextIndex(-1)); }, { signal });
  btnShuffle.addEventListener('click', () => { sfxClick(); setState({ shuffle: !getState().shuffle }); updateShuffleUI(); }, { signal });
  btnRepeat.addEventListener('click', () => { sfxClick(); setState({ repeat: !getState().repeat }); updateRepeatUI(); }, { signal });

  volumeSlider.addEventListener('input', () => {
    const vol = parseFloat(volumeSlider.value);
    audio.setVolume(vol); setState({ volume: vol });
    volumeIcon.textContent = getVolumeIcon(vol);
  }, { signal });

  volumeIcon.addEventListener('click', () => {
    sfxClick();
    const cur = parseFloat(volumeSlider.value);
    if (cur > 0) {
      volumeSlider.dataset.prev = cur; volumeSlider.value = 0; audio.setVolume(0);
      volumeIcon.textContent = getVolumeIcon(0);
    } else {
      const prev = parseFloat(volumeSlider.dataset.prev || 0.7);
      volumeSlider.value = prev; audio.setVolume(prev);
      volumeIcon.textContent = getVolumeIcon(prev);
    }
  }, { signal });

  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const dur = audio.getDuration();
    if (dur) audio.seek(ratio * dur);
  }, { signal });

  // ── Audio events ────────────────────────────────────────────────
  audio.onTimeUpdate((current, duration) => {
    if (signal.aborted) return;
    const pct = duration ? (current / duration) * 100 : 0;
    progressFill.style.width = `${pct}%`;
    if (progressThumb) progressThumb.style.left = `${pct}%`;
    currentTimeEl.textContent = formatTime(current);
    totalTimeEl.textContent = formatTime(duration);
  });

  audio.onEnded(() => {
    if (signal.aborted) return;
    getState().repeat ? (audio.seek(0), audio.play()) : loadAndPlay(getNextIndex(1));
  });

  audio.onError(() => {
    if (signal.aborted) return;
    songTitle.textContent = 'SIGNAL LOST';
    songArtist.textContent = 'Audio tidak ditemukan';
    updatePlayState(false);
  });

  window.addEventListener('resize', () => resizeVisualizer(), { signal });

  // ── Back ────────────────────────────────────────────────────────
  container.querySelector('#btnRestart').addEventListener('click', () => {
    sfxClick(); sfxNavigate(); resetQuiz(); resetPlayer();
    audio.pause(); stopVisualizer(); destroyRhythmRunner(); stopWebcam();
    ac.abort(); navigate('welcome');
  }, { signal });

  // ── Init ────────────────────────────────────────────────────────
  renderPlaylist();
  updateShuffleUI();
  updateRepeatUI();
  audio.setVolume(state.volume);
  audio.loadSong(state.songs[state.currentSongIndex].file);
  resizeVisualizer();
}
