/**
 * Componente de paginación
 * @module components/Pagination
 */

/**
 * Clase para manejar la paginación
 * @class
 */
class Pagination {
  /**
   * Crea una instancia de Pagination
   * @param {Object} config - Configuración de la paginación
   * @param {HTMLElement} config.container - Elemento contenedor
   * @param {number} config.totalItems - Total de ítems
   * @param {number} config.itemsPerPage - Ítems por página
   * @param {number} config.currentPage - Página actual (1-based)
   * @param {Function} config.onPageChange - Callback al cambiar de página
   * @param {string} [config.baseUrl='#'] - URL base para los enlaces
   * @param {boolean} [config.showPageNumbers=true] - Mostrar números de página
   * @param {boolean} [config.showPageInfo=true] - Mostrar información de la página actual
   * @param {number} [config.maxVisiblePages=5] - Número máximo de páginas visibles
   */
  constructor({ 
    container, 
    totalItems = 0, 
    itemsPerPage = 9, 
    currentPage = 1, 
    onPageChange = () => {},
    baseUrl = '#',
    showPageNumbers = true,
    showPageInfo = true,
    maxVisiblePages = 5
  }) {
    if (!container) {
      throw new Error('Se requiere un contenedor para la paginación');
    }
    
    this.container = container;
    this.totalItems = Math.max(0, parseInt(totalItems, 10));
    this.itemsPerPage = Math.max(1, parseInt(itemsPerPage, 10));
    this.currentPage = Math.max(1, parseInt(currentPage, 10));
    this.onPageChange = onPageChange;
    this.baseUrl = baseUrl;
    this.showPageNumbers = showPageNumbers;
    this.showPageInfo = showPageInfo;
    this.maxVisiblePages = Math.max(3, Math.min(10, parseInt(maxVisiblePages, 10)));
    
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    
    // Renderizar la paginación
    this.render();
    this._setupEventListeners();
  }
  
  /**
   * Renderiza la paginación
   */
  render() {
    // Limpiar el contenedor
    this.container.innerHTML = '';
    
    // Si solo hay una página o menos, no mostrar la paginación
    if (this.totalPages <= 1 || this.totalItems === 0) {
      this.container.style.display = 'none';
      return;
    }
    
    this.container.style.display = 'flex';
    this.container.className = 'pagination';
    this.container.setAttribute('role', 'navigation');
    this.container.setAttribute('aria-label', 'Paginación de resultados');
    
    // Determinar qué números de página mostrar
    const pages = this._getPageNumbers();
    
    
    this.container.innerHTML = `
      <nav class="pagination" role="navigation" aria-label="Paginación">
        <button 
          class="pagination__button pagination__button--prev ${this.currentPage === 1 ? 'disabled' : ''}" 
          data-page="${this.currentPage - 1}"
          ${this.currentPage === 1 ? 'disabled' : ''}
          aria-label="Ir a la página anterior"
        >
          <span class="sr-only">Anterior</span>
          &laquo;
        </button>
        
        <div class="pagination__pages">
          ${pages.map(page => this._renderPageNumber(page)).join('')}
        </div>
        
        <button 
          class="pagination__button pagination__button--next ${this.currentPage === this.totalPages ? 'disabled' : ''}" 
          data-page="${this.currentPage + 1}"
          ${this.currentPage === this.totalPages ? 'disabled' : ''}
          aria-label="Ir a la página siguiente"
        >
          <span class="sr-only">Siguiente</span>
          &raquo;
        </button>
      </nav>
    `;
  }
  
