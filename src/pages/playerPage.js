// 🎮 Music Player Page — Split View: Player + Fish Catch Game

import { getState, setState, resetQuiz, resetPlayer, loadSongsFromManifest } from '../state.js';
import { sfxClick, sfxVictory, sfxNavigate } from '../sfx.js';
import { navigate } from '../router.js';
import * as audio from '../audio.js';
import { createVisualizer, startVisualizer, stopVisualizer, resizeVisualizer } from '../components/visualizer.js';
import { createFishGame, startFishGame, stopFishGame, destroyFishGame } from '../components/fishGame.js';

const CONGRATS_MESSAGES = [
  '🧠 Selamat! IQ anda setara Albert Einstein!',
  '🎓 Profesor musik terdeteksi!',
  '🏆 Otak kamu encer banget! 🌊',
  '🎵 Spotify mau hire kamu jadi CEO!',
  '🔥 Kamu terlalu pintar!',
  '👑 Raja/Ratu musik telah tiba!',
  '🐠 Ikan-ikan aja kagum sama kamu!',
  '🌊 Poseidon versi musik!',
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

  container.innerHTML = `
    <div class="split-player">

      <!-- Congrats Toast -->
      <div class="ap-toast" id="congratsToast">
        <span class="ap-toast-icon">🏆</span>
        <span class="ap-toast-msg">${congrats}</span>
        <button class="ap-toast-close" id="toastClose">✕</button>
      </div>

      <!-- LEFT: Music Player -->
      <div class="sp-player-side">
        <div class="sp-player-inner">

          <!-- Header -->
          <div class="sp-header">
            <button class="sp-back-btn" id="btnRestart" title="Kembali">← KEMBALI</button>
          </div>

          <!-- Album Art / Visualizer -->
          <div class="sp-album-area">
            <div class="sp-disc" id="spDisc">
              <div class="sp-disc-inner">
                <span class="sp-disc-emoji">🎵</span>
              </div>
              <div class="sp-disc-ring"></div>
              <div class="sp-disc-ring sp-disc-ring-2"></div>
            </div>
          </div>

          <!-- Song Info -->
          <div class="sp-song-info">
            <div class="sp-song-title" id="songTitle">${currentSong.title}</div>
            <div class="sp-song-artist" id="songArtist">${currentSong.artist}</div>
          </div>

          <!-- Visualizer -->
          <div class="sp-visualizer" id="vizSlot"></div>

          <!-- Progress -->
          <div class="sp-progress">
            <span class="sp-time" id="currentTime">0:00</span>
            <div class="sp-progress-track" id="progressBar">
              <div class="sp-progress-fill" id="progressFill"></div>
              <div class="sp-progress-thumb" id="progressThumb"></div>
            </div>
            <span class="sp-time" id="totalTime">0:00</span>
          </div>

          <!-- Controls -->
          <div class="sp-controls">
            <button class="sp-btn" id="btnShuffle" title="Acak">🔀</button>
            <button class="sp-btn" id="btnPrev" title="Sebelumnya">⏮</button>
            <button class="sp-btn sp-btn-play" id="playBtn" title="Putar">▶</button>
            <button class="sp-btn" id="btnNext" title="Selanjutnya">⏭</button>
            <button class="sp-btn" id="btnRepeat" title="Ulangi">🔁</button>
          </div>

          <!-- Volume -->
          <div class="sp-volume">
            <button class="sp-btn sp-vol-icon" id="volumeIcon">${getVolumeIcon(state.volume)}</button>
            <input type="range" class="sp-volume-slider" id="volumeSlider"
                   min="0" max="1" step="0.01" value="${state.volume}">
          </div>

          <!-- Playlist -->
          <div class="sp-playlist-section">
            <div class="sp-playlist-title">📜 PLAYLIST</div>
            <div class="sp-playlist-list" id="playlistList"></div>
          </div>

        </div>
      </div>

      <!-- RIGHT: Fish Catch Game -->
      <div class="sp-game-side" id="gameArea"></div>

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
  const spDisc         = container.querySelector('#spDisc');

  // ── Inject Fish Game ────────────────────────────────────────────
  const gameArea = container.querySelector('#gameArea');
  gameArea.appendChild(createFishGame());
  startFishGame();

  // ── Inject Visualizer ───────────────────────────────────────────
  const vizSlot = container.querySelector('#vizSlot');
  vizSlot.appendChild(createVisualizer());

  // ── Congrats toast ──────────────────────────────────────────────
  const toast = container.querySelector('#congratsToast');
  const toastTimer = setTimeout(() => {
    if (toast) {
      toast.classList.add('ap-toast-hide');
      setTimeout(() => toast.style.display = 'none', 400);
    }
  }, 4000);

  container.querySelector('#toastClose').addEventListener('click', () => {
    sfxClick();
    clearTimeout(toastTimer);
    toast.classList.add('ap-toast-hide');
    setTimeout(() => toast.style.display = 'none', 300);
  }, { signal });

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
      item.addEventListener('click', () => {
        sfxClick();
        loadAndPlay(i);
      }, { signal });
      playlistList.appendChild(item);
    });
  }

  // ── Play state ──────────────────────────────────────────────────
  function updatePlayState(playing) {
    setState({ isPlaying: playing });
    playBtn.textContent = playing ? '⏸' : '▶';
    playBtn.classList.toggle('playing', playing);

    if (spDisc) spDisc.classList.toggle('spinning', playing);

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

  // ── Back ────────────────────────────────────────────────────────
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

  // ── Init ────────────────────────────────────────────────────────
  renderPlaylist();
  updateShuffleUI();
  updateRepeatUI();
  audio.setVolume(state.volume);

  const firstSong = state.songs[state.currentSongIndex];
  audio.loadSong(firstSong.file);
  resizeVisualizer();
}
