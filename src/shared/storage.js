window.VD = window.VD || {};

window.VD.storage = {
  async getSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get(VD.CONSTANTS.STORAGE_KEYS.SETTINGS, result =>
        resolve(result[VD.CONSTANTS.STORAGE_KEYS.SETTINGS] || {})
      );
    });
  },

  async saveSettings(settings) {
    return new Promise(resolve =>
      chrome.storage.local.set({ [VD.CONSTANTS.STORAGE_KEYS.SETTINGS]: settings }, resolve)
    );
  },

  async getCompletionEvents() {
    return new Promise(resolve => {
      chrome.storage.local.get(VD.CONSTANTS.STORAGE_KEYS.EVENTS, result =>
        resolve(result[VD.CONSTANTS.STORAGE_KEYS.EVENTS] || [])
      );
    });
  },

  async saveCompletionEvents(events) {
    return new Promise(resolve =>
      chrome.storage.local.set({ [VD.CONSTANTS.STORAGE_KEYS.EVENTS]: events }, resolve)
    );
  },

  async addCompletionEvent(event) {
    let events = await this.getCompletionEvents();

    // Deduplicate: same taskKey on the same calendar day overwrites
    const datePrefix = event.completedAt.slice(0, 10);
    events = events.filter(e =>
      !(e.taskKey === event.taskKey && e.completedAt.startsWith(datePrefix))
    );
    events.push(event);

    // Prune events older than retention window
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - VD.CONSTANTS.RETENTION_DAYS);
    events = events.filter(e => new Date(e.completedAt) >= cutoff);

    await this.saveCompletionEvents(events);
  },

  async getTodayCount() {
    const events = await this.getCompletionEvents();
    const today = VD.time.getLocalDateString();
    return events.filter(e => e.completedAt.startsWith(today)).length;
  },

  // Return the set of taskKeys already recorded today (for deduplication on init)
  async getTodayKeys() {
    const events = await this.getCompletionEvents();
    const today = VD.time.getLocalDateString();
    return new Set(
      events.filter(e => e.completedAt.startsWith(today)).map(e => e.taskKey)
    );
  },
};
