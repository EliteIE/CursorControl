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

    container.innerHTML = `
        <div class="products-list">
            ${products.map(product => `
                <div class="product-item">
                    <div class="product-info">
                        <div class="product-name-price">
                            <span class="product-name">${product.name}</span>
                            <span class="product-price">R$ ${product.price.toFixed(2)}</span>
                        </div>
                        <div class="product-details">
                            <span class="product-category">${product.category}</span>
                            <span class="product-stock">${product.stock} em estoque</span>
                        </div>
                    </div>
                    <div class="product-actions">
                        <div class="quantity-controls">
                            <button onclick="changeQuantity('${product.id}', -1)" class="quantity-btn">-</button>
                            <input type="number" 
                                   id="quantity-${product.id}"
                                   value="1"
                                   min="1"
                                   max="${product.stock}"
                                   onchange="updateQuantity('${product.id}')"
                                   class="quantity-input">
                            <button onclick="changeQuantity('${product.id}', 1)" class="quantity-btn">+</button>
                        </div>
                        <button onclick="toggleProductSelection('${product.id}')" class="add-to-cart-btn">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                    </div>
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
        existingItem.quantity = quantity;
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
    showTemporaryAlert('Produto adicionado ao carrinho', 'success');
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
    updateSaleInterface();
    showTemporaryAlert('Item removido do carrinho', 'info', 2000);
}

function clearCart() {
    EliteControl.state.saleCart = [];
    updateSaleInterface();
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

    button.disabled = EliteControl.state.saleCart.length === 0;
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
                    <div class="customer-search-container flex-1">
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

            <div class="products-section">
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
                    </div>
                </div>

                <div id="availableProductsList" class="products-grid"></div>
            </div>

            <div class="cart-section mt-6">
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

function renderCustomerSuggestions(suggestions) {
    const container = document.getElementById('customerSuggestions');
    if (!container) return;

    if (!suggestions || suggestions.length === 0) {
        container.innerHTML = `
            <div class="customer-suggestion-item">
                <div class="text-slate-400 text-sm">Nenhum cliente encontrado</div>
            </div>
        `;
        container.classList.remove('hidden');
        return;
    }

    container.innerHTML = suggestions.map(customer => `
        <div class="customer-suggestion-item" onclick="selectCustomer('${customer.id}')">
            <div class="customer-suggestion-name">
                ${customer.name}
                ${customer.totalPurchases > 0 ? 
                    `<span class="text-sky-400 text-xs">${customer.totalPurchases} compras</span>` : ''}
            </div>
            <div class="customer-suggestion-info">
                ${customer.phone ? 
                    `<span><i class="fas fa-phone text-slate-500 mr-1"></i>${customer.phone}</span>` : ''}
                ${customer.email ? 
                    `<span><i class="fas fa-envelope text-slate-500 mr-1"></i>${customer.email}</span>` : ''}
            </div>
        </div>
    `).join('');

    container.classList.remove('hidden');
}

function addCustomerStyles() {
    if (!document.getElementById('customerStyles')) {
        const style = document.createElement('style');
        style.id = 'customerStyles';
        style.textContent = `
            .customer-selection-card {
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%);
                border-radius: 0.75rem;
                padding: 1.5rem;
                border: 1px solid rgba(51, 65, 85, 0.5);
                backdrop-filter: blur(10px);
            }

            .customer-suggestions {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(30, 41, 59, 0.95);
                border: 1px solid rgba(51, 65, 85, 0.5);
                border-radius: 0.5rem;
                margin-top: 0.5rem;
                max-height: 300px;
                overflow-y: auto;
                z-index: 50;
                backdrop-filter: blur(10px);
            }

            .customer-suggestion-item {
                padding: 0.75rem 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
                border-bottom: 1px solid rgba(51, 65, 85, 0.3);
            }

            .customer-suggestion-item:hover {
                background: rgba(56, 189, 248, 0.1);
                border-left: 3px solid #38BDF8;
            }

            .customer-suggestion-item:last-child {
                border-bottom: none;
            }

            .customer-suggestion-name {
                font-weight: 500;
                color: #F1F5F9;
                margin-bottom: 0.25rem;
            }

            .customer-suggestion-info {
                font-size: 0.75rem;
                color: #94A3B8;
            }

            .selected-customer-info {
                margin-top: 1rem;
            }

            .customer-card {
                background: rgba(56, 189, 248, 0.1);
                border: 1px solid rgba(56, 189, 248, 0.3);
                border-radius: 0.5rem;
                padding: 1rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .customer-modal {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, 0.75);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                padding: 1rem;
                backdrop-filter: blur(5px);
            }

            .customer-modal-content {
                background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%);
                border-radius: 1rem;
                border: 1px solid rgba(51, 65, 85, 0.5);
                width: 100%;
                max-width: 500px;
                max-height: 90vh;
                overflow-y: auto;
            }
        `;
        document.head.appendChild(style);
    }
}

async function initializeSaleFormWithCRM(currentUser) {
    console.log("🛒 Inicializando formulário de venda com CRM");

    try {
        // Carregar produtos disponíveis
        const products = await DataService.getProducts();
        console.log("📦 Produtos carregados:", products.length);
        
        // Atualizar estado global
        EliteControl.state = EliteControl.state || {};
        EliteControl.state.availableProducts = products;
        EliteControl.state.saleCart = EliteControl.state.saleCart || [];
        
        // Renderizar produtos
        renderAvailableProducts(products);

        // Configurar event listeners
        setupSaleFormWithCRMEventListeners(currentUser);

        // Atualizar hora atual
        updateCurrentTime();
        setInterval(updateCurrentTime, 60000);

        console.log("✅ Formulário de venda com CRM inicializado");

    } catch (error) {
        console.error("❌ Erro ao inicializar formulário de venda:", error);
        showTemporaryAlert("Erro ao carregar dados. Tente novamente.", "error");
    }
}

function setupSaleFormWithCRMEventListeners(currentUser) {
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

    // Busca de clientes melhorada
    const customerSearchInput = document.getElementById('customerSearchInput');
    if (customerSearchInput) {
        let searchTimeout;
        customerSearchInput.addEventListener('input', async (e) => {
            clearTimeout(searchTimeout);
            const searchTerm = e.target.value.trim();
            const suggestionsContainer = document.getElementById('customerSuggestions');

            // Limpar sugestões se o campo estiver vazio
            if (!searchTerm) {
                if (suggestionsContainer) {
                    suggestionsContainer.classList.add('hidden');
                    suggestionsContainer.innerHTML = '';
                }
                return;
            }

            // Buscar sugestões após um pequeno delay
            searchTimeout = setTimeout(async () => {
                if (typeof CRMService !== 'undefined' && typeof CRMService.searchCustomers === 'function') {
                    try {
                        const suggestions = await CRMService.searchCustomers(searchTerm);
                        
                        if (suggestionsContainer) {
                            if (suggestions && suggestions.length > 0) {
                                suggestionsContainer.innerHTML = suggestions.map(customer => `
                                    <div class="customer-suggestion-item" onclick="selectCustomer('${customer.id}')">
                                        <div class="customer-suggestion-name">
                                            ${customer.name}
                                            ${customer.totalPurchases > 0 ? 
                                                `<span class="text-sky-400 text-xs ml-2">${customer.totalPurchases} compras</span>` : 
                                                '<span class="text-slate-500 text-xs ml-2">Novo cliente</span>'}
                                        </div>
                                        <div class="customer-suggestion-info">
                                            ${customer.phone ? `<span class="mr-3"><i class="fas fa-phone-alt mr-1"></i>${customer.phone}</span>` : ''}
                                            ${customer.email ? `<span><i class="fas fa-envelope mr-1"></i>${customer.email}</span>` : ''}
                                        </div>
                                    </div>
                                `).join('');
                                suggestionsContainer.classList.remove('hidden');
                            } else {
                                suggestionsContainer.innerHTML = `
                                    <div class="p-4 text-center text-slate-400">
                                        <p>Nenhum cliente encontrado</p>
                                        <button class="btn-secondary btn-sm mt-2" onclick="showNewCustomerModal()">
                                            <i class="fas fa-user-plus mr-2"></i>Cadastrar Novo
                                        </button>
                                    </div>
                                `;
                                suggestionsContainer.classList.remove('hidden');
                            }
                        }
                    } catch (error) {
                        console.error("❌ Erro na busca de clientes:", error);
                        if (suggestionsContainer) {
                            suggestionsContainer.innerHTML = `
                                <div class="p-4 text-center text-red-400">
                                    <p>Erro ao buscar clientes</p>
                                    <p class="text-sm">Tente novamente</p>
                                </div>
                            `;
                            suggestionsContainer.classList.remove('hidden');
                        }
                    }
                }
            }, 200); // Reduzido para 200ms para resposta mais rápida
        });

        // Fechar sugestões ao clicar fora
        document.addEventListener('click', (e) => {
            const suggestionsContainer = document.getElementById('customerSuggestions');
            if (suggestionsContainer && !customerSearchInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
                suggestionsContainer.classList.add('hidden');
            }
        });
    }

    // Novo cliente
    const newCustomerButton = document.getElementById('newCustomerButton');
    if (newCustomerButton) {
        newCustomerButton.addEventListener('click', () => showNewCustomerModal());
    }

    // Remover cliente selecionado
    const removeCustomerButton = document.getElementById('removeCustomerButton');
    if (removeCustomerButton) {
        removeCustomerButton.addEventListener('click', () => {
            EliteControl.state.selectedCustomer = null;
            const custSearchInput = document.getElementById('customerSearchInput');
            if(custSearchInput) custSearchInput.value = '';
            const selectedCustInfo = document.getElementById('selectedCustomerInfo');
            if(selectedCustInfo) selectedCustInfo.classList.add('hidden');
            updateFinalizeSaleButton();
        });
    }

    // Limpar carrinho
    const clearCartButton = document.getElementById('clearCartButton');
    if (clearCartButton) {
        clearCartButton.addEventListener('click', clearCart);
    }

    // Cancelar venda
    const cancelButton = document.getElementById('cancelSaleButton');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            if (EliteControl.state.saleCart.length > 0 || EliteControl.state.selectedCustomer) {
                showCustomConfirm(
                    'Tem certeza que deseja cancelar esta venda? Todos os dados serão perdidos.',
                    () => {
                        clearCart();
                        EliteControl.state.selectedCustomer = null;
                        const custSearchInput = document.getElementById('customerSearchInput');
                        if(custSearchInput) custSearchInput.value = '';
                        const selectedCustInfo = document.getElementById('selectedCustomerInfo');
                        if(selectedCustInfo) selectedCustInfo.classList.add('hidden');
                        showTemporaryAlert('Venda cancelada', 'info');
                    }
                );
            } else {
                showTemporaryAlert('Nenhuma venda para cancelar', 'info');
            }
        });
    }

    // Finalizar venda
    const finalizeButton = document.getElementById('finalizeSaleButton');
    if (finalizeButton) {
        finalizeButton.addEventListener('click', () => finalizeSaleWithCustomer(currentUser));
    }
}

