/**
 * NOTIFICATION SERVICE - Sistema de notificaciones premium
 * Gestiona notificaciones con diseño elegante y profesional
 * @author THC Growshop
 * @version 2.0.0
 */

(function(window) {
    'use strict';
    
    // Configuración de tipos de notificaciones
    const NOTIFICATION_TYPES = {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    };
    
    // Configuración de duraciones por defecto (en ms)
    const DEFAULT_DURATIONS = {
        [NOTIFICATION_TYPES.SUCCESS]: 3000,
        [NOTIFICATION_TYPES.ERROR]: 5000,
        [NOTIFICATION_TYPES.WARNING]: 4000,
        [NOTIFICATION_TYPES.INFO]: 3000
    };
    
    // Clases CSS
    const NOTIFICATION_CLASS = 'notification';
    const NOTIFICATION_VISIBLE_CLASS = 'notification--visible';
    
    // Contenedor de notificaciones
    let notificationContainer = null;
    
    /**
     * Inicializa el contenedor de notificaciones
     */
    function initContainer() {
        if (notificationContainer) {return;}
        
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notifications';
        notificationContainer.setAttribute('aria-live', 'polite');
        notificationContainer.setAttribute('aria-atomic', 'false');
        document.body.appendChild(notificationContainer);
    }
    
    /**
     * Muestra una notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación (success, error, warning, info)
     * @param {number} [duration] - Duración en milisegundos
     * @returns {HTMLElement} - Elemento de notificación creado
     */
    function showNotification(message, type, duration) {
        // Inicializar el contenedor si es necesario
        initContainer();
        
        // Validar el tipo de notificación
        const notificationType = Object.values(NOTIFICATION_TYPES).includes(type) 
            ? type 
            : NOTIFICATION_TYPES.INFO;
        
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `${NOTIFICATION_CLASS} ${NOTIFICATION_CLASS}--${notificationType}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
        // Agregar ícono según el tipo
        let icon = '';
        switch (notificationType) {
            case NOTIFICATION_TYPES.SUCCESS:
                icon = '<i class="fas fa-check-circle" aria-hidden="true"></i>';
                break;
            case NOTIFICATION_TYPES.ERROR:
                icon = '<i class="fas fa-exclamation-circle" aria-hidden="true"></i>';
                break;
            case NOTIFICATION_TYPES.WARNING:
                icon = '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i>';
                break;
            default:
                icon = '<i class="fas fa-info-circle" aria-hidden="true"></i>';
        }
        
        // Establecer contenido
        notification.innerHTML = 
            `<div class="${NOTIFICATION_CLASS}__icon">${icon}</div>` +
            `<div class="${NOTIFICATION_CLASS}__content">${message}</div>` +
            `<button class="${NOTIFICATION_CLASS}__close" aria-label="Cerrar notificación">` +
                `<i class="fas fa-times" aria-hidden="true"></i>` +
            `</button>`;
        
        // Agregar al DOM
        notificationContainer.appendChild(notification);
        
        // Forzar reflow para la animación
        void notification.offsetWidth;
        
        // Mostrar con animación
        notification.classList.add(NOTIFICATION_VISIBLE_CLASS);
        
        // Configurar cierre manual
        const closeBtn = notification.querySelector(`.${NOTIFICATION_CLASS}__close`);
        closeBtn.addEventListener('click', () => {
            removeNotification(notification);
        });
        
        // Configurar cierre automático si se especifica duración
        const autoCloseDuration = duration !== undefined 
            ? duration 
            : DEFAULT_DURATIONS[notificationType] || 3000;
            
        if (autoCloseDuration > 0) {
            const timeoutId = setTimeout(() => {
                removeNotification(notification);
            }, autoCloseDuration);
            
            // Guardar el ID del timeout para poder cancelarlo si es necesario
            notification.dataset.timeoutId = timeoutId;
        }
        
        return notification;
    }
    
    /**
     * Elimina una notificación con animación
     * @param {HTMLElement} notification - Elemento de notificación a eliminar
     */
    function removeNotification(notification) {
        if (!notification) {return;}
        
        // Cancelar el timeout si existe
        if (notification.dataset.timeoutId) {
            clearTimeout(parseInt(notification.dataset.timeoutId, 10));
        }
        
        // Iniciar animación de salida
        notification.classList.remove(NOTIFICATION_VISIBLE_CLASS);
        
        // Eliminar después de la animación
        setTimeout(() => {
            if (notification && notification.parentNode === notificationContainer) {
                notificationContainer.removeChild(notification);
            }
        }, 300); // Debe coincidir con la duración de la animación CSS
    }
    
    /**
     * Muestra una notificación de éxito
     * @param {string} message - Mensaje a mostrar
     * @param {number} [duration] - Duración en milisegundos (opcional)
     * @returns {HTMLElement} - Elemento de notificación creado
     */
    function success(message, duration) {
        return showNotification(message, NOTIFICATION_TYPES.SUCCESS, duration);
    }
    
    /**
     * Muestra una notificación de error
     * @param {string} message - Mensaje a mostrar
     * @param {number} [duration] - Duración en milisegundos (opcional)
     * @returns {HTMLElement} - Elemento de notificación creado
     */
    function error(message, duration) {
        return showNotification(message, NOTIFICATION_TYPES.ERROR, duration);
    }
    
    /**
     * Muestra una notificación de advertencia
     * @param {string} message - Mensaje a mostrar
     * @param {number} [duration] - Duración en milisegundos (opcional)
     * @returns {HTMLElement} - Elemento de notificación creado
     */
    function warning(message, duration) {
        return showNotification(message, NOTIFICATION_TYPES.WARNING, duration);
    }
    
    /**
     * Muestra una notificación informativa
     * @param {string} message - Mensaje a mostrar
     * @param {number} [duration] - Duración en milisegundos (opcional)
     * @returns {HTMLElement} - Elemento de notificación creado
     */
    function info(message, duration) {
        return showNotification(message, NOTIFICATION_TYPES.INFO, duration);
    }
    
    // Crear el objeto del servicio
    const NotificationService = {
        success,
        error,
        warning,
        info,
        show: showNotification,
        remove: removeNotification
    };
    
    // Hacer disponible globalmente
    window.NotificationService = NotificationService;
    
    // Inicializar el contenedor cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initContainer);
    } else {
        initContainer();
    }
    
})(window);
