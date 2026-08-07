#!/usr/bin/env python3
"""
Baut aus der Projektliste eine anonyme Fassung für die Startseite.

    python3 werkzeuge/referenzen.py

Liest  data/references.json  und schreibt  data/referenzen.json.

Warum überhaupt ein Skript und nicht ein Aufruf im Browser: was der Browser
holt, kann der Besucher auch holen. Anonymisieren muss deshalb vorher
passieren, nicht beim Anzeigen. Aus der Quelle wandern nur drei Felder in
die Ausgabe, und aus denen wird ein Satz gebaut:

    Jahr     das Jahr
    Typ      Website, Shopware, App und so weiter
    Branche  Tourismus, Hotellerie, Messtechnik / Industrie ...

Nicht übernommen werden Projekttitel, Agentur, Beschreibung, URL und Bild.
Sie nennen Kunden.

Hinweis für später: die Quelldatei liegt selbst im ausgelieferten
Verzeichnis und ist damit öffentlich abrufbar. Diese Ausgabe hier ist für
sich genommen anonym, sie schützt aber nichts, solange das so bleibt.
"""

import json
import pathlib
import re
import sys

WURZEL = pathlib.Path(__file__).resolve().parent.parent
QUELLE = WURZEL / 'data' / 'references.json'
ZIEL = WURZEL / 'data' / 'referenzen.json'
ANZAHL = 10

# ----------------------------------------------------------------------
# Art der Arbeit
# ----------------------------------------------------------------------
# Die Quelle mischt Gattung und Technik in einem Feld. Für den Satz zählt
# die Gattung, die Technik wird als eigener Wert mitgegeben: Shopware zu
# nennen verrät keinen Kunden, zeigt aber, womit gearbeitet wurde.
GATTUNG = {
	'Website': 'Website',
	'Payload Website': 'Website',
	'App': 'App',
	'Shopware': 'Onlineshop',
	'OXID eShop': 'Onlineshop',
	'CosmoShop': 'Onlineshop',
	'XT-Commerce Shop': 'Onlineshop',
}

# Nur wo die Technik etwas aussagt. Bei "Website" stünde sonst zweimal
# dasselbe auf der Karte.
TECHNIK = {
	'Shopware': 'Shopware',
	'OXID eShop': 'OXID',
	'CosmoShop': 'CosmoShop',
	'XT-Commerce Shop': 'XT-Commerce',
	'Payload Website': 'Payload',
}

# ----------------------------------------------------------------------
# Träger: wer hat das Projekt bekommen
# ----------------------------------------------------------------------
# Der Regelfall lautet "für ein Unternehmen aus dem Bereich X". Das ist
# unabhängig vom Geschlecht des Branchenworts immer grammatisch richtig,
# und deshalb braucht es keine 132 Formulierungen von Hand.
#
# Hier stehen nur die Fälle, in denen das hölzern klänge, weil die Branche
# selbst schon den Träger benennt. Der Schlüssel wird als Wortanfang
# geprüft, kleingeschrieben.
TRAEGER = [
	('öffentliche einrichtung', 'eine öffentliche Einrichtung'),
	('soziale einrichtung', 'eine soziale Einrichtung'),
	('bildungseinrichtung', 'eine Bildungseinrichtung'),
	('sportverein', 'einen Sportverein'),
	('verein', 'einen Verein'),
	('energieversorger', 'einen Energieversorger'),
	('investmentfondsgesellschaft', 'eine Investmentfondsgesellschaft'),
	('versicherung', 'eine Versicherung'),
	('stiftung', 'eine Stiftung'),
	('hotellerie', 'ein Haus aus der Hotellerie'),
	('gastronomie', 'einen Betrieb aus der Gastronomie'),
	('verlag', 'einen Verlag'),
	('kanzlei', 'eine Kanzlei'),
	('agentur', 'eine Agentur'),
	('klinik', 'eine Klinik'),
	('hochschule', 'eine Hochschule'),
	('museum', 'ein Museum'),
]

# ----------------------------------------------------------------------
# Sinnbild
# ----------------------------------------------------------------------
# Zwölf Kategorien für 132 Branchen. Die erste Zeile, die trifft, gewinnt,
# deshalb steht das Speziellere oben.
ICONS = [
	('gesund', ('gesundheit', 'sozial', 'klinik', 'pflege', 'medizin', 'apotheke', 'senior')),
	('amt', ('öffentlich', 'kommune', 'stadt', 'behörde', 'verwaltung', 'gemeinde')),
	('energie', ('energie', 'photovoltaik', 'solar', 'strom', 'wärme', 'umwelt')),
	('finanz', ('finanz', 'bank', 'versicherung', 'investment', 'fonds', 'immobilien', 'steuer')),
	('reise', ('tourismus', 'reise', 'hotel', 'gastronomie', 'freizeit', 'camping')),
	('sport', ('sport', 'verein', 'fitness')),
	('medien', ('verlag', 'medien', 'bildung', 'schule', 'hochschule', 'museum', 'kultur', 'druck')),
	('digital', ('it', 'software', 'elektronik', 'technologie', 'digital', 'telekommunikation')),
	('technik', ('messtechnik', 'industrie', 'maschinen', 'anlagen', 'automotive', 'werkzeug',
	             'metall', 'chemie', 'kunststoff', 'labor', 'forschung')),
	('wohnen', ('küche', 'möbel', 'bau', 'wohn', 'garten', 'handwerk', 'ingenieur', 'architektur')),
	('handel', ('handel', 'shop', 'mode', 'spielwaren', 'spirituosen', 'lebensmittel',
	            'schmuck', 'kosmetik', 'merchandising')),
]


