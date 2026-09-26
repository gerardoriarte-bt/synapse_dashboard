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

## Lo que esperamos · 11 pedido(s)


### B0.4 · Middleware de auth y envelope

*Estado de la tarea: pendiente.*


**El envelope de error estructurado de §4.1.** Hoy `error` es una cadena, así que el front no puede distinguir «error de campo» de «regla de negocio» de «fallo técnico». La propuesta está en el yaml desde el 2026-09-03 y es barata: `FAMILIA_DETALLE`, con la familia como prefijo hasta el primer `_`. **El front solo necesita el prefijo**, nunca la lista completa, así que pueden agregar códigos sin que nos desincronicemos.


### B1.1 · GET /config/me

*Estado de la tarea: parcial.*


El resto del contexto: `alcance` con `tenantsDisponibles`, el `grano` de cada período, `tenant.etiqueta` y `vertical`, `role.puedeAprobar`, `user.capabilities`, y en la pestaña `key`, `icon` y `chat_suggestions`.


### B1.6 · POST /config/panels:batch

*Estado de la tarea: parcial.*


**`unlocks_with` en `BLOCKED`** —el servicio sólo lo escribe al derivar `DEGRADED`, y §8 pide estado, razón **y qué lo desbloquea**— y confirmar si `request_from` constante es la decisión.


### B1.13 · Presentacion opcional

*Estado de la tarea: parcial.*


**Solo la `nota` de panel.** El pedido grande que había acá —«`presentation` para las siete formas que no son escalares»— **se retira: estaba mal**, y lo corrigió leer nuestro propio código el 2026-09-15.

**`presentation` la lee UN solo cuerpo: `KpiBody`.** Ningún otro la toca — verificado con un grep sobre `src/render/bodies/`. Y no es un olvido: los demás sacan sus rótulos **del propio valor**. `BarsBody` hace `value.items.map(i => i.etiqueta)`; cada ítem viaja con su etiqueta. **«Ningún número desnudo» lo cumple la estructura del dato, no `presentation`.**

Así que `PresentationFromRows` devolviendo `nil` para las otras siete **es correcto**, y pedirlas habría sido pedir un campo que nadie lee — el mismo modo de falla de `BodyProps.presentation`, que existió meses sin un solo consumidor.

Lo que sí falta es la **`nota` de panel** —la lectura al pie, distinta de la `note` que va dentro del `medidor`—: el contrato la declara y el cable no la trae. Es un campo, no siete.


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


### B2.12 · Correr el materializador contra datos reales y verificar los seis estados

*Estado de la tarea: parcial.*


**Los paneles de prosa los genera el AGENTE, y hoy no hay
camino.** Decidido el 2026-09-24 por producto: `executive_summary` y `decisions`
no son métricas sino **interpretación** —el resumen y las propuestas sobre los
datos del período—, así que no se curan en Snowflake, y **es el materializador
quien llama al agente**. Las otras dos opciones se pesaron y se descartaron: una
tabla que alguien llena desacopla el texto del período, y pedirlo desde el front
hace que cada usuario espere segundos y pague la misma llamada.

**El dashboard lo compone el ADMIN**, y el resumen se hace sobre **lo que ese
dashboard proyecta** — no sobre el negocio en abstracto. De ahí salen tres
propiedades que condicionan el diseño: es **por dashboard y por período**, corre
**después** del resto de los paneles de su pestaña —porque los consume—, y
**escala sin curaduría**: el admin agrega o saca una métrica y el resumen la
sigue solo. Eso último es lo que lo vuelve viable con muchos tenants.

Hoy `transform.go` sabe armar `{shape, headline, pillars}` pero **leyendo filas
de una consulta SQL**, y el agente sólo está cableado al chat. Queda de su lado
el prompt, el costo por corrida y el reintento —para eso ya encaja `DEGRADED`—.

**Lo que NO cambia:** esas dos siguen necesitando fila en el catálogo, porque un
panel se ancla a un `metricId` y `dd_panels.metric_id` es `NOT NULL`. Sin fila el
admin no puede poner el panel. Lo que cambia es **cómo se materializa**.

**Y arrastra una pregunta que conviene contestar antes**: qué procedencia declara
un texto generado. Hoy ese panel dice `SILVER · ACTIONABLE FRAMEWORK`, que viene
del seed; para un texto del agente sería mentira, y `GOLD · ERP` sería peor.
Todo en `docs/MENSAJE-2026-09-24-materializador.md` §3. · Bloquea **B2.12**.

**Espera del backend.** **Una fila que NUNCA se materializó no puede servirse
como `AVAILABLE`.** `sync-catalog` trae diez métricas de Snowflake y la semilla
tiene doce, así que **dos quedan sin fuente** —`executive_summary` y
`decisions`—. El materializador lo sabe: informa `preserved=2`. Pero esas dos
filas siguen saliendo `AVAILABLE` con el valor viejo, y el resultado es que **la
consola se contradice a sí misma**: el panel de prosa dice «Sales closed the
month at USD 4.28M» al lado de un KPI que dice 639.078.

`isDegraded` mide **antigüedad** —«older than 3 days», verificado en B2.5— y
estas dos tienen cuatro horas, así que pasan el umbral. La señal que las separa
no es la edad sino que **`last_success_at` es nulo**: nunca hubo una
materialización exitosa. «Vieja» y «nunca» son dos estados distintos.

Alcanza con que `preserved` —o `last_success_at IS NULL`— también degrade, con
su razón. El front ya pinta `DEGRADED` con su badge, su razón y su
`desbloqueaCon`: está cubierto por las pruebas de F2.1 y no hace falta nada de
nuestro lado. · Bloquea **B2.12**.


### B3.11 · Aplicar las migraciones de 82da946 sobre la base compartida

*Estado de la tarea: pendiente.*


**Que corran las migraciones manuales de `82da946` sobre la base compartida** — pedido el 2026-09-21 en `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`, tarea 1. **Sigue en pie para la compartida**, pero ya no es lo que frena el chat: eso pasó a ser el agente, y va en `docs/MENSAJE-2026-09-22-backend-roles-y-hallazgo.md`.

Medido ese día contra la base compartida, con una consulta de sólo lectura sobre `information_schema`: **faltan las nueve columnas y el índice.** Las agrega `internal/adapters/repository/manual_migrations.go` y corren sólo con `DB_AUTO_MIGRATE=true`, que no activamos sobre esa base: es un cambio de esquema en una base compartida y la decisión no es nuestra.

Sin ellas `POST /config/chat` no puede guardar el hilo, y eso se ve como un **500, no como un 404**: la ruta existe, lo que falta es la columna.

| Tabla | Columnas | De qué tarea son |
|---|---|---|
| `user_threads` | `panel_id`, `period`, `deleted_at` | B3.1 y B3.10 |
| `agents` | `is_active`, `semantic_views`, `system_prompt_base` | B3.3 y B3.9 |
| `dd_panel_data` | `last_error`, `last_error_at`, `last_success_at` + índice `idx_dd_panel_data_tenant_metric_period` | Materialización · B2.12 |


### B4.2 · GET /admin/tenants/{id}/layouts

*Estado de la tarea: parcial.*


**La reversión**, que es el tercio que falta: no hay ruta de revertir ni de rollback en el router. `previous_layout_id` da con qué hacerlo y publicar el anterior con la ruta que ya existe sería el camino, pero eso es una decisión y no un hecho medido. El pedido original decía: **Autor, diferencia y reversión en `LayoutVersion`** — pedido el 2026-09-15, cuando F4.6 declaró B6.

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

