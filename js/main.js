// js/main-v2.js - Sistema EliteControl v2.0 com IA e CRM Avançado - CORRIGIDO

// Namespace para o EliteControl
const EliteControl = {
    // Elementos do modal de produto
    elements: {
        productModal: null,
        productForm: null,
        productModalTitle: null,
        productIdField: null,
        productNameField: null,
        productCategoryField: null,
        productPriceField: null,
        productStockField: null,
        productLowStockAlertField: null,
        closeProductModalButton: null,
        cancelProductFormButton: null,
        saveProductButton: null
    },
    
    // Estado da aplicação
    state: {
        modalEventListenersAttached: false,
        isModalProcessing: false,
        saleCart: [],
        availableProducts: [],
        selectedCustomer: null
    },
    
    // Dados de usuários de teste
    testUsers: {
        'admin@elitecontrol.com': {
            name: 'Administrador Elite',
            role: 'Dono/Gerente',
            email: 'admin@elitecontrol.com'
        },
        'estoque@elitecontrol.com': {
            name: 'Controlador de Estoque',
            role: 'Controlador de Estoque',
            email: 'estoque@elitecontrol.com'
        },
        'vendas@elitecontrol.com': {
            name: 'Vendedor Elite',
            role: 'Vendedor',
            email: 'vendas@elitecontrol.com'
        }
    }
};

// Configurar event listeners assim que o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log("🔧 Configurando event listeners iniciais");
    setupProductActionListeners();
    
    // Garantir que os elementos do modal estão inicializados
    initializeModalElements();
    
    // Configurar event listeners do modal
    setupModalEventListeners();
});

// Produtos de exemplo
const sampleProducts = [
    { name: 'Notebook Dell Inspiron', category: 'Eletrônicos', price: 2500.00, stock: 15, lowStockAlert: 10 },
    { name: 'Mouse Logitech MX Master', category: 'Periféricos', price: 320.00, stock: 8, lowStockAlert: 5 },
    { name: 'Teclado Mecânico RGB', category: 'Periféricos', price: 450.00, stock: 25, lowStockAlert: 15 },
    { name: 'Monitor 24" Full HD', category: 'Eletrônicos', price: 800.00, stock: 12, lowStockAlert: 8 },
    { name: 'SSD 500GB Samsung', category: 'Armazenamento', price: 350.00, stock: 30, lowStockAlert: 20 }
];

// === INICIALIZAÇÃO ===

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 EliteControl v2.0 inicializando...');

    initializeModalElements();
    setupEventListeners();
    firebase.auth().onAuthStateChanged(handleAuthStateChange);
});

function initializeModalElements() {
    console.log("🔧 Inicializando elementos do modal de produto");
    
    // Verificar se o modal existe no DOM
    const modalElement = document.getElementById('productModal');
    if (!modalElement) {
        console.error("❌ Modal de produto não encontrado no DOM");
        return false;
    }
    console.log("✅ Modal encontrado no DOM");
    
    EliteControl.elements.productModal = modalElement;
    EliteControl.elements.productForm = document.getElementById('productForm');
    EliteControl.elements.productModalTitle = document.getElementById('productModalTitle');
    EliteControl.elements.productIdField = document.getElementById('productId');
    EliteControl.elements.productNameField = document.getElementById('productName');
    EliteControl.elements.productCategoryField = document.getElementById('productCategory');
    EliteControl.elements.productPriceField = document.getElementById('productPrice');
    EliteControl.elements.productStockField = document.getElementById('productStock');
    EliteControl.elements.productLowStockAlertField = document.getElementById('productLowStockAlert');
    EliteControl.elements.closeProductModalButton = document.getElementById('closeProductModalButton');
    EliteControl.elements.cancelProductFormButton = document.getElementById('cancelProductFormButton');
    EliteControl.elements.saveProductButton = document.getElementById('saveProductButton');
    
    // Log dos elementos encontrados para debug
    const elementStatus = {
        productModal: !!EliteControl.elements.productModal,
        productForm: !!EliteControl.elements.productForm,
        productModalTitle: !!EliteControl.elements.productModalTitle,
        productIdField: !!EliteControl.elements.productIdField,
        productNameField: !!EliteControl.elements.productNameField,
        productCategoryField: !!EliteControl.elements.productCategoryField,
        productPriceField: !!EliteControl.elements.productPriceField,
        productStockField: !!EliteControl.elements.productStockField,
        productLowStockAlertField: !!EliteControl.elements.productLowStockAlertField,
        closeProductModalButton: !!EliteControl.elements.closeProductModalButton,
        cancelProductFormButton: !!EliteControl.elements.cancelProductFormButton,
        saveProductButton: !!EliteControl.elements.saveProductButton
    };
    
    console.log("Status dos elementos do modal:", elementStatus);
    
    // Verificar se todos os elementos obrigatórios foram encontrados
    const requiredElements = [
        'productForm',
        'productModalTitle',
        'productNameField',
        'productCategoryField',
        'productPriceField',
        'productStockField',
        'closeProductModalButton',
        'saveProductButton'
    ];
    
    const missingElements = requiredElements.filter(
        elementName => !EliteControl.elements[elementName]
    );
    
    if (missingElements.length > 0) {
        console.error("❌ Elementos obrigatórios não encontrados:", missingElements);
        return false;
    }
    
    console.log("✅ Todos os elementos obrigatórios encontrados");
    return true;
}

// === FUNÇÕES DE MODAL DE PRODUTOS ===

