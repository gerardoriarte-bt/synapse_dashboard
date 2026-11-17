# Para el equipo de backend · la tabla por campaña de Terpel · 2026-11-09

**Medido contra `dc58ef5` el 2026-11-09**, leyendo su rama
`feature/dynamic-dashboard-backend`: `media_by_platform`, `terpelPlatformSQL`
y `terpelPlatformRows`, que son el modelo de esta tabla. Del lado de
Snowflake, la consulta y sus cifras se midieron ese mismo día en sólo
lectura, con agregados.

Hola. Es lo que quedó pendiente de `f78d700`: **`media_by_campaign`**, que no
pudieron armar porque nuestro pedido no traía el `SELECT` ni decía qué era una
campaña. Tenían razón. Ahora está resuelto:

- **Datos definió el grano** el 2026-11-09
  (`docs/RESPUESTA-2026-11-09-datos-campanas-de-terpel.md`): la campaña es
  `CAMPANA`, con su familia y su cuenta. Las filas que parecían repetidas son
  una línea de pauta repartida entre dos campañas, y se suman.
- **Producto aceptó ese grano** el mismo día.

## 1 · La consulta

Lee la misma vista que las otras siete (`Tables.TerpelPauta`):

```sql
SELECT CAMPANA      AS campana,
       FAMILIA_NORM AS familia,
       CUENTA_NORM  AS cuenta,
       ROUND(SUM(GASTO_FINAL), 2) AS gasto,
       ROUND(SUM(PRESUPUESTO), 2) AS presupuesto,
       ROUND(SUM(IFF(GASTO_FINAL IS NOT NULL AND PRESUPUESTO IS NOT NULL AND PRESUPUESTO <> 0, GASTO_FINAL, 0))
           / NULLIF(SUM(IFF(GASTO_FINAL IS NOT NULL AND PRESUPUESTO IS NOT NULL AND PRESUPUESTO <> 0, PRESUPUESTO, 0)), 0)
           * 100, 2) AS ejecucion,
       SUM(RESULTADO_IMPRESIONES) AS impresiones,
       SUM(RESULTADO_CLICS)       AS clics,
       ROUND(SUM(RESULTADO_CLICS) / NULLIF(SUM(RESULTADO_IMPRESIONES), 0) * 100, 2) AS ctr,
       COUNT(DISTINCT NOMBRE_CAMPANA) AS lineas
  FROM DB_BT_TERPEL_COMBS.BT_TERPEL_COMBS_MART_ANALYTICS.VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE
 WHERE PERIODO >= ? AND PERIODO < ?
 GROUP BY 1, 2, 3
 ORDER BY gasto DESC NULLS LAST
```

**No usen `VW_SYNAPSE_MEDIA_BY_CAMPAIGN`**, aunque la respuesta de datos
traiga su `CREATE VIEW`. El 2026-11-09 no aparecía ni con el rol de Terpel ni
con el nuestro, y no hace falta: la consulta de arriba lee la vista que ya
usan.

**La ejecución se calcula igual que `media_budget_execution`**, sólo con las
filas que tienen gasto y presupuesto, y en porcentaje. La vista de datos la
calcula como fracción y con todas las filas. Si la tabla y la cifra de arriba
se calcularan distinto, no coincidirían.

## 2 · Las columnas

Forma `tabular`, igual que `media_by_platform`:

| Clave | Título | Numérica | Decimales | Unidad |
|---|---|---|---|---|
| `campana` | Campaña | no | | |
| `familia` | Familia | no | | |
| `cuenta` | Cuenta | no | | |
| `gasto` | Gasto | sí | 2 | `COP` |
| `presupuesto` | Presupuesto | sí | 2 | `COP` |
| `ejecucion` | Ejecución | sí | 1 | `%` |
| `impresiones` | Impresiones | sí | 0 | |
| `clics` | Clics | sí | 0 | |
| `ctr` | CTR | sí | 2 | `%` |
| `lineas` | Líneas | sí | 0 | |

**Los nulos viajan como nulos**, igual que el CPC y el CPM en
`terpelPlatformRows`. Una campaña sin presupuesto no tiene ejecución, y una
sin impresiones no tiene CTR. Un cero diría otra cosa.

**El cumplimiento de la métrica principal no va.** Cada línea persigue un
objetivo distinto, y datos confirma que no se puede promediar.

## 3 · Lo que tiene que dar

| Mes | Filas | Gasto | Presupuesto | Impresiones | Clics | Sin ejecución | Sin CTR |
|---|---|---|---|---|---|---|---|
| 2026-09 | 31 | 603 703 707,58 | 630 789 226 | 212 390 902 | 3 063 656 | 2 | 7 |
| 2026-10 | 69 | 1 394 353 243,73 | 1 030 286 086 | 281 496 655 | 11 652 680 | 20 | 33 |

Las tres primeras filas de septiembre:

| Campaña | Familia | Cuenta | Gasto | Ejecución | CTR | Líneas |
|---|---|---|---|---|---|---|
| Combustibles - Búcaros Fase 3 -  3 Combs - Sep | Combustibles | Combustibles | 117 226 001 | 99,99 | 0,18 | 4 |
| ICONTEC 2026 | Combustibles | B2B | 74 947 036,11 | 99,97 | 13,37 | 7 |
| Lubricantes - Mobil Promo Rally - Sep | Lubricantes | Terpel | 73 974 303,82 | 99,98 | 2,66 | 7 |

**El gasto de septiembre suma lo mismo que `media_investment`**: 603 703 707,59,
con un centavo de diferencia por el redondeo de cada fila.

**Octubre se movió.** El 2026-11-03 `media_investment` daba 1 228 325 244,91
para octubre, y hoy la vista suma 1 394 353 243,73, porque datos siguió
cargando. Si al comprobarlo difiere, conviene correr la consulta de nuevo antes
de buscar un error.

## 4 · Dos cosas que se van a ver en la tabla, y no son del código

- **Una campaña puede salir en dos filas.** En septiembre «Lubricantes - Mobil
  Desempeño - Sep» tiene 15 000 000 en Lubricantes/Terpel y 19 560 353 en
  «Sin familia»/«SIN_CUENTA»: son líneas que datos no clasificó. Es lo que
  pide el grano, y lo resuelve datos clasificándolas, no la consulta.
- **En octubre, 20 de las 69 filas no tienen ejecución**: ninguna de sus
  líneas tiene gasto y presupuesto a la vez. No medimos si falta el
  presupuesto o el gasto. Se ven sin cifra, y así tiene que ser.

Gracias.
