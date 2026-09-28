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

*Estado de la tarea: parcial.*


**Que el `error` esté redactado y en español · queda UNA ruta, no dos.** Remedido el 2026-09-28 contra `f70cec2`: de los dos handlers crudos, el de «tab not found» se arregló —sale `pestaña no encontrada`— y los 400 de binding pasan por un traductor por campo, medido en `PUT /config/me/preferences`: `el campo 'theme' debe ser uno de: dark, light`. **`POST /config/chat` sigue volcando el validador de Go**, y su respuesta afirma lo contrario —«Nunca aparece un nombre de struct de Go ni un tag»—. Medido: `Key: 'ddChatRequest.question' Error:Field validation for 'question' failed on the 'required' tag`. **No es el anidamiento**: falla igual con un campo de primer nivel. Es por handler — `dd_chat_handler.go:52` manda `err.Error()` donde los demás mandan `BindingErrorMessage(err)`, y de 32 sitios que enlazan JSON sólo 9 pasan por el traductor. `ErrorState` lo pinta tal cual, y cae justo en la ruta de F3.15.

**Medido contra `f70cec2` el 2026-09-28** · las dos rutas contestan con el volcado del validador de Go, y `PUT /config/me/preferences` con texto redactado.

**Y SON DOS RUTAS, NO UNA** · encontrado el 2026-09-28 revisando el alta de un tenant. `POST /admin/agents` hace lo mismo: `Key: 'createAgentRequest.tenant_id' Error:Field validation for 'tenant_id' failed on the 'required' tag`. Ésa importa por otra razón — **es una ruta del ALTA de un cliente**, así que el error lo lee quien está dando de alta. `POST /admin/tenants` sí está traducida, que es la prueba de que el traductor anda y de que falta aplicarlo en esas dos.


### B1.21 · Declarar los mínimos de datos por gráfico

*Estado de la tarea: pendiente.*


**Queda `GET /config/plots`; `chart` YA LLEGÓ** · el mismo día que se pidió, en `f70cec2`. Medido el 2026-09-28 contra el servicio: sale en `DDPanelDTO.chart` y en `DDLayoutPanel.chart`, lo escribe el builder recortado y en minúsculas —`"  Waterfall  "` → `waterfall`— y los doce paneles publicados quedaron con `''`, así que no migró ningún layout. Transcripto en los dos cables y adaptado, con prueba de que **un id desconocido se pasa igual**: descartarlo haría caer el panel al gráfico por defecto sin que nadie se entere. **Lo que falta es la ruta del repertorio**, y para escribirla piden tres archivos nuestros que no están en su repo — contestado en `docs/MENSAJE-2026-09-28-backend-lo-que-piden.md`.

**Medido contra `f70cec2` el 2026-09-28** · `GET /config/plots` → **404**.

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

**Medido contra `f70cec2` el 2026-09-28** · el payload de un panel degradado trae `governance message reason status unlocks_with value` · ninguna clave de tramo.

Hoy el cable manda `reason` y `unlocks_with` como texto redactado, que sirve para la nota pero no para el cuerpo: **no dice qué tramo de la serie está vencido.**

**Lo pide el dibujo, no nosotros.** `Librería de gráficos / ESTADO · Degradado` dibuja una serie con las **dos últimas barras en `$w2`** en vez del color de familia, y su nota lo declara: «DEGRADADO NO BLOQUEA: OBLIGA A FECHAR. **LA TRAMA MARCA EL TRAMO VENCIDO**».

**Medido el 2026-09-28**: la trama existe sólo en la biblioteca y **el panel degradado de C1 no la aplica** —sus rellenos de datos son los de la familia, sin una sola barra en `$w2`—, así que ni dentro del `.pen` está puesta donde se vería.

**Alcance decidido ese día**, en `docs/PROPUESTA-2026-09-25-degradado.md`: la trama es para las **formas con eje temporal** —serie, área, forecast—; en las que no lo tienen, «obliga a fechar» lo cumple la procedencia con su frescura, que ya se pinta en los seis estados.


### B1.29 · schema-check · decir qué le falta al cliente ANTES de intentar

*Estado de la tarea: pendiente.*


**Una ruta que compare el `db.schema` del tenant contra el contrato de esquema** — pedido el 2026-09-28 en `docs/MENSAJE-2026-09-28-backend-tres-del-alta.md`.

