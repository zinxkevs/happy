/* THE LOSS OF THE PHOTOGRAPHS — standalone; loads AFTER script.js, no edits to script.js needed */
(() => {
  'use strict';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement, memEl = document.getElementById('memories'),
        ring = document.getElementById('ring'), gallery = document.getElementById('gallery');
  if (!memEl || !ring || !gallery) return;

  /* pin the gallery while it decays */
  const pin = document.createElement('div'); pin.className = 'pin';
  while (memEl.firstChild) pin.appendChild(memEl.firstChild);
  memEl.appendChild(pin);

  const cards = [...ring.querySelectorAll('.card3d')], faces = cards.map((c) => c.querySelector('.photo'));
  const rng = (s) => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

  /* one SVG filter per photo: noise-driven erosion with ragged, displaced edges */
  const NS = 'http://www.w3.org/2000/svg', fs = document.createElementNS(NS, 'svg');
  fs.setAttribute('width', 0); fs.setAttribute('height', 0); fs.setAttribute('aria-hidden', 'true'); fs.style.position = 'absolute';
  fs.innerHTML = cards.map((_, i) => `<filter id="ero${i}" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency=".014 .019" numOctaves="3" seed="${i * 7 + 3}" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G" result="dp"/>
    <feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0" result="m"/>
    <feComponentTransfer in="m" result="mk"><feFuncA type="linear" slope="14" intercept="0"/></feComponentTransfer>
    <feComposite in="dp" in2="mk" operator="in"/></filter>`).join('');
  document.body.appendChild(fs);
  const fx = cards.map((_, i) => ({ disp: fs.querySelector(`#ero${i} feDisplacementMap`), fn: fs.querySelector(`#ero${i} feFuncA`) }));

  function walk(r, x, y, a, n, t, o) {
    let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
    for (let k = 0; k < n; k++) {
      a += (r() - .5) * 1.2; const L = 5 + r() * 9; x += Math.cos(a) * L; y += Math.sin(a) * L;
      d += `L${x.toFixed(1)} ${y.toFixed(1)}`;
      if (n > 4 && k % 2 === 1 && r() < .8) walk(r, x, y, a + (r() < .5 ? -1 : 1) * (.6 + r() * .5), 3, t + .06 + k * .02, o);
    }
    o.push(`<path pathLength="1" style="--t:${t.toFixed(2)}" d="${d}"/>`);
  }
  function cracks(r) {
    const o = [];
    for (let n = 0; n < 4; n++) {
      const e = (r() * 4) | 0, x = e < 2 ? r() * 100 : e === 2 ? 0 : 100, y = e >= 2 ? r() * 100 : e === 0 ? 0 : 100;
      walk(r, x, y, Math.atan2(50 - y, 50 - x) + (r() - .5) * .8, 7, .06 + n * .1 + r() * .06, o);
    }
    return `<svg class="crk" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${o.join('')}</svg>`;
  }
  function shards(r, src) {
    let h = '';
    for (let k = 0; k < 3; k++) {
      const cx = 18 + r() * 64, cy = 18 + r() * 64, n = 4 + ((r() * 2) | 0), pts = [];
      for (let j = 0; j < n; j++) { const a = (j / n) * 6.283 + r() * .7, rad = 9 + r() * 13; pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)}% ${(cy + Math.sin(a) * rad * 1.3).toFixed(1)}%`); }
      h += `<i class="shard" style="background-image:url('${src}');clip-path:polygon(${pts.join(',')});--sx:${((r() - .5) * 60) | 0}px;--sy:${(90 + r() * 140) | 0}px;--sr:${((r() - .5) * 160) | 0}deg;--st:${(.28 + r() * .3).toFixed(2)}"></i>`;
    }
    return h;
  }
  cards.forEach((c, i) => {
    const r = rng(i * 977 + 13);
    for (const k of ['x1', 'y1', 'x2', 'y2', 'x3', 'y3']) c.style.setProperty('--' + k, (10 + r() * 80).toFixed(0) + '%');
    faces[i].insertAdjacentHTML('beforeend', cracks(r));
    if (!reduced) c.insertAdjacentHTML('beforeend', shards(r, c.querySelector('img').getAttribute('src')));
  });

  const START = [.04, .2, .1, .27, .15], navBtns = [...document.querySelectorAll('.gal-nav button')];
  let lastG = -1, dRaf = 0; const D = cards.map(() => -1);
  function decay() {
    dRaf = 0;
    const r = memEl.getBoundingClientRect(), vh = innerHeight, run = Math.max(1, r.height - vh);
    const g = clamp((-r.top - vh * .2) / Math.max(1, run - vh * .2));
    if (lastG >= 0 && Math.abs(g - lastG) < .0005) return;
    lastG = g; root.style.setProperty('--g', g.toFixed(4));
    cards.forEach((c, i) => {
      const d = Math.pow(clamp((g - START[i]) / .58), 1.15);
      if (Math.abs(d - D[i]) < .006 && d > 0 && d < 1) return;
      D[i] = d; c.style.setProperty('--d', d.toFixed(4));
      faces[i].style.filter = d < .015 || d >= 1 ? '' : `url(#ero${i})`;
      if (d >= .015) {
        fx[i].disp.setAttribute('scale', reduced ? 0 : (d * 16).toFixed(1));
        fx[i].fn.setAttribute('intercept', (-14 * (.17 + d * .75)).toFixed(2));
      }
      c.classList.toggle('gone', d >= 1);
    });
    const empty = g > .8;
    gallery.classList.toggle('void', empty);
    navBtns.forEach((b) => b.setAttribute('aria-disabled', empty ? 'true' : 'false'));
  }
  const q = () => { if (!dRaf) dRaf = requestAnimationFrame(decay); };
  addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); addEventListener('load', q);
  q();
})();

