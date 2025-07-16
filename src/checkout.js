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
    form.addEventListener('submit', handleCheckoutFormSubmit);
    
    // Validation en temps réel
    setupRealtimeValidation();
    
    // Nettoyage automatique de l'ID (suppression des espaces)
    visitorIdField.addEventListener('input', handleVisitorIdInput);
    
    // Vérification du statut du visiteur
    handleVisitorIdCheck();
}

/**
 * Vérifie le statut d'un visiteur avant le checkout
 * @param {string} uniqueId - ID unique du visiteur à vérifier
 * @returns {Object} Statut du visiteur
 */
async function checkVisitorStatusForCheckout(uniqueId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/visitors/${uniqueId}/status`);
        
        if (response.status === 404) {
            return { exists: false, error: 'Visiteur non trouvé' };
        }
        
        if (!response.ok) {
            throw new Error('Erreur lors de la vérification du statut');
        }
        
        const data = await response.json();
        return {
            exists: true,
            visitor: data,
            canCheckout: data.status === 'INSIDE'
        };
        
    } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        return { exists: false, error: 'Erreur de connexion' };
    }
}

/**
 * Affiche les informations du visiteur avant le checkout
 * @param {Object} visitor - Données du visiteur
 */
function displayVisitorInfoForCheckout(visitor) {
    const container = document.getElementById('visitorInfoContainer') || createVisitorInfoContainer();
    
    // Calculer la durée de visite
    let visitDuration = 'Non calculée';
    if (visitor.checkInTime) {
        const checkInTime = new Date(visitor.checkInTime);
        const now = new Date();
        const diffMs = now - checkInTime;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        visitDuration = `${diffHours}h ${diffMinutes}m`;
    }
    
    let statusHtml = `
        <div class="visitor-checkout-info ${visitor.status === 'INSIDE' ? 'status-inside' : 'status-outside'}">
            <div class="info-header">
                <h3><i class="fas fa-user-check"></i> Informations du Visiteur</h3>
                <span class="status-badge status-${visitor.status.toLowerCase()}">
                    ${visitor.status === 'INSIDE' ? 'Dans le bâtiment' : 'Déjà sorti'}
                </span>
            </div>
            <div class="info-content">
                <div class="visitor-details">
                    <p><strong>Nom:</strong> ${visitor.firstName} ${visitor.lastName}</p>
                    <p><strong>Email:</strong> ${visitor.email}</p>
                    <p><strong>ID Visiteur:</strong> ${visitor.uniqueId}</p>
                    <p><strong>Entrée:</strong> ${new Date(visitor.checkInTime).toLocaleString('fr-FR')}</p>
                    ${visitor.checkOutTime ? `<p><strong>Sortie:</strong> ${new Date(visitor.checkOutTime).toLocaleString('fr-FR')}</p>` : ''}
                    <p><strong>Durée de visite:</strong> ${visitDuration}</p>
                </div>
                <div class="status-message">
                    ${visitor.status === 'OUTSIDE' ? 
                        `<div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Attention:</strong> Ce visiteur est déjà sorti du bâtiment.
                            <br>Dernière sortie : ${new Date(visitor.checkOutTime).toLocaleString('fr-FR')}
                        </div>` : 
                        `<div class="alert alert-success">
                            <i class="fas fa-check-circle"></i>
                            <strong>Prêt pour la sortie:</strong> Ce visiteur peut sortir du bâtiment.
                        </div>`
                    }
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML = statusHtml;
    container.classList.remove('hidden');
}

/**
 * Crée le conteneur pour afficher les informations du visiteur
 * @returns {Element} Conteneur créé
 */
function createVisitorInfoContainer() {
    const container = document.createElement('div');
    container.id = 'visitorInfoContainer';
    container.className = 'visitor-info-container';
    
    const form = document.getElementById('checkoutForm');
    const actionsDiv = form.querySelector('.form-actions');
    form.insertBefore(container, actionsDiv);
    
    return container;
}

/**
 * Gère la vérification du statut lors de la saisie de l'ID
 */
