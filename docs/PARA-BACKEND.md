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

## Lo que esperamos · 9 pedido(s)


### B0.4 · Middleware de auth y envelope

*Estado de la tarea: parcial.*


**Que el `error` esté redactado y en español · queda UNA ruta, no dos.** Remedido el 2026-09-28 contra `f70cec2`: de los dos handlers crudos, el de «tab not found» se arregló —sale `pestaña no encontrada`— y los 400 de binding pasan por un traductor por campo, medido en `PUT /config/me/preferences`: `el campo 'theme' debe ser uno de: dark, light`. **`POST /config/chat` sigue volcando el validador de Go**, y su respuesta afirma lo contrario —«Nunca aparece un nombre de struct de Go ni un tag»—. Medido: `Key: 'ddChatRequest.question' Error:Field validation for 'question' failed on the 'required' tag`. **No es el anidamiento**: falla igual con un campo de primer nivel. Es por handler — `dd_chat_handler.go:52` manda `err.Error()` donde los demás mandan `BindingErrorMessage(err)`, y de 32 sitios que enlazan JSON sólo 9 pasan por el traductor. `ErrorState` lo pinta tal cual, y cae justo en la ruta de F3.15.


### B1.1 · GET /config/me · llegaron dos de seis

*Estado de la tarea: parcial.*


`tenant.etiqueta` y la `key` de la pestaña.

**Se retiraron DOS del pedido el 2026-09-28, y no por llegar: porque no los consume nadie.** Antes de reenviar se revisó cada uno contra su consumidor:

- **`role.puedeAprobar`** · el adaptador lo fija en `false` y ninguna pantalla lo lee. La compuerta real de una acción sobre un panel es `payload.acciones`, que ya funciona. Pedirlo sería pedir un campo que nadie llena — lo mismo que les dijimos de `vertical`.
- **`user.capabilities`** · ningún consumidor, hoy ni previsto.

**Y la `key` dejó de ser sólo nuestra**: el backend avisó el 2026-09-28 que `roles.tab_ids` guarda ids de fila, que se recrean en cada versión publicada, así que **la primera publicación real desde el builder deja sin pestañas a todo rol con restricción**. Su salida propuesta —identidad de pestaña por `slug` dentro del dashboard— **es esta misma `key`**. Un campo contestando dos problemas.

**Medido campo por campo el 2026-09-28 contra `5924bf2b`**, y por eso esta tarea NO pasa a ✅: el pedido tenía seis cosas y llegaron dos.

| Pedido | Estado |
|---|---|
| `alcance` con `tenantsDisponibles` | ✅ llegó como `scope` · `{kind, tenants[]}` |
| El `grano` de cada período | ✅ `period_grain` y `periods_detail[].grain` |
| `icon` y `chat_suggestions` en la pestaña | ✅ · y las sugerencias como lista, nunca `null` |
| `tenant.etiqueta` | ✗ · `tenant` trae `id`, `name`, `locale`, `currency`, `timezone` |
| `role.puedeAprobar` | ✗ · `role` trae `id` y `name` |
| `user.capabilities` | ✗ · `user` trae `id`, `email`, nombre y `theme` |
| La `key` de la pestaña | ✗ |

**Y `tenant.vertical` se RETIRA del pedido**, que es nuestro y no suyo: §3.5 declara `vertical` **y** `plantillaOrigen`, y el mecanismo no existe de ningún lado · `docs/DECISIONES-2026-09-28-estado-y-vertical.md`. Pedir la columna sin la plantilla les haría escribir un campo que nadie llena.


### B1.21 · Declarar los mínimos de datos por gráfico

*Estado de la tarea: pendiente.*


**Queda `GET /config/plots`; `chart` YA LLEGÓ** · el mismo día que se pidió, en `f70cec2`. Medido el 2026-09-28 contra el servicio: sale en `DDPanelDTO.chart` y en `DDLayoutPanel.chart`, lo escribe el builder recortado y en minúsculas —`"  Waterfall  "` → `waterfall`— y los doce paneles publicados quedaron con `''`, así que no migró ningún layout. Transcripto en los dos cables y adaptado, con prueba de que **un id desconocido se pasa igual**: descartarlo haría caer el panel al gráfico por defecto sin que nadie se entere. **Lo que falta es la ruta del repertorio**, y para escribirla piden tres archivos nuestros que no están en su repo — contestado en `docs/MENSAJE-2026-09-28-backend-lo-que-piden.md`.

