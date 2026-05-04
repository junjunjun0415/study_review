/* ========== Tabs ========== */
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const tabIndicator = document.querySelector('.tab-indicator');

function setActiveTab(tab) {
  tabs.forEach(t => t.classList.toggle('active', t === tab));
  const target = tab.dataset.tab;
  panels.forEach(p => p.classList.toggle('active', p.id === `panel-${target}`));
  positionIndicator(tab);
}

function positionIndicator(tab) {
  const parent = tab.parentElement;
  const parentRect = parent.getBoundingClientRect();
  const rect = tab.getBoundingClientRect();
  tabIndicator.style.left = `${rect.left - parentRect.left}px`;
  tabIndicator.style.width = `${rect.width}px`;
}

tabs.forEach(tab => tab.addEventListener('click', () => setActiveTab(tab)));
window.addEventListener('load', () => {
  positionIndicator(document.querySelector('.tab.active'));
});
window.addEventListener('resize', () => {
  positionIndicator(document.querySelector('.tab.active'));
});

/* ========== Counter ========== */
const countEl = document.getElementById('count');
const stepEl = document.getElementById('step');
const incrementBtn = document.getElementById('increment');
const decrementBtn = document.getElementById('decrement');
const resetBtn = document.getElementById('reset');
const stepUpBtn = document.getElementById('step-up');
const stepDownBtn = document.getElementById('step-down');

let count = 0;

function getStep() {
  const v = parseInt(stepEl.value, 10);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function renderCount() {
  countEl.textContent = count;
  countEl.classList.toggle('positive', count > 0);
  countEl.classList.toggle('negative', count < 0);
}

function bumpCount() {
  countEl.classList.remove('bump');
  void countEl.offsetWidth;
  countEl.classList.add('bump');
}

incrementBtn.addEventListener('click', () => { count += getStep(); renderCount(); bumpCount(); });
decrementBtn.addEventListener('click', () => { count -= getStep(); renderCount(); bumpCount(); });
resetBtn.addEventListener('click', () => { count = 0; renderCount(); bumpCount(); });
stepUpBtn.addEventListener('click', () => { stepEl.value = getStep() + 1; });
stepDownBtn.addEventListener('click', () => { stepEl.value = Math.max(1, getStep() - 1); });

renderCount();

/* ========== Timer ========== */
const timeMinEl = document.getElementById('time-min');
const timeSecEl = document.getElementById('time-sec');
const timeDisplay = document.getElementById('time-display');
const timerLabel = document.getElementById('timer-label');
const timerToggle = document.getElementById('timer-toggle');
const timerToggleLabel = document.getElementById('timer-toggle-label');
const timerResetBtn = document.getElementById('timer-reset');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const presetButtons = document.querySelectorAll('.preset');

let timerState = 'idle'; // 'idle' | 'running' | 'paused' | 'done'
let endTime = 0;          // ms timestamp when timer ends
let remainingMs = 0;      // remaining time when paused
let tickHandle = null;

function pad(n) {
  return String(n).padStart(2, '0');
}

function readInputDuration() {
  const m = Math.max(0, Math.min(99, parseInt(timeMinEl.value, 10) || 0));
  const s = Math.max(0, Math.min(59, parseInt(timeSecEl.value, 10) || 0));
  return (m * 60 + s) * 1000;
}

function setDisplay(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  timeMinEl.value = pad(m);
  timeSecEl.value = pad(s);
}

function setLabel(text) {
  timerLabel.textContent = text;
}

function setInputsDisabled(disabled) {
  timeMinEl.disabled = disabled;
  timeSecEl.disabled = disabled;
}

function setToggleUI(running) {
  timerToggle.classList.toggle('running', running);
  playIcon.style.display = running ? 'none' : '';
  pauseIcon.style.display = running ? '' : 'none';
  timerToggleLabel.textContent = running ? 'Pause' : (timerState === 'paused' ? 'Resume' : 'Start');
}

function clearVisualState() {
  timeDisplay.classList.remove('running', 'warning', 'done');
}

function updateVisualState(ms) {
  timeDisplay.classList.toggle('running', timerState === 'running' && ms > 10000);
  timeDisplay.classList.toggle('warning', timerState === 'running' && ms > 0 && ms <= 10000);
  timeDisplay.classList.toggle('done', timerState === 'done');
}

function tick() {
  const left = endTime - Date.now();
  if (left <= 0) {
    setDisplay(0);
    timerState = 'done';
    clearInterval(tickHandle);
    tickHandle = null;
    setToggleUI(false);
    timerToggleLabel.textContent = 'Restart';
    setInputsDisabled(false);
    setLabel('time’s up');
    updateVisualState(0);
    notify();
    return;
  }
  setDisplay(left);
  updateVisualState(left);
}

function startTimer() {
  let durationMs;
  if (timerState === 'paused' && remainingMs > 0) {
    durationMs = remainingMs;
  } else {
    durationMs = readInputDuration();
  }
  if (durationMs <= 0) return;

  endTime = Date.now() + durationMs;
  timerState = 'running';
  setInputsDisabled(true);
  clearVisualState();
  setLabel('counting down');
  setToggleUI(true);
  setDisplay(durationMs);
  updateVisualState(durationMs);

  if (tickHandle) clearInterval(tickHandle);
  tickHandle = setInterval(tick, 100);
}

function pauseTimer() {
  if (timerState !== 'running') return;
  remainingMs = Math.max(0, endTime - Date.now());
  timerState = 'paused';
  clearInterval(tickHandle);
  tickHandle = null;
  setToggleUI(false);
  setLabel('paused');
  clearVisualState();
}

function resetTimer() {
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
  timerState = 'idle';
  remainingMs = 0;
  setInputsDisabled(false);
  clearVisualState();
  setLabel('set duration');
  setToggleUI(false);
  // restore user-configured value (don't override their inputs)
}

function notify() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (freq, start, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0, 0.18);
    beep(1175, 0.22, 0.18);
    beep(1568, 0.44, 0.32);
  } catch (e) { /* noop */ }
}

timerToggle.addEventListener('click', () => {
  if (timerState === 'running') {
    pauseTimer();
  } else if (timerState === 'done') {
    timerState = 'idle';
    clearVisualState();
    startTimer();
  } else {
    startTimer();
  }
});

timerResetBtn.addEventListener('click', resetTimer);

presetButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const min = parseInt(btn.dataset.min, 10);
    timeMinEl.value = pad(min);
    timeSecEl.value = '00';
    presetButtons.forEach(b => b.classList.toggle('active', b === btn));
    if (timerState === 'running' || timerState === 'paused') {
      resetTimer();
    }
  });
});

[timeMinEl, timeSecEl].forEach(el => {
  el.addEventListener('focus', () => el.select());
  el.addEventListener('input', () => {
    presetButtons.forEach(b => b.classList.remove('active'));
  });
  el.addEventListener('blur', () => {
    el.value = pad(Math.max(0, Math.min(el === timeMinEl ? 99 : 59, parseInt(el.value, 10) || 0)));
  });
});

// Initialize timer display
timeMinEl.value = pad(parseInt(timeMinEl.value, 10) || 5);
timeSecEl.value = pad(parseInt(timeSecEl.value, 10) || 0);
