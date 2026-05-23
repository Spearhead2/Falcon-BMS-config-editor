// ADD SETTING MODAL 

let addCurrentType = 'bool';
let addBoolValue   = '1';

function selectType(type) {
  addCurrentType = type;
  document.querySelectorAll('.type-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.type === type);
  });
  renderValArea();
  updateAddPreview();
}

function renderValArea() {
  const area = document.getElementById('val-area');
  switch (addCurrentType) {
    case 'bool':
      area.innerHTML = `
        <div class="val-bool-row">
          <div class="bool-opt ${addBoolValue === '1' ? 'selected' : ''}" onclick="setBoolVal('1')">1 - true / on</div>
          <div class="bool-opt ${addBoolValue === '0' ? 'selected' : ''}" onclick="setBoolVal('0')">0 - false / off</div>
        </div>`;
      break;
    case 'int':
      area.innerHTML = `<input class="modal-input" id="add-value" type="number" step="1" placeholder="0"
        oninput="updateAddPreview()" onkeydown="handleAddKeydown(event)" style="font-family:var(--font)" />`;
      break;
    case 'float':
      area.innerHTML = `<input class="modal-input" id="add-value" type="number" step="any" placeholder="1.0"
        oninput="updateAddPreview()" onkeydown="handleAddKeydown(event)" style="font-family:var(--font)" />`;
      break;
    case 'string':
      area.innerHTML = `
        <input class="modal-input" id="add-value" type="text" placeholder="my value"
          oninput="updateAddPreview()" onkeydown="handleAddKeydown(event)" />
        <div class="modal-hint">Will be wrapped in quotes: "your value"</div>`;
      break;
  }
}

function setBoolVal(v) {
  addBoolValue = v;
  document.querySelectorAll('.bool-opt').forEach(el => {
    el.classList.toggle('selected', el.textContent.startsWith(v));
  });
  updateAddPreview();
}

function getAddValue() {
  if (addCurrentType === 'bool') return addBoolValue;
  const el = document.getElementById('add-value');
  if (!el) return '';
  const v = el.value.trim();
  if (addCurrentType === 'string') return v ? `"${v}"` : '';
  return v;
}

function openAddModal() {
  // Populate section dropdown
  const sel = document.getElementById('add-section');
  sel.innerHTML = '<option value="__end__">End of file</option>';
  getAllSections(state.entries).filter(s => s !== 'All').forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    sel.appendChild(opt);
  });
  if (state.activeSection !== 'All') sel.value = state.activeSection;

  // Reset fields
  document.getElementById('add-key').value     = '';
  document.getElementById('add-comment').value = '';
  document.getElementById('add-key-error').style.display = 'none';
  addCurrentType = 'bool';
  addBoolValue   = '1';
  document.querySelectorAll('.type-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.type === 'bool');
  });
  renderValArea();
  updateAddPreview();

  document.getElementById('add-modal').classList.add('open');
  setTimeout(() => document.getElementById('add-key').focus(), 120);
}

function closeAddModal() {
  document.getElementById('add-modal').classList.remove('open');
}

function handleBackdropClick(e) {
  if (e.target === document.getElementById('add-modal')) closeAddModal();
}

function handleAddKeydown(e) {
  if (e.key === 'Enter')  commitAddSetting();
  if (e.key === 'Escape') closeAddModal();
}

function updateAddPreview() {
  const key     = document.getElementById('add-key').value.trim();
  const val     = getAddValue();
  const comment = document.getElementById('add-comment').value.trim();

  const keyPart     = key || '…';
  const valPart     = val || '…';
  const commentPart = comment ? `  <span style="color:var(--text3)">// ${comment}</span>` : '';
  document.getElementById('add-preview').innerHTML = `<span>set</span> ${keyPart} ${valPart}${commentPart}`;

  const isDupe = key && state.entries.some(e => e.key === key);
  document.getElementById('add-key-error').style.display = isDupe ? 'block' : 'none';
}

function commitAddSetting() {
  const key     = document.getElementById('add-key').value.trim();
  const val     = getAddValue();
  const comment = document.getElementById('add-comment').value.trim();
  const section = document.getElementById('add-section').value;

  if (!key) { document.getElementById('add-key').focus(); return; }
  if (!val && addCurrentType !== 'bool') { document.getElementById('add-value')?.focus(); return; }
  if (state.entries.some(e => e.key === key)) {
    document.getElementById('add-key-error').style.display = 'block';
    document.getElementById('add-key').focus();
    return;
  }

  // Build raw line
  const commentSuffix = comment ? `  // ${comment}` : '';
  const newLine       = `set ${key} ${val}${commentSuffix}`;

  // Find insertion point
  let insertAt;
  if (section === '__end__') {
    insertAt = state.rawLines.length;
    while (insertAt > 0 && state.rawLines[insertAt - 1].trim() === '') insertAt--;
  } else {
    const sectionEntries = state.entries.filter(e => getSection(e.key) === section);
    insertAt = sectionEntries.length > 0
      ? sectionEntries[sectionEntries.length - 1].line_index + 1
      : state.rawLines.length;
  }

  // Mutate state
  state.rawLines.splice(insertAt, 0, newLine);
  state.entries.forEach(e => { if (e.line_index >= insertAt) e.line_index++; });
  state.entries.push({ key, value: val, comment, line_index: insertAt });
  state.originalValues[key] = val;
  state.currentValues[key]  = val;
  state.newKeys.add(key);

  // Register schema type so card renders correctly
  if (!SCHEMA[key]) {
    const schemaType = addCurrentType === 'bool'   ? 'toggle'
                     : addCurrentType === 'float'  ? 'number'
                     : addCurrentType === 'string' ? 'text'
                     : 'number';
    SCHEMA[key] = { type: schemaType, section: section === '__end__' ? 'Other' : section };
  }

  closeAddModal();
  renderNav();

  if (section !== '__end__' && state.activeSection !== 'All') {
    showSection(section);
  } else {
    renderSettings();
  }

  setTimeout(() => {
    const card = document.getElementById('card-' + key);
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 80);

  showToast(`Added: ${key}`, 'success');
  setStatus('New setting added - remember to save', 'warn');
}
