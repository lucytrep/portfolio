(function () {
  var header = document.getElementById('page-header');
  var hamburger = header && header.querySelector('.hamburger');
  if (header && hamburger) {
    hamburger.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      hamburger.setAttribute('aria-expanded', open);
    });
  }

  // Case study: highlight sidebar link for section in view
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
