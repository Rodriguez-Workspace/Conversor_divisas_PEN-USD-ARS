/**
 * Servicio de API
 * Gestiona todas las llamadas a APIs externas y serverless functions
 * Responsabilidad única: Comunicación con APIs
 */

import { API_CONFIG } from '../config/constants.js';

class ApiService {
  /**
   * Obtiene la tasa de cambio de SUNAT (PEN/USD)
   * Usa Netlify Function como proxy principal
   * @returns {Promise<Object>} Datos de SUNAT
   */
  async fetchSunatRate() {
    // Intento 1: Netlify Function (proxy serverless)
    try {
      const response = await fetch(API_CONFIG.sunat.primary);
      if (response.ok) {
        const data = await response.json();
        console.log('ApiService: SUNAT desde Netlify Function', data);
        return data;
      }
    } catch (error) {
      console.warn('ApiService: Netlify Function falló', error.message);
    }

    // Intento 2: API directa (puede fallar por CORS)
    try {
      const response = await fetch(API_CONFIG.sunat.fallback);
      if (response.ok) {
        const data = await response.json();
        console.log('ApiService: SUNAT desde API directa', data);
        return data;
      }
    } catch (error) {
      console.warn('ApiService: API directa bloqueada por CORS');
    }

    throw new Error('No se pudo obtener tasa de SUNAT de ninguna fuente');
  }

  /**
   * Obtiene la cotización del dólar blue (USD/ARS)
   * @returns {Promise<Object>} Datos de DolarAPI
   */
  async fetchDolarBlueRate() {
    // Intento 1: API directa
    try {
      const response = await fetch(API_CONFIG.dolarBlue.primary);
      if (response.ok) {
        const data = await response.json();
        console.log('ApiService: DolarAPI respuesta directa', data);
        return data;
      }
    } catch (error) {
      console.warn('ApiService: DolarAPI directa falló', error.message);
    }

    // Intento 2: Proxy CORS
    try {
      const proxyUrl =
        API_CONFIG.dolarBlue.proxy +
        encodeURIComponent(API_CONFIG.dolarBlue.primary);
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('ApiService: DolarAPI respuesta con proxy', data);
      return data;
    } catch (error) {
      console.error('ApiService: Error total en DolarAPI', error);
      throw error;
    }
  }

  /**
   * Obtiene ambas tasas en paralelo
   * @returns {Promise<Array>} [sunatData, dolarApiData]
   */
  async fetchAllRates() {
    return Promise.all([this.fetchSunatRate(), this.fetchDolarBlueRate()]);
  }

  /**
   * Valida la estructura de datos de SUNAT
   * @param {Object} data - Datos de SUNAT
   * @returns {boolean}
   */
  validateSunatData(data) {
    return data && data.compra && data.venta;
  }

  /**
   * Valida la estructura de datos de DolarAPI
   * @param {Object} data - Datos de DolarAPI
   * @returns {boolean}
   */
  validateDolarBlueData(data) {
    return data && data.compra && data.venta;
  }
}

// Exportar instancia singleton
export const apiService = new ApiService();
