# GooseCorp Frontend

Application frontend pour la gestion des visiteurs GooseCorp.

## Configuration

⚠️ **IMPORTANT** : Cette application est configurée pour utiliser **UNIQUEMENT** l'API de production hébergée sur Railway.

- **API URL** : `https://goosecorporationbck-production.up.railway.app/api`
- **Mode démo** : Désactivé
- **Localhost** : ❌ **NON SUPPORTÉ** - L'application ne fonctionne que sur les adresses réseau

## Installation

```bash
npm install
```

## Développement

### Démarrer en mode réseau (obligatoire)
```bash
npm run dev
```
Le serveur sera accessible sur les adresses réseau uniquement :
- `http://10.255.255.254:5173/`
- `http://172.31.182.135:5173/`
- **PAS** sur `http://localhost:5173/`

### Démarrer en mode local (déconseillé)
```bash
npm run dev:local
```
⚠️ Attention : Ce mode peut causer des problèmes de connexion avec l'API de production.

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```
Accessible sur les adresses réseau uniquement.

## Structure

- `src/api.js` - Services API (toujours en mode production)
- `src/config.js` - Configuration (API de production uniquement)
- `src/entry.js` - Logique de la page d'entrée
- `src/checkin.js` - Logique de la page d'enregistrement
- `src/checkout.js` - Logique de la page de sortie
- `src/utils.js` - Utilitaires
- `src/diagnostics.js` - Outils de diagnostic

## API Endpoints

L'application utilise les endpoints suivants de l'API de production :

- `GET /visitors/public/health` - Vérification de santé
- `GET /visitors/public/staff` - Liste du personnel
- `GET /visitors/public/formations` - Liste des formations
- `POST /visitors` - Enregistrement d'un nouveau visiteur
- `POST /visitors/{id}/reentry` - Re-entrée d'un visiteur
- `POST /visitors/checkout/unique/{uniqueId}` - Sortie d'un visiteur

## Notes importantes

- L'application ne fonctionne qu'avec l'API de production
- Aucun mode démo ou localhost n'est supporté
- Toutes les requêtes sont envoyées vers Railway
- Le cache est utilisé pour optimiser les performances
- **Accès uniquement via les adresses réseau IP** 