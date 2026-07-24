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

  // On ne touche que les documents HTML (pas les assets, images, JS…).
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return res;

  const url = new URL(request.url);
  const slug = decodeURIComponent(url.pathname.replace(/^\/+|\/+$/g, "")) || "home";

  let data;
  try {
    const seo = await loadSeo(context, request);
    data = seo[slug];
  } catch (e) {
    return res; // en cas de souci, on sert le HTML tel quel (jamais d'erreur 500).
  }

  // Route inconnue (ex. 404 SPA) → on laisse les balises par défaut de l'accueil.
  if (!data) return res;

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
