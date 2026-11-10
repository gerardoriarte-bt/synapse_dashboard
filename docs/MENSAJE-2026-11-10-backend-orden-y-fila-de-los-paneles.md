# Para el equipo de backend · el orden de los paneles, y una fila opcional · 2026-11-10

**Medido contra `4192041` el 2026-11-10**, leyendo su rama
`feature/dynamic-dashboard-backend`: `DDPanel` en
`internal/core/domain/dd_panel.go`, `ReplaceContent` en
`dd_layout_version_repository.go`, `FindByTab` y `FindByLayoutVersion` en
`dd_panel_repository.go`, y `buildTabsAndPanels` en
`dd_layout_builder_service.go`. Del lado nuestro, el lienzo del editor y la
grilla de la consola (`src/render/grid.ts`), que colocan los paneles **en el
orden en que llegan**.

Hola. Estamos refinando cómo se mueven y se estiran los paneles en el editor, y
al medirlo encontramos una cosa que hoy anda y no está garantizada, y otra que
nos gustaría preguntarles.

## 1 · El orden de los paneles no está garantizado · el pedido

**El orden en que llegan los paneles de una pestaña ES su posición en la
pantalla.** El panel no guarda su fila: la consola y el editor los colocan uno
detrás del otro con la colocación automática de la grilla, así que el tercero
de la lista va después del segundo. Mover un panel hacia abajo en el editor es,
literalmente, cambiarlo de lugar en la lista que les mandamos al guardar.

**De su lado:**

- `ReplaceContent` borra los paneles y los vuelve a crear en el orden de la
  lista (`tx.Create(&panels)`). Bien.
- `FindByTab` y `FindByLayoutVersion` los leen **sin `ORDER BY`**.
- `DDPanel` no tiene una columna de orden. `DDTab` sí la tiene (`sort_order`).

**Hoy anda porque Postgres suele devolver las filas en el orden en que se
insertaron.** No lo vimos fallar. Pero nada lo garantiza: borrar y volver a
crear en cada guardado deja espacio libre en la tabla, y cuando ese espacio se
reutiliza, el orden físico deja de ser el de inserción. Si eso pasa, **los
paneles de un dashboard publicado aparecen en otro orden**, sin que nadie lo
haya editado.

**Lo que pedimos:** una columna `sort_order` en `dd_panels`, que
`buildTabsAndPanels` llene con la posición del panel en la lista de su pestaña,
y `ORDER BY sort_order` en las lecturas de paneles. No hace falta que viaje en el
cable: con que el orden de la respuesta sea el guardado, alcanza. **Del front
no cambia nada.**

## 2 · Una fila opcional · una pregunta, todavía no un pedido

Como el panel no guarda su fila, en el editor **no se puede dejar un espacio
vacío a propósito**, ni poner un panel en una fila de más abajo si arriba hay
lugar: la colocación lo sube. Es lo que más limita componer.

La forma que pensamos es un `row_start` **opcional** por panel:

- Nulo, como hoy: el panel va donde lo pone la colocación automática.
- Con valor: el panel arranca en esa fila.

**No lo empiecen todavía.** Antes tenemos que decidir con diseño cómo convive con
el reflujo por rol: hoy, cuando un rol no ve un panel, los de abajo suben a
ocupar su lugar, y con filas fijas eso cambia. Lo que nos sirve ahora es saber:

- ¿La forma les cierra, o prefieren otra?
- ¿Cuánto les cuesta? Es una columna, el paso por el cable y validar que dos
  paneles con fila no se solapen.

## 3 · Lo que no les pedimos

**Los rangos de tamaño de cada tipo** que devuelve `/config/blocks` —un
indicador va de 3 a 4 columnas, una serie de 5 a 7— parecen angostos usados en
el editor. Pero salen del contrato de panel de diseño, no de una decisión suya:
si cambian, cambian ahí primero, y se los avisamos.

## Cómo lo comprobamos

- **El orden:** en una pestaña guardada, cambiar en la base el orden físico de
  las filas —por ejemplo, reinsertándolas al revés— sin tocar `sort_order`. El
  detalle del layout y la consola tienen que seguir devolviéndolas en el orden
  guardado.
- **La fila**, si avanza: un panel con `row_start` 9 en una pestaña cuyo
  último panel termina en la fila 4 llega a la fila 9, y deja libres de la 5 a
  la 8.

Gracias.
