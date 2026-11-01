document.querySelectorAll('.flower-container').forEach((el) => {
  el.innerHTML = `<div class="flower-top">
                  <div class="flower-petal flower-petal__1"></div>
                  <div class="flower-petal flower-petal__2"></div>
                  <div class="flower-petal flower-petal__3"></div>
                  <div class="flower-petal flower-petal__4"></div>
                  <div class="flower-petal flower-petal__5"></div>
                  <div class="flower-petal flower-petal__6"></div>
                  <div class="flower-petal flower-petal__7"></div>
                  <div class="flower-petal flower-petal__8"></div>
                  <div class="flower-circle"></div>
                  <div class="flower-light flower-light__1"></div>
                  <div class="flower-light flower-light__2"></div>
                  <div class="flower-light flower-light__3"></div>
                  <div class="flower-light flower-light__4"></div>
                  <div class="flower-light flower-light__5"></div>
                  <div class="flower-light flower-light__6"></div>
                  <div class="flower-light flower-light__7"></div>
                  <div class="flower-light flower-light__8"></div>
                  </div>

                  <div class="flower-bottom">
                  <div class="flower-stem"></div>
                  <div class="flower-leaf flower-leaf__1"></div>
                  <div class="flower-leaf flower-leaf__2"></div>
                  <div class="flower-leaf flower-leaf__3"></div>
                  <div class="flower-leaf flower-leaf__4"></div>
                  <div class="flower-leaf flower-leaf__5"></div>
                  <div class="flower-leaf flower-leaf__6"></div>

                  <div class="flower-grass flower-grass__1"></div>
                  <div class="flower-grass flower-grass__2"></div>
                  <div class="flower-grass flower-grass__3"></div>
                  <div class="flower-grass flower-grass__4"></div>
                  </div>`;
});

// Staggered Flower Blooming
const flowers = Array.from(document.querySelectorAll('.flower-container'));
const animatedClass = 'animate';

flowers[0].classList.add(animatedClass);

setTimeout(() => {
  for (let i = 1; i <= 2 && i < flowers.length; i++) {
    flowers[i].classList.add(animatedClass);
  }

  let remaining = flowers.slice(3);
  const interval = setInterval(() => {
    if (remaining.length === 0) {
      clearInterval(interval);
      return;
    }

    const randomIndex = Math.floor(Math.random() * remaining.length);
    const el = remaining.splice(randomIndex, 1)[0];
    el.classList.add(animatedClass);
  }, 400);
}, 2500);

/* ========================================================
   Floating Hearts & Sparkles Canvas Animation
   ======================================================== */
const canvas = document.getElementById('hearts-canvas');
const ctx = canvas.getContext('2d');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

const particles = [];
const heartColors = ['#ff0c46', '#ff4d79', '#ff7597', '#ff2a5f', '#ff85a2', '#ff0038'];

class HeartParticle {
  constructor(x, y, isBurst = false) {
    this.x = x !== undefined ? x : Math.random() * width;
    this.y = y !== undefined ? y : height + Math.random() * 40;
    // Medium-small size: not too small, nicely visible (12px - 22px)
    this.size = isBurst ? Math.random() * 12 + 10 : Math.random() * 10 + 12;
    this.color = heartColors[Math.floor(Math.random() * heartColors.length)];
    this.alpha = isBurst ? 1 : Math.random() * 0.6 + 0.35;
    this.speedY = isBurst ? (Math.random() - 0.7) * 4 : Math.random() * 1.2 + 0.7;
    this.speedX = isBurst ? (Math.random() - 0.5) * 4 : (Math.random() - 0.5) * 0.6;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleSpeed = Math.random() * 0.04 + 0.02;
    this.rotation = (Math.random() - 0.5) * 0.4;
    this.isBurst = isBurst;
  }

  update() {
    this.y -= this.speedY;
    this.wobble += this.wobbleSpeed;
    this.x += this.speedX + Math.sin(this.wobble) * 0.6;

    if (this.isBurst) {
      this.alpha -= 0.015;
    } else if (this.y < -40) {
      this.y = height + 20;
      this.x = Math.random() * width;
      this.alpha = Math.random() * 0.6 + 0.35;
    }
  }

  draw() {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation + Math.sin(this.wobble) * 0.15);
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 12;

