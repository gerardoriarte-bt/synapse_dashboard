# Para el equipo de backend · el dato de una métrica, sin panel · 2026-11-10

**Medido contra `4192041` el 2026-11-10**, leyendo su rama
`feature/dynamic-dashboard-backend`: `DDPanelData` en
`internal/core/domain/dd_panel_data.go`, las rutas de `router.go` y
`CatalogHealth` en `dd_feed_service.go`. Del lado nuestro, el editor de `main`
y el adaptador del catálogo en `src/api/adapt.ts`.

Hola. Cambiamos el editor de dashboards: **ahora empieza por el dato, no por el
gráfico**. Quien compone elige primero qué métrica quiere mostrar y después
cómo, y los gráficos que no sirven para ese dato se ven desactivados con su
razón. Para que funcione completo nos falta una sola cosa de su lado.

## Lo que falta

**El dato de una métrica que todavía no está en ningún panel.**

El dato ya está guardado por métrica: `DDPanelData` tiene una clave única por
`tenant_id`, `metric_id` y `period`. Pero se sirve sólo a través de un panel
—la vista previa de un layout con `include=payloads`, y el lote de paneles de
la consola—, así que para una métrica que no está en el lienzo no lo tenemos.

Con él podríamos:

1. **Marcar en la lista qué métricas no tienen datos** en el período, con su
   razón. Hoy no se puede: el catálogo no trae el estado del dato, y
   `CatalogHealth` dice la frescura de las fuentes, que no es lo mismo.
2. **Desactivar un gráfico por su tope antes de ponerlo** —una dona con ocho
   partes, por ejemplo—. Hoy se revisa recién en el lienzo.
3. **Dibujar el gráfico con el dato real** en la biblioteca, que es lo que más
   ayuda a elegir.

## Lo que pedimos

Una lectura del dato materializado **por métrica**, para un cliente y un
período. Es lo mismo que ya devuelven por panel, sin el panel: el `status`, el
`value`, la gobernanza y, si no está disponible, `reason` y `unlocks_with`.

**La forma y la ruta las deciden ustedes.** Dos ideas, por si sirven:

- Una ruta de admin que devuelva todas las métricas del catálogo del cliente
  con su payload del período, en una sola llamada. Es lo que más nos sirve: la
  lista se arma de una vez.
- O un parámetro en la lectura del catálogo de admin que agregue el payload
  del período a cada métrica.

Sólo para admin y superadmin, como el resto del editor. Si tiene costo leer
`value` de todas las métricas, el `status` solo ya resuelve el punto 1.

## Cómo lo comprobamos

Con una métrica de UA que no esté en ningún panel: la lectura devuelve su
estado y, si está disponible, el mismo `value` que trae cuando sí está en uno.

Gracias.
