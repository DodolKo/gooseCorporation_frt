// Import des modules ES6
import './style.css';
import './api.js';
import './utils.js';
import './entry.js';
import './checkin.js';
import './diagnostics.js';

// Attendre que les services soient disponibles sur window
async function waitForGlobals() {
    let tries = 0;
    while ((!window.PublicDataService || !window.CONFIG) && tries < 20) {
        await new Promise(r => setTimeout(r, 100));
        tries++;
    }
    if (!window.PublicDataService || !window.CONFIG) {
        console.error('❌ Les services globaux ne sont pas disponibles après attente.');
    } else {
        console.log('✅ Services globaux disponibles.');
    }
}

// Initialisation de l'application GooseCorp
document.addEventListener('DOMContentLoaded', async function() {
    await waitForGlobals();
    console.log('🚀 Initialisation de GooseCorp Frontend...');
    
    try {
        // Initialiser les boutons de choix d'entrée
        if (typeof initEntryChoice === 'function') {
            initEntryChoice();
        }
        
        // Initialiser la page d'entrée (charge les données staff/formations)
        if (typeof initializeCheckinPage === 'function') {
            await initializeCheckinPage();
        }
        
        // Initialiser le formulaire de re-entrée
        if (typeof initReturningVisitorForm === 'function') {
            initReturningVisitorForm();
        }
        
        // Charger les données pour le formulaire de re-entrée
        if (typeof loadReturnFormData === 'function') {
            await loadReturnFormData();
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
