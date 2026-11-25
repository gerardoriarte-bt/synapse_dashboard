# Para datos · UA MX v4.1: casi todo resuelto, y cuatro cosas · 2026-11-25

**Medido contra `db48310` el 2026-11-25**: cómo calcula el backend `spend` y
`roas_paid`, en `internal/core/dashboard/snowflake/queries.go`. En Snowflake,
en solo lectura con `RL_BT_UA_TRANSFORM`:

- 20 filas de `SYNAPSE_METRIC_CATALOG` y la distribución de
  `SEMANTIC_DIRECTION`;
- las columnas de las dos vistas de rentabilidad;
- septiembre a noviembre en `GLD_ECOMM_PROFITABILITY_UNIT_ECONOMICS` y en
  `GLD_ECOMM_DAILY_PERFORMANCE`.

En QA, el catálogo de UA MX y sus cifras de octubre. El detalle está en
`docs/AUDITORIA-2026-11-25-catalogo-ua-mx-v4.1.md`.

Hola. Gracias por la v4.1: **la venta ya cuadra** (648 106 en octubre en las
dos fuentes), los supuestos se leen en la BASE y las cinco filas ya están en
QA con cifra. Vamos a cargar sus umbrales en los paneles.

Quedan cuatro cosas.

## 1 · El gasto no cuadra

La fila `spend` dice «suma consolidada de pauta Brand + Performance». El panel
«Inversión» lee `GROSS_SPEND` de `GLD_ECOMM_DAILY_PERFORMANCE`:

| Mes | `GROSS_SPEND` (lo que muestra el panel) | `TOTAL_AD_SPEND` (vista de rentabilidad) |
|---|---|---|
| 2026-09 | 118 807 | 254 788 |
| 2026-10 | 55 936 | 224 312 |

En la misma pantalla, «Inversión» diría 56 K y el MER saldría de 224 K.
**¿`spend` es `TOTAL_AD_SPEND`?** Si es así, se lo pedimos al backend. Y
**¿qué es `GROSS_SPEND`?** Tampoco coincide con `SPEND_PERFORMANCE` (66 843).

Pasa lo mismo con `roas_paid`: el panel da **6,85** en octubre y la vista,
`ROAS_PAID`, da **5,73**.

## 2 · `BOUNCE_RATE_PAID_PCT` en cero

Da 0,00 en septiembre y octubre, y 0,05 en noviembre. No parece un rebote
real. ¿Falta la fuente de los rebotes de pauta?

## 3 · `SEMANTIC_DIRECTION`, todavía mezclado

Las filas nuevas ya vienen en español. Las viejas no:

| Valor | Filas |
|---|---|
| `MÁS ALTO = MEJOR` | 26 |
| `MÁS BAJO = MEJOR` | 4 |
| `NEUTRAL / INFORMATIVO` | 4 |
| `HIGHER = BETTER` | 7 |
| `HIGHER_IS_BETTER` | 1 |
| `LOWER = BETTER` | 1 |
| `NEUTRAL` | 2 |
| `—` | 2 |
| vacío | 7 |

Les pedimos pasar las 20 de abajo a los tres textos en español.

## 4 · Los umbrales

- **`cm3_margin_pct` tiene umbral pero no tiene fila.** La columna
  `CM3_MARGIN_PCT` existe; falta la fila en el catálogo.
- **El borde.** Ustedes escriben «Saludable > 3,0×»; nosotros pintamos «bien»
  desde 3,0 incluido. Una cifra justo en el corte se ve sana. ¿Les sirve así?

Y una nota: el documento sigue nombrando `SYSADMIN` entre los roles de
consumo. Synapse consume con su usuario de servicio.

Gracias.
