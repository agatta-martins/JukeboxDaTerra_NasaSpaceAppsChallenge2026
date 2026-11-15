(function () {
  'use strict';
  document.documentElement.lang = 'pt-BR';

  /* ====== Constantes ====== */
  var ROWS = 15;            // linhas do piano roll = degraus da escala
  var N = 48;               // colunas da imagem = notas
  var BPC = 0.5;            // batidas por coluna
  var TOTAL = N * BPC;      // duração em batidas
  var TAIL = 1.6;           // cauda depois da última nota
  var PREV_BEATS = 6;       // prévia nos cards: 12 colunas
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

  /* ====== Temas ======
     Cada tema = um card. Campos:
       id      endereço da página (#id), sem espaços nem acentos, único
       nome    título do card
       src     arquivo da imagem, dentro de img/
       credito texto mostrado sobre a imagem e no card. Troque por 'NASA SVS · ID 00000'
       crop    (opcional) [x, y, largura, altura] em frações de 0 a 1, para cortar legenda ou data da imagem
       preset  escala, andamento (bpm) e eco do tema
       desc    descrição da imagem (leitor de tela e botão "Descrição da imagem")
       som     explicação do som deste tema */
  var ORDER = [
    {
      id: 'aerossois', nome: 'Aerossóis',
      src: 'img/geos.png', credito: 'NASA',
      preset: { root: 45, scale: SC.minor, bpm: 100, reverb: 0.5 },
      desc: 'Mapa-múndi sobre fundo escuro. Redemoinhos verde-neon se enrolam sobre os oceanos e a Ásia. Uma larga faixa lilás e branca cruza o Atlântico e o Norte da África, e manchas laranja e vermelhas aparecem na África central. As luzes das cidades pontilham a América do Norte e a Europa, e um redemoinho em espiral surge sobre o Atlântico.',
      som: 'Escala menor natural, andamento rápido e muito eco. A melodia segue a região mais clara de cada trecho do mapa, como o verde-neon e a faixa lilás; os oceanos escuros ficam em segundo plano.'
    },
    {
      id: 'oceano', nome: 'Cor do oceano',
      src: 'img/ocean.jpg', credito: 'NASA', crop: [0, 0, 1, 0.885],
      preset: { root: 46, scale: SC.sus, bpm: 66, reverb: 0.6 },
      desc: 'Mapa-múndi com os continentes em cinza e o oceano pintado por uma escala que vai do azul-marinho ao amarelo. As águas profundas, no centro dos oceanos, são azul-escuras. As regiões costeiras e as próximas dos polos aparecem em verde e amarelo. A Antártida é uma mancha clara na parte de baixo.',
      som: 'Escala suspensa, lenta e espaçosa. Os continentes claros e as faixas amarelas da costa puxam a melodia para cima; o oceano profundo, escuro, fica no grave. A legenda e a data da imagem original foram cortadas para não virarem notas.'
    },
    {
      id: 'gelo-polar', nome: 'Gelo polar',
      src: 'img/polar.jpg', credito: 'NASA',
      preset: { root: 52, scale: SC.lydian, bpm: 62, reverb: 0.65 },
      desc: 'Vista aérea de uma geleira. A superfície de gelo branco-azulada é cheia de rachaduras e ondulações que se curvam em arcos, cortada por faixas escuras de rocha e sedimento. Ao fundo, colinas marrons e um céu claro e esfumaçado.',
      som: 'Escala lídia, lenta e cristalina, com bastante eco. A melodia sobe e desce acompanhando as ondulações do gelo e as faixas escuras de rocha.'
    },
    {
      id: 'agricultura', nome: 'Agricultura',
      src: 'img/agriculture.webp', credito: 'NASA',
      preset: { root: 50, scale: SC.majorPent, bpm: 96, reverb: 0.25 },
      desc: 'Vista de satélite de campos agrícolas. Dezenas de círculos verde-escuros, feitos pela irrigação em pivô central, se misturam a quadrados e retângulos em verde-claro, cinza e bege. A imagem é escura e muito larga.',
      som: 'Escala pentatônica maior e ritmo animado. Os campos verdes soam como marimba, com notas curtas; os campos claros soam mais brilhantes.'
    },
    {
      id: 'correntes-oceanicas', nome: 'Correntes oceânicas',
      src: 'img/perpetualocean.jpg', credito: 'NASA',
      preset: { root: 50, scale: SC.lydian, bpm: 70, reverb: 0.55 },
      desc: 'A Terra vista do espaço, centrada nas Américas, sobre fundo preto. Os oceanos são azuis e cobertos por milhares de linhas brancas finas que mostram as correntes marítimas, com muitos redemoinhos. Uma faixa branca mais forte, a Corrente do Golfo, sai do Golfo do México e segue pelo Atlântico Norte. Os continentes aparecem em verde e marrom, e o Canadá está coberto de neve.',
      som: 'Escala lídia, fluida e com bastante eco. As laterais pretas da imagem ficam quase em silêncio, e o som cresce quando a varredura entra no globo. As linhas brancas das correntes, mais claras, guiam a melodia.'
    },
    {
      id: 'aurora', nome: 'Aurora',
      src: 'img/aurora.jpg', credito: 'NASA',
      preset: { root: 43, scale: SC.sus, bpm: 56, reverb: 0.7 },
      desc: 'Céu noturno com uma grande faixa de luz verde da aurora atravessando a imagem na diagonal, sobre um fundo azul-escuro e preto cheio de estrelas. No chão aparecem neve, antenas, um poste e a lateral de um carro.',
      som: 'Escala suspensa, bem lenta e com muito eco. A luz verde toca com notas curtas de marimba, e o céu escuro fica em silêncio relativo.'
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

  /* ====== Análise: imagem → lista de notas ====== */
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
      var rest = k.lum < 0.04; // trecho quase preto (fundo do espaço): vira pausa, sem nota
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

  /* ====== Áudio (Web Audio API) ====== */
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
  /* Carrega a imagem do campo src (e aplica o recorte, se houver). */
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
      if (p) p.textContent = t.credito || 'NASA';
      drawThumb(t);
      if (cur.theme === t && !viewCard.hidden) { layoutCard(); updateCredit(); }
    };
    im.onerror = function () {
      console.error('Imagem não encontrada: ' + t.src + '. Confira o nome do arquivo na pasta img/.');
      var p = t.el && t.el.querySelector('.lab p');
      if (p) p.textContent = 'Imagem não encontrada';
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
      '<span class="chip"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.2" stroke="currentColor" stroke-width="1.3"/><path d="M1.8 8h12.4M8 1.8c2 2 2 10.4 0 12.4M8 1.8c-2 2-2 10.4 0 12.4" stroke="currentColor" stroke-width="1.1"/></svg>Tema da Terra</span>' +
      '<button class="pv" type="button" aria-pressed="false">' + ICON_PV + '</button>' +
      '<div class="lab"><h3></h3><p></p></div>' +
      '<a class="card-link" href="#"></a>';
    el.querySelector('h3').textContent = t.nome;
    el.querySelector('.lab p').textContent = 'Carregando imagem…';
    var a = el.querySelector('.card-link');
    a.setAttribute('href', '#' + t.id);
    a.setAttribute('aria-label', 'Abrir ' + t.nome);
    a.addEventListener('click', function () { autoplayNext = true; ensureAudio(); });
    var pv = el.querySelector('.pv');
    pv.setAttribute('aria-label', 'Ouvir prévia: ' + t.nome);
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
      t.pv.setAttribute('aria-label', (on ? 'Parar prévia: ' : 'Ouvir prévia: ') + t.nome);
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

  /* ====== Carrossel: 3 cards por página (2 ou 1 em telas estreitas) ====== */
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
  function goPage(d) { cs.page += d; renderCarousel(); }
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

  /* ====== Página do card: player ====== */
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
    b.setAttribute('aria-label', P.playing ? 'Pausar' : 'Tocar');
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
    live('Tocando ' + th.nome + '.');
    cancelAnimationFrame(P.raf);
    P.raf = requestAnimationFrame(tick);
  }
  function pause() {
    P.pos = currentBeat(); P.playing = false;
    cancelAnimationFrame(P.raf); stopAudio(); setPlayUI(); drawAll(P.pos);
    live('Pausado.');
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
      live('Fim.');
      return;
    }
    drawAll(beat);
    P.raf = requestAnimationFrame(tick);
  }

  function describeNote(n) {
    if (n.rest) return 'Pausa · trecho preto da imagem, sem nota';
    var b = n.vel < 0.5 ? 'trecho escuro' : (n.vel < 0.78 ? 'luminosidade média' : 'trecho claro');
    var k = n.kind === 'pluck' ? 'verde, som de marimba' : (n.kind === 'bright' ? 'tons quentes, som brilhante' : 'tons frios, som suave');
    var p = n.step < 5 ? 'nota grave' : (n.step < 10 ? 'nota média' : 'nota aguda');
    return midiName(n.midi) + ' · ' + b + ', ' + k + ' · ' + p + (n.hmidi !== null ? ' · textura densa, 2 vozes' : '');
  }
  function updateCaption(beat) {
    var col = beat >= TOTAL ? N : Math.floor(beat / BPC);
    if (col === P.lastCol) return;
    P.lastCol = col;
    var el = $('caption');
    if (cur.error) { el.textContent = 'Não foi possível ler os pixels desta imagem. Abra o site por um servidor local (python -m http.server na pasta do projeto) em vez de abrir o arquivo com duplo clique.'; return; }
    if (!P.playing && beat <= 0) el.textContent = 'Toque ▶ para ouvir. A linha dourada percorre a imagem e cada ponto é uma nota.';
    else if (col >= N) el.textContent = 'Fim da imagem.';
    else el.textContent = describeNote(cur.notes[col]);
  }

  /* ---- desenho: linha de varredura sobre a imagem ---- */
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

  /* ---- desenho: piano roll ---- */
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
    var t = cur.theme, el = $('c-credit'), on = !!(t && t.real && t.credito);
    el.textContent = on ? 'Imagem: ' + t.credito : '';
    el.hidden = !on;
  }
  function openCard(t) {
    stopAudio(); haltPlayer();
    cur.theme = t; P.pos = 0; P.lastCol = -2;
    viewHome.hidden = true; viewCard.hidden = false;
    $('c-title').textContent = t.nome;
    $('c-desc').textContent = t.desc;
    $('c-sound').textContent = t.som;
    imgCv.setAttribute('aria-label', t.desc);
    updateCredit();
    document.title = t.nome + ' · Jukebox da Terra';
    setPlayUI();
    layoutCard();
    var go = autoplayNext; autoplayNext = false;
    if (go) playFrom(0);
  }
  function showHome() {
    if (cur.theme) haltPlayer();
    stopAudio();
    viewCard.hidden = true; viewHome.hidden = false;
    document.title = 'Jukebox da Terra';
  }
  function route() {
    var h = decodeURIComponent((location.hash || '').slice(1)) || 'inicio';
    if (themes[h]) { openCard(themes[h]); return; }
    showHome();
    var how = h === 'como-funciona';
    $('page-inicio').hidden = how;
    $('page-como').hidden = !how;
    document.querySelectorAll('.nav a').forEach(function (a) {
      if (a.getAttribute('href') === (how ? '#como-funciona' : '#inicio')) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (how) document.title = 'Como funciona · Jukebox da Terra';
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ====== Controles ====== */
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
    if (ev.key === 'Escape') { location.hash = '#inicio'; return; }
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

  setPlayUI();
  route();
})();
