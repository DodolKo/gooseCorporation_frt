/**
 * Logique JavaScript pour la page d'entrée GooseCorp
 * 
 * Gère deux modes :
 * - Nouveau visiteur : Enregistrement complet
 * - Badge existant : Re-entrée avec ID existant
 */

/**
 * Initialise les boutons de choix d'entrée
 */
function initEntryChoice() {
    const newVisitorBtn = document.getElementById('newVisitorBtn');
    const returningVisitorBtn = document.getElementById('returningVisitorBtn');
    const newVisitorForm = document.getElementById('newVisitorForm');
    const returningVisitorForm = document.getElementById('returningVisitorForm');

    // Gestion du clic sur "Nouveau Visiteur"
    newVisitorBtn.addEventListener('click', () => {
        // Activer le bouton nouveau visiteur
        newVisitorBtn.classList.add('active');
        returningVisitorBtn.classList.remove('active');
        
        // Afficher le formulaire nouveau visiteur
        newVisitorForm.classList.remove('hidden');
        returningVisitorForm.classList.add('hidden');
        
        // Reset les formulaires
        resetAllForms();
    });

    // Gestion du clic sur "Déjà un badge"
    returningVisitorBtn.addEventListener('click', () => {
        // Activer le bouton visiteur de retour
        returningVisitorBtn.classList.add('active');
        newVisitorBtn.classList.remove('active');
        
        // Afficher le formulaire visiteur de retour
        returningVisitorForm.classList.remove('hidden');
        newVisitorForm.classList.add('hidden');
        
        // Reset les formulaires
        resetAllForms();
        
        // Charger les données pour le formulaire de retour
        loadReturnFormData();
    });
}

/**
 * Charge les données nécessaires pour le formulaire de re-entrée
 */
