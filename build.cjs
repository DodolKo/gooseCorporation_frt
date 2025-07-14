#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Début du build pour Netlify...');

// Dossier de destination
const distDir = 'dist';

// Créer le dossier dist s'il n'existe pas
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Fichiers à copier
const filesToCopy = [
    'index.html',
    'checkout.html'
];

// Dossiers à copier
const dirsToCopy = [
    'src'
];

// Copier les fichiers
filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(distDir, file));
        console.log(`✅ Copié: ${file}`);
    } else {
        console.log(`⚠️  Fichier non trouvé: ${file}`);
    }
});

// Copier les dossiers
dirsToCopy.forEach(dir => {
    if (fs.existsSync(dir)) {
        copyDir(dir, path.join(distDir, dir));
        console.log(`✅ Copié: ${dir}/`);
    } else {
        console.log(`⚠️  Dossier non trouvé: ${dir}`);
    }
});

// Fonction pour copier un dossier récursivement
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}

// Créer un fichier _redirects pour Netlify (SPA)
const redirectsContent = `/*    /index.html   200`;
fs.writeFileSync(path.join(distDir, '_redirects'), redirectsContent);
console.log('✅ Créé: _redirects');

// Créer un fichier _headers pour la sécurité
const headersContent = `/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate`;

fs.writeFileSync(path.join(distDir, '_headers'), headersContent);
console.log('✅ Créé: _headers');

console.log('🎉 Build terminé avec succès !');
console.log(`📁 Dossier de build: ${distDir}/`);
console.log('🚀 Prêt pour le déploiement sur Netlify !'); 