**NUESTRA MITAD ESTÁ HECHA** · 2026-09-26, y **el repertorio entero desde el 2026-09-28**: `docs/REPERTORIO-2026-09-28-los-49-graficos.md`. El orden que habíamos propuesto era «1. el front declara los mínimos y los propone en el contrato · 2. el backend los sirve». **El paso 1 está**: el contrato declara `GET /config/plots`, `Grafico` y `MinimoDeDatos`, y la tabla que hay que implementar está en `docs/DECISIONES-2026-09-26-minimos-por-grafico.md`.

**La decisión de estructura, que es lo que más va a durar: el mínimo es de la FORMA, y un gráfico lo SUBE sólo si su geometría lo exige.** Es la simetría de `tope`, que baja el techo por gráfico. Un número elegido a mano para cada una de las 49 entradas serían 49 juicios, y la mayoría arbitrarios: `bars` y `lollipop` comen el mismo dato y fallan en el mismo punto.

Sólo tres suben el de su forma —`treemap`, `pareto` y `waterfall`, a 3— y están marcados aparte porque son juicio y no geometría.

**Y la razón se PINTA.** `MinimoDeDatos` la declara obligatoria: un panel que se apaga sin decir por qué manda a buscar un error donde hay una regla.

**Los tres mínimos que ya estaban escritos** en el criterio de abajo —«una serie de un punto, una composición de una parte y un ranking de dos ítems»— se respetaron, y de ahí sale que `ranking` sea 3 y no 2.

**Espera del backend.** **Servir `GET /config/plots`** con la tabla del documento, con la misma figura que `/config/blocks`: global, no por tenant. Medido el 2026-09-26: **404**. Bloquea F1.31 y F4.21.

**NO depende de Snowflake.** No toca datos: es una tabla de reglas y un endpoint.

**Sirve desde el primer día aunque haya un gráfico por tipo**, que es por qué está en Fase 1 y no en Fase 4: hoy nada impide que `bars` reciba un ítem y dibuje una barra sola.


### B1.28 · PayloadDegradado dice DESDE QUÉ PUNTO el dato está vencido

*Estado de la tarea: pendiente.*


**Un campo en `PayloadDegradado` que diga desde dónde el dato dejó de ser fresco** — pedido el 2026-09-28, al cerrar la propuesta del degradado.

Hoy el cable manda `reason` y `unlocks_with` como texto redactado, que sirve para la nota pero no para el cuerpo: **no dice qué tramo de la serie está vencido.**

**Lo pide el dibujo, no nosotros.** `Librería de gráficos / ESTADO · Degradado` dibuja una serie con las **dos últimas barras en `$w2`** en vez del color de familia, y su nota lo declara: «DEGRADADO NO BLOQUEA: OBLIGA A FECHAR. **LA TRAMA MARCA EL TRAMO VENCIDO**».

**Medido el 2026-09-28**: la trama existe sólo en la biblioteca y **el panel degradado de C1 no la aplica** —sus rellenos de datos son los de la familia, sin una sola barra en `$w2`—, así que ni dentro del `.pen` está puesta donde se vería.

**Alcance decidido ese día**, en `docs/PROPUESTA-2026-09-25-degradado.md`: la trama es para las **formas con eje temporal** —serie, área, forecast—; en las que no lo tienen, «obliga a fechar» lo cumple la procedencia con su frescura, que ya se pinta en los seis estados.


### B1.29 · schema-check · decir qué le falta al cliente ANTES de intentar

*Estado de la tarea: pendiente.*


**Una ruta que compare el `db.schema` del tenant contra el contrato de esquema** — pedido el 2026-09-28 en `docs/MENSAJE-2026-09-28-backend-tres-del-alta.md`.

**El problema que cierra es un SILENCIO**, y es el que más encarece un alta: hoy una columna que falta hace que el panel salga `BLOCKED` **sin razón** — no dice qué columna, ni que el problema sea de esquema. Se descubre al final, después de crear todo.

**Media pieza YA EXISTE y no la conocíamos** · `GET /agents/ping` firma el JWT con las credenciales del tenant y corre `SELECT 1` contra Snowflake —medido el 2026-09-28 contra `f70cec2`: `status: ok`, 898 ms—. Eso cubre la mitad **credencial**. Y `GET /admin/tenants/{tenantId}/catalog/health`, que tampoco conocíamos, contesta **frescura de feeds por métrica**, que es otra pregunta.

