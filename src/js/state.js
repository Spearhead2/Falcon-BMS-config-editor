// TAURI API 
let tauriInvoke = null;
let tauriDialog = null;

(async () => {
  try {
    const tauri  = await import('https://unpkg.com/@tauri-apps/api@1/tauri.js');
    const dialog = await import('https://unpkg.com/@tauri-apps/api@1/dialog.js');
    tauriInvoke = tauri.invoke;
    tauriDialog = dialog;
    console.log('Tauri API loaded');

    const defaultPath = await tauriInvoke('get_default_config_path');
    if (defaultPath) {
      setStatus('Found BMS config at default path', 'ok');
      const config = await tauriInvoke('load_config', { path: defaultPath });
      loadConfig(defaultPath, config);
    }
  } catch {
    console.log('Running in browser preview mode');
    loadDemoData();
  }
})();

// APP STATE 
let state = {
  filePath:       null,
  rawLines:       [],
  entries:        [],   // { key, value, comment, line_index }[]
  originalValues: {},   // key -> original string value
  currentValues:  {},   // key -> current string value
  newKeys:        new Set(),
  activeSection:  'All',
  searchQuery:    '',
};
