// ==========================================================================
// AMI by KasaTECH — The Focus Buddy (Full Interactive Engine)
// Pure Local-First Architecture: Timer, microSD Audio, Voice STT/TTS,
// Reminders, Chat, Adaptive Rhythm, and Pet Reactions
// ==========================================================================

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// --- Local-First State ---
const STORAGE_KEY = 'ami_kasatech_state_v2';

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  mode: 'study', // study | work | reset
  musicMode: 'focus', // focus | relax | energise
  voiceEnabled: true,
  speakReplies: false,
  nudgeStyle: 'gentle',
  eyeRestMinutes: 20,
  stretchMinutes: 50,
  waterMinutes: 45
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { settings: { ...DEFAULT_SETTINGS }, sessions: [], reminders: [] };
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      sessions: parsed.sessions || [],
      reminders: parsed.reminders || []
    };
  } catch (_) {
    return { settings: { ...DEFAULT_SETTINGS }, sessions: [], reminders: [] };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    settings: appState.settings,
    sessions: appState.sessions,
    reminders: appState.reminders
  }));
}

const appState = loadState();

// Active Timer Variables
let activeTimer = null; // { mode: 'study'|'break', totalSeconds, remainingSeconds, intervalId, isRunning: false }
let ambientAudio = null; // Web Audio context & nodes
let isMusicPlaying = false;
let toastTimeout = null;

// ==========================================================================
// 1. FLOATING TOAST SYSTEM
// ==========================================================================
function toast(message, duration = 3200) {
  const container = $('#toastContainer');
  if (!container) return;
  
  const el = document.createElement('div');
  el.className = 'glass-toast';
  el.innerHTML = `<span>${escapeHtml(message)}</span>`;
  container.appendChild(el);

  // Trigger animation
  requestAnimationFrame(() => el.classList.add('visible'));

  setTimeout(() => {
    el.classList.remove('visible');
    setTimeout(() => el.remove(), 260);
  }, duration);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// ==========================================================================
// 2. VIEW SWITCHING (OVERVIEW VS LIVE APP)
// ==========================================================================
const btnShowLanding = $('#btnShowLanding');
const btnShowApp = $('#btnShowApp');
const landingView = $('#landingView');
const appView = $('#appView');
const brandHomeBtn = $('#brandHomeBtn');
const heroLaunchAppBtn = $('#heroLaunchAppBtn');

function switchView(target) {
  if (target === 'app') {
    landingView.classList.remove('active');
    appView.classList.add('active');
    btnShowLanding.classList.remove('active');
    btnShowApp.classList.add('active');
  } else {
    appView.classList.remove('active');
    landingView.classList.add('active');
    btnShowApp.classList.remove('active');
    btnShowLanding.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

btnShowLanding?.addEventListener('click', () => switchView('landing'));
btnShowApp?.addEventListener('click', () => switchView('app'));
brandHomeBtn?.addEventListener('click', (e) => { e.preventDefault(); switchView('landing'); });
heroLaunchAppBtn?.addEventListener('click', () => switchView('app'));

function handleOrderModal() {
  const modal = document.getElementById('orderModal');
  if (modal && typeof modal.showModal === 'function') {
    modal.showModal();
    playCuteChime();
  }
}
document.getElementById('btnCloseOrder')?.addEventListener('click', () => {
  document.getElementById('orderModal')?.close();
});
window.submitOrder = function() {
  const nameInput = document.getElementById('orderName');
  const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Friend';
  document.getElementById('orderModal')?.close();
  playCuteChime();
  spawnHeartParticle();
  setTimeout(spawnHeartParticle, 180);
  setTimeout(spawnHeartParticle, 360);
  toast(`Thank you, ${name}! Your AMI pre-order is confirmed. Estimated dispatch: 3 business days.`);
};
$('#btnOrderHeader')?.addEventListener('click', handleOrderModal);
$('#heroOrderBtn')?.addEventListener('click', handleOrderModal);

// ==========================================================================
// 3. HARDWARE SPECS DRAWER
// ==========================================================================
const btnToggleSpecs = $('#btnToggleSpecs');
const specsDrawer = $('#specsDrawer');

btnToggleSpecs?.addEventListener('click', () => {
  specsDrawer.classList.toggle('open');
  btnToggleSpecs.classList.toggle('active');
});

// ==========================================================================
// 4. MASCOT INTERACTIVE ENGINE (PETTING, HEARTS, SOUND, EYE TRACKING)
// ==========================================================================
const amiStage = $('#amiStage');
const robotGraphic = $('#robotGraphic');
const eyeLeft = $('#eyeLeft');
const eyeRight = $('#eyeRight');
const robotHeartRing = $('#robotHeartRing');
const amiCaptionText = $('#amiCaptionText');
const amiHeartsContainer = $('#amiHeartsContainer');
const robotBodyGroup = $('#robotBodyGroup');

let isMascotInteracting = false;
let mouseTargetX = 0;
let mouseTargetY = 0;
let currentEyeX = 0;
let currentEyeY = 0;
let isBlinking = false;
let blinkTimeout = null;

// Sound Synthesizer for Cute Bell Chimes
function playCuteChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(783.99, now); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08); // C6
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.16); // E6

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (_) {}
}

