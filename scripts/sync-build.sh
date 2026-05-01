#!/usr/bin/env bash
set -euo pipefail

EXTENSION_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── Required files ────────────────────────────────────────────────────────────

REQUIRED=(
  manifest.json
  src/shared/constants.js
  src/shared/time.js
  src/shared/storage.js
  src/shared/settings.js
  src/content/content.js
  src/content/observer.js
  src/content/taskDom.js
  src/content/stackRenderer.js
  src/content/counterRenderer.js
  src/content/styles.css
  src/background/serviceWorker.js
  src/options/options.html
  src/options/options.css
  src/options/options.js
  assets/icon16.png
  assets/icon32.png
  assets/icon48.png
  assets/icon128.png
)

echo "Checking required files in: $EXTENSION_DIR"
MISSING=0
for f in "${REQUIRED[@]}"; do
  if [[ ! -f "$EXTENSION_DIR/$f" ]]; then
    echo "  MISSING: $f"
    MISSING=$((MISSING + 1))
  fi
done

if [[ $MISSING -gt 0 ]]; then
  echo ""
  echo "ERROR: $MISSING file(s) missing. Run scripts/gen-icons.py first if icons are absent."
  exit 1
fi

echo ""
echo "All files present."
echo ""
echo "────────────────────────────────────────────────────────"
echo " Load unpacked extension in Chrome:"
echo ""
echo "  1. Open chrome://extensions"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked'"
echo "  4. Select: $EXTENSION_DIR"
echo "────────────────────────────────────────────────────────"
