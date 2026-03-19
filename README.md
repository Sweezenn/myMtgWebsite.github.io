# 🃏 myMtgWebsite

Site web statique personnel hébergé sur **GitHub Pages**, présentant deux collections de cartes **Magic: The Gathering** custom.

## 📋 Description

Ce site expose deux projets de cartes MTG créées sur mesure :

| Projet | Description | Cartes |
|--------|-------------|--------|
| **Jeko** | Set custom avec 5 mécaniques originales : *Curse, Guard, Prayer, Last Breath, Tribal* | ~293 |
| **MCC – Magic Custom Cube** | Cube draft custom (projet 2024) | ~427 |

## 🏗️ Architecture

```
myMtgWebsite.github.io/
├── index.html                          # Page d'accueil (Welcome)
├── jeko/
│   └── index.html                      # Page Jeko (set custom)
├── mcc-magic-custom-cube/
│   ├── index.html                      # Page MCC (cube custom) — chargement dynamique
│   └── card-list.json                  # Manifeste des images MCC (généré automatiquement)
├── mcc-magic-custom-cube_image/        # 📁 Source des images MCC (PNG)
│   ├── Abundance Colossus.png
│   ├── ...
│   └── Zombot Intruder.png
├── wp-content/
│   ├── themes/twentytwenty/            # Thème WordPress TwentyTwenty v2.7
│   │   ├── style.css
│   │   ├── print.css
│   │   └── assets/                     # CSS fonts + JS
│   └── uploads/
│       ├── 2021/12/                    # Image de fond accueil
│       ├── 2024/10/                    # Images cartes Jeko
│       └── 2025/02/                    # Image bannière MCC
├── wp-includes/css/                    # CSS WordPress core
├── generate-card-list.ps1              # Script de régénération du manifeste MCC
└── README.md
```

## 🛠️ Stack Technique

- **Origine :** Export statique d'un site WordPress 6.8.3
- **Thème :** TwentyTwenty v2.7
- **Hébergement :** GitHub Pages
- **Langue :** Français (`fr-FR`)
- **Galerie MCC :** Chargement dynamique via JavaScript + manifeste JSON


## 🔄 Gestion des images MCC 100% VS Code

La page MCC charge désormais **automatiquement** toutes les images du dossier `mcc-magic-custom-cube_image/` grâce à un script et un manifeste JSON. Plus besoin de WordPress ni de modifier le HTML à la main.

### Procédure de mise à jour (workflow VS Code)

1. **Ajouter, modifier ou supprimer** des images PNG dans `mcc-magic-custom-cube_image/` (directement dans le repo VS Code)
2. **Régénérer le manifeste** en lançant :
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\generate-card-list.ps1
   ```
3. **Commit & Push** sur GitHub

Le script scanne le dossier d'images et met à jour automatiquement `mcc-magic-custom-cube/card-list.json`.

### Convention de nommage des images

- Nom de fichier = Nom de la carte (ex: `Abundance Colossus.png`)
- Format : **PNG**
- Variantes d'une même carte : suffix `.1`, `.2`, etc. (ex: `Paladin of Piety.png`, `Paladin of Piety.1.png`)
- Le nom affiché dans l'attribut `alt` est dérivé du nom de fichier (sans l'extension)

### Fonctionnement de la galerie MCC

- La page [mcc-magic-custom-cube/index.html](mcc-magic-custom-cube/index.html) utilise un script JavaScript qui charge dynamiquement toutes les images listées dans `card-list.json`.
- Toute modification dans le dossier d'images est prise en compte après régénération du manifeste et déploiement.
- Plus besoin de WordPress ni d'éditer le HTML pour la galerie MCC.

## 🎨 Thème & Couleurs

| Élément | Couleur |
|---------|---------|
| Header / Footer | Or `#d6b860` |
| Accent | Rose `#cd2653` |
| Navigation | Noir `#000000` |
| Fond | Beige `#f5efe0` |

## 📝 Notes

- Les chemins sont **relatifs** (`./`, `./../`), ce qui rend le site portable.
- La page **Jeko** utilise encore des images statiques dans `wp-content/uploads/2024/10/`.
- La page **MCC** utilise un chargement dynamique depuis `mcc-magic-custom-cube_image/`.

---

*© 2025 myMtgWebsite — Propulsé par WordPress (export statique)*
