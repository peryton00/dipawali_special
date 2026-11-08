/* ═══════════ audio.js — Web Audio synthesized soundscape ═══════════ */
'use strict';

/* All sounds are generated procedurally with the Web Audio API:
   no external audio assets, no autoplay — the context resumes only
   after a user gesture (intro Enter / any button click). */

const AudioEngine = (() => {

  let ctx = null;
  let master, musicBus, fxBus;
  let musicOn = false, fxOn = true, muted = false;
  let musicVol = 0.55, fxVol = 0.7;
  let musicNodes = null;          // ambient pad + bells scheduler
  let bellTimer = 0, sparkTimer = 0;
  const MAX_CONCURRENT = 16;      // avoid excessive overlap
  let live = 0;
  const startedCallbacks = [];

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = musicVol; musicBus.connect(master);
    fxBus = ctx.createGain(); fxBus.gain.value = fxVol; fxBus.connect(master);
    return ctx;
  }

  function unlock() {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    startedCallbacks.forEach(cb => cb());
    startedCallbacks.length = 0;
  }

  function guard() {
    if (!ctx || ctx.state !== 'running' || muted) return false;
    if (live >= MAX_CONCURRENT) return false;
    return true;
  }

  /* ── generic noise buffer (cached) ── */
  let noiseBuf = null;
  function noise() {
    if (noiseBuf) return noiseBuf;
    const len = ctx.sampleRate * 1.4;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }

  function env(gainNode, t, a, peak, d, sustain = 0, r = 0.05) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
    g.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
    g.exponentialRampToValueAtTime(0.0001, t + a + d + r);
  }

  function track(node, tail) {
    live++;
    setTimeout(() => live--, tail * 1000);
    return node;
  }

  /* ── SFX ─────────────────────────────────────── */

  /* firework launch — airy rising whoosh */
  function sfxLaunch() {
    if (!guard() || !fxOn) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noise(); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(320, t);
    bp.frequency.exponentialRampToValueAtTime(2900, t + 0.62);
    const g = ctx.createGain(); env(g, t, 0.05, 0.10, 0.5, 0.02, 0.14);
    src.connect(bp).connect(g).connect(fxBus);
    src.start(t); src.stop(t + 0.85);
    track(g, 0.9);
  }

  /* firework explosion — deep boom + crackle tail */
  function sfxBurst(big = false) {
    if (!guard() || !fxOn) return;
    const t = ctx.currentTime;
    // boom: filtered noise thump + sine drop
    const src = ctx.createBufferSource(); src.buffer = noise();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(big ? 900 : 1400, t);
    lp.frequency.exponentialRampToValueAtTime(90, t + (big ? 0.9 : 0.55));
    const g = ctx.createGain(); env(g, t, 0.012, big ? 0.34 : 0.2, big ? 0.7 : 0.4, 0.02, 0.3);
    src.connect(lp).connect(g).connect(fxBus);
    src.start(t); src.stop(t + 1.4);
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(big ? 120 : 170, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.5);
    const og = ctx.createGain(); env(og, t, 0.01, big ? 0.22 : 0.12, 0.4, 0.001, 0.2);
    osc.connect(og).connect(fxBus); osc.start(t); osc.stop(t + 0.8);
    track(g, 1.4); track(og, 0.9);
    // crackle
    setTimeout(() => sfxCrackle(big ? 0.09 : 0.05), (big ? 500 : 320));
  }

  function sfxCrackle(vol = 0.06) {
    if (!guard() || !fxOn) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource(); src.buffer = noise();
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3800;
    const g = ctx.createGain(); env(g, t, 0.08, vol, 0.7, 0.004, 0.4);
    src.connect(hp).connect(g).connect(fxBus);
    src.start(t); src.stop(t + 1.3);
    track(g, 1.3);
  }

  /* diya light — warm soft chime */
  function sfxDiya() {
    if (!guard() || !fxOn) return;
    const t = ctx.currentTime;
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const g = ctx.createGain(); env(g, t + i * 0.045, 0.02, i ? 0.05 : 0.09, 0.28, 0.001, 0.3);
      o.connect(g).connect(fxBus); o.start(t + i * 0.045); o.stop(t + 1);
      track(g, 1);
    });
  }

  /* temple bell */
  function sfxBell(vol = 0.1) {
    if (!guard() || !fxOn) return;
    const t = ctx.currentTime;
    const base = pick([523.25, 587.33, 659.25]);
    [1, 2.76, 5.4].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = base * m;
      const g = ctx.createGain(); env(g, t, 0.005, vol / (i + 1.2), 1.6 + i * 0.3, 0.001, 0.8);
      o.connect(g).connect(fxBus); o.start(t); o.stop(t + 3.4);
      track(g, 3.4);
    });
  }

  /* sparkle — tiny glitter arpeggio */
  function sfxSparkle() {
    if (!guard() || !fxOn) return;
    const t = ctx.currentTime;
    const notes = [1567, 1975, 2349, 3136];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); env(g, t + i * 0.06, 0.01, 0.045, 0.14, 0.001, 0.12);
      o.connect(g).connect(fxBus); o.start(t + i * 0.06); o.stop(t + 0.7);
      track(g, 0.7);
    });
  }

  /* lantern release — airy float */
  function sfxLantern() {
    if (!guard() || !fxOn) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(392, t);
    o.frequency.exponentialRampToValueAtTime(784, t + 0.8);
    const g = ctx.createGain(); env(g, t, 0.1, 0.075, 0.7, 0.02, 0.5);
    o.connect(g).connect(fxBus); o.start(t); o.stop(t + 1.6);
    const src = ctx.createBufferSource(); src.buffer = noise(); src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1200; bp.Q.value = 1;
    const ng = ctx.createGain(); env(ng, t, 0.2, 0.02, 0.6, 0.002, 0.4);
    src.connect(bp).connect(ng).connect(fxBus); src.start(t); src.stop(t + 1.4);
    track(g, 1.6); track(ng, 1.4);
  }

  /* celebration fanfare */
  function sfxCelebration() {
    if (!guard() || !fxOn) return;
    sfxBell(0.12);
    setTimeout(() => sfxSparkle(), 260);
    setTimeout(() => sfxBurst(true), 420);
  }

  /* rangoli brush tick (throttled by caller) */
  function sfxTick() {
    if (!guard() || !fxOn) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = 'triangle';
    o.frequency.value = 2000 + Math.random() * 900;
    const g = ctx.createGain(); env(g, t, 0.004, 0.02, 0.05, 0.0005, 0.05);
    o.connect(g).connect(fxBus); o.start(t); o.stop(t + 0.2);
    track(g, 0.2);
  }

  /* ── ambient music — warm Indian-flavoured pad with slow bells ── */
  const SCALE = [196.00 /*G3*/, 233.08 /*Bb3*/, 261.63 /*C4*/, 293.66 /*D4*/, 349.23 /*F4*/, 392.00 /*G4*/];

  function startMusic() {
    if (!ctx || musicNodes) return;
    const t = ctx.currentTime;
    const pad = ctx.createGain(); pad.gain.setValueAtTime(0.0001, t);
    pad.gain.exponentialRampToValueAtTime(musicVol * 0.5, t + 3); // gentle fade-in
    pad.connect(musicBus);

    // drone (tanpura-like): fundamental + fifth shimmer
    const droneG = ctx.createGain(); droneG.gain.value = 0.16; droneG.connect(pad);
    [98, 147].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = i ? 'triangle' : 'sine'; o.frequency.value = f;
      o.connect(droneG); o.start(t);
    });

    // slow swell — detuned saw pads through lowpass, chakra of sitar-ish timbre
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .6;
    const padG = ctx.createGain(); padG.gain.value = 0.12; lp.connect(padG).connect(pad);
    const padOscs = [];
    SCALE.slice(0, 4).forEach(f => {
      [1, 1.003].forEach(dt => {
        const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f * dt;
        const g = ctx.createGain(); g.gain.value = 0.2;
        o.connect(g).connect(lp); o.start(t); padOscs.push(o);
      });
    });
    // breathing filter
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain(); lfoG.gain.value = 420;
    lfo.connect(lfoG).connect(lp.frequency); lfo.start(t);

    // melody — plucked notes on the scale, slow & sparse
    const mel = ctx.createGain(); mel.gain.value = 0.2; mel.connect(pad);

    musicNodes = { pad, droneG, padG, lp, lfo, lfoG, mel, padOscs, all: [lfo, ...padOscs] };
    scheduleMelody();
    scheduleBells();
    updateMusicUI(true);
  }

  function scheduleMelody() {
    if (!musicNodes) return;
    const delay = 1400 + Math.random() * 2600;
    musicNodes.melTimer = setTimeout(() => {
      if (!musicNodes) return;
      const t = ctx.currentTime + 0.05;
      const f = pick(SCALE.slice(1)) * (Math.random() < 0.3 ? 2 : 1);
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const g = ctx.createGain(); env(g, t, 0.01, 0.3, 1.1, 0.02, 0.9);
      const vib = ctx.createOscillator(); vib.frequency.value = 5.2;
      const vibG = ctx.createGain(); vibG.gain.value = 3.5;
      vib.connect(vibG).connect(o.frequency); vib.start(t); vib.stop(t + 2.4);
      o.connect(g).connect(musicNodes.mel);
      o.start(t); o.stop(t + 2.4);
      scheduleMelody();
    }, delay);
  }

  function scheduleBells() {
    if (!musicNodes) return;
    musicNodes.bellTimer = setTimeout(() => {
      if (!musicNodes) return;
      if (!muted && fxOn) sfxBell(0.05 + Math.random() * 0.04);
      scheduleBells();
    }, 6000 + Math.random() * 9000);
  }

  function stopMusic(fade = 1.6) {
    if (!musicNodes) return;
    const nodes = musicNodes; musicNodes = null;
    clearTimeout(nodes.melTimer); clearTimeout(nodes.bellTimer);
    const t = ctx.currentTime;
    nodes.pad.gain.cancelScheduledValues(t);
    nodes.pad.gain.setValueAtTime(nodes.pad.gain.value, t);
    nodes.pad.gain.exponentialRampToValueAtTime(0.0001, t + fade);
    setTimeout(() => {
      nodes.all.forEach(o => { try { o.stop(); } catch (e) {} });
    }, fade * 1000 + 200);
    updateMusicUI(false);
  }

  /* ── controls ── */
  function updateMusicUI(on) {
    const b = document.getElementById('adMusic');
    if (b) { b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); }
    const nb = document.getElementById('nmSound');
    if (nb) {
      const anyOn = on || fxOn;
      nb.classList.toggle('on', anyOn && !muted);
      nb.setAttribute('aria-pressed', String(anyOn && !muted));
      nb.textContent = (anyOn && !muted) ? '🔊 Sound: On' : '🔇 Sound: Off';
    }
  }
  function updateFxUI() {
    const b = document.getElementById('adFx');
    if (b) { b.classList.toggle('on', fxOn); b.setAttribute('aria-pressed', String(fxOn)); }
    updateMusicUI(musicOn);
  }
  function updateMuteUI() {
    const b = document.getElementById('adMute');
    if (b) b.setAttribute('aria-pressed', String(muted));
    updateMusicUI(musicOn);
  }

  return {
    unlock,
    onStarted(cb) { if (ctx && ctx.state === 'running') cb(); else startedCallbacks.push(cb); },
    launch: sfxLaunch, burst: sfxBurst, diya: sfxDiya, bell: sfxBell,
    sparkle: sfxSparkle, lantern: sfxLantern, celebration: sfxCelebration, tick: sfxTick,
    toggleMusic() { if (musicNodes) stopMusic(); else startMusic(); return !!musicNodes; },
    musicActive: () => !!musicNodes,
    setMusicVol(v) { musicVol = clamp(v, 0, 1); if (musicBus) musicBus.gain.setTargetAtTime(musicVol, ctx.currentTime, 0.15); },
    setFxVol(v) { fxVol = clamp(v, 0, 1); if (fxBus) fxBus.gain.setTargetAtTime(fxVol, ctx.currentTime, 0.15); },
    getMusicVol: () => musicVol, getFxVol: () => fxVol,
    toggleFx() { fxOn = !fxOn; updateFxUI(); return fxOn; },
    fxEnabled: () => fxOn && !muted,
    toggleMute() {
      muted = !muted;
      if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.1);
      updateMuteUI();
      return muted;
    },
    muted: () => muted
  };
})();
