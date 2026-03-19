(function () {
  document.body.classList.add('has-custom-cursor');

  var header = document.getElementById('page-header');
  var hamburger = header && header.querySelector('.hamburger');
  if (header && hamburger) {
    hamburger.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  // Cursor pill: expand on project hover
  (function () {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

    var pill = document.createElement('div');
    pill.className = 'cursor-pill';
    pill.setAttribute('aria-hidden', 'true');
    pill.innerHTML = '<span class="cursor-pill__label">VIEW CASE STUDY</span>';
    document.body.appendChild(pill);
    var label = pill.querySelector('.cursor-pill__label');

    var active = true; // cursor dot is always on; "is-active" means expanded case study pill
    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;
    var raf = null;
    var lastTs = 0;
    var dotSize = 21;
    var isExpanded = false;

    function readDotSize() {
      var v = window.getComputedStyle(pill).getPropertyValue('--cursor-dot-size');
      var n = parseFloat(v);
      if (!isNaN(n) && n > 0) dotSize = n;
    }

    function animate(ts) {
      if (!lastTs) lastTs = ts;
      var dt = Math.min(48, ts - lastTs);
      lastTs = ts;

      // Time-based smoothing (feels consistent at different frame rates)
      // Higher "follow" -> snappier; lower -> floatier
      var follow = 0.001;
      var a = 1 - Math.pow(follow, dt);

      currentX += (targetX - currentX) * a;
      currentY += (targetY - currentY) * a;
      pill.style.transform = 'translate3d(' + currentX + 'px,' + currentY + 'px,0)';
      raf = window.requestAnimationFrame(animate);
    }

    function onMove(e) {
      // Anchor pill left edge at cursor, vertically centered
      targetX = e.clientX;
      targetY = e.clientY - dotSize / 2;
      if (!raf) raf = window.requestAnimationFrame(animate);
      if (!pill.classList.contains('is-visible')) pill.classList.add('is-visible');
    }

    function setExpanded(next) {
      if (isExpanded === next) return;

      if (next) {
        // Keep the pill snug to the label text
        var paddingX = 15; // px
        pill.style.setProperty('--cursor-pill-padding-x', paddingX + 'px');
        if (label) {
          var labelWidth = label.scrollWidth || 0;
          var expandedWidth = Math.max(dotSize, labelWidth + paddingX * 2);
          pill.style.setProperty('--cursor-pill-expanded-width', expandedWidth + 'px');
        }
      }

      isExpanded = next;
      pill.classList.toggle('is-active', isExpanded);
      pill.classList.remove('is-faded');
    }

    // Home page only: project grid links control the expanded state
    var hoverTargets = document.querySelectorAll('.section-projects a.project-link');
    if (hoverTargets && hoverTargets.length) {
      hoverTargets.forEach(function (el) {
        el.addEventListener('mouseenter', function () {
          setExpanded(true);
        });
        el.addEventListener('mouseleave', function () {
          setExpanded(false);
        });
      });
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('blur', function () {
      setExpanded(false);
      pill.classList.remove('is-visible');
      if (raf) window.cancelAnimationFrame(raf);
      raf = null;
      lastTs = 0;
    });

    // Start hidden until first move
    pill.classList.remove('is-visible');
    readDotSize();
  })();

  // Cursor dot: fade on interactive hover (except home project case studies)
  (function () {
    function isProjectCaseStudyTarget(el) {
      if (!el) return false;
      return !!el.closest('.section-projects a.project-link');
    }

    function isInteractiveTarget(el) {
      if (!el) return false;
      return !!el.closest(
        'a,button,label[for],summary,[role="button"],input:not([type="hidden"]),select,textarea'
      );
    }

    function setFaded(on) {
      var cursorEl = document.querySelector('.cursor-pill');
      if (!cursorEl) return;
      if (cursorEl.classList.contains('is-active')) return; // don't fade expanded pill
      cursorEl.classList.toggle('is-faded', on);
    }

    document.addEventListener(
      'mouseover',
      function (e) {
        var t = e.target;
        if (!t) return;
        if (isProjectCaseStudyTarget(t)) {
          setFaded(false);
          return;
        }
        setFaded(isInteractiveTarget(t));
      },
      { passive: true, capture: true }
    );

    document.addEventListener(
      'mouseout',
      function (e) {
        var to = e.relatedTarget;
        if (to && isInteractiveTarget(to) && !isProjectCaseStudyTarget(to)) return;
        setFaded(false);
      },
      { passive: true, capture: true }
    );
  })();

  // Case study: highlight sidebar link for section in view
  (function () {
    var toc = document.querySelector('.case-toc');
    if (!toc) return;
    var links = toc.querySelectorAll('a[href^="#"]');
    var sections = [];
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = id && document.getElementById(id);
      if (el) sections.push({ id: id, link: a, el: el });
    });
    if (!sections.length) return;

    function setActive() {
      var top = window.scrollY + 120;
      var active = null;
      for (var i = sections.length - 1; i >= 0; i--) {
        var r = sections[i].el.getBoundingClientRect();
        var elTop = r.top + window.scrollY;
        if (elTop <= top) {
          active = sections[i];
          break;
        }
      }
      if (!active && sections[0]) active = sections[0];
      sections.forEach(function (s) {
        s.link.classList.toggle('is-active', s === active);
      });
    }

    var observer = new IntersectionObserver(
      function () {
        setActive();
      },
      { root: null, rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );
    sections.forEach(function (s) {
      observer.observe(s.el);
    });
    setActive();
    window.addEventListener('scroll', setActive, { passive: true });
  })();
})();
