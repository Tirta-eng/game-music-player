import { getState, setState, resetQuiz } from '../state.js';
import { sfxClick, sfxCorrect, sfxWrong, sfxHeartLost, resumeAudio } from '../sfx.js';
import { navigate } from '../router.js';
import {
  createHearts,
  createConfetti,
  createPixelStars,
  createPixelClouds,
  createPixelCharacter,
} from '../components/pixelArt.js';

// ── Kumpulan soal kuis musik ──────────────────────────────────────────
const QUESTIONS = [
  {
    question: "Siapa yang dikenal sebagai 'King of Pop'?",
    options: ['Elvis Presley', 'Michael Jackson', 'Prince', 'Stevie Wonder'],
    correct: 1,
  },
  {
    question: 'Alat musik apa yang memiliki 88 tuts?',
    options: ['Organ', 'Akordeon', 'Piano', 'Harpsichord'],
    correct: 2,
  },
  {
    question: 'Band rock legendaris asal Liverpool?',
    options: ['The Rolling Stones', 'Led Zeppelin', 'The Beatles', 'Pink Floyd'],
    correct: 2,
  },
  {
    question: 'Genre musik yang berasal dari Jamaica?',
    options: ['Blues', 'Reggae', 'Ska', 'Funk'],
    correct: 1,
  },
  {
    question: "Siapa vokalis Queen yang menyanyikan 'Bohemian Rhapsody'?",
    options: ['Robert Plant', 'Freddie Mercury', 'David Bowie', 'Mick Jagger'],
    correct: 1,
  },
  {
    question: 'Alat musik petik yang memiliki 6 senar?',
    options: ['Bass', 'Ukulele', 'Harpa', 'Gitar'],
    correct: 3,
  },
  {
    question: 'Apa nama tangga nada yang terdiri dari 5 nada?',
    options: ['Diatonis', 'Kromatis', 'Pentatonis', 'Blues Scale'],
    correct: 2,
  },
  {
    question: "Siapa penyanyi 'Shape of You'?",
    options: ['Justin Bieber', 'Bruno Mars', 'Ed Sheeran', 'Sam Smith'],
    correct: 2,
  },
  {
    question: 'Musik klasik identik dengan komponis dari Austria bernama?',
    options: ['Beethoven', 'Bach', 'Chopin', 'Mozart'],
    correct: 3,
  },
  {
    question: 'Alat musik tiup dari kayu yang sering dipakai di orkestra?',
    options: ['Trombon', 'Flute', 'Terompet', 'Tuba'],
    correct: 1,
  },
  {
    question: 'Apa nama not musik yang paling pendek durasinya?',
    options: ['Not 1/16', 'Not 1/32', 'Not 1/64', 'Not 1/8'],
    correct: 2,
  },
  {
    question: 'Lagu kebangsaan Indonesia ditulis oleh?',
    options: ['Ismail Marzuki', 'W.R. Supratman', 'Ibu Sud', 'Kusbini'],
    correct: 1,
  },
];

// ── Utilitas ──────────────────────────────────────────────────────────
const PREFIXES = ['A', 'B', 'C', 'D'];
let audioResumed = false;
let askedIndices = [];

function pickRandomQuestion() {
  // Jika semua sudah pernah ditanya, reset daftar
  if (askedIndices.length >= QUESTIONS.length) {
    askedIndices = [];
  }
  const available = QUESTIONS
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => !askedIndices.includes(i));
  const pick = available[Math.floor(Math.random() * available.length)];
  askedIndices.push(pick.i);
  return pick.q;
}

