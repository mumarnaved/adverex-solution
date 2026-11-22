(() => {
  if (window.VsVelocityMarquee) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cssNum = (el, n, fb) => { const v = parseFloat(getComputedStyle(el).getPropertyValue(n)); return isNaN(v) ? fb : v; };
  const rows = new Set();

  function mount(row) {
    const track = row.querySelector('.vs-velocity-marquee-track');
    if (!track || row.vsVelocityMarquee) return;
    const originals = [...track.children];
    const rec = {
      row, track, originals, x: 0, setW: 1, visible: false, dir: parseFloat(row.dataset.vsVelocityMarquee || '1') < 0 ? -1 : 1,
      mult: 1, hoverF: 1, hover: false, skew: 0, skewV: 0, drag: null, fling: 0, spins: [],
    };
    const cfg = () => (rec.cfg = {
      speed: cssNum(row, '--vs-velocity-marquee-speed', 70), boost: cssNum(row, '--vs-velocity-marquee-boost', 1),
      skew: cssNum(row, '--vs-velocity-marquee-skew', 10), hover: cssNum(row, '--vs-velocity-marquee-hover', .25),
    });
    cfg();
    // fill: clone the set until two row-widths are covered; clones are hidden from assistive tech
    rec.layout = () => {
      track.querySelectorAll('[data-vs-clone]').forEach((n) => n.remove());
      const setW = originals.reduce((w, n) => w + n.getBoundingClientRect().width + parseFloat(getComputedStyle(n).marginRight), 0) || 1;
      rec.setW = setW;
      const copies = Math.ceil((row.clientWidth * 2) / setW) + 1;
      for (let i = 0; i < copies; i++) originals.forEach((n) => {
        const c = n.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.setAttribute('data-vs-clone', ''); track.appendChild(c);
      });
      rec.spins = [...track.querySelectorAll('.vs-velocity-marquee-spin')];
      cfg();
    };
    rec.layout();
    row.setAttribute('tabindex', row.getAttribute('tabindex') || '0');
    row.setAttribute('role', row.getAttribute('role') || 'marquee');

    // drag to scrub, flick to throw
    row.addEventListener('pointerdown', (e) => {
      rec.drag = { id: e.pointerId, x: e.clientX, t: performance.now(), v: 0, moved: 0 };
      row.setPointerCapture(e.pointerId); row.classList.add('is-dragging'); kick();
    });
    row.addEventListener('pointermove', (e) => {
      const d = rec.drag; if (!d || d.id !== e.pointerId) return;
      const now = performance.now(), dx = e.clientX - d.x, dt = Math.max(1, now - d.t);
      rec.x -= dx; d.v = d.v * .6 + (dx / dt) * 1000 * .4; d.x = e.clientX; d.t = now; d.moved += Math.abs(dx);
    });
    const end = (e) => {
      const d = rec.drag; if (!d || d.id !== e.pointerId) return;
      rec.fling = -d.v; rec.drag = null; row.classList.remove('is-dragging');
    };
    row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
    // swallow the click that ends a drag, so links inside don't fire
    row.addEventListener('click', (e) => { if (rec.lastMoved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    row.addEventListener('pointerup', () => { rec.lastMoved = rec.drag ? rec.drag.moved : rec.lastMoved; }, true);
    row.addEventListener('pointerdown', () => { rec.lastMoved = 0; }, true);
    row.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') rec.hover = true; });
    row.addEventListener('pointerleave', () => { rec.hover = false; });
    // keyboard: arrows nudge it
    row.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { rec.fling = -900; kick(); } else if (e.key === 'ArrowRight') { rec.fling = 900; kick(); }
    });

    new IntersectionObserver(([e]) => { rec.visible = e.isIntersecting; kick(); }).observe(row);
    // variables are live: a style / class change on the row (or its parent) re-reads them
    const mo = new MutationObserver(cfg);
    mo.observe(row, { attributes: true, attributeFilter: ['style', 'class'] });
    if (row.parentElement) mo.observe(row.parentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    row.vsVelocityMarquee = rec;
    rows.add(rec);
  }

  // one shared clock: page scroll velocity (or wheel, on pages that can't scroll) drives every row
  let raf = 0, last = 0, lastY = scrollY, vel = 0, velS = 0, velV = 0, wheel = 0, flip = 1;
  addEventListener('wheel', (e) => { if (document.documentElement.scrollHeight <= innerHeight + 1) { wheel += e.deltaY; kick(); } }, { passive: true });
  addEventListener('scroll', kick, { passive: true });

  function frame(now) {
    const dt = Math.min(64, now - (last || now)) / 1000; last = now;
    if (dt > 0) {
      const y = scrollY; vel = (y - lastY + wheel) / dt; lastY = y; wheel = 0;
      // spring-smoothed velocity so a single wheel notch reads as a push, not a spike
      for (let h = 0; h < dt; h += 1 / 120) { const s = Math.min(1 / 120, dt - h); velV += (-140 * (velS - vel) - 24 * velV) * s; velS += velV * s; }
    }
    let any = false;
    rows.forEach((r) => {
      if (!r.visible) return; any = true;
      const { speed, boost, skew, hover } = r.cfg;
      const x0 = r.x;
      if (!reduced) {
        if (Math.abs(velS) > 40) flip = velS > 0 ? 1 : -1;             // every row turns with the scroll
        const want = 1 + Math.min(Math.abs(velS) / 260, 9) * boost;
        r.mult += (want - r.mult) * (1 - Math.exp(-dt * 6));
        r.hoverF += ((r.hover ? hover : 1) - r.hoverF) * (1 - Math.exp(-dt * 5));
        if (!r.drag) r.x += speed * r.dir * flip * r.mult * r.hoverF * dt;
      }
      if (!r.drag && r.fling) { r.x += r.fling * dt; r.fling *= Math.exp(-dt * 3.2); if (Math.abs(r.fling) < 5) r.fling = 0; }
      if (!reduced && dt > 0) {
        // lean into the row's own motion: top edge leads
        const rowV = (r.x - x0) / dt;
        const sk = Math.max(-skew, Math.min(skew, (Math.abs(rowV) > speed * 1.2 ? rowV - Math.sign(rowV) * speed * 1.2 : 0) * .018));
        for (let h = 0; h < dt; h += 1 / 120) { const st = Math.min(1 / 120, dt - h); r.skewV += (-200 * (r.skew - sk) - 22 * r.skewV) * st; r.skew += r.skewV * st; }
      }
      const w = r.setW; r.x = ((r.x % w) + w) % w;
      r.track.style.transform = `translate3d(${(-r.x).toFixed(2)}px,0,0) skewX(${r.skew.toFixed(3)}deg)`;
      const a = (r.x / w) * 360;
      for (const s of r.spins) s.style.transform = `rotate(${a.toFixed(1)}deg)`;
    });
    raf = any && (!reduced || rowsBusy()) ? requestAnimationFrame(frame) : 0;
  }
  const rowsBusy = () => [...rows].some((r) => r.drag || r.fling);
  function kick() { if (!raf) { last = 0; lastY = scrollY; raf = requestAnimationFrame(frame); } }

  let rt = 0, lw = innerWidth;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (innerWidth !== lw) { lw = innerWidth; rows.forEach((r) => r.layout()); } }, 150); });

  const ready = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  window.VsVelocityMarquee = { mount: (el) => ready.then(() => mount(el)) };
  const init = () => ready.then(() => { document.querySelectorAll('[data-vs-velocity-marquee]').forEach(mount); kick(); });
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
