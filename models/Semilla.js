import Producto from './Producto.js';

/**
 * Clase que representa una semilla en la tienda, hereda de Producto
 * @class
 * @extends Producto
 */
class Semilla extends Producto {
  /**
   * Crea una instancia de Semilla
   * @param {Object} config - Configuración de la semilla
   * @param {string} config.banco - Banco de semillas
   * @param {string} config.tipoGenetico - Tipo genético (Sativa, Índica, Híbrida)
   * @param {string} config.tipoFloracion - Tipo de floración
   * @param {string} config.thc - Nivel de THC
   * @param {string} config.cbd - Nivel de CBD
   * @param {string[]} config.efectos - Lista de efectos
   * @param {string[]} config.sabores - Lista de sabores
   */
  constructor({
    banco,
    tipoGenetico,
    tipoFloracion,
    thc,
    cbd,
    efectos = [],
    sabores = [],
    ...productoProps
  }) {
    super(productoProps);
    
    this.banco = banco;
    this.tipoGenetico = tipoGenetico;
    this.tipoFloracion = tipoFloracion;
    this.thc = thc;
    this.cbd = cbd;
    this.efectos = [...efectos];
    this.sabores = [...sabores];
  }

  /**
   * Genera el HTML para la tarjeta de la semilla
   * @override
   * @returns {string} HTML de la tarjeta
   */
  crearTarjeta() {
    const precioFormateado = this._formatearPrecio();
    const isInCart = window.CartService ? window.CartService.hasItem(this.id) : false;
    const disponible = this.disponible !== false; // Default true if not specified
    const hasDiscount = this.precioOriginal && this.precioOriginal > this.precio;

    return `
      <article class="seed-card" data-id="${this.id}" data-categoria="semillas">
        <div class="seed-card__image-container">
          <img 
            src="${this.imagen}" 
            alt="${this.alt}" 
            class="seed-card__image" 
            loading="lazy"
            width="300"
            height="300"
            onerror="this.src='imagenes/Logo.png'"
          >
          
          <div class="seed-card__badges">
            ${this.destacado ? '<span class="seed-card__badge seed-card__badge--featured">Destacado</span>' : ''}
            ${hasDiscount ? '<span class="seed-card__badge seed-card__badge--sale">Oferta</span>' : ''}
            ${!disponible ? '<span class="seed-card__badge seed-card__badge--unavailable">Agotado</span>' : ''}
          </div>

          <div class="seed-card__genetics-badge seed-card__genetics-badge--${this.genetica}">
            ${this.formatGenetics(this.genetica)}
          </div>
        </div>
        
        <div class="seed-card__content">
          <div class="seed-card__header">
            <span class="seed-card__bank">${this.banco}</span>
            <div class="seed-card__rating">
              ${this.renderStars(this.calificacion)}
              <span class="seed-card__reviews">(${this.reviews})</span>
            </div>
          </div>

          <h3 class="seed-card__title">${this.nombre}</h3>
          <p class="seed-card__description">${this.descripcion || 'Descripción no disponible'}</p>

          <div class="seed-card__specs">
            <div class="seed-card__spec">
              <span class="seed-card__spec-label">THC:</span>
              <span class="seed-card__spec-value">${this.thc}%</span>
            </div>
            <div class="seed-card__spec">
              <span class="seed-card__spec-label">CBD:</span>
              <span class="seed-card__spec-value">${this.cbd}%</span>
            </div>
            <div class="seed-card__spec">
              <span class="seed-card__spec-label">Floración:</span>
              <span class="seed-card__spec-value">${this.tiempoFloracion}</span>
            </div>
          </div>

          <div class="seed-card__effects">
            ${this.efectos.slice(0, 3).map(efecto => 
              `<span class="seed-card__effect">${efecto}</span>`
            ).join('')}
          </div>

          <div class="seed-card__footer">
            <div class="seed-card__pricing">
              <span class="seed-card__price">${precioFormateado}</span>
              ${hasDiscount ? 
                `<span class="seed-card__original-price">$${this.precioOriginal.toLocaleString()}</span>` : 
                ''}
            </div>

            <div class="seed-card__actions">
              <button class="seed-card__action-btn seed-card__action-btn--wishlist" 
                      data-action="wishlist" 
                      data-seed-id="${this.id}"
                      aria-label="Agregar a favoritos">
                <i class="far fa-heart"></i>
              </button>

              <button class="seed-card__action-btn seed-card__action-btn--info" 
                      data-action="info" 
                      data-seed-id="${this.id}"
                      aria-label="Ver información detallada">
                <i class="fas fa-info-circle"></i>
              </button>

              <button class="seed-card__add-to-cart ${isInCart ? 'seed-card__add-to-cart--in-cart' : ''}" 
                      data-action="add-to-cart" 
                      data-seed-id="${this.id}"
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
   * Sobrescribe el método para incluir búsqueda por banco, efectos y sabores
   * @override
   * @param {string} searchTerm - Término de búsqueda en minúsculas
   * @returns {boolean}
   * @private
   */
  _coincideConBusqueda(searchTerm) {
    return (
      super._coincideConBusqueda(searchTerm) ||
      this.banco.toLowerCase().includes(searchTerm) ||
      this.tipoGenetico.toLowerCase().includes(searchTerm) ||
      this.tipoFloracion.toLowerCase().includes(searchTerm) ||
      this.efectos.some(efecto => efecto.toLowerCase().includes(searchTerm)) ||
      this.sabores.some(sabor => sabor.toLowerCase().includes(searchTerm))
    );
  }
}

export default Semilla;
