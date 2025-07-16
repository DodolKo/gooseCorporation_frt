/**
 * Script pour la page d'entrée des visiteurs
 * 
 * Ce fichier gère :
 * - Chargement des données publiques (staff, formations)
 * - Gestion du formulaire d'inscription
 * - Validation côté client
 * - Affichage conditionnel des champs
 * - Soumission et affichage des résultats
 */

// ====================================
// VARIABLES GLOBALES
// ====================================

let staffData = [];
let formationsData = [];
let isFormSubmitting = false;

// ====================================
// INITIALISATION DE LA PAGE
// ====================================

/**
 * Initialise la page d'entrée
 */
async function initializeCheckinPage() {
    console.log('🚀 Initialisation de la page d\'entrée');
    
    try {
        // Afficher le statut de connexion API
        showApiStatus('Connexion à l\'API...', 'loading');
        
        // Vérifier la santé de l'API
        await checkApiHealth();
        
        // Charger les données publiques
        await loadPublicData();
        
        // Configurer les événements du formulaire
        setupFormEvents();
        
        // Masquer le statut API
        hideApiStatus();
        
        console.log('✅ Page d\'entrée initialisée avec succès');
        
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

/**
 * Charge les données publiques (staff et formations)
 */
async function loadPublicData() {
    try {
        console.log('📥 Chargement des données publiques...');
        
        // Charger les données en parallèle
        const { staff, formations } = await PublicDataService.loadAllPublicData();
        
        // Stocker les données
        staffData = staff || [];
        formationsData = formations || [];
        
        console.log(`✅ ${staffData.length} membres du personnel chargés`);
        console.log(`✅ ${formationsData.length} formations chargées`);
        
        // Peupler les listes déroulantes
        populateStaffSelect();
        populateFormationsSelect();
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        
        // Afficher des messages d'erreur dans les selects
        populateStaffSelect(true);
        populateFormationsSelect(true);
        
        throw error;
    }
}

/**
 * Peuple la liste déroulante du personnel
 * @param {boolean} hasError - Indique si une erreur s'est produite
 */
function populateStaffSelect(hasError = false) {
    const staffSelect = document.getElementById('staffId');
    if (!staffSelect) return;
    
    if (hasError) {
        staffSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        return;
    }
    
    // Créer les options pour le personnel
    const staffOptions = staffData.map(staff => ({
        value: staff.id,
        text: `${staff.firstName} ${staff.lastName} - ${staff.department || 'N/A'}`
    }));
    
    DOMUtils.populateSelect(staffSelect, staffOptions, 'Sélectionnez un membre du personnel');
}

/**
 * Peuple la liste déroulante des formations
 * @param {boolean} hasError - Indique si une erreur s'est produite
 */
function populateFormationsSelect(hasError = false) {
    const formationsSelect = document.getElementById('formationId');
    if (!formationsSelect) return;
    
    if (hasError) {
        formationsSelect.innerHTML = '<option value="">Erreur de chargement</option>';
        return;
    }
    
    // Créer les options pour les formations
    const formationOptions = formationsData.map(formation => {
        const startDate = DateFormatter.formatDateTime(formation.startDate);
        return {
            value: formation.id,
            text: `${formation.name} - ${startDate} (${formation.location || 'Lieu TBD'})`
        };
    });
    
    DOMUtils.populateSelect(formationsSelect, formationOptions, 'Sélectionnez une formation');
}

// ====================================
// GESTION DU FORMULAIRE
// ====================================

/**
 * Configure les événements du formulaire
 */
function setupFormEvents() {
    const form = document.getElementById('checkinForm');
    const visitReasonSelect = document.getElementById('visitReason');
    
    if (!form || !visitReasonSelect) return;
    
    // Événement de changement pour la raison de visite
    visitReasonSelect.addEventListener('change', handleVisitReasonChange);
    
    // Événement de soumission du formulaire
    form.addEventListener('submit', handleFormSubmit);
    
    // Validation en temps réel
    setupRealtimeValidation();
}

/**
 * Gère le changement de raison de visite
 */
function handleVisitReasonChange() {
    const visitReason = document.getElementById('visitReason').value;
    const staffGroup = document.getElementById('staffGroup');
    const formationGroup = document.getElementById('formationGroup');
    
    // Masquer tous les groupes par défaut
    DOMUtils.toggleElement(staffGroup, false);
    DOMUtils.toggleElement(formationGroup, false);
    
    // Afficher le groupe approprié
    if (visitReason === 'MEETING') {
        DOMUtils.toggleElement(staffGroup, true);
        document.getElementById('staffId').required = true;
        document.getElementById('formationId').required = false;
    } else if (visitReason === 'FORMATION') {
        DOMUtils.toggleElement(formationGroup, true);
        document.getElementById('formationId').required = true;
        document.getElementById('staffId').required = false;
    } else {
        // Pour les autres raisons, aucun champ supplémentaire requis
        document.getElementById('staffId').required = false;
        document.getElementById('formationId').required = false;
    }
    
    // Effacer les erreurs des champs masqués
    FormValidator.clearErrors();
}

/**
 * Configure la validation en temps réel
 */
function setupRealtimeValidation() {
    const fields = ['firstName', 'lastName', 'email', 'phone'];
    
    fields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldName));
            field.addEventListener('input', () => clearFieldError(fieldName));
        }
    });
}