function spawnHeartParticle() {
  if (!amiHeartsContainer) return;
  const heart = document.createElement('div');
  heart.className = 'ami-floating-heart';
  heart.textContent = Math.random() < 0.35 ? '✨' : '♥';
  const offset = (Math.random() - 0.5) * 70;
  heart.style.left = `calc(50% + ${offset}px)`;
  heart.style.bottom = '90px';
  amiHeartsContainer.appendChild(heart);
  setTimeout(() => heart.remove(), 1200);
}

function triggerRobotBlink(happy = false) {
  if (!eyeLeft || !eyeRight) return;
  isBlinking = true;
  eyeLeft.style.transform = `translate(86px, 122px) scaleY(0.06)`;
  eyeRight.style.transform = `translate(134px, 122px) scaleY(0.06)`;

  setTimeout(() => {
    eyeLeft.style.transform = `translate(${86 + currentEyeX}px, ${122 + currentEyeY}px) scaleY(1)`;
    eyeRight.style.transform = `translate(${134 + currentEyeX}px, ${122 + currentEyeY}px) scaleY(1)`;
    isBlinking = false;
  }, happy ? 180 : 120);
}

function scheduleAutonomousBlink() {
  clearTimeout(blinkTimeout);
  blinkTimeout = setTimeout(() => {
    triggerRobotBlink();
    scheduleAutonomousBlink();
  }, 3000 + Math.random() * 4000);
}
scheduleAutonomousBlink();

// Eye Pupil Tracking via Pointer / Touch
function updateTrackingPoint(clientX, clientY) {
  if (!robotGraphic) return;
  const rect = robotGraphic.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height * 0.45;
  const dx = clientX - centerX;
  const dy = clientY - centerY;
  const factor = Math.min(1, Math.hypot(dx, dy) / (window.innerWidth * 0.6));
  const angle = Math.atan2(dy, dx);
  mouseTargetX = Math.cos(angle) * factor * 5.5;
  mouseTargetY = Math.sin(angle) * factor * 3.8;
}