function setupModalEventListeners() {
    console.log("🔧 Configurando event listeners do modal de produto");

    if (EliteControl.elements.closeProductModalButton) {
        EliteControl.elements.closeProductModalButton.addEventListener('click', handleModalClose);
    }

    if (EliteControl.elements.cancelProductFormButton) {
        EliteControl.elements.cancelProductFormButton.addEventListener('click', handleModalClose);
    }

    if (EliteControl.elements.productForm) {
        EliteControl.elements.productForm.addEventListener('submit', handleProductFormSubmit);
    }

    if (EliteControl.elements.productModal) {
        EliteControl.elements.productModal.addEventListener('click', (e) => {
            if (e.target === EliteControl.elements.productModal && !EliteControl.state.isModalProcessing) {
                handleModalClose();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && EliteControl.elements.productModal && !EliteControl.elements.productModal.classList.contains('hidden') && !EliteControl.state.isModalProcessing) {
            handleModalClose();
        }
    });
    EliteControl.state.modalEventListenersAttached = true;
}

function handleModalClose() {
    if (EliteControl.state.isModalProcessing) {
        console.log("⚠️ Modal está processando, cancelamento bloqueado");
        return;
    }

    console.log("❌ Fechando modal de produto");

    try {
        if (EliteControl.elements.productForm) EliteControl.elements.productForm.reset();

        if (EliteControl.elements.productIdField) EliteControl.elements.productIdField.value = '';
        if (EliteControl.elements.productNameField) EliteControl.elements.productNameField.value = '';
        if (EliteControl.elements.productCategoryField) EliteControl.elements.productCategoryField.value = '';
        if (EliteControl.elements.productPriceField) EliteControl.elements.productPriceField.value = '';
        if (EliteControl.elements.productStockField) EliteControl.elements.productStockField.value = '';
        if (EliteControl.elements.productLowStockAlertField) EliteControl.elements.productLowStockAlertField.value = '';

        if (EliteControl.elements.saveProductButton) {
            EliteControl.elements.saveProductButton.disabled = false;
            EliteControl.elements.saveProductButton.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Produto';
        }

        if (EliteControl.elements.productModal) {
            EliteControl.elements.productModal.classList.add('hidden');
        }

        console.log("✅ Modal fechado com sucesso");

    } catch (error) {
        console.error("❌ Erro ao fechar modal:", error);
        if (EliteControl.elements.productModal) {
            EliteControl.elements.productModal.classList.add('hidden');
        }
    }
}

function checkModalVisibility() {
    const modal = document.getElementById('productModal');
    if (!modal) {
        console.error("❌ Modal não encontrado na verificação de visibilidade");
        return;
    }

    // Verificar se o modal está visível
    const isVisible = !modal.classList.contains('hidden');
    const modalContent = modal.querySelector('.modal-content');
    
    if (!modalContent) {
        console.error("❌ Conteúdo do modal não encontrado");
        return;
    }

    console.log("Status do modal:", {
        isVisible,
        hasHiddenClass: modal.classList.contains('hidden'),
        display: window.getComputedStyle(modal).display,
        opacity: window.getComputedStyle(modal).opacity,
        visibility: window.getComputedStyle(modal).visibility,
        zIndex: window.getComputedStyle(modal).zIndex,
        modalContentDisplay: window.getComputedStyle(modalContent).display,
        modalContentOpacity: window.getComputedStyle(modalContent).opacity,
        modalContentVisibility: window.getComputedStyle(modalContent).visibility
    });
}

function openProductModal(product = null) {
    console.log("📝 Abrindo modal de produto:", product ? 'Editar' : 'Novo');
    
    // Inicializar elementos se necessário
    if (!EliteControl.elements.productModal) {
        console.log("Modal não inicializado, tentando inicializar...");
        const success = initializeModalElements();
        if (!success) {
            console.error("❌ Falha ao inicializar elementos do modal");
            showTemporaryAlert("Erro: Modal de produto não disponível nesta página.", "error");
            return;
        }
        console.log("✅ Elementos do modal inicializados com sucesso");
    }

    if (EliteControl.state.isModalProcessing) {
        console.log("⚠️ Modal já está sendo processado");
        return;
    }

    // Configurar event listeners se necessário
    if (!EliteControl.state.modalEventListenersAttached) {
        console.log("Configurando event listeners do modal...");
        setupModalEventListeners();
        console.log("✅ Event listeners do modal configurados");
    }

    // Resetar formulário
    if (EliteControl.elements.productForm) {
        EliteControl.elements.productForm.reset();
        console.log("✅ Formulário resetado");
    }

    if (product) {
        // Modo edição
        if (EliteControl.elements.productModalTitle) EliteControl.elements.productModalTitle.textContent = 'Editar Produto';
        if (EliteControl.elements.productIdField) EliteControl.elements.productIdField.value = product.id;
        if (EliteControl.elements.productNameField) EliteControl.elements.productNameField.value = product.name;
        if (EliteControl.elements.productCategoryField) EliteControl.elements.productCategoryField.value = product.category;
        if (EliteControl.elements.productPriceField) EliteControl.elements.productPriceField.value = product.price;
        if (EliteControl.elements.productStockField) EliteControl.elements.productStockField.value = product.stock;
        if (EliteControl.elements.productLowStockAlertField) EliteControl.elements.productLowStockAlertField.value = product.lowStockAlert || 10;
        
        console.log("✅ Produto carregado para edição:", {
            id: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            lowStockAlert: product.lowStockAlert
        });
    } else {
        // Modo criação
        if (EliteControl.elements.productModalTitle) EliteControl.elements.productModalTitle.textContent = 'Adicionar Novo Produto';
        if (EliteControl.elements.productIdField) EliteControl.elements.productIdField.value = '';
        if (EliteControl.elements.productLowStockAlertField) EliteControl.elements.productLowStockAlertField.value = 10;
        
        console.log("✅ Modal configurado para novo produto");
    }

    // Mostrar modal
    if (EliteControl.elements.productModal) {
        EliteControl.elements.productModal.classList.remove('hidden');
        console.log("✅ Modal exibido - Classe 'hidden' removida");
        
        // Verificar visibilidade após um pequeno delay
        setTimeout(checkModalVisibility, 100);
    } else {
        console.error("❌ Elemento do modal não encontrado ao tentar exibir");
    }
    
    // Focar no primeiro campo
    if (EliteControl.elements.productNameField) {
        setTimeout(() => {
            EliteControl.elements.productNameField.focus();
            console.log("✅ Foco aplicado no campo nome");
            
            // Verificar visibilidade novamente após o foco
            checkModalVisibility();
        }, 100);
    } else {
        console.error("❌ Campo de nome não encontrado ao tentar focar");
    }
}

async function handleProductFormSubmit(event) {
    event.preventDefault();

    if (EliteControl.state.isModalProcessing) {
        console.log("⚠️ Formulário já está sendo processado");
        return;
    }

    console.log("💾 Salvando produto...");

    if (!validateProductForm()) {
        return;
    }

    EliteControl.state.isModalProcessing = true;

    const id = EliteControl.elements.productIdField?.value;

    const productData = {
        name: EliteControl.elements.productNameField.value.trim(),
        category: EliteControl.elements.productCategoryField.value.trim(),
        price: parseFloat(EliteControl.elements.productPriceField.value),
        stock: parseInt(EliteControl.elements.productStockField.value),
        lowStockAlert: parseInt(EliteControl.elements.productLowStockAlertField?.value || 10)
    };

    if (EliteControl.elements.saveProductButton) {
        EliteControl.elements.saveProductButton.disabled = true;
        EliteControl.elements.saveProductButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Salvando...';
    }

    try {
        if (id) {
            await DataService.updateProduct(id, productData);
            showTemporaryAlert('Produto atualizado com sucesso!', 'success');
        } else {
            await DataService.addProduct(productData);
            showTemporaryAlert('Produto adicionado com sucesso!', 'success');
        }

        handleModalClose();
        await reloadProductsIfNeeded();

    } catch (error) {
        console.error("❌ Erro ao salvar produto:", error);
        showTemporaryAlert('Erro ao salvar produto. Tente novamente.', 'error');
    } finally {
        EliteControl.state.isModalProcessing = false;

        if (EliteControl.elements.saveProductButton) {
            EliteControl.elements.saveProductButton.disabled = false;
            EliteControl.elements.saveProductButton.innerHTML = '<i class="fas fa-save mr-2"></i>Salvar Produto';
        }
    }
}

function validateProductForm() {
    if (!EliteControl.elements.productNameField) initializeModalElements();

    if (!EliteControl.elements.productNameField || !EliteControl.elements.productCategoryField || !EliteControl.elements.productPriceField || !EliteControl.elements.productStockField || !EliteControl.elements.productLowStockAlertField) {
        showTemporaryAlert("Erro: Campos do formulário de produto não encontrados.", "error");
        return false;
    }

    const name = EliteControl.elements.productNameField.value.trim();
    const category = EliteControl.elements.productCategoryField.value.trim();
    const price = parseFloat(EliteControl.elements.productPriceField.value);
    const stock = parseInt(EliteControl.elements.productStockField.value);
    const lowStockAlert = parseInt(EliteControl.elements.productLowStockAlertField.value);

    if (!name) {
        showTemporaryAlert("Nome do produto é obrigatório.", "warning");
        EliteControl.elements.productNameField.focus();
        return false;
    }

    if (!category) {
        showTemporaryAlert("Categoria é obrigatória.", "warning");
        EliteControl.elements.productCategoryField.focus();
        return false;
    }

    if (isNaN(price) || price < 0) {
        showTemporaryAlert("Preço deve ser um número válido e não negativo.", "warning");
        EliteControl.elements.productPriceField.focus();
        return false;
    }

    if (isNaN(stock) || stock < 0) {
        showTemporaryAlert("Estoque deve ser um número válido e não negativo.", "warning");
        EliteControl.elements.productStockField.focus();
        return false;
    }

    if (isNaN(lowStockAlert) || lowStockAlert < 1) {
        showTemporaryAlert("Alerta de estoque baixo deve ser um número válido maior que 0.", "warning");
        EliteControl.elements.productLowStockAlertField.focus();
        return false;
    }

    if (lowStockAlert > stock && stock > 0) {
        showTemporaryAlert("O alerta de estoque baixo não deve ser maior que o estoque atual.", "warning");
        EliteControl.elements.productLowStockAlertField.focus();
        return false;
    }

    return true;
}

// === RENDERIZAÇÃO DE PRODUTOS ===

function renderProductsList(products, container, userRole) {
    console.log("📦 Renderizando lista de produtos para:", userRole);

    if (!container) {
        console.error("❌ Container não fornecido para renderizar produtos");
        return;
    }

    const canEditProducts = userRole === 'Dono/Gerente' || userRole === 'Controlador de Estoque';

    container.innerHTML = `
        <div class="products-container">
            <div class="products-header mb-4 flex justify-between items-center">
                <h2 class="text-xl font-semibold text-slate-100">Gestão de Produtos</h2>
                ${canEditProducts ? `
                    <button id="openAddProductModalButton" class="btn-primary">
                        <i class="fas fa-plus mr-2"></i>
                        Adicionar Produto
                    </button>
                ` : ''}
            </div>

            <div class="search-container mb-6">
                <div class="relative">
                    <input type="text" 
                           id="productSearchField"
                           class="form-input pl-10 w-full"
                           placeholder="Buscar produtos...">
                    <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                </div>
            </div>

            <div id="productsTable" class="products-table-container">
                ${renderProductsTable(products, canEditProducts)}
            </div>
        </div>
    `;

    // Configurar pesquisa
    setupProductSearch(products, canEditProducts);
    
    // Configurar event listeners específicos para esta seção
    setTimeout(() => {
        const addButton = document.getElementById('openAddProductModalButton');
        if (addButton) {
            console.log("✅ Botão adicionar produto encontrado e pronto");
        }
    }, 100);
}

function renderProductsTable(products, canEdit) {
    if (!products || products.length === 0) {
        return `
            <div class="text-center py-8 text-slate-400">
                <i class="fas fa-box-open fa-3x mb-4"></i>
                <p>Nenhum produto encontrado.</p>
                ${canEdit ? '<p class="text-sm mt-2">Clique em "Adicionar Produto" para começar.</p>' : ''}
            </div>
        `;
    }

    return `
        <table class="min-w-full bg-slate-800 shadow-md rounded-lg overflow-hidden">
            <thead class="bg-slate-700">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Produto</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Categoria</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Preço</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Estoque</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                    ${canEdit ? '<th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Ações</th>' : ''}
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-700">
                ${products.map(product => renderProductRow(product, canEdit)).join('')}
            </tbody>
        </table>
    `;
}

function renderProductRow(product, canEdit) {
    const lowStockThreshold = Number(product.lowStockAlert) || 10;
    const isLowStock = product.stock <= lowStockThreshold && product.stock > 0;
    const isOutOfStock = product.stock === 0;

    let statusClass = 'text-green-400';
    let statusIcon = 'fa-check-circle';
    let statusText = 'Em estoque';

    if (isOutOfStock) {
        statusClass = 'text-red-400';
        statusIcon = 'fa-times-circle';
        statusText = 'Sem estoque';
    } else if (isLowStock) {
        statusClass = 'text-yellow-400';
        statusIcon = 'fa-exclamation-triangle';
        statusText = 'Estoque baixo';
    }

    return `
        <tr class="hover:bg-slate-750 transition-colors duration-150">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-slate-200">${product.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${product.category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-300">${formatCurrency(product.price)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${product.stock} unidades</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm ${statusClass}">
                <i class="fas ${statusIcon} mr-2"></i>
                ${statusText}
            </td>
            ${canEdit ? `
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center gap-2">
                        <button class="product-action-btn product-edit-btn edit-product-btn" 
                                data-product-id="${product.id}"
                                title="Editar produto">
                            <i class="fas fa-edit"></i>
                            <span>Editar</span>
                        </button>
                        <button class="product-action-btn product-delete-btn delete-product-btn" 
                                data-product-id="${product.id}" 
                                data-product-name="${product.name}"
                                title="Excluir produto">
                            <i class="fas fa-trash"></i>
                            <span>Excluir</span>
                        </button>
                    </div>
                </td>
            ` : ''}
        </tr>
    `;
}

function setupProductSearch(allProducts, canEdit) {
    const searchField = document.getElementById('productSearchField');
    if (!searchField) return;

    searchField.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredProducts = allProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );

        const tableContainer = document.getElementById('productsTable');
        if (tableContainer) {
            tableContainer.innerHTML = renderProductsTable(filteredProducts, canEdit);
        }
    });
}

// === SISTEMA DE VENDAS ===

