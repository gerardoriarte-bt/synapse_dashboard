# Lo que el front necesita del backend

> **GENERADO.** Sale de `plan-de-trabajo.md` con `npm run plan` y se pisa
> entero en cada corrida — editarlo a mano es trabajo que se pierde. Lo que
> se pide vive **en la tarea que lo espera**, así que una tarea que se
> desbloquea saca su pedido de acá sola.


Cada punto dice **qué falta y por qué bloquea**, con el identificador de la
tarea que está esperando. Los identificadores son los de
`tareas-front-back.md`, el **ancestro común de los dos planes** — verificado
en cada corrida de la puerta con `npm run plan:ancestro`.


---

## Lo que ya está de nuestro lado

No hace falta que esperen nada de estas para probar: están en la rama
`Gerardo` del repositorio del front, con prueba y con la puerta en
verde.

- **F1.32** · Transcribir el cable de consola a un contrato versionado
- **F1.33** · api/adapt.ts · contexto, catálogo, bloques y pestaña
- **F1.34** · api/adapt.ts · payload, valor y presentación
- **F1.35** · Los enumerados cerrados no se abren en el cable
- **F1.36** · client.ts contra las rutas, los cuerpos y el error de este servicio
- **F1.37** · Una sola base de API
- **F1.38** · MSW responde la forma del cable, no la del contrato
- **F1.39** · Humo contra el servicio real
- **F1.40** · Presentacion llega al cuerpo · hoy está declarada y nadie la pasa
- **F1.41** · Los nombres de los params, del cable al contrato

---

## Lo que esperamos · 24 pedido(s)


### B0.4 · Middleware de auth y envelope

*Estado de la tarea: pendiente.*


**El envelope de error estructurado de §4.1.** Hoy `error` es una cadena, así que el front no puede distinguir «error de campo» de «regla de negocio» de «fallo técnico». La propuesta está en el yaml desde el 2026-09-03 y es barata: `FAMILIA_DETALLE`, con la familia como prefijo hasta el primer `_`. **El front solo necesita el prefijo**, nunca la lista completa, así que pueden agregar códigos sin que nos desincronicemos.


### B0.6 · Extender el contrato con admin y builder

*Estado de la tarea: pendiente.*


**Cerrar su B0.7: declarar `/config/*` y `/admin/layouts/*` en el OpenAPI que el binario ya embebe.** Mientras no esté, el front mantiene `contracts/synapse-console-wire.yaml`, que es una **transcripción nuestra leyendo structs de Go** — y eso ya costó un error con el servicio de acceso. Con el spec emitido, ese archivo se reemplaza por el suyo y `console-drift` lo verifica solo.


### B1.1 · GET /config/me

*Estado de la tarea: parcial.*


**`theme` en la respuesta.** El campo existe en `users`, la migración lo creó y `PUT /config/me/preferences` ya lo escribe — pero `/config/me` no lo devuelve, así que **la preferencia se guarda y no se puede leer**. El front la necesita antes del primer pixel: leerla en una segunda llamada haría que la consola pinte oscura y cambie a clara a la vista del usuario. Y falta el resto del contexto: `alcance`, `tenant.etiqueta` y `vertical`, `role.puedeAprobar`, `user.capabilities`, y en la pestaña `key`, `icon` y `chat_suggestions`.


### B1.6 · POST /config/panels:batch

*Estado de la tarea: parcial.*


**`unlocks_with` en `BLOCKED`** —hoy llega vacío; el servicio solo lo escribe al derivar `DEGRADED`, y §8 pide estado, razón **y qué lo desbloquea**— y **`request_from` real** en `FORBIDDEN`, que hoy es la constante `"administrator"` escrita en el código y no el rol que decide sobre la métrica.


### B1.13 · Presentacion opcional

*Estado de la tarea: parcial.*


