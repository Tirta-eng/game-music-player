import { navigate } from '../router.js';
import { resetQuiz } from '../state.js';
import { sfxClick, sfxGameOver } from '../sfx.js';
import { createPixelCharacter, createPixelStars } from '../components/pixelArt.js';

const ROAST_MESSAGES = [
  'Wah... IQ kamu satu paket sama sendal jepit 🩴',
  'Google aja kamu nggak bisa kalahkan... 🤖',
  'Mending dengerin musik aja deh, jangan jawab soal 😂',
  'Otak kamu kayak WiFi gratisan... lemot tapi tetep dipake 📶',
  'Tenang, Albert Einstein juga pernah gagal... tapi dia nggak segagal ini 💀',
  'Alexa, tolong carikan otak baru buat user ini 🤖',
  'Kamu yakin pernah sekolah? Asking for a friend... 🤔',
  'Jangankan musik, ABC aja kayaknya masih belajar 📖',
  'Kasihan soalnya... udah dibuat gampang tapi tetep aja 😭',
  'Spongebob aja bisa jawab ini, kamu kalah sama spons 🧽',
  'IQ kamu kayak sinyal di gunung... nggak ada 📡',
  'Auto di-blacklist dari semua kuis se-Indonesia 🚫',
];

const EMOJIS = ['💀', '😂', '🤡', '🩴', '📶', '🤖'];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function renderRoastPage(container) {
  sfxGameOver();

  const emoji = pickRandom(EMOJIS);
  const roast = pickRandom(ROAST_MESSAGES);

  container.innerHTML = `
    <div class="roast-page">
      <div class="pixel-stars-bg" id="roastStars"></div>

      <h1 class="roast-title glitch" data-text="GAME OVER">GAME OVER</h1>

      <div class="roast-character" id="roastCharacter"></div>

      <div class="roast-emoji bounce">${emoji}</div>

      <p class="roast-message">${roast}</p>

      <button class="pixel-btn coral" id="btnRetry">COBA LAGI, GAK TERIMA! 😤</button>

      <p class="roast-accept">atau terima nasib... 😔</p>

      <p class="roast-sub">(Soalnya emang susah kok, bukan kamu yang bodoh... atau iya? 🤔)</p>
    </div>
  `;

  const characterSlot = container.querySelector('#roastCharacter');
  if (characterSlot) {
    characterSlot.appendChild(createPixelCharacter('sad'));
  }

  const starsSlot = container.querySelector('#roastStars');
  if (starsSlot) {
    starsSlot.appendChild(createPixelStars());
  }

  container.querySelector('#btnRetry').addEventListener('click', () => {
    sfxClick();
    resetQuiz();
    navigate('welcome');
  });
}
