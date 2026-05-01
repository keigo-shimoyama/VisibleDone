const SETTINGS_KEY = 'vd_settings';

const DEFAULT_SETTINGS = {
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

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== 'install') return;
  const existing = await chrome.storage.local.get(SETTINGS_KEY);
  if (!existing[SETTINGS_KEY]) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  }
});
