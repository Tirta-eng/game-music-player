// Music Player Page — Deep Sea Submarine Control Station 🔱

import { getState, setState, resetQuiz, resetPlayer, loadSongsFromManifest } from '../state.js';
import { sfxClick, sfxVictory, sfxNavigate } from '../sfx.js';
import { navigate } from '../router.js';
import * as audio from '../audio.js';
import { createVisualizer, startVisualizer, stopVisualizer, resizeVisualizer } from '../components/visualizer.js';
import { createUnderwaterScene, startSceneAnimation, stopSceneAnimation, destroyUnderwaterScene } from '../components/underwaterScene.js';
import { createPixelCharacter } from '../components/pixelArt.js';

const CONGRATS_MESSAGES = [
  '🧠 Selamat! IQ anda setara Albert Einstein!',
  '🎓 Profesor musik terdeteksi! Gelar S3 langsung approved!',
  '🏆 Otak kamu encer banget, kayak air laut! 🌊',
  '🎵 Spotify mau hire kamu jadi CEO sekarang!',
  '🔥 Kamu terlalu pintar, kasihan soalnya jadi gampang!',
  '👑 Raja/Ratu musik telah tiba! Semua harus tunduk!',
  '🚀 NASA mau rekrut kamu, tapi kamu terlalu overqualified!',
  '💎 Otak kamu lebih mahal dari berlian... mungkin.',
  '🐠 Ikan-ikan di laut aja kagum sama kamu!',
  '🌊 Kamu bisa jadi dewa Poseidon versi musik!',
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

// Generate rivet HTML (decorative metal bolts)
function rivets(count = 4) {
  return Array.from({ length: count }, () => '<span class="sub-rivet"></span>').join('');
}

export async function renderPlayerPage(container) {
  const ac = new AbortController();
  const signal = ac.signal;

  sfxVictory();

  // Load songs from manifest before rendering
  await loadSongsFromManifest();

  const state = getState();
  const congrats = pickRandom(CONGRATS_MESSAGES);
  const currentSong = state.songs[state.currentSongIndex];

  // ── Build submarine control station ───────────────────────────────
  container.innerHTML = `
    <div class="player-page underwater-world">

      <!-- Underwater scene backdrop -->
      <div class="uw-scene-wrapper" id="uwSceneWrapper"></div>

      <!-- Congrats Banner — Sonar transmission style -->
      <div class="sub-transmission" id="congratsBanner">
        <div class="sub-transmission-header">
          <span class="sub-signal-icon">📡</span>
          <span class="sub-signal-text">TRANSMISI DITERIMA</span>
          <button class="sub-dismiss" id="congratsDismiss">✕</button>
        </div>
        <div class="sub-transmission-body">
          <div class="congrats-character" id="congratsCharacter"></div>
          <p class="sub-transmission-msg">${congrats}</p>
        </div>
      </div>

      <!-- Main Submarine Panel -->
      <div class="sub-station">
        <div class="sub-station-header">
          <div class="sub-rivets-row">${rivets(6)}</div>
          <h2 class="sub-station-title">🔱 DEEP SEA CONTROL STATION</h2>
          <div class="sub-rivets-row">${rivets(6)}</div>
        </div>

        <div class="sub-panels">

          <!-- LEFT: Command Panel -->
          <div class="sub-panel sub-command-panel">
            <div class="sub-panel-label">
              <span class="sub-label-dot"></span>
              PUSAT KOMANDO
              <span class="sub-label-dot"></span>
            </div>

            <!-- Porthole (Album Art) -->
            <div class="sub-porthole-frame">
              <div class="sub-porthole-rivets">
                ${rivets(8)}
              </div>
              <div class="sub-porthole" id="albumArt">
                <span class="sub-porthole-emoji">🎵</span>
                <div class="sub-porthole-glass"></div>
                <div class="sub-porthole-bubbles" id="portholebubblesSlot"></div>
              </div>
            </div>

            <!-- Sonar Monitor (Song Info) -->
            <div class="sub-monitor">
              <div class="sub-monitor-scanline"></div>
              <div class="sub-monitor-content">
                <p class="sub-monitor-label">▸ NOW PLAYING</p>
                <h3 class="sub-monitor-title" id="songTitle">${currentSong.title}</h3>
                <p class="sub-monitor-artist" id="songArtist">${currentSong.artist}</p>
              </div>
              <div class="sub-monitor-blink"></div>
            </div>

            <!-- Visualizer -->
            <div id="visualizerSlot"></div>

            <!-- Sonar Progress Bar -->
            <div class="sub-progress">
              <div class="sub-progress-label">SONAR SWEEP</div>
              <div class="sub-progress-track" id="progressBar">
                <div class="sub-progress-fill" id="progressFill"></div>
                <div class="sub-progress-ping" id="progressPing"></div>
              </div>
              <div class="sub-progress-time">
                <span id="currentTime">0:00</span>
                <span class="sub-progress-depth">⚓ DEPTH ⚓</span>
                <span id="totalTime">0:00</span>
              </div>
            </div>

            <!-- Control Buttons -->
            <div class="sub-controls">
              <button class="sub-ctrl-btn sub-btn-secondary" id="btnShuffle" title="Acak">
                <span class="sub-btn-icon">🧭</span>
                <span class="sub-btn-label">ACAK</span>
              </button>
              <button class="sub-ctrl-btn sub-btn-secondary" id="btnPrev" title="Sebelumnya">
                <span class="sub-btn-icon">⏮</span>
                <span class="sub-btn-label">PREV</span>
              </button>
              <button class="sub-ctrl-btn sub-btn-primary" id="play-btn" title="Putar/Jeda">
                <span class="sub-btn-icon" id="playIcon">▶</span>
              </button>
              <button class="sub-ctrl-btn sub-btn-secondary" id="btnNext" title="Selanjutnya">
                <span class="sub-btn-icon">⏭</span>
                <span class="sub-btn-label">NEXT</span>
              </button>
              <button class="sub-ctrl-btn sub-btn-secondary" id="btnRepeat" title="Ulangi">
                <span class="sub-btn-icon">⚓</span>
                <span class="sub-btn-label">LOOP</span>
              </button>
            </div>

            <!-- Depth Gauge Volume -->
            <div class="sub-depth-gauge">
              <span class="sub-gauge-label">PRESSURE</span>
              <div class="sub-gauge-track">
                <button class="sub-gauge-icon" id="volumeIcon">${getVolumeIcon(state.volume)}</button>
                <input type="range" class="sub-gauge-slider" id="volumeSlider"
                       min="0" max="1" step="0.01" value="${state.volume}">
                <div class="sub-gauge-marks">
                  <span>MIN</span><span>MAX</span>
                </div>
              </div>
            </div>

            <div class="sub-panel-rivets-bottom">${rivets(4)}</div>
          </div>

          <!-- RIGHT: Ship's Log (Playlist) -->
          <div class="sub-panel sub-log-panel">
            <div class="sub-panel-label">
              <span class="sub-label-dot"></span>
              BUKU LOG KAPTEN
              <span class="sub-label-dot"></span>
            </div>

            <div class="sub-log-header">
              <span class="sub-log-icon">📜</span>
              <span class="sub-log-title">DAFTAR TREK AUDIO</span>
            </div>

            <div class="sub-log-entries" id="playlistList"></div>

            <!-- Ocean Tips -->
            <div class="sub-tips">
              <div class="sub-tip">
                <span>🐟</span> <span>Klik ikan di laut untuk mengusir!</span>
              </div>
              <div class="sub-tip">
                <span>🪼</span> <span>Ubur-ubur bersinar saat musik keras!</span>
              </div>
              <div class="sub-tip">
                <span>🪸</span> <span>Terumbu karang = equalizer laut!</span>
              </div>
            </div>

            <div class="sub-panel-rivets-bottom">${rivets(4)}</div>
          </div>
        </div>

        <div class="sub-station-footer">
          <div class="sub-rivets-row">${rivets(8)}</div>
        </div>
      </div>

      <!-- Restart Section -->
      <div class="sub-restart">
        <p class="sub-restart-text">Mau kembali ke permukaan? 🏊</p>
        <button class="pixel-btn small" id="btnRestart">⬆ NAIK KE ATAS</button>
      </div>
    </div>
  `;

  // ── Cache DOM refs ────────────────────────────────────────────────
  const albumArt        = container.querySelector('#albumArt');
  const songTitle       = container.querySelector('#songTitle');
  const songArtist      = container.querySelector('#songArtist');
  const progressBar     = container.querySelector('#progressBar');
  const progressFill    = container.querySelector('#progressFill');
  const progressPing    = container.querySelector('#progressPing');
  const currentTimeEl   = container.querySelector('#currentTime');
  const totalTimeEl     = container.querySelector('#totalTime');
  const playBtn         = container.querySelector('#play-btn');
  const playIcon        = container.querySelector('#playIcon');
  const btnShuffle      = container.querySelector('#btnShuffle');
  const btnPrev         = container.querySelector('#btnPrev');
  const btnNext         = container.querySelector('#btnNext');
  const btnRepeat       = container.querySelector('#btnRepeat');
  const volumeSlider    = container.querySelector('#volumeSlider');
  const volumeIcon      = container.querySelector('#volumeIcon');
  const playlistList    = container.querySelector('#playlistList');

  // ── Inject underwater scene ───────────────────────────────────────
  const uwWrapper = container.querySelector('#uwSceneWrapper');
  if (uwWrapper) uwWrapper.appendChild(createUnderwaterScene());

  const congratsChar = container.querySelector('#congratsCharacter');
  if (congratsChar) congratsChar.appendChild(createPixelCharacter('cool'));

  const vizSlot = container.querySelector('#visualizerSlot');
  if (vizSlot) vizSlot.appendChild(createVisualizer());

  // Start scene animation (fish swim even without music)
  startSceneAnimation();

  // ── Porthole spinning class ───────────────────────────────────────
  function setPortholeSpin(spinning) {
    if (spinning) {
      albumArt.classList.add('spinning');
    } else {
      albumArt.classList.remove('spinning');
    }
  }

  // ── Porthole bubbles when playing ─────────────────────────────────
  let bubbleInterval = null;
  function startPortholeBubbles() {
    const slot = container.querySelector('#portholebubblesSlot');
    if (!slot || bubbleInterval) return;
    bubbleInterval = setInterval(() => {
      if (signal.aborted) { clearInterval(bubbleInterval); return; }
      const b = document.createElement('div');
      b.className = 'sub-ph-bubble';
      b.style.left = `${20 + Math.random() * 60}%`;
      b.style.animationDuration = `${1 + Math.random() * 2}s`;
      const size = 3 + Math.random() * 5;
      b.style.width = `${size}px`;
      b.style.height = `${size}px`;
      slot.appendChild(b);
      setTimeout(() => b.remove(), 3000);
    }, 400);
  }
  function stopPortholeBubbles() {
    if (bubbleInterval) { clearInterval(bubbleInterval); bubbleInterval = null; }
  }

  // ── Dismiss congrats ──────────────────────────────────────────────
  container.querySelector('#congratsDismiss').addEventListener('click', () => {
    sfxClick();
    const banner = container.querySelector('#congratsBanner');
    if (banner) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-20px) scale(0.95)';
      setTimeout(() => banner.style.display = 'none', 300);
    }
  }, { signal });

  // ── Playlist rendering (Ship's Log style) ─────────────────────────
  function renderPlaylist() {
    const s = getState();
    playlistList.innerHTML = '';
    s.songs.forEach((song, i) => {
      const isActive = i === s.currentSongIndex;
      const item = document.createElement('div');
      item.className = `sub-log-entry${isActive ? ' active' : ''}`;

      const eqBars = isActive
        ? `<span class="sub-log-eq"><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span></span>`
        : '';

      item.innerHTML = `
        <span class="sub-log-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="sub-log-divider">│</span>
        <span class="sub-log-info">
          <span class="sub-log-song">${song.title}</span>
          <span class="sub-log-artist">${song.artist}</span>
        </span>
        ${eqBars}
      `;

      item.addEventListener('click', () => {
        sfxClick();
        loadAndPlay(i);
      }, { signal });

      playlistList.appendChild(item);
    });
  }

  // ── Play state UI ─────────────────────────────────────────────────
  function updatePlayState(playing) {
    setState({ isPlaying: playing });
    playIcon.textContent = playing ? '⏸' : '▶';
    playBtn.classList.toggle('playing', playing);

    setPortholeSpin(playing);

    if (playing) {
      startVisualizer();
      startPortholeBubbles();
    } else {
      stopVisualizer();
      stopPortholeBubbles();
    }
  }

  function updateShuffleUI() {
    btnShuffle.classList.toggle('active', getState().shuffle);
  }

  function updateRepeatUI() {
    btnRepeat.classList.toggle('active', getState().repeat);
  }

  // ── Load & play ───────────────────────────────────────────────────
  function loadAndPlay(index) {
    const s = getState();
    const len = s.songs.length;
    const idx = ((index % len) + len) % len;
    setState({ currentSongIndex: idx });

    const song = s.songs[idx];
    songTitle.textContent = song.title;
    songArtist.textContent = song.artist;
    albumArt.querySelector('.sub-porthole-emoji').textContent = '🎵';
    albumArt.classList.remove('error');

    audio.loadSong(song.file);
    audio.play().then(() => {
      updatePlayState(true);
    });

    renderPlaylist();
    resizeVisualizer();
  }

  // ── Next index (shuffle-aware) ────────────────────────────────────
  function getNextIndex(direction = 1) {
    const s = getState();
    const len = s.songs.length;
    if (s.shuffle) {
      let next;
      do { next = Math.floor(Math.random() * len); } while (next === s.currentSongIndex && len > 1);
      return next;
    }
    return ((s.currentSongIndex + direction) % len + len) % len;
  }

  // ── Controls ──────────────────────────────────────────────────────
  playBtn.addEventListener('click', () => {
    sfxClick();
    audio.togglePlay();
    updatePlayState(!getState().isPlaying);
  }, { signal });

  btnNext.addEventListener('click', () => {
    sfxClick();
    loadAndPlay(getNextIndex(1));
  }, { signal });

  btnPrev.addEventListener('click', () => {
    sfxClick();
    if (audio.getCurrentTime() > 3) {
      audio.seek(0);
    } else {
      loadAndPlay(getNextIndex(-1));
    }
  }, { signal });

  btnShuffle.addEventListener('click', () => {
    sfxClick();
    setState({ shuffle: !getState().shuffle });
    updateShuffleUI();
  }, { signal });

  btnRepeat.addEventListener('click', () => {
    sfxClick();
    setState({ repeat: !getState().repeat });
    updateRepeatUI();
  }, { signal });

  // ── Volume (Depth Gauge) ──────────────────────────────────────────
  volumeSlider.addEventListener('input', () => {
    const vol = parseFloat(volumeSlider.value);
    audio.setVolume(vol);
    setState({ volume: vol });
    volumeIcon.textContent = getVolumeIcon(vol);
  }, { signal });

  volumeIcon.addEventListener('click', () => {
    sfxClick();
    const current = parseFloat(volumeSlider.value);
    if (current > 0) {
      volumeSlider.dataset.prev = current;
      volumeSlider.value = 0;
      audio.setVolume(0);
      volumeIcon.textContent = getVolumeIcon(0);
    } else {
      const prev = parseFloat(volumeSlider.dataset.prev || 0.7);
      volumeSlider.value = prev;
      audio.setVolume(prev);
      volumeIcon.textContent = getVolumeIcon(prev);
    }
  }, { signal });

  // ── Progress bar seek ─────────────────────────────────────────────
  progressBar.addEventListener('click', (e) => {
    const rect = progressBar.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const dur = audio.getDuration();
    if (dur) audio.seek(ratio * dur);
  }, { signal });

  // ── Audio events ──────────────────────────────────────────────────
  audio.onTimeUpdate((current, duration) => {
    if (signal.aborted) return;
    const pct = duration ? (current / duration) * 100 : 0;
    progressFill.style.width = `${pct}%`;
    if (progressPing) progressPing.style.left = `${pct}%`;
    currentTimeEl.textContent = formatTime(current);
    totalTimeEl.textContent = formatTime(duration);
  });

  audio.onEnded(() => {
    if (signal.aborted) return;
    const s = getState();
    if (s.repeat) {
      audio.seek(0);
      audio.play();
    } else {
      loadAndPlay(getNextIndex(1));
    }
  });

  audio.onError(() => {
    if (signal.aborted) return;
    const emoji = albumArt.querySelector('.sub-porthole-emoji');
    if (emoji) emoji.textContent = '⚠️';
    albumArt.classList.add('error');
    songTitle.textContent = 'SIGNAL LOST';
    songArtist.textContent = 'Audio tidak ditemukan';
    updatePlayState(false);
  });

  // ── Resize ────────────────────────────────────────────────────────
  window.addEventListener('resize', () => resizeVisualizer(), { signal });

  // ── Restart ───────────────────────────────────────────────────────
  container.querySelector('#btnRestart').addEventListener('click', () => {
    sfxClick();
    sfxNavigate();
    resetQuiz();
    resetPlayer();
    audio.pause();
    stopVisualizer();
    stopPortholeBubbles();
    destroyUnderwaterScene();
    ac.abort();
    navigate('welcome');
  }, { signal });

  // ── Initial state ─────────────────────────────────────────────────
  renderPlaylist();
  updateShuffleUI();
  updateRepeatUI();
  audio.setVolume(state.volume);

  const firstSong = state.songs[state.currentSongIndex];
  audio.loadSong(firstSong.file);
  resizeVisualizer();
}
