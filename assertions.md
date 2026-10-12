# Evidencia de pruebas — diario personal

Rama `agent/personal-diary-web-1012a`, servido con `python3 -m http.server 8781`
sobre el worktree. Capturas hechas con el CLI `agent-browser` en modo headless
(viewport 1120x900). Reproducible con `bash capture.sh`.

## Antes

| # | Captura | Estado |
|---|---|---|
| 00 | `00-before-no-app.png` | El repo solo tenía `README.md`: la URL servía un listado de directorio, sin app. |

## Después — sesión de prueba

| # | test_start | assertion | Resultado | Captura |
|---|---|---|---|---|
| 01 | Carga inicial del diario | Precondition: página cargada, 0 entradas, mensaje "Todavía no escribiste nada." | passed | `01-empty-state.png` |
| 02 | Guardar con el campo vacío | Muestra "Escribe algo antes de guardar." y no crea entradas (sigue 0) | passed | `02-empty-validation.png` |
| 03 | Guardar una entrada | Aparece la entrada con fecha de hoy, ánimo "Bien" y "Entrada guardada." | passed | `03-first-entry.png` |
| 04 | Guardar una segunda entrada con otra fecha y ánimo | Dos entradas: 11/10/2026 "Bajo" y 12/10/2026 "Bien"; contador "2 entradas" | passed | `04-two-entries.png` |
| 05 | Recargar la página | Las dos entradas siguen ahí (persistidas en localStorage) | passed | `05-persisted-after-reload.png` |
| 06 | Buscar "parque" | Filtra a 1 entrada; el contador pasa a "1 entrada" | passed | `06-search-match.png` |
| 07 | Buscar "zzz" | Lista vacía con "Nada coincide con esa búsqueda." | passed | `07-search-empty.png` |
| 08 | Editar una entrada | El texto cambia y el estado muestra "Entrada actualizada." | passed | `08-after-edit.png` |
| 09 | Borrar una entrada | Queda 1 entrada y el contador pasa a "1 entrada" | passed | `09-after-delete.png` |
| 10 | Guardar una palabra larguísima sin espacios | El texto parte de línea dentro de la tarjeta: `scrollWidth=1105 clientWidth=1105 overflow=false`, sin scroll horizontal | passed | `10-long-word-wraps.png` |
| 11 | Arrancar con datos dañados (`[null]`) en localStorage | Muestra "No se pudieron leer tus entradas guardadas." y deja el valor almacenado intacto (`[null]`) | passed | `11-damaged-data-error.png` |
| 13 | Abrir `index.html` con doble clic y pulsar Guardar | Reproduce el fallo: `textarea: ""` y `storage: null`. El módulo no carga en `file://`, el formulario se envía de forma nativa, la página se recarga y el texto se pierde | failed (antes del arreglo) | `13-index-file-protocol-pierde-texto.png` |
| 14 | Abrir `diario.html` con doble clic, guardar y recargar | Funciona: tras recargar, `1 entrada(s)`, contador `1 entrada` | passed | `14-diario-standalone-funciona.png` |

Comprobación final por DOM tras la sesión:

```
$ agent-browser get text "[data-count]"
1 entrada
$ agent-browser eval "JSON.parse(localStorage.getItem('diary.entries.v1')).map(e => e.text)"
["Terminé el informe y cené con Marta."]
```

## Checks del repo

```
$ npm test
# tests 20
# pass 20
# fail 0
```

## Caveats

- La grabación de vídeo (`agent-browser record`) no está disponible en este
  contenedor, así que la evidencia es la secuencia de capturas numeradas.
- El paso 08 simula el `prompt()` nativo con `window.prompt` reemplazado por
  JS: los diálogos nativos no son manejables de forma fiable en headless.
- El input `type="date"` no acepta `fill()` de forma fiable con este CLI; en el
  paso 04 la fecha se fija por JS y se dispara el evento `input`.
- Las entradas viven en `localStorage`, así que la persistencia se verificó en
  el mismo navegador/perfil, no entre dispositivos.
- El paso 10 mide el ancho del documento en el viewport de 1120 px; no se
  probaron todos los tamaños de móvil.
- Los pasos 13 y 14 se hicieron con Chrome headless. `file://` se comporta
  igual en los navegadores de escritorio habituales, pero no se probó Firefox ni
  Safari.
