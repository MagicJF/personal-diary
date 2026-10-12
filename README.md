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

Abre `index.html` en el navegador, o sírvelo en local:

```bash
python3 -m http.server 8781   # luego abre http://127.0.0.1:8781/
```

No hay que instalar nada para usarlo: son ficheros estáticos.

## Estructura

```
index.html            marcado de la página
styles.css            estilos
src/storage.js        adaptador de almacenamiento (lee y escribe la lista)
src/diary-service.js  servicio: ids, fechas, orden y persistencia de entradas
src/app.js            acciones: reglas del producto, mensajes y enlace con el DOM
test/                 pruebas del servicio y de las reglas
```

Las reglas de negocio (qué es una entrada válida, qué lee el usuario cuando
falla algo) viven en `src/app.js`. La mecánica reutilizable (generar ids, sellar
fechas, ordenar, guardar) vive en `src/diary-service.js`, que no sabe nada del
DOM.

## Pruebas

```bash
npm test
```

Doce pruebas sobre el servicio, el almacenamiento y las reglas de validación,
con un backend en memoria en vez de `localStorage`.

## Límites

- Las entradas se guardan solo en este navegador: no hay sincronización entre
  dispositivos ni copia de seguridad.
- Borrar los datos del navegador borra el diario.