function renderAvailableProducts(products) {
    const container = document.getElementById('availableProductsList');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="text-center text-slate-400 p-4">
                <i class="fas fa-box-open fa-2x mb-2"></i>
                <p>Nenhum produto encontrado</p>
            </div>
        `;
        return;
    }

    // Ordenar produtos por quantidade vendida e pegar os 3 mais vendidos
    const topProducts = products
        .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
        .slice(0, 3);

    container.innerHTML = `
        <div class="flex gap-4 overflow-x-auto pb-2">
            ${topProducts.map(product => `
                <div class="product-select-card flex-1 min-w-[280px]">
                    <div class="product-select-header">
                        <span class="product-select-name">${product.name}</span>
                        <span class="product-select-price">${formatCurrency(product.price)}</span>
                    </div>
                    <div class="product-select-info">
                        <span class="product-category">${product.category}</span>
                        <span class="product-stock ${product.stock > 10 ? 'available' : product.stock > 0 ? 'low' : 'out'}">
                            ${product.stock > 0 ? `${product.stock} em estoque` : 'Indisponível'}
                        </span>
                    </div>
                    ${product.stock > 0 ? `
                        <div class="product-select-actions">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="changeQuantity('${product.id}', -1)">-</button>
                                <input type="number" 
                                       class="quantity-input" 
                                       value="1" 
                                       min="1" 
                                       max="${product.stock}"
                                       onchange="updateQuantity('${product.id}')"
                                       id="quantity-${product.id}">
                                <button class="quantity-btn" onclick="changeQuantity('${product.id}', 1)">+</button>
                            </div>
                            <button class="btn-primary" onclick="toggleProductSelection('${product.id}')">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    ` : `
                        <button class="btn-secondary w-full" disabled>
                            <i class="fas fa-times mr-2"></i>Indisponível
                        </button>
                    `}
                </div>
            `).join('')}
        </div>
    `;
}

function addSaleFormStyles() {
    if (!document.getElementById('saleFormStyles')) {
        const style = document.createElement('style');
        style.id = 'saleFormStyles';
        style.textContent = `
            .register-sale-container {
                max-width: 1200px;
                margin: 0 auto;
            }

            .sale-header {
                margin-bottom: 2rem;
            }

            .sale-info-card {
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
                border-radius: 0.75rem;
                padding: 1.5rem;
                border: 1px solid rgba(51, 65, 85, 0.5);
                backdrop-filter: blur(10px);
            }

            .products-selection-card, .cart-card {
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
                border-radius: 0.75rem;
                padding: 1.5rem;
                border: 1px solid rgba(51, 65, 85, 0.5);
                backdrop-filter: blur(10px);
            }

            .products-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1rem;
                max-height: 400px;
                overflow-y: auto;
            }

            .product-select-card {
                background: rgba(51, 65, 85, 0.5);
                border-radius: 0.5rem;
                padding: 1rem;
                border: 1px solid rgba(71, 85, 105, 0.5);
                transition: all 0.3s ease;
            }

            .product-select-card:hover {
                border-color: rgba(56, 189, 248, 0.5);
                background: rgba(56, 189, 248, 0.05);
            }

            .product-select-card.out-of-stock {
                opacity: 0.6;
                border-color: rgba(239, 68, 68, 0.3);
            }

            .product-select-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.75rem;
            }

            .product-select-name {
                font-weight: 600;
                color: #F1F5F9;
                margin-right: 0.5rem;
            }

            .product-select-price {
                font-weight: 600;
                color: #38BDF8;
            }

            .product-select-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                font-size: 0.875rem;
            }

            .product-category {
                color: #94A3B8;
            }

            .product-stock {
                font-weight: 500;
            }

            .product-stock.available {
                color: #10B981;
            }

            .product-stock.low {
                color: #F59E0B;
            }

            .product-stock.out {
                color: #EF4444;
            }

            .product-select-actions {
                display: flex;
                gap: 0.5rem;
                align-items: center;
            }

            .quantity-controls {
                display: flex;
                align-items: center;
                background: rgba(71, 85, 105, 0.5);
                border-radius: 0.375rem;
                border: 1px solid rgba(71, 85, 105, 0.5);
            }

            .quantity-btn {
                background: none;
                border: none;
                color: #94A3B8;
                padding: 0.25rem 0.5rem;
                cursor: pointer;
                transition: color 0.2s ease;
            }

            .quantity-btn:hover {
                color: #F1F5F9;
            }

            .quantity-input {
                background: none;
                border: none;
                color: #F1F5F9;
                text-align: center;
                width: 3rem;
                padding: 0.25rem;
            }

            .quantity-input:focus {
                outline: none;
            }

            .cart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .cart-items {
                min-height: 150px;
            }

            .empty-cart {
                text-align: center;
                padding: 2rem;
                color: #94A3B8;
            }

            .cart-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                background: rgba(51, 65, 85, 0.3);
                border-radius: 0.5rem;
                margin-bottom: 0.5rem;
            }

            .cart-item-info {
                flex: 1;
            }

            .cart-item-name {
                font-weight: 500;
                color: #F1F5F9;
                margin-bottom: 0.25rem;
            }

            .cart-item-details {
                font-size: 0.875rem;
                color: #94A3B8;
            }

            .cart-item-price {
                font-weight: 600;
                color: #38BDF8;
                margin-right: 1rem;
            }

            .cart-summary {
                border-top: 1px solid rgba(51, 65, 85, 0.5);
                padding-top: 1rem;
                margin-top: 1rem;
            }

            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
                color: #94A3B8;
            }

            .total-row {
                font-size: 1.125rem;
                font-weight: 600;
                color: #F1F5F9;
                border-top: 1px solid rgba(51, 65, 85, 0.5);
                padding-top: 0.5rem;
                margin-top: 0.5rem;
            }

            .sale-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                margin-top: 2rem;
            }

            .info-item {
                text-align: center;
            }

            .info-label {
                display: block;
                font-size: 0.75rem;
                color: #94A3B8;
                margin-bottom: 0.25rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .info-value {
                color: #F1F5F9;
                font-weight: 500;
            }

            .loading-products {
                grid-column: 1 / -1;
                text-align: center;
                padding: 2rem;
                color: #94A3B8;
            }

            @media (max-width: 768px) {
                .products-grid {
                    grid-template-columns: 1fr;
                }

                .sale-actions {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

function toggleProductSelection(productId) {
    const product = EliteControl.state.availableProducts.find(p => p.id === productId);
    if (!product) return;

    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityInput?.value) || 1;

    const existingItem = EliteControl.state.saleCart.find(item => item.productId === productId);
    if (existingItem) {
        EliteControl.state.saleCart = EliteControl.state.saleCart.filter(item => item.productId !== productId);
    } else {
        EliteControl.state.saleCart.push({
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            quantity: quantity,
            stock: product.stock
        });
    }

    updateCartDisplay();
}

function changeQuantity(productId, delta, isCartItem = false) {
    const inputId = isCartItem ? `cart-quantity-${productId}` : `quantity-${productId}`;
    const input = document.getElementById(inputId);
    if (!input) return;

    const currentValue = parseInt(input.value) || 1;
    const product = EliteControl.state.availableProducts.find(p => p.id === productId);
    if (!product) return;

    let newValue = currentValue + delta;
    newValue = Math.max(1, Math.min(newValue, product.stock));
    input.value = newValue;

    if (isCartItem) {
        updateCartItemQuantity(productId, newValue);
    }
}

function updateCartItemQuantity(productId, quantity) {
    const cartItem = EliteControl.state.saleCart.find(item => item.productId === productId);
    if (!cartItem) return;

    const product = EliteControl.state.availableProducts.find(p => p.id === productId);
    if (!product) return;

    quantity = parseInt(quantity);
    if (isNaN(quantity) || quantity < 1) quantity = 1;
    if (quantity > product.stock) quantity = product.stock;

    cartItem.quantity = quantity;
    updateCartDisplay();
}

function updateQuantity(productId) {
    const quantityInput = document.getElementById(`quantity-${productId}`);
    if (!quantityInput) return;

    const quantity = parseInt(quantityInput.value);
    const product = EliteControl.state.availableProducts.find(p => p.id === productId);
    
    if (!product) return;

    if (quantity < 1) {
        quantityInput.value = 1;
    } else if (quantity > product.stock) {
        quantityInput.value = product.stock;
        showTemporaryAlert(`Máximo disponível: ${product.stock}`, 'warning', 2000);
    }
}

function removeCartItem(productId) {
    EliteControl.state.saleCart = EliteControl.state.saleCart.filter(item => item.productId !== productId);
    updateCartDisplay();
}

function clearCart() {
    EliteControl.state.saleCart = [];
    updateCartDisplay();
}

function updateSaleInterface() {
    updateCartDisplay();
    updateFinalizeSaleButton();
}

function updateCartDisplay() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;

    if (EliteControl.state.saleCart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart fa-2x mb-2 text-slate-400"></i>
                <p class="text-slate-400">Nenhum produto adicionado</p>
                <p class="text-sm text-slate-500">Selecione produtos acima para adicionar à venda</p>
            </div>
        `;
        document.getElementById('cartSummary').style.display = 'none';
        document.getElementById('clearCartButton').style.display = 'none';
        return;
    }

    container.innerHTML = EliteControl.state.saleCart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-details">${item.category}</div>
            </div>
            <div class="cart-item-actions">
                <div class="cart-quantity-controls">
                    <button class="cart-quantity-btn" onclick="changeQuantity('${item.productId}', -1, true)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" 
                           class="cart-quantity-input" 
                           id="cart-quantity-${item.productId}"
                           value="${item.quantity}" 
                           min="1" 
                           max="${item.stock}"
                           onchange="updateCartItemQuantity('${item.productId}', this.value)">
                    <button class="cart-quantity-btn" onclick="changeQuantity('${item.productId}', 1, true)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="cart-item-price">${formatCurrency(item.price * item.quantity)}</div>
                <button class="cart-item-remove" onclick="removeCartItem('${item.productId}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Atualizar sumário
    const subtotal = EliteControl.state.saleCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('cartTotal').textContent = formatCurrency(subtotal);
    document.getElementById('cartSummary').style.display = 'block';
    document.getElementById('clearCartButton').style.display = 'block';

    updateFinalizeSaleButton();
}

function updateCurrentTime() {
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        const now = new Date();
        dateTimeElement.textContent = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`;
    }
}

function updateFinalizeSaleButton() {
    const button = document.getElementById('finalizeSaleButton');
    if (!button) return;

    const hasCustomer = EliteControl.state.selectedCustomer !== null;
    const hasItems = EliteControl.state.saleCart.length > 0;

    button.disabled = !hasCustomer || !hasItems;
    button.title = !hasCustomer ? 'Selecione um cliente' : !hasItems ? 'Adicione produtos ao carrinho' : '';
}

function closeSaleSuccessModal() {
    const modal = document.getElementById('saleSuccessModal');
    if (modal) {
        modal.remove();
    }
}

// === AUTENTICAÇÃO E NAVEGAÇÃO ===

async function handleAuthStateChange(user) {
    console.log('🔐 Estado de autenticação alterado:', user ? 'Logado' : 'Deslogado');

    if (user) {
        try {
            await ensureTestDataExists();
            let userData = await DataService.getUserData(user.uid);

            if (!userData) {
                userData = await findUserByEmail(user.email);
            }

            if (!userData && EliteControl.testUsers[user.email]) {
                userData = await createTestUser(user.uid, user.email);
            }

            if (userData && userData.role) {
                localStorage.setItem('elitecontrol_user_role', userData.role);
                const currentUser = { uid: user.uid, email: user.email, ...userData };

                initializeUI(currentUser);
                await handleNavigation(currentUser);

            } else {
                console.error('Dados do usuário ou cargo não encontrados para:', user.email);
                showTemporaryAlert('Não foi possível carregar os dados do seu perfil. Tente novamente.', 'error');
                await firebase.auth().signOut();
            }

        } catch (error) {
            console.error("❌ Erro no processo de autenticação:", error);
            showTemporaryAlert("Erro ao carregar dados do usuário.", "error");

            if (!window.location.pathname.includes('index.html')) {
                await firebase.auth().signOut();
            }
        }
    } else {
        handleLoggedOut();
    }
}

// === INTERFACE PRINCIPAL ===

function initializeUI(currentUser) {
    console.log("🎨 Inicializando interface para:", currentUser.role);

    updateUserInfo(currentUser);
    initializeNotifications();
    initializeSidebar(currentUser.role);

    if (document.getElementById('temporaryAlertsContainer') &&
        window.location.href.includes('dashboard.html') &&
        !sessionStorage.getItem('welcomeAlertShown')) {

        const userName = currentUser.name || currentUser.email.split('@')[0];
        showTemporaryAlert(`Bem-vindo, ${userName}! EliteControl v2.0 com IA`, 'success', 5000);
        sessionStorage.setItem('welcomeAlertShown', 'true');
    }
}

// === CARREGAMENTO DE SEÇÕES ===

async function loadSectionContent(sectionId, currentUser) {
    console.log(`📄 Carregando seção: ${sectionId} para usuário:`, currentUser.role);

    const dynamicContentArea = document.getElementById('dynamicContentArea');
    if (!dynamicContentArea) {
        console.error("CRITICAL: dynamicContentArea não encontrado no DOM.");
        return;
    }

    // Mostrar loading
    dynamicContentArea.innerHTML = `
        <div class="p-8 text-center text-slate-400">
            <i class="fas fa-spinner fa-spin fa-2x mb-4"></i>
            <p>Carregando ${sectionId}...</p>
        </div>
    `;

    try {
        switch (sectionId) {
            case 'produtos':
                const products = await DataService.getProducts();
                renderProductsList(products, dynamicContentArea, currentUser.role);
                break;

            case 'produtos-consulta':
                const allProducts = await DataService.getProducts();
                renderProductsConsult(allProducts, dynamicContentArea, currentUser.role);
                break;

            case 'geral':
            case 'vendas-painel':
            case 'estoque':
                await loadDashboardData(currentUser);
                break;

            case 'registrar-venda':
                renderRegisterSaleForm(dynamicContentArea, currentUser);
                break;

            case 'vendas':
                const sales = await DataService.getSales();
                renderSalesList(sales, dynamicContentArea, currentUser.role);
                break;

            case 'minhas-vendas':
                const mySales = await DataService.getSalesBySeller(currentUser.uid);
                renderSalesList(mySales, dynamicContentArea, currentUser.role, true);
                break;

            case 'clientes':
                await renderCustomersSection(dynamicContentArea, currentUser);
                break;

            case 'usuarios':
                renderUsersSection(dynamicContentArea);
                break;

            default:
                dynamicContentArea.innerHTML = `
                    <div class="p-8 text-center text-slate-400">
                        <i class="fas fa-exclamation-triangle fa-2x mb-4"></i>
                        <p>Seção "${sectionId}" em desenvolvimento ou não encontrada.</p>
                    </div>
                `;
        }
    } catch (error) {
        console.error(`❌ Erro ao carregar seção ${sectionId}:`, error);
        dynamicContentArea.innerHTML = `
            <div class="p-8 text-center text-red-400">
                <i class="fas fa-times-circle fa-2x mb-4"></i>
                <p>Erro ao carregar conteúdo da seção ${sectionId}. Tente novamente.</p>
                <p class="text-xs mt-2">${error.message}</p>
            </div>
        `;
        showTemporaryAlert(`Erro ao carregar ${sectionId}.`, 'error');
    }
}

// === PRODUTOS COM PESQUISA APRIMORADA ===

function renderProductsConsult(products, container, userRole) {
    console.log("🔍 Renderizando consulta de produtos com pesquisa avançada");

    container.innerHTML = `
        <div class="products-consult-container">
            <h2 class="text-xl font-semibold text-slate-100 mb-4">Consultar Produtos</h2>

            <div class="search-section mb-6">
                <div class="search-bar bg-slate-800 p-4 rounded-lg">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="col-span-2">
                            <div class="relative">
                                <input type="text"
                                       id="productSearchInput"
                                       class="form-input pl-10 w-full"
                                       placeholder="Buscar por nome ou categoria...">
                                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                            </div>
                        </div>

                        <select id="categoryFilter" class="form-select">
                            <option value="">Todas as categorias</option>
                        </select>

                        <select id="stockFilter" class="form-select">
                            <option value="">Todos os status</option>
                            <option value="available">Em estoque</option>
                            <option value="low">Estoque baixo</option>
                            <option value="out">Sem estoque</option>
                        </select>
                    </div>

                    <div class="mt-4 flex items-center justify-between">
                        <div class="text-sm text-slate-400">
                            <span id="searchResultsCount">${products.length}</span> produtos encontrados
                        </div>

                        <div class="flex gap-2">
                            <button id="clearFiltersButton" class="btn-secondary btn-sm">
                                <i class="fas fa-times mr-1"></i> Limpar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="productsConsultList" class="products-grid"></div>
        </div>
    `;

    // Aplicar estilos
    addProductsConsultStyles();

    // Preencher categorias
    const categories = [...new Set(products.map(p => p.category))].sort();
    const categoryFilter = document.getElementById('categoryFilter');
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });

    // Renderizar produtos
    renderFilteredProducts(products);

    // Configurar event listeners
    setupProductsConsultEventListeners(products);
}

