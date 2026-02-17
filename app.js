// Variables globales
let exchangeRates = {
    penToUsd: null,
    usdToArs: null
};

let lastModified = null;
let debounceTimer = null;
const DEBOUNCE_DELAY = 300;

// IndexedDB - Configuración
const DB_NAME = 'currencyDB';
const DB_VERSION = 1;
const STORE_NAME = 'exchangeRates';
let db = null;

// Elementos del DOM
const penInput = document.getElementById('penInput');
const usdInput = document.getElementById('usdInput');
const arsInput = document.getElementById('arsInput');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdate = document.getElementById('lastUpdate');
const rateDisplay = document.getElementById('rateDisplay');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const dataStatus = document.getElementById('dataStatus');

// ===== INDEXEDDB - Gestión de Base de Datos =====

// Inicializar IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Error al abrir IndexedDB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            console.log('IndexedDB inicializada correctamente');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('Object store creado:', STORE_NAME);
            }
        };
    });
}

// Guardar datos en IndexedDB
async function saveToIndexedDB(rates, sunatDate, blueDate) {
    if (!db) {
        console.error('IndexedDB no está inicializada');
        return false;
    }
    
    const data = {
        id: 'current',
        penToUsd: rates.penToUsd,
        usdToArs: rates.usdToArs,
        fechaSUNAT: sunatDate,
        fechaBlue: blueDate,
        timestamp: new Date().toISOString()
    };
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.put(data);
        
        request.onsuccess = () => {
            console.log('Datos guardados en IndexedDB:', data);
            resolve(true);
        };
        
        request.onerror = () => {
            console.error('Error al guardar en IndexedDB:', request.error);
            reject(request.error);
        };
    });
}

// Leer datos desde IndexedDB
async function loadFromIndexedDB() {
    if (!db) {
        console.error('IndexedDB no está inicializada');
        return null;
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get('current');
        
        request.onsuccess = () => {
            if (request.result) {
                console.log('Datos recuperados de IndexedDB:', request.result);
                resolve(request.result);
            } else {
                console.log('No hay datos guardados en IndexedDB');
                resolve(null);
            }
        };
        
        request.onerror = () => {
            console.error('Error al leer de IndexedDB:', request.error);
            reject(request.error);
        };
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar IndexedDB primero
    try {
        await initDB();
    } catch (error) {
        console.error('Error al inicializar IndexedDB:', error);
        showError('Error al inicializar el almacenamiento local.');
    }
    
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registrado');
        } catch (error) {
            console.error('Error al registrar Service Worker:', error);
        }
    }

    // Cargar tasas de cambio
    await loadExchangeRates();

    // Event listeners para inputs
    penInput.addEventListener('input', () => handleInput('PEN'));
    usdInput.addEventListener('input', () => handleInput('USD'));
    arsInput.addEventListener('input', () => handleInput('ARS'));

    // Event listener para botón de actualización
    refreshBtn.addEventListener('click', async () => {
        refreshBtn.classList.add('spinning');
        await loadExchangeRates(true);
        refreshBtn.classList.remove('spinning');
    });
});

// Bandera para evitar loops infinitos
let isConverting = false;

// Manejar entrada de usuario con debounce
function handleInput(currency) {
    lastModified = currency;
    
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        convertCurrency(currency);
    }, DEBOUNCE_DELAY);
}

