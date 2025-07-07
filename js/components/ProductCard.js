/**
 * Componente de tarjeta de producto premium
 * @module components/ProductCard
 */

/**
 * Crea una tarjeta de producto con diseño premium
 * @param {Object} product - Datos del producto
 * @param {string} [type='product'] - Tipo de producto (product/seed)
 * @returns {HTMLElement} - Elemento de tarjeta de producto
 */
function createProductCard(product, type = 'product') {
  if (!product) {return null;}

  // Crear elemento de tarjeta
  const card = document.createElement('article');
  card.dataset.id = product.id;
  card.dataset.category = product.categoria || '';
  
  // Determinar si es producto o semilla para la clase CSS
  const isSeed = type.toLowerCase() === 'seed';
  
  if (isSeed) {
    card.className = 'seed-card';
    if (!product.disponible) {
      card.classList.add('seed-card--unavailable');
    }
  } else {
    card.className = 'product-card';
  }

  // Extraer datos del producto
  const {
    nombre = 'Producto sin nombre',
    descripcion = 'Sin descripción disponible',
    precio = 0,
    imagen = 'https://via.placeholder.com/300x300?text=Imagen+no+disponible',
    stock = 0,
    descuento = 0,
    esNuevo = false,
    esOferta = false
  } = product;

  // Formatear precio
  const priceFormatted = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(precio);

  // Calcular precio con descuento si aplica
  let priceWithDiscount = '';
  if (descuento > 0 && descuento < 100) {
    const discountAmount = (precio * descuento) / 100;
    const finalPrice = precio - discountAmount;
    priceWithDiscount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(finalPrice);
  }

  // Crear el HTML específico para cada tipo
  if (isSeed) {
    card.innerHTML = createSeedCardHTML(product, priceFormatted, priceWithDiscount);
  } else {
    card.innerHTML = createProductCardHTML(product, priceFormatted, priceWithDiscount, esNuevo, esOferta, descuento, stock);
  }

  // Agregar eventos
  const addToCartBtn = card.querySelector('[data-action="add-to-cart"]');
  if (addToCartBtn) {
    addToCartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Verificar que los servicios estén disponibles
      const cartService = window.cartService || window.CartService;
      const notificationService = window.notificationService || window.NotificationService;
      
      if (!cartService) {
        console.error('CartService no disponible');
        alert('Error: Servicio de carrito no disponible');
        return;
      }
      
      if (stock > 0) {
        const result = cartService.addItem({
          id: product.id,
          name: nombre,
          price: precio,
          image: imagen,
          category: product.categoria || 'Sin categoría'
        }, 1);
        
        if (result.success) {
          if (notificationService) {
            notificationService.success('Producto agregado al carrito');
          } else {
            alert('Producto agregado al carrito');
          }
          // Actualizar el botón para mostrar que está en el carrito
          addToCartBtn.innerHTML = '<i class="fas fa-check"></i> En carrito';
          addToCartBtn.disabled = true;
          addToCartBtn.classList.remove('btn--primary');
          addToCartBtn.classList.add('btn--secondary');
        } else {
          if (notificationService) {
            notificationService.error(result.error || 'Error al agregar al carrito');
          } else {
            alert(result.error || 'Error al agregar al carrito');
          }
        }
      } else {
        if (notificationService) {
          notificationService.warning('Producto sin stock');
        } else {
          alert('Producto sin stock');
        }
      }
    });
  }

  // Agregar evento para vista rápida
  const quickViewBtn = card.querySelector('[data-action="quick-view"]');
  if (quickViewBtn) {
    quickViewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Disparar evento personalizado para vista rápida
      const event = new CustomEvent('quickView', { 
        detail: { productId: product.id } 
      });
      document.dispatchEvent(event);
    });
  }

  return card;
}

/**
 * Renderiza una lista de productos en un contenedor
 * @param {Array} products - Lista de productos
 * @param {HTMLElement} container - Contenedor donde se renderizarán las tarjetas
 * @param {string} [type='product'] - Tipo de producto (product/seed)
 */
