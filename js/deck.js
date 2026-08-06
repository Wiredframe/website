/**
 * Wiredframe – wiredframe.de
 *
 * Die Bewegung macht der Browser: Scroll-Snap vertikal für die Sections,
 * Scroll-Snap horizontal für die Grid-Reihen, natives Popover für Menü und
 * Impressum. JavaScript kümmert sich nur um vier Dinge:
 *
 *   1. Sprünge über Menü, Indikator, Weiter und die Reihen-Pfeile
 *   2. welche Section gerade aktiv ist (Indikator, Linktext)
 *   3. eine Notbremse gegen Überlauf auf sehr kleinen Screens
 *   4. Inhalte: Zähler, Jahre, Mail-Schutz, GitHub
 */
(() => {
	'use strict';

	const root = document.documentElement;
	const screens = [...document.querySelectorAll('.screen')];
	const chips = [...document.querySelectorAll('.chip')];
	const nextLink = document.getElementById('nav-next');
	const nextLabel = document.querySelector('[data-next-label]');
	const menu = document.getElementById('menu');
	const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ========================================
	// 1 · Sprünge
	// ----------------------------------------
	// Eine Animation für beide Achsen. Natives Smooth-Scrolling ist je nach
	// Browser unterschiedlich schnell und fliegt bei weiten Sprüngen durch
	// alle Zwischenschritte. Das harte Snapping pausiert während der Bewegung,
	// sonst fängt es den Sprung unterwegs ab und zieht zurück (auf Mobile der
	// Normalfall). Die Anker-Links im Markup funktionieren auch ohne das hier.
	// ========================================
	// Wo der Browser selbst einrastet (Touch), überlässt man ihm auch die
	// Bewegung. Eine eigene Animation würde dort gegen die Snap-Engine
	// arbeiten: der Sprung startet, wird mittendrin abgefangen und auf die
	// Ausgangs-Section zurückgezogen. Der native Anker-Sprung kennt das
	// Problem nicht, weil beides dieselbe Engine ist.
	const browserSnaps = matchMedia('(hover: none) and (pointer: coarse)');

	const GLIDE_MS = 290;
	const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
	const running = new Map();

	const stopGlide = (scroller) => {
		const state = running.get(scroller);
		if (!state) return;
		cancelAnimationFrame(state.id);
		running.delete(scroller);
		state.onEnd();
	};

	const glide = (scroller, axis, to, onEnd = () => { }) => {
		stopGlide(scroller);
		const key = axis === 'y' ? 'top' : 'left';
		const from = scroller === window
			? (axis === 'y' ? scrollY : scrollX)
			: (axis === 'y' ? scroller.scrollTop : scroller.scrollLeft);

		if (reduceMotion || Math.abs(to - from) < 2) {
			scroller.scrollTo({ [key]: to, behavior: 'instant' });
			onEnd();
			return;
		}

		const start = performance.now();
		const state = { id: 0, onEnd };
		running.set(scroller, state);

		const tick = (now) => {
			const p = Math.min(1, (now - start) / GLIDE_MS);
			scroller.scrollTo({ [key]: Math.round(from + (to - from) * easeInOut(p)), behavior: 'instant' });
			if (p < 1) {
				state.id = requestAnimationFrame(tick);
				return;
			}
			running.delete(scroller);
			onEnd();
		};
		state.id = requestAnimationFrame(tick);
	};

	document.addEventListener('click', (e) => {
		const link = e.target.closest('a[href^="#"]');
		if (!link) return;
		const target = document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)));
		if (!target || !target.classList.contains('screen')) return;
		if (menu?.matches(':popover-open')) menu.hidePopover();

		// Touch: der Browser springt selbst zum Anker und rastet sauber ein
		if (browserSnaps.matches) return;

		e.preventDefault();
		stopGlide(window);
		glide(window, 'y', Math.round(target.getBoundingClientRect().top + scrollY));
	});

	// Echtes Scrollen hat Vorrang vor einer laufenden Animation. Auf
	// touchstart zu hören wäre falsch: ein Tipp auf einen Button ist noch
	// kein Scrollen, würde den gerade gestarteten Sprung aber abbrechen und
	// das Einrasten mitten in der Bewegung zurückholen.
	const yieldToUser = () => [...running.keys()].forEach(stopGlide);
	addEventListener('wheel', yieldToUser, { passive: true });
	addEventListener('touchmove', yieldToUser, { passive: true });

	// ========================================
	// 2 · Aktive Section
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

		if (screens[i].id === 'home') replayLogo();
		if (screens[i].id === 'wahrheit') startCounter();
		else stopCounter();
	};

	// Aktiv ist, was die Bildschirmmitte kreuzt
	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) setCurrent(screens.indexOf(entry.target));
		});
	}, { rootMargin: '-45% 0px -45% 0px' });
	screens.forEach((s) => observer.observe(s));

	// ========================================
	// 3 · Horizontale Reihen: Pfeile für Zeigergeräte
	// ========================================
	const railSyncs = [...document.querySelectorAll('.rail')].map((rail) => {
		const panel = rail.closest('.panel');
		const prev = panel.querySelector('.railnav--prev');
		const next = panel.querySelector('.railnav--next');
		if (!prev || !next) return null;

		const pad = () => parseFloat(getComputedStyle(rail).scrollPaddingLeft) || 0;

		// Welche Spalte steht gerade vorn?
		const atRest = () => {
			const from = rail.scrollLeft + pad();
			const cells = [...rail.children];
			let best = 0;
			cells.forEach((c, i) => {
				if (Math.abs(c.offsetLeft - from) < Math.abs(cells[best].offsetLeft - from)) best = i;
			});
			return best;
		};

		// Ziel ist immer eine Snap-Kante, nie eine feste Pixelzahl. Läuft schon
		// eine Animation, zählt der Klick auf deren Ziel weiter, statt auf die
		// Momentanposition. So kann man mehrfach klicken, ohne zu warten.
		let aim = 0;
		const step = (dir) => {
			const cells = [...rail.children];
			const base = running.has(rail) ? aim : atRest();
			const next = Math.max(0, Math.min(cells.length - 1, base + dir));

			// Touch: auch hier scrollt der Browser selbst, aus demselben Grund
			if (browserSnaps.matches) {
				aim = next;
				cells[aim].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
				return;
			}

			stopGlide(rail);
			aim = next;
			rail.style.scrollSnapType = 'none';
			glide(rail, 'x', cells[aim].offsetLeft - pad(), () => {
				rail.style.removeProperty('scroll-snap-type');
				// Am Ende der Reihe bleibt die Spalte hinter dem Ziel zurück,
				// weil weiter nicht gescrollt werden kann. Dann zählt die
				// echte Position, sonst geht der erste Klick zurück ins Leere.
				aim = atRest();
			});
		};

		const sync = () => {
			const max = rail.scrollWidth - rail.clientWidth - 2;
			prev.disabled = rail.scrollLeft <= 2;
			next.disabled = max <= 0 || rail.scrollLeft >= max;
		};

		prev.addEventListener('click', () => step(-1));
		next.addEventListener('click', () => step(1));
		rail.addEventListener('scroll', sync, { passive: true });
		sync();
		return sync;
	}).filter(Boolean);

	// ========================================
	// 4 · Notbremse: Inhalt größer als der Screen wird herunterskaliert.
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

	const relayout = () => {
		screens.forEach(fit);
		railSyncs.forEach((sync) => sync());
	};

	let resizeRaf = 0;
	addEventListener('resize', () => {
		cancelAnimationFrame(resizeRaf);
		resizeRaf = requestAnimationFrame(relayout);
	});

	// ========================================
	// 5 · Inhalte
	// ========================================
	const logo = document.querySelector('.logo-anim');

	const replayLogo = () => {
		if (!logo) return;
		logo.classList.remove('is-animating');
		void logo.offsetWidth;
		logo.classList.add('is-animating');
	};

	logo?.addEventListener('click', replayLogo);

	const counterEl = document.querySelector('[data-counter]');
	let counterRaf = 0, counterLast = 0, counterRest = 0;
	let counterValue = 100000 + Math.floor((Date.now() - new Date('2024-01-01').getTime()) / 864e5) * 50;

	const counterTick = (t) => {
		counterRest += (t - (counterLast || t)) * 0.5;
		counterLast = t;
		const inc = counterRest | 0;
		if (inc) {
			counterValue += inc;
			counterRest -= inc;
			counterEl.textContent = counterValue.toLocaleString('de-DE');
		}
		counterRaf = requestAnimationFrame(counterTick);
	};

	function startCounter() {
		if (!counterEl || counterRaf) return;
		counterLast = 0;
		counterRaf = requestAnimationFrame(counterTick);
	}

	function stopCounter() {
		cancelAnimationFrame(counterRaf);
		counterRaf = 0;
	}

	document.querySelectorAll('[data-years]').forEach((el) => {
		el.textContent = new Date().getFullYear() - 2005;
	});

	// Mail-Schutz: die Adresse steht nur verdreht im Markup
	(() => {
		const parts = ['ed', 'emarfderiw', 'ofni'];
		const rev = (s) => s.split('').reverse().join('');
		const mail = `${rev(parts[2])}@${rev(parts[1])}.${rev(parts[0])}`;

		document.getElementById('email-link')?.addEventListener('click', function () {
			if (!this.dataset.ready) {
				this.href = `mailto:${mail}`;
				this.dataset.ready = '1';
			}
		});

		const inImpressum = document.getElementById('impressum-email');
		if (inImpressum) {
			inImpressum.textContent = mail;
			inImpressum.style.unicodeBidi = 'normal';
			inImpressum.style.direction = 'ltr';
		}
	})();

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
