/**
 * Configuration et Services API pour GooseCorp
 * 
 * Ce fichier contient :
 * - Configuration de base de l'API
 * - Client HTTP avec intercepteurs
 * - Services pour tous les endpoints
 * - Gestion des erreurs et retry
 * - Cache des données publiques
 */

// ====================================
// CONFIGURATION DE BASE
// ====================================

import CONFIG from './config.js';

const API_CONFIG = {
    BASE_URL: CONFIG.API_BASE_URL,
    TIMEOUT: CONFIG.TIMEOUT,
    MAX_RETRIES: CONFIG.MAX_RETRIES,
    RETRY_DELAY: CONFIG.RETRY_DELAY,
    CACHE_DURATION: CONFIG.CACHE_DURATION,
    DEMO_MODE: CONFIG.DEMO_MODE
};

// ====================================
// CACHE SIMPLE POUR LES DONNÉES PUBLIQUES
// ====================================

class SimpleCache {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Récupère une valeur du cache
     * @param {string} key - Clé du cache
     * @returns {*} Valeur ou null si expirée/inexistante
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        // Vérifier si l'item a expiré
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    /**
     * Stocke une valeur dans le cache
     * @param {string} key - Clé du cache
     * @param {*} data - Données à stocker
     * @param {number} duration - Durée de vie en ms (optionnel)
     */
    set(key, data, duration = API_CONFIG.CACHE_DURATION) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + duration
        });
    }

    /**
     * Vide le cache
     */
    clear() {
        this.cache.clear();
    }
}

// Instance globale du cache
const apiCache = new SimpleCache();

// ====================================
// DONNÉES DE TEST POUR LE MODE DÉMO
// ====================================

const DEMO_DATA = {
    staff: [
        {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            department: 'IT',
            position: 'Développeur Senior',
            email: 'john.doe@goosecorp.com'
        },
        {
            id: 2,
            firstName: 'Marie',
            lastName: 'Martin',
            department: 'RH',
            position: 'Responsable RH',
            email: 'marie.martin@goosecorp.com'
        },
        {
            id: 3,
            firstName: 'Pierre',
            lastName: 'Dubois',
            department: 'Marketing',
            position: 'Chef de projet',
            email: 'pierre.dubois@goosecorp.com'
        }
    ],
    formations: [
        {
            id: 1,
            name: 'Formation Sécurité',
            description: 'Formation obligatoire sur les règles de sécurité',
            location: 'Salle de formation A',
            startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
            instructor: 'Expert Sécurité',
            maxParticipants: 20,
            currentParticipants: 15
        },
        {
            id: 2,
            name: 'Formation JavaScript',
            description: 'Initiation au développement JavaScript',
            location: 'Salle informatique B',
            startDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            endDate: new Date(Date.now() + 48 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000).toISOString(),
            instructor: 'Développeur Expert',
            maxParticipants: 15,
            currentParticipants: 8
        }
    ]
};

// ====================================
// CLIENT HTTP AVEC INTERCEPTEURS
// ====================================

