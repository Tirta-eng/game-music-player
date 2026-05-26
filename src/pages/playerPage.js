// 🎮 Music Player Page — Neon Arcade Ocean + Fish Catch Game

import { getState, setState, resetQuiz, resetPlayer, loadSongsFromManifest } from '../state.js';
import { sfxClick, sfxVictory, sfxNavigate } from '../sfx.js';
import { navigate } from '../router.js';
import * as audio from '../audio.js';
import { createVisualizer, startVisualizer, stopVisualizer, resizeVisualizer } from '../components/visualizer.js';
import { createFishGame, startFishGame, stopFishGame, destroyFishGame, resetGameScore } from '../components/fishGame.js';

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

export async function renderPlayerPage(container) {
  const ac = new AbortController();
  const signal = ac.signal;

  sfxVictory();
  await loadSongsFromManifest();

  const state = getState();
  const congrats = pickRandom(CONGRATS_MESSAGES);
  const currentSong = state.songs[state.currentSongIndex];

  // ── Build the new layout ──────────────────────────────────────────
  container.innerHTML = `
    <div class="arcade-player">

      <!-- Congrats Toast -->
      <div class="ap-toast" id="congratsToast">
        <span class="ap-toast-icon">🏆</span>
        <span class="ap-toast-msg">${congrats}</span>
        <button class="ap-toast-close" id="toastClose">✕</button>
      </div>

      <!-- Game Area (Fish Catch) -->
      <div class="ap-game-area" id="gameArea"></div>

      <!-- Player Bar (Bottom) -->
      <div class="ap-player-bar">

        <!-- Visualizer strip -->
        <div class="ap-viz-strip" id="vizStrip"></div>

        <!-- Now Playing Info -->
        <div class="ap-now-playing">
          <div class="ap-song-info">
            <div class="ap-song-title" id="songTitle">${currentSong.title}</div>
            <div class="ap-song-artist" id="songArtist">${currentSong.artist}</div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="ap-progress">
          <span class="ap-time" id="currentTime">0:00</span>
          <div class="ap-progress-track" id="progressBar">
            <div class="ap-progress-fill" id="progressFill"></div>
            <div class="ap-progress-thumb" id="progressThumb"></div>
          </div>
          <span class="ap-time" id="totalTime">0:00</span>
        </div>

        <!-- Controls -->
        <div class="ap-controls">
          <div class="ap-controls-left">
            <button class="ap-btn" id="btnShuffle" title="Acak">🔀</button>
            <button class="ap-btn" id="btnPrev" title="Sebelumnya">⏮</button>
            <button class="ap-btn ap-btn-play" id="playBtn" title="Putar">▶</button>
            <button class="ap-btn" id="btnNext" title="Selanjutnya">⏭</button>
            <button class="ap-btn" id="btnRepeat" title="Ulangi">🔁</button>
          </div>

          <div class="ap-controls-right">
            <button class="ap-btn" id="volumeIcon">${getVolumeIcon(state.volume)}</button>
            <input type="range" class="ap-volume-slider" id="volumeSlider"
                   min="0" max="1" step="0.01" value="${state.volume}">
            <button class="ap-btn ap-btn-playlist" id="btnPlaylist" title="Playlist">📜</button>
            <button class="ap-btn ap-btn-back" id="btnRestart" title="Kembali">🏠</button>
          </div>
        </div>
      </div>

      <!-- Playlist Drawer -->
      <div class="ap-playlist-drawer" id="playlistDrawer">
        <div class="ap-playlist-header">
          <h3>📜 PLAYLIST</h3>
          <button class="ap-playlist-close" id="playlistClose">✕</button>
        </div>
        <div class="ap-playlist-list" id="playlistList"></div>
      </div>
      <div class="ap-playlist-overlay" id="playlistOverlay"></div>

    </div>
  `;

  // ── Cache DOM refs ──────────────────────────────────────────────
  const songTitle      = container.querySelector('#songTitle');
  const songArtist     = container.querySelector('#songArtist');
  const progressBar    = container.querySelector('#progressBar');
  const progressFill   = container.querySelector('#progressFill');
  const progressThumb  = container.querySelector('#progressThumb');
  const currentTimeEl  = container.querySelector('#currentTime');
  const totalTimeEl    = container.querySelector('#totalTime');
  const playBtn        = container.querySelector('#playBtn');
  const btnShuffle     = container.querySelector('#btnShuffle');
  const btnPrev        = container.querySelector('#btnPrev');
  const btnNext        = container.querySelector('#btnNext');
  const btnRepeat      = container.querySelector('#btnRepeat');
  const volumeSlider   = container.querySelector('#volumeSlider');
  const volumeIcon     = container.querySelector('#volumeIcon');
  const playlistList   = container.querySelector('#playlistList');
  const playlistDrawer = container.querySelector('#playlistDrawer');
  const playlistOverlay = container.querySelector('#playlistOverlay');

  // ── Inject Fish Game ────────────────────────────────────────────
  const gameArea = container.querySelector('#gameArea');
  gameArea.appendChild(createFishGame());
  startFishGame();

  // ── Inject Visualizer ───────────────────────────────────────────
  const vizStrip = container.querySelector('#vizStrip');
  vizStrip.appendChild(createVisualizer());

  // ── Congrats Toast auto-dismiss ─────────────────────────────────
  const toast = container.querySelector('#congratsToast');
  const toastTimer = setTimeout(() => {
    if (toast) {
      toast.classList.add('ap-toast-hide');
      setTimeout(() => toast.style.display = 'none', 400);
    }
  }, 5000);

  container.querySelector('#toastClose').addEventListener('click', () => {
    sfxClick();
    clearTimeout(toastTimer);
    toast.classList.add('ap-toast-hide');
    setTimeout(() => toast.style.display = 'none', 300);
  }, { signal });

  // ── Playlist rendering ──────────────────────────────────────────
  function renderPlaylist() {
    const s = getState();
    playlistList.innerHTML = '';
    s.songs.forEach((song, i) => {
      const isActive = i === s.currentSongIndex;
      const item = document.createElement('div');
      item.className = `ap-playlist-item${isActive ? ' active' : ''}`;
      item.innerHTML = `
        <span class="ap-pl-num">${String(i + 1).padStart(2, '0')}</span>
        <div class="ap-pl-info">
          <span class="ap-pl-title">${song.title}</span>
          <span class="ap-pl-artist">${song.artist}</span>
        </div>
        ${isActive ? '<span class="ap-pl-eq">♫</span>' : ''}
      `;
      item.addEventListener('click', () => {
        sfxClick();
        loadAndPlay(i);
        closePlaylist();
      }, { signal });
      playlistList.appendChild(item);
    });
  }

  // ── Playlist drawer toggle ──────────────────────────────────────
  function openPlaylist() {
    playlistDrawer.classList.add('open');
    playlistOverlay.classList.add('open');
  }
  function closePlaylist() {
    playlistDrawer.classList.remove('open');
    playlistOverlay.classList.remove('open');
  }

  container.querySelector('#btnPlaylist').addEventListener('click', () => {
    sfxClick();
    openPlaylist();
  }, { signal });

  container.querySelector('#playlistClose').addEventListener('click', () => {
    sfxClick();
    closePlaylist();
  }, { signal });

  playlistOverlay.addEventListener('click', () => closePlaylist(), { signal });

  // ── Play state UI ───────────────────────────────────────────────
  function updatePlayState(playing) {
    setState({ isPlaying: playing });
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.classList.toggle('playing', playing);

    if (playing) {
      startVisualizer();
    } else {
      stopVisualizer();
    }
  }

  function updateShuffleUI() {
    btnShuffle.classList.toggle('active', getState().shuffle);
  }

  function updateRepeatUI() {
    btnRepeat.classList.toggle('active', getState().repeat);
  }

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
    audio.play().then(() => {
      updatePlayState(true);
    });

    renderPlaylist();
    resizeVisualizer();
  }

  // ── Next index (shuffle-aware) ──────────────────────────────────
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

  // ── Controls ────────────────────────────────────────────────────
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

  // ── Volume ──────────────────────────────────────────────────────
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

  // ── Progress bar seek ───────────────────────────────────────────
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
    songTitle.textContent = 'SIGNAL LOST';
    songArtist.textContent = 'Audio tidak ditemukan';
    updatePlayState(false);
  });

  // ── Resize ──────────────────────────────────────────────────────
  window.addEventListener('resize', () => resizeVisualizer(), { signal });

  // ── Back to Welcome ─────────────────────────────────────────────
  container.querySelector('#btnRestart').addEventListener('click', () => {
    sfxClick();
    sfxNavigate();
    resetQuiz();
    resetPlayer();
    audio.pause();
    stopVisualizer();
    destroyFishGame();
    ac.abort();
    navigate('welcome');
  }, { signal });

  // ── Initial state ───────────────────────────────────────────────
  renderPlaylist();
  updateShuffleUI();
  updateRepeatUI();
  audio.setVolume(state.volume);

  const firstSong = state.songs[state.currentSongIndex];
  audio.loadSong(firstSong.file);
  resizeVisualizer();
}
