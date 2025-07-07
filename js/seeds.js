/**
 * SEEDS PAGE CONTROLLER - Patrón MVC
 * Gestiona la funcionalidad de la página de semillas
 * @author THC Growshop
 * @version 2.0.0
 */

class SeedsController {
    constructor() {
        this.cartService = window.CartService;
        this.notificationService = window.NotificationService;
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.allSeeds = [];
        this.filteredSeeds = [];
        this.DOM = this.cacheDOMElements();
        this.filters = {
            search: '',
            type: '',
            genetics: '',
            thc: ''
        };
        
        this.init();
    }

    /**
     * Cache de elementos DOM
     */
    cacheDOMElements() {
        return {
            seedsGrid: document.getElementById('seeds-grid'),
            searchInput: document.getElementById('search'),
            typeFilter: document.getElementById('type-filter'),
            geneticsFilter: document.getElementById('genetics-filter'),
            thcFilter: document.getElementById('thc-filter'),
            paginationContainer: document.getElementById('pagination-container'),
            paginationPages: document.getElementById('pagination-pages'),
            prevPageBtn: document.getElementById('prev-page'),
            nextPageBtn: document.getElementById('next-page')
        };
    }

    /**
     * Inicialización
     */
    async init() {
        try {
            await this.loadSeeds();
            this.bindEvents();
            this.applyFilters();
            this.updateCartCount();
        } catch (error) {
            console.error('Error initializing seeds page:', error);
            this.showError('Error al cargar las semillas');
        }
    }

