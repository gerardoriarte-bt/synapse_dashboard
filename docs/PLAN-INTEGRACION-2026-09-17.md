# Plan de integración · el chat contextual y la materialización · 2026-09-17

**Fuentes de este análisis.** El commit `82da946` de la rama
`feature/dynamic-dashboard-backend` de `AntPack-dev/synapse-api-go`, leído
directamente: su `router.go`, su `openapi.yaml`, sus structs y su guía
`docs/guia-front-materializacion-y-chat.md`. Nada de acá se escribió de memoria;
donde hay un número, salió de correr algo, y se dice de dónde.

**Nosotros no desarrollamos backend ni tocamos su repositorio.** Lo que hay en
el fork vuelve desde acá y ellos lo toman cuando quieran.

> ⚠️ **Los pedidos vigentes están en [`PARA-BACKEND.md`](PARA-BACKEND.md)**, que
> se genera. Este documento es el plan de **un tramo con fecha** y no se
> actualiza: si los dos difieren, manda el generado.

---

## 0 · Qué cambió

`733c13c → 82da946` · 2026-09-17 14:36 · 70 archivos · +9.509 / −317.
`npm run backend-drift` lo marca ✗.

**Diez rutas nuevas**, leídas de su `router.go` y su `openapi.yaml`:

| Ruta | Qué |
|---|---|
| `POST /config/chat` | ahora acepta `panel_context: {panel_id, period}` |
| `GET /config/panels/{panelId}/chat-suggestions` | 1–4 chips `{question, intent}` · determinista, sin Cortex |
| `GET /config/chat/threads` | con `thread_name`, `tab_name`, `metric_name`, `metric_key`, `period` |
| `GET /config/chat/threads/{id}/messages` | historial paginado por cursor, solo Postgres |
| `/admin/tenants/{tenantId}/agents` y `.../{agentId}` | CRUD de agente por tenant · `DELETE` es soft delete |
| `/admin/materialize/status`, `/run`, `/runs` y `/admin/tenants/{tenantId}/materialize` | el scheduler de materialización |

**Y un cambio de modelo que no es una ruta:** los paneles ya no consultan
Snowflake al renderizar. Leen `dd_panel_data`, que un scheduler interno refresca
una vez al día. `DD_MATERIALIZE_ENABLED` viene en **`false`**: apagado, nadie
refresca nada. `governance.freshness` pasa a ser la fecha de materialización, y
a los `DD_FRESHNESS_TOLERANCE_DAYS` (3) el panel se reporta `DEGRADED` solo.

---

## 1 · Lo que se decidió el 2026-09-17

Tres decisiones humanas, tomadas sobre el informe de este commit:

1. **La forma del contexto de panel es la del backend.** El front manda
   `panel_id` + `period` y nada más. Esto **reescribe el criterio de
   aceptación de F3.2**, que pedía doce campos.
2. **F4.4 se construye** con el CRUD que hay, declarando el estado de acceso
   como pendiente.
3. **El fork se rebasa** — con la recomendación de abajo, que salió de
   probarlo.

---

## 2 · El rebase del fork · medido, no estimado

Se probó en una rama desechable (`rebase-prueba` en
`~/Documents/GitHub/synapse-api-go-fork`, local, sin empujar) para poder
responder con números en vez de con una impresión.

**Conflictos: dos, y los dos son adyacencia pura.**

| Archivo | Hunks | Qué |
|---|---|---|
| `internal/adapters/handler/router.go` | 1 | los dos lados agregan parámetros al final de `SetupRouter` |
| `internal/bootstrap/app.go` | 1 | los dos lados construyen handlers antes de la misma llamada |

La resolución es «se quedan los dos lados, los nuestros al final» — la misma
regla que ya se aplicó a los structs para no realinear código de ellos. El
segundo commit del fork aplicó **limpio**.

