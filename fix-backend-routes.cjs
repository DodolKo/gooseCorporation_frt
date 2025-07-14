/**
 * Script de correction pour les routes publiques du backend GooseCorp
 * 
 * Ce script ajoute les endpoints publics manquants pour le frontend
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des routes publiques du backend GooseCorp');
console.log('=====================================================');

// Chemin vers le fichier de routes des visiteurs
const visitorsRoutePath = path.join(__dirname, '../gooseCorp_bck/src/routes/visitors.js');

// Vérifier si le fichier existe
if (!fs.existsSync(visitorsRoutePath)) {
    console.error('❌ Fichier visitors.js non trouvé:', visitorsRoutePath);
    process.exit(1);
}

// Lire le fichier actuel
let visitorsContent = fs.readFileSync(visitorsRoutePath, 'utf8');

// Vérifier si les endpoints publics existent déjà
if (visitorsContent.includes('router.get(\'/public/health\'')) {
    console.log('✅ Les endpoints publics existent déjà dans le fichier');
    
    // Vérifier si ils sont bien à la fin du fichier
    const publicHealthIndex = visitorsContent.indexOf('router.get(\'/public/health\'');
    const moduleExportsIndex = visitorsContent.indexOf('module.exports = router;');
    
    if (publicHealthIndex > moduleExportsIndex) {
        console.log('❌ Les endpoints publics sont après module.exports, correction nécessaire');
        
        // Extraire les endpoints publics
        const publicEndpoints = visitorsContent.substring(publicHealthIndex);
        const beforePublic = visitorsContent.substring(0, publicHealthIndex);
        
        // Réorganiser le fichier
        const newContent = beforePublic + publicEndpoints.replace('module.exports = router;', '') + '\nmodule.exports = router;\n';
        
        fs.writeFileSync(visitorsRoutePath, newContent);
        console.log('✅ Fichier corrigé - endpoints publics déplacés avant module.exports');
    } else {
        console.log('✅ Les endpoints publics sont correctement placés');
    }
} else {
    console.log('❌ Endpoints publics manquants, ajout en cours...');
    
    // Ajouter les endpoints publics avant module.exports
    const publicEndpoints = `
// ========================================
// PUBLIC ENDPOINTS FOR FRONTEND
// ========================================

// Get active staff members (public endpoint)
router.get('/public/staff', async (req, res) => {
  try {
    // Add security headers for public endpoints
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });

    const staff = await prisma.gooseCorpStaff.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        department: true,
        position: true,
        email: true
      },
      orderBy: [
        { department: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json({ 
      staff,
      count: staff.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching public staff:', error);
    res.status(500).json({ error: 'Failed to fetch staff members' });
  }
});

// Get active formations (public endpoint)
router.get('/public/formations', async (req, res) => {
  try {
    // Add security headers for public endpoints
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    });

    const formations = await prisma.gooseCorpFormation.findMany({
      where: { 
        isActive: true
        // Removed date filter to show all active formations
      },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        instructor: true,
        maxAttendees: true,
        isActive: true
      },
      orderBy: { startDate: 'asc' }
    });

    res.json({ 
      formations,
      count: formations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching public formations:', error);
    res.status(500).json({ error: 'Failed to fetch formations' });
  }
});

// Health check endpoint for frontend
router.get('/public/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

`;

    // Insérer avant module.exports
    const moduleExportsIndex = visitorsContent.lastIndexOf('module.exports = router;');
    if (moduleExportsIndex === -1) {
        console.error('❌ module.exports non trouvé dans le fichier');
        process.exit(1);
    }
    
    const beforeExports = visitorsContent.substring(0, moduleExportsIndex);
    const afterExports = visitorsContent.substring(moduleExportsIndex);
    
    const newContent = beforeExports + publicEndpoints + afterExports;
    
    fs.writeFileSync(visitorsRoutePath, newContent);
    console.log('✅ Endpoints publics ajoutés avec succès');
}

console.log('');
console.log('🎉 Correction terminée !');
console.log('');
console.log('Prochaines étapes :');
console.log('1. Redémarrer le serveur backend');
console.log('2. Tester les endpoints publics :');
console.log('   - http://localhost:3000/api/visitors/public/health');
console.log('   - http://localhost:3000/api/visitors/public/staff');
console.log('   - http://localhost:3000/api/visitors/public/formations');
console.log('3. Lancer le frontend avec ./start-dev.sh'); 