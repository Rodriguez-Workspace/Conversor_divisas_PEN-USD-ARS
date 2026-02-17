/**
 * Conversor de Divisas
 * Lógica pura de conversión de divisas
 * NO depende de DOM, APIs ni persistencia
 * Responsabilidad única: Cálculos de conversión
 */

import { CURRENCIES } from '../config/constants.js';
import { isValidNumber } from '../utils/formatters.js';

class CurrencyConverter {
  constructor() {
    this.rates = {
      penToUsd: null,
      usdToArs: null,
    };
  }

  /**
   * Actualiza las tasas de cambio
   * @param {Object} rates - { penToUsd, usdToArs }
   * @returns {boolean} True si las tasas son válidas
   */
  setRates(rates) {
    if (!isValidNumber(rates.penToUsd) || !isValidNumber(rates.usdToArs)) {
      console.error('CurrencyConverter: Tasas inválidas', rates);
      return false;
    }

    this.rates.penToUsd = rates.penToUsd;
    this.rates.usdToArs = rates.usdToArs;
    console.log('CurrencyConverter: Tasas actualizadas', this.rates);
    return true;
  }

  /**
   * Verifica si hay tasas disponibles
   * @returns {boolean}
   */
  hasRates() {
    return this.rates.penToUsd !== null && this.rates.usdToArs !== null;
  }

  /**
   * Obtiene las tasas actuales
   * @returns {Object} { penToUsd, usdToArs }
   */
  getRates() {
    return { ...this.rates };
  }

  /**
   * Limpia las tasas
   */
  clearRates() {
    this.rates.penToUsd = null;
    this.rates.usdToArs = null;
  }

  /**
   * Convierte desde PEN a otras monedas
   * @param {number} amount - Monto en PEN
   * @returns {Object} { USD, ARS }
   */
  convertFromPEN(amount) {
    if (!this.hasRates() || !isValidNumber(amount)) {
      return { USD: 0, ARS: 0 };
    }

    const usd = amount / this.rates.penToUsd;
    const ars = usd * this.rates.usdToArs;

    return {
      USD: usd,
      ARS: ars,
    };
  }

  /**
   * Convierte desde USD a otras monedas
   * @param {number} amount - Monto en USD
   * @returns {Object} { PEN, ARS }
   */
  convertFromUSD(amount) {
    if (!this.hasRates() || !isValidNumber(amount)) {
      return { PEN: 0, ARS: 0 };
    }

    const pen = amount * this.rates.penToUsd;
    const ars = amount * this.rates.usdToArs;

    return {
      PEN: pen,
      ARS: ars,
    };
  }

  /**
   * Convierte desde ARS a otras monedas
   * @param {number} amount - Monto en ARS
   * @returns {Object} { PEN, USD }
   */
  convertFromARS(amount) {
    if (!this.hasRates() || !isValidNumber(amount)) {
      return { PEN: 0, USD: 0 };
    }

    const usd = amount / this.rates.usdToArs;
    const pen = usd * this.rates.penToUsd;

    return {
      PEN: pen,
      USD: usd,
    };
  }

  /**
   * Convierte desde cualquier moneda
   * @param {string} sourceCurrency - Código de moneda origen (PEN, USD, ARS)
   * @param {number} amount - Monto a convertir
   * @returns {Object} Objeto con todas las conversiones
   */
  convert(sourceCurrency, amount) {
    if (!this.hasRates()) {
      throw new Error('No hay tasas de cambio disponibles');
    }

    if (!isValidNumber(amount) || amount <= 0) {
      return this._emptyConversion();
    }

    switch (sourceCurrency) {
      case CURRENCIES.PEN.code:
        return {
          PEN: amount,
          ...this.convertFromPEN(amount),
        };

      case CURRENCIES.USD.code:
        return {
          USD: amount,
          ...this.convertFromUSD(amount),
        };

      case CURRENCIES.ARS.code:
        return {
          ARS: amount,
          ...this.convertFromARS(amount),
        };

      default:
        throw new Error(`Moneda no soportada: ${sourceCurrency}`);
    }
  }

  /**
   * Retorna conversión vacía
   * @private
   */
  _emptyConversion() {
    return {
      PEN: 0,
      USD: 0,
      ARS: 0,
    };
  }

  /**
   * Calcula tasa promedio de SUNAT
   * @param {Object} sunatData - Datos de SUNAT { compra, venta }
   * @returns {number} Tasa promedio
   */
  static calculateSunatRate(sunatData) {
    const compra = parseFloat(sunatData.compra);
    const venta = parseFloat(sunatData.venta);
    return (compra + venta) / 2;
  }

  /**
   * Obtiene la mejor tasa de DolarAPI
   * @param {Object} dolarData - Datos de DolarAPI { compra, venta }
   * @returns {number} Mejor tasa
   */
  static calculateDolarBlueRate(dolarData) {
    const compra = parseFloat(dolarData.compra);
    const venta = parseFloat(dolarData.venta);
    return Math.max(compra, venta);
  }
}

// Exportar instancia singleton
export const converter = new CurrencyConverter();