**Y un rompimiento real que el conflicto no muestra.** Su commit agregó
`FindByID` a `ports.DDPanelRepository` — lo necesita el chat para cargar el
panel — y nuestro mock `mockPanelesConMetricas` de
`tests/services/dd_preview_service_test.go` no lo implementaba. `go build`
pasaba; lo encontró `go vet`. Son **tres líneas** y es el mismo fenómeno que ya
conocíamos, por el otro lado: un cambio de firma suyo se propaga a nuestros
mocks.

También agregaron, sin rompernos nada: `UpdateFailure` en
`DDPanelDataRepository`, y `FindAllByTenantIDWithInactive` y `SetActive` en
`AgentRepository`.

**Estado de la rama de prueba, corrido:** `go build` ✓ · `go vet` ✓ ·
`go test ./...` ✓ (cuatro paquetes) · `gofmt -l` sin salida sobre lo que
tocamos.

**Churn en su código: 18 líneas borradas** contra `82da946`, una menos que
antes del rebase. En sus dos archivos: `router.go` +13/−0, `app.go` +8/−2.
Las dos borradas de `app.go` son la línea de la llamada a `SetupRouter`, que
cambió de firma.

### Qué se recomienda

**Rebasar, y hacerlo ya.** No por urgencia sino porque el costo es el mínimo
que va a tener: dos hunks de adyacencia y tres líneas de mock. Cada commit que
ellos sumen encima lo encarece, y el PR #1 hoy muestra un diff contra una base
que ya no es la cabeza — o sea que muestra de menos.

El orden, y sale de la regla de que no formateamos archivos suyos:

1. `git fetch upstream` en el fork.
2. Rebasar `feature/roles-y-preview` sobre `upstream/feature/dynamic-dashboard-backend`.
3. Resolver los dos hunks quedándose con los dos lados, **lo nuestro al final**.
4. Agregar `FindByID` al mock, dentro del commit de B4.8 y B4.9 — no como un
   commit de arreglo aparte, que dejaría la rama con un commit que no compila.
5. `go build && go vet && go test ./...` antes de empujar. **`go vet` no es
   opcional acá**: es el que encontró el mock.
6. Empujar con `--force-with-lease` a `gerardoriarte-bt/synapse-api-go`. El PR
   #1 se actualiza solo.

**Lo que NO se hace:** correr `gofmt` sobre archivos suyos. Su repositorio no
está `gofmt`-limpio y el formateador mete ruido ajeno al cambio. Ya pasó dos
veces.

**Y el rebase no mueve ninguna tarea `B*`.** Las siete siguen en ⚠️: la regla
es que pasan a ✅ verificadas contra el servicio corriendo, y el fork no está
desplegado.

---

## 3 · El plan, en orden

El orden no es arbitrario: el paso 1 es un defecto que hace que nada del chat
funcione, así que construir encima sin arreglarlo sería construir sobre algo
que no se puede ver andar.

### Paso 1 · El discriminador del SSE cambió de lugar · **primero**

**Es un defecto, no una tarea nueva.** Nuestro contrato declara seis eventos
con el discriminador `tipo` **dentro** del JSON: `texto`, `dato`, `auditoria`,
`sugerencias`, `fin`, `error`. El servicio manda siete con el nombre en la
**línea `event:`** de la trama: `thread_info`, `thinking`, `delta`, `sql`,
`data`, `error`, `done`.

Y `src/api/chat.ts` descarta las líneas `event:` **a propósito** — está
documentado ahí: «devuelve `null` para lo que no es un evento — comentarios de
keep-alive, campos `event:` o `id:`». La consecuencia es concreta:
`src/api/useChat.ts` hace `switch (evento.tipo)` sobre `undefined`, no entra en
ningún caso, y **el chat no pinta una sola palabra**.

Es exactamente el mismo modo de falla que el `panels:batch`: un mock que habla
el idioma de nuestra capa interna no prueba la frontera, la esconde. Nuestros
mocks de MSW mandan `tipo` adentro porque así lo declara nuestro contrato.

