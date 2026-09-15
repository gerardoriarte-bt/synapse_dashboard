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

## Lo que esperamos · 18 pedido(s)


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

*Estado de la tarea: pendiente.*


**`presentation` para las formas que no son escalares.** `PresentationFromRows` devuelve `nil` para siete de las nueve, así que un panel de barras, de tabla o de serie llega **sin rótulo** — y «ningún número desnudo» es regla dura. Falta también la `nota` de panel, distinta de la `note` que va dentro del `meter`. Verificado: de doce payloads, solo los seis escalares traen `presentation`.


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

**`state` y `state_reason` SÍ los pedimos desde el 2026-09-15**, y antes no. La razón anterior —«no los lee nadie en el front»— dejó de ser cierta cuando F4.5 construyó A4: §7.3 le pide a esa pantalla **filtro por estado**, y sin el campo el filtro no existe. Peor: el adaptador escribe `estado: 'DISPONIBLE'` fijo para satisfacer el contrato, así que **el campo compila y tiene valor**, y una columna con doce `DISPONIBLE` idénticos se ve igual que un catálogo verificado. Hoy A4 no lo pinta y declara por qué; con el campo, lo pinta y ofrece el filtro.

`reading_note` sigue sin pedirse: ahí sí no lo lee nadie todavía.


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


### B1.19 · Filtrar el catálogo por permisos de rol

*Estado de la tarea: pendiente.*


**Un usuario de prueba con un rol restringido.** El mecanismo está en el código, pero con el usuario que tenemos —rol `Planner`— el catálogo devuelve las doce métricas, incluidas `executive_summary`, `roas` y `decisions`, que su propio documento dice que `planner` oculta. No decimos que esté roto: no se puede comprobar. Con un usuario así se cierran las dos mitades en un minuto — el catálogo recortado y un panel en `FORBIDDEN`.


### B3.1 · POST /config/chat con SSE

*Estado de la tarea: pendiente.*


**`POST /config/chat` con `ContextoDePanel`.** Es la transversal T4 y bloquea F3.2, F3.3, F3.6 y la mitad de F3.7. El chat que el servicio sí tiene es **otro producto** —decidido el 2026-09-08—: el nuestro es el chat contextual del panel, se abre desde un panel y lleva su métrica.


### B4.1 · GET /admin/tenants

*Estado de la tarea: pendiente.*


**Cinco campos en `GET /admin/tenants`**: `status`, `vertical`, `user_count`, `oldest_feed_freshness` y `last_published_at`.

Hoy devuelve `ports.TenantPublicOption` —`id` y `name`—, que nació para llenar un
selector. **§7.3 de `design.md` describe la banda de clientes de A1 con seis
columnas**, así que la pantalla muestra una y declara que faltan cinco.

No bloquea: la lista funciona y el builder puede elegir tenant. Lo que falta es
lo que convierte una lista en una pantalla de administración — saber de un
vistazo qué cliente tiene el feed más atrasado es la mitad de para qué existe.


### B4.2 · GET /admin/tenants/{id}/layouts

*Estado de la tarea: pendiente.*


**Autor, diferencia y reversión en `LayoutVersion`** — pedido el 2026-09-15, cuando F4.6 declaró B6.

§7.2 describe el historial de versiones en una línea: «**quién, cuándo, qué cambió. Permite revertir.** Sin esto, un error de composición en producción no tiene vuelta atrás». La respuesta de hoy trae **cuándo** y nada más.

- **Quién.** El criterio compartido de B4.2–B4.7 ya dice que publicar «registra quién publicó», así que el dato existe del lado de ustedes; lo que falta es que salga en la respuesta.
- **Qué cambió.** Contra la versión publicada anterior. No hace falta un diff estructural: alcanza con qué pestañas y qué paneles se agregaron, se quitaron o se movieron.
- **Revertir.** No hay ruta. `POST /admin/tenants/{id}/layouts` acepta un `version_id` de origen, así que puede que ya alcance con documentar que duplicar una versión vieja **es** revertir — si es así, es una línea de documentación y no código.

**No bloquea el builder**, bloquea B6. Y B6 es la pantalla que hace reversible un error de composición en producción: sin ella, la única salida es recomponer a mano.


### B4.4 · PUT /admin/layouts/{id} — editar pestañas y paneles

*Estado de la tarea: pendiente.*


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


---

## Cómo avisar que algo llegó

No hace falta tocar este archivo. Con decirlo alcanza: el front quita el
marcador de la tarea, la desbloquea y este documento se regenera sin ese
punto. **Si un pedido sigue acá, es que sigue faltando.**

