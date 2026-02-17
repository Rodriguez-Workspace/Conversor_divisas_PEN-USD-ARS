# Guía Rápida de Deployment y Troubleshooting

## Comandos para Deploy

```bash
# 1. Ver estado
git status

# 2. Añadir cambios
git add .

# 3. Commit
git commit -m "Fix: Service Worker y Netlify Functions corregidos"

# 4. Push a GitHub
git push origin main
```

Netlify desplegará automáticamente en ~2 minutos.

---

## Errores Comunes y Soluciones

### ❌ Error: Service Worker registration failed

**Causa**: El Service Worker usaba ES6 imports (no soportado en SW)

**Solución**: ✅ Ya corregido
- Service Worker movido a `/sw.js` (raíz)
- Eliminados los imports ES6
- Configuración inline en el archivo

### ❌ Error: 404 en /.netlify/functions/sunat

**Causa posible 1**: Netlify aún no terminó de desplegar las funciones

**Solución**: Espera 2-3 minutos después del deploy

**Causa posible 2**: Configuración de functions incorrecta

**Solución**: ✅ Ya corregido
- Agregado `node_bundler = "esbuild"` en netlify.toml
- Creado package.json en netlify/functions/

**Verificación**:
1. Ve a tu dashboard de Netlify
2. Click en "Functions" en el menú lateral
3. Deberías ver "sunat" listada
4. Si no aparece, revisa los logs de deploy

### ❌ Error: CORS blocked en API SUNAT directa

**Comportamiento esperado**: Este error es NORMAL

**Explicación**: 
- La API de SUNAT bloquea requests desde browsers
- Por eso existe la Netlify Function como proxy
- Si la function funciona, este error se ignora

**Flujo correcto**:
```
1. Intenta Netlify Function /.netlify/functions/sunat
   └─> Si funciona: ✅ Usa esos datos
   └─> Si falla (404): Intenta API directa

2. Intenta API directa https://api.apis.net.pe/...
   └─> Si funciona: ✅ Usa esos datos (raro en production)
   └─> Si falla (CORS): ❌ Error esperado

3. Fallback a IndexedDB
   └─> Si hay datos guardados: ⚠️ Usa datos offline
   └─> Si NO hay datos: ❌ Muestra error
```

### ❌ Error: No hay datos guardados en IndexedDB

**Causa**: Primera visita y APIs fallaron

**Solución temporal (para testing)**:
1. Instala extensión "CORS Unblock" en Chrome (solo para testing local)
2. Recarga la página
3. Desinstala la extensión después

**Solución definitiva**: 
Esperar a que Netlify Functions funcione correctamente

---

## Verificación de Deploy Exitoso

### 1. Verificar Functions en Netlify

```
Dashboard → Tu sitio → Functions
```

Deberías ver:
- ✅ **sunat** - Listed
- Estado: Active

### 2. Probar la función manualmente

Abre en el navegador:
```
https://tu-sitio.netlify.app/.netlify/functions/sunat
```

Deberías ver JSON con:
```json
{
  "compra": "3.753",
  "venta": "3.755",
  "origen": "SUNAT",
  "fecha": "2026-02-16"
}
```

### 3. Verificar Service Worker

1. Abre DevTools (F12)
2. Pestaña "Application" → "Service Workers"
3. Deberías ver:
   - ✅ Status: Activated and running
   - ✅ Source: /sw.js

### 4. Verificar Cache

En DevTools:
1. Application → Cache Storage
2. Deberías ver: **conversor-v9**
3. Dentro: todos los archivos de la app

---

## Debugging en Producción

### Ver logs de Netlify Function

```bash
# En el dashboard de Netlify
Functions → sunat → View function logs
```

### Ver errores en consola del browser

```javascript
// En la consola del navegador
localStorage.debug = '*'
```

Recarga la página para ver logs detallados.

---

## URLs Importantes

- **Producción**: https://conversor-divisas-pen-ars.netlify.app
- **Dashboard Netlify**: https://app.netlify.com
- **Logs de Deploy**: Dashboard → Deploys → Click en el último deploy
- **Function Logs**: Dashboard → Functions → sunat

---

## Si Todo Falla

### Plan B: Usar solo DolarAPI

Si SUNAT no funciona, la app puede trabajar solo con USD/ARS:

```javascript
// Editar src/js/services/api.service.js
// Comentar el fetch de SUNAT y usar una tasa fija temporal
```

### Plan C: Datos Mockeados para Testing

```javascript
// En main.js, agregar datos de prueba:
const mockRates = {
  penToUsd: 3.75,
  usdToArs: 1000
};
converter.setRates(mockRates);
```

---

## Próximos Pasos después del Deploy

1. ✅ Verificar que Functions esté funcionando
2. ✅ Probar conversión en móvil
3. ✅ Instalar la PWA desde Chrome móvil
4. ✅ Probar modo offline (activar modo avión)

---

**Última actualización**: 2026-02-16  
**Versión**: 2.0.0
