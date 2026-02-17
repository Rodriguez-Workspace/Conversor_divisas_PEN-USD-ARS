# Conversor Multi-Divisa PWA

> **Progressive Web App** profesional para conversión en tiempo real entre **PEN** (Soles Peruanos), **USD** (Dólares Estadounidenses) y **ARS** (Pesos Argentinos - cotización blue).

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🎯 Filosofía: Offline-First con Datos Reales

Esta aplicación sigue una filosofía estricta de **confiabilidad y transparencia**:

- **Network-First para Datos Dinámicos**: Siempre intenta obtener tipos de cambio actualizados desde APIs oficiales
- **Datos Reales Siempre**: NUNCA usa valores inventados o hardcodeados - solo tipos de cambio reales
- **Fallback Garantizado**: Si falla la red, usa el último tipo de cambio real guardado localmente
- **Persistencia Confiable**: IndexedDB guarda automáticamente cada respuesta exitosa
- **Estado Claro**: Indica explícitamente si estás viendo datos en tiempo real o modo offline
- **Primera Vez Online**: Si no hay datos guardados y no hay conexión, te pide conectarte (no bloquea con valores falsos)

---

## Características

- **Conversión Multidireccional**: Tiempo real entre 3 divisas (PEN ⇄ USD ⇄ ARS)
- **PWA Instalable**: Funciona como app nativa en Android/iOS/Desktop
- **Modo Offline Inteligente**: Usa último tipo de cambio real cuando no hay conexión
- **Arquitectura Modular**: ES6 modules con separación clara de responsabilidades
- **Service Worker**: Cache-first para assets, network-first para datos dinámicos
- **Tema Adaptativo**: Claro/oscuro automático según preferencias del sistema
- **Mobile-First**: Diseño responsive optimizado para móviles
- **Serverless Backend**: Netlify Functions para proxy CORS (sin servidor propio)

---

## Arquitectura

Este proyecto sigue una **arquitectura limpia y modular** diseñada para ser mantenible y escalable:

### Estructura de Carpetas

```
/
├── index.html                    # Punto de entrada HTML
├── manifest.json                 # Configuración PWA
├── netlify.toml                  # Config deployment Netlify
├── .gitignore
├── README.md
│
├── icons/                        # Iconos PWA (8 tamaños)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   └── ...
│
├── netlify/                      # Serverless Functions
│   └── functions/
│       └── sunat.js              # Proxy CORS para API SUNAT
│
└── src/                          # Código fuente modular
    ├── css/
    │   └── styles.css            # Estilos globales
    │
    ├── sw.js                     # Service Worker (PWA)
    │
    └── js/
        ├── main.js               # Entry point de la aplicación
        │
        ├── config/               # Configuración global
        │   └── constants.js
        │
        ├── services/             # Capa de servicios
        │   ├── api.service.js    # Comunicación con APIs
        │   └── storage.service.js # Persistencia IndexedDB
        │
        ├── core/                 # Lógica de negocio
        │   ├── converter.js      # Conversión de divisas
        │   └── state-manager.js  # Gestión de estado
        │
        ├── ui/                   # Controlador de interfaz
        │   └── ui.controller.js  # Manipulación DOM y eventos
        │
        └── utils/                # Utilidades
            └── formatters.js     # Formateo de números y fechas
```

### Separación de Responsabilidades

#### 1. **Config Layer** (`config/`)
- Centraliza toda la configuración de la app
- Constantes de APIs, base de datos, cache
- Sin lógica, solo datos de configuración

#### 2. **Services Layer** (`services/`)
- **API Service**: Encapsula todas las llamadas HTTP
- **Storage Service**: Gestiona IndexedDB (CRUD)
- Lógica de comunicación externa
- Retries, fallbacks, validación de respuestas

#### 3. **Core Layer** (`core/`)
- **Converter**: Lógica pura de conversión (NO depende de DOM/APIs)
- **State Manager**: Patrón Observer para estado reactivo
- Reglas de negocio desacopladas
- Testeable de forma aislada

#### 4. **UI Layer** (`ui/`)
- **UI Controller**: Único módulo que toca el DOM
- Event listeners y renderizado
- Delega lógica a Core Layer
- Presenta datos, no calcula

#### 5. **Utils Layer** (`utils/`)
- Funciones puras reutilizables
- Formateo, validación, parseo
- Sin efectos secundarios

---

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                         Usuario                          │
└────────────────┬────────────────────────────────────────┘
                 │ (Input)
                 ▼