// ── Render utama ─────────────────────────────────────────────────────
export function renderQuizPage(container) {
  const state = getState();
  const lives = state.lives;
  const question = pickRandomQuestion();

  setState({ currentQuestion: question });

  // ── Bangun DOM ───────────────────────────────────────────────────
  container.innerHTML = `
    <div class="quiz-page">
      <!-- Latar dekorasi -->
      <div class="quiz-bg-stars" id="quizStars"></div>
      <div class="quiz-bg-clouds" id="quizClouds"></div>

      <!-- Judul pixel -->
      <h1 class="quiz-title pixel-text">🎮 PIXEL MUSIC QUIZ</h1>
      <p class="quiz-subtitle">Jawab teka-teki untuk membuka Music Player!</p>

      <!-- Karakter pixel -->
      <div class="quiz-character" id="quizCharacter"></div>

      <!-- Kotak soal -->
      <div class="quiz-question-box" id="questionBox">
        <p class="quiz-question-text">${question.question}</p>
      </div>

      <!-- Opsi jawaban -->
      <div class="quiz-options" id="quizOptions">
        ${question.options
          .map(
            (opt, i) => `
          <button class="quiz-option" data-index="${i}">
            <span class="option-prefix">${PREFIXES[i]}</span>
            <span class="option-text">${opt}</span>
          </button>`
          )
          .join('')}
      </div>

      <!-- Nyawa -->
      <div class="quiz-lives-area">
        <div id="heartsSlot"></div>
        <p class="quiz-chance-text">Kesempatan tersisa: <strong>${lives}/3</strong></p>
      </div>

      <!-- Petunjuk awal -->
      <p class="quiz-start-prompt" id="startPrompt">✨ Klik jawaban untuk memulai!</p>
    </div>
  `;

  // ── Sisipkan komponen pixel art ──────────────────────────────────
  const starsSlot = container.querySelector('#quizStars');
  if (starsSlot) starsSlot.appendChild(createPixelStars());

  const cloudsSlot = container.querySelector('#quizClouds');
  if (cloudsSlot) cloudsSlot.appendChild(createPixelClouds());

  const characterSlot = container.querySelector('#quizCharacter');
  if (characterSlot) characterSlot.appendChild(createPixelCharacter('happy'));

  const heartsSlot = container.querySelector('#heartsSlot');
  if (heartsSlot) heartsSlot.appendChild(createHearts(lives));

  // ── Sembunyikan prompt setelah interaksi pertama ─────────────────
  const startPrompt = container.querySelector('#startPrompt');
  if (!audioResumed && startPrompt) {
    startPrompt.style.display = 'block';
  } else if (startPrompt) {
    startPrompt.style.display = 'none';
  }

  // ── Event listener opsi jawaban ─────────────────────────────────
  const optionButtons = container.querySelectorAll('.quiz-option');
  const questionBox = container.querySelector('#questionBox');
  let answered = false;

  optionButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      // Resume audio pada interaksi pertama
      if (!audioResumed) {
        resumeAudio();
        audioResumed = true;
        if (startPrompt) startPrompt.style.display = 'none';
      }

      sfxClick();

      const selectedIndex = parseInt(btn.dataset.index, 10);
      const isCorrect = selectedIndex === question.correct;

      // Nonaktifkan semua tombol
      optionButtons.forEach((b) => (b.disabled = true));

      if (isCorrect) {
        // ── Jawaban benar ────────────────────────────────────────
        btn.classList.add('correct');
        sfxCorrect();
        createConfetti(container.querySelector('.quiz-page'));

        setTimeout(() => {
          setState({ quizCompleted: true });
          navigate('player');
        }, 1500);
      } else {
        // ── Jawaban salah ────────────────────────────────────────
        btn.classList.add('wrong');
        sfxWrong();
        sfxHeartLost();

        // Tandai jawaban yang benar
        optionButtons.forEach((b) => {
          if (parseInt(b.dataset.index, 10) === question.correct) {
            b.classList.add('correct');
          }
        });

        // Animasi hati pecah
        const currentLives = getState().lives;
        const heartIndex = currentLives - 1;
        const heartEl = container.querySelector(`#heart-${heartIndex}`);
        if (heartEl) {
          heartEl.classList.add('heart-breaking');
          setTimeout(() => {
            heartEl.classList.remove('alive', 'heart-breaking');
            heartEl.classList.add('dead');
            heartEl.textContent = '🖤';
          }, 600);
        }

        // Guncang kotak soal
        if (questionBox) {
          questionBox.classList.add('shake');
          setTimeout(() => questionBox.classList.remove('shake'), 500);
        }

        // Kurangi nyawa
        const newLives = currentLives - 1;
        setState({ lives: newLives });

        // Update teks kesempatan
        const chanceText = container.querySelector('.quiz-chance-text');
        if (chanceText) {
          chanceText.innerHTML = `Kesempatan tersisa: <strong>${newLives}/3</strong>`;
        }

        if (newLives <= 0) {
          // ── Game Over ──────────────────────────────────────────
          setTimeout(() => {
            navigate('gameover');
          }, 1000);
        } else {
          // ── Soal berikutnya ────────────────────────────────────
          setTimeout(() => {
            renderQuizPage(container);
          }, 1500);
        }
      }
    });
  });
}
