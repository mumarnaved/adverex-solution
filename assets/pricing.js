
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const CELLS = 11;   // 0–9 plus a blank for a leading column the other price doesn't need
  function init(root) {
    if (root.dataset.vsReady) return; root.dataset.vsReady = '1';
    let period = root.dataset.period === 'yearly' ? 'yearly' : 'monthly';
    root.dataset.period = period;
    const opts = [...root.querySelectorAll('.vs-pricing-toggle-opt')];
    const thumb = root.querySelector('.vs-pricing-toggle-thumb');
    const cards = [...root.querySelectorAll('.vs-pricing-toggle-card')];
    const badge = root.querySelector('.vs-pricing-toggle-badge');
    const springs = [];          // every moving thing is a spring: { x, v, t, k, c, apply, delay }
    let raf = 0, last = 0;

    // the thumb: position spring; it stretches a touch along its travel with its own speed
    const thumbS = { x: period === 'yearly' ? 1 : 0, v: 0, k: 420, c: 32, apply: s => {
      if (!thumb) return;
      const st = Math.min(0.14, Math.abs(s.v) * 0.028);
      thumb.style.transform = `translate3d(${(s.x * 100).toFixed(3)}%,0,0) scale(${(1 + st).toFixed(4)},${(1 - st * 0.35).toFixed(4)})`;
    } };
    thumbS.t = thumbS.x; springs.push(thumbS);

    // proportional odometer: every column sits at an x that is itself interpolated from the rolling digits,
    // so narrow figures (a "1") close up while they turn over. Transform-only.
    const ctx = document.createElement('canvas').getContext('2d');
    const prices = [...root.querySelectorAll('.vs-pricing-toggle-price')].map(el => {
      const cur$ = el.dataset.currency ?? '$';
      const vals = { monthly: String(el.dataset.monthly ?? ''), yearly: String(el.dataset.yearly ?? '') };
      const width = Math.max(vals.monthly.length, vals.yearly.length);
      const cur = document.createElement('span'); cur.className = 'vs-pricing-toggle-cur'; cur.textContent = cur$; cur.setAttribute('aria-hidden', 'true');
      const digits = document.createElement('span'); digits.className = 'vs-pricing-toggle-digits'; digits.setAttribute('aria-hidden', 'true');
      const sr = document.createElement('span'); sr.className = 'vs-pricing-toggle-sr';
      el.textContent = ''; el.append(cur, digits, sr);
      const per = el.nextElementSibling && el.nextElementSibling.classList.contains('vs-pricing-toggle-per') ? el.nextElementSibling : null;
      const idx = (str, j) => { const ch = str.padStart(width, ' ')[j]; return ch === ' ' ? 10 : +ch; };
      const sepAfter = parseInt(el.dataset.sepAfter || '0', 10), sepCh = el.dataset.sep || ',';
      const sepEl = document.createElement('span'); sepEl.className = 'vs-pricing-toggle-sep'; sepEl.textContent = sepCh;
      if (sepAfter) digits.append(sepEl);
      let W = new Array(CELLS).fill(0), wMax = 0, total = 0, wSep = 0;
      const cols = [];
      const place = () => {
        let x = 0;
        cols.forEach((c, j) => {
          const v = Math.max(0, Math.min(10, c.s.x)), lo = Math.floor(v), hi = Math.min(10, lo + 1), f = v - lo;
          c.col.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
          c.col.style.opacity = String(Math.max(0, Math.min(1, 10 - v)));
          x += W[lo] + (W[hi] - W[lo]) * f;
          if (sepAfter && j === sepAfter - 1) { sepEl.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`; x += wSep; }
        });
        if (per) per.style.transform = `translate3d(${(x - total).toFixed(2)}px,0,0)`;
      };
      const measure = () => {
        const cs = getComputedStyle(digits);
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const ls = parseFloat(cs.letterSpacing) || 0;
        W = [...'0123456789'].map(d => ctx.measureText(d).width + ls).concat(0);
        wMax = Math.max(...W);
        const tot = str => [...str.padStart(width, ' ')].reduce((a, ch) => a + (ch === ' ' ? 0 : W[+ch]), 0);
        wSep = sepAfter ? ctx.measureText(sepCh).width + ls : 0;
        total = Math.max(tot(vals.monthly), tot(vals.yearly)) + wSep;
        digits.style.width = total.toFixed(2) + 'px';
        cols.forEach(c => c.col.style.width = (wMax + 2).toFixed(2) + 'px');
        place();
      };
      for (let j = 0; j < width; j++) {
        const col = document.createElement('span'); col.className = 'vs-pricing-toggle-col';
        const strip = document.createElement('span'); strip.className = 'vs-pricing-toggle-strip';
        for (let d = 0; d < CELLS; d++) { const c = document.createElement('span'); c.textContent = d < 10 ? d : ' '; strip.append(c); }
        col.append(strip); digits.append(col);
        const s = { x: idx(vals[period], j), v: 0, k: 190, c: 20, apply: s => { strip.style.transform = `translate3d(0,${(-s.x / CELLS * 100).toFixed(3)}%,0)`; place(); } };
        s.t = s.x; springs.push(s); cols.push({ s, col });
      }
      measure();
      if (document.fonts) document.fonts.ready.then(measure);
      addEventListener('resize', measure);
      const perTxt = el.dataset.per || 'one-time';
      const label = p => { sr.textContent = `${cur$} ${vals[p].replace(/\B(?=(\d{3})+(?!\d))/g, ',')}, ${perTxt}`; };
      label(period);
      // columns start right to left when a price drops, left to right when it rises — like a real counter carrying
      return { set: p => { const up = +vals[p] > +vals[p === 'yearly' ? 'monthly' : 'yearly'];
        cols.forEach((c, j) => { c.s.t = idx(vals[p], j); c.s.delay = (up ? j : cols.length - 1 - j) * 60; }); label(p); } };
    });
    springs.forEach(s => s.apply(s));

    const tick = now => {
      const dtMs = Math.min(50, now - last); last = now;
      const n = Math.max(1, Math.ceil(dtMs / 1000 * 240)), h = dtMs / 1000 / n;
      let moving = false;
      for (const s of springs) {
        if (s.delay > 0) { s.delay -= dtMs; moving = true; continue; }
        if (Math.abs(s.x - s.t) < 1e-4 && Math.abs(s.v) < 1e-3) { if (s.x !== s.t || s.v) { s.x = s.t; s.v = 0; s.apply(s); } continue; }
        for (let i = 0; i < n; i++) { s.v += (-s.k * (s.x - s.t) - s.c * s.v) * h; s.x += s.v * h; }
        s.apply(s); moving = true;
      }
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const syncOpts = () => opts.forEach(o => { const on = o.dataset.period === period; o.setAttribute('aria-checked', String(on)); o.tabIndex = on ? 0 : -1; });
    const setPeriod = p => {
      p = p === 'yearly' ? 'yearly' : 'monthly';
      if (p === period) return; period = p; if (root.dataset.period !== p) root.dataset.period = p;
      syncOpts();
      thumbS.t = p === 'yearly' ? 1 : 0;
      prices.forEach(pr => pr.set(p));
      root.dispatchEvent(new CustomEvent('vs-pricing-toggle:change', { detail: { period: p } }));
      if (reduce.matches) { springs.forEach(s => { s.x = s.t; s.v = 0; s.delay = 0; s.apply(s); }); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };
    // which card is featured: data-highlight="1|2|3" (1-based; 0 = none). The badge travels with it.
    const setHighlight = () => {
      const n = parseInt(root.dataset.highlight, 10);
      cards.forEach((c, i) => c.classList.toggle('is-featured', i + 1 === n));
      const f = cards[n - 1];
      if (badge) { if (f) { const top = f.querySelector('.vs-pricing-toggle-top'); if (badge.parentNode !== top) { top.append(badge); badge.style.animation = 'none'; badge.offsetWidth; badge.style.animation = ''; } badge.hidden = false; } else badge.hidden = true; }
    };
    syncOpts(); setHighlight();
    opts.forEach(o => {
      o.addEventListener('click', () => setPeriod(o.dataset.period));
      o.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault(); const other = opts.find(x => x !== o); other.focus(); setPeriod(other.dataset.period);
      });
    });
    // attributes are the API: set data-period / data-highlight from anywhere and the component follows
    new MutationObserver(() => { if (root.dataset.period !== period) setPeriod(root.dataset.period); setHighlight(); })
      .observe(root, { attributes: true, attributeFilter: ['data-period', 'data-highlight'] });
    root.vsPricing = { setPeriod };

    // pointer glow: transform-only, one rAF per move
    cards.forEach(card => {
      const glow = card.querySelector('.vs-pricing-toggle-glow'); if (!glow) return;
      let pend = null;
      card.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        const r = card.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
        if (!pend) pend = requestAnimationFrame(() => { pend = null; glow.style.transform = `translate3d(${x}px,${y}px,0)`; });
      });
    });
  }
  const boot = () => document.querySelectorAll('.vs-pricing-toggle').forEach(init);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
