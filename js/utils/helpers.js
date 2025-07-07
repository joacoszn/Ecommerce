/**
 * UTILIDADES COMUNES - THC GROWSHOP
 * Funciones de ayuda reutilizables en todo el proyecto
 * @author THC Growshop
 * @version 1.0.0
 */

/**
 * Debounce function - Retrasa la ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en milisegundos
 * @param {boolean} immediate - Si ejecutar inmediatamente
 * @returns {Function} Función con debounce aplicado
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func(...args);
      }
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func(...args);
    }
  };
};

/**
 * Throttle function - Limita la frecuencia de ejecución de una función
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite en milisegundos
 * @returns {Function} Función con throttle aplicado
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Formateo de precios en pesos argentinos
 * @param {number} price - Precio a formatear
 * @param {string} currency - Moneda (default: ARS)
 * @returns {string} Precio formateado
 */
export const formatPrice = (price, currency = 'ARS') => {
  if (typeof price !== 'number' || Number.isNaN(price)) {
    return '$0';
  }

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Formateo de números con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} Número formateado
 */
export const formatNumber = (number) => {
  if (typeof number !== 'number' || Number.isNaN(number)) {
    return '0';
  }

  return new Intl.NumberFormat('es-AR').format(number);
};

/**
 * Validación de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitización de texto para prevenir XSS
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Generación de IDs únicos
 * @param {string} prefix - Prefijo para el ID
 * @returns {string} ID único
 */
export const generateId = (prefix = 'id') => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${randomStr}`;
};

/**
 * Deep clone de objetos
 * @param {any} obj - Objeto a clonar
 * @returns {any} Objeto clonado
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item));
  }

  if (typeof obj === 'object') {
    const clonedObj = {};
    Object.keys(obj).forEach((key) => {
      clonedObj[key] = deepClone(obj[key]);
    });
    return clonedObj;
  }

  return obj;
};

/**
 * Verificar si un elemento está visible en el viewport
 * @param {HTMLElement} element - Elemento a verificar
 * @param {number} threshold - Porcentaje de visibilidad requerido (0-1)
 * @returns {boolean} True si está visible
 */
export const isElementVisible = (element, threshold = 0.1) => {
  if (!element) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const verticalVisible = rect.top <= windowHeight && rect.bottom >= 0;
  const horizontalVisible = rect.left <= windowWidth && rect.right >= 0;

  if (!verticalVisible || !horizontalVisible) {
    return false;
  }

  const visibleArea = Math.max(0, Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)) *
                     Math.max(0, Math.min(rect.right, windowWidth) - Math.max(rect.left, 0));
  const totalArea = rect.width * rect.height;

  return visibleArea / totalArea >= threshold;
};

/**
 * Scroll suave a un elemento
 * @param {HTMLElement|string} target - Elemento o selector
 * @param {number} offset - Offset desde el top
 * @param {string} behavior - Comportamiento del scroll
 */
export const smoothScrollTo = (target, offset = 0, behavior = 'smooth') => {
  let element;

  if (typeof target === 'string') {
    element = document.querySelector(target);
  } else if (target instanceof HTMLElement) {
    element = target;
  }

  if (!element) {
    return;
  }

  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior,
  });
};

/**
 * Obtener parámetros de la URL
 * @param {string} param - Nombre del parámetro
 * @returns {string|null} Valor del parámetro o null
 */
export const getUrlParameter = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

/**
 * Actualizar parámetros de la URL sin recargar
 * @param {Object} params - Objeto con parámetros
 * @param {boolean} replace - Si reemplazar la historia actual
 */
export const updateUrlParameters = (params, replace = false) => {
  const url = new URL(window.location);
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });

  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
};

/**
 * Detectar el tipo de dispositivo
 * @returns {string} Tipo de dispositivo (mobile, tablet, desktop)
 */
export const getDeviceType = () => {
  const width = window.innerWidth;
  
  if (width <= 768) {
    return 'mobile';
  } else if (width <= 1024) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Verificar soporte de características del navegador
 * @param {string} feature - Característica a verificar
 * @returns {boolean} True si está soportada
 */
export const hasSupport = (feature) => {
  const features = {
    localStorage: () => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    },
    intersectionObserver: () => 'IntersectionObserver' in window,
    serviceWorker: () => 'serviceWorker' in navigator,
    webp: () => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/webp').indexOf('webp') > -1;
    },
    touchEvents: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };

  return features[feature] ? features[feature]() : false;
};

/**
 * Retry function con backoff exponencial
 * @param {Function} fn - Función a reintentar
 * @param {number} retries - Número de reintentos
 * @param {number} delay - Delay inicial en ms
 * @returns {Promise} Promesa de la función
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
};

/**
 * Crear elemento DOM con atributos
 * @param {string} tag - Tag del elemento
 * @param {Object} attributes - Atributos del elemento
 * @param {string|HTMLElement[]} children - Contenido hijo
 * @returns {HTMLElement} Elemento creado
 */
export const createElement = (tag, attributes = {}, children = []) => {
  const element = document.createElement(tag);

  // Establecer atributos
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2), value);
    } else {
      element.setAttribute(key, value);
    }
  });

  // Agregar hijos
  if (typeof children === 'string') {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach((child) => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof HTMLElement) {
        element.appendChild(child);
      }
    });
  }

  return element;
};

/**
 * Constantes del proyecto
 */
export const CONSTANTS = {
  STORAGE_KEYS: {
    CART: 'thc_growshop_cart',
    PREFERENCES: 'thc_growshop_preferences',
    LAST_VISIT: 'thc_growshop_last_visit',
  },
  
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1200,
  },
  
  TIMEOUTS: {
    DEBOUNCE_SEARCH: 300,
    DEBOUNCE_SCROLL: 100,
    NOTIFICATION_DURATION: 3000,
    API_TIMEOUT: 10000,
  },
  
  ANIMATION_DURATIONS: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  API_ENDPOINTS: {
    PRODUCTS: '/api/products.json',
    SEEDS: '/api/seeds.json',
  },
};
