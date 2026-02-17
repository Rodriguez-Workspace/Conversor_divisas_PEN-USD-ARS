/**
 * Gestor de Estado de la Aplicación
 * Centraliza el estado y notifica a los observadores
 * Implementa patrón Observer para reactividad
 */

import { APP_STATES } from '../config/constants.js';

class StateManager {
  constructor() {
    this.state = {
      status: APP_STATES.LOADING,
      rates: null,
      lastUpdate: null,
      isRealTime: false,
      error: null,
    };

    this.observers = [];
  }

  /**
   * Registra un observador para cambios de estado
   * @param {Function} callback - Función a llamar cuando cambie el estado
   * @returns {Function} Función para desuscribirse
   */
  subscribe(callback) {
    this.observers.push(callback);
    // Retornar función de desuscripción
    return () => {
      this.observers = this.observers.filter((obs) => obs !== callback);
    };
  }

  /**
   * Notifica a todos los observadores
   * @private
   */
  _notify() {
    this.observers.forEach((callback) => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('StateManager: Error en observador', error);
      }
    });
  }

  /**
   * Actualiza el estado parcialmente
   * @param {Object} updates - Cambios al estado
   */
  setState(updates) {
    this.state = {
      ...this.state,
      ...updates,
    };
    console.log('StateManager: Estado actualizado', this.state);
    this._notify();
  }

  /**
   * Obtiene el estado actual (inmutable)
   * @returns {Object} Copia del estado
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Establece estado de carga
   */
  setLoading() {
    this.setState({
      status: APP_STATES.LOADING,
      error: null,
    });
  }

  /**
   * Establece estado online con datos
   * @param {Object} rates - Tasas de cambio
   * @param {string} timestamp - Timestamp de actualización
   */
  setOnline(rates, timestamp) {
    this.setState({
      status: APP_STATES.ONLINE,
      rates,
      lastUpdate: timestamp,
      isRealTime: true,
      error: null,
    });
  }

  /**
   * Establece estado offline con datos cacheados
   * @param {Object} rates - Tasas de cambio cacheadas
   * @param {string} timestamp - Timestamp del caché
   */
  setOffline(rates, timestamp) {
    this.setState({
      status: APP_STATES.OFFLINE,
      rates,
      lastUpdate: timestamp,
      isRealTime: false,
      error: null,
    });
  }

  /**
   * Establece estado de error
   * @param {string} message - Mensaje de error
   */
  setError(message) {
    this.setState({
      status: APP_STATES.ERROR,
      error: message,
    });
  }

  /**
   * Limpia el error
   */
  clearError() {
    this.setState({
      error: null,
    });
  }

  /**
   * Verifica si hay tasas disponibles
   * @returns {boolean}
   */
  hasRates() {
    return this.state.rates !== null;
  }

  /**
   * Verifica si está en estado de carga
   * @returns {boolean}
   */
  isLoading() {
    return this.state.status === APP_STATES.LOADING;
  }

  /**
   * Verifica si hay error
   * @returns {boolean}
   */
  hasError() {
    return this.state.error !== null;
  }

  /**
   * Reinicia el estado a valores iniciales
   */
  reset() {
    this.state = {
      status: APP_STATES.LOADING,
      rates: null,
      lastUpdate: null,
      isRealTime: false,
      error: null,
    };
    this._notify();
  }
}

// Exportar instancia singleton
export const stateManager = new StateManager();
