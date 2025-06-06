// main.js
// Script principal do EliteControl

// ========== INICIALIZAÇÃO GLOBAL ==========

/**
 * Verificar se todos os módulos foram carregados
 */
function checkModulesLoaded() {
    const requiredModules = [
        'firebase',
        'auth',
        'db',
        'firebaseService',
        'authManager',
        'EliteConfig',
        'EliteUtils'
    ];
    
    const missingModules = requiredModules.filter(module => !window[module]);
    
    if (missingModules.length > 0) {
        console.error('Módulos faltando:', missingModules);
        return false;
    }
    
    console.log('✅ Todos os módulos carregados com sucesso');
    return true;
}

/**
 * Inicializar aplicação
 */
async function initializeApp() {
    try {
        // Verificar módulos
        if (!checkModulesLoaded()) {
            throw new Error('Módulos necessários não foram carregados');
        }
        
        // Configurar tratamento de erros global
        setupErrorHandling();
        
        // Verificar compatibilidade do navegador
        if (!checkBrowserSupport()) {
            throw new Error('Navegador não suportado');
        }
        
        // Configurar service worker para PWA
        setupServiceWorker();
        
        // Configurar listeners globais
        setupGlobalListeners();
        
        // Inicializar roteamento
        initializeRouting();
        
        console.log('✅ Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('❌ Erro ao inicializar aplicação:', error);
        showFatalError(error.message);
    }
}

/**
 * Configurar tratamento de erros
 */
function setupErrorHandling() {
    // Capturar erros não tratados
    window.addEventListener('error', (event) => {
        console.error('Erro capturado:', event.error);
        
        // Enviar erro para serviço de monitoramento em produção
        if (!isDevelopment) {
            // logErrorToService(event.error);
        }
        
        // Mostrar notificação amigável ao usuário
        if (event.error?.message?.includes('Firebase')) {
            showToast('Erro de conexão. Verifique sua internet.', 'error');
        }
    });
    
    // Capturar promises rejeitadas
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Promise rejeitada:', event.reason);
        
        // Prevenir que o erro apareça no console do navegador
        event.preventDefault();
    });
}

/**
 * Verificar suporte do navegador
 */
function checkBrowserSupport() {
    // Verificar recursos essenciais
    const features = {
        'Service Worker': 'serviceWorker' in navigator,
        'Local Storage': 'localStorage' in window,
        'Session Storage': 'sessionStorage' in window,
        'Fetch API': 'fetch' in window,
        'Promises': 'Promise' in window
    };
    
    const unsupported = Object.entries(features)
        .filter(([name, supported]) => !supported)
        .map(([name]) => name);
    
    if (unsupported.length > 0) {
        console.error('Recursos não suportados:', unsupported);
        return false;
    }
    
    return true;
}

/**
 * Configurar Service Worker
 */
async function setupServiceWorker() {
    if ('serviceWorker' in navigator && !isDevelopment) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registrado:', registration);
        } catch (error) {
            console.error('Erro ao registrar Service Worker:', error);
        }
    }
}

/**
 * Configurar listeners globais
 */
function setupGlobalListeners() {
    // Detectar mudanças de conectividade
    window.addEventListener('online', () => {
        showToast('Conexão restaurada', 'success');
        
        // Sincronizar dados pendentes
        if (window.firebaseService) {
            // firebaseService.syncPendingData();
        }
    });
    
    window.addEventListener('offline', () => {
        showToast('Sem conexão - Modo offline ativado', 'warning');
    });
    
    // Detectar mudanças de visibilidade da página
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Página está oculta
            console.log('Página oculta');
        } else {
            // Página está visível
            console.log('Página visível');
            
            // Verificar sessão
            if (window.authManager) {
                authManager.checkSession();
            }
        }
    });
}

/**
 * Inicializar roteamento
 */
function initializeRouting() {
    const currentPage = window.location.pathname;
    
    // Páginas que não requerem autenticação
    const publicPages = ['/index.html', '/', '/login.html'];
    
    // Verificar se é página pública
    const isPublicPage = publicPages.some(page => currentPage.includes(page));
    
    if (!isPublicPage) {
        // Verificar autenticação
        if (authManager && !authManager.isAuthenticated()) {
            // Salvar página atual para redirecionar após login
            sessionStorage.setItem('redirectUrl', window.location.href);
            window.location.href = EliteConfig.routes.login;
        }
    }
}

/**
 * Mostrar erro fatal
 */
function showFatalError(message) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'fatal-error';
    errorContainer.innerHTML = `
        <div class="fatal-error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h1>Erro ao carregar aplicação</h1>
            <p>${message}</p>
            <button onclick="location.reload()">Recarregar</button>
        </div>
    `;
    
    document.body.innerHTML = '';
    document.body.appendChild(errorContainer);
}

// ========== PÁGINAS ESPECÍFICAS ==========

/**
 * Inicializar página de login
 */