function renderFilteredProducts(products) {
    const container = document.getElementById('productsConsultList');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400 col-span-full">
                <i class="fas fa-search fa-3x mb-4"></i>
                <p>Nenhum produto encontrado com os filtros aplicados.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => {
        const lowStockThreshold = Number(product.lowStockAlert) || 10;
        const stockClass = product.stock === 0 ? 'out' : (product.stock <= lowStockThreshold ? 'low' : 'available');
        const stockLabel = product.stock === 0 ? 'Sem estoque' :
                          (product.stock <= lowStockThreshold ? 'Estoque baixo' : 'Em estoque');

        return `
            <div class="product-consult-card ${stockClass}">
                <div class="product-header">
                    <h3 class="product-name">${product.name}</h3>
                    <span class="stock-badge ${stockClass}">${stockLabel}</span>
                </div>

                <div class="product-info">
                    <div class="info-row">
                        <span class="info-label">Categoria:</span>
                        <span class="info-value">${product.category}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Preço:</span>
                        <span class="info-value price">${formatCurrency(product.price)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Estoque:</span>
                        <span class="info-value">${product.stock} unidades</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Alerta em:</span>
                        <span class="info-value">${lowStockThreshold} unidades</span>
                    </div>
                </div>

                ${product.stock > 0 ? `
                    <button class="btn-primary btn-sm w-full mt-4"
                            onclick="window.location.hash='#registrar-venda'">
                        <i class="fas fa-shopping-cart mr-2"></i>
                        Vender
                    </button>
                ` : `
                    <button class="btn-secondary btn-sm w-full mt-4" disabled>
                        <i class="fas fa-times mr-2"></i>
                        Indisponível
                    </button>
                `}
            </div>
        `;
    }).join('');
}

function setupProductsConsultEventListeners(allProducts) {
    const searchInput = document.getElementById('productSearchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter = document.getElementById('stockFilter');
    const clearButton = document.getElementById('clearFiltersButton');
    const resultsCount = document.getElementById('searchResultsCount');

    const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const stockStatus = stockFilter.value;

        let filtered = allProducts;

        // Filtro de busca
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro de categoria
        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }

        // Filtro de estoque
        if (stockStatus) {
            filtered = filtered.filter(p => {
                const lowStockThreshold = Number(p.lowStockAlert) || 10;
                switch (stockStatus) {
                    case 'available':
                        return p.stock > lowStockThreshold;
                    case 'low':
                        return p.stock > 0 && p.stock <= lowStockThreshold;
                    case 'out':
                        return p.stock === 0;
                    default:
                        return true;
                }
            });
        }

        resultsCount.textContent = filtered.length;
        renderFilteredProducts(filtered);
    };

    searchInput.addEventListener('input', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    stockFilter.addEventListener('change', applyFilters);

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        stockFilter.value = '';
        applyFilters();
    });
}

