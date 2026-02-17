/**
 * Punto de entrada principal de la aplicación
 * Orquesta todos los módulos y sus interacciones
 * Arquitectura: Service Layer + Controller + State Management
 */

import { APP_CONFIG } from './config/constants.js';
import { storageService } from './services/storage.service.js';
import { apiService } from './services/api.service.js';
import { converter } from './core/converter.js';
import { stateManager } from './core/state-manager.js';
import { uiController } from './ui/ui.controller.js';

/**
 * Clase principal de la aplicación
 */
class App {
  constructor() {
    this.isInitialized = false;
  }

  /**
   * Inicializa la aplicación
   */
  async init() {
    if (this.isInitialized) return;

    console.log(`${APP_CONFIG.name} v${APP_CONFIG.version} - Iniciando...`);

    try {
      // 1. Inicializar servicios
      await this._initServices();

      // 2. Inicializar UI
      this._initUI();

      // 3. Suscribirse a cambios de estado
      this._subscribeToState();

      // 4. Registrar Service Worker
      await this._registerServiceWorker();

      // 5. Cargar tasas iniciales
      await this.loadExchangeRates();

      this.isInitialized = true;
      console.log('App: Inicialización completa');
    } catch (error) {
      console.error('App: Error en inicialización', error);
      stateManager.setError('Error al inicializar la aplicación');
    }
  }

  /**
   * Inicializa servicios de persistencia
   * @private
   */
  async _initServices() {
    try {
      await storageService.init();
    } catch (error) {
      console.error('App: Error al inicializar servicios', error);
      // No es crítico, la app puede funcionar sin persistencia
    }
  }

  /**
   * Inicializa el controlador de UI
   * @private
   */
  _initUI() {
    uiController.init();
    uiController.attachEventListeners({
      onInput: (currency) => this.handleConversion(currency),
      onRefresh: () => this.loadExchangeRates(true),
    });
  }

  /**
   * Se suscribe a cambios de estado para actualizar UI
   * @private
   */
  _subscribeToState() {
    stateManager.subscribe((state) => {
      uiController.render(state);
    });
  }

  /**
   * Registra el Service Worker
   * @private
   */
  async _registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      await navigator.serviceWorker.register('/src/sw.js');
      console.log('App: Service Worker registrado');
    } catch (error) {
      console.warn('App: Error al registrar Service Worker', error);
    }
  }

  /**
   * Carga las tasas de cambio
   * @param {boolean} forceRefresh - Forzar actualización desde APIs
   */
  async loadExchangeRates(forceRefresh = false) {
    stateManager.setLoading();

    try {
      // Intento 1: Cargar desde caché si no es refresh forzado
      if (!forceRefresh) {
        const cached = await storageService.loadRates();
        if (cached) {
          const rates = {
            penToUsd: cached.penToUsd,
            usdToArs: cached.usdToArs,
          };
          converter.setRates(rates);
          stateManager.setOffline(rates, cached.timestamp);
          return;
        }
      }

      // Intento 2: Fetch desde APIs
      const [sunatData, dolarApiData] = await apiService.fetchAllRates();

      // Validar datos
      if (!apiService.validateSunatData(sunatData)) {
        throw new Error('Datos de SUNAT inválidos');
      }
      if (!apiService.validateDolarBlueData(dolarApiData)) {
        throw new Error('Datos de DolarAPI inválidos');
      }

      // Calcular tasas
      const rates = {
        penToUsd: converter.constructor.calculateSunatRate(sunatData),
        usdToArs: converter.constructor.calculateDolarBlueRate(dolarApiData),
      };

      // Actualizar conversor
      converter.setRates(rates);

      // Guardar en caché
      const sunatDate = sunatData.fecha || new Date().toISOString();
      const blueDate = dolarApiData.fechaActualizacion || new Date().toISOString();
      await storageService.saveRates(rates, sunatDate, blueDate);

      // Actualizar estado
      const timestamp = new Date().toISOString();
      stateManager.setOnline(rates, timestamp);
    } catch (error) {
      console.error('App: Error al cargar tasas', error);
      await this._handleLoadError();
    }
  }

  /**
   * Maneja errores al cargar tasas
   * @private
   */
  async _handleLoadError() {
    // Intentar usar datos de caché
    const cached = await storageService.loadRates();
    if (cached) {
      const rates = {
        penToUsd: cached.penToUsd,
        usdToArs: cached.usdToArs,
      };
      converter.setRates(rates);
      stateManager.setOffline(rates, cached.timestamp);
      stateManager.setError('Sin conexión. Usando último tipo de cambio guardado.');
    } else {
      // No hay datos disponibles
      converter.clearRates();
      stateManager.setError(
        'No hay conexión y no existe un tipo de cambio guardado previamente. Por favor, conéctate a internet.'
      );
    }
  }

  /**
   * Maneja la conversión de divisas
   * @param {string} sourceCurrency - Moneda origen
   */
  async handleConversion(sourceCurrency) {
    if (!converter.hasRates()) {
      stateManager.setError('Tipos de cambio no disponibles. Por favor, actualiza.');
      return;
    }

    const amount = uiController.getInputValue(sourceCurrency);

    // Si el campo está vacío, limpiar los demás
    if (amount === 0) {
      uiController.clearInputs();
      return;
    }

    try {
      // Realizar conversión
      const result = converter.convert(sourceCurrency, amount);

      // Actualizar UI sin loops
      await uiController.withoutLoops(async () => {
        if (result.PEN !== undefined && sourceCurrency !== 'PEN') {
          uiController.setInputValue('PEN', result.PEN);
        }
        if (result.USD !== undefined && sourceCurrency !== 'USD') {
          uiController.setInputValue('USD', result.USD);
        }
        if (result.ARS !== undefined && sourceCurrency !== 'ARS') {
          uiController.setInputValue('ARS', result.ARS);
        }
      });
    } catch (error) {
      console.error('App: Error en conversión', error);
      stateManager.setError('Error en la conversión');
    }
  }
}

// Crear instancia de la aplicación
const app = new App();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Exportar para debugging
window.__app__ = app;