┌──────────────────────────────────────────────────────────┐
│                    UI Controller                          │
│  • Captura eventos                                        │
│  • Renderiza estado                                       │
└────────────┬──────────────────────┬──────────────────────┘
             │                       │
             │ (Delega)              │ (Lee)
             ▼                       ▼
┌──────────────────────┐    ┌───────────────────────┐
│    State Manager     │    │      Converter         │
│  • Estado global     │◄───│  • Lógica conversión   │
│  • Notifica cambios  │    │  • Cálculos puros      │
└──────────┬───────────┘    └───────────────────────┘
           │                         ▲
           │ (Suscribe)              │ (Obtiene tasas)
           ▼                         │
┌──────────────────────────────────┬──────────────────┐
│         Services Layer            │                  │
├──────────────────────────────────┼──────────────────┤
│      API Service                  │ Storage Service  │
│  • Fetch APIs externas            │ • IndexedDB      │
│  • Netlify Functions              │ • Cache local    │
│  • Fallbacks y retries            │ • Persistencia   │
└───────────────────────────────────┴──────────────────┘
```

### Flujo típico de conversión:

1. Usuario ingresa monto en input (ej: 100 USD)
2. **UI Controller** captura evento con debounce (300ms)
3. **UI Controller** llama a `converter.convert('USD', 100)`
4. **Converter** aplica fórmulas matemáticas (lógica pura)
5. **Converter** retorna `{ PEN: 370, USD: 100, ARS: 96000 }`
6. **UI Controller** actualiza inputs con resultados
7. **State Manager** notifica a suscriptores si hay cambios

### Flujo de actualización de tasas:

1. Usuario presiona botón refresh (o carga inicial)
2. `App.loadExchangeRates()` se ejecuta
3. **State Manager** pasa a estado `LOADING`
4. **API Service** hace fetch paralelo a SUNAT y DolarAPI
5. **Converter** calcula tasas promedio
6. **Storage Service** guarda en IndexedDB
7. **State Manager** pasa a estado `ONLINE`
8. **UI Controller** renderiza nueva UI

---

## APIs Utilizadas

### 1. **SUNAT API** (PEN/USD)
- **Endpoint**: `https://api.apis.net.pe/v1/tipo-cambio-sunat`
- **Problema**: CORS bloqueado desde frontend
- **Solución**: Netlify Function proxy serverless
- **Ruta proxy**: `/.netlify/functions/sunat`
- **Estrategia**: Primary → Netlify Function, Fallback → API directa

### 2. **DolarAPI** (USD/ARS Blue)
- **Endpoint**: `https://dolarapi.com/v1/dolares/blue`
- **Sin problemas de CORS**
- **Estrategia**: Primary → API directa, Fallback → Proxy CORS público

---

## Tecnologías

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Custom properties, Grid, Flexbox
- **JavaScript ES6+** - Modules nativas, async/await
- **IndexedDB** - Persistencia offline

### PWA
- **Service Worker** - Cache estratégico
- **Web App Manifest** - Instalación nativa
- **Cache API** - Offline-first

### Backend Serverless
- **Netlify Functions** - Node.js serverless
- **Proxy CORS** - Bypass de políticas restrictivas

---

## Decisiones Técnicas

### ¿Por qué ES6 Modules en lugar de bundler?

- **Simplicidad**: No requiere build step
- **Nativo**: Los navegadores modernos lo soportan
- **HTTP/2**: Multiplexing hace que múltiples archivos no sean problema
- **Dev Experience**: Hot reload instantáneo sin compilación

### ¿Por qué IndexedDB en lugar de LocalStorage?

- **Capacidad**: LocalStorage tiene límite de ~5MB
- **Asíncrono**: No bloquea el main thread
- **Tipos complejos**: Almacena objetos directamente
- **Transacciones**: ACID compliance

### ¿Por qué patrón Observer en State Manager?

- **Reactividad**: La UI se actualiza automáticamente
- **Desacoplamiento**: State no conoce a los consumidores
- **Escalabilidad**: Múltiples componentes pueden suscribirse
- **Debugging**: Estado centralizado fácil de trackear

### ¿Por qué Singleton en servicios?

- **Estado compartido**: Una sola instancia de IndexedDB
- **Configuración única**: APIs inicializadas una vez
- **Performance**: No recrear conexiones
- **Simplicidad**: No necesitamos múltiples instancias

---

## Modo Offline

### Estrategia de Cache

#### Recursos Estáticos (HTML, CSS, JS, Icons)
- **Estrategia**: Cache First
- **Razón**: Estos archivos no cambian entre deploys
- **Comportamiento**: Si está en cache, se sirve inmediatamente

