/**
 * Configuration de l'application GooseCorp
 * Gestion des URLs d'API et variables d'environnement
 */

// Configuration de production (URL du backend Railway)
const PRODUCTION_CONFIG = {
    API_BASE_URL: 'https://goosecorporationbck-production.up.railway.app/api',
    TIMEOUT: 15000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    CACHE_DURATION: 10 * 60 * 1000, // 10 minutes
    DEMO_MODE: false
};

// Configuration active - TOUJOURS utiliser la production
export const CONFIG = PRODUCTION_CONFIG;

// Fonction pour mettre à jour l'URL de l'API (utile pour Netlify)
export function updateApiUrl(newUrl) {
    CONFIG.API_BASE_URL = newUrl;
    console.log('API URL mise à jour:', newUrl);
}

// Fonction pour obtenir la configuration actuelle
export function getConfig() {
    return { ...CONFIG };
}

// Export de la configuration par défaut
export default CONFIG; 