async function loadReturnFormData() {
    try {
        const data = await PublicDataService.loadAllPublicData();
        
        // Remplir les select pour staff
        const returnStaffSelect = document.getElementById('returnStaffId');
        returnStaffSelect.innerHTML = '<option value="">Sélectionnez un collaborateur</option>';
        data.staff.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = `${member.firstName} ${member.lastName} - ${member.department}`;
            returnStaffSelect.appendChild(option);
        });

        // Remplir les select pour formations
        const returnFormationSelect = document.getElementById('returnFormationId');
        returnFormationSelect.innerHTML = '<option value="">Sélectionnez une formation</option>';
        data.formations.forEach(formation => {
            const option = document.createElement('option');
            option.value = formation.id;
            option.textContent = `${formation.name} - ${new Date(formation.startDate).toLocaleDateString()}`;
            returnFormationSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Erreur lors du chargement des données pour re-entrée:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

/**
 * Vérifie le statut d'un visiteur avec un badge existant
 * @param {string} visitorId - ID du visiteur à vérifier
 * @returns {Object} Statut du visiteur
 */
async function checkVisitorStatus(visitorId) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/visitors/${visitorId}/status`);
        
        if (response.status === 404) {
            return { exists: false, error: 'Visiteur non trouvé' };
        }
        
        if (!response.ok) {
            throw new Error('Erreur lors de la vérification du statut');
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error);
        return { exists: false, error: 'Erreur de connexion' };
    }
}

/**
 * Affiche le statut actuel d'un visiteur
 * @param {Object} visitor - Données du visiteur
 */
function displayVisitorStatus(visitor) {
    const statusContainer = document.getElementById('visitorStatusContainer') || createStatusContainer();
    
    let statusHtml = `
        <div class="visitor-status ${visitor.status === 'INSIDE' ? 'status-inside' : 'status-outside'}">
            <div class="status-header">
                <h3><i class="fas fa-user-check"></i> Statut du Badge</h3>
                <span class="status-badge status-${visitor.status.toLowerCase()}">
                    ${visitor.status === 'INSIDE' ? 'Dans le bâtiment' : 'Sorti du bâtiment'}
                </span>
            </div>
            <div class="status-content">
                <div class="visitor-info">
                    <p><strong>Nom:</strong> ${visitor.firstName} ${visitor.lastName}</p>
                    <p><strong>Email:</strong> ${visitor.email}</p>
                    <p><strong>ID Badge:</strong> ${visitor.uniqueId}</p>
                    <p><strong>Dernière entrée:</strong> ${new Date(visitor.checkInTime).toLocaleString('fr-FR')}</p>
                    ${visitor.checkOutTime ? `<p><strong>Dernière sortie:</strong> ${new Date(visitor.checkOutTime).toLocaleString('fr-FR')}</p>` : ''}
                    ${visitor.visitDuration ? `<p><strong>Durée de visite actuelle:</strong> ${visitor.visitDuration}</p>` : ''}
                </div>
                <div class="status-actions">
                    ${visitor.status === 'INSIDE' ? 
                        `<p class="status-message inside">
                            <i class="fas fa-info-circle"></i>
                            Ce visiteur est actuellement dans le bâtiment. 
                            Une nouvelle entrée n'est pas nécessaire.
                        </p>` : 
                        `<p class="status-message outside">
                            <i class="fas fa-check-circle"></i>
                            Ce visiteur peut effectuer une nouvelle entrée.
                        </p>`
                    }
                </div>
            </div>
        </div>
    `;
    
    statusContainer.innerHTML = statusHtml;
    statusContainer.classList.remove('hidden');
}

/**
 * Crée le conteneur pour afficher le statut du visiteur
 * @returns {Element} Conteneur créé
 */
function createStatusContainer() {
    const container = document.createElement('div');
    container.id = 'visitorStatusContainer';
    container.className = 'visitor-status-container';
    
    const form = document.getElementById('returningVisitorForm');
    form.insertBefore(container, form.querySelector('.form-actions'));
    
    return container;
}

/**
 * Gère la vérification du statut lors de la saisie de l'ID
 */
function handleVisitorIdCheck() {
    const visitorIdField = document.getElementById('visitorId');
    let checkTimeout;
    
    visitorIdField.addEventListener('input', () => {
        const statusContainer = document.getElementById('visitorStatusContainer');
        if (statusContainer) {
            statusContainer.classList.add('hidden');
        }
        
        clearTimeout(checkTimeout);
        
        const visitorId = visitorIdField.value.trim();
        if (visitorId.length >= 10) { // Minimum length for a valid ID
            checkTimeout = setTimeout(async () => {
                const status = await checkVisitorStatus(visitorId);
                
                if (status.exists) {
                    displayVisitorStatus(status.visitor);
                } else {
                    const statusContainer = document.getElementById('visitorStatusContainer');
                    if (statusContainer) {
                        statusContainer.innerHTML = `
                            <div class="visitor-status status-error">
                                <p class="status-message error">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    ${status.error || 'Badge non trouvé'}
                                </p>
                            </div>
                        `;
                        statusContainer.classList.remove('hidden');
                    }
                }
            }, 1000); // Attendre 1 seconde après la saisie
        }
    });
}

/**
 * Valide le formulaire de re-entrée
 * @returns {boolean} True si le formulaire est valide
 */
function validateReturnForm() {
    const visitorId = document.getElementById('visitorId').value.trim();
    const visitReason = document.getElementById('returnVisitReason').value;
    const staffId = document.getElementById('returnStaffId').value;
    const formationId = document.getElementById('returnFormationId').value;
    
    let isValid = true;
    
    // Validation de l'ID visiteur
    if (!visitorId || visitorId.length < 10) {
        showFieldError('visitorId', 'ID de badge invalide');
        isValid = false;
    } else {
        clearFieldError('visitorId');
    }
    
    // Validation de la raison de visite
    if (!visitReason) {
        showFieldError('returnVisitReason', 'La raison de la visite est requise');
        isValid = false;
    } else {
        clearFieldError('returnVisitReason');
    }
    
    // Validation conditionnelle
    if (visitReason === 'MEETING' && !staffId) {
        showFieldError('returnStaffId', 'Sélectionnez un collaborateur pour un rendez-vous');
        isValid = false;
    } else {
        clearFieldError('returnStaffId');
    }
    
    if (visitReason === 'FORMATION' && !formationId) {
        showFieldError('returnFormationId', 'Sélectionnez une formation');
        isValid = false;
    } else {
        clearFieldError('returnFormationId');
    }
    
    return isValid;
}

/**
 * Soumet les données de re-entrée
 * @param {string} visitorId - ID du visiteur
 * @param {Object} data - Données de re-entrée
 * @returns {Object} Résultat de la soumission
 */
async function submitReturnVisitor(visitorId, data) {
    try {
        const reentryData = {
            visitorId: visitorId,
            visitReason: data.visitReason,
            staffId: data.staffId,
            formationId: data.formationId
        };
        
        const result = await VisitorService.reenterVisitor(reentryData);
        return { success: true, visitor: result.visitor || result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Gère la soumission du formulaire de re-entrée
 * @param {Event} event - Événement de soumission
 */
async function handleReturningFormSubmit(event) {
    event.preventDefault();
    
    try {
        // Validation du formulaire
        if (!validateReturnForm()) {
            return;
        }
        
        const formData = new FormData(event.target);
        const visitorId = formData.get('visitorId');
        
        // Vérifier le statut du visiteur avant de soumettre
        const status = await checkVisitorStatus(visitorId);
        
        if (!status.exists) {
            showNotification('Badge non trouvé. Veuillez vérifier votre ID.', 'error');
            return;
        }
        
        if (status.visitor.status === 'INSIDE') {
            showNotification('Vous êtes déjà dans le bâtiment !', 'warning');
            return;
        }
        
        // Préparer les données pour la re-entrée
        const reentryData = {
            visitReason: formData.get('returnVisitReason'),
            staffId: formData.get('returnStaffId') || null,
            formationId: formData.get('returnFormationId') || null
        };
        
        // Soumettre la re-entrée
        const result = await submitReturnVisitor(visitorId, reentryData);
        
        if (result.success) {
            showNotification('Re-entrée enregistrée avec succès !', 'success');
            showSuccessResult(result.visitor, true);
        } else {
            showNotification(result.error || 'Erreur lors de la re-entrée', 'error');
        }
        
    } catch (error) {
        console.error('Erreur lors de la re-entrée:', error);
        showNotification(error.message || 'Erreur lors de la re-entrée', 'error');
    }
}

/**
 * Gère les champs conditionnels du formulaire de re-entrée
 */
function handleReturnVisitReasonChange() {
    const visitReasonSelect = document.getElementById('returnVisitReason');
    const staffSection = document.getElementById('returnStaffSection');
    const formationSection = document.getElementById('returnFormationSection');
    const staffSelect = document.getElementById('returnStaffId');
    const formationSelect = document.getElementById('returnFormationId');

    visitReasonSelect.addEventListener('change', () => {
        const reason = visitReasonSelect.value;
        
        // Reset des champs
        staffSelect.removeAttribute('required');
        formationSelect.removeAttribute('required');
        staffSection.classList.add('hidden');
        formationSection.classList.add('hidden');
        
        // Afficher les champs appropriés
        if (reason === 'MEETING') {
            staffSection.classList.remove('hidden');
            staffSelect.setAttribute('required', 'true');
        } else if (reason === 'FORMATION') {
            formationSection.classList.remove('hidden');
            formationSelect.setAttribute('required', 'true');
        }
    });
}

/**
 * Initialise le formulaire de re-entrée
 */
function initReturningVisitorForm() {
    const form = document.getElementById('returningForm');
    
    if (!form) return;

    // Gestion des champs conditionnels
    handleReturnVisitReasonChange();
    
    // Soumission du formulaire
    form.addEventListener('submit', handleReturningFormSubmit);
}

/**
 * Gère la soumission du formulaire de re-entrée
 */
async function handleReturningFormSubmit(event) {
    event.preventDefault();
    
    try {
        // Validation du formulaire
        if (!validateReturningForm()) {
            return;
        }

        // Collecte des données
        const formData = new FormData(event.target);
        const reentryData = {
            visitorId: formData.get('visitorId')?.trim(),
            visitReason: formData.get('returnVisitReason'),
            staffId: formData.get('returnStaffId') || undefined,
            formationId: formData.get('returnFormationId') || undefined
        };

        // Désactiver le bouton de soumission
        const submitBtn = document.getElementById('returnSubmitBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';

        // Appel API pour re-entrée
        const result = await VisitorService.reenterVisitor(reentryData);
        
        // Afficher le résultat de succès
        showSuccessResult(result.visitor, true); // true = re-entrée
        
        // Réinitialiser le formulaire
        event.target.reset();
        
        showNotification('Re-entrée enregistrée avec succès !', 'success');

    } catch (error) {
        console.error('Erreur lors de la re-entrée:', error);
        showNotification(error.message, 'error');
    } finally {
        // Réactiver le bouton
        const submitBtn = document.getElementById('returnSubmitBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Confirmer la Re-entrée';
    }
}

/**
 * Valide le formulaire de re-entrée
 */
function validateReturningForm() {
    const visitorId = document.getElementById('visitorId').value.trim();
    const visitReason = document.getElementById('returnVisitReason').value;
    const staffId = document.getElementById('returnStaffId').value;
    const formationId = document.getElementById('returnFormationId').value;

    let isValid = true;

    // Validation de l'ID visiteur
    if (!visitorId) {
        showFieldError('visitorId', 'L\'ID de badge est requis');
        isValid = false;
    } else if (visitorId.length < 5) {
        showFieldError('visitorId', 'L\'ID de badge doit contenir au moins 5 caractères');
        isValid = false;
    } else {
        clearFieldError('visitorId');
    }

    // Validation de la raison de visite
    if (!visitReason) {
        showFieldError('returnVisitReason', 'La raison de la visite est requise');
        isValid = false;
    } else {
        clearFieldError('returnVisitReason');
    }

    // Validation conditionnelle
    if (visitReason === 'MEETING' && !staffId) {
        showFieldError('returnStaffId', 'Sélectionnez un collaborateur pour un rendez-vous');
        isValid = false;
    } else {
        clearFieldError('returnStaffId');
    }

    if (visitReason === 'FORMATION' && !formationId) {
        showFieldError('returnFormationId', 'Sélectionnez une formation');
        isValid = false;
    } else {
        clearFieldError('returnFormationId');
    }

    return isValid;
}

/**
 * Affiche le résultat de succès (modifié pour gérer les re-entrées)
 */
function showSuccessResult(visitor, isReentry = false) {
    const resultContainer = document.getElementById('successResult');
    const nameSpan = document.getElementById('resultName');
    const emailSpan = document.getElementById('resultEmail');
    const timeSpan = document.getElementById('resultTime');
    const idSpan = document.getElementById('resultId');
    const reasonSpan = document.getElementById('resultReason');
    const successCard = resultContainer.querySelector('.success-card');
    
    // Adapter le message selon le type d'entrée
    const titleElement = successCard.querySelector('h2');
    const subtitleElement = successCard.querySelector('p');
    
    if (isReentry) {
        titleElement.textContent = 'Re-entrée Confirmée !';
        subtitleElement.textContent = 'Bon retour chez GooseCorp';
        
        // Pour les re-entrées, on n'a pas forcément toutes les infos
        nameSpan.textContent = visitor.firstName && visitor.lastName 
            ? `${visitor.firstName} ${visitor.lastName}` 
            : 'Visiteur de retour';
        emailSpan.textContent = visitor.email || 'Non disponible';
    } else {
        titleElement.textContent = 'Enregistrement Réussi !';
        subtitleElement.textContent = 'Bienvenue chez GooseCorp';
        nameSpan.textContent = `${visitor.firstName} ${visitor.lastName}`;
        emailSpan.textContent = visitor.email;
    }
    
    timeSpan.textContent = new Date(visitor.checkInTime).toLocaleString('fr-FR');
    idSpan.textContent = visitor.uniqueId;
    
    // Afficher la raison de la visite
    const visitReasonText = getVisitReasonText(visitor.visitReason);
    reasonSpan.textContent = visitReasonText;
    
    // Générer le QR code
    generateQRCode(visitor);
    
    // Masquer les formulaires et afficher le résultat
    document.getElementById('newVisitorForm').classList.add('hidden');
    document.getElementById('returningVisitorForm').classList.add('hidden');
    resultContainer.classList.remove('hidden');
    
    // Scroll vers le résultat
    resultContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Reset tous les formulaires et revient à l'état initial
 */
function resetAllForms() {
    // Reset des formulaires
    const newForm = document.getElementById('checkinForm');
    const returnForm = document.getElementById('returningForm');
    
    if (newForm) newForm.reset();
    if (returnForm) returnForm.reset();
    
    // Masquer les sections conditionnelles
    const staffGroup = document.getElementById('staffGroup');
    const formationGroup = document.getElementById('formationGroup');
    const returnStaffSection = document.getElementById('returnStaffSection');
    const returnFormationSection = document.getElementById('returnFormationSection');
    
    if (staffGroup) staffGroup.classList.add('hidden');
    if (formationGroup) formationGroup.classList.add('hidden');
    if (returnStaffSection) returnStaffSection.classList.add('hidden');
    if (returnFormationSection) returnFormationSection.classList.add('hidden');
    
    // Clear toutes les erreurs
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('has-error'));
    
    // Masquer le résultat
    document.getElementById('successResult').classList.add('hidden');
}

/**
 * Reset complet avec retour au mode nouveau visiteur
 */
function resetForm() {
    resetAllForms();
    
    // Revenir au mode nouveau visiteur par défaut
    document.getElementById('newVisitorBtn').classList.add('active');
    document.getElementById('returningVisitorBtn').classList.remove('active');
    document.getElementById('newVisitorForm').classList.remove('hidden');
    document.getElementById('returningVisitorForm').classList.add('hidden');
}

/**
 * Convertit le code de raison de visite en texte lisible
 */
function getVisitReasonText(visitReason) {
    const reasons = {
        'MEETING': 'Rendez-vous',
        'FORMATION': 'Formation',
        'DELIVERY': 'Livraison',
        'MAINTENANCE': 'Maintenance',
        'OTHER': 'Autre'
    };
    return reasons[visitReason] || visitReason;
}

/**
 * Génère et affiche le QR code contenant les informations de visite
 */
function generateQRCode(visitor) {
    const qrContainer = document.getElementById('qrCodeContainer');
    
    // Préparer les données pour le QR code
    const qrData = {
        id: visitor.uniqueId,
        nom: `${visitor.firstName} ${visitor.lastName}`,
        email: visitor.email,
        raison: getVisitReasonText(visitor.visitReason),
        heure: new Date(visitor.checkInTime).toLocaleString('fr-FR'),
        company: visitor.company || 'Non spécifié'
    };
    
    // Créer le texte du QR code
    const qrText = `GooseCorp Visitor
ID: ${qrData.id}
Nom: ${qrData.nom}
Email: ${qrData.email}
Raison: ${qrData.raison}
Heure: ${qrData.heure}
Entreprise: ${qrData.company}`;
    
    // Vider le conteneur
    qrContainer.innerHTML = '';
    
    // Générer le QR code
    if (typeof QRCode !== 'undefined') {
        try {
            QRCode.toCanvas(qrContainer, qrText, {
                width: 200,
                height: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            }, function(error) {
                if (error) {
                    console.error('Erreur lors de la génération du QR code:', error);
                    qrContainer.innerHTML = '<p>Erreur lors de la génération du QR code</p>';
                } else {
                    console.log('✅ QR code généré avec succès');
                }
            });
        } catch (error) {
            console.error('Erreur lors de la génération du QR code:', error);
            qrContainer.innerHTML = '<p>Erreur lors de la génération du QR code</p>';
        }
    } else {
        console.error('Bibliothèque QRCode non disponible');
        qrContainer.innerHTML = '<p>Bibliothèque QR code non disponible</p>';
    }
}

/**
 * Fonctions utilitaires pour la gestion des erreurs
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) field.closest('.form-group').classList.add('has-error');
    if (errorElement) errorElement.textContent = message;
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) field.closest('.form-group').classList.remove('has-error');
    if (errorElement) errorElement.textContent = '';
}

/**
 * Instance du système de notifications
 */
let notificationSystem = null;

/**
 * Fonction pour afficher les notifications
 */
function showNotification(message, type) {
    if (!notificationSystem) {
        // Initialiser le système de notifications si pas encore fait
        if (typeof NotificationSystem !== 'undefined') {
            notificationSystem = new NotificationSystem();
        } else {
            // Fallback si NotificationSystem n'est pas disponible
            console.log(`[NOTIFICATION ${type.toUpperCase()}]: ${message}`);
            
            // Essayer d'utiliser le système de notification global
            if (window.notifications && typeof window.notifications.show === 'function') {
                window.notifications.show(message, type);
                return;
            }
            
            // Dernier recours : alert
            alert(`${type.toUpperCase()}: ${message}`);
            return;
        }
    }
    
    notificationSystem.show(message, type);
}

/**
 * Initialise le formulaire de re-entrée
 */
function initReturningVisitorForm() {
    const form = document.getElementById('returningForm');
    if (!form) return;
    
    // Gérer les champs conditionnels
    handleReturnVisitReasonChange();
    
    // Gérer la vérification du statut du visiteur
    handleVisitorIdCheck();
    
    // Gestion de la soumission du formulaire
    form.addEventListener('submit', handleReturningFormSubmit);
}

// ====================================
// EXPORT DES FONCTIONS GLOBALES
// ====================================

// Rendre les fonctions disponibles globalement
window.initEntryChoice = initEntryChoice;
window.loadReturnFormData = loadReturnFormData;
window.initReturningVisitorForm = initReturningVisitorForm;
window.handleReturningFormSubmit = handleReturningFormSubmit;
window.resetAllForms = resetAllForms;
window.resetForm = resetForm;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.showNotification = showNotification;
window.getVisitReasonText = getVisitReasonText;
window.generateQRCode = generateQRCode;

console.log('🎯 Fonctions Entry.js exportées globalement'); 