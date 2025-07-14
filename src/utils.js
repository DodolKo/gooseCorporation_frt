/**
 * Utilitaires pour l'application GooseCorp
 * 
 * Ce fichier contient :
 * - Système de notifications
 * - Validation des formulaires
 * - Formatage des dates
 * - Gestion des erreurs
 * - Utilitaires DOM
 */

// ====================================
// SYSTÈME DE NOTIFICATIONS
// ====================================

class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notifications');
        this.notifications = [];
    }

    /**
     * Affiche une notification
     * @param {string} message - Message à afficher
     * @param {string} type - Type de notification (success, error, warning, info)
     * @param {number} duration - Durée d'affichage en ms (0 = permanent)
     */
    show(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        
        // Ajouter à la liste
        this.notifications.push(notification);
        
        // Ajouter au DOM
        this.container.appendChild(notification.element);
        
        // Animation d'entrée
        setTimeout(() => {
            notification.element.classList.add('show');
        }, 100);
        
        // Auto-suppression
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification.id);
            }, duration);
        }
        
        return notification.id;
    }

    /**
     * Crée un élément de notification
     * @param {string} message - Message
     * @param {string} type - Type
     * @returns {Object} Objet notification
     */
    createNotification(message, type) {
        const id = Date.now() + Math.random();
        const element = document.createElement('div');
        
        element.className = `notification notification-${type}`;
        element.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getIcon(type)}"></i>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="notifications.remove('${id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        return { id, element, type, message };
    }

    /**
     * Retourne l'icône pour un type de notification
     * @param {string} type - Type de notification
     * @returns {string} Classe CSS de l'icône
     */
    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    /**
     * Supprime une notification
     * @param {string} id - ID de la notification
     */
    remove(id) {
        const notification = this.notifications.find(n => n.id == id);
        if (notification) {
            // Animation de sortie
            notification.element.classList.add('hide');
            
            // Suppression du DOM
            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
            }, 300);
            
            // Suppression de la liste
            this.notifications = this.notifications.filter(n => n.id !== id);
        }
    }

    /**
     * Supprime toutes les notifications
     */
    clear() {
        this.notifications.forEach(notification => {
            this.remove(notification.id);
        });
    }

    // Méthodes de raccourci
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 8000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

// Instance globale des notifications
const notifications = new NotificationSystem();

// ====================================
// VALIDATION DES FORMULAIRES
// ====================================

class FormValidator {
    /**
     * Valide un champ email
     * @param {string} email - Email à valider
     * @returns {Object} Résultat de la validation
     */
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email || !email.trim()) {
            return { valid: false, message: 'L\'email est requis' };
        }
        
        if (!emailRegex.test(email.trim())) {
            return { valid: false, message: 'Format d\'email invalide' };
        }
        
        return { valid: true };
    }

    /**
     * Valide un champ nom/prénom
     * @param {string} name - Nom à valider
     * @param {string} fieldName - Nom du champ pour les messages
     * @returns {Object} Résultat de la validation
     */
    static validateName(name, fieldName = 'nom') {
        if (!name || !name.trim()) {
            return { valid: false, message: `Le ${fieldName} est requis` };
        }
        
        if (name.trim().length < 2) {
            return { valid: false, message: `Le ${fieldName} doit contenir au moins 2 caractères` };
        }
        
        if (name.trim().length > 50) {
            return { valid: false, message: `Le ${fieldName} ne peut pas dépasser 50 caractères` };
        }
        
        return { valid: true };
    }

    /**
     * Valide un numéro de téléphone
     * @param {string} phone - Téléphone à valider
     * @returns {Object} Résultat de la validation
     */
    static validatePhone(phone) {
        // Le téléphone est optionnel
        if (!phone || !phone.trim()) {
            return { valid: true };
        }
        
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
        
        if (!phoneRegex.test(phone.trim())) {
            return { valid: false, message: 'Format de téléphone invalide' };
        }
        
        return { valid: true };
    }

    /**
     * Valide une sélection obligatoire
     * @param {string} value - Valeur sélectionnée
     * @param {string} fieldName - Nom du champ
     * @returns {Object} Résultat de la validation
     */
    static validateRequired(value, fieldName) {
        if (!value || !value.trim()) {
            return { valid: false, message: `${fieldName} est requis` };
        }
        
        return { valid: true };
    }

    /**
     * Valide un ID de visiteur
     * @param {string} visitorId - ID à valider
     * @returns {Object} Résultat de la validation
     */
    static validateVisitorId(visitorId) {
        if (!visitorId || !visitorId.trim()) {
            return { valid: false, message: 'L\'ID de visite est requis' };
        }
        
        // L'ID doit avoir au moins 10 caractères
        if (visitorId.trim().length < 10) {
            return { valid: false, message: 'L\'ID de visite doit contenir au moins 10 caractères' };
        }
        
        return { valid: true };
    }

    /**
     * Affiche les erreurs de validation sur le formulaire
     * @param {Object} errors - Objet des erreurs {fieldName: message}
     */
    static displayErrors(errors) {
        // Effacer les erreurs précédentes
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.parentElement.classList.remove('has-error');
        });
        
        // Afficher les nouvelles erreurs
        Object.keys(errors).forEach(fieldName => {
            const errorElement = document.getElementById(`${fieldName}Error`);
            const fieldElement = document.getElementById(fieldName);
            
            if (errorElement && fieldElement) {
                errorElement.textContent = errors[fieldName];
                fieldElement.parentElement.classList.add('has-error');
            }
        });
    }

    /**
     * Efface toutes les erreurs d'un formulaire
     */
    static clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
            el.parentElement.classList.remove('has-error');
        });
    }
}