window.addEventListener('pointermove', (e) => updateTrackingPoint(e.clientX, e.clientY), { passive: true });
window.addEventListener('touchmove', (e) => {
  if (e.touches && e.touches[0]) updateTrackingPoint(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

function eyeLoop() {
  currentEyeX += (mouseTargetX - currentEyeX) * 0.14;
  currentEyeY += (mouseTargetY - currentEyeY) * 0.14;

  if (eyeLeft && eyeRight && !isBlinking) {
    eyeLeft.style.transform = `translate(${86 + currentEyeX}px, ${122 + currentEyeY}px)`;
    eyeRight.style.transform = `translate(${134 + currentEyeX}px, ${122 + currentEyeY}px)`;
  }

  if (robotBodyGroup) {
    const tilt = currentEyeX * 0.45;
    robotBodyGroup.style.transform = `rotate(${tilt.toFixed(2)}deg)`;
  }

  requestAnimationFrame(eyeLoop);
}
requestAnimationFrame(eyeLoop);

// Petting Interaction on Robot Stage
const PET_LINES = [
  "*beep-boop!* AMI is cheering for you! ♥",
  "Pat pat received! One thing at a time.",
  "Deep breath... you are doing wonderful. ✨",
  "AMI is right beside you on your desk. ✿",
  "Pace yourself. Rest is part of the work."
];

function petMascot() {
  if (isMascotInteracting) return;
  isMascotInteracting = true;
  playCuteChime();
  spawnHeartParticle();
  setTimeout(spawnHeartParticle, 160);

  triggerRobotBlink(true);
  robotGraphic?.classList.add('ami-pet-bounce');

  if (amiCaptionText) amiCaptionText.textContent = "AMI is happy you’re here ♥";

  const line = PET_LINES[Math.floor(Math.random() * PET_LINES.length)];
  toast(line);

  setTimeout(() => {
    robotGraphic?.classList.remove('ami-pet-bounce');
    isMascotInteracting = false;
    if (amiCaptionText) {
      amiCaptionText.textContent = activeTimer?.isRunning ? "AMI is gently focusing with you ✿" : "AMI · Tap companion to pet & chime";
    }
  }, 1000);
}

amiStage?.addEventListener('click', petMascot);
$('#btnRobotBlink')?.addEventListener('click', () => { triggerRobotBlink(true); });
$('#btnRobotChime')?.addEventListener('click', () => { playCuteChime(); spawnHeartParticle(); });

// Greeting Chip Time-of-Day
const currentHour = new Date().getHours();
const greetingEl = $('#greetingLabel');
if (greetingEl) {
  greetingEl.textContent = currentHour < 12 ? 'Good morning!' : currentHour < 18 ? 'Good afternoon!' : 'Good evening!';
}

// ==========================================================================
// 5. LOCAL MICROSD AUDIO SYNTHESIZER (WEB AUDIO GENERATOR)
// ==========================================================================
const btnToggleMusic = $('#btnToggleMusic');
const musicPlayIcon = $('#musicPlayIcon');
const albumOrb = $('#albumOrb');
const musicTitleText = $('#musicTitleText');
const musicSubText = $('#musicSubText');
const musicMoodButtons = $$('.music-mood-btn');

function initAmbientSound(mood) {
  stopAmbientSound();
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.2);
    masterGain.connect(ctx.destination);

    const oscs = [];

    if (mood === 'focus') {
      // Warm Calm Drone (F3 - C4 - A4)
      [174.61, 261.63, 440.0].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(0.06, ctx.currentTime);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        oscs.push(osc);
      });
    } else if (mood === 'relax') {
      // Slow breathing harmonic pad (C3 - G3 - E4)
      [130.81, 196.0, 329.63].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(0.05, ctx.currentTime);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        oscs.push(osc);
      });
    } else {
      // Energise (A3 - E4 - B4 light chime drone)
      [220.0, 329.63, 493.88].forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(0.07, ctx.currentTime);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        oscs.push(osc);
      });
    }

    ambientAudio = { ctx, masterGain, oscs };
  } catch (err) {
    console.log('Audio init blocked until user interaction', err);
  }
}

function stopAmbientSound() {
  if (ambientAudio) {
    try {
      ambientAudio.masterGain.gain.linearRampToValueAtTime(0.0001, ambientAudio.ctx.currentTime + 0.4);
      setTimeout(() => {
        ambientAudio.oscs.forEach(o => o.stop());
        ambientAudio.ctx.close();
        ambientAudio = null;
      }, 450);
    } catch (_) {
      ambientAudio = null;
    }
  }
}

function updateMusicUI() {
  musicMoodButtons.forEach(b => b.classList.toggle('active', b.dataset.music === appState.settings.musicMode));
  const modeCap = appState.settings.musicMode.charAt(0).toUpperCase() + appState.settings.musicMode.slice(1);
  if (musicTitleText) musicTitleText.textContent = `AMI · ${modeCap} Ambient`;
  if (musicSubText) musicSubText.textContent = isMusicPlaying ? 'Synthesizing from microSD tracks' : 'Ready on the companion’s SD card';
  if (musicPlayIcon) musicPlayIcon.textContent = isMusicPlaying ? 'Ⅱ' : '▶';
  if (albumOrb) albumOrb.classList.toggle('spinning', isMusicPlaying);
}

function toggleMusicPlayback(forceState = null) {
  isMusicPlaying = forceState !== null ? forceState : !isMusicPlaying;
  if (isMusicPlaying) {
    initAmbientSound(appState.settings.musicMode);
    toast(`Playing local ${appState.settings.musicMode} track from microSD ♪`);
  } else {
    stopAmbientSound();
    toast('Local audio paused');
  }
  updateMusicUI();
}

btnToggleMusic?.addEventListener('click', () => toggleMusicPlayback());

musicMoodButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    appState.settings.musicMode = btn.dataset.music;
    saveState();
    if (isMusicPlaying) {
      initAmbientSound(appState.settings.musicMode);
    }
    updateMusicUI();
    toast(`Switched audio to ${appState.settings.musicMode} mode`);
  });
});