**Solo la `nota` de panel.** El pedido grande que había acá —«`presentation` para las siete formas que no son escalares»— **se retira: estaba mal**, y lo corrigió leer nuestro propio código el 2026-09-15.

**`presentation` la lee UN solo cuerpo: `KpiBody`.** Ningún otro la toca — verificado con un grep sobre `src/render/bodies/`. Y no es un olvido: los demás sacan sus rótulos **del propio valor**. `BarsBody` hace `value.items.map(i => i.etiqueta)`; cada ítem viaja con su etiqueta. **«Ningún número desnudo» lo cumple la estructura del dato, no `presentation`.**

Así que `PresentationFromRows` devolviendo `nil` para las otras siete **es correcto**, y pedirlas habría sido pedir un campo que nadie lee — el mismo modo de falla de `BodyProps.presentation`, que existió meses sin un solo consumidor.

Lo que sí falta es la **`nota` de panel** —la lectura al pie, distinta de la `note` que va dentro del `medidor`—: el contrato la declara y el cable no la trae. Es un campo, no siete.


### B1.14 · Transformar a las formas de Valor

*Estado de la tarea: pendiente.*


**`decimals` y `unit` por columna en `tabular`**, y las siete formas que `TransformValue` no produce.

**NO depende de Snowflake.** Es código Go: las tablas Gold que el materializador consulta ya existen con sus quince columnas, verificado el 2026-09-14.

**Y las siete no son un solo trabajo, son dos.** El contrato declara dieciséis formas en el enum `Forma` pero **solo once tienen esquema de `Valor`**:

- **`distribucion` y `serieConBanda` tienen esquema** y las puede hacer el backend hoy: un caso más en el `switch` de `internal/core/dashboard/materialize/transform.go`, emitiendo `{shape, cuts:[{label, v}]}` y `{shape, level, points:[{t, v, lo, hi}]}`.
- **`categoricaComparada`, `perfilMultiatributo`, `matriz`, `flujo` y `grafo` NO tienen esquema.** Antes de que alguien las materialice hay que declararlas en el contrato, y **eso es trabajo nuestro**, no suyo. Hasta entonces no hay contra qué implementar.

**Ninguna de las siete es urgente**, y conviene decirlo: sus consumidores son los cuerpos `comparison`, `matrix`, `graph` y `distribution`, que el front tampoco va a construir hasta que exista una métrica que los use. **Entran juntos o no entran.**

Lo que sí sirve ya es `decimals` y `unit` por columna: sin `decimals`, una columna de ROAS sale «4.2 · 4.5 · 3.5 · 3» y la coma deja de alinearse.


### B1.15 · Validar reglas mínimas por forma antes de enviar

*Estado de la tarea: pendiente.*


**`percentage` siempre en `composition`**, y la banda completa en `scalar_with_interval`.

**NO depende de Snowflake.** La validación vive en el servicio y en el transformador, no en la vista.

**Qué hay que hacer, concretamente:**

1. En `composition`, que `percentage` salga **siempre**. Hoy `transformComposition` solo lo escribe si venía en la fila. Lo puede calcular el backend —la suma de las partes es conocida ahí— y **el front no**: el contrato dice por qué, la suma tiene que dar 100 y redondear en el cliente produce columnas que suman 99,9.
2. En `scalar_with_interval`, exigir `lo`, `hi` y `level` antes de escribir en `panel_data`. Sin los tres, el front rechaza: «un pronóstico sin banda no se publica» es regla dura 6.

**Un aviso para que no lo prioricen mal: hoy ninguna métrica del seed usa `composition`**, así que este caso no se está ejercitando en ninguna pantalla. Es prevención, no un defecto que alguien esté viendo.


### B1.16 · Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles

*Estado de la tarea: parcial.*


**La métrica «Brand Momentum»**, que esta tarea pide por nombre y el seed no incluye. Si el requisito quedó viejo, conviene sacarlo de `tareas-front-back.md` —que es de los dos equipos—: mientras esté escrito, el próximo que lea la tarea la va a dar por incompleta.