/* FINAL RUIN — overlay, cake damage, carousel freeze, finale debris */
(() => {
  'use strict';
  const root = document.documentElement, ring = document.getElementById('ring'),
        cake = document.getElementById('cake'), th = document.getElementById('thanks');
  const ru = document.createElement('div'); ru.id = 'ruin'; ru.setAttribute('aria-hidden', 'true'); document.body.appendChild(ru);

  if (cake) cake.insertAdjacentHTML('beforeend',
    '<ellipse class="puddle" cx="120" cy="233" rx="98" ry="8"/>' +
    [91.5, 120.5, 149.5].map((x, i) => `<circle class="wick" cx="${x}" cy="58" r="2.4"/><path class="smoke" d="M${x} 55c-6-8 6-14 0-24s8-14 2-24"/><path class="drip" d="M${x - 4.5} 100q0 ${16 + i * 5} 3 ${22 + i * 4}t3-22z"/>`).join(''));

  if (th) {
    let s = 7, r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296, h = '';
    for (let i = 0; i < 9; i++) {
      const w = 12 + r() * 34, n = 4 + ((r() * 2) | 0), pts = [];
      for (let j = 0; j < n; j++) { const a = (j / n) * 6.283 + r() * .8; pts.push(`${(50 + Math.cos(a) * 50 * (.5 + r() * .5)).toFixed(0)}% ${(50 + Math.sin(a) * 50 * (.5 + r() * .5)).toFixed(0)}%`); }
      h += `<i class="frag" style="left:${(6 + r() * 86).toFixed(0)}%;bottom:${(4 + r() * 20).toFixed(0)}%;width:${w.toFixed(0)}px;height:${(w * (.4 + r() * .5)).toFixed(0)}px;transform:rotate(${(r() * 180 - 90) | 0}deg);--fd:${(1 + r() * 4).toFixed(1)}s;clip-path:polygon(${pts.join(',')})"></i>`;
    }
    th.insertAdjacentHTML('beforeend', h);
  }

  let frozen = false, v0 = 0, raf = 0;
  function frame() {
    raf = 0;
    const g = parseFloat(root.style.getPropertyValue('--g')) || 0;
    if (g > .4 && !frozen) {
      const m = /rotateY\((-?[\d.]+)deg\)/.exec(ring.style.transform);
      v0 = m ? parseFloat(m[1]) : 0; frozen = true; ring.classList.add('frozen');
    } else if (g <= .4 && frozen) {
      frozen = false; ring.classList.add('snap'); ring.classList.remove('frozen');
      setTimeout(() => ring.classList.remove('snap'), 820);
    }
    if (frozen) { const t = Math.min(1, (g - .4) / .4); ring.style.setProperty('--fv', (v0 - t * t * (3 - 2 * t) * 14).toFixed(2)); }
  }
  const q = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', q, { passive: true }); addEventListener('resize', q); q();
})();
