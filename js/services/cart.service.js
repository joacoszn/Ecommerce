/**
 * CART SERVICE - Patrón Singleton + Observer
 * Servicio robusto para manejar el carrito de compras
 * @author THC Growshop
 * @version 2.0.0
 */

class CartService {
    constructor() {
        if (CartService.instance) {
            return CartService.instance;
        }
        
        this.storageKey = 'thc_growshop_cart';
        this.observers = new Set();
        
        // ✅ CORREGIDO: Inicializar config ANTES de loadCart
        this.config = {
            maxQuantityPerItem: 99,
            freeShippingThreshold: 50000,
            maxItemsInCart: 50
        };
        
        this.cart = this.loadCart();
        
        CartService.instance = this;
        return this;
    }

    /**
     * Carga el carrito desde localStorage con validación
     */
    loadCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                
                // Validar estructura del carrito
                if (this.isValidCartStructure(parsed)) {
                    const validatedCart = this.validateCartData(parsed);
                    this.recalculateCart(validatedCart);
                    return validatedCart;
                }
            }
        } catch (error) {
            console.error('Error loading cart from localStorage:', error);
            this.clearStorage();
        }
        
        return this.createEmptyCart();
    }

    /**
     * Valida la estructura del carrito
     */
    isValidCartStructure(cart) {
        return cart && 
               typeof cart === 'object' && 
               Array.isArray(cart.items) &&
               typeof cart.subtotal === 'number' &&
               typeof cart.total === 'number';
    }

    /**
     * Valida y limpia los datos del carrito
     */
    validateCartData(cart) {
        const validatedItems = cart.items
            .filter((item) => this.isValidCartItem(item))
            .map((item) => this.sanitizeCartItem(item))
            .slice(0, this.config.maxItemsInCart);

        return {
            items: validatedItems,
            subtotal: 0,
            discount: cart.discount || 0,
            shipping: cart.shipping || 0,
            total: 0,
            totalItems: 0,
            appliedCoupon: cart.appliedCoupon || null,
            lastUpdated: Date.now()
        };
    }

    /**
     * Valida un item individual del carrito
     */
    isValidCartItem(item) {
        return item &&
               typeof item.id === 'string' &&
               typeof item.name === 'string' &&
               typeof item.price === 'number' &&
               typeof item.quantity === 'number' &&
               item.quantity > 0;
    }

    /**
     * Sanitiza un item del carrito
     */
    sanitizeCartItem(item) {
        return {
            id: String(item.id),
            name: String(item.name).trim(),
            price: Math.max(0, Number(item.price)),
            originalPrice: item.originalPrice ? Math.max(0, Number(item.originalPrice)) : null,
            image: String(item.image || ''),
            category: String(item.category || ''),
            variant: item.variant ? String(item.variant) : null,
            quantity: Math.min(this.config.maxQuantityPerItem, Math.max(1, parseInt(item.quantity)))
        };
    }

    /**
     * Crea un carrito vacío
     */
    createEmptyCart() {
        return {
            items: [],
            subtotal: 0,
            discount: 0,
            shipping: 0,
            total: 0,
            totalItems: 0,
            appliedCoupon: null,
            lastUpdated: Date.now()
        };
    }

    /**
     * Recalcula todos los valores del carrito
     */
    recalculateCart(cart = this.cart) {
        // Calcular subtotal
        cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Calcular total de items
        cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        // Aplicar descuento
        let discountAmount = 0;
        if (cart.appliedCoupon) {
            if (cart.appliedCoupon.type === 'percentage') {
                discountAmount = cart.subtotal * cart.appliedCoupon.discount;
            } else if (cart.appliedCoupon.type === 'fixed') {
                discountAmount = Math.min(cart.appliedCoupon.discount, cart.subtotal);
            }
        }
        cart.discount = discountAmount;
        
        // Calcular envío
        const subtotalAfterDiscount = cart.subtotal - cart.discount;
        cart.shipping = subtotalAfterDiscount >= this.config.freeShippingThreshold ? 0 : 2500;
        
        // Calcular total final
        cart.total = Math.max(0, cart.subtotal - cart.discount + cart.shipping);
        
        return cart;
    }

    /**
     * Guarda el carrito en localStorage
     */
    saveCart() {
        try {
            this.cart.lastUpdated = Date.now();
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
            this.notifyObservers('cart:updated', this.cart);
            
            // Dispatch evento global
            document.dispatchEvent(new CustomEvent('cart:updated', {
                detail: this.getCart()
            }));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
            this.notifyObservers('cart:error', { error: 'Failed to save cart' });
        }
    }

    /**
     * Patrón Observer - Agregar observador
     */
    subscribe(observer) {
        if (typeof observer === 'function') {
            this.observers.add(observer);
            return () => this.observers.delete(observer); // Retorna función de cleanup
        }
        throw new Error('Observer must be a function');
    }

    /**
     * Patrón Observer - Notificar observadores
     */
    notifyObservers(event, data) {
        this.observers.forEach((observer) => {
            try {
                observer(event, data);
            } catch (error) {
                console.error('Error in cart observer:', error);
            }
        });
    }

    /**
     * Agrega un producto al carrito con validaciones
     */
    addItem(product, quantity = 1, options = {}) {
        try {
            // Validaciones
            if (!this.isValidProduct(product)) {
                throw new Error('Invalid product data');
            }
            
            if (quantity < 1 || quantity > this.config.maxQuantityPerItem) {
                throw new Error(`Quantity must be between 1 and ${this.config.maxQuantityPerItem}`);
            }
            
            if (this.cart.items.length >= this.config.maxItemsInCart) {
                throw new Error(`Cannot add more than ${this.config.maxItemsInCart} different items`);
            }
            
            const existingItem = this.cart.items.find((item) => 
                item.id === product.id && 
                item.variant === (options.variant || null)
            );
            
            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > this.config.maxQuantityPerItem) {
                    throw new Error(`Cannot exceed ${this.config.maxQuantityPerItem} units of the same product`);
                }
                existingItem.quantity = newQuantity;
            } else {
                const cartItem = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice || null,
                    image: product.image || '',
                    category: product.category || '',
                    variant: options.variant || null,
                    quantity
                };
                
                this.cart.items.push(cartItem);
            }
            
            this.recalculateCart();
            this.saveCart();
            
            // Notificar específicamente sobre item agregado
            const addedItem = existingItem || this.cart.items[this.cart.items.length - 1];
            this.notifyObservers('cart:item-added', addedItem);
            
            document.dispatchEvent(new CustomEvent('cart:item-added', {
                detail: addedItem
            }));
            
            return { success: true, item: addedItem };
            
        } catch (error) {
            console.error('Error adding item to cart:', error);
            this.notifyObservers('cart:error', { error: error.message });
            return { success: false, error: error.message };
        }
    }

    /**
     * Valida un producto
     */
    isValidProduct(product) {
        return product &&
               typeof product.id === 'string' &&
               typeof product.name === 'string' &&
               typeof product.price === 'number' &&
               product.price >= 0;
    }

    /**
     * Elimina un producto del carrito
     */
    removeItem(productId, variant = null) {
        try {
            const itemIndex = this.cart.items.findIndex((item) => 
                item.id === productId && item.variant === variant
            );
            
            if (itemIndex === -1) {
                return { success: false, error: 'Item not found' };
            }
            
            const removedItem = this.cart.items.splice(itemIndex, 1)[0];
            this.recalculateCart();
            this.saveCart();
            
            this.notifyObservers('cart:item-removed', removedItem);
            
            document.dispatchEvent(new CustomEvent('cart:item-removed', {
                detail: removedItem
            }));
            
            return { success: true, item: removedItem };
            
        } catch (error) {
            console.error('Error removing item from cart:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Actualiza la cantidad de un producto
     */
    updateQuantity(productId, quantity, variant = null) {
        try {
            if (quantity < 0 || quantity > this.config.maxQuantityPerItem) {
                throw new Error(`Quantity must be between 0 and ${this.config.maxQuantityPerItem}`);
            }
            
            const item = this.cart.items.find((item) => 
                item.id === productId && item.variant === variant
            );
            
            if (!item) {
                return { success: false, error: 'Item not found' };
            }
            
            if (quantity === 0) {
                return this.removeItem(productId, variant);
            }
            
            const oldQuantity = item.quantity;
            item.quantity = quantity;
            
            this.recalculateCart();
            this.saveCart();
            
            this.notifyObservers('cart:quantity-updated', {
                item,
                oldQuantity,
                newQuantity: quantity
            });
            
            return { success: true, item };
            
        } catch (error) {
            console.error('Error updating quantity:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Aplica un cupón de descuento
     */
    applyCoupon(code, discount, type = 'percentage') {
        try {
            if (!code || typeof discount !== 'number') {
                throw new Error('Invalid coupon data');
            }
            
            const coupon = {
                code,
                discount,
                type // 'percentage' o 'fixed'
            };
            
            this.cart.appliedCoupon = coupon;
            
            this.recalculateCart();
            this.saveCart();
            
            this.notifyObservers('cart:coupon-applied', coupon);
            
            return { success: true, coupon };
            
        } catch (error) {
            console.error('Error applying coupon:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Remueve el cupón aplicado
     */
    removeCoupon() {
        const removedCoupon = this.cart.appliedCoupon;
        this.cart.appliedCoupon = null;
        this.recalculateCart();
        this.saveCart();
        
        this.notifyObservers('cart:coupon-removed', removedCoupon);
        
        return { success: true, removedCoupon };
    }

    /**
     * Obtiene un item específico del carrito
     */
    getItem(productId, variant = null) {
        return this.cart.items.find((item) => 
            item.id === productId && item.variant === variant
        );
    }

    /**
     * Obtiene la cantidad de un item específico
     */
    getItemQuantity(productId, variant = null) {
        const item = this.getItem(productId, variant);
        return item ? item.quantity : 0;
    }

    /**
     * Verifica si un producto está en el carrito
     */
    hasItem(productId, variant = null) {
        return this.getItem(productId, variant) !== undefined;
    }

    /**
     * Obtiene el carrito completo (copia inmutable)
     */
    getCart() {
        return {
            items: this.cart.items.map((item) => ({ ...item })),
            subtotal: this.cart.subtotal,
            discount: this.cart.discount,
            shipping: this.cart.shipping,
            total: this.cart.total,
            totalItems: this.cart.totalItems,
            appliedCoupon: this.cart.appliedCoupon ? { ...this.cart.appliedCoupon } : null,
            lastUpdated: this.cart.lastUpdated
        };
    }

    /**
     * Verifica si el carrito está vacío
     */
    isEmpty() {
        return this.cart.items.length === 0;
    }

    /**
     * Limpia el carrito completamente
     */
    clear() {
        const oldCart = this.getCart();
        
        // En lugar de asignar directamente, modificamos las propiedades existentes
        // para evitar conflictos con Object.freeze()
        const emptyCart = this.createEmptyCart();
        
        // Vaciar el array de items
        this.cart.items.length = 0;
        
        // Resetear todas las propiedades numéricas
        this.cart.subtotal = emptyCart.subtotal;
        this.cart.discount = emptyCart.discount;
        this.cart.shipping = emptyCart.shipping;
        this.cart.total = emptyCart.total;
        this.cart.totalItems = emptyCart.totalItems;
        this.cart.appliedCoupon = emptyCart.appliedCoupon;
        this.cart.lastUpdated = emptyCart.lastUpdated;
        
        this.saveCart();
        
        this.notifyObservers('cart:cleared', oldCart);
        
        document.dispatchEvent(new CustomEvent('cart:cleared', {
            detail: oldCart
        }));
        
        return { success: true };
    }

    /**
     * Limpia el localStorage
     */
    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.error('Error clearing cart storage:', error);
        }
    }

    /**
     * Obtiene estadísticas del carrito
     */
    getStats() {
        return {
            totalItems: this.cart.totalItems,
            uniqueItems: this.cart.items.length,
            subtotal: this.cart.subtotal,
            savings: this.cart.discount,
            shipping: this.cart.shipping,
            total: this.cart.total,
            hasDiscount: this.cart.discount > 0,
            hasFreeShipping: this.cart.shipping === 0,
            remainingForFreeShipping: Math.max(0, this.config.freeShippingThreshold - (this.cart.subtotal - this.cart.discount))
        };
    }
}

// Crear y exportar instancia singleton
if (typeof window !== 'undefined') {
    if (!window.CartService) {
        window.CartService = new CartService();
    }
    
    // Hacer disponible como cartService también
    if (!window.cartService) {
        window.cartService = window.CartService;
    }
    
    // Congelar el objeto para prevenir modificaciones
    Object.freeze(window.CartService);
}
