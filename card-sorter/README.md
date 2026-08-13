---
status: draft
tags: [MTG, cube, web-app, tri-cartes]
---

# 🃏 MTG Cube Card Sorter

Application web locale (zéro serveur) pour **classer des centaines de cartes Magic: The Gathering** selon plusieurs axes thématiques, avec export/import du fichier de résultats.

---

## 🚀 Démarrage rapide

1. Ouvrir le fichier `index.html` dans un navigateur moderne (Chrome, Firefox, Edge).
2. Charger un **pack de session** existant (fichier `.json`) **ou** importer des images de cartes directement.
3. Trier les cartes une à une en attribuant des tags sur chaque dimension.
4. Exporter le fichier de session à tout moment pour sauvegarder ou partager.

> Aucune installation, aucun serveur, aucune connexion internet requise.

---

## 📁 Structure du projet

```
cube/
├── index.html          # Point d'entrée unique de l'application
├── app.js              # Logique principale (tri, navigation, import/export)
├── style.css           # Interface et thème visuel (thème sombre MTG)
├── README.md           # Ce fichier
├── CDC.md              # Cahier des charges fonctionnel
└── sessions/           # Dossier suggéré pour stocker les exports JSON
```

---

## 🗂️ Format du fichier de session (`.json`)

Le fichier de session est le **cœur du système**. Il est à la fois :
- la liste des cartes à analyser
- la sauvegarde des classifications réalisées

```json
{
  "meta": {
    "version": "1.0",
    "createdAt": "2026-08-13",
    "updatedAt": "2026-08-13",
    "author": "hbelcour",
    "description": "Cube draft - analyse accessibilité & flavor"
  },
  "dimensions": [
    {
      "id": "accessibilite",
      "label": "Accessibilité",
      "type": "single-choice",
      "shortcut": "1/2/3",
      "options": [
        { "id": "accessible",    "label": "Accessible",    "color": "#22c55e", "shortcut": "1" },
        { "id": "intermediaire", "label": "Intermédiaire", "color": "#f59e0b", "shortcut": "2" },
        { "id": "difficile",     "label": "Difficile",     "color": "#ef4444", "shortcut": "3" }
      ]
    },
    {
      "id": "flavor",
      "label": "Flavor & Cohérence",
      "type": "multi-tag",
      "shortcut": "A/Z/E/R",
      "options": [
        { "id": "color_pie_ok",     "label": "Color Pie ✓",         "color": "#6366f1", "shortcut": "a" },
        { "id": "color_pie_ko",     "label": "Pb. Color Pie",        "color": "#dc2626", "shortcut": "z" },
        { "id": "illus_coherente",  "label": "Illustration cohérente","color": "#6366f1", "shortcut": "e" },
        { "id": "illus_incoh",      "label": "Illus. incohérente",   "color": "#dc2626", "shortcut": "r" },
        { "id": "nom_coherent",     "label": "Nom cohérent",         "color": "#6366f1", "shortcut": "t" },
        { "id": "standard_mtg",     "label": "Standard MTG ✓",      "color": "#6366f1", "shortcut": "y" },
        { "id": "hors_standard",    "label": "Hors standard MTG",   "color": "#dc2626", "shortcut": "u" }
      ]
    }
  ],
  "cards": [
    {
      "id": "card_001",
      "name": "Lightning Bolt",
      "imagePath": "lightning_bolt.jpg",
      "imageData": null,
      "classifications": {
        "accessibilite": "accessible",
        "flavor": ["color_pie_ok", "illus_coherente", "nom_coherent", "standard_mtg"]
      },
      "notes": "Carte iconique, très lisible.",
      "reviewed": true
    }
  ]
}
```

> **`imageData`** : optionnel. Si renseigné (base64), l'image est embarquée dans le JSON et le fichier devient autoportant (partageable sans les images séparées). Si `null`, l'app utilise `imagePath` relatif.

### Dimensions configurables

Les dimensions ne sont pas limitées à Accessibilité et Flavor. Elles sont définies dans le fichier JSON et l'interface construit automatiquement les contrôles correspondants. Une session peut donc ajouter, retirer ou réorganiser des axes sans changement de code.

Types disponibles :

| Type | Usage | Exemple |
|------|-------|---------|
| `single-choice` | Une seule réponse parmi plusieurs | Complexité : simple / moyenne / complexe |
| `multi-tag` | Plusieurs tags simultanés | Archétypes : aggro + sacrifice |
| `scale` | Note sur une échelle | Puissance : trop faible / OK / ne sait pas / trop fort |
| `boolean` | Oui/non | Color Pie, illustration, nom et standard MTG |
| `text` | Commentaire libre | Justification du choix |

Exemples d'axes utiles : Puissance, Complexité, Archétypes, Rôle dans le deck, Flexibilité, Dépendance au contexte, Parasitisme, Plaisir de jeu, Interactivité, Originalité et Besoin de test. La liste complète et la recommandation de périmètre sont détaillées dans [CDC.md](CDC.md#34-dimensions-supplémentaires-proposées).

La configuration peut aussi déclarer :
- une dimension obligatoire ou facultative ;
- des bornes et un pas pour une échelle ;
- un raccourci clavier par option ;
- des options incompatibles, par exemple "Color Pie OK" et "Pb. Color Pie" ;
- un identifiant stable, afin que les données restent compatibles entre deux versions du fichier.

---

## ⌨️ Navigation clavier (mode tri rapide)

| Touche          | Action                                      |
|-----------------|---------------------------------------------|
| `→` / `Espace`  | Carte suivante                              |
| `←`             | Carte précédente                            |
| `A`              | Faire défiler l'accessibilité               |
| `Z`              | Basculer Color Pie respecté                 |
| `E`              | Basculer illustration cohérente             |
| `R`              | Basculer nom cohérent                       |
| `Q`              | Basculer standard MTG respecté              |
| `S`              | Faire défiler la puissance                   |
| `N`             | Ouvrir/fermer le champ note                 |
| `Échap`         | Retour à la vue galerie                     |

---

## 🔄 Workflow typique

```
1. Préparer son lot de cartes (images JPG/PNG dans un dossier)
2. Ouvrir index.html
3. Importer les images → une session vierge est créée
4. Mode tri : carte après carte, attribuer les tags (raccourcis clavier)
5. Exporter la session (.json) régulièrement
6. Partager le .json avec un collaborateur
7. Le collaborateur importe le .json, complète/modifie les tags
8. Réimporter le fichier modifié → fusion ou écrasement au choix
```

---

## 🤝 Partage multi-utilisateur (local)

Le fichier `.json` est conçu pour être échangé par tout moyen (mail, clé USB, chat). Chaque personne :
- importe le fichier dans son propre navigateur
- effectue ses classifications
- exporte et renvoie le fichier

Il n'y a **pas de synchronisation temps-réel** : c'est un flux asynchrone volontairement simple.

---

## 🛠️ Dépendances techniques

Aucune. L'app est en **HTML/CSS/JS vanilla**, sans framework ni bundler.
Compatible : Chrome 90+, Firefox 88+, Edge 90+, Safari 14+.
