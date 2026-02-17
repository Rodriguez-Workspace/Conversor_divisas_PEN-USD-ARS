# Changelog

Historial de cambios significativos del proyecto.

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
