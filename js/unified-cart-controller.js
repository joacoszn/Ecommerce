/**
 * UNIFIED CART CONTROLLER - Sistema Unificado del Carrito
 * Soluciona todos los problemas de persistencia y eventos del carrito
 * Incluye funcionalidades consolidadas de cart.js
 * @author THC Growshop  
 * @version 4.0.0
 */

class UnifiedCartController {
    constructor() {
        this.cartService = null;
        this.notificationService = null;
        this.isInitialized = false;
        this.initAttempts = 0;
        this.maxInitAttempts = 50;
        
        // Estado para funcionalidades específicas del carrito
        this.state = {
            appliedCoupon: null,
            isLoading: false
        };
        
        // Cache de elementos DOM (será llenado si estamos en carrito.html)
        this.DOM = {};
        
        console.log('🔄 UnifiedCartController: Iniciando...');
        this.init();
    }

    /**
     * Inicialización del controlador
     */
    init() {
        this.initAttempts++;
        
        // Intentar obtener los servicios
        this.cartService = window.CartService || window.cartService;
        this.notificationService = window.NotificationService || window.notificationService;
        
        console.log(`Intento ${this.initAttempts}: CartService=${!!this.cartService}, NotificationService=${!!this.notificationService}`);
        
        if (this.cartService && this.notificationService) {
            this.setupController();
        } else if (this.initAttempts < this.maxInitAttempts) {
            // Reintentar después de 100ms
            setTimeout(() => this.init(), 100);
        } else {
            console.error('❌ UnifiedCartController: No se pudieron cargar los servicios después de', this.maxInitAttempts, 'intentos');
        }
    }

    /**
     * Configuración principal del controlador
     */
    setupController() {
        if (this.isInitialized) {
            console.log('⚠️ UnifiedCartController ya está inicializado');
            return;
        }

        console.log('✅ UnifiedCartController: Servicios disponibles, configurando...');
        
        this.bindGlobalEvents();
        this.updateCartDisplay();
        this.updateCartButtons();
        
        // Detectar si estamos en la página del carrito
        if (document.body.classList.contains('page--carrito')) {
            console.log('🛒 Detectada página de carrito, inicializando funcionalidades específicas...');
            this.initCartPage();
        }
        
        this.isInitialized = true;
        
        console.log('🎉 UnifiedCartController: Inicializado correctamente');
        
        // Hacer disponible globalmente
        window.unifiedCartController = this;
    }

    /**
     * Vincula eventos globales
     */
    bindGlobalEvents() {
        console.log('🔗 UnifiedCartController: Vinculando eventos globales');
        
        // Delegación de eventos para TODOS los botones de carrito
        document.addEventListener('click', (e) => {
            console.log('👆 UnifiedCartController: Click detectado en:', e.target.tagName, e.target.className);
            
            // Buscar el botón de agregar al carrito más cercano
            const addToCartBtn = e.target.closest('[data-action="add-to-cart"]');
            if (addToCartBtn) {
                console.log('🛒 UnifiedCartController: Botón de carrito detectado!', {
                    button: addToCartBtn,
                    productId: addToCartBtn.dataset.productId,
                    disabled: addToCartBtn.disabled,
                    style: addToCartBtn.style.cssText
                });
                e.preventDefault();
                e.stopPropagation();
                this.handleAddToCart(addToCartBtn);
                return;
            }

            // Manejar botones de cantidad
            const quantityBtn = e.target.closest('[data-action="quantity-increase"], [data-action="quantity-decrease"]');
            if (quantityBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleQuantityChange(quantityBtn);
                return;
            }

            // Manejar botón de vaciar carrito
            const clearCartBtn = e.target.closest('#clear-cart-btn');
            if (clearCartBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleClearCart();
                return;
            }

        // Otros botones de acción
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn && !['add-to-cart', 'quantity-increase', 'quantity-decrease'].includes(actionBtn.dataset.action)) {
            e.preventDefault();
            this.handleOtherActions(actionBtn);
        }
        }, true); // Usar captura para interceptar antes que otros handlers

