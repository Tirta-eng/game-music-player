// Audio engine with Web Audio API visualizer support

let audio = null;
let audioContext = null;
let analyser = null;
let sourceNode = null;
let isSourceConnected = false;

function getAudio() {
  if (!audio) {
    audio = new Audio();
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';
  }
  return audio;
}

export function getAnalyser() {
  if (!analyser) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
  }
  return analyser;
}

function connectSource() {
  if (isSourceConnected) return;
  const a = getAudio();
  const ctx = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  audioContext = ctx;

  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
  }

  try {
    sourceNode = ctx.createMediaElementSource(a);
    sourceNode.connect(analyser);
    analyser.connect(ctx.destination);
    isSourceConnected = true;
  } catch (e) {
    // Already connected
    isSourceConnected = true;
  }
}

export function loadSong(url) {
  const a = getAudio();
  a.src = url;
  a.load();
  connectSource();
}

export function play() {
  const a = getAudio();
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return a.play().catch(() => {});
}

export function pause() {
  getAudio().pause();
}

export function togglePlay() {
  const a = getAudio();
  if (a.paused) {
    return play();
  } else {
    pause();
  }
}

export function seek(time) {
  getAudio().currentTime = time;
}

export function setVolume(vol) {
  getAudio().volume = Math.max(0, Math.min(1, vol));
}

export function getVolume() {
  return getAudio().volume;
}

export function getCurrentTime() {
  return getAudio().currentTime;
}

export function getDuration() {
  return getAudio().duration || 0;
}

export function isPaused() {
  return getAudio().paused;
}

export function onTimeUpdate(fn) {
  getAudio().addEventListener('timeupdate', () => {
    fn(getAudio().currentTime, getAudio().duration);
  });
}

export function onEnded(fn) {
  getAudio().addEventListener('ended', fn);
}

export function onLoadedMetadata(fn) {
  getAudio().addEventListener('loadedmetadata', fn);
}

export function onError(fn) {
  getAudio().addEventListener('error', fn);
}

export function getFrequencyData() {
  if (!analyser) return new Uint8Array(0);
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);
  return data;
}
