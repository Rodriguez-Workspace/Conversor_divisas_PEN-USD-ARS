# Debug: Conversión No Funciona

## Síntomas
- Los datos se cargan correctamente (API funciona)
- Las tasas se muestran
- Pero al escribir en un input, los otros no se actualizan

## Logs de Debug Agregados

Ahora con cada acción verás logs detallados en la consola:

### 1. Al escribir en un input:

```
UIController: Input ignorado, conversión en curso (si hay loop)
UIController: Llamando onInput callback para USD
App.handleConversion llamado con: USD
App: Monto obtenido: 100 de USD
Converter.convert() llamado: {sourceCurrency: "USD", amount: 100, rates: {...}}
Converter: Resultado calculado: {PEN: 370, USD: 100, ARS: 96000}
App: Resultado de conversión: {PEN: 370, USD: 100, ARS: 96000}
UIController.setInputValue(PEN): 370.00 [isConverting=true]
UIController.setInputValue(ARS): 96000.00 [isConverting=true]
App: Inputs actualizados correctamente
```

## Checklist de Verificación

### ✅ Verificar que las tastasestán cargadas:

```javascript
// En consola del navegador:
window.__app__.converter.getRates()
// Debería retornar: {penToUsd: 3.7xx, usdToArs: 9xxxx}
```

### ✅ Verificar que los elementos DOM existen:

```javascript
// En consola:
document.getElementById('penInput')
document.getElementById('usdInput')
document.getElementById('arsInput')
// Todos deberían retornar un <input> element
```

### ✅ Probar conversión manual:

```javascript
// En consola:
window.__app__.handleConversion('USD')
// Debería mostrar todos los logs
```

### ✅ Ver callbacks registrados:

```javascript
// En consola:
window.__app__.uiController.inputCallbacks
// Debería mostrar: {onInput: ƒ, onRefresh: ƒ}
```

## Problemas Comunes

### Problema 1: isConverting se queda en true

**Síntoma**: Solo la primera conversión funciona

**Causa**: Un error en el try/catch hace que isConverting no se desactive

**Solución**: Ya corregida con finally block implícito

### Problema 2: Los códigos de moneda no coinciden

**Síntoma**: Error "Moneda no soportada"

**Verificar**:
```javascript
// En consola:
import { CURRENCIES } from './src/js/config/constants.js';
console.log(CURRENCIES.PEN.code);  // Debe ser exactamente "PEN"
console.log(CURRENCIES.USD.code);  // Debe ser exactamente "USD"
console.log(CURRENCIES.ARS.code);  // Debe ser exactamente "ARS"
```

### Problema 3: parseInputValue retorna NaN

**Síntoma**: Converter recibe NaN como amount

**Verificar**:
```javascript
// En consola:
import { parseInputValue } from './src/js/utils/formatters.js';
console.log(parseInputValue('100'));      // Debe ser 100
console.log(parseInputValue('100.50'));   // Debe ser 100.5
console.log(parseInputValue('1,000.50')); // Debe ser 1000.5
```

### Problema 4: Event listeners no disparan

**Síntoma**: No hay logs al escribir en inputs

**Causa**: Los elementos no existían cuando se registraron los listeners

**Verificar orden de inicialización**:
```javascript
// Debe ser:
// 1. uiController.init() → captura elementos DOM
// 2. uiController.attachEventListeners() → registra eventos
```

## Flujo Completo Esperado

```
1. Usuario escribe "100" en input USD
   └─> Event 'input' dispara

2. UIController._handleInput('USD') se ejecuta
   ├─> Verifica isConverting = false ✓
   └─> Inicia debounce de 300ms

3. Después de 300ms sin más input:
   └─> Llama inputCallbacks.onInput('USD')

4. App.handleConversion('USD') se ejecuta
   ├─> Verifica que hay tasas ✓
   ├─> Obtiene amount = 100
   ├─> Llama converter.convert('USD', 100)
   └─> Activa isConverting = true

5. Converter.convert() calcula:
   ├─> PEN = 100 * 3.7 = 370
   ├─> ARS = 100 * 960 = 96000
   └─> Retorna {PEN: 370, USD: 100, ARS: 96000}

6. App actualiza UI:
   ├─> uiController.setInputValue('PEN', 370)
   ├─> uiController.setInputValue('ARS', 96000)
   └─> Desactiva isConverting = false

7. Los inputs disparan eventos 'input' al ser actualizados
   └─> PERO _handleInput los ignora porque isConverting era true
```

## Solución si Sigue Sin Funcionar

Si después de ver los logs identificas el problema:

### Si no hay logs en absoluto:
```javascript
// Verificar que la app esté inicializada:
console.log(window.__app__);
console.log(window.__app__.isInitialized);
```

### Si hay error al obtener input value:
```javascript
// Verificar IDs en HTML:
// Deben ser exactamente: id="penInput", id="usdInput", id="arsInput"
```

### Si la conversión calcula mal:
```javascript
// Verificar tasas:
window.__app__.converter.getRates()
// PenToUsd debería ser ~3.7
// UsdToArs debería ser ~900-1000
```

---

**Próximo paso**: Hacer deploy y revisar logs en consola del navegador