        // Manejar cambios en inputs de cantidad
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                this.handleQuantityInputChange(e.target);
            }
        });

        // Escuchar eventos del carrito
        document.addEventListener('cart:updated', () => {
            console.log('📢 Evento cart:updated recibido');
            this.updateCartDisplay();
            this.updateCartButtons();
        });

        document.addEventListener('cart:item-added', (e) => {
            console.log('📢 Evento cart:item-added recibido:', e.detail);
            this.handleItemAdded(e.detail);
        });

        document.addEventListener('cart:item-removed', (e) => {
            console.log('📢 Evento cart:item-removed recibido:', e.detail);
            this.handleItemRemoved(e.detail);
        });

        console.log('✅ Eventos globales vinculados correctamente');
    }

    /**
     * Maneja la acción de agregar al carrito
     * @param {HTMLElement} button - Botón que fue clickeado
     */
    handleAddToCart(button) {
        console.log('🛒 handleAddToCart iniciado');
        
        if (!this.cartService || !this.notificationService) {
            console.error('❌ Servicios no disponibles');
            return;
        }

        const productId = button.dataset.productId || button.dataset.seedId;
        if (!productId) {
            console.error('❌ ID del producto no encontrado');
            this.notificationService.error('Error: ID del producto no encontrado');
            return;
        }

        console.log('🔍 Procesando producto ID:', productId);

        // Verificar si ya está en el carrito
        if (this.cartService.hasItem(productId)) {
            console.log('⚠️ Producto ya está en el carrito');
            this.notificationService.warning('Este producto ya está en tu carrito');
            return;
        }

        // Obtener datos del producto
        const productData = this.extractProductData(button);
        if (!productData) {
            console.error('❌ No se pudieron obtener los datos del producto');
            this.notificationService.error('Error al obtener los datos del producto');
            return;
        }

        // Obtener cantidad desde el input
        const quantity = this.getQuantityForProduct(productId);
        console.log('📦 Datos del producto extraídos:', productData, 'Cantidad:', quantity);

        // Agregar al carrito
        const result = this.cartService.addItem(productData, quantity);
        console.log('📊 Resultado del carrito:', result);

        if (result.success) {
            this.updateButtonState(button, true);
            this.notificationService.success(`${productData.name} (${quantity}) agregado al carrito`);
            this.updateCartDisplay();
            this.resetQuantityInput(productId);
            console.log('✅ Producto agregado exitosamente');
        } else {
            this.notificationService.error(result.error || 'Error al agregar al carrito');
            console.error('❌ Error al agregar producto:', result.error);
        }
    }

    /**
     * Maneja cambios en la cantidad usando botones +/-
     * @param {HTMLElement} button - Botón de cantidad
     */
    handleQuantityChange(button) {
        const action = button.dataset.action;
        const productId = button.dataset.productId || button.dataset.seedId;
        const quantityInput = this.getQuantityInput(productId);
        
        if (!quantityInput) {
            console.error('❌ Input de cantidad no encontrado para:', productId);
            return;
        }

        const currentValue = parseInt(quantityInput.value) || 1;
        const min = parseInt(quantityInput.min) || 1;
        const max = parseInt(quantityInput.max) || 99;
        
        let newValue = currentValue;
        
        if (action === 'quantity-increase') {
            newValue = Math.min(currentValue + 1, max);
        } else if (action === 'quantity-decrease') {
            newValue = Math.max(currentValue - 1, min);
        }
        
        quantityInput.value = newValue;
        
        // Actualizar estado de botones
        this.updateQuantityButtons(productId, newValue, min, max);
        
        // Dispatch evento personalizado
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    /**
     * Maneja cambios directos en el input de cantidad
     * @param {HTMLElement} input - Input de cantidad
     */
    handleQuantityInputChange(input) {
        const productId = input.dataset.productId || input.dataset.seedId;
        const value = parseInt(input.value) || 1;
        const min = parseInt(input.min) || 1;
        const max = parseInt(input.max) || 99;
        
        // Validar y corregir valor
        const validValue = Math.max(min, Math.min(max, value));
        
        if (validValue !== value) {
            input.value = validValue;
        }
        
        // Actualizar estado de botones
        this.updateQuantityButtons(productId, validValue, min, max);
    }

    /**
     * Obtiene la cantidad actual para un producto
     * @param {string} productId - ID del producto
     * @returns {number} Cantidad seleccionada
     */
    getQuantityForProduct(productId) {
        const quantityInput = this.getQuantityInput(productId);
        return quantityInput ? (parseInt(quantityInput.value) || 1) : 1;
    }

    /**
     * Obtiene el input de cantidad para un producto
     * @param {string} productId - ID del producto
     * @returns {HTMLElement|null} Input de cantidad
     */
    getQuantityInput(productId) {
        return document.querySelector(`input.quantity-input[data-product-id="${productId}"], input.quantity-input[data-seed-id="${productId}"]`);
    }

    /**
     * Resetea el input de cantidad a 1
     * @param {string} productId - ID del producto
     */
    resetQuantityInput(productId) {
        const quantityInput = this.getQuantityInput(productId);
        if (quantityInput) {
            quantityInput.value = 1;
            this.updateQuantityButtons(productId, 1, 1, 99);
        }
    }

    /**
     * Actualiza el estado de los botones de cantidad
     * @param {string} productId - ID del producto
     * @param {number} value - Valor actual
     * @param {number} min - Valor mínimo
     * @param {number} max - Valor máximo
     */
    updateQuantityButtons(productId, value, min, max) {
        const decreaseBtn = document.querySelector(`[data-action="quantity-decrease"][data-product-id="${productId}"], [data-action="quantity-decrease"][data-seed-id="${productId}"]`);
        const increaseBtn = document.querySelector(`[data-action="quantity-increase"][data-product-id="${productId}"], [data-action="quantity-increase"][data-seed-id="${productId}"]`);
        
        if (decreaseBtn) {
            decreaseBtn.disabled = value <= min;
        }
        
        if (increaseBtn) {
            increaseBtn.disabled = value >= max;
        }
    }

    /**
     * Extrae datos del producto desde el DOM
     * @param {HTMLElement} button - Botón del producto
     * @returns {Object|null} Datos del producto
     */
    extractProductData(button) {
        console.log('🔍 Extrayendo datos del producto...');
        
        const productCard = button.closest('.product-card, .seed-card');
        if (!productCard) {
            console.error('❌ Tarjeta de producto no encontrada');
            return null;
        }

        const productId = button.dataset.productId || button.dataset.seedId;
        const title = productCard.querySelector('.product-card__title, .seed-card__title');
        const image = productCard.querySelector('.product-card__image, .seed-card__image');
        const category = productCard.querySelector('.product-card__category, .seed-card__bank');
        const priceElement = productCard.querySelector('.product-card__price, .seed-card__price');

        if (!title || !productId) {
            console.error('❌ Título o ID no encontrados');
            return null;
        }

        // Extraer precio numérico
        let price = 0;
        if (priceElement) {
            const priceText = priceElement.textContent || priceElement.innerText;
            // Remover todo excepto números y puntos
            const numericPrice = priceText.replace(/[^\d]/g, '');
            price = parseInt(numericPrice) || 0;
        }

        const productData = {
            id: productId,
            name: title.textContent || title.innerText || 'Producto sin nombre',
            price: price,
            image: image ? image.src : 'imagenes/Logo.png',
            category: category ? (category.textContent || category.innerText) : 'Sin categoría'
        };

        console.log('📦 Datos extraídos:', productData);
        return productData;
    }

    /**
     * Actualiza el estado visual del botón
     * @param {HTMLElement} button - Botón a actualizar
     * @param {boolean} inCart - Si está en el carrito
     */
    updateButtonState(button, inCart) {
        const icon = button.querySelector('i');
        const text = button.querySelector('span');

        if (inCart) {
            button.classList.add('product-card__add-to-cart--in-cart', 'seed-card__add-to-cart--in-cart');
            button.disabled = true;
            
            if (icon) {
                icon.className = 'fas fa-check';
            }
            
            if (text) {
                text.textContent = 'En Carrito';
            }
            
            button.setAttribute('aria-label', 'Ya en el carrito');
        } else {
            button.classList.remove('product-card__add-to-cart--in-cart', 'seed-card__add-to-cart--in-cart');
            button.disabled = false;
            
            if (icon) {
                icon.className = 'fas fa-shopping-cart';
            }
            
            if (text) {
                text.textContent = 'Agregar';
            }
            
            button.setAttribute('aria-label', 'Agregar al carrito');
        }
    }

    /**
     * Actualiza todos los botones del carrito en la página
     */
    updateCartButtons() {
        if (!this.cartService) return;
        
        const addToCartButtons = document.querySelectorAll('[data-action="add-to-cart"]');
        console.log(`🔄 Actualizando ${addToCartButtons.length} botones de carrito`);
        
        addToCartButtons.forEach(button => {
            const productId = button.dataset.productId || button.dataset.seedId;
            if (productId) {
                const inCart = this.cartService.hasItem(productId);
                this.updateButtonState(button, inCart);
            }
        });
    }

    /**
     * Actualiza la visualización del carrito (contador)
     */
    updateCartDisplay() {
        if (!this.cartService) return;

        const cart = this.cartService.getCart();
        const cartCounts = document.querySelectorAll('.cart-count, .header__cart-count');
        
        console.log(`🔄 Actualizando contador del carrito: ${cart.totalItems} items`);
        
        cartCounts.forEach(element => {
            element.textContent = cart.totalItems;
            element.style.display = cart.totalItems > 0 ? 'inline' : 'none';
        });
    }

    /**
     * Inicializa la página del carrito (carrito.html)
     */
    initCartPage() {
        console.log('🛒 Inicializando página del carrito...');
        
        // Cachear elementos DOM del carrito
        this.cartElements = {
            cartContainer: document.querySelector('.cart-container'),
            cartItems: document.querySelector('.cart-items'),
            cartTotal: document.querySelector('.cart-total'),
            cartSummary: document.querySelector('.cart-summary'),
            emptyMessage: document.querySelector('.empty-cart-message'),
            clearCartBtn: document.querySelector('.clear-cart-btn'),
            checkoutBtn: document.querySelector('.checkout-btn'),
            couponInput: document.querySelector('.coupon-input'),
            applyCouponBtn: document.querySelector('.apply-coupon-btn'),
            couponMessage: document.querySelector('.coupon-message')
        };

        // Vincular eventos del carrito
        this.bindCartEvents();
        
        // Renderizar el carrito inicial
        this.renderCartPage();
        
        console.log('✅ Página del carrito inicializada');
    }

    /**
     * Vincula eventos específicos de la página del carrito
     */
    bindCartEvents() {
        // Usar delegación de eventos para el botón de vaciar carrito
        document.addEventListener('click', (e) => {
            if (e.target.closest('#clear-cart-btn')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🗑️ Botón vaciar carrito clickeado!');
                this.handleClearCart();
            }
        });
        
        console.log('✅ Delegación de eventos para botón vaciar carrito configurada');

        // Checkout
        if (this.cartElements.checkoutBtn) {
            this.cartElements.checkoutBtn.addEventListener('click', () => {
                this.handleCheckout();
            });
        }

        // Aplicar cupón - vinculación directa
        const couponForm = document.getElementById('coupon-form');
        const couponInput = document.getElementById('coupon-code');
        const couponSubmit = document.querySelector('.coupon-form__submit');
        
        if (couponForm) {
            couponForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyCoupon();
            });
        }
        
        if (couponSubmit) {
            couponSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                this.applyCoupon();
            });
        }

        if (couponInput) {
            couponInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.applyCoupon();
                }
            });
        }

        // Delegar eventos de los items del carrito
        if (this.cartElements.cartItems) {
            this.cartElements.cartItems.addEventListener('click', (e) => {
                this.handleCartItemAction(e);
            });
        }
    }

    /**
     * Renderiza la página completa del carrito
     */
    renderCartPage() {
        if (!this.cartService) return;

        const cart = this.cartService.getCart();
        console.log('🔄 Renderizando página del carrito:', cart);

        if (cart.items.length === 0) {
            this.showEmptyCart();
        } else {
            this.showCartItems(cart);
        }

        this.updateCartSummary(cart);
    }

    /**
     * Muestra mensaje de carrito vacío
     */
    showEmptyCart() {
        const emptyCartSection = document.getElementById('empty-cart');
        const cartContentSection = document.getElementById('cart-content');
        const clearCartBtn = document.getElementById('clear-cart-btn');
        
        if (emptyCartSection) {
            emptyCartSection.style.display = 'block';
        }
        
        if (cartContentSection) {
            cartContentSection.style.display = 'none';
        }
        
        if (clearCartBtn) {
            clearCartBtn.style.display = 'none';
        }
    }

    /**
     * Muestra los items del carrito
     * @param {Object} cart - Datos del carrito
     */
    showCartItems(cart) {
        const emptyCartSection = document.getElementById('empty-cart');
        const cartContentSection = document.getElementById('cart-content');
        const clearCartBtn = document.getElementById('clear-cart-btn');
        const cartItemsList = document.getElementById('cart-items-list');
        const cartItemsCount = document.getElementById('cart-items-count');
        
        if (emptyCartSection) {
            emptyCartSection.style.display = 'none';
        }
        
        if (cartContentSection) {
            cartContentSection.style.display = 'block';
        }
        
        if (clearCartBtn) {
            clearCartBtn.style.display = 'inline-flex';
        }
        
        if (cartItemsCount) {
            cartItemsCount.textContent = cart.totalItems;
        }

        if (cartItemsList) {
            cartItemsList.innerHTML = cart.items.map(item => this.createCartItemHTML(item)).join('');
            
            // Re-vincular eventos después de actualizar el HTML
            setTimeout(() => {
                this.bindCartItemEvents();
            }, 100);
        }
    }

    /**
     * Vincula eventos específicos de los items del carrito
     */
    bindCartItemEvents() {
        const cartItemsList = document.getElementById('cart-items-list');
        if (cartItemsList) {
            // Usar delegación de eventos para los botones de cantidad y eliminar
            cartItemsList.addEventListener('click', (e) => {
                this.handleCartItemAction(e);
            });
            console.log('✅ Eventos de items del carrito vinculados');
        }
    }

    /**
     * Crea el HTML para un item del carrito
     * @param {Object} item - Item del carrito
     * @returns {string} HTML del item
     */
    createCartItemHTML(item) {
        const formattedPrice = this.formatPrice(item.price);
        const formattedSubtotal = this.formatPrice(item.price * item.quantity);
        const categoryDisplay = item.category ? `<p class="cart-item__details">${item.category}</p>` : '';
        
        return `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${item.image}" alt="${item.name}" class="cart-item__image" loading="lazy" />
                
                <div class="cart-item__info">
                    <h3 class="cart-item__name">${item.name}</h3>
                    ${categoryDisplay}
                    <div class="cart-item__price">${formattedPrice} c/u</div>
                </div>
                
                <div class="cart-item__quantity">
                    <button class="quantity-btn" data-action="decrease-quantity" data-product-id="${item.id}" aria-label="Disminuir cantidad">
                        <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="99" data-product-id="${item.id}" readonly />
                    <button class="quantity-btn" data-action="increase-quantity" data-product-id="${item.id}" aria-label="Aumentar cantidad">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                
                <div class="cart-item__actions">
                    <div class="cart-item__subtotal">
                        <strong>${formattedSubtotal}</strong>
                        <small>Subtotal</small>
                    </div>
                    <button class="cart-item__remove" data-action="remove-item" data-product-id="${item.id}" aria-label="Eliminar producto">
                        <i class="fas fa-trash-alt"></i>
                        <span>Eliminar</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Actualiza el resumen del carrito
     * @param {Object} cart - Datos del carrito
     */
    updateCartSummary(cart) {
        // Actualizar elementos del resumen con formato mejorado
        const subtotalElement = document.getElementById('cart-subtotal');
        if (subtotalElement) {
            subtotalElement.textContent = this.formatPrice(cart.subtotal);
        }

        const discountElement = document.getElementById('cart-discount');
        const discountRow = document.getElementById('discount-row');
        if (cart.discount > 0) {
            if (discountElement) {
                discountElement.textContent = `-${this.formatPrice(cart.discount)}`;
            }
            if (discountRow) {
                discountRow.style.display = 'flex';
            }
        } else {
            if (discountRow) {
                discountRow.style.display = 'none';
            }
        }

        const shippingElement = document.getElementById('cart-shipping');
        if (shippingElement) {
            shippingElement.textContent = cart.shipping > 0 ? this.formatPrice(cart.shipping) : 'Gratis';
        }

        const totalElement = document.getElementById('cart-total');
        if (totalElement) {
            totalElement.textContent = this.formatPrice(cart.total);
        }

        // Actualizar progreso de envío gratis
        this.updateFreeShippingProgress(cart);

        // Habilitar/deshabilitar botón de checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = cart.items.length === 0;
        }
    }

    /**
     * Actualiza el progreso de envío gratis
     * @param {Object} cart - Datos del carrito
     */
    updateFreeShippingProgress(cart) {
        const freeShippingThreshold = 50000; // $50.000 para envío gratis
        const currentTotal = cart.subtotal - cart.discount;
        const remaining = Math.max(0, freeShippingThreshold - currentTotal);
        const progress = Math.min(100, (currentTotal / freeShippingThreshold) * 100);

        const messageElement = document.getElementById('free-shipping-message');
        const remainingElement = document.getElementById('free-shipping-remaining');
        const progressBarFill = document.getElementById('progress-bar-fill');

        if (remaining > 0) {
            if (messageElement) {
                messageElement.innerHTML = `Agrega ${this.formatPrice(remaining)} más para <strong>envío gratis</strong>`;
            }
        } else {
            if (messageElement) {
                messageElement.innerHTML = '¡<strong>Envío gratis</strong> incluido!';
            }
        }

        if (remainingElement) {
            remainingElement.textContent = this.formatPrice(remaining);
        }

        if (progressBarFill) {
            progressBarFill.style.width = `${progress}%`;
        }
    }

    /**
     * Maneja acciones en items del carrito
     * @param {Event} e - Evento de clic
     */
    handleCartItemAction(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const productId = button.dataset.productId;

        console.log('🔄 Acción del carrito:', { action, productId, button });

        if (!productId) {
            console.warn('⚠️ No se encontró productId para la acción:', action);
            return;
        }

        switch (action) {
            case 'remove-item':
                console.log('🗑️ Eliminando item:', productId);
                this.removeItem(productId);
                break;
            case 'increase-quantity':
            case 'quantity-increase':
                console.log('➕ Aumentando cantidad:', productId);
                this.increaseQuantity(productId);
                break;
            case 'decrease-quantity':
            case 'quantity-decrease':
                console.log('➖ Disminuyendo cantidad:', productId);
                this.decreaseQuantity(productId);
                break;
            default:
                console.log('❓ Acción desconocida:', action);
        }
    }

    /**
     * Elimina un item del carrito
     * @param {string} productId - ID del producto
     */
    removeItem(productId) {
        if (this.cartService) {
            this.cartService.removeItem(productId);
            this.renderCartPage();
            this.updateCartDisplay();
            this.notificationService.success('Producto eliminado del carrito');
        }
    }

    /**
     * Vacía todo el carrito
     */
    handleClearCart() {
        if (!this.cartService) {
            console.error('❌ CartService no disponible');
            return;
        }

        const cart = this.cartService.getCart();
        if (cart.items.length === 0) {
            this.notificationService.warning('El carrito ya está vacío');
            return;
        }

        // Mostrar confirmación
        if (confirm('¿Estás seguro de que quieres vaciar todo el carrito? Esta acción no se puede deshacer.')) {
            this.cartService.clear();
            this.renderCartPage();
            this.updateCartDisplay();
            this.notificationService.success('Carrito vaciado exitosamente');
            console.log('🗑️ Carrito vaciado por el usuario');
        }
    }

    /**
     * Aumenta la cantidad de un item
     * @param {string} productId - ID del producto
     */
    increaseQuantity(productId) {
        if (!this.cartService) {
            console.error('❌ CartService no disponible');
            return;
        }
        
        const item = this.cartService.getItem(productId);
        if (item) {
            const newQuantity = item.quantity + 1;
            const result = this.cartService.updateQuantity(productId, newQuantity);
            
            if (result.success) {
                console.log('✅ Cantidad aumentada:', productId, 'Nueva cantidad:', newQuantity);
                this.renderCartPage();
                this.updateCartDisplay();
            } else {
                console.error('❌ Error aumentando cantidad:', result.error);
                if (this.notificationService) {
                    this.notificationService.error(result.error);
                }
            }
        }
    }

    /**
     * Disminuye la cantidad de un item
     * @param {string} productId - ID del producto
     */
    decreaseQuantity(productId) {
        if (!this.cartService) {
            console.error('❌ CartService no disponible');
            return;
        }
        
        const item = this.cartService.getItem(productId);
        if (item) {
            if (item.quantity > 1) {
                const newQuantity = item.quantity - 1;
                const result = this.cartService.updateQuantity(productId, newQuantity);
                
                if (result.success) {
                    console.log('✅ Cantidad disminuida:', productId, 'Nueva cantidad:', newQuantity);
                    this.renderCartPage();
                    this.updateCartDisplay();
                } else {
                    console.error('❌ Error disminuyendo cantidad:', result.error);
                    if (this.notificationService) {
                        this.notificationService.error(result.error);
                    }
                }
            } else {
                // Si la cantidad es 1, eliminar el item
                console.log('🗑️ Eliminando item porque cantidad es 1:', productId);
                this.removeItem(productId);
            }
        }
    }

    /**
     * Aplica un cupón de descuento
     */
    applyCoupon() {
        const couponInput = document.getElementById('coupon-code');
        if (!couponInput) return;

        const couponCode = couponInput.value.trim();
        if (!couponCode) {
            this.showCouponMessage('Por favor ingresa un código de cupón', 'error');
            return;
        }

        // Aquí puedes implementar la lógica de validación de cupones
        // Por ahora, simulamos algunos cupones válidos
        const validCoupons = {
            'DESCUENTO10': { discount: 0.10, type: 'percentage' },
            'SAVE20': { discount: 0.20, type: 'percentage' },
            'PROMO15': { discount: 0.15, type: 'percentage' },
            'FIJO5000': { discount: 5000, type: 'fixed' }
        };

        const coupon = validCoupons[couponCode.toUpperCase()];
        if (coupon) {
            const result = this.cartService.applyCoupon(couponCode.toUpperCase(), coupon.discount, coupon.type);
            
            if (result.success) {
                if (coupon.type === 'percentage') {
                    this.showCouponMessage(`Cupón aplicado: ${(coupon.discount * 100).toFixed(0)}% de descuento`, 'success');
                } else {
                    this.showCouponMessage(`Cupón aplicado: $${coupon.discount} de descuento`, 'success');
                }
                this.renderCartPage();
            } else {
                this.showCouponMessage('Error al aplicar el cupón', 'error');
            }
        } else {
            this.showCouponMessage('Cupón inválido', 'error');
        }
    }

    /**
     * Muestra mensaje de cupón
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de mensaje ('success' o 'error')
     */
    showCouponMessage(message, type) {
        const couponMessage = document.getElementById('coupon-message');
        if (!couponMessage) {
            console.warn('⚠️ Elemento coupon-message no encontrado');
            return;
        }

        couponMessage.textContent = message;
        couponMessage.className = `coupon-message ${type}`;
        couponMessage.style.display = 'block';

        console.log('💬 Mensaje de cupón mostrado:', message, type);

        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            couponMessage.style.display = 'none';
        }, 5000);
    }

    /**
     * Maneja el proceso de checkout
     */
    handleCheckout() {
        if (!this.cartService) return;

        const cart = this.cartService.getCart();
        if (cart.items.length === 0) {
            this.notificationService.warning('No hay productos en el carrito');
            return;
        }

        // Aquí puedes implementar la lógica de checkout
        // Por ahora, simulamos el proceso
        this.notificationService.info('Redirigiendo al proceso de pago...');
        
        // Ejemplo: redirigir a una página de checkout
        // window.location.href = '/checkout.html';
        
        console.log('🚀 Iniciando checkout con:', cart);
    }

    /**
     * Maneja otras acciones de productos
     * @param {HTMLElement} button - Botón de acción
     */
    handleOtherActions(button) {
        const action = button.dataset.action;
        const productId = button.dataset.productId || button.dataset.seedId;

        switch (action) {
            case 'wishlist':
                this.notificationService.info('Funcionalidad de favoritos próximamente');
                break;
            case 'info':
                this.notificationService.info('Vista detallada próximamente');
                break;
            case 'toggle-info':
            case 'close-info':
                // Delegar al ProductsController o SeedsController según esté disponible
                const controller = window.productsController || window.seedsController;
                if (controller) {
                    if (action === 'toggle-info') {
                        controller.toggleProductInfo(productId);
                    } else if (action === 'close-info') {
                        controller.closeProductInfo(productId);
                    }
                } else {
                    console.warn('Ni ProductsController ni SeedsController disponibles para manejar:', action);
                }
                break;
            case 'quantity-increase':
            case 'quantity-decrease':
                // Delegar al ProductsController si existe
                if (window.productsController) {
                    const delta = action === 'quantity-increase' ? 1 : -1;
                    window.productsController.adjustQuantity(productId, delta);
                } else {
                    console.warn('ProductsController no disponible para manejar:', action);
                }
                break;
            default:
                console.log('Acción no reconocida:', action);
        }
    }

    /**
     * Maneja cuando se agrega un item al carrito
     * @param {Object} item - Item agregado
     */
    handleItemAdded(item) {
        console.log('✅ Item agregado al carrito:', item);
        this.updateCartButtons();
    }

    /**
     * Maneja cuando se elimina un item del carrito
     * @param {Object} item - Item eliminado
     */
    handleItemRemoved(item) {
        console.log('🗑️ Item eliminado del carrito:', item);
        this.updateCartButtons();
    }

    /**
     * Limpia el carrito completamente
     */
    clearCart() {
        if (this.cartService) {
            this.cartService.clear();
            this.updateCartDisplay();
            this.updateCartButtons();
            this.notificationService.success('Carrito vaciado');
        }
    }

    /**
     * Formatea un precio para mostrar
     * @param {number} price - Precio a formatear
     * @returns {string} Precio formateado
     */
    formatPrice(price) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }

    /**
     * Obtiene estadísticas del carrito
     * @returns {Object} Estadísticas del carrito
     */
    getCartStats() {
        return this.cartService ? this.cartService.getStats() : {};
    }

    /**
     * Fuerza una actualización completa
     */
    forceUpdate() {
        console.log('🔄 Forzando actualización completa del carrito');
        this.updateCartDisplay();
        this.updateCartButtons();
    }
}

// Hacer disponible globalmente
window.UnifiedCartController = UnifiedCartController;

// Auto-inicializar cuando el DOM esté listo (INCLUYE carrito.html)
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM listo, iniciando UnifiedCartController...');
    
    // Función para verificar e inicializar
    function tryInitialize() {
        if (window.CartService && window.NotificationService) {
            console.log('🎯 Servicios disponibles, inicializando UnifiedCartController...');
            window.unifiedCartController = new UnifiedCartController();
            return true;
        }
        return false;
    }
    
    // Intentar inicializar inmediatamente
    if (!tryInitialize()) {
        console.log('⏳ Servicios no disponibles, esperando...');
        
        // Reintentar cada 50ms hasta que estén disponibles
        const interval = setInterval(() => {
            if (tryInitialize()) {
                clearInterval(interval);
            }
        }, 50);
        
        // Timeout después de 10 segundos
        setTimeout(() => {
            clearInterval(interval);
            if (!window.unifiedCartController) {
                console.error('❌ TIMEOUT: UnifiedCartController no se pudo inicializar después de 10 segundos');
                console.log('Debug info:', {
                    CartService: !!window.CartService,
                    NotificationService: !!window.NotificationService
                });
            }
        }, 10000);
    }
});
