// Cloudflare Pages Function — injection SEO côté serveur.
//
// Pourquoi : le site est une SPA. Toutes les routes servent le même index.html,
// dont le <head> statique porte le titre/description/canonical/OG de l'ACCUEIL.
// Le JS (updateSEO dans main.js) corrige ces balises par route, mais seulement
// dans le navigateur. Or :
//   - Googlebot rend le JS mais de façon différée et faillible ;
//   - Bing et la plupart des crawlers sociaux (LinkedIn, WhatsApp, Facebook…)
//     ne l'exécutent pas du tout et voient donc les balises de l'accueil sur
//     chaque URL → titres/descriptions/images dupliqués, mauvais SEO + partages.
//
// Ce middleware fait, AU NIVEAU DU SERVEUR, exactement ce que updateSEO fait
// côté client, en lisant la MÊME source (js/seo-data.js). Une seule source de
// vérité : ajouter/modifier un article dans seo-data.js suffit, ici rien à
// toucher. Chaque route sort du serveur avec ses vraies balises, JS ou pas.

const SITE = "https://impactacom.fr";

// Cache du dico SEO à l'échelle de l'isolate (réutilisé entre requêtes chaudes).
let seoCache = null;

async function loadSeo(context, request) {
  if (seoCache) return seoCache;
  const res = await context.env.ASSETS.fetch(
    new URL("/js/seo-data.js", request.url).toString()
  );
  const text = await res.text();
  // seo-data.js = `window.__seoData = { ...JSON... };` → on isole l'objet.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  seoCache = JSON.parse(text.slice(start, end + 1));
  return seoCache;
}

// Valeur sûre pour un attribut HTML délimité par des guillemets doubles.
function attr(value) {
  return value
    .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

// Valeur sûre à l'intérieur d'une balise <title>…</title>.
function text(value) {
  return value
    .replace(/&(?!(amp|lt|gt|quot|#\d+);)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Remplace le contenu d'une balise meta existante (property=… ou name=…).
function setMeta(html, kind, key, value) {
  const re = new RegExp(`(<meta ${kind}="${key}" content=")[^"]*(">)`);
  return html.replace(re, `$1${attr(value)}$2`);
}

export async function onRequest(context) {
  const { request, next } = context;
  const res = await next();

  // On ne touche que les documents HTML servis normalement — jamais les assets,
  // ni les redirections de _redirects (301) qui doivent passer telles quelles.
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html") || res.status !== 200) return res;

  const url = new URL(request.url);
  const slug = decodeURIComponent(url.pathname.replace(/^\/+|\/+$/g, "")) || "home";

  let data;
  try {
    const seo = await loadSeo(context, request);
    data = seo[slug];
  } catch (e) {
    return res; // en cas de souci, on sert le HTML tel quel (jamais d'erreur 500).
  }

  // Route inconnue → vrai 404.
  //
  // Le fallback SPA de _redirects (`/* /index.html 200`) sert index.html en HTTP 200
  // pour N'IMPORTE QUELLE URL : /wp-admin, /?p=12345, un vieux lien WordPress, une
  // typo… Chacune devient donc une page indexable de ~490 Ko au contenu identique.
  // C'est ce qui alimente les "pages en double" et les "explorées, non indexées"
  // dans la Search Console. On renvoie un statut 404 + noindex : le corps reste
  // servi (le routeur client bascule sur l'accueil), mais Google ne l'indexe plus.
  //
  // Sûr par construction : seo-data.js couvre les 34 routes réelles du site
  // (34 entrées = 34 blocs .page = 34 URLs du sitemap, vérifié). Toute route
  // légitime ajoutée à seo-data.js continue de répondre 200.
  if (!data) {
    const body = (await res.text()).replace(
      /<\/head>/i,
      '<meta name="robots" content="noindex,follow">\n</head>'
    );
    const h404 = new Headers(res.headers);
    h404.delete("content-length");
    return new Response(body, { status: 404, statusText: "Not Found", headers: h404 });
  }

  let html = await res.text();

  const image = data.og_image
    ? (data.og_image.startsWith("http") ? data.og_image : SITE + data.og_image)
    : SITE + "/assets/img/og-default.jpg";
  const isArticle = (data.og_image || "").includes("/blog/");

  html = setMeta(html, "name", "description", data.description);
  html = setMeta(html, "property", "og:type", isArticle ? "article" : "website");
  html = setMeta(html, "property", "og:title", data.title);
  html = setMeta(html, "property", "og:description", data.description);
  html = setMeta(html, "property", "og:url", data.canonical);
  html = setMeta(html, "property", "og:image", image);
  html = setMeta(html, "name", "twitter:title", data.title);
  html = setMeta(html, "name", "twitter:description", data.description);
  html = setMeta(html, "name", "twitter:image", image);
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(">)/,
    `$1${attr(data.canonical)}$2`
  );
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${text(data.title)}</title>`);

  const headers = new Headers(res.headers);
  headers.delete("content-length");
  return new Response(html, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}
