# Laboratorio 7 — Country Explorer

**Probado en:** Brave Browser  
---

## Parte 1: Region Filter

Se realizó un filtro con un `<select>` dropdown que permite filtrar países por región. El filtro funciona en combinación con el input de búsqueda por nombre, permitiendo aplicar ambos criterios de forma simultánea. También incluye la opción "All Regions" para resetear el filtro de región.

**Video explicativo:** 

### Definition of Done — Parte 1

| # | Criterio | Descripción | ✅ |
|---|----------|-------------|-----|
| 1 | Dropdown existe | Elemento `<select>` con opciones de región | ✅ |
| 2 | Regiones populadas | Opciones cargadas desde datos de la API (Africa, Americas, Asia, Europe, Oceania) | ✅ |
| 3 | Filtro funciona | Seleccionar región muestra únicamente países correspondientes | ✅ |
| 4 | Filtros combinados | Búsqueda por nombre + filtro de región funcionan juntos | ✅ |
| 5 | Opción reset | "All Regions" muestra todos los países | ✅ |
| 6 | Estado preservado | El filtro persiste mientras se escribe en el buscador | ✅ |
| 7 | Sin errores | Consola libre de errores | ✅ |

---

## Parte 2: Favorites System

Se implementó un sistema de favoritos que agrega un ícono de corazón a cada tarjeta de país. Al hacer clic en el corazón, el país se agrega o elimina de la lista de favoritos. Los favoritos se almacenan en `localStorage` para que persistan entre recargas de página. También se agregó un toggle de "Favorites Only" para mostrar únicamente los países marcados como favoritos, y un botón para limpiar todos los favoritos.

**Video explicativo:**

### Definition of Done — Parte 2

| # | Criterio | Descripción | ✅ |
|---|----------|-------------|-----|
| 1 | Ícono de corazón visible | Cada tarjeta muestra un corazón (outline/filled) | ✅ |
| 2 | Toggle funciona | Click en corazón agrega/quita de favoritos | ✅ |
| 3 | localStorage usado | Favoritos persisten en `localStorage` | ✅ |
| 4 | Filtro de favoritos | Checkbox/toggle para mostrar solo favoritos | ✅ |
| 5 | Feedback visual | Corazón relleno para favoritos, outline para los demás | ✅ |
| 6 | Recarga de página | Favoritos sobreviven al refresh del navegador | ✅ |
| 7 | Limpiar favoritos | Botón para borrar todos los favoritos | ✅ |

---
