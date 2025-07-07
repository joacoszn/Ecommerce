/**
 * Página de productos
 * @module pages/ProductsPage
 */

import Producto from '../../models/Producto.js';
import APIService from '../services/api.service.js';
import Filters from '../components/Filters.js';
import Pagination from '../components/Pagination.js';
import { cartService } from '../services/cart.service.js';

/**
 * Clase para manejar la página de productos
 * @class
 */
class ProductsPage {
  /**
   * Crea una instancia de ProductsPage
   * @param {Object} config - Configuración de la página
   * @param {string} config.containerId - ID del contenedor principal
   * @param {Function} config.ModelClass - Clase del modelo a utilizar
   * @param {Object} config.initialFilters - Filtros iniciales
   * @param {string} config.noResultsMessage - Mensaje cuando no hay resultados
   */
  constructor({
    containerId = 'product-grid-container',
    ModelClass = Producto,
    initialFilters = {
      searchTerm: '',
      categoria: 'todos',
      price: 'todos',
      sort: 'nombre'
    },
    noResultsMessage = 'No se encontraron productos que coincidan con tu búsqueda.'
  } = {}) {
    this.container = document.getElementById(containerId);
    this.ModelClass = ModelClass;
    this.initialFilters = initialFilters;
    this.noResultsMessage = noResultsMessage;
    this.products = [];
    this.filteredProducts = [];
    this.currentPage = 1;
    this.itemsPerPage = 9;
    
    if (!this.container) {
      console.error(`No se encontró el contenedor con ID: ${containerId}`);
      return;
    }
    
    this._init();
  }
  
  /**
   * Inicializa la página
   * @private
   */
  async _init() {
    try {
      await this._loadProducts();
      this._initFilters();
      this._setupEventListeners();
      this._render();
    } catch (error) {
      console.error('Error al inicializar la página de productos:', error);
      this._showError('Error al cargar los productos. Por favor, inténtalo de nuevo más tarde.');
    }
  }
  
  /**
   * Carga los productos desde la API
   * @private
   */
  async _loadProducts() {
    try {
      const data = await APIService.getProducts();
      this.products = data.map((item) => new this.ModelClass(item));
      this.filteredProducts = [...this.products];
    } catch (error) {
      console.error('Error al cargar productos:', error);
      throw error;
    }
  }
  
  /**
   * Inicializa los filtros
   * @private
   */
  _initFilters() {
    this.filters = new Filters({
      containerSelector: '.filters-container',
      initialFilters: this.initialFilters,
      onFilterChange: this._handleFilterChange.bind(this)
    });
  }
  
  /**
   * Maneja el cambio en los filtros
   * @param {Object} filters - Filtros actuales
   * @private
   */
  _handleFilterChange(filters) {
    this.currentPage = 1; // Resetear a la primera página
    this._applyFilters(filters);
  }
  
  /**
   * Aplica los filtros a los productos
   * @param {Object} filters - Filtros a aplicar
   * @private
   */
  _applyFilters(filters) {
    this.filteredProducts = this.products.filter((product) => product.coincideConFiltros(filters));
    
    this._sortProducts(filters.sort);
    this._render();
  }
  
  /**
   * Ordena los productos según el criterio seleccionado
   * @param {string} sortBy - Criterio de ordenación
   * @private
   */
  _sortProducts(sortBy) {
    this.filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'precio-asc':
          return a.precio - b.precio;
        case 'precio-desc':
          return b.precio - a.precio;
        default:
          return 0;
      }
    });
  }
  
  /**
   * Renderiza la página
   * @private
   */
  _render() {
    if (this.filteredProducts.length === 0) {
      this._renderNoResults();
      return;
    }
    
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const productsToShow = this.filteredProducts.slice(startIndex, endIndex);
    
    this._renderProducts(productsToShow);
    this._renderPagination();
  }
  
  /**
   * Renderiza la lista de productos
   * @param {Array} products - Productos a renderizar
   * @private
   */
  _renderProducts(products) {
    this.container.innerHTML = `
      <div class="product-grid">
        ${products.map((product) => product.crearTarjeta()).join('')}
      </div>
    `;
  }
  
  /**
   * Renderiza la paginación
   * @private
   */
  _renderPagination() {
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    
    // Insertar después del contenedor de productos
    this.container.insertAdjacentElement('afterend', paginationContainer);
    
    this.pagination = new Pagination({
      container: paginationContainer,
      totalItems: this.filteredProducts.length,
      itemsPerPage: this.itemsPerPage,
      currentPage: this.currentPage,
      onPageChange: (page) => {
        this.currentPage = page;
        this._render();
      }
    });
  }
  
  /**
   * Muestra un mensaje cuando no hay resultados
   * @private
   */
  _renderNoResults() {
    this.container.innerHTML = `
      <div class="no-results">
        <p>${this.noResultsMessage}</p>
        <button class="btn btn--primary" id="reset-filters">
          Reiniciar filtros
        </button>
      </div>
    `;
  }
  
  /**
   * Muestra un mensaje de error
   * @param {string} message - Mensaje de error
   * @private
   */
  _showError(message) {
    this.container.innerHTML = `
      <div class="alert alert--error">
        <p>${message}</p>
      </div>
    `;
  }
  
  /**
   * Configura los event listeners
   * @private
   */
  _setupEventListeners() {
    // Delegación de eventos para los botones de agregar al carrito
    this.container.addEventListener('click', (e) => {
      const addToCartBtn = e.target.closest('.add-to-cart');
      
      if (addToCartBtn) {
        e.preventDefault();
        const {productId} = addToCartBtn.dataset;
        this._handleAddToCart(productId);
      }
    });
    
    // Evento para el botón de reiniciar filtros
    document.addEventListener('click', (e) => {
      if (e.target.id === 'reset-filters') {
        this.filters.resetFilters();
      }
    });
  }
  
  /**
   * Maneja el evento de agregar al carrito
   * @param {string} productId - ID del producto a agregar
   * @private
   */
  _handleAddToCart(productId) {
    cartService.addToCart(productId);
  }
}

export default ProductsPage;
