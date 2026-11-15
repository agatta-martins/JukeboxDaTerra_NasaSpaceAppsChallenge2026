(function () {
  'use strict';
  document.documentElement.lang = 'en';

  /* ====== Constants ====== */
  var ROWS = 15;            // piano roll rows = scale steps
  var N = 48;               // image columns = notes
  var BPC = 0.5;            // beats per column
  var TOTAL = N * BPC;      // length in beats
  var TAIL = 1.6;           // tail after the last note
  var PREV_BEATS = 6;       // card preview: 12 columns
  var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  var ICON_PLAY = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
  var ICON_STOP = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor"/></svg>';
  var ICON_PV = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';

  var SC = {
    majorPent: [0, 2, 4, 7, 9],
    minorPent: [0, 3, 5, 7, 10],
    sus: [0, 2, 5, 7, 9],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10]
  };

  var $ = function (id) { return document.getElementById(id); };
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return Math.min(b, Math.max(a, v)); };
  var mix = function (a, b, t) { return a + (b - a) * t; };
  var mixc = function (c1, c2, t) { return [mix(c1[0], c2[0], t), mix(c1[1], c2[1], t), mix(c1[2], c2[2], t)]; };
  var sstep = function (a, b, x) { var t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  var midiName = function (m) { return NAMES[m % 12] + (Math.floor(m / 12) - 1); };
  var fmt = function (s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  var live = function (t) { $('live').textContent = ''; setTimeout(function () { $('live').textContent = t; }, 40); };

  /* ====== Themes ======
     Each theme = one card. Fields:
       id      page address (#id), no spaces or accents, unique
       name    card title
       src     image file, inside img/
       credit  text shown over the image and on the card. Replace with 'NASA SVS · ID 00000'
       crop    (optional) [x, y, width, height] as fractions from 0 to 1, to cut a legend or date out of the image
       preset  scale, tempo (bpm) and echo of the theme
       desc    image description (screen reader and the "Image description" button)
       sound   explanation of this theme's sound */
  var ORDER = [
    {
      id: 'aerosols', name: 'Aerosols',
      src: 'img/geos.png', credit: 'NASA https://svs.gsfc.nasa.gov/5669/',
      preset: { root: 45, scale: SC.minor, bpm: 100, reverb: 0.5 },
      desc: 'World map on a dark background showing aerosols, tiny particles floating in the air. Each color is a different kind of particle: green is pollution and volcanic particles (sulfates), lilac is desert dust, orange and red is smoke from fires, and blue-white is sea salt. Neon-green swirls curl over the oceans and Asia. A wide lilac band of dust from the Sahara crosses North Africa and the Atlantic, and orange and red smoke patches appear in central Africa. Blue-white swirls of sea salt fill the southern oceans. City lights dot North America and Europe, and a spiral swirl appears over the Atlantic.',
      sound: 'Natural minor scale, fast tempo and lots of echo. The melody follows the brightest region of each stretch of the map, such as the neon green and the lilac band; the dark oceans stay in the background.'
    },
    {
      id: 'ocean-color', name: 'Ocean color',
      src: 'img/ocean.jpg', credit: 'NASA https://svs.gsfc.nasa.gov/5690/', crop: [0, 0, 1, 0.885],
      preset: { root: 46, scale: SC.sus, bpm: 66, reverb: 0.6 },
      desc: 'World map with the continents in gray and the ocean painted on a scale that runs from navy blue to yellow. The color shows phytoplankton, tiny algae that float in the ocean: blue means few phytoplankton, green and yellow mean more. Deep waters, in the middle of the oceans, are dark blue. Coastal regions and areas near the poles appear in green and yellow. Antarctica and sea ice are a light patch at the bottom.',
      sound: 'Suspended scale, slow and spacious. The gray continents and the yellow coastal bands pull the melody up; the dark deep ocean stays low. The legend and date of the original image were cropped out so they would not turn into notes.'
    },
    {
      id: 'polar-ice', name: 'Polar ice',
      src: 'img/polar.jpg', credit: 'NASA https://svs.gsfc.nasa.gov/13577/',
      preset: { root: 52, scale: SC.lydian, bpm: 62, reverb: 0.65 },
      desc: 'Aerial view of a glacier. The bluish-white ice surface is full of cracks and ripples that curve into arcs, cut by dark bands of rock and sediment. In the background, brown hills and a pale, hazy sky.',
      sound: 'Lydian scale, slow and crystalline, with plenty of echo. The melody rises and falls with the ripples in the ice and the dark bands of rock.'
    },
    {
      id: 'agriculture', name: 'Agriculture',
      src: 'img/agriculture.webp', credit: 'NASA https://earth.gov/themes/agriculture',
      preset: { root: 50, scale: SC.majorPent, bpm: 96, reverb: 0.25 },
      desc: 'Satellite view of farmland. Dozens of dark green circles, made by center-pivot irrigation, mix with light green, gray and beige squares and rectangles. The image is dark and very wide.',
      sound: 'Major pentatonic scale and an upbeat rhythm. The green fields sound like a marimba, with short notes; the light fields sound brighter.'
    },
    {
      id: 'ocean-currents', name: 'Ocean currents',
      src: 'img/perpetualocean.jpg', credit: 'NASA https://svs.gsfc.nasa.gov/5425/',
      preset: { root: 50, scale: SC.lydian, bpm: 70, reverb: 0.55 },
      desc: 'Earth seen from space, centered on the Americas, on a black background. The oceans are blue and covered with thousands of thin white lines showing ocean currents, with many eddies. A stronger white band, the Gulf Stream, leaves the Gulf of Mexico and runs across the North Atlantic. The continents appear in green and brown, and Canada is covered in snow.',
      sound: 'Lydian scale, flowing and with plenty of echo. The black sides of the image stay almost silent, and the sound grows when the sweep enters the globe. The white current lines, being the brightest, guide the melody.'
    },
    {
      id: 'aurora', name: 'Aurora',
      src: 'img/aurora.jpg', credit: 'NASA https://svs.gsfc.nasa.gov/12523/',
      preset: { root: 43, scale: SC.sus, bpm: 56, reverb: 0.7 },
      desc: 'Night sky with a large band of green aurora light crossing the image diagonally, over a dark blue and black background full of stars. On the ground there is snow, antennas, a pole and the side of a car.',
      sound: 'Suspended scale, very slow and with lots of echo. The green light plays short marimba notes, and the dark sky stays relatively quiet.'
    }
  ];
  var themes = {};
  ORDER.forEach(function (t) { themes[t.id] = t; });

  var PLACEHOLDER = null;
  function getImage(t) {
    if (t.canvas) return t.canvas;
    if (!PLACEHOLDER) {
      PLACEHOLDER = document.createElement('canvas');
      PLACEHOLDER.width = 640; PLACEHOLDER.height = 400;
      var px = PLACEHOLDER.getContext('2d'); px.fillStyle = '#16212a'; px.fillRect(0, 0, 640, 400);
    }
    return PLACEHOLDER;
  }
  function coverDraw(ctx, src, w, h) {
    var sw = src.naturalWidth || src.width, sh = src.naturalHeight || src.height;
    var s = Math.max(w / sw, h / sh), dw = sw * s, dh = sh * s;
    ctx.drawImage(src, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  /* ====== Analysis: image → list of notes ====== */
  function analyze(src, aspect, preset) {
    var W = N * 4, H = Math.min(420, Math.max(48, Math.round(W / aspect)));
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var cx = cv.getContext('2d', { willReadFrequently: true });
    coverDraw(cx, src, W, H);
    var d = cx.getImageData(0, 0, W, H).data;
    var lum = new Float32Array(W * H), i, c, x, y, b;
    for (i = 0; i < W * H; i++) lum[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;

    var cols = [];
    for (c = 0; c < N; c++) {
      var x0 = Math.floor(c * W / N), x1 = Math.max(x0 + 1, Math.floor((c + 1) * W / N));
      var bl = new Float32Array(ROWS), br = new Float32Array(ROWS), bg = new Float32Array(ROWS), bb = new Float32Array(ROWS), bn = new Float32Array(ROWS);
      var edge = 0, ec = 0;
      for (y = 0; y < H; y++) {
        b = Math.min(ROWS - 1, Math.floor(y * ROWS / H));
        for (x = x0; x < x1; x++) {
          i = y * W + x;
          var l = lum[i];
          bl[b] += l; br[b] += d[i * 4]; bg[b] += d[i * 4 + 1]; bb[b] += d[i * 4 + 2]; bn[b]++;
          if (x + 1 < W) edge += Math.abs(l - lum[i + 1]);
          if (y + 1 < H) edge += Math.abs(l - lum[i + W]);
          ec++;
        }
      }
      var best = 0, bestScore = -1;
      for (b = 0; b < ROWS; b++) {
        if (!bn[b]) continue;
        bl[b] /= bn[b]; br[b] /= bn[b]; bg[b] /= bn[b]; bb[b] /= bn[b];
      }
      for (b = 0; b < ROWS; b++) {
        var sc = bl[b] * 0.6 + 0.2 * ((bl[b - 1] || bl[b]) + (bl[b + 1] || bl[b]));
        if (sc > bestScore) { bestScore = sc; best = b; }
      }
      cols.push({ band: best, lum: bl[best], r: br[best], g: bg[best], b: bb[best], edge: edge / Math.max(1, ec) });
    }
    var lmin = Infinity, lmax = -Infinity, emin = Infinity, emax = -Infinity;
    cols.forEach(function (k) { lmin = Math.min(lmin, k.lum); lmax = Math.max(lmax, k.lum); emin = Math.min(emin, k.edge); emax = Math.max(emax, k.edge); });

    var len = preset.scale.length, notes = [], prev = null;
    cols.forEach(function (k, ci) {
      var rest = k.lum < 0.04; // almost black stretch (space background): becomes a rest, no note
      var step = ROWS - 1 - k.band;
      if (rest) step = prev !== null ? prev : Math.floor(ROWS / 2);
      else {
        if (prev !== null && Math.abs(step - prev) > 5) step = prev + (step > prev ? 5 : -5);
        prev = step;
      }
      var vel = lmax - lmin < 0.02 ? 0.7 : 0.3 + 0.7 * (k.lum - lmin) / (lmax - lmin);
      var edgeN = emax - emin < 1e-4 ? 0 : (k.edge - emin) / (emax - emin);
      var warm = clamp((k.r - k.b) / 90, -1, 1);
      var kind = (k.g > k.r + 8 && k.g > k.b + 8) ? 'pluck' : (warm > 0.12 ? 'bright' : 'soft');
      var toMidi = function (s) { return preset.root + 12 * Math.floor(s / len) + preset.scale[s % len]; };
      var hs = step + 2 <= ROWS - 1 ? step + 2 : null;
      notes.push({
        col: ci, t: ci * BPC, step: step, midi: toMidi(step),
        hstep: edgeN > 0.6 ? hs : null, hmidi: (edgeN > 0.6 && hs !== null) ? toMidi(hs) : null,
        vel: vel, kind: kind, warm: warm, rest: rest,
        dur: kind === 'pluck' ? 0.7 : (kind === 'soft' ? 1.4 : 1.0),
        cut: 700 + 3200 * clamp(0.35 + 0.5 * warm + 0.4 * vel, 0.1, 1),
        rgb: [Math.round(mix(Math.max(k.r, 40), 255, 0.25)), Math.round(mix(Math.max(k.g, 40), 255, 0.25)), Math.round(mix(Math.max(k.b, 40), 255, 0.25))]
      });
    });
    return notes;
  }

  /* ====== Audio (Web Audio API) ====== */
  var ac = null, bus = null, previewId = null, previewTimer = 0;
  function ensureAudio() {
    if (!ac) { var AC = window.AudioContext || window.webkitAudioContext; ac = new AC(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function stopAudio() {
    if (bus && ac) {
      var b = bus; bus = null;
      try { b.out.gain.cancelScheduledValues(ac.currentTime); b.out.gain.setTargetAtTime(0, ac.currentTime, 0.03); } catch (e) {}
      b.nodes.forEach(function (n) { try { n.stop(ac.currentTime + 0.2); } catch (e) {} });
      setTimeout(function () { try { b.out.disconnect(); } catch (e) {} }, 500);
    }
    clearTimeout(previewTimer);
    previewId = null;
    setPreviewUI();
  }
  function startBus(preset) {
    stopAudio(); ensureAudio();
    var comp = ac.createDynamicsCompressor(); comp.connect(ac.destination);
    var out = ac.createGain(); out.gain.value = 0.9; out.connect(comp);
    var input = ac.createGain(); input.connect(out);
    var dl = ac.createDelay(1.5); dl.delayTime.value = 0.34;
    var fb = ac.createGain(); fb.gain.value = 0.35 + 0.2 * preset.reverb;
    var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
    var wet = ac.createGain(); wet.gain.value = 0.15 + 0.5 * preset.reverb;
    input.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(out);
    bus = { input: input, out: out, nodes: [] };
    return bus;
  }
  function voice(when, midi, dur, vel, kind, pan, cut) {
    var f = 440 * Math.pow(2, (midi - 69) / 12);
    var o = ac.createOscillator(), g = ac.createGain(), fl = ac.createBiquadFilter(), tail = dur;
    o.type = kind === 'pluck' ? 'triangle' : (kind === 'bright' ? 'sawtooth' : 'sine');
    o.frequency.value = f;
    fl.type = 'lowpass'; fl.frequency.value = cut; fl.Q.value = 0.7;
    var peak = 0.22 * vel * (kind === 'bright' ? 0.7 : 1);
    g.gain.setValueAtTime(0.0001, when);
    if (kind === 'pluck') {
      g.gain.exponentialRampToValueAtTime(peak, when + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur * 0.95);
    } else {
      var atk = kind === 'soft' ? 0.09 : 0.03;
      g.gain.linearRampToValueAtTime(peak, when + atk);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * 0.6), when + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    }
    o.connect(fl); fl.connect(g);
    if (ac.createStereoPanner) {
      var p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(bus.input);
    } else { g.connect(bus.input); }
    o.start(when); o.stop(when + tail + 0.05);
    bus.nodes.push(o);
  }
  function schedule(notes, preset, fromBeat, toBeat, speed, t0) {
    var spb = 60 / (preset.bpm * speed);
    var padG = ac.createGain(), padF = ac.createBiquadFilter(), o1 = ac.createOscillator(), o2 = ac.createOscillator();
    padG.gain.setValueAtTime(0.0001, t0);
    padF.type = 'lowpass'; padF.frequency.value = 700;
    o1.type = 'sine'; o2.type = 'sine';
    o1.frequency.value = 440 * Math.pow(2, (preset.root + 12 - 69) / 12);
    o2.frequency.value = 440 * Math.pow(2, (preset.root + 19 - 69) / 12);
    o1.connect(padF); o2.connect(padF); padF.connect(padG); padG.connect(bus.input);
    var endT = t0 + (toBeat - fromBeat) * spb;
    notes.forEach(function (n) {
      if (n.rest || n.t < fromBeat - 1e-6 || n.t >= toBeat) return;
      var when = t0 + (n.t - fromBeat) * spb, dur = n.dur * spb;
      var pan = -0.85 + 1.7 * n.col / (N - 1);
      voice(when, n.midi, dur, n.vel, n.kind, pan, n.cut);
      if (n.hmidi !== null) voice(when, n.hmidi, dur * 1.1, n.vel * 0.5, 'soft', pan, n.cut * 0.8);
      padG.gain.setTargetAtTime(0.01 + 0.045 * n.vel, when, 0.35);
    });
    padG.gain.setTargetAtTime(0.0001, endT, 0.5);
    o1.start(t0); o2.start(t0); o1.stop(endT + 3); o2.stop(endT + 3);
    bus.nodes.push(o1, o2);
  }

  /* ====== Home: cards ====== */
  var grid = $('grid');
  /* Loads the image from the src field (and applies the crop, if any). */
  function loadReal(t) {
    var im = new Image();
    im.onload = function () {
      var src = im;
      if (t.crop) {
        var sw = im.naturalWidth, sh = im.naturalHeight;
        var cw = Math.round(sw * t.crop[2]), ch = Math.round(sh * t.crop[3]);
        src = document.createElement('canvas'); src.width = cw; src.height = ch;
        src.getContext('2d').drawImage(im, Math.round(sw * t.crop[0]), Math.round(sh * t.crop[1]), cw, ch, 0, 0, cw, ch);
      }
      t.canvas = src; t.real = true; t.pvNotes = null;
      var p = t.el && t.el.querySelector('.lab p');
      if (p) p.textContent = t.credit || 'NASA';
      drawThumb(t);
      if (cur.theme === t && !viewCard.hidden) { layoutCard(); updateCredit(); }
    };
    im.onerror = function () {
      console.error('Image not found: ' + t.src + '. Check the file name in the img/ folder.');
      var p = t.el && t.el.querySelector('.lab p');
      if (p) p.textContent = 'Image not found';
    };
    im.src = t.src;
  }
  function safeAnalyze(img, aspect, preset) {
    try { return analyze(img, aspect, preset); } catch (e) { console.error(e); return null; }
  }
  function drawThumb(t) {
    var cv = t.el && t.el.querySelector('canvas');
    if (!cv) return;
    var cx = cv.getContext('2d');
    cx.imageSmoothingQuality = 'high';
    coverDraw(cx, getImage(t), cv.width, cv.height);
  }
  var autoplayNext = false;
  function buildCard(t) {
    var el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = '<canvas width="360" height="480" aria-hidden="true"></canvas><div class="shade"></div>' +
      '<span class="chip"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.3"/><path d="M1.8 8h12.4M8 1.8c2 2 2 10.4 0 12.4M8 1.8c-2 2-2 10.4 0 12.4" stroke="currentColor" stroke-width="1.1"/></svg>Earth theme</span>' +
      '<button class="pv" type="button" aria-pressed="false">' + ICON_PV + '</button>' +
      '<div class="lab"><h3></h3><p></p></div>' +
      '<a class="card-link" href="#"></a>';
    el.querySelector('h3').textContent = t.name;
    el.querySelector('.lab p').textContent = 'Loading image…';
    var a = el.querySelector('.card-link');
    a.setAttribute('href', '#' + t.id);
    a.setAttribute('aria-label', 'Open ' + t.name);
    a.setAttribute('data-voz', t.name + '. Open image and listen.');
    a.addEventListener('click', function () { autoplayNext = true; ensureAudio(); });
    var pv = el.querySelector('.pv');
    pv.setAttribute('aria-label', 'Play preview: ' + t.name);
    pv.addEventListener('click', function () { togglePreview(t); });
    t.el = el; t.pv = pv;
    grid.appendChild(el);
  }
  function setPreviewUI() {
    Object.keys(themes).forEach(function (id) {
      var t = themes[id];
      if (!t.pv) return;
      var on = previewId === id;
      t.pv.setAttribute('aria-pressed', on ? 'true' : 'false');
      t.pv.innerHTML = on ? ICON_STOP : ICON_PV;
      t.pv.setAttribute('aria-label', (on ? 'Stop preview: ' : 'Play preview: ') + t.name);
    });
  }
  function togglePreview(t) {
    if (previewId === t.id) { stopAudio(); return; }
    haltPlayer();
    if (!t.real) return;
    if (!t.pvNotes) t.pvNotes = safeAnalyze(getImage(t), 3 / 4, t.preset);
    if (!t.pvNotes) { $('notice').hidden = false; return; }
    startBus(t.preset);
    schedule(t.pvNotes, t.preset, 0, PREV_BEATS, 1, ac.currentTime + 0.05);
    previewId = t.id;
    setPreviewUI();
    var id = t.id;
    previewTimer = setTimeout(function () { if (previewId === id) stopAudio(); }, PREV_BEATS * 60 / t.preset.bpm * 1000 + 1200);
  }

  ORDER.forEach(function (t) { buildCard(t); });

  /* ====== Carousel: 3 cards per page (2 or 1 on narrow screens) ====== */
  var carousel = $('carousel');
  var cs = { page: 0, pv: 3, pages: 1 };
  function perView() {
    var w = carousel.clientWidth;
    if (!w) return cs.pv;
    return w >= 720 ? 3 : (w >= 440 ? 2 : 1);
  }
  function renderCarousel() {
    cs.pages = Math.max(1, Math.ceil(ORDER.length / cs.pv));
    cs.page = clamp(cs.page, 0, cs.pages - 1);
    carousel.style.setProperty('--pv', cs.pv);
    grid.style.transform = 'translateX(calc(' + (-cs.page) + ' * (100% + var(--gap))))';
    ORDER.forEach(function (t, i) { t.el.inert = Math.floor(i / cs.pv) !== cs.page; });
    $('pgn').textContent = (cs.page + 1) + ' / ' + cs.pages;
    $('prev').disabled = cs.page === 0;
    $('next').disabled = cs.page === cs.pages - 1;
    $('pager').hidden = cs.pages <= 1;
  }
  function goPage(d) { cs.page += d; renderCarousel(); speak('Page ' + (cs.page + 1) + ' of ' + cs.pages + '.'); }
  $('prev').addEventListener('click', function () { goPage(-1); });
  $('next').addEventListener('click', function () { goPage(1); });
  (function () {
    var sx = null;
    carousel.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) goPage(dx < 0 ? 1 : -1);
    });
  })();
  function relayoutCarousel() {
    var pv = perView();
    if (pv !== cs.pv) { cs.page = Math.floor(cs.page * cs.pv / pv); cs.pv = pv; }
    renderCarousel();
  }
  if (window.ResizeObserver) new ResizeObserver(relayoutCarousel).observe(carousel);
  window.addEventListener('resize', relayoutCarousel);
  relayoutCarousel();
  (function stagger(i) {
    var t = ORDER[i];
    if (!t) return;
    loadReal(t);
    setTimeout(function () { stagger(i + 1); }, 16);
  })(0);

  /* ====== Card page: player ====== */
  var viewHome = $('view-home'), viewCard = $('view-card'), imgwrap = $('imgwrap');
  var imgCv = $('img'), fx = $('fx'), rollCv = $('roll');
  var cur = { theme: null, notes: [] };
  var P = { playing: false, pos: 0, startBeat: 0, t0: 0, speed: 1, loop: false, raf: 0, lastCol: -2 };
  var dpr = 1;

  function spbNow() { return 60 / (cur.theme.preset.bpm * P.speed); }
  function currentBeat() {
    if (!P.playing || !ac) return P.pos;
    return P.startBeat + Math.max(0, ac.currentTime - P.t0) / spbNow();
  }
  function setPlayUI() {
    var b = $('play');
    b.innerHTML = P.playing ? ICON_PAUSE : ICON_PLAY;
    b.setAttribute('aria-label', P.playing ? 'Pause' : 'Play');
  }
  function haltPlayer() {
    if (P.playing) { P.pos = currentBeat(); P.playing = false; cancelAnimationFrame(P.raf); stopAudio(); setPlayUI(); }
  }
  function playFrom(beat) {
    if (!cur.notes.length) return;
    ensureAudio();
    var th = cur.theme;
    startBus(th.preset);
    P.startBeat = beat; P.t0 = ac.currentTime + 0.06; P.playing = true;
    schedule(cur.notes, th.preset, beat, TOTAL, P.speed, P.t0);
    setPlayUI();
    live('Playing ' + th.name + '.');
    cancelAnimationFrame(P.raf);
    P.raf = requestAnimationFrame(tick);
  }
  function pause() {
    P.pos = currentBeat(); P.playing = false;
    cancelAnimationFrame(P.raf); stopAudio(); setPlayUI(); drawAll(P.pos);
    live('Paused.');
  }
  function toggle() {
    if (P.playing) { pause(); return; }
    playFrom(P.pos >= TOTAL - 0.01 ? 0 : P.pos);
  }
  function seek(beat) {
    beat = clamp(beat, 0, TOTAL - 0.01);
    if (P.playing) playFrom(beat); else { P.pos = beat; drawAll(beat); }
  }
  function tick() {
    if (!P.playing) return;
    var beat = currentBeat();
    if (beat >= TOTAL + TAIL) {
      if (P.loop) { playFrom(0); return; }
      P.playing = false; P.pos = 0; stopAudio(); setPlayUI(); P.lastCol = -2; drawAll(TOTAL);
      live('End.');
      return;
    }
    drawAll(beat);
    P.raf = requestAnimationFrame(tick);
  }

  function describeNote(n) {
    if (n.rest) return 'Rest · black stretch of the image, no note';
    var b = n.vel < 0.5 ? 'dark stretch' : (n.vel < 0.78 ? 'medium brightness' : 'bright stretch');
    var k = n.kind === 'pluck' ? 'green, marimba sound' : (n.kind === 'bright' ? 'warm tones, bright sound' : 'cool tones, soft sound');
    var p = n.step < 5 ? 'low note' : (n.step < 10 ? 'mid note' : 'high note');
    return midiName(n.midi) + ' · ' + b + ', ' + k + ' · ' + p + (n.hmidi !== null ? ' · dense texture, 2 voices' : '');
  }
  function updateCaption(beat) {
    var col = beat >= TOTAL ? N : Math.floor(beat / BPC);
    if (col === P.lastCol) return;
    P.lastCol = col;
    var el = $('caption');
    if (cur.error) { el.textContent = 'Could not read the pixels of this image. Open the site through a local server (python -m http.server in the project folder) instead of double-clicking the file.'; return; }
    if (!P.playing && beat <= 0) el.textContent = 'Press ▶ to listen. The golden line sweeps across the image and each point is a note.';
    else if (col >= N) el.textContent = 'End of the image.';
    else el.textContent = describeNote(cur.notes[col]);
  }

  /* ---- drawing: sweep line over the image ---- */
  function drawFx(beat) {
    var W = fx.width / dpr, H = fx.height / dpr, ctx = fx.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var frac = clamp(beat / TOTAL), x = frac * W;
    var col = Math.min(N - 1, Math.floor(beat / BPC));
    var notes = cur.notes, i, n, px, py;
    if (beat > 0 && notes.length) {
      var pass = function (w, color) {
        ctx.beginPath();
        for (i = 0; i <= col; i++) {
          n = notes[i]; px = (i + 0.5) / N * W; py = ((ROWS - 1 - n.step) + 0.5) / ROWS * H;
          if (i === 0 || n.rest || notes[i - 1].rest) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.lineWidth = w; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.stroke();
      };
      pass(5, 'rgba(0,0,0,.45)');
      pass(2, 'rgba(255,211,110,.95)');
      for (i = 0; i <= col; i++) {
        n = notes[i]; px = (i + 0.5) / N * W; py = ((ROWS - 1 - n.step) + 0.5) / ROWS * H;
        if (n.rest) continue;
        ctx.beginPath(); ctx.arc(px, py, 3.2, 0, 6.2832); ctx.fillStyle = '#ffd36e'; ctx.fill();
      }
    }
    var gr = ctx.createLinearGradient(x - 90, 0, x, 0);
    gr.addColorStop(0, 'rgba(255,211,110,0)'); gr.addColorStop(1, 'rgba(255,211,110,.26)');
    ctx.fillStyle = gr; ctx.fillRect(x - 90, 0, 90, H);
    ctx.fillStyle = '#ffd36e'; ctx.fillRect(x - 1, 0, 2, H);
    if (beat > 0 && beat < TOTAL && notes[col] && !notes[col].rest) {
      n = notes[col]; px = (col + 0.5) / N * W; py = ((ROWS - 1 - n.step) + 0.5) / ROWS * H;
      ctx.beginPath(); ctx.arc(px, py, 10, 0, 6.2832); ctx.lineWidth = 2.5; ctx.strokeStyle = '#ffd36e'; ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py, 4.5, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill();
    }
  }

  /* ---- drawing: piano roll ---- */
  var RL = 38, RR = 8, RT = 6, RB = 6;
  function rrect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); } else { ctx.beginPath(); ctx.rect(x, y, w, h); }
  }
  function drawRoll(beat) {
    var W = rollCv.width / dpr, H = rollCv.height / dpr, ctx = rollCv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!cur.theme) return;
    var preset = cur.theme.preset, len = preset.scale.length;
    var w = W - RL - RR, h = H - RT - RB, rh = h / ROWS, cw = w / N, r, i, n;
    ctx.font = '10px Inter, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (r = 0; r < ROWS; r++) {
      var step = ROWS - 1 - r, y = RT + r * rh, root = step % len === 0;
      ctx.fillStyle = root ? 'rgba(147,164,179,.22)' : 'rgba(147,164,179,.07)';
      ctx.fillRect(RL, y + rh / 2 - 0.5, w, 1);
      if (root) {
        ctx.fillStyle = '#93a4b3';
        ctx.fillText(midiName(preset.root + 12 * Math.floor(step / len)), RL - 6, y + rh / 2);
      }
    }
    var drawNote = function (nt, st, alpha, shrink) {
      var x = RL + nt.t / TOTAL * w, nw = Math.max(5, cw * (nt.dur / BPC) - 2);
      var y = RT + (ROWS - 1 - st) * rh + 1 + shrink, hh = rh - 2 - shrink * 2;
      var active = beat >= nt.t && beat < nt.t + nt.dur, past = beat >= nt.t + nt.dur;
      ctx.globalAlpha = alpha * (active ? 1 : (past ? 0.5 : 0.88));
      rrect(ctx, x, y, nw, hh, 3);
      ctx.fillStyle = 'rgb(' + nt.rgb[0] + ',' + nt.rgb[1] + ',' + nt.rgb[2] + ')'; ctx.fill();
      if (active) { ctx.globalAlpha = 1; ctx.lineWidth = 2; ctx.strokeStyle = '#ffd36e'; ctx.stroke(); }
      ctx.globalAlpha = 1;
    };
    for (i = 0; i < cur.notes.length; i++) {
      n = cur.notes[i];
      if (n.rest) continue;
      if (n.hstep !== null) drawNote(n, n.hstep, 0.6, 1.5);
      drawNote(n, n.step, 1, 0);
    }
    var px = RL + clamp(beat / TOTAL) * w;
    ctx.fillStyle = '#ffd36e'; ctx.fillRect(px - 1, RT, 2, h);
  }

  function drawAll(beat) {
    if (!cur.theme) return;
    drawFx(beat); drawRoll(beat); updateCaption(beat);
    var spb = spbNow();
    $('time').textContent = fmt(Math.min(beat, TOTAL) * spb) + ' / ' + fmt(TOTAL * spb);
  }

  function sizeCanvas(cv, w, h) { cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr)); }
  function layoutCard() {
    var t = cur.theme;
    if (!t) return;
    var w = imgwrap.clientWidth, h = imgwrap.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    sizeCanvas(imgCv, w, h); sizeCanvas(fx, w, h);
    var cx = imgCv.getContext('2d');
    cx.imageSmoothingQuality = 'high';
    coverDraw(cx, getImage(t), imgCv.width, imgCv.height);
    var notes = safeAnalyze(getImage(t), w / h, t.preset);
    cur.error = !notes;
    cur.notes = notes || [];
    sizeCanvas(rollCv, rollCv.clientWidth, rollCv.clientHeight);
    P.lastCol = -2;
    drawAll(currentBeat());
  }

  function updateCredit() {
    var t = cur.theme, el = $('c-credit'), on = !!(t && t.real && t.credit);
    el.textContent = on ? 'Image: ' + t.credit : '';
    el.hidden = !on;
  }
  function openCard(t) {
    if (vox.ok) speechSynthesis.cancel();
    stopAudio(); haltPlayer();
    cur.theme = t; P.pos = 0; P.lastCol = -2;
    viewHome.hidden = true; viewCard.hidden = false;
    $('c-title').textContent = t.name;
    $('c-desc').textContent = t.desc;
    $('c-sound').textContent = t.sound;
    imgCv.setAttribute('aria-label', t.desc);
    updateCredit();
    document.title = t.name + ' · Earth Jukebox';
    setPlayUI();
    layoutCard();
    var go = autoplayNext; autoplayNext = false;
    if (go) playFrom(0);
  }
  function showHome() {
    if (cur.theme) haltPlayer();
    stopAudio();
    viewCard.hidden = true; viewHome.hidden = false;
    document.title = 'Earth Jukebox';
  }
  function route() {
    var h = decodeURIComponent((location.hash || '').slice(1)) || 'home';
    if (themes[h]) { openCard(themes[h]); return; }
    showHome();
    var how = h === 'how-it-works';
    $('page-home').hidden = how;
    $('page-how').hidden = !how;
    document.querySelectorAll('.nav a').forEach(function (a) {
      if (a.getAttribute('href') === (how ? '#how-it-works' : '#home')) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (how) document.title = 'How it works · Earth Jukebox';
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ====== Controls ====== */
  $('play').addEventListener('click', toggle);
  document.querySelectorAll('.seg').forEach(function (b) {
    b.addEventListener('click', function () {
      var beat = currentBeat();
      P.speed = parseFloat(b.dataset.speed);
      document.querySelectorAll('.seg').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      if (P.playing) playFrom(beat); else { P.pos = beat; P.lastCol = -2; drawAll(beat); }
    });
  });
  $('loop').addEventListener('change', function (e) { P.loop = e.target.checked; });
  rollCv.addEventListener('pointerdown', function (ev) {
    var rect = rollCv.getBoundingClientRect();
    var frac = clamp((ev.clientX - rect.left - RL) / (rect.width - RL - RR));
    playFrom(frac * TOTAL);
  });
  document.addEventListener('keydown', function (ev) {
    if (viewCard.hidden) return;
    var tag = ev.target && ev.target.tagName;
    if (ev.key === 'Escape') { location.hash = '#home'; return; }
    if (ev.key === ' ' && tag !== 'BUTTON' && tag !== 'INPUT' && tag !== 'SUMMARY' && tag !== 'A') { ev.preventDefault(); toggle(); }
    else if (ev.key === 'ArrowRight' && tag !== 'INPUT') { seek(currentBeat() + 2); }
    else if (ev.key === 'ArrowLeft' && tag !== 'INPUT') { seek(currentBeat() - 2); }
  });
  var rz = 0;
  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      clearTimeout(rz);
      rz = setTimeout(function () { if (!viewCard.hidden) layoutCard(); }, 120);
    }).observe(imgwrap);
  }
  window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(function () { if (!viewCard.hidden) layoutCard(); }, 120); });

  /* ====== Voice narration (Web Speech API, built into the browser) ======
     On mouse hover or keyboard focus (Tab) over a link or button, the site speaks its name.
     To make any other element speak, just give it data-voz="text".
     data-voz-always makes an element speak even when narration is off. */
  var vox = { ok: 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window, on: true, voice: null, timer: 0, last: null, primed: false };
  try { if (localStorage.getItem('narration') === 'off') vox.on = false; } catch (e) {}
  function pickVoice() {
    var vs = speechSynthesis.getVoices(), i;
    vox.voice = null;
    for (i = 0; i < vs.length; i++) { if (/^en[-_]US/i.test(vs[i].lang)) { vox.voice = vs[i]; return; } }
    for (i = 0; i < vs.length; i++) { if (/^en/i.test(vs[i].lang)) { vox.voice = vs[i]; return; } }
  }
  if (vox.ok) {
    pickVoice();
    if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }
  function speak(text, force) {
    if (!vox.ok || !text || (!vox.on && !force)) return;
    speechSynthesis.cancel();
    (text.match(/.*?[.!?](?=\s|$)|.+$/g) || [text]).forEach(function (sentence) {
      var s = sentence.trim();
      if (!s) return;
      var u = new SpeechSynthesisUtterance(s);
      u.lang = 'en-US';
      if (vox.voice) u.voice = vox.voice;
      speechSynthesis.speak(u);
    });
  }
  function textOf(el) {
    return el.getAttribute('data-voz') || el.getAttribute('aria-label') || (el.textContent || '').replace(/\s+/g, ' ').trim();
  }
  var TARGET = 'a, button, summary, label, [data-voz]';
  function targetOf(n) { return n && n.closest ? n.closest(TARGET) : null; }
  function speakElement(el) { speak(textOf(el), el.hasAttribute('data-voz-always')); }

  document.addEventListener('mouseover', function (e) {
    var el = targetOf(e.target);
    if (el === vox.last) return;
    vox.last = el;
    clearTimeout(vox.timer);
    if (el) vox.timer = setTimeout(function () { speakElement(el); }, 150);
  });
  document.addEventListener('focusin', function (e) {
    var el = targetOf(e.target), keyboard = true;
    if (!el) return;
    try { keyboard = e.target.matches(':focus-visible'); } catch (err) {}
    if (keyboard) speakElement(el);
  });
  /* Some browsers only allow speech after the first click or key press. */
  function primeVoice() {
    if (vox.primed || !vox.ok) return;
    vox.primed = true;
    var u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
  document.addEventListener('pointerdown', primeVoice, true);
  document.addEventListener('keydown', primeVoice, true);

  function updateVox() {
    var b = $('voz');
    b.setAttribute('aria-pressed', vox.on ? 'true' : 'false');
    $('voz-txt').textContent = vox.on ? 'Narration: on' : 'Narration: off';
    b.setAttribute('data-voz', vox.on ? 'Narration on. Click to turn off.' : 'Narration off. Click to turn on.');
  }
  if (!vox.ok) $('voz-box').hidden = true;
  updateVox();
  $('voz').addEventListener('click', function () {
    vox.on = !vox.on;
    try { localStorage.setItem('narration', vox.on ? 'on' : 'off'); } catch (e) {}
    updateVox();
    speak(vox.on ? 'Narration on.' : 'Narration off.', true);
  });

  /* "Image description": opening it pauses the image music and reads the description aloud.
     Closing it stops the reading. Hovering only speaks the button name. */
  document.querySelector('.desc').addEventListener('toggle', function () {
    var t = cur.theme;
    if (this.open && t) {
      haltPlayer();
      speak(t.name + '. ' + t.desc + ' ' + t.sound, true);
    } else if (vox.ok) {
      speechSynthesis.cancel();
    }
  });

  setPlayUI();
  route();
})();