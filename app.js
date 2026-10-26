/* ==========================================================================
   JC DISEÑO — Landing premium · app.js
   Vanilla JS, sin dependencias. Un único bucle rAF (motor de scroll) alimenta
   todos los efectos ligados al scroll con amortiguación (sensación "slow motion").
   Índice:
   01 Utilidades · 02 WhatsApp · 03 Preloader · 04 Texto dividido · 05 Reveals
   06 Motor de scroll y módulos · 07 Hero (partículas, pila 3D) · 08 Interacciones
   09 Visor de imágenes · 10 Estilos · 11 FAQ · 12 Formulario · 13 Arranque
   ========================================================================== */
(() => {
    'use strict';

    /* ───────────── 01 · UTILIDADES ───────────── */
    const WA_NUMBER = '525652398266'; // +52 56 5239 8266
    const root = document.documentElement;
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
    const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
    const lerp = (a, b, t) => a + (b - a) * t;
    const pad = (n, l = 2) => String(n).padStart(l, '0');
    const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (reduced) root.classList.add('is-static');

    const waLink = msg => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

    /* ───────────── 02 · WHATSAPP ───────────── */
    // Cada CTA declara su mensaje en data-wa; aquí se convierte en enlace real.
    function initWhatsApp() {
        $$('[data-wa]').forEach(a => {
            a.href = waLink(a.dataset.wa);
            a.target = '_blank';
            a.rel = 'noopener';
        });
        const float = $('#waFloat');
        if (float) {
            setTimeout(() => {
                float.classList.add('show-tip');
                setTimeout(() => float.classList.remove('show-tip'), 6500);
            }, 6000);
        }
    }

    /* ───────────── 03 · PRELOADER ───────────── */
    function initPreloader(onDone) {
        const pre = $('#preloader');
        if (!pre) { root.classList.remove('is-loading'); root.classList.add('is-ready'); onDone(); return; }

        const count = $('#plCount'), bar = $('#plBar'), arc = $('#plArc'), msg = $('#plMsg'), ring = $('.pl-ring', pre);
        const CIRC = 628.3;
        const steps = [[0, 'Midiendo tu espacio…'], [.3, 'Afinando acabados…'], [.62, 'Puliendo cada detalle…'], [.92, 'Calidad garantizada ✓']];
        const MIN = reduced ? 350 : 2700;
        const t0 = performance.now();
        let loaded = document.readyState === 'complete';
        let lastMsg = -1, finished = false;

        window.addEventListener('load', () => { loaded = true; }, { once: true });

        function finish() {
            if (finished) return;
            finished = true;
            pre.classList.add('is-done');
            setTimeout(() => {
                root.classList.remove('is-loading');
                root.classList.add('is-ready');
                onDone();
            }, reduced ? 0 : 420);
            setTimeout(() => pre.remove(), reduced ? 50 : 1500);
        }

        function frame(now) {
            if (finished) return;
            const elapsed = now - t0;
            if (elapsed > 9000) loaded = true; // seguro anti-bloqueo
            let p = easeOut(clamp(elapsed / MIN));
            if (!loaded) p = Math.min(p, .92);

            count.textContent = pad(Math.round(p * 100), 3);
            bar.style.transform = `scaleX(${p})`;
            arc.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(1);
            ring.style.setProperty('--a', (p * 360).toFixed(1));
            for (let i = steps.length - 1; i >= 0; i--) {
                if (p >= steps[i][0]) { if (i !== lastMsg) { msg.textContent = steps[i][1]; lastMsg = i; } break; }
            }

            if (p >= 1 && loaded) { finish(); return; }
            requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }

    /* ───────────── 04 · TEXTO DIVIDIDO POR PALABRAS ───────────── */
    // Envuelve cada palabra en una máscara para animarla desde abajo.
    // Las clases de elementos internos (p. ej. .grad) pasan a cada palabra.
    function splitWords(el) {
        let idx = 0;
        const walk = (node, inherited) => {
            Array.from(node.childNodes).forEach(child => {
                if (child.nodeType === 3) {
                    const frag = document.createDocumentFragment();
                    child.textContent.split(/(\s+)/).forEach(part => {
                        if (!part) return;
                        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
                        const w = document.createElement('span');
                        const wi = document.createElement('span');
                        w.className = 'w';
                        wi.className = ('wi ' + inherited).trim();
                        wi.style.setProperty('--wd', idx++);
                        wi.textContent = part;
                        w.appendChild(wi);
                        frag.appendChild(w);
                    });
                    child.replaceWith(frag);
                } else if (child.nodeType === 1 && child.tagName !== 'BR') {
                    walk(child, (inherited + ' ' + child.className).trim());
                    child.replaceWith(...child.childNodes);
                }
            });
        };
        walk(el, '');
    }

    /* ───────────── 05 · REVEALS AL ENTRAR EN PANTALLA ───────────── */
    function initReveals() {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                const el = e.target;
                el.classList.add('is-in');
                io.unobserve(el);
                // Al terminar, se libera el atributo para no interferir con hover/transform propios
                if (el.hasAttribute('data-reveal')) {
                    const delay = (parseFloat(getComputedStyle(el).getPropertyValue('--i')) || 0) * 120;
                    setTimeout(() => el.removeAttribute('data-reveal'), 1800 + delay);
                }
            });
        }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
        $$('[data-reveal], [data-split]').forEach(el => io.observe(el));

        // Contadores
        const cio = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                cio.unobserve(e.target);
                const el = e.target, target = +el.dataset.count, padTo = +el.dataset.pad || 0, suffix = el.dataset.suffix || '';
                const t0 = performance.now(), dur = 1800;
                const tick = now => {
                    const t = clamp((now - t0) / dur);
                    const v = Math.round(target * easeOut(t));
                    el.textContent = (padTo ? pad(v, padTo) : v) + suffix;
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            });
        }, { threshold: .6 });
        $$('[data-count]').forEach(el => cio.observe(el));

        // Planos técnicos: se dibujan al entrar
        const bio = new IntersectionObserver(entries => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('bp--on'); bio.unobserve(e.target); } });
        }, { threshold: .3 });
        $$('.bp').forEach(svg => bio.observe(svg));
    }

    /* ───────────── 06 · MOTOR DE SCROLL ───────────── */
    // Un solo bucle rAF: lee scroll una vez y ejecuta los módulos. Cada módulo puede
    // exponer measure() (cachear geometría) y update(state) (escribir estilos).
    const S = { y: 0, vh: innerHeight, vw: innerWidth, vel: 0, dt: .016 };
    const mods = [];
    const damp = (s, speed) => 1 - Math.exp(-s.dt * speed); // factor de suavizado independiente del framerate

    function measureAll() {
        S.vh = innerHeight; S.vw = innerWidth;
        mods.forEach(m => m.measure && m.measure());
    }

    function startLoop() {
        let last = performance.now(), lastY = window.scrollY;
        const loop = now => {
            S.dt = Math.min(.064, (now - last) / 1000) || .016;
            last = now;
            S.y = window.scrollY;
            S.vel = lerp(S.vel, (S.y - lastY) / (S.dt * 60), .18);
            lastY = S.y;
            for (let i = 0; i < mods.length; i++) mods[i].update && mods[i].update(S);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    /* — Barra de progreso + navegación — */
    function modNav() {
        const nav = $('#nav'), prog = $('#scrollProgress'), menu = $('#menu');
        let prevY = 0, hidden = false, scrolled = false;
        mods.push({
            update(s) {
                const max = root.scrollHeight - s.vh;
                prog.style.setProperty('--sp', max > 0 ? (s.y / max).toFixed(4) : 0);
                const sc = s.y > 40;
                if (sc !== scrolled) { scrolled = sc; nav.classList.toggle('is-scrolled', sc); }
                const dy = s.y - prevY;
                if (Math.abs(dy) > 3) {
                    const hide = dy > 0 && s.y > s.vh * .6 && !menu.classList.contains('is-open');
                    if (hide !== hidden) { hidden = hide; nav.classList.toggle('is-hidden', hide); }
                    prevY = s.y;
                }
            }
        });

        // Enlace activo según la sección en pantalla
        const links = $$('.nav__links a');
        const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                const a = map.get(e.target.id);
                if (a && e.isIntersecting) { links.forEach(l => l.classList.remove('is-active')); a.classList.add('is-active'); }
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        map.forEach((_, id) => { const sec = document.getElementById(id); if (sec) io.observe(sec); });
    }

    /* — Hero: parallax de salida — */
    function modHero() {
        const hero = $('[data-hero]'), inner = $('#heroInner'), foot = $('.hero__foot', hero);
        if (!hero || reduced) return;
        mods.push({
            update(s) {
                if (s.y > s.vh * 1.2) return;
                const p = clamp(s.y / (s.vh * .9));
                // Contenido y franja inferior se desplazan juntos (más lento que el scroll) y se desvanecen
                const t = `translate3d(0, ${(s.y * .14).toFixed(1)}px, 0)`, o = (1 - p * .95).toFixed(3);
                inner.style.transform = t; inner.style.opacity = o;
                if (foot) {
                    if (!foot._free && s.y > 2) { foot.style.transition = 'none'; foot._free = true; } // libera la transición de entrada
                    foot.style.transform = t; foot.style.opacity = o;
                }
            }
        });
    }

    /* — Marquee con velocidad ligada al scroll — */
    function modMarquee() {
        const rows = $$('[data-marquee]').map(row => {
            const inner = $('.marquee__inner', row);
            return { inner, dir: +row.dataset.marquee, x: 0, w: 0, seq: inner.innerHTML };
        });
        if (!rows.length || reduced) return;
        mods.push({
            measure() {
                rows.forEach(r => {
                    r.inner.innerHTML = r.seq;
                    r.w = r.inner.scrollWidth;
                    let guard = 0;
                    while (r.inner.scrollWidth < S.vw * 2 + r.w && guard++ < 12) r.inner.insertAdjacentHTML('beforeend', r.seq);
                    if (r.dir > 0 && r.x === 0) r.x = -r.w;
                });
            },
            update(s) {
                rows.forEach(r => {
                    r.x += r.dir * (.7 + s.vel * .45) * s.dt * 60;
                    while (r.x <= -r.w) r.x += r.w;
                    while (r.x > 0) r.x -= r.w;
                    r.inner.style.transform = `translate3d(${r.x.toFixed(1)}px,0,0)`;
                });
            }
        });
    }

    /* — Revelado de imagen: la foto se abre en grande con el scroll — */
    function modExpand() {
        const sec = $('[data-expand]');
        if (!sec || reduced) return;
        const pin = $('.expand__pin', sec), intro = $('#expandIntro'), cap = $('#expandCaption'), read = $('#expandRead');
        let top = 0, h = 0, pinH = 0, cur = 0, lastRead = -1, live = false;
        mods.push({
            measure() { top = sec.getBoundingClientRect().top + window.scrollY; h = sec.offsetHeight; pinH = pin.offsetHeight; },
            update(s) {
                if (s.y < top - s.vh || s.y > top + h) return;
                const p = clamp((s.y - top) / Math.max(1, h - pinH));
                cur = lerp(cur, clamp(p / .62), damp(s, 6));
                const e = easeIO(cur);
                pin.style.setProperty('--e', e.toFixed(4));

                intro.style.setProperty('--io', clamp(1 - e / .42).toFixed(3));
                intro.style.setProperty('--iy', (-e * 70).toFixed(1) + 'px');
                intro.style.setProperty('--is', (1 + e * .22).toFixed(3));

                const cp = clamp((p - .68) / .2);
                cap.style.setProperty('--co', cp.toFixed(3));
                cap.style.setProperty('--cy', ((1 - cp) * 34).toFixed(1) + 'px');
                const isLive = cp > .55;
                if (isLive !== live) { live = isLive; cap.classList.toggle('is-live', isLive); }

                const pct = Math.round(e * 100);
                if (pct !== lastRead) { lastRead = pct; read.textContent = 'ESCANEO ' + pad(pct, 3) + '%'; }
            }
        });
    }

    /* — Manifiesto: el texto se enciende palabra por palabra — */
    function modManifesto() {
        const el = $('#manifText');
        if (!el) return;
        const words = el.textContent.trim().split(/\s+/);
        el.textContent = '';
        const spans = words.map((w, i) => {
            const s = document.createElement('span');
            s.className = 'mw';
            s.textContent = w;
            el.appendChild(s);
            if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
            return s;
        });
        if (reduced) return;
        const n = spans.length, last = new Array(n).fill(-1);
        let top = 0, h = 0, cur = 0;
        mods.push({
            measure() { const r = el.getBoundingClientRect(); top = r.top + window.scrollY; h = r.height; },
            update(s) {
                if (s.y < top - s.vh || s.y > top + h + s.vh) return;
                const start = top - s.vh * .82, end = top + h - s.vh * .38;
                const p = clamp((s.y - start) / Math.max(1, end - start));
                cur = lerp(cur, p, damp(s, 8));
                const f = cur * (n + 3);
                for (let i = 0; i < n; i++) {
                    const v = Math.round((.16 + .84 * clamp(f - i)) * 100) / 100;
                    if (v !== last[i]) { last[i] = v; spans[i].style.opacity = v; }
                }
            }
        });
    }

    /* — Tarjetas de servicio apiladas (escala + oscurecimiento) — */
    function modStack() {
        const cards = $$('[data-svc]');
        if (cards.length < 2 || reduced) return;
        const mq = matchMedia('(min-width: 900px) and (min-height: 700px)');
        const stack = $('#stack');
        let stickyTops = [], active = false;
        const reset = () => cards.forEach(c => { c.style.transform = ''; c.style.removeProperty('--dim'); });
        mods.push({
            measure() {
                stickyTops = cards.map(c => parseFloat(getComputedStyle(c).top) || 0);
                if (!mq.matches && active) { active = false; reset(); }
            },
            update() {
                if (!mq.matches) { if (active) { active = false; reset(); } return; }
                const sr = stack.getBoundingClientRect();
                if (sr.bottom < 0 || sr.top > S.vh) return;
                active = true;
                for (let i = 0; i < cards.length - 1; i++) {
                    const rc = cards[i].getBoundingClientRect(), rn = cards[i + 1].getBoundingClientRect();
                    const t = clamp(1 - (rn.top - stickyTops[i]) / rc.height);
                    cards[i].style.transform = `scale(${(1 - .055 * t).toFixed(4)})`;
                    cards[i].style.setProperty('--dim', (t * .62).toFixed(3));
                }
            }
        });
    }

    /* — Galería de proyectos: scroll vertical → desplazamiento horizontal — */
    function modWork() {
        const sec = $('[data-hscroll]');
        if (!sec) return;
        const total = $$('.wcard[data-title]', sec).length;
        $('#workTotal').textContent = pad(total);
        if (reduced) return;
        const pin = $('.work__pin', sec), track = $('#workTrack'), bar = $('#workBar'), now = $('#workNow');
        const cards = $$('.wcard', track).map(el => ({ el, img: $('.wcard__img', el), left: 0, w: 0 }));
        let top = 0, range = 0, cur = 0, lastIdx = -1;
        mods.push({
            measure() {
                // La altura de la sección = recorrido horizontal + una pantalla fija.
                // No se resetea antes de medir: evita saltos de scroll al re-medir.
                range = Math.max(0, track.scrollWidth - pin.clientWidth);
                sec.style.height = (range + pin.offsetHeight) + 'px';
                top = sec.getBoundingClientRect().top + window.scrollY;
                const tr = track.getBoundingClientRect(); // posiciones relativas al track (el transform afecta a ambos por igual)
                cards.forEach(c => { const r = c.el.getBoundingClientRect(); c.left = r.left - tr.left; c.w = r.width; });
            },
            update(s) {
                if (s.y < top - s.vh || s.y > top + range + s.vh) return;
                const p = clamp((s.y - top) / Math.max(1, range));
                cur = lerp(cur, p, damp(s, 5.5));
                const x = cur * range;
                track._x = x;
                track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`;
                bar.style.setProperty('--w', cur.toFixed(4));

                const mid = S.vw / 2;
                let best = 0, bestD = Infinity;
                cards.forEach((c, i) => {
                    const center = c.left + c.w / 2 - x;
                    const rel = (center - mid) / S.vw;
                    if (Math.abs(rel) < 1.3 && c.img) c.img.style.setProperty('--px', (-clamp(rel, -1, 1) * c.w * .1).toFixed(1) + 'px');
                    const d = Math.abs(center - mid);
                    if (i < total && d < bestD) { bestD = d; best = i; }
                });
                if (best !== lastIdx) { lastIdx = best; now.textContent = pad(best + 1); }
            }
        });
    }

    /* — Proceso: línea que se llena + pasos que se activan — */
    function modProcess() {
        const wrap = $('#steps'), fill = $('#stepsFill'), steps = $$('[data-step]');
        if (!wrap) return;
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                const on = e.isIntersecting || e.boundingClientRect.top < 0;
                e.target.classList.toggle('is-on', on);
            });
        }, { rootMargin: '0px 0px -38% 0px' });
        steps.forEach(s => io.observe(s));
        if (reduced) return;
        let top = 0, h = 0, cur = 0;
        mods.push({
            measure() { const r = wrap.getBoundingClientRect(); top = r.top + window.scrollY; h = r.height; },
            update(s) {
                if (s.y < top - s.vh || s.y > top + h + s.vh) return;
                const p = clamp((s.y + s.vh * .62 - top) / Math.max(1, h));
                cur = lerp(cur, p, damp(s, 8));
                fill.style.setProperty('--f', cur.toFixed(4));
            }
        });
    }

    /* ───────────── 07 · HERO: PARTÍCULAS Y PILA 3D ───────────── */
    function initEmbers() {
        const cv = $('#embers'), hero = $('[data-hero]');
        if (!cv || !hero || reduced) return;
        const ctx = cv.getContext('2d');
        const mouse = { x: -9999, y: -9999 };
        let w = 0, h = 0, parts = [], raf = 0, running = false;

        const sprite = (r, g, b) => {
            const c = document.createElement('canvas'); c.width = c.height = 64;
            const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
            gr.addColorStop(0, `rgba(${r},${g},${b},1)`);
            gr.addColorStop(.28, `rgba(${r},${g},${b},.5)`);
            gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
            x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
            return c;
        };
        const sprites = [sprite(255, 84, 0), sprite(255, 138, 20), sprite(255, 196, 64)];

        const spawn = initial => ({
            x: Math.random() * w, y: initial ? Math.random() * h : h + 24,
            r: 2.5 + Math.random() * 9, vy: -(.18 + Math.random() * .6), vx: (Math.random() - .5) * .22,
            ph: Math.random() * 6.283, sp: .012 + Math.random() * .02, a: .3 + Math.random() * .7,
            s: sprites[(Math.random() * 3) | 0]
        });

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            w = cv.clientWidth; h = cv.clientHeight;
            cv.width = w * dpr; cv.height = h * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const n = clamp(Math.round(w * h / (w < 700 ? 12000 : 8200)), 34, 150);
            parts = Array.from({ length: n }, () => spawn(true));
        }

        function draw() {
            ctx.clearRect(0, 0, w, h);
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < parts.length; i++) {
                const p = parts[i];
                p.ph += p.sp; p.x += p.vx + Math.sin(p.ph) * .3; p.y += p.vy;
                const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
                if (d2 < 24000) { const d = Math.sqrt(d2) || 1, f = (1 - d / 155) * 1.7; p.x += dx / d * f; p.y += dy / d * f; }
                if (p.y < -30 || p.x < -30 || p.x > w + 30) { parts[i] = spawn(false); continue; }
                const fade = clamp(p.y / (h * .25)) * clamp((h - p.y) / (h * .1) + .4);
                ctx.globalAlpha = p.a * (.6 + Math.sin(p.ph * 3) * .4) * fade;
                ctx.drawImage(p.s, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
            }
            // Constelación de líneas entre partículas cercanas (solo escritorio)
            if (w >= 900) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.lineWidth = .7;
                for (let i = 0; i < parts.length; i++) {
                    for (let j = i + 1; j < parts.length; j++) {
                        const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
                        if (d2 < 9000) {
                            ctx.globalAlpha = (1 - d2 / 9000) * .2;
                            ctx.strokeStyle = '#ff9a2e';
                            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
                        }
                    }
                }
            }
            ctx.globalAlpha = 1;
            raf = requestAnimationFrame(draw);
        }

        const start = () => { if (!running) { running = true; raf = requestAnimationFrame(draw); } };
        const stop = () => { running = false; cancelAnimationFrame(raf); };

        resize();
        new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop()), { threshold: 0 }).observe(hero);
        document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
        let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
        if (finePointer) {
            hero.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
            hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
        }
    }

    function initHeroStack() {
        const cards = $$('#heroStack .hv-card');
        if (cards.length < 3 || reduced) return;
        const order = [0, 1, 2];
        const apply = () => order.forEach((ci, pos) => { cards[ci].dataset.pos = pos; });
        let visible = true;
        new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe($('#heroStack'));
        setInterval(() => {
            if (document.hidden || !visible || !root.classList.contains('is-ready')) return;
            order.push(order.shift());
            apply();
        }, 4300);
    }

    /* ───────────── 08 · INTERACCIONES ───────────── */
    function initMenu() {
        const burger = $('#burger'), menu = $('#menu');
        if (!burger || !menu) return;
        $$('.menu__nav a', menu).forEach((a, i) => a.style.setProperty('--n', i));
        const set = open => {
            menu.classList.toggle('is-open', open);
            menu.setAttribute('aria-hidden', String(!open));
            burger.setAttribute('aria-expanded', String(open));
            burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
            root.classList.toggle('is-locked', open);
        };
        burger.addEventListener('click', () => set(!menu.classList.contains('is-open')));
        menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
        addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) set(false); });
        matchMedia('(min-width: 960px)').addEventListener('change', e => { if (e.matches) set(false); });
    }

    function initBlueprints() {
        $$('.bp').forEach(svg => {
            $$('.bp__g > *', svg).forEach((el, i) => { el.setAttribute('pathLength', '1'); el.style.setProperty('--k', i); });
            svg.classList.add('bp--ready');
        });
    }

    function initPointerFx() {
        if (!finePointer) return;

        // Foco de luz que sigue al cursor (hero + tarjetas bento)
        const hero = $('[data-hero]'), spot = $('#heroSpot');
        if (hero && spot) {
            hero.addEventListener('pointermove', e => {
                const r = hero.getBoundingClientRect();
                spot.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                spot.style.setProperty('--my', (e.clientY - r.top) + 'px');
            }, { passive: true });
        }
        $$('[data-spot]').forEach(t => t.addEventListener('pointermove', e => {
            const r = t.getBoundingClientRect();
            t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
            t.style.setProperty('--my', (e.clientY - r.top) + 'px');
        }, { passive: true }));

        // Inclinación 3D de la pila del hero
        const tilt = $('[data-tilt]');
        if (tilt) {
            tilt.addEventListener('pointermove', e => {
                const r = tilt.getBoundingClientRect();
                tilt.style.setProperty('--ry', (((e.clientX - r.left) / r.width - .5) * 14).toFixed(2) + 'deg');
                tilt.style.setProperty('--rx', ((-((e.clientY - r.top) / r.height - .5)) * 12).toFixed(2) + 'deg');
            }, { passive: true });
            tilt.addEventListener('pointerleave', () => { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); });
        }

        // Botones magnéticos
        $$('[data-magnetic]').forEach(b => {
            b.addEventListener('pointermove', e => {
                const r = b.getBoundingClientRect();
                const x = (e.clientX - (r.left + r.width / 2)) * .22, y = (e.clientY - (r.top + r.height / 2)) * .3;
                b.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
            });
            b.addEventListener('pointerleave', () => { b.style.transform = ''; });
        });

        // Cursor personalizado
        const c = $('#cursor'), label = $('#cursorLabel');
        if (!c) return;
        let tx = -100, ty = -100, x = tx, y = ty;
        addEventListener('pointermove', e => {
            tx = e.clientX; ty = e.clientY;
            c.classList.add('is-on');
            const lbl = e.target.closest && e.target.closest('[data-cursor]');
            const link = e.target.closest && e.target.closest('a, button, [data-magnetic], input, select, textarea');
            c.classList.toggle('is-label', !!lbl);
            c.classList.toggle('is-link', !!link && !lbl);
            if (lbl) label.textContent = lbl.dataset.cursor;
        }, { passive: true });
        document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
        mods.push({
            update() {
                x = lerp(x, tx, .22); y = lerp(y, ty, .22);
                c.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
            }
        });
    }

    /* ───────────── 09 · VISOR DE IMÁGENES (apertura FLIP) ───────────── */
    function initLightbox() {
        const lb = $('#lightbox'), img = $('#lbImg');
        const cards = $$('.wcard[data-title]');
        if (!lb || !cards.length) return;
        const idxEl = $('#lbIdx'), titleEl = $('#lbTitle'), descEl = $('#lbDesc'), cta = $('#lbCta');
        const items = cards.map(card => {
            const im = $('img', card);
            return { card, btn: $('.wcard__btn', card), src: im.currentSrc || im.src, alt: im.alt, title: card.dataset.title, desc: card.dataset.desc, ar: (+im.getAttribute('width')) / (+im.getAttribute('height')) };
        });
        let cur = -1, busy = false, isOpen = false, lastFocus = null;

        const targetRect = ar => {
            const vw = innerWidth, vh = innerHeight;
            const padX = vw < 700 ? 14 : 90, topPad = 76, bottomPad = vw < 800 ? 210 : 140;
            const maxW = vw - padX * 2, maxH = Math.max(160, vh - topPad - bottomPad);
            let w = maxW, h = w / ar;
            if (h > maxH) { h = maxH; w = h * ar; }
            return { left: (vw - w) / 2, top: topPad + (maxH - h) / 2, width: w, height: h };
        };
        const setRect = r => { img.style.left = r.left + 'px'; img.style.top = r.top + 'px'; img.style.width = r.width + 'px'; img.style.height = r.height + 'px'; };
        const px = r => ({ left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });

        function fill(i) {
            const it = items[i];
            cur = i;
            img.src = it.src; img.alt = it.alt;
            idxEl.textContent = `${pad(i + 1)} / ${pad(items.length)}`;
            titleEl.textContent = it.title;
            descEl.textContent = it.desc;
            cta.href = waLink(`Hola JC Diseño, vi "${it.title}" en su página y quiero un proyecto así.`);
        }

        // El cursor personalizado se resetea al abrir/cerrar (hasta el siguiente movimiento)
        const resetCursor = () => { const c = $('#cursor'); if (c) c.classList.remove('is-label', 'is-link'); };

        function open(i) {
            if (isOpen) return;
            isOpen = true; lastFocus = document.activeElement;
            resetCursor();
            lb.hidden = false;
            root.classList.add('is-locked');
            fill(i);
            const from = items[i].btn.getBoundingClientRect();
            const to = targetRect(items[i].ar);
            setRect(to);
            img.getAnimations().forEach(a => a.cancel());
            img.animate([{ ...px(from), borderRadius: '24px' }, { ...px(to), borderRadius: '22px' }],
                { duration: reduced ? 1 : 850, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
            requestAnimationFrame(() => lb.classList.add('is-open'));
            setTimeout(() => $('.lb__close', lb).focus({ preventScroll: true }), 60);
        }

        function close() {
            if (!isOpen) return;
            isOpen = false;
            resetCursor();
            lb.classList.remove('is-open');
            const from = img.getBoundingClientRect();
            const to = items[cur].btn.getBoundingClientRect();
            const visible = to.right > 0 && to.left < innerWidth && to.bottom > 0 && to.top < innerHeight;
            img.getAnimations().forEach(a => a.cancel());
            const a = visible
                ? img.animate([{ ...px(from), borderRadius: '22px' }, { ...px(to), borderRadius: '24px' }], { duration: reduced ? 1 : 700, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' })
                : img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
            a.finished.then(() => {
                lb.hidden = true;
                a.cancel();
                root.classList.remove('is-locked');
                if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
            }).catch(() => { });
        }

        async function go(dir) {
            if (busy || !isOpen) return;
            busy = true;
            const next = (cur + dir + items.length) % items.length;
            const out = img.animate([{ opacity: 1, transform: 'translateX(0)' }, { opacity: 0, transform: `translateX(${-dir * 70}px)` }], { duration: 260, easing: 'ease-in', fill: 'forwards' });
            await out.finished.catch(() => { });
            fill(next);
            setRect(targetRect(items[next].ar));
            try { await img.decode(); } catch (_) { /* imagen en caché o sin decode */ }
            const inn = img.animate([{ opacity: 0, transform: `translateX(${dir * 70}px)` }, { opacity: 1, transform: 'translateX(0)' }], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' });
            out.cancel();
            await inn.finished.catch(() => { });
            busy = false;
        }

        items.forEach((it, i) => it.btn.addEventListener('click', () => open(i)));
        $$('[data-lb-close]', lb).forEach(b => b.addEventListener('click', close));
        img.addEventListener('click', close);
        $('#lbPrev').addEventListener('click', () => go(-1));
        $('#lbNext').addEventListener('click', () => go(1));

        addEventListener('keydown', e => {
            if (!isOpen) return;
            if (e.key === 'Escape') close();
            else if (e.key === 'ArrowRight') go(1);
            else if (e.key === 'ArrowLeft') go(-1);
            else if (e.key === 'Tab') { // atrapa el foco dentro del visor
                const f = $$('button, a[href]', lb).filter(el => el.offsetParent !== null || el.classList.contains('lb__btn'));
                if (!f.length) return;
                const first = f[0], last = f[f.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        });
        // Gesto de deslizar en táctil
        let sx = 0, sy = 0;
        lb.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
        lb.addEventListener('pointerup', e => {
            const dx = e.clientX - sx, dy = e.clientY - sy;
            if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) go(dx < 0 ? 1 : -1);
        });
        addEventListener('resize', () => { if (isOpen && !busy) setRect(targetRect(items[cur].ar)); });
    }

    /* ───────────── 10 · ESTILOS (pestañas con autoplay) ───────────── */
    function initStyles() {
        const sec = $('[data-styles]');
        if (!sec) return;
        const tabs = $$('.st__tab', sec), imgs = $$('.st__img', sec), copies = $$('.st__copy', sec);
        const prog = $('#stProg'), num = $('#stNum'), cta = $('#stCta'), box = $('.st', sec);
        const names = ['Oscuro & Madera', 'Blanco & Luz', 'Gris Industrial'];
        const DUR = 6500;
        let cur = 0, elapsed = 0, inView = false, hover = false;

        const restartProg = () => {
            prog.style.setProperty('--dur', DUR + 'ms');
            prog.classList.remove('run'); void prog.offsetWidth; prog.classList.add('run');
        };
        function set(i) {
            if (i === cur && imgs[i].classList.contains('is-active')) return;
            const prev = cur; cur = i; elapsed = 0;
            imgs.forEach(im => im.classList.remove('is-prev'));
            imgs[prev].classList.remove('is-active'); imgs[prev].classList.add('is-prev');
            imgs[i].classList.add('is-active');
            setTimeout(() => { if (cur !== prev) imgs[prev].classList.remove('is-prev'); }, 1350);
            tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
            copies.forEach((c, k) => { const on = k === i; c.hidden = !on; c.classList.toggle('is-active', on); });
            num.textContent = pad(i + 1);
            cta.href = waLink(`Hola JC Diseño, me encantó el estilo "${names[i]}" y quiero mi proyecto así.`);
            restartProg();
        }
        tabs.forEach((t, i) => {
            t.addEventListener('click', () => set(i));
            t.addEventListener('keydown', e => {
                const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
                if (k) { e.preventDefault(); const n = (cur + k + tabs.length) % tabs.length; set(n); tabs[n].focus(); }
            });
        });
        box.addEventListener('pointerenter', () => { hover = true; });
        box.addEventListener('pointerleave', () => { hover = false; });
        new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: .25 }).observe(sec);

        // Estado inicial (el HTML ya trae el primer estilo activo)
        cta.href = waLink(`Hola JC Diseño, me encantó el estilo "${names[0]}" y quiero mi proyecto así.`);
        restartProg();

        if (reduced) return;
        setInterval(() => {
            const paused = hover || !inView || document.hidden;
            box.classList.toggle('is-paused', paused);
            if (paused) return;
            elapsed += 100;
            if (elapsed >= DUR) set((cur + 1) % tabs.length);
        }, 100);
    }

    /* ───────────── 11 · FAQ ───────────── */
    function initFaq() {
        const list = $('#faqList');
        if (!list) return;
        const items = $$('.qa', list);
        const toggle = (qa, open) => {
            qa.classList.toggle('is-open', open);
            $('.qa__q', qa).setAttribute('aria-expanded', String(open));
        };
        items.forEach(qa => $('.qa__q', qa).addEventListener('click', () => {
            const open = !qa.classList.contains('is-open');
            items.forEach(o => { if (o !== qa) toggle(o, false); });
            toggle(qa, open);
        }));
        toggle(items[0], true);
    }

    /* ───────────── 12 · FORMULARIO → WHATSAPP ───────────── */
    function initForm() {
        const form = $('#contactForm');
        if (!form) return;
        const name = $('#fName'), service = $('#fService'), msg = $('#fMsg');
        const setErr = (input, errId, text) => {
            const field = input.closest('.field');
            field.classList.toggle('is-error', !!text);
            $('#' + errId).textContent = text || '';
            input.setAttribute('aria-invalid', text ? 'true' : 'false');
        };
        [name, service].forEach(el => el.addEventListener('input', () => setErr(el, el === name ? 'eName' : 'eService', '')));
        service.addEventListener('change', () => setErr(service, 'eService', ''));

        form.addEventListener('submit', e => {
            e.preventDefault();
            const n = name.value.trim(), s = service.value;
            let bad = null;
            if (n.length < 2) { setErr(name, 'eName', 'Cuéntanos tu nombre para saludarte.'); bad = bad || name; } else setErr(name, 'eName', '');
            if (!s) { setErr(service, 'eService', 'Elige qué quieres transformar.'); bad = bad || service; } else setErr(service, 'eService', '');
            if (bad) { bad.focus(); return; }

            let text = `Hola JC Diseño, soy ${n}. Quiero cotizar: ${s}.`;
            if (msg.value.trim()) text += ` Detalles: ${msg.value.trim()}`;
            text += ' ¡Estoy listo para empezar!';
            const link = waLink(text);
            const w = window.open(link, '_blank');
            if (w) w.opener = null; else location.href = link;
        });
    }

    /* ───────────── 13 · ARRANQUE ───────────── */
    function boot() {
        initWhatsApp();
        $$('[data-split]').forEach(splitWords);
        initBlueprints();
        initFaq();
        initForm();
        initMenu();
        initStyles();
        initLightbox();
        initPointerFx(); // registra el cursor en el motor

        // Orden = orden de la página (work fija su altura antes de medir lo que viene después)
        modNav(); modHero(); modMarquee(); modExpand(); modManifesto(); modStack(); modWork(); modProcess();
        initEmbers();
        initHeroStack();

        const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

        measureAll();
        startLoop();

        // Re-medir cuando cambie la geometría (fuentes, imágenes, rotación)
        let rt;
        addEventListener('resize', () => {
            clearTimeout(rt);
            rt = setTimeout(() => {
                if (innerWidth !== S.vw || Math.abs(innerHeight - S.vh) > 140) measureAll();
            }, 140);
        });
        addEventListener('load', measureAll, { once: true });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureAll);
        if ('ResizeObserver' in window) {
            let ro;
            new ResizeObserver(() => { clearTimeout(ro); ro = setTimeout(measureAll, 200); }).observe(document.body);
        }

        initPreloader(() => {
            initReveals();
            measureAll();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