function renderCustomerSuggestions(suggestions) {
    const container = document.getElementById('customerSuggestions');
    if (!container) return;

    if (suggestions.length === 0) {
        container.innerHTML = `
            <div class="customer-suggestion-item">
                <div class="text-slate-400 text-sm">Nenhum cliente encontrado</div>
            </div>
        `;
    } else {
        container.innerHTML = suggestions.map(customer => `
            <div class="customer-suggestion-item" onclick="selectCustomer('${customer.id}')">
                <div class="customer-suggestion-name">${customer.name}</div>
                <div class="customer-suggestion-info">
                    ${customer.phone} ${customer.email ? '• ' + customer.email : ''}
                </div>
            </div>
        `).join('');
    }

    container.classList.remove('hidden');
}

async function selectCustomer(customerId) {
    try {
        const doc = await firebase.firestore().collection('customers').doc(customerId).get();
        if (!doc.exists) {
            showTemporaryAlert('Cliente não encontrado.', 'error');
            return;
        }

        const customer = { id: doc.id, ...doc.data() };
        EliteControl.state.selectedCustomer = customer;

        // Atualizar interface
        const selectedCustomerInfo = document.getElementById('selectedCustomerInfo');
        const customerName = document.getElementById('selectedCustomerName');
        const customerPhone = document.getElementById('selectedCustomerPhone');
        const customerStats = document.getElementById('selectedCustomerStats');

        customerName.textContent = customer.name;
        customerPhone.textContent = customer.phone || 'Sem telefone cadastrado';
        
        const stats = [];
        if (customer.totalPurchases) {
            stats.push(`${customer.totalPurchases} ${customer.totalPurchases === 1 ? 'compra' : 'compras'}`);
        }
        if (customer.totalSpent) {
            stats.push(`Total: ${formatCurrency(customer.totalSpent)}`);
        }
        if (customer.lastPurchaseDate) {
            const lastPurchase = new Date(customer.lastPurchaseDate.toDate());
            stats.push(`Última compra: ${lastPurchase.toLocaleDateString('pt-BR')}`);
        }
        
        customerStats.textContent = stats.join(' • ') || 'Primeiro atendimento';
        selectedCustomerInfo.classList.remove('hidden');

        // Limpar busca e esconder sugestões
        document.getElementById('customerSearchInput').value = customer.name;
        document.getElementById('customerSuggestions').classList.add('hidden');

        // Atualizar botão de finalizar venda
        updateFinalizeSaleButton();
    } catch (error) {
        console.error('Erro ao selecionar cliente:', error);
        showTemporaryAlert('Erro ao selecionar cliente. Tente novamente.', 'error');
    }
}