**Medido contra `f70cec2` el 2026-09-28** · `schema-check` → **404** · y se comprobó que `GET /agents/ping` y `GET /admin/tenants/{id}/catalog/health`, que sí existen, contestan otra cosa.

**El problema que cierra es un SILENCIO**, y es el que más encarece un alta: hoy una columna que falta hace que el panel salga `BLOCKED` **sin razón** — no dice qué columna, ni que el problema sea de esquema. Se descubre al final, después de crear todo.

**Media pieza YA EXISTE y no la conocíamos** · `GET /agents/ping` firma el JWT con las credenciales del tenant y corre `SELECT 1` contra Snowflake —medido el 2026-09-28 contra `f70cec2`: `status: ok`, 898 ms—. Eso cubre la mitad **credencial**. Y `GET /admin/tenants/{tenantId}/catalog/health`, que tampoco conocíamos, contesta **frescura de feeds por métrica**, que es otra pregunta.

Lo que falta es la mitad de **esquema**, y son dos `DESCRIBE` y una comparación de listas.


### B1.30 · sync-catalog como ruta HTTP

*Estado de la tarea: pendiente.*


**La simétrica de `materialize`** — pedido el 2026-09-28.

**Medido contra `f70cec2` el 2026-09-28** · `sync-catalog` → **404** · su hermana `materialize` → **202**.

Medido ese día contra `f70cec2`: `POST /admin/tenants/{tenantId}/materialize` contesta **202** y `POST /admin/tenants/{tenantId}/sync-catalog` da **404**. Sólo existe `make sync-catalog TENANT_ID=<uuid>`.

**Es lo único en toda el alta que obliga a entrar a la máquina del backend.** Crear el tenant, crear el agente y materializar ya tienen ruta.


### B1.31 · La plataforma genera el par de claves del usuario de servicio

*Estado de la tarea: pendiente.*


**Que el servicio genere el par RSA y devuelva sólo la pública** — pedido el 2026-09-28.

**Medido contra `f70cec2` el 2026-09-28** · sin un solo `rsa.GenerateKey` en `internal/`.

Hoy `POST /admin/tenants` exige `private_key_pem`, así que por cada cliente **alguien genera un par a mano y transporta una clave privada** hasta donde se haga el alta. Verificado ese día: no hay `rsa.GenerateKey` en `internal/`.

**Es más fácil y además más seguro**, que es la combinación que no obliga a elegir: la privada nunca sale del servicio y lo que circula es la pública.


### B1.32 · Declarar qué es cut en una serie

*Estado de la tarea: pendiente.*


**Confirmar que `cut` lo aplica el FRONT** — el pedido se afinó el 2026-09-28 leyendo su código, y quedó mucho más chico de lo que iba a ser.

**Medido contra `f70cec2` el 2026-09-28** · `cut` aparece en su semilla con `day` y `month`, y **ningún consumidor** en `internal/core/`.

**Lo que se averiguó solo:** su semilla ya muestra el vocabulario —`{"cut": "day"}` y `{"cut": "month"}` en `dd_seed.go:113`— y `dd_seed_blocks.go:44` lo declara como `layout_param` del bloque `series` junto a `normalization`. **Y nadie lo lee**: `grep` sobre `internal/core/` no encuentra un solo consumidor de `cut` ni de `normalization` fuera de la semilla.

**Así que la pregunta ya no es qué significa, sino si son sólo esos dos valores.**

**Bloquea F1.44**, que es un defecto visible: el orden de una tabla **se anuncia y no se aplica**. Hoy el panel dice cómo está ordenado y no lo está, que es peor que no decirlo.


### B2.12 · Correr el materializador contra datos reales y verificar los seis estados

*Estado de la tarea: parcial.*


**EL CAMINO YA EXISTE · corregido el 2026-09-28 leyendo su repositorio.**

**Medido contra `f70cec2` el 2026-09-28** · `DD_MATERIALIZE_PROSE_ENABLED` existe con default `false` · `dd_materializer_service.go:57`.

Esto decía «los paneles de prosa los genera el AGENTE, y hoy no hay camino», y era
cierto cuando se escribió. **Lo construyeron:** `internal/core/services/dd_prose_generator.go`
implementa `DDProseGenerator`, `bootstrap/app.go:155` lo cablea al materializador
—«Fase 6: prosa por agente»— y queda detrás de `DD_MATERIALIZE_PROSE_ENABLED`,
cuyo default es `false` · `dd_materializer_service.go:57`.

