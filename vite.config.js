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
    open: true
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