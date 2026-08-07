# Archiv

Alles hier gehört nicht mehr zur ausgelieferten Seite. Nichts davon wird von
`index.html`, `projekte.html` oder `impressum.html` geladen, geprüft über alle
`href`, `src` und `url()` in den drei Seiten und den Dateien, die sie einbinden.

Der Unterstrich im Ordnernamen ist Absicht: GitHub Pages lässt Jekyll über das
Repository laufen, und Jekyll überspringt Verzeichnisse, die mit `_` beginnen.
Die Dateien bleiben also im Repository, wandern aber nicht mehr auf den Server.
Sollte hier später einmal ein `.nojekyll` liegen, gilt das nicht mehr.

## Inhalt

| Was | Warum weg |
|---|---|
| `index-backup.html`, `css/style.css`, `js/app.js` | die Startseite vor dem Deck-Umbau |
| `index_dos.html`, `css/tuicss.min.css`, `js/tuicss.min.js`, `css/images/*`, `fonts/Perfect DOS VGA*` | die DOS-Spielerei samt TuiCSS und Pixelschrift |
| `js/theme.js` | der Farbgenerator. Das Ergebnis steht heute fest in `css/deck.css`, die Herleitung ist hier nachlesbar |
| `images/icons8_*.svg`, `images/Slice*.svg`, `images/ArtBoard1_*.png`, `images/shape-*.svg`, `images/items.svg`, `images/arrow-down.svg`, `images/profile2x.png` | Bildmaterial der alten Startseite |
| `images/*-1996.gif` | Netscape, Flash und Frontpage, Deko der DOS-Seite |
| `fonts/MavenProLight-*.otf` | alte Schnitte der Maven Pro. Die Galerie lädt die woff2-Fassung aus `fonts/` |

`index-backup.html` funktioniert weiterhin, wenn man sie hier öffnet: CSS, JS
und Bilder liegen relativ zu ihr an derselben Stelle wie vorher.
`index_dos.html` verlinkt ihre Dateien absolut (`/css/…`) und findet sie damit
nicht mehr. Wer sie ansehen will, ändert die zwei Pfade auf `css/` und `js/`.

## Was bewusst geblieben ist

`projekte.html` mit `css/projekte.css`, `data/references.json`,
`images/referenzen/`, den Maven-Pro-woff2-Dateien und der Tailwind-Kette
(`tailwind.config.js`, `css/tailwind.src.css`, `scripts/build-css.sh`).
Dazu `impressum.html`, `images/logo1.svg` (steht im JSON-LD der Startseite),
`google5fc9acafdfb546d0.html` (Search Console) und `CNAME`.
