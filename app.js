// AMI by KasaTECH — Focus Companion Logic

// --- View Switcher (Overview vs App) ---
const btnShowLanding = document.getElementById('btnShowLanding');
const btnShowApp = document.getElementById('btnShowApp');
const landingView = document.getElementById('landingView');
const appView = document.getElementById('appView');
const brandHomeBtn = document.getElementById('brandHomeBtn');
const heroOrderBtn = document.getElementById('heroOrderBtn');
const btnOrderHeader = document.getElementById('btnOrderHeader');

function showLanding() {
  landingView.classList.add('active');
  appView.classList.remove('active');
  btnShowLanding.classList.add('active');
  btnShowApp.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showApp() {
  appView.classList.add('active');
  landingView.classList.remove('active');
  btnShowApp.classList.add('active');
  btnShowLanding.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

btnShowLanding.addEventListener('click', showLanding);
btnShowApp.addEventListener('click', showApp);
brandHomeBtn.addEventListener('click', (e) => { e.preventDefault(); showLanding(); });

function handleOrder() {
  alert('AMI by KasaTECH\n\nEdition: White Matte Unibody with Black Glass Visor\nIncludes: AMI Robot, 32GB microSD, Braided USB-C, Pulp Tray\nPrice: $89 (Free Worldwide Shipping)\n\nThank you for supporting calm, local-first hardware.');
}
heroOrderBtn.addEventListener('click', handleOrder);
btnOrderHeader.addEventListener('click', handleOrder);

// --- App Surface Navigation (Focus / Nudges / You) ---
const tabButtons = document.querySelectorAll('.app-tab-btn');
const surfaces = {
  focus: document.getElementById('surfaceFocus'),
  nudges: document.getElementById('surfaceNudges'),
  you: document.getElementById('surfaceYou')
};

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    Object.values(surfaces).forEach(s => s.classList.remove('active'));
    
    btn.classList.add('active');
    const target = btn.dataset.surface;
    if (surfaces[target]) {
      surfaces[target].classList.add('active');
    }
  });
});

// --- Focus Timer Logic ---
const timerDisplay = document.getElementById('timerDisplay');
const timerCaption = document.getElementById('timerCaption');
const btnMainAction = document.getElementById('btnMainAction');
const btnResetTimer = document.getElementById('btnResetTimer');
const btnSimulateDone = document.getElementById('btnSimulateDone');
const segButtons = document.querySelectorAll('.seg-btn');
const mockTimer = document.getElementById('mockTimer');
const robotHeartRing = document.getElementById('robotHeartRing');

const durations = {
  study: { duration: 25 * 60, label: '25 min focus · 5 min break' },
  work: { duration: 50 * 60, label: '50 min focus · 10 min break' },
  reset: { duration: 10 * 60, label: '10 min quiet pause' }
};

let currentMode = 'study';
let timeLeft = durations[currentMode].duration;
let timerId = null;
let isRunning = false;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  const formatted = formatTime(timeLeft);
  timerDisplay.textContent = formatted;
  if (mockTimer) mockTimer.textContent = formatted;
}

// Gentle Web Audio API Sound Chime (No external audio file needed)
function playGentleChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
    osc.frequency.exponentialRampToValueAtTime(554.37, audioCtx.currentTime + 0.3); // C#5
    osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.7); // E5

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 2.4);
  } catch (err) {
    console.log('Audio not supported or permitted yet', err);
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  btnMainAction.textContent = 'Pause session';
  btnMainAction.classList.add('active-running');
  btnMainAction.classList.remove('paused');

  if (robotHeartRing) {
    robotHeartRing.style.animationDuration = '2.5s';
  }

  timerId = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      finishSession();
    }
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerId);
  timerId = null;
  btnMainAction.textContent = 'Resume focus';
  btnMainAction.classList.remove('active-running');
  btnMainAction.classList.add('paused');

  if (robotHeartRing) {
    robotHeartRing.style.animationDuration = '4s';
  }
}

function resetTimer() {
  pauseTimer();
  timeLeft = durations[currentMode].duration;
  btnMainAction.textContent = 'Start focus';
  btnMainAction.classList.remove('active-running', 'paused');
  updateDisplay();
}

function finishSession() {
  pauseTimer();
  playGentleChime();
  
  // Award stats locally
  const totalSessionsEl = document.getElementById('totalSessions');
  const totalMinutesEl = document.getElementById('totalMinutes');
  
  let sessions = parseInt(totalSessionsEl.textContent || '14', 10) + 1;
  let addedMins = Math.round(durations[currentMode].duration / 60);
  let minutes = parseInt(totalMinutesEl.textContent || '350', 10) + addedMins;

  totalSessionsEl.textContent = sessions;
  totalMinutesEl.textContent = minutes;
  
  localStorage.setItem('ami_sessions', sessions);
  localStorage.setItem('ami_minutes', minutes);

  timerDisplay.textContent = '00:00';
  timerCaption.textContent = 'You showed up. Three numbers logged.';
  btnMainAction.textContent = 'Start next block';
  btnMainAction.classList.remove('active-running');

  // Trigger happy blink on robot
  triggerRobotBlink(true);
}

btnMainAction.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

btnResetTimer.addEventListener('click', resetTimer);
btnSimulateDone.addEventListener('click', finishSession);

segButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    segButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    timerCaption.textContent = durations[currentMode].label;
    resetTimer();
  });
});

