# 🎯 Filosofía de la Aplicación

## Principio Fundamental: Datos Reales Siempre

Esta PWA sigue un principio inquebrantable: **NUNCA mostrar datos inventados, solo tipos de cambio reales**.

---

## 📡 Estrategia: Network-First con Fallback Garantizado

### Flujo de Obtención de Datos

```
Usuario abre la app
       │
       ▼
┌──────────────────────────┐
│ 1. NETWORK-FIRST         │
│    └─ Fetch desde APIs   │
│       - SUNAT            │
│       - DolarAPI         │
└──────────────────────────┘
       │
       ├─────── ✅ ÉXITO ────────┐
       │                         │
       │                         ▼
       │              ┌────────────────────┐
       │              │ Guardar IndexedDB  │
       │              │ Mostrar: "ONLINE"  │
       │              │ Datos: Tiempo Real │
       │              └────────────────────┘
       │
       └─────── ❌ FALLO ────────┐
                                 │
                                 ▼
                   ┌──────────────────────────┐
                   │ 2. FALLBACK A CACHÉ      │
                   │    └─ Buscar IndexedDB   │
                   └──────────────────────────┘
                                 │
                   ├──── ✅ EXISTE ────┐
                   │                   │
                   │                   ▼
                   │      ┌─────────────────────────┐
                   │      │ Mostrar: "OFFLINE"      │
                   │      │ Datos: Último real      │
                   │      │ Mensaje: Fecha guardado │
                   │      └─────────────────────────┘
                   │
                   └──── ❌ NO EXISTE ────┐
                                          │
                                          ▼
                            ┌───────────────────────────────┐
                            │ 3. BLOQUEO TRANSPARENTE       │
                            │    └─ NO convertir            │
                            │    └─ Mensaje claro:          │
                            │       "Conéctate a internet"  │
                            └───────────────────────────────┘
```

---

## ✅ Lo Que SÍ Hace Esta App

1. **Siempre intenta red primero** (incluso en carga inicial)
2. **Valida datos recibidos** de las APIs
3. **Guarda automáticamente** cada respuesta exitosa en IndexedDB
4. **Muestra estado claro**: "Datos en tiempo real" vs "Modo offline"
5. **Usa último tipo de cambio real** cuando no hay conexión
6. **Muestra fecha del dato** guardado en modo offline

---

## ❌ Lo Que NUNCA Hace Esta App

1. ❌ **NO usa valores hardcodeados** (ej: USD = 3.75)
2. ❌ **NO inventa tasas de cambio**
3. ❌ **NO oculta que está offline**
4. ❌ **NO convierte con datos inexistentes**
5. ❌ **NO asume conexión sin verificar**

---

## 🔄 Casos de Uso

### Caso 1: Primera vez CON conexión
```
1. Usuario abre app
2. Fetch APIs → Éxito
3. Guardar en IndexedDB
4. Convertir con datos reales
5. Badge verde: "Datos en tiempo real"
```

### Caso 2: Primera vez SIN conexión
```
1. Usuario abre app
2. Fetch APIs → Fallo
3. Buscar en IndexedDB → No existe
4. Mostrar mensaje: "No hay conexión y no existe un tipo de cambio 
   guardado previamente. Por favor, conéctate a internet para obtener 
   los tipos de cambio reales."
5. Bloquear conversión (inputs deshabilitados)
```

### Caso 3: Uso regular CON conexión
```
1. Usuario abre app
2. Fetch APIs → Éxito
3. Actualizar IndexedDB con nuevos datos
4. Convertir con datos frescos
5. Badge verde: "Datos en tiempo real"
```

### Caso 4: Uso regular SIN conexión
```
1. Usuario abre app
2. Fetch APIs → Fallo
3. Buscar en IndexedDB → Existe (guardado ayer)
4. Convertir con último tipo de cambio real
5. Badge amarillo: "Modo offline"
6. Mensaje: "Usando tipo de cambio del 2024-01-15"
```

---