    /**
     * Carga los datos de semillas
     */
    async loadSeeds() {
        try {
            const response = await fetch('data/seeds.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.allSeeds = await response.json();
            this.filteredSeeds = [...this.allSeeds];
        } catch (error) {
            console.error('Error loading seeds:', error);
            throw error;
        }
    }

    /**
     * Vincula eventos
     */
    bindEvents() {
        // Filtros
        this.DOM.searchInput?.addEventListener('input', 
            this.debounce((e) => this.handleSearchChange(e), 300)
        );
        
        this.DOM.typeFilter?.addEventListener('change', (e) => this.handleFilterChange('type', e.target.value));
        this.DOM.geneticsFilter?.addEventListener('change', (e) => this.handleFilterChange('genetics', e.target.value));
        this.DOM.thcFilter?.addEventListener('change', (e) => this.handleFilterChange('thc', e.target.value));

        // Paginación
        this.DOM.prevPageBtn?.addEventListener('click', (e) => this.handlePrevPage(e));
        this.DOM.nextPageBtn?.addEventListener('click', (e) => this.handleNextPage(e));

        // NO manejamos eventos de carrito aquí - el UnifiedCartController se encarga
        console.log('✅ SeedsController: Eventos vinculados (carrito manejado por UnifiedCartController)');
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
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
     * Maneja cambios en la búsqueda
     */
    handleSearchChange(e) {
        this.handleFilterChange('search', e.target.value);
    }

    /**
     * Maneja cambios en filtros
     */
    handleFilterChange(filterType, value) {
        this.filters[filterType] = value;
        this.currentPage = 1;
        this.applyFilters();
    }

    /**
     * Aplica filtros a las semillas
     */
    applyFilters() {
        this.filteredSeeds = this.allSeeds.filter(seed => {
            // Filtro de búsqueda
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const matchesSearch = 
                    seed.nombre.toLowerCase().includes(searchTerm) ||
                    seed.descripcion.toLowerCase().includes(searchTerm) ||
                    seed.banco.toLowerCase().includes(searchTerm) ||
                    seed.efectos.some(efecto => efecto.toLowerCase().includes(searchTerm)) ||
                    seed.sabores.some(sabor => sabor.toLowerCase().includes(searchTerm));
                
                if (!matchesSearch) return false;
            }

            // Filtro por tipo
            if (this.filters.type) {
                if (this.filters.type === 'cbd' && seed.cbd < 5) return false;
                if (this.filters.type !== 'cbd' && seed.tipo !== this.filters.type) return false;
            }

            // Filtro por genética
            if (this.filters.genetics && seed.genetica !== this.filters.genetics) {
                return false;
            }

            // Filtro por THC
            if (this.filters.thc) {
                const thcLevel = seed.thc;
                switch (this.filters.thc) {
                    case 'bajo':
                        if (thcLevel >= 10) return false;
                        break;
                    case 'medio':
                        if (thcLevel < 10 || thcLevel > 20) return false;
                        break;
                    case 'alto':
                        if (thcLevel <= 20) return false;
                        break;
                }
            }

            return true;
        });

        this.renderSeeds();
        this.renderPagination();
    }

    /**
     * Renderiza las semillas
     */
    renderSeeds() {
        if (!this.DOM.seedsGrid) return;

        if (this.filteredSeeds.length === 0) {
            this.renderNoResults();
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentSeeds = this.filteredSeeds.slice(startIndex, endIndex);

        const seedsHTML = currentSeeds.map(seed => this.createSeedHTML(seed)).join('');
        this.DOM.seedsGrid.innerHTML = seedsHTML;

        // Scroll to top after filter change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Crea HTML para una semilla
     */
    createSeedHTML(seed) {
        const isInCart = this.cartService ? this.cartService.hasItem(seed.id) : false;
        const isAvailable = seed.disponible;
        const hasDiscount = seed.precioOriginal && seed.precioOriginal > seed.precio;

        return `
            <article class="product-card seed-card" data-seed-id="${seed.id}" data-product-id="${seed.id}">
                <div class="product-card__image-container">
                    <img src="${seed.imagen}" 
                         alt="${seed.nombre}" 
                         class="product-card__image" 
                         loading="lazy"
                         onerror="this.src='imagenes/Logo.png'">
                    
                    <!-- Badges esquina superior izquierda -->
                    <div class="product-card__badges product-card__badges--left">
                        ${seed.destacado ? '<span class="product-card__badge product-card__badge--featured">Destacado</span>' : ''}
                        ${hasDiscount ? '<span class="product-card__badge product-card__badge--sale">Oferta</span>' : ''}
                        ${!isAvailable ? '<span class="product-card__badge product-card__badge--unavailable">Agotado</span>' : ''}
                    </div>
                    
                    <!-- Badge de genética esquina superior derecha -->
                    <div class="product-card__badges product-card__badges--right">
                        <span class="product-card__badge product-card__badge--genetics product-card__badge--${seed.genetica}">
                            ${this.formatGenetics(seed.genetica)}
                        </span>
                    </div>
                </div>

                <div class="product-card__content">
                    <div class="product-card__info">
                        <div class="seed-card__bank">${seed.banco}</div>
                        <h3 class="product-card__title seed-card__title">${seed.nombre}</h3>
                        <p class="product-card__description product-card__description--preview seed-card__description">
                            ${seed.descripcion}
                        </p>
                        
                        <!-- Especificaciones bien diseñadas -->
                        <div class="seed-card__specs-row">
                            <div class="seed-spec">
                                <span class="seed-spec__label">THC</span>
                                <span class="seed-spec__value">${seed.thc}%</span>
                            </div>
                            <div class="seed-spec">
                                <span class="seed-spec__label">CBD</span>
                                <span class="seed-spec__value">${seed.cbd}%</span>
                            </div>
                            <div class="seed-spec">
                                <span class="seed-spec__label">FLORACIÓN</span>
                                <span class="seed-spec__value">${seed.tiempoFloracion}</span>
                            </div>
                        </div>
                        
                        <!-- Efectos visibles -->
                        <div class="seed-card__effects-mini">
                            ${seed.efectos.slice(0, 2).map(efecto => 
                                `<span class="seed-effect-tag">${efecto}</span>`
                            ).join('')}
                        </div>
                    </div>

                    <div class="product-card__footer">
                        <div class="product-card__pricing">
                            <span class="product-card__price">$${this.formatPrice(seed.precio)}</span>
                            ${hasDiscount ? 
                                `<span class="product-card__original-price">$${this.formatPrice(seed.precioOriginal)}</span>` : 
                                ''}
                        </div>

                        <!-- Selector de cantidad compacto -->
                        <div class="product-card__quantity-controls">
                            <button class="quantity-btn quantity-btn--minus" 
                                    data-action="quantity-decrease" 
                                    data-seed-id="${seed.id}"
                                    aria-label="Disminuir cantidad">
                                <i class="fas fa-minus"></i>
                            </button>
                            <input class="quantity-input" 
                                   type="number" 
                                   min="1" 
                                   max="99" 
                                   value="1" 
                                   data-seed-id="${seed.id}"
                                   aria-label="Cantidad del producto">
                            <button class="quantity-btn quantity-btn--plus" 
                                    data-action="quantity-increase" 
                                    data-seed-id="${seed.id}"
                                    aria-label="Aumentar cantidad">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>

                        <div class="product-card__actions">
                            <button class="btn btn--card-action btn--card-info" 
                                    data-action="toggle-info" 
                                    data-seed-id="${seed.id}"
                                    data-product-id="${seed.id}"
                                    aria-label="Ver información detallada"
                                    title="Ver descripción completa">
                                <i class="fas fa-info-circle"></i>
                            </button>
                            
                            <button class="btn btn--card-action btn--card-cart ${isInCart ? 'btn--card-cart--in-cart' : ''}" 
                                    data-action="add-to-cart" 
                                    data-seed-id="${seed.id}"
                                    data-product-id="${seed.id}"
                                    ${!isAvailable ? 'disabled' : ''}
                                    aria-label="${isInCart ? 'Ya en el carrito' : (isAvailable ? 'Agregar al carrito' : 'Producto no disponible')}">
                                <i class="fas ${isInCart ? 'fa-check' : 'fa-shopping-cart'}"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Descripción expandida como overlay -->
                    <div class="product-card__description-expanded" style="display: none;">
                        <button class="product-card__close-btn" 
                                data-action="close-info" 
                                data-seed-id="${seed.id}"
                                data-product-id="${seed.id}"
                                aria-label="Cerrar información">
                            <i class="fas fa-times"></i>
                        </button>
                        
                        <h3 style="color: var(--color-secondary); margin-bottom: var(--space-sm); font-size: var(--font-size-base);">${seed.nombre}</h3>
                        
                        <p class="product-card__description--full">${seed.descripcion}</p>
                        
                        <div class="seed-card__specs">
                            <h4>Especificaciones:</h4>
                            <ul>
                                <li><strong>Banco:</strong> ${seed.banco}</li>
                                <li><strong>Genética:</strong> ${this.formatGenetics(seed.genetica)}</li>
                                <li><strong>Tipo:</strong> ${seed.tipo}</li>
                                <li><strong>THC:</strong> ${seed.thc}%</li>
                                <li><strong>CBD:</strong> ${seed.cbd}%</li>
                                <li><strong>Tiempo de floración:</strong> ${seed.tiempoFloracion}</li>
                                <li><strong>Rendimiento:</strong> ${seed.rendimiento}</li>
                            </ul>
                        </div>
                        
                        <div class="seed-card__effects">
                            <h4>Efectos:</h4>
                            <div class="seed-card__effects-list">
                                ${seed.efectos.map(efecto => `<span class="seed-card__effect">${efecto}</span>`).join('')}
                            </div>
                        </div>
                        
                        <div class="seed-card__flavors">
                            <h4>Sabores:</h4>
                            <div class="seed-card__flavors-list">
                                ${seed.sabores.map(sabor => `<span class="seed-card__flavor">${sabor}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    /**
     * Formatea la genética para mostrar
     */
    formatGenetics(genetics) {
        const geneticsMap = {
            'indica': 'Indica',
            'sativa': 'Sativa',
            'hibrida': 'Híbrida'
        };
        return geneticsMap[genetics] || genetics;
    }

    /**
     * Renderiza estrellas de calificación
     */
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHTML = '';

        // Estrellas llenas
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i class="fas fa-star"></i>';
        }

        // Media estrella
        if (hasHalfStar) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        }

        // Estrellas vacías
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i class="far fa-star"></i>';
        }

        return `<div class="seed-card__stars">${starsHTML}</div>`;
    }

