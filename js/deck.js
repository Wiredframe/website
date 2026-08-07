/**
 * Wiredframe, wiredframe.de
 *
 * Die Bewegung macht der Browser: Anker-Links und scroll-behavior für die
 * Sections, Scroll-Snap quer in den Grid-Reihen, deren Pfeile als native
 * Scroll-Buttons, natives Popover für Menü und Impressum. JavaScript
 * kümmert sich nur noch um drei Dinge:
 *
 *   1. welche Section gerade aktiv ist (Indikator, Linktext, Zählerlauf)
 *   2. eine Notbremse gegen Überlauf auf sehr kleinen Screens
 *   3. Inhalte: Jahre, Mail-Schutz, GitHub
 *
 * Die Farben stehen fest in css/deck.css. Sie stammen aus js/theme.js,
 * das sie eine Zeit lang bei jedem Aufruf neu gewürfelt hat; die Datei
 * liegt noch im Projekt, wird aber nicht mehr geladen.
 */
(() => {
	'use strict';

	const screens = [...document.querySelectorAll('.screen')];
	const chips = [...document.querySelectorAll('.chip')];
	const nextLink = document.getElementById('nav-next');
	const nextLabel = document.querySelector('[data-next-label]');
	const menu = document.getElementById('menu');
	const counterEl = document.querySelector('.counter');
	// Wer Bewegung abbestellt hat, bekommt die Zahl als Standbild
	const reduziert = matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ========================================
	// 0 · Sprünge macht der Browser
	// ----------------------------------------
	// Die Anker-Links im Markup genügen, scroll-behavior bewegt. Von hier
	// wird nichts gescrollt und nichts am Scrollen nachgeholfen.
	//
	// Hier stand zweimal eine Umgehung für vertikales Scroll-Snap, erst ein
	// eigener Scroller, dann ein Stummschalten während der Sprünge. Beide
	// sind weg, weil das vertikale Einrasten selbst weg ist: es zog auf dem
	// Handy nach jedem Sprung zurück auf die Ausgangs-Section, sobald die
	// URL-Leiste einklappte. Die Begründung steht in deck.css.
	//
	// Bleibt eine Kleinigkeit: popovertarget ist auf <a> nicht erlaubt, das
	// Menü muss also von Hand zugehen, wenn einer seiner Links springt.
	// ========================================
	document.addEventListener('click', (e) => {
		if (e.target.closest('a[href^="#"]') && menu?.matches(':popover-open')) menu.hidePopover();
	});

	// ========================================
	// 1 · Aktive Section
	// ========================================
	let current = -1;

	const setCurrent = (i) => {
		if (i === current || i < 0) return;
		current = i;

		chips.forEach((chip, n) => {
			if (n === i) chip.setAttribute('aria-current', 'true');
			else chip.removeAttribute('aria-current');
		});

		const next = screens[i + 1] || screens[0]; // am Ende zurück zum Start
		nextLink.href = `#${next.id}`;
		nextLabel.textContent = screens[i].dataset.next || 'Weiter';
		nextLink.setAttribute('aria-label', nextLabel.textContent);

		// Was in den Blick kommt, blendet ein. Auf der Startsection ist das
		// der ganze Auftritt aus Signet, Schlagzeile und Untertitel, sonst
		// die Inhalte der Section. Beides steht im CSS, hier wird es nur
		// zurückgespult.
		//
		// Das ersetzt das weiche Scrollen der Seite: statt die Fläche an
		// den Leser vorbeifahren zu lassen, steht sie sofort still und der
		// Inhalt kommt kurz nach.
		einblenden(screens[i]);
		zaehlerLaufen(screens[i].id === 'wahrheit');
	};

	// Aktiv ist, was die Bildschirmmitte kreuzt
	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) setCurrent(screens.indexOf(entry.target));
		});
	}, { rootMargin: '-45% 0px -45% 0px' });
	screens.forEach((s) => observer.observe(s));

	// ----------------------------------------
	// Worauf die Bedienzeile liegt
	// ----------------------------------------
	// Bewusst eine zweite Messung. Der Indikator oben fragt nach der Section
	// in der Bildschirmmitte, das ist für ihn richtig. Die Bedienzeile liegt
	// aber ganz unten auf dem Panel und braucht die Farbe genau unter sich,
	// sonst schaltet sie beim Scrollen von Hand eine halbe Seite zu spät um.
	//
	// Die Wurzel wird deshalb auf ein schmales Band zusammengeschnitten, das
	// auf der Mitte der Zeile liegt. So gibt es immer genau eine Section, die
	// es kreuzt, und die Umschaltung kann nicht zwischen zweien flackern.
	const dock = document.querySelector('.dock');
	let dockBeobachter;

	const dockBeobachten = () => {
		if (!dock) return;
		dockBeobachter?.disconnect();
		const mitte = Math.round(dock.offsetHeight / 2);
		dockBeobachter = new IntersectionObserver((eintraege) => {
			eintraege.forEach((e) => {
				if (e.isIntersecting) {
					document.body.classList.toggle('dock-invers', e.target.classList.contains('screen--dark'));
				}
			});
		}, { rootMargin: `-${Math.max(0, innerHeight - mitte - 1)}px 0px -${Math.max(0, mitte - 1)}px 0px` });
		screens.forEach((s) => dockBeobachter.observe(s));
	};

	// ========================================
	// 2 · Notbremse: Inhalt größer als der Screen wird herunterskaliert.
	//     Greift nur in Ausnahmefällen, etwa im Querformat auf dem Handy.
	// ========================================
	const MIN_FIT = 0.7;

	const fit = (screen) => {
		const panel = screen.querySelector('.panel');
		const box = panel?.querySelector('.stage, .rail');
		if (!box) return;
		const need = box.scrollHeight;
		const avail = panel.clientHeight;
		if (!need || !avail) return;
		box.style.setProperty('--fit', (need > avail ? Math.max(MIN_FIT, avail / need) : 1).toFixed(4));
	};

	// Das Band der Bedienzeile hängt an der Fensterhöhe, deshalb wird der
	// Beobachter bei jeder echten Größenänderung neu aufgespannt.
	const relayout = () => {
		screens.forEach(fit);
		dockBeobachten();
	};

	// Am Fenster zu horchen wäre zu grob: resize feuert auf dem Handy auch,
	// wenn nur die URL-Leiste ein- oder ausfährt, und rechnet dann mitten im
	// Scrollen neu. Die Panelhöhe bleibt dabei konstant, weil .screen mit lvh
	// misst. Ein Observer auf den Panels sieht deshalb nur echte Änderungen.
	const panelSize = new ResizeObserver(relayout);
	screens.forEach((s) => {
		const panel = s.querySelector('.panel');
		if (panel) panelSize.observe(panel);
	});

	// ========================================
	// 3 · Inhalte
	// ========================================
	const logo = document.querySelector('.logo-anim');

	// Die Animationen selbst stehen im CSS, hier werden sie nur
	// zurückgespult. Nicht über das Entfernen und Neusetzen einer Klasse:
	// das bräuchte ein erzwungenes Reflow dazwischen, und das mitten in
	// einem Sprung.
	//
	// Übergänge bleiben dabei unangetastet. getAnimations liefert sie mit,
	// und ein zurückgespulter Hover sähe albern aus. Nur echte Keyframe-
	// Animationen tragen einen animationName.
	const wiederholen = (wurzel) => wurzel?.getAnimations({ subtree: true }).forEach((a) => {
		if (!a.animationName) return;
		a.currentTime = 0;
		a.play();
	});

	// Zwei Reichweiten, mit Absicht. Wer das Signet antippt, meint das
	// Signet. Wer eine Section betritt, bekommt deren ganzen Inhalt.
	const replayLogo = () => wiederholen(logo);
	const einblenden = (screen) => wiederholen(screen);

	logo?.addEventListener('click', replayLogo);

	document.querySelectorAll('[data-years]').forEach((el) => {
		el.textContent = new Date().getFullYear() - 2005;
	});

	// ----------------------------------------
	// Der laufende Zähler
	// ----------------------------------------
	// Bewusst hier und nicht als CSS-Animation: der Umweg über eine
	// animierte registrierte Eigenschaft und counter() scheitert an WebKit,
	// dort fällt die Zahl auf 0, sobald die Animation läuft.
	//
	// Dass diese Schleife das Layout nicht mehr stört, liegt nicht an ihr,
	// sondern an der abgedichteten Box in deck.css. Der Antrieb ist dafür
	// ohne Belang, deshalb darf er ruhig wieder hier stehen.
	let zaehlerRaf = 0, zaehlerZeit = 0, zaehlerRest = 0;
	let zaehlerWert = 100000 + Math.floor((Date.now() - Date.parse('2024-01-01')) / 864e5) * 50;

	// Ohne Tausenderpunkt: die Zahl wirkt hier als Bild, nicht als Betrag
	const zaehlerZeigen = () => {
		if (counterEl) counterEl.textContent = zaehlerWert;
	};

	const zaehlerSchritt = (t) => {
		zaehlerRest += (t - (zaehlerZeit || t)) * 0.5;
		zaehlerZeit = t;
		const plus = zaehlerRest | 0;
		if (plus) {
			zaehlerWert += plus;
			zaehlerRest -= plus;
			zaehlerZeigen();
		}
		zaehlerRaf = requestAnimationFrame(zaehlerSchritt);
	};

	// Läuft nur, solange die Section zu sehen ist
	const zaehlerLaufen = (an) => {
		if (!counterEl || reduziert) return;
		if (an && !zaehlerRaf) {
			zaehlerZeit = 0;
			zaehlerRaf = requestAnimationFrame(zaehlerSchritt);
		} else if (!an) {
			cancelAnimationFrame(zaehlerRaf);
			zaehlerRaf = 0;
		}
	};

	zaehlerZeigen();

	// Mail-Schutz: die Adresse steht nur verdreht im Markup und wird erst
	// beim Klick zusammengesetzt. Im Impressum kommt sie ganz ohne Skript
	// aus, dort dreht die Schriftrichtung sie wieder herum (.mail-rueckwaerts).
	document.getElementById('email-link')?.addEventListener('click', function () {
		if (this.dataset.ready) return;
		const rev = (s) => s.split('').reverse().join('');
		this.href = `mailto:${rev('ofni')}@${rev('emarfderiw')}.${rev('ed')}`;
		this.dataset.ready = '1';
	});

	// Beide Reihen unten setzen Markup aus Daten zusammen, deshalb steht
	// das Maskieren hier oben und nicht zweimal darunter.
	const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

	// ----------------------------------------
	// Referenzen
	// ----------------------------------------
	// Die Datei data/referenzen.json ist bereits anonym: sie kennt weder
	// Kundennamen noch Agenturen, weil werkzeuge/referenzen.py nur Jahr,
	// Art und Branche übernimmt und daraus einen Satz baut. Hier wird also
	// nichts mehr verschwiegen, sondern nur noch gezeichnet.
	const initReferenzen = () => {
		const rail = document.getElementById('projekte-rail');
		if (!rail) return;

		const karte = (r) => `
			<article class="cell cell--referenz">
				<span class="cell__icon icon--${esc(r.icon)}" aria-hidden="true"></span>
				<p class="text">${esc(r.satz)}</p>
				<span class="repo__meta">
					<span>${esc(r.jahr)}</span>
					${r.technik ? `<span class="referenz__technik">${esc(r.technik)}</span>` : ''}
				</span>
			</article>`;

		// Die Einladung steht schon im Markup und soll die letzte Spalte
		// bleiben, deshalb wird davor eingefügt und nicht ans Ende.
		const einladung = document.getElementById('projekte-einladung');

		fetch('data/referenzen.json')
			.then((r) => { if (!r.ok) throw 0; return r.json(); })
			.then((liste) => (einladung || rail).insertAdjacentHTML(
				einladung ? 'beforebegin' : 'beforeend', liste.map(karte).join('')))
			.catch(() => { })
			.finally(relayout);
	};

	// GitHub-Repos als weitere Spalten der Code-Reihe
	const initRepos = () => {
		const rail = document.getElementById('repos-rail');
		if (!rail) return;

		const USER = 'Wiredframe';
		const LANG = {
			Swift: '#F05138', HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c', TypeScript: '#3178c6',
			JavaScript: '#f1e05a', Ruby: '#701516', Python: '#3572A5', Shell: '#89e051', Go: '#00ADD8',
			Rust: '#dea584', Java: '#b07219', Kotlin: '#A97BFF', PHP: '#4F5D95', 'C++': '#f34b7d', 'C#': '#178600'
		};
		const ICON = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>';

		const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
		const timeAgo = (iso) => {
			const diff = (Date.now() - new Date(iso).getTime()) / 1000;
			for (const [unit, secs] of [['year', 31536e3], ['month', 2592e3], ['week', 6048e2], ['day', 864e2], ['hour', 3600], ['minute', 60]]) {
				if (Math.abs(diff) >= secs) return rtf.format(-Math.round(diff / secs), unit);
			}
			return 'gerade eben';
		};

		const card = (r) => `
			<a class="cell cell--repo" href="${esc(r.html_url)}" target="_blank" rel="noopener">
				<span class="repo__icon">${ICON}</span>
				<h3 class="subtitle">${esc(r.name)}</h3>
				<p class="text repo__desc">${esc(r.description || 'Noch ohne Beschreibung, aber öffentlich einsehbar.')}</p>
				<span class="repo__meta">
					${r.language ? `<span class="repo__lang"><span class="repo__dot" style="--dot:${LANG[r.language] || '#7d8b88'}"></span>${esc(r.language)}</span>` : ''}
					<span>${timeAgo(r.pushed_at || r.updated_at)}</span>
				</span>
			</a>`;

		// ----------------------------------------
		// Einmal am Tag holen, sonst aus dem Vorrat
		// ----------------------------------------
		// GitHub lässt ohne Anmeldung 60 Anfragen pro Stunde und IP zu. Das
		// klingt viel, ist es aber nicht: die Grenze zählt pro IP, nicht pro
		// Besucher, und hinter einem Mobilfunknetz oder einem Firmenanschluss
		// teilen sich viele dieselbe. Ist sie erreicht, antwortet die API mit
		// 403, und die Section stand dann leer da.
		//
		// Deshalb liegt die letzte Antwort im Browser des Besuchers. Geholt
		// wird nur, wenn sie älter als einen Tag ist, und immer nur beim
		// Aufruf der Seite: kein Timer, kein Nachladen im Hintergrund.
		// Schlägt das Holen fehl, wird der alte Vorrat gezeigt, auch ein
		// abgelaufener. Eine Woche alte Zeitangaben sind allemal besser als
		// eine Karte, die sich entschuldigt.
		const VORRAT = 'wf-repos';
		const TAG = 24 * 60 * 60 * 1000;

		const lesen = () => {
			try {
				const roh = localStorage.getItem(VORRAT);
				if (!roh) return null;
				const v = JSON.parse(roh);
				return Array.isArray(v.liste) ? v : null;
			} catch { return null; }
		};

		const schreiben = (liste) => {
			try {
				localStorage.setItem(VORRAT, JSON.stringify({ zeit: Date.now(), liste }));
			} catch { /* privater Modus oder voll: dann eben ohne Vorrat */ }
		};

		const zeigen = (liste) => {
			if (liste?.length) {
				rail.insertAdjacentHTML('beforeend', liste.map(card).join(''));
			} else {
				rail.insertAdjacentHTML('beforeend', card({
					html_url: `https://github.com/${USER}?tab=repositories`,
					name: 'Ab zu GitHub',
					description: 'Die Live-Vorschau lädt gerade nicht. Schau dir die Repositories direkt auf GitHub an.'
				}));
			}
			relayout();
		};

		// Aus der Antwort wird nur behalten, was die Karte braucht. Sonst
		// lägen hundert Repositories mit je vier Dutzend Feldern im Speicher
		// des Besuchers, und die Fünf-Megabyte-Grenze ist schneller erreicht,
		// als man denkt.
		const knapp = (r) => ({
			html_url: r.html_url, name: r.name, description: r.description,
			language: r.language, pushed_at: r.pushed_at || r.updated_at
		});

		const vorrat = lesen();
		if (vorrat && Date.now() - vorrat.zeit < TAG) {
			zeigen(vorrat.liste);
			return;
		}

		fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed&direction=desc`, { headers: { Accept: 'application/vnd.github+json' } })
			.then((r) => { if (!r.ok) throw 0; return r.json(); })
			.then((repos) => {
				const liste = (repos || []).filter((r) => !r.archived).map(knapp);
				schreiben(liste);
				zeigen(liste);
			})
			.catch(() => zeigen(vorrat?.liste));
	};

	// ========================================
	// Start
	// ========================================
	setCurrent(0);
	relayout();
	initReferenzen();
	initRepos();
	document.fonts?.ready.then(relayout);
})();
