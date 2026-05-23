// ── COLOR HELPERS ─────────────────────────────────────────────────────────────

// Converts BMS "0xBBGGRR" or "0xAABBGGRR" to a CSS "#rrggbb" hex string
function bmsColorToHex(val) {
  const stripped = val.replace(/"/g, '').trim();
  const hex = stripped.replace('0x', '').replace('0X', '');
  if (hex.length === 6) {
    const bb = hex.substr(0, 2), gg = hex.substr(2, 2), rr = hex.substr(4, 2);
    return '#' + rr + gg + bb;
  } else if (hex.length === 8) {
    const bb = hex.substr(2, 2), gg = hex.substr(4, 2), rr = hex.substr(6, 2);
    return '#' + rr + gg + bb;
  }
  return '#ffffff';
}

// Converts a CSS "#rrggbb" hex string back to BMS format, preserving alpha/quoting
function hexToBmsColor(hex, originalVal) {
  const stripped  = originalVal.replace(/"/g, '').trim();
  const isQuoted  = originalVal.includes('"');
  const origHex   = stripped.replace('0x', '').replace('0X', '');
  const h  = hex.replace('#', '');
  const rr = h.substr(0, 2), gg = h.substr(2, 2), bb = h.substr(4, 2);
  let result;
  if (origHex.length === 8) {
    const alpha = origHex.substr(0, 2);
    result = '0x' + alpha + bb + gg + rr;
  } else {
    result = '0x' + bb + gg + rr;
  }
  return isQuoted ? `"${result}"` : result;
}

// ── SECTION HELPERS ───────────────────────────────────────────────────────────

function getSection(key) {
  return SCHEMA[key]?.section || 'Other';
}

function getAllSections(entries) {
  const sections = new Set(['All']);
  entries.forEach(e => sections.add(getSection(e.key)));
  return Array.from(sections);
}

// ── MISC ──────────────────────────────────────────────────────────────────────

function valToBool(val) { return val === '1'; }