function showNewCustomerModal() {
    const modal = document.createElement('div');
    modal.className = 'customer-modal';
    modal.innerHTML = `
        <div class="customer-modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Novo Cliente</h3>
                <button class="modal-close" onclick="this.closest('.customer-modal').remove()">
                    &times;
                </button>
            </div>

            <form id="newCustomerForm" class="modal-body">
                <div class="form-group">
                    <label for="customerName" class="form-label">Nome *</label>
                    <input type="text"
                           id="customerName"
                           class="form-input"
                           placeholder="Nome completo"
                           required>
                </div>

                <div class="form-group">
                    <label for="customerPhone" class="form-label">Telefone *</label>
                    <input type="tel"
                           id="customerPhone"
                           class="form-input"
                           placeholder="(00) 00000-0000"
                           required>
                </div>

                <div class="form-group">
                    <label for="customerEmail" class="form-label">Email</label>
                    <input type="email"
                           id="customerEmail"
                           class="form-input"
                           placeholder="email@exemplo.com">
                </div>

                <div class="form-group">
                    <label for="customerCPF" class="form-label">CPF</label>
                    <input type="text"
                           id="customerCPF"
                           class="form-input"
                           placeholder="000.000.000-00">
                </div>

                <div class="form-group">
                    <label for="customerAddress" class="form-label">Endereço</label>
                    <textarea id="customerAddress"
                              class="form-input"
                              rows="2"
                              placeholder="Endereço completo"></textarea>
                </div>

                <div class="form-group">
                    <label for="customerBirthdate" class="form-label">Data de Nascimento</label>
                    <input type="date"
                           id="customerBirthdate"
                           class="form-input">
                </div>
            </form>

            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.customer-modal').remove()">
                    Cancelar
                </button>
                <button class="btn-primary" onclick="saveNewCustomer()">
                    <i class="fas fa-save mr-2"></i>
                    Salvar Cliente
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Focar no primeiro campo
    setTimeout(() => {
      const customerNameInput = document.getElementById('customerName');
      if (customerNameInput) customerNameInput.focus();
    }, 100);

    // Máscara de telefone
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.substring(0, 11);

            if (value.length > 6) {
                value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
            } else if (value.length > 2) {
                value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
            }

            e.target.value = value;
        });
    }

    // Máscara de CPF
    const cpfInput = document.getElementById('customerCPF');
    if (cpfInput) {
        cpfInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.substring(0, 11);

            if (value.length > 9) {
                value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6, 9)}-${value.substring(9)}`;
            } else if (value.length > 6) {
                value = `${value.substring(0, 3)}.${value.substring(3, 6)}.${value.substring(6)}`;
            } else if (value.length > 3) {
                value = `${value.substring(0, 3)}.${value.substring(3)}`;
            }

            e.target.value = value;
        });
    }
}

async function saveNewCustomer() {
    const form = document.getElementById('newCustomerForm');
    if (!form || !form.checkValidity()) {
        if(form) form.reportValidity();
        return;
    }

    const customerData = {
        name: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('customerPhone').value.replace(/\D/g, ''),
        email: document.getElementById('customerEmail').value.trim(),
        cpf: document.getElementById('customerCPF').value.replace(/\D/g, ''),
        address: document.getElementById('customerAddress').value.trim(),
        birthdate: document.getElementById('customerBirthdate').value
    };

    try {
        if (typeof CRMService === 'undefined' || typeof CRMService.createOrUpdateCustomer !== 'function') {
            console.warn("CRMService ou CRMService.createOrUpdateCustomer não está definido.");
            showTemporaryAlert("Erro: Serviço de cliente indisponível para salvar.", "error");
            return;
        }
        const newCustomer = await CRMService.createOrUpdateCustomer(customerData);

        // Selecionar o novo cliente
        await selectCustomer(newCustomer.id);

        // Fechar modal
        const customerModal = document.querySelector('.customer-modal');
        if (customerModal) customerModal.remove();

        showTemporaryAlert('Cliente cadastrado com sucesso!', 'success');

    } catch (error) {
        console.error("❌ Erro ao criar cliente:", error);
        showTemporaryAlert('Erro ao cadastrar cliente. Verifique os dados.', 'error');
    }
}

async function finalizeSaleWithCustomer(currentUser) {
    if (EliteControl.state.saleCart.length === 0) {
        showTemporaryAlert('Adicione produtos à venda primeiro', 'warning');
        return;
    }

    const finalizeButton = document.getElementById('finalizeSaleButton');
    if (!finalizeButton) return;
    const originalText = finalizeButton.textContent;

    // Desabilitar botão e mostrar loading
    finalizeButton.disabled = true;
    finalizeButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processando...';

    try {
        // Validar estoque
        for (const item of EliteControl.state.saleCart) {
            const currentProduct = await DataService.getProductById(item.productId);
            if (!currentProduct) {
                throw new Error(`Produto ${item.name} não encontrado`);
            }
            if (currentProduct.stock < item.quantity) {
                throw new Error(`Estoque insuficiente para ${item.name}. Disponível: ${currentProduct.stock}`);
            }
        }

        // Preparar dados da venda
        const saleData = {
            date: new Date().toISOString(),
            dateString: new Date().toISOString().split('T')[0]
        };

        const productsDetail = EliteControl.state.saleCart.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price
        }));

        const sellerName = currentUser.name || currentUser.email;

        // Registrar venda com cliente
        const newSale = await DataService.addSale(saleData, productsDetail, sellerName, EliteControl.state.selectedCustomer);

        // Limpar carrinho e cliente
        EliteControl.state.saleCart = [];
        EliteControl.state.selectedCustomer = null;
        updateSaleInterface();

        const custSearchInput = document.getElementById('customerSearchInput');
        if(custSearchInput) custSearchInput.value = '';
        const selectedCustInfo = document.getElementById('selectedCustomerInfo');
        if(selectedCustInfo) selectedCustInfo.classList.add('hidden');

        // Recarregar produtos
        EliteControl.state.availableProducts = await DataService.getProducts();
        renderAvailableProducts(EliteControl.state.availableProducts);

        // Mostrar sucesso
        showSaleSuccessModal(newSale);

        console.log("✅ Venda finalizada com sucesso:", newSale);

    } catch (error) {
        console.error("❌ Erro ao finalizar venda:", error);
        showTemporaryAlert(`Erro ao finalizar venda: ${error.message}`, 'error');
    } finally {
        // Restaurar botão
        finalizeButton.disabled = false;
        finalizeButton.innerHTML = originalText;
    }
}

