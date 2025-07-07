/**
 * Componente de filtros unificado para productos y semillas
 * @module components/Filters
 */

import { filterProducts, sortProducts } from '../services/api.service.js';
import { debounce, CONSTANTS, generateId } from '../utils/helpers.js';

/**
 * Configuración de filtros para diferentes tipos de páginas
 */
const FILTER_CONFIGS = {
  productos: {
    searchSelector: '#search-input',
    filters: {
      categoria: '#category-filter',
      price: '#price-filter',
      sort: '#sort-by'
    },
    debounceTime: CONSTANTS.TIMEOUTS.DEBOUNCE_SEARCH
  },
  semillas: {
    searchSelector: '#search',
    filters: {
      tipo: '#type-filter',
      genetics: '#genetics-filter',
      thc: '#thc-filter',
      sort: '#sort-by'
    },
    debounceTime: CONSTANTS.TIMEOUTS.DEBOUNCE_SEARCH
  }
};

/**
 * Clase para manejar filtros de productos/semillas
 */
export class FilterManager {
  /**
   * @param {string} pageType - Tipo de página ('productos' o 'semillas')
   * @param {Array} data - Datos a filtrar
   * @param {Function} onUpdate - Callback cuando se actualizan los filtros
   */
  constructor(pageType, data, onUpdate) {
    this.pageType = pageType;
    this.originalData = [...data];
    this.filteredData = [...data];
    this.onUpdate = onUpdate;
    this.config = FILTER_CONFIGS[pageType];
    
    if (!this.config) {
      throw new Error(`Configuración no encontrada para página: ${pageType}`);
    }
    
    this.currentFilters = {};
    this.init();
  }

  /**
   * Inicializa los filtros
   */
  init() {
    this.setupSearchFilter();
    this.setupSelectFilters();
    this.setupResetButton();
    
    // Aplicar filtros iniciales
    this.applyFilters();
  }

  /**
   * Configura el filtro de búsqueda
   */
  setupSearchFilter() {
    const searchInput = document.querySelector(this.config.searchSelector);
    if (!searchInput) {return;}

    const debouncedSearch = debounce((value) => {
      this.currentFilters.searchTerm = value.trim();
      this.applyFilters();
    }, this.config.debounceTime);

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });

    searchInput.addEventListener('search', (e) => {
      this.currentFilters.searchTerm = e.target.value.trim();
      this.applyFilters();
    });
  }

  /**
   * Configura los filtros de selección (dropdowns)
   */
  setupSelectFilters() {
    Object.entries(this.config.filters).forEach(([filterName, selector]) => {
      const selectElement = document.querySelector(selector);
      if (!selectElement) {return;}

      selectElement.addEventListener('change', (e) => {
        this.currentFilters[filterName] = e.target.value;
        this.applyFilters();
      });
    });
  }

  /**
   * Configura el botón de reset
   */
  setupResetButton() {
    const resetButton = document.querySelector('#reset-filters');
    if (!resetButton) {return;}

    resetButton.addEventListener('click', () => {
      this.resetFilters();
    });
  }

  /**
   * Aplica todos los filtros activos
   */
  applyFilters() {
    let result = [...this.originalData];

    // Aplicar filtros
    if (Object.keys(this.currentFilters).length > 0) {
      result = filterProducts(result, this.currentFilters);
    }

    // Aplicar ordenamiento
    const sortBy = this.currentFilters.sort || 'nombre';
    result = sortProducts(result, sortBy);

    this.filteredData = result;
    this.updateUI();
    
    // Notificar cambios
    if (this.onUpdate) {
      this.onUpdate(this.filteredData, this.currentFilters);
    }
  }

  /**
   * Resetea todos los filtros
   */
  resetFilters() {
    // Limpiar filtros internos
    this.currentFilters = {};
    
    // Resetear inputs
    const searchInput = document.querySelector(this.config.searchSelector);
    if (searchInput) {searchInput.value = '';}
    
    // Resetear selects
    Object.values(this.config.filters).forEach((selector) => {
      const selectElement = document.querySelector(selector);
      if (selectElement) {selectElement.selectedIndex = 0;}
    });
    
    // Aplicar filtros (sin filtros = mostrar todo)
    this.applyFilters();
  }

  /**
   * Actualiza la UI con información de filtros
   */
  updateUI() {
    this.updateResultsCount();
    this.updateNoResultsMessage();
  }

  /**
   * Actualiza el contador de resultados
   */
  updateResultsCount() {
    const countElement = document.querySelector('.results-count');
    if (countElement) {
      const total = this.originalData.length;
      const filtered = this.filteredData.length;
      
      if (Object.keys(this.currentFilters).length > 0 && filtered < total) {
        countElement.textContent = `Mostrando ${filtered} de ${total} resultados`;
        countElement.style.display = 'block';
      } else {
        countElement.style.display = 'none';
      }
    }
  }

  /**
   * Muestra/oculta mensaje de sin resultados
   */
  updateNoResultsMessage() {
    const noResultsElement = document.querySelector('.no-results');
    const hasActiveFilters = Object.keys(this.currentFilters).some(
      (key) => this.currentFilters[key] && this.currentFilters[key] !== 'todos'
    );
    
    if (noResultsElement) {
      if (this.filteredData.length === 0 && hasActiveFilters) {
        noResultsElement.style.display = 'block';
      } else {
        noResultsElement.style.display = 'none';
      }
    }
  }

  /**
   * Actualiza los datos y reaplica filtros
   * @param {Array} newData - Nuevos datos
   */
  updateData(newData) {
    this.originalData = [...newData];
    this.applyFilters();
  }

  /**
   * Obtiene los datos filtrados actuales
   * @returns {Array} Datos filtrados
   */
  getFilteredData() {
    return [...this.filteredData];
  }

  /**
   * Obtiene los filtros activos
   * @returns {Object} Filtros activos
   */
  getActiveFilters() {
    return { ...this.currentFilters };
  }

  /**
   * Establece filtros programáticamente
   * @param {Object} filters - Filtros a aplicar
   */
  setFilters(filters) {
    this.currentFilters = { ...filters };
    
    // Actualizar UI
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'searchTerm') {
        const searchInput = document.querySelector(this.config.searchSelector);
        if (searchInput) {searchInput.value = value;}
      } else if (this.config.filters[key]) {
        const selectElement = document.querySelector(this.config.filters[key]);
        if (selectElement) {selectElement.value = value;}
      }
    });
    
    this.applyFilters();
  }

  /**
   * Destruye el filtro y limpia event listeners
   */
  destroy() {
    // Aquí podrías limpiar event listeners si fuera necesario
    // Por ahora, los event listeners se manejan automáticamente
    this.originalData = [];
    this.filteredData = [];
    this.currentFilters = {};
  }
}

