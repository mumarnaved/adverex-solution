(() => {
  if (window.__vsLineChart) return; window.__vsLineChart = true;
  const NS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  let uid = 0;
  const el = (tag, attrs, parent, svg = true) => {
    const n = svg ? document.createElementNS(NS, tag) : document.createElement(tag);
    for (const k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // cubic-bezier(.5,0,.14,1): a soft start that lands without a thud
  const bez = (x1, y1, x2, y2) => (t) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    let u = t; for (let i = 0; i < 6; i++) { const x = ((ax * u + bx) * u + cx) * u - t, d = (3 * ax * u + 2 * bx) * u + cx; if (Math.abs(d) < 1e-6) break; u -= x / d; }
    u = clamp(u, 0, 1); return ((ay * u + by) * u + cy) * u;
  };
  const ease = bez(.5, 0, .14, 1);
  // semi-implicit Euler spring; interruptible because it keeps its velocity when the target moves
  const spring = (x, k, c) => ({ x, v: 0, t: x, k, c });
  const step = (s, dt) => { const a = -s.k * (s.x - s.t) - s.c * s.v; s.v += a * dt; s.x += s.v * dt; };
  const still = (s, eps = .02) => Math.abs(s.x - s.t) < eps && Math.abs(s.v) < eps * 10;
  const snap = (s) => { s.x = s.t; s.v = 0; };
  // Steffen / d3.curveMonotoneX tangents (uniform spacing): monotone, never overshoots a point
  const tangents = (y) => {
    const n = y.length, m = new Array(n).fill(0); if (n < 2) return m;
    const s = []; for (let i = 0; i < n - 1; i++) s.push(y[i + 1] - y[i]);
    for (let i = 1; i < n - 1; i++) {
      const a = s[i - 1], b = s[i], p = (a + b) / 2;
      m[i] = (Math.sign(a) + Math.sign(b)) * Math.min(Math.abs(a), Math.abs(b), .5 * Math.abs(p)) || 0;
    }
    m[0] = n > 2 ? (3 * s[0] - m[1]) / 2 : s[0];
    m[n - 1] = n > 2 ? (3 * s[n - 2] - m[n - 2]) / 2 : s[0];
    return m;
  };

  function mount(root) {
    if (root.vsLineChart) return;
    const src = root.querySelector('script[type="application/json"]');
    let cfg; try { cfg = JSON.parse(src.textContent); } catch (e) { return; }
    const id = 'vslc' + (++uid);
    const S = cfg.series.map((s, i) => ({ ...s, style: s.style || (i === 0 ? 'accent' : i === 1 ? 'ink' : 'dashed'), vis: spring(1, 210, 26), on: true }));
    const main = S[0], cmp = S.find((s) => s.compare && s !== main);
    const n = main.values.length;
    const loc = cfg.locale || undefined;
    const nf = new Intl.NumberFormat(loc, { minimumFractionDigits: cfg.decimals || 0, maximumFractionDigits: cfg.decimals || 0 });
    const cf = new Intl.NumberFormat(loc, { notation: 'compact', maximumFractionDigits: 1 });
    const fmt = (v) => (cfg.prefix || '') + nf.format(v) + (cfg.suffix || '');
    const t0 = cfg.start ? new Date(cfg.start + 'T12:00:00') : null, stepD = cfg.step || 7;
    const dateAt = (u) => t0 ? new Date(t0.getTime() + Math.round(u * stepD) * 864e5) : null;
    const dFmt = new Intl.DateTimeFormat(loc, { weekday: 'short', day: 'numeric', month: 'short' });
    const dLong = new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const mFmt = new Intl.DateTimeFormat(loc, { month: 'short' });
    const labelAt = (u) => t0 ? dFmt.format(dateAt(u)) : (cfg.labels || [])[Math.round(u)] || '';

    // ── DOM ──
    const head = root.querySelector('.vs-line-chart-head') || el('div', { class: 'vs-line-chart-head' }, root, false);
    const legend = el('div', { class: 'vs-line-chart-legend', role: 'group', 'aria-label': 'Series' }, head, false);
    const keyVar = (s) => s.style === 'accent' ? 'var(--vs-line-chart-accent)' : s.style === 'ink' ? 'color-mix(in srgb, var(--vs-line-chart-ink) 70%, transparent)' : 'var(--vs-line-chart-faint)';
    const key = (s) => `<i class="vs-line-chart-key" data-s="${s.style}" style="--k:${keyVar(s)}"></i>`;
    S.forEach((s) => {
      const b = el('button', { type: 'button', 'aria-pressed': 'true' }, legend, false);
      b.innerHTML = key(s) + s.name; s.btn = b;
      b.addEventListener('click', () => {
        if (s.on && S.filter((x) => x.on).length === 1) return;
        s.on = !s.on; s.vis.t = s.on ? 1 : 0; b.setAttribute('aria-pressed', s.on);
        if (RM.matches) snap(s.vis);
        paintTip(true); kick();
      });
    });
    const valueEl = root.querySelector('.vs-line-chart-value');
    const valueText = valueEl ? valueEl.textContent : '';
    if (valueEl && !RM.matches) valueEl.textContent = fmt(main.values[0]);
    const plot = el('div', { class: 'vs-line-chart-plot', tabindex: '0', role: 'group', 'aria-roledescription': 'chart',
      'aria-label': (cfg.label || main.name) + '. Use the left and right arrow keys to read each point.' }, null, false);
    root.insertBefore(plot, src);
    const svg = el('svg', { 'aria-hidden': 'true', focusable: 'false' }, plot);
    const defs = el('defs', {}, svg);
    const grad = el('linearGradient', { id: id + 'g', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', class: 'vs-line-chart-stop-a' }, grad); el('stop', { offset: '.55', class: 'vs-line-chart-stop-b' }, grad); el('stop', { offset: '1', class: 'vs-line-chart-stop-c' }, grad);
    // soft left-to-right reveal: a gradient that feathers out just behind the drawing head
    const rg = el('linearGradient', { id: id + 'r', gradientUnits: 'userSpaceOnUse', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    el('stop', { offset: '0', 'stop-color': '#fff' }, rg); el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }, rg);
    const clip = el('mask', { id: id + 'c', maskUnits: 'userSpaceOnUse', x: -40, y: -40, width: 99999, height: 99999 }, defs);
    const clipR = el('rect', { x: -40, y: -40, height: 99999, width: 99999, fill: `url(#${id}r)` }, clip);
    const mask = el('mask', { id: id + 'm', maskUnits: 'userSpaceOnUse', x: -40, y: -40, width: 99999, height: 99999 }, defs);
    const mPast = el('rect', { x: -40, y: -40, height: 99999, fill: '#fff' }, mask), mFut = el('rect', { y: -40, height: 99999, fill: '#fff' }, mask);
    const gGrid = el('g', {}, svg), gY = el('g', {}, svg), gX = el('g', {}, svg);
    const gData = el('g', { mask: `url(#${id}m)` }, svg);
    const gArea = el('g', { class: 'vs-line-chart-areas', mask: `url(#${id}c)` }, gData);
    const area = el('path', { fill: `url(#${id}g)` }, gArea);
    const gSec = el('g', { mask: `url(#${id}c)` }, gData);
    S.forEach((s) => { s.path = el('path', { class: 'vs-line-chart-line', 'data-s': s.style }, s === main ? null : gSec); });
    gData.appendChild(main.path);
    const headDot = el('circle', { class: 'vs-line-chart-head-dot', r: 3.5 }, svg);
    const end = el('g', { class: 'vs-line-chart-end' }, svg); el('circle', { r: 5.5 }, end); el('circle', { r: 5.5 }, end);
    const gHov = el('g', { class: 'vs-line-chart-hover' }, svg);
    const cross = el('line', { class: 'vs-line-chart-cross' }, gHov);
    const halo = el('circle', { class: 'vs-line-chart-halo', r: 13 }, gHov);
    S.slice().reverse().forEach((s) => { s.dot = el('circle', { class: 'vs-line-chart-dot', 'data-s': s.style, r: s === main ? 5.5 : 3.75 }, gHov); });
    const tip = el('div', { class: 'vs-line-chart-tip vs-line-chart-hover', 'aria-hidden': 'true' }, plot, false);
    // visually hidden data table + polite live region
    const srw = el('div', { class: 'vs-line-chart-sr' }, null, false), tbl = el('table', {}, srw, false);
    tbl.innerHTML = `<caption>${cfg.label || main.name}</caption><thead><tr><th scope="col">${t0 ? 'Date' : 'Point'}</th>${S.map((s) => `<th scope="col">${s.name}</th>`).join('')}</tr></thead><tbody>` +
      main.values.map((_, i) => `<tr><th scope="row">${t0 ? dLong.format(dateAt(i)) : labelAt(i)}</th>${S.map((s) => `<td>${fmt(s.values[i])}</td>`).join('')}</tr>`).join('') + '</tbody>';
    root.insertBefore(srw, src);
    const live = el('div', { class: 'vs-line-chart-sr', 'aria-live': 'polite' }, root, false);

    // ── geometry ──
    let W = 0, H = 0, L = 44, R = 8, T = 10, B = 28, yMax = 1, lx = [], ly = [], len = 0;
    const X = (u) => L + (n > 1 ? u / (n - 1) : .5) * (W - L - R);
    const Y = (v) => T + (1 - v / yMax) * (H - T - B);
    const curve = () => root.getAttribute('data-vs-line-chart-curve') || 'smooth';
    const valAt = (s, u) => {
      u = clamp(u, 0, n - 1); const i = Math.min(n - 2, Math.floor(u)), t = u - i, v = s.values;
      if (n < 2) return v[0];
      const c = curve();
      if (c === 'step') return t >= .999999 ? v[i + 1] : v[i];
      if (c === 'linear') return v[i] + (v[i + 1] - v[i]) * t;
      const m = s.m, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * v[i] + (t3 - 2 * t2 + t) * m[i] + (-2 * t3 + 3 * t2) * v[i + 1] + (t3 - t2) * m[i + 1];
    };
    const pathOf = (s) => {
      const v = s.values, c = curve(); let d = `M${X(0).toFixed(2)},${Y(v[0]).toFixed(2)}`;
      for (let i = 0; i < n - 1; i++) {
        const x0 = X(i), x1 = X(i + 1);
        if (c === 'linear') d += `L${x1.toFixed(2)},${Y(v[i + 1]).toFixed(2)}`;
        else if (c === 'step') d += `H${x1.toFixed(2)}V${Y(v[i + 1]).toFixed(2)}`;
        else d += `C${(x0 + (x1 - x0) / 3).toFixed(2)},${Y(v[i] + s.m[i] / 3).toFixed(2)} ${(x1 - (x1 - x0) / 3).toFixed(2)},${Y(v[i + 1] - s.m[i + 1] / 3).toFixed(2)} ${x1.toFixed(2)},${Y(v[i + 1]).toFixed(2)}`;
      }
      return d;
    };
    const niceStep = (max, count) => { const raw = max / count, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p; };
    function layout() {
      W = plot.clientWidth; H = plot.clientHeight; if (!W || !H) return;
      const narrow = W < 480; L = narrow ? 34 : 46; B = 28;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      S.forEach((s) => { s.m = tangents(s.values); });
      const max = Math.max(...S.flatMap((s) => s.values)) * 1.04;
      const st = niceStep(max, narrow ? 4 : 5); yMax = Math.ceil(max / st) * st;
      gGrid.textContent = ''; gY.textContent = ''; gX.textContent = '';
      for (let v = 0; v <= yMax + 1e-9; v += st) {
        const y = Math.round(Y(v)) + .5;
        el('line', { class: 'vs-line-chart-gl' + (v === 0 ? ' is-base' : ''), x1: L, x2: W - R + 4, y1: y, y2: y }, gGrid);
        const t = el('text', { x: L - 12, y: y + 3.5, 'text-anchor': 'end' }, gY); t.textContent = (cfg.prefix || '') + cf.format(v);
      }
      // x labels: the first point of each month (or every k-th label), thinned so they never collide
      const ticks = [];
      for (let i = 0; i < n; i++) {
        if (t0) { const d = dateAt(i), p = i ? dateAt(i - 1) : null; if (p ? d.getMonth() !== p.getMonth() : d.getDate() <= Math.max(3, stepD)) ticks.push([i, mFmt.format(d)]); }
        else if (cfg.labels) ticks.push([i, cfg.labels[i]]);
      }
      let last = -1e9; const gap = narrow ? 40 : 52;
      ticks.forEach(([i, txt]) => {
        const x = X(i); if (x - last < gap || x > W - R - 10) return; last = x;
        const t = el('text', { x: x, y: H - 8, 'text-anchor': i === 0 ? 'start' : 'middle' }, gX); t.textContent = txt;
        el('line', { class: 'vs-line-chart-gl', x1: Math.round(x) + .5, x2: Math.round(x) + .5, y1: H - B, y2: H - B + 4 }, gGrid);
      });
      S.forEach((s) => s.path.setAttribute('d', pathOf(s)));
      area.setAttribute('d', pathOf(main) + `L${X(n - 1).toFixed(2)},${Y(0)}L${X(0).toFixed(2)},${Y(0)}Z`);
      len = main.path.getTotalLength(); main.path.style.strokeDasharray = `${len + 2} ${len + 2}`;
      lx = []; ly = []; const N = 180;
      for (let k = 0; k <= N; k++) { const p = main.path.getPointAtLength(k / N * len); lx.push(p.x); ly.push(p.y); }
      const ex = X(n - 1), ey = Y(main.values[n - 1]);
      end.querySelectorAll('circle').forEach((c) => { c.setAttribute('cx', ex); c.setAttribute('cy', ey); });
      cross.setAttribute('y1', T - 6); cross.setAttribute('y2', H - B);
      if (!cx.x && !hover) { cx.x = cx.t = X(n - 1); }
      paint(); paintTip(true);
    }

    // ── state ──
    let undo = 0, undoFrom = 1, draw = 0, drawStart = 0, drawing = false, drawn = false, visible = false, hover = false, u = n - 1, raf = 0, last = 0, lastLabel = '', touchTimer = 0;
    const cx = spring(0, 520, 40), tx = spring(0, 300, 30), ty = spring(0, 300, 30), dim = spring(0, 240, 30);
    const lookup = (p) => { const f = p * (lx.length - 1), i = Math.min(lx.length - 2, Math.floor(f)), t = f - i; return [lx[i] + (lx[i + 1] - lx[i]) * t, ly[i] + (ly[i + 1] - ly[i]) * t]; };
    function paint() {
      if (!W) return;
      const e = drawing || !drawn ? ease(clamp(draw, 0, 1)) : 1;
      main.path.style.strokeDashoffset = (len + 2) * (1 - e);
      const [hx, hy] = lx.length ? lookup(e) : [0, 0];
      if (e >= 1) { rg.setAttribute('x1', 99990); rg.setAttribute('x2', 99999); }
      else { rg.setAttribute('x1', hx - 70); rg.setAttribute('x2', hx + 2); }
      area.style.opacity = Math.min(1, e * 1.25) * main.vis.x;
      headDot.setAttribute('cx', hx); headDot.setAttribute('cy', hy);
      headDot.style.opacity = drawing && e < .995 ? Math.min(1, e * 8) : 0;
      if (valueEl && drawing) valueEl.textContent = fmt(Math.round(valAt(main, clamp((hx - L) / (W - L - R), 0, 1) * (n - 1))));
      S.forEach((s) => { s.path.style.opacity = s.vis.x; s.dot.style.opacity = s.vis.x; });
      end.style.opacity = main.vis.x;
      // crosshair + dots ride the real curve at the sprung x
      const x = cx.x, uu = clamp((x - L) / (W - L - R), 0, 1) * (n - 1), px = Math.round(x) + .5;
      cross.setAttribute('x1', px); cross.setAttribute('x2', px);
      S.forEach((s) => { s.dot.setAttribute('cx', x); s.dot.setAttribute('cy', Y(valAt(s, uu))); });
      halo.setAttribute('cx', x); halo.setAttribute('cy', Y(valAt(main, uu))); halo.style.opacity = .18 * main.vis.x;
      mPast.setAttribute('width', dim.x < .002 ? 99999 : Math.max(0, x + 41)); mFut.setAttribute('x', x); mFut.setAttribute('width', 99999);
      mFut.setAttribute('fill-opacity', 1 - .6 * dim.x);
      tip.style.transform = `translate3d(${tx.x.toFixed(1)}px,${ty.x.toFixed(1)}px,0)`;
      return uu;
    }
    function paintTip(force) {
      if (!W) return;
      const uu = clamp((cx.t - L) / (W - L - R), 0, 1) * (n - 1);
      const label = labelAt(uu) + S.map((s) => s.on ? Math.round(valAt(s, uu)) : '').join('|');
      if (label !== lastLabel || force) {
        lastLabel = label;
        let h = `<div class="vs-line-chart-tip-d">${labelAt(uu)}</div>`;
        S.forEach((s) => { if (s.on) h += `<div class="vs-line-chart-tip-r">${key(s)}<span>${s.name}</span><b>${fmt(Math.round(valAt(s, uu)))}</b></div>`; });
        if (cmp && main.on && cmp.on) {
          const a = valAt(main, uu), b = valAt(cmp, uu), d = (a - b) / b * 100;
          h += `<div class="vs-line-chart-tip-x"><span>vs ${cmp.name.toLowerCase()}</span><b class="${d < 0 ? 'is-down' : ''}">${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}%</b></div>`;
        }
        tip.innerHTML = h;
      }
      const tw = tip.offsetWidth, th = tip.offsetHeight, gapX = 20;
      const x = cx.t, right = x + gapX + tw <= W;
      tx.t = right ? x + gapX : x - gapX - tw;
      const my = Y(valAt(main, uu));
      ty.t = clamp(my - th * .5, 0, H - B - th);
    }
    function frame(now) {
      raf = 0;
      const dt = Math.min(.034, (now - (last || now)) / 1000); last = now;
      if (drawing) {
        if (undo) { draw = undoFrom * (1 - (now - drawStart) / undo); if (draw <= 0) { draw = 0; drawing = false; undo = 0; } }
        else draw = (now - drawStart) / (parseFloat(getComputedStyle(root).getPropertyValue('--vs-line-chart-draw')) || 1800);
        if (!undo && draw >= 1) { draw = 1; drawing = false; drawn = true; root.classList.add('is-drawn'); if (valueEl) valueEl.textContent = valueText; }
      }
      const sp = [cx, tx, ty, dim, ...S.map((s) => s.vis)];
      for (let k = 0; k < 2; k++) sp.forEach((s) => step(s, dt / 2));
      sp.forEach((s) => { if (still(s)) snap(s); });
      paint();
      if (drawing || sp.some((s) => !still(s))) kick(); else last = 0;
    }
    function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); }
    function startDraw() {
      root.classList.remove('is-drawn');
      if (RM.matches) { draw = 1; drawing = false; drawn = true; root.classList.add('is-drawn'); paint(); return; }
      undo = 0; draw = 0; drawn = false; drawing = true; drawStart = performance.now(); last = 0; kick();
    }
    // rewinds the line back into its start point (used for looping demos), then waits for replay()
    function undraw(ms = 700) {
      if (RM.matches) return; root.classList.remove('is-drawn');
      undoFrom = drawn ? 1 : Math.min(1, draw); drawn = false; drawing = true; undo = ms; drawStart = performance.now(); last = 0; kick();
    }

    // ── interaction ──
    const setU = (v, instant) => {
      u = clamp(v, 0, n - 1); cx.t = X(u); dim.t = 1;
      if (!hover) { hover = true; root.classList.add('is-hover'); if (!cx.x || instant) { snap(cx); } }
      paintTip();
      if (!hover || instant || RM.matches) { snap(tx); snap(ty); }
      if (RM.matches) { snap(cx); snap(dim); }
      const uu = u, d = dateAt(uu);
      root.dispatchEvent(new CustomEvent('vs-line-chart-point', { bubbles: true, detail: { index: uu, date: d, values: S.map((s) => valAt(s, uu)) } }));
      kick();
    };
    let fresh = true;
    const enter = (clientX) => {
      const r = plot.getBoundingClientRect(), uu = clamp((clientX - r.left - L) / (W - L - R), 0, 1) * (n - 1);
      const wasHover = hover; setU(uu);
      if (!wasHover && fresh) { snap(cx); paint(); paintTip(); snap(tx); snap(ty); }
      fresh = false;
    };
    const leave = () => { hover = false; fresh = true; root.classList.remove('is-hover'); dim.t = 0; kick(); };
    plot.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) enter(e.clientX); });
    plot.addEventListener('pointerdown', (e) => { clearTimeout(touchTimer); enter(e.clientX); });
    plot.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') leave(); });
    plot.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') { clearTimeout(touchTimer); touchTimer = setTimeout(leave, 1600); } });
    plot.addEventListener('pointercancel', () => { clearTimeout(touchTimer); touchTimer = setTimeout(leave, 900); });
    const announce = () => { live.textContent = `${t0 ? dLong.format(dateAt(Math.round(u))) : labelAt(u)}: ` + S.filter((s) => s.on).map((s) => `${s.name} ${fmt(s.values[Math.round(u)])}`).join(', '); };
    plot.addEventListener('keydown', (e) => {
      const k = e.key; let i = Math.round(hover ? u : n - 1);
      if (k === 'ArrowRight' || k === 'ArrowLeft') i += (k === 'ArrowRight' ? 1 : -1) * (e.shiftKey ? 4 : 1) * (hover ? 1 : 0);
      else if (k === 'Home') i = 0; else if (k === 'End') i = n - 1;
      else if (k === 'Escape') { leave(); return; } else return;
      e.preventDefault(); setU(clamp(i, 0, n - 1)); announce();
    });
    plot.addEventListener('focus', () => { if (plot.matches(':focus-visible') && !hover) { setU(n - 1, true); announce(); } });
    plot.addEventListener('blur', leave);

    new ResizeObserver(() => { const had = hover; layout(); if (had) { cx.t = X(u); snap(cx); paintTip(); snap(tx); snap(ty); } paint(); }).observe(plot);
    new MutationObserver(() => { layout(); }).observe(root, { attributes: true, attributeFilter: ['data-vs-line-chart-curve'] });
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting; root.classList.toggle('is-off', !visible);
      if (visible && !drawn && !drawing && e.intersectionRatio > .25) startDraw();
      if (visible) kick();
    }, { threshold: [0, .3] }).observe(root);
    layout();
    root.vsLineChart = { replay: startDraw, undraw, focusPoint: (i) => setU(i), leave, get index() { return u; } };
  }
  const init = () => document.querySelectorAll('.vs-line-chart').forEach(mount);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
