# Changelog

Historial de cambios significativos del proyecto.

---

## [2.1.0] - 2026-02-16

### Alineación con Filosofía Offline-First Estricta

#### Cambiado

- **Estrategia de Carga**: Migrado de cache-first a **network-first estricto**
  - `loadExchangeRates()` ahora SIEMPRE intenta APIs primero
  - Eliminado check de `!forceRefresh` que priorizaba caché
  - Cache usado solo como fallback cuando red falla
  - Resultado: Datos más frescos, transparencia total

- **Documentación de Filosofía**:
  - README.md actualizado con sección "🎯 Filosofía: Offline-First con Datos Reales"
  - ARCHITECTURE.md refleja network-first strategy con diagramas de flujo
  - Nuevo documento: `PHILOSOPHY.md` (filosofía completa explicada)
  - Nuevo documento: `VERIFICATION-CHECKLIST.md` (tests funcionales)

- **Mensajes de Error Mejorados**:
  - Modo offline ahora dice: "Usando último tipo de cambio **real** guardado"
  - Primera vez sin conexión: "Conéctate a internet para obtener tipos de cambio **reales**"
  - Énfasis en que NUNCA usa valores inventados

- **Logs de Debugging**:
  - "App: Intentando obtener tipos de cambio desde APIs..." (siempre se ejecuta)
  - "App: Usando datos offline (último tipo de cambio real)" (fallback)
  - "App: Sin datos disponibles - Primera vez sin conexión" (bloqueo)

#### Principios Reforzados

1. **Network-First**: Red siempre tiene prioridad sobre caché
2. **Datos Reales Siempre**: NUNCA valores hardcodeados o inventados
3. **Transparencia Total**: Estado online/offline/sin datos claramente indicado
4. **Fallback Garantizado**: Cache solo para último valor real guardado
5. **Primera Vez Online**: Requiere conexión inicial (no asume)

#### Añadido

- `PHILOSOPHY.md` - Documento extenso explicando:
  - Principio fundamental: Datos reales siempre
  - Flujo de obtención de datos (diagrama)
  - Casos de uso con ejemplos
  - Indicadores visuales (badges)
  - Principios SOLID aplicados
  
- `VERIFICATION-CHECKLIST.md` - 5 tests funcionales paso a paso:
  - Test 1: Primera carga con conexión
  - Test 2: Segunda carga con conexión (verifica network-first)
  - Test 3: Uso offline con datos guardados
  - Test 4: Primera vez sin conexión (verifica no inventa datos)
  - Test 5: Recuperación de conexión
  - Matriz de resultados + Red flags

#### Técnico

- `main.js` líneas 105-165: Reescrita función `loadExchangeRates()`
  - Eliminado bloque `if (!forceRefresh) { loadFromCache() }`
  - Ahora `try { fetchAllRates() } catch { loadFromCache() }`
  - Comments explican estrategia: "Network-First", "NUNCA valores inventados"

- `main.js` líneas 167-194: Mejorada función `_handleLoadError()`
  - Caso 1: cached exists → setOffline() + mensaje "último tipo de cambio real"
  - Caso 2: no cached → setError() + mensaje "conéctate a internet"
  - Logs detallados en cada caso

---

## [2.0.0] - 2026-02-16

### Refactorización Mayor - Arquitectura Profesional

#### Añadido

- **Arquitectura modular con ES6 modules**
  - Separación en capas: Config, Services, Core, UI, Utils
  - Patrón Observer en State Manager
  - Singleton pattern en servicios
  
- **Nuevos módulos**:
  - `config/constants.js` - Configuración centralizada
  - `services/api.service.js` - Capa de acceso a APIs
  - `services/storage.service.js` - Gestión de IndexedDB
  - `core/converter.js` - Lógica pura de conversión
  - `core/state-manager.js` - Gestión de estado reactivo
  - `ui/ui.controller.js` - Controlador de DOM
  - `utils/formatters.js` - Funciones auxiliares

- **Documentación profesional**:
  - README.md con arquitectura explicada
  - ARCHITECTURE.md con detalles técnicos
  - JSDoc en todas las funciones públicas

#### Cambiado

- **Estructura de carpetas**:
  ```
  Antes:
  ├── app.js (481 líneas monolíticas)
  ├── styles.css
  └── sw.js
  
  Después:
  └── src/
      ├── js/ (8 módulos separados)
      ├── css/
      └── sw.js (mejorado)
  ```

- **Service Worker**:
  - Versión actualizada a v9
  - Estrategia Network First con timeout para APIs
  - Mejor manejo de errores y fallbacks
  - Soporte para mensajes desde la app

- **index.html**:
  - Import de módulo ES6 con `type="module"`
  - Rutas actualizadas a nueva estructura

#### Mejorado

- **Separación de responsabilidades**:
  - Lógica de negocio independiente del DOM
  - APIs encapsuladas en capa de servicio
  - Estado centralizado y reactivo

- **Testability**:
  - Funciones puras sin efectos secundarios
  - Módulos desacoplados fáciles de mockear
  - Lógica aislada testeable independientemente

- **Escalabilidad**:
  - Fácil agregar nuevas monedas
  - Fácil cambiar proveedores de API
  - Arquitectura preparada para crecimiento

- **Mantenibilidad**:
  - Código organizado por responsabilidad
  - Nombres descriptivos y consistentes
  - Documentación inline con JSDoc

#### Eliminado

- `app.js` monolítico de 481 líneas
- `sw.js` de la raíz (movido a src/)
- `styles.css` de la raíz (movido a src/css/)
- Documentación temporal y scripts de generación

#### Principios Aplicados

- **SOLID**:
  - Single Responsibility: Cada módulo una función
  - Open/Closed: Extensible sin modificar core
  - Dependency Injection: Vía ES6 imports

- **Clean Code**:
  - Funciones pequeñas y enfocadas
  - Nombres auto-documentados
  - DRY (Don't Repeat Yourself)
  - KISS (Keep It Simple, Stupid)

- **Design Patterns**:
  - Observer (State Manager)
  - Singleton (Services)
  - Module (ES6)

---

## [1.0.0] - 2026-02-15

### Versión Inicial Funcional

#### Añadido

- PWA básica funcional
- Conversión entre PEN, USD, ARS
- IndexedDB para persistencia
- Service Worker básico
- Netlify Function para proxy CORS
- Diseño responsive con tema claro/oscuro
- 8 iconos PWA para instalación

#### Características

- Conversión en tiempo real
- Modo offline con datos cacheados
- Instalable en Android como app nativa
- APIs: SUNAT y DolarAPI

---

## Notas de Versión

### v2.0.0 vs v1.0.0

**Funcionalidad**: Idéntica (no hay breaking changes en features)  
**Arquitectura**: Completamente refactorizada  
**Código**: Reducido de 1 archivo de 481 líneas a 8 módulos de ~150 líneas c/u  
**Mantenibilidad**: Significativamente mejorada  
**Escalabilidad**: Preparada para crecimiento

### Migración

No se requiere migración de datos. La estructura de IndexedDB permanece igual.

---

**Formato**: Basado en [Keep a Changelog](https://keepachangelog.com/es/)  
**Versionado**: [Semantic Versioning](https://semver.org/)