function addProductsConsultStyles() {
    if (!document.getElementById('productsConsultStyles')) {
        const style = document.createElement('style');
        style.id = 'productsConsultStyles';
        style.textContent = `
            .products-consult-container {
                max-width: 1400px;
                margin: 0 auto;
            }

            .search-section {
                animation: fadeIn 0.5s ease;
            }

            .products-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
            }

            .product-consult-card {
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
                border-radius: 0.75rem;
                padding: 1.5rem;
                border: 1px solid rgba(51, 65, 85, 0.5);
                transition: all 0.3s ease;
                animation: fadeIn 0.5s ease;
            }

            .product-consult-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                border-color: rgba(56, 189, 248, 0.5);
            }

            .product-consult-card.out {
                opacity: 0.7;
                border-color: rgba(239, 68, 68, 0.3);
            }

            .product-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
            }

            .product-name {
                font-size: 1.125rem;
                font-weight: 600;
                color: #F1F5F9;
                margin-right: 0.5rem;
            }

            .stock-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .stock-badge.available {
                background: rgba(16, 185, 129, 0.2);
                color: #10B981;
                border: 1px solid rgba(16, 185, 129, 0.5);
            }

            .stock-badge.low {
                background: rgba(245, 158, 11, 0.2);
                color: #F59E0B;
                border: 1px solid rgba(245, 158, 11, 0.5);
            }

            .stock-badge.out {
                background: rgba(239, 68, 68, 0.2);
                color: #EF4444;
                border: 1px solid rgba(239, 68, 68, 0.5);
            }

            .product-info {
                margin-bottom: 1rem;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(51, 65, 85, 0.3);
            }

            .info-row:last-child {
                border-bottom: none;
            }

            .info-label {
                color: #94A3B8;
                font-size: 0.875rem;
            }

            .info-value {
                color: #F1F5F9;
                font-weight: 500;
                font-size: 0.875rem;
            }

            .info-value.price {
                color: #38BDF8;
                font-size: 1rem;
            }

            .btn-sm {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
            }

            @media (max-width: 768px) {
                .products-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// === VENDAS COM CLIENTE ===

function renderRegisterSaleForm(container, currentUser) {
    container.innerHTML = `
        <div class="register-sale-container">
            <div class="page-header mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-semibold text-slate-100">Registrar Nova Venda</h2>
                        <p class="text-sm text-slate-400">Selecione o cliente, produtos e quantidades</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-slate-400">Vendedor: ${currentUser.name || currentUser.email}</p>
                        <p class="text-sm text-slate-400" id="currentDateTime"></p>
                    </div>
                </div>
            </div>

            <div class="customer-selection-section mb-6">
                <div class="flex items-center gap-4 mb-4">
                    <div class="flex-1 relative">
                        <input type="text"
                               id="customerSearchInput"
                               class="form-input w-full py-3 pl-4 pr-10 bg-slate-800 border border-slate-700 rounded-lg"
                               placeholder="Digite o nome do cliente para buscar...">
                        <div id="customerSuggestions" class="customer-suggestions hidden"></div>
                    </div>
                    <button id="newCustomerButton" class="btn-primary">
                        <i class="fas fa-user-plus mr-2"></i>
                        Novo Cliente
                    </button>
                </div>

                <div id="selectedCustomerInfo" class="selected-customer-info hidden">
                    <div class="customer-card bg-slate-800 border border-slate-700 rounded-lg p-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 id="selectedCustomerName" class="text-lg font-semibold text-slate-100"></h4>
                                <p id="selectedCustomerPhone" class="text-sm text-slate-400 mt-1"></p>
                                <p id="selectedCustomerStats" class="text-sm text-slate-500 mt-1"></p>
                            </div>
                            <button id="removeCustomerButton" class="text-slate-400 hover:text-red-400 transition-colors">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="products-section mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-slate-100">
                        <i class="fas fa-shopping-cart mr-2"></i>
                        Produtos Disponíveis
                    </h3>
                    <div class="search-container relative">
                        <input type="text" 
                               id="productSearchInput" 
                               class="form-input w-64 py-2 pl-4 pr-10 bg-slate-800 border border-slate-700 rounded-lg"
                               placeholder="Buscar produtos...">
                        <i class="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                    </div>
                </div>

                <div id="availableProductsList" class="products-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <!-- Produtos serão renderizados aqui -->
                </div>
            </div>

            <div class="cart-section bg-slate-800 border border-slate-700 rounded-lg p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-slate-100">
                        <i class="fas fa-receipt mr-2"></i>
                        Itens da Venda
                    </h3>
                    <button id="clearCartButton" class="btn-secondary btn-sm" style="display: none;">
                        <i class="fas fa-trash-alt mr-2"></i>
                        Limpar
                    </button>
                </div>
                
                <div id="cartItemsList" class="cart-items space-y-3 mb-6">
                    <div class="empty-cart text-center py-8">
                        <i class="fas fa-shopping-cart fa-2x mb-2 text-slate-400"></i>
                        <p class="text-slate-400">Nenhum produto adicionado</p>
                        <p class="text-sm text-slate-500">Selecione produtos acima para adicionar à venda</p>
                    </div>
                </div>

                <div id="cartSummary" class="cart-summary border-t border-slate-700 pt-4" style="display: none;">
                    <div class="flex justify-between items-center py-2">
                        <span class="text-slate-400">Subtotal:</span>
                        <span id="cartSubtotal" class="text-lg font-semibold text-slate-100">R$ 0,00</span>
                    </div>
                    <div class="flex justify-between items-center py-2">
                        <span class="text-slate-400">Total:</span>
                        <span id="cartTotal" class="text-xl font-bold text-sky-400">R$ 0,00</span>
                    </div>
                </div>

                <div class="flex justify-between items-center mt-6">
                    <button id="cancelSaleButton" class="btn-secondary">
                        <i class="fas fa-times mr-2"></i>
                        Cancelar
                    </button>
                    <button id="finalizeSaleButton" class="btn-primary" disabled>
                        <i class="fas fa-check mr-2"></i>
                        Finalizar Venda
                    </button>
                </div>
            </div>
        </div>
    `;

    // Inicializar funcionalidades
    setupSaleFormEventListeners(currentUser);
    
    // Carregar e renderizar produtos disponíveis
    renderAvailableProducts(EliteControl.state.availableProducts || []);

    // Atualizar hora atual
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);
}

function renderAvailableProducts(products) {
    const container = document.getElementById('availableProductsList');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-box-open fa-2x mb-2 text-slate-400"></i>
                <p class="text-slate-400">Nenhum produto encontrado</p>
            </div>
        `;
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-sky-500 transition-all">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="text-lg font-semibold text-slate-100">${product.name}</h4>
                    <p class="text-sm text-slate-400">${product.category}</p>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-sky-400">${formatCurrency(product.price)}</div>
                    <div class="text-sm ${product.stock > 10 ? 'text-green-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'}">
                        ${product.stock} em estoque
                    </div>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <div class="quantity-controls flex items-center bg-slate-700 rounded-lg flex-1">
                    <button class="p-2 text-slate-400 hover:text-slate-100" onclick="changeQuantity('${product.id}', -1)">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" 
                           id="quantity-${product.id}" 
                           class="w-16 bg-transparent border-0 text-center text-slate-100" 
                           value="1" 
                           min="1" 
                           max="${product.stock}">
                    <button class="p-2 text-slate-400 hover:text-slate-100" onclick="changeQuantity('${product.id}', 1)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <button class="btn-primary" onclick="toggleProductSelection('${product.id}')">
                    <i class="fas fa-cart-plus mr-2"></i>
                    Adicionar
                </button>
            </div>
        </div>
    `).join('');
}

function updateCartDisplay() {
    const container = document.getElementById('cartItemsList');
    if (!container) return;

    if (EliteControl.state.saleCart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart text-center py-8">
                <i class="fas fa-shopping-cart fa-2x mb-2 text-slate-400"></i>
                <p class="text-slate-400">Nenhum produto adicionado</p>
                <p class="text-sm text-slate-500">Selecione produtos acima para adicionar à venda</p>
            </div>
        `;
        document.getElementById('cartSummary').style.display = 'none';
        document.getElementById('clearCartButton').style.display = 'none';
        return;
    }

    container.innerHTML = EliteControl.state.saleCart.map(item => `
        <div class="cart-item bg-slate-700 rounded-lg p-4">
            <div class="flex justify-between items-center">
                <div class="flex-1">
                    <h4 class="font-semibold text-slate-100">${item.name}</h4>
                    <p class="text-sm text-slate-400">${item.category}</p>
                </div>
                
                <div class="flex items-center gap-4">
                    <div class="quantity-controls flex items-center bg-slate-800 rounded-lg">
                        <button class="p-2 text-slate-400 hover:text-slate-100" onclick="changeQuantity('${item.productId}', -1, true)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <input type="number" 
                               id="cart-quantity-${item.productId}" 
                               class="w-16 bg-transparent border-0 text-center text-slate-100" 
                               value="${item.quantity}" 
                               min="1" 
                               max="${item.stock}"
                               onchange="updateCartItemQuantity('${item.productId}', this.value)">
                        <button class="p-2 text-slate-400 hover:text-slate-100" onclick="changeQuantity('${item.productId}', 1, true)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    
                    <div class="text-right min-w-[100px]">
                        <div class="font-semibold text-sky-400">${formatCurrency(item.price * item.quantity)}</div>
                        <div class="text-sm text-slate-400">${item.quantity}x ${formatCurrency(item.price)}</div>
                    </div>
                    
                    <button class="text-slate-400 hover:text-red-400 transition-colors" onclick="removeCartItem('${item.productId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Atualizar sumário
    const subtotal = EliteControl.state.saleCart.reduce((total, item) => total + (item.price * item.quantity), 0);
    document.getElementById('cartSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('cartTotal').textContent = formatCurrency(subtotal);
    document.getElementById('cartSummary').style.display = 'block';
    document.getElementById('clearCartButton').style.display = 'block';

    updateFinalizeSaleButton();
}

function setupSaleFormEventListeners(currentUser) {
    // Busca de produtos
    const productSearchInput = document.getElementById('productSearchInput');
    if (productSearchInput) {
        productSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredProducts = EliteControl.state.availableProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
            renderAvailableProducts(filteredProducts);
        });
    }

    // Busca de clientes
    const customerSearchInput = document.getElementById('customerSearchInput');
    if (customerSearchInput) {
        let debounceTimeout;
        customerSearchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.trim();
            
            // Limpar o timeout anterior
            if (debounceTimeout) clearTimeout(debounceTimeout);
            
            // Se o campo estiver vazio, esconder as sugestões
            if (!searchTerm) {
                document.getElementById('customerSuggestions').classList.add('hidden');
                return;
            }

            // Configurar novo timeout para debounce
            debounceTimeout = setTimeout(async () => {
                try {
                    const customersRef = firebase.firestore().collection('customers');
                    const snapshot = await customersRef
                        .where('name', '>=', searchTerm)
                        .where('name', '<=', searchTerm + '\uf8ff')
                        .limit(5)
                        .get();

                    const suggestions = [];
                    snapshot.forEach(doc => {
                        suggestions.push({ id: doc.id, ...doc.data() });
                    });

                    renderCustomerSuggestions(suggestions);
                    document.getElementById('customerSuggestions').classList.remove('hidden');
                } catch (error) {
                    console.error('Erro ao buscar clientes:', error);
                }
            }, 300);
        });

        // Fechar sugestões ao clicar fora
        document.addEventListener('click', (e) => {
            const suggestions = document.getElementById('customerSuggestions');
            const isClickInside = customerSearchInput.contains(e.target) || 
                                (suggestions && suggestions.contains(e.target));
            
            if (!isClickInside && suggestions) {
                suggestions.classList.add('hidden');
            }
        });
    }

    // Botão Novo Cliente
    const newCustomerButton = document.getElementById('newCustomerButton');
    if (newCustomerButton) {
        newCustomerButton.addEventListener('click', () => {
            showCustomerModal();
        });
    }

    // Botão Remover Cliente
    const removeCustomerButton = document.getElementById('removeCustomerButton');
    if (removeCustomerButton) {
        removeCustomerButton.addEventListener('click', () => {
            EliteControl.state.selectedCustomer = null;
            document.getElementById('selectedCustomerInfo').classList.add('hidden');
            document.getElementById('customerSearchInput').value = '';
            updateFinalizeSaleButton();
        });
    }

    // Botão Limpar Carrinho
    const clearCartButton = document.getElementById('clearCartButton');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    // Botão Cancelar Venda
    const cancelSaleButton = document.getElementById('cancelSaleButton');
    if (cancelSaleButton) {
        cancelSaleButton.addEventListener('click', () => {
            showCustomConfirm('Deseja realmente cancelar esta venda?', () => {
                clearCart();
                EliteControl.state.selectedCustomer = null;
                document.getElementById('selectedCustomerInfo').classList.add('hidden');
                document.getElementById('customerSearchInput').value = '';
                updateFinalizeSaleButton();
            });
        });
    }

    // Botão Finalizar Venda
    const finalizeSaleButton = document.getElementById('finalizeSaleButton');
    if (finalizeSaleButton) {
        finalizeSaleButton.addEventListener('click', async () => {
            if (!EliteControl.state.selectedCustomer || EliteControl.state.saleCart.length === 0) return;

            try {
                const sale = {
                    customerId: EliteControl.state.selectedCustomer.id,
                    customerName: EliteControl.state.selectedCustomer.name,
                    items: EliteControl.state.saleCart,
                    total: EliteControl.state.saleCart.reduce((total, item) => total + (item.price * item.quantity), 0),
                    date: new Date(),
                    vendorId: currentUser.uid,
                    vendorName: currentUser.name || currentUser.email
                };

                await firebase.firestore().collection('sales').add(sale);
                
                // Atualizar estoque
                const batch = firebase.firestore().batch();
                for (const item of sale.items) {
                    const productRef = firebase.firestore().collection('products').doc(item.productId);
                    batch.update(productRef, {
                        stock: firebase.firestore.FieldValue.increment(-item.quantity)
                    });
                }
                await batch.commit();

                // Atualizar estatísticas do cliente
                const customerRef = firebase.firestore().collection('customers').doc(sale.customerId);
                await customerRef.update({
                    totalPurchases: firebase.firestore.FieldValue.increment(1),
                    lastPurchaseDate: sale.date,
                    totalSpent: firebase.firestore.FieldValue.increment(sale.total)
                });

                // Limpar formulário
                clearCart();
                EliteControl.state.selectedCustomer = null;
                document.getElementById('selectedCustomerInfo').classList.add('hidden');
                document.getElementById('customerSearchInput').value = '';
                updateFinalizeSaleButton();

                // Mostrar modal de sucesso
                showSaleSuccessModal(sale);

                // Recarregar produtos
                await reloadProductsIfNeeded();
            } catch (error) {
                console.error('Erro ao finalizar venda:', error);
                showTemporaryAlert('Erro ao finalizar venda. Tente novamente.', 'error');
            }
        });
    }
}

function addCustomerStyles() {
                console.error("❌ Erro ao excluir produto:", error);
                showTemporaryAlert(`Erro ao excluir produto "${productName}".`, 'error');
            }
        }
    );
}

async function handleLogin(e) {
    e.preventDefault();
    console.log("🔑 Tentativa de login");

    const email = document.getElementById('email')?.value?.trim();
    const password = document.getElementById('password')?.value;
    const perfil = document.getElementById('perfil')?.value;

    if (!email || !password) {
        showLoginError('Por favor, preencha email e senha.');
        return;
    }

    if (!perfil) {
        showLoginError('Por favor, selecione seu perfil.');
        return;
    }

    const loginButton = e.target.querySelector('button[type="submit"]');
    const originalText = loginButton?.textContent;

    if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = 'Entrando...';
    }

    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);

        const user = firebase.auth().currentUser;
        if (user) {
            let userData = await DataService.getUserData(user.uid);

            if (!userData) {
                userData = await findUserByEmail(email);
            }

            if (!userData && EliteControl.testUsers[email]) {
                userData = await createTestUser(user.uid, email);
            }

            if (userData && userData.role === perfil) {
                showLoginError('');
                console.log("✅ Login bem-sucedido, aguardando redirecionamento pelo AuthStateChange.");
            } else if (userData && userData.role !== perfil) {
                await firebase.auth().signOut();
                showLoginError(`Perfil selecionado (${perfil}) não corresponde ao perfil do usuário (${userData.role}).`);
            } else {
                await firebase.auth().signOut();
                showLoginError('Não foi possível verificar os dados do perfil. Tente novamente.');
            }
        } else {
            showLoginError('Erro inesperado durante o login. Tente novamente.');
        }

    } catch (error) {
        console.error("❌ Erro de login:", error);

        let friendlyMessage = "Email ou senha inválidos.";

        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
                friendlyMessage = "Usuário não encontrado ou credenciais incorretas.";
                break;
            case 'auth/wrong-password':
                friendlyMessage = "Senha incorreta.";
                break;
            case 'auth/invalid-email':
                friendlyMessage = "Formato de email inválido.";
                break;
            case 'auth/network-request-failed':
                friendlyMessage = "Erro de rede. Verifique sua conexão.";
                break;
            case 'auth/too-many-requests':
                friendlyMessage = "Muitas tentativas. Tente novamente mais tarde.";
                break;
        }

        showLoginError(friendlyMessage);

    } finally {
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.textContent = originalText;
        }
    }
}

async function handleLogout() {
    console.log("👋 Fazendo logout");

    try {
        await firebase.auth().signOut();
        sessionStorage.removeItem('welcomeAlertShown');
        window.location.hash = '';
        console.log("✅ Logout realizado com sucesso, aguardando AuthStateChange para redirecionar.");
    } catch (error) {
        console.error("❌ Erro ao fazer logout:", error);
        showTemporaryAlert('Erro ao sair. Tente novamente.', 'error');
    }
}

// === NAVEGAÇÃO E AUTENTICAÇÃO ===

async function handleNavigation(currentUser) {
    const currentPath = window.location.pathname;
    const isIndexPage = currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/');
    const isDashboardPage = currentPath.includes('dashboard.html');

    if (isIndexPage) {
        console.log("🔄 Usuário logado na página de login. Redirecionando para dashboard...");
        window.location.href = 'dashboard.html' + (window.location.hash || '');
    } else if (isDashboardPage) {
        console.log("📊 Usuário já está no dashboard. Carregando seção apropriada...");
        const section = window.location.hash.substring(1);
        const defaultSection = getDefaultSection(currentUser.role);
        const targetSection = section || defaultSection;

        initializeUI(currentUser);

        await loadSectionContent(targetSection, currentUser);
        updateSidebarActiveState(targetSection);
    } else {
        console.log("🔄 Usuário logado em página desconhecida. Redirecionando para dashboard...");
        window.location.href = 'dashboard.html';
    }
}

function getDefaultSection(role) {
    switch (role) {
        case 'Vendedor': return 'vendas-painel';
        case 'Controlador de Estoque': return 'estoque';
        case 'Dono/Gerente': return 'geral';
        default:
            console.warn(`Papel desconhecido "${role}" ao obter seção padrão. Usando 'geral'.`);
            return 'geral';
    }
}

function handleLoggedOut() {
    console.log("🔒 Usuário deslogado.");
    localStorage.removeItem('elitecontrol_user_role');
    sessionStorage.removeItem('welcomeAlertShown');

    if (document.getElementById('userInitials') && window.location.pathname.includes('dashboard.html')) {
        clearDashboardUI();
    }

    const isIndexPage = window.location.pathname.includes('index.html') ||
                       window.location.pathname === '/' ||
                       window.location.pathname.endsWith('/');

    if (!isIndexPage) {
        console.log("🔄 Redirecionando para página de login...");
        window.location.href = 'index.html';
    } else {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.reset();
    }
}

async function ensureTestDataExists() {
    try {
        const products = await DataService.getProducts();

        if (!products || products.length === 0) {
            console.log("📦 Nenhum produto encontrado. Criando produtos de exemplo...");
            for (const product of sampleProducts) {
                await DataService.addProduct(product);
            }
            console.log("✅ Produtos de exemplo criados com sucesso.");
        } else {
            console.log("📦 Produtos já existem no banco de dados.");
        }
    } catch (error) {
        console.warn("⚠️ Erro ao verificar ou criar dados de exemplo:", error);
    }
}

async function findUserByEmail(email) {
    if (!db) {
        console.error("Firestore (db) não está inicializado em findUserByEmail.");
        return null;
    }
    try {
        const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return { uid: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar usuário por email:", error);
        return null;
    }
}

async function createTestUser(uid, email) {
    if (!db) {
        console.error("Firestore (db) não está inicializado em createTestUser.");
        return null;
    }
    try {
        const testUserData = EliteControl.testUsers[email];
        if (testUserData) {
            await db.collection('users').doc(uid).set({
                ...testUserData,
                uid: uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log("✅ Usuário de teste criado/atualizado no Firestore:", testUserData.name);
            return { uid: uid, ...testUserData };
        }
        return null;
    } catch (error) {
        console.error("Erro ao criar usuário de teste:", error);
        return null;
    }
}

// === DASHBOARD E GRÁFICOS ===

async function loadDashboardData(currentUser) {
    console.log("📊 Carregando dados do dashboard para:", currentUser.role);

    const dynamicContentArea = document.getElementById('dynamicContentArea');
    if (!dynamicContentArea) {
        console.error("❌ Area de conteúdo dinâmico não encontrada");
        return;
    }

    dynamicContentArea.innerHTML = getDashboardTemplate(currentUser.role);
    setupChartEventListeners();

    try {
        showTemporaryAlert("Carregando dados do dashboard...", "info", 2000);

        let salesStats, topProductsData, recentSalesData, productStats, allProducts;

        productStats = await DataService.getProductStats();
        allProducts = await DataService.getProducts();

        if (currentUser.role === 'Vendedor') {
            const vendorSales = await DataService.getSalesBySeller(currentUser.uid);
            salesStats = await DataService.getSalesStatsBySeller(currentUser.uid);
            topProductsData = await DataService.getTopProductsBySeller(currentUser.uid, 5);
            recentSalesData = vendorSales;

            console.log("✅ Dados do vendedor carregados:", { salesStats, topProductsData, recentSalesData });

            updateDashboardKPIs(salesStats, productStats, allProducts, currentUser);
            renderVendorCharts(salesStats, topProductsData);
            updateRecentActivitiesUI(recentSalesData.slice(0, 5));

        } else if (currentUser.role === 'Controlador de Estoque') {
            const generalSales = await DataService.getSales();
            salesStats = await DataService.getSalesStats();
            topProductsData = await DataService.getTopProducts(5);
            recentSalesData = generalSales;

            console.log("✅ Dados do controlador de estoque carregados:", { productStats, salesStats, topProductsData });
            updateDashboardKPIs(salesStats, productStats, allProducts, currentUser);
            renderStockControllerCharts(productStats);
            updateRecentActivitiesUI(recentSalesData.slice(0, 5));

        } else {
            const generalSales = await DataService.getSales();
            salesStats = await DataService.getSalesStats();
            topProductsData = await DataService.getTopProducts(5);
            recentSalesData = generalSales;

            console.log("✅ Dados gerais carregados:", { productStats, salesStats, topProductsData, recentSalesData });

            updateDashboardKPIs(salesStats, productStats, allProducts, currentUser);
            renderDashboardMainCharts(salesStats, topProductsData);
            updateRecentActivitiesUI(recentSalesData.slice(0, 5));
        }

    } catch (error) {
        console.error("❌ Erro ao carregar dados do dashboard:", error);
        showTemporaryAlert("Falha ao carregar informações do dashboard.", "error");
    }
}

function getDashboardTemplate(userRole) {
    const kpiTemplate = `
        <div id="kpiContainer" class="kpi-container">
            <div class="kpi-card">
                <div class="kpi-icon-wrapper">
                    <i class="fas fa-dollar-sign kpi-icon"></i>
                </div>
                <div class="kpi-content">
                    <div class="kpi-title">Receita Total</div>
                    <div class="kpi-value">R$ 0,00</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon-wrapper">
                    <i class="fas fa-shopping-cart kpi-icon"></i>
                </div>
                <div class="kpi-content">
                    <div class="kpi-title">Total de Vendas</div>
                    <div class="kpi-value">0</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon-wrapper">
                    <i class="fas fa-box kpi-icon"></i>
                </div>
                <div class="kpi-content">
                    <div class="kpi-title">Total de Produtos</div>
                    <div class="kpi-value">0</div>
                </div>
            </div>
            <div class="kpi-card">
                <div class="kpi-icon-wrapper">
                    <i class="fas fa-plus kpi-icon"></i>
                </div>
                <div class="kpi-content">
                    <div class="kpi-title">Ação Rápida</div>
                    <div class="kpi-value">
                        <button class="btn-primary" id="quickActionButton">Ação</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    let chartsTemplate = '';

    if (userRole === 'Dono/Gerente') {
        chartsTemplate = `
            <div id="chartsContainer" class="charts-container">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Vendas por Período</h3>
                        <div class="chart-actions">
                            <button class="chart-action-btn" id="salesChartOptionsButton">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <canvas id="salesChart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Produtos Mais Vendidos</h3>
                        <div class="chart-actions">
                            <button class="chart-action-btn" id="productsChartOptionsButton">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <canvas id="productsChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    } else if (userRole === 'Vendedor') {
        chartsTemplate = `
            <div id="chartsContainer" class="charts-container">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Minhas Vendas - Período</h3>
                        <div class="chart-actions">
                            <button class="chart-action-btn" id="vendorChartOptionsButton">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <canvas id="vendorSalesChart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Meus Produtos Mais Vendidos</h3>
                        <div class="chart-actions">
                            <button class="chart-action-btn" id="vendorProductsChartOptionsButton">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <canvas id="vendorProductsChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    } else if (userRole === 'Controlador de Estoque') {
        chartsTemplate = `
            <div id="chartsContainer" class="charts-container">
                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Produtos por Categoria</h3>
                        <div class="chart-actions">
                            <button class="chart-action-btn" id="categoriesChartOptionsButton">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <canvas id="categoriesChart"></canvas>
                    </div>
                </div>

                <div class="chart-card">
                    <div class="chart-header">
                        <h3 class="chart-title">Status do Estoque</h3>
                        <div class="chart-actions">
                            <button class="chart-action-btn" id="stockChartOptionsButton">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                        </div>
                    </div>
                    <div class="chart-content">
                        <canvas id="stockChart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    const activitiesTemplate = `
        <div class="activities-card">
            <div class="activities-header">
                <h3 class="activities-title">Atividades Recentes</h3>
            </div>
            <ul id="recentActivitiesContainer" class="activities-list"></ul>
        </div>
    `;

    return kpiTemplate + chartsTemplate + activitiesTemplate;
}

function setupChartEventListeners() {
    setTimeout(() => {
        const salesChartOptionsButton = document.getElementById('salesChartOptionsButton');
        if (salesChartOptionsButton) {
            salesChartOptionsButton.addEventListener('click', () =>
                showTemporaryAlert('Opções do gráfico de vendas', 'info')
            );
        }

        const productsChartOptionsButton = document.getElementById('productsChartOptionsButton');
        if (productsChartOptionsButton) {
            productsChartOptionsButton.addEventListener('click', () =>
                showTemporaryAlert('Opções do gráfico de produtos', 'info')
            );
        }

        const vendorChartOptionsButton = document.getElementById('vendorChartOptionsButton');
        if (vendorChartOptionsButton) {
            vendorChartOptionsButton.addEventListener('click', () => showTemporaryAlert('Opções do gráfico de vendas do vendedor', 'info'));
        }
        const vendorProductsChartOptionsButton = document.getElementById('vendorProductsChartOptionsButton');
        if (vendorProductsChartOptionsButton) {
            vendorProductsChartOptionsButton.addEventListener('click', () => showTemporaryAlert('Opções do gráfico de produtos do vendedor', 'info'));
        }
        const categoriesChartOptionsButton = document.getElementById('categoriesChartOptionsButton');
        if (categoriesChartOptionsButton) {
            categoriesChartOptionsButton.addEventListener('click', () => showTemporaryAlert('Opções do gráfico de categorias', 'info'));
        }
        const stockChartOptionsButton = document.getElementById('stockChartOptionsButton');
        if (stockChartOptionsButton) {
            stockChartOptionsButton.addEventListener('click', () => showTemporaryAlert('Opções do gráfico de status do estoque', 'info'));
        }

    }, 100);
}

function updateDashboardKPIs(salesStats, productStats, allProducts, currentUser) {
    console.log("📊 Atualizando KPIs para:", currentUser.role);

    const kpiCards = document.querySelectorAll('#kpiContainer .kpi-card');
    if (kpiCards.length < 4) {
        console.warn("KPI cards não encontrados ou insuficientes.");
        return;
    }

    const kpi1 = {
        title: kpiCards[0].querySelector('.kpi-title'),
        value: kpiCards[0].querySelector('.kpi-value')
    };
    const kpi2 = {
        title: kpiCards[1].querySelector('.kpi-title'),
        value: kpiCards[1].querySelector('.kpi-value')
    };
    const kpi3 = {
        title: kpiCards[2].querySelector('.kpi-title'),
        value: kpiCards[2].querySelector('.kpi-value')
    };
    const kpi4 = {
        title: kpiCards[3].querySelector('.kpi-title'),
        value: kpiCards[3].querySelector('.kpi-value')
    };

    if (!kpi1.title || !kpi1.value || !kpi2.title || !kpi2.value || !kpi3.title || !kpi3.value || !kpi4.title || !kpi4.value) {
        console.error("Um ou mais elementos de KPI (título/valor) não foram encontrados.");
        return;
    }

    switch (currentUser.role) {
        case 'Vendedor':
            updateVendorKPIs(kpi1, kpi2, kpi3, kpi4, salesStats, allProducts);
            break;
        case 'Controlador de Estoque':
            updateStockKPIs(kpi1, kpi2, kpi3, kpi4, productStats);
            break;
        case 'Dono/Gerente':
            updateManagerKPIs(kpi1, kpi2, kpi3, kpi4, salesStats, productStats);
            break;
        default:
            console.warn(`KPIs não definidos para o cargo: ${currentUser.role}`);
            kpi1.title.textContent = "Informação"; kpi1.value.textContent = "N/A";
            kpi2.title.textContent = "Informação"; kpi2.value.textContent = "N/A";
            kpi3.title.textContent = "Informação"; kpi3.value.textContent = "N/A";
            kpi4.title.textContent = "Ação"; kpi4.value.innerHTML = `<button class="btn-secondary" disabled>Indisponível</button>`;
            break;
    }
}

function updateVendorKPIs(kpi1, kpi2, kpi3, kpi4, salesStats, allProducts) {
    kpi1.title.textContent = "Minhas Vendas Hoje";
    kpi1.value.textContent = formatCurrency(salesStats?.todayRevenue || 0);

    kpi2.title.textContent = "Nº Minhas Vendas Hoje";
    kpi2.value.textContent = salesStats?.todaySales || 0;

    kpi3.title.textContent = "Produtos Disponíveis";
    kpi3.value.textContent = allProducts?.length || 0;

    kpi4.title.textContent = "Nova Venda";
    if (!kpi4.value.querySelector('#newSaleButton')) {
        kpi4.value.innerHTML = `<button class="btn-primary" id="newSaleButton">Registrar</button>`;
        setupKPIActionButton('newSaleButton', 'registrar-venda');
    }
}

function updateStockKPIs(kpi1, kpi2, kpi3, kpi4, productStats) {
    kpi1.title.textContent = "Total Produtos";
    kpi1.value.textContent = productStats?.totalProducts || 0;

    kpi2.title.textContent = "Estoque Baixo";
    kpi2.value.textContent = productStats?.lowStock || 0;

    kpi3.title.textContent = "Categorias";
    kpi3.value.textContent = productStats?.categories ? Object.keys(productStats.categories).length : 0;

    kpi4.title.textContent = "Adicionar Produto";
    if (!kpi4.value.querySelector('#addProductFromKPIButton')) {
        kpi4.value.innerHTML = `<button class="btn-primary" id="addProductFromKPIButton">Adicionar</button>`;
        setupKPIActionButton('addProductFromKPIButton', null, openProductModal);
    }
}

function updateManagerKPIs(kpi1, kpi2, kpi3, kpi4, salesStats, productStats) {
    kpi1.title.textContent = "Receita Total (Mês)";
    kpi1.value.textContent = formatCurrency(salesStats?.monthRevenue || 0);

    kpi2.title.textContent = "Total Vendas (Mês)";
    kpi2.value.textContent = salesStats?.monthSales || 0;

    kpi3.title.textContent = "Total Produtos";
    kpi3.value.textContent = productStats?.totalProducts || 0;

    kpi4.title.textContent = "Ver Vendas";
    if (!kpi4.value.querySelector('#viewReportsButton')) {
        kpi4.value.innerHTML = `<button class="btn-primary" id="viewReportsButton">Ver</button>`;
        setupKPIActionButton('viewReportsButton', 'vendas');
    }
}

function setupKPIActionButton(buttonId, targetSection, customAction = null) {
    setTimeout(() => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                if (customAction) {
                    customAction();
                } else if (targetSection) {
                    window.location.hash = '#' + targetSection;
                }
            });
        } else {
            console.warn(`Botão de KPI com ID "${buttonId}" não encontrado.`);
        }
    }, 0);
}

function renderDashboardMainCharts(salesStats, topProductsData) {
    if (typeof Chart === 'undefined') {
        console.warn("⚠️ Chart.js não disponível. Gráficos não serão renderizados.");
        return;
    }
    console.log("📈 Renderizando gráficos principais (Dono/Gerente)");
    renderSalesChart(salesStats);
    renderProductsChart(topProductsData);
}

function renderVendorCharts(salesStats, topProductsData) {
    if (typeof Chart === 'undefined') {
        console.warn("⚠️ Chart.js não disponível. Gráficos do vendedor não serão renderizados.");
        return;
    }
    console.log("📈 Renderizando gráficos do vendedor");
    renderVendorSalesChart(salesStats);
    renderVendorProductsChart(topProductsData);
}

function renderStockControllerCharts(productStats) {
    if (typeof Chart === 'undefined') {
        console.warn("⚠️ Chart.js não disponível. Gráficos do controlador de estoque não serão renderizados.");
        return;
    }
    console.log("📈 Renderizando gráficos do controlador de estoque");

    // Gráfico de Produtos por Categoria
    const categoriesCtx = document.getElementById('categoriesChart');
    if (categoriesCtx && productStats && productStats.categories) {
        if (window.categoriesChartInstance) window.categoriesChartInstance.destroy();
        const categoryLabels = Object.keys(productStats.categories);
        const categoryData = Object.values(productStats.categories);
        window.categoriesChartInstance = new Chart(categoriesCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Produtos por Categoria',
                    data: categoryData,
                    backgroundColor: generateDynamicColors(categoryLabels.length),
                }]
            },
            options: chartDefaultOptions('Produtos por Categoria')
        });
    }

    // Gráfico de Status do Estoque
    const stockCtx = document.getElementById('stockChart');
    if (stockCtx && productStats) {
        if (window.stockChartInstance) window.stockChartInstance.destroy();
        const stockLabels = ['Em Estoque', 'Estoque Baixo', 'Sem Estoque'];
        const stockData = [
            (productStats.totalProducts || 0) - (productStats.lowStock || 0) - (productStats.outOfStock || 0),
            productStats.lowStock || 0,
            productStats.outOfStock || 0
        ];
        window.stockChartInstance = new Chart(stockCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: stockLabels,
                datasets: [{
                    label: 'Status do Estoque',
                    data: stockData,
                    backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                }]
            },
            options: chartDefaultOptions('Status do Estoque')
        });
    }
}

// Opções padrão para gráficos Chart.js
const chartDefaultOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: { color: 'rgba(241, 245, 249, 0.8)' }
        },
        title: {
            display: false,
            text: title,
            color: 'rgba(241, 245, 249, 0.9)'
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: {
                color: 'rgba(241, 245, 249, 0.8)',
                callback: function(value) {
                    if (title && title.toLowerCase().includes('vendas') || title.toLowerCase().includes('receita')) {
                        return formatCurrency(value);
                    }
                    return value;
                }
            }
        },
        x: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: { color: 'rgba(241, 245, 249, 0.8)' }
        }
    }
});

function generateDynamicColors(count) {
    const colors = [];
    const baseColors = [
        'rgba(56, 189, 248, 0.8)', 'rgba(99, 102, 241, 0.8)', 'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)', 'rgba(22, 163, 74, 0.8)'
    ];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
}

function renderVendorSalesChart(salesStats) {
    const vendorCtx = document.getElementById('vendorSalesChart');
    if (!vendorCtx || typeof Chart === 'undefined') return;

    if (window.vendorSalesChartInstance) {
        window.vendorSalesChartInstance.destroy();
    }

    window.vendorSalesChartInstance = new Chart(vendorCtx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: ['Hoje', 'Esta Semana', 'Este Mês'],
            datasets: [{
                label: 'Minhas Vendas (R$)',
                data: [
                    salesStats?.todayRevenue || 0,
                    salesStats?.weekRevenue || 0,
                    salesStats?.monthRevenue || 0
                ],
                backgroundColor: generateDynamicColors(3),
                borderColor: generateDynamicColors(3).map(c => c.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: chartDefaultOptions('Minhas Vendas por Período')
    });
}

function renderVendorProductsChart(topProductsData) {
    const vendorProductsCtx = document.getElementById('vendorProductsChart');
    if (!vendorProductsCtx || typeof Chart === 'undefined') return;

    if (window.vendorProductsChartInstance) {
        window.vendorProductsChartInstance.destroy();
    }

    const hasData = topProductsData && topProductsData.length > 0;
    const labels = hasData ? topProductsData.map(p => p.name) : ['Sem dados'];
    const data = hasData ? topProductsData.map(p => p.count) : [1];

    window.vendorProductsChartInstance = new Chart(vendorProductsCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade Vendida',
                data: data,
                backgroundColor: hasData ? generateDynamicColors(labels.length) : ['rgba(107, 114, 128, 0.5)'],
                borderColor: hasData ? generateDynamicColors(labels.length).map(c => c.replace('0.8', '1')) : ['rgba(107, 114, 128, 1)'],
                borderWidth: 1
            }]
        },
        options: chartDefaultOptions('Meus Produtos Mais Vendidos')
    });
}

function renderSalesChart(salesStats) {
    const salesCtx = document.getElementById('salesChart');
    if (!salesCtx || typeof Chart === 'undefined') return;

    if (window.salesChartInstance) {
        window.salesChartInstance.destroy();
    }

    const labels = ['Hoje', 'Esta Semana', 'Este Mês'];
    const data = [
        salesStats?.todayRevenue || 0,
        salesStats?.weekRevenue || 0,
        salesStats?.monthRevenue || 0
    ];

    window.salesChartInstance = new Chart(salesCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Vendas (R$)',
                data: data,
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                borderColor: 'rgba(56, 189, 248, 1)',
                borderWidth: 2,
                tension: 0.4,
                pointBackgroundColor: 'rgba(56, 189, 248, 1)',
                pointBorderColor: 'rgba(255, 255, 255, 1)',
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: chartDefaultOptions('Vendas por Período')
    });
}

function renderProductsChart(topProductsData) {
    const productsCtx = document.getElementById('productsChart');
    if (!productsCtx || typeof Chart === 'undefined') return;

    if (window.productsChartInstance) {
        window.productsChartInstance.destroy();
    }

    const hasData = topProductsData && topProductsData.length > 0;
    const labels = hasData ? topProductsData.map(p => p.name) : ['Sem dados'];
    const data = hasData ? topProductsData.map(p => p.count) : [1];

    window.productsChartInstance = new Chart(productsCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quantidade Vendida',
                data: data,
                backgroundColor: hasData ? generateDynamicColors(labels.length) : ['rgba(107, 114, 128, 0.5)'],
                borderColor: hasData ? generateDynamicColors(labels.length).map(c => c.replace('0.8', '1')) : ['rgba(107, 114, 128, 1)'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: 'rgba(241, 245, 249, 0.8)', padding: 15, font: { size: 11 } }
                },
                title: { display: false, text: 'Produtos Mais Vendidos', color: 'rgba(241, 245, 249, 0.9)' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            return `${context.label}: ${label} ${context.parsed}`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function updateRecentActivitiesUI(sales) {
    const activitiesContainer = document.getElementById('recentActivitiesContainer');
    if (!activitiesContainer) return;

    activitiesContainer.innerHTML = '';

    if (!sales || sales.length === 0) {
        activitiesContainer.innerHTML = `
            <li class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-info-circle"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-text text-slate-400">Nenhuma atividade recente.</div>
                </div>
            </li>
        `;
        return;
    }

    sales.forEach(sale => {
        const activityItem = document.createElement('li');
        activityItem.className = 'activity-item';

        const productNames = sale.productsDetail && Array.isArray(sale.productsDetail) && sale.productsDetail.length > 0
            ? sale.productsDetail.map(p => p.name || 'Produto').slice(0, 2).join(', ') +
              (sale.productsDetail.length > 2 ? '...' : '')
            : 'Detalhes indisponíveis';

        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas fa-receipt"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">
                    Venda: ${productNames} - ${formatCurrency(sale.total)}
                </div>
                <div class="activity-time">
                    ${formatDate(sale.date)} ${sale.sellerName ? 'por ' + sale.sellerName : ''}
                </div>
            </div>
        `;

        activitiesContainer.appendChild(activityItem);
    });
}