// --- Mood Selector ---
const moodChip = document.getElementById('moodChip');
const moodSheet = document.getElementById('moodSheet');
const currentMoodLabel = document.getElementById('currentMoodLabel');
const moodOptions = document.querySelectorAll('.mood-option');

moodChip.addEventListener('click', () => {
  moodSheet.classList.toggle('open');
});

moodOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    moodOptions.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    currentMoodLabel.textContent = opt.dataset.mood;
    moodSheet.classList.remove('open');
  });
});

// --- Nudges Management ---
const newNudgeInput = document.getElementById('newNudgeInput');
const btnAddNudge = document.getElementById('btnAddNudge');
const nudgesContainer = document.getElementById('nudgesContainer');

btnAddNudge.addEventListener('click', () => {
  const text = newNudgeInput.value.trim();
  if (!text) return;

  const box = document.createElement('div');
  box.className = 'nudge-box';
  box.innerHTML = `
    <div class="nudge-left">
      <h4>${escapeHtml(text)}</h4>
      <p>Custom gentle interval pause</p>
    </div>
    <div class="nudge-right">
      <span class="nudge-tag">Every 30 m</span>
      <div class="toggle-switch" onclick="this.classList.toggle('off')">
        <div class="toggle-dot"></div>
      </div>
    </div>
  `;
  nudgesContainer.appendChild(box);
  newNudgeInput.value = '';
});

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// --- Interactive Robot SVG (Eyes follow & blink like EVE) ---
const eyeLeft = document.getElementById('eyeLeft');
const eyeRight = document.getElementById('eyeRight');
const robotGraphic = document.getElementById('robotGraphic');

function triggerRobotBlink(happy = false) {
  if (!eyeLeft || !eyeRight) return;
  
  eyeLeft.style.transform = 'translate(86px, 122px) scaleY(0.08)';
  eyeRight.style.transform = 'translate(134px, 122px) scaleY(0.08)';
  
  setTimeout(() => {
    eyeLeft.style.transform = 'translate(86px, 122px) scaleY(1)';
    eyeRight.style.transform = 'translate(134px, 122px) scaleY(1)';
  }, 140);
}

// Periodic autonomous natural blinks every 3 to 6 seconds
setInterval(() => {
  if (Math.random() > 0.3) {
    triggerRobotBlink();
  }
}, 4200);

// Mouse tracking: gentle subtle eye pupil shift
document.addEventListener('mousemove', (e) => {
  if (!robotGraphic || !eyeLeft || !eyeRight) return;
  const rect = robotGraphic.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  
  const deltaX = (e.clientX - centerX) / (window.innerWidth / 2);
  const deltaY = (e.clientY - centerY) / (window.innerHeight / 2);
  
  const clampedX = Math.max(-4, Math.min(4, deltaX * 4));
  const clampedY = Math.max(-3, Math.min(3, deltaY * 3));
  
  eyeLeft.style.transform = `translate(${86 + clampedX}px, ${122 + clampedY}px)`;
  eyeRight.style.transform = `translate(${134 + clampedX}px, ${122 + clampedY}px)`;
});

if (robotGraphic) {
  robotGraphic.addEventListener('click', () => {
    triggerRobotBlink(true);
    playGentleChime();
  });
}

// Load saved local stats
const savedSessions = localStorage.getItem('ami_sessions');
const savedMinutes = localStorage.getItem('ami_minutes');
if (savedSessions) document.getElementById('totalSessions').textContent = savedSessions;
if (savedMinutes) document.getElementById('totalMinutes').textContent = savedMinutes;

updateDisplay();

// --- Robot Action Buttons & Specs Drawer ---
const btnRobotBlink = document.getElementById('btnRobotBlink');
const btnRobotChime = document.getElementById('btnRobotChime');
const btnToggleSpecs = document.getElementById('btnToggleSpecs');
const specsDrawer = document.getElementById('specsDrawer');

if (btnRobotBlink) {
  btnRobotBlink.addEventListener('click', () => {
    triggerRobotBlink(true);
  });
}

if (btnRobotChime) {
  btnRobotChime.addEventListener('click', () => {
    playGentleChime();
    triggerRobotBlink(true);
  });
}

if (btnToggleSpecs && specsDrawer) {
  btnToggleSpecs.addEventListener('click', () => {
    specsDrawer.classList.toggle('open');
    btnToggleSpecs.classList.toggle('active');
  });
}

// --- Companion Check-In Chat Chips ---
const chatChips = document.querySelectorAll('.chat-chip-btn');
const chatResponseBox = document.getElementById('chatResponseBox');
const chatResponseText = document.getElementById('chatResponseText');

const companionReplies = {
  distracted: "That's completely fine. Take three slow breaths, then stay with just the next five minutes.",
  tired: "Stand up, stretch your shoulders back, and drink a glass of water. Rest is part of the rhythm.",
  joke: "Why did the robot sit on the clock? To be on time for you."
};

chatChips.forEach(chip => {
  chip.addEventListener('click', () => {
    chatChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    
    const key = chip.dataset.msg;
    const reply = companionReplies[key] || "One thing at a time.";
    
    if (chatResponseBox && chatResponseText) {
      chatResponseText.textContent = reply;
      chatResponseBox.style.display = 'flex';
      chatResponseBox.classList.remove('fade-in');
      void chatResponseBox.offsetWidth; // trigger reflow
      chatResponseBox.classList.add('fade-in');
    }
    
    triggerRobotBlink(true);
    if (key === 'tired' || key === 'joke') {
      playGentleChime();
    }
  });
});
