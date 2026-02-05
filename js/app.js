/**
 * Wiredframe – Modern JavaScript
 * ES6+, no dependencies
 * Scroll animations & back-to-top handled by CSS Scroll-Driven Animations
 */
(() => {
	'use strict';

	// ========================================
	// Counter Animation
	// ========================================
	const animateCounter = (el, start, end, duration) => {
		let startTime = null;
		const diff = end - start;
		const easeOut = t => t * (2 - t);

		const step = (timestamp) => {
			if (!startTime) startTime = timestamp;
			const progress = Math.min((timestamp - startTime) / duration, 1);
			const current = Math.floor(start + diff * easeOut(progress));
			el.textContent = current.toLocaleString('de-DE');

			if (progress < 1) {
				requestAnimationFrame(step);
			}
		};

		requestAnimationFrame(step);
	};

	const initCounter = () => {
		const counter = document.querySelector('[data-counter]');
		if (!counter) return;

		const target = parseInt(counter.dataset.counter, 10);
		let started = false;

		const observer = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && !started) {
					started = true;
					animateCounter(counter, 100000, target, 36000);
					observer.disconnect();
				}
			});
		}, { threshold: 0.5 });

		observer.observe(counter);
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
