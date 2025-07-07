// Las funciones de ProductCard están disponibles como scripts globales

// URL de la API de DummyJSON
const API_URL = 'https://dummyjson.com/products';

// Referencias al DOM (se inicializarán cuando el DOM esté listo)
let productsGrid, loadingState, errorState, noResultsState;
let categoryFilter, priceFilter, sortFilter, searchInput;

// Variables globales para los productos
let allProducts = [];
let filteredProducts = [];

// Función para inicializar referencias del DOM
function initializeDOMReferences() {
  productsGrid = document.getElementById('api-products-grid');
  loadingState = document.getElementById('api-loading');
  errorState = document.getElementById('api-error');
  noResultsState = document.getElementById('api-no-results');
  categoryFilter = document.getElementById('category-filter-api');
  priceFilter = document.getElementById('price-filter-api');
  sortFilter = document.getElementById('sort-filter-api');
  searchInput = document.getElementById('search-input-api');
}

// Función para transformar datos de DummyJSON al formato esperado
function transformDummyJSONProduct(dummyProduct) {
  return {
    id: dummyProduct.id.toString(),
    nombre: dummyProduct.title,
    descripcion: dummyProduct.description,
    precio: Math.round(dummyProduct.price * 300), // Convertir USD a ARS aproximadamente
    imagen: dummyProduct.thumbnail,
    categoria: dummyProduct.category,
    categoriaDisplay: dummyProduct.category.charAt(0).toUpperCase() + dummyProduct.category.slice(1),
    stock: dummyProduct.stock,
    descuento: Math.round(dummyProduct.discountPercentage || 0),
    esNuevo: dummyProduct.rating > 4.5,
    esOferta: (dummyProduct.discountPercentage || 0) > 10,
    disponible: dummyProduct.stock > 0,
    destacado: dummyProduct.rating > 4.7
  };
}

// Función para obtener productos de la API
async function fetchAPIProducts() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Error al obtener productos');
    const data = await response.json();
    return data.products.map(transformDummyJSONProduct);
  } catch (error) {
    console.error('Error al cargar productos desde la API:', error);
    throw error;
  }
}

// Función para poblar el filtro de categorías
function populateCategoryFilter(products) {
  const categories = [...new Set(products.map(p => p.categoria))];
  categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryFilter.appendChild(option);
  });
}

// Función para filtrar productos
function filterProducts() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedPriceRange = priceFilter.value;
  const sortBy = sortFilter.value;

  // Aplicar filtros
  filteredProducts = allProducts.filter(product => {
    // Filtro de búsqueda
    const matchesSearch = !searchTerm || 
      product.nombre.toLowerCase().includes(searchTerm) ||
      product.descripcion.toLowerCase().includes(searchTerm) ||
      product.categoria.toLowerCase().includes(searchTerm);

    // Filtro de categoría
    const matchesCategory = !selectedCategory || product.categoria === selectedCategory;

    // Filtro de precio
    let matchesPrice = true;
    if (selectedPriceRange) {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      if (max) {
        matchesPrice = product.precio >= min && product.precio <= max;
      } else {
        matchesPrice = product.precio >= min;
      }
    }

    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Aplicar ordenamiento
  switch (sortBy) {
    case 'title-desc':
      filteredProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    case 'price-asc':
      filteredProducts.sort((a, b) => a.precio - b.precio);
      break;
    case 'price-desc':
      filteredProducts.sort((a, b) => b.precio - a.precio);
      break;
    case 'rating-desc':
      filteredProducts.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));
      break;
    default: // 'title'
      filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  renderFilteredProducts();
}

// Función para renderizar productos filtrados
function renderFilteredProducts() {
  if (filteredProducts.length === 0) {
    productsGrid.style.display = 'none';
    noResultsState.style.display = 'block';
  } else {
    noResultsState.style.display = 'none';
    productsGrid.style.display = 'grid';
    renderProductList(filteredProducts, productsGrid, 'product');
  }
}

// Función para limpiar filtros
window.clearAPIFilters = function() {
  searchInput.value = '';
  categoryFilter.value = '';
  priceFilter.value = '';
  sortFilter.value = 'title';
  filteredProducts = [...allProducts];
  renderFilteredProducts();
};

// Función principal para cargar y renderizar productos de la API
async function loadAndRenderAPIProducts() {
  try {
    // Inicializar referencias del DOM
    initializeDOMReferences();
    
    // Verificar que los elementos existen
    if (!productsGrid || !loadingState) {
      console.error('No se pudieron encontrar los elementos del DOM necesarios');
      return;
    }
    
    loadingState.style.display = 'flex';
    errorState.style.display = 'none';
    noResultsState.style.display = 'none';
    productsGrid.style.display = 'none';
    
    allProducts = await fetchAPIProducts();
    filteredProducts = [...allProducts];
    
    loadingState.style.display = 'none';
    
    if (allProducts.length === 0) {
      noResultsState.style.display = 'block';
      return;
    }
    
    // Poblar filtros y renderizar productos
    populateCategoryFilter(allProducts);
    renderFilteredProducts();
    
    // Configurar eventos de filtros
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    priceFilter.addEventListener('change', filterProducts);
    sortFilter.addEventListener('change', filterProducts);
    
  } catch (error) {
    console.error('Error completo:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
}

// Iniciar al cargar el DOM
document.addEventListener('DOMContentLoaded', loadAndRenderAPIProducts);