Qué hay que hacer:

- `chat.ts` lee la línea `event:` y la usa como discriminador, sin dejar de
  tolerar el keep-alive.
- El adaptador traduce los siete del cable a los nuestros. `thinking` **no es
  la respuesta** y viene en inglés: es indicador, no texto a concatenar. Es la
  trampa más fácil de este paso.
- `thread_info` es nuevo y trae **dos** identificadores: `thread_id` (entero,
  para continuar) y `user_thread_id` (uuid, para pedir mensajes). Son
  distintos y se usan en llamadas distintas.
- Los mocks de MSW pasan a mandar la forma del cable, que es lo que ya se hizo
  para el batch en F1.38.

**Cómo se verifica:** abriendo el chat contra el servicio real y viendo texto.
No con una prueba que use el mock viejo — esa pasa hoy.

### Paso 2 · El cable · transcribir las rutas nuevas

Las cuatro de `/config/chat*` van a `contracts/synapse-console-wire.yaml`; las
seis de `/admin/*` a `contracts/synapse-admin-wire.yaml`. Se transcriben de su
`openapi.yaml`, no de la guía: la guía y el código ya difirieron una vez
—`DEGRADADO` contra `DEGRADED`— y manda el código.

Y se actualiza la línea `commit` del cable a `82da946`, que es lo que
`backend-drift` compara.

### Paso 3 · F3.2 · con el criterio reescrito

El criterio pasa a ser: **manda `panelId` y `periodo`, nada más.** El contexto
lo arma quien tiene los datos.

Vale decir por qué la forma nueva es mejor y no solo más corta: los doce campos
del criterio viejo obligaban al front a **reunir** base, capa, familia y
procedencia para mandarlos de vuelta al servicio que los emitió. Un campo que
viaja en redondo es un campo que se puede desincronizar en el camino. Y el
backend declara que usa «el mismo `value` que el usuario ve en la gráfica», que
es la garantía que los doce campos intentaban dar a mano.

Lo que **se pierde** y conviene anotar: `valorActual` y
`dimensionesDisponibles` eran opcionales y ya no viajan. Si alguna vez el chat
necesita preguntar por algo que el panel muestra y el servicio no puede
rearmar, vuelve como pedido.

### Paso 4 · F3.3 · la mitad que faltaba

«Preguntar» abre la hoja con el panel desde el que se preguntó. Los dos siguen
siendo callbacks del shell. **La regla del CTA muerto sigue mandando**: sin
manejador no se pinta el botón, y «Ver detalle» sigue diferido por D3.

**Y la regla de prueba de este repositorio aplica entera**: se verifica que el
callback DISPARE, no que el botón exista. La cadena es
`Console → PanelInGrid → Panel` y cada salto usa el spread condicional, que
apaga el chequeo de props en exceso.

### Paso 5 · F3.7 · la primera mitad

`GET /config/chat/threads` ya trae `tab_name`, `metric_name`, `metric_key` y
`period`, que es lo que faltaba para «cada hilo muestra con qué panel y período
se abrió».

Dos cosas que ya están decididas y no se tocan: el agrupado por tiempo sale del
**huso del navegador** —es presentación, y el contrato lo sanciona— y el riel
**no reordena**, porque una lista desordenada a la vista es mejor que esconder
que el backend mandó algo raro.

Y una nueva: `GET /config/chat/threads/{id}/messages` permite **reabrir** un
hilo sin volver a preguntar. Paginado por cursor, en orden cronológico. El `id`
es el `user_thread_id`, no el `thread_id`.

### Paso 6 · Las preguntas sugeridas · tarea nueva propuesta al final de la Fase 3

`GET /config/panels/{panelId}/chat-suggestions` no tiene tarea. Devuelve 1–4
chips `{question, intent}` con `intent` en un enumerado cerrado de seis:
`explain`, `compare`, `drivers`, `breakdown`, `forecast`, `data`.

