// ============================================
// Configuration Constants
// ============================================
const CONFIG = {
  canvasCenter: 250,
  canvasRadius: 250,
  emptyWheelRadius: 240,
  spinDuration: 5000,
  autoSpinDelay: 1200,
  rotationMultiplier: 3600,
  textRadius: 120,
  textFontSize: 16,
  textFontSizeEmpty: 28,
  emptyWheelText: 'Tambahkan Peserta',
  noWinnerText: 'Belum ada winner',
  borderWidth: 8,
  borderColor: '#475569',
  emptyWheelColor: '#1e293b',
  textColor: 'white',
  font: 'Arial'
};

// ============================================
// DOM Elements (Cached)
// ============================================
const domElements = {
  canvas: document.getElementById('wheelCanvas'),
  spinSound: document.getElementById('spinSound'),
  winSound: document.getElementById('winSound'),
  participantInput: document.getElementById('participantInput'),
  participantList: document.getElementById('participantList'),
  winnerName: document.getElementById('winnerName'),
  winnerHistory: document.getElementById('winnerHistory'),
  removeWinnerCheckbox: document.getElementById('removeWinner'),
  multiSpinInput: document.getElementById('multiSpin'),
  wheelWrapper: document.querySelector('.wheel-wrapper')
};

// Get canvas context
const ctx = domElements.canvas.getContext('2d');

// ============================================
// State Management
// ============================================
let participants = [];
let winners = [];
let rotation = 0;
let spinning = false;

// ============================================
// Color Palette
// ============================================
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

// ============================================
// Drawing Functions
// ============================================

/**
 * Draw the wheel with all participants
 */
function drawWheel() {
  const total = participants.length;
  const { canvasCenter, canvasRadius, emptyWheelRadius } = CONFIG;

  ctx.clearRect(0, 0, domElements.canvas.width, domElements.canvas.height);

  // Draw empty wheel when no participants
  if (total === 0) {
    drawEmptyWheel();
    return;
  }

  // Draw wheel segments with participant names
  const angle = (2 * Math.PI) / total;

  for (let i = 0; i < total; i++) {
    // Draw segment
    ctx.beginPath();
    ctx.moveTo(canvasCenter, canvasCenter);
    ctx.arc(canvasCenter, canvasCenter, canvasRadius, angle * i, angle * (i + 1));
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // Draw participant name
    drawParticipantName(i, angle);
  }
}

/**
 * Draw empty wheel with placeholder text
 */
function drawEmptyWheel() {
  const { canvasCenter, emptyWheelRadius, borderWidth, borderColor, emptyWheelColor, textColor, textFontSizeEmpty, emptyWheelText } = CONFIG;

  ctx.beginPath();
  ctx.arc(canvasCenter, canvasCenter, emptyWheelRadius, 0, Math.PI * 2);
  ctx.fillStyle = emptyWheelColor;
  ctx.fill();

  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.font = `bold ${textFontSizeEmpty}px ${CONFIG.font}`;
  ctx.textAlign = 'center';
  ctx.fillText(emptyWheelText, canvasCenter, canvasCenter);
}

/**
 * Draw participant name on wheel segment
 * @param {number} index - Participant index
 * @param {number} angle - Angle per segment
 */
function drawParticipantName(index, angle) {
  const { canvasCenter, textRadius, textFontSize, textColor, font } = CONFIG;

  ctx.save();
  ctx.translate(canvasCenter, canvasCenter);
  ctx.rotate(angle * index + angle / 2);

  ctx.fillStyle = textColor;
  ctx.font = `bold ${textFontSize}px ${font}`;
  ctx.fillText(participants[index], textRadius, 10);

  ctx.restore();
}

// ============================================
// Participant Management Functions
// ============================================

/**
 * Update the participant list display
 */
