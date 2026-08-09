#!/usr/bin/env bash
#
# Rendert images/og-image.png (1200 x 630) aus scripts/og-image.html.
# Das Bild hängt an og:image, twitter:image und am JSON-LD der Startseite.
#
# Aufruf (aus dem Projekt-Root):   bash scripts/build-og-image.sh
#
# Voraussetzung: Google Chrome.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Chrome nicht gefunden: $CHROME" >&2; exit 1; }

OUT="images/og-image.png"

"$CHROME" --headless --disable-gpu --hide-scrollbars \
	--force-device-scale-factor=1 \
	--window-size=1200,630 \
	--default-background-color=ffffffff \
	--virtual-time-budget=3000 \
	--screenshot="$OUT" \
	"file://$PWD/scripts/og-image.html" >/dev/null 2>&1

echo "Fertig: $OUT"