    const s = this.size;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.2);
    ctx.bezierCurveTo(-s * 0.5, -s * 0.6, -s * 0.9, -s * 0.1, 0, s * 0.7);
    ctx.bezierCurveTo(s * 0.9, -s * 0.1, s * 0.5, -s * 0.6, 0, -s * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Initial Ambient Floating Hearts (Subtle & clean count)
for (let i = 0; i < 18; i++) {
  particles.push(new HeartParticle(Math.random() * width, Math.random() * height));
}

// Continuously emit subtle gentle hearts occasionally
setInterval(() => {
  if (particles.length < 22) {
    const flowerX = width / 2 + (Math.random() - 0.5) * (width * 0.5);
    const flowerY = height * 0.75 + (Math.random() - 0.5) * 80;
    particles.push(new HeartParticle(flowerX, flowerY));
  }
}, 1200);

function spawnBurst(x, y, count = 20) {
  for (let i = 0; i < count; i++) {
    particles.push(new HeartParticle(x, y, true));
  }
}

function animateCanvas() {
  ctx.clearRect(0, 0, width, height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    p.draw();

    if (p.isBurst && p.alpha <= 0) {
      particles.splice(i, 1);
    }
  }

  requestAnimationFrame(animateCanvas);
}

animateCanvas();

// Click Burst Interactions
window.addEventListener('click', (e) => {
  spawnBurst(e.clientX, e.clientY, 16);
});

/* ========================================================
   Web Audio API - Romantic Ambient Music Synthesizer
   ======================================================== */
let audioCtx = null;
let isPlayingMusic = false;
let musicInterval = null;

const chordProgressions = [
  [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C4, E4, G4, B4)
  [220.00, 261.63, 329.63, 392.00], // Am7 (A3, C4, E4, G4)
  [174.61, 261.63, 329.63, 440.00], // Fmaj7 (F3, C4, E4, A4)
  [196.00, 293.66, 349.23, 440.00]  // G7sus4 (G3, D4, F4, A4)
];

function playRomanticChord(notes) {
  if (!audioCtx) return;

  notes.forEach((freq, index) => {
    setTimeout(() => {
      if (!isPlayingMusic) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = index % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      const now = audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 4.6);
    }, index * 250);
  });
}

function toggleMusic() {
  const musicBtn = document.getElementById('music-btn');
  const btnText = musicBtn.querySelector('.btn-text');
  const btnIcon = musicBtn.querySelector('.btn-icon');

  if (!isPlayingMusic) {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isPlayingMusic = true;
    btnText.textContent = 'Mute Music';
    btnIcon.textContent = '🎶';

    let chordIndex = 0;
    playRomanticChord(chordProgressions[chordIndex]);

    musicInterval = setInterval(() => {
      if (!isPlayingMusic) return;
      chordIndex = (chordIndex + 1) % chordProgressions.length;
      playRomanticChord(chordProgressions[chordIndex]);
    }, 4000);
  } else {
    isPlayingMusic = false;
    clearInterval(musicInterval);
    btnText.textContent = 'Play Music';
    btnIcon.textContent = '🎵';
  }
}

document.getElementById('music-btn').addEventListener('click', toggleMusic);

/* ========================================================
   Romantic Love Letter Modal & Typewriter
   ======================================================== */
const loveModal = document.getElementById('love-modal');
const noteBtn = document.getElementById('note-btn');
const closeModal = document.getElementById('close-modal');
const typewriterText = document.getElementById('typewriter-text');
const bloomBtn = document.getElementById('bloom-btn');
const heartBurstBtn = document.getElementById('heart-burst-btn');

const message = `"Like a rose blooming under the soft crimson stars, my heart radiates love for you. May your days be filled with warmth, endless wonder, and sweet romantic moments."`;

let typewriterIndex = 0;
let typewriterTimer = null;

function typeWriter() {
  if (typewriterIndex < message.length) {
    typewriterText.textContent += message.charAt(typewriterIndex);
    typewriterIndex++;
    typewriterTimer = setTimeout(typeWriter, 40);
  }
}

function openLoveLetter() {
  loveModal.classList.remove('hidden');
  typewriterText.textContent = '';
  typewriterIndex = 0;
  clearTimeout(typewriterTimer);
  typeWriter();
  spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 25);
}

function closeLoveLetter() {
  loveModal.classList.add('hidden');
  clearTimeout(typewriterTimer);
}

noteBtn.addEventListener('click', openLoveLetter);
closeModal.addEventListener('click', closeLoveLetter);

loveModal.addEventListener('click', (e) => {
  if (e.target === loveModal) closeLoveLetter();
});

bloomBtn.addEventListener('click', () => {
  spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 40);
});

heartBurstBtn.addEventListener('click', () => {
  spawnBurst(window.innerWidth / 2, window.innerHeight / 2, 35);
});