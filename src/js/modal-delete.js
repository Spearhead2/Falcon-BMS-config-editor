// ── DELETE SETTING MODAL ──────────────────────────────────────────────────────

let pendingDeleteKey = null;

function promptDeleteSetting(key) {
  pendingDeleteKey = key;
  document.getElementById('confirm-key-display').textContent =
    `set ${key} ${state.currentValues[key] ?? ''}`;
  document.getElementById('confirm-modal').classList.add('open');
}

function closeConfirmModal() {
  document.getElementById('confirm-modal').classList.remove('open');
  pendingDeleteKey = null;
}

function handleConfirmBackdropClick(e) {
  if (e.target === document.getElementById('confirm-modal')) closeConfirmModal();
}

function commitDeleteSetting() {
  const key = pendingDeleteKey;
  if (!key) return;

  const entryIdx = state.entries.findIndex(e => e.key === key);
  if (entryIdx === -1) { closeConfirmModal(); return; }

  const entry   = state.entries[entryIdx];
  const lineIdx = entry.line_index;

  // Remove from rawLines and fix up remaining line indices
  state.rawLines.splice(lineIdx, 1);
  state.entries.forEach(e => { if (e.line_index > lineIdx) e.line_index--; });

  // Remove from all state maps
  state.entries.splice(entryIdx, 1);
  delete state.originalValues[key];
  delete state.currentValues[key];
  state.newKeys.delete(key);

  closeConfirmModal();
  renderNav();
  renderSettings();
  updateModifiedCount();

  showToast(`Removed: ${key}`, '');
  setStatus('Setting removed — remember to save', 'warn');
}