function updateParticipantList() {
  domElements.participantList.innerHTML = '';

  participants.forEach((name, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${name}`;
    domElements.participantList.appendChild(li);
  });
}

/**
 * Add participants from input field
 */
function addParticipants() {
  const names = domElements.participantInput.value
    .split('\n')
    .map(v => v.trim())
    .filter(v => v && v.length > 0)
    .filter(v => !participants.includes(v)); // Prevent duplicates

  if (names.length === 0) {
    alert('Mohon tambahkan peserta baru atau peserta sudah ada');
    return;
  }

  participants.push(...names);
  domElements.participantInput.value = '';

  drawWheel();
  updateParticipantList();
}

/**
 * Clear all participants and winners
 */
function clearParticipants() {
  participants = [];
  winners = [];
  rotation = 0;

  domElements.winnerHistory.innerHTML = '';
  domElements.winnerName.textContent = CONFIG.noWinnerText;

  drawWheel();
  updateParticipantList();
}

// ============================================
// Spin and Winner Functions
// ============================================

/**
 * Start the wheel spin animation
 */
function startSpin() {
  if (spinning || participants.length === 0) return;

  spinning = true;
  domElements.wheelWrapper.classList.add('spinning');

  // Play spin sound
  safePlayAudio(domElements.spinSound);

  // Select random winner
  const randomIndex = Math.floor(Math.random() * participants.length);
  const winner = participants[randomIndex];

  // Calculate rotation target
  const segment = 360 / participants.length;
  const target = 360 - (segment * randomIndex) - segment / 2;
  rotation += CONFIG.rotationMultiplier + target;

  // Apply rotation animation
  domElements.canvas.style.transform = `rotate(${rotation}deg)`;

  // Handle completion after spin animation
  setTimeout(() => {
    handleSpinComplete(winner, randomIndex);
  }, CONFIG.spinDuration);
}

/**
 * Handle spin completion and display winner
 * @param {string} winner - Winner name
 * @param {number} randomIndex - Winner index in participants array
 */
function handleSpinComplete(winner, randomIndex) {
  // Stop spin sound and play win sound
  stopAudio(domElements.spinSound);
  safePlayAudio(domElements.winSound);

  // Display winner with animation
  displayWinner(winner);

  // Update winners list
  winners.unshift(winner);
  addToHistory(winner);

  // Remove winner if checkbox is checked
  if (domElements.removeWinnerCheckbox.checked) {
    participants.splice(randomIndex, 1);
  }

  // Update displays
  drawWheel();
  updateParticipantList();

  // Remove spinning class
  domElements.wheelWrapper.classList.remove('spinning');
  spinning = false;

  // Handle multi-spin
  handleMultiSpin();
}

/**
 * Display winner with animation
 * @param {string} winner - Winner name
 */
function displayWinner(winner) {
  domElements.winnerName.classList.remove('winner-animation');

  // Trigger reflow to restart animation
  void domElements.winnerName.offsetWidth;

  domElements.winnerName.textContent = `🎉 ${winner} 🎉`;
  domElements.winnerName.classList.add('winner-animation');
}

/**
 * Add winner to history list
 * @param {string} winner - Winner name
 */
function addToHistory(winner) {
  const li = document.createElement('li');
  li.textContent = winner;
  domElements.winnerHistory.prepend(li);
}

/**
 * Handle multi-spin functionality
 */
function handleMultiSpin() {
  const multiSpinValue = parseInt(domElements.multiSpinInput.value, 10);

  if (multiSpinValue > 1) {
    domElements.multiSpinInput.value = multiSpinValue - 1;

    if (participants.length > 0) {
      setTimeout(startSpin, CONFIG.autoSpinDelay);
    }
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Safely play audio with error handling
 * @param {HTMLAudioElement} audio - Audio element to play
 */
function safePlayAudio(audio) {
  if (!audio) return;
  
  audio.currentTime = 0;
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(err => {
      console.warn('Audio play failed:', err);
    });
  }
}

/**
 * Stop audio playback
 * @param {HTMLAudioElement} audio - Audio element to stop
 */
function stopAudio(audio) {
  if (!audio) return;
  
  audio.pause();
  audio.currentTime = 0;
}

// ============================================
// Initialization
// ============================================

// Initial wheel draw
drawWheel();
