/**
 * Servicio para manejar peticiones a la API
 * @module services/api.service
 */

import { retry, formatPrice, CONSTANTS } from '../utils/helpers.js';

/**
 * Configuración de la API
 */
const API_CONFIG = {
  baseURL: './data',
  fallbackURL: './api',
  endpoints: {
    products: '/products.json',
    seeds: '/seeds.json'
  },
  timeout: CONSTANTS.TIMEOUTS.API_TIMEOUT,
  retries: 3,
  retryDelay: 1000
};

/**
 * Realiza una petición HTTP con timeout
 * @param {string} url - URL a consultar
 * @param {number} timeout - Tiempo límite en milisegundos
 * @returns {Promise<Response>} Respuesta de la petición
 */
async function fetchWithTimeout(url, timeout = API_CONFIG.timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-cache'
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado');
    }
    throw error;
  }
}

/**
 * Clase para manejar errores de API
 */
class APIError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.endpoint = endpoint;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Obtiene datos de un archivo JSON con reintentos y fallback
 * @param {string} endpoint - Endpoint relativo
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Array>} Datos obtenidos
 * @throws {APIError} Si falla la petición
 */
async function fetchData(endpoint, options = {}) {
  const { useCache = true, validateData = true } = options;
  
  // Intentar con la URL principal
  const primaryUrl = `${API_CONFIG.baseURL}${endpoint}`;
  
  try {
    return await retry(async () => {
      console.log(`🔄 Cargando datos desde: ${primaryUrl}`);
      
      const response = await fetchWithTimeout(primaryUrl);
      
      if (!response.ok) {
        throw new APIError(
          `Error HTTP: ${response.status} - ${response.statusText}`,
          response.status,
          endpoint
        );
      }
      
      const data = await response.json();
      
      if (validateData && !isValidDataStructure(data, endpoint)) {
        throw new APIError(
          'Estructura de datos inválida',
          400,
          endpoint
        );
      }
      
      // Procesar y enriquecer datos
      const processedData = processRawData(data, endpoint);
      
      console.log(`✅ Datos cargados correctamente: ${processedData.length} elementos`);
      return processedData;
      
    }, API_CONFIG.retries, API_CONFIG.retryDelay);
    
  } catch (primaryError) {
    console.warn(`⚠️ Error con URL principal, intentando fallback...`, primaryError);
    
    // Intentar con URL de fallback
    try {
      const fallbackUrl = `${API_CONFIG.fallbackURL}${endpoint}`;
      const response = await fetchWithTimeout(fallbackUrl);
      
      if (response.ok) {
        const data = await response.json();
        const processedData = processRawData(data, endpoint);
        console.log(`✅ Datos cargados desde fallback: ${processedData.length} elementos`);
        return processedData;
      }
    } catch (fallbackError) {
      console.warn('⚠️ Fallback también falló, usando datos por defecto');
    }
    
    // Usar datos por defecto
    const defaultData = getDefaultData(endpoint);
    if (defaultData.length > 0) {
      console.log(`📦 Usando datos por defecto: ${defaultData.length} elementos`);
      return defaultData;
    }
    
    throw new APIError(
      `No se pudieron cargar los datos desde ninguna fuente: ${primaryError.message}`,
      500,
      endpoint
    );
  }
}

/**
 * Valida la estructura de los datos recibidos
 * @param {any} data - Datos a validar
 * @param {string} endpoint - Endpoint de origen
 * @returns {boolean} True si la estructura es válida
 */
function isValidDataStructure(data, endpoint) {
  if (!Array.isArray(data)) {
    return false;
  }

  if (data.length === 0) {
    return true; // Array vacío es válido
  }

  const sample = data[0];
  const requiredFields = endpoint.includes('products') 
    ? ['id', 'nombre', 'precio', 'categoria']
    : ['id', 'nombre', 'precio', 'banco'];

  return requiredFields.every((field) => field in sample);
}

/**
 * Procesa y enriquece los datos brutos
 * @param {Array} rawData - Datos brutos
 * @param {string} endpoint - Endpoint de origen
 * @returns {Array} Datos procesados
 */
