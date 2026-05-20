function updateSEO(name) {
  var data = (window.__seoData && window.__seoData[name]) || (window.__seoData && window.__seoData.home);
  if (!data) return;
  document.title = data.title;
  function setMeta(selector, attr, value) {
    var el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
    else {
      var parts = selector.match(/meta\[(name|property)="([^"]+)"\]/);
      if (parts) {
        var m = document.createElement('meta');
        m.setAttribute(parts[1], parts[2]);
        m.setAttribute(attr, value);
        document.head.appendChild(m);
      }
    }
  }
  setMeta('meta[name="description"]', 'content', data.description);
  setMeta('meta[property="og:title"]', 'content', data.title);
  setMeta('meta[property="og:description"]', 'content', data.description);
  setMeta('meta[property="og:url"]', 'content', data.canonical);
  setMeta('meta[property="og:image"]', 'content', location.origin + data.og_image);
  setMeta('meta[name="twitter:title"]', 'content', data.title);
  setMeta('meta[name="twitter:description"]', 'content', data.description);
  setMeta('meta[name="twitter:image"]', 'content', location.origin + data.og_image);
  var canon = document.querySelector('link[rel="canonical"]');
  if (canon) canon.setAttribute('href', data.canonical);
  else {
    var l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    l.setAttribute('href', data.canonical);
    document.head.appendChild(l);
  }
}

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
  updateSEO(name);
  // GA4 : envoyer un page_view manuel à chaque navigation SPA
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: location.href,
      page_path: location.pathname + location.search,
    });
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
  // Determine which page to show based on current URL
  var path = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
  var initial = path || 'home';
  if (document.getElementById('page-' + initial)) {
    showPage(initial, false);
  } else {
    try { history.replaceState({ page: 'home' }, '', '/'); } catch(e) {}
    updateSEO('home');
  }
  document.querySelectorAll('a[data-u][data-d]').forEach(function(a) {
    a.href = 'mailto:' + a.dataset.u + '\x40' + a.dataset.d;
  });
  initReveal();
});