/**
 * Crea y configura un filtro para una página específica
 * @param {string} pageType - Tipo de página
 * @param {Array} data - Datos a filtrar
 * @param {Function} onUpdate - Callback de actualización
 * @returns {FilterManager} Instancia del filtro
 */
export function createFilter(pageType, data, onUpdate) {
  try {
    return new FilterManager(pageType, data, onUpdate);
  } catch (error) {
    console.error('Error al crear filtro:', error);
    return null;
  }
}

/**
 * Inicializa filtros automáticamente basándose en la página actual
 * @param {Array} data - Datos a filtrar
 * @param {Function} onUpdate - Callback de actualización
 * @returns {FilterManager|null} Instancia del filtro o null
 */
export function initializePageFilters(data, onUpdate) {
  let pageType = 'productos'; // default
  
  if (document.body.classList.contains('page--semillas')) {
    pageType = 'semillas';
  } else if (document.body.classList.contains('page--productos')) {
    pageType = 'productos';
  }
  
  return createFilter(pageType, data, onUpdate);
}

/**
 * Componente de filtros para productos/semillas
 * @module components/Filters
 */

/**
 * Clase para manejar los filtros de búsqueda
 * @class
 */
class Filters {
  /**
   * Crea una instancia de Filters
   * @param {Object} config - Configuración de los filtros
   * @param {string} config.containerSelector - Selector del contenedor de filtros
   * @param {Object} config.initialFilters - Valores iniciales de los filtros
   * @param {Function} config.onFilterChange - Callback cuando cambian los filtros
   */
  constructor({ containerSelector, initialFilters = {}, onFilterChange = () => {} }) {
    this.container = document.querySelector(containerSelector);
    this.filters = { ...initialFilters };
    this.onFilterChange = onFilterChange;
    
    if (!this.container) {
      console.warn(`No se encontró el contenedor con el selector: ${containerSelector}`);
      return;
    }
    
    this._init();
  }
  
  /**
   * Inicializa el componente
   * @private
   */
  _init() {
    this._bindElements();
    this._setupEventListeners();
    this._updateFilterValues();
  }
  
  /**
   * Vincula los elementos del DOM
   * @private
   */
  _bindElements() {
    this.searchInput = this.container.querySelector('input[type="search"]');
    this.selects = this.container.querySelectorAll('select');
    this.resetButton = this.container.querySelector('[data-reset-filters]');
  }
  
  /**
   * Configura los event listeners
   * @private
   */
  _setupEventListeners() {
    // Evento de búsqueda con debounce
    if (this.searchInput) {
      this.searchInput.addEventListener('input', this._debounce(() => {
        this._handleFilterChange('searchTerm', this.searchInput.value.trim());
      }, 300));
    }
    
    // Eventos para selects
    this.selects.forEach((select) => {
      select.addEventListener('change', (e) => {
        this._handleFilterChange(e.target.name, e.target.value);
      });
    });
    
    // Botón de reinicio
    if (this.resetButton) {
      this.resetButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetFilters();
      });
    }
  }
  
  /**
   * Maneja el cambio en los filtros
   * @param {string} name - Nombre del filtro
   * @param {string} value - Nuevo valor del filtro
   * @private
   */
  _handleFilterChange(name, value) {
    this.filters = {
      ...this.filters,
      [name]: value
    };
    
    this.onFilterChange(this.filters);
  }
  
  /**
   * Actualiza los valores de los filtros en el DOM
   * @private
   */
  _updateFilterValues() {
    // Actualizar inputs de búsqueda
    if (this.searchInput && this.filters.searchTerm !== undefined) {
      this.searchInput.value = this.filters.searchTerm;
    }
    
    // Actualizar selects
    this.selects.forEach((select) => {
      if (this.filters[select.name] !== undefined) {
        select.value = this.filters[select.name];
      }
    });
  }
  
  /**
   * Reinicia todos los filtros a sus valores por defecto
   */
  resetFilters() {
    Object.keys(this.filters).forEach((key) => {
      this.filters[key] = '';
    });
    
    if (this.searchInput) {this.searchInput.value = '';}
    this.selects.forEach((select) => {
      select.selectedIndex = 0;
    });
    
    this.onFilterChange(this.filters);
  }
  
  /**
   * Función de utilidad para debounce
   * @param {Function} func - Función a ejecutar
   * @param {number} wait - Tiempo de espera en ms
   * @returns {Function} Función con debounce aplicado
   * @private
   */
  _debounce(func, wait) {
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
   * Obtiene los filtros actuales
   * @returns {Object} Filtros actuales
   */
  getFilters() {
    return { ...this.filters };
  }
}

export default Filters;
