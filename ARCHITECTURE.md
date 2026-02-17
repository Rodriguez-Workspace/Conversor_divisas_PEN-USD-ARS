# Arquitectura Técnica Detallada

## Principios Aplicados

### 1. Separation of Concerns (SoC)

Cada módulo tiene una **responsabilidad única y bien definida**:

- **Config**: Solo configuración, sin lógica
- **Services**: Solo comunicación externa (APIs, DB)
- **Core**: Solo lógica de negocio pura
- **UI**: Solo DOM y presentación
- **Utils**: Solo funciones auxiliares puras

### 2. Dependency Injection

Los módulos reciben sus dependencias a través de imports ES6:

```javascript
// main.js orquesta las dependencias
import { storageService } from './services/storage.service.js';
import { apiService } from './services/api.service.js';
import { converter } from './core/converter.js';
```

**Ventajas**:
- Fácil de mockear en tests
- Bajo acoplamiento
- Módulos intercambiables

### 3. Single Source of Truth

El **State Manager** es la única fuente de verdad:

```javascript
stateManager.setState({ rates, timestamp });
// Todos los componentes se actualizan automáticamente
```

### 4. Observer Pattern (Pub/Sub)

El State Manager implementa el patrón Observer:

```javascript
// Suscripción
stateManager.subscribe((newState) => {
  uiController.render(newState);
});

// Notificación automática al cambiar estado
stateManager.setState({ ... }); // Dispara render en todos los suscriptores
```

**Flujo de datos unidireccional**:
```
Action → State Change → Notify Observers → Re-render UI
```

### 5. Pure Functions

Las funciones de conversión son **puras** (sin efectos secundarios):

```javascript
// ✅ Pure function
convertFromPEN(amount) {
  const usd = amount / this.rates.penToUsd;
  const ars = usd * this.rates.usdToArs;
  return { USD: usd, ARS: ars };
}

// ❌ NOT pure (modifica DOM)
convertFromPEN(amount) {
  const usd = amount / this.rates.penToUsd;
  document.getElementById('usd').value = usd; // Side effect!
}
```

---

## Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                    │
│                     (UI Controller)                      │
│  • DOM manipulation                                       │
│  • Event handling                                         │
│  • User input/output                                      │
└───────────────────────┬──────────────────────────────────┘
                        │
                        │ Uses
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│                  (main.js orchestrator)                  │
│  • Coordinates services                                   │
│  • Business workflows                                     │
│  • Error handling                                         │
└───────────┬─────────────────────┬───────────────────────┘
            │                     │
            │ Uses                │ Uses
            ▼                     ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│   BUSINESS LAYER     │  │     STATE LAYER              │
│   (Converter)        │  │   (State Manager)            │
│  • Pure logic        │  │  • Global state              │
│  • Calculations      │  │  • Observer pattern          │
│  • Domain rules      │  │  • State transitions         │
└──────────────────────┘  └──────────────────────────────┘
            ▲                     ▲
            │ Reads               │ Updates
            │                     │
┌───────────┴─────────────────────┴───────────────────────┐
│                    DATA ACCESS LAYER                     │
│                       (Services)                         │
├──────────────────────────────────────────────────────────┤
│  API Service              │  Storage Service             │
│  • External APIs          │  • IndexedDB CRUD            │
│  • HTTP requests          │  • Data persistence          │
│  • Data validation        │  • Cache management          │
└──────────────────────────┴──────────────────────────────┘
            │                     │
            │ Fetches             │ Persists
            ▼                     ▼
┌──────────────────────┐  ┌──────────────────────────────┐
│   EXTERNAL APIs      │  │      IndexedDB               │
│  • SUNAT             │  │  • currencyDB                │
│  • DolarAPI          │  │  • exchangeRates store       │
└──────────────────────┘  └──────────────────────────────┘
```

---

## Flujo de Datos Detallado

### Escenario 1: Carga Inicial

```
1. Usuario abre la app
   └─> document.DOMContentLoaded

2. main.js inicializa servicios
   ├─> storageService.init()  // Abre IndexedDB
   └─> uiController.init()     // Captura elementos DOM

3. App.loadExchangeRates(forceRefresh=false)
   ├─> stateManager.setLoading()
   │   └─> uiController.render({ status: 'loading' })
   │       └─> Muestra spinner
   │
   ├─> storageService.loadRates()  // Busca caché
   │   └─> Si existe:
   │       ├─> converter.setRates(cached)
   │       ├─> stateManager.setOffline(cached)
   │       └─> uiController.render({ status: 'offline', rates })
   │           └─> Renderiza con aviso "offline"
   │
   └─> Si NO existe caché:
       ├─> apiService.fetchAllRates()  // Fetch paralelo
       │   ├─> fetchSunatRate()
       │   └─> fetchDolarBlueRate()
       │
       ├─> converter.setRates({ penToUsd, usdToArs })
       │
       ├─> storageService.saveRates(rates)
       │   └─> Guarda en IndexedDB
       │
       └─> stateManager.setOnline(rates, timestamp)
           └─> uiController.render({ status: 'online', rates })
               └─> Renderiza con aviso "en tiempo real"
