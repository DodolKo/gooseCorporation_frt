# 🏢 GooseCorp - Frontend Visiteurs

Application frontend statique pour la gestion des visiteurs de GooseCorp.

## 📋 Description

Cette application permet aux visiteurs de :
- **S'enregistrer** à leur arrivée avec leurs informations personnelles
- **Déclarer leur sortie** en utilisant leur ID unique de visite
- **Sélectionner le motif** de leur visite (rendez-vous, formation, etc.)

## 🚀 Démarrage Rapide

### Prérequis

- Node.js (version 14 ou supérieure)
- npm
- Le backend GooseCorp doit être disponible dans `../gooseCorp_bck`

### Installation et Démarrage

1. **Démarrage automatique** (recommandé) :
   ```bash
   ./start-dev.sh
   ```

2. **Démarrage manuel** :
   ```bash
   # Démarrer le backend
   cd ../gooseCorp_bck
   npm run dev
   
   # Dans un autre terminal, démarrer le frontend
   cd ../gooseCorp_frt
   python3 -m http.server 8080
   ```

3. **Ouvrir dans le navigateur** :
   - Application principale : http://localhost:8080
   - Test API : http://localhost:8080/test-api.html

## 📁 Structure du Projet

```
gooseCorp_frt/
├── index.html              # Page d'entrée des visiteurs
├── checkout.html           # Page de sortie des visiteurs
├── test-api.html           # Page de test des API
├── start-dev.sh            # Script de démarrage automatique
├── src/
│   ├── api.js              # Configuration API et services
│   ├── utils.js            # Utilitaires et validation
│   ├── checkin.js          # Logique page d'entrée
│   ├── checkout.js         # Logique page de sortie
│   └── assets/
│       └── style.css       # Styles CSS
├── BACKEND_TODO.md         # Points en attente backend
└── README.md               # Ce fichier
```

## 🌐 Pages Disponibles

### 1. Page d'Entrée (`index.html`)
- Formulaire d'inscription des visiteurs
- Sélection du motif de visite
- Listes déroulantes pour le personnel et formations
- Génération d'un ID unique de visite

### 2. Page de Sortie (`checkout.html`)
- Saisie de l'ID unique de visite
- Déclaration de sortie
- Calcul de la durée de visite

### 3. Page de Test (`test-api.html`)
- Tests de connexion API
- Vérification des endpoints
- Débogage des problèmes de connexion

## 🔧 Configuration

### API Backend

L'application se connecte au backend sur `http://localhost:3000/api`

**Endpoints utilisés :**
- `GET /visitors/public/health` - Vérification de santé
- `GET /visitors/public/staff` - Liste du personnel
- `GET /visitors/public/formations` - Liste des formations
- `POST /visitors` - Enregistrement d'un visiteur
- `POST /visitors/:id/checkout` - Sortie d'un visiteur

### Variables de Configuration

Dans `src/api.js` :
```javascript
const API_CONFIG = {
    BASE_URL: 'http://localhost:3000/api',
    TIMEOUT: 10000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
    CACHE_DURATION: 5 * 60 * 1000 // 5 minutes
};
```

## 🎨 Fonctionnalités

### ✅ Implémentées
- ✅ Formulaire d'inscription avec validation
- ✅ Page de sortie avec ID unique
- ✅ Validation en temps réel
- ✅ Gestion d'erreurs complète
- ✅ Notifications utilisateur
- ✅ Cache intelligent des données
- ✅ Retry automatique des requêtes
- ✅ Design responsive
- ✅ Accessibilité optimisée

### 🔄 À Venir (V2)
- 🔄 Génération de QR Code
- 🔄 Scan QR Code pour sortie
- 🔄 Impression des badges
- 🔄 Notifications push

## 🔒 Sécurité

### Mesures Implémentées
- Validation côté client et serveur
- Protection contre les injections XSS
- Rate limiting des requêtes
- Headers de sécurité
- Gestion sécurisée des erreurs

### Recommandations Production
- Utiliser HTTPS obligatoire
- Implémenter la validation SRI
- Masquer les logs de débogage
- Configurer les CSP headers

## 🧪 Tests

### Test API
Ouvrez `test-api.html` pour :
- Tester la connexion au backend
- Vérifier les endpoints publics
- Déboguer les problèmes de CORS
- Tester l'enregistrement des visiteurs

### Tests Manuels
1. **Test d'inscription** :
   - Remplir le formulaire d'entrée
   - Vérifier la génération de l'ID unique
   - Tester les différents motifs de visite

2. **Test de sortie** :
   - Utiliser l'ID généré lors de l'inscription
   - Vérifier le calcul de la durée de visite
   - Tester les cas d'erreur (ID invalide)

## 🐛 Dépannage

### Problèmes Courants

1. **Erreur de connexion API** :
   ```
   Solution : Vérifier que le backend est démarré sur le port 3000
   Test : curl http://localhost:3000/health
   ```

2. **Erreur CORS** :
   ```
   Solution : Le backend est configuré pour accepter localhost
   Vérifier : Les headers CORS dans la console du navigateur
   ```

3. **Listes déroulantes vides** :
   ```
   Solution : Vérifier les endpoints publics du backend
   Test : http://localhost:3000/api/visitors/public/staff
   ```

4. **Validation échoue** :
   ```
   Solution : Vérifier les règles de validation côté serveur
   Debug : Ouvrir les DevTools (F12) pour voir les erreurs
   ```

### Logs de Débogage

**Frontend** : Ouvrir les DevTools du navigateur (F12) → Console
**Backend** : Visible dans le terminal où le serveur est démarré

## 📞 Support

Pour tout problème ou question :
1. Vérifier les logs dans la console du navigateur
2. Tester la connexion API avec `test-api.html`
3. Consulter les endpoints backend dans `BACKEND_TODO.md`

## 🔄 Développement

### Ajout de Nouvelles Fonctionnalités

1. **Nouveau champ de formulaire** :
   - Ajouter dans `index.html` et `checkout.html`
   - Mettre à jour la validation dans `src/utils.js`
   - Modifier les services API dans `src/api.js`

2. **Nouvelle page** :
   - Créer le fichier HTML
   - Ajouter le script JavaScript correspondant
   - Mettre à jour la navigation

3. **Nouveau style** :
   - Modifier `src/assets/style.css`
   - Utiliser les variables CSS existantes
   - Tester la responsivité

### Architecture

L'application suit une architecture **Vue.js-like** avec :
- **Séparation des responsabilités** (HTML, CSS, JS)
- **Composants réutilisables** (utilitaires, services)
- **Gestion d'état simple** (variables globales)
- **Système de notifications** centralisé

---

**🎯 Application créée avec ❤️ pour GooseCorp** 