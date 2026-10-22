# Auditoría · el catálogo de Keralty y Terpel llegó, y ninguna métrica se calcula · 2026-10-22

> **Histórico.** Un cruce puntual, con fecha. No se actualiza.

**Qué se miró:** QA el 2026-10-22, con el backend en `26eae4b`, después de que
datos contestara que hizo lo del mensaje del 21
(`docs/MENSAJE-2026-10-21-datos-keralty-y-terpel.md`). Se leyó `schema-check`
y el catálogo de cada cliente desde la página de administración. **Sólo
lecturas.** También se leyó, en el código de `26eae4b`, qué columnas lee el
sync de la vista.

Sigue a `docs/AUDITORIA-2026-10-21-keralty-con-su-rol.md`.

---

## Lo que cambió desde el 21

| | Keralty | Terpel |
|---|---|---|
| `SYNAPSE_METRIC_CATALOG` | **Está** | **Está** |
| `GLD_ECOMM_DAILY_PERFORMANCE` | no está, o el rol no la ve | no está, o el rol no la ve |
| `GLD_PAID_MEDIA` | no está, o el rol no la ve | no está, o el rol no la ve |
| Métricas de la vista **sin cálculo** | **15 de 15** | **10 de 10** |
| Catálogo que sirve la plataforma | La semilla de UA, v1, 12 métricas | La semilla de UA, v1, 12 métricas |
| Usuario · rol | `LUIS_ROJAS` · `RL_HNO_KY_BI` | `LUIS_ROJAS` · `SYSADMIN` |

**Datos entregó la vista del catálogo de cada cliente**, con sus propias
métricas:

- **Keralty**: inversión y alcance ATL, ejecución del presupuesto de medios,
  medios por plataforma, clics, tendencia diaria, cumplimiento de metas,
  impresiones, inversión, leads, resumen del plan, medios contra tráfico, mezcla
  de canales web, sesiones y usuarios web.
- **Terpel**: ATL por medio, inversión ATL, ejecución del presupuesto, medios
  por campaña y por plataforma, clics, cumplimiento de metas, impresiones,
  inversión y alcance.

**El usuario y el rol siguen como estaban**: lo pedido el 21 en
`docs/MENSAJE-2026-10-21-datos-usuario-y-rol-de-servicio.md` todavía no se ve.

## Por qué ninguna se calcula

**La vista no lleva consulta.** El sync lee `METRIC_KEY`, `NAME`, `SHAPE`,
`FAMILY`, `LAYER`, `SOURCE`, `BASE`, `UNIT`, `SEMANTIC_DIRECTION`, `MIN_GRAIN`,
`DIMENSIONS` y `MEASUREMENT_WINDOW`. Eso es gobierno, no cálculo. **El cálculo
vive sólo en `MetricRegistry`** —17 métricas y 8 alias, todas de UA—, así que
`schema-check` marca las 25 claves en `keys_without_query`. Es exactamente el
caso que el backend anticipó el 21: «una métrica del catálogo que no esté en el
registro ni en el mapa de alias sigue `BLOCKED`».

**Ninguna de las 25 coincide con una de UA.** Las de UA se llaman `spend`,
`revenue`, `platform_return`. Las de estos clientes son `media_investment`,
`media_clicks`, `atl_investment`. Aunque se parecen, no hay alias, y las tablas
Gold de UA no existen en esos esquemas.

**Sincronizar el catálogo no destraba nada.** Reemplazaría la semilla por las
métricas reales, que se verían en el builder y en la consola **como bloqueadas**.
Es mejor que lo de hoy —ver métricas de UA en un cliente de salud— y aun así no
muestra un número.

## Lo que esto decide

**B1.26 quedó en A el 2026-10-21, con B sin fecha.** Con dos clientes reales y
cero métricas calculables, **sin una salida que no sea A, Keralty y Terpel no
van a mostrar datos nunca**. Ya no es una decisión de arquitectura en abstracto.
Las salidas posibles, y ninguna es del front:

1. **Datos arma, en cada esquema, vistas con la forma de las Gold de UA**, y
   backend suma alias. Sirve sólo para lo que se parece a UA: la inversión en
   medios, sí; los leads, las sesiones o el ATL, no.
2. **Backend agrega al registro las métricas de medios y web de estos
   clientes**, leyendo las tablas que datos nombre. Es A con más filas, y cada
   cliente nuevo vuelve a pedir código.
3. **B: la consulta por métrica y por cliente**, que el backend dejó sin fecha.

**Es una decisión de producto y del backend**, y el mensaje de hoy les pide
tomarla con estos números: `docs/MENSAJE-2026-10-22-backend-b126-con-dos-clientes.md`.