### B1.21 · Declarar los mínimos de datos por gráfico

*Estado de la tarea: pendiente.*


**La ruta `/config/plots` con el repertorio de gráficos y sus mínimos.** Bloquea F1.31 y F4.21.

**NO depende de Snowflake.** No toca datos: es una tabla de reglas y un endpoint, como `/config/blocks`.

**Pero la primera mitad es NUESTRA y todavía no está.** El repertorio declara hoy `formas`, `soportaBanda` y `tope` —el límite superior— y **no declara mínimos**. Decidir cuántos puntos necesita una serie, cuántas categorías una barra y cuántas partes una composición para no engañar es trabajo de producto y front, no de backend.

**El orden que proponemos:**

1. El front declara los mínimos por gráfico y los propone en el contrato.
2. El backend los sirve en `/config/plots`, con la misma figura que `/config/blocks`: una tabla global, no por tenant.

**Sirve desde el primer día aunque haya un gráfico por tipo**, que es por qué está en Fase 1 y no en Fase 4: hoy nada impide que `bars` reciba un ítem y dibuje una barra sola.


### B1.17 · Modelo Metrica

*Estado de la tarea: pendiente.*


**`window` en el catálogo** — el único de esta lista que se ve en pantalla. El shell pinta `Base · {base} · {window}` en los doce paneles y en los siete estados, y sin él la línea queda `Base · COMPLETED · MONTH ·` con el separador colgando.

**Depende de Snowflake solo EN LA SEGUNDA MITAD**, y conviene no confundirlas:

- **Hoy el catálogo NO sale de Snowflake**, sale del seed de Postgres —`sync-catalog` falla porque la vista no existe—. Así que **esto se puede cerrar ya, sin esperar a nadie**: columna en `DDCatalogMetric`, migración, valor en `dd_seed.go` para las doce métricas, y el campo en la respuesta de `/config/catalog`.
- **Y se rompe el día que `sync-catalog` funcione** si la vista no trae la columna. Por eso el SQL que dejamos ya declara `MEASUREMENT_WINDOW` — ver B1.18.

**Son las dos mitades, no una.** Una `B1.17` cerrada sin la columna en la vista vuelve a estar abierta en el primer sync.

Texto redactado, no un código: «Venta media de los últimos treinta días». **No se puede derivar del período** — dos métricas consultadas con el mismo `2026-09` pueden tener ventanas distintas, un total mensual y un promedio móvil de treinta días.

**`state` NO se pide, y el pedido del 2026-09-15 por la mañana se RETIRA.** Ese día se pidieron `state` y `state_reason` porque F4.5 necesitaba el filtro por estado de A4. **Estaba mal, y lo corrigió el `.pen` esa misma tarde**: el estado de una métrica **se deriva, no se copia de un campo**.

La nota de A4 lo dice con un ejemplo: «feed_vs_sales figura DISPONIBLE en el catálogo y sale DEGRADADA acá porque la frescura de su fuente la baja». Y la fila de `feed_gap` muestra las dos cosas a la vez —el estado del catálogo y el derivado— con la razón abajo: «Bloqueada porque su fuente tiene 31 h y se refresca cada hora. No degrada a un valor aproximado: se apaga».

**Así que lo que hace falta no es una columna de estado sino la SALUD DE FEEDS**, que es lo que A5 muestra y lo que A4 necesita para derivar: por fuente, su **última carga, su frescura, su cadencia y su tolerancia**. Con eso el front deriva los cuatro estados sin que nadie los escriba, y de paso se desbloquea A5 entera. Está pedido en **B2.13**.

**Pedir el campo habría sido peor que no pedirlo**: dos fuentes para el mismo hecho —el estado guardado y la frescura real— que se separan en el primer feed atrasado. Es el mismo error que este plan persigue en los documentos, aplicado a un dato.