// ==========================================================================
// 6. FOCUS TIMER & BREAK FLOW
// ==========================================================================
const timerDisplay = $('#timerDisplay');
const timerStatusLabel = $('#timerStatusLabel');
const btnFocusStart = $('#btnFocusStart');
const btnFocusFinish = $('#btnFocusFinish');
const breakPromptWrap = $('#breakPromptWrap');
const btnBreakStart = $('#btnBreakStart');
const cycleLabel = $('#cycleLabel');
const focusStateNote = $('#focusStateNote');
const modeTabButtons = $$('.mode-tab-btn');
const selectWorkCycle = $('#selectWorkCycle');
const selectBreakCycle = $('#selectBreakCycle');

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function getPlannedMinutes() {
  if (appState.settings.mode === 'reset') return 10;
  if (appState.settings.mode === 'work') return 50;
  return Number(appState.settings.workMinutes || 25);
}

function resetTimerObject() {
  if (activeTimer?.intervalId) clearInterval(activeTimer.intervalId);
  const totalSeconds = getPlannedMinutes() * 60;
  activeTimer = {
    mode: 'focus',
    totalSeconds,
    remainingSeconds: totalSeconds,
    intervalId: null,
    isRunning: false
  };
  renderTimerUI();
}

function renderTimerUI() {
  if (!activeTimer) resetTimerObject();
  if (timerDisplay) timerDisplay.textContent = formatSeconds(activeTimer.remainingSeconds);

  if (activeTimer.mode === 'break') {
    if (timerStatusLabel) timerStatusLabel.textContent = 'RESTING & REHYDRATING';
    if (btnFocusStart) btnFocusStart.textContent = activeTimer.isRunning ? 'Pause break' : 'Resume break';
    btnFocusStart?.classList.add('break-active');
  } else {
    if (timerStatusLabel) {
      timerStatusLabel.textContent = activeTimer.isRunning ? 'FOCUS BLOCK IN PROGRESS' : 'READY WHEN YOU ARE';
    }
    if (btnFocusStart) {
      btnFocusStart.textContent = activeTimer.isRunning ? 'Pause session' : (activeTimer.remainingSeconds < activeTimer.totalSeconds ? 'Resume focus' : 'Start focus');
    }
    btnFocusStart?.classList.remove('break-active');
  }

  if (btnFocusFinish) {
    btnFocusFinish.disabled = !activeTimer.isRunning && activeTimer.remainingSeconds === activeTimer.totalSeconds;
  }

  if (robotHeartRing) {
    robotHeartRing.style.animationDuration = activeTimer.isRunning ? '2.4s' : '4s';
  }

  // Update Cycle Label
  if (cycleLabel) {
    cycleLabel.textContent = `${appState.settings.workMinutes} min focus · ${appState.settings.breakMinutes} min break`;
  }
}

function startTimerCountdown() {
  if (activeTimer.isRunning) return;
  activeTimer.isRunning = true;
  renderTimerUI();

  activeTimer.intervalId = setInterval(() => {
    if (activeTimer.remainingSeconds > 0) {
      activeTimer.remainingSeconds--;
      renderTimerUI();

      // Check gentle interval nudges during focus
      if (activeTimer.mode === 'focus') {
        const elapsed = activeTimer.totalSeconds - activeTimer.remainingSeconds;
        checkIntervalNudges(elapsed);
      }
    } else {
      completeSession();
    }
  }, 1000);
}

function pauseTimerCountdown() {
  if (!activeTimer.isRunning) return;
  activeTimer.isRunning = false;
  if (activeTimer.intervalId) clearInterval(activeTimer.intervalId);
  activeTimer.intervalId = null;
  renderTimerUI();
}

function completeSession() {
  pauseTimerCountdown();
  playCuteChime();

  if (activeTimer.mode === 'focus') {
    // Record completed session
    const elapsedMinutes = Math.round(activeTimer.totalSeconds / 60);
    appState.sessions.push({
      mode: appState.settings.mode,
      minutes: elapsedMinutes,
      completedAt: new Date().toISOString()
    });
    saveState();
    updateProgressUI();

    toast('Focus session complete! You showed up and logged real progress ♥');
    triggerRobotBlink(true);

    // Show Break Prompt
    const completedCount = appState.sessions.length;
    const isLongBreak = completedCount % appState.settings.longBreakEvery === 0;
    const breakDuration = isLongBreak ? appState.settings.longBreakMinutes : appState.settings.breakMinutes;

    if (breakPromptWrap) breakPromptWrap.style.display = 'block';
    if (btnBreakStart) {
      btnBreakStart.innerHTML = `<span>☕ Start your ${breakDuration}-min ${isLongBreak ? 'long ' : ''}break</span>`;
    }
    if (focusStateNote) {
      focusStateNote.textContent = `Completed block. Jom rehat ${breakDuration} minit!`;
    }
  } else {
    // Break completed
    toast('Break done! Ready when you are for the next focus block.');
    if (breakPromptWrap) breakPromptWrap.style.display = 'none';
    resetTimerObject();
  }
}

