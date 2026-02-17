/**
 * Utilidades de formateo
 * Funciones puras para formatear números y fechas
 */

/**
 * Formatea un número con separadores de miles y decimales
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Cantidad de decimales
 * @returns {string} Número formateado
 */
export function formatNumber(value, decimals = 2) {
  if (isNaN(value)) return '0.00';

  return value.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formatea una fecha a formato legible
 * @param {string|Date} timestamp - Timestamp a formatear
 * @returns {string} Fecha formateada
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'Sin datos disponibles';

  const date = new Date(timestamp);

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parsea un valor de input eliminando separadores
 * @param {string} value - Valor del input
 * @returns {number} Valor numérico
 */
export function parseInputValue(value) {
  if (!value || value === '') return 0;
  return parseFloat(value.replace(/,/g, '')) || 0;
}

/**
 * Valida si un valor es un número válido
 * @param {any} value - Valor a validar
 * @returns {boolean} True si es un número válido
 */
export function isValidNumber(value) {
  return !isNaN(value) && isFinite(value) && value !== null;
}
