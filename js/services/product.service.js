/**
 * Servicio para gestionar productos
 * @module services/product.service
 */

import { loadProducts, loadSeeds, filterProducts, sortProducts } from './api.service.js';
import { notificationService } from './notification.service.js';

// Tipos de productos
const PRODUCT_TYPES = {
  PRODUCT: 'product',
  SEED: 'seed'
};

// Estado global de los productos
const state = {
  products: [],
  filteredProducts: [],
  filters: {
    searchTerm: '',
    category: 'all',
    minPrice: '',
    maxPrice: '',
    sortBy: 'nombre-asc'
  },
  isLoading: false,
  currentPage: 1,
  itemsPerPage: 12
};

/**
 * Carga los productos desde la API
 * @param {string} type - Tipo de producto a cargar (product/seed)
 * @returns {Promise<Array>} - Promesa con los productos cargados
 */
async function loadProductsByType(type = PRODUCT_TYPES.PRODUCT) {
  state.isLoading = true;
  
  try {
    const products = type === PRODUCT_TYPES.SEED 
      ? await loadSeeds() 
      : await loadProducts();
    
    state.products = Array.isArray(products) ? products : [];
    state.filteredProducts = [...state.products];
    
    // Aplicar filtros actuales
    applyFilters();
    
    return state.filteredProducts;
  } catch (error) {
    console.error(`Error al cargar ${type}s:`, error);
    notificationService.error(`Error al cargar los ${type}s. Por favor, intente nuevamente.`);
    return [];
  } finally {
    state.isLoading = false;
  }
}

/**
 * Aplica los filtros actuales a los productos
 */
function applyFilters() {
  if (!Array.isArray(state.products)) {
    state.filteredProducts = [];
    return;
  }
  
  // Aplicar filtros
  let filtered = [...state.products];
  
  // Filtrar por término de búsqueda
  if (state.filters.searchTerm) {
    const searchTerm = state.filters.searchTerm.toLowerCase();
    filtered = filtered.filter((product) => 
      (product.nombre && product.nombre.toLowerCase().includes(searchTerm)) ||
      (product.descripcion && product.descripcion.toLowerCase().includes(searchTerm)) ||
      (product.categoria && product.categoria.toLowerCase().includes(searchTerm))
    );
  }
  
  // Filtrar por categoría
  if (state.filters.category && state.filters.category !== 'all') {
    filtered = filtered.filter((product) => 
      product.categoria && product.categoria === state.filters.category
    );
  }
  
  // Filtrar por precio mínimo
  if (state.filters.minPrice) {
    const minPrice = parseFloat(state.filters.minPrice);
    if (!isNaN(minPrice)) {
      filtered = filtered.filter((product) => 
        product.precio && parseFloat(product.precio) >= minPrice
      );
    }
  }
  
  // Filtrar por precio máximo
  if (state.filters.maxPrice) {
    const maxPrice = parseFloat(state.filters.maxPrice);
    if (!isNaN(maxPrice)) {
      filtered = filtered.filter((product) => 
        product.precio && parseFloat(product.precio) <= maxPrice
      );
    }
  }
  
  // Ordenar productos
  state.filteredProducts = sortProducts(filtered, state.filters.sortBy);
  
  // Resetear a la primera página cuando se aplican filtros
  state.currentPage = 1;
}

/**
 * Actualiza un filtro específico
 * @param {string} filter - Nombre del filtro
 * @param {*} value - Valor del filtro
 */
function updateFilter(filter, value) {
  if (filter in state.filters) {
    state.filters[filter] = value;
    applyFilters();
  }
}

/**
 * Obtiene los productos paginados
 * @returns {Object} - Objeto con los productos de la página actual y la información de paginación
 */
function getPaginatedProducts() {
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  
  return {
    products: state.filteredProducts.slice(startIndex, endIndex),
    pagination: {
      currentPage: state.currentPage,
      totalPages: Math.ceil(state.filteredProducts.length / state.itemsPerPage),
      totalItems: state.filteredProducts.length,
      hasNext: endIndex < state.filteredProducts.length,
      hasPrev: state.currentPage > 1
    }
  };
}

/**
 * Cambia a una página específica
 * @param {number} pageNumber - Número de página
 * @returns {boolean} - True si el cambio de página fue exitoso
 */
function goToPage(pageNumber) {
  const totalPages = Math.ceil(state.filteredProducts.length / state.itemsPerPage);
  
  if (pageNumber > 0 && pageNumber <= totalPages) {
    state.currentPage = pageNumber;
    return true;
  }
  
  return false;
}

/**
 * Obtiene las categorías únicas de los productos
 * @returns {Array} - Array de categorías únicas
 */
function getUniqueCategories() {
  if (!Array.isArray(state.products) || state.products.length === 0) {
    return [];
  }
  
  const categories = new Set();
  state.products.forEach((product) => {
    if (product.categoria) {
      categories.add(product.categoria);
    }
  });
  
  return Array.from(categories).sort();
}

/**
 * Obtiene el rango de precios de los productos
 * @returns {Object} - Objeto con min y max de precios
 */
function getPriceRange() {
  if (!Array.isArray(state.products) || state.products.length === 0) {
    return { min: 0, max: 0 };
  }
  
  const prices = state.products
    .map((product) => parseFloat(product.precio))
    .filter((price) => !isNaN(price));
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

/**
 * Busca un producto por su ID
 * @param {string} id - ID del producto
 * @returns {Object|null} - Producto encontrado o null
 */
function getProductById(id) {
  if (!Array.isArray(state.products)) {return null;}
  return state.products.find((product) => product.id === id) || null;
}

/**
 * Obtiene el estado actual de los filtros
 * @returns {Object} - Estado actual de los filtros
 */
function getFilters() {
  return { ...state.filters };
}

/**
 * Obtiene el estado de carga actual
 * @returns {boolean} - True si está cargando
 */
function isLoading() {
  return state.isLoading;
}

// Exportar funciones públicas
export const productService = {
  PRODUCT_TYPES,
  loadProducts: () => loadProductsByType(PRODUCT_TYPES.PRODUCT),
  loadSeeds: () => loadProductsByType(PRODUCT_TYPES.SEED),
  getProducts: () => state.filteredProducts,
  getPaginatedProducts,
  getProductById,
  updateFilter,
  getFilters,
  getUniqueCategories,
  getPriceRange,
  goToPage,
  isLoading,
  getCurrentPage: () => state.currentPage,
  getItemsPerPage: () => state.itemsPerPage,
  setItemsPerPage: (count) => {
    state.itemsPerPage = Math.max(1, parseInt(count, 10) || 12);
    state.currentPage = 1; // Resetear a la primera página
  }
};

// Inicialización (opcional)
// productService.loadProducts(); // Cargar productos al inicio si es necesario