// === INTERFACE GERAL ===

function updateUserInfo(user) {
    if (!user) return;

    console.log("👤 Atualizando informações do usuário");

    let initials = 'U';
    if (user.name) {
        initials = user.name.split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2);
    } else if (user.email) {
        initials = user.email.substring(0, 2).toUpperCase();
    }

    const updates = {
        userInitials: initials,
        userDropdownInitials: initials,
        usernameDisplay: user.name || user.email?.split('@')[0] || 'Usuário',
        userRoleDisplay: user.role || 'Usuário',
        userDropdownName: user.name || user.email?.split('@')[0] || 'Usuário',
        userDropdownEmail: user.email || 'N/A'
    };

    Object.entries(updates).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });

    const roleDisplayNames = {
        'Dono/Gerente': 'Painel Gerencial',
        'Controlador de Estoque': 'Painel de Estoque',
        'Vendedor': 'Painel de Vendas'
    };

    const pageTitle = roleDisplayNames[user.role] || 'Painel';

    const pageTitleEl = document.getElementById('pageTitle');
    const sidebarProfileName = document.getElementById('sidebarProfileName');

    if (pageTitleEl) pageTitleEl.textContent = pageTitle;
    if (sidebarProfileName) sidebarProfileName.textContent = pageTitle;
}

