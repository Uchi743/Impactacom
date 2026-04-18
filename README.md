# Impactacom

Site vitrine de **Corinne Barois** — coach en prise de parole en public.
🌐 https://impactacom.fr

## Stack

Site statique pur : HTML + CSS + JS vanilla. Aucun framework, aucun build.

## Développement local

Aucune installation nécessaire. Deux options :

```bash
# Option 1 : Python (préinstallé sur Mac/Linux)
python3 -m http.server 8000

# Option 2 : Node.js (si installé)
npx serve .
```

Puis ouvrir `http://localhost:8000`.

## Structure

```
.
├── index.html         # Toutes les pages (SPA)
├── css/style.css      # Styles
├── js/main.js         # Router + animations
├── assets/            # Images et médias
├── netlify.toml       # Config Netlify
├── CLAUDE.md          # Contexte pour Claude Code
└── README.md
```

## Déploiement

Déploiement automatique sur **Netlify** à chaque push.

## Édition avec Claude Code

Ce repo est configuré pour Claude Code. Depuis ce dossier :

```bash
claude
```

Claude Code lira automatiquement `CLAUDE.md` pour comprendre le contexte et les règles du projet.
