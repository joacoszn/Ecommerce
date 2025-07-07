/**
 * Componente de notificaciones
 * @module components/Notification
 */

/**
 * Clase para mostrar notificaciones
 * @class
 */
class Notification {
  /**
   * Crea una instancia de Notification
   * @param {Object} config - Configuración de la notificación
   * @param {string} [config.position='top-right'] - Posición de la notificación (top-right, top-left, bottom-right, bottom-left)
   * @param {number} [config.duration=3000] - Duración en ms antes de que se cierre automáticamente
   */
  constructor({ position = 'top-right', duration = 3000 } = {}) {
    this.position = position;
    this.duration = duration;
    this.container = null;
    this.notifications = new Set();
    
    this._init();
  }
  
  /**
   * Inicializa el contenedor de notificaciones
   * @private
   */
  _init() {
    // Crear contenedor si no existe
    let container = document.querySelector('.notifications-container');
    
    if (!container) {
      container = document.createElement('div');
      container.className = `notifications-container notifications--${this.position}`;
      document.body.appendChild(container);
    }
    
    this.container = container;
  }
  
  /**
   * Muestra una notificación
   * @param {string} message - Mensaje a mostrar
   * @param {string} [type='info'] - Tipo de notificación (success, error, warning, info)
   * @param {number} [duration] - Duración en ms (opcional, usa el valor por defecto si no se especifica)
   * @returns {Function} Función para cerrar manualmente la notificación
   */
  show(message, type = 'info', duration) {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'notification__message';
    messageEl.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notification__close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Cerrar notificación');
    
    notification.appendChild(messageEl);
    notification.appendChild(closeBtn);
    
    // Agregar al DOM
    this.container.appendChild(notification);
    
    // Forzar reflow para la animación
    // eslint-disable-next-line no-unused-expressions
    notification.offsetHeight;
    
    notification.classList.add('notification--show');
    
    // Cerrar automáticamente después de la duración
    const durationMs = duration !== undefined ? duration : this.duration;
    let timeoutId;
    
    if (durationMs > 0) {
      timeoutId = setTimeout(() => {
        this._removeNotification(notification);
      }, durationMs);
    }
    
    // Manejar el cierre manual
    const close = () => {
      clearTimeout(timeoutId);
      this._removeNotification(notification);
    };
    
    closeBtn.addEventListener('click', close);
    
    // Agregar a la lista de notificaciones activas
    this.notifications.add({
      element: notification,
      close,
      timeoutId
    });
    
    return close;
  }
  
  /**
   * Elimina una notificación
   * @param {HTMLElement} notification - Elemento de notificación a eliminar
   * @private
   */
  _removeNotification(notification) {
    if (!notification) {return;}
    
    notification.classList.remove('notification--show');
    notification.classList.add('notification--hide');
    
    // Eliminar después de la animación
    notification.addEventListener('transitionend', () => {
      if (notification.parentNode === this.container) {
        this.container.removeChild(notification);
      }
      
      // Eliminar de la lista de notificaciones activas
      for (const item of this.notifications) {
        if (item.element === notification) {
          this.notifications.delete(item);
          break;
        }
      }
    }, { once: true });
  }
  
  /**
   * Muestra una notificación de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {number} [duration] - Duración en ms (opcional)
   * @returns {Function} Función para cerrar manualmente la notificación
   */
  success(message, duration) {
    return this.show(message, 'success', duration);
  }
  
  /**
   * Muestra una notificación de error
   * @param {string} message - Mensaje a mostrar
   * @param {number} [duration] - Duración en ms (opcional)
   * @returns {Function} Función para cerrar manualmente la notificación
   */
  error(message, duration) {
    return this.show(message, 'error', duration);
  }
  
  /**
   * Muestra una notificación de advertencia
   * @param {string} message - Mensaje a mostrar
   * @param {number} [duration] - Duración en ms (opcional)
   * @returns {Function} Función para cerrar manualmente la notificación
   */
  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }
  
  /**
   * Muestra una notificación informativa
   * @param {string} message - Mensaje a mostrar
   * @param {number} [duration] - Duración en ms (opcional)
   * @returns {Function} Función para cerrar manualmente la notificación
   */
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Exportar una instancia única del servicio
export const notificationService = new Notification();

export default Notification;