`reading_note` sigue sin pedirse: ahí sí no lo lee nadie todavía.

**Medido el 2026-09-22 · el campo NO llegó.** `measurement_window` aparece en
`/config/catalog` **sólo cuando corre el fork**: lo agregamos nosotros en `2fafe82` y no existe
en `82da946`. Medir contra el fork lo hacía ver como avance de ellos — ver
`docs/ESTADO-backend-2026-09-22.md`. Lo que sí trae upstream: `min_grain`, `layer`,
`catalog_version`, `semantic_direction`, `base`, `dimensions` y `source`.


### B1.18 · Sincronizar el catálogo con las semantic views de Snowflake

*Estado de la tarea: pendiente.*


**La vista `SYNAPSE_METRIC_CATALOG`.** No existe en ninguna base de la cuenta —verificado con `SHOW OBJECTS`, cero filas—, así que `make sync-catalog` falla y el catálogo sale del seed de Postgres.

**ESTA ES LA QUE DEPENDE DE SNOWFLAKE**, y es la única de este bloque. Las otras cuatro son código.

**Qué hay que hacer, en orden:**

1. **Ingeniería de datos** corre `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` en el `db.schema` del agente del tenant —para UA MX, `DB_BT_UA.BT_UA_MART_ANALYTICS`—. Crea tres objetos: la tabla de curaduría, la vista que ustedes leen, y una tercera que lista lo que está mal con su razón.
2. **Producto y datos** escriben los campos marcados `⟨REVISAR⟩`: `BASE`, `MEASUREMENT_WINDOW` y `SOURCE`. Son texto que se pinta literal, así que se redactan.
3. **Grant de `SELECT`** para el rol del agente. Sin esto `sync-catalog` falla con un error de permisos que no dice qué falta.
4. **Backend** agrega `MEASUREMENT_WINDOW` al `SELECT` de `dd_catalog_sync_service.go` — ver B1.17.
5. Correr `make sync-catalog TENANT_ID=<uuid>`.

**El paso que se rompe en silencio es la clave.** `METRIC_KEY` tiene que caer en `MetricRegistry` o en el alias de `keys.go`: una clave que no está **sincroniza bien y después todos los paneles salen `BLOCKED`** sin que nada lo explique. Nos pasó al escribir la primera versión de ese SQL.

Los pasos completos están en `docs/snowflake/INSTRUCCION-ALTA-TENANT.md`. **Nosotros no corremos nada en Snowflake.**

**Medido el 2026-09-22 · `sync-catalog` sigue sin correr.** `/config/catalog` devuelve las
**doce claves de la semilla de Postgres** —`sales`, `investment`, `executive_summary`…— y no las
diez de Snowflake. Pasa de «no verificado» a **medido y ausente**.


### B1.19 · Filtrar el catálogo por permisos de rol

*Estado de la tarea: pendiente.*


**Un usuario de prueba con un rol restringido.** El mecanismo está en el código, pero con el usuario que tenemos —rol `Planner`— el catálogo devuelve las doce métricas, incluidas `executive_summary`, `roas` y `decisions`, que su propio documento dice que `planner` oculta. No decimos que esté roto: no se puede comprobar. Con un usuario así se cierran las dos mitades en un minuto — el catálogo recortado y un panel en `FORBIDDEN`.


### B1.25 · ventana de punta a punta · de la vista al payload

*Estado de la tarea: parcial.*


**Ya no espera a Snowflake: espera dos líneas de Go.** Verificado el 2026-09-15.

`MEASUREMENT_WINDOW` **existe en la vista, con valor en las diez métricas y sin nulos** —lo entrega el equipo de datos en `docs/snowflake/synapse-catalogo-metricas.md` §8—, y con ese nombre justamente para no chocar con `WINDOW`, reservada en ANSI. Falta lo de siempre: leerla en el `SELECT` de `dd_catalog_sync_service.go` y exponerla en `GET /config/catalog`.

