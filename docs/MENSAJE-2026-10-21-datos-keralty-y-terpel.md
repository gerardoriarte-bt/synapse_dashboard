# Para el equipo de datos · Keralty y Terpel: permisos, tablas y catálogo · 2026-10-21

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `30c5c50` el 2026-10-21**, leyendo el código del backend; y en
QA el mismo día, sólo con lecturas. Del lado del front medimos lo nuestro
primero: lo que se veía mal en pantalla era nuestro y ya se arregló. El detalle
está en `docs/AUDITORIA-2026-10-21-keralty-sin-datos.md`.

---

Hola. En QA, los dashboards de Keralty y de Terpel no muestran ningún dato. Para
Keralty, Snowflake responde:

> Object 'DB_HNO_KERALTY.HNO_KY_MART_ANALYTICS.GLD_ECOMM_DAILY_PERFORMANCE' does
> not exist or not authorized. Your primary role RL_BT_UA_BI …

Terpel da lo mismo en `DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS`, con el
mismo rol. Para conectarlos necesitamos tres cosas de ustedes, para cada uno.

## 1 · Permisos

Hoy Synapse entra con el rol `RL_BT_UA_BI`, que es el de UA. Al backend le
pedimos que use el rol propio de cada cliente. **¿Cuál es el rol de cada uno, y
puede leer su base?** Keralty: `DB_HNO_KERALTY.HNO_KY_MART_ANALYTICS`. Terpel:
`DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS`.

## 2 · Qué tablas hay

El error no distingue si la tabla no existe o si no hay permiso. El backend
busca dos tablas con la forma de UA:

- `GLD_ECOMM_DAILY_PERFORMANCE`, con `DATE`, `REV_TOTAL`, `ORDERS_TOTAL`,
  `UNITS_TOTAL`, `VISITS_TOTAL`, `GROSS_SPEND` y sus `*_TARGET`;
- `GLD_PAID_MEDIA`, con `DATE`, `FUENTE`, `COST_USD` e `INGRESOS_USD`.

**¿Qué tablas Gold tiene cada uno en su esquema?** Nos sirve el inventario como
lo describe `docs/snowflake/COMO-ENTREGAR-UNA-METRICA.md`: cada tabla con su
grano y la cardinalidad de sus dimensiones. Ninguno de los dos es e-commerce, así
que lo más probable es que no tengan esas dos; de eso depende cómo se arma su dashboard.

## 3 · El catálogo

Los dos tienen el catálogo de la semilla, nunca sincronizado. Hace falta la vista
`SYNAPSE_METRIC_CATALOG` en cada base, como se hizo con UA:
`docs/snowflake/INSTRUCCION-ALTA-TENANT.md` y `SYNAPSE_METRIC_CATALOG.sql`. Las
métricas que declare dependen del punto 2.

Gracias.
