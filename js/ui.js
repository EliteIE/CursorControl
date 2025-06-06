// ui.js
// Funções e componentes de interface de usuário

// ========== TOAST NOTIFICATIONS ==========

/**
 * Mostrar notificação toast
 */
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toastContainer');
    
    if (!toastContainer) {
        console.error('Toast container não encontrado');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fas ${icons[type]}"></i>
        </div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto remover
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ========== MODAIS ==========

/**
 * Abrir modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Animar entrada
        setTimeout(() => {
            modal.querySelector('.modal-overlay').classList.add('show');
            modal.querySelector('.modal-content').classList.add('show');
        }, 10);
    }
}

/**
 * Fechar modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.querySelector('.modal-overlay').classList.remove('show');
        modal.querySelector('.modal-content').classList.remove('show');
        
        setTimeout(() => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }
}

// ========== LOADING ==========

/**
 * Mostrar loading
 */
function showLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

/**
 * Esconder loading
 */
function hideLoading() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

/**
 * Mostrar loading em botão
 */
function showButtonLoading(button, text = 'Carregando...') {
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `
        <span class="loading-spinner"></span>
        ${text}
    `;
}

/**
 * Esconder loading em botão
 */
function hideButtonLoading(button) {
    if (!button || !button.dataset.originalText) return;
    
    button.disabled = false;
    button.innerHTML = button.dataset.originalText;
    delete button.dataset.originalText;
}

// ========== NAVEGAÇÃO ==========

/**
 * Mostrar seção
 */
function showSection(sectionName) {
    // Mapear seções para arquivos
    const sectionMap = {
        'dashboard': '/dashboard.html',
        'products': '/products.html',
        'sales': '/sales.html',
        'customers': '/customers.html',
        'reports': '/reports.html',
        'settings': '/settings.html',
        'ai-assistant': '#ai-assistant'
    };
    
    const target = sectionMap[sectionName];
    
    if (!target) {
        showToast('Seção não encontrada', 'error');
        return;
    }
    
    // Se for âncora, abrir modal
    if (target.startsWith('#')) {
        if (target === '#ai-assistant') {
            openAIAssistant();
        }
    } else {
        // Navegar para a página
        window.location.href = target;
    }
}

/**
 * Definir página ativa na navegação
 */
function setActiveNavItem(page) {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page');
        
        if (linkPage === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ========== SIDEBAR ==========

/**
 * Toggle sidebar móvel
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.toggle('show');
        overlay.classList.toggle('show');
        
        // Prevenir scroll do body quando sidebar estiver aberta
        if (sidebar.classList.contains('show')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

/**
 * Fechar sidebar móvel
 */
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// ========== USER MENU ==========

/**
 * Toggle user menu
 */
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

/**
 * Fechar user menu
 */
function closeUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

// ========== NOTIFICATIONS ==========

/**
 * Toggle dropdown de notificações
 */
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

/**
 * Fechar dropdown de notificações
 */
function closeNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
}

/**
 * Atualizar badge de notificações
 */
function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationCountBadge');
    
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

/**
 * Renderizar notificação
 */
function renderNotification(notification) {
    const timeAgo = getTimeAgo(notification.createdAt?.toDate());
    
    const icons = {
        'low_stock': 'fa-exclamation-triangle text-yellow-400',
        'new_order': 'fa-shopping-cart text-green-400',
        'system': 'fa-info-circle text-blue-400',
        'error': 'fa-times-circle text-red-400'
    };
    
    return `
        <div class="notification-item ${notification.read ? 'read' : ''}" 
             onclick="handleNotificationClick('${notification.id}')">
            <div class="notification-icon">
                <i class="fas ${icons[notification.type] || icons.system}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-text">
                    <strong>${notification.title}</strong>
                    <p>${notification.message}</p>
                </div>
                <div class="notification-time">${timeAgo}</div>
            </div>
        </div>
    `;
}

/**
 * Calcular tempo atrás
 */
function getTimeAgo(date) {
    if (!date) return '';
    
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        ano: 31536000,
        mês: 2592000,
        semana: 604800,
        dia: 86400,
        hora: 3600,
        minuto: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} atrás`;
        }
    }
    
    return 'Agora mesmo';
}

// ========== FORMS ==========

/**
 * Validar formulário
 */
function validateForm(formId) {
    const form = document.getElementById(formId);
    
    if (!form) return false;
    
    const inputs = form.querySelectorAll('[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
            
            // Mostrar mensagem de erro
            const errorMsg = input.getAttribute('data-error') || 'Campo obrigatório';
            showFieldError(input, errorMsg);
        } else {
            input.classList.remove('error');
            hideFieldError(input);
        }
    });
    
    return isValid;
}

/**
 * Mostrar erro em campo
 */
function showFieldError(input, message) {
    // Remover erro existente
    hideFieldError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    input.parentElement.appendChild(errorDiv);
}

/**
 * Esconder erro em campo
 */
function hideFieldError(input) {
    const errorDiv = input.parentElement.querySelector('.field-error');
    
    if (errorDiv) {
        errorDiv.remove();
    }
}

/**
 * Resetar formulário
 */
function resetForm(formId) {
    const form = document.getElementById(formId);
    
    if (form) {
        form.reset();
        
        // Remover classes de erro
        form.querySelectorAll('.error').forEach(el => {
            el.classList.remove('error');
        });
        
        // Remover mensagens de erro
        form.querySelectorAll('.field-error').forEach(el => {
            el.remove();
        });
    }
}

// ========== TABLES ==========

/**
 * Renderizar tabela vazia
 */
function renderEmptyTable(message = 'Nenhum dado encontrado') {
    return `
        <tr>
            <td colspan="100%" class="empty-table">
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>${message}</p>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Ordenar tabela
 */
function sortTable(tableId, column, direction = 'asc') {
    const table = document.getElementById(tableId);
    
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Determinar tipo de dados
    const getCellValue = (row, column) => {
        const cell = row.cells[column];
        const value = cell.textContent.trim();
        
        // Tentar converter para número
        const numValue = parseFloat(value.replace(/[^\d.-]/g, ''));
        
        return isNaN(numValue) ? value : numValue;
    };
    
    // Ordenar linhas
    rows.sort((a, b) => {
        const aValue = getCellValue(a, column);
        const bValue = getCellValue(b, column);
        
        if (direction === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    // Reordenar no DOM
    rows.forEach(row => tbody.appendChild(row));
    
    // Atualizar indicadores visuais
    updateSortIndicators(tableId, column, direction);
}

/**
 * Atualizar indicadores de ordenação
 */
function updateSortIndicators(tableId, column, direction) {
    const table = document.getElementById(tableId);
    
    if (!table) return;
    
    // Remover indicadores anteriores
    table.querySelectorAll('.sort-indicator').forEach(el => {
        el.classList.remove('asc', 'desc');
    });
    
    // Adicionar novo indicador
    const header = table.querySelector(`th:nth-child(${column + 1})`);
    const indicator = header.querySelector('.sort-indicator');
    
    if (indicator) {
        indicator.classList.add(direction);
    }
}

// ========== SEARCH ==========

/**
 * Configurar busca em tempo real
 */
function setupSearch(inputId, callback) {
    const input = document.getElementById(inputId);
    
    if (!input) return;
    
    const debouncedSearch = EliteUtils.debounce((value) => {
        callback(value);
    }, EliteConfig.ui.debounceDelay);
    
    input.addEventListener('input', (e) => {
        debouncedSearch(e.target.value);
    });
}

// ========== CHARTS ==========

/**
 * Criar gráfico de linha
 */
function createLineChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    return new Chart(ctx, {
        type: 'line',
        data: data,
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
                            return EliteUtils.formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94A3B8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(71, 85, 105, 0.3)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94A3B8',
                        callback: function(value) {
                            return EliteUtils.formatCurrency(value);
                        }
                    }
                }
            },
            ...options
        }
    });
}

