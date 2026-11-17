# La respuesta del backend sobre la tabla por campaña de Terpel, medida · 2026-11-09

## ⇩ Remedido el 2026-11-10 · ahora sí está publicado, y cierra

**Medido contra `f7848dc` el 2026-11-10**, la nueva cabeza de
`feature/dynamic-dashboard-backend`. La rama avanzó con `36d35f4`, `951669e`,
`48425d9` y `f7848dc`, los cuatro del 2026-11-09 por la tarde: **el push llegó
después de que midiéramos**, como el 2026-11-04 con `db91b5d`. El mensaje que
preguntaba por el push no hace falta.

| Qué | Medido |
|---|---|
| `media_by_campaign` en `MetricRegistry` | Sí, en `snowflake/queries.go`, forma `tabular`, contra la vista de pauta de Terpel |
| La consulta | **Es la que mandamos, carácter por carácter**: `GROUP BY 1, 2, 3` sobre `CAMPANA`, `FAMILIA_NORM`, `CUENTA_NORM`, y la ejecución con la misma expresión que `media_budget_execution` |
| Las diez columnas | Con sus decimales y unidades: `COP` en gasto y presupuesto, `%` con 2 en ejecución y CTR, 0 en impresiones, clics y líneas. **Desde #73 el front los dibuja** |
| Nulos | `putNumber` deja `nil` donde la celda llega nula, y su prueba lo exige para una campaña sin presupuesto |
| Las mayúsculas de Snowflake | `firstString` y `rawCell` no distinguen mayúsculas: `AS campana` llega como `CAMPANA` y se lee igual |
| La prueba que ayer exigía lo contrario | `snowflake_queries_test.go` ahora exige la clave, su `GROUP BY` y que no lea la vista de datos |
| Build, `vet` y `tests/dashboard` | Limpios en un worktree aparte sobre `f7848dc` |

**Su respuesta ya está en el repositorio**, sin editar, como
`docs/RESPUESTA-2026-11-09-backend-tabla-por-campana-de-terpel.md`. Es idéntica a
la que publicaron en `docs/response/` de su repo.

**Lo que sigue es del backend, y ya está pedido**: desplegar en QA. Ninguno de
estos commits está ahí, y tampoco `f78d700`, pedido desde el 2026-11-04.
Después, lo nuestro: «Cargar meses» de septiembre y octubre en Terpel, y que el
gasto de septiembre de la tabla cierre contra `media_investment`.

---

**Qué llegó.** El backend contestó
`docs/MENSAJE-2026-11-09-backend-tabla-por-campana-de-terpel.md` el mismo día,
en un documento que trajo el humano, hoy en `docs/RESPUESTA-2026-11-09-backend-tabla-por-campana-de-terpel.md`.
Dice que `media_by_campaign` entró a `MetricRegistry`, con el grano y las diez
columnas que pedimos, y que **nada de esto está en QA**.

**Su documento no se commitea todavía**, a propósito: cita dos commits —48425d9
y 36d35f4— que hoy no existen en ningún repositorio que podamos leer, y
`afirmaciones` lo pondría rojo. Cuando estén publicados entra como
`RESPUESTA-*`, sin editar.

**Medido contra `dc58ef5` el 2026-11-09**, que es la cabeza publicada de
`feature/dynamic-dashboard-backend` en `AntPack-dev/synapse-api-go`; `main` está
en `c366289`. Se hizo `fetch --prune` y se listaron las ramas remotas.

## Lo que se pudo verificar y lo que no

| Afirmación | Medido | Estado |
|---|---|---|
| `media_by_campaign` entra a `MetricRegistry` en 48425d9 | El commit **no está en ninguna rama remota**, ni en el fork ni en otro clone. En lo publicado, `tests/dashboard/snowflake_queries_test.go:281` **exige lo contrario**: falla si la clave está registrada | **No verificable todavía** |
| 36d35f4 | Tampoco está publicado | No verificable |
| `f78d700` no está en QA | Está publicado, del 2026-11-04. Que no esté en QA lo dicen ellos | Coincide con lo que esperábamos |
| La forma es `tabular` y no hay ruta nueva | No requiere cambio de contrato | Se acepta |
| `ejecucion` y `ctr` nulos, no cero | Ver «Lo nuestro», abajo | Lo nuestro lo aguanta |

