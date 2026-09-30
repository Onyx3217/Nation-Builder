# 🎵 Nation Builder — Dossier Audio / Audio Folder Guide

Placer vos fichiers audio dans ce dossier pour activer la musique d'ambiance dans le jeu.

---

## 📁 Structure attendue

```
audio/
├── theme.mp3          ← Musique principale du menu & monde (boucle)
├── war.mp3            ← Ambiance de guerre / tension élevée (optionnel)
├── diplomacy.mp3      ← Fond musical doux pour les dialogues diplomatiques (optionnel)
└── victory.mp3        ← Fanfare de victoire / événement positif (optionnel)
```

---

## ✅ Formats supportés

| Format | Support |
|--------|---------|
| `.mp3` | ✅ Universel (recommandé) |
| `.ogg` | ✅ Open source, compact |
| `.wav` | ✅ Haute qualité (fichier lourd) |
| `.webm` | ✅ Navigateurs modernes |

> **Recommandé :** MP3 128–192kbps pour un bon compromis qualité/poids.

---

## 🎮 Configuration dans le jeu

1. **Placer** `theme.mp3` dans ce dossier `audio/`.
2. **Lancer** le serveur de développement : `npm run dev`
3. **Ouvrir** les Paramètres (icône ⚙️ sur l'écran d'accueil ou dans le monde).
4. **Activer** la musique via le toggle **Musique / Music**.

La musique se met en **boucle automatiquement** et le volume est réglable dans les paramètres (0 à 100%).

---

## 🔊 Fichier principal : `theme.mp3`

C'est le seul fichier **obligatoire** pour que la musique fonctionne.

### Sources recommandées (libres de droits)
- **Free Music Archive** — https://freemusicarchive.org
- **Incompetech (Kevin MacLeod)** — https://incompetech.com
- **OpenGameArt** — https://opengameart.org
- **Pixabay Music** — https://pixabay.com/music
- **Freesound** — https://freesound.org

### Suggestions de style pour l'ambiance géopolitique
- Orchestral épique / cinématique
- Ambiance militaire & stratégie
- Piano + cordes atmosphériques
- Musique d'ambiance monde / carte

---

## 🛠️ Intégration technique

Le lecteur audio est géré par `src/components/AudioPlayer.jsx`.

Le chemin du fichier audio est défini dans :
```js
// src/components/AudioPlayer.jsx
const AUDIO_TRACKS = {
  theme: '/audio/theme.mp3',
  war: '/audio/war.mp3',
  diplomacy: '/audio/diplomacy.mp3',
  victory: '/audio/victory.mp3',
}
```

Les fichiers dans `audio/` sont servis **statiquement** par Vite depuis la racine publique.
Pour accéder au fichier depuis le navigateur, le chemin est `/audio/theme.mp3`.

---

## ⚠️ Important

- Ce dossier `audio/` est situé **à la racine du projet** (pas dans `src/` ni `public/`).
- Vite sert automatiquement les fichiers de **`public/`**. Il faut donc soit :
  - Placer les fichiers dans **`public/audio/`** (recommandé pour la prod)
  - Ou copier les fichiers dans `public/audio/` avant le build

### Pour la production (`npm run build`)

Copier les fichiers audio dans `public/audio/` avant de builder :
```bash
# Windows PowerShell
Copy-Item -Recurse .\audio\* .\public\audio\
npm run build
```

---

*Nation Builder v1.2 — 2026*
