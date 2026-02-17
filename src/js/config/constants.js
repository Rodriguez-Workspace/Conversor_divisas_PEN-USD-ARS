/**
 * Configuración global de la aplicación
 * Centraliza todas las constantes y configuraciones
 */

export const APP_CONFIG = {
  name: 'Conversor Multi-Divisa',
  version: '2.0.0',
  debounceDelay: 300,
};

export const STORAGE_CONFIG = {
  dbName: 'currencyDB',
  dbVersion: 1,
  storeName: 'exchangeRates',
  cacheKey: 'current',
};

export const API_CONFIG = {
  sunat: {
    primary: '/.netlify/functions/sunat',
    fallback: 'https://api.apis.net.pe/v1/tipo-cambio-sunat',
  },
  dolarBlue: {
    primary: 'https://dolarapi.com/v1/dolares/blue',
    proxy: 'https://api.allorigins.win/raw?url=',
  },
};

export const CACHE_CONFIG = {
  name: 'conversor-v9',
  assets: [
    '/',
    '/index.html',
    '/src/styles.css',
    '/src/js/main.js',
    '/manifest.json',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
  ],
};

export const CURRENCIES = {
  PEN: {
    code: 'PEN',
    name: 'Soles Peruanos',
    flag: '🇵🇪',
    decimals: 2,
  },
  USD: {
    code: 'USD',
    name: 'Dólares Americanos',
    flag: '🇺🇸',
    decimals: 2,
  },
  ARS: {
    code: 'ARS',
    name: 'Pesos Argentinos (Blue)',
    flag: '🇦🇷',
    decimals: 2,
  },
};

export const APP_STATES = {
  LOADING: 'loading',
  ONLINE: 'online',
  OFFLINE: 'offline',
  ERROR: 'error',
};