class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
    }

    /**
     * Effectue une requête HTTP avec retry automatique
     * @param {string} url - URL de la requête
     * @param {Object} options - Options de la requête
     * @param {number} retryCount - Nombre de tentatives restantes
     * @returns {Promise<Response>} Réponse de la requête
     */
    async request(url, options = {}, retryCount = API_CONFIG.MAX_RETRIES) {
        const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
        
        // Configuration par défaut
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout: this.timeout
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            // Créer un contrôleur pour le timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(fullUrl, {
                ...finalOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Vérifier si la réponse est OK
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;

        } catch (error) {
            console.error(`Erreur API (${retryCount} tentatives restantes):`, error);

            // Retry automatique pour certaines erreurs
            if (retryCount > 0 && this.shouldRetry(error)) {
                console.log(`Retry dans ${API_CONFIG.RETRY_DELAY}ms...`);
                await this.delay(API_CONFIG.RETRY_DELAY);
                return this.request(url, options, retryCount - 1);
            }

            throw error;
        }
    }

    /**
     * Détermine si une erreur doit déclencher un retry
     * @param {Error} error - Erreur à analyser
     * @returns {boolean} True si retry nécessaire
     */
    shouldRetry(error) {
        // Retry pour les erreurs réseau et timeouts
        return error.name === 'AbortError' || 
               error.message.includes('fetch') ||
               error.message.includes('network') ||
               error.message.includes('timeout');
    }

    /**
     * Utilitaire pour créer un délai
     * @param {number} ms - Délai en millisecondes
     * @returns {Promise} Promise qui se résout après le délai
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Requête GET
     * @param {string} url - URL de la requête
     * @param {Object} params - Paramètres de requête
     * @returns {Promise<Object>} Données de la réponse
     */
    async get(url, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const finalUrl = queryString ? `${url}?${queryString}` : url;
        
        const response = await this.request(finalUrl);
        return response.json();
    }

    /**
     * Requête POST
     * @param {string} url - URL de la requête
     * @param {Object} data - Données à envoyer
     * @returns {Promise<Object>} Données de la réponse
     */
    async post(url, data = {}) {
        const response = await this.request(url, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response.json();
    }

    /**
     * Requête PUT
     * @param {string} url - URL de la requête
     * @param {Object} data - Données à envoyer
     * @returns {Promise<Object>} Données de la réponse
     */
    async put(url, data = {}) {
        const response = await this.request(url, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        return response.json();
    }
}

// Instance globale du client API
const apiClient = new ApiClient();

// ====================================
// SERVICES API
// ====================================

/**
 * Service pour les données publiques (staff, formations, health)
 */
class PublicDataService {
    /**
     * Vérifie la santé de l'API
     * @returns {Promise<Object>} Status de l'API
     */
    static async checkHealth() {
        try {
            const response = await apiClient.get('/visitors/public/health');
            return response;
        } catch (error) {
            console.warn('Health check failed, using demo mode:', error);
            if (API_CONFIG.DEMO_MODE) {
                return {
                    status: 'demo',
                    timestamp: new Date().toISOString(),
                    version: '1.0.0-demo'
                };
            }
            throw new Error('API non disponible');
        }
    }

    /**
     * Récupère la liste du personnel actif
     * @param {boolean} useCache - Utiliser le cache si disponible
     * @returns {Promise<Array>} Liste du personnel
     */
    static async getStaff(useCache = true) {
        const cacheKey = 'staff_list';
        
        // Vérifier le cache
        if (useCache) {
            const cached = apiCache.get(cacheKey);
            if (cached) {
                console.log('Staff récupéré du cache');
                return cached;
            }
        }

        try {
            const response = await apiClient.get('/visitors/public/staff');
            
            // Stocker en cache
            apiCache.set(cacheKey, response.staff);
            
            return response.staff;
        } catch (error) {
            console.warn('Erreur lors de la récupération du personnel, utilisation des données de test:', error);
            if (API_CONFIG.DEMO_MODE) {
                // Stocker les données de test en cache
                apiCache.set(cacheKey, DEMO_DATA.staff);
                return DEMO_DATA.staff;
            }
            throw new Error('Impossible de charger la liste du personnel');
        }
    }

    /**
     * Récupère la liste des formations actives
     * @param {boolean} useCache - Utiliser le cache si disponible
     * @returns {Promise<Array>} Liste des formations
     */
    static async getFormations(useCache = true) {
        const cacheKey = 'formations_list';
        
        // Vérifier le cache
        if (useCache) {
            const cached = apiCache.get(cacheKey);
            if (cached) {
                console.log('Formations récupérées du cache');
                return cached;
            }
        }

        try {
            const response = await apiClient.get('/visitors/public/formations');
            
            // Stocker en cache
            apiCache.set(cacheKey, response.formations);
            
            return response.formations;
        } catch (error) {
            console.warn('Erreur lors de la récupération des formations:', error);
            
            // En cas d'erreur, retourner un tableau vide plutôt que de lever une exception
            // Cela permet au frontend de fonctionner même si les formations ne sont pas disponibles
            const emptyFormations = [];
            
            if (API_CONFIG.DEMO_MODE) {
                // En mode démo, utiliser les données de test
                apiCache.set(cacheKey, DEMO_DATA.formations);
                return DEMO_DATA.formations;
            } else {
                // En mode normal, retourner un tableau vide avec un avertissement
                console.warn('Les formations ne sont pas disponibles - le formulaire fonctionnera sans les formations');
                apiCache.set(cacheKey, emptyFormations, 30000); // Cache plus court pour retry
                return emptyFormations;
            }
        }
    }

    /**
     * Charge toutes les données publiques en parallèle
     * @returns {Promise<Object>} Objet contenant staff et formations
     */
    static async loadAllPublicData() {
        try {
            const [staff, formations] = await Promise.all([
                this.getStaff(),
                this.getFormations()
            ]);

            return { staff, formations };
        } catch (error) {
            console.error('Erreur lors du chargement des données publiques:', error);
            throw error;
        }
    }
}

/**
 * Service pour la gestion des visiteurs
 */
class VisitorService {
    /**
     * Enregistre une re-entrée pour un visiteur avec un ID existant
     * @param {Object} reentryData - Données de re-entrée {visitorId, visitReason, staffId?, formationId?}
     * @returns {Promise<Object>} Données de la re-entrée
     */
    static async reenterVisitor(reentryData) {
        try {
            const { visitorId, visitReason, staffId, formationId } = reentryData;
            
            console.log('🔄 Début re-entrée du visiteur:', { visitorId, visitReason, staffId, formationId });
            
            // Endpoint pour la re-entrée
            const endpoint = `/visitors/${visitorId}/reentry`;
            const payload = {
                visitReason,
                staffId: staffId ? parseInt(staffId) : undefined,
                formationId: formationId ? parseInt(formationId) : undefined
            };
            
            console.log('📡 Appel API:', { endpoint, payload });
            
            const response = await apiClient.post(endpoint, payload);
            
            console.log('✅ Re-entrée enregistrée avec succès:', response);
            
            return response;
        } catch (error) {
            console.error('Erreur lors de la re-entrée:', error);
            
            if (API_CONFIG.DEMO_MODE) {
                // Simuler la re-entrée en mode démo
                const demoReentry = {
                    id: Math.floor(Math.random() * 1000),
                    uniqueId: reentryData.visitorId,
                    visitReason: reentryData.visitReason,
                    staffId: reentryData.staffId ? parseInt(reentryData.staffId) : null,
                    formationId: reentryData.formationId ? parseInt(reentryData.formationId) : null,
                    status: 'INSIDE',
                    checkInTime: new Date().toISOString(),
                    checkOutTime: null,
                    updatedAt: new Date().toISOString(),
                    isReentry: true
                };
                
                // Ajouter les informations du staff ou formation
                if (reentryData.staffId) {
                    demoReentry.staff = DEMO_DATA.staff.find(s => s.id === parseInt(reentryData.staffId));
                }
                if (reentryData.formationId) {
                    demoReentry.formation = DEMO_DATA.formations.find(f => f.id === parseInt(reentryData.formationId));
                }
                
                console.log('Re-entrée simulée en mode démo:', demoReentry);
                
                return {
                    message: 'Visitor re-entry successful (demo mode)',
                    visitor: demoReentry
                };
            }
            
            // Gestion des erreurs spécifiques du backend réel
            if (error.message.includes('404') || error.status === 404) {
                throw new Error('ID de visiteur non trouvé. Vérifiez votre ID de badge.');
            } else if (error.message.includes('400') || error.status === 400) {
                throw new Error('Données invalides. Vérifiez vos informations.');
            } else if (error.message.includes('déjà présent') || error.message.includes('already inside')) {
                throw new Error('Ce visiteur est déjà enregistré comme présent dans le bâtiment.');
            } else if (error.message.includes('Network Error') || error.name === 'NetworkError') {
                throw new Error('Problème de connexion réseau. Vérifiez votre connexion.');
            }
            
            throw new Error(`Erreur lors de la re-entrée: ${error.message || 'Veuillez réessayer.'}`);
        }
    }

    /**
     * Enregistre un nouveau visiteur
     * @param {Object} visitorData - Données du visiteur
     * @returns {Promise<Object>} Données du visiteur créé
     */
    static async registerVisitor(visitorData) {
        try {
            // Nettoyer les données avant envoi
            const cleanData = this.cleanVisitorData(visitorData);
            
            console.log('Enregistrement du visiteur:', cleanData);
            
            const response = await apiClient.post('/visitors', cleanData);
            
            console.log('Visiteur enregistré avec succès:', response);
            
            return response;
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement:', error);
            
            if (API_CONFIG.DEMO_MODE) {
                // Simuler l'enregistrement avec des données de test
                const cleanData = this.cleanVisitorData(visitorData);
                const demoVisitor = {
                    id: Math.floor(Math.random() * 1000),
                    uniqueId: 'demo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    firstName: cleanData.firstName,
                    lastName: cleanData.lastName,
                    email: cleanData.email,
                    phone: cleanData.phone,
                    company: cleanData.company,
                    visitReason: cleanData.visitReason,
                    staffId: cleanData.staffId,
                    formationId: cleanData.formationId,
                    status: 'INSIDE',
                    checkInTime: new Date().toISOString(),
                    checkOutTime: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Ajouter les informations du staff ou formation
                if (cleanData.staffId) {
                    demoVisitor.staff = DEMO_DATA.staff.find(s => s.id === cleanData.staffId);
                }
                if (cleanData.formationId) {
                    demoVisitor.formation = DEMO_DATA.formations.find(f => f.id === cleanData.formationId);
                }
                
                console.log('Visiteur enregistré en mode démo:', demoVisitor);
                
                return {
                    message: 'Visitor registered successfully (demo mode)',
                    visitor: demoVisitor
                };
            }
            
            // Gestion des erreurs spécifiques du backend réel
            if (error.message.includes('429') || error.status === 429) {
                throw new Error('Trop de tentatives d\'enregistrement. Veuillez patienter quelques minutes.');
            } else if (error.message.includes('400') || error.status === 400) {
                throw new Error('Données invalides. Veuillez vérifier vos informations.');
            } else if (error.message.includes('404') || error.status === 404) {
                throw new Error('Service non disponible. Veuillez réessayer plus tard.');
            } else if (error.message.includes('déjà enregistré')) {
                throw new Error('Un visiteur avec cet email est déjà présent dans le bâtiment.');
            } else if (error.message.includes('Network Error') || error.name === 'NetworkError') {
                throw new Error('Problème de connexion réseau. Vérifiez votre connexion.');
            }
            
            throw new Error(`Erreur lors de l'enregistrement: ${error.message || 'Veuillez réessayer.'}`);
        }
    }

    /**
     * Déclare la sortie d'un visiteur
     * @param {string} visitorId - ID unique du visiteur
     * @returns {Promise<Object>} Données de la sortie
     */
    static async checkoutVisitor(uniqueId) {
        try {
            console.log('Checkout du visiteur avec uniqueId:', uniqueId);
            
            const response = await apiClient.post(`/visitors/checkout/unique/${uniqueId}`);
            
            console.log('Sortie enregistrée avec succès:', response);
            
            return response;
        } catch (error) {
            console.error('Erreur lors de la sortie:', error);
            
            if (API_CONFIG.DEMO_MODE) {
                // Simuler la sortie avec des données de test
                if (uniqueId.startsWith('demo_') || uniqueId.startsWith('clx')) {
                    const demoVisitor = {
                        id: Math.floor(Math.random() * 1000),
                        uniqueId: uniqueId,
                        firstName: 'Demo',
                        lastName: 'User',
                        email: 'demo@example.com',
                        phone: '+32123456789',
                        company: 'Demo Company',
                        visitReason: 'OTHER',
                        status: 'OUTSIDE',
                        checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
                        checkOutTime: new Date().toISOString(),
                        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                        updatedAt: new Date().toISOString()
                    };
                    
                    console.log('Visiteur sorti en mode démo:', demoVisitor);
                    
                    return {
                        message: 'Visitor checked out successfully (demo mode)',
                        visitor: demoVisitor
                    };
                } else {
                    throw new Error('ID de visite non trouvé en mode démo. Utilisez un ID généré par l\'application.');
                }
            }
            
            // Gestion des erreurs spécifiques du backend réel
            if (error.message.includes('404') || error.status === 404) {
                throw new Error('ID de visite non trouvé. Vérifiez votre ID.');
            } else if (error.message.includes('déjà sorti') || error.message.includes('already checked out')) {
                throw new Error('Ce visiteur a déjà déclaré sa sortie.');
            } else if (error.message.includes('400') || error.status === 400) {
                throw new Error('ID de visite invalide. Vérifiez le format de votre ID.');
            } else if (error.message.includes('Network Error') || error.name === 'NetworkError') {
                throw new Error('Problème de connexion réseau. Vérifiez votre connexion.');
            }
            
            throw new Error(`Erreur lors de la sortie: ${error.message || 'Veuillez réessayer.'}`);
        }
    }

    /**
     * Nettoie les données du visiteur avant envoi
     * @param {Object} data - Données brutes du formulaire
     * @returns {Object} Données nettoyées
     */
    static cleanVisitorData(data) {
        const cleaned = {
            firstName: data.firstName?.trim(),
            lastName: data.lastName?.trim(),
            email: data.email?.trim().toLowerCase(),
            visitReason: data.visitReason
        };

        // Ajouter les champs optionnels s'ils existent
        if (data.phone?.trim()) {
            cleaned.phone = data.phone.trim();
        }
        
        if (data.company?.trim()) {
            cleaned.company = data.company.trim();
        }

        // Ajouter staffId ou formationId selon le type de visite
        if (data.visitReason === 'MEETING' && data.staffId) {
            cleaned.staffId = parseInt(data.staffId);
        } else if (data.visitReason === 'FORMATION' && data.formationId) {
            cleaned.formationId = parseInt(data.formationId);
        }

        return cleaned;
    }
}

// ====================================
// EXPORT DES SERVICES
// ====================================

// Rendre les services disponibles globalement
window.PublicDataService = PublicDataService;
window.VisitorService = VisitorService;
window.apiCache = apiCache;
window.API_CONFIG = API_CONFIG;
window.CONFIG = API_CONFIG; // Ajouter CONFIG pour compatibilité

console.log('🚀 Services API GooseCorp initialisés'); 