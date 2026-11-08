/* ═══════════ fireworks.js — canvas fireworks engine ═══════════ */
'use strict';

/* Types: golden, rainbow, chrysanthemum, ring, heart, star, willow, spiral, multi-layer, glitter trails.
   Physics: velocity, gravity, drag, lifetime, fade, trails, radius, color transitions, sparks. */

const Fireworks = (() => {

  const canvas = $('#fwCanvas');
  let ctx = fitCanvas(canvas, innerWidth, innerHeight);
  let W = innerWidth, H = innerHeight;

  /* ── particle pool ── */
  const POOL_SIZE = DW.isMobile ? 900 : 2200;
  const pool = new Array(POOL_SIZE);
  let poolIdx = 0;
  for (let i = 0; i < POOL_SIZE; i++) pool[i] = { alive: false };

  function alloc() {
    // search from poolIdx, wrap once
    for (let k = 0; k < POOL_SIZE; k++) {
      const p = pool[(poolIdx + k) % POOL_SIZE];
      if (!p.alive) { poolIdx = (poolIdx + k + 1) % POOL_SIZE; return p; }
    }
    return null; // exhausted — skip spawn
  }

  const rockets = [];   // {x,y,vx,vy,targetY,color,type,hue,trail}
  let activeParticles = 0;

  const GRAVITY = 0.045;
  const DRAG = 0.985;

  const loop = new Loop(update);

  /* ── palettes ── */
  const GOLD   = [255, 209, 102];
  const FLAME  = [255, 242, 166];
  const PINK   = [255, 77, 141];
  const CRIMSON= [214, 40, 40];
  const CYAN   = [80, 220, 255];
  const GREEN  = [120, 255, 170];
  const VIOLET = [170, 120, 255];

  const HUE_MAP = {
    gold: () => [GOLD, FLAME, GOLD, [255, 183, 3]],
    rainbow: () => [pick([GOLD, PINK, CYAN, GREEN, VIOLET, CRIMSON])],
    pink: () => [PINK, [255, 170, 200], FLAME],
    crimson: () => [CRIMSON, [255, 120, 90], GOLD]
  };

  function paletteFor(mode) {
    if (HUE_MAP[mode]) return HUE_MAP[mode]();
    // auto — golden dominates
    const r = Math.random();
    if (r < 0.42) return [GOLD, FLAME, [255, 183, 3]];
    if (r < 0.6) return [PINK, [255, 150, 190]];
    if (r < 0.75) return [CYAN, [190, 240, 255]];
    if (r < 0.9) return [GREEN, [200, 255, 220]];
    return [VIOLET, [220, 190, 255], GOLD];
  }

  /* ── spawn a particle ── */
  function spawn(x, y, vx, vy, color, opts = {}) {
    const p = alloc(); if (!p) return null;
    p.alive = true;
    p.x = x; p.y = y; p.vx = vx; p.vy = vy;
    p.color = color;
    p.life = p.maxLife = opts.life || rand(0.75, 1.25);
    p.size = opts.size || rand(1.4, 2.6);
    p.grav = opts.grav !== undefined ? opts.grav : GRAVITY;
    p.drag = opts.drag !== undefined ? opts.drag : DRAG;
    p.glitter = !!opts.glitter;
    p.glimmer = opts.glimmer || 0;
    p.trail = !!opts.trail;
    p.colorTo = opts.colorTo || null;
    p.spark = !!opts.spark;
    p.prevX = x; p.prevY = y;
    return p;
  }

  /* ── explosion generators ── */

  function explode(x, y, opts = {}) {
    const mode = opts.hue || hueMode;
    const type = opts.type || pick(TYPES);
    const pal = opts.palette || paletteFor(mode);
    const color = pal[0];
    const count = Math.round((opts.count || baseCount()) * (DW.isMobile ? 0.62 : 1));
    switch (type) {
      case 'chrysanthemum': burstRadial(x, y, pal, count, 3.4, { trail: true, glitter: Math.random() < 0.6 }); break;
      case 'ring':          burstRing(x, y, pal, Math.round(count * 0.7), 3.6); break;
      case 'heart':         burstShape(x, y, pal, heartPoints, count); break;
      case 'star':          burstShape(x, y, pal, starPoints, count); break;
      case 'willow':        burstWillow(x, y, pal, count); break;
      case 'spiral':        burstSpiral(x, y, pal, count); break;
      case 'multi':         burstMulti(x, y, pal, count); break;
      default:              burstRadial(x, y, pal, count, 3.2, {}); // golden / peony
    }
    if (!opts.silent) AudioEngine.burst(opts.big);
  }

  const TYPES = ['peony', 'chrysanthemum', 'ring', 'heart', 'star', 'willow', 'spiral', 'multi'];

  function baseCount() { return randInt(70, 110); }

  function burstRadial(x, y, pal, count, speed, extra) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const v = speed * (0.3 + Math.random() * 0.7) * 1.4;
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v,
        pick(pal), Object.assign({ colorTo: pick(pal), glitter: Math.random() < 0.35 }, extra));
    }
    // core flash
    spawn(x, y, 0, 0, FLAME, { life: 0.3, size: 26, grav: 0, drag: 0.9 });
  }

  function burstRing(x, y, pal, count, speed) {
    const rot = Math.random() * TAU;
    const squash = 0.62 + Math.random() * 0.3; // perspective ellipse
    for (let i = 0; i < count; i++) {
      const a = (i / count) * TAU + rot;
      const v = speed * 1.15 * rand(0.95, 1.05);
      const vy = Math.sin(a) * v * squash;
      spawn(x, y, Math.cos(a) * v, vy, pal[0],
        { colorTo: pick(pal), glitter: Math.random() < 0.4, trail: true });
    }
    spawn(x, y, 0, 0, FLAME, { life: 0.28, size: 22, grav: 0, drag: 0.9 });
  }

  function burstShape(x, y, pal, shapeFn, count) {
    const pts = shapeFn(count);
    const scale = rand(2.6, 3.4);
    const rot = rand(-0.3, 0.3);
    const cosR = Math.cos(rot), sinR = Math.sin(rot);
    for (const [px, py] of pts) {
      const rx = px * cosR - py * sinR, ry = px * sinR + py * cosR;
      spawn(x, y, rx * scale, ry * scale, pal[0],
        { colorTo: pick(pal), glitter: true, trail: true, drag: 0.982, grav: 0.03 });
    }
    spawn(x, y, 0, 0, FLAME, { life: 0.3, size: 20, grav: 0, drag: 0.9 });
  }

  function heartPoints(n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const t = (i / n) * TAU;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      pts.push([hx / 16, hy / 16]);
    }
    return pts;
  }
  function starPoints(n) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU - Math.PI / 2;
      const spike = (i % 2 === 0) ? 1 : 0.45;
      pts.push([Math.cos(a) * spike, Math.sin(a) * spike]);
    }
    return pts;
  }

  function burstWillow(x, y, pal, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU;
      const v = rand(0.8, 2.6);
      spawn(x, y, Math.cos(a) * v, Math.sin(a) * v - 0.4, pick(pal),
        { life: rand(1.6, 2.4), grav: 0.055, drag: 0.99, glitter: true, trail: true,
          colorTo: [255, 183, 3], size: rand(1, 1.8) });
    }
  }

  function burstSpiral(x, y, pal, count) {
    const arms = 3;
    const rot = Math.random() * TAU;
    for (let arm = 0; arm < arms; arm++) {
      const off = rot + (arm / arms) * TAU;
      const per = Math.floor(count / arms);
      for (let i = 0; i < per; i++) {
        const t = i / per;
        const a = off + t * 3.4;
        const v = 0.6 + t * 3.1;
        spawn(x, y, Math.cos(a) * v, Math.sin(a) * v, pal[0],
          { colorTo: pick(pal), trail: true, glitter: Math.random() < 0.3 });
      }
    }
    spawn(x, y, 0, 0, FLAME, { life: 0.3, size: 24, grav: 0, drag: 0.9 });
  }

  function burstMulti(x, y, pal, count) {
    // multi-layered: inner + outer bursts, staggered
    burstRadial(x, y, pal, Math.floor(count * 0.55), 1.7, { glitter: true });
    setTimeout(() => {
      if (!running) return;
      burstRadial(x, y, pal.length > 1 ? [pal[1], pal[0]] : pal, Math.floor(count * 0.8), 3.6, { trail: true });
    }, 160);
    setTimeout(() => {
      if (!running) return;
      burstRing(x, y, [FLAME, pal[0]], Math.floor(count * 0.5), 4.4);
    }, 340);
  }

  /* ── rockets ── */
  function launch(tx, ty, opts = {}) {
    if (rockets.length > (DW.isMobile ? 10 : 26)) return;
    const sx = opts.sx !== undefined ? opts.sx : rand(W * 0.12, W * 0.88);
    const sy = H + 10;
    const targetY = clamp(ty !== undefined ? ty : rand(H * 0.12, H * 0.5), H * 0.06, H * 0.62);
    // ballistic solve: vy such that rocket arcs to target
    const vy = -Math.sqrt(2 * 0.16 * (sy - targetY)) - rand(0, 1.2);
    const flight = Math.floor((-vy / 0.16) * 0.92);
    const vx = ((tx !== undefined ? tx : sx + rand(-140, 140)) - sx) / Math.max(flight, 12);
    const pal = opts.palette || paletteFor(opts.hue || hueMode);
    rockets.push({ x: sx, y: sy, vx, vy: vy * 0.82, tx, ty: targetY, vyBase: 0.16,
      color: pal[0], type: opts.type, palette: pal, count: opts.count, big: opts.big });
    AudioEngine.launch();
  }

  /* ── update & render ── */
  let running = false;
  let r, i, p;

  function update() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    /* rockets */
    for (i = rockets.length - 1; i >= 0; i--) {
      r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.vy += r.vyBase;
      // trail sparks
      if (Math.random() < 0.8) {
        spawn(r.x - r.vx * rand(0.2, 0.9), r.y + rand(2, 8), rand(-0.3, 0.3), rand(0.1, 0.6),
          [255, 183, 3], { life: rand(0.3, 0.6), size: rand(0.8, 1.6), grav: 0.02 });
      }
      // head glow
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,220,130,.95)';
      ctx.arc(r.x, r.y, 2.1, 0, TAU); ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255,140,40,.35)';
      ctx.arc(r.x, r.y, 5.5, 0, TAU); ctx.fill();
      if (r.vy > -0.9) { // apex → explode
        explode(r.x, r.y, { palette: r.palette, type: r.type, count: r.count, big: r.big });
        rockets.splice(i, 1);
      }
    }

    /* particles */
    activeParticles = 0;
    for (i = 0; i < POOL_SIZE; i++) {
      p = pool[i];
      if (!p.alive) continue;
      activeParticles++;
      p.life -= 1 / 60;
      if (p.life <= 0) { p.alive = false; continue; }
      p.prevX = p.x; p.prevY = p.y;
      p.vx *= p.drag; p.vy *= p.drag;
      p.vy += p.grav;
      p.x += p.vx; p.y += p.vy;

      const lt = p.life / p.maxLife; // 1→0
      let alpha = lt < 0.5 ? lt * 2 : 1;
      if (p.glimmer > 0) alpha *= 0.5 + 0.5 * Math.sin((p.x + p.y) * 0.35 + performance.now() * 0.02);

      // colour transition (lerp toward colorTo as life ends)
      let cr = p.color[0], cg = p.color[1], cb = p.color[2];
      if (p.colorTo && lt < 0.6) {
        const m = (0.6 - lt) / 0.6;
        cr += (p.colorTo[0] - cr) * m; cg += (p.colorTo[1] - cg) * m; cb += (p.colorTo[2] - cb) * m;
      }
      // glitter twinkle
      if (p.glitter && Math.random() < 0.08) alpha *= rand(0.15, 0.6);

      if (p.trail) {
        ctx.strokeStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${alpha * 0.85})`;
        ctx.lineWidth = p.size;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.prevX, p.prevY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.6 + lt * 0.4), 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ── automatic launcher ── */
  let auto = true;
  let hueMode = 'auto';
  const INTENSITY = {
    calm:    { gap: [2800, 5200], batch: 1, bigChance: 0.02 },
    normal:  { gap: [1500, 3200], batch: 1, bigChance: 0.08 },
    festive: { gap: [900, 2000],  batch: 2, bigChance: 0.14 },
    grand:   { gap: [480, 1100],  batch: 3, bigChance: 0.22 }
  };
  let intensityKey = 'normal';
  let nextAuto = performance.now() + 800;
  let autoTimer = 0;

  function autoTick(now) {
    if (!auto || !running) return;
    if (now >= nextAuto) {
      const cfg = INTENSITY[intensityKey];
      const n = randInt(1, cfg.batch);
      for (let k = 0; k < n; k++) {
        setTimeout(() => launch(undefined, undefined, {
          big: Math.random() < cfg.bigChance,
          count: Math.random() < cfg.bigChance ? 150 : undefined
        }), k * rand(90, 260));
      }
      nextAuto = now + rand(cfg.gap[0], cfg.gap[1]);
    }
  }
  // piggyback autoTick onto the render loop
  const baseUpdate = update;
  function updateWithAuto() { autoTimer = performance.now(); autoTick(autoTimer); baseUpdate(); }
  loop.fn = updateWithAuto;

  /* visibility pause */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) loop.stop();
    else if (running) loop.start();
  });

  /* ── resize ── */
  const onResize = debounce(() => {
    W = innerWidth; H = innerHeight;
    ctx = fitCanvas(canvas, W, H);
  }, 150);

  /* ── interactions on the whole page sky ── */
  let holdTimer = null, dragging = false, lastDragLaunch = 0, moved = false, downAt = 0;

  function pageXY(e) {
    const t = e.touches ? e.touches[0] : (e.changedTouches ? e.changedTouches[0] : e);
    return { x: t.clientX, y: t.clientY };
  }

  function onDown(e) {
    if (DW.nightWishBarOpen) return;
    const { x, y } = pageXY(e);
    // ignore UI elements
    if (e.target.closest('button, a, input, select, textarea, label, .diya, .night-controls, .audio-dock, .nm-wish-bar, #mainNav, canvas#rangoliCanvas, canvas#greetCanvas, .modal, .fw-panel, .template-tile')) return;
    skyDown = true;
    downAt = performance.now(); moved = false;
    downPos = { x, y };
    holdTimer = setTimeout(() => { // hold = repeated launches
      holdTimer = setInterval(() => launch(x + rand(-60, 60), y), 300);
    }, 420);
  }
  function onMove(e) {
    const { x, y } = pageXY(e);
    if (Math.abs(x - (dragLast?.x ?? x)) > 6) {
      moved = true;
      clearTimeout(holdTimer); clearInterval(holdTimer); // scrolling cancels hold-launch
    }
    /* drag-trail: mouse drag anywhere; touch drag only in Night Mode
       (page scroll there is locked, so touchmove is a deliberate gesture) */
    const isDragGesture = !DW.isTouch ? (e.buttons === 1) : (DW.nightActive && skyDown);
    if (isDragGesture) {
      dragging = true;
      const now = performance.now();
      if (now - lastDragLaunch > 170) {
        lastDragLaunch = now;
        launch(x, y);
      }
    }
    dragLast = { x, y };
  }
  let dragLast = null, skyDown = false, downPos = { x: 0, y: 0 };
  function onUp(e) {
    clearTimeout(holdTimer); clearInterval(holdTimer);
    skyDown = false;
    if (dragging) { dragging = false; return; }
    const { x, y } = pageXY(e.changedTouches ? e.changedTouches[0] : e);
    // treat as a scroll/swipe (not a tap) if the pointer travelled far
    const travel = Math.hypot(x - downPos.x, y - downPos.y);
    if (moved || travel > 12 || performance.now() - downAt > 500) return;
    if (e.target.closest('button, a, input, select, textarea, label, .diya, .night-controls, .audio-dock, .nm-wish-bar, #mainNav, canvas#rangoliCanvas, canvas#greetCanvas, .modal')) return;
    // don't fire a rocket when the tap revealed a lantern wish instead
    if (window.Particles && Particles.hitLantern && Particles.hitLantern(x, y)) return;
    launch(x, y);
  }
  function onDbl(e) {
    const { x, y } = pageXY(e);
    massiveBurst(x, y);
  }

  let bound = false;
  function bindEvents() {
    if (bound) return;
    bound = true;
    if (DW.isTouch) {
      document.addEventListener('touchstart', onDown, { passive: true });
      document.addEventListener('touchmove', onMove, { passive: true });
      document.addEventListener('touchend', onUp, { passive: true });
    } else {
      document.addEventListener('mousedown', onDown);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('dblclick', onDbl);
    }
  }

  /* ── public API ── */
  let started = false;
  return {
    start() {
      if (started) { if (!running) { running = true; loop.start(); } return; }
      started = true;
      running = true;
      loop.start(); bindEvents(); window.addEventListener('resize', onResize);
    },
    stop() { running = false; loop.stop(); },
    isRunning: () => running,
    launch,
    explode,
    massiveBurst(x = W / 2, y = H * 0.32) {
      launch(x, y, { big: true, count: 170, type: 'multi', palette: [GOLD, FLAME, [255, 183, 3]] });
      setTimeout(() => launch(x + rand(-160, 160), y + rand(-40, 60), { big: true, count: 130, type: 'chrysanthemum', palette: [PINK, [255, 170, 200], FLAME] }), 240);
      setTimeout(() => launch(x + rand(-200, 200), y + rand(-60, 40), { big: true, count: 150, type: 'willow', palette: [GOLD, [255, 183, 3]] }), 480);
      setTimeout(() => launch(x + rand(-120, 120), y + rand(-30, 50), { big: true, count: 120, type: 'ring', palette: [CYAN, FLAME] }), 700);
    },
    setAuto(v) { auto = !!v; nextAuto = performance.now() + 600; return auto; },
    getAuto: () => auto,
    setIntensity(k) { if (INTENSITY[k]) intensityKey = k; },
    getIntensity: () => intensityKey,
    setHue(m) { hueMode = HUE_MAP[m] ? m : 'auto'; },
    getHue: () => hueMode,
    activeCount: () => activeParticles,
    resize: onResize
  };
})();