**Comprobado contra el servicio corriendo:** las claves de una métrica de `/config/catalog` son `base, catalog_version, created_at, dimensions, family, id, key, layer, min_grain, name, semantic_direction, shape, source, tenant_id, updated_at`. **No hay ningún campo de ventana**, ni `measurement_window` ni `window`.

**Y la pregunta que el equipo de datos nos devuelve, contestada:** el nombre del campo JSON lo acordamos backend y front, y **al front le da igual** — el adaptador de F1.33 renombra, es lo que hace con los catorce campos que ya traduce. **Que sea `measurement_window`**, igual que la columna: un tercer nombre para el mismo dato es una traducción más que mantener, y el cable ya sale en snake_case.


### B1.27 · El período declara si está cerrado

*Estado de la tarea: parcial.*


**Un campo en `Periodo`** que diga si el período está cerrado o en curso — pedido el 2026-09-15.

`availablePeriods()` emite los últimos doce meses **contando el actual**, y el actual está incompleto. Hoy los trece llegan iguales: una cadena `2026-09`. La consola los ofrece todos con la misma pinta, y quien compare el mes en curso contra el anterior lee una caída que es «todavía no terminó».

**Es barato de los dos lados**: el backend ya sabe cuál es el mes en curso al generarlos. Y con eso el front lo marca —el `.pen` lo dibuja en B5: «1 – 31 JUL 2026 · **MTD CERRADO**»— sin comparar contra el reloj del navegador, que sería el error: el corte del día es **del tenant y su huso**, no de quien mira.

**Lo pidió el equipo de datos sin saberlo.** Su aviso decía «si la consola deja elegir meses futuros, mostrará 0 y roas 0x». Los futuros no se ofrecen —verificado en `availablePeriods()`—, pero el mes en curso sí, y es el mismo problema en chico.

**Medido el 2026-09-22 · sigue faltando.** `open_period` en `/config/me` es **nuestro**
—`2fafe82`—; `82da946` devuelve `periods` como doce cadenas sueltas y nada más. La forma que
propusimos en el fork es un campo al lado de `periods`, no uno dentro de cada `Periodo`: si
prefieren la otra, se decide antes de que alguien la consuma.


### B2.13 · Salud de feeds por fuente · de acá sale el ESTADO de cada métrica

*Estado de la tarea: pendiente.*


**Una ruta que liste, por fuente del tenant: última carga, frescura, cadencia y tolerancia.** Más, si existen, filas procesadas y filas que fallaron la validación Silver→Gold.

Pedida el 2026-09-15, **reemplazando un pedido anterior del mismo día que estaba mal.** Esa mañana se pidieron `state` y `state_reason` en el modelo `Metrica` (B1.17) porque A4 necesita filtrar por estado. El `.pen` lo corrigió esa tarde: **el estado de una métrica se DERIVA, no se guarda.**

La nota de A4 lo dice con un ejemplo: «feed_vs_sales figura DISPONIBLE en el catálogo y sale DEGRADADA acá porque la frescura de su fuente la baja». Y la fila de `feed_gap` muestra las dos cosas a la vez, con la razón: «Bloqueada porque su fuente tiene 31 h y se refresca cada hora. No degrada a un valor aproximado: se apaga».

**La regla es `frescura > cadencia × tolerancia`**, y los tres términos son de la fuente, no de la métrica. Con ellos el front deriva los cuatro estados sin que nadie los escriba.

**AMPLIADO el 2026-09-15 después de leer su código**, porque el pedido original estaba subestimado. Dos cosas que conviene mirar juntas:

**a · La fuente no existe como entidad.** Buscado en `internal/core/domain/` y `internal/core/ports/`: no hay `Feed`, ni `DataSource`, ni nada equivalente. `source` es **texto libre en la métrica** —«ERP + Ads API»— así que no hay dónde colgar una última carga ni una cadencia. Esto no es agregar cuatro campos: es **crear la entidad** y relacionarla con las métricas que dependen de ella.

