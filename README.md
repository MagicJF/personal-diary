# Mi Diario

Un diario personal muy simple: una página, sin backend y sin registro. Escribes
una entrada, se guarda en el `localStorage` de tu navegador y sigue ahí cuando
vuelves.

## Qué hace

- Escribir una entrada con fecha y ánimo (Bien / Normal / Bajo).
- Ver las entradas de la más reciente a la más antigua.
- Buscar texto dentro del diario.
- Editar y borrar entradas.
- Avisar cuando intentas guardar algo vacío.

## Cómo usarlo

Abre `diario.html` con doble clic. Ya está: es un solo fichero con el HTML, el
CSS y el JavaScript dentro, así que funciona desde el disco sin servidor ni
instalación.

Si prefieres trabajar con el código separado, sirve la carpeta por HTTP:

```bash
python3 -m http.server 8781   # luego abre http://127.0.0.1:8781/
```

Esa segunda vía es obligatoria para `index.html`: usa módulos JavaScript y los
navegadores los bloquean en `file://`, así que al abrirlo con doble clic el
formulario se enviaría de forma normal, la página se recargaría y el texto
desaparecería sin guardarse.

## Estructura

```
diario.html           la app entera en un fichero (generado, es lo que abres)
index.html            marcado de la página, sin CSS ni JS incrustados
styles.css            estilos
src/storage.js        adaptador de almacenamiento (lee y escribe la lista)
src/diary-service.js  servicio: ids, fechas, orden y persistencia de entradas
src/app.js            acciones: reglas del producto, mensajes y enlace con el DOM
scripts/              genera diario.html a partir de lo anterior
test/                 pruebas del servicio, de las reglas y del empaquetado
```

Las reglas de negocio (qué es una entrada válida, qué lee el usuario cuando
falla algo) viven en `src/app.js`. La mecánica reutilizable (generar ids, sellar
fechas, ordenar, guardar) vive en `src/diary-service.js`, que no sabe nada del
DOM.

## Pruebas

```bash
npm test
```

Veinte pruebas sobre el servicio, el almacenamiento (datos dañados,
almacenamiento bloqueado, fallo de escritura, dos pestañas), la validación y el
empaquetado, con un backend en memoria en vez de `localStorage`.

## Empaquetado

```bash
npm run build   # regenera diario.html desde index.html, styles.css y src/
```

`diario.html` está versionado, y una prueba falla si dejas de regenerarlo
después de tocar el código: si cambias `src/`, ejecuta `npm run build`.

## Límites

- Las entradas se guardan solo en este navegador: no hay sincronización entre
  dispositivos ni copia de seguridad.
- Borrar los datos del navegador borra el diario.
