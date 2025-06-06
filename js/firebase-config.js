// firebase-config.js
// Configuração do Firebase para o EliteControl

// Configuração do Firebase (substitua com suas credenciais)
const firebaseConfig = {
    apiKey: "AIzaSyDemoKeyHere123456789",
    authDomain: "elitecontrol-demo.firebaseapp.com",
    projectId: "elitecontrol-demo",
    storageBucket: "elitecontrol-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789",
    measurementId: "G-DEMO123456"
};

// Inicializar Firebase
try {
    firebase.initializeApp(firebaseConfig);
    
    // Inicializar serviços
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    
    // Configurar persistência offline
    db.enablePersistence({ synchronizeTabs: true })
        .catch((err) => {
            if (err.code === 'unimplemented') {
                console.warn('Persistência offline não disponível neste navegador');
            }
        });
    
    // Configurar idioma do Auth para português
    auth.languageCode = 'pt-BR';
    
    console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
}

// Modo de desenvolvimento
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

if (isDevelopment) {
    console.log('🔧 Modo de desenvolvimento ativado');
    
    // Configurar emuladores locais (se disponíveis)
    // Descomente as linhas abaixo se estiver usando emuladores
    // auth.useEmulator('http://localhost:9099');
    // db.useEmulator('localhost', 8080);
}

// Configurações globais do sistema
window.EliteConfig = {
    // Configurações de autenticação
    auth: {
        sessionTimeout: 60 * 60 * 1000, // 1 hora em ms
        rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 dias em ms
        maxLoginAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutos em ms
    },
    
    // Configurações de UI
    ui: {
        toastDuration: 3000, // 3 segundos
        animationDuration: 300, // 300ms
        debounceDelay: 500, // 500ms
        notificationCheckInterval: 30000 // 30 segundos
    },
    
    // Configurações de dados
    data: {
        pageSize: 20,
        maxUploadSize: 5 * 1024 * 1024, // 5MB
        cacheExpiration: 5 * 60 * 1000, // 5 minutos
        syncInterval: 60000 // 1 minuto
    },
    
    // Configurações de negócio
    business: {
        lowStockThreshold: 10,
        criticalStockThreshold: 5,
        salesTaxRate: 0.175, // 17.5%
        currency: 'BRL',
        locale: 'pt-BR'
    },
    
    // Rotas da aplicação
    routes: {
        login: '/index.html',
        dashboard: '/dashboard.html',
        products: '/products.html',
        sales: '/sales.html',
        reports: '/reports.html',
        settings: '/settings.html'
    }
};

// Funções utilitárias globais
window.EliteUtils = {
    // Formatar moeda
    formatCurrency: (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    },
    
    // Formatar data
    formatDate: (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('pt-BR').format(d);
    },
    
    // Formatar data e hora
    formatDateTime: (date) => {
        if (!date) return '';
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        }).format(d);
    },
    
    // Debounce
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle
    throttle: (func, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Gerar ID único
    generateId: () => {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },
    
    // Validar email
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Sanitizar entrada
    sanitizeInput: (input) => {
        if (typeof input !== 'string') return input;
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },
    
    // Obter iniciais do nome
    getInitials: (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    },
    
    // Verificar se é dispositivo móvel
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    // Copiar para clipboard
    copyToClipboard: async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Erro ao copiar:', err);
            return false;
        }
    },
    
    // Fazer download de dados
    downloadData: (data, filename, type = 'application/json') => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};

// Interceptar erros globais
window.addEventListener('error', (event) => {
    console.error('Erro global:', event.error);
    
    // Em produção, enviar erros para serviço de monitoramento
    if (!isDevelopment) {
        // Implementar envio para Sentry, LogRocket, etc.
    }
});

// Interceptar rejeições de Promise não tratadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada:', event.reason);
    
    // Em produção, enviar erros para serviço de monitoramento
    if (!isDevelopment) {
        // Implementar envio para Sentry, LogRocket, etc.
    }
});

// Verificar compatibilidade do navegador
(function checkBrowserCompatibility() {
    const requiredFeatures = [
        'Promise',
        'fetch',
        'localStorage',
        'sessionStorage',
        'addEventListener'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => !(feature in window));
    
    if (missingFeatures.length > 0) {
        console.error('Navegador incompatível. Recursos faltando:', missingFeatures);
        alert('Seu navegador não é compatível com o EliteControl. Por favor, atualize para uma versão mais recente.');
    }
})();

// Exportar configuração para uso em outros módulos
window.firebaseConfig = firebaseConfig;
