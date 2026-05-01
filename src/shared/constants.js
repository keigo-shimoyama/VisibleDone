window.VD = window.VD || {};

window.VD.CONSTANTS = {
  ATTR: 'data-visible-done',

  // Selectors tried in order to locate the Google Tasks list root
  ROOT_SELECTORS: [
    '[data-task-list-id]',
    '[jscontroller][data-view-type]',
  ],

  DEBOUNCE_MS: 150,
  RETENTION_DAYS: 90,

  DEFAULT_SETTINGS: {
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
  },

  COLOR_PRESETS: [
    { name: 'Emerald', value: '#10B981' },
    { name: 'Gold',    value: '#D97706' },
    { name: 'Sky',     value: '#0284C7' },
    { name: 'Slate',   value: '#64748B' },
  ],

  STORAGE_KEYS: {
    SETTINGS: 'vd_settings',
    EVENTS:   'vd_completion_events',
  },
};