function startBreakSession() {
  const completedCount = appState.sessions.length;
  const isLongBreak = completedCount > 0 && completedCount % appState.settings.longBreakEvery === 0;
  const breakMins = isLongBreak ? appState.settings.longBreakMinutes : appState.settings.breakMinutes;

  if (activeTimer.intervalId) clearInterval(activeTimer.intervalId);
  activeTimer = {
    mode: 'break',
    totalSeconds: breakMins * 60,
    remainingSeconds: breakMins * 60,
    intervalId: null,
    isRunning: false
  };

  if (breakPromptWrap) breakPromptWrap.style.display = 'none';
  toast(`Starting ${breakMins}-minute gentle pause. Stretch, sip water, rest your eyes.`);
  startTimerCountdown();
}

btnFocusStart?.addEventListener('click', () => {
  if (activeTimer.isRunning) {
    pauseTimerCountdown();
  } else {
    startTimerCountdown();
  }
});

btnFocusFinish?.addEventListener('click', () => {
  if (confirm('Finish this block early and log your progress?')) {
    completeSession();
  }
});

btnBreakStart?.addEventListener('click', startBreakSession);

modeTabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    modeTabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    appState.settings.mode = btn.dataset.mode;
    saveState();
    resetTimerObject();
    toast(`Focus mode set to ${btn.dataset.mode}`);
  });
});

selectWorkCycle?.addEventListener('change', (e) => {
  appState.settings.workMinutes = Number(e.target.value);
  saveState();
  resetTimerObject();
  toast(`Work cycle updated to ${appState.settings.workMinutes}m`);
});

selectBreakCycle?.addEventListener('change', (e) => {
  appState.settings.breakMinutes = Number(e.target.value);
  saveState();
  renderTimerUI();
  toast(`Break cycle updated to ${appState.settings.breakMinutes}m`);
});

// Periodic Gentle Interval Nudges
const nudgeFiredMap = new Set();
function checkIntervalNudges(elapsedSeconds) {
  const checks = [
    { key: 'eye', mins: appState.settings.eyeRestMinutes, text: '👀 Eye release: Look 20 feet away for 20 seconds.' },
    { key: 'stretch', mins: appState.settings.stretchMinutes, text: '🫶 Posture shift: Stand up and roll your shoulders back.' },
    { key: 'water', mins: appState.settings.waterMinutes, text: '💧 Hydration check: Take a calm sip of water.' }
  ];

  checks.forEach(({ key, mins, text }) => {
    const thresholdSecs = Number(mins) * 60;
    if (thresholdSecs > 0 && elapsedSeconds >= thresholdSecs && !nudgeFiredMap.has(key)) {
      nudgeFiredMap.add(key);
      toast(text, 5000);
      playCuteChime();
      if (appState.settings.speakReplies && 'speechSynthesis' in window) {
        speakText(text);
      }
    }
  });
}

// ==========================================================================
// 7. TIMED REMINDERS SYSTEM (WITH VOICE RECOGNITION)
// ==========================================================================
const reminderForm = $('#reminderForm');
const inputReminderText = $('#inputReminderText');
const inputReminderTime = $('#inputReminderTime');
const btnVoiceReminder = $('#btnVoiceReminder');
const remindersList = $('#remindersList');
const voiceStatusNote = $('#voiceStatusNote');

function setDefaultReminderDate() {
  if (!inputReminderTime) return;
  const d = new Date(Date.now() + 15 * 60 * 1000);
  d.setSeconds(0, 0);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  inputReminderTime.value = local;
}

function renderRemindersUI() {
  if (!remindersList) return;
  if (!appState.reminders || appState.reminders.length === 0) {
    remindersList.innerHTML = '<div class="empty-reminders-state">Your reminders will show up here.</div>';
    return;
  }

  remindersList.innerHTML = '';
  appState.reminders.forEach((rem, idx) => {
    const due = new Date(rem.dueAt);
    const timeStr = due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = due.toLocaleDateString([], { month: 'short', day: 'numeric' });

    const row = document.createElement('div');
    row.className = 'reminder-card-item glass-light';
    row.innerHTML = `
      <div class="reminder-text-col">
        <strong>${escapeHtml(rem.text)}</strong>
        <small>${dateStr} at ${timeStr}</small>
      </div>
      <button class="btn-del-reminder glass-pill" data-idx="${idx}" title="Delete reminder">×</button>
    `;
    remindersList.appendChild(row);
  });

  $$('.btn-del-reminder').forEach(b => {
    b.addEventListener('click', (e) => {
      const i = Number(e.currentTarget.dataset.idx);
      appState.reminders.splice(i, 1);
      saveState();
      renderRemindersUI();
      toast('Reminder removed');
    });
  });
}

reminderForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = inputReminderText?.value.trim();
  const dueAt = inputReminderTime?.value;
  if (!text || !dueAt) return;

  appState.reminders.push({
    id: `rem_${Date.now()}`,
    text,
    dueAt: new Date(dueAt).toISOString(),
    fired: false
  });
  saveState();
  if (inputReminderText) inputReminderText.value = '';
  setDefaultReminderDate();
  renderRemindersUI();
  toast('Reminder scheduled ♥');
});

// Reminder Interval Watcher
setInterval(() => {
  const now = Date.now();
  appState.reminders.forEach((r) => {
    if (!r.fired && new Date(r.dueAt).getTime() <= now) {
      r.fired = true;
      saveState();
      toast(`🔔 Reminder: ${r.text}`, 6000);
      playCuteChime();
      triggerRobotBlink(true);
      if (appState.settings.voiceEnabled && 'speechSynthesis' in window) {
        speakText(`Reminder: ${r.text}`);
      }
    }
  });
}, 8000);

// ==========================================================================
// 8. VOICE RECOGNITION (SPEECH-TO-TEXT) & SPEECH SYNTHESIS (TTS)
// ==========================================================================
function setupSpeechInput(triggerBtn, targetInput) {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) {
    triggerBtn?.addEventListener('click', () => {
      toast('Voice input is not supported in this browser; you can type instead.');
    });
    return;
  }

  triggerBtn?.addEventListener('click', () => {
    const recognition = new Speech();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    toast('🎙 Listening... speak now');
    if (voiceStatusNote) voiceStatusNote.textContent = 'Listening… speak when ready.';

    recognition.onresult = (evt) => {
      const transcript = evt.results[0][0].transcript;
      if (targetInput) {
        targetInput.value = transcript;
        if (targetInput.id === 'chatInputText') {
          handleChatSubmission(transcript);
        }
      }
      toast(`Captured: "${transcript}"`);
    };

    recognition.onerror = () => {
      toast('Voice recognition stopped or microphone unavailable.');
    };

    recognition.onend = () => {
      if (voiceStatusNote) voiceStatusNote.textContent = 'Voice input uses browser speech recognition.';
    };

    try {
      recognition.start();
    } catch (_) {
      toast('Could not start microphone; check browser permissions.');
    }
  });
}

setupSpeechInput(btnVoiceReminder, inputReminderText);

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

const btnSpeakToggle = $('#btnSpeakToggle');
btnSpeakToggle?.addEventListener('click', () => {
  appState.settings.speakReplies = !appState.settings.speakReplies;
  saveState();
  btnSpeakToggle.setAttribute('aria-pressed', String(appState.settings.speakReplies));
  btnSpeakToggle.textContent = `Read replies aloud: ${appState.settings.speakReplies ? 'on' : 'off'}`;
  toast(`Read replies aloud: ${appState.settings.speakReplies ? 'enabled' : 'disabled'}`);
});

// ==========================================================================
// 9. TALK TO AMI (INTERACTIVE CHAT ENGINE)
// ==========================================================================
const chatLogWindow = $('#chatLogWindow');
const chatForm = $('#chatForm');
const chatInputText = $('#chatInputText');
const btnChatMic = $('#btnChatMic');
const quickReplyButtons = $$('.quick-reply-btn');
const treatChips = $$('.treat-chip');

function appendChatBubble(text, sender = 'ami') {
  if (!chatLogWindow) return;
  const bubble = document.createElement('div');
  bubble.className = `bubble ${sender}-bubble glass-light`;
  bubble.textContent = text;
  chatLogWindow.appendChild(bubble);
  chatLogWindow.scrollTop = chatLogWindow.scrollHeight;
  return bubble;
}

const LOCAL_AI_RESPONSES = {
  distracted: "That's completely human. Close your eyes for three slow breaths, then stay with just the next five minutes.",
  tired: "Stand up, stretch your shoulders, and drink half a cup of water. Resting is productive too.",
  joke: "Why did the robot sit on the clock? To make sure it was on time for you!",
  riddle: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I? (An echo!)",
  trivia: "Did you know octopuses have three hearts and blue blood? The world is full of wondrous things.",
  story: "A little robin paused on a stone windowsill to catch its breath before soaring higher. Sometimes pausing is part of the journey.",
  focus: "Let's pick one small step. Not the whole mountain, just the next single paragraph or file.",
  hello: "Hey there! I am right here on your desk. Ready to focus together?",
  default: "I hear you. Let's take it one gentle step at a time. What would feel good to begin with?"
};

