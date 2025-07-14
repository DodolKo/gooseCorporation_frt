#!/bin/bash

# Script de démarrage pour le développement GooseCorp

echo "🚀 Démarrage de l'environnement de développement GooseCorp"
echo "=================================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher des messages colorés
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

print_status "Node.js version: $(node --version)"
print_status "npm version: $(npm --version)"

# Vérifier si le backend existe
BACKEND_PATH="../gooseCorp_bck"
if [ ! -d "$BACKEND_PATH" ]; then
    print_error "Le dossier backend ($BACKEND_PATH) n'existe pas."
    exit 1
fi

# Démarrer le serveur backend en arrière-plan
print_status "Démarrage du serveur backend..."
cd "$BACKEND_PATH"

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    print_warning "Installation des dépendances backend..."
    npm install
fi

# Démarrer le serveur backend
print_status "Lancement du serveur backend sur le port 3000..."
npm run dev &
BACKEND_PID=$!

# Attendre que le serveur démarre
print_status "Attente du démarrage du serveur backend..."
sleep 5

# Tester la connexion au backend
print_status "Test de connexion au backend..."
if curl -s http://localhost:3000/health > /dev/null; then
    print_success "✅ Backend démarré avec succès sur http://localhost:3000"
else
    print_error "❌ Impossible de se connecter au backend"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Revenir au dossier frontend
cd - > /dev/null

# Démarrer un serveur HTTP simple pour le frontend
print_status "Démarrage du serveur frontend..."

# Vérifier si Python est disponible
if command -v python3 &> /dev/null; then
    print_status "Utilisation de Python 3 pour servir le frontend..."
    python3 -m http.server 8080 &
    FRONTEND_PID=$!
    FRONTEND_URL="http://localhost:8080"
elif command -v python &> /dev/null; then
    print_status "Utilisation de Python 2 pour servir le frontend..."
    python -m SimpleHTTPServer 8080 &
    FRONTEND_PID=$!
    FRONTEND_URL="http://localhost:8080"
elif command -v php &> /dev/null; then
    print_status "Utilisation de PHP pour servir le frontend..."
    php -S localhost:8080 &
    FRONTEND_PID=$!
    FRONTEND_URL="http://localhost:8080"
else
    print_warning "Aucun serveur HTTP simple trouvé. Vous devrez ouvrir les fichiers HTML directement."
    FRONTEND_URL="file://$(pwd)/index.html"
fi

sleep 2

# Afficher les informations de connexion
echo ""
echo "🎉 Environnement de développement prêt !"
echo "========================================"
echo ""
echo "📱 Frontend (Application principale):"
echo "   🔗 URL: $FRONTEND_URL"
echo "   📄 Page d'entrée: $FRONTEND_URL/index.html"
echo "   📄 Page de sortie: $FRONTEND_URL/checkout.html"
echo ""
echo "🧪 Test API:"
echo "   🔗 URL: $FRONTEND_URL/test-api.html"
echo ""
echo "🔧 Backend API:"
echo "   🔗 URL: http://localhost:3000/api"
echo "   ❤️  Health check: http://localhost:3000/health"
echo "   👥 Staff public: http://localhost:3000/api/visitors/public/staff"
echo "   🎓 Formations public: http://localhost:3000/api/visitors/public/formations"
echo ""
echo "📊 Logs:"
echo "   📁 Backend logs: Visibles dans ce terminal"
echo "   📁 Frontend logs: Ouvrir les DevTools du navigateur (F12)"
echo ""

# Fonction de nettoyage
cleanup() {
    print_status "Arrêt des serveurs..."
    kill $BACKEND_PID 2>/dev/null
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    print_success "Serveurs arrêtés."
    exit 0
}

# Capturer Ctrl+C pour nettoyer
trap cleanup SIGINT

print_status "Appuyez sur Ctrl+C pour arrêter les serveurs."
print_status "Ouvrez votre navigateur et allez sur: $FRONTEND_URL"

# Attendre indéfiniment
wait 