// === FUNÇÕES DE VENDA ===

function renderSalesList(sales, container, userRole, isPersonal = false) {
    console.log(`💰 Renderizando ${isPersonal ? 'minhas vendas' : 'lista de vendas'}:`, sales.length);

    container.innerHTML = '';

    // Título
    const title = document.createElement('h2');
    title.className = 'text-xl font-semibold text-slate-100 mb-4';
    title.textContent = isPersonal ? 'Minhas Vendas' : 'Histórico de Vendas';
    container.appendChild(title);

    // Verificar se há vendas
    if (!sales || sales.length === 0) {
        const noSalesMsg = document.createElement('div');
        noSalesMsg.className = 'text-center py-8 text-slate-400';
        noSalesMsg.innerHTML = `
            <i class="fas fa-receipt fa-3x mb-4"></i>
            <p>${isPersonal ? 'Você ainda não realizou nenhuma venda.' : 'Nenhuma venda encontrada.'}</p>
            ${isPersonal ? '<p class="text-sm mt-2">Comece registrando sua primeira venda!</p>' : ''}
        `;
        container.appendChild(noSalesMsg);
        return;
    }

    // Tabela de vendas
    const table = createSalesTable(sales, isPersonal);
    container.appendChild(table);
}

function createSalesTable(sales, isPersonal = false) {
    const table = document.createElement('table');
    table.className = 'min-w-full bg-slate-800 shadow-md rounded-lg overflow-hidden';

    // Cabeçalho
    const thead = document.createElement('thead');
    thead.className = 'bg-slate-700';
    thead.innerHTML = `
        <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Data</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Cliente</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Produtos</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Total</th>
            ${!isPersonal ? '<th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Vendedor</th>' : ''}
        </tr>
    `;
    table.appendChild(thead);

    // Corpo da tabela
    const tbody = document.createElement('tbody');
    tbody.className = 'divide-y divide-slate-700';

    sales.forEach(sale => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-750 transition-colors duration-150';

        const productNames = sale.productsDetail && Array.isArray(sale.productsDetail) && sale.productsDetail.length > 0
            ? sale.productsDetail.map(p => `${p.name} (x${p.quantity})`).join(', ')
            : 'N/A';

        const customerInfo = sale.customerName || 'Cliente não identificado';

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${formatDate(sale.date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-200">${customerInfo}</td>
            <td class="px-6 py-4 text-sm text-slate-200" title="${productNames}">${truncateText(productNames, 50)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-semibold">${formatCurrency(sale.total)}</td>
            ${!isPersonal ? `<td class="px-6 py-4 whitespace-nowrap text-sm text-slate-300">${sale.sellerName || 'N/A'}</td>` : ''}
        `;

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
}

// === SEÇÃO DE CLIENTES ===

async function renderCustomersSection(container, currentUser) {
    console.log("👥 Renderizando seção de clientes");

    // Apenas admin pode acessar
    if (currentUser.role !== 'Dono/Gerente') {
        container.innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fas fa-lock fa-3x mb-4"></i>
                <p>Acesso restrito ao administrador.</p>
            </div>
        `;
        return;
    }

    try {
        if (typeof CRMService === 'undefined' || typeof CRMService.getCustomers !== 'function' || typeof CRMService.getCustomerInsights !== 'function') {
            console.warn("CRMService ou suas funções não estão definidos.");
            container.innerHTML = `<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-triangle fa-3x mb-4"></i><p>Erro: Serviço de CRM indisponível.</p></div>`;
            return;
        }

        // Carregar dados
        const [customers, insights] = await Promise.all([
            CRMService.getCustomers(),
            CRMService.getCustomerInsights()
        ]);

        container.innerHTML = `
            <div class="customers-container">
                <div class="customers-header mb-6">
                    <div class="flex justify-between items-center">
                        <div>
                            <h2 class="text-xl font-semibold text-slate-100">Gerenciamento de Clientes</h2>
                            <p class="text-slate-400 mt-1">Sistema CRM com IA para relacionamento e vendas</p>
                        </div>
                        <button id="addCustomerButton" class="btn-primary">
                            <i class="fas fa-user-plus mr-2"></i>
                            Novo Cliente
                        </button>
                    </div>
                </div>

                <div class="customers-kpis grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper">
                            <i class="fas fa-users kpi-icon"></i>
                        </div>
                        <div class="kpi-content">
                            <div class="kpi-title">Total de Clientes</div>
                            <div class="kpi-value">${insights.totalCustomers}</div>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper">
                            <i class="fas fa-star kpi-icon"></i>
                        </div>
                        <div class="kpi-content">
                            <div class="kpi-title">Clientes VIP</div>
                            <div class="kpi-value">${insights.segmentation.vip}</div>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper">
                            <i class="fas fa-exclamation-triangle kpi-icon"></i>
                        </div>
                        <div class="kpi-content">
                            <div class="kpi-title">Inativos (+30 dias)</div>
                            <div class="kpi-value text-warning">${insights.segmentation.inativos}</div>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon-wrapper">
                            <i class="fas fa-dollar-sign kpi-icon"></i>
                        </div>
                        <div class="kpi-content">
                            <div class="kpi-title">Receita Total</div>
                            <div class="kpi-value">${formatCurrency(insights.totalRevenue)}</div>
                        </div>
                    </div>
                </div>

                <div class="customers-tools bg-slate-800 p-4 rounded-lg mb-6">
                    <div class="flex flex-col md:flex-row gap-4">
                        <div class="flex-1">
                            <div class="relative">
                                <input type="text"
                                       id="customerSearchInput"
                                       class="form-input pl-10 w-full"
                                       placeholder="Buscar clientes por nome, telefone ou email...">
                                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <select id="customerStatusFilter" class="form-select">
                                <option value="">Todos os Status</option>
                                <option value="active">Ativos</option>
                                <option value="inactive">Inativos</option>
                            </select>
                            <select id="customerSortFilter" class="form-select">
                                <option value="name">Nome (A-Z)</option>
                                <option value="-totalSpent">Maior Gasto</option>
                                <option value="lastPurchaseDate">Última Compra</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="customers-table-container bg-slate-800 rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-slate-700">
                        <thead class="bg-slate-700">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Contato
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Total Gasto
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Última Compra
                                </th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700" id="customersTableBody">
                            ${renderCustomersTableRows(customers)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Configurar event listeners
        setupCustomersEventListeners();

    } catch (error) {
        console.error("❌ Erro ao carregar clientes:", error);
        container.innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fas fa-times-circle fa-3x mb-4"></i>
                <p>Erro ao carregar dados dos clientes.</p>
            </div>
        `;
    }
}

function renderCustomersTableRows(customers) {
    if (!customers || customers.length === 0) {
        return `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-slate-400">
                    <i class="fas fa-users fa-2x mb-2"></i>
                    <p>Nenhum cliente cadastrado</p>
                </td>
            </tr>
        `;
    }

    return customers.map(customer => {
        const status = getCustomerStatus(customer);
        const lastPurchaseDate = customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate.toDate()) : 'Nunca';
        
        return `
            <tr class="hover:bg-slate-750 transition-colors duration-150">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <i class="fas fa-user text-slate-400"></i>
                        </div>
                        <div class="ml-4">
                            <div class="text-sm font-medium text-slate-200">${customer.name}</div>
                            ${customer.cpf ? `<div class="text-sm text-slate-400">CPF: ${customer.cpf}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-slate-300">${customer.phone}</div>
                    ${customer.email ? `<div class="text-sm text-slate-400">${customer.email}</div>` : ''}
                </td>
                <td class="px-6 py-4">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.class}">
                        ${status.text}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-slate-300">
                    ${formatCurrency(customer.totalSpent || 0)}
                    ${customer.totalPurchases ? `<div class="text-xs text-slate-400">${customer.totalPurchases} compras</div>` : ''}
                </td>
                <td class="px-6 py-4 text-sm text-slate-300">
                    ${lastPurchaseDate}
                </td>
                <td class="px-6 py-4 text-right text-sm font-medium">
                    <button onclick="viewCustomerDetails('${customer.id}')" class="text-sky-400 hover:text-sky-300 mr-3">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editCustomer('${customer.id}')" class="text-sky-400 hover:text-sky-300 mr-3">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCustomer('${customer.id}')" class="text-red-500 hover:text-red-400">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getCustomerStatus(customer) {
    if (!customer.lastPurchaseDate) {
        return {
            text: 'Novo',
            class: 'bg-sky-900 text-sky-200'
        };
    }

    const daysSinceLastPurchase = Math.floor(
        (new Date() - customer.lastPurchaseDate.toDate()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastPurchase > 90) {
        return {
            text: 'Inativo',
            class: 'bg-red-900 text-red-200'
        };
    }

    if (customer.totalPurchases >= 10) {
        return {
            text: 'VIP',
            class: 'bg-yellow-900 text-yellow-200'
        };
    }

    if (customer.totalPurchases >= 5) {
        return {
            text: 'Frequente',
            class: 'bg-green-900 text-green-200'
        };
    }

    return {
        text: 'Regular',
        class: 'bg-slate-600 text-slate-200'
    };
}

function setupCustomersEventListeners() {
    // Busca de clientes
    const searchInput = document.getElementById('customerSearchInput');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => filterCustomers(), 300);
        });
    }

    // Filtros
    const statusFilter = document.getElementById('customerStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterCustomers);
    }

    const sortFilter = document.getElementById('customerSortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', filterCustomers);
    }

    // Botão novo cliente
    const addButton = document.getElementById('addCustomerButton');
    if (addButton) {
        addButton.addEventListener('click', () => showCustomerModal());
    }
}

