(() => {
  if (window.vsShimmerBorder) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const K = 14;                                   // blobs per comet tail

  // a point on a rounded rectangle's outline, by arc length s (starts top-left, clockwise)
  function outline(W, H, r) {
    r = Math.min(r, W / 2, H / 2);
    const a = W - 2 * r, b = H - 2 * r, q = Math.PI * r / 2, P = 2 * a + 2 * b + 4 * q;
    const arc = (cx, cy, a0, t) => [cx + r * Math.cos(a0 + t / r), cy + r * Math.sin(a0 + t / r)];
    const at = s => {
      s = ((s % P) + P) % P;
      if (s < a) return [r + s, 0]; s -= a;
      if (s < q) return arc(W - r, r, -Math.PI / 2, s); s -= q;
      if (s < b) return [W, r + s]; s -= b;
      if (s < q) return arc(W - r, H - r, 0, s); s -= q;
      if (s < a) return [W - r - s, H]; s -= a;
      if (s < q) return arc(r, H - r, Math.PI / 2, s); s -= q;
      if (s < b) return [0, H - r - s]; s -= b;
      return arc(r, r, Math.PI, s);
    };
    return { P, at };
  }

  const live = new Set(); let raf = 0, last = 0;
  const tick = now => {
    const dt = Math.min(.064, (now - last) / 1000 || .016); last = now;
    for (const c of live) if (!c.update(dt)) live.delete(c);
    raf = live.size ? requestAnimationFrame(tick) : 0;
  };
  const wake = c => { live.add(c); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };

  function mount(el) {
    if (el.__vsSb) return; el.__vsSb = true;
    const mk = (cls, parent) => { const n = document.createElement('span'); n.className = cls; if (parent) parent.appendChild(n); return n; };
    const body = mk('vs-shimmer-border-body'), label = mk('vs-shimmer-border-label');
    while (el.firstChild) label.appendChild(el.firstChild);
    body.appendChild(label);
    body.insertAdjacentHTML('beforeend', '<svg class="vs-shimmer-border-spin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/></svg>');
    const ring = mk('vs-shimmer-border-ring'), glow = mk('vs-shimmer-border-glow');
    const flash = mk('vs-shimmer-border-flash', ring), spot = mk('vs-shimmer-border-spot', ring);
    [ring, glow].forEach(n => n.setAttribute('aria-hidden', 'true'));
    el.append(glow, body, ring);

    // two comets (the second shows on hover / busy); each: ring blobs, glow blobs, one inner spill
    const comets = [0, 1].map(() => {
      const dots = [], glows = [];
      for (let i = 0; i < K; i++) {
        const d = mk('vs-shimmer-border-dot', ring); d.style.setProperty('--t', Math.round(Math.min(1, i / 4) * 100) + '%'); dots.push(d);
        if (i % 2 === 0) { const g = d.cloneNode(); g.style.setProperty('--t', i ? '100%' : '55%'); glow.appendChild(g); glows.push(g); }
      }
      const spill = mk('vs-shimmer-border-spill'); body.insertBefore(spill, label);
      return { dots, glows, spill };
    });

    let W = 0, H = 0, path = null, s = 0, visible = true, period = 3.6, tailF = .26;
    const readAttrs = () => { period = Math.max(.4, parseFloat(el.dataset.period) || 3.6); tailF = Math.min(.9, Math.max(.05, parseFloat(el.dataset.tail) || .26)); wake(api); };
    const measure = () => {
      W = el.offsetWidth; H = el.offsetHeight;
      path = outline(W, H, parseFloat(getComputedStyle(body).borderTopLeftRadius) || 0);
      const sz = Math.max(28, H * 1.15);
      comets.forEach(c => {
        c.dots.forEach((d, i) => { const z = sz * (1 - i / K * .45); d.style.width = d.style.height = z + 'px'; d.__z = z; });
        c.glows.forEach((d, i) => { const z = sz * .62 * (1 - i / K * .5); d.style.width = d.style.height = z + 'px'; d.__z = z; });
        const z = Math.max(W, H) * .9; c.spill.style.width = c.spill.style.height = z + 'px'; c.spill.__z = z;
      });
      wake(api);
    };
    new ResizeObserver(measure).observe(el);

    const sp = (x, k, c) => ({ x, v: 0, g: x, k, c });
    const S = { speed: sp(1, 60, 14), twin: sp(0, 90, 18), fl: sp(0, 240, 26), br: sp(.8, 90, 18) };
    const place = (c, headS, amp) => {
      const tail = path.P * tailF, gap = tail / K;
      c.dots.forEach((d, i) => {
        const [x, y] = path.at(headS - i * gap);
        d.style.transform = `translate3d(${(x - d.__z / 2).toFixed(1)}px,${(y - d.__z / 2).toFixed(1)}px,0)`;
        d.style.opacity = (amp * Math.pow(1 - i / K, 1.5)).toFixed(3);
      });
      c.glows.forEach((d, j) => {
        const i = j * 2, [x, y] = path.at(headS - i * gap);
        d.style.transform = `translate3d(${(x - d.__z / 2).toFixed(1)}px,${(y - d.__z / 2).toFixed(1)}px,0)`;
        d.style.opacity = (amp * Math.pow(1 - i / K, 2)).toFixed(3);
      });
      const [x, y] = path.at(headS - gap * 2);
      c.spill.style.transform = `translate3d(${(x - c.spill.__z / 2).toFixed(1)}px,${(y - c.spill.__z / 2).toFixed(1)}px,0)`;
      c.spill.style.opacity = Math.min(1, amp).toFixed(3);
    };
    const api = { update(dt) {
      if (!path || !W) return false;
      let settling = false;
      for (const k in S) { const q = S[k]; if (Math.abs(q.v) < .001 && Math.abs(q.x - q.g) < .001) { q.x = q.g; q.v = 0; continue; }
        settling = true; const n = Math.max(1, Math.round(dt * 120)), h = dt / n;
        for (let i = 0; i < n; i++) { q.v += (-q.k * (q.x - q.g) - q.c * q.v) * h; q.x += q.v * h; } }
      const still = reduce.matches;
      if (!still) s += dt * S.speed.x * path.P / period;
      const base = still ? path.P * .18 + path.P * tailF : s;
      const amp = S.br.x + S.fl.x * .6;
      place(comets[0], base, amp);
      place(comets[1], base + path.P / 2, S.twin.x * amp);
      flash.style.opacity = (S.fl.x * .55).toFixed(3);
      return (visible && !document.hidden && !still) || settling;
    }};
    const run = () => wake(api);
    new IntersectionObserver(e => { visible = e[0].isIntersecting; if (visible) run(); }).observe(el);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });

    const inert = () => el.disabled || el.getAttribute('aria-disabled') === 'true';
    const busy = () => el.getAttribute('aria-busy') === 'true';
    let hot = false;
    const sync = () => {
      const b = busy(), d = inert();
      S.speed.g = d ? .35 : b ? 3.4 : hot ? 2.3 : 1;
      S.twin.g = !d && (hot || b) ? 1 : 0;
      S.br.g = d ? .18 : hot || b ? 1 : .8;
      el.classList.toggle('is-hot', hot && !d && !b); run();
    };
    new MutationObserver(m => { if (m.some(r => r.attributeName.startsWith('data-'))) readAttrs(); sync(); })
      .observe(el, { attributes: true, attributeFilter: ['data-period', 'data-tail', 'aria-busy', 'aria-disabled', 'disabled'] });
    const aim = e => { const r = el.getBoundingClientRect(); ring.style.setProperty('--mx', (e.clientX - r.left) + 'px'); ring.style.setProperty('--my', (e.clientY - r.top) + 'px'); };
    el.addEventListener('pointerenter', e => { aim(e); if (e.pointerType === 'mouse') { hot = true; sync(); } });
    el.addEventListener('pointermove', aim, { passive: true });
    el.addEventListener('pointerleave', () => { hot = false; sync(); });
    el.addEventListener('focus', () => { if (el.matches(':focus-visible')) { hot = true; sync(); } });
    el.addEventListener('blur', () => { hot = false; sync(); });
    const flare = () => { if (inert()) return; S.fl.g = 0; S.fl.x = 1; S.fl.v = 0; run(); };
    el.addEventListener('pointerdown', e => { flare(); if (e.pointerType !== 'mouse') { hot = true; sync(); } });
    el.addEventListener('pointerup', e => { if (e.pointerType !== 'mouse') setTimeout(() => { hot = false; sync(); }, 600); });
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') flare(); });
    readAttrs(); measure(); sync();
  }
  const init = () => document.querySelectorAll('.vs-shimmer-border').forEach(mount);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  window.vsShimmerBorder = { mount };
})();
