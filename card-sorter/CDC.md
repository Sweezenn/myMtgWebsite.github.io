---
status: draft
tags: [MTG, cube, cahier-des-charges, specifications]
---

# 📋 Cahier des Charges — MTG Cube Card Sorter

**Version :** 0.1 (draft)
**Date :** 2026-08-13
**Auteur :** hbelcour

---

## 1. Contexte & Objectif

Dans le cadre de la construction d'un **cube Magic: The Gathering**, il est nécessaire d'analyser et de classer des centaines de cartes selon plusieurs critères qualitatifs. Ce travail est chronophage, peut impliquer plusieurs personnes et nécessite une sauvegarde fiable de l'avancement.

**L'outil doit :**
- Permettre un tri rapide, ergonomique, sans friction technique
- Fonctionner entièrement en local (aucun serveur, aucun compte)
- Être partageable et reprendre facilement là où on s'était arrêté

---

## 2. Acteurs

| Acteur      | Rôle                                                              |
|-------------|-------------------------------------------------------------------|
| Trieur      | Utilise l'app pour classer les cartes, navigue et attribue des tags |
| Collaborateur | Reçoit un export JSON, complète le tri sur sa machine, renvoie le fichier |

---

## 3. Périmètre fonctionnel

### 3.1 Import de cartes

| ID    | Fonctionnalité                                                                 | Priorité |
|-------|--------------------------------------------------------------------------------|----------|
| F-01  | Importer un lot d'images (JPG, PNG, WEBP) via sélection multi-fichiers        | MUST     |
| F-02  | Importer un dossier entier de cartes via drag & drop                          | SHOULD   |
| F-03  | Importer une session existante (fichier `.json`) pour reprendre le tri        | MUST     |
| F-04  | Fusionner une session importée avec la session courante (union des cartes)    | COULD    |
| F-05  | Détection des doublons lors de la fusion (même nom de fichier)                | SHOULD   |
| F-06  | Embarquer les images en base64 dans le JSON (mode "autoportant")              | COULD    |

### 3.2 Visualisation & Navigation

| ID    | Fonctionnalité                                                                 | Priorité |
|-------|--------------------------------------------------------------------------------|----------|
| F-10  | Vue galerie : grille de toutes les cartes avec indicateur de statut (triée/non triée) | MUST |
| F-11  | Vue tri (focus) : affiche une seule carte en grand pour l'analyse             | MUST     |
| F-12  | Navigation carte suivante / précédente (clavier et clic)                     | MUST     |
| F-13  | Indicateur de progression : X cartes triées / Y total                         | MUST     |
| F-14  | Filtrer la galerie par dimension / tag / statut (triée ou non)                | SHOULD   |
| F-15  | Barre de recherche par nom de carte                                            | COULD    |
| F-16  | Mode "revue rapide" : sauter automatiquement aux cartes non encore triées     | SHOULD   |
| F-17  | Zoom sur l'image de la carte                                                   | COULD    |

### 3.3 Classification

| ID    | Fonctionnalité                                                                 | Priorité |
|-------|--------------------------------------------------------------------------------|----------|
| F-20  | Attribuer un tag sur la dimension **Accessibilité** (choix unique)            | MUST     |
| F-21  | Attribuer un ou plusieurs tags sur la dimension **Flavor/Cohérence** (multi-sélection) | MUST |
| F-22  | Raccourcis clavier pour chaque tag (définis dans la config)                   | MUST     |
| F-23  | Feedback visuel immédiat lors du taggage (surbrillance, couleur)              | MUST     |
| F-24  | Ajouter une note texte libre par carte                                         | SHOULD   |
| F-25  | Marquer une carte comme "à revoir" (flag)                                     | SHOULD   |
| F-26  | Effacer tous les tags d'une carte (reset)                                     | MUST     |
| F-27  | Éditer les dimensions et options depuis l'interface (ajouter/renommer/supprimer) | MUST |
| F-28  | Choisir le type de réponse d'une dimension : choix unique, multi-tags, échelle, oui/non ou texte libre | MUST |
| F-29  | Définir si une dimension est obligatoire ou facultative et afficher l'avancement par dimension | SHOULD |

#### Détail des dimensions par défaut

**Dimension 1 — Accessibilité** *(choix unique)*

