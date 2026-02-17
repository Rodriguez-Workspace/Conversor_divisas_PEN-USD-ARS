# ✅ Checklist de Verificación: Filosofía Offline-First

## 🎯 Objetivo
Verificar que la aplicación cumple con la filosofía: **"Network-first con datos reales siempre, nunca valores inventados"**

---

## 📋 Tests Funcionales

### ✅ Test 1: Primera Carga CON Conexión
**Objetivo**: Verificar que la app obtiene datos frescos desde APIs

1. **Limpiar caché**:
   - Abrir DevTools (F12)
   - Application → Storage → Clear site data
   - Cerrar DevTools

2. **Recargar página** (Ctrl+Shift+R)

3. **Verificar en consola**:
   ```
   ✅ Debe mostrar:
   "App: Intentando obtener tipos de cambio desde APIs..."
   "App: Tasas obtenidas exitosamente desde APIs: {penToUsd: ..., usdToArs: ...}"
   "App: Tipos de cambio actualizados y guardados"
   ```

4. **Verificar UI**:
   - ✅ Badge verde: "🟢 Datos en tiempo real"
   - ✅ Fecha/hora reciente en "Actualizado"
   - ✅ Conversión funciona al escribir en cualquier input

5. **Verificar IndexedDB**:
   - DevTools → Application → IndexedDB → currencyDB → exchangeRates
   - ✅ Debe existir registro con id: "current"
   - ✅ Debe tener: penToUsd, usdToArs, fechaSUNAT, fechaBlue, timestamp

**Resultado Esperado**: ✅ Usa datos de APIs y los guarda

---

### ✅ Test 2: Segunda Carga CON Conexión (Datos Guardados)
**Objetivo**: Verificar que SIEMPRE intenta APIs primero (no usa caché inmediatamente)

1. **Mantener página abierta**

2. **Recargar página** (F5)

3. **Verificar en consola**:
   ```
   ✅ Debe mostrar:
   "App: Intentando obtener tipos de cambio desde APIs..."
   (NO debe decir "usando datos offline" inmediatamente)
   ```

4. **Verificar UI**:
   - ✅ Badge sigue verde: "🟢 Datos en tiempo real"
   - ✅ Fecha se actualizó (nueva hora)

**Resultado Esperado**: ✅ Siempre intenta red primero, incluso con caché disponible

---

### ✅ Test 3: Uso Offline CON Datos Guardados
**Objetivo**: Verificar fallback a último tipo de cambio real cuando no hay conexión

1. **DevTools → Network → Offline** (activar modo offline)

2. **Recargar página** (F5)

3. **Verificar en consola**:
   ```
   ✅ Debe mostrar:
   "App: Intentando obtener tipos de cambio desde APIs..."
   "App: Error al obtener datos desde APIs, usando caché..."
   "App: Usando datos offline (último tipo de cambio real): {penToUsd: ..., usdToArs: ...}"
   ```

4. **Verificar UI**:
   - ✅ Badge amarillo: "🟡 Modo offline"
   - ✅ Mensaje visible: "Sin conexión. Usando último tipo de cambio real guardado."
   - ✅ Conversión SIGUE funcionando (usa datos guardados)
   - ✅ Muestra fecha del dato guardado (no "ahora")

5. **Verificar valores**:
   - ✅ Los valores de conversión coinciden con los del Test 1
   - ✅ NO usa valores diferentes o inventados

**Resultado Esperado**: ✅ Usa último tipo de cambio real guardado, indica claramente "offline"

---

### ✅ Test 4: Primera Vez SIN Conexión (Sin Datos Guardados)
**Objetivo**: Verificar que NO convierte con valores inventados

1. **Limpiar caché**:
   - DevTools → Application → Storage → Clear site data
   - **Mantener** Network → Offline activado

2. **Recargar página** (Ctrl+Shift+R)

3. **Verificar en consola**:
   ```
   ✅ Debe mostrar:
   "App: Intentando obtener tipos de cambio desde APIs..."
   "App: Error al obtener datos desde APIs, usando caché..."
   "App: Sin datos disponibles - Primera vez sin conexión"
   ```

4. **Verificar UI**:
   - ✅ Badge rojo: "🔴 Sin datos"
   - ✅ Mensaje claro: "No hay conexión y no existe un tipo de cambio guardado previamente. Por favor, conéctate a internet para obtener los tipos de cambio reales."
   - ✅ Inputs deshabilitados o conversión no funciona
   - ✅ NO muestra valores de conversión

5. **Intentar escribir**:
   - Escribir "100" en input PEN
   - ✅ NO debe convertir a USD/ARS (o debe mostrar 0.00)

**Resultado Esperado**: ✅ Bloquea conversión, NO usa valores falsos

---

### ✅ Test 5: Recuperación de Conexión
**Objetivo**: Verificar que al recuperar conexión, actualiza a datos frescos

1. **Desde Test 4** (offline sin datos)

2. **DevTools → Network → Offline** (desactivar modo offline)

3. **Clic en botón "Actualizar tipos de cambio"** (o recargar página)

