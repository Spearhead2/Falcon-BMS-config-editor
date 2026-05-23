// ── STATUS BAR ────────────────────────────────────────────────────────────────

function setStatus(msg, type) {
  document.getElementById('status-text').textContent = msg;
  const dot = document.getElementById('status-dot');
  dot.className = 'status-dot' + (type ? ' ' + type : '');
}

// ── TOAST ─────────────────────────────────────────────────────────────────────

let toastTimer;

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  void t.offsetWidth; // force reflow to restart animation
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ── MODIFIED COUNT ────────────────────────────────────────────────────────────

function updateModifiedCount() {
  const count = Object.entries(state.currentValues)
    .filter(([k, v]) => v !== state.originalValues[k]).length;
  const el  = document.getElementById('modified-count');
  const num = document.getElementById('mod-num');
  el.style.display = count > 0 ? '' : 'none';
  num.textContent  = count;
}