async function filterCustomers() {
    const searchTerm = document.getElementById('customerSearchInput')?.value.toLowerCase() || '';
    const status = document.getElementById('customerStatusFilter')?.value;
    const sort = document.getElementById('customerSortFilter')?.value;

    try {
        let customers = await CRMService.getCustomers();

        // Aplicar busca
        if (searchTerm) {
            customers = customers.filter(customer =>
                customer.name.toLowerCase().includes(searchTerm) ||
                customer.phone.includes(searchTerm) ||
                (customer.email && customer.email.toLowerCase().includes(searchTerm))
            );
        }

        // Aplicar filtro de status
        if (status) {
            customers = customers.filter(customer => {
                if (status === 'inactive') {
                    return !customer.lastPurchaseDate || 
                           Math.floor((new Date() - customer.lastPurchaseDate.toDate()) / (1000 * 60 * 60 * 24)) > 90;
                }
                return customer.lastPurchaseDate && 
                       Math.floor((new Date() - customer.lastPurchaseDate.toDate()) / (1000 * 60 * 60 * 24)) <= 90;
            });
        }

        // Aplicar ordenação
        if (sort) {
            const [field, direction] = sort.startsWith('-') ? [sort.slice(1), 'desc'] : [sort, 'asc'];
            customers.sort((a, b) => {
                let valueA = a[field];
                let valueB = b[field];

                if (field === 'lastPurchaseDate') {
                    valueA = valueA ? valueA.toDate().getTime() : 0;
                    valueB = valueB ? valueB.toDate().getTime() : 0;
                }

                if (direction === 'desc') {
                    return valueB - valueA;
                }
                return valueA - valueB;
            });
        }

        // Atualizar tabela
        const tbody = document.getElementById('customersTableBody');
        if (tbody) {
            tbody.innerHTML = renderCustomersTableRows(customers);
        }

    } catch (error) {
        console.error("❌ Erro ao filtrar clientes:", error);
        showTemporaryAlert("Erro ao filtrar clientes", "error");
    }
}