**b · Y ya existe una derivación de degradación, con otra regla.** `dd_config_service.go` tiene `const freshnessToleranceDays = 3` y marca `DEGRADED` cuando la última materialización pasó ese plazo:

```go
if status == Available && isDegraded(data, now) {
    status = Degraded
    reason = "Stale data: last materialization is older than 3 days"
}
```

**Es una constante global aplicada por payload de panel**, y §7.3 pide una tolerancia **por fuente**: Merchant Center con cadencia de una hora y 31 h de atraso está degradado, y una fuente diaria con 31 h no. Con la regla de hoy las dos dan lo mismo — o las dos disponibles, o las dos degradadas, según el plazo.

**No es un bug: es una aproximación razonable mientras no exista la entidad.** Pero conviene decidirlo explícitamente, porque el día que la fuente exista **hay dos reglas de degradación** y la del panel gana sin que nadie lo haya elegido.

**Y algo que el front NO va a pedir**: que `/config/panels:batch` deje de derivar. Esa derivación es correcta donde está —el payload sabe cuándo se materializó— y es la que hace que un panel degradado se vea degradado sin consultar nada más.

**Pedir el campo habría sido peor que no pedirlo**: dos fuentes para el mismo hecho —el estado guardado y la frescura real— que se separan en el primer feed atrasado.

**Desbloquea dos pantallas, no una.** A5 entera —«la pantalla que explica por qué una métrica está degradada»— y la columna de estado de A4, con su filtro.


### B3.1 · POST /config/chat con SSE

*Estado de la tarea: pendiente.*


**La ruta ya está escrita** — `82da946` la trae con `panel_context: {panel_id, period}`, y con eso se cerró la transversal T4. Lo que falta es **poder verificarla**: sin las migraciones de B3.11 el handler escribe contra columnas que no existen. **Lo pendiente del chat cambió el 2026-09-22 y el pedido vigente es otro**: con las migraciones corridas en la base local, `POST /config/chat` devuelve **409 · «no hay agente activo disponible para este tenant y rol»**. Hace falta un agente con credenciales de Snowflake, o un modo que no llame a Cortex — pedido en `docs/MENSAJE-2026-09-22-agente-roles-y-un-hallazgo.md`, punto 1. El pedido del 21 —los dos campos del evento `data`— quedó cubierto: F3.6 se cerró con el tipo del panel. El chat que el servicio ya tenía antes es **otro producto** —decidido el 2026-09-08—: el nuestro se abre desde un panel y lleva su métrica.


### B3.9 · CRUD /admin/tenants/{id}/agents

*Estado de la tarea: pendiente.*


**La ruta entera** — pedida el 2026-09-15, cuando F4.4 quedó sin nada que consumir.

Existe `POST /admin/agents` y **nada más**: no hay forma de leer la configuración de un tenant ni de editarla. Las seis rutas de `/admin/*` que el servicio sirve no incluyen ninguna de agente.

**Y lo que el front necesita no es la configuración, es su CONSECUENCIA.** §7.3 prohíbe mostrar vocabulario de infraestructura —ni base, ni rol técnico, ni warehouse, ni grant— y pide en su lugar: **si el acceso a datos está vigente, cuándo se verificó por última vez, y qué hacer si no lo está.** Tres campos, no un CRUD.

Con esos tres, F4.4 y la mitad que le falta a la ficha de cliente se cierran. El CRUD completo de B3.9 es otra cosa y puede esperar: **lo que bloquea es el estado, no la edición.**


### B3.11 · Aplicar las migraciones de 82da946 sobre la base compartida

*Estado de la tarea: pendiente.*


**Que corran las migraciones manuales de `82da946` sobre la base compartida** — pedido el 2026-09-21 en `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`, tarea 1. **Sigue en pie para la compartida**, pero ya no es lo que frena el chat: eso pasó a ser el agente, y va en `docs/MENSAJE-2026-09-22-agente-roles-y-un-hallazgo.md`.

