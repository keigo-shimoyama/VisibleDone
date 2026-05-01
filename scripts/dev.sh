#!/usr/bin/env bash
set -euo pipefail

EXTENSION_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# Dedicated Chrome profile so the extension loads without touching your main profile
DEV_PROFILE="$EXTENSION_DIR/.chrome-dev-profile"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$DEV_PROFILE"

echo "Starting Chrome with Visible Done loaded..."
echo "  Extension : $EXTENSION_DIR"
echo "  Profile   : $DEV_PROFILE"
echo ""
echo "First run: sign in to Google to access Tasks."
echo "Subsequent runs: the profile is reused (no sign-in needed)."

# open -na forces a completely separate Chrome process, preventing
# interference with an already-running Chrome instance.
open -na "Google Chrome" --args \
  --user-data-dir="$DEV_PROFILE" \
  --load-extension="$EXTENSION_DIR" \
  --no-first-run \
  --no-default-browser-check \
  "https://tasks.google.com"
