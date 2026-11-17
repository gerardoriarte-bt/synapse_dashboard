# Para el equipo de front · tabla por campaña de Terpel · 2026-11-09

Referencia: [`MENSAJE-2026-11-09-backend-tabla-por-campana-de-terpel.md`](../MENSAJE-2026-11-09-backend-tabla-por-campana-de-terpel.md), medido por ustedes contra `dc58ef5`. Cierra lo que `f78d700` dejó afuera.

**Hecho en `48425d9`.** `media_by_campaign` entra a `MetricRegistry`. Lee `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE`, la misma vista que las otras de pauta. No usa `VW_SYNAPSE_MEDIA_BY_CAMPAIGN`.

**No hecho.** No hay otra clave en este mensaje. El cumplimiento de la métrica principal no se calcula: cada línea persigue un objetivo distinto y no se promedia. Una campaña en dos familias sigue siendo dos filas; eso lo clasifica datos.

**Contrato.** Ninguna ruta nueva. `media_by_campaign` deja de salir en `keys_without_query`. La forma es `tabular`.

**Commit en QA:** ninguno de este corte. Lo que midieron sigue en `dc58ef5`. `48425d9`, `f78d700` y `36d35f4` no están en QA.

---

## Por pedido

### La consulta

**Hecho.** El grano es `CAMPANA`, `FAMILIA_NORM` y `CUENTA_NORM`. Las líneas de una misma campaña se suman. `lineas` es `COUNT(DISTINCT NOMBRE_CAMPANA)`. La base no queda escrita: sale del agente de Terpel.

La ejecución usa la misma fórmula que `media_budget_execution`: solo filas con gasto y presupuesto, en porcentaje. No es la fracción de la vista de datos.

### Las columnas

**Hecho**, con una diferencia. El pedido pone un decimal en Ejecución. El SQL y las filas de septiembre (`99,99`, `99,97`, `99,98`) redondean a dos. La columna queda con **2 decimales**, igual que el `ROUND` de la consulta. Si la consola debe mostrar un solo decimal, lo decimos y se cambia el rótulo, no la cuenta.

| Clave | Título | Unidad |
|---|---|---|
| `campana` | Campaña | |
| `familia` | Familia | |
| `cuenta` | Cuenta | |
| `gasto` | Gasto | `COP` |
| `presupuesto` | Presupuesto | `COP` |
| `ejecucion` | Ejecución | `%` |
| `impresiones` | Impresiones | |
| `clics` | Clics | |
| `ctr` | CTR | `%` |
| `lineas` | Líneas | |

Una campaña sin presupuesto deja `ejecucion` nula. Una sin impresiones deja `ctr` nulo. No se convierten en cero.

## QA

Después de desplegar este corte, «Cargar meses» de septiembre y octubre de 2026 en Terpel debe dejar `media_by_campaign` en `AVAILABLE`. Septiembre tiene que sumar el mismo gasto que `media_investment`, con un centavo de diferencia por el redondeo de cada fila. Octubre ya no es la cifra del 3 de noviembre: la vista siguió cargando. Si no cierra, se vuelve a correr la consulta antes de tratarlo como error.
