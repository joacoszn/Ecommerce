/**
 * Clase que representa un producto en la tienda
 * @class
 */
class Producto {
  /**
   * Crea una instancia de Producto
   * @param {Object} config - Configuración del producto
   * @param {string} config.id - Identificador único del producto
   * @param {string} config.nombre - Nombre del producto
   * @param {string} config.categoria - Categoría técnica del producto
   * @param {string} config.categoriaDisplay - Nombre para mostrar de la categoría
   * @param {string} config.descripcion - Descripción detallada
   * @param {number} config.precio - Precio en ARS
   * @param {string} config.imagen - Ruta a la imagen del producto
   * @param {string} [config.alt] - Texto alternativo para la imagen
   */
  constructor({
    id,
    nombre,
    categoria,
    categoriaDisplay,
    descripcion,
    precio,
    imagen,
    alt = nombre,
  }) {
    if (!id || !nombre || !categoria || !categoriaDisplay || !descripcion || precio === undefined || !imagen) {
      throw new Error('Faltan propiedades requeridas para crear un Producto');
    }

    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.categoriaDisplay = categoriaDisplay;
    this.descripcion = descripcion;
    this.precio = Number(precio);
    this.imagen = imagen;
    this.alt = alt;
  }

  /**
   * Formatea el precio según la configuración regional
   * @returns {string} Precio formateado
   * @private
   */
  _formatearPrecio() {
    return this.precio.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    });
  }

  /**
   * Genera el HTML para la tarjeta del producto
   * @returns {string} HTML de la tarjeta
   */
  crearTarjeta() {
    const precioFormateado = this._formatearPrecio();
    const isInCart = window.CartService ? window.CartService.hasItem(this.id) : false;
    const disponible = this.disponible !== false; // Default true if not specified

    return `
      <article class="product-card" data-id="${this.id}" data-categoria="${this.categoria}">
        <div class="product-card__image-container">
          <img 
            src="${this.imagen}" 
            alt="${this.alt}" 
            class="product-card__image" 
            loading="lazy"
            width="300"
            height="200"
            onerror="this.src='imagenes/Logo.png'"
          >
          ${this.destacado ? '<span class="product-card__badge product-card__badge--featured">Destacado</span>' : ''}
        </div>
        <div class="product-card__content">
          <span class="product-card__category">${this.categoriaDisplay}</span>
          <h3 class="product-card__title">${this.nombre}</h3>
          <p class="product-card__description">${this.descripcion}</p>
          <div class="product-card__footer">
            <div class="product-card__pricing">
              <span class="product-card__price">${precioFormateado}</span>
              ${this.precioOriginal && this.precioOriginal > this.precio ? 
                `<span class="product-card__original-price">$${this.precioOriginal.toLocaleString()}</span>` : 
                ''}
            </div>
            <div class="product-card__actions">
              <button class="product-card__action-btn product-card__action-btn--wishlist" 
                      data-action="wishlist" 
                      data-product-id="${this.id}"
                      aria-label="Agregar a favoritos">
                <i class="far fa-heart"></i>
              </button>
              <button class="product-card__action-btn product-card__action-btn--info" 
                      data-action="info" 
                      data-product-id="${this.id}"
                      aria-label="Ver información detallada">
                <i class="fas fa-info-circle"></i>
              </button>
              <button class="product-card__add-to-cart ${isInCart ? 'product-card__add-to-cart--in-cart' : ''}" 
                      data-action="add-to-cart" 
                      data-product-id="${this.id}"
                      ${!disponible ? 'disabled' : ''}
                      aria-label="${isInCart ? 'Ya en el carrito' : 'Agregar al carrito'}">
                <i class="fas ${isInCart ? 'fa-check' : 'fa-shopping-cart'}"></i>
                <span>${isInCart ? 'En Carrito' : (disponible ? 'Agregar' : 'Agotado')}</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Verifica si el producto coincide con los filtros aplicados
   * @param {Object} filtros - Objeto con los filtros a aplicar
   * @returns {boolean} true si el producto coincide con los filtros
   */
  coincideConFiltros(filtros) {
    const { searchTerm = '', categoria = 'todos' } = filtros;
    const searchLower = searchTerm.toLowerCase();

    // Buscar por término de búsqueda
    if (searchTerm && !this._coincideConBusqueda(searchLower)) {
      return false;
    }

    // Filtrar por categoría
    if (categoria !== 'todos' && this.categoria !== categoria) {
      return false;
    }

    return true;
  }

  /**
   * Verifica si el producto coincide con el término de búsqueda
   * @param {string} searchTerm - Término de búsqueda en minúsculas
   * @returns {boolean}
   * @private
   */
  _coincideConBusqueda(searchTerm) {
    return (
      this.nombre.toLowerCase().includes(searchTerm) ||
      this.descripcion.toLowerCase().includes(searchTerm) ||
      this.categoriaDisplay.toLowerCase().includes(searchTerm)
    );
  }
}

export default Producto;
