// ── NAV ───────────────────────────────────────────────────────────────────────

function renderNav() {
  const nav      = document.getElementById('nav-list');
  nav.innerHTML  = '';
  const sections = getAllSections(state.entries);

  sections.forEach(sec => {
    const count = sec === 'All'
      ? state.entries.length
      : state.entries.filter(e => getSection(e.key) === sec).length;

    const color = SECTION_COLORS[sec] || '#888';
    const li    = document.createElement('li');
    li.className = 'nav-item' + (sec === state.activeSection ? ' active' : '');
    li.onclick   = () => showSection(sec);
    li.innerHTML = `
      <span class="nav-dot" style="background:${sec === 'All' ? 'var(--text3)' : color}"></span>
      <span>${sec}</span>
      <span class="nav-badge">${count}</span>
    `;
    nav.appendChild(li);
  });
}

// ── SECTION ───────────────────────────────────────────────────────────────────

function showSection(sec) {
  state.activeSection = sec;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.querySelector('span:nth-child(2)')?.textContent === sec);
  });
  document.getElementById('section-title').textContent    = sec === 'All' ? 'All Settings' : sec;
  document.getElementById('section-subtitle').textContent = sec === 'All' ? 'Every configurable option' : '';
  renderSettings();
}

function filterSettings(query) {
  state.searchQuery = query.toLowerCase();
  renderSettings();
}

// ── SETTINGS GRID ─────────────────────────────────────────────────────────────

function renderSettings() {
  const grid    = document.getElementById('settings-grid');
  grid.innerHTML = '';

  const visible = state.entries.filter(e => {
    const sec         = getSection(e.key);
    const matchSection = state.activeSection === 'All' || sec === state.activeSection;
    const matchSearch  = !state.searchQuery
      || e.key.toLowerCase().includes(state.searchQuery)
      || e.comment.toLowerCase().includes(state.searchQuery);
    return matchSection && matchSearch;
  });

  if (state.activeSection === 'All') {
    // Group by section and render dividers
    const bySection = {};
    visible.forEach(e => {
      const s = getSection(e.key);
      if (!bySection[s]) bySection[s] = [];
      bySection[s].push(e);
    });
    Object.entries(bySection).forEach(([sec, entries]) => {
      const divider       = document.createElement('div');
      divider.className   = 'section-divider';
      divider.style.color = SECTION_COLORS[sec] || 'var(--text3)';
      divider.textContent = sec;
      grid.appendChild(divider);
      entries.forEach(e => grid.appendChild(buildCard(e)));
    });
  } else {
    visible.forEach(e => grid.appendChild(buildCard(e)));
  }

  updateModifiedCount();
}

// ── CARD BUILDER ──────────────────────────────────────────────────────────────

function buildCard(entry) {
  const schema     = SCHEMA[entry.key] || { type: 'text' };
  const val        = state.currentValues[entry.key] ?? entry.value;
  const orig       = state.originalValues[entry.key];
  const isModified = val !== orig;
  const isNew      = state.newKeys && state.newKeys.has(entry.key);

  const card       = document.createElement('div');
  card.className   = 'setting-card'
    + (isModified ? ' modified'   : '')
    + (isNew      ? ' new-entry'  : '');
  card.id          = 'card-' + entry.key;

  const desc     = entry.comment || entry.key;
  const newBadge = isNew ? '<span class="new-badge">new</span>' : '';

  card.innerHTML = `
    <div class="setting-row">
      <div>
        <div class="setting-label">${entry.key}${newBadge}</div>
        <div class="setting-desc">${desc}</div>
      </div>
      <div class="setting-control" id="ctrl-${entry.key}">
        ${buildControl(entry.key, schema, val, orig)}
      </div>
      <button class="card-delete-btn" onclick="promptDeleteSetting('${entry.key}')" title="Remove setting">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5ZM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.506a.58.58 0 0 0-.01 1.16l.337 9.083A1.5 1.5 0 0 0 4.33 14h7.34a1.5 1.5 0 0 0 1.498-1.257l.337-9.083a.58.58 0 0 0-.01-1.16H11Z"/>
        </svg>
      </button>
    </div>
  `;
  return card;
}