function generateAmiReply(query) {
  const q = query.toLowerCase();
  if (q.includes('distract') || q.includes('lost') || q.includes('stuck')) return LOCAL_AI_RESPONSES.distracted;
  if (q.includes('tired') || q.includes('penat') || q.includes('sleepy') || q.includes('exhaust')) return LOCAL_AI_RESPONSES.tired;
  if (q.includes('joke') || q.includes('lawak') || q.includes('funny')) return LOCAL_AI_RESPONSES.joke;
  if (q.includes('riddle') || q.includes('teka')) return LOCAL_AI_RESPONSES.riddle;
  if (q.includes('trivia') || q.includes('fun fact') || q.includes('fact')) return LOCAL_AI_RESPONSES.trivia;
  if (q.includes('story') || q.includes('cerita')) return LOCAL_AI_RESPONSES.story;
  if (q.includes('focus') || q.includes('start') || q.includes('study') || q.includes('work')) return LOCAL_AI_RESPONSES.focus;
  if (q.includes('hi') || q.includes('hello') || q.includes('hey')) return LOCAL_AI_RESPONSES.hello;
  return LOCAL_AI_RESPONSES.default;
}

function handleChatSubmission(msg) {
  const clean = msg.trim();
  if (!clean) return;
  appendChatBubble(clean, 'user');
  if (chatInputText) chatInputText.value = '';

  const pendingBubble = appendChatBubble('AMI is thinking…', 'ami');
  pendingBubble.classList.add('pending');

  setTimeout(() => {
    const reply = generateAmiReply(clean);
    pendingBubble.textContent = reply;
    pendingBubble.classList.remove('pending');
    triggerRobotBlink(true);

    if (appState.settings.speakReplies) {
      speakText(reply);
    }
  }, 450);
}

chatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  handleChatSubmission(chatInputText?.value || '');
});

quickReplyButtons.forEach(btn => {
  btn.addEventListener('click', () => handleChatSubmission(btn.dataset.say));
});

treatChips.forEach(btn => {
  btn.addEventListener('click', () => {
    switchView('app');
    handleChatSubmission(btn.dataset.say);
  });
});

setupSpeechInput(btnChatMic, chatInputText);

// ==========================================================================
// 10. REAL PROGRESS & ADAPTIVE RHYTHM INSIGHTS
// ==========================================================================
const statSessionsVal = $('#statSessionsVal');
const statMinutesVal = $('#statMinutesVal');
const statStreakVal = $('#statStreakVal');
const adaptiveRecomText = $('#adaptiveRecomText');
const btnApplyAdaptive = $('#btnApplyAdaptive');

function updateProgressUI() {
  const totalSessions = appState.sessions.length;
  const totalMins = appState.sessions.reduce((acc, s) => acc + (s.minutes || 0), 0);

  // Calculate unique days streak
  const days = new Set(appState.sessions.map(s => new Date(s.completedAt).toLocaleDateString()));
  const today = new Date().toLocaleDateString();
  let streak = 0;
  let cursor = new Date();
  if (!days.has(today)) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toLocaleDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  if (statSessionsVal) statSessionsVal.textContent = totalSessions;
  if (statMinutesVal) statMinutesVal.textContent = totalMins;
  if (statStreakVal) statStreakVal.textContent = streak;

  // 7-Day Dots
  const dotIds = ['dotM', 'dotT', 'dotW', 'dotTh', 'dotF', 'dotSa', 'dotSu'];
  dotIds.forEach((id, i) => {
    const dot = $(`#${id}`);
    if (dot) dot.classList.toggle('active', i < Math.min(streak, 7));
  });

  // Adaptive Recommendation
  if (adaptiveRecomText) {
    if (totalSessions >= 3) {
      const suggested = totalMins / totalSessions > 35 ? 50 : 25;
      adaptiveRecomText.textContent = `Based on your ${totalSessions} completed blocks, AMI recommends ${suggested}m intervals with gentle breaks.`;
    } else {
      adaptiveRecomText.textContent = 'Every finished session teaches AMI what works for you. Complete a few blocks to get custom rhythm suggestions.';
    }
  }
}

