(function () {
  var NAME = "Ma'am Zharina";
  var wishes = ["good health", "happiness", "zero bugs", "balanced books"];
  var slides = [].slice.call(document.querySelectorAll(".slide"));
  var idx = -1, ranOnce = false, timers = [], revealTimer = null, resetTimer = null;
  var prog = document.getElementById("prog");
  var count = document.getElementById("count");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var out = document.getElementById("out");

  function go(n) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    if (n === idx) return;
    var from = idx;
    if (from >= 0) { slides[from].classList.add("shown"); }
    slides.forEach(function (s, i) {
      s.classList.toggle("active", i === n);
      s.classList.toggle("past", i < n);
    });
    idx = n;
    clearTimeout(revealTimer);
    if (from === -1) {
      revealTimer = setTimeout(function () { slides[n].classList.add("shown"); }, 150);
    } else if (n > from) {
      revealTimer = setTimeout(function () { slides[n].classList.add("shown"); }, 650);
    } else {
      slides[n].classList.add("shown");
    }
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      slides.forEach(function (s, i) { if (i > idx) { s.classList.remove("shown"); } });
    }, 1400);
    count.textContent = (n + 1) + " / " + slides.length;
    prog.style.width = ((n + 1) / slides.length * 100) + "%";
    prev.disabled = n === 0;
    next.disabled = n === slides.length - 1;
    curlEl.style.display = n === slides.length - 1 ? "none" : "block";
    curlbEl.style.display = n === 0 ? "none" : "block";
    if (n === 5 && !ranOnce) { ranOnce = true; setTimeout(runCode, 1500); }
    if (n === slides.length - 1) { setTimeout(confetti, 1100); }
  }

  prev.addEventListener("click", function () { go(idx - 1); });
  next.addEventListener("click", function () { go(idx + 1); });
  document.addEventListener("keydown", function (e) {
    var k = e.key;
    if (e.target && e.target.closest && e.target.closest("input, select, textarea")) return;
    if (k === "ArrowRight" || k === "PageDown" || k === " ") { e.preventDefault(); go(idx + 1); }
    else if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); go(idx - 1); }
    else if (k === "Home") { go(0); }
    else if (k === "End") { go(slides.length - 1); }
  });
  var sx = null, sy = null;
  document.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  document.addEventListener("touchend", function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    sx = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) { go(dx < 0 ? idx + 1 : idx - 1); }
  }, { passive: true });

  function addLine(text, cls) {
    var d = document.createElement("div");
    d.className = "line " + (cls || "");
    d.textContent = text;
    out.appendChild(d);
  }
  function runCode() {
    timers.forEach(clearTimeout); timers = [];
    out.textContent = "";
    var lines = [{ t: "Happy Birthday, " + NAME + "!", c: "big" }];
    wishes.forEach(function (w) { lines.push({ t: w + ": deployed", c: "ok" }); });
    lines.push({ t: "Thank you for leading us!", c: "" });
    lines.forEach(function (l, i) {
      timers.push(setTimeout(function () { addLine(l.t, l.c); }, i * 600));
    });
    timers.push(setTimeout(confetti, 200));
  }
  document.getElementById("run").addEventListener("click", runCode);
  var moreBtn = document.getElementById("more");
  if (moreBtn) { moreBtn.addEventListener("click", confetti); }
  var mergeBtn = document.getElementById("merge");
  mergeBtn.addEventListener("click", function () {
    var b = document.getElementById("badge");
    b.textContent = "Merged"; b.className = "badge merged";
    document.getElementById("prstat").textContent = "Merged into main. The birthday is officially live!";
    mergeBtn.textContent = "Merged"; mergeBtn.disabled = true;
    confetti();
  });
  var cakeEl = document.getElementById("cake"), blowBtn = document.getElementById("blow"), cap = document.getElementById("cap");
  blowBtn.addEventListener("click", function () {
    var out2 = cakeEl.classList.toggle("out");
    cap.textContent = out2 ? "Wish granted. Merged to main." : "Make a wish, Ma'am Zharina.";
    blowBtn.textContent = out2 ? "Light them again" : "Blow the candles";
    if (out2) confetti();
  });

  /* gold sparkle + confetti */
  var canvas = document.getElementById("fx");
  var ctx = canvas.getContext("2d");
  var parts = [], stars = [], raf = null;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function size() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    stars = [];
    for (var i = 0; i < 26; i++) {
      stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        s: 3 + Math.random() * 5, p: Math.random() * 6.28, v: .6 + Math.random() * 1.2 });
    }
  }
  window.addEventListener("resize", size); size();

  function confetti() {
    if (reduce) return;
    var colors = ["#e6c27a", "#fff1c2", "#b8862f", "#e8b4a0", "#fbf6ec", "#c2306b"];
    for (var i = 0; i < 140; i++) {
      parts.push({
        x: Math.random() * canvas.width, y: -20 - Math.random() * canvas.height * 0.4,
        w: 5 + Math.random() * 6, h: 9 + Math.random() * 9,
        vx: -1 + Math.random() * 2, vy: 1.6 + Math.random() * 2.8,
        r: Math.random() * 6, vr: -0.18 + Math.random() * 0.36,
        c: colors[(Math.random() * colors.length) | 0]
      });
    }
  }
  function star(x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y);
    ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y);
    ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
  }
  function tick(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#fff1c2";
    stars.forEach(function (st) {
      var a = 0.5 + 0.5 * Math.sin(t / 1000 * st.v + st.p);
      ctx.globalAlpha = 0.08 + 0.4 * a;
      star(st.x, st.y, st.s * (0.6 + 0.6 * a));
    });
    ctx.globalAlpha = 1;
    parts = parts.filter(function (p) { return p.y < canvas.height + 30; });
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    raf = requestAnimationFrame(tick);
  }
  if (!reduce) { raf = requestAnimationFrame(tick); }

  /* background music: synthesized music-box "Happy Birthday" (no audio file needed) */
  var AC = window.AudioContext || window.webkitAudioContext;
  var musicBtn = document.getElementById("music");
  var hint = document.getElementById("hint");
  var actx = null, master = null, bus = null, playing = false, want = true, mTimer = null, nextStart = 0;
  var BEAT = 0.8, LOOP = 30 * BEAT;
  var NOTE = { G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
  var CHORD = {
    C: { bass: 130.81, tri: [261.63, 329.63, 392.00] },
    G: { bass: 98.00,  tri: [196.00, 246.94, 293.66] },
    F: { bass: 87.31,  tri: [174.61, 220.00, 261.63] }
  };
  var PHRASES = [
    { pick: ["G4", "G4"], a: ["A4", "G4", "C5"], b: [["B4", 2]], bars: ["C", "G"] },
    { pick: ["G4", "G4"], a: ["A4", "G4", "D5"], b: [["C5", 2]], bars: ["G", "C"] },
    { pick: ["G4", "G4"], a: ["G5", "E5", "C5"], b: [["B4", 1], ["A4", 1]], bars: ["C", "G"] },
    { pick: ["F5", "F5"], a: ["E5", "C5", "D5"], b: [["C5", 2]], bars: ["F", "C"] }
  ];

  function initAudio() {
    if (actx) return;
    actx = new AC();
    master = actx.createGain(); master.gain.value = 0;
    bus = actx.createGain();
    var delay = actx.createDelay(1); delay.delayTime.value = 0.375;
    var fb = actx.createGain(); fb.gain.value = 0.3;
    var wet = actx.createGain(); wet.gain.value = 0.25;
    bus.connect(master); bus.connect(delay);
    delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(master);
    master.connect(actx.destination);
  }
  function tone(t, f, dur, vol, type) {
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function bell(t, f, beats) {
    var d = Math.max(1.2, beats * BEAT * 1.6);
    tone(t, f, d, 0.17, "sine");
    tone(t, f * 2, d * 0.55, 0.05, "sine");
    tone(t, f * 3, d * 0.25, 0.018, "triangle");
  }
  function bar(t, name) {
    var c = CHORD[name];
    tone(t, c.bass, 2.3, 0.09, "triangle");
    c.tri.forEach(function (f) { tone(t, f, 2.4, 0.03, "sine"); });
  }
  function scheduleLoop(t0) {
    var t = t0;
    PHRASES.forEach(function (ph) {
      bell(t, NOTE[ph.pick[0]], 0.75);
      bell(t + 0.75 * BEAT, NOTE[ph.pick[1]], 0.25);
      var ta = t + BEAT;
      bar(ta, ph.bars[0]);
      ph.a.forEach(function (n, i) { bell(ta + i * BEAT, NOTE[n], 1); });
      var tb = t + 4 * BEAT;
      bar(tb, ph.bars[1]);
      var off = 0;
      ph.b.forEach(function (n) { bell(tb + off * BEAT, NOTE[n[0]], n[1]); off += n[1]; });
      t += 7 * BEAT;
    });
  }
  function arm() {
    clearTimeout(mTimer);
    var ms = (nextStart - actx.currentTime - 2) * 1000;
    mTimer = setTimeout(loopStep, Math.max(50, ms));
  }
  function loopStep() {
    var st = Math.max(actx.currentTime + 0.15, nextStart);
    scheduleLoop(st);
    nextStart = st + LOOP;
    arm();
  }
  function musicUI() {
    musicBtn.classList.toggle("off", !playing);
    musicBtn.setAttribute("aria-pressed", playing ? "true" : "false");
    if (playing && hint) { hint.style.display = "none"; }
  }
  function startMusic() {
    if (!AC || playing) return;
    initAudio();
    actx.resume();
    playing = true;
    master.gain.cancelScheduledValues(actx.currentTime);
    master.gain.setTargetAtTime(0.8, actx.currentTime, 0.3);
    if (nextStart <= actx.currentTime) { loopStep(); } else { arm(); }
    musicUI();
  }
  function stopMusic() {
    if (!playing) return;
    playing = false;
    clearTimeout(mTimer);
    master.gain.cancelScheduledValues(actx.currentTime);
    master.gain.setTargetAtTime(0, actx.currentTime, 0.12);
    var c = actx;
    setTimeout(function () { if (!playing) { c.suspend(); } }, 500);
    musicUI();
  }
  if (!AC) { musicBtn.style.display = "none"; if (hint) { hint.style.display = "none"; } }
  musicBtn.addEventListener("click", function () {
    if (playing) { want = false; stopMusic(); } else { want = true; startMusic(); }
  });
  function firstGesture(e) {
    if (e.target && e.target.closest && e.target.closest("#music")) return;
    ["click", "keydown", "touchend"].forEach(function (ev) { document.removeEventListener(ev, firstGesture, true); });
    if (want && !playing) { startMusic(); }
  }
  ["click", "keydown", "touchend"].forEach(function (ev) { document.addEventListener(ev, firstGesture, true); });

  /* book setup: wrap each slide into a front page + paper back + shade */
  var curlEl = document.getElementById("curl");
  var curlbEl = document.getElementById("curlb");
  slides.forEach(function (s, i) {
    var pg = document.createElement("div"); pg.className = "pg";
    while (s.firstChild) { pg.appendChild(s.firstChild); }
    s.appendChild(pg);
    var back = document.createElement("div"); back.className = "back"; s.appendChild(back);
    var sh = document.createElement("div"); sh.className = "shade"; s.appendChild(sh);
    s.style.zIndex = String(slides.length - i);
  });
  curlEl.addEventListener("click", function () { go(idx + 1); });
  curlbEl.addEventListener("click", function () { go(idx - 1); });
  curlbEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { go(idx - 1); } });
  curlEl.addEventListener("keydown", function (e) { if (e.key === "Enter") { go(idx + 1); } });
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("button, a, input, select, label, .game, #curl, #curlb, .bar")) return;
    go(e.clientX < window.innerWidth * 0.3 ? idx - 1 : idx + 1);
  });

  window.HBD = { confetti: confetti, next: function () { go(idx + 1); } };

  /* Perf: only the pages near the current one are painted. */
  var oldGo = go;
  go = function (n) {
    oldGo(n);
    slides.forEach(function (sl, i) { sl.classList.toggle("far", Math.abs(i - idx) > 2); });
  };

  /* Start only when the fonts are ready (or after 1.8s), so nothing jumps or re-flows on open. */
  var startIdx = /#wall/i.test(location.hash) ? slides.length - 1 : 0;
  var revealed = false;
  function reveal() {
    if (revealed) { return; }
    revealed = true;
    go(startIdx);
    document.documentElement.classList.remove("boot");
  }
  var fontsReady = Promise.resolve();
  try {
    if (document.fonts && document.fonts.load) {
      fontsReady = Promise.all([
        document.fonts.load('700 48px "Cormorant Garamond"'),
        document.fonts.load('italic 500 24px "Cormorant Garamond"'),
        document.fonts.load('400 16px "Jost"'),
        document.fonts.load('400 14px "JetBrains Mono"')
      ]).catch(function () {});
    }
  } catch (e) {}
  Promise.race([fontsReady, new Promise(function (r) { setTimeout(r, 1800); })]).then(reveal);
})();
