/* ═══════════ particles.js — ambient background canvas ═══════════ */
/* stars · floating golden particles · sky lanterns · golden confetti · magic cursor */

'use strict';

const Particles = (() => {

  const canvas = $('#bgCanvas');
  let ctx = fitCanvas(canvas, innerWidth, innerHeight);
  let W = innerWidth, H = innerHeight;

  const isMobile = DW.isMobile || DW.isTouch;
  const reduced = DW.prefersReduced;

  /* ── stars ── */
  const STAR_N = isMobile ? 70 : 150;
  const stars = [];
  function makeStar(fresh) {
    return { x: rand(0, W), y: rand(0, H * 0.75), r: rand(0.4, 1.6),
      tw: rand(0.5, 2.4), ph: rand(0, TAU), vy: fresh ? rand(-0.05, -0.02) : rand(-0.03, -0.008) };
  }
  for (let i = 0; i < STAR_N; i++) stars.push(makeStar(true));

  /* ── golden ambient dust ── */
  const DUST_N = isMobile ? 26 : 60;
  const dust = [];
  function makeDust() {
    return { x: rand(0, W), y: rand(0, H), r: rand(0.7, 2.2), vy: rand(-0.28, -0.08),
      vx: rand(-0.12, 0.12), ph: rand(0, TAU), a: rand(0.25, 0.7) };
  }
  for (let i = 0; i < DUST_N; i++) dust.push(makeDust());

  /* ── clouds (very subtle drifting bands) ── */
  const clouds = [];
  for (let i = 0; i < (isMobile ? 3 : 5); i++) {
    clouds.push({ x: rand(0, W), y: rand(H * 0.06, H * 0.4), w: rand(240, 520), h: rand(30, 70),
      v: rand(0.05, 0.16), a: rand(0.03, 0.07) });
  }

  /* ── lanterns (DOM-free: drawn on this canvas) ── */
  const lanterns = [];
  const MAX_LANTERNS = isMobile ? 14 : 30;

  function addLantern(wish) {
    if (lanterns.length >= MAX_LANTERNS) lanterns.shift();
    lanterns.push({
      x: rand(W * 0.08, W * 0.92), y: H + rand(20, 140),
      vx: rand(-0.18, 0.18), vy: rand(-0.55, -0.3),
      s: rand(0.7, 1.25), rot: rand(-0.2, 0.2), vr: rand(-0.003, 0.003),
      sway: rand(0, TAU), swayAmp: rand(0.2, 0.7),
      wish: wish || null, age: 0, glow: rand(0.75, 1)
    });
    DW.stats.lantern++;
    StatBar.update();
    return lanterns[lanterns.length - 1];
  }

  function drawLantern(l, now) {
    const s = l.s;
    const swx = Math.sin(l.sway) * l.swayAmp;
    ctx.save();
    ctx.translate(l.x + swx * 6, l.y);
    ctx.rotate(l.rot + Math.sin(l.sway * 0.7) * 0.08);
    // halo
    const g = ctx.createRadialGradient(0, 6 * s, 2, 0, 6 * s, 46 * s);
    g.addColorStop(0, `rgba(255,166,60,${0.5 * l.glow})`);
    g.addColorStop(0.45, `rgba(255,123,0,${0.18 * l.glow})`);
    g.addColorStop(1, 'rgba(255,123,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 6 * s, 46 * s, 0, TAU); ctx.fill();
    // body
    ctx.fillStyle = 'rgba(255,242,166,.92)';
    ctx.beginPath();
    ctx.moveTo(0, -16 * s);
    ctx.quadraticCurveTo(14 * s, -6 * s, 11 * s, 10 * s);
    ctx.quadraticCurveTo(0, 18 * s, -11 * s, 10 * s);
    ctx.quadraticCurveTo(-14 * s, -6 * s, 0, -16 * s);
    ctx.fill();
    // ribs
    ctx.strokeStyle = 'rgba(214,120,20,.4)'; ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-8 * s, -4 * s); ctx.quadraticCurveTo(0, 2 * s, 8 * s, -4 * s);
    ctx.moveTo(-10 * s, 4 * s); ctx.quadraticCurveTo(0, 10 * s, 10 * s, 4 * s);
    ctx.stroke();
    // inner flame core
    ctx.fillStyle = 'rgba(255,220,120,.95)';
    ctx.beginPath(); ctx.ellipse(0, 2 * s, 5 * s, 8 * s, 0, 0, TAU); ctx.fill();
    // rim
    ctx.strokeStyle = 'rgba(255,183,3,.7)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(0, 10 * s, 11 * s, 3.4 * s, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  /* ── confetti ── */
  const confetti = [];
  const CONF_MAX = isMobile ? 120 : 260;
  const CONF_COLORS = ['#FFD166', '#FFB703', '#FFF2A6', '#FF4D8D', '#D62828', '#FFF8E7'];
  function burstConfetti(n = 80) {
    for (let i = 0; i < n && confetti.length < CONF_MAX; i++) {
      confetti.push({
        x: rand(0, W), y: rand(-H * 0.25, 0),
        vx: rand(-0.5, 0.5), vy: rand(0.8, 2.1),
        w: rand(3, 7), h: rand(6, 12), rot: rand(0, TAU), vr: rand(-0.08, 0.08),
        ph: rand(0, TAU), color: pick(CONF_COLORS)
      });
    }
  }

  /* ── magic cursor sparkles (pointer devices only) ── */
  const cursorSparks = [];
  let lastCursor = 0, mx = -100, my = -100;
  if (!DW.isTouch && !reduced) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      const now = performance.now();
      if (now - lastCursor > 46) {
        lastCursor = now;
        cursorSparks.push({ x: mx + rand(-4, 4), y: my + rand(-4, 4),
          vx: rand(-0.3, 0.3), vy: rand(-0.5, -0.1), life: 1,
          r: rand(1, 2.4), color: pick(['255,209,102', '255,242,166', '255,183,3']) });
        if (cursorSparks.length > 40) cursorSparks.shift();
      }
    }, { passive: true });
  }

  /* ── render loop ── */
  let intensity = 1; // night mode scales dust
  const loop = new Loop(() => {
    const now = performance.now();
    ctx.clearRect(0, 0, W, H);

    // clouds
    for (const c of clouds) {
      c.x += c.v;
      if (c.x - c.w > W) c.x = -c.w;
      ctx.fillStyle = `rgba(190,200,255,${c.a})`;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, c.w / 2, c.h / 2, 0, 0, TAU);
      ctx.ellipse(c.x - c.w * 0.3, c.y + 6, c.w / 3, c.h / 3, 0, 0, TAU);
      ctx.fill();
    }

    // stars
    for (const st of stars) {
      st.y += st.vy;
      if (st.y < -4) { Object.assign(st, makeStar(false)); st.y = H * 0.75 + 4; }
      const tw = 0.55 + 0.45 * Math.sin(now * 0.001 * st.tw + st.ph);
      ctx.fillStyle = `rgba(255,248,231,${0.75 * tw})`;
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, TAU); ctx.fill();
    }

    // dust
    const dn = Math.round(DUST_N * intensity);
    for (let i = 0; i < dn; i++) {
      const d = dust[i];
      d.y += d.vy * intensity; d.x += d.vx + Math.sin(now * 0.001 + d.ph) * 0.08;
      if (d.y < -6) { d.y = H + 6; d.x = rand(0, W); }
      if (d.x < -6) d.x = W + 6; if (d.x > W + 6) d.x = -6;
      ctx.fillStyle = `rgba(255,209,102,${d.a * (0.6 + 0.4 * Math.sin(now * 0.002 + d.ph))})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, TAU); ctx.fill();
    }

    // lanterns
    for (let i = lanterns.length - 1; i >= 0; i--) {
      const l = lanterns[i];
      l.age++;
      l.y += l.vy; l.x += l.vx + Math.sin(l.sway += 0.012) * 0.24;
      l.rot += l.vr;
      if (l.y < -80 || l.x < -80 || l.x > W + 80) { lanterns.splice(i, 1); continue; }
      drawLantern(l, now);
    }

    // confetti
    for (let i = confetti.length - 1; i >= 0; i--) {
      const c = confetti[i];
      c.x += c.vx + Math.sin(now * 0.003 + c.ph) * 0.5;
      c.y += c.vy; c.rot += c.vr;
      if (c.y > H + 16) { confetti.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h * (0.55 + 0.45 * Math.sin(now * 0.004 + c.ph)));
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // cursor sparkles
    for (let i = cursorSparks.length - 1; i >= 0; i--) {
      const s = cursorSparks[i];
      s.life -= 0.03; s.x += s.vx; s.y += s.vy;
      if (s.life <= 0) { cursorSparks.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(${s.color},${s.life})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * s.life, 0, TAU); ctx.fill();
    }
  });

  /* hit-test a lantern at viewport coords (used to suppress rocket launch) */
  function hitLantern(x, y) {
    for (let i = lanterns.length - 1; i >= 0; i--) {
      const l = lanterns[i];
      const dx = x - l.x, dy = y - (l.y + 4);
      if (dx * dx + dy * dy < 48 * 48) return true;
    }
    return false;
  }

  /* lantern click → reveal wish */
  canvas.style.pointerEvents = 'none'; // stays decorative; clicks pass through
  document.addEventListener('click', e => {
    if (e.target.closest('button, a, input, select, textarea, label, .diya, #mainNav, .fw-panel, .modal, canvas#rangoliCanvas, canvas#greetCanvas')) return;
    for (let i = lanterns.length - 1; i >= 0; i--) {
      const l = lanterns[i];
      const dx = e.clientX - l.x, dy = e.clientY - (l.y + 4);
      if (dx * dx + dy * dy < 48 * 48) {
        Toast(l.wish ? `🏮 “${l.wish}”` : '🏮 A quiet wish drifts skyward…', 3200);
        AudioEngine.sparkle();
        return;
      }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop(); else loop.start();
  });

  const onResize = debounce(() => {
    W = innerWidth; H = innerHeight;
    ctx = fitCanvas(canvas, W, H);
  }, 150);
  window.addEventListener('resize', onResize);

  return {
    start() { loop.start(); },
    addLantern, burstConfetti, hitLantern,
    lanternCount: () => lanterns.length,
    setIntensity(v) { intensity = clamp(v, 0.2, 2.5); },
    resize: onResize
  };
})();

/* hero stat bar updater */
const StatBar = (() => {
  const els = {};
  function bind() {
    els.diya = $('#statDiyas'); els.lantern = $('#statLanterns'); els.wish = $('#statWishes');
  }
  function fmt(n) { return String(n); }
  return {
    bind,
    update() {
      if (!els.diya) bind();
      if (els.diya) els.diya.textContent = fmt(DW.stats.diya);
      if (els.lantern) els.lantern.textContent = fmt(Particles.lanternCount());
      if (els.wish) els.wish.textContent = fmt(DW.stats.wish);
    }
  };
})();