/**
 * Valide un champ spécifique
 * @param {string} fieldName - Nom du champ à valider
 */
function validateField(fieldName) {
    const field = document.getElementById(fieldName);
    if (!field) return;
    
    const value = field.value;
    let validation;
    
    switch (fieldName) {
        case 'firstName':
            validation = FormValidator.validateName(value, 'prénom');
            break;
        case 'lastName':
            validation = FormValidator.validateName(value, 'nom');
            break;
        case 'email':
            validation = FormValidator.validateEmail(value);
            break;
        case 'phone':
            validation = FormValidator.validatePhone(value);
            break;
        default:
            return;
    }
    
    if (!validation.valid) {
        FormValidator.displayErrors({ [fieldName]: validation.message });
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
    
    console.log('📝 Soumission du formulaire d\'entrée');
    
    try {
        // Marquer comme en cours de soumission
        isFormSubmitting = true;
        DOMUtils.toggleButton('#submitBtn', false);
        
        // Récupérer les données du formulaire
        const formData = DOMUtils.getFormData('#checkinForm');
        
        // Valider les données
        const validationErrors = validateFormData(formData);
        if (Object.keys(validationErrors).length > 0) {
            ErrorHandler.handleValidationErrors(validationErrors);
            return;
        }
        
        // Enregistrer le visiteur
        const result = await VisitorService.registerVisitor(formData);
        
        // Afficher le résultat
        displaySuccessResult(result.visitor);
        
        // Notification de succès
        notifications.success(`Bienvenue ${result.visitor.firstName} ${result.visitor.lastName} !`);
        
        console.log('✅ Visiteur enregistré avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement:', error);
        ErrorHandler.handleApiError(error, 'Enregistrement');
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
    
    // Validation du prénom
    const firstNameValidation = FormValidator.validateName(data.firstName, 'prénom');
    if (!firstNameValidation.valid) {
        errors.firstName = firstNameValidation.message;
    }
    
    // Validation du nom
    const lastNameValidation = FormValidator.validateName(data.lastName, 'nom');
    if (!lastNameValidation.valid) {
        errors.lastName = lastNameValidation.message;
    }
    
    // Validation de l'email
    const emailValidation = FormValidator.validateEmail(data.email);
    if (!emailValidation.valid) {
        errors.email = emailValidation.message;
    }
    
    // Validation du téléphone (optionnel)
    const phoneValidation = FormValidator.validatePhone(data.phone);
    if (!phoneValidation.valid) {
        errors.phone = phoneValidation.message;
    }
    
    // Validation de la raison de visite
    const visitReasonValidation = FormValidator.validateRequired(data.visitReason, 'La raison de visite');
    if (!visitReasonValidation.valid) {
        errors.visitReason = visitReasonValidation.message;
    }
    
    // Validation conditionnelle selon la raison de visite
    if (data.visitReason === 'MEETING') {
        const staffValidation = FormValidator.validateRequired(data.staffId, 'Le personnel à rencontrer');
        if (!staffValidation.valid) {
            errors.staffId = staffValidation.message;
        }
    } else if (data.visitReason === 'FORMATION') {
        const formationValidation = FormValidator.validateRequired(data.formationId, 'La formation');
        if (!formationValidation.valid) {
            errors.formationId = formationValidation.message;
        }
    }
    
    return errors;
}

// ====================================
// AFFICHAGE DES RÉSULTATS
// ====================================

/**
 * Affiche le résultat de l'enregistrement réussi
 * @param {Object} visitor - Données du visiteur enregistré
 */
function displaySuccessResult(visitor) {
    // Masquer le formulaire
    DOMUtils.toggleElement('#checkinForm', false);
    DOMUtils.toggleElement('.form-container h1', false);
    DOMUtils.toggleElement('.form-container .subtitle', false);
    
    // Afficher le résultat
    DOMUtils.toggleElement('#successResult', true);
    
    // Remplir les informations
    DOMUtils.updateContent('#resultName', `${visitor.firstName} ${visitor.lastName}`);
    DOMUtils.updateContent('#resultEmail', visitor.email);
    DOMUtils.updateContent('#resultTime', DateFormatter.formatDateTime(visitor.checkInTime));
    DOMUtils.updateContent('#resultId', visitor.uniqueId);
    
    // Afficher la raison de visite
    const visitReasonDisplay = getVisitReasonDisplay(visitor.visitReason, visitor.staff, visitor.formation);
    DOMUtils.updateContent('#resultReason', visitReasonDisplay);
    
    // Générer le QR code avec l'ID unique du visiteur
    generateQRCode(visitor.uniqueId);
    
    // Faire défiler vers le résultat
    document.getElementById('successResult').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Génère un QR code avec l'ID unique du visiteur
 * @param {string} uniqueId - ID unique du visiteur
 */
function generateQRCode(uniqueId) {
    const qrContainer = document.getElementById('qrCodeContainer');
    if (!qrContainer) {
        console.error('❌ Conteneur QR code non trouvé');
        return;
    }
    
    // Vider le conteneur
    qrContainer.innerHTML = '';
    
    try {
        // Vérifier si QRCode est disponible
        if (typeof QRCode === 'undefined') {
            console.error('❌ Bibliothèque QRCode non disponible');
            qrContainer.innerHTML = '<p class="error">⚠️ Impossible de générer le QR code</p>';
            return;
        }
        
        // Créer le QR code avec l'ID unique
        const qrCode = new QRCode(qrContainer, {
            text: uniqueId,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
        
        console.log('✅ QR code généré avec succès pour l\'ID:', uniqueId);
        
    } catch (error) {
        console.error('❌ Erreur lors de la génération du QR code:', error);
        qrContainer.innerHTML = '<p class="error">⚠️ Erreur lors de la génération du QR code</p>';
    }
}

/**
 * Formate l'affichage de la raison de visite
 * @param {string} visitReason - Raison de la visite
 * @param {Object} staff - Données du personnel (si applicable)
 * @param {Object} formation - Données de la formation (si applicable)
 * @returns {string} Raison formatée
 */
function getVisitReasonDisplay(visitReason, staff, formation) {
    const reasons = {
        'MEETING': 'Rendez-vous',
        'FORMATION': 'Formation',
        'DELIVERY': 'Livraison', 
        'MAINTENANCE': 'Maintenance',
        'OTHER': 'Autre'
    };
    
    let display = reasons[visitReason] || visitReason;
    
    // Ajouter les détails si disponibles
    if (visitReason === 'MEETING' && staff) {
        display += ` avec ${staff.firstName} ${staff.lastName}`;
        if (staff.department) {
            display += ` (${staff.department})`;
        }
    } else if (visitReason === 'FORMATION' && formation) {
        display += ` : ${formation.name}`;
        if (formation.location) {
            display += ` - ${formation.location}`;
        }
    }
    
    return display;
}

/**
 * Remet le formulaire à zéro pour un nouvel enregistrement
 */
function resetForm() {
    // Masquer le résultat
    DOMUtils.toggleElement('#successResult', false);
    
    // Afficher le formulaire
    DOMUtils.toggleElement('#checkinForm', true);
    DOMUtils.toggleElement('.form-container h1', true);
    DOMUtils.toggleElement('.form-container .subtitle', true);
    
    // Remettre à zéro le formulaire
    DOMUtils.resetForm('#checkinForm');
    
    // Masquer les groupes conditionnels
    DOMUtils.toggleElement('#staffGroup', false);
    DOMUtils.toggleElement('#formationGroup', false);
    
    // Réinitialiser les champs requis
    document.getElementById('staffId').required = false;
    document.getElementById('formationId').required = false;
    
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
// INITIALISATION AU CHARGEMENT
// ====================================

// Initialiser la page quand le DOM est chargé
document.addEventListener('DOMContentLoaded', initializeCheckinPage);

// Rendre les fonctions disponibles globalement pour les événements inline
window.resetForm = resetForm;

console.log('📝 Script checkin.js chargé'); 