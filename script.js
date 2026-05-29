const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

const spinSound = document.getElementById('spinSound');
const winSound = document.getElementById('winSound');

let participants = [];
let winners = [];
let rotation = 0;
let spinning = false;

const colors = [
  '#ef4444',
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#84cc16'
];

function drawWheel() {
  const total = participants.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (total === 0) return;

  const angle = (2 * Math.PI) / total;

  for (let i = 0; i < total; i++) {
    ctx.beginPath();
    ctx.moveTo(250, 250);
    ctx.arc(250, 250, 250, angle * i, angle * (i + 1));
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.save();
    ctx.translate(250, 250);
    ctx.rotate(angle * i + angle / 2);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(participants[i], 120, 10);

    ctx.restore();
  }
}

function updateParticipantList() {
  const list = document.getElementById('participantList');
  list.innerHTML = '';

  participants.forEach((name, index) => {
    const li = document.createElement('li');
    li.innerHTML = `${index + 1}. ${name}`;
    list.appendChild(li);
  });
}

function addParticipants() {
  const input = document.getElementById('participantInput');

  const names = input.value
    .split('\n')
    .map(v => v.trim())
    .filter(v => v);

  participants.push(...names);

  input.value = '';

  drawWheel();
  updateParticipantList();
}

function clearParticipants() {
  participants = [];
  winners = [];

  document.getElementById('winnerHistory').innerHTML = '';
  document.getElementById('winnerName').innerText = 'Belum ada winner';

  drawWheel();
  updateParticipantList();
}

function startSpin() {
  if (spinning || participants.length === 0) return;

  spinning = true;

  spinSound.play();

  const randomIndex = Math.floor(Math.random() * participants.length);
  const winner = participants[randomIndex];

  const segment = 360 / participants.length;
  const target = 360 - (segment * randomIndex) - segment / 2;

  rotation += 3600 + target;

  canvas.style.transform = `rotate(${rotation}deg)`;

  setTimeout(() => {
    spinSound.pause();
    spinSound.currentTime = 0;

    winSound.play();

    document.getElementById('winnerName').innerText = winner;

    winners.unshift(winner);

    const history = document.getElementById('winnerHistory');

    const li = document.createElement('li');
    li.innerText = winner;

    history.prepend(li);

    const removeWinner = document.getElementById('removeWinner').checked;

    if (removeWinner) {
      participants.splice(randomIndex, 1);
    }

    drawWheel();
    updateParticipantList();

    spinning = false;

    const multiSpin = parseInt(document.getElementById('multiSpin').value);

    if (multiSpin > 1) {
      document.getElementById('multiSpin').value = multiSpin - 1;

      if (participants.length > 0) {
        setTimeout(startSpin, 1200);
      }
    }

  }, 5000);
}

drawWheel();