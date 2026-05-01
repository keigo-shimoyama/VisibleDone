(function () {
  const SETTINGS_KEY = 'vd_settings';
  const DEFAULTS = {
    enabled: true,
    permanentListMode: true,
    displayMode: 'default',
    removeStrikethrough: true,
    doneOpacity: 0.88,
    achievementColor: '#10B981',
    showCounter: true,
    dailyTarget: null,
    counterLabel: 'stacked_today',
    timestamping: false,
    timestampFormat: '[Done: HH:mm]',
  };

  let _settings = { ...DEFAULTS };
  let _saveTimer = null;

  // ── Load & save ──────────────────────────────────────

  async function load() {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    _settings = { ...DEFAULTS, ...(result[SETTINGS_KEY] || {}) };
    applyToUI();
  }

  function scheduleSave() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(save, 400);
  }

  async function save() {
    await chrome.storage.local.set({ [SETTINGS_KEY]: _settings });
    showSaved();
  }

  function showSaved() {
    const banner = document.getElementById('saveBanner');
    banner.textContent = 'Saved';
    clearTimeout(banner._timer);
    banner._timer = setTimeout(() => { banner.textContent = ''; }, 1800);
  }

  // ── Apply current settings → UI ──────────────────────

  function applyToUI() {
    set('enabled',            _settings.enabled);
    set('permanentListMode',  _settings.permanentListMode);
    set('displayMode',        _settings.displayMode);
    set('removeStrikethrough',_settings.removeStrikethrough);
    set('doneOpacity',        _settings.doneOpacity);
    set('achievementColor',   _settings.achievementColor);
    set('showCounter',        _settings.showCounter);
    set('dailyTarget',        _settings.dailyTarget ?? '');
    set('counterLabel',       _settings.counterLabel);
    set('timestamping',       _settings.timestamping);

    document.getElementById('opacityValue').textContent =
      Math.round(_settings.doneOpacity * 100) + '%';

    syncColorSwatches(_settings.achievementColor);
    syncDependentSections();
  }

  function set(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') el.checked = Boolean(value);
    else el.value = value ?? '';
  }

  // ── Sync dependent sections ──────────────────────────

  function syncDependentSections() {
    const enabled = _settings.enabled;
    ['sectionDisplay', 'sectionAppearance', 'sectionCounter', 'sectionTimestamping'].forEach(id => {
      document.getElementById(id).classList.toggle('disabled', !enabled);
    });

    document.getElementById('counterOptions').style.display =
      _settings.showCounter ? '' : 'none';

    // timeline mode requires timestamping
    const optTimeline = document.getElementById('optTimeline');
    optTimeline.disabled = !_settings.timestamping;
    if (!_settings.timestamping && _settings.displayMode === 'timeline') {
      _settings.displayMode = 'default';
      document.getElementById('displayMode').value = 'default';
    }
  }

  // ── Color swatches ───────────────────────────────────

  function syncColorSwatches(color) {
    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color);
    });
  }

  // ── Event wiring ─────────────────────────────────────

  function onChange(id, handler) {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.type === 'checkbox' || el.type === 'range' ? 'input' : 'change';
    el.addEventListener(evt, handler);
  }

  function wire() {
    onChange('enabled', e => {
      _settings.enabled = e.target.checked;
      syncDependentSections();
      scheduleSave();
    });

    onChange('permanentListMode', e => {
      _settings.permanentListMode = e.target.checked;
      scheduleSave();
    });

    onChange('displayMode', e => {
      _settings.displayMode = e.target.value;
      scheduleSave();
    });

    onChange('removeStrikethrough', e => {
      _settings.removeStrikethrough = e.target.checked;
      scheduleSave();
    });

    onChange('doneOpacity', e => {
      _settings.doneOpacity = Number(e.target.value);
      document.getElementById('opacityValue').textContent =
        Math.round(_settings.doneOpacity * 100) + '%';
      scheduleSave();
    });

    onChange('achievementColor', e => {
      _settings.achievementColor = e.target.value;
      syncColorSwatches(e.target.value);
      scheduleSave();
    });

    document.querySelectorAll('.color-swatch').forEach(btn => {
      btn.addEventListener('click', () => {
        _settings.achievementColor = btn.dataset.color;
        document.getElementById('achievementColor').value = btn.dataset.color;
        syncColorSwatches(btn.dataset.color);
        scheduleSave();
      });
    });

    onChange('showCounter', e => {
      _settings.showCounter = e.target.checked;
      syncDependentSections();
      scheduleSave();
    });

    onChange('counterLabel', e => {
      _settings.counterLabel = e.target.value;
      scheduleSave();
    });

    onChange('dailyTarget', e => {
      const v = parseInt(e.target.value, 10);
      _settings.dailyTarget = isNaN(v) || v < 1 ? null : v;
      scheduleSave();
    });

    onChange('timestamping', e => {
      _settings.timestamping = e.target.checked;
      syncDependentSections();
      scheduleSave();
    });
  }

  // ── Boot ─────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', async () => {
    wire();
    await load();
  });
})();
