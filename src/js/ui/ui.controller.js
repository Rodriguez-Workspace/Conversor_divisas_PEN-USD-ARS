/**
 * Controlador de UI
 * Maneja toda la interacción con el DOM
 * Responsabilidad única: Renderizado y eventos de UI
 */

import { APP_CONFIG, CURRENCIES, APP_STATES } from '../config/constants.js';
import { formatNumber, formatDate, parseInputValue } from '../utils/formatters.js';

class UIController {
  constructor() {
    this.elements = {};
    this.debounceTimer = null;
    this.isConverting = false;
    this.inputCallbacks = {};
  }

  /**
   * Inicializa referencias a elementos del DOM
   */
  init() {
    this.elements = {
      // Inputs de monedas
      penInput: document.getElementById('penInput'),
      usdInput: document.getElementById('usdInput'),
      arsInput: document.getElementById('arsInput'),

      // Botones y controles
      refreshBtn: document.getElementById('refreshBtn'),

      // Indicadores de estado
      lastUpdate: document.getElementById('lastUpdate'),
      rateDisplay: document.getElementById('rateDisplay'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      errorMessage: document.getElementById('errorMessage'),
      dataStatus: document.getElementById('dataStatus'),
    };

    console.log('UIController: Elementos del DOM inicializados');
  }

  /**
   * Registra event listeners
   * @param {Object} callbacks - { onInput, onRefresh }
   */
  attachEventListeners(callbacks) {
    this.inputCallbacks = callbacks;

    // Inputs de monedas
    this.elements.penInput.addEventListener('input', () =>
      this._handleInput(CURRENCIES.PEN.code)
    );
    this.elements.usdInput.addEventListener('input', () =>
      this._handleInput(CURRENCIES.USD.code)
    );
    this.elements.arsInput.addEventListener('input', () =>
      this._handleInput(CURRENCIES.ARS.code)
    );

    // Botón de refresh
    this.elements.refreshBtn.addEventListener('click', async () => {
      this.elements.refreshBtn.classList.add('spinning');
      await callbacks.onRefresh();
      this.elements.refreshBtn.classList.remove('spinning');
    });

    // Prevenir submit de formularios
    document.addEventListener('submit', (e) => e.preventDefault());

    console.log('UIController: Event listeners registrados');
  }

  /**
   * Maneja input con debounce
   * @private
   */
  _handleInput(currency) {
    // Si está convirtiendo, ignorar input (prevenir loops)
    if (this.isConverting) {
      console.log('UIController: Input ignorado, conversión en curso');
      return;
    }
    
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (!this.isConverting && this.inputCallbacks.onInput) {
        console.log('UIController: Llamando onInput callback para', currency);
        this.inputCallbacks.onInput(currency);
      }
    }, APP_CONFIG.debounceDelay);
  }

  /**
   * Obtiene el valor de un input
   * @param {string} currency - Código de moneda
   * @returns {number}
   */
  getInputValue(currency) {
    const input = this._getInputElement(currency);
    const value = parseInputValue(input.value);
    console.log(`UIController.getInputValue(${currency}):`, value);
    return value;
  }

  /**
   * Establece el valor de un input
   * @param {string} currency - Código de moneda
   * @param {number} value - Valor a establecer
   * @param {number} decimals - Cantidad de decimales
   */
  setInputValue(currency, value, decimals = 2) {
    const input = this._getInputElement(currency);
    const formattedValue = value > 0 ? value.toFixed(decimals) : '';
    console.log(`UIController.setInputValue(${currency}):`, formattedValue, `[isConverting=${this.isConverting}]`);
    input.value = formattedValue;
  }

  /**
   * Limpia todos los inputs
   */
  clearInputs() {
    this.elements.penInput.value = '';
    this.elements.usdInput.value = '';
    this.elements.arsInput.value = '';
  }

  /**
   * Bloquea las conversiones temporalmente
   * @param {Function} callback - Función a ejecutar sin loops
   */
  async withoutLoops(callback) {
    this.isConverting = true;
    try {
      await callback();
    } finally {
      this.isConverting = false;
    }
  }

  /**
   * Renderiza el estado de la aplicación
   * @param {Object} state - Estado de la aplicación
   */
  render(state) {
    this._renderStatus(state.status, state.isRealTime);
    this._renderLastUpdate(state.lastUpdate);
    this._renderRates(state.rates);
    this._renderError(state.error);
    this._renderLoading(state.status === APP_STATES.LOADING);
  }

  /**
   * Renderiza el indicador de estado
   * @private
   */
  _renderStatus(status, isRealTime) {
    const statusElement = this.elements.dataStatus;
    if (!statusElement) return;

    switch (status) {
      case APP_STATES.ONLINE:
        statusElement.innerHTML =
          '<span class="status-online">Datos en tiempo real</span>';
        statusElement.className = 'data-status online';
        break;

      case APP_STATES.OFFLINE:
        statusElement.innerHTML =
          '<span class="status-offline">Usando datos guardados (offline)</span>';
        statusElement.className = 'data-status offline';
        break;

      case APP_STATES.ERROR:
        statusElement.innerHTML =
          '<span class="status-error">Sin datos disponibles</span>';
        statusElement.className = 'data-status error';
        break;

      case APP_STATES.LOADING:
        statusElement.innerHTML = '<span>Cargando datos...</span>';
        statusElement.className = 'data-status';
        break;
    }
  }

  /**
   * Renderiza la última actualización
   * @private
   */
  _renderLastUpdate(timestamp) {
    if (!this.elements.lastUpdate) return;

    const formattedDate = formatDate(timestamp);
    this.elements.lastUpdate.textContent = `Última actualización: ${formattedDate}`;
  }

  /**
   * Renderiza las tasas de cambio
   * @private
   */
  _renderRates(rates) {
    if (!this.elements.rateDisplay) return;

    if (!rates) {
      this.elements.rateDisplay.innerHTML =
        '<span>No hay tipos de cambio disponibles</span>';
      return;
    }

    const penValue = rates.penToUsd.toFixed(3); // 3 decimales para PEN
    const arsValue = formatNumber(rates.usdToArs, 2);

    this.elements.rateDisplay.innerHTML = `
      <span>${CURRENCIES.PEN.flag} ${penValue} PEN  |  ${CURRENCIES.USD.flag} 1 USD  |  ${CURRENCIES.ARS.flag} ${arsValue} ARS</span>
    `;
  }

  /**
   * Muestra/oculta el indicador de carga
   * @private
   */
  _renderLoading(show) {
    if (!this.elements.loadingIndicator) return;

    if (show) {
      this.elements.loadingIndicator.classList.remove('hidden');
    } else {
      this.elements.loadingIndicator.classList.add('hidden');
    }
  }

  /**
   * Muestra un mensaje de error
   * @private
   */
  _renderError(error) {
    if (!this.elements.errorMessage) return;

    if (error) {
      this.elements.errorMessage.textContent = error;
      this.elements.errorMessage.classList.remove('hidden');

      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        this.elements.errorMessage.classList.add('hidden');
      }, 5000);
    } else {
      this.elements.errorMessage.classList.add('hidden');
    }
  }

  /**
   * Obtiene el elemento de input por moneda
   * @private
   */
  _getInputElement(currency) {
    switch (currency) {
      case CURRENCIES.PEN.code:
        return this.elements.penInput;
      case CURRENCIES.USD.code:
        return this.elements.usdInput;
      case CURRENCIES.ARS.code:
        return this.elements.arsInput;
      default:
        throw new Error(`Moneda no soportada: ${currency}`);
    }
  }
}

// Exportar instancia singleton
export const uiController = new UIController();
