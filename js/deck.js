/**
 * Wiredframe – wiredframe.de
 *
 * Die Bewegung macht der Browser: Scroll-Snap vertikal für die Sections,
 * Scroll-Snap horizontal für die Grid-Reihen, deren Pfeile als native
 * Scroll-Buttons, natives Popover für Menü und Impressum, den laufenden
 * Zähler eine animierte CSS-Eigenschaft. JavaScript kümmert sich nur
 * noch um drei Dinge:
 *
 *   1. welche Section gerade aktiv ist (Indikator, Linktext, Zählerlauf)
 *   2. eine Notbremse gegen Überlauf auf sehr kleinen Screens
 *   3. Inhalte: Jahre, Mail-Schutz, GitHub
 *
 * Die Farben stehen woanders: js/theme.js würfelt sie und läuft dafür
 * schon im <head>. Hier wird nur der Tap auf das Signet weitergereicht.
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
	// Die Anker-Links im Markup genügen: scroll-behavior bewegt, scroll-snap
	// lässt auf der Sectionkante einrasten, und beides ist dieselbe Engine,
	// die sich deshalb nicht selbst in die Quere kommt. Eine eigene Animation
	// stand hier früher und musste dafür das Einrasten stummschalten, weil
	// auf dem Handy die einklappende URL-Leiste eine Layoutänderung ist und
	// Scroll-Snap danach zurück auf die Ausgangs-Section zieht.
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
		const ersterAufruf = current === -1;
		current = i;

		chips.forEach((chip, n) => {
			if (n === i) chip.setAttribute('aria-current', 'true');
			else chip.removeAttribute('aria-current');
		});

		const next = screens[i + 1] || screens[0]; // am Ende zurück zum Start
		nextLink.href = `#${next.id}`;
		nextLabel.textContent = screens[i].dataset.next || 'Weiter';
		nextLink.setAttribute('aria-label', nextLabel.textContent);

		// Farbe und Signet gehören zusammen: wo das Signet neu anläuft,
		// wird auch gewürfelt. Das trifft jede Rückkehr zur Startsection,
		// egal ob über das Menü, den Weiter-Button am Ende des Decks, den
		// Indikator oder von Hand gescrollt.
		//
		// Nur der allererste Aufruf bleibt außen vor: dort hat js/theme.js
		// im <head> längst gewürfelt, ein zweiter Wurf verwürfe den ersten
		// noch vor dem ersten Bild.
		if (screens[i].id === 'home') {
			if (!ersterAufruf) window.wfTheme?.();
			replayLogo();
		} else {
			hinweisWeg(); // wer weiterscrollt, braucht die Einladung nicht mehr
		}
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
	// Scrollen neu. Die Panelhöhe bleibt dabei konstant, weil .screen mit svh
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

	// Die Animation selbst steht im CSS, hier wird sie nur zurückgespult.
	// Nicht über das Entfernen und Neusetzen einer Klasse: das braucht ein
	// erzwungenes Reflow dazwischen, und ein Reflow am Ende eines Sprungs
	// ist genau das, woran sich das Einrasten stößt.
	const replayLogo = () => logo?.getAnimations({ subtree: true }).forEach((a) => {
		a.currentTime = 0;
		a.play();
	});

	// ----------------------------------------
	// Die Einladung zum Signet
	// ----------------------------------------
	// Dass das Signet die Farben würfelt, sieht man ihm nicht an. Nach ein
	// paar Sekunden Ruhe sagt es eine Blase. Sie verschwindet, sobald der
	// Hinweis überflüssig geworden ist: nach dem ersten Tap, oder wenn die
	// Startsection ohnehin verlassen wird. Aussehen und Ein- und
	// Ausblenden stehen vollständig im CSS, hier wird nur geschaltet.
	const hinweis = document.getElementById('signet-hinweis');
	let hinweisUhr = setTimeout(() => {
		if (current === 0 && hinweis && !hinweis.matches(':popover-open')) hinweis.showPopover();
	}, 3500);

	const hinweisWeg = () => {
		clearTimeout(hinweisUhr);
		if (hinweis?.matches(':popover-open')) hinweis.hidePopover();
	};

	// Wer mit dem Zeiger auf dem Signet landet, hat den Hinweis nicht mehr
	// nötig. Das erspart nebenbei ein Zucken: die Blase hängt am Signet,
	// und das dreht sich beim Überfahren leicht, wodurch ihre Ankerbox
	// wandert. Ist sie da schon weg, sieht man davon nichts.
	logo?.addEventListener('pointerenter', hinweisWeg);

	// Ein Tap auf das Signet würfelt zugleich ein neues Farbthema. Die
	// Farben selbst macht js/theme.js, das schon im <head> gelaufen ist.
	logo?.addEventListener('click', () => {
		hinweisWeg();
		window.wfTheme?.();
		replayLogo();
	});

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
		const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

		fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed&direction=desc`, { headers: { Accept: 'application/vnd.github+json' } })
			.then((r) => { if (!r.ok) throw 0; return r.json(); })
			.then((repos) => {
				const list = (repos || []).filter((r) => !r.archived);
				rail.insertAdjacentHTML('beforeend', list.map(card).join(''));
			})
			.catch(() => {
				rail.insertAdjacentHTML('beforeend', card({
					html_url: `https://github.com/${USER}?tab=repositories`,
					name: 'Ab zu GitHub',
					description: 'Die Live-Vorschau lädt gerade nicht. Schau dir die Repositories direkt auf GitHub an.'
				}));
			})
			.finally(relayout);
	};

	// ========================================
	// Start
	// ========================================
	setCurrent(0);
	relayout();
	initRepos();
	document.fonts?.ready.then(relayout);
})();
