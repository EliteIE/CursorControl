// dashboard.js
// Funcionalidades específicas do dashboard

class DashboardManager {
    constructor() {
        this.charts = {};
        this.stats = {};
        this.activities = [];
        this.refreshInterval = null;
    }

    /**
     * Inicializar dashboard
     */
    async init() {
        try {
            showLoading();

            // Verificar autenticação
            if (!authManager.isAuthenticated()) {
                window.location.href = EliteConfig.routes.login;
                return;
            }

            // Configurar interface do usuário
            this.setupUserInterface();

            // Carregar dados iniciais
            await this.loadDashboardData();

            // Configurar listeners em tempo real
            this.setupRealtimeListeners();

            // Configurar auto-refresh
            this.setupAutoRefresh();

            // Configurar eventos
            this.setupEventListeners();

            hideLoading();
        } catch (error) {
            console.error('Erro ao inicializar dashboard:', error);
            hideLoading();
            showToast('Erro ao carregar dashboard', 'error');
        }
    }

    /**
     * Configurar interface do usuário
     */
    setupUserInterface() {
        const user = authManager.getCurrentUser();
        const profile = authManager.getUserProfile();

        // Atualizar informações do usuário
        const userElements = {
            welcomeUserName: document.getElementById('welcomeUserName'),
            usernameDisplay: document.getElementById('usernameDisplay'),
            userRoleDisplay: document.getElementById('userRoleDisplay'),
            userInitials: document.getElementById('userInitials'),
            userDropdownName: document.getElementById('userDropdownName'),
            userDropdownEmail: document.getElementById('userDropdownEmail'),
            userDropdownInitials: document.getElementById('userDropdownInitials'),
            userAvatar: document.getElementById('userAvatar'),
            sidebarProfileName: document.getElementById('sidebarProfileName')
        };

        const displayName = profile?.name || user?.email?.split('@')[0] || 'Usuário';
        const initials = EliteUtils.getInitials(displayName);

        // Atualizar elementos
        if (userElements.welcomeUserName) userElements.welcomeUserName.textContent = displayName;
        if (userElements.usernameDisplay) userElements.usernameDisplay.textContent = displayName;
        if (userElements.userRoleDisplay) userElements.userRoleDisplay.textContent = profile?.role || 'Usuário';
        if (userElements.userInitials) userElements.userInitials.textContent = initials;
        if (userElements.userDropdownName) userElements.userDropdownName.textContent = displayName;
        if (userElements.userDropdownEmail) userElements.userDropdownEmail.textContent = user?.email || '';
        if (userElements.userDropdownInitials) userElements.userDropdownInitials.textContent = initials;
        if (userElements.sidebarProfileName) userElements.sidebarProfileName.textContent = `Painel - ${profile?.role || 'Usuário'}`;

        // Atualizar data
        const todayDate = document.getElementById('todayDate');
        if (todayDate) {
            todayDate.textContent = new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Configurar navegação baseada no perfil
        this.setupNavigation(profile?.role);

        // Atualizar tempo online
        this.updateOnlineTime();
        setInterval(() => this.updateOnlineTime(), 60000); // Atualizar a cada minuto
    }

    /**
     * Configurar navegação baseada no perfil
     */
    setupNavigation(role) {
        const navLinks = document.getElementById('navLinks');
        if (!navLinks) return;

        const permissions = authManager.getPermissionsByRole(role);

        const navItems = [
            {
                icon: 'fa-chart-line',
                text: 'Dashboard',
                page: 'dashboard',
                permission: 'view_dashboard'
            },
            {
                icon: 'fa-box',
                text: 'Produtos',
                page: 'products',
                permission: 'manage_products'
            },
            {
                icon: 'fa-shopping-cart',
                text: 'Vendas',
                page: 'sales',
                permission: 'manage_sales'
            },
            {
                icon: 'fa-users',
                text: 'Clientes',
                page: 'customers',
                permission: 'manage_customers'
            },
            {
                icon: 'fa-chart-bar',
                text: 'Relatórios',
                page: 'reports',
                permission: 'view_reports'
            },
            {
                icon: 'fa-robot',
                text: 'Assistente IA',
                page: 'ai-assistant',
                permission: 'use_ai'
            },
            {
                icon: 'fa-cog',
                text: 'Configurações',
                page: 'settings',
                permission: 'manage_settings'
            }
        ];

        navLinks.innerHTML = navItems
            .filter(item => permissions.includes(item.permission))
            .map(item => `
                <a href="#" 
                   class="nav-link ${item.page === 'dashboard' ? 'active' : ''}" 
                   data-page="${item.page}"
                   onclick="showSection('${item.page}'); return false;">
                    <i class="fas ${item.icon} nav-icon"></i>
                    <span class="nav-text">${item.text}</span>
                </a>
            `).join('');
    }

    /**
     * Atualizar tempo online
     */
    updateOnlineTime() {
        const onlineTime = document.getElementById('onlineTime');
        if (!onlineTime) return;

        const loginTime = parseInt(localStorage.getItem('loginTime') || Date.now());
        const now = Date.now();
        const diff = now - loginTime;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        onlineTime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    /**
     * Carregar dados do dashboard
     */
    async loadDashboardData() {
        try {
            // Carregar estatísticas
            await this.loadStats();

            // Carregar gráficos
            await this.loadCharts();

            // Carregar atividades recentes
            await this.loadRecentActivities();

            // Carregar notificações
            await this.loadNotifications();
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showToast('Erro ao carregar alguns dados', 'warning');
        }
    }

    /**
     * Carregar estatísticas
     */
    async loadStats() {
        try {
            // Obter dados do Firebase
            const [productsResult, salesStats, customersResult] = await Promise.all([
                firebaseService.getProducts(),
                firebaseService.getSalesStats('month'),
                firebaseService.getCustomers()
            ]);

            // Calcular estatísticas
            this.stats = {
                totalSales: salesStats.data?.totalRevenue || 0,
                totalProducts: productsResult.data?.length || 0,
                lowStock: productsResult.data?.filter(p => p.stock <= EliteConfig.business.lowStockThreshold).length || 0,
                totalCustomers: customersResult.data?.length || 0
            };

            // Atualizar interface
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Erro ao carregar estatísticas:', error);
        }
    }

    /**
     * Atualizar exibição das estatísticas
     */
    updateStatsDisplay() {
        const elements = {
            totalSalesValue: document.getElementById('totalSalesValue'),
            totalProductsValue: document.getElementById('totalProductsValue'),
            lowStockValue: document.getElementById('lowStockValue'),
            totalCustomersValue: document.getElementById('totalCustomersValue')
        };

        if (elements.totalSalesValue) {
            elements.totalSalesValue.textContent = EliteUtils.formatCurrency(this.stats.totalSales);
        }

        if (elements.totalProductsValue) {
            elements.totalProductsValue.textContent = this.stats.totalProducts;
        }

        if (elements.lowStockValue) {
            elements.lowStockValue.textContent = this.stats.lowStock;
            
            // Adicionar classe de alerta se houver produtos com estoque baixo
            if (this.stats.lowStock > 0) {
                elements.lowStockValue.parentElement.parentElement.classList.add('alert');
            }
        }

        if (elements.totalCustomersValue) {
            elements.totalCustomersValue.textContent = this.stats.totalCustomers;
        }
    }

    /**
     * Carregar gráficos
     */
    async loadCharts() {
        try {
            // Obter dados de vendas
            const salesResult = await firebaseService.getSales({
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
                limit: 100
            });

            // Preparar dados para gráfico de vendas
            const salesByDay = this.prepareSalesChartData(salesResult.data || []);
            
            // Criar gráfico de vendas
            if (document.getElementById('salesChart')) {
                this.createSalesChart(salesByDay);
            }

            // Obter dados de produtos por categoria
            const productsResult = await firebaseService.getProducts();
            const categoryData = this.prepareCategoryChartData(productsResult.data || []);
            
            // Criar gráfico de categorias
            if (document.getElementById('categoryChart')) {
                this.createCategoryChart(categoryData);
            }
        } catch (error) {
            console.error('Erro ao carregar gráficos:', error);
        }
    }

    /**
     * Preparar dados para gráfico de vendas
     */
    prepareSalesChartData(sales) {
        const days = 7;
        const data = {};
        
        // Inicializar dados para últimos 7 dias
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const key = date.toISOString().split('T')[0];
            data[key] = 0;
        }

        // Agregar vendas por dia
        sales.forEach(sale => {
            if (sale.createdAt) {
                const date = sale.createdAt.toDate();
                const key = date.toISOString().split('T')[0];
                if (data[key] !== undefined) {
                    data[key] += sale.total || 0;
                }
            }
        });

        // Converter para formato do Chart.js
        const labels = Object.keys(data).reverse().map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
        });