```

### Escenario 2: Conversión de Usuario

```
1. Usuario escribe "100" en input USD
   └─> Event 'input' disparado

2. uiController._handleInput('USD')
   └─> Debounce 300ms
       └─> Si no hay más input en 300ms:
           └─> inputCallbacks.onInput('USD')

3. App.handleConversion('USD')
   ├─> uiController.getInputValue('USD')
   │   └─> Retorna 100
   │
   ├─> converter.convert('USD', 100)
   │   └─> Cálculos puros:
   │       ├─> PEN = 100 * 3.70 = 370
   │       └─> ARS = 100 * 1000 = 100000
   │   └─> Retorna { PEN: 370, USD: 100, ARS: 100000 }
   │
   └─> uiController.setInputValue('PEN', 370)
       uiController.setInputValue('ARS', 100000)
       └─> Actualiza DOM (con flag isConverting para evitar loops)
```

### Escenario 3: Botón Refresh

```
1. Usuario hace click en botón refresh
   └─> Event 'click' disparado

2. uiController añade clase 'spinning' al botón

3. App.loadExchangeRates(forceRefresh=true)
   ├─> stateManager.setLoading()
   │
   ├─> apiService.fetchAllRates()  // Ignora caché, fetch directo
   │   ├─> Intenta Netlify Function
   │   └─> Fallback a API directa si falla
   │
   ├─> converter.setRates(nuevasTasas)
   │
   ├─> storageService.saveRates(nuevasTasas)
   │
   └─> stateManager.setOnline(nuevasTasas)
       └─> uiController.render({ status: 'online', rates })

4. uiController remueve clase 'spinning' del botón
```

---

## Manejo de Errores

### Filosofía: Network-First con Fallback Garantizado

La aplicación prioriza **siempre datos reales y actualizados**, con fallback a datos reales previamente guardados:

```
┌─────────────────────────────────────────┐
│  1. Network-First                        │
│     └─ Intenta APIs SIEMPRE             │
│        (incluso en carga inicial)        │
└─────────────────────────────────────────┘
           │
           ├─ ✅ Éxito
           │   └─ Guardar en IndexedDB → Modo Online
           │
           └─ ❌ Fallo
               └─ Buscar en IndexedDB
                   ├─ ✅ Existe caché → Modo Offline (datos reales guardados)
                   └─ ❌ No existe → Bloqueo con mensaje (NUNCA datos inventados)
