/**
 * Wiredframe – wiredframe.de
 * Farbthemes würfeln
 *
 * Bei jedem Aufruf der Seite und bei jedem Tap auf das Signet entsteht ein
 * neues Farbpaar. Dass dabei nichts unlesbar werden kann, liegt an einer
 * einzigen Eigenschaft von OKLCH: dort ist L wahrnehmungsbezogen. Zwei
 * Farben mit gleichem L wirken gleich hell, egal welcher Farbton.
 *
 * Gewürfelt wird deshalb ausschließlich der Farbton. Helligkeit und
 * Sättigung stehen je Rolle fest, und damit ist der Kontrast keine Frage
 * des Glücks mehr, sondern eine Konstante: über den ganzen Farbkreis
 * gemessen liegt der schlechteste Wert bei 7,15 : 1, also über AAA.
 *
 * Die Datei läuft blockierend im <head>, denn sie muss vor dem ersten
 * Bild fertig sein. Sonst blitzt für einen Frame die Marke auf.
 */
(() => {
	'use strict';

	const wurzel = document.documentElement;

	// ----------------------------------------
	// OKLCH nach sRGB
	// ----------------------------------------
	// Der übliche Weg: Polarkoordinaten zurück nach OKLab, von dort über
	// die dritte Potenz in den LMS-Kegelraum und per Matrix nach linearem
	// sRGB. Die Gammakodierung kommt erst ganz am Ende.
	const linear = (L, C, H) => {
		const bogen = (H * Math.PI) / 180;
		const a = C * Math.cos(bogen);
		const b = C * Math.sin(bogen);

		const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
		const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
		const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;

		return [
			4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
		];
	};

	const imGamut = (rgb) => rgb.every((v) => v >= -0.001 && v <= 1.001);

	const hex = (rgb) => '#' + rgb.map((v) => {
		const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;
		return Math.round(Math.min(1, Math.max(0, g)) * 255).toString(16).padStart(2, '0');
	}).join('');

	// Nicht jeder Farbton verträgt bei gegebener Helligkeit dieselbe
	// Sättigung: Gelbgrün kann viel, Blau bei derselben Helligkeit wenig.
	// Darüber läge die Farbe außerhalb von sRGB und würde abgeschnitten.
	// Die Binärsuche findet die Kante, 95 Prozent davon sind das Ziel.
	const maxSaettigung = (L, H) => {
		let unten = 0, oben = 0.4;
		for (let i = 0; i < 20; i++) {
			const mitte = (unten + oben) / 2;
			if (imGamut(linear(L, mitte, H))) unten = mitte; else oben = mitte;
		}
		return unten;
	};

	const gedeckelt = (L, C, H) => Math.min(C, maxSaettigung(L, H) * 0.95);
	const farbe = (L, C, H) => hex(linear(L, gedeckelt(L, C, H), H));

	// Der WCAG-Kontrast zweier Farben, gerechnet auf linearem sRGB
	const helligkeit = (rgb) => {
		const k = rgb.map((v) => {
			const g = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(0, v), 1 / 2.4) - 0.055;
			const x = Math.min(1, Math.max(0, g));
			return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2];
	};

	const kontrast = (a, b) => {
		const A = helligkeit(a), B = helligkeit(b);
		return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05);
	};

	// ----------------------------------------
	// Die dunklen Rollen
	// ----------------------------------------
	// Der Grundton ist ein gedämpftes Dunkelgrau mit einem Hauch Farbton,
	// nicht die Farbe selbst. Eine große Fläche wirkt anders als ein
	// kleines Element: was auf einem Button knackig aussieht, wird über
	// eine halbe Section gezogen anstrengend.
	// const GRUND = [0.332, 0.026];
	const GRUND = [0.332, 0.026];

	// Text und Fläche werden hier bewusst auseinandergehalten.
	//
	// Der Fließtext ist echtes Grau, Sättigung null. Wenn Grund und Akzent
	// eng beieinander liegen, ist er das Einzige, was die Seite noch vor
	// der Monochromie bewahrt. Farbe tragen nur Überschriften, der Zähler
	// und die Bedienelemente.
	//
	// Die hellen Flächen dagegen bekommen einen Hauch Farbton mit, gerade
	// so viel wie Off-White gegenüber Weiß. Reines Weiß neben einem
	// getönten Dunkel sähe aus, als gehörten die beiden nicht zusammen.
	const ROLLEN = [
		['--color-text', 0.87, 0],       // Fließtext auf Dunkel, neutral
		['--color-white', 0.99, 0.006],  // helle Panels, Off-White
		['--color-canvas', 0.95, 0.012]  // Seitengrund hinter den Panels
	];

	// ----------------------------------------
	// Der Akzent
	// ----------------------------------------
	// Feste Helligkeit, gedeckelte Sättigung. Nicht der sattest mögliche
	// Ton also, sondern ein gedämpfter: neben einem Grund, der selbst
	// schon aufgehellt ist, wirkt die volle Sättigung schrill. Die beiden
	// Werte sind aus der Vorlage zurückgerechnet.
	//
	// Bei dieser Helligkeit hält der Akzent gegen den Grund von sich aus
	// rund 4,5 : 1, also die Schwelle für normale Textgröße und nicht nur
	// die 3 : 1 für Schaugrößen. Der Sockel steht deshalb auf 4,5: für
	// die wenigen Farbtöne, die knapp darunter lägen, wandert der Akzent
	// eine Spur nach oben, bis er sie hält.
	//const AKZENT = [0.72, 0.18];
	const AKZENT = [0.9, 0.18];
	// 4.6 statt 4.5: gerechnet wird in Gleitkomma, ausgegeben in acht Bit
	// je Kanal, und diese Rundung kostet am Ende gut ein Hundertstel.
	const SOCKEL = 4.6;

	const akzent = (H, grundLinear) => {
		// Nur falls ein Farbton den Sockel bei dieser Helligkeit reißt,
		// wandert er nach oben, bis er ihn hält.
		for (let L = AKZENT[0]; L <= 0.92; L += 0.01) {
			const C = gedeckelt(L, AKZENT[1], H);
			if (kontrast(linear(L, C, H), grundLinear) >= SOCKEL) return { L, C };
		}
		return { L: 0.92, C: gedeckelt(0.92, AKZENT[1], H) };
	};

	// Der Abstand zwischen Grundton und Akzent, und zwar bewusst klein.
	// Weite Abstände sind rechnerisch genauso kontrastreich, wirken aber
	// zusammenhanglos: Marineblau mit Limette liest sich wie zwei Themes
	// übereinander, Aubergine mit Koralle wie eines. Die Marke selbst
	// liegt bei 70 Grad, das ist hier inzwischen das obere Ende und kommt
	// nicht mehr vor: die Paare sind nah beieinander, fast monochrom.
	const WINKEL = [20, -20, 30, -30, 40, -40, 50, -50];

	const meta = document.querySelector('meta[name="theme-color"]');
	const suche = new URLSearchParams(location.search);
	const erzwungenerTon = suche.has('ton') ? Number(suche.get('ton')) : null;
	const erzwungenerWinkel = suche.has('winkel') ? Number(suche.get('winkel')) : null;

	// ----------------------------------------
	// Die Tabuzone
	// ----------------------------------------
	// Rot bleibt draußen, Rosé nicht. In OKLCH liegt der eigentliche
	// Rotbereich zwischen 5 und 48 Grad, und die Grenzen sind an den
	// Farben selbst abgelesen: bei 4 steht noch ein Rosenrot, bei 20 ein
	// Feuerwehrrot, bei 43 ein Korallton, und erst ab 49 wird daraus ein
	// Orange. Alles jenseits von 315 bis herunter zu 4 bleibt frei, dort
	// liegen Violett, Magenta und das Rosé.
	//
	// Die Sperre gilt für beide Töne. Der Grundton ist zwar so flach, dass
	// er kaum noch Farbe zeigt, aber über eine ganze Section gezogen
	// bleibt auch ein Hauch Rot ein Hauch Rot.
	const TABU = [5, 48];
	const verboten = (ton) => ton >= TABU[0] && ton <= TABU[1];

	let letzterTon = null;

	// Gewürfelt wird das Paar am Stück, denn beide Bedingungen hängen
	// zusammen: kein Ton in der Tabuzone, und der Grundton muss Abstand
	// zum vorigen halten, sonst fühlt sich ein Tap wie nichts an.
	const wurf = () => {
		if (erzwungenerTon !== null || erzwungenerWinkel !== null) {
			return {
				grund: erzwungenerTon !== null ? ((erzwungenerTon % 360) + 360) % 360 : Math.random() * 360,
				winkel: erzwungenerWinkel !== null ? erzwungenerWinkel : WINKEL[(Math.random() * WINKEL.length) | 0]
			};
		}
		let letzter;
		for (let versuch = 0; versuch < 400; versuch++) {
			const grund = Math.random() * 360;
			const winkel = WINKEL[(Math.random() * WINKEL.length) | 0];
			letzter = { grund, winkel };
			if (verboten(grund) || verboten((grund + winkel + 360) % 360)) continue;
			if (letzterTon !== null && Math.abs(((grund - letzterTon + 540) % 360) - 180) < 60) continue;
			return letzter;
		}
		return letzter; // kommt praktisch nie vor, ist aber besser als nichts
	};

	const wfTheme = () => {
		const { grund, winkel } = wurf();
		const tonAkzent = (grund + winkel + 360) % 360;

		const grundLinear = linear(GRUND[0], gedeckelt(GRUND[0], GRUND[1], grund), grund);
		const a = akzent(tonAkzent, grundLinear);

		const grundfarbe = farbe(GRUND[0], GRUND[1], grund);
		wurzel.style.setProperty('--color-primary', grundfarbe);
		ROLLEN.forEach(([token, L, C]) => wurzel.style.setProperty(token, farbe(L, C, grund)));

		wurzel.style.setProperty('--color-accent', farbe(a.L, a.C, tonAkzent));
		// Die Hover-Variante ist dieselbe Farbe, eine Spur tiefer
		wurzel.style.setProperty('--color-accent-strong', farbe(a.L - 0.04, a.C, tonAkzent));

		// Schrift auf gefüllten Akzentflächen. Der Grundton reicht dafür
		// nicht mehr: er liegt inzwischen bei L 0.33, der Akzent bei 0.60
		// bis 0.92, eine Beschriftung darauf wäre zu blass. Diese Tiefe
		// steht deutlich darunter und trägt den Farbton des Akzents, damit
		// sie auf ihm nicht wie ein Fremdkörper sitzt.
		wurzel.style.setProperty('--color-ink', farbe(0.18, 0.04, tonAkzent));

		// Die Browserleiste auf dem Handy zieht mit
		if (meta) meta.content = grundfarbe;

		letzterTon = grund;
		return { grund: Math.round(grund), winkel, akzentL: +a.L.toFixed(2), akzentC: +a.C.toFixed(3) };
	};

	wfTheme();
	window.wfTheme = wfTheme;

	// Die Überblendung wird erst nach dem ersten Bild scharfgeschaltet.
	// Sonst würde der Seitenaufbau selbst als Farbverlauf ablaufen.
	requestAnimationFrame(() => wurzel.classList.add('theme-blende'));
})();