| Tag           | Description                                   | Raccourci |
|---------------|-----------------------------------------------|-----------|
| Accessible    | Carte lisible et intuitive pour tout joueur   | `1`       |
| Intermédiaire | Nécessite une connaissance modérée de MTG     | `2`       |
| Difficile     | Carte complexe, réservée aux joueurs expérimentés | `3`   |

**Dimension 2 — Flavor & Cohérence** *(multi-tags)*

| Tag                   | Description                                                   | Raccourci |
|-----------------------|---------------------------------------------------------------|-----------|
| Color Pie ✓           | La carte est cohérente avec sa couleur dans MTG               | `a`       |
| Pb. Color Pie         | Mécaniques incohérentes avec la couleur de la carte           | `z`       |
| Illustration cohérente | L'illustration correspond bien au nom et aux effets          | `e`       |
| Illustration incohérente | Décalage entre l'illustration, le nom ou les effets        | `r`       |
| Nom cohérent          | Le nom est en accord avec les mécaniques et l'illustration    | `t`       |
| Standard MTG ✓        | La carte respecte les conventions et standards de MTG         | `y`       |
| Hors standard MTG     | La carte déroge aux conventions habituelles de MTG            | `u`       |

### 3.4 Dimensions supplémentaires proposées

L'outil ne doit pas imposer une grille d'analyse unique. Les axes ci-dessous constituent une bibliothèque de départ, activable selon le projet. Chaque dimension doit avoir un objectif clair, un type de réponse et, si nécessaire, des options configurables.

| Dimension | Type conseillé | Exemples de possibilités | Utilité pour le cube |
|-----------|----------------|--------------------------|----------------------|
| **Puissance** | Échelle 1–5 ou choix unique | Faible, correcte, forte, trop forte | Repérer les cartes qui tirent le niveau du cube vers le haut ou le bas |
| **Risque de déséquilibre** | Échelle 1–5 | Aucun, surveiller, problématique | Identifier les cartes qui créent des écarts de puissance ou de stratégie |
| **Complexité de jeu** | Choix unique | Simple, moyenne, complexe | Maîtriser la charge cognitive globale du cube |
| **Complexité de lecture** | Choix unique | Lisible, dense, très difficile | Évaluer l'accessibilité indépendamment de la puissance |
| **Archétypes** | Multi-tags | Aggro, contrôle, midrange, combo, tempo, sacrifice, réanimation, ramp, etc. | Vérifier qu'une carte sert réellement un ou plusieurs archétypes |
| **Couleurs / identité** | Multi-tags | W, U, B, R, G, incolore, multicolore | Analyser la répartition et les cartes hybrides ou difficiles à placer |
| **Type de carte** | Multi-tags | Créature, rituel, éphémère, artefact, enchantement, planeswalker, terrain | Faciliter les analyses de courbe et de densité par type |
| **Courbe de mana** | Choix unique ou nombre | Coût converti, tranche 0–1, 2–3, 4–5, 6+ | Repérer les trous et les excès dans la courbe |
| **Rôle dans le deck** | Multi-tags | Menace, removal, pioche, interaction, payoff, enabler, protection, mana | Mesurer la couverture fonctionnelle du cube |
| **Flexibilité** | Échelle 1–5 | Carte étroite à carte polyvalente | Favoriser les cartes jouables dans plusieurs decks |
| **Dépendance au contexte** | Échelle 1–5 | Autonome, dépendante d'un support, très parasitaire | Identifier les cartes qui nécessitent trop de synergies |
| **Parasitisme** | Choix unique | Aucun, léger, fort | Limiter les mécaniques qui ne fonctionnent qu'entre elles |
| **Redondance** | Choix unique ou texte | Unique, remplaçable, doublon d'une carte existante | Arbitrer les cartes qui occupent le même emplacement |
| **Plaisir de jeu** | Échelle 1–5 | Ennuyante à exceptionnelle | Intégrer le ressenti réel des joueurs dans la sélection |
| **Sensation de victoire** | Échelle 1–5 | Faible, satisfaisante, frustrante | Repérer les cartes qui génèrent des parties mémorables ou négatives |
| **Interactivité** | Échelle 1–5 | Peu interactive à très interactive | Éviter les parties trop solitaires ou verrouillées |
| **Lisibilité visuelle** | Choix unique | Claire, chargée, confuse | Prendre en compte l'illustration et la compréhension immédiate |
| **Originalité** | Échelle 1–5 | Classique à surprenante | Donner une place aux cartes qui apportent une expérience distincte |
| **Besoin de test** | Oui/non + note | À tester, à revoir après test, validée | Organiser les prochaines sessions de playtest |