function clearDashboardUI() {
    console.log("🧹 Limpando interface do dashboard");

    const elements = {
        userInitials: 'U',
        userDropdownInitials: 'U',
        usernameDisplay: 'Usuário',
        userRoleDisplay: 'Cargo',
        userDropdownName: 'Usuário',
        userDropdownEmail: 'usuario@exemplo.com',
        pageTitle: 'EliteControl',
        sidebarProfileName: 'Painel'
    };

    Object.entries(elements).forEach(([id, defaultValue]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = defaultValue;
    });

    const navLinks = document.getElementById('navLinks');
    if (navLinks) navLinks.innerHTML = '';

    const chartInstances = [
        'salesChartInstance',
        'productsChartInstance',
        'vendorSalesChartInstance',
        'vendorProductsChartInstance',
        'categoriesChartInstance',
        'stockChartInstance'
    ];

    chartInstances.forEach(instanceName => {
        if (window[instanceName]) {
            window[instanceName].destroy();
            window[instanceName] = null;
        }
    });

    const kpiCards = document.querySelectorAll('#kpiContainer .kpi-card');
    kpiCards.forEach((card, index) => {
        const valueEl = card.querySelector('.kpi-value');
        const titleEl = card.querySelector('.kpi-title');

        if (valueEl && !valueEl.querySelector('button')) {
            valueEl.textContent = '0';
        }

        if (titleEl) {
            const titles = ['Vendas', 'Transações', 'Produtos', 'Ações'];
            titleEl.textContent = titles[index] || 'N/A';
        }
    });

    const activitiesContainer = document.getElementById('recentActivitiesContainer');
    if (activitiesContainer) {
        activitiesContainer.innerHTML = `
            <li class="activity-item">
                <div class="activity-content">
                    <div class="activity-text text-slate-400">Nenhuma atividade.</div>
                </div>
            </li>
        `;
    }

    sessionStorage.removeItem('welcomeAlertShown');
}

// === SIDEBAR E NOTIFICAÇÕES ===

