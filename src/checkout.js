/**
 * Script pour la page de sortie des visiteurs
 * 
 * Ce fichier gère :
 * - Validation de l'ID de visite
 * - Soumission du checkout
 * - Affichage des résultats de sortie
 * - Calcul de la durée de visite
 */

// ====================================
// VARIABLES GLOBALES
// ====================================

let isFormSubmitting = false;

// ====================================
// INITIALISATION DE LA PAGE
// ====================================

/**
 * Initialise la page de sortie
 */
async function initializeCheckoutPage() {
    console.log('🚀 Initialisation de la page de sortie');
    
    try {
        // Afficher le statut de connexion API
        showApiStatus('Vérification de la connexion...', 'loading');
        
        // Vérifier la santé de l'API
        await checkApiHealth();
        
        // Configurer les événements du formulaire
        setupFormEvents();
        
        // Masquer le statut API
        hideApiStatus();
        
        // Focus sur le champ ID
        const visitorIdField = document.getElementById('visitorId');
        if (visitorIdField) {
            visitorIdField.focus();
        }
        
        console.log('✅ Page de sortie initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showApiStatus('Erreur de connexion à l\'API', 'error');
        ErrorHandler.handleApiError(error, 'Initialisation');
    }
}

/**
 * Vérifie la santé de l'API
 */
async function checkApiHealth() {
    try {
        const healthStatus = await PublicDataService.checkHealth();
        console.log('✅ API disponible:', healthStatus);
    } catch (error) {
        console.warn('⚠️ Health check échoué, mais on continue');
        // On continue même si le health check échoue
    }
}

// ====================================
// GESTION DU FORMULAIRE
// ====================================

/**
 * Configure les événements du formulaire
 */
function setupFormEvents() {
    const form = document.getElementById('checkoutForm');
    const visitorIdField = document.getElementById('visitorId');
    
    if (!form || !visitorIdField) return;
    
    // Événement de soumission du formulaire
    form.addEventListener('submit', handleFormSubmit);
    
    // Validation en temps réel
    setupRealtimeValidation();
    
    // Nettoyage automatique de l'ID (suppression des espaces)
    visitorIdField.addEventListener('input', handleVisitorIdInput);
}

/**
 * Gère la saisie de l'ID visiteur
 */
function handleVisitorIdInput() {
    const field = document.getElementById('visitorId');
    if (field) {
        // Supprimer les espaces et caractères indésirables
        field.value = field.value.trim().replace(/\s+/g, '');
        
        // Effacer l'erreur si l'utilisateur tape
        clearFieldError('visitorId');
    }
}

/**
 * Configure la validation en temps réel
 */
function setupRealtimeValidation() {
    const visitorIdField = document.getElementById('visitorId');
    
    if (visitorIdField) {
        visitorIdField.addEventListener('blur', () => validateVisitorId());
        visitorIdField.addEventListener('input', () => clearFieldError('visitorId'));
    }
}

/**
 * Valide l'ID visiteur
 */
function validateVisitorId() {
    const field = document.getElementById('visitorId');
    if (!field) return;
    
    const validation = FormValidator.validateVisitorId(field.value);
    
    if (!validation.valid) {
        FormValidator.displayErrors({ visitorId: validation.message });
    }
}

/**
 * Efface l'erreur d'un champ spécifique
 * @param {string} fieldName - Nom du champ
 */
function clearFieldError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const fieldElement = document.getElementById(fieldName);
    
    if (errorElement && fieldElement) {
        errorElement.textContent = '';
        fieldElement.parentElement.classList.remove('has-error');
    }
}

/**
 * Gère la soumission du formulaire
 * @param {Event} event - Événement de soumission
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Éviter les soumissions multiples
    if (isFormSubmitting) return;
    
    console.log('📝 Soumission du formulaire de sortie');
    
    try {
        // Marquer comme en cours de soumission
        isFormSubmitting = true;
        DOMUtils.toggleButton('#submitBtn', false);
        
        // Récupérer les données du formulaire
        const formData = DOMUtils.getFormData('#checkoutForm');
        
        // Valider les données
        const validationErrors = validateFormData(formData);
        if (Object.keys(validationErrors).length > 0) {
            ErrorHandler.handleValidationErrors(validationErrors);
            return;
        }
        
        // Effectuer le checkout
        const result = await VisitorService.checkoutVisitor(formData.visitorId);
        
        // Afficher le résultat
        displaySuccessResult(result.visitor);
        
        // Notification de succès
        notifications.success(`Au revoir ${result.visitor.firstName} ${result.visitor.lastName} !`);
        
        console.log('✅ Sortie enregistrée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de la sortie:', error);
        ErrorHandler.handleApiError(error, 'Sortie');
    } finally {
        // Réactiver le bouton
        isFormSubmitting = false;
        DOMUtils.toggleButton('#submitBtn', true);
    }
}

/**
 * Valide les données du formulaire
 * @param {Object} data - Données du formulaire
 * @returns {Object} Objet des erreurs de validation
 */
function validateFormData(data) {
    const errors = {};
    
    // Validation de l'ID visiteur
    const visitorIdValidation = FormValidator.validateVisitorId(data.visitorId);
    if (!visitorIdValidation.valid) {
        errors.visitorId = visitorIdValidation.message;
    }
    
    return errors;
}