btnApplyAdaptive?.addEventListener('click', () => {
  const totalSessions = appState.sessions.length;
  const suggested = totalSessions >= 3 && (appState.sessions.reduce((a, s) => a + s.minutes, 0) / totalSessions > 35) ? 50 : 25;
  appState.settings.workMinutes = suggested;
  saveState();
  if (selectWorkCycle) selectWorkCycle.value = String(suggested);
  resetTimerObject();
  toast(`Applied AMI's suggested rhythm: ${suggested}m focus!`);
});

// ==========================================================================
// 11. PREFERENCES MODAL (SETTINGS DIALOG)
// ==========================================================================
const btnOpenSettings = $('#btnOpenSettings');
const settingsDialog = $('#settingsDialog');
const btnCloseSettings = $('#btnCloseSettings');
const btnSaveSettings = $('#btnSaveSettings');

const settingLongBreakEvery = $('#settingLongBreakEvery');
const settingNudgeStyle = $('#settingNudgeStyle');
const settingVoiceEnabled = $('#settingVoiceEnabled');
const settingEyeInterval = $('#settingEyeInterval');
const settingStretchInterval = $('#settingStretchInterval');
const settingWaterInterval = $('#settingWaterInterval');

function openSettingsModal() {
  if (settingLongBreakEvery) settingLongBreakEvery.value = String(appState.settings.longBreakEvery);
  if (settingNudgeStyle) settingNudgeStyle.value = appState.settings.nudgeStyle;
  if (settingVoiceEnabled) settingVoiceEnabled.checked = appState.settings.voiceEnabled;
  if (settingEyeInterval) settingEyeInterval.value = String(appState.settings.eyeRestMinutes);
  if (settingStretchInterval) settingStretchInterval.value = String(appState.settings.stretchMinutes);
  if (settingWaterInterval) settingWaterInterval.value = String(appState.settings.waterMinutes);

  settingsDialog?.showModal();
}

btnOpenSettings?.addEventListener('click', openSettingsModal);
btnCloseSettings?.addEventListener('click', () => settingsDialog?.close());
settingsDialog?.addEventListener('click', (e) => {
  if (e.target === settingsDialog) settingsDialog.close();
});

btnSaveSettings?.addEventListener('click', () => {
  appState.settings.longBreakEvery = Number(settingLongBreakEvery?.value || 4);
  appState.settings.nudgeStyle = settingNudgeStyle?.value || 'gentle';
  appState.settings.voiceEnabled = settingVoiceEnabled?.checked ?? true;
  appState.settings.eyeRestMinutes = Number(settingEyeInterval?.value || 20);
  appState.settings.stretchMinutes = Number(settingStretchInterval?.value || 50);
  appState.settings.waterMinutes = Number(settingWaterInterval?.value || 45);

  saveState();
  settingsDialog?.close();

  // Sync intervals to badges
  const badgeEye = $('#badgeEyeInterval');
  const badgeStretch = $('#badgeStretchInterval');
  const badgeWater = $('#badgeWaterInterval');
  if (badgeEye) badgeEye.textContent = `${appState.settings.eyeRestMinutes}m`;
  if (badgeStretch) badgeStretch.textContent = `${appState.settings.stretchMinutes}m`;
  if (badgeWater) badgeWater.textContent = `${appState.settings.waterMinutes}m`;

  toast('Preferences saved. Adjusted gently.');
});

// ==========================================================================
// 12. INITIALIZATION
// ==========================================================================
function initApp() {
  if (selectWorkCycle) selectWorkCycle.value = String(appState.settings.workMinutes);
  if (selectBreakCycle) selectBreakCycle.value = String(appState.settings.breakMinutes);
  if (btnSpeakToggle) {
    btnSpeakToggle.setAttribute('aria-pressed', String(appState.settings.speakReplies));
    btnSpeakToggle.textContent = `Read replies aloud: ${appState.settings.speakReplies ? 'on' : 'off'}`;
  }

  // Badges sync
  const badgeEye = $('#badgeEyeInterval');
  const badgeStretch = $('#badgeStretchInterval');
  const badgeWater = $('#badgeWaterInterval');
  if (badgeEye) badgeEye.textContent = `${appState.settings.eyeRestMinutes}m`;
  if (badgeStretch) badgeStretch.textContent = `${appState.settings.stretchMinutes}m`;
  if (badgeWater) badgeWater.textContent = `${appState.settings.waterMinutes}m`;

  setDefaultReminderDate();
  renderRemindersUI();
  updateProgressUI();
  updateMusicUI();
  resetTimerObject();
}

initApp();
