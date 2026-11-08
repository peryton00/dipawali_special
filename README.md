# ✦ Dīpāvalī — An Immersive Diwali Celebration SPA

A cinematic, fully interactive, single-page Diwali experience built with **pure HTML5, CSS3 and vanilla ES6+ JavaScript** — no frameworks, no backend, no API keys. Open `index.html` in any modern browser and the festival begins.

## ✨ Experience

1. **Cinematic intro** — a dark sky slowly illuminates around a glowing diya, revealing शुभ दीपावली / Happy Diwali. Enter, Skip, or let it auto-advance. Sound is opt-in only (never autoplayed).
2. **Celebration hero** — animated stars, drifting golden dust, subtle clouds, an Indian city-and-temple skyline with lit windows, live stats (diyas lit / lanterns afloat / wishes sent).
3. **Diya lighting** — 12 clay diyas (add more, up to any number): click to light/extinguish, hover intensifies the glow, lighting plays a warm chime, spawns a golden sparkle ring and a festive message. Light All / Reset / **Light the World** sweep.
4. **Fireworks engine** — a real canvas particle simulation with pooling: peony, chrysanthemum, ring, **heart**, **star**, willow, spiral and multi-layered bursts; gravity, drag, fade, glitter and colour-transition physics. Click/tap the sky to launch, **double-click for a massive finale**, hold for repeated launches, drag to paint a trail. Automatic launcher with Calm / Normal / Festive / Grand Celebration intensities and golden/rainbow/pink/crimson hue modes.
5. **Diwali Night Mode** ★ — the flagship experience: a full-screen immersive night with continuous fireworks, an illuminated gateway skyline, a synchronised diya-lighting sweep, floating wishes (Hindi & English, plus your own via the Send Wish bar), ambient sky lanterns, golden confetti, occasional grand-moment mega-bursts, and a fade-in ambient soundscape. Floating controls: fireworks on/off + intensity, sound + separate music/effects volumes, Light All, Lantern, Send Wish, Celebrate, Exit. Canvases rise above the immersive overlay while staying click-through so every control works. Deep-link: `index.html?night=1`.
6. **Sky lanterns** — release glowing paper lanterns carrying your wish; click a lantern in the sky to read its wish. Release one or five.
7. **Rangoli Studio** — kaleidoscopic drawing canvas: 12 colours, brush size, 1–24× symmetry (rotational + mirrored), solid/petal/dots/glitter patterns, undo history, four procedural templates (lotus, sunburst, dot grid, peacock) with offscreen-rendered previews, Save PNG. Mouse and touch.
8. **Greeting generator** — sender, recipient, custom message, language (English/हिन्दी/both) and three styles; renders a festive card (glowing diya, rangoli corners, fireworks, Devanagari headline) on canvas. Download PNG, Web Share (with image), copy text.
9. **Wish generator, Celebration Mode** (diyas + finale + heart burst + lanterns + confetti + greeting toast), **magic cursor** sparkle trail (pointer devices only), **golden confetti**, and a shortcuts panel.

## 🎵 Audio

Every sound is **synthesised live with the Web Audio API** (zero audio files, zero network): firework whoosh/boom/crackle, diya chime, temple bells, sparkles, lantern float, celebration fanfare, rangoli brush ticks, and an evolving ambient score — tanpura-style drone, breathing filtered pads and sparse plucked melody in a Bhairavi-flavoured scale. Master mute, music on/off, effects on/off, separate volume sliders in Night Mode. Audio unlocks only after a user gesture.

## ⌨️ Keyboard shortcuts

`F` fireworks · `D` diya · `L` lantern · `C` celebration · `M` music · `N` night mode · `Esc` close modal / exit Night Mode · `?` shortcuts panel. Shortcuts are ignored while typing.

## 🏗️ Architecture

```
index.html          — semantic sections, intro, night-mode overlay, modals
css/                — styles, animations, fireworks, diya, rangoli, night-mode, responsive
js/
  utils.js          — helpers, rAF Loop (tab-hidden pause), DPR canvas fitting, toast
  audio.js          — Web Audio synthesis engine + ambient music scheduler
  fireworks.js      — pooled particle engine, rockets, 9 burst types, auto-launcher
  particles.js      — stars, dust, clouds, lanterns, confetti, cursor sparkles
  diya.js           — SVG diya factory + zones (grid / hero / night)
  lanterns.js       — wish choreography
  rangoli.js        — symmetrical studio + procedural templates
  greetings.js      — canvas card renderer + share/download
  night-mode.js     — immersive mode engine (wishes, choreography, controls)
  interactions.js   — nav, reveals, ripples, actions, shortcuts, audio dock
  main.js           — intro sequence + bootstrap
README.md
```

**Performance:** particle pooling (900 mobile / 2200 desktop), single canvas per layer, capped concurrency, debounced DPR-aware resize, `visibilitychange` pause, mobile particle reduction, `prefers-reduced-motion` respected (shorter intro, disabled cursor trail, minimal animation).

**Accessibility:** full keyboard navigation, ARIA roles/labels/pressed states on every control, visible focus rings, live counters via `aria-live`, no functionality depends on sound or colour.

## ▶️ Run locally

No build step. Open `index.html` directly, or serve the folder (e.g. `python3 -m http.server`) and visit `http://localhost:8000`. Fonts load from Google Fonts (Cinzel, Cormorant Garamond, Poppins, Tiro Devanagari Hindi); everything else is self-contained.

**URL parameters:** `?skip=1` skip the intro · `?night=1` open straight into Night Mode (great for sharing the magic directly).

## 🔭 Possible next steps

- Persist wish-wall / diya count via the platform Table API
- Photo-to-greeting (visitor uploads) — requires Hosted Deploy entitlement
- Additional rangoli templates and a community gallery