function processRawData(rawData, endpoint) {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.map((item) => {
    // Validaciones y valores por defecto
    const processedItem = {
      ...item,
      id: item.id || generateId('item'),
      nombre: item.nombre || 'Producto sin nombre',
      precio: typeof item.precio === 'number' ? item.precio : 0,
      disponible: item.disponible !== false, // true por defecto
      imagen: item.imagen || 'imagenes/Logo.png',
      descripcion: item.descripcion || 'Sin descripción disponible',
    };

    // Enriquecimientos específicos
    if (endpoint.includes('products')) {
      processedItem.categoria = item.categoria || 'general';
      processedItem.categoriaDisplay = item.categoriaDisplay || item.categoria || 'General';
    } else if (endpoint.includes('seeds')) {
      processedItem.banco = item.banco || 'Desconocido';
      processedItem.tipoGenetico = item.tipoGenetico || item.genetica || 'Híbrida';
      processedItem.thc = item.thc || '0';
      processedItem.cbd = item.cbd || '0';
      processedItem.efectos = Array.isArray(item.efectos) ? item.efectos : [];
      processedItem.sabores = Array.isArray(item.sabores) ? item.sabores : [];
    }

    return processedItem;
  });
}

/**
 * Genera un ID único simple
 * @param {string} prefix - Prefijo del ID
 * @returns {string} ID generado
 */
function generateId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtiene datos por defecto cuando todo falla
 * @param {string} endpoint - Endpoint solicitado
 * @returns {Array} Datos por defecto
 */
function getDefaultData(endpoint) {
  const defaultProducts = [
    {
      id: 'default-001',
      nombre: 'Producto de ejemplo',
      precio: 0,
      categoria: 'general',
      categoriaDisplay: 'General',
      descripcion: 'Producto de ejemplo mientras se cargan los datos reales',
      imagen: 'imagenes/Logo.png',
      disponible: false
    }
  ];

  const defaultSeeds = [
    {
      id: 'seed-default-001',
      nombre: 'Semilla de ejemplo',
      precio: 0,
      banco: 'Ejemplo',
      tipoGenetico: 'Híbrida',
      thc: '0',
      cbd: '0',
      descripcion: 'Semilla de ejemplo mientras se cargan los datos reales',
      imagen: 'imagenes/Logo.png',
      disponible: false,
      efectos: [],
      sabores: []
    }
  ];

  if (endpoint.includes('products')) {
    return defaultProducts;
  } else if (endpoint.includes('seeds')) {
    return defaultSeeds;
  }

  return [];
}

/**
 * Proporciona datos de fallback en caso de error
 * @param {string} endpoint - Endpoint que falló
 * @returns {Array} Datos de fallback
 */
function getFallbackData(endpoint) {
  return getDefaultData(endpoint);
}

/**
 * Obtiene los productos de la tienda
 * @returns {Promise<Array>} Lista de productos
 */
export async function loadProducts() {
  try {
    return await fetchData(API_CONFIG.endpoints.products);
  } catch (error) {
    console.error('Error específico cargando productos:', error);
    throw error;
  }
}

/**
 * Obtiene las semillas de la tienda
 * @returns {Promise<Array>} Lista de semillas
 */
export async function loadSeeds() {
  try {
    return await fetchData(API_CONFIG.endpoints.seeds);
  } catch (error) {
    console.error('Error específico cargando semillas:', error);
    throw error;
  }
}

/**
 * Obtiene un producto específico por ID
 * @param {string} id - ID del producto
 * @param {string} type - Tipo de producto ('product' o 'seed')
 * @returns {Promise<Object|null>} Producto encontrado o null
 */
export async function getProductById(id, type = 'product') {
  try {
    const data = type === 'seed' ? await loadSeeds() : await loadProducts();
    return data.find((item) => item.id === id) || null;
  } catch (error) {
    console.error(`Error al buscar ${type} con ID ${id}:`, error);
    return null;
  }
}

/**
 * Filtra productos según los criterios especificados
 * @param {Array} products - Lista de productos a filtrar
 * @param {Object} filters - Objeto con los filtros a aplicar
 * @returns {Array} Productos filtrados
 */