// Conversión de divisas
function convertCurrency(sourceCurrency) {
    if (isConverting) return; // Prevenir loops infinitos
    
    console.log('Convirtiendo desde:', sourceCurrency);
    console.log('Tasas disponibles:', exchangeRates);
    
    if (!exchangeRates.penToUsd || !exchangeRates.usdToArs) {
        console.error('Tasas no disponibles:', exchangeRates);
        showError('Tipos de cambio no disponibles. Por favor, actualiza.');
        return;
    }

    isConverting = true;
    let sourceValue;
    
    try {
        switch(sourceCurrency) {
            case 'PEN':
                sourceValue = parseFloat(penInput.value.replace(/,/g, '')) || 0;
                console.log('PEN input:', sourceValue);
                if (sourceValue === 0 || penInput.value === '') {
                    usdInput.value = '';
                    arsInput.value = '';
                    isConverting = false;
                    return;
                }
                // PEN -> USD -> ARS
                const usdFromPen = sourceValue / exchangeRates.penToUsd;
                const arsFromPen = usdFromPen * exchangeRates.usdToArs;
                
                console.log('USD calculado:', usdFromPen);
                console.log('ARS calculado:', arsFromPen);
                
                usdInput.value = usdFromPen.toFixed(2);
                arsInput.value = arsFromPen.toFixed(2);
                break;

            case 'USD':
                sourceValue = parseFloat(usdInput.value.replace(/,/g, '')) || 0;
                console.log('USD input:', sourceValue);
                if (sourceValue === 0 || usdInput.value === '') {
                    penInput.value = '';
                    arsInput.value = '';
                    isConverting = false;
                    return;
                }
                // USD -> PEN y USD -> ARS
                const penFromUsd = sourceValue * exchangeRates.penToUsd;
                const arsFromUsd = sourceValue * exchangeRates.usdToArs;
                
                console.log('PEN calculado:', penFromUsd, 'usando tasa:', exchangeRates.penToUsd);
                console.log('ARS calculado:', arsFromUsd, 'usando tasa:', exchangeRates.usdToArs);
                
                if (isNaN(penFromUsd) || isNaN(arsFromUsd)) {
                    console.error('Error en cálculos - PEN:', penFromUsd, 'ARS:', arsFromUsd);
                    showError('Error en la conversión. Actualiza las tasas.');
                    isConverting = false;
                    return;
                }
                
                penInput.value = penFromUsd.toFixed(2);
                arsInput.value = arsFromUsd.toFixed(2);
                
                console.log('Valores asignados - PEN input:', penInput.value, 'ARS input:', arsInput.value);
                break;

            case 'ARS':
                sourceValue = parseFloat(arsInput.value.replace(/,/g, '')) || 0;
                console.log('ARS input:', sourceValue);
                if (sourceValue === 0 || arsInput.value === '') {
                    penInput.value = '';
                    usdInput.value = '';
                    isConverting = false;
                    return;
                }
                // ARS -> USD -> PEN
                const usdFromArs = sourceValue / exchangeRates.usdToArs;
                const penFromArs = usdFromArs * exchangeRates.penToUsd;
                
                console.log('USD calculado:', usdFromArs);
                console.log('PEN calculado:', penFromArs);
                
                usdInput.value = usdFromArs.toFixed(2);
                penInput.value = penFromArs.toFixed(2);
                break;
        }
    } finally {
        isConverting = false;
    }
}

// Cargar tipos de cambio desde APIs
async function loadExchangeRates(forceRefresh = false) {
    showLoading(true);
    hideError();

    try {
        // Intentar cargar desde IndexedDB primero si no es refresh forzado
        if (!forceRefresh) {
            const cached = await loadFromIndexedDB();
            if (cached) {
                exchangeRates.penToUsd = cached.penToUsd;
                exchangeRates.usdToArs = cached.usdToArs;
                updateUI(cached.timestamp, false); // false = datos offline
                showLoading(false);
                return;
            }
        }

        // Fetch de ambas APIs en paralelo
        const [sunatData, dolarApiData] = await Promise.all([
            fetchSunatRate(),
            fetchDolarBlueRate()
        ]);

        console.log('Datos SUNAT:', sunatData);
        console.log('Datos DolarAPI:', dolarApiData);

        // Calcular tasas con validación
        if (sunatData && sunatData.compra && sunatData.venta) {
            exchangeRates.penToUsd = (parseFloat(sunatData.compra) + parseFloat(sunatData.venta)) / 2;
        } else {
            throw new Error('Datos de SUNAT inválidos');
        }
        
        if (dolarApiData && dolarApiData.compra && dolarApiData.venta) {
            exchangeRates.usdToArs = Math.max(parseFloat(dolarApiData.compra), parseFloat(dolarApiData.venta));
        } else {
            throw new Error('Datos de DolarAPI inválidos');
        }

        console.log('Tasas calculadas correctamente:', exchangeRates);
        console.log(`   PEN/USD: ${exchangeRates.penToUsd}`);
        console.log(`   USD/ARS: ${exchangeRates.usdToArs}`);

        // Guardar en IndexedDB
        const sunatDate = sunatData.fecha || new Date().toISOString();
        const blueDate = dolarApiData.fechaActualizacion || new Date().toISOString();
        await saveToIndexedDB(exchangeRates, sunatDate, blueDate);

        // Actualizar UI
        updateUI(new Date().toISOString(), true); // true = datos en tiempo real

        showLoading(false);
    } catch (error) {
        console.error('Error al cargar tipos de cambio:', error);
        
        // Intentar usar datos de IndexedDB como fallback
        const cached = await loadFromIndexedDB();
        if (cached) {
            exchangeRates.penToUsd = cached.penToUsd;
            exchangeRates.usdToArs = cached.usdToArs;
            updateUI(cached.timestamp, false); // false = datos offline
            showError('Sin conexión. Usando último tipo de cambio guardado.');
        } else {
            // No hay datos guardados - BLOQUEAR conversión
            exchangeRates.penToUsd = null;
            exchangeRates.usdToArs = null;
            showError('No hay conexión y no existe un tipo de cambio guardado previamente. Por favor, conéctate a internet.');
            updateUI(null, false);
        }
        
        showLoading(false);
    }
}

