window.VD = window.VD || {};

(function () {
  let _root = null;
  let _started = false;
  // taskKeys recorded today — pre-populated from storage on init to survive page refresh
  let _seenKeys = new Set();

  async function init() {
    if (_started) return;
    _started = true;

    await VD.settings.load();
    // Pre-populate seen keys so refreshing the page doesn't re-count already-stored events
    _seenKeys = await VD.storage.getTodayKeys();

    VD.settings.startListening();
    VD.settings.onChange(onSettingsChanged);

    waitForRoot();
  }

  // Poll document.body until Google Tasks mounts, then narrow to that root.
  function waitForRoot() {
    const found = VD.taskDom.findRoot();
    if (found) { attach(found); return; }

    console.debug('[VisibleDone] Waiting for Google Tasks root…');

    const sentinel = new MutationObserver(() => {
      const r = VD.taskDom.findRoot();
      if (!r) return;
      sentinel.disconnect();
      attach(r);
    });
    sentinel.observe(document.body, { childList: true, subtree: true });

    // Give up after 30 s — the page probably doesn't have Google Tasks
    setTimeout(() => sentinel.disconnect(), 30_000);
  }

  function attach(root) {
    _root = root;
    console.debug('[VisibleDone] Google Tasks root found, attaching observer.');
    render();
    VD.observer.start(root, render);
  }

  async function render() {
    const settings = VD.settings.get();
    if (!settings.enabled) { fullTeardown(); return; }

    const rows = VD.taskDom.findTaskRows(_root);

    for (const row of rows) {
      if (VD.taskDom.isCompleted(row)) {
        VD.taskDom.markDone(row);
        await recordIfNew(row, settings);
      } else {
        VD.taskDom.unmarkDone(row);
      }
    }

    VD.stackRenderer.render(
      rows.filter(r => r.classList.contains('vd-done-task')),
      settings
    );
    await VD.counterRenderer.render(_root, settings);
  }

  async function recordIfNew(row, settings) {
    const title = VD.taskDom.getTitle(row);
    const key   = VD.taskDom.makeTaskKey(title);
    if (_seenKeys.has(key)) return;

    _seenKeys.add(key);
    await VD.storage.addCompletionEvent({
      id:          `${key}_${Date.now()}`,
      taskKey:     key,
      title,
      completedAt: VD.time.localISOString(),
      sourceUrl:   location.href,
    });

    if (settings.timestamping) {
      VD.taskDom.applyTimestamp(row, settings.timestampFormat);
    }
  }

  function fullTeardown() {
    VD.observer.stop();
    VD.stackRenderer.teardown();
    VD.counterRenderer.teardown();
    _root    = null;
    _started = false;
    _seenKeys.clear();
  }

  function onSettingsChanged(newSettings) {
    if (!newSettings.enabled) {
      fullTeardown();
    } else if (!_started) {
      init();
    } else {
      render();
    }
  }

  // Re-attach after SPA navigation
  window.addEventListener('popstate', () => {
    VD.observer.stop();
    _root = null;
    waitForRoot();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
