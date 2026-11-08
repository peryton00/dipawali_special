/* ═══════════ lanterns.js — sky lantern experience ═══════════ */
'use strict';

/* Lanterns are drawn on the ambient canvas (Particles.addLantern);
   this module handles the wish input, release choreography and stats. */

const Lanterns = (() => {

  const WISH_DEFAULTS = [
    'May my family always shine',
    'Peace for everyone',
    'Shine on, little star',
    'आस्था की रोशनी कभी न बुझे'
  ];

  function wishText() {
    const input = $('#lanternWish');
    const t = (input.value || '').trim();
    input.value = '';
    return t || pick(WISH_DEFAULTS);
  }

  function release(wish, quiet = false) {
    const l = Particles.addLantern(wish);
    if (!quiet) {
      AudioEngine.lantern();
      Toast(`🏮 Released — “${wish}”`, 2400);
    }
    DW.stats.wish++;
    StatBar.update();
    return l;
  }

  function releaseFive() {
    const base = wishText();
    AudioEngine.lantern();
    for (let i = 0; i < 5; i++) {
      setTimeout(() => Particles.addLantern(i === 0 ? base : pick(WISH_DEFAULTS)), i * 420);
    }
    DW.stats.wish += 1;
    StatBar.update();
    Toast('🏮 Five lanterns rise together…', 2600);
  }

  function init() { /* input listeners wired via data-actions in interactions.js */ }

  return { release, releaseFive, init };
})();