Lo que falta es la mitad de **esquema**, y son dos `DESCRIBE` y una comparación de listas.


### B1.30 · sync-catalog como ruta HTTP

*Estado de la tarea: pendiente.*


**La simétrica de `materialize`** — pedido el 2026-09-28.

Medido ese día contra `f70cec2`: `POST /admin/tenants/{tenantId}/materialize` contesta **202** y `POST /admin/tenants/{tenantId}/sync-catalog` da **404**. Sólo existe `make sync-catalog TENANT_ID=<uuid>`.

**Es lo único en toda el alta que obliga a entrar a la máquina del backend.** Crear el tenant, crear el agente y materializar ya tienen ruta.


### B1.31 · La plataforma genera el par de claves del usuario de servicio

*Estado de la tarea: pendiente.*


**Que el servicio genere el par RSA y devuelva sólo la pública** — pedido el 2026-09-28.

Hoy `POST /admin/tenants` exige `private_key_pem`, así que por cada cliente **alguien genera un par a mano y transporta una clave privada** hasta donde se haga el alta. Verificado ese día: no hay `rsa.GenerateKey` en `internal/`.

**Es más fácil y además más seguro**, que es la combinación que no obliga a elegir: la privada nunca sale del servicio y lo que circula es la pública.


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


### B4.2 · GET /admin/tenants/{id}/layouts

*Estado de la tarea: parcial.*


**«Qué cambió»**, que es el tercio que queda.

**La reversión llegó** · `POST /admin/layouts/{layoutId}/revert`, medidas sus dos compuertas el 2026-09-28. **El `200` no se midió y se dice**: copia y publica, así que cambiaría el layout que la consola sirve.

**Y «quién» está pendiente de VERIFICAR, no de pedir**: dicen que vive en `GET /admin/layouts/{id}/publications` con su actor, y esa ruta responde `200` con `[]` porque la semilla publicó sin pasar por ahí. `LayoutVersion` sí se midió y trae sólo `created_at`, `dashboard_id`, `id`, `published_at`, `status`, `tenant_id`, `updated_at` y `version_id` — o sea **cuándo**.

**Lo que falta es el diff**, y es lo que B6 dibuja y no se puede construir sin él. Lo que decía el pedido original: no hay ruta de revertir ni de rollback en el router. `previous_layout_id` da con qué hacerlo y publicar el anterior con la ruta que ya existe sería el camino, pero eso es una decisión y no un hecho medido. El pedido original decía: **Autor, diferencia y reversión en `LayoutVersion`** — pedido el 2026-09-15, cuando F4.6 declaró B6.

§7.2 describe el historial de versiones en una línea: «**quién, cuándo, qué cambió. Permite revertir.** Sin esto, un error de composición en producción no tiene vuelta atrás». La respuesta de hoy trae **cuándo** y nada más.

- **Quién.** El criterio compartido de B4.2–B4.7 ya dice que publicar «registra quién publicó», así que el dato existe del lado de ustedes; lo que falta es que salga en la respuesta.
- **Qué cambió.** Contra la versión publicada anterior. No hace falta un diff estructural: alcanza con qué pestañas y qué paneles se agregaron, se quitaron o se movieron.
- **Revertir.** No hay ruta. `POST /admin/tenants/{id}/layouts` acepta un `version_id` de origen, así que puede que ya alcance con documentar que duplicar una versión vieja **es** revertir — si es así, es una línea de documentación y no código.

**No bloquea el builder**, bloquea B6. Y B6 es la pantalla que hace reversible un error de composición en producción: sin ella, la única salida es recomponer a mano.

**Medido el 2026-09-22 · autor y diff siguen faltando.** `82da946` devuelve
`{ID, TenantID, Status, VersionID, PublishedAt, CreatedAt, UpdatedAt}`. `PublishedBy`,
`PublishedByEmail` y la ruta `/admin/layouts/{layoutId}/diff` son **nuestras**, de `2fafe82`.


---

## Cómo avisar que algo llegó

No hace falta tocar este archivo. Con decirlo alcanza: el front quita el
marcador de la tarea, la desbloquea y este documento se regenera sin ese
punto. **Si un pedido sigue acá, es que sigue faltando.**

