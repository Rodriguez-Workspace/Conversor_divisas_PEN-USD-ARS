# 💱 Conversor Multi-Divisa PWA

Aplicación web progresiva (PWA) para conversión en tiempo real entre Soles Peruanos (PEN), Dólares Americanos (USD) y Pesos Argentinos (ARS - dólar blue).

## 🚀 Características

- ✅ Conversión multidireccional en tiempo real
- ✅ Interfaz mobile-first con tema oscuro
- ✅ Instalable como app nativa en Android
- ✅ Funciona offline con Service Worker
- ✅ Cache inteligente de tipos de cambio
- ✅ Datos actualizados de SUNAT y DolarAPI

## 📦 Instalación

### Opción 1: Servidor Local

1. Abre una terminal en la carpeta del proyecto
2. Ejecuta un servidor HTTP local:

**Con Python 3:**
```bash
python -m http.server 8000
```

**Con Node.js (npx):**
```bash
npx http-server -p 8000
```

**Con PHP:**
```bash
php -S localhost:8000
```

3. Abre tu navegador en `http://localhost:8000`

### Opción 2: Publicar en Hosting

Puedes publicar todos los archivos en cualquier hosting web (GitHub Pages, Netlify, Vercel, etc.)

## 📱 Instalación en Android

1. Abre la aplicación en Chrome para Android
2. Toca el menú (⋮) y selecciona "Agregar a pantalla de inicio" o "Instalar app"
3. La aplicación se instalará como una app nativa

## 🎨 Generar Iconos

Los iconos PWA deben estar en la carpeta `icons/`. Para generarlos:

1. Abre `generate-icons.html` en tu navegador
2. Haz clic en "Generar Iconos"
3. Se descargarán automáticamente todos los tamaños necesarios
4. Mueve los archivos `.png` descargados a la carpeta `icons/`

Tamaños necesarios:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## 🔧 Estructura del Proyecto

```
cambio2/
├── index.html          # Estructura principal
├── styles.css          # Estilos tema oscuro
├── app.js              # Lógica de conversión
├── manifest.json       # Configuración PWA
├── sw.js               # Service Worker
├── generate-icons.html # Generador de iconos
├── icons/              # Iconos PWA (generados)
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── README.md           # Este archivo
```

## 🌐 APIs Utilizadas

### SUNAT (PEN ⇄ USD)
- **Endpoint:** `https://api.apis.net.pe/v1/tipo-cambio-sunat`
- **Cálculo:** Promedio de compra y venta

### DolarAPI (USD ⇄ ARS)
- **Endpoint:** `https://dolarapi.com/v1/dolares/blue`
- **Valor:** Máximo entre compra y venta (dólar blue)

## 🧠 Lógica de Conversión

La aplicación usa USD como moneda base intermedia:

- **PEN → USD → ARS**
- **ARS → USD → PEN**
- **USD → PEN y ARS** (directo)

### Fórmulas

```javascript
// PEN a USD
USD = PEN / promedioSUNAT

// USD a PEN
PEN = USD * promedioSUNAT

// USD a ARS
ARS = USD * tipoBlue

// ARS a USD
USD = ARS / tipoBlue
```

## 💾 Almacenamiento

- **localStorage:** Cache de tipos de cambio (válido por 24 horas)
- **Service Worker Cache:** Archivos estáticos para funcionamiento offline

## 🎯 Resumen de Tasas

En la parte inferior se muestra el formato obligatorio:

```
🇵🇪 X PEN  |  🇺🇸 1 USD  |  🇦🇷 Y ARS
```

Donde:
- **X** = 1 USD en soles (promedio SUNAT)
- **Y** = 1 USD en pesos argentinos (dólar blue)

## 🔄 Actualización

- **Automática:** Al cargar la página (si no hay cache o es antiguo)
- **Manual:** Botón de actualización (🔄)
- **Cache:** 24 horas de validez

## 📱 Requisitos del Navegador

- Service Workers
- LocalStorage
- Fetch API
- ES6+ JavaScript

Compatible con:
- ✅ Chrome/Edge (Android, Windows, Mac)
- ✅ Firefox
- ✅ Safari (iOS 11.3+)

## 🛠️ Desarrollo

La aplicación usa únicamente:
- HTML5
- CSS3 (Custom Properties, Flexbox, Grid)
- Vanilla JavaScript (ES6+)
- Service Worker API
- Web App Manifest

**Sin frameworks ni librerías externas.**

## 📝 Notas

- Los tipos de cambio se actualizan según disponibilidad de las APIs
- El dólar blue argentino puede variar significativamente del oficial
- La aplicación funciona offline usando el último tipo de cambio guardado
- El debounce de 500ms evita conversiones excesivas mientras se escribe

## 🐛 Solución de Problemas

### La app no se instala en Android
- Verifica que estés usando HTTPS o localhost
- Asegúrate de que manifest.json esté correctamente vinculado
- Comprueba que los iconos existan en la carpeta `icons/`

### No se actualizan los tipos de cambio
- Verifica tu conexión a internet
- Las APIs pueden tener límites de tasa
- Revisa la consola del navegador para errores

### Errores en Service Worker
- Limpia el caché del navegador
- Desregistra el Service Worker antiguo en DevTools
- Verifica que las rutas de los archivos sean correctas

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

---

Desarrollado con ❤️ usando tecnologías web estándar.
