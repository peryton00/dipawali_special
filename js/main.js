/* ═══════════ main.js — bootstrapping the Diwali SPA ═══════════ */
'use strict';

/* Intro sequence → celebration handoff */

const Intro = (() => {
  const intro = $('#intro');
  const canvas = $('#introCanvas');
  let ctx = fitCanvas(canvas, innerWidth, innerHeight);
  let done = false;

  // golden particles drifting up during the intro
  const motes = [];
  for (let i = 0; i < 70; i++) {
    motes.push({ x: rand(0, innerWidth), y: rand(0, innerHeight), r: rand(0.6, 2.4),
      vy: rand(-0.4, -0.12), a: rand(0.15, 0.6), ph: rand(0, TAU) });
  }

  const loop = new Loop(() => {
    const now = performance.now();
    const W = innerWidth, H = innerHeight;
    ctx.clearRect(0, 0, W, H);
    // slowly illuminating center
    const t = Math.min(1, (now - startT) / 4200);
    const g = ctx.createRadialGradient(W / 2, H * 0.62, 10, W / 2, H * 0.62, Math.max(W, H) * (0.12 + t * 0.55));
    g.addColorStop(0, `rgba(255,209,102,${0.16 * t + 0.03})`);
    g.addColorStop(0.5, `rgba(255,123,0,${0.07 * t})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // motes
    for (const m of motes) {
      m.y += m.vy;
      if (m.y < -5) { m.y = H + 5; m.x = rand(0, W); }
      ctx.fillStyle = `rgba(255,209,102,${m.a * (0.6 + 0.4 * Math.sin(now * 0.002 + m.ph))})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
    }
  });

  let startT = performance.now();

  function finish(withSound) {
    if (done) return;
    done = true;
    loop.stop();
    if (withSound) {
      AudioEngine.unlock();
      AudioEngine.diya();
      setTimeout(() => AudioEngine.bell(0.09), 500);
    }
    intro.classList.add('intro-out');
    setTimeout(() => { intro.remove(); }, 1300);
    // gentle welcome fireworks once the hero is visible
    setTimeout(() => {
      Fireworks.launch(innerWidth * 0.3, innerHeight * 0.3, { palette: [[255, 209, 102], [255, 242, 166]] });
      setTimeout(() => Fireworks.launch(innerWidth * 0.68, innerHeight * 0.26, { palette: [[255, 77, 141], [255, 209, 102]] }), 900);
    }, 900);
    // light a few hero diyas softly
    Diya.instances.slice(-6).forEach((d, i) => setTimeout(() => Diya.setLit(d, true, true), 1400 + i * 180));
  }

  function init() {
    loop.start();
    $('#introEnter').addEventListener('click', () => finish(true));
    $('#introSkip').addEventListener('click', () => finish(false));
    $('#introSound').addEventListener('click', e => {
      AudioEngine.unlock();
      // intro sound toggle = master mute; starts muted-off, so first tap enables sound
      const nowMuted = AudioEngine.toggleMute();
      e.currentTarget.setAttribute('aria-pressed', String(!nowMuted));
      Toast(nowMuted ? '🔇 Sound off' : '🔊 Sound on — शुभकामनाएँ!');
    });
    // Enter key on the intro
    document.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !done) finish(true);
    }, { once: false });
    // auto-advance once the cinematic sequence completes (never trap the user;
    // silent because audio requires a gesture) — faster for reduced motion
    setTimeout(() => { if (!done) finish(false); }, DW.prefersReduced ? 2600 : 7400);
    window.addEventListener('resize', debounce(() => {
      if (done) return;
      ctx = fitCanvas(canvas, innerWidth, innerHeight);
    }, 150));
  }
  return { init, finish };
})();

/* ── boot ── */
document.addEventListener('DOMContentLoaded', () => {
  StatBar.bind();
  Particles.start();
  Diya.init();
  Rangoli.init();
  Greetings.init();
  NightMode.init();
  Nav.init();
  Reveal.init();
  Keys.init();
  AudioDock.init();
  FwPanel.init();
  Intro.init();
  Fireworks.start(); // automatic fireworks at Normal intensity from the start

  /* shareable deep links: ?skip=1 jumps past the intro, ?night=1 opens
     straight into Diwali Night Mode */
  const params = new URLSearchParams(location.search);
  if (params.get('skip') === '1') Intro.finish(false);
  if (params.get('night') === '1') {
    setTimeout(() => { Intro.finish(false); NightMode.enter(); }, DW.prefersReduced ? 300 : 1200);
  }

  // never autoplay audio; arm unlock on first pointer interaction anywhere
  const unlockOnce = () => { AudioEngine.unlock(); };
  document.addEventListener('pointerdown', unlockOnce, { once: true });
});
