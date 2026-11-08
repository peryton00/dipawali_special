/* ═══════════ diya.js — interactive SVG diyas ═══════════ */
'use strict';

/* Each diya is a button with its own inline SVG (unique gradient ids
   generated at creation). Flames are CSS-animated; lighting spawns a small
   golden sparkle burst on the fireworks canvas. */

const Diya = (() => {

  const MSGS = [
    'The flame of hope is lit ✦', 'Warmth spreads across the night…',
    'A tiny sun in clay ☀', 'Light conquers darkness.',
    'दीप जल उठा — खुशियाँ बिखर गईं ✦', 'May this glow reach someone you love.',
    'Another diya joins the celebration ✦'
  ];

  const instances = []; // {el, lit}
  let uidSeq = 0;

  function diyaHTML(uid) {
    return `
    <span class="d-glow" aria-hidden="true"></span>
    <svg viewBox="0 0 120 130" aria-hidden="true">
      <defs>
        <linearGradient id="clay${uid}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d98a4a"/><stop offset="45%" stop-color="#9c5a2d"/>
          <stop offset="100%" stop-color="#66391a"/>
        </linearGradient>
        <linearGradient id="oil${uid}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffb703"/><stop offset="50%" stop-color="#ffe08a"/>
          <stop offset="100%" stop-color="#ffb703"/>
        </linearGradient>
      </defs>
      <ellipse cx="60" cy="124" rx="44" ry="6" fill="#000" opacity=".4"/>
      <path d="M18 92 Q60 122 102 92 L94 116 Q60 138 26 116 Z" fill="url(#clay${uid})"/>
      <ellipse cx="60" cy="92" rx="42" ry="9.5" fill="#4a2812"/>
      <ellipse class="d-oil" cx="60" cy="90.5" rx="34" ry="6.5" fill="url(#oil${uid})"/>
      <g class="d-flame">
        <path d="M60 46 Q72 74 60 90 Q48 74 60 46Z" fill="#FFF2A6" opacity=".95"/>
        <path d="M60 60 Q67 76 60 88 Q53 76 60 60Z" fill="#FFD166"/>
        <path d="M60 72 Q64 82 60 89 Q56 82 60 72Z" fill="#FF7B00"/>
      </g>
    </svg>`;
  }

  function create(container, zone = 'grid') {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'diya';
    el.setAttribute('role', 'listitem');
    el.innerHTML = diyaHTML(++uidSeq);
    el.setAttribute('aria-label', 'Diya — unlit. Click to light.');
    const inst = { el, lit: false, zone };
    el.addEventListener('click', () => toggle(inst));
    container.appendChild(el);
    instances.push(inst);
    return inst;
  }

  function setLit(inst, on, silent = false) {
    inst.lit = on;
    inst.el.classList.toggle('lit', on);
    inst.el.setAttribute('aria-label', on ? 'Diya — lit. Click to extinguish.' : 'Diya — unlit. Click to light.');
    DW.stats.diya = instances.reduce((n, d) => n + (d.lit ? 1 : 0), 0);
    updateCounters();
    if (on && !silent) {
      AudioEngine.diya();
      sparkleAt(inst.el);
      if (Math.random() < 0.28) Toast(pick(MSGS), 2200);
    }
  }

  function toggle(inst) { setLit(inst, !inst.lit); }

  function sparkleAt(el) {
    if (DW.prefersReduced) return;
    const r = el.getBoundingClientRect();
    Fireworks.explode(r.left + r.width / 2, r.top + r.height * 0.4, {
      palette: [[255, 209, 102], [255, 242, 166], [255, 183, 3]],
      count: 16, type: 'ring', silent: true // diya chime is the sound here
    });
  }

  /* ── main grid management ── */
  const grid = () => $('#diyaGrid');
  const heroRow = () => $('#heroDiyas');
  const ALL_LIT_MSG = 'All diyas are glowing ✦';

  function lightAll(stagger = 110) {
    const unlit = instances.filter(d => !d.lit);
    if (!unlit.length) { Toast(ALL_LIT_MSG); return; }
    unlit.forEach((d, i) => setTimeout(() => setLit(d, true), i * stagger));
    setTimeout(() => Toast(ALL_LIT_MSG, 2200), unlit.length * stagger + 400);
  }

  function extinguishAll() {
    instances.forEach(d => setLit(d, false, true));
  }

  function reset() {
    extinguishAll();
    // keep only the first 12 grid diyas (hero & night zones are untouched)
    const gridInst = instances.filter(d => d.zone === 'grid');
    const keepers = new Set(gridInst.slice(0, 12));
    for (let i = instances.length - 1; i >= 0; i--) {
      const d = instances[i];
      if (d.zone === 'grid' && !keepers.has(d)) { d.el.remove(); instances.splice(i, 1); }
    }
    Toast('The diyas rest, waiting for light…');
  }

  function addMore(n = 6) {
    const g = grid();
    for (let i = 0; i < n; i++) create(g);
    Toast(`+${n} diyas added — ${instances.length} in the courtyard`);
  }

  /* light-the-world sweep animation */
  function lightTheWorld() {
    AudioEngine.celebration();
    instances.forEach((d, idx) => setTimeout(() => setLit(d, true), idx * 90));
    Particles.burstConfetti(DW.isMobile ? 60 : 120);
    Toast('🌏 Light the World — every diya kindles!', 3200);
  }

  function updateCounters() {
    const c = $('#diyaCount'); if (c) c.textContent = DW.stats.diya;
    StatBar.update();
  }

  function init() {
    const g = grid();
    for (let i = 0; i < 12; i++) create(g, 'grid');
    const hr = heroRow();
    if (hr) {
      const heroN = DW.isMobile ? 5 : 8;
      for (let i = 0; i < heroN; i++) {
        const d = create(hr, 'hero');
        d.el.setAttribute('tabindex', '-1');
        d.el.setAttribute('aria-hidden', 'true'); // decorative row
      }
    }
    updateCounters();
  }

  return {
    init, create, setLit, lightAll, extinguishAll, reset, addMore, lightTheWorld,
    toggle,
    get count() { return instances.length; },
    get lit() { return DW.stats.diya; },
    instances,
    /* pick a random unlit diya and light it (keyboard D / hero button) */
    lightOne() {
      const unlit = instances.filter(d => !d.lit && d.zone === 'grid');
      if (!unlit.length) { const d = create(grid(), 'grid'); setLit(d, true); return true; }
      setLit(pick(unlit), true);
      return true;
    },
    get heroDiyas() { return instances.filter(d => d.zone === 'hero'); }
  };
})();