        const values = Object.values(data).reverse();

        return { labels, values };
    }

    /**
     * Criar gráfico de vendas
     */
    createSalesChart(data) {
        const ctx = document.getElementById('salesChart').getContext('2d');
        
        if (this.charts.sales) {
            this.charts.sales.destroy();
        }

        this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Vendas',
                    data: data.values,
                    borderColor: '#38BDF8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#38BDF8',
                    pointBorderColor: '#1E293B',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: '#F1F5F9',
                        bodyColor: '#94A3B8',
                        borderColor: '#475569',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return 'Vendas: ' + EliteUtils.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(71, 85, 105, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94A3B8',
                            font: {
                                size: 12
                            }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(71, 85, 105, 0.2)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#94A3B8',
                            font: {
                                size: 12
                            },
                            callback: function(value) {
                                return EliteUtils.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Preparar dados para gráfico de categorias
     */
    prepareCategoryChartData(products) {
        const categories = {};
        
        products.forEach(product => {
            const category = product.category || 'Sem categoria';
            categories[category] = (categories[category] || 0) + 1;
        });

        return {
            labels: Object.keys(categories),
            values: Object.values(categories)
        };
    }

    /**
     * Criar gráfico de categorias
     */
    createCategoryChart(data) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }

        const colors = [
            '#38BDF8',
            '#6366F1',
            '#F59E0B',
            '#10B981',
            '#EF4444',
            '#8B5CF6',
            '#EC4899',
            '#06B6D4'
        ];

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: colors.slice(0, data.labels.length),
                    borderColor: '#1E293B',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94A3B8',
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        titleColor: '#F1F5F9',
                        bodyColor: '#94A3B8',
                        borderColor: '#475569',
                        borderWidth: 1,
                        padding: 12
                    }
                }
            }
        });
    }

    /**
     * Carregar atividades recentes
     */
    async loadRecentActivities() {
        try {
            const activities = [
                {
                    type: 'sale',
                    title: 'Nova venda realizada',
                    description: 'Venda #1234 - R$ 150,00',
                    time: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
                    icon: 'fa-shopping-cart',
                    color: 'green'
                },
                {
                    type: 'product',
                    title: 'Produto atualizado',
                    description: 'Notebook Dell - Estoque: 15',
                    time: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
                    icon: 'fa-box',
                    color: 'blue'
                },
                {
                    type: 'alert',
                    title: 'Estoque baixo',
                    description: 'Mouse Logitech - Apenas 3 unidades',
                    time: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
                    icon: 'fa-exclamation-triangle',
                    color: 'yellow'
                },
                {
                    type: 'customer',
                    title: 'Novo cliente cadastrado',
                    description: 'João Silva',
                    time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 horas atrás
                    icon: 'fa-user-plus',
                    color: 'purple'
                }
            ];

            this.renderRecentActivities(activities);
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
        }
    }

    /**
     * Renderizar atividades recentes
     */
    renderRecentActivities(activities) {
        const container = document.getElementById('recentActivities');
        if (!container) return;

        const html = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon activity-icon-${activity.color}">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${getTimeAgo(activity.time)}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html || '<p class="text-center text-slate-500">Nenhuma atividade recente</p>';
    }

    /**
     * Carregar notificações
     */
    async loadNotifications() {
        try {
            const result = await firebaseService.getNotifications(true); // Apenas não lidas
            
            if (result.success) {
                this.renderNotifications(result.data);
                updateNotificationBadge(result.data.length);
            }
        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
        }
    }

    /**
     * Renderizar notificações
     */
    renderNotifications(notifications) {
        const container = document.getElementById('notificationList');
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>Nenhuma notificação nova</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notification => 
            renderNotification(notification)
        ).join('');
    }

    /**
     * Configurar listeners em tempo real
     */
    setupRealtimeListeners() {
        // Escutar mudanças em produtos (para atualizar estatísticas)
        firebaseService.onProductsChange(() => {
            this.loadStats();
        });

        // Escutar novas notificações
        firebaseService.onNotificationsChange((notifications) => {
            this.renderNotifications(notifications);
            updateNotificationBadge(notifications.length);
        });
    }

    /**
     * Configurar auto-refresh
     */
    setupAutoRefresh() {
        // Atualizar dados a cada 5 minutos
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 5 * 60 * 1000);
    }

    /**
     * Atualizar dados
     */
    async refreshData() {
        try {
            await this.loadStats();
            await this.loadCharts();
            showToast('Dados atualizados', 'success');
        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
        }
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botão de refresh
        const refreshButton = document.getElementById('refreshDataButton');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.refreshData();
            });
        }

        // Botão do assistente IA
        const aiButton = document.getElementById('aiAssistantButton');
        if (aiButton) {
            aiButton.addEventListener('click', () => {
                openAIAssistant();
            });
        }

        // Botões de período do gráfico
        document.querySelectorAll('.chart-action-btn[data-period]').forEach(button => {
            button.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.updateChartPeriod(period);
                
                // Atualizar botão ativo
                document.querySelectorAll('.chart-action-btn[data-period]').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
            });
        });

        // Quick actions
        const quickSaleButton = document.getElementById('quickSaleButton');
        if (quickSaleButton) {
            quickSaleButton.addEventListener('click', () => {
                showSection('sales');
            });
        }

        const quickProductButton = document.getElementById('quickProductButton');
        if (quickProductButton) {
            quickProductButton.addEventListener('click', () => {
                showSection('products');
            });
        }

        // Marcar todas notificações como lidas
        const markAllAsReadButton = document.getElementById('markAllAsReadButton');
        if (markAllAsReadButton) {
            markAllAsReadButton.addEventListener('click', async () => {
                const notifications = await firebaseService.getNotifications(true);
                
                if (notifications.success && notifications.data.length > 0) {
                    for (const notification of notifications.data) {
                        await firebaseService.markNotificationAsRead(notification.id);
                    }
                    
                    this.loadNotifications();
                    showToast('Todas as notificações foram marcadas como lidas', 'success');
                }
            });
        }
    }

    /**
     * Atualizar período do gráfico
     */
    async updateChartPeriod(period) {
        let days;
        
        switch (period) {
            case 'week':
                days = 7;
                break;
            case 'month':
                days = 30;
                break;
            case 'year':
                days = 365;
                break;
            default:
                days = 7;
        }

        try {
            const salesResult = await firebaseService.getSales({
                startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                limit: 1000
            });

            const salesByDay = this.prepareSalesChartData(salesResult.data || []);
            
            // Atualizar gráfico
            if (this.charts.sales) {
                this.charts.sales.data.labels = salesByDay.labels;
                this.charts.sales.data.datasets[0].data = salesByDay.values;
                this.charts.sales.update();
            }
        } catch (error) {
            console.error('Erro ao atualizar período do gráfico:', error);
            showToast('Erro ao atualizar gráfico', 'error');
        }
    }

    /**
     * Destruir dashboard
     */
    destroy() {
        // Limpar intervalos
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Destruir gráficos
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}