  /**
   * Renderiza un número de página
   * @param {number|string} page - Número de página o '...'
   * @returns {string} HTML del número de página
   * @private
   */
  _renderPageNumber(page) {
    if (page === '...') {
      return '<span class="pagination__ellipsis">...</span>';
    }
    
    const isCurrent = page === this.currentPage;
    
    return `
      <button 
        class="pagination__page ${isCurrent ? 'pagination__page--active' : ''}" 
        data-page="${page}"
        ${isCurrent ? 'aria-current="page"' : ''}
        aria-label="Ir a la página ${page}"
      >
   * @private
   */
  _getPageNumbers() {
    const pages = [];
    const current = this.currentPage;
    const last = this.totalPages;
    const delta = Math.floor(this.maxVisiblePages / 2);
    let left = current - delta;
    let right = current + delta + (this.maxVisiblePages % 2 === 0 ? 1 : 0);
    
    // Ajustar los límites
    if (left < 1) {
      left = 1;
      right = Math.min(this.maxVisiblePages, last);
    }
    
    if (right > last) {
      right = last;
      left = Math.max(1, last - this.maxVisiblePages + 1);
    }
    
    // Agregar primera página y elipsis si es necesario
    if (left > 1) {
      pages.push(1);
      if (left > 2) {
        pages.push('...');
      }
    }
    
    // Agregar números de página
    for (let i = left; i <= right; i++) {
      pages.push(i);
    }
    
    // Agregar última página y elipsis si es necesario
    if (right < last) {
      if (right < last - 1) {
        pages.push('...');
      }
      pages.push(last);
    }
    
    return pages;
  }
  
  /**
   * Genera el HTML de un botón de página
   * @param {number|string} page - Número de página o '...' para elipsis
   * @param {boolean} [isCurrent=false] - Si es la página actual
   * @returns {string} - HTML del botón
   * @private
   */
  _createPageButton(page, isCurrent = false) {
    if (page === '...') {
      return '<span class="pagination__ellipsis" aria-hidden="true">…</span>';
    }
    
    const isCurrentClass = isCurrent ? 'pagination__link--current' : '';
    const ariaCurrent = isCurrent ? 'aria-current="page"' : '';
    const pageLabel = `Página ${page}`;
    
    return `
      <li class="pagination__item">
        <a href="${this.baseUrl}?page=${page}" 
           class="pagination__link ${isCurrentClass}" 
           data-action="page" 
           data-page="${page}"
           ${ariaCurrent}
           aria-label="${isCurrent ? pageLabel + ' (página actual)' : pageLabel}">
          ${page}
        </a>
      </li>
    `;
  }
  
  /**
   * Configura los event listeners
   * @private
   */
  _setupEventListeners() {
    // Usar delegación de eventos para manejar clics en los botones
    this.container.addEventListener('click', (e) => {
      e.preventDefault();
      
      const target = e.target.closest('[data-action]');
      if (!target) return;
      
      const action = target.dataset.action;
      let page;
      
      switch (action) {
        case 'first':
          page = 1;
          break;
          
        case 'prev':
          page = Math.max(1, this.currentPage - 1);
          break;
          
        case 'next':
          page = Math.min(this.totalPages, this.currentPage + 1);
          break;
          
        case 'last':
          page = this.totalPages;
          break;
          
        case 'page':
          page = parseInt(target.dataset.page, 10);
          if (isNaN(page)) return;
          break;
          
        default:
          return;
      }
      
      this._goToPage(page);
    });
    
    // Manejar teclado para accesibilidad
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const target = e.target.closest('[data-action]');
        if (target) {
          target.click();
        }
      }
    });
  }
  
  /**
   * Navega a una página específica (método interno)
   * @param {number} page - Número de página (1-based)
   * @private
   */
  _goToPage(page) {
    page = parseInt(page, 10);
    
    // Validar que la página sea válida
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    // Actualizar la página actual
    this.currentPage = page;
    
    // Volver a renderizar
    this.render();
    
    // Desplazarse suavemente al principio de la página
    this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Enfocar el primer elemento enfocable en la página
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1');
      mainContent.focus();
    }
    
    // Llamar al callback con la información de la página
    if (typeof this.onPageChange === 'function') {
      this.onPageChange({
        page: this.currentPage,
        itemsPerPage: this.itemsPerPage,
        totalItems: this.totalItems,
        totalPages: this.totalPages
      });
    }
  }
  
  /**
   * Navega a una página específica (método público)
   * @param {number} page - Número de página (1-based)
   */
  goToPage(page) {
    this._goToPage(page);
  }
  
  /**
   * Actualiza la paginación con nuevos valores
   * @param {Object} options - Opciones de actualización
   * @param {number} [options.totalItems] - Nuevo total de ítems
   * @param {number} [options.itemsPerPage] - Nuevo número de ítems por página
   * @param {number} [options.currentPage] - Nueva página actual
   */
  update({ totalItems, itemsPerPage, currentPage }) {
    let needsRender = false;
    
    if (typeof totalItems !== 'undefined') {
      const newTotalItems = Math.max(0, parseInt(totalItems, 10));
      if (newTotalItems !== this.totalItems) {
        this.totalItems = newTotalItems;
        needsRender = true;
      }
    }
    
    if (typeof itemsPerPage !== 'undefined') {
      const newItemsPerPage = Math.max(1, parseInt(itemsPerPage, 10));
      if (newItemsPerPage !== this.itemsPerPage) {
        this.itemsPerPage = newItemsPerPage;
        needsRender = true;
      }
    }
    
    // Recalcular totalPages después de cambiar totalItems o itemsPerPage
    const newTotalPages = Math.max(1, Math.ceil(this.totalItems / this.itemsPerPage));
    if (newTotalPages !== this.totalPages) {
      this.totalPages = newTotalPages;
      needsRender = true;
    }
    
    // Actualizar currentPage si es necesario
    if (typeof currentPage !== 'undefined') {
      const newCurrentPage = Math.max(1, Math.min(parseInt(currentPage, 10), this.totalPages));
      if (newCurrentPage !== this.currentPage) {
        this.currentPage = newCurrentPage;
        needsRender = true;
      }
    } else if (this.currentPage > this.totalPages) {
      // Ajustar currentPage si es mayor que el nuevo totalPages
      this.currentPage = this.totalPages;
      needsRender = true;
    }
    
    if (needsRender) {
      this.render();
      this._setupEventListeners();
    }
  }
  
  /**
   * Destruye la instancia de paginación
   */
  destroy() {
    // Eliminar event listeners
    const clone = this.container.cloneNode(true);
    this.container.parentNode.replaceChild(clone, this.container);
    this.container = null;
  }
}

export default Pagination;
