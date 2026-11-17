# Auditoría · la respuesta del backend sobre Terpel · 2026-11-04

**Qué se mide:** `docs/RESPUESTA-2026-11-03-backend-metricas-de-terpel.md`,
la respuesta a `docs/MENSAJE-2026-11-03-backend-metricas-de-terpel.md` (F6.1).
Llegó el 2026-11-04 como `backend-respuesta-front-metricas-terpel-2026-11-03.md`
y se renombró al patrón `RESPUESTA-*` sin tocar el contenido.

## En una frase

**Las siete métricas que pidió la tanda A y la B están en su código, con las
consultas que mandamos, y compilan con sus pruebas.** Falta desplegarlo.
`media_by_campaign` no la podían armar, y el error fue nuestro: la vista no
trae una fila por campaña.

## 1 · Lo que dicen que hicieron

En `f78d700`, sobre `feature/dynamic-dashboard-backend`:

| Clave | Forma | Estado |
|---|---|---|
| `media_investment`, `media_budget_execution`, `media_clicks`, `media_impressions`, `media_reach` | `scalar` | Registradas, cada una con su `SELECT` |
| `media_goal_attainment` | `categorical` | Registrada, las seis ramas |
| `media_by_platform` | `tabular` | Registrada, con CPC y CPM nulos sin convertir a cero |
| `atl_investment`, `atl_by_medium` | `scalar`, `composition` | `Blocked`, con la razón que pedimos, palabra por palabra |
| `media_by_campaign` | `tabular` | **No registrada**: falta la consulta |

Además: el nombre de la vista sale de `DD_SNOWFLAKE_TERPEL_PAUTA_TABLE`, que es
el punto 1 del pedido, y `schema-check` exige la vista de pauta sólo a un
cliente que tenga esas claves en su catálogo.

## 2 · Leído contra su código

**Primero pareció que el commit no estaba publicado, y era la medición.** A la
mañana `git ls-remote` daba `db91b5d`; leído de nuevo el mismo día, el remoto
estaba en `dc58ef5`, que anota el hash, sobre `f78d700`. Lo publicaron después
de mandar la respuesta. **Medido contra `dc58ef5` el 2026-11-04**, en un
worktree aparte:

| Qué | Resultado |
|---|---|
| `go build ./...`, `go vet` del tablero y `go test ./tests/dashboard/...` | Limpios |
| Las consultas de `media_*` en `queries.go` | **Iguales a las del mensaje**, con la vista en lugar de la base fija |
| Las claves contra `docs/ENTREGA-2026-10-29-synapse-metricas-terpel.md` | Las nueve coinciden; `atl_trps` no está, igual que en el catálogo |
| Alias en `keys.go` | Ninguno para `media_*` ni `atl_*`: no chocan con las claves de UA |
| `MetricColumnUsage` | Una entrada por clave, con sus columnas |
| `schema-check` | La vista es `Optional`: `dd_schema_check_service.go` la salta si ninguna métrica del catálogo la usa |
| La razón de ATL | Es el texto que ve el usuario: `BlockedReason` se guarda tal cual, igual que «Esta métrica todavía no tiene fuente de datos» |

**Una diferencia con UA que no pedimos y conviene saber antes de F6.3.** Los
escalares de UA salen de `KPISQL` y traen el medidor contra la meta y los
comparativos («VS MES ANTERIOR»). Los de Terpel no pasan por ahí, así que en la
consola van a salir **como una cifra con su rótulo, sin comparativos**. No es un
defecto: el pedido no los incluía.

**En QA sigue `db91b5d`**, según su propia respuesta.

## 3 · `media_by_campaign`: tienen razón, y el pedido estaba mal

**Nuestro mensaje no traía el `SELECT`**, a diferencia de las otras siete. Sólo
traía las columnas y la regla de `MODELO_COMPRA_NORM = 'OTRO'`. Y decía otra
cosa que resultó falsa: «Una fila por campaña del mes… En septiembre son 90
filas de campaña».

Medido el 2026-11-04 sobre `VW_DATATERPEL_PAUTA_ENTREGA_SYNAPSE` con
`PERIODO = '2026-09-01'`, con agregados nada más:

| Lo que se contó | Distintos en 90 filas |
|---|---|
| `CAMPANA` | **30** |
| `NOMBRE_CAMPANA` | **86** |
| `CAMPANA` + `NOMBRE_CAMPANA` | 87 |
| `NOMBRE_CAMPANA` + `PLATAFORMA_NORM` | 88 |
| `CAMPANA` + `PLATAFORMA_NORM` | 77 |
| `CAMPANA` + `FAMILIA_NORM` | 31 |
| Nombre, plataforma, objetivo, modelo, cuenta y fecha de inicio | **89** |

Ninguna columna vacía en `CAMPANA` ni en `NOMBRE_CAMPANA`. La vista tiene 55
columnas, leídas de `INFORMATION_SCHEMA.COLUMNS`.

**Lo que dicen los números:**

- **La fila no es la campaña: es una línea de pauta.** `CAMPANA` agrupa 90
  líneas en 30, y `NOMBRE_CAMPANA` las nombra casi una por una.
- **No hay clave natural.** Ni con seis columnas se llega a 90: al menos dos
  filas son iguales en todo eso. Puede ser una línea partida o un duplicado, y
  desde agregados no se distingue.
- **La tabla que pedimos no se puede armar sin decidir el grano**, que es justo
  lo que el backend preguntó.

**Y el grano cambia la cifra que se puede mostrar.** Por línea de pauta, el
porcentaje de cumplimiento de la métrica principal viaja tal como viene. Si se
agrupa por `CAMPANA`, presupuesto y gasto se suman y la ejecución sale sobre
las sumas; pero **el cumplimiento de la métrica principal no se puede sumar ni
promediar**, porque cada línea mide una métrica distinta.

**Una nota sobre la medición.** La primera consulta pidió el rol de Terpel y
corrió con `RL_BT_UA_TRANSFORM`, porque el rol no se conserva entre sentencias
(la trampa 3 de `docs/BITACORA-2026-11-03.md`). Los conteos son de agregados
sobre la misma vista, y las 90 filas coinciden con las que se midieron el 3 con
el rol de Terpel.

## 4 · Algo que no pedimos y queda abierto

**`schema-check` de Terpel sigue marcando como ausentes las dos tablas Gold de
UA**, porque se exigen a todos los clientes. La respuesta lo dice y no lo
cambia. Del lado nuestro eso es «Verificar ahora» en la ficha de Terpel
(`src/surfaces/admin/AgentConfig.tsx`), que va a decir que faltan tablas que
Terpel no tiene por qué tener. No bloquea las cifras.

## 5 · Lo que sale de acá

| Qué | De quién |
|---|---|
| Desplegar `dc58ef5` en QA | Backend |
| Después, «Cargar meses» de julio a octubre en Terpel, y F6.3 | Front (el humano carga, nosotros medimos) |
| Qué es una campaña en esa vista: `CAMPANA` o `NOMBRE_CAMPANA`, y las dos filas iguales | Datos |
| Qué muestra la tabla por campaña: líneas de pauta o campañas agrupadas | Producto |
| Con eso, el `SELECT` de `media_by_campaign`, escrito por nosotros con su cifra | Front |
| `schema-check` sin exigir las Gold de UA a Terpel | Backend · sin pedir todavía |
