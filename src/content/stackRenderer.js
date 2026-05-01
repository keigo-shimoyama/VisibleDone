window.VD = window.VD || {};

window.VD.stackRenderer = {

  // Apply or refresh the visual stack treatment.
  // For v1 we style completed tasks in-place rather than mirroring.
  render(completedRows, settings) {
    // Sync CSS custom properties from settings
    document.documentElement.style.setProperty('--vd-color',   settings.achievementColor);
    document.documentElement.style.setProperty('--vd-opacity', settings.doneOpacity);

    completedRows.forEach(row => VD.taskDom.markDone(row));
  },

  // Remove all extension-applied styling from Google-owned nodes.
  teardown() {
    document.querySelectorAll('.vd-done-task').forEach(row => {
      row.classList.remove('vd-done-task');
    });
    document.querySelectorAll(`[${VD.CONSTANTS.ATTR}="styled"]`).forEach(el => {
      el.removeAttribute(VD.CONSTANTS.ATTR);
    });
    // Reset CSS custom properties
    document.documentElement.style.removeProperty('--vd-color');
    document.documentElement.style.removeProperty('--vd-opacity');
  },
};
