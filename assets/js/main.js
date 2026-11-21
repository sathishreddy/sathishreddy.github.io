(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme ---------- */
  var themeBtn = document.getElementById('theme-toggle');
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById('menu-toggle');
  var links = document.getElementById('nav-links');
  function setMenu(open) {
    links.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(!links.classList.contains('is-open')); });
  links.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Nav state ---------- */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('is-scrolled', window.scrollY > 8); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var navLinks = Array.prototype.slice.call(links.querySelectorAll('a'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var pending = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduceMotion) {
    pending.forEach(function (el) { el.classList.add('is-in'); });
    pending = [];
  } else {
    pending.forEach(function (el, i) {
      if (el.closest('.hero')) el.style.transitionDelay = (i * 70) + 'ms';
    });
  }
  function revealVisible() {
    var limit = window.innerHeight * 0.94;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) { el.classList.add('is-in'); return false; }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener('scroll', revealVisible);
      window.removeEventListener('resize', revealVisible);
    }
  }
  window.addEventListener('scroll', revealVisible, { passive: true });
  window.addEventListener('resize', revealVisible);
  revealVisible();

  /* ---------- Count-up stats ---------- */
  var counters = document.querySelectorAll('.count');
  function runCount(el) {
    var to = parseInt(el.getAttribute('data-to'), 10);
    var start = null;
    var dur = 1400;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window && !reduceMotion) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCount(entry.target); co.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  }

  /* ---------- Rotating research phrase ---------- */
  var rot = document.getElementById('rotator-text');
  var phrases = [
    'LLM post-training.',
    'preference optimization.',
    'reward modeling.',
    'agentic reinforcement learning.',
    'multilingual LLMs.',
    'healthcare LLMs.',
    'speech translation.'
  ];
  if (rot && !reduceMotion) {
    var pi = 0, ci = phrases[0].length, deleting = true;
    rot.textContent = phrases[0];
    var tick = function () {
      var word = phrases[pi];
      if (deleting) {
        ci--;
        rot.textContent = word.slice(0, ci);
        if (ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; }
        setTimeout(tick, 32);
      } else {
        word = phrases[pi];
        ci++;
        rot.textContent = word.slice(0, ci);
        if (ci === word.length) { deleting = true; setTimeout(tick, 2200); }
        else setTimeout(tick, 55);
      }
    };
    setTimeout(tick, 2600);
  } else if (rot) {
    rot.textContent = phrases[0];
  }

  /* ---------- Monotonic attention figure ---------- */
  var canvas = document.getElementById('attn-canvas');
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext('2d');
    var src = ['the', 'model', 'listens', 'while', 'you', 'speak'];
    var tgt = ['el', 'modelo', 'escucha', 'mientras', 'hablas'];
    var align = [0, 1, 2, 3, 5];
    var W = 0, H = 0, dpr = 1;
    var t0 = performance.now();

    var resize = function () {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    var colors = function () {
      var cs = getComputedStyle(root);
      return {
        ink: cs.getPropertyValue('--ink').trim(),
        muted: cs.getPropertyValue('--muted').trim(),
        accent: cs.getPropertyValue('--accent').trim(),
        line: cs.getPropertyValue('--line-strong').trim()
      };
    };

    var xs = function (n, pad) {
      var out = [];
      for (var i = 0; i < n; i++) out.push(pad + (W - 2 * pad) * (n === 1 ? 0.5 : i / (n - 1)));
      return out;
    };

    var draw = function (now) {
      if (!W) resize();
      var c = colors();
      ctx.clearRect(0, 0, W, H);
      var narrow = W < 380;
      var pad = narrow ? 26 : 34;
      var sx = xs(src.length, pad), tx = xs(tgt.length, pad);
      var yTop = 16, yBot = H - 14;
      var period = 900;
      var step = reduceMotion ? tgt.length - 1 : Math.floor((now - t0) / period) % (tgt.length + 2);
      var frac = reduceMotion ? 1 : ((now - t0) % period) / period;
      var active = Math.min(step, tgt.length - 1);

      ctx.font = '500 ' + (narrow ? 9.5 : 11) + 'px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (var j = 0; j <= active && j < tgt.length; j++) {
        if (j > step) break;
        var lim = align[j];
        for (var i = 0; i <= lim; i++) {
          var dist = lim - i;
          var w = Math.exp(-dist * 1.1);
          var isCur = j === active && step < tgt.length;
          var alpha = isCur ? w * Math.min(1, frac * 2.5) : w * 0.45;
          ctx.globalAlpha = Math.max(alpha, 0.1);
          ctx.strokeStyle = isCur && dist === 0 ? c.accent : (isCur ? c.accent : c.muted);
          ctx.lineWidth = isCur && dist === 0 ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(sx[i], yTop + 10);
          ctx.bezierCurveTo(sx[i], H / 2, tx[j], H / 2, tx[j], yBot - 10);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      var readUpTo = step < tgt.length ? align[active] : src.length - 1;
      for (var a = 0; a < src.length; a++) {
        ctx.fillStyle = a <= readUpTo ? c.ink : c.muted;
        ctx.globalAlpha = a <= readUpTo ? 1 : 0.45;
        ctx.fillText(src[a], sx[a], yTop);
      }
      for (var b = 0; b < tgt.length; b++) {
        var shown = b < step || (b === step && step < tgt.length);
        ctx.globalAlpha = shown ? (b === step ? Math.min(1, frac * 3) : 1) : 0.15;
        ctx.fillStyle = b === active && step < tgt.length ? c.accent : c.ink;
        ctx.fillText(shown ? tgt[b] : '·', tx[b], yBot);
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion) requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(draw); });
    else requestAnimationFrame(draw);
    if (reduceMotion) themeBtn.addEventListener('click', function () { requestAnimationFrame(draw); });
  }

  /* ---------- Publications filter & search ---------- */
  var chips = document.querySelectorAll('#pub-chips .chip');
  var search = document.getElementById('pub-search');
  var groups = document.querySelectorAll('.pub-year');
  var pubs = document.querySelectorAll('.pub');
  var countEl = document.getElementById('pub-count');
  var pubsWrap = document.getElementById('pubs');
  var filter = 'selected';

  pubs.forEach(function (p) {
    p.dataset.text = p.textContent.toLowerCase().replace(/\s+/g, ' ');
    p.dataset.year = p.closest('.pub-year').getAttribute('data-year');
  });

  var labels = {
    selected: 'selected publications', all: 'publications', first: 'first-author publications',
    alignment: 'papers on post-training & alignment', agents: 'papers on agents & reasoning',
    multilingual: 'papers on multilingual LLMs', speech: 'papers on speech & machine translation',
    qa: 'papers on QA, dialogue & summarization'
  };

  function apply() {
    var q = search.value.trim().toLowerCase();
    var shown = 0;
    pubs.forEach(function (p) {
      var tags = p.getAttribute('data-tags').split(' ');
      var okFilter = filter === 'all' || tags.indexOf(filter) !== -1;
      var okQuery = !q || p.dataset.text.indexOf(q) !== -1 || p.dataset.year === q;
      var show = okFilter && okQuery;
      p.hidden = !show;
      if (show) shown++;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector('.pub:not([hidden])');
    });
    var existing = pubsWrap.querySelector('.empty');
    if (!shown && !existing) {
      var e = document.createElement('p');
      e.className = 'empty';
      e.textContent = 'No publications match that search.';
      pubsWrap.appendChild(e);
    } else if (shown && existing) existing.remove();
    countEl.textContent = 'Showing ' + shown + ' ' + labels[filter] + (q ? ' matching “' + search.value.trim() + '”' : '');
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); });
      chip.classList.add('is-active');
      chip.setAttribute('aria-pressed', 'true');
      filter = chip.getAttribute('data-filter');
      apply();
    });
    chip.setAttribute('aria-pressed', chip.classList.contains('is-active') ? 'true' : 'false');
  });
  search.addEventListener('input', function () {
    if (search.value && filter === 'selected') {
      chips.forEach(function (c) { c.classList.toggle('is-active', c.getAttribute('data-filter') === 'all'); });
      filter = 'all';
    }
    apply();
  });
  apply();

  /* ---------- Copy email ---------- */
  var copyBtn = document.getElementById('copy-email');
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.classList.remove('is-on'); }, 2000);
  }
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(email).then(function () { showToast('Email copied to clipboard'); });
      } else {
        showToast(email);
      }
    });
  }

  document.getElementById('year').textContent = new Date().getFullYear();
})();