function showCustomerModal(customerId = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${customerId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">
                    &times;
                </button>
            </div>

            <form id="customerForm" class="modal-body">
                <input type="hidden" id="customerId" value="${customerId || ''}">
                
                <div class="form-group">
                    <label for="customerName" class="form-label">Nome *</label>
                    <input type="text"
                           id="customerName"
                           class="form-input"
                           placeholder="Nome completo"
                           required>
                </div>

                <div class="form-group">
                    <label for="customerPhone" class="form-label">Telefone *</label>
                    <input type="tel"
                           id="customerPhone"
                           class="form-input"
                           placeholder="(00) 00000-0000"
                           required>
                </div>

                <div class="form-group">
                    <label for="customerEmail" class="form-label">Email</label>
                    <input type="email"
                           id="customerEmail"
                           class="form-input"
                           placeholder="email@exemplo.com">
                </div>

                <div class="form-group">
                    <label for="customerCPF" class="form-label">CPF</label>
                    <input type="text"
                           id="customerCPF"
                           class="form-input"
                           placeholder="000.000.000-00">
                </div>

                <div class="form-group">
                    <label for="customerAddress" class="form-label">Endereço</label>
                    <textarea id="customerAddress"
                              class="form-input"
                              rows="2"
                              placeholder="Endereço completo"></textarea>
                </div>

                <div class="form-group">
                    <label for="customerBirthdate" class="form-label">Data de Nascimento</label>
                    <input type="date"
                           id="customerBirthdate"
                           class="form-input">
                </div>

                <div class="form-group">
                    <label for="customerNotes" class="form-label">Observações</label>
                    <textarea id="customerNotes"
                              class="form-input"
                              rows="3"
                              placeholder="Observações sobre o cliente"></textarea>
                </div>
            </form>

            <div class="modal-footer">
                <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
                    Cancelar
                </button>
                <button class="btn-primary" onclick="saveCustomer()">
                    <i class="fas fa-save mr-2"></i>
                    Salvar Cliente
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.remove('hidden'), 10);

    if (customerId) {
        loadCustomerData(customerId);
    }
}

async function loadCustomerData(customerId) {
    try {
        const customer = await CRMService.getCustomerById(customerId);
        if (!customer) {
            showTemporaryAlert("Cliente não encontrado", "error");
            return;
        }

        // Preencher formulário
        document.getElementById('customerName').value = customer.name || '';
        document.getElementById('customerPhone').value = customer.phone || '';
        document.getElementById('customerEmail').value = customer.email || '';
        document.getElementById('customerCPF').value = customer.cpf || '';
        document.getElementById('customerAddress').value = customer.address || '';
        document.getElementById('customerBirthdate').value = customer.birthdate || '';
        document.getElementById('customerNotes').value = customer.notes || '';

    } catch (error) {
        console.error("❌ Erro ao carregar dados do cliente:", error);
        showTemporaryAlert("Erro ao carregar dados do cliente", "error");
    }
}

async function saveCustomer() {
    const form = document.getElementById('customerForm');
    if (!form || !form.checkValidity()) {
        if(form) form.reportValidity();
        return;
    }

    const customerData = {
        id: document.getElementById('customerId').value,
        name: document.getElementById('customerName').value.trim(),
        phone: document.getElementById('customerPhone').value.replace(/\D/g, ''),
        email: document.getElementById('customerEmail').value.trim(),
        cpf: document.getElementById('customerCPF').value.replace(/\D/g, ''),
        address: document.getElementById('customerAddress').value.trim(),
        birthdate: document.getElementById('customerBirthdate').value,
        notes: document.getElementById('customerNotes').value.trim()
    };

    try {
        await CRMService.createOrUpdateCustomer(customerData);
        
        // Fechar modal
        const modal = document.querySelector('.modal-backdrop');
        if (modal) modal.remove();

        // Atualizar lista
        filterCustomers();

        showTemporaryAlert(
            customerData.id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!',
            'success'
        );

    } catch (error) {
        console.error("❌ Erro ao salvar cliente:", error);
        showTemporaryAlert("Erro ao salvar cliente. Verifique os dados.", "error");
    }
}