function handleVisitorIdCheck() {
    const visitorIdField = document.getElementById('visitorId');
    let checkTimeout;
    
    visitorIdField.addEventListener('input', () => {
        const infoContainer = document.getElementById('visitorInfoContainer');
        if (infoContainer) {
            infoContainer.classList.add('hidden');
        }
        
        clearTimeout(checkTimeout);
        
        const uniqueId = visitorIdField.value.trim();
        if (uniqueId.length >= 10) { // Minimum length for a valid unique ID
            checkTimeout = setTimeout(async () => {
                const status = await checkVisitorStatusForCheckout(uniqueId);
                
                if (status.exists) {
                    displayVisitorInfoForCheckout(status.visitor);
                } else {
                    const infoContainer = document.getElementById('visitorInfoContainer');
                    if (infoContainer) {
                        infoContainer.innerHTML = `
                            <div class="visitor-checkout-info status-error">
                                <div class="alert alert-danger">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    <strong>Erreur:</strong> ${status.error || 'Visiteur non trouvé'}
                                </div>
                            </div>
                        `;
                        infoContainer.classList.remove('hidden');
                    }
                }
            }, 1000); // Attendre 1 seconde après la saisie
        }
    });
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
 * Gère la soumission du formulaire de checkout
 */
async function handleCheckoutFormSubmit(e) {
    e.preventDefault();
    
    // Éviter les soumissions multiples
    if (isFormSubmitting) return;
    
    try {
        isFormSubmitting = true;
        DOMUtils.toggleButton('#submitBtn', false);
        
        // Récupérer les données du formulaire
        const formData = new FormData(e.target);
        const uniqueId = formData.get('visitorId'); // Le champ contient l'uniqueId du visiteur
        
        // Validation de base
        if (!uniqueId || uniqueId.trim().length < 10) {
            notifications.show('Veuillez saisir un ID de visite valide', 'error');
            return;
        }
        
        // Vérifier le statut du visiteur avant de procéder au checkout
        const visitorStatus = await checkVisitorStatusForCheckout(uniqueId);
        
        if (!visitorStatus.exists) {
            notifications.show('Visiteur non trouvé. Veuillez vérifier votre ID.', 'error');
            return;
        }
        
        if (!visitorStatus.canCheckout) {
            notifications.show('Ce visiteur est déjà sorti du bâtiment !', 'warning');
            displayCheckoutAlreadyOut(visitorStatus.visitor);
            return;
        }
        
        // Procéder au checkout via VisitorService (utilise uniqueId)
        const result = await VisitorService.checkoutVisitor(uniqueId);
        
        // VisitorService retourne directement les données ou lance une exception
        displayCheckoutSuccess(result.visitor);
        notifications.show('Sortie enregistrée avec succès !', 'success');
        
    } catch (error) {
        console.error('❌ Erreur lors de la soumission:', error);
        notifications.show(error.message || 'Erreur lors de la sortie', 'error');
    } finally {
        isFormSubmitting = false;
        DOMUtils.toggleButton('#submitBtn', true);
    }
}

/**
 * Soumet la demande de checkout
 */
async function submitCheckout(visitorId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/visitors/${visitorId}/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erreur lors du checkout');
        }
        
        const data = await response.json();
        return { success: true, visitor: data.visitor };
        
    } catch (error) {
        console.error('Erreur lors du checkout:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Affiche le résultat de checkout réussi
 */
function displayCheckoutSuccess(visitor) {
    // Masquer le formulaire
    document.getElementById('checkoutForm').classList.add('hidden');
    
    // Afficher le résultat
    const resultContainer = document.getElementById('successResult');
    resultContainer.classList.remove('hidden');
    
    // Remplir les informations
    document.getElementById('resultName').textContent = `${visitor.firstName} ${visitor.lastName}`;
    document.getElementById('resultEmail').textContent = visitor.email;
    document.getElementById('resultCheckinTime').textContent = new Date(visitor.checkInTime).toLocaleString('fr-FR');
    document.getElementById('resultCheckoutTime').textContent = new Date(visitor.checkOutTime).toLocaleString('fr-FR');
    
    // Calculer et afficher la durée de visite
    const checkInTime = new Date(visitor.checkInTime);
    const checkOutTime = new Date(visitor.checkOutTime);
    const durationMs = checkOutTime - checkInTime;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById('resultDuration').textContent = `${durationHours}h ${durationMinutes}m`;
    
    // Faire défiler vers le résultat
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Affiche un message quand le visiteur est déjà sorti
 */
function displayCheckoutAlreadyOut(visitor) {
    const container = document.getElementById('visitorInfoContainer');
    if (container) {
        container.innerHTML = `
            <div class="visitor-checkout-info status-outside">
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <strong>Visiteur déjà sorti</strong>
                    <br>
                    <strong>${visitor.firstName} ${visitor.lastName}</strong> est déjà sorti du bâtiment.
                    <br>
                    <strong>Sortie :</strong> ${new Date(visitor.checkOutTime).toLocaleString('fr-FR')}
                </div>
            </div>
        `;
        container.classList.remove('hidden');
    }
}

/**
 * Remet le formulaire à zéro
 */
function resetCheckoutForm() {
    // Masquer le résultat
    document.getElementById('successResult').classList.add('hidden');
    
    // Afficher le formulaire
    document.getElementById('checkoutForm').classList.remove('hidden');
    
    // Remettre à zéro le formulaire
    document.getElementById('checkoutForm').reset();
    
    // Masquer les informations du visiteur
    const infoContainer = document.getElementById('visitorInfoContainer');
    if (infoContainer) {
        infoContainer.classList.add('hidden');
    }
    
    // Faire défiler vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Focus sur le champ ID
    document.getElementById('visitorId').focus();
}

// ====================================
// EXPORT DES FONCTIONS GLOBALES
// ====================================

// Rendre les fonctions disponibles globalement
window.initializeCheckoutPage = initializeCheckoutPage;
window.resetCheckoutForm = resetCheckoutForm;
window.handleCheckoutFormSubmit = handleCheckoutFormSubmit;
window.submitCheckout = submitCheckout;
window.displayCheckoutSuccess = displayCheckoutSuccess;
window.displayCheckoutAlreadyOut = displayCheckoutAlreadyOut;
window.checkVisitorStatusForCheckout = checkVisitorStatusForCheckout;
window.displayVisitorInfoForCheckout = displayVisitorInfoForCheckout;

console.log('📝 Script checkout.js chargé');

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
        
        // Effectuer le checkout avec uniqueId
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
    const uniqueIdValidation = FormValidator.validateVisitorId(data.visitorId);
    if (!uniqueIdValidation.valid) {
        errors.visitorId = uniqueIdValidation.message;
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
 * @param {string} uniqueId - ID unique du visiteur à vérifier
 * @returns {boolean} True si le format semble valide
 */
function isValidVisitorIdFormat(uniqueId) {
    // Format attendu : clx suivi de caractères alphanumériques
    const idPattern = /^clx[a-zA-Z0-9]{10,}$/;
    return idPattern.test(uniqueId);
}

/**
 * Suggère des corrections pour un ID visiteur mal formaté
 * @param {string} uniqueId - ID visiteur mal formaté
 * @returns {string} Suggestion de correction
 */
function suggestIdCorrection(uniqueId) {
    if (!uniqueId) return '';
    
    // Supprimer les espaces et caractères spéciaux
    let cleaned = uniqueId.replace(/[^a-zA-Z0-9]/g, '');
    
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