function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    
    if (!loginForm) return;
    
    // Verificar se deve lembrar o email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = rememberedEmail;
        }
    }
    
    // Configurar formulário de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const perfil = document.getElementById('perfil').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        
        // Validar campos
        if (!email || !password || !perfil) {
            showToast('Por favor, preencha todos os campos', 'warning');
            return;
        }
        
        // Mostrar loading
        showButtonLoading(e.target.querySelector('button[type="submit"]'), 'Entrando...');
        
        try {
            // Fazer login
            const result = await authManager.login(email, password, rememberMe);
            
            if (result.success) {
                // Verificar se o perfil corresponde
                const userProfile = authManager.getUserProfile();
                if (userProfile?.role !== perfil) {
                    showToast('Perfil selecionado não corresponde ao seu cadastro', 'error');
                    await authManager.logout();
                    return;
                }
                
                // Salvar tempo de login
                localStorage.setItem('loginTime', Date.now().toString());
                
                // Redirecionar
                const redirectUrl = sessionStorage.getItem('redirectUrl') || EliteConfig.routes.dashboard;
                sessionStorage.removeItem('redirectUrl');
                window.location.href = redirectUrl;
            } else {
                showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            showToast('Erro ao fazer login. Tente novamente.', 'error');
        } finally {
            hideButtonLoading(e.target.querySelector('button[type="submit"]'));
        }
    });
    
    // Configurar link de recuperação de senha
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            showPasswordResetModal();
        });
    }
}

/**
 * Mostrar modal de recuperação de senha
 */
function showPasswordResetModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">
                    <i class="fas fa-key mr-2"></i>
                    Recuperar Senha
                </h3>
                <button onclick="this.closest('.modal').remove()" class="modal-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Digite seu email para receber instruções de recuperação de senha.</p>
                <form id="resetPasswordForm">
                    <div class="form-group">
                        <label for="resetEmail" class="form-label">Email</label>
                        <input type="email" 
                               id="resetEmail" 
                               class="form-input" 
                               placeholder="seu@email.com" 
                               required>
                    </div>
                    <button type="submit" class="btn-primary w-full">
                        Enviar Email de Recuperação
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar formulário
    const resetForm = document.getElementById('resetPasswordForm');
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;
        
        if (!email) {
            showToast('Por favor, digite seu email', 'warning');
            return;
        }
        
        showButtonLoading(e.target.querySelector('button[type="submit"]'), 'Enviando...');
        
        try {
            const result = await authManager.resetPassword(email);
            
            if (result.success) {
                showToast(result.message, 'success');
                modal.remove();
            } else {
                showToast(result.error, 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            showToast('Erro ao enviar email de recuperação', 'error');
        } finally {
            hideButtonLoading(e.target.querySelector('button[type="submit"]'));
        }
    });
}

// ========== FUNÇÕES UTILITÁRIAS GLOBAIS ==========

/**
 * Verificar se está em desenvolvimento
 */
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

/**
 * Criar elemento DOM
 */
function createElement(tag, className, innerHTML) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

/**
 * Aguardar elemento aparecer no DOM
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations, obs) => {
            const element = document.querySelector(selector);
            if (element) {
                obs.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Elemento ${selector} não encontrado`));
        }, timeout);
    });
}

/**
 * Fazer request com retry
 */
async function fetchWithRetry(url, options = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return response;
        } catch (error) {
            console.error(`Tentativa ${i + 1} falhou:`, error);
            
            if (i === retries - 1) {
                throw error;
            }
            
            // Aguardar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}

/**
 * Exportar dados
 */
function exportData(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
    
    showToast('Dados exportados com sucesso!', 'success');
}

/**
 * Importar dados
 */
function importData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error('Arquivo inválido'));
            }
        };
        
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

// ========== ATALHOS DE TECLADO ==========

/**
 * Configurar atalhos de teclado
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Verificar se não está em um input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + K - Busca global
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            focusGlobalSearch();
        }
        
        // Ctrl/Cmd + N - Nova venda
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            if (authManager.hasPermission('manage_sales')) {
                showSection('sales');
            }
        }
        
        // Ctrl/Cmd + P - Produtos
        if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
            e.preventDefault();
            if (authManager.hasPermission('manage_products')) {
                showSection('products');
            }
        }
        
        // Ctrl/Cmd + D - Dashboard
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            showSection('dashboard');
        }
        
        // Ctrl/Cmd + L - Logout
        if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
            e.preventDefault();
            if (confirm('Deseja sair do sistema?')) {
                authManager.logout();
            }
        }
    });
}

/**
 * Focar na busca global
 */
function focusGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

// ========== INICIALIZAÇÃO ==========

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM carregado - Inicializando EliteControl...');
    
    // Inicializar aplicação
    initializeApp();
    
    // Configurar atalhos de teclado
    setupKeyboardShortcuts();
    
    // Inicializar página específica
    const currentPage = window.location.pathname;
    
    if (currentPage.includes('index.html') || currentPage === '/' || currentPage === '') {
        initializeLoginPage();
    }
    
    // Registrar tempo de carregamento
    if (window.performance) {
        const loadTime = performance.now();
        console.log(`⏱️ Tempo de carregamento: ${loadTime.toFixed(2)}ms`);
    }
});

// ========== EXPORTS ==========

// Exportar funções globais
window.showToast = showToast || function() {};
window.showButtonLoading = showButtonLoading || function() {};
window.hideButtonLoading = hideButtonLoading || function() {};
window.exportData = exportData;
window.importData = importData;

console.log('✅ EliteControl v2.0 - Sistema carregado e pronto para uso!');