Es cerrado, así que va al cable como enumerado cerrado — la regla de F1.35 — y
un valor desconocido no abre la unión.

**Ojo con el nombre:** `chat_suggestions` ya figura en `PARA-BACKEND.md` como
campo ausente de la pestaña en `GET /config/me`. Son dos cosas distintas: ese
pedido era por pestaña, esto es por panel. El pedido de `/config/me` **sigue
abierto**.

### Paso 7 · F4.4 · se construye, con el hueco declarado

**Lo que habilita el CRUD:** listar, crear, ver, editar y desactivar agentes por
tenant, con `semantic_views`, `system_prompt_base` e `is_active`. La credencial
no viaja: el DTO `AgentAdminDTO` no la incluye, y su comentario lo dice.

**Lo que sigue faltando es lo que la tarea pedía.** El criterio de la pantalla
es de §7.3 de `design.md`: «no se muestra vocabulario de infraestructura — se
declara la consecuencia: acceso vigente, última verificación». Y eso no llegó:

- `is_active` es un **soft delete manual**, no una verificación. Alguien lo
  apaga; no dice si el acceso funciona.
- `/agents/ping` existe pero es **global**, no por tenant.
- No hay «cuándo se verificó» ni «qué hacer si no».

Así que la pantalla se construye mostrando la consecuencia que SÍ se puede
declarar —activo o inactivo, y desde cuándo, que sale de `updated_at`— y
**declara el resto pendiente con qué lo desbloquea**. Es la misma forma que ya
tienen las tres pantallas pendientes de la superficie de admin: una pantalla
que dice qué le falta no es una pantalla en blanco.

**Y no se muestra el warehouse, ni la base, ni el rol técnico**, aunque el DTO
los traiga. §7.3 lo prohíbe y el DTO trayéndolos no es permiso para pintarlos.

El pedido que queda para el backend: **el estado del acceso por tenant** —
vigente sí/no, cuándo se verificó, y qué lo desbloquea si no. Va a la tarea,
que es de donde `PARA-BACKEND.md` lo saca.

### Paso 8 · La materialización · tarea nueva propuesta al final de la Fase 4

Cuatro rutas de admin sin tarea, y una pantalla que el `.pen` no dibuja — así
que **antes de construirla hay que abrir el `.pen` y ver si alguna de las seis
de admin la cubre**. Es la regla que costó diez pantallas.

Lo que las rutas permiten: ver si el scheduler está encendido, cuándo corre,
si hay una corrida en curso, el historial con sus contadores (`available`,
`blocked`, `errors`, `preserved`) y forzar una corrida.

El botón «Actualizar ahora» tiene un flujo declarado por ellos: `status` → si
no está corriendo, `POST run` → polling de `runs` hasta `done` o `failed` →
repetir `panels:batch`.

**Y hay una cosa que decir en la pantalla y que no es cosmética:**
`DD_MATERIALIZE_ENABLED` viene en `false`. Una pantalla que muestre «última
corrida: nunca» sin decir que el scheduler está apagado deja al operador
buscando un dato que nadie va a traer.

---

## 4 · Lo que sigue bloqueado, y por qué

**F3.6 sigue bloqueada, y está más cerca de lo que parecía.** El evento `data`
manda `{shape, data, provenance}`, que es literalmente lo que el criterio pide
—`{forma, datos, procedencia}`—. Pero las dos mitades del criterio no llegaron
juntas:

- **`shape` es la forma, no el tipo de panel.** El razonamiento escrito bajo la
  tarea sigue en pie: `Bloque.formasAceptadas` es de muchos a muchos —varios
  tipos aceptan `escalar`— así que elegir el cuerpo desde la forma es tomar una
  decisión que el contrato no tomó.
- **`provenance` no es `Gobierno`.** Trae `{source, tool, metric_key, period,
  sql_available}`: **no trae la BASE ni la capa Medallion**. Y la segunda mitad
  del criterio es «una cifra en el chat también declara BASE y procedencia».

