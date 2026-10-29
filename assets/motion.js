/*
 * WeDoBizness motion layer
 * Lenis smooth scroll + GSAP (ScrollTrigger, SplitText) reveals.
 * Loaded on every page after /assets/vendor/{lenis,gsap,ScrollTrigger,SplitText}.min.js
 */
(function () {
  var root = document.documentElement;
  function ready() { root.classList.add('wdb-ready'); }

  // If a vendor file failed to load, show everything and bail out.
  if (!window.gsap || !window.ScrollTrigger) { ready(); return; }

  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return gsap.utils.toArray((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------
   * 1. Lenis smooth scroll, driven by the GSAP ticker
   * ------------------------------------------------------------- */
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      // keep native scroll inside menus and embeds
      prevent: function (node) {
        return node.classList.contains('mobilemenu') ||
          node.classList.contains('navlist') ||
          node.classList.contains('calendly-inline-widget');
      }
    });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  // Smooth in-page anchors, offset by the sticky header
  function headerOffset() {
    var h = $('header') || $('.nav');
    return h ? -(h.offsetHeight + 12) : 0;
  }
  function scrollToTarget(target, immediate) {
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : headerOffset(), duration: 1.4, immediate: !!immediate });
    else if (target === 0) window.scrollTo(0, 0);
    else target.scrollIntoView();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    var url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || !url.hash) return;
    var id = decodeURIComponent(url.hash.slice(1));
    var el = id === 'top' ? (document.getElementById('top') || 0) : document.getElementById(id);
    if (el === null) return;
    e.preventDefault();
    scrollToTarget(id === 'top' ? 0 : el);
    if (history.pushState) history.pushState(null, '', url.hash);
  });

  /* ---------------------------------------------------------------
   * 2. Scroll progress bar + header shadow
   * ------------------------------------------------------------- */
  var bar = document.createElement('div');
  bar.className = 'wdb-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  var setBar = gsap.quickSetter(bar, 'scaleX');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: function (self) {
      setBar(self.progress);
      root.classList.toggle('wdb-scrolled', self.scroll() > 8);
    }
  });

  if (reduce) { ready(); refreshOnLayoutChange(); return; }

  /* ---------------------------------------------------------------
   * 3. Hero intro
   * ------------------------------------------------------------- */
  var hero = $('.hero');
  if (hero) {
    var lead = $$('.badge, .eyebrow', hero);
    var h1 = $('h1', hero);
    var after = $$('.sub, .intro, .cta-row, .proof-line', hero);

    gsap.set(lead.concat(after), { autoAlpha: 0, y: 22 });
    if (h1 && !window.SplitText) gsap.set(h1, { autoAlpha: 0, y: 30 });

    var tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 }, delay: 0.1 });
    if (lead.length) tl.to(lead, { autoAlpha: 1, y: 0, duration: 0.6 });

    if (h1 && window.SplitText) {
      var first = true;
      SplitText.create(h1, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'wdb-line',
        autoSplit: true,
        onSplit: function (self) {
          var tween = gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.05,
            stagger: 0.11,
            ease: 'power4.out',
            delay: first ? 0.25 : 0
          });
          first = false;
          return tween;
        }
      });
      tl.to(after, { autoAlpha: 1, y: 0, stagger: 0.1 }, 0.75);
    } else {
      if (h1) tl.to(h1, { autoAlpha: 1, y: 0, duration: 0.9 }, '-=0.3');
      tl.to(after, { autoAlpha: 1, y: 0, stagger: 0.1 }, '-=0.5');
    }

    // Gentle parallax fade as the hero leaves the viewport (tall heroes only)
    var heroWrap = $('.wrap', hero);
    if (heroWrap && hero.offsetHeight > 380) {
      gsap.to(heroWrap, {
        yPercent: -10,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  }
  ready();

  /* ---------------------------------------------------------------
   * 4. Scroll reveals (batched, staggered)
   * ------------------------------------------------------------- */
  var revealSel = [
    // homepage
    '.statband .stat', '.logos .logoslot', '.logos .cap',
    '.problem .wrap > *', '.sec-head', '#method > .wrap > h2', '#method .eyebrow',
    '.mcard', '.offer', '.case', '.rev', '.seo-links',
    '.steroid h2', '.steroid p', '.steroid .btn',
    '#apply .wrap > *', '#faq .wrap > *', '.seo-explore .wrap > *',
    'footer .fgrid > *',
    // subpages + blog
    '.breadcrumbs', '.content .prose > *', '.tile', '.content .grid',
    '.foot .footinner > *', '.foot .copyright'
  ].join(',');

  var candidates = $$(revealSel).filter(function (el) {
    if (hero && hero.contains(el)) return false;
    if (el.closest('.mobilemenu, .navlist')) return false;
    return true;
  });
  // Skip elements whose ancestor is already being revealed (avoids double fades)
  var set = new Set(candidates);
  var reveals = candidates.filter(function (el) {
    for (var p = el.parentElement; p; p = p.parentElement) if (set.has(p)) return false;
    return true;
  });

  if (reveals.length) {
    gsap.set(reveals, { autoAlpha: 0, y: 34 });
    ScrollTrigger.batch(reveals, {
      start: 'top 90%',
      once: true,
      interval: 0.1,
      batchMax: 6,
      onEnter: function (batch) {
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.09,
          overwrite: true,
          clearProps: 'transform'
        });
      }
    });
  }

  /* ---------------------------------------------------------------
   * 5. Count-up numbers (stats + case study tiles)
   * ------------------------------------------------------------- */
  $$('.stat .n, .ctile .n').forEach(function (el) {
    var raw = el.textContent.trim();
    var m = raw.match(/^([^\d]*)([\d][\d,]*(?:\.\d+)?)(.*)$/);
    if (!m) return;
    var prefix = m[1], numStr = m[2], suffix = m[3];
    if (!prefix && !suffix && /^(19|20)\d\d$/.test(numStr)) return; // years stay static
    var target = parseFloat(numStr.replace(/,/g, ''));
    if (!isFinite(target) || target === 0) return;
    var decimals = (numStr.split('.')[1] || '').length;
    var commas = numStr.indexOf(',') > -1;
    var fmt = function (v) {
      var s = v.toFixed(decimals);
      if (commas) s = Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      return prefix + s + suffix;
    };
    var obj = { v: 0 };
    el.setAttribute('data-final', raw); // used by the glass snapshot (fx.js)
    el.textContent = fmt(0);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 92%',
      once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: function () { el.textContent = fmt(obj.v); },
          onComplete: function () { el.textContent = raw; }
        });
      }
    });
  });

  /* ---------------------------------------------------------------
   * 6. Magnetic primary buttons (mouse / trackpad only)
   * ------------------------------------------------------------- */
  if (finePointer) {
    $$('.btn.big, .navlist .cta, .navright .btn').forEach(function (btn) {
      var xTo = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3.out' });
      var yTo = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3.out' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.18);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.28);
      });
      btn.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  refreshOnLayoutChange();

  /* ---------------------------------------------------------------
   * Keep trigger positions right when images, fonts or embeds change layout
   * ------------------------------------------------------------- */
  function refreshOnLayoutChange() {
    var t;
    var refresh = function () { clearTimeout(t); t = setTimeout(function () { ScrollTrigger.refresh(); }, 200); };
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    if ('ResizeObserver' in window) {
      var lastH = document.body.scrollHeight;
      new ResizeObserver(function () {
        var h = document.body.scrollHeight;
        if (Math.abs(h - lastH) > 40) { lastH = h; refresh(); }
      }).observe(document.body);
    }
  }
})();
