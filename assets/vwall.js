(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  function init(root) {
    if (root.dataset.vsReady) return; root.dataset.vsReady = '1';
    if (reduce.matches) return;       // CSS turns each row into a plain scroller
    const pauseBtn = root.querySelector('.vs-testimonial-wall-pause');
    let paused = false, visible = true, raf = 0, last = 0, speedMul = 1;
    const readSpeed = () => { const v = parseFloat(getComputedStyle(root).getPropertyValue('--vs-testimonial-wall-speed')); speedMul = Number.isFinite(v) ? v : 1; };
    const HK = 28, HC = 2 * Math.sqrt(HK);   // hover spring: critically damped, ~0.4 s to settle
    const rows = [...root.querySelectorAll('.vs-testimonial-wall-row')].map(row => {
      const track = row.querySelector('.vs-testimonial-wall-track');
      const originals = [...track.children];
      // f = cruise factor on a spring (1 cruising, .12 hovered, 0 paused); boost = flick velocity that bleeds off
      const r = { row, track, originals, x: 0, set: 0, dir: +row.dataset.dir || -1, base: +row.dataset.speed || 34,
        f: 1, fv: 0, boost: 0, hover: false, drag: null };
      r.fill = () => {
        track.querySelectorAll('[data-vs-clone]').forEach(n => n.remove());
        const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        r.set = originals.reduce((a, n) => a + n.getBoundingClientRect().width + gap, 0);
        if (!r.set) return;
        const need = Math.ceil((row.clientWidth + r.set) / r.set);
        for (let k = 0; k < need; k++) originals.forEach(n => {
          const c = n.cloneNode(true); c.setAttribute('data-vs-clone', ''); c.setAttribute('aria-hidden', 'true'); c.inert = true; track.append(c);
        });
      };
      row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { r.hover = true; kick(); } });
      row.addEventListener('pointerleave', () => { r.hover = false; kick(); });
      row.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        r.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, on: e.pointerType !== 'touch' };
        if (r.drag.on) { row.setPointerCapture(e.pointerId); row.classList.add('is-dragging'); r.boost = 0; }
      });
      row.addEventListener('pointermove', e => {
        const d = r.drag; if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        if (!d.on) {   // touch: only claim horizontal gestures, let vertical ones scroll the page
          if (Math.abs(dx) < 6 && Math.abs(e.clientY - d.y) < 6) return;
          if (Math.abs(dx) <= Math.abs(e.clientY - d.y)) { r.drag = null; return; }
          d.on = true; r.boost = 0; row.setPointerCapture(e.pointerId); row.classList.add('is-dragging');
        }
        const now = performance.now(), dt = Math.max(1, now - d.t);
        r.x += dx; d.vx = d.vx * 0.55 + (dx / dt * 1000) * 0.45; d.x = e.clientX; d.t = now;
        kick();
      });
      const up = e => {
        const d = r.drag; if (!d || d.id !== e.pointerId) return;
        if (d.on) {
          if (performance.now() - d.t > 90) d.vx = 0;          // held still before letting go: no flick
          r.boost = Math.max(-3200, Math.min(3200, d.vx));     // keep the flick; cruise eases back in underneath it
          r.f = 0; r.fv = 0;
          row.classList.add('was-dragged'); setTimeout(() => row.classList.remove('was-dragged'), 0);
        }
        r.drag = null; row.classList.remove('is-dragging'); kick();
      };
      row.addEventListener('pointerup', up); row.addEventListener('pointercancel', up);
      // stop clicks after a drag from reaching links inside cards
      row.addEventListener('click', e => { if (row.classList.contains('was-dragged')) { e.preventDefault(); e.stopPropagation(); } }, true);
      return r;
    });
    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (const r of rows) {
        if (!r.set) continue;
        if (!r.drag || !r.drag.on) {
          const ft = paused ? 0 : r.hover ? 0.12 : 1;
          for (let i = 0; i < n; i++) { r.fv += (-HK * (r.f - ft) - HC * r.fv) * h; r.f += r.fv * h; }
          r.boost *= Math.exp(-2.4 * dt);
          if (Math.abs(r.boost) < 0.5) r.boost = 0;
          r.x += (r.base * r.dir * speedMul * r.f + r.boost) * dt;
        }
        r.x = ((r.x % r.set) - r.set) % r.set;              // wrap into (−set, 0]
        r.track.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0)`;
      }
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const layout = () => { rows.forEach(r => r.fill()); kick(); };
    readSpeed();
    new MutationObserver(readSpeed).observe(root, { attributes: true, attributeFilter: ['style', 'class'] });
    new ResizeObserver(() => layout()).observe(root);
    if (document.fonts) document.fonts.ready.then(layout);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); else { cancelAnimationFrame(raf); raf = 0; } }).observe(root);
    document.addEventListener('visibilitychange', kick);
    if (pauseBtn) pauseBtn.addEventListener('click', () => {
      paused = !paused; root.classList.toggle('is-paused', paused);
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.querySelector('.vs-testimonial-wall-label').textContent = paused ? 'Play' : 'Pause';
      kick();
    });
    root.vsWall = { layout };
    layout();
  }
  const boot = () => document.querySelectorAll('.vs-testimonial-wall').forEach(init);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