Hay un argumento para desbloquearla y no lo resuelvo acá, que es la regla: **un
bloqueo escrito no se razona por encima.** Queda como pregunta: ¿alcanza
`shape` para elegir cuerpo si el front declara cuál eligió, o se pide el tipo
de panel en el evento? Es la pregunta 11 de B0.9 y ahora tiene un dato nuevo.

**Sin cambios:** F1.13b, F1.31, F4.9, F4.17 a F4.21 esperan lo mismo que ayer.
Este commit no las toca.

**B1.25 sigue sin estar de su lado.** `git grep measurement_window` sobre
`82da946` no devuelve nada. Sigue viviendo solo en nuestro fork, y sigue siendo
lo que hace que la línea de BASE salga con el separador colgando.

---

## 5 · Lo que este plan NO verificó

**Si el esquema está aplicado.** Su commit trae seis migraciones manuales
nuevas —índice único en `dd_panel_data`, `last_error`, `semantic_views`,
`system_prompt_base`, contexto de panel y soft delete en hilos— y corren
**solo con `DB_AUTO_MIGRATE=true`**, que es el flag que no tocamos sobre la RDS
compartida. Si el servicio desplegado no las corrió, **las rutas nuevas fallan
contra columnas que no existen**, y eso se va a ver como un 500 y no como un
404.

Aplicarlas es un cambio de esquema en producción y esa decisión no es nuestra.
**Es lo primero que hay que preguntarles**, antes de escribir una línea del
paso 1: si el esquema no está, no hay contra qué verificar nada.

**Si el chat anda.** Lo único que demuestra el paso 1 es abrirlo contra el
servicio real y ver texto. Los mocks responden lo que nosotros creemos del
cable.

**Qué gráficas tienen datos reales.** Ellos lo documentaron con fecha
2026-09-16 y conviene no repetirlo de memoria: `executive_summary` y
`decisions` **no tienen fuente en ningún tenant** —falta `BT_UA_DECISION_LOG`—,
y Keralty y Lobueno Analytics Terpel **no tienen ninguna métrica con datos
reales**: lo que se ve ahí es seed de demo. Lobueno Analytics y Synapse UA HTML
tienen 14 de 17. El detalle del error sale de `GET /admin/materialize/runs`.

---

## 6 · Los cambios que este plan pide en `plan-de-trabajo.md`

`plan-de-trabajo.md` es la fuente, así que estos cambios se hacen ahí y no acá:

| Qué | Cambio |
|---|---|
| **T4** | Se cierra. El contexto de panel viaja, con la forma del backend |
| **F3.2** | Criterio reescrito a `panelId` + `periodo`. Se destraba |
| **F3.3** | Se destraba la mitad que esperaba a T4 |
| **F3.7** | Se destraba la primera mitad del criterio |
| **F4.4** | Se destraba con alcance recortado. El pedido pasa a ser el estado del acceso, no el CRUD |
| **F3.6** | Sigue bloqueada. Se anota el dato nuevo y la pregunta |
| Tarea nueva | Preguntas sugeridas por panel · al final de la Fase 3 |
| Tarea nueva | Materialización en la superficie de admin · al final de la Fase 4 |

**Las dos tareas nuevas van sin número a propósito.** El identificador se
asigna cuando entran a `plan-de-trabajo.md`, que es la fuente; citarlo antes
deja un documento apuntando a una tarea que puede no existir nunca. Hoy la
Fase 3 llega a F3.11 y la Fase 4 a F4.23.

Y uno que no es una tarea: el defecto del SSE del paso 1. No tiene número
porque F3.4 está en ✅ y lo que hay que arreglar es lo que F3.4 construyó — el
cliente lee los seis eventos **que declara el contrato**, y su criterio se
cumplió. Lo que cambió es el cable. Corresponde una tarea de integración nueva,
hermana de F1.38, y no reabrir F3.4.