**No es la primera vez que pasa, y no es un error**: el 2026-11-04 el remoto daba
`db91b5d` a la mañana y horas después el commit estaba publicado. Lo que sigue es
volver a medir cuando avisen el push, no pedirlo.

## Tienen razón en los decimales: el pedido se contradecía

Nuestro mensaje pedía **1** decimal para `ejecucion` en la tabla de columnas, y el
`SELECT` del mismo mensaje redondea con `ROUND(…, 2)`. Se quedaron con 2, que es
lo que dice la consulta. **Está bien así y no hay que contestar nada**: una
columna de 2 decimales que dice 99,99 no es un error, y pedir el cambio sería
gastarles otra vuelta por una inconsistencia nuestra.

## Lo nuestro: los decimales y la unidad de cada columna se pierden

Esto apareció al medir cómo dibujaríamos su tabla, y **no es de Terpel: le pasa
hoy a UA**.

**El backend manda `decimals` y `unit` por columna desde `6e521cc`**
(2026-09-25): `internal/core/dashboard/materialize/transform.go` los agrega a cada
columna cuando están definidos. Y las métricas los definen: en
`snowflake/queries.go` la tabla de UA declara Inversión y Ventas con 0 decimales
en `USD`, ROAS con 2 en `x` y **Participación con 1 en `%`**; la de pauta de
Terpel, Gasto, CPC y CPM con 2 en `COP`.

**Nuestro adaptador los tira.** `src/api/adapt.ts`, en la forma `tabular`, arma
cada columna con `clave`, `titulo` y `numerica`, y nada más. Su comentario dice
«`decimales` y `unidad` por columna NO llegan»: **era cierto antes del 25 de
septiembre y nadie lo volvió a leer**. Sin eso, `TableBody` deduce los decimales
de los valores, y una columna con un 0.00 y un 2 235 316 termina en dos
decimales para todas.

**Eso explica tres hallazgos de la evaluación de UX** —ver
`docs/AUDITORIA-2026-11-09-recomendaciones-de-ux.md`—:

- EV-009: «la tabla usa dos decimales incluso en valores como 0.00».
- EV-019: «la columna de participación no indica unidad».
- EV-010, en parte: la tabla «no indica moneda». La diferencia de montos
  contra la tarjeta sigue siendo de datos.

**El contrato interno ya lo tiene**: `contracts/synapse-api.yaml` declara
`decimales` por columna. Lo que falta es el cable —el yaml del cable de la
consola no declara ni `decimals` ni `unit` en las columnas— y el adaptador. Es
trabajo del front, sin pedir nada a nadie.

**Las celdas nulas sí las aguantamos**: `TableBody` pinta `—` alineado a la
derecha cuando una celda numérica no llega. Una campaña sin presupuesto se va a
ver sin ejecución, y no con un 0.

## Lo que sigue

1. **Esperar el push de 48425d9 y volver a medir**: que la prueba de
   `snowflake_queries_test.go` cambie de sentido, las diez columnas con sus
   decimales y unidades, y `keys_without_query` sin la clave.
2. **El despliegue en QA es del backend.** Después, «Cargar meses» de septiembre
   y octubre en Terpel, y la cuenta que ellos mismos proponen: el gasto de
   septiembre de la tabla tiene que cerrar contra `media_investment`.
3. **Lo nuestro, tomable ya**: transcribir `decimals` y `unit` en el cable de
   la consola, adaptarlos y dibujarlos en la tabla, con la prueba del adaptador
   de entrada. Arregla UA hoy y deja lista la tabla de Terpel.
