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
	};

	// Run on DOM ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