function renderProductList(products, container, type = 'product') {
  if (!container || !Array.isArray(products)) {return;}
  
  // Limpiar contenedor
  container.innerHTML = '';
  
  if (products.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search no-results__icon"></i>
        <h3 class="no-results__title">No se encontraron productos</h3>
        <p class="no-results__message">Intenta con otros criterios de búsqueda o filtros.</p>
      </div>
    `;
    return;
  }
  
  // Crear y agregar tarjetas al contenedor
  const fragment = document.createDocumentFragment();
  products.forEach((product) => {
    const card = createProductCard(product, type);
    if (card) {
      fragment.appendChild(card);
    }
  });
  
  container.appendChild(fragment);
}

/**
 * Crea el HTML para una tarjeta de producto
 * @param {Object} product - Datos del producto
 * @param {string} priceFormatted - Precio formateado
 * @param {string} priceWithDiscount - Precio con descuento formateado
 * @param {boolean} esNuevo - Si es producto nuevo
 * @param {boolean} esOferta - Si está en oferta
 * @param {number} descuento - Porcentaje de descuento
 * @param {number} stock - Cantidad en stock
 * @returns {string} HTML de la tarjeta
 */
function createProductCardHTML(product, priceFormatted, priceWithDiscount, esNuevo, esOferta, descuento, stock) {
  const { nombre, descripcion, imagen, categoria } = product;
  
  return `
    <div class="product-card__image-container">
      <img 
        src="${imagen}" 
        alt="${nombre}" 
        class="product-card__image" 
        loading="lazy"
        onerror="this.onerror=null; this.src='https://via.placeholder.com/300x300?text=Imagen+no+disponible'"
      >
      ${esNuevo ? '<span class="product-card__badge product-card__badge--new">Nuevo</span>' : ''}
      ${esOferta ? '<span class="product-card__badge product-card__badge--sale">Oferta</span>' : ''}
      ${descuento > 0 ? `<span class="product-card__discount">-${descuento}%</span>` : ''}
    </div>
    
    <div class="product-card__content">
      ${categoria ? `<span class="product-card__category">${categoria}</span>` : ''}
      
      <h3 class="product-card__title">${nombre}</h3>
      
      <div class="product-card__description">
        ${descripcion.length > 100 ? `${descripcion.substring(0, 100)}...` : descripcion}
      </div>
      
      <div class="product-card__footer">
        <div class="product-card__pricing">
          ${priceWithDiscount ? `
            <span class="product-card__price-original">${priceFormatted}</span>
            <span class="product-card__price">${priceWithDiscount}</span>
          ` : `
            <span class="product-card__price">${priceFormatted}</span>
          `}
        </div>
        
        <div class="product-card__actions">
          <button 
            class="btn btn--primary product-card__add-to-cart" 
            data-action="add-to-cart" 
            data-product-id="${product.id}"
            ${stock <= 0 ? 'disabled' : ''}
          >
            <i class="fas ${stock > 0 ? 'fa-shopping-cart' : 'fa-times-circle'}"></i>
            ${stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
          </button>
          <button class="product-card__action-btn" aria-label="Añadir a favoritos">
            <i class="far fa-heart"></i>
          </button>
          <button class="product-card__action-btn" aria-label="Ver detalles">
            <i class="far fa-eye"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Crea el HTML para una tarjeta de semilla con información detallada
 * @param {Object} seed - Datos de la semilla
 * @param {string} priceFormatted - Precio formateado
 * @param {string} priceWithDiscount - Precio con descuento formateado
 * @returns {string} HTML de la tarjeta
 */
function createSeedCardHTML(seed, priceFormatted, priceWithDiscount) {
  const {
    nombre,
    descripcion,
    imagen,
    banco,
    genetica,
    thc,
    cbd,
    efectos = [],
    calificacion,
    reviews,
    tiempoFloracion,
    rendimiento,
    disponible = true,
    destacado = false,
    precioOriginal
  } = seed;

  // Crear estrellas de calificación
  const stars = createStarRating(calificacion || 0);
  
  // Crear badges
  const badges = [];
  if (destacado) {badges.push('<span class="seed-card__badge seed-card__badge--featured">Destacado</span>');}
  if (precioOriginal && precioOriginal > seed.precio) {badges.push('<span class="seed-card__badge seed-card__badge--sale">Oferta</span>');}
  if (!disponible) {badges.push('<span class="seed-card__badge seed-card__badge--unavailable">Agotado</span>');}
  
  return `
    <div class="seed-card__image-container">
      <img 
        src="${imagen}" 
        alt="${nombre}" 
        class="seed-card__image" 
        loading="lazy"
        onerror="this.onerror=null; this.src='imagenes/Logo.png'"
      >
      
      ${badges.length > 0 ? `
        <div class="seed-card__badges">
          ${badges.join('')}
        </div>
      ` : ''}
      
      ${genetica ? `
        <div class="seed-card__genetics-badge seed-card__genetics-badge--${genetica}">
          ${genetica.charAt(0).toUpperCase() + genetica.slice(1)}
        </div>
      ` : ''}
    </div>
    
    <div class="seed-card__content">
      <div class="seed-card__header">
        ${banco ? `<span class="seed-card__bank">${banco}</span>` : ''}
        
        ${calificacion && reviews ? `
          <div class="seed-card__rating">
            <div class="seed-card__stars">${stars}</div>
            <span class="seed-card__reviews">(${reviews})</span>
          </div>
        ` : ''}
      </div>
      
      <h3 class="seed-card__title">${nombre}</h3>
      
      <div class="seed-card__description">
        ${descripcion || 'Sin descripción disponible'}
      </div>
      
      ${(thc || cbd || tiempoFloracion) ? `
        <div class="seed-card__specs">
          ${thc ? `
            <div class="seed-card__spec">
              <span class="seed-card__spec-label">THC</span>
              <span class="seed-card__spec-value">${thc}%</span>
            </div>
          ` : ''}
          ${cbd ? `
            <div class="seed-card__spec">
              <span class="seed-card__spec-label">CBD</span>
              <span class="seed-card__spec-value">${cbd}%</span>
            </div>
          ` : ''}
          ${tiempoFloracion ? `
            <div class="seed-card__spec">
              <span class="seed-card__spec-label">Floración</span>
              <span class="seed-card__spec-value">${tiempoFloracion}</span>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      ${efectos.length > 0 ? `
        <div class="seed-card__effects">
          ${efectos.slice(0, 3).map((efecto) => `
            <span class="seed-card__effect">${efecto}</span>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="seed-card__footer">
        <div class="seed-card__pricing">
          ${precioOriginal && precioOriginal > seed.precio ? `
            <span class="seed-card__original-price">$${precioOriginal.toLocaleString()}</span>
          ` : ''}
          <span class="seed-card__price">${priceFormatted}</span>
        </div>
        
        <div class="seed-card__actions">
          <button 
            class="seed-card__add-to-cart" 
            data-action="add-to-cart" 
            data-product-id="${seed.id}"
            ${!disponible ? 'disabled' : ''}
          >
            <i class="fas ${disponible ? 'fa-shopping-cart' : 'fa-times-circle'}"></i>
            ${disponible ? 'Agregar al carrito' : 'No disponible'}
          </button>
          
          <button class="seed-card__action-btn" aria-label="Añadir a favoritos">
            <i class="far fa-heart"></i>
          </button>
          
          <button class="seed-card__action-btn" aria-label="Ver detalles">
            <i class="far fa-eye"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Crea el HTML para las estrellas de calificación
 * @param {number} rating - Calificación (0-5)
 * @returns {string} HTML de las estrellas
 */
function createStarRating(rating) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  // Estrellas llenas
  for (let i = 0; i < fullStars; i++) {
    stars.push('<i class="fas fa-star"></i>');
  }
  
  // Media estrella
  if (hasHalfStar) {
    stars.push('<i class="fas fa-star-half-alt"></i>');
  }
  
  // Estrellas vacías
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push('<i class="far fa-star"></i>');
  }
  
  return stars.join('');
}

/**
 * Inicializa los componentes de tarjetas de producto
 * @param {string} [containerSelector='.products-grid'] - Selector del contenedor de productos
 * @param {string} [type='product'] - Tipo de producto (product/seed)
 */
function initProductCards(containerSelector = '.products-grid', type = 'product') {
  const containers = document.querySelectorAll(containerSelector);
  if (!containers.length) {return;}
  
  containers.forEach((container) => {
    // Si el contenedor ya tiene tarjetas, inicializar eventos
    const cards = container.querySelectorAll('.product-card, .seed-card');
    if (cards.length > 0) {
      cards.forEach((card) => {
        const productId = card.dataset.id;
        const addToCartBtn = card.querySelector('[data-action="add-to-cart"]');
        
        if (addToCartBtn) {
          addToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Aquí podrías obtener más datos del producto si es necesario
            cartService.addToCart(productId, 1);
            
            // Mostrar notificación
            if (notificationService) {
              notificationService.success('Producto agregado al carrito');
            }
          });
        }
      });
    }
  });
}

// Hacer las funciones disponibles globalmente
if (typeof window !== 'undefined') {
  window.createProductCard = createProductCard;
  window.renderProductList = renderProductList;
  window.initProductCards = initProductCards;
}
