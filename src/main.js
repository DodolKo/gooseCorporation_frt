// Import des modules ES6
import './style.css';
import './api.js';
import './utils.js';
import './entry.js';
import './checkin.js';

// Initialisation de l'application GooseCorp
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initialisation de GooseCorp Frontend...');
    
    try {
        // Initialiser les boutons de choix d'entrée
        if (typeof initEntryChoice === 'function') {
            initEntryChoice();
        }
        
        // Initialiser le formulaire de re-entrée
        if (typeof initReturningVisitorForm === 'function') {
            initReturningVisitorForm();
        }
        
        console.log('✅ GooseCorp Frontend initialisé avec succès');
        
        // Vérifier la connexion à l'API
        console.log('🔗 Vérification de la connexion API...');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
});

// Export pour compatibilité
export default {};