    /**
     * Renderiza mensaje de no resultados
     */
    renderNoResults() {
        this.DOM.seedsGrid.innerHTML = `
            <div class="no-results">
                <div class="no-results__content">
                    <i class="fas fa-seedling no-results__icon"></i>
                    <h3 class="no-results__title">No se encontraron semillas</h3>
                    <p class="no-results__message">
                        Intenta ajustar los filtros o prueba con otros términos de búsqueda.
                    </p>
                    <button class="btn btn--primary" onclick="window.seedsController.clearFilters()">
                        Limpiar Filtros
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Limpia todos los filtros
     */
    clearFilters() {
        this.filters = {
            search: '',
            type: '',
            genetics: '',
            thc: ''
        };

        // Reset form elements
        if (this.DOM.searchInput) this.DOM.searchInput.value = '';
        if (this.DOM.typeFilter) this.DOM.typeFilter.value = '';
        if (this.DOM.geneticsFilter) this.DOM.geneticsFilter.value = '';
        if (this.DOM.thcFilter) this.DOM.thcFilter.value = '';

        this.currentPage = 1;
        this.applyFilters();
    }

    /**
     * Renderiza la paginación
     */
    renderPagination() {
        if (!this.DOM.paginationContainer) return;

        const totalPages = Math.ceil(this.filteredSeeds.length / this.itemsPerPage);

        if (totalPages <= 1) {
            this.DOM.paginationContainer.style.display = 'none';
            return;
        }

        this.DOM.paginationContainer.style.display = 'flex';

        // Actualizar botones prev/next
        this.DOM.prevPageBtn.classList.toggle('pagination__link--disabled', this.currentPage === 1);
        this.DOM.nextPageBtn.classList.toggle('pagination__link--disabled', this.currentPage === totalPages);

        // Generar páginas
        let pagesHTML = '';
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            pagesHTML += `<a href="#" class="pagination__link" data-page="1">1</a>`;
            if (startPage > 2) {
                pagesHTML += `<span class="pagination__ellipsis">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const isActive = i === this.currentPage;
            pagesHTML += `
                <a href="#" class="pagination__link ${isActive ? 'pagination__link--active' : ''}" 
                   data-page="${i}">${i}</a>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                pagesHTML += `<span class="pagination__ellipsis">...</span>`;
            }
            pagesHTML += `<a href="#" class="pagination__link" data-page="${totalPages}">${totalPages}</a>`;
        }

        this.DOM.paginationPages.innerHTML = pagesHTML;

        // Bind page click events
        this.DOM.paginationPages.addEventListener('click', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('pagination__link') && e.target.dataset.page) {
                this.goToPage(parseInt(e.target.dataset.page));
            }
        });
    }

    /**
     * Navega a una página específica
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredSeeds.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;

        this.currentPage = page;
        this.renderSeeds();
        this.renderPagination();
    }

    /**
     * Página anterior
     */
    handlePrevPage(e) {
        e.preventDefault();
        if (this.currentPage > 1) {
            this.goToPage(this.currentPage - 1);
        }
    }

    /**
     * Página siguiente
     */
    handleNextPage(e) {
        e.preventDefault();
        const totalPages = Math.ceil(this.filteredSeeds.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.goToPage(this.currentPage + 1);
        }
    }

    // ✅ Funciones de carrito eliminadas - ahora manejadas por UnifiedCartController

    /**
     * Actualiza contador del carrito
     */
    updateCartCount() {
        const cart = this.cartService.getCart();
        const cartCounts = document.querySelectorAll('.cart-count');
        cartCounts.forEach(element => {
            element.textContent = cart.totalItems;
            element.style.display = cart.totalItems > 0 ? 'inline' : 'none';
        });
    }

    /**
     * Alterna la vista expandida de información del producto
     */
    toggleProductInfo(productId) {
        const productCard = document.querySelector(`[data-seed-id="${productId}"], [data-product-id="${productId}"]`);
        if (!productCard) return;
        
        const expandedSection = productCard.querySelector('.product-card__description-expanded');
        if (!expandedSection) return;
        
        // Verificar estado actual ANTES de cerrar otras tarjetas
        const isExpanded = productCard.getAttribute('data-expanded') === 'true';
        
        if (isExpanded) {
            // Si está expandida, solo cerrar esta tarjeta
            this.closeProductInfo(productId);
            console.log('Cerrando tarjeta:', productId);
        } else {
            // Si no está expandida, cerrar todas las otras y expandir esta
            this.closeAllExpandedCards();
            expandedSection.style.display = 'block';
            productCard.style.height = 'auto';
            productCard.style.minHeight = '250px';
            productCard.style.zIndex = '20';
            productCard.setAttribute('data-expanded', 'true');
            console.log('Expandiendo tarjeta:', productId);
        }
    }
    
    /**
     * Cierra la vista expandida de un producto específico
     */
    closeProductInfo(productId) {
        const productCard = document.querySelector(`[data-seed-id="${productId}"], [data-product-id="${productId}"]`);
        if (!productCard) return;
        
        const expandedSection = productCard.querySelector('.product-card__description-expanded');
        
        if (expandedSection) {
            expandedSection.style.display = 'none';
        }
        
        // Restaurar completamente el estado original
        productCard.style.removeProperty('height');
        productCard.style.removeProperty('min-height');
        productCard.style.removeProperty('z-index');
        productCard.removeAttribute('data-expanded');
        
        // Forzar reflow para asegurar que los estilos se apliquen correctamente
        productCard.offsetHeight;
        
        console.log('Cerrando tarjeta individual:', productId);
    }
    
    /**
     * Cierra todas las tarjetas expandidas
     */
    closeAllExpandedCards() {
        const allProductCards = document.querySelectorAll('.product-card[data-expanded="true"]');
        
        allProductCards.forEach(productCard => {
            const expandedSection = productCard.querySelector('.product-card__description-expanded');
            
            if (expandedSection) {
                expandedSection.style.display = 'none';
            }
            
            // Restaurar completamente el estado original
            productCard.style.removeProperty('height');
            productCard.style.removeProperty('min-height');
            productCard.style.removeProperty('z-index');
            productCard.removeAttribute('data-expanded');
            
            console.log('Cerrando tarjeta:', productCard.getAttribute('data-seed-id') || productCard.getAttribute('data-product-id'));
        });
        
        // Forzar reflow para todas las tarjetas
        allProductCards.forEach(card => card.offsetHeight);
    }

    /**
     * Formatea precios
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-AR').format(price);
    }

    /**
     * Muestra error
     */
    showError(message) {
        if (this.DOM.seedsGrid) {
            this.DOM.seedsGrid.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>${message}</p>
                    <button class="btn btn--primary" onclick="location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Función para inicializar cuando los servicios estén listos
function initializeSeedsController() {
    if (window.CartService && window.NotificationService) {
        console.log('🌱 Inicializando SeedsController con servicios disponibles');
        window.seedsController = new SeedsController();
        return true;
    }
    return false;
}

// Inicializar cuando el DOM esté listo y estemos en la página de semillas
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('page--semillas')) {
        console.log('🔄 Intentando inicializar SeedsController...');
        
        // Intentar inicializar inmediatamente
        if (!initializeSeedsController()) {
            console.log('⏳ Servicios no disponibles, esperando...');
            
            // Si no están disponibles, esperar un poco y reintentar
            const interval = setInterval(() => {
                if (initializeSeedsController()) {
                    clearInterval(interval);
                }
            }, 100);
            
            // Timeout después de 5 segundos
            setTimeout(() => {
                clearInterval(interval);
                console.error('❌ Timeout: SeedsController no se pudo inicializar');
            }, 5000);
        }
    }
});
