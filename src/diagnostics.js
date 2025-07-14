/**
 * Module de diagnostic pour GooseCorp
 * Identifie et diagnostique les problèmes de connexion API
 */

class ApiDiagnostics {
    static async runFullDiagnostic() {
        console.log('🔍 Début du diagnostic API complet...');
        
        const results = {
            environment: this.detectEnvironment(),
            connectivity: await this.testConnectivity(),
            cors: await this.testCors(),
            endpoints: await this.testEndpoints(),
            configuration: this.checkConfiguration()
        };
        
        this.displayResults(results);
        return results;
    }
    
    static detectEnvironment() {
        const env = {
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            port: window.location.port,
            isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
            isNetlify: window.location.hostname.includes('netlify'),
            isProduction: window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1' &&
                         !window.location.hostname.startsWith('192.168'),
            userAgent: navigator.userAgent
        };
        
        console.log('🌍 Environnement détecté:', env);
        return env;
    }
    
    static async testConnectivity() {
        console.log('🔗 Test de connectivité...');
        
        const tests = [];
        const baseUrl = 'https://goosecorporationbck-production.up.railway.app';
        
        // Test 1: Ping simple
        try {
            const response = await fetch(`${baseUrl}/health`, {
                method: 'GET',
                mode: 'cors'
            });
            tests.push({
                name: 'Health Check',
                success: response.ok,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            });
        } catch (error) {
            tests.push({
                name: 'Health Check',
                success: false,
                error: error.message
            });
        }
        
        // Test 2: API Staff
        try {
            const response = await fetch(`${baseUrl}/api/visitors/public/staff`, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Accept': 'application/json'
                }
            });
            tests.push({
                name: 'Staff API',
                success: response.ok,
                status: response.status,
                headers: Object.fromEntries(response.headers.entries())
            });
        } catch (error) {
            tests.push({
                name: 'Staff API',
                success: false,
                error: error.message
            });
        }
        
        return tests;
    }
    
    static async testCors() {
        console.log('🔒 Test CORS...');
        
        try {
            const response = await fetch('https://goosecorporationbck-production.up.railway.app/api/visitors/public/staff', {
                method: 'OPTIONS',
                mode: 'cors'
            });
            
            return {
                success: true,
                allowOrigin: response.headers.get('Access-Control-Allow-Origin'),
                allowMethods: response.headers.get('Access-Control-Allow-Methods'),
                allowHeaders: response.headers.get('Access-Control-Allow-Headers'),
                csp: response.headers.get('Content-Security-Policy')
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    static async testEndpoints() {
        console.log('🎯 Test des endpoints...');
        
        const endpoints = [
            '/api/visitors/public/health',
            '/api/visitors/public/staff',
            '/api/visitors/public/formations'
        ];
        
        const results = [];
        const baseUrl = 'https://goosecorporationbck-production.up.railway.app';
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${baseUrl}${endpoint}`, {
                    method: 'GET',
                    mode: 'cors',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                let data = null;
                try {
                    data = await response.json();
                } catch (e) {
                    data = await response.text();
                }
                
                results.push({
                    endpoint,
                    success: response.ok,
                    status: response.status,
                    dataLength: typeof data === 'string' ? data.length : JSON.stringify(data).length
                });
            } catch (error) {
                results.push({
                    endpoint,
                    success: false,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    static checkConfiguration() {
        const config = window.CONFIG || {};
        return {
            apiBaseUrl: config.API_BASE_URL,
            timeout: config.TIMEOUT,
            environment: config.isProduction ? 'production' : 'development',
            demoMode: config.DEMO_MODE
        };
    }
    
    static displayResults(results) {
        console.group('🔍 DIAGNOSTIC API COMPLET');
        
        console.group('🌍 Environnement');
        console.table(results.environment);
        console.groupEnd();
        
        console.group('🔗 Connectivité');
        console.table(results.connectivity);
        console.groupEnd();
        
        console.group('🔒 CORS');
        console.table(results.cors);
        console.groupEnd();
        
        console.group('🎯 Endpoints');
        console.table(results.endpoints);
        console.groupEnd();
        
        console.group('⚙️ Configuration');
        console.table(results.configuration);
        console.groupEnd();
        
        // Analyse des problèmes
        this.analyzeProblems(results);
        
        console.groupEnd();
    }
    
    static analyzeProblems(results) {
        console.group('🚨 ANALYSE DES PROBLÈMES');
        
        const problems = [];
        const solutions = [];
        
        // Vérifier CORS
        if (!results.cors.success) {
            problems.push('❌ Erreur CORS');
            solutions.push('🔧 Configurer CORS sur le backend pour autoriser ' + window.location.origin);
        }
        
        // Vérifier CSP
        if (results.cors.csp && results.cors.csp.includes("connect-src 'self'")) {
            problems.push('❌ CSP trop restrictif');
            solutions.push('🔧 Modifier le CSP: connect-src \'self\' https://*.netlify.app');
        }
        
        // Vérifier les endpoints
        const failedEndpoints = results.endpoints.filter(e => !e.success);
        if (failedEndpoints.length > 0) {
            problems.push(`❌ ${failedEndpoints.length} endpoints en échec`);
            solutions.push('🔧 Vérifier que le backend est démarré et accessible');
        }
        
        if (problems.length === 0) {
            console.log('✅ Aucun problème détecté !');
        } else {
            console.log('PROBLÈMES DÉTECTÉS:');
            problems.forEach(p => console.log(p));
            console.log('\nSOLUTIONS RECOMMANDÉES:');
            solutions.forEach(s => console.log(s));
        }
        
        console.groupEnd();
    }
    
    static async quickTest() {
        try {
            const response = await fetch('https://goosecorporationbck-production.up.railway.app/api/visitors/public/staff', {
                method: 'GET',
                mode: 'cors'
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ API accessible, données reçues:', data);
                return true;
            } else {
                console.error('❌ API retourne une erreur:', response.status);
                return false;
            }
        } catch (error) {
            console.error('❌ Impossible de contacter l\'API:', error.message);
            return false;
        }
    }
}

// Exporter globalement
window.ApiDiagnostics = ApiDiagnostics;

// Auto-test en production
if (window.location.hostname !== 'localhost') {
    // Attendre que la page soit chargée
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('🔍 Démarrage du diagnostic automatique...');
            ApiDiagnostics.quickTest();
        }, 2000);
    });
}

export default ApiDiagnostics; 