4. **Verificar en consola**:
   ```
   ✅ Debe mostrar:
   "App: Intentando obtener tipos de cambio desde APIs..."
   "App: Tasas obtenidas exitosamente desde APIs: {penToUsd: ..., usdToArs: ...}"
   "App: Tipos de cambio actualizados y guardados"
   ```

5. **Verificar UI**:
   - ✅ Badge cambia a verde: "🟢 Datos en tiempo real"
   - ✅ Conversión ahora funciona
   - ✅ Mensaje de error desaparece

**Resultado Esperado**: ✅ Se recupera automáticamente al obtener conexión

---

## 🔍 Verificación de Código

### ✅ Check 1: main.js - loadExchangeRates()
```javascript
// ✅ Debe empezar con:
try {
  console.log('App: Intentando obtener tipos de cambio desde APIs...');
  const [sunatData, dolarApiData] = await apiService.fetchAllRates();
  // NO debe haber if (!forceRefresh) { loadFromCache() } aquí
```

### ✅ Check 2: main.js - _handleLoadError()
```javascript
// ✅ Debe tener dos casos:
if (cached) {
  // Usar datos guardados → setOffline()
} else {
  // clearRates() + error (NO valores hardcodeados)
}
```

### ✅ Check 3: converter.js - NO debe tener valores default
```javascript
// ❌ NO debe existir:
// const DEFAULT_RATES = { penToUsd: 0.27, usdToArs: 1000 };

// ✅ Debe tener:
if (!this.rates.penToUsd || !this.rates.usdToArs) {
  return { pen: 0, usd: 0, ars: 0 }; // Retorna 0, no inventa
}
```

### ✅ Check 4: constants.js - Solo config, NO tasas
```javascript
// ❌ NO debe existir:
// export const DEFAULT_RATES = { ... };

// ✅ Solo debe tener:
// API_CONFIG, CURRENCIES, CACHE_CONFIG, etc.
```

---

## 📊 Matriz de Resultados

| Test | Escenario | Online/Offline | Caché Existe | Comportamiento Esperado | Estado |
|------|-----------|----------------|--------------|-------------------------|--------|
| 1 | Primera carga | Online | No | Fetch APIs → Guardar → Online ✅ | ⬜ |
| 2 | Segunda carga | Online | Sí | Fetch APIs (siempre primero) ✅ | ⬜ |
| 3 | Uso normal | Offline | Sí | Usar caché → Offline mode ✅ | ⬜ |
| 4 | Primera vez | Offline | No | Bloquear → Mensaje error ✅ | ⬜ |
| 5 | Recuperación | Online | No | Fetch APIs → Recuperar ✅ | ⬜ |

**Instrucciones**: Marcar con ✅ cada test que pase.

---

## 🚨 Red Flags (Señales de Alerta)

Si ves cualquiera de estos comportamientos, la filosofía NO se cumple:

❌ **App muestra conversión sin conexión cuando es primera vez**
   → Está usando valores inventados

❌ **Badge siempre verde incluso sin conexión**
   → No detecta offline correctamente

❌ **Consola NO muestra "Intentando obtener tipos de cambio desde APIs..."**
   → No intenta red primero

❌ **Conversión funciona diferente entre online/offline primera vez**
   → Tiene valores hardcodeados

❌ **IndexedDB nunca se llena**
   → No guarda datos para uso offline

❌ **Mensaje de error no menciona "conéctate a internet"**
   → No comunica claramente el problema

---

## ✅ Checklist Final

Antes de considerar la app completamente funcional según filosofía:

- [ ] Test 1 pasó: Obtiene datos frescos en primera carga
- [ ] Test 2 pasó: Siempre intenta red primero (incluso con caché)
- [ ] Test 3 pasó: Modo offline usa último dato real + indica claramente
- [ ] Test 4 pasó: Bloquea conversión sin datos (no inventa)
- [ ] Test 5 pasó: Se recupera al obtener conexión
- [ ] Code Check 1: main.js network-first implementado
- [ ] Code Check 2: _handleLoadError() nunca usa defaults
- [ ] Code Check 3: converter.js retorna 0 cuando no hay rates
- [ ] Code Check 4: constants.js no tiene tasas hardcodeadas
- [ ] DevTools: IndexedDB se llena correctamente
- [ ] DevTools: Service Worker registrado sin errores
- [ ] UI: Badges (verde/amarillo/rojo) cambian correctamente
- [ ] UI: Mensajes de error son claros y honestos

---

## 📝 Notas de Debugging

Si algún test falla, revisar:

1. **Consola del navegador**: Buscar logs de "App:"
2. **Network tab**: Verificar que fetch a APIs se ejecute
3. **Application → IndexedDB**: Confirmar estructura de datos
4. **Application → Service Worker**: Estado "activated"
5. **main.js línea ~110**: Verificar que `loadExchangeRates()` empiece con fetch

---

## 🎯 Criterio de Éxito

**La aplicación cumple la filosofía si y solo si**:

✅ Siempre intenta red primero (network-first)
✅ Usa caché solo como fallback cuando red falla
✅ NUNCA usa valores inventados o hardcodeados
✅ Indica claramente su estado (online/offline/sin datos)
✅ Bloquea conversión cuando no tiene datos reales

**Filosofía**: Es mejor ser honesto y decir "no puedo" que mentir con datos falsos.
