window.VD = window.VD || {};

window.VD.settings = {
  _current: null,
  _listeners: [],

  async load() {
    const stored = await VD.storage.getSettings();
    this._current = { ...VD.CONSTANTS.DEFAULT_SETTINGS, ...stored };
    return this._current;
  },

  get() {
    return this._current || { ...VD.CONSTANTS.DEFAULT_SETTINGS };
  },

  onChange(fn) {
    this._listeners.push(fn);
  },

  startListening() {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      if (!changes[VD.CONSTANTS.STORAGE_KEYS.SETTINGS]) return;
      this._current = {
        ...VD.CONSTANTS.DEFAULT_SETTINGS,
        ...changes[VD.CONSTANTS.STORAGE_KEYS.SETTINGS].newValue,
      };
      this._listeners.forEach(fn => fn(this._current));
    });
  },
};
