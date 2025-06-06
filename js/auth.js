// auth.js
// Sistema de autenticação e controle de acesso

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.authStateListeners = [];
        this.loginAttempts = new Map();
    }

    /**
     * Inicializar gerenciador de autenticação
     */
    init() {
        // Escutar mudanças no estado de autenticação
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.handleUserLogin(user);
            } else {
                this.handleUserLogout();
            }
        });

        // Verificar sessão ao carregar
        this.checkSession();
    }

    /**
     * Lidar com login do usuário
     */
    async handleUserLogin(user) {
        this.currentUser = user;
        
        // Buscar perfil do usuário
        const profileResult = await firebaseService.getUserProfile(user.uid);
        if (profileResult) {
            this.userProfile = profileResult;
        }

        // Atualizar último login
        await firebaseService.updateUserProfile(user.uid, {
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Notificar listeners
        this.notifyAuthStateChange(true);

        // Redirecionar se estiver na página de login
        if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            window.location.href = EliteConfig.routes.dashboard;
        }
    }

    /**
     * Lidar com logout do usuário
     */
    handleUserLogout() {
        this.currentUser = null;
        this.userProfile = null;

        // Notificar listeners
        this.notifyAuthStateChange(false);

        // Redirecionar para login se não estiver lá
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = EliteConfig.routes.login;
        }
    }

    /**
     * Verificar sessão
     */
    checkSession() {
        const sessionTimeout = EliteConfig.auth.sessionTimeout;
        const lastActivity = localStorage.getItem('lastActivity');

        if (lastActivity) {
            const timeSinceActivity = Date.now() - parseInt(lastActivity);
            
            if (timeSinceActivity > sessionTimeout) {
                this.logout();
                showToast('Sessão expirada. Por favor, faça login novamente.', 'warning');
            }
        }

        // Atualizar última atividade
        this.updateLastActivity();

        // Monitorar atividade do usuário
        ['click', 'keypress', 'mousemove', 'scroll'].forEach(event => {
            document.addEventListener(event, EliteUtils.debounce(() => {
                this.updateLastActivity();
            }, 5000));
        });
    }

    /**
     * Atualizar última atividade
     */
    updateLastActivity() {
        localStorage.setItem('lastActivity', Date.now().toString());
    }

    /**
     * Fazer login
     */
    async login(email, password, rememberMe = false) {
        try {
            // Verificar tentativas de login
            if (this.isAccountLocked(email)) {
                return {
                    success: false,
                    error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.'
                };
            }

            // Registrar tentativa
            this.recordLoginAttempt(email);

            // Fazer login
            const result = await firebaseService.login(email, password, rememberMe);

            if (result.success) {
                // Limpar tentativas
                this.loginAttempts.delete(email);
                
                // Salvar preferência de lembrar
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('rememberedEmail');
                }
            } else {
                // Incrementar tentativas falhas
                const attempts = this.loginAttempts.get(email) || { count: 0, firstAttempt: Date.now() };
                attempts.count++;
                this.loginAttempts.set(email, attempts);
            }

            return result;
        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                error: 'Erro ao fazer login. Tente novamente.'
            };
        }
    }

    /**
     * Fazer logout
     */
    async logout() {
        try {
            await firebaseService.logout();
            
            // Limpar dados locais
            localStorage.removeItem('lastActivity');
            sessionStorage.clear();
            
            // Redirecionar para login
            window.location.href = EliteConfig.routes.login;
        } catch (error) {
            console.error('Erro no logout:', error);
            showToast('Erro ao sair. Tente novamente.', 'error');
        }
    }

    /**
     * Verificar se conta está bloqueada
     */
    isAccountLocked(email) {
        const attempts = this.loginAttempts.get(email);
        
        if (!attempts) return false;
        
        if (attempts.count >= EliteConfig.auth.maxLoginAttempts) {
            const timeSinceFirst = Date.now() - attempts.firstAttempt;
            
            if (timeSinceFirst < EliteConfig.auth.lockoutDuration) {
                return true;
            } else {
                // Limpar tentativas antigas
                this.loginAttempts.delete(email);
                return false;
            }
        }
        
        return false;
    }

    /**
     * Registrar tentativa de login
     */
    recordLoginAttempt(email) {
        const attempts = this.loginAttempts.get(email) || {
            count: 0,
            firstAttempt: Date.now()
        };
        
        // Resetar contador se passou muito tempo
        if (Date.now() - attempts.firstAttempt > EliteConfig.auth.lockoutDuration) {
            attempts.count = 0;
            attempts.firstAttempt = Date.now();
        }
        
        this.loginAttempts.set(email, attempts);
    }

    /**
     * Obter usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Obter perfil do usuário
     */
    getUserProfile() {
        return this.userProfile;
    }

    /**
     * Verificar se usuário está autenticado
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Verificar permissão
     */
    hasPermission(permission) {
        if (!this.userProfile) return false;
        
        const permissions = this.getPermissionsByRole(this.userProfile.role);
        return permissions.includes(permission);
    }

    /**
     * Obter permissões por cargo
     */
    getPermissionsByRole(role) {
        const rolePermissions = {
            'Dono/Gerente': [
                'view_dashboard',
                'manage_products',
                'manage_sales',
                'manage_customers',
                'view_reports',
                'manage_users',
                'manage_settings',
                'use_ai',
                'export_data',
                'delete_data'
            ],
            'Controlador de Estoque': [
                'view_dashboard',
                'manage_products',
                'view_sales',
                'view_reports',
                'use_ai'
            ],
            'Vendedor': [
                'view_dashboard',
                'view_products',
                'manage_sales',
                'manage_customers',
                'view_reports',
                'use_ai'
            ]
        };
        
        return rolePermissions[role] || [];
    }

    /**
     * Adicionar listener de mudança de autenticação
     */
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
        
        // Chamar imediatamente com estado atual
        callback(this.isAuthenticated());
        
        // Retornar função para remover listener
        return () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
                this.authStateListeners.splice(index, 1);
            }
        };
    }

    /**
     * Notificar mudança no estado de autenticação
     */
    notifyAuthStateChange(isAuthenticated) {
        this.authStateListeners.forEach(callback => {
            try {
                callback(isAuthenticated);
            } catch (error) {
                console.error('Erro em auth state listener:', error);
            }
        });
    }

    /**
     * Resetar senha
     */
    async resetPassword(email) {
        try {
            await auth.sendPasswordResetEmail(email);
            return {
                success: true,
                message: 'Email de recuperação enviado com sucesso!'
            };
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            return {
                success: false,
                error: firebaseService.getAuthErrorMessage(error.code)
            };
        }
    }

    /**
     * Alterar senha
     */
    async changePassword(currentPassword, newPassword) {
        try {
            const user = auth.currentUser;
            
            if (!user) {
                throw new Error('Usuário não autenticado');
            }
            
            // Re-autenticar usuário
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            
            await user.reauthenticateWithCredential(credential);
            
            // Alterar senha
            await user.updatePassword(newPassword);
            
            return {
                success: true,
                message: 'Senha alterada com sucesso!'
            };
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            return {
                success: false,
                error: firebaseService.getAuthErrorMessage(error.code)
            };
        }
    }

    /**
     * Atualizar perfil do usuário
     */
    async updateProfile(profileData) {
        try {
            const user = auth.currentUser;
            
            if (!user) {
                throw new Error('Usuário não autenticado');
            }
            
            // Atualizar display name se fornecido
            if (profileData.displayName) {
                await user.updateProfile({
                    displayName: profileData.displayName
                });
            }
            
            // Atualizar dados no Firestore
            const result = await firebaseService.updateUserProfile(user.uid, profileData);
            
            if (result.success) {
                // Atualizar perfil local
                this.userProfile = {
                    ...this.userProfile,
                    ...profileData
                };
            }
            
            return result;
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return {
                success: false,
                error: 'Erro ao atualizar perfil'
            };
        }
    }
}

// Instanciar e exportar gerenciador
window.authManager = new AuthManager();

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    authManager.init();
});