function initializeSidebar(role) {
    const navLinksContainer = document.getElementById('navLinks');
    if (!navLinksContainer || !role) return;

    console.log("🗂️ Inicializando sidebar para:", role);

    const currentHash = window.location.hash.substring(1);
    const defaultSection = getDefaultSection(role);

    const isActive = (section) => currentHash ? currentHash === section : section === defaultSection;

    let links = [];

    switch (role) {
        case 'Dono/Gerente':
            links = [
                { icon: 'fa-chart-pie', text: 'Painel Geral', section: 'geral' },
                { icon: 'fa-boxes-stacked', text: 'Produtos', section: 'produtos' },
                { icon: 'fa-cash-register', text: 'Registrar Venda', section: 'registrar-venda' },
                { icon: 'fa-file-invoice-dollar', text: 'Vendas', section: 'vendas' },
                { icon: 'fa-users', text: 'Clientes', section: 'clientes' },
                { icon: 'fa-users-cog', text: 'Usuários', section: 'usuarios' },
                { icon: 'fa-cogs', text: 'Configurações', section: 'config' }
            ];
            break;

        case 'Controlador de Estoque':
            links = [
                { icon: 'fa-warehouse', text: 'Painel Estoque', section: 'estoque' },
                { icon: 'fa-boxes-stacked', text: 'Produtos', section: 'produtos' },
                { icon: 'fa-truck-loading', text: 'Fornecedores', section: 'fornecedores' },
                { icon: 'fa-exchange-alt', text: 'Movimentações', section: 'movimentacoes' },
                { icon: 'fa-clipboard-list', text: 'Relatórios', section: 'relatorios-estoque' },
                { icon: 'fa-cogs', text: 'Configurações', section: 'config' }
            ];
            break;

        case 'Vendedor':
            links = [
                { icon: 'fa-dollar-sign', text: 'Painel Vendas', section: 'vendas-painel' },
                { icon: 'fa-search', text: 'Consultar Produtos', section: 'produtos-consulta' },
                { icon: 'fa-cash-register', text: 'Registrar Venda', section: 'registrar-venda' },
                { icon: 'fa-history', text: 'Minhas Vendas', section: 'minhas-vendas' },
                { icon: 'fa-users', text: 'Clientes', section: 'clientes' },
                { icon: 'fa-cogs', text: 'Configurações', section: 'config' }
            ];
            break;

        default:
            links = [
                { icon: 'fa-tachometer-alt', text: 'Painel', section: 'geral' },
                { icon: 'fa-cog', text: 'Configurações', section: 'config' }
            ];
            console.warn(`⚠️ Papel não reconhecido: ${role}`);
    }

    navLinksContainer.innerHTML = links.map(link => `
        <a href="#${link.section}"
           class="nav-link ${isActive(link.section) ? 'active' : ''}"
           data-section="${link.section}">
            <i class="fas ${link.icon} nav-link-icon"></i>
            <span>${link.text}</span>
        </a>
    `).join('');
}

function updateSidebarActiveState(currentSection) {
    document.querySelectorAll('#navLinks a.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`#navLinks a.nav-link[data-section="${currentSection}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function initializeNotifications() {
    if (!document.getElementById('notificationCountBadge')) return;

    let notifications = JSON.parse(localStorage.getItem('elitecontrol_notifications') || '[]');

    if (notifications.length === 0) {
        notifications = [
            {
                id: 'welcome',
                title: 'Bem-vindo!',
                message: 'EliteControl v2.0 com IA está pronto para uso.',
                time: 'Agora',
                read: false,
                type: 'success'
            },
            {
                id: 'tip',
                title: 'Nova Funcionalidade',
                message: 'Sistema CRM com IA para gestão de clientes.',
                time: '1h atrás',
                read: false,
                type: 'info'
            }
        ];
        localStorage.setItem('elitecontrol_notifications', JSON.stringify(notifications));
    }

    updateNotificationsUI();
}

function updateNotificationsUI() {
    const notificationList = document.getElementById('notificationList');
    const notificationBadge = document.getElementById('notificationCountBadge');

    if (!notificationList || !notificationBadge) return;

    const notifications = JSON.parse(localStorage.getItem('elitecontrol_notifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;

    notificationBadge.textContent = unreadCount;
    notificationBadge.classList.toggle('hidden', unreadCount === 0);

    if (notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="p-4 text-center text-slate-400">
                <i class="fas fa-bell-slash mb-2"></i>
                <p>Nenhuma notificação.</p>
            </div>
        `;
        return;
    }

    notificationList.innerHTML = notifications.map(notification => {
        const typeIcons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            warning: 'fa-exclamation-triangle',
            error: 'fa-times-circle'
        };

        return `
            <div class="notification-item ${notification.read ? '' : 'unread'}"
                 data-id="${notification.id}">
                <div class="notification-item-header">
                    <div class="notification-item-title">${notification.title}</div>
                    <div class="notification-item-badge ${notification.type}">
                        <i class="fas ${typeIcons[notification.type] || 'fa-info-circle'}"></i>
                    </div>
                </div>
                <div class="notification-item-message">${notification.message}</div>
                <div class="notification-item-footer">
                    <div class="notification-item-time">${notification.time}</div>
                    ${!notification.read ? '<div class="notification-item-action">Marcar como lida</div>' : ''}
                </div>
            </div>
        `;
    }).join('');

    notificationList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            markNotificationAsRead(id);
        });
    });
}

function markNotificationAsRead(id) {
    let notifications = JSON.parse(localStorage.getItem('elitecontrol_notifications') || '[]');
    notifications = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem('elitecontrol_notifications', JSON.stringify(notifications));
    updateNotificationsUI();
}

function markAllNotificationsAsRead() {
    let notifications = JSON.parse(localStorage.getItem('elitecontrol_notifications') || '[]');
    notifications = notifications.map(n => ({ ...n, read: true }));
    localStorage.setItem('elitecontrol_notifications', JSON.stringify(notifications));
    updateNotificationsUI();

    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

// === FUNÇÕES UTILITÁRIAS ===

function showTemporaryAlert(message, type = 'info', duration = 4000) {
    const container = document.getElementById('temporaryAlertsContainer');
    if (!container) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `temporary-alert temporary-alert-${type}`;

    const icons = {
        info: 'fa-info-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        error: 'fa-times-circle'
    };

    alertDiv.innerHTML = `
        <div class="temporary-alert-content">
            <i class="fas ${icons[type] || icons.info} temporary-alert-icon"></i>
            <span class="temporary-alert-message">${message}</span>
        </div>
        <button class="temporary-alert-close" onclick="this.parentElement.remove()">
            &times;
        </button>
    `;

    container.appendChild(alertDiv);

    setTimeout(() => alertDiv.classList.add('show'), 10);

    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 300);
    }, duration);
}

function showCustomConfirm(message, onConfirm) {
    const existingModal = document.getElementById('customConfirmModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalBackdrop = document.createElement('div');
    modalBackdrop.id = 'customConfirmModal';
    modalBackdrop.className = 'modal-backdrop show';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content show';
    modalContent.style.maxWidth = '400px';

    modalContent.innerHTML = `
        <div class="modal-header">
            <i class="fas fa-exclamation-triangle modal-icon warning"></i>
            <h3 class="modal-title">Confirmação</h3>
        </div>
        <div class="modal-body">
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
        <div class="modal-footer">
            <button class="btn-secondary py-2 px-4 rounded-md hover:bg-slate-600" id="cancelConfirm">
                Cancelar
            </button>
            <button class="btn-primary py-2 px-4 rounded-md bg-red-600 hover:bg-red-700" id="confirmAction">
                Confirmar
            </button>
        </div>
    `;

    modalBackdrop.appendChild(modalContent);
    document.body.appendChild(modalBackdrop);

    document.getElementById('cancelConfirm').onclick = () => modalBackdrop.remove();
    document.getElementById('confirmAction').onclick = () => {
        onConfirm();
        modalBackdrop.remove();
    };

    const handleKeydown = (e) => {
        if (e.key === 'Escape') {
            modalBackdrop.remove();
            document.removeEventListener('keydown', handleKeydown);
        }
    };
    document.addEventListener('keydown', handleKeydown);
}

function showLoginError(message) {
    const errorElement = document.getElementById('loginErrorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.toggle('hidden', !message);
    }
}

function formatCurrency(value) {
    if (typeof value !== 'number' || isNaN(value)) {
        value = 0;
    }
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateInput) {
    let date;

    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
    } else {
        return "Data inválida";
    }

    if (isNaN(date.getTime())) {
        return "Data inválida";
    }

    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

function formatDateTime(dateInput) {
    let date;

    if (dateInput instanceof Date) {
        date = dateInput;
    } else if (dateInput && typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
    } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
        date = new Date(dateInput);
    } else {
        return "Data/hora inválida";
    }

    if (isNaN(date.getTime())) {
        return "Data/hora inválida";
    }

    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(date);
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + '...';
}

async function reloadProductsIfNeeded() {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        const userRole = localStorage.getItem('elitecontrol_user_role');
        const currentSection = window.location.hash.substring(1);
        const productSectionForRole = (userRole === 'Vendedor' ? 'produtos-consulta' : 'produtos');

        if (currentSection === productSectionForRole || currentSection === 'produtos' || currentSection === 'produtos-consulta') {
            console.log(`Recarregando seção de produtos "${currentSection}" após modificação.`);
            await loadSectionContent(currentSection, {
                uid: currentUser.uid,
                email: currentUser.email,
                role: userRole
            });
        }
    }
}

function showSaleSuccessModal(sale) {
    const total = sale.productsDetail.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const modalHtml = `
        <div class="modal-backdrop show" id="saleSuccessModal">
            <div class="modal-content show" style="max-width: 500px;">
                <div class="modal-header">
                    <i class="fas fa-check-circle text-green-500 text-2xl mr-3"></i>
                    <h3 class="modal-title">Venda Realizada com Sucesso!</h3>
                </div>

                <div class="modal-body">
                    <div class="success-details">
                        <div class="detail-row">
                            <span class="detail-label">Total da Venda:</span>
                            <span class="detail-value text-green-500 font-bold text-xl">${formatCurrency(total)}</span>
                        </div>

                        ${sale.customerName ? `
                            <div class="detail-row">
                                <span class="detail-label">Cliente:</span>
                                <span class="detail-value">${sale.customerName}</span>
                            </div>
                        ` : ''}

                        <div class="detail-row">
                            <span class="detail-label">Data:</span>
                            <span class="detail-value">${formatDate(new Date())}</span>
                        </div>

                        <div class="detail-row">
                            <span class="detail-label">Produtos:</span>
                            <span class="detail-value">${sale.productsDetail.length} item(s)</span>
                        </div>

                        <div class="products-sold">
                            <h4 class="text-sm font-semibold text-slate-300 mb-2">Itens Vendidos:</h4>
                            <div class="sold-items">
                                ${sale.productsDetail.map(item => `
                                    <div class="sold-item">
                                        <span>${item.name}</span>
                                        <span>${item.quantity}x ${formatCurrency(item.unitPrice)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeSaleSuccessModal(); window.print();">
                        <i class="fas fa-print mr-2"></i>
                        Imprimir
                    </button>
                    <button class="btn-primary" onclick="closeSaleSuccessModal()">
                        <i class="fas fa-thumbs-up mr-2"></i>
                        Perfeito!
                    </button>
                </div>
            </div>
        </div>
    `;

    if (!document.getElementById('saleSuccessStyles')) {
        const style = document.createElement('style');
        style.id = 'saleSuccessStyles';
        style.textContent = `
            .success-details {
                background: rgba(16, 185, 129, 0.1);
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 0.5rem;
                padding: 1rem;
                margin-bottom: 1rem;
            }

            .detail-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 0.5rem;
            }

            .detail-label {
                color: #94A3B8;
                font-size: 0.875rem;
            }

            .detail-value {
                color: #F1F5F9;
                font-weight: 500;
            }

            .products-sold {
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(51, 65, 85, 0.5);
            }

            .sold-item {
                display: flex;
                justify-content: space-between;
                padding: 0.25rem 0;
                font-size: 0.875rem;
                color: #94A3B8;
            }
        `;
        document.head.appendChild(style);
    }

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// === FUNÇÕES GLOBAIS ===
window.toggleProductSelection = toggleProductSelection;
window.changeQuantity = changeQuantity;
window.updateQuantity = updateQuantity;
window.removeCartItem = removeCartItem;
window.clearCart = clearCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.closeSaleSuccessModal = closeSaleSuccessModal;
window.handleEditProduct = handleEditProduct;
window.handleDeleteProductConfirmation = handleDeleteProductConfirmation;
window.openProductModal = openProductModal;
window.selectCustomer = selectCustomer;
window.saveNewCustomer = saveNewCustomer;

// Log de inicialização
console.log("✅ EliteControl v2.0 com IA e CRM carregado com sucesso!");
console.log("🚀 Novos recursos disponíveis:");
console.log("   - Sistema CRM com gestão de clientes");
console.log("   - Pesquisa avançada de produtos");
console.log("   - Dashboard personalizado por perfil");
console.log("   - Integração de vendas com clientes");
console.log("   - Interface responsiva e moderna");
