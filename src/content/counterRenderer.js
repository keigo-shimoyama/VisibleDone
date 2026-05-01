window.VD = window.VD || {};

window.VD.counterRenderer = {
  _el: null,

  async render(anchor, settings) {
    if (!settings.showCounter) { this.teardown(); return; }

    const count = await VD.storage.getTodayCount();
    const label = this._buildLabel(count, settings);

    const el = this._getOrCreate(anchor);
    el.textContent = label;
    el.setAttribute('aria-label', `${count} tasks ${settings.counterLabel.replace(/_/g, ' ')}`);
  },

  _buildLabel(count, settings) {
    const suffix = {
      stacked_today:   'Stacked Today',
      done_today:      'Done Today',
      completed_today: 'Completed Today',
    }[settings.counterLabel] || 'Stacked Today';

    return settings.dailyTarget
      ? `${count} / ${settings.dailyTarget} ${suffix}`
      : `${count} ${suffix}`;
  },

  _getOrCreate(anchor) {
    if (this._el && document.contains(this._el)) return this._el;

    const el = document.createElement('div');
    el.className = 'vd-counter';
    el.setAttribute(VD.CONSTANTS.ATTR, 'counter');
    el.setAttribute('role', 'status');

    // Insert before the task list; fall back to fixed overlay
    if (anchor) {
      anchor.insertAdjacentElement('beforebegin', el);
    } else {
      Object.assign(el.style, {
        position: 'fixed', top: '16px', right: '16px', zIndex: '2147483647',
      });
      document.body.appendChild(el);
    }

    this._el = el;
    return el;
  },

  teardown() {
    if (this._el) { this._el.remove(); this._el = null; }
  },
};