#### Recommandation de périmètre

Pour une première version, il vaut mieux activer **6 à 8 dimensions maximum** : Accessibilité, Flavor & Cohérence, Puissance, Complexité, Archétypes, Rôle dans le deck, Flexibilité et Besoin de test. Le reste peut être ajouté dans le fichier de configuration sans modifier le code.

Les dimensions descriptives comme le coût de mana, la couleur ou le type de carte pourront ensuite être importées automatiquement depuis un fichier complémentaire ou une API, mais elles ne doivent pas être confondues avec l'avis subjectif du trieur.

### 3.5 Modèle générique de dimension

Chaque dimension est définie dans la configuration et non codée en dur dans l'interface :

```json
{
    "id": "puissance",
    "label": "Puissance",
    "type": "scale",
    "required": false,
    "min": 1,
    "max": 5,
    "step": 1,
    "options": [],
    "shortcut": null
}
```

Types à supporter : `single-choice`, `multi-tag`, `scale`, `boolean` et `text`. Pour éviter les classifications contradictoires, la configuration pourra également déclarer des groupes d'options incompatibles, par exemple `color_pie_ok` et `color_pie_ko`.

### 3.6 Export / Import de session

| ID    | Fonctionnalité                                                                 | Priorité |
|-------|--------------------------------------------------------------------------------|----------|
| F-30  | Exporter la session complète en fichier `.json` (liste des cartes + tags + config des dimensions) | MUST |
| F-31  | Import du `.json` : restauration complète de l'état (cartes + tags)           | MUST     |
| F-32  | Export partiel : n'exporter que les cartes triées                             | COULD    |
| F-33  | Export CSV : liste des cartes avec leurs tags (pour usage tableur)            | COULD    |
| F-34  | Sauvegarde automatique dans le `localStorage` du navigateur                   | SHOULD   |
| F-35  | Avertissement avant de quitter si session non exportée                        | SHOULD   |

### 3.7 Gestion de la configuration

| ID    | Fonctionnalité                                                                 | Priorité |
|-------|--------------------------------------------------------------------------------|----------|
| F-40  | Le fichier JSON embarque la définition des dimensions (labels, couleurs, raccourcis) | MUST |
| F-41  | Import d'un fichier JSON "config vierge" (dimensions définies + liste de cartes sans tags) comme point de départ pour un collaborateur | MUST |
| F-42  | Exporter la config uniquement (sans les tags, réutilisable pour un autre lot de cartes) | SHOULD |
| F-43  | Importer et exporter une bibliothèque de dimensions réutilisable entre plusieurs cubes | SHOULD |
| F-44  | Préserver les dimensions inconnues lors de l'import d'un fichier créé avec une version plus récente | SHOULD |
| F-45  | Afficher une validation de configuration avant utilisation (IDs uniques, raccourcis non dupliqués, bornes cohérentes) | MUST |

---

## 4. Contraintes non-fonctionnelles

| ID    | Contrainte                                                                     |
|-------|--------------------------------------------------------------------------------|
| NF-01 | **Zéro serveur** : tout fonctionne depuis un fichier `index.html` ouvert directement dans le navigateur |
| NF-02 | **Zéro dépendance externe** : HTML/CSS/JS vanilla, aucun CDN requis           |
| NF-03 | **Performance** : supporter 500 images sans blocage notable de l'interface    |
| NF-04 | **Responsive desktop** : optimisé pour grand écran (1080p+), pas de cible mobile |
| NF-05 | **Thème visuel** : sombre, inspiré de l'univers MTG (couleurs magiques)       |
| NF-06 | **Accessibilité clavier complète** : toutes les actions de tri disponibles sans souris |

---

## 5. Architecture technique cible

```
index.html
│
├── <style> / style.css     → Mise en page, thème sombre, composants UI
│
└── <script> / app.js
    ├── SessionManager       → Gestion de l'état courant (cartes + tags)
    ├── StorageAdapter       → localStorage + export/import JSON
    ├── ImageLoader          → Lecture des fichiers image (FileReader API)
    ├── CardView             → Affichage vue tri (1 carte en grand)
    ├── GalleryView          → Affichage vue galerie (grille)
    ├── TaggingEngine        → Logique de classification (dimensions/options)
    └── KeyboardHandler      → Gestion des raccourcis clavier
```

