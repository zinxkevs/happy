(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (x) => x * x * (3 - 2 * x);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#ff4d8d', '#f9b8cf', '#e8799f', '#ffffff', '#e6cfa8', '#fde4ec', '#d9d9e0'];
  const DULL = ['#8a7352', '#6b4a3a', '#5a1f22', '#a89677', '#4a3a2a'];   // confetti once the garden has faded
  let wp = 0;                                    // decay progress 0..1 (written by the scroll controller below)

  /* ================= Confetti engine (canvas) ================= */
  const cv = $('#fx'), ctx = cv.getContext('2d');
  let W = 0, H = 0, parts = [], raf = 0;

  function resize() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * d; cv.height = H * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }

  function make(x, y, vx, vy, g, life) {
    return { x, y, vx, vy, g, life, max: life, w: rnd(6, 11), h: rnd(4, 7), rot: rnd(0, 6.28), vr: rnd(-.2, .2),
      t: rnd(0, 6), sw: rnd(.2, .9), c: pick(wp > .28 ? DULL : COLORS), s: pick([0, 0, 1, 2, 2]) };
  }

  function burst(x, y, n = 80) {
    n = reduced ? Math.min(n, 24) : Math.min(n, 140);
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), sp = rnd(4, 13);
      parts.push(make(x, y, Math.cos(a) * sp * rnd(.6, 1.2), Math.sin(a) * sp, .22, rnd(90, 170)));
    }
    run();
  }

  function rain(n = 3) {
    for (let i = 0; i < n && parts.length < 220; i++) parts.push(make(rnd(0, W), -12, rnd(-.6, .6), rnd(1.2, 3), .02, 600));
    run();
  }

  function run() { if (!raf) raf = requestAnimationFrame(tick); }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => {
      p.vx *= .985; p.vy = Math.min(p.vy + p.g, 4.5);
      p.t += .06; p.x += p.vx + Math.sin(p.t) * p.sw; p.y += p.vy; p.rot += p.vr; p.life--;
      if (p.y > H + 20 || p.life <= 0) return false;
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.life / 30);
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.c;
      if (p.s === 0) ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      else if (p.s === 1) { ctx.beginPath(); ctx.arc(0, 0, p.h / 1.6, 0, 6.29); ctx.fill(); }
      else {
        const s = p.w * .6;
        ctx.beginPath(); ctx.moveTo(0, s * .35);
        ctx.bezierCurveTo(-s, -s * .4, -s * .3, -s, 0, -s * .3);
        ctx.bezierCurveTo(s * .3, -s, s, -s * .4, 0, s * .35); ctx.fill();
      }
      ctx.restore();
      return true;
    });
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) ctx.clearRect(0, 0, W, H);
  }

  /* ================= Emoji burst (hearts + sparkles; wilted flowers once the garden fades) ================= */
  function emojiBurst(x, y, n = 18) {
    n = reduced ? 6 : n;
    const set = wp > .28 ? ['🥀', '🍂', '🥀'] : ['💗', '✨', '💖', '💝', '🎀'];
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.textContent = pick(set);
      Object.assign(el.style, { position: 'fixed', left: x + 'px', top: y + 'px', zIndex: 55, pointerEvents: 'none', fontSize: rnd(18, 34) + 'px' });
      document.body.appendChild(el);
      const a = rnd(0, 6.28), d = rnd(70, Math.min(220, W * .4));
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 60;
      el.animate(
        [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
         { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(1.2)`, opacity: 0 }],
        { duration: rnd(900, 1500), easing: 'cubic-bezier(.2,.8,.3,1)' }
      ).onfinish = () => el.remove();
    }
  }

  /* ================= Ambient decorations ================= */
  const floaters = $('#floaters');

  function spawnHeart() {
    if (document.hidden || wp > .3 || floaters.querySelectorAll('.heart').length > 14) return;
    const h = document.createElement('span');
    h.className = 'heart'; h.textContent = '♥';
    h.style.cssText = `left:${rnd(2, 96)}%;--sz:${rnd(14, 30)}px;--d:${rnd(9, 15)}s;--dx:${rnd(-60, 60)}px;--r:${rnd(-40, 40)}deg;--c:${pick(['#f9b8cf', '#ff8fb5', '#e8799f', '#ffc2d6'])}`;
    h.addEventListener('animationend', () => h.remove());
    floaters.appendChild(h);
  }

  function addBalloons() {
    const cols = ['#f9b8cf', '#ff8fb5', '#e8799f', '#fde4ec', '#e6cfa8', '#ff6fa3'];
    const n = W < 600 ? 5 : 8;
    for (let i = 0; i < n; i++) {
      const b = document.createElement('i');
      b.className = 'balloon';
      b.style.cssText = `--l:${4 + (i * 92) / n + rnd(-3, 3)}%;--sz:${rnd(34, 58)}px;--c:${cols[i % cols.length]};--d:${rnd(18, 30)}s;--dl:${-rnd(0, 20)}s;--dx:${rnd(-30, 30)}px`;
      floaters.appendChild(b);
    }
  }

  function addSparkles() {
    const n = W < 600 ? 10 : 18;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'sparkle';
      s.style.cssText = `left:${rnd(2, 96)}%;top:${rnd(3, 94)}%;--sz:${rnd(10, 20)}px;--d:${rnd(2.5, 5)}s;--dl:${-rnd(0, 5)}s`;
      floaters.appendChild(s);
    }
  }

  /* ================= Cinematic loader (6 s, runs once) ================= */
  const loader = $('#loader'), party = $('#party');
  let partyStarted = false;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  function buildLoader() {
    const w = innerWidth, sm = w < 600, add = (box, cls, css) => { const e = document.createElement('i'); e.className = cls; e.style.cssText = css; box.appendChild(e); };
    for (let i = 0; i < (sm ? 16 : 26); i++) {          // petals and leaves let go one by one, from 2.5 s to 14 s
      const leaf = Math.random() < .28;
      add($('#ldPetals'), 'ld-p' + (leaf ? ' leaf' : ''), `left:${rnd(4, 94).toFixed(0)}%;--s:${rnd(9, 16).toFixed(0)}px;--dl:${rnd(2.5, 12.5).toFixed(2)}s;--d:${rnd(5, 7.5).toFixed(2)}s;--dx:${rnd(-80, 80).toFixed(0)}px;--r:${rnd(-320, 320).toFixed(0)}deg`);
    }
    for (let i = 0; i < (sm ? 8 : 12); i++) {           // some stay where they fell
      const leaf = Math.random() < .3;
      add($('#ldGround'), 'ld-s' + (leaf ? ' leaf' : ''), `--x:${rnd(4, 94).toFixed(0)}%;--b:${rnd(1, 9).toFixed(1)}%;--s:${rnd(8, 14).toFixed(0)}px;--r:${rnd(0, 360).toFixed(0)}deg;--dl:${rnd(6, 15).toFixed(1)}s`);
    }
    for (let i = 0; i < (sm ? 9 : 14); i++)             // light particles drifting away
      add($('#ldMotes'), 'ld-m', `--x:${rnd(4, 96).toFixed(0)}%;--s:${rnd(3, 6).toFixed(1)}px;--dl:${rnd(0, 11).toFixed(2)}s;--d:${rnd(4.5, 6.5).toFixed(2)}s`);
  }

  
  /* the celebration begins (what the old YES button used to start) */
  function startParty() {
    if (partyStarted) return;
    partyStarted = true;
    scrollTo(0, 0);
    party.classList.add('in');
    burst(W * .25, H * .7, 90); burst(W * .75, H * .7, 90);
    addBalloons(); addSparkles();
    for (let i = 0; i < 6; i++) setTimeout(spawnHeart, i * 250);
    setInterval(spawnHeart, 1100);
    setInterval(() => { if (!document.hidden && wp < .25) rain(reduced ? 1 : 3); }, 900);
    initReveal();
    requestAnimationFrame(() => { measure(); buildScatter(); queueWither(); });
  }

  function endLoader() {
    startParty();
    loader.classList.add('done');
    const fin = () => {
      if (!loader.isConnected) return;
      loader.remove();
      document.documentElement.classList.remove('ld-lock');
    };
    loader.addEventListener('transitionend', (e) => { if (e.target === loader && e.propertyName === 'opacity') fin(); });
    setTimeout(fin, 2300);
  }

  function startLoader() {
    if (!loader || loader.dataset.ran) return;
    loader.dataset.ran = '1';
    document.documentElement.classList.add('ld-lock');
    scrollTo(0, 0);
    buildLoader();
    requestAnimationFrame(() => loader.classList.add('run'));
    setTimeout(endLoader, reduced ? 1400 : 18000);
  }
  addEventListener('resize', resize);

  /* ================= Scroll reveals (+ cinematic word reveal for the letters) ================= */
  function splitWords() {
    document.querySelectorAll('.note p').forEach((p) => {
      if (p.dataset.split) return;
      p.dataset.split = '1';
      const words = p.textContent.trim().split(/\s+/);
      p.textContent = '';
      words.forEach((w, i) => {
        const s = document.createElement('span');
        s.className = 'w'; s.style.setProperty('--k', i); s.textContent = w;
        p.appendChild(s);
        if (i < words.length - 1) p.appendChild(document.createTextNode(' '));
      });
    });
  }

  function initReveal() {
    splitWords();
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .18 });
    els.forEach((e) => io.observe(e));
  }

  /* ================= Gift box ================= */
  const gift = $('#gift'), giftMsg = $('#giftMsg');
  gift.addEventListener('click', () => {
    const first = !gift.classList.contains('open');
    gift.classList.add('open'); $('#giftHint').classList.add('gone'); gift.setAttribute('aria-expanded', 'true');
    const r = gift.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .35;
    burst(cx, cy, first ? 90 : 40); emojiBurst(cx, cy, first ? 22 : 10);
    giftMsg.textContent = wp > .28 ? 'Some things fade. This is still for you. 🥀' : 'Surprise! You deserve something beautiful today. 💝';
    giftMsg.classList.add('show');
  });

  /* ================= Cake & wish (the wish button locks once the candles have gone out) ================= */
  const cake = $('#cake'), wish = $('#wish'), wishMsg = $('#wishMsg');
  const WISH_TXT = 'May all your wishes come true!';
  let blown = false, wishLocked = false;
  const shake = (el) => { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); };
  wish.addEventListener('animationend', () => wish.classList.remove('shake'));
  wish.addEventListener('click', () => {
    if (wishLocked) {                                    // deliberate, visible: the button is locked
      shake(wish); wishMsg.textContent = 'The candles have already gone out.'; wishMsg.classList.add('show');
      return;
    }
    blown = true; $('#wishHint').classList.add('gone');
    wishMsg.textContent = WISH_TXT; wishMsg.classList.add('show');
    const r = cake.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height * .3, 60); emojiBurst(r.left + r.width / 2, r.top + r.height * .3, 10);
  });

  /* ================= The old music player: no audio, and it says so ================= */
  const playBtn = $('#playBtn'), musicNote = $('#musicNote');
  let playTries = 0;
  playBtn.addEventListener('animationend', (e) => { if (e.animationName === 'shake') playBtn.classList.remove('shake'); });
  playBtn.addEventListener('click', () => {
    playTries++; shake(playBtn);
    if (playTries >= 2) playBtn.classList.add('snapped');   // the lock gives way, but nothing plays
    musicNote.hidden = false;
  });

  /* ================= 3D photo carousel (turns slowly while it is on screen) ================= */
  const ring = $('#ring'), gallery = $('#gallery'), faces = [...ring.querySelectorAll('.photo')];
  const STEP = 72, SPEED = 360 / 54;            // one full turn in ~54 seconds
  let angle = 0, spinning = false, snapping = false, lastT = 0, gRaf = 0, galVisible = false;

  function paintRing() {
    ring.style.transform = `translateZ(calc(var(--r) * -1)) rotateY(${-angle}deg)`;
    faces.forEach((f, i) => {
      const facing = Math.max(0, Math.cos(((i * STEP - angle) * Math.PI) / 180));
      f.style.transform = `scale(${(1 + .1 * facing * facing).toFixed(3)})`;      // front photo is a touch larger
      f.style.opacity = (.55 + .45 * Math.pow(facing, .6)).toFixed(3);            // and the most visible
    });
  }
  function galTick(t) {
    if (!spinning) { gRaf = 0; return; }
    const dt = Math.min(.1, (t - lastT) / 1000); lastT = t;
    if (!snapping) { angle += SPEED * dt; paintRing(); }
    gRaf = requestAnimationFrame(galTick);
  }
  function updateSpin() {
    const on = galVisible && !document.hidden && !reduced;   // reduced motion: gallery stays still (use the arrows)
    if (on === spinning) return;
    spinning = on;
    gallery.classList.toggle('live', spinning);
    if (spinning && !gRaf) { lastT = performance.now(); gRaf = requestAnimationFrame(galTick); }
  }
  function stepRing(dir) {
    snapping = true; ring.classList.add('snap');
    angle = (Math.round(angle / STEP) + dir) * STEP; paintRing();
    setTimeout(() => { ring.classList.remove('snap'); snapping = false; lastT = performance.now(); }, 820);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => { galVisible = es[0].isIntersecting; updateSpin(); }, { threshold: .05 }).observe(gallery);
  } else { galVisible = true; updateSpin(); }
  document.addEventListener('visibilitychange', updateSpin);
  $('#galPrev').addEventListener('click', () => stepRing(-1));
  $('#galNext').addEventListener('click', () => stepRing(1));
  faces.forEach((f) => {                         // graceful placeholder for missing photos
    const img = f.querySelector('img'), miss = () => f.classList.add('missing');
    img.addEventListener('error', miss);
    if (img.complete && !img.naturalWidth) miss();
  });
  if (!reduced) {                                // soft lights rising off the stage
    for (let i = 0; i < 9; i++) {
      const m = document.createElement('i');
      m.className = 'mote';
      m.style.cssText = `--x:${rnd(14, 86)}%;--s:${rnd(3, 6).toFixed(1)}px;--d:${rnd(5, 8).toFixed(1)}s;--dl:${-rnd(0, 7).toFixed(1)}s;--dx:${rnd(-24, 24).toFixed(0)}px`;
      gallery.appendChild(m);
    }
  }
  paintRing();

  /* =====================================================================
     THE WITHERING — scroll-driven. One passive scroll listener + rAF.
     It only writes CSS variables on <html> (plus a few SVG attributes);
     style.css turns them into colour, texture, damage and photo ageing.
     ===================================================================== */
  const root = document.documentElement, themeMeta = $('meta[name="theme-color"]');
  const partyEl = $('#party'), msgEl = $('#message'), wishSec = $('#wishSec'), musicEl = $('#music'), memEl = $('#memories'), thanksEl = $('#thanks');
  const petalBox = $('#petals'), dustBox = $('#dust'), roughMap = $('#roughMap');

  /* stops: bloom → fading → withering (text flips light) → dark → completely withered */
  const KEYS = [0, .3, .46, .5, .76, 1];
  const PAL = {
    '--cream':   ['#fff8f3', '#e6d3c8', '#9c8678', '#5a443d', '#1d1411', '#0b0706'],
    '--bgtop':   ['#fff3f7', '#eadad0', '#8e786d', '#46332d', '#241714', '#0f0908'],
    '--blush':   ['#fde4ec', '#e1c9c6', '#85706a', '#46342f', '#241816', '#150d0c'],
    '--pink':    ['#f9b8cf', '#d3a0a6', '#9a746a', '#5a3a39', '#3d2525', '#2b1819'],
    '--champ':   ['#e6cfa8', '#d0b48a', '#b09470', '#8a7352', '#6e5a3d', '#5e4d34'],
    '--ink':     ['#5b2a3f', '#54343a', '#4a2f30', '#e6d6c2', '#d6c5ab', '#cdbb9f'],
    '--ink-soft':['#8a5568', '#7c5457', '#5e403b', '#c9b79f', '#b6a487', '#a99877'],
    '--rose':    ['#e8799f', '#a4667a', '#8e5a60', '#c99a8c', '#b08565', '#a8784f'],
    '--hot':     ['#ff4d8d', '#a6445f', '#8a4048', '#d9a894', '#c08a62', '#b08a5a'],
    '--card1':   ['#fffcfd', '#f3e6da', '#dcc8ae', '#bba585', '#a99373', '#a08b69'],
    '--card2':   ['#fff6f2', '#ecdccc', '#cdb698', '#a89272', '#9a8666', '#948262'],
    '--cink':    ['#5b2a3f', '#54343a', '#4a3028', '#2f2018', '#1c120c', '#120a05'],
    '--csoft':   ['#8a5568', '#7c5457', '#6a4a40', '#4a362a', '#3a2a1e', '#33241a'],
    '--crose':   ['#e8799f', '#b0617a', '#8f5460', '#6e3a38', '#5c2a26', '#552420'],
    '--chot':    ['#ff4d8d', '#c04a6c', '#a04458', '#7a2a30', '#651d22', '#5a1a1d'],
    '--b1':      ['#ff6fa3', '#c9778f', '#8f5a5a', '#6e4a3a', '#4a3028', '#38251e'],
    '--b2':      ['#ff4d8d', '#b4587a', '#7a4048', '#573429', '#3a231c', '#2a1914'],
    '--bt':      ['#ffffff', '#ffffff', '#f0dcd0', '#c9b79f', '#a89677', '#8f7f63'],
    '--cb1':     ['#ff6fa3', '#c9778f', '#8a4a4a', '#5a3030', '#3a2020', '#2a1614'],
    '--cb2':     ['#ff4d8d', '#b4587a', '#6a3a3a', '#4a2626', '#2a1616', '#1c0f0d'],
    '--sh':      ['#e8799f', '#b88a8a', '#6a4038', '#1c0c08', '#0a0403', '#050202'],
    '--rib':     ['#f0dcb8', '#d2bc98', '#a58f6c', '#6e5c44', '#4c3f2d', '#382d20'],
    '--rp':      ['#f48fb1', '#d78a9b', '#a56c6a', '#7a4540', '#4b2423', '#2f1616'],
    '--rp2':     ['#e0577f', '#b8627a', '#85534f', '#5a2e2a', '#381a1a', '#241010'],
    '--rl':      ['#c23a6a', '#8f4a5a', '#5f3030', '#3b1f1c', '#24120f', '#1a0d0b'],
    '--rs':      ['#5f9a6a', '#7a8a5a', '#6b6240', '#4d422c', '#33291c', '#241d14'],
    '--petal':   ['#f9b8cf', '#d6a3aa', '#a0605a', '#7a3a30', '#5a2420', '#4a1b1b']
  };
  const toRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const PAL_RGB = Object.entries(PAL).map(([k, v]) => [k, v.map(toRGB)]);
  const CREAM = PAL_RGB[0][1];
  function colorAt(arr, p) {
    let i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1]) i++;
    const t = smooth(clamp((p - KEYS[i]) / (KEYS[i + 1] - KEYS[i]))), a = arr[i], b = arr[i + 1];
    return 'rgb(' + a.map((v, j) => Math.round(v + (b[j] - v) * t)).join(',') + ')';
  }

  /* anchors: decay is tied to what is on screen, not to raw page length */
  let A = null;
  const P_AT = [0, .36, .62, .86, 1];            // message → cake scene → music player → carousel → finale
  function measure() {
    if (partyEl.hidden) return;
    const y = scrollY, top = (el, f = 0) => { const r = el.getBoundingClientRect(); return r.top + y + r.height * f; };
    A = { y: [top(msgEl), top(wishSec, .5), top(musicEl, .5), top(memEl, .5), top(thanksEl)], memTop: top(memEl), thTop: top(thanksEl), docH: root.scrollHeight };
  }
  function pAtY(c) {
    const ys = A.y;
    if (c <= ys[0]) return 0;
    for (let i = 1; i < ys.length; i++) if (c <= ys[i]) return P_AT[i - 1] + (P_AT[i] - P_AT[i - 1]) * ((c - ys[i - 1]) / Math.max(1, ys[i] - ys[i - 1]));
    return 1;
  }

  /* living rose: droops, then drops its petals one by one */
  const lrHead = $('#lrHead'), lrP = [...document.querySelectorAll('#lifeRose .lpw')].map((g, i) => {
    const a = (i * 60 * Math.PI) / 180;
    return { g, px: 60 + Math.sin(a) * 16, py: 56 - Math.cos(a) * 16, lx: Math.sin(a) * 16, ly: -Math.cos(a) * 16,
      t: .1 + i * .085, gx: [18, 34, 52, 70, 86, 100][(i * 5) % 6] + rnd(-4, 4), gy: 190 + rnd(0, 5), rot: rnd(-150, 150) };
  });
  function drawLifeRose(p) {
    const th = p * 30;
    lrHead.setAttribute('transform', `rotate(${th.toFixed(2)} 60 196)`);
    const r = (th * Math.PI) / 180, c = Math.cos(-r), s = Math.sin(-r);
    for (const q of lrP) {
      const f = clamp((p - q.t) / .12);
      if (f === 0) { q.g.removeAttribute('transform'); q.g.style.opacity = ''; continue; }
      const e = smooth(f), dx = q.gx - 60, dy = q.gy - 196;
      const tx = (60 + dx * c - dy * s - q.px) * e, ty = (196 + dx * s + dy * c - q.py) * e;
      q.g.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) rotate(${(q.rot * e).toFixed(0)} ${q.lx.toFixed(1)} ${q.ly.toFixed(1)})`);
      q.g.style.opacity = (1 - .25 * e).toFixed(2);
    }
  }

  /* dried petals and dead leaves that stay scattered on the page once they have fallen */
  let scatter = [];
  function buildScatter() {
    if (!A || scatter.length) return;
    const box = document.createElement('div');
    box.id = 'scatter'; box.setAttribute('aria-hidden', 'true');
    partyEl.appendChild(box);
    const from = A.y[1] - innerHeight * .4, to = A.thTop + innerHeight * .5, n = W < 600 ? 22 : 38;
    for (let i = 0; i < n; i++) {
      const y = from + (to - from) * Math.pow(Math.random(), .75), leaf = Math.random() < .3, s = leaf ? rnd(12, 24) : rnd(8, 17);
      const el = document.createElement('i');
      el.className = 'sc' + (leaf ? ' leaf' : '');
      el.style.cssText = `left:${rnd(1, 97).toFixed(1)}%;top:${y.toFixed(0)}px;width:${s.toFixed(0)}px;height:${(leaf ? s * .55 : s * 1.3).toFixed(0)}px;--r:${rnd(0, 360).toFixed(0)}deg`;
      box.appendChild(el);
      scatter.push({ el, th: pAtY(y) - .05, on: false });
    }
  }

  /* falling petals while scrolling */
  function spawnPetal(leaf) {
    const el = document.createElement('i'), s = leaf ? rnd(12, 20) : rnd(9, 17);
    el.className = 'petal' + (leaf ? ' leaf' : '');
    el.style.cssText = `left:${rnd(2, 96).toFixed(1)}%;width:${s.toFixed(0)}px;height:${(leaf ? s * .55 : s * 1.3).toFixed(0)}px`;
    petalBox.appendChild(el);
    el.animate([
      { transform: 'translate(0,-6vh) rotate(0deg)', opacity: 0 },
      { opacity: .6, offset: .12 },
      { opacity: .45, offset: .85 },
      { transform: `translate(${rnd(-90, 90).toFixed(0)}px,108vh) rotate(${rnd(-320, 320).toFixed(0)}deg)`, opacity: 0 }
    ], { duration: rnd(7000, 12000), easing: 'ease-in-out' }).onfinish = () => el.remove();
  }

  /* a few dust motes, shown only in the late stages */
  if (!reduced) {
    for (let i = 0; i < 26; i++) {
      const d = document.createElement('i');
      d.className = 'dust';
      d.style.cssText = `--x:${rnd(0, 100).toFixed(0)}%;--y:${rnd(10, 100).toFixed(0)}%;--s:${rnd(1.5, 3.5).toFixed(1)}px;--d:${rnd(9, 18).toFixed(1)}s;--dl:${-rnd(0, 18).toFixed(1)}s;--dx:${rnd(-40, 40).toFixed(0)}px`;
      dustBox.appendChild(d);
    }
  }

  let wRaf = 0, lastP = -1, lastAge = -1, lastFin = -1, petalY = 0, decayed = false, lastRough = -1;

  function witherFrame() {
    wRaf = 0;
    if (partyEl.hidden) return;
    if (!A) measure();
    const vh = innerHeight, y = scrollY;
    const p = A ? clamp(pAtY(y + vh * .5)) : 0;

    /* photo age: fresh as the carousel arrives, old by the time it leaves */
    const s0 = A ? A.memTop - vh * .75 : 0;
    const age = A ? clamp((y - s0) / (vh * .9)) : 0;
    const fin = A ? clamp((y + vh - A.thTop) / (vh * .9)) : 0;

    root.style.setProperty('--py', Math.round(y));
    if (Math.abs(p - lastP) > .0008 || Math.abs(age - lastAge) > .002 || Math.abs(fin - lastFin) > .002) {
      lastP = p; lastAge = age; lastFin = fin; wp = p;
      const st = root.style;
      for (const [k, arr] of PAL_RGB) st.setProperty(k, colorAt(arr, p));
      st.setProperty('--wp', p.toFixed(4));
      st.setProperty('--age', age.toFixed(4));
      st.setProperty('--fin', fin.toFixed(3));
      st.setProperty('--fr', clamp(1 - fin * 1.6).toFixed(3));                       // the living rose gives way to the dried one
      st.setProperty('--fl', clamp(1 - (p - .1) / .24).toFixed(3));                  // balloons / hearts / sparkles fade out
      st.setProperty('--paper', (smooth(clamp((p - .08) / .6)) * .7).toFixed(3));    // aged paper, stains, burnt corners
      st.setProperty('--crk', (smooth(clamp((p - .3) / .45)) * .85).toFixed(3));     // cracks on cards and buttons
      st.setProperty('--vig', Math.max(smooth(clamp((p - .12) / .7)) * .9, fin).toFixed(3));
      st.setProperty('--dust', smooth(clamp((p - .5) / .35)).toFixed(3));
      if (themeMeta) themeMeta.content = colorAt(CREAM, p);

      /* typography frays */
      const dc = p > .4;
      if (dc !== decayed) { decayed = dc; root.classList.toggle('decayed', dc); }
      if (dc) { const sc = ((p - .4) / .6) * 2.6; if (Math.abs(sc - lastRough) > .05) { lastRough = sc; roughMap.setAttribute('scale', sc.toFixed(2)); } }

      /* the wish button locks (visibly, with a padlock) once the garden has faded past the cake */
      const lock = p > .52;
      if (lock !== wishLocked) {
        wishLocked = lock;
        wish.classList.toggle('locked', lock);
        wish.setAttribute('aria-disabled', lock ? 'true' : 'false');
        if (!lock && !blown) { wishMsg.classList.remove('show'); wishMsg.textContent = WISH_TXT; }
      }

      drawLifeRose(p);
      for (const q of scatter) { const on = p >= q.th; if (on !== q.on) { q.on = on; q.el.classList.toggle('on', on); } }
    }

    /* a dried petal (or leaf) every ~130px of scrolling, in the later stages */
    if (!reduced && p > .12 && fin < .9 && Math.abs(y - petalY) > 130) {
      petalY = y;
      if (petalBox.childElementCount < 9) spawnPetal(p > .5 && Math.random() < .35);
    }
  }
  function queueWither() { if (!wRaf) wRaf = requestAnimationFrame(witherFrame); }
  addEventListener('scroll', queueWither, { passive: true });
  addEventListener('resize', () => { measure(); queueWither(); });
  addEventListener('load', () => { measure(); queueWither(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); queueWither(); });

  resize();
  startLoader();
})();