**Así que lo que queda de este pedido es encender el flag**, que es `B2.15`, más
la pregunta abierta de con qué se provoca `ERROR`. Lo de abajo se conserva porque
es el razonamiento de producto que lo originó y sigue valiendo.

Decidido el 2026-09-24 por producto: `executive_summary` y `decisions`
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


### B4.18 · roles.tab_keys · que una restricción de rol sobreviva a publicar

*Estado de la tarea: pendiente.*


**Lo propusieron ellos y les dijimos que sí** · `docs/RESPUESTA-2026-09-28-cinco-que-quedan.md` y nuestra respuesta del mismo día. Está sin tomar de su lado.

**Medido contra `f70cec2` el 2026-09-28** · sin una sola aparición de `tab_keys` en `internal/`.

**El defecto que cierra:** `roles.tab_ids` apunta a `dd_tabs.id`, y **ese id se recrea en cada versión de layout**. Así que un rol restringido a dos pestañas **las pierde al publicar**. `key` ya viaja —medido el 2026-09-28: `overview`— y es estable por diseño.


### B2.14 · /config/solicitudes · pedir acceso a una métrica que no se ve

*Estado de la tarea: pendiente.*


**La ruta no existe** · medido el 2026-09-28: `GET /config/solicitudes` da **404**.

**Medido contra `f70cec2` el 2026-09-28** · `GET /config/solicitudes` → **404** · y el payload `FORBIDDEN` es `{status, request_from}` y nada más.

**Bloquea F2.3.** Y el hueco tiene una forma concreta: el payload `FORBIDDEN` es hoy `{status, request_from}` **y nada más** —medido pidiéndole al token de `planner` los tres paneles que su rol oculta—. Sin `reason` ni `unlocks_with`, que es la gramática de §8 que los otros cinco estados sí traen.

**Así que son dos cosas y conviene no mezclarlas:** que el estado declare qué lo desbloquea, y que exista dónde pedirlo.


### B2.15 · Encender DD_MATERIALIZE_PROSE_ENABLED y avisar

*Estado de la tarea: pendiente.*


**Que se encienda en dev y nos avisen** — lo ofrecieron ellos en `docs/RESPUESTA-2026-09-28-cinco-que-quedan.md` §5: «lo prendemos en dev en la próxima corrida diaria… Les avisamos el día que se prenda para que puedan cerrar la tarea contra dato real».

**Medido contra `f70cec2` el 2026-09-28** · `ProseGeneratorEnabledFromEnv` lee el flag con default `false`.

Hasta entonces los dos paneles de prosa se sirven con el valor de la semilla, **en inglés**, y salen `DEGRADED`.


---

## Y esto frena al front · 11 tarea(s)

**No todo lo de acá es suyo**, y por eso no está arriba: son los
bloqueos que las tareas del front declaran en su título, tal cual
los escribieron. Se listan enteros **por si alguno lo es** —es más
barato que lo descarten ustedes a que se nos pase—.

Lo de arriba son pedidos; esto es información.


| Tarea | Qué la frena |
|---|---|
| **F1.31** · Registro de gráficos y verificación de mínimos | `/config/plots` da 404 |
| **F1.42** · El mes en curso está incompleto y el selector no lo dice | el período no declara QUÉ PARTE del mes cubre |
| **F1.44** · El orden de una tabla se anuncia, no se aplica | falta qué es `cut` en `series` |
| **F2.3** · SIN_PERMISO · B0.9 (línea 1171) contestada | `/config/solicitudes` da 404 |
| **F4.21** · Selector de gráfico en el builder | `/config/plots` da 404 |
| **F4.17** · ComparisonBody + ComparePlot | ninguna métrica declara `categoricaComparada` |
| **F4.18** · MatrixBody + HeatmapPlot | ninguna métrica declara `matriz` |
| **F4.19** · GraphBody + GraphPlot | ninguna métrica declara `grafo` ni `flujo` |
| **F4.20** · Registrar los tres con carga diferida | espera a F4.17–F4.19 |
| **F5.3** · Completar los plots que falten | espera a F4.17–F4.19 |
| **F5.13** · Períodos libres en el selector | espera el patrón de `PeriodoId` |


---

## Cómo avisar que algo llegó

No hace falta tocar este archivo. Con decirlo alcanza: el front quita el
marcador de la tarea, la desbloquea y este documento se regenera sin ese
punto. **Si un pedido sigue acá, es que sigue faltando.**

