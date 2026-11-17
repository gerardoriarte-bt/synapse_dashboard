# Para datos · qué es una campaña en la pauta de Terpel · 2026-11-04

**Medido contra `dc58ef5` el 2026-11-04**, que es el backend: la métrica
`media_by_campaign` no está registrada porque falta saber su grano. Del lado de
ustedes, `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE` en sólo lectura el mismo día,
con agregados nada más. Las consultas están al final.

**Viene de** `docs/ENTREGA-2026-10-29-synapse-metricas-terpel.md`, que define
`media_by_campaign` con «grano campaña + `PERIODO`».

---

## En corto

Las siete métricas de pauta de Terpel ya están programadas en el backend y
esperan despliegue. **Falta una, `media_by_campaign`, y para armarla
necesitamos dos respuestas de ustedes.**

En septiembre de 2026 la vista tiene 90 filas, pero:

| | Distintos |
|---|---|
| `CAMPANA` | 30 |
| `NOMBRE_CAMPANA` | 86 |
| `CAMPANA` + `NOMBRE_CAMPANA` | 87 |
| `NOMBRE_CAMPANA` + `PLATAFORMA_NORM` | 88 |
| Nombre, plataforma, objetivo, modelo, cuenta y fecha de inicio | 89 |

Ninguna de las dos columnas viene vacía.

## Las dos preguntas

1. **¿Qué es la campaña: `CAMPANA` o `NOMBRE_CAMPANA`?** Por los números,
   `CAMPANA` agrupa y cada fila es una línea de pauta, pero preferimos que lo
   digan ustedes.
2. **¿Qué son las filas que se repiten?** Ni con seis columnas se llega a 90,
   así que al menos dos filas son iguales en todo eso. ¿Es una línea partida, o
   un duplicado que hay que sacar? Desde agregados no lo podemos saber.

**Y un dato para la respuesta 1:** si la campaña es `CAMPANA` y hay que agrupar,
presupuesto y gasto se suman, pero `PCT_CUMPLIMIENTO_METRICA_PRINCIPAL` no,
porque cada línea mide una métrica distinta. Si lo ven distinto, avísennos.

## Las consultas

Con `PERIODO = '2026-09-01'` sobre
`DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE`:

```sql
SELECT COUNT(*), COUNT(DISTINCT CAMPANA), COUNT(DISTINCT NOMBRE_CAMPANA),
       COUNT_IF(CAMPANA IS NULL), COUNT_IF(NOMBRE_CAMPANA IS NULL),
       COUNT(DISTINCT CAMPANA, NOMBRE_CAMPANA),
       COUNT(DISTINCT NOMBRE_CAMPANA, PLATAFORMA_NORM)
  FROM ... WHERE PERIODO = '2026-09-01';
-- 90 · 30 · 86 · 0 · 0 · 87 · 88

SELECT COUNT(DISTINCT NOMBRE_CAMPANA, PLATAFORMA_NORM, OBJETIVO_NORM,
                      MODELO_COMPRA_NORM, CUENTA_NORM, FECHA_INICIO)
  FROM ... WHERE PERIODO = '2026-09-01';
-- 89
```

**Las corrimos con `RL_BT_UA_TRANSFORM`**: el rol de Terpel no se mantuvo
entre sentencias. Las 90 filas coinciden con las que medimos el 2026-11-03 con
`RL_BT_TERPEL_COMBS_CLIENT_BI`.
