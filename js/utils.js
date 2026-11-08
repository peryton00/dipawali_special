/* ═══════════ utils.js — helpers & shared state ═══════════ */
'use strict';

const DW = {
  prefersReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  isTouch: window.matchMedia('(hover: none), (pointer: coarse)').matches,
  isMobile: window.matchMedia('(max-width: 768px)').matches,
  DPR: Math.min(window.devicePixelRatio || 1, 2),
  // live counters
  stats: { diya: 0, lantern: 0, wish: 0 }
};

const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand  = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const TAU = Math.PI * 2;

/* debounce */
function debounce(fn, wait = 150) {
  let t;
  return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), wait); };
}

/* rAF loop manager — pauses when tab hidden */
class Loop {
  constructor(fn) { this.fn = fn; this.running = false; this.raf = 0; this._tick = this._tick.bind(this); }
  _tick(t) { if (!this.running) return; this.fn(t); this.raf = requestAnimationFrame(this._tick); }
  start() { if (this.running) return; this.running = true; this.raf = requestAnimationFrame(this._tick); }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}

/* canvas sizing helper (DPR aware, debounced by caller) */
function fitCanvas(canvas, w, h) {
  const dpr = DW.DPR;
  canvas.width = Math.max(1, Math.round(w * dpr));
  canvas.height = Math.max(1, Math.round(h * dpr));
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/* toast messages */
const Toast = (() => {
  const el = $('#toast');
  let timer;
  return (msg, ms = 2600) => {
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => el.classList.remove('show'), ms);
  };
})();

/* trigger a CSS animation restart helper */
function pulse(el, cls = 'pulse') {
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}