// ====================================
// AFFICHAGE DES RÉSULTATS
// ====================================

/**
 * Affiche le résultat de la sortie réussie
 * @param {Object} visitor - Données du visiteur avec checkout
 */
function displaySuccessResult(visitor) {
    // Masquer le formulaire
    DOMUtils.toggleElement('#checkoutForm', false);
    DOMUtils.toggleElement('.form-container h1', false);
    DOMUtils.toggleElement('.form-container .subtitle', false);
    DOMUtils.toggleElement('.help-section', false);
    
    // Afficher le résultat
    DOMUtils.toggleElement('#successResult', true);
    
    // Remplir les informations
    DOMUtils.updateContent('#resultName', `${visitor.firstName} ${visitor.lastName}`);
    DOMUtils.updateContent('#resultEmail', visitor.email);
    DOMUtils.updateContent('#resultCheckinTime', DateFormatter.formatDateTime(visitor.checkInTime));
    DOMUtils.updateContent('#resultCheckoutTime', DateFormatter.formatDateTime(visitor.checkOutTime));
    
    // Calculer et afficher la durée de visite
    const duration = DateFormatter.calculateDuration(visitor.checkInTime, visitor.checkOutTime);
    DOMUtils.updateContent('#resultDuration', duration);
    
    // Faire défiler vers le résultat
    document.getElementById('successResult').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Remet le formulaire à zéro pour une nouvelle sortie
 */
function resetForm() {
    // Masquer le résultat
    DOMUtils.toggleElement('#successResult', false);
    
    // Afficher le formulaire et les sections
    DOMUtils.toggleElement('#checkoutForm', true);
    DOMUtils.toggleElement('.form-container h1', true);
    DOMUtils.toggleElement('.form-container .subtitle', true);
    DOMUtils.toggleElement('.help-section', true);
    
    // Remettre à zéro le formulaire
    DOMUtils.resetForm('#checkoutForm');
    
    // Focus sur le champ ID
    const visitorIdField = document.getElementById('visitorId');
    if (visitorIdField) {
        visitorIdField.focus();
    }
    
    // Faire défiler vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====================================
// GESTION DU STATUT API
// ====================================

/**
 * Affiche le statut de l'API
 * @param {string} message - Message à afficher
 * @param {string} type - Type de statut (loading, error, success)
 */
function showApiStatus(message, type = 'loading') {
    const statusElement = document.getElementById('apiStatus');
    if (!statusElement) return;
    
    statusElement.className = `api-status ${type}`;
    statusElement.querySelector('span').textContent = message;
    
    // Changer l'icône selon le type
    const icon = statusElement.querySelector('i');
    if (type === 'loading') {
        icon.className = 'fas fa-spinner fa-spin';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-triangle';
    } else if (type === 'success') {
        icon.className = 'fas fa-check-circle';
    }
    
    DOMUtils.toggleElement(statusElement, true);
}

/**
 * Masque le statut de l'API
 */
function hideApiStatus() {
    DOMUtils.toggleElement('#apiStatus', false);
}

// ====================================
// UTILITAIRES SPÉCIFIQUES AU CHECKOUT
// ====================================

/**
 * Vérifie si un ID visiteur a un format valide
 * @param {string} visitorId - ID à vérifier
 * @returns {boolean} True si le format semble valide
 */
function isValidVisitorIdFormat(visitorId) {
    // Format attendu : clx suivi de caractères alphanumériques
    const idPattern = /^clx[a-zA-Z0-9]{10,}$/;
    return idPattern.test(visitorId);
}

/**
 * Suggère des corrections pour un ID visiteur mal formaté
 * @param {string} visitorId - ID mal formaté
 * @returns {string} Suggestion de correction
 */
function suggestIdCorrection(visitorId) {
    if (!visitorId) return '';
    
    // Supprimer les espaces et caractères spéciaux
    let cleaned = visitorId.replace(/[^a-zA-Z0-9]/g, '');
    
    // Ajouter le préfixe clx s'il manque
    if (!cleaned.startsWith('clx')) {
        cleaned = 'clx' + cleaned;
    }
    
    return cleaned;
}

// ====================================
// GESTION DES RACCOURCIS CLAVIER
// ====================================

/**
 * Configure les raccourcis clavier pour améliorer l'UX
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
        // Ctrl/Cmd + Enter pour soumettre le formulaire
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            const form = document.getElementById('checkoutForm');
            if (form && !isFormSubmitting) {
                form.dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape pour réinitialiser le formulaire si on est sur la page de résultat
        if (event.key === 'Escape') {
            const successResult = document.getElementById('successResult');
            if (successResult && !successResult.classList.contains('hidden')) {
                resetForm();
            }
        }
    });
}

// ====================================
// INITIALISATION AU CHARGEMENT
// ====================================

// Initialiser la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
    initializeCheckoutPage();
    setupKeyboardShortcuts();
});

// Rendre les fonctions disponibles globalement pour les événements inline
window.resetForm = resetForm;

console.log('🚪 Script checkout.js chargé'); 