// ========== FUNÇÕES GLOBAIS ==========

/**
 * Abrir assistente IA
 */
function openAIAssistant() {
    openModal('aiAssistantModal');
    
    // Focar no input
    setTimeout(() => {
        const input = document.getElementById('aiChatInput');
        if (input) input.focus();
    }, 300);
}

/**
 * Fechar assistente IA
 */
function closeAIAssistant() {
    closeModal('aiAssistantModal');
}

/**
 * Enviar sugestão do IA
 */
function sendAISuggestion(suggestion) {
    const input = document.getElementById('aiChatInput');
    if (input) {
        input.value = suggestion;
        handleAIChat();
    }
}

/**
 * Lidar com chat do IA
 */
async function handleAIChat() {
    const input = document.getElementById('aiChatInput');
    const messagesContainer = document.getElementById('aiChatMessages');
    
    if (!input || !messagesContainer) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    // Adicionar mensagem do usuário
    const userMessage = document.createElement('div');
    userMessage.className = 'ai-message ai-message-user';
    userMessage.innerHTML = `
        <div class="ai-message-content">
            <p>${EliteUtils.sanitizeInput(message)}</p>
        </div>
        <div class="ai-message-avatar">
            <i class="fas fa-user"></i>
        </div>
    `;
    messagesContainer.appendChild(userMessage);
    
    // Limpar input
    input.value = '';
    
    // Scroll para baixo
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Simular resposta do IA
    setTimeout(() => {
        const aiResponse = generateAIResponse(message);
        
        const aiMessage = document.createElement('div');
        aiMessage.className = 'ai-message ai-message-bot';
        aiMessage.innerHTML = `
            <div class="ai-message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="ai-message-content">
                ${aiResponse}
            </div>
        `;
        messagesContainer.appendChild(aiMessage);
        
        // Scroll para baixo
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 1000);
}

/**
 * Gerar resposta do IA (simulação)
 */
function generateAIResponse(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('produto') && lowerQuery.includes('vendido')) {
        return `
            <p>Analisando os dados de vendas... 📊</p>
            <p>O produto mais vendido este mês é:</p>
            <div class="ai-highlight">
                <strong>Notebook Dell Inspiron</strong><br>
                45 unidades vendidas<br>
                Receita total: R$ 135.000,00
            </div>
            <p>Recomendo manter um estoque adequado deste produto!</p>
        `;
    }
    
    if (lowerQuery.includes('previsão') && lowerQuery.includes('vendas')) {
        return `
            <p>Baseado na análise dos últimos 30 dias... 🔮</p>
            <p>Previsão para os próximos 7 dias:</p>
            <div class="ai-highlight">
                <strong>Vendas esperadas:</strong> R$ 45.000,00<br>
                <strong>Crescimento previsto:</strong> +15%<br>
                <strong>Produtos em alta:</strong> Eletrônicos
            </div>
            <p>Considere aumentar o estoque de eletrônicos para aproveitar a demanda!</p>
        `;
    }
    
    if (lowerQuery.includes('estoque baixo')) {
        return `
            <p>Verificando produtos com estoque baixo... ⚠️</p>
            <p>Encontrei 3 produtos que precisam de atenção:</p>
            <ul>
                <li><strong>Mouse Logitech</strong> - Apenas 3 unidades</li>
                <li><strong>Teclado Mecânico</strong> - Apenas 5 unidades</li>
                <li><strong>Webcam HD</strong> - Apenas 2 unidades</li>
            </ul>
            <p>Recomendo fazer pedidos de reposição o quanto antes!</p>
        `;
    }
    
    return `
        <p>Entendi sua pergunta sobre "${EliteUtils.sanitizeInput(query)}".</p>
        <p>Como assistente IA do EliteControl, posso ajudar com:</p>
        <ul>
            <li>Análise de vendas e tendências</li>
            <li>Gestão de estoque e alertas</li>
            <li>Insights sobre clientes</li>
            <li>Previsões e recomendações</li>
        </ul>
        <p>Por favor, seja mais específico para que eu possa fornecer uma análise mais detalhada!</p>
    `;
}