## 🔍 Indicadores Visuales

### Estado Online (verde)
```
🟢 Datos en tiempo real
   Actualizado: hace 2 minutos
```

### Estado Offline (amarillo)
```
🟡 Modo offline
   Usando tipo de cambio del: 15/01/2024
   Sin conexión. Datos reales guardados previamente.
```

### Estado Error (rojo)
```
🔴 Sin datos disponibles
   No hay conexión y no existe un tipo de cambio guardado 
   previamente. Por favor, conéctate a internet.
```

---

## 📦 Persistencia: IndexedDB

### Estructura de Datos Guardados

```javascript
{
  id: 'current',
  penToUsd: 0.26845,      // Calculado desde SUNAT (compra)
  usdToArs: 1035.50,      // DolarAPI blue (venta)
  fechaSUNAT: '2024-01-15T10:30:00',
  fechaBlue: '2024-01-15T10:30:00',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

**Garantía**: Estos datos SIEMPRE provienen de APIs reales, nunca son inventados.

---

## 🎨 Service Worker: Estrategias

### Assets Estáticos (HTML, CSS, JS, imágenes)
- **Estrategia**: Cache-First
- **Razón**: No cambian frecuentemente, performance óptima

### Datos Dinámicos (APIs)
- **Estrategia**: Network-First con timeout 5s
- **Razón**: Prioriza datos frescos, fallback a caché

### Timeout de Red
```javascript
networkFirstWithTimeout(request, 5000)
// Si después de 5s no responde, usa caché
```

---

## 🧪 Principios SOLID Aplicados

### Single Responsibility
- `converter.js`: Solo cálculos matemáticos
- `api.service.js`: Solo comunicación con APIs
- `storage.service.js`: Solo IndexedDB
- `ui.controller.js`: Solo DOM

### Open/Closed
- Agregar nueva moneda: Editar `constants.js`, no tocar lógica
- Cambiar API: Editar `api.service.js`, no tocar conversor

### Dependency Inversion
- Módulos dependen de abstracciones (interfaces implícitas)
- No hay dependencias circulares

---

## 📊 Flujo de Datos Completo

```
APIs (SUNAT + DolarAPI)
       │
       ▼
api.service.js (fetch + validate)
       │
       ▼
main.js (orchestrate)
       │
       ├─► storage.service.js (save IndexedDB)
       │
       ├─► converter.js (calculate)
       │
       ├─► state-manager.js (update state)
       │
       └─► ui.controller.js (render DOM)
```

**Sin atajos, sin trucos, sin valores falsos.**

---

## 🚀 Deployment: Netlify

### ¿Por qué Netlify?
- **CDN Global**: Baja latencia mundial
- **HTTPS Automático**: Requerido para Service Workers
- **Serverless Functions**: Proxy CORS sin servidor dedicado
- **Cero Config**: Deploy automático desde Git

### Netlify Function: Proxy CORS
```javascript
// /.netlify/functions/sunat
// Hace fetch a API SUNAT desde backend
// Retorna JSON sin restricciones CORS
```

---

## 📱 PWA: Progressive Web App

### Capacidades Offline
1. **Service Worker** cachea assets estáticos
2. **IndexedDB** guarda tipos de cambio reales
3. **Manifest** permite instalación
4. **Responsive** adapta a cualquier pantalla

### Ventajas sobre Web Normal
- ✅ Instalable en home screen
- ✅ Funciona sin conexión (con datos previos)
- ✅ Push notifications (futuro)
- ✅ Ícono de app nativo

---

## 🎯 Resumen Ejecutivo

Esta PWA es una **herramienta confiable** que:

1. **Prioriza transparencia** sobre conveniencia
2. **Muestra datos reales** o te dice que no puede
3. **Funciona offline** cuando ya tiene datos guardados
4. **Nunca te engaña** con valores inventados
5. **Arquitectura profesional** lista para escalar

**Filosofía**: Mejor decir "no puedo" que mentir con datos falsos.
