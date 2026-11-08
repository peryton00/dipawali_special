/* ═══════════ interactions.js — nav, celebration, ripple, shortcuts ═══════════ */
'use strict';

/* ── ripple effect on all buttons ── */
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
  const r = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height);
  const span = document.createElement('span');
  span.className = 'ripple';
  span.style.width = span.style.height = size + 'px';
  span.style.left = (e.clientX - r.left - size / 2) + 'px';
  span.style.top = (e.clientY - r.top - size / 2) + 'px';
  btn.appendChild(span);
  setTimeout(() => span.remove(), 700);
});

/* ── celebration mode sequence ── */
const Celebration = (() => {
  let running = false;
  function run() {
    if (running) return;
    running = true;
    AudioEngine.celebration();
    Diya.lightAll(70);
    const cx = innerWidth / 2, cy = innerHeight * 0.3;
    Fireworks.massiveBurst(cx, cy);
    setTimeout(() => Fireworks.launch(cx - rand(150, 260), cy + 40, { big: true, count: 120 }), 300);
    setTimeout(() => Fireworks.launch(cx + rand(150, 260), cy + 20, { big: true, count: 120 }), 550);
    setTimeout(() => Fireworks.explode(cx, cy - 60, { palette: [[255, 77, 141], [255, 242, 166]], count: 130, type: 'heart' }), 800);
    Particles.burstConfetti(DW.isMobile ? 80 : 160);
    for (let i = 0; i < 4; i++) setTimeout(() => Particles.addLantern(), 400 + i * 350);
    Toast('✦ शुभ दीपावली! Happy Diwali! ✦', 3600);
    setTimeout(() => { running = false; }, 2600);
  }
  return { run };
})();

/* ── navigation ── */
const Nav = (() => {
  const nav = $('#mainNav');
  const links = $('#navLinks');
  const toggleBtn = $('#navToggle');

  function init() {
    // mobile toggle
    toggleBtn.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggleBtn.setAttribute('aria-expanded', String(open));
    });
    // close when a link is chosen
    links.addEventListener('click', e => {
      if (e.target.closest('a')) {
        links.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        links.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // active section detection
    const sections = ['home', 'diyas', 'fireworks', 'rangoli', 'lanterns', 'greetings']
      .map(id => document.getElementById(id)).filter(Boolean);
    const onScroll = debounce(() => {
      if (DW.nightActive) return;
      const pos = scrollY + innerHeight * 0.35;
      let current = 'home';
      for (const s of sections) if (s.offsetTop <= pos) current = s.id;
      $$('#navLinks a').forEach(a => a.classList.toggle('active', a.dataset.nav === current));
    }, 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  return { init };
})();

/* ── scroll reveals ── */
const Reveal = (() => {
  function init() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || DW.prefersReduced) {
      els.forEach(el => el.classList.add('revealed'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('revealed');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14 });
    els.forEach(el => io.observe(el));
  }
  return { init };
})();

/* ── global action dispatcher (data-action buttons) ── */
const ACTIONS = {
  'celebrate': () => Celebration.run(),
  'light-one': () => Diya.lightOne(),
  'launch-fws': () => { Fireworks.massiveBurst(); Toast('🎆 The sky answers with light!'); },
  'night': () => NightMode.enter(),
  'goto-greeting': () => {
    if (DW.nightActive) NightMode.exit();
    $('#greetings').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => $('#gSender').focus({ preventScroll: true }), 700);
  },
  'light-all': () => Diya.lightAll(),
  'add-diyas': () => Diya.addMore(),
  'reset-diyas': () => Diya.reset(),
  'light-world': () => Diya.lightTheWorld(),
  'release-lantern': () => { Lanterns.release(); },
  'release-five': () => Lanterns.releaseFive(),
  'random-wish': () => Greetings.randomWish()
};

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  AudioEngine.unlock();
  const fn = ACTIONS[btn.dataset.action];
  if (fn) fn();
});

/* ── keyboard shortcuts ── */
const Keys = (() => {
  function isTyping(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }
  function onKey(e) {
    if (isTyping(document.activeElement)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key.toLowerCase()) {
      case 'f': AudioEngine.unlock(); Fireworks.launch(); break;
      case 'd': AudioEngine.unlock(); Diya.lightOne(); break;
      case 'l': AudioEngine.unlock(); Lanterns.release(); break;
      case 'c': AudioEngine.unlock(); Celebration.run(); break;
      case 'm': AudioEngine.unlock(); AudioEngine.toggleMusic(); Toast(AudioEngine.musicActive() ? '♪ Music on' : '♪ Music off'); break;
      case 'n': AudioEngine.unlock(); NightMode.toggle(); break;
      case '?': HelpFocus(); break;
      case 'escape':
        if (!$('#templateModal').hidden) Rangoli.closeModal();
        else if (DW.nightWishBarOpen) { $('#nmWishClose').click(); }
        else if (DW.nightActive) NightMode.exit();
        break;
    }
  }
  function HelpFocus() {
    if (DW.nightActive) return;
    const help = document.querySelector('.help-section');
    if (help) help.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function init() { document.addEventListener('keydown', onKey); }
  return { init };
})();

/* ── audio dock ── */
const AudioDock = (() => {
  function init() {
    const mute = $('#adMute'), music = $('#adMusic'), fx = $('#adFx');
    mute.addEventListener('click', () => { AudioEngine.unlock(); AudioEngine.toggleMute(); });
    music.addEventListener('click', () => {
      AudioEngine.unlock();
      AudioEngine.toggleMusic();
      Toast(AudioEngine.musicActive() ? '♪ Ambient music on' : '♪ Ambient music off');
    });
    fx.addEventListener('click', () => { AudioEngine.unlock(); AudioEngine.toggleFx(); });
  }
  return { init };
})();

/* ── fireworks panel controls ── */
const FwPanel = (() => {
  function init() {
    $('#fwAuto').addEventListener('change', e => {
      Fireworks.setAuto(e.target.checked);
      Toast(e.target.checked ? '🎆 Automatic fireworks on' : '🎆 Automatic fireworks off');
    });
    $('#fwIntensity').addEventListener('change', e => Fireworks.setIntensity(e.target.value));
    $('#fwHue').addEventListener('change', e => Fireworks.setHue(e.target.value));
    $('#fwLaunchBtn').addEventListener('click', () => { AudioEngine.unlock(); Fireworks.launch(); });
    $('#finaleBtn').addEventListener('click', () => { AudioEngine.unlock(); Fireworks.massiveBurst(); Toast('💥 Burst of Happiness!'); });
  }
  return { init };
})();
