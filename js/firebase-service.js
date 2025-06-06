// firebase-service.js
// Serviço completo para interação com Firebase

class FirebaseService {
    constructor() {
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.cache = new Map();
        this.listeners = new Map();
    }

    // ========== AUTENTICAÇÃO ==========
    
    /**
     * Login com email e senha
     */
    async login(email, password, rememberMe = false) {
        try {
            // Configurar persistência
            const persistence = rememberMe 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;
            
            await this.auth.setPersistence(persistence);
            
            // Fazer login
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Buscar dados do perfil
            const userProfile = await this.getUserProfile(user.uid);
            
            // Registrar atividade
            await this.logActivity('login', {
                userId: user.uid,
                email: user.email,
                timestamp: new Date()
            });
            
            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email,
                    ...userProfile
                }
            };
        } catch (error) {
            console.error('Erro no login:', error);
            return {
                success: false,
                error: this.getAuthErrorMessage(error.code)
            };
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await this.logActivity('logout', {
                userId: this.auth.currentUser?.uid,
                timestamp: new Date()
            });
            
            await this.auth.signOut();
            
            // Limpar cache
            this.cache.clear();
            
            // Remover listeners
            this.listeners.forEach(unsubscribe => unsubscribe());
            this.listeners.clear();
            
            return { success: true };
        } catch (error) {
            console.error('Erro no logout:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter perfil do usuário
     */
    async getUserProfile(userId) {
        try {
            const doc = await this.db.collection('users').doc(userId).get();
            
            if (!doc.exists) {
                // Criar perfil padrão se não existir
                const defaultProfile = {
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                await this.db.collection('users').doc(userId).set(defaultProfile);
                return defaultProfile;
            }
            
            return doc.data();
        } catch (error) {
            console.error('Erro ao obter perfil:', error);
            return null;
        }
    }

    /**
     * Atualizar perfil do usuário
     */
    async updateUserProfile(userId, data) {
        try {
            await this.db.collection('users').doc(userId).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Traduzir mensagens de erro do Firebase Auth
     */
    getAuthErrorMessage(errorCode) {
        const errorMessages = {
            'auth/invalid-email': 'Email inválido',
            'auth/user-disabled': 'Usuário desativado',
            'auth/user-not-found': 'Usuário não encontrado',
            'auth/wrong-password': 'Senha incorreta',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
            'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
            'auth/operation-not-allowed': 'Operação não permitida',
            'auth/weak-password': 'Senha muito fraca',
            'auth/email-already-in-use': 'Email já cadastrado'
        };
        
        return errorMessages[errorCode] || 'Erro ao fazer login. Tente novamente.';
    }

    // ========== PRODUTOS ==========

    /**
     * Obter todos os produtos
     */
    async getProducts(filters = {}) {
        try {
            let query = this.db.collection('products');
            
            // Aplicar filtros
            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            
            if (filters.lowStock) {
                query = query.where('stock', '<=', EliteConfig.business.lowStockThreshold);
            }
            
            if (filters.search) {
                // Firestore não suporta busca de texto completo nativamente
                // Implementar busca no cliente ou usar Algolia/ElasticSearch
            }
            
            // Ordenação
            query = query.orderBy(filters.orderBy || 'name', filters.orderDirection || 'asc');
            
            // Paginação
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            const snapshot = await query.get();
            const products = [];
            
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: products };
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter produto por ID
     */
    async getProduct(productId) {
        try {
            const doc = await this.db.collection('products').doc(productId).get();
            
            if (!doc.exists) {
                return { success: false, error: 'Produto não encontrado' };
            }
            
            return { 
                success: true, 
                data: { id: doc.id, ...doc.data() }
            };
        } catch (error) {
            console.error('Erro ao buscar produto:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Criar novo produto
     */
    async createProduct(productData) {
        try {
            const product = {
                ...productData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.auth.currentUser?.uid
            };
            
            const docRef = await this.db.collection('products').add(product);
            
            await this.logActivity('product_created', {
                productId: docRef.id,
                productName: product.name
            });
            
            return { 
                success: true, 
                data: { id: docRef.id, ...product }
            };
        } catch (error) {
            console.error('Erro ao criar produto:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Atualizar produto
     */
    async updateProduct(productId, productData) {
        try {
            const updateData = {
                ...productData,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: this.auth.currentUser?.uid
            };
            
            await this.db.collection('products').doc(productId).update(updateData);
            
            await this.logActivity('product_updated', {
                productId,
                changes: Object.keys(productData)
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao atualizar produto:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Deletar produto
     */
    async deleteProduct(productId) {
        try {
            // Verificar se há vendas associadas
            const salesQuery = await this.db.collection('sales')
                .where('items', 'array-contains', { productId })
                .limit(1)
                .get();
            
            if (!salesQuery.empty) {
                return { 
                    success: false, 
                    error: 'Produto não pode ser deletado pois existem vendas associadas' 
                };
            }
            
            await this.db.collection('products').doc(productId).delete();
            
            await this.logActivity('product_deleted', { productId });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao deletar produto:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Atualizar estoque do produto
     */
    async updateProductStock(productId, quantity, operation = 'set') {
        try {
            const productRef = this.db.collection('products').doc(productId);
            
            await this.db.runTransaction(async (transaction) => {
                const doc = await transaction.get(productRef);
                
                if (!doc.exists) {
                    throw new Error('Produto não encontrado');
                }
                
                const currentStock = doc.data().stock || 0;
                let newStock;
                
                switch (operation) {
                    case 'add':
                        newStock = currentStock + quantity;
                        break;
                    case 'subtract':
                        newStock = currentStock - quantity;
                        if (newStock < 0) {
                            throw new Error('Estoque insuficiente');
                        }
                        break;
                    case 'set':
                    default:
                        newStock = quantity;
                        break;
                }
                
                transaction.update(productRef, {
                    stock: newStock,
                    stockUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Verificar se precisa criar alerta de estoque baixo
                if (newStock <= EliteConfig.business.lowStockThreshold) {
                    await this.createNotification({
                        type: 'low_stock',
                        title: 'Estoque Baixo',
                        message: `O produto ${doc.data().name} está com estoque baixo (${newStock} unidades)`,
                        productId: productId,
                        priority: newStock <= EliteConfig.business.criticalStockThreshold ? 'high' : 'medium'
                    });
                }
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao atualizar estoque:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== VENDAS ==========

    /**
     * Criar nova venda
     */
    async createSale(saleData) {
        try {
            const sale = {
                ...saleData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.auth.currentUser?.uid,
                status: 'completed'
            };
            
            // Usar transação para garantir consistência
            const saleRef = await this.db.runTransaction(async (transaction) => {
                // Atualizar estoque dos produtos
                for (const item of sale.items) {
                    const productRef = this.db.collection('products').doc(item.productId);
                    const productDoc = await transaction.get(productRef);
                    
                    if (!productDoc.exists) {
                        throw new Error(`Produto ${item.productId} não encontrado`);
                    }
                    
                    const currentStock = productDoc.data().stock || 0;
                    const newStock = currentStock - item.quantity;
                    
                    if (newStock < 0) {
                        throw new Error(`Estoque insuficiente para ${productDoc.data().name}`);
                    }
                    
                    transaction.update(productRef, {
                        stock: newStock,
                        stockUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                
                // Criar a venda
                const saleRef = this.db.collection('sales').doc();
                transaction.set(saleRef, sale);
                
                return saleRef;
            });
            
            await this.logActivity('sale_created', {
                saleId: saleRef.id,
                total: sale.total,
                itemsCount: sale.items.length
            });
            
            return { 
                success: true, 
                data: { id: saleRef.id, ...sale }
            };
        } catch (error) {
            console.error('Erro ao criar venda:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter vendas
     */
    async getSales(filters = {}) {
        try {
            let query = this.db.collection('sales');
            
            // Filtros
            if (filters.startDate) {
                query = query.where('createdAt', '>=', filters.startDate);
            }
            
            if (filters.endDate) {
                query = query.where('createdAt', '<=', filters.endDate);
            }
            
            if (filters.customerId) {
                query = query.where('customerId', '==', filters.customerId);
            }
            
            if (filters.sellerId) {
                query = query.where('createdBy', '==', filters.sellerId);
            }
            
            // Ordenação
            query = query.orderBy('createdAt', 'desc');
            
            // Paginação
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            const snapshot = await query.get();
            const sales = [];
            
            snapshot.forEach(doc => {
                sales.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: sales };
        } catch (error) {
            console.error('Erro ao buscar vendas:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter estatísticas de vendas
     */
    async getSalesStats(period = 'month') {
        try {
            const now = new Date();
            let startDate;
            
            switch (period) {
                case 'day':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }
            
            const sales = await this.getSales({ startDate });
            
            if (!sales.success) {
                return sales;
            }
            
            const stats = {
                totalSales: sales.data.length,
                totalRevenue: 0,
                averageTicket: 0,
                topProducts: {},
                salesByDay: {},
                salesByHour: {}
            };
            
            // Calcular estatísticas
            sales.data.forEach(sale => {
                stats.totalRevenue += sale.total || 0;
                
                // Produtos mais vendidos
                sale.items?.forEach(item => {
                    if (!stats.topProducts[item.productId]) {
                        stats.topProducts[item.productId] = {
                            productId: item.productId,
                            productName: item.productName,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    
                    stats.topProducts[item.productId].quantity += item.quantity;
                    stats.topProducts[item.productId].revenue += item.total;
                });
                
                // Vendas por dia
                if (sale.createdAt) {
                    const date = sale.createdAt.toDate();
                    const dayKey = date.toISOString().split('T')[0];
                    const hourKey = date.getHours();
                    
                    stats.salesByDay[dayKey] = (stats.salesByDay[dayKey] || 0) + 1;
                    stats.salesByHour[hourKey] = (stats.salesByHour[hourKey] || 0) + 1;
                }
            });
            
            stats.averageTicket = stats.totalSales > 0 
                ? stats.totalRevenue / stats.totalSales 
                : 0;
            
            // Converter topProducts em array ordenado
            stats.topProducts = Object.values(stats.topProducts)
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);
            
            return { success: true, data: stats };
        } catch (error) {
            console.error('Erro ao calcular estatísticas:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== CLIENTES ==========

    /**
     * Obter clientes
     */
    async getCustomers(filters = {}) {
        try {
            let query = this.db.collection('customers');
            
            if (filters.search) {
                // Implementar busca no cliente
            }
            
            query = query.orderBy('name', 'asc');
            
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            
            const snapshot = await query.get();
            const customers = [];
            
            snapshot.forEach(doc => {
                customers.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: customers };
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Criar cliente
     */
    async createCustomer(customerData) {
        try {
            const customer = {
                ...customerData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.auth.currentUser?.uid
            };
            
            const docRef = await this.db.collection('customers').add(customer);
            
            return { 
                success: true, 
                data: { id: docRef.id, ...customer }
            };
        } catch (error) {
            console.error('Erro ao criar cliente:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== CATEGORIAS ==========

    /**
     * Obter categorias
     */
    async getCategories() {
        try {
            const cacheKey = 'categories';
            
            // Verificar cache
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < EliteConfig.data.cacheExpiration) {
                    return { success: true, data: cached.data };
                }
            }
            
            const snapshot = await this.db.collection('categories')
                .orderBy('name', 'asc')
                .get();
            
            const categories = [];
            snapshot.forEach(doc => {
                categories.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            // Armazenar em cache
            this.cache.set(cacheKey, {
                data: categories,
                timestamp: Date.now()
            });
            
            return { success: true, data: categories };
        } catch (error) {
            console.error('Erro ao buscar categorias:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== NOTIFICAÇÕES ==========

    /**
     * Criar notificação
     */
    async createNotification(notificationData) {
        try {
            const notification = {
                ...notificationData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                read: false,
                userId: this.auth.currentUser?.uid
            };
            
            await this.db.collection('notifications').add(notification);
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao criar notificação:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obter notificações
     */
    async getNotifications(unreadOnly = false) {
        try {
            let query = this.db.collection('notifications')
                .where('userId', '==', this.auth.currentUser?.uid);
            
            if (unreadOnly) {
                query = query.where('read', '==', false);
            }
            
            query = query.orderBy('createdAt', 'desc').limit(50);
            
            const snapshot = await query.get();
            const notifications = [];
            
            snapshot.forEach(doc => {
                notifications.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: notifications };
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Marcar notificação como lida
     */
    async markNotificationAsRead(notificationId) {
        try {
            await this.db.collection('notifications').doc(notificationId).update({
                read: true,
                readAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao marcar notificação:', error);
            return { success: false, error: error.message };
        }
    }

    // ========== ATIVIDADES ==========

    /**
     * Registrar atividade
     */
    async logActivity(type, data = {}) {
        try {
            const activity = {
                type,
                ...data,
                userId: this.auth.currentUser?.uid,
                userEmail: this.auth.currentUser?.email,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getUserIP()
            };
            
            await this.db.collection('activities').add(activity);
        } catch (error) {
            console.error('Erro ao registrar atividade:', error);
        }
    }

    /**
     * Obter IP do usuário
     */
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // ========== RELATÓRIOS ==========

    /**
     * Gerar relatório
     */
    async generateReport(type, filters = {}) {
        try {
            let data;
            
            switch (type) {
                case 'sales':
                    data = await this.getSalesReport(filters);
                    break;
                case 'inventory':
                    data = await this.getInventoryReport(filters);
                    break;
                case 'customers':
                    data = await this.getCustomersReport(filters);
                    break;
                default:
                    throw new Error('Tipo de relatório inválido');
            }
            
            return { success: true, data };
        } catch (error) {
            console.error('Erro ao gerar relatório:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Relatório de vendas
     */
    async getSalesReport(filters) {
        const sales = await this.getSales(filters);
        const stats = await this.getSalesStats(filters.period);
        
        return {
            sales: sales.data,
            stats: stats.data,
            generated: new Date()
        };
    }

    /**
     * Relatório de estoque
     */
    async getInventoryReport(filters) {
        const products = await this.getProducts(filters);
        
        const report = {
            totalProducts: products.data.length,
            totalValue: 0,
            lowStock: [],
            outOfStock: [],
            categories: {}
        };
        
        products.data.forEach(product => {
            const value = (product.price || 0) * (product.stock || 0);
            report.totalValue += value;
            
            if (product.stock === 0) {
                report.outOfStock.push(product);
            } else if (product.stock <= EliteConfig.business.lowStockThreshold) {
                report.lowStock.push(product);
            }
            
            if (!report.categories[product.category]) {
                report.categories[product.category] = {
                    count: 0,
                    value: 0,
                    items: []
                };
            }
            
            report.categories[product.category].count++;
            report.categories[product.category].value += value;
            report.categories[product.category].items.push(product);
        });
        
        return report;
    }

    /**
     * Relatório de clientes
     */
    async getCustomersReport(filters) {
        const customers = await this.getCustomers(filters);
        const sales = await this.getSales(filters);
        
        const report = {
            totalCustomers: customers.data.length,
            newCustomers: 0,
            topCustomers: [],
            customersByCity: {}
        };
        
        // Analisar dados dos clientes
        const customerSales = {};
        
        sales.data.forEach(sale => {
            if (sale.customerId) {
                if (!customerSales[sale.customerId]) {
                    customerSales[sale.customerId] = {
                        customerId: sale.customerId,
                        customerName: sale.customerName,
                        totalPurchases: 0,
                        totalSpent: 0
                    };
                }
                
                customerSales[sale.customerId].totalPurchases++;
                customerSales[sale.customerId].totalSpent += sale.total || 0;
            }
        });
        
        report.topCustomers = Object.values(customerSales)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 10);
        
        return report;
    }

    // ========== LISTENERS EM TEMPO REAL ==========

    /**
     * Escutar mudanças em produtos
     */
    onProductsChange(callback) {
        const unsubscribe = this.db.collection('products')
            .onSnapshot(snapshot => {
                const products = [];
                snapshot.forEach(doc => {
                    products.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(products);
            });
        
        this.listeners.set('products', unsubscribe);
        return unsubscribe;
    }

    /**
     * Escutar mudanças em notificações
     */
    onNotificationsChange(callback) {
        if (!this.auth.currentUser) return;
        
        const unsubscribe = this.db.collection('notifications')
            .where('userId', '==', this.auth.currentUser.uid)
            .where('read', '==', false)
            .onSnapshot(snapshot => {
                const notifications = [];
                snapshot.forEach(doc => {
                    notifications.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(notifications);
            });
        
        this.listeners.set('notifications', unsubscribe);
        return unsubscribe;
    }
}

// Instanciar e exportar serviço
window.firebaseService = new FirebaseService();
