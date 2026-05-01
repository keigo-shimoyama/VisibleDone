window.VD = window.VD || {};

window.VD.taskDom = {

  // Find the [role="list"] that contains Google Tasks checkboxes.
  // Returns null if Google Tasks is not present on this page/frame.
  findRoot() {
    // Try known stable selectors first
    for (const sel of VD.CONSTANTS.ROOT_SELECTORS) {
      try {
        const el = document.querySelector(sel);
        if (el && el.querySelector('[role="checkbox"], input[type="checkbox"]')) return el;
      } catch (_) { /* ignore unsupported selectors */ }
    }

    // Generic fallback: any [role="list"] that contains checkboxes
    for (const list of document.querySelectorAll('[role="list"]')) {
      if (list.hasAttribute(VD.CONSTANTS.ATTR)) continue;
      if (list.querySelector('[role="checkbox"], input[type="checkbox"]')) return list;
    }

    return null;
  },

  // Return top-level task rows (excludes subtask rows and extension-owned nodes).
  findTaskRows(root) {
    if (!root) return [];
    const result = [];
    root.querySelectorAll('[role="listitem"]').forEach(item => {
      if (item.getAttribute(VD.CONSTANTS.ATTR) === 'mirror') return;
      // Skip if this listitem is nested inside another listitem (subtask)
      if (item.parentElement?.closest('[role="listitem"]')) return;
      if (!item.querySelector('[role="checkbox"], input[type="checkbox"]')) return;
      result.push(item);
    });
    return result;
  },

  // Determine whether a task row is in completed state.
  isCompleted(row) {
    const cb = row.querySelector('[role="checkbox"], [aria-checked], input[type="checkbox"]');
    if (!cb) return false;
    const aria = cb.getAttribute('aria-checked');
    if (aria === 'true') return true;
    if (aria === 'false') return false;
    if (cb instanceof HTMLInputElement) return cb.checked;
    // Last resort: strikethrough on title text
    const title = this._findTitleEl(row);
    if (title && window.getComputedStyle(title).textDecoration.includes('line-through')) return true;
    return false;
  },

  // Return the element most likely to contain the task title text.
  _findTitleEl(row) {
    return (
      row.querySelector('[data-field-name="title"]') ||
      row.querySelector('[contenteditable]') ||
      row.querySelector('span:not([aria-hidden="true"])') ||
      null
    );
  },

  // Return the task title as a plain string.
  getTitle(row) {
    const el = this._findTitleEl(row);
    if (el) return (el.textContent || '').trim();
    return row.textContent.trim().slice(0, 120);
  },

  // Stable dedup key: slug + local date.
  makeTaskKey(title) {
    const date = VD.time.getLocalDateString();
    const slug = title
      .toLowerCase()
      .replace(/\[done: \d{2}:\d{2}\]/g, '')  // strip existing stamps
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 60);
    return `${slug}_${date}`;
  },

  // Apply vd-done-task class; idempotent.
  markDone(row) {
    if (row.classList.contains('vd-done-task')) return;
    row.classList.add('vd-done-task');
    row.setAttribute(VD.CONSTANTS.ATTR, 'styled');
  },

  // Remove vd-done-task class and styling.
  unmarkDone(row) {
    if (!row.classList.contains('vd-done-task')) return;
    row.classList.remove('vd-done-task');
    if (row.getAttribute(VD.CONSTANTS.ATTR) === 'styled') {
      row.removeAttribute(VD.CONSTANTS.ATTR);
    }
  },

  // Append [Done: HH:mm] to the task title if not already present.
  // Mutates Google Tasks data — only called when settings.timestamping is true.
  applyTimestamp(row, format) {
    const el = this._findTitleEl(row);
    if (!el) return;
    const current = el.textContent.trim();
    if (/\[Done: \d{2}:\d{2}\]/.test(current)) return;
    const stamp = VD.time.formatTimestamp(format);
    if (el.isContentEditable) {
      el.textContent = `${current} ${stamp}`;
      el.dispatchEvent(new Event('input',  { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },
};