def erster_teil(branche):
	"""110 der 132 Branchen tragen einen Schrägstrich. Der erste Teil ist
	jeweils der tragende Begriff, der Rest eine Verfeinerung."""
	return branche.split('/')[0].strip()


def icon_fuer(branche):
	text = branche.lower()
	for name, schluessel in ICONS:
		if any(s in text for s in schluessel):
			return name
	return 'sonst'


def satz_fuer(gattung, branche):
	begriff = erster_teil(branche)
	klein = begriff.lower()
	for anfang, traeger in TRAEGER:
		if klein.startswith(anfang):
			return '%s für %s' % (gattung, traeger)
	return '%s für ein Unternehmen aus dem Bereich %s' % (gattung, begriff)


def main():
	if not QUELLE.exists():
		sys.exit('Quelle fehlt: %s' % QUELLE)

	quelle = json.loads(QUELLE.read_text(encoding='utf-8'))
	ausgabe = []
	gesehen = set()

	# Der Reihe nach von vorn, also von der jüngsten Arbeit an. Sätze, die
	# schon dastehen, werden übersprungen: aus den erlaubten Feldern lassen
	# sich zwei Projekte derselben Branche nicht unterscheiden, und drei
	# wortgleiche Karten nebeneinander sähen nach Fehler aus. Dafür reicht
	# die Auswahl ein paar Einträge weiter zurück.
	for eintrag in quelle:
		if len(ausgabe) == ANZAHL:
			break
		typ = (eintrag.get('Typ') or '').strip()
		branche = (eintrag.get('Branche') or '').strip()
		gattung = GATTUNG.get(typ, 'Projekt')
		satz = satz_fuer(gattung, branche) if branche else gattung

		if satz in gesehen:
			continue
		gesehen.add(satz)

		ausgabe.append({
			'jahr': (eintrag.get('Jahr') or '').strip(),
			'satz': satz,
			'technik': TECHNIK.get(typ, ''),
			'icon': icon_fuer(branche),
		})

	ZIEL.write_text(
		json.dumps(ausgabe, ensure_ascii=False, indent='\t') + '\n',
		encoding='utf-8')

	print('%d von %d Einträgen übernommen -> %s\n' % (len(ausgabe), len(quelle), ZIEL.name))
	for e in ausgabe:
		print('  %s  %-10s %s%s' % (
			e['jahr'], e['icon'], e['satz'],
			'  (%s)' % e['technik'] if e['technik'] else ''))

	# ------------------------------------------------------------------
	# Gegenprobe
	# ------------------------------------------------------------------
	# Kein Wort aus den geschützten Feldern darf in der Ausgabe stehen.
	# Ausgenommen ist das Vokabular, das dieses Skript selbst erzeugt:
	# "Website" etwa steht hier absichtlich und taucht nebenbei auch in
	# manchen URLs auf. Das wäre sonst ein Fehlalarm.
	eigenes = set()
	for quelltext in list(GATTUNG.values()) + list(TECHNIK.values()) + [t for _, t in TRAEGER]:
		eigenes.update(w.lower() for w in re.findall(r'[A-Za-zÄÖÜäöüß]{4,}', quelltext))
	eigenes.update(('bereich', 'unternehmen'))
	for eintrag in quelle:
		eigenes.update(w.lower() for w in re.findall(
			r'[A-Za-zÄÖÜäöüß]{4,}', erster_teil(eintrag.get('Branche') or '')))

	# Verglichen wird Wort gegen Wort, nicht Zeichenkette in Zeichenkette.
	# Sonst schlägt jedes Teilwort an: "Shop" steckt in "Onlineshop",
	# "Biotech" in "Biotechnologie", und beides ist harmlos.
	ausgegeben = set(re.findall(r'[a-zäöüß]{4,}', ZIEL.read_text(encoding='utf-8').lower()))
	verraeter = []
	for eintrag in quelle:
		for feld in ('Projekttitel', 'Agentur', 'URL', 'Image', 'Beschreibung'):
			wert = (eintrag.get(feld) or '').strip()
			for wort in re.findall(r'[A-Za-zÄÖÜäöüß]{4,}', wert):
				klein = wort.lower()
				if klein not in eigenes and klein in ausgegeben:
					verraeter.append('%s: %s' % (feld, wort))
	print()
	if verraeter:
		print('ACHTUNG, Wörter aus geschützten Feldern in der Ausgabe:')
		for v in sorted(set(verraeter)):
			print('   ', v)
		sys.exit(1)
	print('Gegenprobe bestanden: kein Wort aus Titel, Agentur, URL, Bild oder')
	print('Beschreibung steht in der Ausgabe, das eigene Vokabular ausgenommen.')


if __name__ == '__main__':
	main()
