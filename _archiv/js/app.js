/**
 * Wiredframe – Modern JavaScript
 * ES6+, no dependencies
 * Scroll animations & back-to-top handled by CSS Scroll-Driven Animations
 */
(() => {
	'use strict';

	// ========================================
	// Logo Animation Replay on Click/Touch
	// ========================================
	const initLogoAnimReplay = () => {
		const logoAnim = document.querySelector('.logo-anim');
		if (!logoAnim) return;

		logoAnim.style.cursor = 'pointer';
		logoAnim.addEventListener('click', () => {
			logoAnim.classList.remove('is-animating');
			// Force reflow to restart animation
			void logoAnim.offsetWidth;
			logoAnim.classList.add('is-animating');
		});
		// Start with animation class
		logoAnim.classList.add('is-animating');
	};

	// ========================================
	// Scroll Reveal Animation (IntersectionObserver)
	// ========================================
	const initScrollReveal = () => {
		const animatedElements = document.querySelectorAll('[data-animate]');
		if (!animatedElements.length) return;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
				}
			});
		}, {
			threshold: 0.1,
			rootMargin: '0px 0px -30px 0px'
		});

		animatedElements.forEach(el => observer.observe(el));
	};

	// ========================================
	// Counter Animation (Infinite)
	// ========================================
	const initCounter = () => {
		const counter = document.querySelector('.counter');
		if (!counter) return;

		// Startwert: Basis + Tage seit 01.01.2024 (bleibt 6-stellig)
		const baseValue = 100000;
		const startDate = new Date('2024-01-01');
		const daysPassed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
		let value = baseValue + daysPassed * 50;

		const speed = 0.500; // Geschwindigkeit: Inkrement pro Millisekunde
		let running = false, last = 0, acc = 0;

		const tick = (t) => {
			acc += (t - (last || t)) * speed;
			last = t;
			const inc = acc | 0;
			if (inc) { value += inc; counter.textContent = value; acc -= inc; }
			if (running) requestAnimationFrame(tick);
		};

		new IntersectionObserver(([e]) => {
			if (e.isIntersecting && !running) { running = true; last = 0; requestAnimationFrame(tick); }
			else if (!e.isIntersecting) running = false;
		}, { threshold: 0.5 }).observe(counter);
	};

	// ========================================
	// Mobile Menu Toggle
	// ========================================
	const initMobileMenu = () => {
		const nav = document.querySelector('.nav');
		const toggle = document.querySelector('.nav__toggle');
		const menu = document.querySelector('.nav__menu');

		if (!nav || !toggle || !menu) return;

		toggle.addEventListener('click', (e) => {
			e.stopPropagation();
			nav.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', nav.classList.contains('is-open'));
		});

		// Close on link click
		menu.querySelectorAll('.nav__link').forEach(link => {
			link.addEventListener('click', () => {
				nav.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
			});
		});

		// Close on outside click
		document.addEventListener('click', (e) => {
			if (!nav.contains(e.target) && nav.classList.contains('is-open')) {
				nav.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
			}
		});
	};

	// ========================================
	// Impressum Accordion
	// ========================================
	const initImpressum = () => {
		const openBtn = document.querySelector('[data-impressum="open"]');
		const closeBtn = document.querySelector('[data-impressum="close"]');
		const section = document.getElementById('impressum');

		if (!section) return;

		section.style.display = 'none';

		openBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			section.style.display = 'block';
			setTimeout(() => section.scrollIntoView({ behavior: 'smooth' }), 50);
		});

		closeBtn?.addEventListener('click', (e) => {
			e.preventDefault();
			section.style.display = 'none';
			document.getElementById('kontakt')?.scrollIntoView({ behavior: 'smooth' });
		});
	};

	// ========================================
	// Dynamic Year Calculation
	// ========================================
	const initYears = () => {
		const years = new Date().getFullYear() - 2005;
		document.querySelectorAll('[data-years]').forEach(el => {
			el.textContent = years;
		});
	};

	// ========================================
	// Retro Hit Counter (fake)
	// ========================================
	const initRetroCounter = () => {
		const el = document.getElementById('hit-counter');
		if (!el) return;

		const startDate = new Date('2024-01-01');
		const daysPassed = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
		let count = daysPassed * 50;

		const update = () => {
			el.textContent = `${count} visits`;
		};

		const bump = () => {
			const interval = Math.floor(Math.random() * 10000) + 5000;
			setTimeout(() => {
				count++;
				update();
				el.classList.add('bump');
				setTimeout(() => el.classList.remove('bump'), 300);
				bump();
			}, interval);
		};

		update();
		bump();
	};

	// ========================================
	// Email Protection
	// ========================================
	const initEmailProtection = () => {
		// Email parts reversed to prevent scraping
		const parts = ['ed', 'emarfderiw', 'ofni'];
		const user = parts[2].split('').reverse().join('');
		const domain = parts[1].split('').reverse().join('') + '.' + parts[0].split('').reverse().join('');
		const email = user + '@' + domain;

		const link = document.getElementById('email-link');
		if (link) {
			link.addEventListener('click', function (e) {
				if (!this.dataset.ready) {
					this.href = 'mailto:' + email;
					this.dataset.ready = '1';
				}
			});
		}

		// Impressum email (displayed reversed in HTML)
		const impressumEmail = document.getElementById('impressum-email');
		if (impressumEmail) {
			impressumEmail.textContent = email;
			impressumEmail.style.unicodeBidi = 'normal';
			impressumEmail.style.direction = 'ltr';
		}
	};

	// ========================================
	// GitHub Repos Card Slider
	// ========================================
	const initRepos = () => {
		const track = document.getElementById('repos-track');
		if (!track) return;

		const USER = 'Wiredframe';
		const PROFILE = `https://github.com/${USER}?tab=repositories`;
		const viewport = track.closest('.repos__viewport');
		const prevBtn = viewport?.querySelector('.repos__nav--prev');
		const nextBtn = viewport?.querySelector('.repos__nav--next');
		const smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

		const LANG = {
			Swift: '#F05138', HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c', TypeScript: '#3178c6',
			JavaScript: '#f1e05a', Ruby: '#701516', Python: '#3572A5', Shell: '#89e051', Go: '#00ADD8',
			Rust: '#dea584', Java: '#b07219', Kotlin: '#A97BFF', PHP: '#4F5D95', 'C++': '#f34b7d', 'C#': '#178600'
		};
		const ICON = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"></path></svg>';
		const ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>';
		const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

		const rtf = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });
		const timeAgo = (iso) => {
			const diff = (Date.now() - new Date(iso).getTime()) / 1000;
			for (const [unit, secs] of [['year', 31536e3], ['month', 2592e3], ['week', 6048e2], ['day', 864e2], ['hour', 3600], ['minute', 60]]) {
				if (Math.abs(diff) >= secs) return rtf.format(-Math.round(diff / secs), unit);
			}
			return 'gerade eben';
		};

		const cardEl = (inner, href, label) =>
			`<li class="repo-card-wrap"><a class="repo-card" href="${href}" target="_blank" rel="noopener" aria-label="${label}">${inner}</a></li>`;

		const repoCard = (r) => cardEl(
			`<div class="repo-card__top"><span class="repo-card__icon">${ICON}</span>${r.fork ? '<span class="repo-card__badge">Fork</span>' : ''}</div>
			<h3 class="repo-card__name">${esc(r.name)}</h3>
			<p class="repo-card__desc">${esc(r.description || 'Noch ohne Beschreibung – aber öffentlich einsehbar.')}</p>
			${r.topics?.length ? `<ul class="repo-card__topics">${r.topics.slice(0, 3).map((t) => `<li class="repo-card__topic">${esc(t)}</li>`).join('')}</ul>` : ''}
			<div class="repo-card__meta">${r.language ? `<span class="repo-card__lang"><span class="repo-card__dot" style="--dot:${LANG[r.language] || '#7d8b88'}"></span>${esc(r.language)}</span>` : ''}<span class="repo-card__updated">${timeAgo(r.pushed_at || r.updated_at)}</span></div>
			<span class="repo-card__cta">Repo ansehen ${ARROW}</span>`,
			esc(r.html_url), `${esc(r.name)} auf GitHub ansehen`
		);

		const SKELETON = '<li class="repo-card-wrap"><div class="repo-card repo-card--skeleton" aria-hidden="true"><div class="repo-card__top"><span class="skel skel--icon"></span></div><span class="skel skel--title"></span><span class="skel skel--line"></span><span class="skel skel--line"></span><span class="skel skel--meta"></span></div></li>';

		const fallback = cardEl(
			`<div class="repo-card__top"><span class="repo-card__icon">${ICON}</span></div>
			<h3 class="repo-card__name">Ab zu GitHub</h3>
			<p class="repo-card__desc">Die Live-Vorschau lädt gerade nicht – schau dir die Repositories direkt auf GitHub an.</p>
			<span class="repo-card__cta" style="margin-top:auto">Zum GitHub-Profil ${ARROW}</span>`,
			PROFILE, 'Alle Repositories auf GitHub ansehen');

		const updateNav = () => {
			if (!prevBtn || !nextBtn) return;
			const max = track.scrollWidth - track.clientWidth - 2;
			prevBtn.disabled = max <= 0 || track.scrollLeft <= 2;
			nextBtn.disabled = max <= 0 || track.scrollLeft >= max;
		};

		// Arrow navigation
		const step = () => {
			const wrap = track.querySelector('.repo-card-wrap');
			return wrap ? wrap.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 30) : 360;
		};
		prevBtn?.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: smooth }));
		nextBtn?.addEventListener('click', () => track.scrollBy({ left: step(), behavior: smooth }));
		track.addEventListener('scroll', updateNav, { passive: true });
		addEventListener('resize', updateNav);

		// Drag to scroll (mouse only). Capture is deferred until a real drag so a
		// normal click still reaches the card link instead of the track.
		let down = false, moved = false, startX = 0, startScroll = 0, pid = 0;
		track.addEventListener('pointerdown', (e) => {
			if (e.pointerType !== 'mouse' || e.button) return;
			down = true; moved = false; pid = e.pointerId; startX = e.clientX; startScroll = track.scrollLeft;
		});
		track.addEventListener('pointermove', (e) => {
			if (!down) return;
			const dx = e.clientX - startX;
			if (!moved && Math.abs(dx) > 6) { moved = true; track.classList.add('is-dragging'); try { track.setPointerCapture(pid); } catch (_) { /* noop */ } }
			if (moved) track.scrollLeft = startScroll - dx;
		});
		const endDrag = () => { down = false; track.classList.remove('is-dragging'); };
		track.addEventListener('pointerup', endDrag);
		track.addEventListener('pointercancel', endDrag);
		track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

		// Load live data, with a skeleton placeholder and graceful fallback.
		track.innerHTML = SKELETON.repeat(4);
		fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed&direction=desc`, { headers: { Accept: 'application/vnd.github+json' } })
			.then((r) => { if (!r.ok) throw 0; return r.json(); })
			.then((repos) => {
				const list = (repos || []).filter((r) => !r.archived);
				track.innerHTML = list.length ? list.map(repoCard).join('') : fallback;
				updateNav();
			})
			.catch(() => { track.innerHTML = fallback; updateNav(); });
	};

	// ========================================
	// Initialize All
	// ========================================
	const init = () => {
		initLogoAnimReplay();
		initScrollReveal();
		initCounter();
		initMobileMenu();
		initImpressum();
		initYears();
		initRetroCounter();
		initEmailProtection();
		initRepos();
	};

	// Run on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
