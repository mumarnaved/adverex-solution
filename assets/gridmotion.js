/* GridMotion — vanilla port of the React component: a tilted, drifting wall of tiles with a pointer spotlight */
(() => {
  const root = document.getElementById('gm'); if (!root) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wrap = (v, t) => ((v % t) + t) % t;
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
  const INERTIA = [.42, .32, .26, .22], PACE = [1, .86, 1.12, .94];
  const imgs = JSON.parse(root.dataset.items || '[]');
  const mobile = () => innerWidth < 760;
  const O = { rows: 4, aspect: .8, gap: 16, angle: -12, tilt: 16, speed: 22, parallax: .5, spotlight: .7 };
  const m = { offsets: [], shifts: [], intro: 0, px: 0, py: 0, active: false };
  let plane = null, L = null, rowEls = [], tileEls = [], spots = [], marks = [], raf = 0, last = 0, vis = true;

  addEventListener('pointermove', e => { m.px = e.clientX; m.py = e.clientY; m.active = e.pointerType !== 'touch' || true }, { passive: true });
  addEventListener('pointerup', e => { if (e.pointerType === 'touch') m.active = false });
  document.documentElement.addEventListener('pointerleave', () => { m.active = false });
  addEventListener('blur', () => { m.active = false });

  function build() {
    const W = root.clientWidth, H = root.clientHeight; if (!W || !H) return;
    const rows = mobile() ? 3 : O.rows, gap = mobile() ? 10 : O.gap;
    const turn = O.angle * Math.PI / 180, lean = O.tilt * Math.PI / 180;
    const cos = Math.abs(Math.cos(turn)), sin = Math.abs(Math.sin(turn));
    const pH = ((W * sin + H * cos) / Math.max(.3, Math.cos(lean))) * 1.12;
    const pW = (W * cos + H * sin) * (1 + Math.sin(lean) * .9) * 1.12;
    const tH = Math.max(16, (pH - gap * (rows - 1)) / rows), tW = tH * O.aspect, step = tW + gap;
    const perRow = Math.ceil(pW / step) + 1, period = perRow * step;
    L = { W, H, rows, gap, pW, pH, tW, tH, step, perRow, period, copies: Math.ceil(pW / period) + 2, top: (pH - rows * tH - (rows - 1) * gap) / 2, persp: Math.max(W, H) * 1.5 };
    if (plane) plane.remove();
    plane = document.createElement('div'); plane.className = 'gm-plane'; plane.setAttribute('aria-hidden', 'true');
    plane.style.cssText = `width:${pW}px;height:${pH}px;transform:translate(-50%,-50%) rotateX(${O.tilt}deg) rotateZ(${O.angle}deg);--gm-gap:${gap}px;--gm-w:${tW}px;--gm-h:${tH}px;opacity:${m.intro >= 1 ? 1 : 0}`;
    root.style.perspective = L.persp + 'px';
    rowEls = []; tileEls = []; spots = []; marks = [];
    for (let r = 0; r < rows; r++) {
      const row = document.createElement('div'); row.className = 'gm-row'; row.style.top = (L.top + r * (tH + gap)) + 'px';
      const n = L.copies * perRow, list = [];
      for (let k = 0; k < n; k++) {
        const t = document.createElement('div'); t.className = 'gm-tile';
        const src = imgs[((r * perRow + (k % perRow)) * 7 + r * 3) % imgs.length];
        const im = new Image(); im.src = src; im.alt = ''; im.draggable = false; im.decoding = 'async'; im.loading = 'lazy'; t.appendChild(im);
        row.appendChild(t); list.push(t);
      }
      plane.appendChild(row); rowEls.push(row); tileEls.push(list); spots.push(new Float32Array(n)); marks.push(new Float32Array(n));
    }
    root.appendChild(plane);
  }

  function frame(now) {
    raf = 0; if (!L) return;
    const dt = Math.min(.05, Math.max(.001, (now - last) / 1000)); last = now;
    if (m.intro < 1) { m.intro = Math.min(1, m.intro + dt / .9); plane.style.opacity = String(1 - Math.pow(1 - m.intro, 3)) }
    const rect = root.getBoundingClientRect(), sc = rect.width ? root.clientWidth / rect.width : 1;
    const hw = root.clientWidth / 2 || 1, hh = root.clientHeight / 2 || 1;
    const px = (m.px - rect.left) * sc - hw, py = (m.py - rect.top) * sc - hh;
    const inside = m.active && Math.abs(px) <= hw && Math.abs(py) <= hh;
    const lean = O.tilt * Math.PI / 180, turn = O.angle * Math.PI / 180, depth = L.persp;
    let fY = py, fX = px;
    if (lean > .0001) { fY = py * depth / (depth * Math.cos(lean) + py * Math.sin(lean)); fX = px * (depth - fY * Math.sin(lean)) / depth }
    const plX = fX * Math.cos(turn) + fY * Math.sin(turn), plY = -fX * Math.sin(turn) + fY * Math.cos(turn);
    const nudge = m.active ? clamp(px / hw, -1, 1) : 0;
    const reach = (.6 + 2.2 * O.spotlight) * Math.max(L.tW, L.tH), settle = 1 - Math.exp(-dt / .22);
    rowEls.forEach((row, r) => {
      const drift = r % 2 ? 1 : -1;
      if (m.offsets[r] === undefined) { m.offsets[r] = r * L.step * .37; m.shifts[r] = 0 }
      if (!reduce) m.offsets[r] += O.speed * drift * PACE[r % 4] * dt;
      const target = reduce ? 0 : O.parallax * L.tW * 1.2 * nudge * (r % 2 ? -1 : 1);
      m.shifts[r] += (target - m.shifts[r]) * (1 - Math.exp(-dt / INERTIA[r % 4]));
      const x = -L.period + wrap(m.offsets[r] + m.shifts[r], L.period);
      row.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
      const rowY = L.top + r * (L.tH + L.gap) + L.tH / 2 - L.pH / 2, left = x - L.pW / 2 + L.tW / 2;
      const list = tileEls[r], v = spots[r], mk = marks[r];
      for (let k = 0; k < list.length; k++) {
        let w = 0;
        if (inside) w = 1 - sstep(.25, 1, Math.hypot(left + k * L.step - plX, rowY - plY) / reach);
        v[k] += (w - v[k]) * settle;
        if (Math.abs(v[k] - mk[k]) > .004 || (w === 0 && v[k] < .004 && mk[k] !== 0)) { mk[k] = v[k] < .004 ? 0 : v[k]; list[k].style.setProperty('--spot', mk[k].toFixed(3)) }
      }
    });
    if (vis) raf = requestAnimationFrame(frame);
  }
  const go = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame) } };
  new IntersectionObserver(e => { vis = e[0].isIntersecting; if (vis) go() }).observe(root);
  let rt = 0; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { build(); go() }, 120) }).observe(root);
  build(); go();
})();
