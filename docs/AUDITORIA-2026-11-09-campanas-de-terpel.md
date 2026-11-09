# Auditoría · la respuesta de datos sobre las campañas de Terpel · 2026-11-09

**Qué se mide:** `docs/RESPUESTA-2026-11-09-datos-campanas-de-terpel.md` y su
`CREATE VIEW` (`docs/RESPUESTA-2026-11-09-datos-campanas-de-terpel.sql`). Son
la respuesta a `docs/MENSAJE-2026-11-04-datos-campanas-de-terpel.md`. Llegaron
el 2026-11-09 como `RESPUESTA_DESARROLLO_METRICAS_PAUTA.md` y
`VW_SYNAPSE_MEDIA_BY_CAMPAIGN.sql`, y se renombraron sin tocar el contenido.

**Medido en Snowflake el 2026-11-09**, en sólo lectura y con agregados. Se usó
`RL_BT_UA_TRANSFORM`, y para buscar la vista nueva también
`RL_BT_TERPEL_COMBS_CLIENT_BI`. El rol se verificó en cada corrida.

## En una frase

**Contestan las dos preguntas, y lo verificable se verifica.** La campaña es
`CAMPANA`, y las filas que se repetían son una línea de pauta repartida entre
dos campañas. Producto aceptó su grano el mismo día, y el pedido al backend es
`docs/MENSAJE-2026-11-09-backend-tabla-por-campana-de-terpel.md`.

## Lo que dicen y lo que medimos

| Lo que dicen | Lo que medimos | Estado |
|---|---|---|
| La campaña es `CAMPANA`: 30 en septiembre | 30, igual que el 2026-11-04 | **Cerrado** |
| La fila que se repetía es la línea de Sbarro en Rappi, repartida entre «Rappi FS Septiembre» (11 898 148,15) y «Rappi Turbo Septiembre» (3 703 703,70) | Esas dos filas, con esas cifras | **Cerrado** |
| El grano es periodo, campaña, familia y cuenta | Da 31 filas en septiembre. «Lubricantes - Mobil Desempeño - Sep» sale dos veces: 15 000 000 en Lubricantes/Terpel y 19 560 353 en «Sin familia»/«SIN_CUENTA» | **Aceptado por producto**. La segunda fila son líneas sin clasificar |
| El cumplimiento de la métrica principal no se promedia | De acuerdo | **Cerrado**: la tabla no lo lleva |
| `VW_SYNAPSE_MEDIA_BY_CAMPAIGN` | **No aparece** con ninguno de los dos roles. No sabemos si no existe o no tiene permisos | **No hace falta**: el backend lee la vista base |
| La ejecución es `DIV0NULL(SUM(GASTO_FINAL), SUM(PRESUPUESTO))` | Es una fracción y suma todas las filas. `media_budget_execution`, ya registrada, es un porcentaje y sólo cuenta filas con gasto y presupuesto | **El pedido usa la regla registrada**, para que las dos cifras coincidan |

## Lo que apareció y no frena

- **«Combustibles - Boost Cordillera» tiene dos filas con el mismo nombre de
  línea y la misma plataforma**, y el nombre termina en «202692026», que parece
  el período escrito dos veces. Sumando por campaña no cambia nada; puede ser
  un duplicado. Para datos, sin pedir todavía.
- **Octubre sigue cargándose.** El gasto pasó de 1 228 325 244,91 el
  2026-11-03 a 1 394 353 243,73.
- **En octubre, 20 de 69 campañas no tienen ninguna línea con gasto y
  presupuesto a la vez.** No medimos cuál de los dos falta.