/**
 * Lidar com clique em notificação
 */
async function handleNotificationClick(notificationId) {
    try {
        await firebaseService.markNotificationAsRead(notificationId);
        
        // Recarregar notificações
        const dashboard = window.dashboardManager;
        if (dashboard) {
            dashboard.loadNotifications();
        }
    } catch (error) {
        console.error('Erro ao marcar notificação:', error);
    }
}

/**
 * Mostrar perfil do usuário
 */
function showUserProfile() {
    showToast('Perfil do usuário em desenvolvimento', 'info');
}

/**
 * Mostrar configurações
 */
function showSettings() {
    showSection('settings');
}

/**
 * Mostrar ajuda
 */
function showHelp() {
    showToast('Central de ajuda em desenvolvimento', 'info');
}

// ========== INICIALIZAÇÃO ==========

// Instanciar gerenciador do dashboard
window.dashboardManager = new DashboardManager();

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se estamos na página do dashboard
    if (window.location.pathname.includes('dashboard')) {
        dashboardManager.init();
    }
});

// Configurar chat do IA
document.addEventListener('DOMContentLoaded', () => {
    const aiInput = document.getElementById('aiChatInput');
    const aiSendButton = document.getElementById('aiSendButton');
    
    if (aiInput) {
        aiInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAIChat();
            }
        });
    }
    
    if (aiSendButton) {
        aiSendButton.addEventListener('click', handleAIChat);
    }
});
