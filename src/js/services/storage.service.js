/**
 * Servicio de Almacenamiento
 * Gestiona toda la persistencia de datos con IndexedDB
 * Responsabilidad única: CRUD de datos en IndexedDB
 */

import { STORAGE_CONFIG } from '../config/constants.js';

class StorageService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Inicializa la conexión con IndexedDB
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        STORAGE_CONFIG.dbName,
        STORAGE_CONFIG.dbVersion
      );

      request.onerror = () => {
        console.error('StorageService: Error al abrir IndexedDB', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('StorageService: IndexedDB inicializada');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        if (!database.objectStoreNames.contains(STORAGE_CONFIG.storeName)) {
          const objectStore = database.createObjectStore(
            STORAGE_CONFIG.storeName,
            { keyPath: 'id' }
          );
          objectStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('StorageService: Object store creado');
        }
      };
    });
  }

  /**
   * Guarda las tasas de cambio en IndexedDB
   * @param {Object} rates - Objeto con tasas { penToUsd, usdToArs }
   * @param {string} sunatDate - Fecha de SUNAT
   * @param {string} blueDate - Fecha de DolarAPI
   * @returns {Promise<boolean>}
   */
  async saveRates(rates, sunatDate, blueDate) {
    if (!this.isInitialized || !this.db) {
      console.error('StorageService: Base de datos no inicializada');
      return false;
    }

    const data = {
      id: STORAGE_CONFIG.cacheKey,
      penToUsd: rates.penToUsd,
      usdToArs: rates.usdToArs,
      fechaSUNAT: sunatDate,
      fechaBlue: blueDate,
      timestamp: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [STORAGE_CONFIG.storeName],
        'readwrite'
      );
      const objectStore = transaction.objectStore(STORAGE_CONFIG.storeName);
      const request = objectStore.put(data);

      request.onsuccess = () => {
        console.log('StorageService: Datos guardados', data);
        resolve(true);
      };

      request.onerror = () => {
        console.error('StorageService: Error al guardar', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Recupera las tasas de cambio guardadas
   * @returns {Promise<Object|null>}
   */
  async loadRates() {
    if (!this.isInitialized || !this.db) {
      console.error('StorageService: Base de datos no inicializada');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [STORAGE_CONFIG.storeName],
        'readonly'
      );
      const objectStore = transaction.objectStore(STORAGE_CONFIG.storeName);
      const request = objectStore.get(STORAGE_CONFIG.cacheKey);

      request.onsuccess = () => {
        if (request.result) {
          console.log('StorageService: Datos recuperados', request.result);
          resolve(request.result);
        } else {
          console.log('StorageService: No hay datos guardados');
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('StorageService: Error al leer', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Limpia todos los datos almacenados
   * @returns {Promise<boolean>}
   */
  async clearRates() {
    if (!this.isInitialized || !this.db) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        [STORAGE_CONFIG.storeName],
        'readwrite'
      );
      const objectStore = transaction.objectStore(STORAGE_CONFIG.storeName);
      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log('StorageService: Datos eliminados');
        resolve(true);
      };

      request.onerror = () => {
        console.error('StorageService: Error al eliminar', request.error);
        reject(request.error);
      };
    });
  }
}

// Exportar instancia singleton
export const storageService = new StorageService();
