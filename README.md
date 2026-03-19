# 🃏 myMtgWebsite

Site web statique personnel hébergé sur **GitHub Pages**, présentant deux collections de cartes **Magic: The Gathering** custom.

## 📋 Description

Ce site expose deux projets de cartes MTG créées sur mesure :

| Projet | Description | Cartes |
|--------|-------------|--------|
| **Jeko** | Set custom avec 5 mécaniques originales : *Curse, Guard, Prayer, Last Breath, Tribal* | ~293 |
| **MCC – Magic Custom Cube** | Cube draft custom (projet 2024) — Cartes + Tokens | ~380 cartes + 47 tokens |

## 🏗️ Architecture

```
myMtgWebsite.github.io/
├── index.html                          # Page d'accueil (Welcome)
├── jeko/
│   └── index.html                      # Page Jeko (set custom)
├── mcc-magic-custom-cube/
│   ├── index.html                      # Page MCC (cube custom) — chargement dynamique
│   ├── card-list.json                  # Manifeste des cartes (généré automatiquement)
│   └── token-list.json                 # Manifeste des tokens (généré automatiquement)
├── mcc-magic-custom-cube_image/        # 📁 Source des images cartes MCC (PNG numérotées)
│   ├── 1_Lenala Kindhearted Monstrosity.png
│   ├── ...
│   └── 380_Whispering Falls.png
├── mcc-magic-custom-cube_image_token/   # 📁 Source des images tokens MCC (PNG numérotées)
│   ├── 1_Angel.png
│   ├── ...
│   └── 47_Treasure.png
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
├── generate-card-list.ps1              # Script de régénération des manifestes MCC (cartes + tokens)
└── README.md
```

## 🛠️ Stack Technique

- **Origine :** Export statique d'un site WordPress 6.8.3
- **Thème :** TwentyTwenty v2.7
- **Hébergement :** GitHub Pages
- **Langue :** Français (`fr-FR`)
- **Galerie MCC :** Chargement dynamique via JavaScript + manifeste JSON


## 🔄 Gestion des images MCC 100% VS Code

La page MCC charge **automatiquement** les cartes et tokens depuis deux dossiers d'images distincts. Plus besoin de WordPress ni de modifier le HTML.

### Procédure de mise à jour (workflow VS Code)

1. **Ajouter, modifier ou supprimer** des images PNG dans :
   - `mcc-magic-custom-cube_image/` pour les **cartes**
   - `mcc-magic-custom-cube_image_token/` pour les **tokens**
2. **Régénérer les manifestes** :
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\generate-card-list.ps1
   ```
3. **Commit & Push** sur GitHub

Le script génère `card-list.json` (cartes) et `token-list.json` (tokens) avec un **tri numérique** basé sur le préfixe du nom de fichier.

### Convention de nommage des images

- Format : **`N_Nom de la carte.png`** (ex: `1_Angel.png`, `42_Echoing Shade.png`)
- Le préfixe numérique `N_` détermine l'**ordre d'affichage** sur le site
- Le nom affiché (attribut `alt`) est dérivé du nom sans le préfixe ni l'extension
- Format image : **PNG**

### Fonctionnement des galeries MCC

- La page affiche **deux blocs** : un pour les cartes, un pour les tokens (titre "Tokens")
- Chaque bloc charge dynamiquement les images depuis son manifeste JSON respectif
- Le tri est **numérique** (1, 2, 3... 380) et non alphabétique
- Toute modification dans les dossiers d'images est prise en compte après régénération des manifestes et push

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
- La page **MCC** utilise un chargement dynamique depuis `mcc-magic-custom-cube_image/` (cartes) et `mcc-magic-custom-cube_image_token/` (tokens).

---

*© 2025 myMtgWebsite — Propulsé par WordPress (export statique)*