/**
 * Criar gráfico de rosca
 */
function createDoughnutChart(canvasId, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: data,
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
            },
            ...options
        }
    });
}

// ========== UTILITY ==========

/**
 * Debounce para eventos
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Formatar número para exibição
 */
function formatNumber(number) {
    return new Intl.NumberFormat('pt-BR').format(number || 0);
}

/**
 * Copiar texto para clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copiado para a área de transferência!', 'success');
    } catch (err) {
        showToast('Erro ao copiar', 'error');
    }
}

// ========== INIT ==========

/**
 * Inicializar componentes UI
 */
function initUI() {
    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        // User menu
        if (!e.target.closest('#userMenuButton') && !e.target.closest('#userDropdown')) {
            closeUserMenu();
        }
        
        // Notifications
        if (!e.target.closest('#notificationBellButton') && !e.target.closest('#notificationDropdown')) {
            closeNotifications();
        }
    });
    
    // Sidebar mobile
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarCloseButton = document.getElementById('sidebarCloseButton');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarCloseButton) {
        sidebarCloseButton.addEventListener('click', closeSidebar);
    }
    
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // User menu
    const userMenuButton = document.getElementById('userMenuButton');
    if (userMenuButton) {
        userMenuButton.addEventListener('click', toggleUserMenu);
    }
    
    // Notifications
    const notificationBellButton = document.getElementById('notificationBellButton');
    if (notificationBellButton) {
        notificationBellButton.addEventListener('click', toggleNotifications);
    }
    
    // Logout
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                authManager.logout();
            }
        });
    }
    
    // Atalhos de teclado
    document.addEventListener('keydown', (e) => {
        // ESC para fechar modais
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal:not(.hidden)');
            modals.forEach(modal => {
                closeModal(modal.id);
            });
            
            closeSidebar();
            closeUserMenu();
            closeNotifications();
        }
        
        // Ctrl+K para busca global
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }
    });
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', initUI);
