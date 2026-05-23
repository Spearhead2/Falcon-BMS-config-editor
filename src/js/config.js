// ── OPEN FILE ─────────────────────────────────────────────────────────────────

async function openFile() {
  if (!tauriDialog) { loadDemoData(); return; }
  try {
    const path = await tauriDialog.open({
      filters: [{ name: 'Config Files', extensions: ['cfg'] }],
      multiple: false,
    });
    if (!path) return;
    const config = await tauriInvoke('load_config', { path });
    loadConfig(path, config);
  } catch (e) {
    showToast('Error opening file: ' + e, 'error');
  }
}

// ── LOAD CONFIG ───────────────────────────────────────────────────────────────

function loadConfig(path, config) {
  state.filePath       = path;
  state.rawLines       = config.raw_lines;
  state.entries        = config.entries;
  state.originalValues = {};
  state.currentValues  = {};
  state.newKeys        = new Set();

  config.entries.forEach(e => {
    state.originalValues[e.key] = e.value;
    state.currentValues[e.key]  = e.value;
  });

  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('content-area').style.display = 'flex';

  document.getElementById('btn-save').disabled  = false;
  document.getElementById('btn-reset').disabled = false;
  document.getElementById('btn-add').disabled   = false;

  document.getElementById('status-path').textContent = path || 'Demo mode';
  setStatus('Config loaded — ' + config.entries.length + ' settings', 'ok');
  document.getElementById('status-count').textContent = config.entries.length + ' settings';

  renderNav();
  showSection('All');
}

// ── SAVE FILE ─────────────────────────────────────────────────────────────────

async function saveFile() {
  if (!state.filePath) { showToast('No file loaded', 'error'); return; }

  const changes = {};
  Object.entries(state.currentValues).forEach(([k, v]) => {
    if (v !== state.originalValues[k]) changes[k] = v;
  });

  if (!tauriInvoke) {
    const lines = Object.entries(changes).map(([k, v]) => `set ${k} ${v}`).join('\n');
    alert('Would save these changes:\n\n' + (lines || '(none)'));
    return;
  }

  try {
    await tauriInvoke('save_config', {
      path:     state.filePath,
      rawLines: state.rawLines,
      updates:  changes,
    });
    Object.assign(state.originalValues, state.currentValues);
    document.querySelectorAll('.setting-card.modified').forEach(c => c.classList.remove('modified'));
    updateModifiedCount();
    setStatus('Saved successfully', 'ok');
    showToast('Config saved ✓', 'success');
  } catch (e) {
    showToast('Save error: ' + e, 'error');
  }
}

// ── RESET ─────────────────────────────────────────────────────────────────────

function resetChanges() {
  Object.assign(state.currentValues, state.originalValues);
  renderSettings();
  showToast('All changes reset', '');
}

// ── DEMO DATA ─────────────────────────────────────────────────────────────────

function loadDemoData() {
  const demoEntries = [
    { key: 'g_fCursorSpeed',               value: '1.0',          comment: 'Mouse cursor speed multiplier in 3D pit',         line_index: 10  },
    { key: 'g_bMFDHighContrast',            value: '1',            comment: 'Enables high contrast mode on MFDs',              line_index: 11  },
    { key: 'g_fRadarScale',                 value: '0.75',         comment: 'Scale factor for the radar display',              line_index: 12  },
    { key: 'g_fDefaultFOV',                 value: '60',           comment: 'Default field of view in degrees',                line_index: 25  },
    { key: 'g_bHdrLighting',                value: '1',            comment: 'Enables HDR lighting',                           line_index: 40  },
    { key: 'g_bShadowMapping',              value: '1',            comment: 'Enables shadow mapping',                         line_index: 47  },
    { key: 'g_nVRHMD',                      value: '0',            comment: 'VR mode — 0: disabled; 1: SteamVR; 2: OpenXR',   line_index: 250 },
    { key: 'g_fVRResolution',               value: '1.0',          comment: 'VR resolution multiplier',                       line_index: 255 },
    { key: 'g_nDynamicVoices',              value: '128',          comment: 'Maximum number of voices for the sound system',  line_index: 99  },
    { key: 'g_bEnableTTS',                  value: '1',            comment: 'Globally enables Text-To-Speech (TTS)',           line_index: 211 },
    { key: 'g_nTTSSpeedAdjust',             value: '0',            comment: 'TTS talking speed, range -10 to 10',             line_index: 212 },
    { key: 'g_fMouseSensitivity',           value: '1.0',          comment: '3D mouse sensitivity multiplier',                line_index: 115 },
    { key: 'g_bMouseWheelKnobs',            value: '1',            comment: 'Allows mouse wheel to turn knobs in 3D pit',     line_index: 116 },
    { key: 'g_bAllowMP_NVG',               value: '1',            comment: 'Allow night vision goggles in multiplayer',      line_index: 55  },
    { key: 'g_npercentage_available_aircraft', value: '75',        comment: 'Proportion of squadron roster available (%)',    line_index: 74  },
    { key: 'g_sRadioStandardCol',           value: '"0xFFFF0000"', comment: 'Radio standard comms subtitle color',            line_index: 205 },
    { key: 'g_sRadioTowerCol',              value: '"0xFF00FF00"', comment: 'Radio tower comms subtitle color',               line_index: 206 },
    { key: 'g_nAnisotropicValue',           value: '0',            comment: 'Max anisotropic filter value (0=max, 2/4/8/16)', line_index: 154 },
    { key: 'g_bEnableNewTerrain',           value: '1',            comment: 'Enable new terrain rendering system',            line_index: 215 },
    { key: 'g_fNewTerrainProceduralDistance', value: '12.0',       comment: 'Distance in km of procedural texturing',         line_index: 218 },
    { key: 'g_bExternalTrackIR',            value: '0',            comment: 'Enable external TrackIR head tracking',          line_index: 52  },
    { key: 'g_bLogInputFunctions',          value: '1',            comment: 'Logs key presses to .xlog file',                 line_index: 226 },
    { key: 'g_bActivateDebugStuff',         value: '0',            comment: 'Master debug setting (host controlled in MP)',   line_index: 227 },
    { key: 'g_nCampPeriodicSaveMinutes',    value: '20',           comment: 'Campaign autosave interval in minutes (0=off)',  line_index: 142 },
  ];
  loadConfig(
    'C:\\Falcon BMS 4.38\\User\\Config\\falcon bms.cfg (DEMO)',
    { entries: demoEntries, raw_lines: [] }
  );
  showToast('Running in preview mode — Tauri not detected', '');
}