// ====================================
// FORMATAGE DES DATES
// ====================================

class DateFormatter {
    /**
     * Formate une date au format français
     * @param {string|Date} date - Date à formater
     * @returns {string} Date formatée
     */
    static formatDate(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        return dateObj.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Formate une heure au format français
     * @param {string|Date} date - Date à formater
     * @returns {string} Heure formatée
     */
    static formatTime(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        return dateObj.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Formate une date complète
     * @param {string|Date} date - Date à formater
     * @returns {string} Date et heure formatées
     */
    static formatDateTime(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        return dateObj.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Calcule la durée entre deux dates
     * @param {string|Date} startDate - Date de début
     * @param {string|Date} endDate - Date de fin
     * @returns {string} Durée formatée
     */
    static calculateDuration(startDate, endDate) {
        if (!startDate || !endDate) return '';
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
        
        const diffMs = end.getTime() - start.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
            return `${diffHours}h ${diffMinutes}min`;
        } else {
            return `${diffMinutes}min`;
        }
    }
}

// ====================================
// UTILITAIRES DOM
// ====================================

class DOMUtils {
    /**
     * Affiche ou masque un élément
     * @param {string|Element} element - Sélecteur ou élément
     * @param {boolean} show - Afficher ou masquer
     */
    static toggleElement(element, show) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            if (show) {
                el.style.display = '';
                el.classList.remove('hidden');
            } else {
                el.style.display = 'none';
                el.classList.add('hidden');
            }
        }
    }

    /**
     * Active ou désactive un bouton
     * @param {string|Element} button - Sélecteur ou élément
     * @param {boolean} enabled - Activer ou désactiver
     */
    static toggleButton(button, enabled) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (btn) {
            btn.disabled = !enabled;
            if (enabled) {
                btn.classList.remove('disabled');
            } else {
                btn.classList.add('disabled');
            }
        }
    }

    /**
     * Met à jour le contenu d'un élément
     * @param {string|Element} element - Sélecteur ou élément
     * @param {string} content - Nouveau contenu
     */
    static updateContent(element, content) {
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.textContent = content;
        }
    }

    /**
     * Remplit un select avec des options
     * @param {string|Element} select - Sélecteur ou élément select
     * @param {Array} options - Tableau d'options {value, text}
     * @param {string} placeholder - Texte du placeholder
     */
    static populateSelect(select, options, placeholder = 'Sélectionnez...') {
        const selectEl = typeof select === 'string' ? document.querySelector(select) : select;
        if (!selectEl) return;
        
        // Vider le select
        selectEl.innerHTML = '';
        
        // Ajouter le placeholder
        const placeholderOption = document.createElement('option');
        placeholderOption.value = '';
        placeholderOption.textContent = placeholder;
        selectEl.appendChild(placeholderOption);
        
        // Ajouter les options
        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.text;
            selectEl.appendChild(optionEl);
        });
    }

    /**
     * Récupère les données d'un formulaire
     * @param {string|Element} form - Sélecteur ou élément form
     * @returns {Object} Données du formulaire
     */
    static getFormData(form) {
        const formEl = typeof form === 'string' ? document.querySelector(form) : form;
        if (!formEl) return {};
        
        const formData = new FormData(formEl);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    /**
     * Remet à zéro un formulaire
     * @param {string|Element} form - Sélecteur ou élément form
     */
    static resetForm(form) {
        const formEl = typeof form === 'string' ? document.querySelector(form) : form;
        if (formEl) {
            formEl.reset();
            FormValidator.clearErrors();
        }
    }
}

// ====================================
// GESTION DES ERREURS GLOBALES
// ====================================

class ErrorHandler {
    /**
     * Gère une erreur API
     * @param {Error} error - Erreur à gérer
     * @param {string} context - Contexte de l'erreur
     */
    static handleApiError(error, context = 'API') {
        console.error(`Erreur ${context}:`, error);
        
        let message = 'Une erreur inattendue s\'est produite';
        
        if (error.message) {
            message = error.message;
        } else if (error.response?.data?.message) {
            message = error.response.data.message;
        }
        
        notifications.error(message);
    }

    /**
     * Gère une erreur de validation
     * @param {Object} validationErrors - Erreurs de validation
     */
    static handleValidationErrors(validationErrors) {
        FormValidator.displayErrors(validationErrors);
        notifications.warning('Veuillez corriger les erreurs dans le formulaire');
    }
}

// ====================================
// EXPORT DES UTILITAIRES
// ====================================

// Rendre les utilitaires disponibles globalement
window.notifications = notifications;
window.FormValidator = FormValidator;
window.DateFormatter = DateFormatter;
window.DOMUtils = DOMUtils;
window.ErrorHandler = ErrorHandler;

console.log('🔧 Utilitaires GooseCorp initialisés'); 