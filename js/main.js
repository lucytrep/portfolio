(function () {
  document.body.classList.add('has-custom-cursor');

  // Remember per-page scroll position and restore it on return.
  (function () {
    if (!window.sessionStorage) return;
    var key = 'scroll:' + window.location.pathname;

    function saveScroll() {
      try {
        window.sessionStorage.setItem(key, String(window.scrollY || 0));
      } catch (e) {}
    }

    // Restore only when there is no hash target in the URL.
    if (!window.location.hash) {
      var saved = window.sessionStorage.getItem(key);
      if (saved !== null) {
        var y = parseInt(saved, 10);
        if (!isNaN(y) && y > 0) {
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
              window.scrollTo(0, y);
            });
          });
        }
      }
    }

    window.addEventListener('scroll', saveScroll, { passive: true });
    window.addEventListener('pagehide', saveScroll);
    window.addEventListener('beforeunload', saveScroll);
  })();

  var header = document.getElementById('page-header');
  var hamburger = header && header.querySelector('.hamburger');
  if (header && hamburger) {
    hamburger.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  // Header: fade background + border when scrolled, restore at top
  (function () {
    if (!header) return;
    function updateHeader() {
      header.classList.toggle('header-scrolled', window.scrollY > 4);
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  })();

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

  // Scroll reveal
  (function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.IntersectionObserver) return;

    var targets = document.querySelectorAll(
      '.project-card, .case-section, .about-row, .about-image-wide, .about-image-pair'
    );
    if (!targets.length) return;

    targets.forEach(function (el) {
      el.classList.add('reveal-hidden');
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08 }
    );

    targets.forEach(function (el) {
      observer.observe(el);
    });
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

  // Carousels
  (function () {
    var carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach(function (carousel) {
      var track = carousel.querySelector('.case-carousel-track');
      var slides = carousel.querySelectorAll('.case-carousel-slide');
      var prevBtn = carousel.querySelector('.case-carousel-prev');
      var nextBtn = carousel.querySelector('.case-carousel-next');
      if (!track || !slides.length) return;

      var current = 0;

      function update() {
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        if (prevBtn) prevBtn.disabled = current === 0;
        if (nextBtn) nextBtn.disabled = current === slides.length - 1;
      }

      if (prevBtn) prevBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (current > 0) { current--; update(); }
      });
      if (nextBtn) nextBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        if (current < slides.length - 1) { current++; update(); }
      });

      update();
    });
  })();

  // Lightbox: click any content image or video to enlarge; arrow-navigate between all media
  (function () {
    // Collect images and videos in main content; skip home-page project-link thumbnails and hero videos
    var mediaEls = Array.from(
      document.querySelectorAll('main img, article img, main video, article video')
    ).filter(function (el) {
      return !el.closest('.project-link') && !el.closest('.case-hero-image');
    });
    if (!mediaEls.length) return;

    var current = 0;

    // Build overlay DOM
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Media viewer');

    var lbImg = document.createElement('img');
    lbImg.className = 'lightbox-img';
    lbImg.alt = '';

    var lbVideo = document.createElement('video');
    lbVideo.className = 'lightbox-video';
    lbVideo.setAttribute('playsinline', '');
    lbVideo.muted = true;
    lbVideo.loop = true;
    lbVideo.autoplay = true;
    lbVideo.controls = true;

    var closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>';

    var prevBtn = document.createElement('button');
    prevBtn.className = 'lightbox-prev';
    prevBtn.setAttribute('aria-label', 'Previous');
    prevBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polyline points="11,3 5,9 11,15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var nextBtn = document.createElement('button');
    nextBtn.className = 'lightbox-next';
    nextBtn.setAttribute('aria-label', 'Next');
    nextBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><polyline points="7,3 13,9 7,15" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    overlay.appendChild(lbImg);
    overlay.appendChild(lbVideo);
    overlay.appendChild(closeBtn);
    overlay.appendChild(prevBtn);
    overlay.appendChild(nextBtn);
    document.body.appendChild(overlay);

    function show(index) {
      current = ((index % mediaEls.length) + mediaEls.length) % mediaEls.length;
      var el = mediaEls[current];
      var isVideo = el.tagName === 'VIDEO';

      lbImg.style.display = isVideo ? 'none' : '';
      lbVideo.style.display = isVideo ? '' : 'none';

      if (isVideo) {
        var src = el.getAttribute('src') || el.currentSrc || '';
        lbVideo.src = src;
        lbVideo.load();
        lbVideo.play().catch(function () {});
      } else {
        lbImg.src = el.currentSrc || el.src || el.getAttribute('src') || '';
        lbImg.alt = el.alt || '';
      }

      var single = mediaEls.length <= 1;
      prevBtn.style.visibility = single ? 'hidden' : '';
      nextBtn.style.visibility = single ? 'hidden' : '';
    }

    function open(index) {
      show(index);
      var sbw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (sbw) document.body.style.paddingRight = sbw + 'px';
      overlay.classList.add('is-open');
    }

    function close() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      lbVideo.pause();
      lbVideo.removeAttribute('src');
    }

    // Mark elements and attach click listeners
    mediaEls.forEach(function (el, i) {
      el.classList.add('lightbox-target');
      el.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        open(i);
      }, true); // capture phase so it fires before any parent link navigation
    });

    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
    nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });

    document.addEventListener('keydown', function (e) {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  })();

  // Journey section slideshows — start rotating when scrolled into view
  (function () {
    var slideshows = document.querySelectorAll('[data-slideshow]');
    if (!slideshows.length) return;

    slideshows.forEach(function (container) {
      var slides = container.querySelectorAll('.journey-slide');
      if (slides.length < 2) return;

      var current = 0;
      var timer = null;

      function advance() {
        slides[current].classList.remove('journey-slide--active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('journey-slide--active');
      }

      function start() {
        if (timer) return;
        timer = setInterval(advance, 2500);
      }

      function stop() {
        clearInterval(timer);
        timer = null;
      }

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            start();
          } else {
            stop();
          }
        });
      }, { threshold: 0.2 });

      observer.observe(container);
    });
  })();

})();