Medido ese día contra la base compartida, con una consulta de sólo lectura sobre `information_schema`: **faltan las nueve columnas y el índice.** Las agrega `internal/adapters/repository/manual_migrations.go` y corren sólo con `DB_AUTO_MIGRATE=true`, que no activamos sobre esa base: es un cambio de esquema en una base compartida y la decisión no es nuestra.

Sin ellas `POST /config/chat` no puede guardar el hilo, y eso se ve como un **500, no como un 404**: la ruta existe, lo que falta es la columna.

| Tabla | Columnas | De qué tarea son |
|---|---|---|
| `user_threads` | `panel_id`, `period`, `deleted_at` | B3.1 y B3.10 |
| `agents` | `is_active`, `semantic_views`, `system_prompt_base` | B3.3 y B3.9 |
| `dd_panel_data` | `last_error`, `last_error_at`, `last_success_at` + índice `idx_dd_panel_data_tenant_metric_period` | Materialización · B2.12 |


### B4.1 · GET /admin/tenants

*Estado de la tarea: parcial.*


**Cinco campos en `GET /admin/tenants`**: `status`, `vertical`, `user_count`, `oldest_feed_freshness` y `last_published_at`.

Hoy devuelve `ports.TenantPublicOption` —`id` y `name`—, que nació para llenar un
selector. **§7.3 de `design.md` describe la banda de clientes de A1 con seis
columnas**, así que la pantalla muestra una y declara que faltan cinco.

No bloquea: la lista funciona y el builder puede elegir tenant. Lo que falta es
lo que convierte una lista en una pantalla de administración — saber de un
vistazo qué cliente tiene el feed más atrasado es la mitad de para qué existe.

**Medido el 2026-09-22 · los cinco campos siguen faltando.** `82da946` devuelve `{id, name}`.
`user_count` y `last_published_at` se ven **sólo con el fork corriendo**: los escribimos nosotros
en `2fafe82`. Ver `docs/ESTADO-backend-2026-09-22.md`.


### B4.2 · GET /admin/tenants/{id}/layouts

*Estado de la tarea: parcial.*


**Autor, diferencia y reversión en `LayoutVersion`** — pedido el 2026-09-15, cuando F4.6 declaró B6.

§7.2 describe el historial de versiones en una línea: «**quién, cuándo, qué cambió. Permite revertir.** Sin esto, un error de composición en producción no tiene vuelta atrás». La respuesta de hoy trae **cuándo** y nada más.

- **Quién.** El criterio compartido de B4.2–B4.7 ya dice que publicar «registra quién publicó», así que el dato existe del lado de ustedes; lo que falta es que salga en la respuesta.
- **Qué cambió.** Contra la versión publicada anterior. No hace falta un diff estructural: alcanza con qué pestañas y qué paneles se agregaron, se quitaron o se movieron.
- **Revertir.** No hay ruta. `POST /admin/tenants/{id}/layouts` acepta un `version_id` de origen, así que puede que ya alcance con documentar que duplicar una versión vieja **es** revertir — si es así, es una línea de documentación y no código.

**No bloquea el builder**, bloquea B6. Y B6 es la pantalla que hace reversible un error de composición en producción: sin ella, la única salida es recomponer a mano.

**Medido el 2026-09-22 · autor y diff siguen faltando.** `82da946` devuelve
`{ID, TenantID, Status, VersionID, PublishedAt, CreatedAt, UpdatedAt}`. `PublishedBy`,
`PublishedByEmail` y la ruta `/admin/layouts/{layoutId}/diff` son **nuestras**, de `2fafe82`.


### B4.4 · PUT /admin/layouts/{id} — editar pestañas y paneles

*Estado de la tarea: parcial.*


**`chat_suggestions` e `icon` en la pestaña** — pedido el 2026-09-15, cuando F4.8 construyó el editor.

