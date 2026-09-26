# XozAI — assistant IA pour Roblox Studio

> **Décris ton jeu. Il se construit pendant que tu parles.**

[![CI](https://github.com/TON-PSEUDO/XozAI/actions/workflows/ci.yml/badge.svg)](https://github.com/TON-PSEUDO/XozAI/actions/workflows/ci.yml)
![Licence](https://img.shields.io/badge/licence-MIT-7C5CFF)
![Roblox Studio](https://img.shields.io/badge/Roblox-Studio-00A2FF)
![Langue](https://img.shields.io/badge/interface-français-22D3EE)

XozAI ajoute un **chat IA dans Roblox Studio**. Tu décris ce que tu veux, l'IA **agit pour de vrai**
dans ta place : elle écrit des scripts Luau complets, construit des bâtiments en 3D, crée des interfaces,
corrige du code, range le tout dans des `Model` propres et cadre la caméra sur ce qu'elle vient de faire.

Ce n'est pas un chatbot qui te rend du code à copier-coller : ses blocs d'action sont **exécutés**.

<p align="center">
  <a href="https://TON-PSEUDO.github.io/XozAI/"><strong>→ Voir le site et télécharger le plugin</strong></a>
</p>

---

## Installation en 2 minutes

### 1. Récupère le plugin

Télécharge **[`dist/XozAI.rbxmx`](dist/XozAI.rbxmx)** — un seul fichier, le plugin complet.

### 2. Dépose-le dans Roblox Studio

**Méthode A — le dossier Plugins (recommandée, installation permanente)**

1. `Windows + R` → colle `%LOCALAPPDATA%\Roblox\Plugins` → valide
   *(macOS : `~/Documents/Roblox/Plugins`)*
2. Copie `XozAI.rbxmx` dedans
3. Relance Studio → un bouton **XozAI** apparaît dans la barre d'outils

**Méthode B — depuis Studio**

1. Glisse `XozAI.rbxmx` dans la vue 3D → un `Script` nommé `XozAI` apparaît dans `Workspace`
2. Clic droit dessus → **Save as Local Plugin**
3. Supprime le Script de `Workspace`, puis redémarre Studio

> `dist/XozAI.luau` contient le même plugin en un seul fichier, si tu préfères le coller dans un
> `Script` et faire *Save as Local Plugin*.

### 3. Branche une IA

Dans l'onglet **Reglages** du plugin : clique sur un fournisseur dans la liste, colle ta **clé API**,
clique sur **Tester la connexion**. C'est tout.

| Fournisseur | Base URL | Modèle conseillé | Coût |
|---|---|---|---|
| **Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash` | palier gratuit |
| **Groq** | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | palier gratuit |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-chat` | très bon marché |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4` | payant |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o` | payant |
| **Ollama** (local) | `http://localhost:11434/v1` | `qwen2.5-coder:14b` | gratuit, chez toi |

Tout service qui parle le format **OpenAI chat completions** fonctionne. Si tu ne connais pas le nom
exact du modèle, clique sur **Lister les modeles disponibles** : le plugin interroge `/v1/models` et
affiche la liste réelle.

---

## Ce que l'IA sait faire

| Action | Résultat |
|---|---|
| **Créer un script** | `Script`, `LocalScript` ou `ModuleScript`, placé au bon endroit, code Luau complet |
| **Modifier un script** | remplace le contenu d'un script existant |
| **Construire** | Parts, Models, Folders, lumières, spawns… alignés, ancrés et nommés |
| **Piloter Studio** | sélectionner, supprimer, renommer, dupliquer, changer des propriétés, cadrer la caméra |

À chaque message, l'IA reçoit **l'arborescence réelle de ta place** et ta sélection courante : elle ne
travaille pas à l'aveugle. Toutes ses modifications sont regroupées en **une seule étape d'historique** :
un `Ctrl+Z` annule tout.

### Commandes du chat

| Commande | Effet |
|---|---|
| `/help` | liste des commandes |
| `/key sk-...` | enregistre ta clé API |
| `/model nom-du-modele` | change de modèle |
| `/test` | teste la connexion |
| `/tree` | montre l'arborescence envoyée à l'IA |
| `/undo` | annule la dernière action |
| `/clear` | efface la conversation |
| `/reset` | remet les réglages par défaut |

---

## Sécurité — à lire avant de partager

**Ta clé API est le seul secret du projet. Ne la commite jamais.**

- La clé est stockée dans les réglages locaux de Studio, **sur ta machine uniquement**.
- Les requêtes partent **directement de Studio vers ton fournisseur** : aucun serveur intermédiaire.
- Ce dépôt contient un contrôle automatique (`scripts/check-secrets.mjs`) qui **refuse** les clés
  OpenAI, Anthropic, Google, GitHub, Groq, OpenRouter et HuggingFace. Il tourne en CI à chaque push.
- Pour t'installer avec ta clé déjà remplie sans la publier, utilise le **build personnel** :

```bash
cp config.example.json config.local.json   # puis mets ta clé dedans
node build.mjs                             # -> dist/private/XozAI-personnel.rbxmx
```

`config.local.json` et `dist/private/` sont dans `.gitignore`. **Ne les publie jamais.**

---

## Développement

```bash
node build.mjs              # régénère dist/ et docs/download/
npm run check               # syntaxe + formatage Luau (stylua)
npm run check:secrets       # vérifie qu'aucune clé ne traîne
```

`build.mjs` n'a **aucune dépendance** : Node suffit. En plus de générer les fichiers, il lance
deux auto-tests et **échoue** si :

- le code stocké dans le `.rbxmx` ne survit pas à l'aller-retour XML (échappement de `<`, `>` et `&`) ;
- un artefact public contient une clé d'API.

### Structure

```
src/
  init.server.luau         script principal du plugin
  modules/
    Util.luau              chemins Roblox, snapshot de la place, caméra, couleurs
    Config.luau            réglages persistants, presets de fournisseurs, point d'injection
    Prompt.luau            prompt système + protocole d'action  <- le « cerveau »
    Http.luau              client API compatible OpenAI
    Builder.luau           spec JSON -> instances Roblox
    Actions.luau           parseur des blocs + exécution (avec undo)
    UI.luau                interface : chat, réglages, rendu du code
build.mjs                  génère dist/XozAI.rbxmx et dist/XozAI.luau
docs/                      le site (GitHub Pages)
scripts/                   contrôles (secrets, liens du dépôt)
```

### Publier ton propre dépôt

1. Crée un dépôt vide sur GitHub, puis :

   ```bash
   git init
   git add .
   git commit -m "XozAI : plugin IA pour Roblox Studio"
   git branch -M main
   git remote add origin https://github.com/TON-PSEUDO/XozAI.git
   git push -u origin main
   ```

2. Remplis les liens automatiquement :

   ```bash
   node scripts/set-repo.mjs TON-PSEUDO/XozAI
   ```

3. Active le site : **Settings → Pages → Source : Deploy from a branch → Branch : `main`, dossier `/docs`**.

Le site sera en ligne sur `https://TON-PSEUDO.github.io/XozAI/`.

---

## Pourquoi les blocs d'action plutôt que le *function calling* ?

Les blocs ```lua / ```build / ```actions ont été choisis **exprès**. La plupart des relais
« compatibles OpenAI » gèrent mal, voire pas du tout, le *function calling* natif. Un protocole à base
de blocs de code fonctionne avec **n'importe quel** endpoint, et les modèles sont massivement entraînés
sur ce format — donc ils le respectent mieux.

Le prompt système impose en plus les bonnes pratiques Roblox : séparation client/serveur, validation
côté serveur (anti-exploit), `DataStore` dans un `pcall`, APIs non dépréciées, géométrie cohérente,
respect des limites de saut d'un obby. Tu peux ajouter tes propres consignes dans les réglages.

---

## Dépannage express

| Symptôme | Cause |
|---|---|
| `HTTP 404` | Base URL fausse — elle doit finir par `/v1` (adresse de l'API, pas du site vitrine) |
| `HTTP 401` | clé API invalide ou révoquée |
| `HTTP 400` | le nom du modèle n'existe pas chez ce fournisseur |
| `HTTP 429` | quota atteint, attends un peu |
| `Connexion impossible` | active *Fichier → Paramètres du jeu → Sécurité → Autoriser les requêtes HTTP* |
| L'IA répond mais ne crée rien | le modèle ne suit pas le protocole — prends un modèle de code récent |

Le plugin affiche les erreurs telles quelles sous chaque réponse, avec leur code HTTP.

> **Vérifier qu'une URL est bien une API :**
> `curl https://TON-ENDPOINT/v1/models -H "Authorization: Bearer TA-CLE"`
> Si tu obtiens du HTML, une erreur 404, ou « ce domaine est à vendre », c'est le site web et non l'API.

---

## Limites (dit franchement)

- Le plugin **branche** une IA, il n'en fabrique pas une. La qualité du résultat dépend du modèle choisi.
- Pas d'import de **meshes, textures, sons ou animations** : ces assets viennent du catalogue Roblox.
  L'IA travaille avec des primitives et du code.
- Elle n'exécute pas les scripts qu'elle écrit : tu les testes en mode **Play**.
- C'est un outil de développement, pas un générateur de jeu clé en main. Tu gardes la direction créative
  et tu testes ce qui est produit.

---

## Licence

MIT — voir [LICENSE](LICENSE). Utilise-le, modifie-le, distribue-le.