```

**Principios clave**:
- **Datos Reales Siempre**: NUNCA usa valores hardcodeados o inventados
- **Transparencia Total**: Indica claramente si datos son en tiempo real u offline
- **Primera Vez Online**: Requiere conexión inicial para obtener primer tipo de cambio real

### Estrategia de Fallbacks

#### API Service - Múltiples intentos

```javascript
async fetchSunatRate() {
  // Intento 1: Netlify Function (preferido - evita CORS)
  try {
    return await fetch('/.netlify/functions/sunat');
  } catch (error) {
    console.warn('Netlify falló, intentando API directa');
  }

  // Intento 2: API directa (puede fallar por CORS en algunos navegadores)
  try {
    return await fetch('https://api.apis.net.pe/...');
  } catch (error) {
    console.error('API directa bloqueada');
  }

  // Fallo total - propagar error (NO retornar valores falsos)
  throw new Error('No se pudo obtener tasa de SUNAT');
}
```

#### App - Network-First con Graceful Degradation

```javascript
async loadExchangeRates() {
  try {
    // SIEMPRE intenta obtener datos frescos desde APIs
    const data = await apiService.fetchAllRates();
    
    // Validar datos reales
    if (!apiService.validateSunatData(data[0])) {
      throw new Error('Datos inválidos');
    }
    
    // Guardar para uso offline
    await storageService.saveRates(data);
    stateManager.setOnline(data);
    
  } catch (error) {
    // Fallback: Último tipo de cambio REAL guardado
    const cached = await storageService.loadRates();
    
    if (cached) {
      // Modo offline con datos reales previos
      stateManager.setOffline(cached);
      stateManager.setError('Sin conexión. Usando último tipo de cambio real guardado.');
    } else {
      // Primera vez sin conexión: Bloquear
      stateManager.setError('No hay conexión y no existe un tipo de cambio guardado previamente. Por favor, conéctate a internet para obtener los tipos de cambio reales.');
    }
  }
}
```

---

## Extensibilidad

### Agregar una nueva fuente de datos

**Ejemplo**: Agregar API de Banco Central

1. **Actualizar config**:
```javascript
// config/constants.js
export const API_CONFIG = {
  // ...existentes
  bancoCentral: {
    url: 'https://api.bcentral.com/rates',
    apiKey: 'YOUR_KEY',
  },
};
```

2. **Extender API Service**:
```javascript
// services/api.service.js
async fetchBancoCentralRate() {
  const response = await fetch(
    `${API_CONFIG.bancoCentral.url}?key=${API_CONFIG.bancoCentral.apiKey}`
  );
  return response.json();
}
```

3. **Usar en App**:
```javascript
// main.js
const [sunatData, dolarData, bcData] = await Promise.all([
  apiService.fetchSunatRate(),
  apiService.fetchDolarBlueRate(),
  apiService.fetchBancoCentralRate(),
]);
```

**Sin modificar**: Converter, UI Controller, State Manager (bajo acoplamiento)

---

## Performance

### Optimizaciones Implementadas

1. **Debounce en inputs** (300ms)
   - Evita cálculos excesivos mientras el usuario escribe
   - Reduce llamadas a `converter.convert()`

2. **Fetch paralelo** con `Promise.all()`
   - Ambas APIs se llaman simultáneamente
   - Reduce tiempo de carga a ~2s en lugar de ~4s

3. **Cache First para assets estáticos**
   - CSS, JS, HTML se sirven desde cache
   - Carga instantánea en visitas subsecuentes

4. **IndexedDB asíncrono**
   - No bloquea el main thread
   - Persistencia eficiente de datos

5. **Singleton pattern**
   - Una sola instancia de servicios
   - No recrear conexiones DB/API

---

## Testing Strategy

### Unit Tests (Lógica pura)

```javascript
// converter.test.js
describe('CurrencyConverter', () => {
  it('calcula correctamente PEN a USD', () => {
    converter.setRates({ penToUsd: 3.70, usdToArs: 1000 });
    const result = converter.convertFromPEN(370);
    expect(result.USD).toBe(100);
  });

  it('maneja valores inválidos', () => {
    const result = converter.convert('USD', NaN);
    expect(result).toEqual({ PEN: 0, USD: 0, ARS: 0 });
  });
});
```

### Integration Tests (Servicios)

```javascript
// api.service.test.js
describe('ApiService', () => {
  it('obtiene datos de SUNAT', async () => {
    const data = await apiService.fetchSunatRate();
    expect(data).toHaveProperty('compra');
    expect(data).toHaveProperty('venta');
  });

  it('maneja errores de red', async () => {
    // Mock fetch para simular fallo
    global.fetch = jest.fn(() => Promise.reject('Network error'));
    
    await expect(apiService.fetchSunatRate()).rejects.toThrow();
  });
});
```

### E2E Tests (Flujo completo)

```javascript
// app.e2e.test.js
describe('Flujo de conversión', () => {
  it('convierte USD a otras monedas', async () => {
    // 1. Cargar app
    await app.init();
    
    // 2. Esperar tasas
    await waitFor(() => converter.hasRates());
    
    // 3. Ingresar valor
    uiController.setInputValue('USD', 100);
    await app.handleConversion('USD');
    
    // 4. Verificar conversión
    const penValue = uiController.getInputValue('PEN');
    expect(penValue).toBeGreaterThan(0);
  });
});
```

---

## Seguridad

### Medidas Implementadas

1. **Content Security Policy** (CSP)
   - Definido en `netlify.toml`
   - Previene XSS

2. **HTTPS obligatorio**
   - Service Worker solo funciona con HTTPS
   - Netlify proporciona certificado gratis

3. **Validación de datos de API**
   - `apiService.validateSunatData()`
   - `apiService.validateDolarBlueData()`
   - No confiar ciegamente en datos externos

4. **Input sanitization**
   - `parseInputValue()` limpia entrada de usuario
   - Validación de números antes de conversión

5. **Error handling robusto**
   - Try-catch en todas las operaciones async
   - Nunca exponer stack traces al usuario

---

## Deployment

### Build Process

**No hay build!** Es una ventaja de ES6 modules nativos:

1. `git push` → Netlify detecta cambios
2. Netlify sirve archivos estáticos directamente
3. Netlify Functions se compilan automáticamente

### Rollback

Si algo falla:
```bash
git revert HEAD
git push
```
Netlify automáticamente despliega la versión anterior.

---

## Métricas de Calidad

### Code Metrics

- **Líneas de código por archivo**: < 300 (modularidad)
- **Complejidad ciclomática**: < 10 (simplicidad)
- **Acoplamiento**: Bajo (solo imports necesarios)
- **Cohesión**: Alta (cada módulo hace una cosa)

### Performance Metrics

- **First Contentful Paint**: < 1s
- **Time to Interactive**: < 2s
- **Lighthouse Score**: 95+

### Maintainability

- **Cobertura de tests recomendada**: > 80%
- **Documentación**: JSDoc en funciones públicas
- **Naming conventions**: Consistentes y descriptivos

---

**Documento técnico v2.0**  
Última actualización: Febrero 2026
