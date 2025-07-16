import { defineConfig } from 'vite'

export default defineConfig({
  // Configuration de base
  base: '/',
  
  // Configuration du build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vite']
        }
      }
    }
  },
  
  // Configuration du serveur de développement
  server: {
    port: 5173,
    host: '10.255.255.254', // Utiliser une adresse IP spécifique (pas localhost)
    open: false, // Ne pas ouvrir automatiquement
    strictPort: true // Échouer si le port est occupé
  },
  
  // Optimisations
  optimizeDeps: {
    include: []
  },
  
  // Configuration des assets
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.webp'],
  
  // Configuration des alias (optionnel)
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 