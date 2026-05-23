// ── CONTROL BUILDER ───────────────────────────────────────────────────────────
// Returns an HTML string for the appropriate input control given a schema entry.

function buildControl(key, schema, val, orig) {
  switch (schema.type) {

    case 'toggle': {
      const checked = valToBool(val) ? 'checked' : '';
      return `
        <label class="toggle">
          <input type="checkbox" ${checked} onchange="updateValue('${key}', this.checked ? '1' : '0')">
          <span class="toggle-track"></span>
        </label>
        <span class="value-badge ${val !== orig ? 'changed' : ''}" id="badge-${key}">${val === '1' ? 'on' : 'off'}</span>
      `;
    }

    case 'range': {
      const numVal  = parseFloat(val) || 0;
      const decimals = schema.step < 1 ? 2 : 0;
      return `
        <input type="range" class="ctrl-range"
          min="${schema.min}" max="${schema.max}" step="${schema.step}" value="${numVal}"
          oninput="updateValue('${key}', this.value); document.getElementById('num-${key}').value=parseFloat(this.value).toFixed(${decimals})">
        <input type="number" class="ctrl-number" id="num-${key}"
          value="${parseFloat(val).toFixed(decimals)}"
          min="${schema.min}" max="${schema.max}" step="${schema.step}"
          oninput="updateValue('${key}', this.value); this.previousElementSibling.value=this.value">
      `;
    }

    case 'number': {
      return `
        <input type="text" class="ctrl-text" value="${val}"
          onchange="updateValue('${key}', this.value)" style="width:160px; font-family:var(--font)">
      `;
    }

    case 'text': {
      const display = val.replace(/^"|"$/g, '');
      return `
        <input type="text" class="ctrl-text" value="${display}"
          onchange="updateValue('${key}', '&quot;'+this.value+'&quot;')" style="width:160px">
      `;
    }

    case 'select': {
      const opts = schema.options.map(([v, l]) =>
        `<option value="${v}" ${v === val ? 'selected' : ''}>${l}</option>`
      ).join('');
      return `
        <select class="ctrl-text" onchange="updateValue('${key}', this.value)" style="width:160px;cursor:pointer">
          ${opts}
        </select>
      `;
    }

    case 'color': {
      const hexColor = bmsColorToHex(val);
      const safeVal  = val.replace(/'/g, "\\'");
      return `
        <div class="ctrl-color-row">
          <div class="color-preview" id="preview-${key}" style="background:${hexColor}"></div>
          <input type="color" value="${hexColor}"
            style="opacity:0;position:absolute;pointer-events:auto;width:24px;height:24px;cursor:pointer;border:0;"
            oninput="
              document.getElementById('preview-${key}').style.background=this.value;
              document.getElementById('colortext-${key}').value=this.value;
            "
            onchange="updateValue('${key}', hexToBmsColor(this.value, '${safeVal}'))">
          <input type="text" class="ctrl-text" id="colortext-${key}" value="${hexColor}"
            style="width:90px; font-family:var(--font); font-size:11px"
            onchange="
              document.getElementById('preview-${key}').style.background=this.value;
              updateValue('${key}', hexToBmsColor(this.value, '${safeVal}'))">
        </div>
      `;
    }

    default:
      return `<input class="ctrl-text" value="${val}" onchange="updateValue('${key}', this.value)" style="width:160px">`;
  }
}

// ── VALUE UPDATE ──────────────────────────────────────────────────────────────

function updateValue(key, newVal) {
  state.currentValues[key] = String(newVal);
  const orig       = state.originalValues[key];
  const isModified = String(newVal) !== orig;

  const card = document.getElementById('card-' + key);
  if (card) card.classList.toggle('modified', isModified);

  const badge = document.getElementById('badge-' + key);
  if (badge) {
    if (SCHEMA[key]?.type === 'toggle') badge.textContent = newVal === '1' ? 'on' : 'off';
    badge.classList.toggle('changed', isModified);
  }

  updateModifiedCount();
}
