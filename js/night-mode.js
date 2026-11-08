/* ═══════════ night-mode.js — immersive Diwali Night Mode ═══════════ */
'use strict';

/* Full-screen immersive celebration: continuous fireworks, synchronized diyas,
   floating wishes, ambient music, lanterns, adjustable controls. */

const NightMode = (() => {

  const root = $('#nightMode');
  const veil = $('#nightVeil');
  const diyasEl = $('#nightDiyas');
  const wishesLayer = $('#wishesLayer');
  const centerEl = $('#nightCenter');
  const wishBar = $('#nmWishBar');
  const wishInput = $('#nmWishInput');

  let active = false;
  let wishTimer = null, lanternTimer = null, grandTimer = null;
  const nightDiyas = []; // diya instances created for night mode
  let savedFwState = null;

  const AUTO_WISHES = [
    ['May happiness illuminate your life.', false],
    ['May your dreams shine brighter.', false],
    ['शुभ दीपावली', true],
    ['आपका जीवन खुशियों से रोशन हो।', true],
    ['Light over darkness, always.', false],
    ['May prosperity find your door.', false],
    ['दीपों की रोशनी आपके करवट्ट लाए', true],
    ['Wishing you endless sparkle ✦', false],
    ['हर दीप एक नई उम्मीद है', true],
    ['May this year glow golden.', false]
  ];
  let wishIdx = Math.floor(Math.random() * AUTO_WISHES.length);

  /* ── floating wishes ── */
  function floatWish(text, hindi, user = false) {
    const el = document.createElement('div');
    el.className = 'f-wish' + (hindi ? ' hindi' : '') + (user ? ' user' : '');
    el.textContent = text;
    // random non-overlapping-ish position
    const x = rand(8, 78);
    el.style.left = x + 'vw';
    el.style.bottom = rand(16, 42) + 'vh';
    const dur = rand(9, 14);
    el.style.animationDuration = dur + 's';
    wishesLayer.appendChild(el);
    DW.stats.wish++;
    StatBar.update();
    setTimeout(() => el.remove(), dur * 1000 + 100);
  }

  function startAutoWishes() {
    stopAutoWishes();
    const tick = () => {
      if (!active) return;
      const [text, hindi] = AUTO_WISHES[wishIdx++ % AUTO_WISHES.length];
      floatWish(text, hindi);
      wishTimer = setTimeout(tick, rand(2600, 5200));
    };
    wishTimer = setTimeout(tick, 1800);
  }
  function stopAutoWishes() { clearTimeout(wishTimer); }

  /* ── ambient lanterns ── */
  function startAutoLanterns() {
    stopAutoLanterns();
    const tick = () => {
      if (!active) return;
      Particles.addLantern(pick([null, 'A wish for peace', 'शुभकामनाएँ']));
      lanternTimer = setTimeout(tick, rand(7000, 14000));
    };
    lanternTimer = setTimeout(tick, 4200);
  }
  function stopAutoLanterns() { clearTimeout(lanternTimer); }

  /* occasional grand moment */
  function startGrandMoments() {
    stopGrandMoments();
    const tick = () => {
      if (!active) return;
      Fireworks.massiveBurst();
      AudioEngine.bell(0.08);
      grandTimer = setTimeout(tick, rand(22000, 40000));
    };
    grandTimer = setTimeout(tick, rand(9000, 16000));
  }
  function stopGrandMoments() { clearTimeout(grandTimer); }

  /* ── enter / exit ── */
  function enter(opts = {}) {
    if (active) return;
    active = true;
    root.hidden = false;
    root.classList.add('nm-enter');
    document.body.classList.add('night-active');
    DW.nightActive = true;

    // cinematic golden veil
    veil.classList.remove('spread-out');
    veil.classList.add('spread');
    setTimeout(() => veil.classList.remove('spread'), 1700);

    // save main-page fireworks state, configure for night
    savedFwState = {
      auto: Fireworks.getAuto(), intensity: Fireworks.getIntensity(), hue: Fireworks.getHue()
    };
    Fireworks.setIntensity('festive');
    Fireworks.setAuto(true);
    Fireworks.start();

    // ambient particles intensify
    Particles.setIntensity(2);
    Particles.start();

    // build night diya strip (once)
    if (!nightDiyas.length) {
      const n = DW.isMobile ? 7 : 12;
      for (let i = 0; i < n; i++) nightDiyas.push(Diya.create(diyasEl, 'night'));
    }
    // synchronized lighting sweep
    nightDiyas.forEach((d, i) => setTimeout(() => Diya.setLit(d, true, true), 500 + i * 130));
    setTimeout(() => AudioEngine.celebration(), 900);

    // center greeting fades, then lets the sky breathe
    centerEl.style.opacity = '1';
    setTimeout(() => { centerEl.style.opacity = '0'; }, 5200);

    // audio fade-in (only if sound was enabled by user before)
    AudioEngine.onStarted(() => {
      if (!AudioEngine.muted()) {
        if (!AudioEngine.musicActive()) AudioEngine.toggleMusic();
      }
    });

    startAutoWishes();
    startAutoLanterns();
    startGrandMoments();

    Toast('✦ Diwali Night — tap the sky, light the diyas, send a wish');
    updateControlsUI();
  }

  function exit() {
    if (!active) return;
    active = false;
    DW.nightActive = false;

    // golden veil collapses
    veil.classList.remove('spread');
    veil.classList.add('spread-out');
    setTimeout(() => veil.classList.remove('spread-out'), 1300);

    // fireworks wind down
    Fireworks.setAuto(false);
    setTimeout(() => {
      if (!active) { // truly exiting — restore main state
        Fireworks.setIntensity(savedFwState?.intensity || 'normal');
        Fireworks.setAuto(savedFwState?.auto ?? true);
        Fireworks.setHue(savedFwState?.hue || 'auto');
      }
    }, 2600);

    // diyas soften
    nightDiyas.forEach((d, i) => setTimeout(() => Diya.setLit(d, false, true), i * 90));

    // music fades out (stop with long fade)
    if (AudioEngine.musicActive()) {
      // stopMusic fades over 1.6s; toggleMusic routes to stopMusic
      AudioEngine.toggleMusic();
    }

    Particles.setIntensity(1);
    stopAutoWishes();
    stopAutoLanterns();
    stopGrandMoments();
    closeWishBar();

    setTimeout(() => {
      root.hidden = true;
      root.classList.remove('nm-enter');
      document.body.classList.remove('night-active');
      wishesLayer.innerHTML = '';
    }, 1400);

    Toast('The night gently dims… until you return ✦');
  }

  const toggle = () => active ? exit() : enter();

  /* ── wish bar ── */
  function openWishBar() {
    wishBar.hidden = false;
    DW.nightWishBarOpen = true;
    wishInput.value = '';
    wishInput.focus();
  }
  function closeWishBar() {
    wishBar.hidden = true;
    DW.nightWishBarOpen = false;
  }
  function sendWish() {
    const t = wishInput.value.trim();
    if (!t) { Toast('Write a few words first ✦'); return; }
    floatWish(t, /[\u0900-\u097F]/.test(t), true);
    AudioEngine.lantern();
    Particles.addLantern(t);
    closeWishBar();
    Toast('✦ Your wish floats to the stars…', 2600);
  }

  /* ── controls ── */
  function updateControlsUI() {
    const fwBtn = $('#nmFwToggle');
    const on = Fireworks.getAuto();
    fwBtn.classList.toggle('on', on);
    fwBtn.setAttribute('aria-pressed', String(on));
    fwBtn.textContent = on ? '🎆 Fireworks: On' : '🎆 Fireworks: Off';
    const anySound = (AudioEngine.musicActive() || true) && !AudioEngine.muted();
    const sBtn = $('#nmSound');
    sBtn.classList.toggle('on', anySound);
    sBtn.setAttribute('aria-pressed', String(anySound));
    sBtn.textContent = anySound ? '🔊 Sound: On' : '🔇 Sound: Off';
    const iMap = ['calm', 'normal', 'festive', 'grand'];
    $('#nmFwIntensity').value = String(iMap.indexOf(Fireworks.getIntensity()));
  }

  function bind() {
    $('#nmExit').addEventListener('click', exit);
    $('#nmFwToggle').addEventListener('click', () => {
      Fireworks.setAuto(!Fireworks.getAuto());
      updateControlsUI();
    });
    $('#nmFwIntensity').addEventListener('input', e => {
      const map = ['calm', 'normal', 'festive', 'grand'];
      Fireworks.setIntensity(map[+e.target.value]);
    });
    $('#nmCeleb').addEventListener('click', () => Celebration.run());
    $('#nmSound').addEventListener('click', () => {
      const muted = AudioEngine.toggleMute();
      if (!muted && !AudioEngine.musicActive()) AudioEngine.toggleMusic();
      updateControlsUI();
    });
    $('#nmMusicVol').addEventListener('input', e => AudioEngine.setMusicVol(+e.target.value / 100));
    $('#nmFxVol').addEventListener('input', e => AudioEngine.setFxVol(+e.target.value / 100));
    $('#nmLightAll').addEventListener('click', () => {
      nightDiyas.forEach((d, i) => setTimeout(() => Diya.setLit(d, true, i === 0), i * 70));
      Toast('🕯 Every diya blazes anew');
    });
    $('#nmLantern').addEventListener('click', () => {
      Particles.addLantern('A wish for you');
      AudioEngine.lantern();
    });
    $('#nmWishOpen').addEventListener('click', openWishBar);
    $('#nmWishSend').addEventListener('click', sendWish);
    $('#nmWishClose').addEventListener('click', closeWishBar);
    wishInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); sendWish(); }
    });
  }

  function init() { bind(); }

  return {
    init, enter, exit, toggle, floatWish,
    isActive: () => active
  };
})();