export function filterProducts(products, filters = {}) {
  if (!Array.isArray(products)) {
    console.warn('filterProducts: products no es un array');
    return [];
  }
  
  return products.filter((product) => Object.entries(filters).every(([key, value]) => {
      if (!value || value === 'todos' || value === '') {return true;}
      
      switch (key) {
        case 'searchTerm':
          return matchesSearchTerm(product, value);
        case 'categoria':
          return product.categoria === value;
        case 'price':
          return matchesPriceRange(product.precio, value);
        case 'tipo':
          return product.tipoFloracion?.toLowerCase().includes(value.toLowerCase());
        case 'thc':
          return matchesThcLevel(product.thc, value);
        case 'genetics':
          return product.tipoGenetico?.toLowerCase().includes(value.toLowerCase());
        default:
          return true;
      }
    }));
}

/**
 * Verifica si un producto coincide con el término de búsqueda
 * @param {Object} product - Producto a verificar
 * @param {string} searchTerm - Término de búsqueda
 * @returns {boolean} True si coincide
 */
function matchesSearchTerm(product, searchTerm) {
  const term = searchTerm.toLowerCase();
  const searchableFields = [
    product.nombre,
    product.descripcion,
    product.categoria,
    product.banco,
    product.tipoGenetico,
    ...(product.efectos || []),
    ...(product.sabores || [])
  ];
  
  return searchableFields.some((field) => 
    field && field.toString().toLowerCase().includes(term)
  );
}

/**
 * Verifica si el precio está en el rango especificado
 * @param {number} precio - Precio del producto
 * @param {string} range - Rango de precios
 * @returns {boolean} True si está en el rango
 */
function matchesPriceRange(precio, range) {
  if (!range || range === 'todos') {return true;}
  
  const [min, max] = range.split('-').map(Number);
  
  if (max) {
    return precio >= min && precio <= max;
  } else {
    return precio >= min;
  }
}

/**
 * Verifica si el nivel de THC está en el rango especificado
 * @param {string|number} thc - Nivel de THC
 * @param {string} level - Nivel esperado
 * @returns {boolean} True si coincide
 */
function matchesThcLevel(thc, level) {
  if (!thc || !level) {return true;}
  
  const thcNum = parseFloat(thc);
  
  switch (level) {
    case 'bajo':
      return thcNum < 10;
    case 'medio':
      return thcNum >= 10 && thcNum <= 20;
    case 'alto':
      return thcNum > 20;
    default:
      return true;
  }
}

/**
 * Ordena productos según el criterio especificado
 * @param {Array} products - Lista de productos a ordenar
 * @param {string} sortBy - Criterio de ordenación
 * @returns {Array} Productos ordenados
 */
export function sortProducts(products, sortBy = 'nombre') {
  if (!Array.isArray(products)) {
    console.warn('sortProducts: products no es un array');
    return [];
  }
  
  return [...products].sort((a, b) => {
    switch (sortBy) {
      case 'precio-asc':
        return (a.precio || 0) - (b.precio || 0);
      case 'precio-desc':
        return (b.precio || 0) - (a.precio || 0);
      case 'nombre-desc':
        return (b.nombre || '').localeCompare(a.nombre || '');
      case 'thc-desc':
        return parseFloat(b.thc || 0) - parseFloat(a.thc || 0);
      case 'relevancia':
        return 0; // Mantener orden original
      case 'nombre':
      default:
        return (a.nombre || '').localeCompare(b.nombre || '');
    }
  });
}

/**
 * Agrupa productos por categoría
 * @param {Array} products - Lista de productos
 * @returns {Object} Productos agrupados por categoría
 */
export function groupProductsByCategory(products) {
  if (!Array.isArray(products)) {return {};}
  
  return products.reduce((groups, product) => {
    const category = product.categoria || 'Sin categoría';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(product);
    return groups;
  }, {});
}

/**
 * Obtiene estadísticas de los productos
 * @param {Array} products - Lista de productos
 * @returns {Object} Estadísticas
 */
export function getProductStats(products) {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      total: 0,
      categories: {},
      priceRange: { min: 0, max: 0, avg: 0 }
    };
  }
  
  const prices = products.map((p) => p.precio || 0).filter((p) => p > 0);
  const categories = groupProductsByCategory(products);
  
  return {
    total: products.length,
    categories: Object.keys(categories).reduce((acc, cat) => {
      acc[cat] = categories[cat].length;
      return acc;
    }, {}),
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, price) => sum + price, 0) / prices.length
    }
  };
}
