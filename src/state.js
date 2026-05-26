// Simple reactive state management for the Game Music Player

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

  // Songs playlist
  songs: [
    {
      title: 'Pixel Adventure',
      artist: 'Unknown Artist',
      file: '/songs/song1.mp3',
      color: '#4FC3F7',
    },
    {
      title: 'Ocean Breeze',
      artist: 'Unknown Artist',
      file: '/songs/song2.mp3',
      color: '#0288D1',
    },
    {
      title: '8-Bit Dreams',
      artist: 'Unknown Artist',
      file: '/songs/song3.mp3',
      color: '#01579B',
    },
  ],
};

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