// Fetch SUNAT API con proxy CORS
async function fetchSunatRate() {
    // Intentar primero con la API directa (podría funcionar en algunos navegadores)
    try {
        const response = await fetch('https://api.apis.net.pe/v1/tipo-cambio-sunat');
        if (response.ok) {
            return await response.json();
        }
    } catch (error) {
        console.log('API directa bloqueada por CORS, usando proxy...');
    }
    
    // Usar proxy CORS como fallback
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const apiUrl = encodeURIComponent('https://api.apis.net.pe/v1/tipo-cambio-sunat');
    const response = await fetch(proxyUrl + apiUrl);
    
    if (!response.ok) throw new Error('Error en API SUNAT');
    return await response.json();
}

// Fetch Dólar Blue API
async function fetchDolarBlueRate() {
    try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue');
        if (response.ok) {
            const data = await response.json();
            console.log('DolarAPI respuesta directa:', data);
            return data;
        }
    } catch (error) {
        console.log('Error en DolarAPI directa:', error);
        console.log('Intentando con proxy CORS...');
    }
    
    // Intentar con proxy como fallback
    try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const apiUrl = encodeURIComponent('https://dolarapi.com/v1/dolares/blue');
        const response = await fetch(proxyUrl + apiUrl);
        
        if (!response.ok) throw new Error('Error en API DolarAPI con proxy');
        const data = await response.json();
        console.log('DolarAPI respuesta con proxy:', data);
        return data;
    } catch (error) {
        console.error('Error total en DolarAPI:', error);
        throw error;
    }
}

// Formatear número con separadores de miles
function updateUI(timestamp, isRealTime) {
    // Actualizar timestamp
    if (timestamp) {
        const date = new Date(timestamp);
        const formattedDate = date.toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        lastUpdate.textContent = `Última actualización: ${formattedDate}`;
    } else {
        lastUpdate.textContent = 'Sin datos disponibles';
    }

    // Actualizar indicador de estado
    if (dataStatus) {
        if (isRealTime) {
            dataStatus.innerHTML = '<span class="status-online">Datos en tiempo real</span>';
            dataStatus.className = 'data-status online';
        } else if (exchangeRates.penToUsd && exchangeRates.usdToArs) {
            dataStatus.innerHTML = '<span class="status-offline">Usando datos guardados (offline)</span>';
            dataStatus.className = 'data-status offline';
        } else {
            dataStatus.innerHTML = '<span class="status-error">Sin datos disponibles</span>';
            dataStatus.className = 'data-status error';
        }
    }

    // Actualizar resumen de tasas (formato obligatorio)
    if (exchangeRates.penToUsd && exchangeRates.usdToArs) {
        const penValue = exchangeRates.penToUsd.toFixed(3); // 3 decimales para PEN
        const arsValue = formatNumber(exchangeRates.usdToArs, 2);
        
        rateDisplay.innerHTML = `
            <span>🇵🇪 ${penValue} PEN  |  🇺🇸 1 USD  |  🇦🇷 ${arsValue} ARS</span>
        `;
    } else {
        rateDisplay.innerHTML = '<span>No hay tipos de cambio disponibles</span>';
    }
}

// Formatear número con separadores de miles
function formatNumber(value, decimals = 2) {
    if (isNaN(value)) return '0.00';
    
    return value.toLocaleString('es-PE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Formatear moneda (mantener para compatibilidad)
function formatCurrency(value, decimals = 2) {
    return formatNumber(value, decimals);
}

// Mostrar/ocultar indicador de carga
function showLoading(show) {
    if (show) {
        loadingIndicator.classList.remove('hidden');
    } else {
        loadingIndicator.classList.add('hidden');
    }
}

// Mostrar error
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        hideError();
    }, 5000);
}

// Ocultar error
function hideError() {
    errorMessage.classList.add('hidden');
}

// Prevenir comportamiento por defecto en formulario
document.addEventListener('submit', (e) => {
    e.preventDefault();
});
