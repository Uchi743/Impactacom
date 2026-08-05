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
  // (uniquement si GA est chargé : au 1er affichage loadGA() envoie lui-même le page_view)
  if (window.__gaLoaded && typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_title: document.title,
      page_location: location.href,
      page_path: location.pathname + location.search,
    });
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
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
  var form = e.target;
  var btn = form.querySelector('button[type="submit"]');
  var errEl = document.getElementById('contactError');
  if (errEl) errEl.style.display = 'none';
  var originalLabel = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
  // Validation : si l'action n'a pas été configurée, on bascule en mailto comme fallback
  if (form.action.indexOf('REMPLACER') !== -1) {
    var fd = new FormData(form);
    var body = '';
    fd.forEach(function(v, k) { if (k.charAt(0) !== '_') body += k + ' : ' + v + '\n'; });
    window.location.href = 'mailto:barois@impactacom.fr?subject=' + encodeURIComponent('Demande via impactacom.fr') + '&body=' + encodeURIComponent(body);
    if (btn) { btn.disabled = false; btn.textContent = originalLabel; }
    return;
  }
  fetch(form.action, {
    method: 'POST',
    body: new FormData(form),
    headers: { 'Accept': 'application/json' },
  }).then(function(r) {
    if (r.ok) {
      form.style.display = 'none';
      var s = document.getElementById('contactSuccess');
      if (s) s.classList.add('show');
      if (window.__gaLoaded && typeof gtag === 'function') gtag('event', 'contact_submit', { event_category: 'engagement' });
    } else {
      return r.json().then(function(d) {
        var msg = (d && d.errors && d.errors.length) ? d.errors.map(function(e){return e.message;}).join(', ') : "Erreur d'envoi. Réessayez ou contactez Corinne directement à barois@impactacom.fr.";
        if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
        if (btn) { btn.disabled = false; btn.textContent = originalLabel; }
      });
    }
  }).catch(function() {
    if (errEl) { errEl.textContent = "Erreur réseau. Réessayez ou contactez Corinne à barois@impactacom.fr."; errEl.style.display = 'block'; }
    if (btn) { btn.disabled = false; btn.textContent = originalLabel; }
  });
}
window.addEventListener('scroll', function() {
  var nav = document.getElementById('topnav');
  if (nav) nav.style.boxShadow = window.scrollY > 20 ? '0 2px 24px rgba(45,31,78,0.08)' : 'none';
});
// ====== COOKIE CONSENT (RGPD) ======
var GA_ID = 'G-E4RYFL7HVR';
function loadGA() {
  if (window.__gaLoaded) return;
  window.__gaLoaded = true;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  // Indispensable : sans la commande 'js', gtag.js s'initialise mais n'envoie aucun hit
  gtag('js', new Date());
  gtag('config', GA_ID, { send_page_view: false });
  // Fire initial page_view since main.js's showPage already ran
  gtag('event', 'page_view', {
    page_title: document.title,
    page_location: location.href,
    page_path: location.pathname + location.search,
  });
}
function setCookieConsent(status) {
  try { localStorage.setItem('impactacom_consent', status); localStorage.setItem('impactacom_consent_date', new Date().toISOString()); } catch(e) {}
  var b = document.getElementById('cookieBanner');
  if (b) b.hidden = true;
  if (status === 'accepted') {
    if (typeof gtag === 'function') {
      gtag('consent','update',{ ad_storage:'granted', analytics_storage:'granted' });
    }
    loadGA();
  }
}
function initCookieBanner() {
  var stored;
  try { stored = localStorage.getItem('impactacom_consent'); } catch(e) {}
  var banner = document.getElementById('cookieBanner');
  if (stored === 'accepted') {
    if (typeof gtag === 'function') gtag('consent','update',{ad_storage:'granted',analytics_storage:'granted'});
    loadGA();
    return;
  }
  if (stored === 'refused') {
    // gtag stays denied (default), no GA loaded
    return;
  }
  // No prior choice → show banner
  if (banner) banner.hidden = false;
}

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
  initCookieBanner();
});
