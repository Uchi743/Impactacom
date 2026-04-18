function showPage(name, pushState) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var el = document.getElementById('page-' + name);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(function(a) { a.classList.remove('active'); });
  var navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');
  var formPages = ['formation-training','formation-individuel','formation-collective','formation-custom'];
  if (formPages.indexOf(name) > -1) {
    var p = document.getElementById('nav-programmes');
    if (p) p.classList.add('active');
  }
  // Ajouter à l'historique du navigateur (sauf si appelé depuis popstate)
  if (pushState !== false) {
    try {
      var url = name === 'home' ? '/' : '/' + name;
      history.pushState({ page: name }, '', url);
    } catch(e) {}
  }
  window.scrollTo(0, 0);
  initReveal();
}

// Gérer le bouton retour/avant du navigateur
window.addEventListener('popstate', function(e) {
  var page = (e.state && e.state.page) ? e.state.page : 'home';
  showPage(page, false);
});
function toggleMenu() {
  document.getElementById('mobileMenu').classList.toggle('open');
}
function initReveal() {
  var els = document.querySelectorAll('.page.active [data-r]:not(.vis)');
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e, i) {
      if (e.isIntersecting) {
        setTimeout(function() { e.target.classList.add('vis'); }, i * 60);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
  els.forEach(function(el) { io.observe(el); });
}
function playVideo(containerId, videoId) {
  var c = document.getElementById(containerId);
  c.innerHTML = '<iframe class="vcard-iframe" src="https://www.youtube.com/embed/' + videoId + '?autoplay=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
}
function submitForm(e) {
  e.preventDefault();
  document.getElementById('contactForm').style.display = 'none';
  document.getElementById('contactSuccess').classList.add('show');
}
window.addEventListener('scroll', function() {
  var nav = document.getElementById('topnav');
  if (nav) nav.style.boxShadow = window.scrollY > 20 ? '0 2px 24px rgba(45,31,78,0.08)' : 'none';
});
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser l'état de la page d'accueil dans l'historique
  try { history.replaceState({ page: 'home' }, '', '/'); } catch(e) {}
  initReveal();
});
