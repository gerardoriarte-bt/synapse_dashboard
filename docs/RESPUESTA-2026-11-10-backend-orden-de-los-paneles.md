# Para el equipo de front · orden de los paneles, y la fila · 2026-11-10

Referencia: [`MENSAJE-2026-11-10-backend-orden-y-fila-de-los-paneles.md`](../../MENSAJE-2026-11-10-backend-orden-y-fila-de-los-paneles.md), medido por ustedes contra `4192041`.

El dato de una métrica sin panel es otro mensaje y ya está contestado en [`backend-respuesta-front-dato-por-metrica-2026-11-10.md`](backend-respuesta-front-dato-por-metrica-2026-11-10.md), commit `a80c318`.

**Hecho en `1756d1f`.** `dd_panels.sort_order` guarda la posición del panel en la lista de su pestaña. Las lecturas de la consola y del layout salen `ORDER BY sort_order`.

**No hecho.** `row_start` no se agrega. Los rangos de `/config/blocks` no se tocan.

**Contrato.** Ningún campo nuevo en el JSON. `sort_order` no viaja: el orden de `panels` en la respuesta es el guardado. Guardar sigue mandando los paneles en el orden de la lista, como hoy.

**Commit en QA:** ninguno de este corte. Lo que midieron sigue en `4192041`. `1756d1f` no está en QA. QA arranca con `DB_AUTO_MIGRATE=false`, así que el binario nuevo no crea la columna solo. Hay que correr la migración antes o junto con el deploy. Si no, las lecturas de paneles fallan con `column "sort_order" does not exist`, el mismo tipo de corte que `tenants.is_active`.

```sql
ALTER TABLE dd_panels ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE dd_panels AS p
   SET sort_order = s.n
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY tab_id ORDER BY ctid) AS n
      FROM dd_panels
     WHERE sort_order = 0
  ) AS s
 WHERE p.id = s.id AND p.sort_order = 0;
```

Eso numera las filas que ya existen en el orden en que se ven hoy. Un guardado nuevo escribe la posición de la lista, desde 1.

## Por pedido

### El orden

**Hecho.** `buildTabsAndPanels` pone `sort_order` con la posición del panel en la lista de su pestaña. `FindByTab` y `FindByLayoutVersion` ordenan por esa columna. Reordenar en el editor sigue siendo cambiar el panel de lugar en la lista que mandan al guardar.

Para comprobarlo: en una pestaña ya guardada, reinsertar las filas al revés sin cambiar `sort_order`. El detalle del layout y la consola tienen que seguir en el orden guardado.

### La fila opcional

**No se hace en este corte.** La forma nos cierra: `row_start` nulo deja la colocación automática de hoy, y un número fija la fila de arranque.

El costo, cuando diseño cierre el reflujo, es chico: una columna que sí puede ser nula, el campo en el panel que viaja al guardar y al leer, y una validación de que dos paneles de la misma pestaña no ocupen las mismas celdas. Lo que no está cerrado, y por eso no lo empezamos, es qué pasa cuando un rol no ve un panel: hoy los de abajo suben. Con fila fija, o suben igual y el hueco desaparece, o se quedan en su fila y el hueco se ve. Esa decisión cambia la consola, no solo el editor.

### Los rangos de tamaño

**Sin código.** Siguen saliendo de `/config/blocks`. Si diseño los cambia, se avisa y se actualizan ahí.
