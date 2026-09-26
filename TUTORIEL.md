# TUTORIEL — de zéro à ton premier jeu

Suis les étapes dans l'ordre. À la fin, l'IA écrit des scripts et construit ta place.

**Temps :** 10 minutes, dont 5 pour récupérer une clé gratuite.

> ### Comment ça marche, en une phrase
>
> XozAI est un **outil de construction**. Il travaille **dans Roblox Studio, à l'édition** :
> tu tapes ce que tu veux, il écrit les scripts et pose les objets dans ta place.
> Tu n'as **jamais** besoin de lancer le jeu pour que ça marche. Le mode Play (F5) sert
> uniquement si *toi* tu veux vérifier que le jeu tourne — il est optionnel.

---

## Étape 0 — Ce dont tu as besoin

- Roblox Studio installé
- Une clé API d'un fournisseur d'IA (étape 2, c'est gratuit)

Le plugin est **déjà installé** dans :

```
C:\Users\freee\AppData\Local\Roblox\Plugins\XozAI.rbxmx
```

---

## Étape 1 — Charger le plugin

Roblox ne charge les plugins locaux **qu'au démarrage**. Si Studio est déjà ouvert, il ne verra rien.

1. **Ferme Roblox Studio complètement.**
   Vérifie dans la barre des tâches (en bas à droite) qu'il ne reste **aucune** fenêtre Roblox ouverte.
   En cas de doute : `Ctrl + Maj + Échap` → chercher `RobloxStudioBeta.exe` → clic droit → Fin de tâche.

2. **Rouvre Roblox Studio** et ouvre n'importe quelle place.

3. Regarde la **barre d'outils** en haut. Un nouvel onglet ou bouton **XozAI** est apparu.
   S'il y a beaucoup d'onglets, cherche dans le menu déroulant **« Plugins »**.

4. **Clique sur XozAI.** Un panneau s'ouvre sur le côté droit de l'écran.

> **Ça n'apparaît pas ?** Ouvre la fenêtre **Affichage → Sortie** dans Studio. Si un message rouge
> mentionne XozAI, copie-le et envoie-le moi.

---

## Étape 2 — Récupérer une clé gratuite (5 minutes)

Ton URL `xgpt.pro` ne répond pas (domaine parqué), donc prends-en une qui marche. **Gemini** est le
plus simple : gratuit, sans carte bancaire.

1. Va sur **https://aistudio.google.com/apikey**
2. Connecte-toi avec ton compte Google
3. Clique sur **« Create API key »** (ou « Créer une clé API »)
4. **Copie la clé** (elle commence par `AIza...`)

> **Alternative : Groq** — https://console.groq.com/keys, très rapide aussi, palier gratuit.

---

## Étape 3 — Configurer le plugin

Dans le panneau XozAI :

1. Clique sur le bouton **Reglages** (en haut à droite du panneau).

2. Dans **« 1. Choisis ton fournisseur »**, clique sur la ligne **Gemini**.
   → Les champs *Base URL* et *Modele* se remplissent automatiquement. Ne les touche plus.

3. Dans le champ **Cle API**, colle ta clé Google (`AIza...`).
   Vérifie qu'il n'y a **aucun espace** avant ou après.

4. Clique sur **« Enregistrer les reglages »**.

---

## Étape 4 — Vérifier la connexion

Toujours dans Reglages, clique sur **« Tester la connexion »**.

- ✅ **« OK  Connexion reussie »** apparaît dans le chat → tu peux passer à l'étape 5.
- ❌ Un message rouge apparaît → lis le code :

| Message | Ce qu'il faut faire |
|---|---|
| `HTTP 401` | La clé est mauvaise ou mal copiée. Recopie-la. |
| `HTTP 400` | Le nom du modèle est faux. Clique sur **« Lister les modeles disponibles »** et copie un nom exact. |
| `HTTP 404` | La Base URL est fausse. Clique à nouveau sur le bouton **Gemini**. |
| `Connexion impossible` | Dans Studio : **Fichier → Paramètres du jeu → Sécurité → Autoriser les requêtes HTTP** activé. |

---

## Étape 5 — Générer ton premier jeu

1. Reviens sur l'onglet **chat** (bouton **Reglages** pour basculer).

2. Clique sur le bouton rapide **« Jeu complet »** juste au-dessus de la zone de saisie.
   Le prompt se remplit tout seul.

3. **Appuie sur Entrée.**

4. Attends. Compter de **20 secondes à 2 minutes** selon le modèle. Le statut en haut affiche
   « Reflexion en cours... ».

5. L'IA répond, puis le plugin **applique** ses actions. Tu vois défiler :

```
Execution de 4 action(s)...
[OK]    Cree : ServerScriptService.GameService (2841 caracteres)
[OK]    Cree : ReplicatedStorage.Remotes (2841 caracteres)
[OK]    Construit : Workspace.Arene (156 objets)
[OK]    Camera cadree sur Workspace.Arene
```

6. **Regarde ta place** : les scripts sont dans l'Explorateur, les objets dans la vue 3D.
   La caméra s'est déplacée sur ce qui vient d'être construit.

---

## Étape 6 — Corriger / améliorer

Tu n'as rien à lancer. Le jeu est déjà écrit : retourne dans ta place, clique sur les objets, ouvre
les scripts, continue à travailler dessus normalement.

Tu as deux armes pour ajuster :

- **`Ctrl + Z` dans Studio** → annule *tout* ce que le plugin vient de faire d'un seul coup.
- **Écris-le dans le chat** : « le portail ne téléporte pas, corrige-le ». L'IA voit l'état actuel de
  ta place et renvoie une version corrigée.

---

## Commandes utiles du chat

| Commande | Effet |
|---|---|
| `/help` | liste des commandes |
| `/model nom-du-modele` | change de modèle |
| `/test` | retest la connexion |
| `/tree` | montre ce que l'IA voit de ta place |
| `/undo` | annule la dernière action |
| `/clear` | efface la conversation |

---

## Exemples de prompts qui marchent bien

```
Fais-moi un obby de 20 étapes avec un timer et un leaderboard
```
```
Crée une boutique : le joueur gagne des cash en ramassant des pièces,
et peut acheter 3 améliorations. Avec sauvegarde.
```
```
Construis un village médiéval avec une place centrale et de l'éclairage
```
```
Mon script de double saut ne marche pas, regarde et corrige-le
```

---

## Erreurs fréquentes

**« L'IA répond en texte mais rien ne se crée »**
Le modèle n'a pas respecté le format d'action. Mauvais modèle. Prends-en un plus récent :
`gemini-2.5-flash`, `gpt-4o`, ou `deepseek-chat`.

**« Rien ne se passe quand j'appuie sur Entrée »**
Clique d'abord **dans** la zone de saisie pour y placer le curseur.

**« Le panneau a disparu »**
Clique à nouveau sur le bouton **XozAI** dans la barre d'outils.

**« Un script créé ne s'exécute pas »**
Normal à l'édition : dans Studio, un script ne tourne pas tant que tu ne lances pas la simulation.
Ça n'a aucun impact sur le travail du plugin. Vérifie juste que l'IA l'a placé au bon endroit —
un `Script` va dans `ServerScriptService`, un `LocalScript` dans `StarterPlayerScripts`.
Le plugin te prévient d'ailleurs dans son rapport si le placement est suspect.

**« Où est le jeu que je viens de demander ? »**
Dans ta place, directement : les scripts sont dans l'**Explorateur** (à droite), les objets dans la
**vue 3D** au centre. La caméra se déplace automatiquement sur ce qui vient d'être construit.

---

## Après avoir modifié le plugin

Si tu changes le code source ou ta configuration (`config.local.json`), réinstalle :

```bash
node build.mjs && node install.mjs --personal
```

Puis **ferme et rouvre Studio**. C'est obligatoire à chaque fois.

---

## Attention sécurité

Ta clé API est enregistrée **sur ta machine**. Ne la partage jamais et ne la mets jamais sur GitHub :
elle serait détectée par des robots en quelques minutes.

Si tu veux distribuer le plugin, distribue `dist/XozAI.rbxmx` (sans clé), **jamais**
`dist/private/XozAI-personnel.rbxmx`.
