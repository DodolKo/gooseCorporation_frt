// Import des modules ES6 pour la page checkout
import './api.js';
import './utils.js';
import './checkout.js';

// Initialisation de la page checkout
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initialisation de la page de sortie...');
    
    try {
        // Initialiser la page de sortie
        if (typeof initializeCheckoutPage === 'function') {
            await initializeCheckoutPage();
        }
        
        console.log('✅ Page de sortie initialisée avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la page de sortie:', error);
    }
});

// Export pour compatibilité
export default {}; 