Los dos están en el modelo de §2 de `design.md` y en `Pestana` del contrato, y no están en `DDTab` ni en `TabInput`: **no hay dónde escribirlos ni de dónde leerlos**. `chatSugerencias[]` es lo que C3 pinta como «chips de consulta sugerida por pestaña», así que sin el campo el chat abre en un vacío sin sugerencias. `icono` es menor y va de paso, porque es la misma línea.

**Y una pregunta que es de ustedes, no un pedido.** `OperationalQuestion` no es requerido y el servicio acepta la cadena vacía. El producto dice lo contrario —«una pestaña que no contesta una pregunta no se compone», §7.2 y la descripción de `Pestana`—, así que hoy **la regla la sostiene el front solo**: el editor marca la pestaña, la cuenta y no la deja componer. Si además la rechazara el `validate` o el `publish`, la regla dejaría de depender de qué cliente haga el PUT. Es B4.15 quien decidiría.


### B4.10 · Asignación de layout publicado a roles

*Estado de la tarea: pendiente.*


**Tres etiquetas `json:`** en `DDLayoutVersion`, `DDTab` y `DDPanel`, y un **`json:"-"`** en sus campos `Tenant` / `LayoutVersion` / `Tab`.

**No es una preferencia nuestra: rompe sus propios tests de Postman.**
`scriptCreateDraft` de su colección F4 afirma `lv.status === 'draft'` y lo que
llega es `Status`, así que compara `undefined` contra `'draft'`. Lo mismo
`d.tabs[0].tab.name` en `F4-8`. Los DTO del builder sí las tienen; los structs de
dominio no, y por eso la misma respuesta mezcla las dos convenciones.

**Y el `json:"-"` es aparte, por si se prioriza distinto.** `DDLayoutVersion`
tiene un campo `Tenant Tenant` sin él, y `domain.Tenant` guarda `PrivateKeyPEM` y
`PrivateKeyPassphrase`. **Hoy no filtra** —ningún repositorio hace
`Preload("Tenant")`, así que viajan cadenas vacías— pero el día que alguien
agregue un `Preload` para mostrar el nombre del tenant, filtra, y nada lo
detendría.

**Mientras tanto el front lo absorbe** en su adaptador, igual que el resto del
cable: no están bloqueando nada. Es higiene, y de la barata.


### B5.1 · Varios layouts por tenant

*Estado de la tarea: pendiente.*


**La lista de layouts que el usuario puede ver, en `/config/me`.** `GET /config/tabs/:tabId?layoutId=` ya funciona, pero no hay forma de saber qué layouts le tocan a alguien, así que el selector de F5.1 no se puede construir: no se ofrece una elección que no se sabe si existe.


### F1.44 · El orden de una tabla se anuncia, no se aplica

*Estado de la tarea: parcial.*


Qué significa `cut` en un panel `series`. El cable lo
declara en `layout_params` de `series` y de `forecast`, y el layout sembrado
manda `{"cut": "day"}` y `{"cut": "month"}`. En `forecast` es el punto donde
termina lo observado y empieza la proyección —un índice— y así lo lee
`ForecastBody`; en `series` parece granularidad, que es otra cosa con el mismo
nombre. **Y el dato no permite deducirlo**: los dos paneles traen las mismas
ocho estampas mensuales —`jan`, `feb`, `mar`…— sin importar el `cut`, así que el
que declara `31 DAYS` en su BASE **dibuja ocho puntos mensuales**. Eso es una
segunda cosa que revisar, y hasta que alguna de las dos se aclare el param se
descarta con aviso en vez de leerse mal. · Bloquea **F1.44**.


---

## Cómo avisar que algo llegó

No hace falta tocar este archivo. Con decirlo alcanza: el front quita el
marcador de la tarea, la desbloquea y este documento se regenera sin ese
punto. **Si un pedido sigue acá, es que sigue faltando.**

