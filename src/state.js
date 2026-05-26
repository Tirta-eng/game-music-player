// Simple reactive state management for the Game Music Player

const DEFAULT_SONGS = [
  {
    title: 'Belum Ada Lagu',
    artist: '—',
    file: '',
    color: '#4FC3F7',
  },
];

const state = {
  // Quiz state
  lives: 3,
  currentQuestion: null,
  questionIndex: 0,
  quizCompleted: false,

  // Player state
  currentSongIndex: 0,
  isPlaying: false,
  volume: 0.7,
  shuffle: false,
  repeat: false,
  currentTime: 0,
  duration: 0,

  // Songs playlist (loaded dynamically from manifest)
  songs: DEFAULT_SONGS,
  songsLoaded: false,
};

// Load songs from auto-generated manifest
export async function loadSongsFromManifest() {
  try {
    const res = await fetch('/songs/manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const songs = await res.json();
    if (songs.length > 0) {
      setState({ songs, songsLoaded: true, currentSongIndex: 0 });
      console.log(`🎵 Loaded ${songs.length} song(s) from manifest`);
    } else {
      setState({ songs: DEFAULT_SONGS, songsLoaded: true });
      console.log('🎵 No songs found in manifest, using placeholder');
    }
  } catch (e) {
    console.warn('⚠️ Could not load songs manifest:', e.message);
    setState({ songs: DEFAULT_SONGS, songsLoaded: true });
  }
  return getState().songs;
}

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(updates) {
  Object.assign(state, updates);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetQuiz() {
  setState({
    lives: 3,
    currentQuestion: null,
    questionIndex: 0,
    quizCompleted: false,
  });
}

export function resetPlayer() {
  setState({
    currentSongIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });
}
