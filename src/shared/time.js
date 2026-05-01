window.VD = window.VD || {};

window.VD.time = {
  // Replace HH and mm in a format string with local 24h time
  formatTimestamp(format) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return format.replace('HH', hh).replace('mm', mm);
  },

  // YYYY-MM-DD in local time
  getLocalDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // ISO 8601 with local timezone offset (e.g. 2026-05-01T14:30:00+09:00)
  localISOString() {
    const now = new Date();
    const off = -now.getTimezoneOffset();
    const sign = off >= 0 ? '+' : '-';
    const abs = Math.abs(off);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19);
    return `${local}${sign}${hh}:${mm}`;
  },
};