async function viewCustomerDetails(customerId) {
    try {
        const customer = await CRMService.getCustomerById(customerId);
        if (!customer) {
            showTemporaryAlert("Cliente não encontrado", "error");
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-backdrop';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">Detalhes do Cliente</h3>
                    <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">
                        &times;
                    </button>
                </div>

                <div class="modal-body">
                    <div class="customer-details-header mb-6">
                        <div class="flex items-center">
                            <div class="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center">
                                <i class="fas fa-user fa-lg text-slate-400"></i>
                            </div>
                            <div class="ml-4">
                                <h4 class="text-lg font-semibold text-slate-100">${customer.name}</h4>
                                <p class="text-slate-400">${customer.phone}</p>
                                ${customer.email ? `<p class="text-slate-400">${customer.email}</p>` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div class="bg-slate-800 p-4 rounded-lg">
                            <h5 class="text-sm font-semibold text-slate-300 mb-3">Informações Pessoais</h5>
                            <div class="space-y-2">
                                ${customer.cpf ? `
                                    <div class="flex justify-between">
                                        <span class="text-slate-400">CPF:</span>
                                        <span class="text-slate-300">${customer.cpf}</span>
                                    </div>
                                ` : ''}
                                ${customer.birthdate ? `
                                    <div class="flex justify-between">
                                        <span class="text-slate-400">Data de Nascimento:</span>
                                        <span class="text-slate-300">${formatDate(customer.birthdate)}</span>
                                    </div>
                                ` : ''}
                                ${customer.address ? `
                                    <div class="flex justify-between">
                                        <span class="text-slate-400">Endereço:</span>
                                        <span class="text-slate-300">${customer.address}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <div class="bg-slate-800 p-4 rounded-lg">
                            <h5 class="text-sm font-semibold text-slate-300 mb-3">Histórico de Compras</h5>
                            <div class="space-y-2">
                                <div class="flex justify-between">
                                    <span class="text-slate-400">Total de Compras:</span>
                                    <span class="text-slate-300">${customer.totalPurchases || 0}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-400">Total Gasto:</span>
                                    <span class="text-slate-300">${formatCurrency(customer.totalSpent || 0)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-slate-400">Ticket Médio:</span>
                                    <span class="text-slate-300">${formatCurrency(customer.averageTicket || 0)}</span>
                                </div>
                                ${customer.lastPurchaseDate ? `
                                    <div class="flex justify-between">
                                        <span class="text-slate-400">Última Compra:</span>
                                        <span class="text-slate-300">${formatDate(customer.lastPurchaseDate.toDate())}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    ${customer.notes ? `
                        <div class="bg-slate-800 p-4 rounded-lg mb-6">
                            <h5 class="text-sm font-semibold text-slate-300 mb-3">Observações</h5>
                            <p class="text-slate-400">${customer.notes}</p>
                        </div>
                    ` : ''}
                </div>

                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal-backdrop').remove()">
                        Fechar
                    </button>
                    <button class="btn-primary" onclick="editCustomer('${customer.id}')">
                        <i class="fas fa-edit mr-2"></i>
                        Editar Cliente
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.remove('hidden'), 10);

    } catch (error) {
        console.error("❌ Erro ao carregar detalhes do cliente:", error);
        showTemporaryAlert("Erro ao carregar detalhes do cliente", "error");
    }
}

function editCustomer(customerId) {
    // Fechar modal de detalhes se estiver aberto
    const detailsModal = document.querySelector('.modal-backdrop');
    if (detailsModal) detailsModal.remove();

    // Abrir modal de edição
    showCustomerModal(customerId);
}

function deleteCustomer(customerId) {
    showCustomConfirm(
        'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.',
        async () => {
            try {
                await CRMService.deleteCustomer(customerId);
                filterCustomers();
                showTemporaryAlert('Cliente excluído com sucesso!', 'success');
            } catch (error) {
                console.error("❌ Erro ao excluir cliente:", error);
                showTemporaryAlert("Erro ao excluir cliente", "error");
            }
        }
    );
}

// === SEÇÃO DE USUÁRIOS ===

function renderUsersSection(container) {
    console.log("👥 Renderizando seção de usuários (em desenvolvimento)");

    container.innerHTML = `
        <div class="users-container">
            <h2 class="text-xl font-semibold text-slate-100 mb-4">Gerenciamento de Usuários</h2>

            <div class="text-center py-16 text-slate-400">
                <i class="fas fa-users-cog fa-4x mb-4"></i>
                <p class="text-lg">Seção em desenvolvimento</p>
                <p class="text-sm mt-2">Em breve você poderá gerenciar usuários e permissões do sistema.</p>
            </div>
        </div>
    `;
}

// === CONFIGURAÇÃO DE EVENT LISTENERS ===

function setupEventListeners() {
    console.log("🔧 Configurando event listeners gerais");

    setupFormListeners();
    setupNavigationListeners();
    setupDropdownListeners();
    
    // Configurar listeners de produtos (sempre, pois usa delegação de eventos)
    setupProductActionListeners();

    // Configurar listeners do modal de produtos se estiver no dashboard
    if (window.location.pathname.includes('dashboard.html')) {
        // Tentar configurar modal se existir
        if (EliteControl.elements.productModal && !EliteControl.state.modalEventListenersAttached) {
            if (typeof setupModalEventListeners === 'function') {
                console.log("🔧 Configurando listeners do modal de produto");
                setupModalEventListeners();
            } else {
                console.error("❌ Função setupModalEventListeners não está definida");
            }
        }
    }
    
    console.log("✅ Event listeners gerais configurados");
}

function setupFormListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }
}

function setupNavigationListeners() {
    window.addEventListener('hashchange', handleHashChange);

    document.addEventListener('click', function(e) {
        const navLink = e.target.closest('#navLinks a.nav-link');
        if (navLink) {
            e.preventDefault();
            const section = navLink.dataset.section;
            if (section) {
                window.location.hash = '#' + section;
            }
        }
    });
}

function setupDropdownListeners() {
    const notificationBellButton = document.getElementById('notificationBellButton');
    const notificationDropdown = document.getElementById('notificationDropdown');

    if (notificationBellButton && notificationDropdown) {
        notificationBellButton.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationDropdown.classList.toggle('hidden');
        });
    }

    const userMenuButton = document.getElementById('userMenuButton');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        if (notificationDropdown &&
            !notificationBellButton?.contains(e.target) &&
            !notificationDropdown.contains(e.target)) {
            notificationDropdown.classList.add('hidden');
        }

        if (userDropdown &&
            !userMenuButton?.contains(e.target) &&
            !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });

    const markAllAsReadButton = document.getElementById('markAllAsReadButton');
    if (markAllAsReadButton) {
        markAllAsReadButton.addEventListener('click', markAllNotificationsAsRead);
    }
}

function setupProductActionListeners() {
    // Usar delegação de eventos para capturar cliques em botões criados dinamicamente
    console.log("🔧 Configurando listeners de produtos com delegação de eventos");
    
    document.addEventListener('click', function(e) {
        // Botão de adicionar produto
        if (e.target.closest('#openAddProductModalButton')) {
            e.preventDefault();
            console.log("🔘 Botão adicionar produto clicado");
            
            // Garantir que os elementos do modal estão inicializados
            if (!EliteControl.elements.productModal) {
                console.log("Modal não inicializado, inicializando...");
                initializeModalElements();
            }
            
            // Configurar event listeners do modal se necessário
            if (!EliteControl.state.modalEventListenersAttached && EliteControl.elements.productModal) {
                console.log("Configurando listeners do modal...");
                setupModalEventListeners();
            }
            
            openProductModal();
            return;
        }

        // Botão de editar produto
        const editButton = e.target.closest('.edit-product-btn');
        if (editButton) {
            e.preventDefault();
            console.log("✏️ Botão editar produto clicado");
            const productId = editButton.dataset.productId;
            console.log("Product ID:", productId);
            
            if (productId) {
                // Garantir que os elementos do modal estão inicializados
                if (!EliteControl.elements.productModal) {
                    console.log("Modal não inicializado para edição, inicializando...");
                    initializeModalElements();
                }
                
                // Configurar event listeners do modal se necessário
                if (!EliteControl.state.modalEventListenersAttached && EliteControl.elements.productModal) {
                    console.log("Configurando listeners do modal para edição...");
                    setupModalEventListeners();
                }
                
                handleEditProduct(productId);
            } else {
                console.error("Product ID não encontrado no botão de editar");
            }
            return;
        }

        // Botão de excluir produto
        const deleteButton = e.target.closest('.delete-product-btn');
        if (deleteButton) {
            e.preventDefault();
            console.log("🗑️ Botão excluir produto clicado");
            const productId = deleteButton.dataset.productId;
            const productName = deleteButton.dataset.productName;
            console.log("Product ID:", productId, "Product Name:", productName);
            
            if (productId && productName) {
                handleDeleteProductConfirmation(productId, productName);
            } else {
                console.error("Product ID ou Name não encontrado no botão de excluir");
            }
            return;
        }
    });
}

// === HANDLERS DE EVENTOS ===

