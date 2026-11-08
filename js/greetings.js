/* ═══════════ greetings.js — personalised Diwali card generator ═══════════ */
'use strict';

const Greetings = (() => {

  const canvas = $('#greetCanvas');
  const ctx = canvas.getContext('2d');
  const W = 800, H = 1000;
  canvas.width = W; canvas.height = H;

  let currentText = '';

  const WISHES_EN = [
    'May this Diwali light up your world with joy and prosperity.',
    'Wishing you a festival of lights full of laughter and sweet moments.',
    'May every diya you light bring a new dream to life.',
    'May the glow of a thousand lamps shine upon your path ahead.',
    'May success and happiness follow you all year long.'
  ];
  const WISHES_HI = [
    'दीपावली की हार्दिक शुभकामनाएँ',
    'आपके जीवन में हमेशा खुशियों की रोशनी बनी रहे',
    'दीप जलें, खुशियाँ मिलें, और सपने पूरे हों',
    'मंगल हो, शुभ हो, दीपावली आपके लिए शुभ हो'
  ];

  const STYLES = {
    classic: { bgA: '#241a08', bgB: '#080B24', accent: '#FFD166', accent2: '#FFB703', card: 'rgba(255,209,102,.08)' },
    royal:   { bgA: '#2a1454', bgB: '#0a0a26', accent: '#FFD166', accent2: '#B07CFF', card: 'rgba(176,124,255,.10)' },
    crimson: { bgA: '#3a0d10', bgB: '#0d0716', accent: '#FFD166', accent2: '#FF4D8D', card: 'rgba(255,77,141,.10)' }
  };

  function fitText(text, maxW, font, weight = '') {
    let size = 44;
    ctx.font = `${weight} ${size}px ${font}`;
    while (ctx.measureText(text).width > maxW && size > 16) {
      size -= 2;
      ctx.font = `${weight} ${size}px ${font}`;
    }
    return size;
  }

  function wrapLines(text, maxW, font, size) {
    ctx.font = `${size}px ${font}`;
    const words = text.split(' ');
    const lines = []; let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawDiya(cx, cy, s) {
    // halo
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60 * s);
    g.addColorStop(0, 'rgba(255,242,166,.9)');
    g.addColorStop(0.4, 'rgba(255,123,0,.35)');
    g.addColorStop(1, 'rgba(255,123,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 60 * s, 0, TAU); ctx.fill();
    // flame
    ctx.fillStyle = '#FFF2A6';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 34 * s);
    ctx.quadraticCurveTo(cx + 12 * s, cy - 8 * s, cx, cy + 6 * s);
    ctx.quadraticCurveTo(cx - 12 * s, cy - 8 * s, cx, cy - 34 * s);
    ctx.fill();
    ctx.fillStyle = '#FF7B00';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 14 * s);
    ctx.quadraticCurveTo(cx + 6 * s, cy, cx, cy + 6 * s);
    ctx.quadraticCurveTo(cx - 6 * s, cy, cx, cy - 14 * s);
    ctx.fill();
    // clay body
    const clay = ctx.createLinearGradient(0, cy, 0, cy + 40 * s);
    clay.addColorStop(0, '#d98a4a'); clay.addColorStop(1, '#66391a');
    ctx.fillStyle = clay;
    ctx.beginPath();
    ctx.moveTo(cx - 42 * s, cy + 8 * s);
    ctx.quadraticCurveTo(cx, cy + 34 * s, cx + 42 * s, cy + 8 * s);
    ctx.lineTo(cx + 34 * s, cy + 26 * s);
    ctx.quadraticCurveTo(cx, cy + 44 * s, cx - 34 * s, cy + 26 * s);
    ctx.closePath(); ctx.fill();
    // oil
    ctx.fillStyle = '#FFD166';
    ctx.beginPath(); ctx.ellipse(cx, cy + 9 * s, 30 * s, 6 * s, 0, 0, TAU); ctx.fill();
  }

  function drawRangoliCorner(x, y, rot) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const cols = ['#FFD166', '#FF4D8D', '#FF7B00', '#D62828'];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI / 2;
      ctx.fillStyle = cols[i % 4];
      ctx.beginPath();
      ctx.ellipse(Math.cos(a) * 26, Math.sin(a) * 26, 14, 5, a, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#FFF2A6';
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawFireworksDots(seedY) {
    // static decorative burst circles
    const bursts = [[140, seedY + 60, ['#FFD166', '#FFF2A6']], [660, seedY + 90, ['#FF4D8D', '#FFD166']],
      [110, seedY + 300, ['#4CC9F0', '#FFF2A6']], [690, seedY + 260, ['#B07CFF', '#FFD166']]];
    for (const [bx, by, cols] of bursts) {
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + bx * 0.01;
        const r = 26 + (i % 3) * 12;
        ctx.fillStyle = cols[i % 2];
        ctx.globalAlpha = 0.75;
        ctx.beginPath();
        ctx.arc(bx + Math.cos(a) * r, by + Math.sin(a) * r, 2.6, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }

  function generate() {
    const sender = ($('#gSender').value || '').trim() || 'Your friend';
    const recipient = ($('#gRecipient').value || '').trim() || 'Dear friend';
    let message = ($('#gMessage').value || '').trim();
    const lang = $('#gLang').value;
    const style = STYLES[$('#gStyle').value] || STYLES.classic;

    if (!message) {
      message = lang === 'hi'
        ? pick(WISHES_HI)
        : (lang === 'both' ? pick(WISHES_HI) + '\n' + pick(WISHES_EN) : pick(WISHES_EN));
    }

    render(sender, recipient, message, lang, style);
    $('#gDownload').disabled = false;
    $('#gShare').disabled = false;
    $('#gCopy').disabled = false;
    currentText = buildShareText(sender, recipient, message, lang);
    AudioEngine.sparkle();
    Toast('✦ Greeting card ready!');
  }

  function render(sender, recipient, message, lang, style) {
    ctx.clearRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.clearRect(0, 0, W, H);

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, style.bgA); bg.addColorStop(0.55, style.bgB); bg.addColorStop(1, style.bgA);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // subtle radial warm glow bottom
    const warm = ctx.createRadialGradient(W / 2, H + 80, 60, W / 2, H + 80, 620);
    warm.addColorStop(0, 'rgba(255,123,0,.32)'); warm.addColorStop(1, 'rgba(255,123,0,0)');
    ctx.fillStyle = warm; ctx.fillRect(0, 0, W, H);

    // decorative border
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = 3;
    roundRect(26, 26, W - 52, H - 52, 30); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,248,231,.35)';
    ctx.lineWidth = 1;
    roundRect(38, 38, W - 76, H - 76, 24); ctx.stroke();
    // corner ornaments
    drawRangoliCorner(64, 64, 0); drawRangoliCorner(W - 64, 64, Math.PI / 2);
    drawRangoliCorner(W - 64, H - 64, Math.PI); drawRangoliCorner(64, H - 64, -Math.PI / 2);

    // fireworks decoration
    drawFireworksDots(90);

    // Hindi headline
    let y = 250;
    if (lang !== 'en') {
      ctx.fillStyle = style.accent;
      ctx.textAlign = 'center';
      const hs = fitText('शुभ दीपावली', W - 180, '"Tiro Devanagari Hindi", serif', '400');
      ctx.shadowColor = 'rgba(255,209,102,.55)'; ctx.shadowBlur = 26;
      ctx.font = `400 ${hs}px "Tiro Devanagari Hindi", serif`;
      ctx.fillText('शुभ दीपावली', W / 2, y);
      ctx.shadowBlur = 0;
      y += 66;
    }
    // English headline
    ctx.fillStyle = '#FFF8E7';
    const es = fitText('HAPPY DIWALI', W - 200, '"Cinzel", serif', '700');
    ctx.shadowColor = 'rgba(255,183,3,.5)'; ctx.shadowBlur = 20;
    ctx.font = `700 ${es}px "Cinzel", serif`;
    ctx.fillText('HAPPY DIWALI', W / 2, y);
    ctx.shadowBlur = 0;

    // ornament divider
    y += 34;
    ctx.fillStyle = style.accent2;
    ctx.fillText('❖   ✦   ❖', W / 2, y);

    // diya
    y += 120;
    drawDiya(W / 2, y - 40, 1.5);

    // recipient
    y += 96;
    ctx.fillStyle = style.accent;
    const rs = fitText('For ' + recipient, W - 220, '"Poppins", sans-serif', '500');
    ctx.font = `500 ${rs}px "Poppins", sans-serif`;
    ctx.fillText('For ' + recipient, W / 2, y);

    // message lines
    y += 40;
    ctx.fillStyle = '#FFF8E7';
    const msgLines = [];
    message.split('\n').forEach(seg => {
      if (!seg.trim()) return;
      const size = 26;
      wrapLines(seg, W - 260, '"Poppins", sans-serif', size)
        .forEach(l => msgLines.push({ text: l, hindi: /[\u0900-\u097F]/.test(seg) }));
    });
    msgLines.forEach(l => {
      ctx.font = l.hindi ? `400 28px "Tiro Devanagari Hindi", serif` : `300 26px "Poppins", sans-serif`;
      ctx.fillStyle = l.hindi ? style.accent : '#FFF8E7';
      ctx.fillText(l.text, W / 2, y);
      y += 44;
    });

    // sender
    ctx.fillStyle = style.accent2;
    const ss = fitText('— with love, ' + sender, W - 240, '"Cormorant Garamond", serif', '600');
    ctx.font = `600 ${ss}px "Cormorant Garamond", serif`;
    ctx.fillText('— with love, ' + sender, W / 2, H - 130);

    // footer brand
    ctx.fillStyle = 'rgba(255,248,231,.5)';
    ctx.font = '300 18px "Poppins", sans-serif';
    ctx.fillText('शुभ दीपावली · May light always find you', W / 2, H - 72);
  }

  function buildShareText(sender, recipient, message, lang) {
    const head = lang === 'en' ? 'Happy Diwali!' : 'शुभ दीपावली! Happy Diwali!';
    return `${head} — For ${recipient}\n${message}\n— with love, ${sender}`;
  }

  function download() {
    const a = document.createElement('a');
    a.download = 'diwali-greeting.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
    Toast('⬇ Greeting card downloaded');
  }

  async function share() {
    const text = currentText || 'शुभ दीपावली · Happy Diwali!';
    try {
      const file = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Happy Diwali',
          text,
          files: [new File([file], 'diwali-greeting.png', { type: 'image/png' })]
        });
      } else if (navigator.share) {
        await navigator.share({ title: 'Happy Diwali', text });
      } else {
        await copyText(text);
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') Toast('Sharing unavailable here — text copied instead');
    }
  }

  async function copyText(text) {
    const t = text || currentText;
    if (!t) return;
    try {
      await navigator.clipboard.writeText(t);
      Toast('⧉ Greeting text copied');
    } catch (e) {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = t; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
      Toast('⧉ Greeting text copied');
    }
  }

  function randomWish() {
    const hi = pick(WISHES_HI), en = pick(WISHES_EN);
    const w = $('#wishText');
    const useHi = Math.random() < 0.5;
    const text = useHi ? hi : en;
    w.style.opacity = 0;
    setTimeout(() => { w.textContent = text; w.lang = useHi ? 'hi' : 'en'; w.style.opacity = 1; }, 220);
    w.style.transition = 'opacity .22s';
    AudioEngine.sparkle();
    // also fill the greeting message if empty
    const gm = $('#gMessage');
    if (gm && !gm.value.trim()) gm.value = text;
    return text;
  }

  function init() {
    $('#greetForm').addEventListener('submit', e => { e.preventDefault(); generate(); });
    $('#gDownload').addEventListener('click', download);
    $('#gShare').addEventListener('click', share);
    $('#gCopy').addEventListener('click', () => copyText());
    // default preview so the canvas is never blank
    render('Your name', 'Dear friend', pick(WISHES_EN) + '\n' + pick(WISHES_HI), 'both', STYLES.classic);
    currentText = buildShareText('Your name', 'Dear friend', 'Happy Diwali!', 'both');

    // re-render once webfonts arrive so Devanagari/Cinzel show correctly
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!$('#gDownload').disabled) generate(); // keep user content
        else render('Your name', 'Dear friend', pick(WISHES_EN) + '\n' + pick(WISHES_HI), 'both', STYLES.classic);
      });
    }
  }

  return { init, generate, download, share, copyText, randomWish, WISHES_EN, WISHES_HI };
})();
