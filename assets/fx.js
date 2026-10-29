/*
 * WeDoBizness homepage FX (loaded after motion.js on index.html only)
 *
 *  1. Floating "liquid glass" CTA. Starts as CSS glass for everyone, then upgrades to
 *     real WebGL refraction (liquid-glass-js) on desktop GPUs that can hold the page.
 *  2. ShaderGradient hero background + React Three Fiber logo marks (wdb-3d.js),
 *     lazy-loaded once the page has finished loading.
 *
 * Everything is skipped for prefers-reduced-motion and data-saver visitors.
 */
(function () {
  var doc = document;
  var hero = doc.querySelector('.hero');
  if (!hero) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  var gsap = window.gsap;

  var probe = (function () {
    try {
      var c = doc.createElement('canvas');
      var gl = c.getContext('webgl');
      return gl ? { maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE) } : null;
    } catch (e) { return null; }
  })();

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
  function whenIdle(fn, timeout) {
    if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: timeout || 2000 });
    else setTimeout(fn, 200);
  }

  /* -------------------------------------------------------------- *
   * 1. Floating glass CTA
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
  var glass = null; // liquid-glass Container once upgraded

  function renderGlass() { if (glass && glass.render) glass.render(); }

  function setShown(next) {
    if (next === shown) return;
    shown = next;
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

  function inView(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight * 0.92 && r.bottom > 0;
  }
  var applyEl = doc.getElementById('apply');
  var footerEl = doc.querySelector('footer');
  var menuEl = doc.getElementById('mobileMenu');
  function updateCta() {
    var pastHero = hero.getBoundingClientRect().bottom < 80;
    var menuOpen = menuEl && menuEl.classList.contains('open');
    setShown(pastHero && !inView(applyEl) && !inView(footerEl) && !menuOpen);
    renderGlass();
  }
  window.addEventListener('scroll', updateCta, { passive: true });
  window.addEventListener('resize', updateCta);
  updateCta();

  /* WebGL refraction upgrade (desktop only: the page snapshot must fit in one GPU texture) */
  function canUpgradeGlass() {
    if (!probe || reduce || saveData || window.innerWidth < 768) return false;
    var h = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
    return h <= probe.maxTex && window.innerWidth <= probe.maxTex;
  }

  var rebuilds = 0;
  function buildGlass() {
    /* global Container */
    if (typeof Container === 'undefined' || !canUpgradeGlass()) return;

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
      return !!c && (c.contains('wdb-glass-cta') || c.contains('wdb-progress') ||
        c.contains('wdb-hero-bg') || c.contains('wdb-marks') || el.tagName === 'IFRAME');
    };

    // Fresh snapshot each build
    Container.pageSnapshot = null;
    Container.isCapturing = false;
    Container.waitingForSnapshot = [];

    var next = new Container({ type: 'pill', tintOpacity: 0.12 });
    var el = next.element;
    el.className += ' wdb-glass-cta is-css';
    el.setAttribute('role', 'navigation');
    el.setAttribute('aria-label', 'Quick actions');
    // move the links and current visibility state over
    while (cta.firstChild) el.appendChild(cta.firstChild);
    cta.parentNode.replaceChild(el, cta);
    cta = el;
    if (gsap) gsap.set(el, { x: 0, xPercent: -50, y: shown ? 0 : 24, autoAlpha: shown ? 1 : 0 });
    else { el.style.visibility = shown ? 'visible' : 'hidden'; el.style.opacity = shown ? '1' : '0'; }
    if (glass && glass.element && glass.element.parentNode) glass.element.parentNode.removeChild(glass.element);
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
      if (++tries < 300) requestAnimationFrame(waitForGL); // ~5s, then keep the CSS glass
    })();
  }

  // Re-snapshot when the layout really changes (fonts, embeds, window width)
  var lastW = window.innerWidth;
  var lastH = doc.body.scrollHeight;
  var t;
  function maybeRebuild() {
    clearTimeout(t);
    t = setTimeout(function () {
      var w = window.innerWidth, h = doc.body.scrollHeight;
      if ((w !== lastW || Math.abs(h - lastH) > 60) && rebuilds < 4) {
        lastW = w; lastH = h; rebuilds++;
        buildGlass();
      }
    }, 900);
  }

  if (canUpgradeGlass()) {
    afterLoad(function () {
      setTimeout(function () {
        whenIdle(function () {
          loadScript('/assets/vendor/liquid-glass/html2canvas.min.js')
            .then(function () { return loadScript('/assets/vendor/liquid-glass/container.js'); })
            .then(function () { return loadScript('/assets/vendor/liquid-glass/button.js'); })
            .then(function () {
              lastW = window.innerWidth; lastH = doc.body.scrollHeight;
              buildGlass();
              window.addEventListener('resize', maybeRebuild);
              if ('ResizeObserver' in window) new ResizeObserver(maybeRebuild).observe(doc.body);
            })
            .catch(function () { /* CSS glass stays */ });
        }, 3000);
      }, 1200);
    });
  }

  /* -------------------------------------------------------------- *
   * 2. ShaderGradient hero + R3F marks
   * -------------------------------------------------------------- */
  if (!probe || reduce || saveData) return;

  afterLoad(function () {
    whenIdle(function () {
      loadScript('/assets/vendor/wdb-3d.js').then(function () {
        if (!window.WDB3D) return;
        var bg = doc.createElement('div');
        bg.className = 'wdb-hero-bg';
        bg.setAttribute('aria-hidden', 'true');
        hero.insertBefore(bg, hero.firstChild);
        window.WDB3D.mountHero(bg);

        var band = doc.querySelector('.steroid');
        if (band && window.innerWidth >= 900) {
          var marks = doc.createElement('div');
          marks.className = 'wdb-marks';
          marks.setAttribute('aria-hidden', 'true');
          band.insertBefore(marks, band.firstChild);
          window.WDB3D.mountMarks(marks);
        }
      }).catch(function () { /* static hero stays */ });
    }, 1500);
  });
})();
