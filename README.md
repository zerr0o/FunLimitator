# Fun Limitator 🚫⚠️

Une extension Chrome qui t'aide à éviter de gaspiller ton temps sur les sites de distraction en affichant une popup d'avertissement bloquante avec gestion intelligente des plages horaires.

## 🌟 Fonctionnalités

- **Popup bloquante plein écran** avec design moderne et sombre
- **Timeout de 10 secondes** avant de pouvoir continuer
- **⏰ Plages horaires personnalisables** - Extension active seulement pendant les heures de travail
- **🔇 Mute automatique** des médias pendant la popup (YouTube, etc.)
- **📱 Session par onglet** - Popup unique jusqu'à fermeture de l'onglet
- **Gestion personnalisable des sites** via la page d'options
- **Système d'exclusions** (ex: bloquer Facebook mais pas Facebook Messages)
- **Interface moderne** avec thème sombre et animations

## 🚀 Sites bloqués par défaut

- `facebook.com` (sauf `facebook.com/messages`)
- `youtube.com`
- `instagram.com`

## 📦 Installation

### 🚀 Méthode 1 : Installation directe (Recommandée)

1. **Télécharge la release** : Va sur [Releases](https://github.com/zerr0o/FunLimitator/releases) et télécharge `fun-limitator-v3.0.zip`

2. **Extrait le fichier ZIP** dans un dossier de ton choix

3. **Ouvre Chrome** et va dans les paramètres d'extensions :
   - Tape `chrome://extensions/` dans la barre d'adresse
   - Ou va dans Menu → Plus d'outils → Extensions

4. **Active le mode développeur** (toggle en haut à droite)

5. **Clique sur "Charger l'extension non empaquetée"**

6. **Sélectionne le dossier extrait** qui contient les fichiers de l'extension

7. **L'extension est maintenant installée** ! Tu verras l'icône dans la barre d'outils

### 🛠️ Méthode 2 : Depuis le code source

1. **Clone le repository** :
   ```bash
   git clone https://github.com/zerr0o/FunLimitator.git
   cd FunLimitator
   ```

2. **Suis les étapes 3-7** de la méthode 1 ci-dessus

## ⚙️ Configuration

1. **Clique droit** sur l'icône de l'extension dans la barre d'outils
2. **Sélectionne "Options"** ou va dans `chrome://extensions/` et clique sur "Options"

### ⏰ Configuration des plages horaires

1. **Section "Heures de fonctionnement"** :
   - ✅ **Active le toggle** si tu veux limiter l'extension à certaines heures
   - ⏰ **Configure l'heure de début** (ex: 09:00)
   - 🏁 **Configure l'heure de fin** (ex: 18:00)
   - 🌙 **Support des plages nocturnes** : Ex: 22:00 → 06:00 (traverse minuit)

2. **Aperçu en temps réel** de ta configuration

### 🚫 Gestion des sites bloqués

3. **Ajoute/supprime/modifie** les sites que tu veux bloquer
4. **💾 Sauvegarde** tes modifications

### Format des sites

- **URL du site** : `facebook.com` (sans `http://` ou `https://`)
- **Exclusions** : Une URL par ligne dans la zone d'exclusions
  - Exemple : `facebook.com/messages` pour ne pas bloquer Facebook Messenger

## 🎯 Comment ça marche

### 🔍 Détection intelligente
1. **Vérification de l'heure** : Si les plages horaires sont activées, vérifie si on est dans la période active
2. **Détection de site** : Quand tu visites un site bloqué pendant les heures actives
3. **Session unique** : Une seule popup par onglet jusqu'à sa fermeture

### 🚨 Popup d'avertissement
1. **Popup pleine page** s'affiche avec design moderne
2. **🔇 Mute automatique** : Tous les médias (vidéos, audio) sont instantanément coupés
3. **Tu as deux choix** :
   - **"Non, retourner à l'accueil"** → Retourne à une page vide
   - **"Oui, je continue"** → Continue sur le site (disponible après 10s)
4. **Compte à rebours de 10 secondes** pour te forcer à réfléchir
5. **Restauration automatique** : Après validation, le son et les médias reprennent normalement

## 🔧 Structure des fichiers

```
FunLimitator/
├── manifest.json       # Configuration de l'extension
├── content.js          # Script qui détecte les sites et affiche la popup
├── popup.css          # Styles de la popup d'avertissement
├── options.html       # Page d'options pour gérer les sites
├── options.css        # Styles de la page d'options
├── options.js         # Logique de la page d'options
└── README.md          # Ce fichier
```

## 🎨 Personnalisation

### Modifier le timeout

Dans `content.js`, ligne 46, change la valeur :
```javascript
let timeLeft = 10; // Changer cette valeur (en secondes)
```

### Modifier les couleurs

Dans `popup.css`, tu peux modifier les couleurs principales :
- `#ff6b35` : Orange principal
- `#1a1a1a` et `#2d2d2d` : Arrière-plans sombres
- `#e74c3c` : Rouge pour le bouton "Non"
- `#27ae60` : Vert pour le bouton "Oui"

## 🐛 Dépannage

### La popup n'apparaît pas
- Vérifie que l'extension est bien activée
- Assure-toi que le site est dans la liste des sites bloqués
- Recharge la page web

### Erreur lors de l'installation
- Vérifie que tous les fichiers sont présents
- Assure-toi que le mode développeur est activé
- Redémarre Chrome si nécessaire

### Les modifications ne sont pas sauvegardées
- Va dans la page d'options
- Clique sur "Sauvegarder les modifications" après tes changements
- Recharge les pages web concernées

## ⚡ Conseils d'utilisation

- **Commence petit** : Ajoute un ou deux sites d'abord
- **Utilise les exclusions** : Garde les parties utiles (ex: Facebook Messages)
- **Sois honnête avec toi-même** : Si tu contournes toujours l'extension, augmente le timeout
- **Révise régulièrement** : Ajoute de nouveaux sites de distraction si nécessaire

## 📝 Notes importantes

- Cette extension fonctionne uniquement sur **Google Chrome**
- Elle stocke tes préférences **localement** (pas de données envoyées en ligne)
- Le timeout ne peut pas être contourné (c'est le but ! 😄)

---

**Profite de ta productivité retrouvée ! 🎯✨**