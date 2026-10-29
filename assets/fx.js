/*
 * WeDoBizness homepage FX (loaded deferred, after motion.js, on index.html only)
 *
 * Speed rules (measured with Lighthouse, see README):
 *  - Nothing here runs before the page has loaded and gone idle.
 *  - Phones, tablets and low-end machines get the light version only:
 *    CSS hero glow (compositor-only animation) + frosted CSS glass CTA. Zero WebGL.
 *  - Desktop-class machines additionally get the ShaderGradient hero + R3F marks,
 *    started on the visitor's first interaction or after a quiet period.
 *  - The WebGL liquid glass (needs a page snapshot) only runs on strong desktops,
 *    at half resolution, the first time the CTA appears AND the visitor has paused scrolling.
 *  - Reduced motion / data saver: no WebGL at all.
 */
(function () {
  var doc = document;
  var hero = doc.querySelector('.hero');
  if (!hero) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var saveData = !!conn.saveData || /(^|-)2g$|3g/.test(conn.effectiveType || '');
  var cores = navigator.hardwareConcurrency || 4;
  var memory = navigator.deviceMemory || 8; // undefined in Safari/Firefox: assume fine
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var desktopClass = finePointer && window.innerWidth >= 900 && cores >= 4 && memory >= 4;
  var strongDesktop = desktopClass && cores >= 8 && memory >= 8;
  var gsap = window.gsap;

  var probe = null;
  function getProbe() {
    if (probe !== null) return probe;
    try {
      var gl = doc.createElement('canvas').getContext('webgl');
      probe = gl ? { maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE) } : false;
      var lose = gl && gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext(); // free the probe context right away
    } catch (e) { probe = false; }
    return probe;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = doc.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = reject;
      doc.head.appendChild(s);
    });
  }
  function afterLoad(fn) {
    if (doc.readyState === 'complete') fn();
    else window.addEventListener('load', fn, { once: true });
  }
  function idle(fn, timeout) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: timeout || 3000 });
    else setTimeout(fn, 300);
  }
  // Run fn once: on the first real interaction, or after `quietMs` with none.
  function onFirstInteractionOr(quietMs, fn) {
    var done = false, events = ['pointermove', 'wheel', 'touchstart', 'keydown', 'scroll'];
    function go() {
      if (done) return; done = true;
      events.forEach(function (e) { window.removeEventListener(e, go); });
      clearTimeout(timer);
      idle(fn, 1500);
    }
    events.forEach(function (e) { window.addEventListener(e, go, { passive: true, once: true }); });
    var timer = setTimeout(go, quietMs);
  }

  /* -------------------------------------------------------------- *
   * 1. Floating glass CTA (CSS glass for everyone, costs nothing)
   * -------------------------------------------------------------- */
  var cta = doc.createElement('div');
  cta.className = 'wdb-glass-cta is-css';
  cta.setAttribute('role', 'navigation');
  cta.setAttribute('aria-label', 'Quick actions');
  cta.innerHTML =
    '<a class="go" href="#apply">Apply to work with us <span aria-hidden="true">→</span></a>' +
    '<a class="alt" href="#guide">$29 playbook</a>';
  doc.body.appendChild(cta);

  var shown = false;
  var everShown = false;
  var glass = null; // liquid-glass Container once upgraded

  function renderGlass() { if (glass && glass.render) glass.render(); }

  function setShown(next) {
    if (next === shown) return;
    shown = next;
    if (next && !everShown) { everShown = true; maybeUpgradeGlass(); }
    if (gsap) {
      gsap.to(cta, {
        autoAlpha: next ? 1 : 0,
        y: next ? 0 : 24,
        duration: next ? 0.6 : 0.35,
        ease: next ? 'power3.out' : 'power2.in',
        overwrite: true,
        onUpdate: renderGlass
      });
    } else {
      cta.style.visibility = next ? 'visible' : 'hidden';
      cta.style.opacity = next ? '1' : '0';
    }
  }
  if (gsap) gsap.set(cta, { x: 0, xPercent: -50, y: 24 });

  var applyEl = doc.getElementById('apply');
  var footerEl = doc.querySelector('footer');
  var menuEl = doc.getElementById('mobileMenu');
  function inView(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92 && r.bottom > 0;
  }
  var ticking = false;
  function updateCta() {
    ticking = false;
    var pastHero = hero.getBoundingClientRect().bottom < 80;
    var menuOpen = menuEl && menuEl.classList.contains('open');
    setShown(pastHero && !inView(applyEl) && !inView(footerEl) && !menuOpen);
    renderGlass();
  }
  function requestUpdate() { if (!ticking) { ticking = true; requestAnimationFrame(updateCta); } }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  requestUpdate();

  /* WebGL refraction upgrade: strong desktops only */
  function canUpgradeGlass() {
    if (!strongDesktop || reduce || saveData) return false;
    var p = getProbe();
    if (!p) return false;
    var h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
    return h * 0.5 <= p.maxTex && window.innerWidth * 0.5 <= p.maxTex;
  }

  // Wait until the visitor is idle (no scroll, mouse, key or touch), so the one-off snapshot never interrupts them.
  var activity = ['scroll', 'wheel', 'pointermove', 'pointerdown', 'keydown', 'touchstart'];
  function whenUserIdle(ms, fn) {
    var t;
    function arm() { clearTimeout(t); t = setTimeout(done, ms); }
    function done() {
      activity.forEach(function (e) { window.removeEventListener(e, arm); });
      idle(fn, 2000);
    }
    activity.forEach(function (e) { window.addEventListener(e, arm, { passive: true }); });
    arm();
  }

  var glassLoading = false;
  function maybeUpgradeGlass() {
    if (glassLoading || !canUpgradeGlass()) return;
    glassLoading = true;
    afterLoad(function () {
      whenUserIdle(1500, function () {
        loadScript('/assets/vendor/liquid-glass/html2canvas.min.js?v=d7530aa0')
          .then(function () { return loadScript('/assets/vendor/liquid-glass/container.js?v=3100e2f4'); })
          .then(function () {
            whenUserIdle(2000, function () {
              buildGlass();
              window.addEventListener('resize', maybeRebuild);
            });
          })
          .catch(function () { /* CSS glass stays */ });
      });
    });
  }

  function buildGlass() {
    /* global Container */
    if (typeof Container === 'undefined' || !canUpgradeGlass()) return;

    Container.snapshotScale = 0.5;
    // Make the snapshot show the finished page, not the pre-reveal state
    Container.onClone = function (cloned) {
      cloned.documentElement.classList.add('wdb-ready');
      cloned.querySelectorAll('[style]').forEach(function (el) {
        el.style.opacity = '';
        el.style.visibility = '';
        el.style.transform = '';
      });
      cloned.querySelectorAll('[data-final]').forEach(function (el) {
        el.textContent = el.getAttribute('data-final');
      });
    };
    Container.ignore = function (el) {
      var c = el.classList;
      // Skip our own layers, embeds, and the sections where the pill is hidden anyway
      // (smaller snapshot = shorter one-off render).
      return !!c && (c.contains('wdb-glass-cta') || c.contains('wdb-progress') ||
        c.contains('wdb-hero-bg') || c.contains('wdb-marks') || el.tagName === 'IFRAME' ||
        el.id === 'apply' || el.id === 'faq' || el.tagName === 'FOOTER' || c.contains('seo-explore'));
    };

    Container.pageSnapshot = null;
    Container.isCapturing = false;
    Container.waitingForSnapshot = [];

    var next = new Container({ type: 'pill', tintOpacity: 0.12 });
    var el = next.element;
    el.className += ' wdb-glass-cta is-css';
    el.setAttribute('role', 'navigation');
    el.setAttribute('aria-label', 'Quick actions');
    while (cta.firstChild) el.appendChild(cta.firstChild);
    cta.parentNode.replaceChild(el, cta);
    cta = el;
    if (gsap) gsap.set(el, { x: 0, xPercent: -50, y: shown ? 0 : 24, autoAlpha: shown ? 1 : 0 });
    else { el.style.visibility = shown ? 'visible' : 'hidden'; el.style.opacity = shown ? '1' : '0'; }
    glass = next;

    var tries = 0;
    (function waitForGL() {
      if (next !== glass) return;
      if (next.webglInitialized) {
        el.classList.remove('is-css');
        el.classList.add('is-webgl');
        next.updateSizeFromDOM();
        renderGlass();
        return;
      }
      if (++tries < 300) requestAnimationFrame(waitForGL);
    })();
  }

  // Re-snapshot only when the window width changes (layout reflows); at most twice.
  var lastW = window.innerWidth, rebuilds = 0, rt;
  function maybeRebuild() {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (window.innerWidth !== lastW && rebuilds < 2) {
        lastW = window.innerWidth; rebuilds++;
        whenUserIdle(2000, buildGlass);
      }
    }, 600);
  }

  /* -------------------------------------------------------------- *
   * 2. ShaderGradient hero + R3F marks: desktop-class machines only
   * -------------------------------------------------------------- */
  if (!desktopClass || reduce || saveData) return;

  afterLoad(function () {
    onFirstInteractionOr(3500, function () {
      if (!getProbe()) return;
      loadScript('/assets/vendor/wdb-3d.js?v=fb52b42c').then(function () {
        if (!window.WDB3D) return;
        idle(function () {
          var bg = doc.createElement('div');
          bg.className = 'wdb-hero-bg';
          bg.setAttribute('aria-hidden', 'true');
          hero.insertBefore(bg, hero.firstChild);
          window.WDB3D.mountHero(bg);
        });
        // Marks are set up in the same quiet period (not mid-scroll, when shader setup could stutter).
        // They stay paused until the band scrolls into view.
        var band = doc.querySelector('.steroid');
        if (band) {
          idle(function () {
            var marks = doc.createElement('div');
            marks.className = 'wdb-marks';
            marks.setAttribute('aria-hidden', 'true');
            band.insertBefore(marks, band.firstChild);
            window.WDB3D.mountMarks(marks);
          }, 2500);
        }
      }).catch(function () { /* CSS glow stays */ });
    });
  });
})();
