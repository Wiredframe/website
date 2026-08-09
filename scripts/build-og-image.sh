#!/usr/bin/env bash
#
# Rendert die beiden Bilder, die aus einer HTML-Vorlage entstehen:
#
#   images/og-image.png         1200 x 630, aus scripts/og-image.html
#                               hängt an og:image, twitter:image und am JSON-LD
#   images/apple-touch-icon.png  180 x 180, aus scripts/touch-icon.html
#                               hängt an <link rel="apple-touch-icon">
#
# Aufruf (aus dem Projekt-Root):   bash scripts/build-og-image.sh
#
# Voraussetzung: Google Chrome.
set -euo pipefail
cd "$(dirname "$0")/.."

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Chrome nicht gefunden: $CHROME" >&2; exit 1; }

# Vorlage : Ziel : Breite : Höhe
BILDER=(
	"scripts/og-image.html:images/og-image.png:1200:630"
	"scripts/touch-icon.html:images/apple-touch-icon.png:180:180"
)

for eintrag in "${BILDER[@]}"; do
	IFS=':' read -r vorlage ziel breite hoehe <<<"$eintrag"

	# Der undurchsichtige Standardgrund ist Absicht: ein PNG mit Alphakanal
	# stellt iOS beim Touch-Icon auf Schwarz.
	"$CHROME" --headless --disable-gpu --hide-scrollbars \
		--force-device-scale-factor=1 \
		--window-size="$breite,$hoehe" \
		--default-background-color=ffffffff \
		--virtual-time-budget=3000 \
		--screenshot="$ziel" \
		"file://$PWD/$vorlage" >/dev/null 2>&1

	echo "Fertig: $ziel ($breite x $hoehe)"
done
