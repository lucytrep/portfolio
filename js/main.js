(function () {
  var header = document.getElementById('page-header');
  var hamburger = header && header.querySelector('.hamburger');
  if (!header || !hamburger) return;

  hamburger.addEventListener('click', function () {
    var open = header.classList.toggle('nav-open');
    hamburger.setAttribute('aria-expanded', open);
  });
})();