#### APIs Externas (SUNAT, DolarAPI)
- **Estrategia**: Network First con Timeout (5s)
- **Razón**: Priorizar datos frescos pero tener fallback
- **Comportamiento**:
  1. Intenta red con timeout de 5 segundos
  2. Si falla, usa cache
  3. Si no hay cache, muestra error

### Persistencia

```javascript
// Flujo de datos offline
Red disponible → Fetch APIs → Cache en IndexedDB → Renderizar
Red NO disponible → Buscar en IndexedDB → Renderizar con aviso
Sin datos cacheados → Mostrar error → Bloquear conversión
```

---

## Escalabilidad

### Cómo agregar una nueva moneda (ej: EUR)

1. **Agregar configuración** (`config/constants.js`):
```javascript
export const CURRENCIES = {
  // ...existentes
  EUR: {
    code: 'EUR',
    name: 'Euros',
    flag: '🇪🇺',
    decimals: 2,
  },
};
```

2. **Extender Converter** (`core/converter.js`):
```javascript
convertFromEUR(amount) {
  // Lógica de conversión
}
```

3. **Agregar API Service** para la nueva fuente de datos

4. **Actualizar UI** con nuevo input

5. **Actualizar Storage** para persistir nueva tasa

### Cómo cambiar proveedor de API

1. **Actualizar config** (`config/constants.js`):
```javascript
export const API_CONFIG = {
  sunat: {
    primary: 'https://nueva-api.com/endpoint',
    fallback: 'https://backup-api.com',
  },
};
```

2. **Adaptar API Service** si cambia estructura de respuesta:
```javascript
// api.service.js
async fetchSunatRate() {
  const response = await fetch(API_CONFIG.sunat.primary);
  const data = await response.json();
  
  // Adaptar estructura si es necesario
  return {
    compra: data.buy_rate,  // Mapeo de campos
    venta: data.sell_rate,
    fecha: data.updated_at,
  };
}
```

3. **Actualizar validación** si es necesario

### Cómo migrar a backend propio

1. **Reemplazar Netlify Function** con API REST propia
2. **Actualizar** `API_CONFIG.sunat.primary` con tu URL
3. **Mantener** la misma estructura de respuesta o adaptar en Service

---

## Instalación y Desarrollo

### Requisitos
- Navegador moderno (Chrome 90+, Firefox 88+, Safari 14+)
- Servidor HTTP (no funciona con `file://`)

### Desarrollo Local

```bash
# Opción 1: Python
python -m http.server 8000

# Opción 2: Node.js
npx http-server -p 8000

# Opción 3: VS Code
# Instalar extensión "Live Server" y hacer click derecho > Open with Live Server
```

Visitar: `http://localhost:8000`

### Deployment en Netlify

1. Conectar repositorio de GitHub
2. Configuración automática detecta `netlify.toml`
3. Deploy automático en cada push a `main`

**URL de producción**: `https://tu-app.netlify.app`

---

## Testing (Recomendaciones)

Gracias a la arquitectura modular, puedes testear fácilmente:

### Unit Tests (Ejemplo con Jest)

```javascript
// converter.test.js
import { converter } from './core/converter.js';

test('convierte correctamente desde PEN', () => {
  converter.setRates({ penToUsd: 3.70, usdToArs: 1000 });
  const result = converter.convertFromPEN(370);
  
  expect(result.USD).toBeCloseTo(100, 2);
  expect(result.ARS).toBeCloseTo(100000, 2);
});
```

### Integration Tests

- Mockear `apiService` para probar flujo completo
- Testear `StateManager` con observadores
- Verificar que `UIController` renderiza correctamente

---

## Buenas Prácticas Aplicadas

- **SOLID Principles**: 
  - Single Responsibility en cada módulo
  - Dependency Injection vía imports
  - Open/Closed para extensión de monedas

- **DRY**: Utilidades reutilizables en `utils/`

- **Separation of Concerns**: Capas bien definidas

- **Immutability**: State Manager retorna copias

- **Error Handling**: Try-catch en operaciones async

- **Async/Await**: Legibilidad sobre callbacks

- **ES6+**: Arrow functions, destructuring, template literals

- **Naming**: Nombres descriptivos y consistentes

- **Comments**: JSDoc en funciones públicas

- **No Magic Numbers**: Constantes con nombres claros

---

## Licencia

MIT License - Libre para usar, modificar y distribuir.

---

## Contacto y Contribuciones

Para mejoras o bugs, crear un issue en el repositorio.

**Versión**: 2.0.0  
**Última actualización**: Febrero 2026
