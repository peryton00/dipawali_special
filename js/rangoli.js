/* ═══════════ rangoli.js — symmetrical mandala studio ═══════════ */
'use strict';

const Rangoli = (() => {

  const canvas = $('#rangoliCanvas');
  const mainCtx = canvas.getContext('2d');
  const SIZE = 640;
  canvas.width = SIZE; canvas.height = SIZE;
  mainCtx.lineCap = 'round';

  const COLORS = ['#FFD166', '#FFB703', '#FF4D8D', '#D62828', '#FF7B00',
                  '#FFF2A6', '#4CC9F0', '#80FFAA', '#B07CFF', '#FFF8E7',
                  '#FF9F1C', '#2EC4B6'];

  let color = COLORS[0];
  let brush = 10;
  let symmetry = 12;
  let pattern = 'solid';
  let drawing = false;
  let last = null;
  let lastTick = 0;

  /* undo history (ImageData snapshots) */
  const history = [];
  const MAX_HISTORY = 25;
  function snapshot() {
    try {
      history.push(mainCtx.getImageData(0, 0, SIZE, SIZE));
      if (history.length > MAX_HISTORY) history.shift();
    } catch (e) { /* ignore */ }
  }

  /* faint construction guides */
  function drawGuides(g) {
    g.save();
    g.globalAlpha = 0.16;
    g.strokeStyle = '#FFD166';
    g.lineWidth = 1;
    [60, 130, 200, 270].forEach(r => {
      g.beginPath(); g.arc(SIZE / 2, SIZE / 2, r, 0, TAU); g.stroke();
    });
    g.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * TAU;
      const x = SIZE / 2 + Math.cos(a) * 270, y = SIZE / 2 + Math.sin(a) * 270;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
    g.restore();
  }

  function clearCanvas(g = mainCtx) {
    g.clearRect(0, 0, SIZE, SIZE);
    drawGuides(g);
  }

  /* reset = clear + forget history */
  function reset() {
    clearCanvas();
    history.length = 0;
  }

  /* ── mirrored stamp ── */
  function stamp(x, y, px, py) {
    const cx = SIZE / 2, cy = SIZE / 2;
    const seg = TAU / symmetry;
    for (let s = 0; s < symmetry; s++) {
      const a0 = s * seg;
      const pts = [[x, y], [px, py]].map(([ax, ay]) => {
        const dx = ax - cx, dy = ay - cy;
        const c = Math.cos(a0), sn = Math.sin(a0);
        return [cx + dx * c - dy * sn, cy + dx * sn + dy * c];
      });
      const mpts = [[cx - (pts[0][0] - cx), pts[0][1]], [cx - (pts[1][0] - cx), pts[1][1]]];
      drawSeg(pts[0], pts[1]);
      drawSeg(mpts[0], mpts[1]);
    }
  }

  function drawSeg([x, y], [px, py]) {
    const g = mainCtx;
    g.strokeStyle = color;
    g.fillStyle = color;
    const d = Math.hypot(x - px, y - py);
    switch (pattern) {
      case 'petal': {
        const a = Math.atan2(y - py, x - px);
        g.save();
        g.translate(x, y); g.rotate(a);
        g.globalAlpha = 0.9;
        g.beginPath();
        g.ellipse(brush * 0.9, 0, brush * 1.4, brush * 0.55, 0, 0, TAU);
        g.fill();
        g.restore();
        break;
      }
      case 'dots': {
        g.globalAlpha = 0.95;
        g.beginPath(); g.arc(x, y, brush * 0.45, 0, TAU); g.fill();
        break;
      }
      case 'glitter': {
        g.globalAlpha = 0.9;
        for (let i = 0; i < 3; i++) {
          const gx = x + rand(-brush, brush), gy = y + rand(-brush, brush);
          g.beginPath(); g.arc(gx, gy, rand(0.6, brush * 0.32), 0, TAU); g.fill();
        }
        break;
      }
      default: { // solid stroke
        g.globalAlpha = 0.92;
        g.lineWidth = brush;
        g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
        if (brush > 12) { // golden outline glimmer on wide strokes
          g.globalAlpha = 0.28;
          g.strokeStyle = '#FFF2A6';
          g.lineWidth = brush * 0.35;
          g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
        }
      }
    }
    g.globalAlpha = 1;
    if (d > 6) maybeTick();
  }

  function maybeTick() {
    const now = performance.now();
    if (now - lastTick > 90) { lastTick = now; AudioEngine.tick(); }
  }

  /* ── pointer input (mouse + touch unified) ── */
  function pos(e) {
    const r = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: (t.clientX - r.left) * (SIZE / r.width), y: (t.clientY - r.top) * (SIZE / r.height) };
  }
  function down(e) {
    snapshot();
    drawing = true;
    const p = pos(e); last = p; stamp(p.x, p.y, p.x, p.y);
    canvas.classList.add('drawing');
    if (e.cancelable) e.preventDefault();
  }
  function move(e) {
    if (!drawing) return;
    const p = pos(e);
    stamp(p.x, p.y, last.x, last.y);
    last = p;
    if (e.cancelable) e.preventDefault();
  }
  function up() { drawing = false; last = null; canvas.classList.remove('drawing'); }

  canvas.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move);
  window.addEventListener('mouseup', up);
  canvas.addEventListener('touchstart', down, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', up);

  /* ── tools ── */
  function buildSwatches() {
    const wrap = $('#rSwatches');
    COLORS.forEach((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = c;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(i === 0));
      b.setAttribute('aria-label', 'Colour ' + c);
      b.addEventListener('click', () => {
        color = c;
        $$('.swatch').forEach(s => s.setAttribute('aria-checked', 'false'));
        b.setAttribute('aria-checked', 'true');
      });
      wrap.appendChild(b);
    });
  }

  function undo() {
    const img = history.pop();
    if (!img) { Toast('Nothing left to undo'); return; }
    mainCtx.putImageData(img, 0, 0);
  }

  function save() {
    const a = document.createElement('a');
    a.download = 'rangoli-' + Date.now() + '.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    Toast('⬇ Rangoli saved as PNG');
  }

  /* ── templates — pure shape painters, any target context ── */
  function petalAt(g, x, y, rot, size, col) {
    g.save();
    g.translate(x, y); g.rotate(rot);
    g.fillStyle = col;
    g.beginPath();
    g.ellipse(0, 0, size * 1.5, size * 0.6, 0, 0, TAU);
    g.fill();
    g.restore();
  }
  function dotAt(g, x, y, r, col) {
    g.fillStyle = col;
    g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  }
  function centerMedallion(g) {
    dotAt(g, SIZE / 2, SIZE / 2, 26, '#D62828');
    dotAt(g, SIZE / 2, SIZE / 2, 18, '#FFD166');
    dotAt(g, SIZE / 2, SIZE / 2, 9, '#FFF2A6');
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      petalAt(g, SIZE / 2 + Math.cos(a) * 36, SIZE / 2 + Math.sin(a) * 36, a, 9, '#FF7B00');
    }
  }

  const TEMPLATES = {
    lotus(g) {
      const rings = [['#FF4D8D', 8, 15], ['#FFD166', 12, 22], ['#FF7B00', 16, 12], ['#D62828', 24, 8]];
      rings.forEach(([col, n, size]) => {
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU;
          const r = 70 + n * 4;
          petalAt(g, SIZE / 2 + Math.cos(a) * r * 0.55, SIZE / 2 + Math.sin(a) * r * 0.55, a, size, col);
        }
      });
      centerMedallion(g);
    },
    sunburst(g) {
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * TAU;
        g.strokeStyle = i % 2 ? '#FFD166' : '#FF7B00';
        g.lineWidth = 6;
        g.beginPath();
        g.moveTo(SIZE / 2 + Math.cos(a) * 46, SIZE / 2 + Math.sin(a) * 46);
        g.lineTo(SIZE / 2 + Math.cos(a) * 250, SIZE / 2 + Math.sin(a) * 250);
        g.stroke();
        dotAt(g, SIZE / 2 + Math.cos(a) * 262, SIZE / 2 + Math.sin(a) * 262, 7, '#FF4D8D');
      }
      centerMedallion(g);
    },
    dotgrid(g) {
      const rows = 9;
      for (let ry = 0; ry < rows; ry++) {
        for (let rx = 0; rx < rows; rx++) {
          const x = 90 + rx * (SIZE - 180) / (rows - 1);
          const y = 90 + ry * (SIZE - 180) / (rows - 1);
          const inside = rx + ry >= 4 && rx + ry <= 12 && rx - ry <= 4 && ry - rx <= 4;
          if (!inside) continue;
          dotAt(g, x, y, 9, COLORS[(rx + ry) % COLORS.length]);
        }
      }
      centerMedallion(g);
    },
    peacock(g) {
      const cols = ['#4CC9F0', '#2EC4B6', '#FFD166', '#FF4D8D', '#B07CFF'];
      for (let ring = 0; ring < 5; ring++) {
        const n = 6 + ring * 3;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + ring * 0.2;
          const r = 60 + ring * 42;
          petalAt(g, SIZE / 2 + Math.cos(a) * r, SIZE / 2 + Math.sin(a) * r, a, 13 - ring, cols[ring]);
          dotAt(g, SIZE / 2 + Math.cos(a) * (r + 16), SIZE / 2 + Math.sin(a) * (r + 16), 4, '#FFF2A6');
        }
      }
      centerMedallion(g);
    }
  };

  /* load onto live canvas (snapshot first so it is undoable) */
  function loadTemplate(name) {
    snapshot();
    clearCanvas();
    TEMPLATES[name](mainCtx);
  }

  /* ── template picker modal — previews on a shared offscreen canvas ── */
  const modal = $('#templateModal');
  let off = null;
  function offscreen() {
    if (!off) {
      const c = document.createElement('canvas');
      c.width = SIZE; c.height = SIZE;
      off = c.getContext('2d');
    }
    return off;
  }
  function buildTemplateGrid() {
    const g = $('#templateGrid');
    Object.keys(TEMPLATES).forEach(name => {
      const tile = document.createElement('button');
      tile.type = 'button'; tile.className = 'template-tile';
      tile.setAttribute('aria-label', 'Load ' + name + ' rangoli template');
      const mini = document.createElement('canvas');
      mini.width = 130; mini.height = 130;
      tile.appendChild(mini);
      g.appendChild(tile);
      tile.addEventListener('click', () => {
        loadTemplate(name);
        closeModal();
        Toast('❖ ' + name.charAt(0).toUpperCase() + name.slice(1) + ' template loaded — keep drawing!');
      });
      // render preview without ever touching the live canvas
      setTimeout(() => {
        const o = offscreen();
        o.clearRect(0, 0, SIZE, SIZE);
        TEMPLATES[name](o);
        mini.getContext('2d').drawImage(o.canvas, 0, 0, SIZE, SIZE, 0, 0, 130, 130);
        o.clearRect(0, 0, SIZE, SIZE);
      }, 60);
    });
  }

  function openModal() { modal.hidden = false; $('#rTemplate').focus(); }
  function closeModal() { modal.hidden = true; }

  function init() {
    reset();
    buildSwatches();
    buildTemplateGrid();
    $('#rBrush').addEventListener('input', e => brush = +e.target.value);
    $('#rSym').addEventListener('input', e => { symmetry = clamp(+e.target.value, 1, 24); });
    $('#rPattern').addEventListener('change', e => pattern = e.target.value);
    $('#rUndo').addEventListener('click', undo);
    $('#rClear').addEventListener('click', () => { snapshot(); clearCanvas(); Toast('Canvas cleared ✦'); });
    $('#rSave').addEventListener('click', save);
    $('#rTemplate').addEventListener('click', openModal);
    modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('[data-close]')) closeModal(); });
    // Escape closes the modal (also handled globally)
    modal.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  }

  return { init, undo, clear: reset, save, openModal, closeModal };
})();
