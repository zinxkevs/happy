(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = ['#ff4d8d', '#f9b8cf', '#e8799f', '#ffffff', '#e6cfa8', '#fde4ec', '#d9d9e0'];

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
      t: rnd(0, 6), sw: rnd(.2, .9), c: pick(COLORS), s: pick([0, 0, 1, 2, 2]) };
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

  /* ================= Emoji burst (hearts + sparkles) ================= */
  function emojiBurst(x, y, n = 18) {
    n = reduced ? 6 : n;
    for (let i = 0; i < n; i++) {
      const el = document.createElement('span');
      el.textContent = pick(['💗', '✨', '💖', '💝', '🎀']);
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
    if (document.hidden || floaters.querySelectorAll('.heart').length > 14) return;
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

  /* ================= Intro: the dodging NO button ================= */
  const intro = $('#intro'), yes = $('#yes'), no = $('#no'), slot = $('#noSlot'), hint = $('#hint');
  const lines = ['Nope, try again 😜', 'Too slow! 🏃‍♀️', 'Are you sure? 🥺', 'It ran away! 💨', 'Hehe, not today 🙈', 'Psst… YES is right there 💗',
                 'You cannot catch it! 😆', 'Okay okay… you know the answer 🎀'];
  let dodges = 0, busy = 0, started = false;

  function place(x, y) { no.style.left = x + 'px'; no.style.top = y + 'px'; }

  function dodge() {
    if (started || busy) return;
    busy = 1; setTimeout(() => (busy = 0), 220);
    const w = no.offsetWidth, h = no.offsetHeight, pad = 14;
    if (!no.classList.contains('flee')) {            // lift out of flow, keep the layout intact
      const r = no.getBoundingClientRect();
      slot.style.width = r.width + 'px'; slot.style.height = r.height + 'px';
      place(r.left, r.top); void no.offsetWidth;
      no.classList.add('flee');
    }
    const cur = no.getBoundingClientRect(), yr = yes.getBoundingClientRect();
    let x, y, tries = 0;
    do {
      x = rnd(pad, Math.max(pad, W - w - pad)); y = rnd(pad, Math.max(pad, H - h - pad)); tries++;
    } while (tries < 30 && (Math.hypot(x - cur.left, y - cur.top) < 140 ||
      (x < yr.right + 12 && x + w > yr.left - 12 && y < yr.bottom + 12 && y + h > yr.top - 12)));
    dodges++;
    const s = Math.max(.1, 1 - dodges * .1);          // shrinks every dodge until it is a tiny dot
    no.style.setProperty('--s', s);
    no.style.opacity = s <= .2 ? .55 : 1;
    yes.style.setProperty('--ys', Math.min(1.3, 1 + dodges * .03));
    hint.textContent = lines[Math.min(dodges - 1, lines.length - 1)] || pick(lines);
    if (!reduced && Math.random() < .25) {            // sometimes vanish and reappear elsewhere
      no.classList.add('ghost');
      setTimeout(() => { place(x, y); no.classList.remove('ghost'); }, 230);
    } else place(x, y);
    if (document.activeElement === no) no.blur();
  }

  no.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') dodge(); });
  no.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { e.preventDefault(); dodge(); } });
  no.addEventListener('touchstart', (e) => { e.preventDefault(); dodge(); }, { passive: false });
  no.addEventListener('click', (e) => { e.preventDefault(); dodge(); });
  document.addEventListener('pointermove', (e) => {   // mouse approaching? run!
    if (started || e.pointerType !== 'mouse' || !no.classList.contains('flee')) return;
    const r = no.getBoundingClientRect();
    if (Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2)) < 90) dodge();
  }, { passive: true });
  addEventListener('resize', () => {
    resize();
    if (no.classList.contains('flee')) {
      const x = Math.min(parseFloat(no.style.left) || 14, Math.max(14, W - no.offsetWidth - 14));
      const y = Math.min(parseFloat(no.style.top) || 14, Math.max(14, H - no.offsetHeight - 14));
      place(x, y);
    }
  });

  /* ================= YES: start the celebration ================= */
  yes.addEventListener('click', () => {
    if (started) return;
    started = true;
    const r = yes.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top, 140);
    emojiBurst(r.left + r.width / 2, r.top, 22);
    no.style.pointerEvents = 'none'; no.style.opacity = 0;
    intro.classList.add('out');
    setTimeout(() => {
      intro.hidden = true;
      const party = $('#party');
      party.hidden = false; scrollTo(0, 0);
      requestAnimationFrame(() => party.classList.add('in'));
      burst(W * .25, H * .7, 90); burst(W * .75, H * .7, 90);
      addBalloons(); addSparkles();
      for (let i = 0; i < 6; i++) setTimeout(spawnHeart, i * 250);
      setInterval(spawnHeart, 1100);
      setInterval(() => { if (!document.hidden) rain(reduced ? 1 : 3); }, 900);
      initReveal();
    }, 750);
  });

  /* ================= Scroll reveals ================= */
  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .18 });
    els.forEach((e) => io.observe(e));
  }

  /* ================= Gift box ================= */
  const gift = $('#gift');
  gift.addEventListener('click', () => {
    const first = !gift.classList.contains('open');
    gift.classList.add('open'); gift.setAttribute('aria-expanded', 'true');
    const r = gift.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .35;
    burst(cx, cy, first ? 90 : 40); emojiBurst(cx, cy, first ? 22 : 10);
    $('#giftMsg').classList.add('show');
  });

  /* ================= Cake & wish ================= */
  const cake = $('#cake'), wish = $('#wish'), wishMsg = $('#wishMsg');
  let blown = false;
  wish.addEventListener('click', () => {
    blown = !blown;
    cake.classList.toggle('out', blown);
    if (blown) {
      const r = cake.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height * .3, 80); emojiBurst(r.left + r.width / 2, r.top + r.height * .3, 12);
      wishMsg.classList.add('show'); wish.textContent = 'Relight the candles 🕯️';
    } else {
      wishMsg.classList.remove('show'); wish.textContent = 'Make a Wish ✨';
    }
  });

  resize();
})();