**Format JSON :** voir [README.md](README.md#-format-du-fichier-de-session-json)

---

## 6. Interface utilisateur — Wireframe textuel

### Vue galerie
```
┌─────────────────────────────────────────────────────┐
│  [🃏 MTG Cube Sorter]  [Import Images] [Import JSON] [Export] │
│  Progression : 47 / 360 cartes triées  [▓▓▓░░░░░░░] 13%       │
│  Filtres : [Toutes] [Non triées] [Accessibles] [Flavor: Pb CP] │
├─────────────────────────────────────────────────────┤
│  [Img] [Img] [Img] [Img] [Img] [Img] [Img] [Img]   │
│  ✓acc  ✗     ✓acc  ✓dif  ✗     ✓int  ✗     ✓acc   │
│                                                       │
│  [Img] [Img] [Img] ...                               │
└─────────────────────────────────────────────────────┘
```

### Vue tri (carte focus)
```
┌─────────────────────────────────────────────────┐
│  ← Préc.   Carte 48 / 360   Suivante →          │
├──────────────────┬──────────────────────────────┤
│                  │  ACCESSIBILITÉ               │
│  [IMAGE CARTE]   │  [1] Accessible  ← sélectionné│
│                  │  [2] Intermédiaire            │
│  (grande taille) │  [3] Difficile               │
│                  ├──────────────────────────────┤
│                  │  FLAVOR & COHÉRENCE          │
│                  │  [A] ✓ Color Pie             │
│                  │  [Z] Pb. Color Pie           │
│                  │  [E] ✓ Illustration cohérente│
│                  │  [R] Illus. incohérente      │
│                  │  [T] ✓ Nom cohérent          │
│                  │  [Y] ✓ Standard MTG          │
│                  │  [U] Hors standard           │
│                  ├──────────────────────────────┤
│                  │  NOTE : [__________________] │
│                  │  [⚑ À revoir]  [✖ Reset]    │
└──────────────────┴──────────────────────────────┘
```

---

## 7. Questions ouvertes / Points à valider

| # | Question                                                                                         | Statut   |
|---|--------------------------------------------------------------------------------------------------|----------|
| Q1 | Les images doivent-elles être embarquées en base64 dans le JSON par défaut, ou liens relatifs ? | ❓ Ouvert |
| Q2 | Faut-il un système de merge intelligent (diff) lors de l'import d'une session partagée ?        | ❓ Ouvert |
| Q3 | Souhaites-tu pouvoir personnaliser les dimensions/tags depuis l'interface, ou la config JSON suffit ? | ❓ Ouvert |
| Q4 | Faut-il un mode "blind review" (masquer les tags déjà attribués pour un second avis) ?          | ❓ Ouvert |
| Q5 | Un export CSV en plus du JSON est-il nécessaire (pour analyse dans un tableur) ?                | ❓ Ouvert |
| Q6 | Préfères-tu un fichier unique `index.html` (tout en un) ou plusieurs fichiers séparés ?         | ❓ Ouvert |

---

## 8. Hors périmètre (v1)

- Synchronisation temps-réel multi-utilisateur
- Authentification / gestion de comptes
- Stockage cloud
- Application mobile
- Intégration API Scryfall (auto-complétion du nom des cartes)
- Notation en étoiles ou score numérique (uniquement tags catégoriels)

---

## 9. Critères d'acceptance (Definition of Done)

- [ ] On peut importer 360 images et naviguer sans latence perceptible
- [ ] Toutes les actions de classification sont faisables au clavier uniquement
- [ ] L'export JSON se réimporte et restaure exactement l'état précédent
- [ ] Le fichier exporté est lisible par un collaborateur sur une autre machine sans setup
- [ ] La progression est visible en permanence
- [ ] Les cartes non triées sont clairement distinguables dans la galerie
- [ ] Une dimension ajoutée uniquement dans le JSON apparaît automatiquement dans l'interface
- [ ] Les types `single-choice`, `multi-tag`, `scale`, `boolean` et `text` sont correctement restaurés après import
- [ ] Une configuration invalide est signalée avant qu'elle ne puisse endommager une session
