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
      await navigator.serviceWorker.register('/sw.js');
      console.log('App: Service Worker registrado');
    } catch (error) {
      console.warn('App: Error al registrar Service Worker', error);
    }
  }

  /**
   * Carga las tasas de cambio
   * Estrategia: Network-First con fallback a datos guardados
   * NUNCA usa valores inventados, solo datos reales de APIs
   * @param {boolean} forceRefresh - Forzar actualización desde APIs
   */
  async loadExchangeRates(forceRefresh = false) {
    stateManager.setLoading();

    try {
      // Estrategia NETWORK-FIRST: Siempre intenta obtener datos frescos
      console.log('App: Intentando obtener tipos de cambio desde APIs...');
      const [sunatData, dolarApiData] = await apiService.fetchAllRates();

      // Validar datos recibidos
      if (!apiService.validateSunatData(sunatData)) {
        throw new Error('Datos de SUNAT inválidos');
      }
      if (!apiService.validateDolarBlueData(dolarApiData)) {
        throw new Error('Datos de DolarAPI inválidos');
      }

      // Calcular tasas desde datos REALES
      const rates = {
        penToUsd: converter.constructor.calculateSunatRate(sunatData),
        usdToArs: converter.constructor.calculateDolarBlueRate(dolarApiData),
      };

      console.log('App: Tasas obtenidas exitosamente desde APIs:', rates);

      // Actualizar conversor
      converter.setRates(rates);

      // PERSISTENCIA: Guardar en IndexedDB para uso offline
      const sunatDate = sunatData.fecha || new Date().toISOString();
      const blueDate = dolarApiData.fechaActualizacion || new Date().toISOString();
      await storageService.saveRates(rates, sunatDate, blueDate);

      // Actualizar estado: ONLINE con datos en tiempo real
      const timestamp = new Date().toISOString();
      stateManager.setOnline(rates, timestamp);
      
      console.log('App: Tipos de cambio actualizados y guardados');
    } catch (error) {
      // FALLBACK: Si falla la red, usar último tipo de cambio REAL guardado
      console.warn('App: Error al obtener datos desde APIs, usando caché...', error.message);
      await this._handleLoadError();
    }
  }

  /**
   * Maneja errores al cargar tasas
   * Fallback: Usa último tipo de cambio REAL guardado (NUNCA valores inventados)
   * @private
   */
  async _handleLoadError() {
    // Intentar recuperar último tipo de cambio REAL guardado
    const cached = await storageService.loadRates();
    
    if (cached) {
      // HAY DATOS REALES GUARDADOS: Modo offline
      const rates = {
        penToUsd: cached.penToUsd,
        usdToArs: cached.usdToArs,
      };
      
      converter.setRates(rates);
      stateManager.setOffline(rates, cached.timestamp);
      stateManager.setError(
        'Sin conexión. Usando último tipo de cambio real guardado.'
      );
      
      console.log('App: Usando datos offline (último tipo de cambio real):', rates);
    } else {
      // NO HAY DATOS GUARDADOS: Bloquear conversión
      converter.clearRates();
      stateManager.setError(
        'No hay conexión y no existe un tipo de cambio guardado previamente. Por favor, conéctate a internet para obtener los tipos de cambio reales.'
      );
      
      console.error('App: Sin datos disponibles - Primera vez sin conexión');
    }
  }

  /**
   * Maneja la conversión de divisas
   * @param {string} sourceCurrency - Moneda origen
   */
  handleConversion(sourceCurrency) {
    console.log('App.handleConversion llamado con:', sourceCurrency);
    
    if (!converter.hasRates()) {
      console.error('App: No hay tasas disponibles');
      stateManager.setError('Tipos de cambio no disponibles. Por favor, actualiza.');
      return;
    }

    const amount = uiController.getInputValue(sourceCurrency);
    console.log('App: Monto obtenido:', amount, 'de', sourceCurrency);

    // Si el campo está vacío, limpiar los demás
    if (amount === 0) {
      console.log('App: Monto es 0, limpiando inputs');
      uiController.clearInputs();
      return;
    }

    try {
      // Realizar conversión
      const result = converter.convert(sourceCurrency, amount);
      console.log('App: Resultado de conversión:', result);

      // Actualizar UI sin loops
      uiController.isConverting = true;
      
      if (result.PEN !== undefined && sourceCurrency !== 'PEN') {
        uiController.setInputValue('PEN', result.PEN);
      }
      if (result.USD !== undefined && sourceCurrency !== 'USD') {
        uiController.setInputValue('USD', result.USD);
      }
      if (result.ARS !== undefined && sourceCurrency !== 'ARS') {
        uiController.setInputValue('ARS', result.ARS);
      }
      
      uiController.isConverting = false;
      console.log('App: Inputs actualizados correctamente');
    } catch (error) {
      uiController.isConverting = false;
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