function handleHashChange() {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        console.log("Hash mudou, mas usuário não está logado. Ignorando.");
        return;
    }

    const userRole = localStorage.getItem('elitecontrol_user_role');
    if (!userRole) {
        console.warn("Hash mudou, mas role do usuário não encontrado no localStorage. Logout pode ser necessário.");
        return;
    }

    const section = window.location.hash.substring(1);
    const defaultSection = getDefaultSection(userRole);
    const targetSection = section || defaultSection;

    updateSidebarActiveState(targetSection);
    loadSectionContent(targetSection, {
        uid: currentUser.uid,
        email: currentUser.email,
        role: userRole
    });
}

async function handleEditProduct(productId) {
    console.log("✏️ Editando produto com ID:", productId);

    if (!productId) {
        console.error("❌ ID do produto não fornecido");
        showTemporaryAlert('Erro: ID do produto não encontrado.', 'error');
        return;
    }

    try {
        // Mostrar loading
        showTemporaryAlert('Carregando dados do produto...', 'info', 2000);
        
        const product = await DataService.getProductById(productId);
        
        if (product) {
            console.log("✅ Produto encontrado:", product);
            openProductModal(product);
        } else {
            console.error("❌ Produto não encontrado:", productId);
            showTemporaryAlert('Produto não encontrado.', 'error');
        }
    } catch (error) {
        console.error("❌ Erro ao carregar produto para edição:", error);
        showTemporaryAlert('Erro ao carregar dados do produto.', 'error');
    }
}

function handleDeleteProductConfirmation(productId, productName) {
    console.log("🗑️ Confirmando exclusão do produto:", productName);

    showCustomConfirm(
        `Tem certeza que deseja excluir o produto "${productName}"?\n\nEsta ação não pode ser desfeita.`,
        async () => {
            try {
                await DataService.deleteProduct(productId);
                showTemporaryAlert(`Produto "${productName}" excluído com sucesso.`, 'success');
                await reloadProductsIfNeeded();
            } catch (error) {
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

function setupSaleFormEventListeners(currentUser) {
    // Busca de clientes
    const customerSearchInput = document.getElementById('customerSearchInput');
    const customerSuggestions = document.getElementById('customerSuggestions');
    
    if (customerSearchInput) {
        let debounceTimeout;
        
        customerSearchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.trim();
            
            // Limpar o timeout anterior
            if (debounceTimeout) clearTimeout(debounceTimeout);
            
            // Se o campo estiver vazio, esconder as sugestões
            if (!searchTerm) {
                customerSuggestions.classList.add('hidden');
                return;
            }

            // Configurar novo timeout para debounce
            debounceTimeout = setTimeout(async () => {
                try {
                    const customersRef = firebase.firestore().collection('customers');
                    const snapshot = await customersRef
                        .orderBy('name')
                        .startAt(searchTerm)
                        .endAt(searchTerm + '\uf8ff')
                        .limit(5)
                        .get();

                    const suggestions = [];
                    snapshot.forEach(doc => {
                        suggestions.push({ id: doc.id, ...doc.data() });
                    });

                    renderCustomerSuggestions(suggestions);
                } catch (error) {
                    console.error('Erro ao buscar clientes:', error);
                    customerSuggestions.innerHTML = `
                        <div class="customer-suggestion-item">
                            <div class="text-red-400 text-sm">Erro ao buscar clientes. Tente novamente.</div>
                        </div>
                    `;
                    customerSuggestions.classList.remove('hidden');
                }
            }, 300);
        });

        // Fechar sugestões ao clicar fora
        document.addEventListener('click', (e) => {
            if (!customerSearchInput.contains(e.target) && !customerSuggestions.contains(e.target)) {
                customerSuggestions.classList.add('hidden');
            }
        });

        // Prevenir que o clique nas sugestões feche o dropdown
        customerSuggestions.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Busca de produtos
    const productSearchInput = document.getElementById('productSearchInput');
    if (productSearchInput) {
        productSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const filteredProducts = EliteControl.state.availableProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.category.toLowerCase().includes(searchTerm)
            );
            renderAvailableProducts(filteredProducts);
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
        clearCartButton.addEventListener('click', () => {
            showCustomConfirm('Deseja realmente limpar o carrinho?', clearCart);
        });
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

// Função para atualizar a hora atual
function updateCurrentTime() {
    const element = document.getElementById('currentDateTime');
    if (element) {
        const now = new Date();
        element.textContent = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR');
    }
}

// Função para atualizar o botão de finalizar venda
function updateFinalizeSaleButton() {
    const button = document.getElementById('finalizeSaleButton');
    if (!button) return;

    const hasCustomer = EliteControl.state.selectedCustomer !== null;
    const hasItems = EliteControl.state.saleCart.length > 0;

    button.disabled = !hasCustomer || !hasItems;
    button.title = !hasCustomer ? 'Selecione um cliente' : !hasItems ? 'Adicione produtos ao carrinho' : '';
}

// Função para mostrar o modal de sucesso da venda
function showSaleSuccessModal(sale) {
    const modalContent = `
        <div class="text-center mb-6">
            <i class="fas fa-check-circle text-green-400 text-5xl mb-4"></i>
            <h3 class="text-xl font-semibold text-slate-100 mb-2">Venda Realizada com Sucesso!</h3>
            <p class="text-slate-400">Venda registrada para ${sale.customerName}</p>
        </div>
        <div class="bg-slate-800 rounded-lg p-4 mb-6">
            <div class="flex justify-between items-center mb-2">
                <span class="text-slate-400">Total da venda:</span>
                <span class="text-xl font-bold text-green-400">${formatCurrency(sale.total)}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-slate-400">Itens vendidos:</span>
                <span class="text-slate-100">${sale.items.length} ${sale.items.length === 1 ? 'item' : 'itens'}</span>
            </div>
        </div>
        <div class="flex justify-end">
            <button onclick="closeSaleSuccessModal()" class="btn-primary">
                <i class="fas fa-check mr-2"></i>
                OK
            </button>
        </div>
    `;

    showCustomModal('Venda Concluída', modalContent);
}

// Função para fechar o modal de sucesso
function closeSaleSuccessModal() {
    closeCustomModal();
    window.location.hash = '#vendas';
}

// Inicializar as funções globais
window.toggleProductSelection = toggleProductSelection;
window.changeQuantity = changeQuantity;
window.updateQuantity = updateQuantity;
window.removeCartItem = removeCartItem;
window.clearCart = clearCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.closeSaleSuccessModal = closeSaleSuccessModal;
window.selectCustomer = selectCustomer;
window.saveNewCustomer = saveNewCustomer;
