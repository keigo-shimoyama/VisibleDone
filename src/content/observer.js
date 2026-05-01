window.VD = window.VD || {};

window.VD.observer = {
  _mo: null,
  _timer: null,

  start(root, callback) {
    this.stop();
    this._mo = new MutationObserver(mutations => {
      // Ignore mutations caused by extension-owned nodes to prevent re-render loops
      const hasExternal = mutations.some(m => {
        let el = m.target;
        while (el && el !== document.body) {
          if (el.hasAttribute && el.hasAttribute(VD.CONSTANTS.ATTR)) return false;
          el = el.parentElement;
        }
        return true;
      });
      if (!hasExternal) return;

      clearTimeout(this._timer);
      this._timer = setTimeout(callback, VD.CONSTANTS.DEBOUNCE_MS);
    });

    this._mo.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-checked', 'class'],
    });
  },

  stop() {
    clearTimeout(this._timer);
    if (this._mo) { this._mo.disconnect(); this._mo = null; }
  },
};
