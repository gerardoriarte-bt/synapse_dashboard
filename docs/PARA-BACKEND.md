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

## Antes de leer: 0 de 7 son del backend

**El resto está acá porque nos frena a NOSOTROS, no porque haya que
construirlo del lado del backend.** Se listan igual —una tarea trabada
es información— pero con el dueño adelante, para no hacer perder
tiempo buscando qué implementar.


| Dueño | Pedidos |
|---|---|
| **BACKEND** · código | 0 |
| NOSOTROS | 2 |
| DATOS | 2 |
| DESPLIEGUE | 2 |
| PRODUCTO | 1 |


---

## Lo que esperamos · 7 pedido(s)


### B1.21 · Declarar los mínimos de datos por gráfico

*Estado de la tarea: pendiente.* · **Lo tiene: NOSOTROS**


**Queda `GET /config/plots`; `chart` YA LLEGÓ** · el mismo día que se pidió, en `f70cec2`. Medido el 2026-09-28 contra el servicio: sale en `DDPanelDTO.chart` y en `DDLayoutPanel.chart`, lo escribe el builder recortado y en minúsculas —`"  Waterfall  "` → `waterfall`— y los doce paneles publicados quedaron con `''`, así que no migró ningún layout. Transcripto en los dos cables y adaptado, con prueba de que **un id desconocido se pasa igual**: descartarlo haría caer el panel al gráfico por defecto sin que nadie se entere. **Lo que falta es la ruta del repertorio**, y para escribirla piden tres archivos nuestros que no están en su repo — contestado en `docs/MENSAJE-2026-09-28-backend-lo-que-piden.md`.

**Lo tiene: NOSOTROS** · mandarles `docs/ENTREGA-2026-09-29-repertorio-de-graficos.md`. **Lo pidieron dos veces**, y las dos se les contestó con una ruta de NUESTRO repositorio, que no ven.

**Medido contra `de881e1` el 2026-09-29** · `GET /config/plots` → **404**.

**NUESTRA MITAD ESTÁ HECHA** · 2026-09-26, y **el repertorio entero desde el 2026-09-28**: `docs/REPERTORIO-2026-09-28-los-49-graficos.md`. El orden que habíamos propuesto era «1. el front declara los mínimos y los propone en el contrato · 2. el backend los sirve». **El paso 1 está**: el contrato declara `GET /config/plots`, `Grafico` y `MinimoDeDatos`, y la tabla que hay que implementar está en `docs/DECISIONES-2026-09-26-minimos-por-grafico.md`.

**La decisión de estructura, que es lo que más va a durar: el mínimo es de la FORMA, y un gráfico lo SUBE sólo si su geometría lo exige.** Es la simetría de `tope`, que baja el techo por gráfico. Un número elegido a mano para cada una de las 49 entradas serían 49 juicios, y la mayoría arbitrarios: `bars` y `lollipop` comen el mismo dato y fallan en el mismo punto.

Sólo tres suben el de su forma —`treemap`, `pareto` y `waterfall`, a 3— y están marcados aparte porque son juicio y no geometría.

**Y la razón se PINTA.** `MinimoDeDatos` la declara obligatoria: un panel que se apaga sin decir por qué manda a buscar un error donde hay una regla.

**Los tres mínimos que ya estaban escritos** en el criterio de abajo —«una serie de un punto, una composición de una parte y un ranking de dos ítems»— se respetaron, y de ahí sale que `ranking` sea 3 y no 2.

**Espera del backend.** **Servir `GET /config/plots`** con la tabla del documento, con la misma figura que `/config/blocks`: global, no por tenant. Medido el 2026-09-26: **404**. Bloquea F1.31 y F4.21.

**Lo tiene: NOSOTROS** · mandarles `docs/ENTREGA-2026-09-29-repertorio-de-graficos.md`. **Lo pidieron dos veces**, y las dos se les contestó con una ruta de NUESTRO repositorio, que no ven.

**NO depende de Snowflake.** No toca datos: es una tabla de reglas y un endpoint.

**Sirve desde el primer día aunque haya un gráfico por tipo**, que es por qué está en Fase 1 y no en Fase 4: hoy nada impide que `bars` reciba un ítem y dibuje una barra sola.


### B1.29 · schema-check · decir qué le falta al cliente ANTES de intentar

*Estado de la tarea: parcial.* · **Lo tiene: DATOS**


**Una ruta que compare el `db.schema` del tenant contra el contrato de esquema** — pedido el 2026-09-28 en `docs/MENSAJE-2026-09-28-backend-tres-del-alta.md`.

**Lo tiene: DATOS** · habilitar la IP de salida en Snowflake. **La ruta está entregada** y ellos la midieron desde su red con `200`.

**Medido contra `de881e1` el 2026-09-29** · `schema-check` → **404** · y se comprobó que `GET /agents/ping` y `GET /admin/tenants/{id}/catalog/health`, que sí existen, contestan otra cosa.

**LA RUTA LLEGÓ EL 2026-09-29 · en `e1037d9`. Queda en ⚠️ y no en ✅ por una razón que NO es suya: Snowflake nos bloquea la IP.**

```
GET /admin/tenants/{id}/schema-check   → 502
  "snowflake sql: status 401: 390422 · Incoming request with IP/Token
   190.27.36.15 is not allowed to access Snowflake"
```

**La ruta responde; lo que no llega es Snowflake.** Es el mismo bloqueo que datos levantó el 2026-09-24 para que el chat funcionara — la IP de salida cambió desde entonces.

**Así que la FORMA de la respuesta sigue sin medirse**, y eso es lo que falta para cerrarla: sin ver su cuerpo no sabemos si trae `afecta` y `claves_sin_query`, que eran los dos campos que la volvían valiosa.

**Se pide a datos**, no al backend · `docs/MENSAJE-2026-09-29-datos-habilitar-ip.md`, mandado el 2026-09-29.

**Y el pedido lleva una pregunta de fondo, porque la IP ya cambió una vez:** el 2026-09-24 Snowflake veía `201.244.209.190` —la habilitaron y el chat funcionó— y hoy ve `190.27.36.15`. **Cinco días, dos direcciones.** Habilitar ésta desbloquea hoy y es razonable esperar que vuelva a cortar.

**Un detalle que hace perder una tarde si no se sabe:** la salida a Snowflake **no es la misma que la salida general**. En el mismo instante, Snowflake ve `190.27.36.15` y un «cuál es mi IP» genérico ve `186.31.4.152`. **La única que sirve es la que Snowflake reporta en el error** — habilitar la otra no funciona y parece que la política no se aplicó.

**El problema que cierra es un SILENCIO**, y es el que más encarece un alta: hoy una columna que falta hace que el panel salga `BLOCKED` **sin razón** — no dice qué columna, ni que el problema sea de esquema. Se descubre al final, después de crear todo.

**Media pieza YA EXISTE y no la conocíamos** · `GET /agents/ping` firma el JWT con las credenciales del tenant y corre `SELECT 1` contra Snowflake —medido el 2026-09-28 contra `f70cec2`: `status: ok`, 898 ms—. Eso cubre la mitad **credencial**. Y `GET /admin/tenants/{tenantId}/catalog/health`, que tampoco conocíamos, contesta **frescura de feeds por métrica**, que es otra pregunta.

Lo que falta es la mitad de **esquema**, y son dos `DESCRIBE` y una comparación de listas.


### B1.30 · sync-catalog como ruta HTTP

*Estado de la tarea: parcial.* · **Lo tiene: DATOS**


**La simétrica de `materialize`** — pedido el 2026-09-28.

**Lo tiene: DATOS** · habilitar la IP de salida en Snowflake. **La ruta está entregada.**

**Medido contra `de881e1` el 2026-09-29** · `sync-catalog` → **404** · su hermana `materialize` → **202**.

**LA RUTA LLEGÓ EL 2026-09-29 · en `e1037d9`.** `POST /admin/tenants/{id}/sync-catalog` ya no da 404: contesta **502** por el mismo bloqueo de IP de Snowflake que B1.29, o sea que **llegó hasta intentar la consulta**.

**Queda en ⚠️ hasta poder correrla de verdad.** Con eso, el alta de un cliente deja de necesitar acceso a la máquina del backend — que era todo el punto.

Medido ese día contra `f70cec2`: `POST /admin/tenants/{tenantId}/materialize` contesta **202** y `POST /admin/tenants/{tenantId}/sync-catalog` da **404**. Sólo existe `make sync-catalog TENANT_ID=<uuid>`.

**Es lo único en toda el alta que obliga a entrar a la máquina del backend.** Crear el tenant, crear el agente y materializar ya tienen ruta.


### B1.31 · La plataforma genera el par de claves del usuario de servicio

*Estado de la tarea: parcial.* · **Lo tiene: NOSOTROS**


**Que el servicio genere el par RSA y devuelva sólo la pública** — pedido el 2026-09-28.

**Lo tiene: NOSOTROS** · probar la rotación en el próximo alta real. **La ruta está entregada** y su guarda se midió.

**Medido contra `de881e1` el 2026-09-29** · sin un solo `rsa.GenerateKey` en `internal/`.

**LLEGÓ EL 2026-09-29 · en `e1037d9`.** `POST /admin/tenants/{id}/service-key` existe, y **su guarda es lo mejor que trae**:

```
→ 409 CONFLICT_KEY_EXISTS
  "el tenant ya tiene una clave de servicio; enviá rotate=true para reemplazarla"
```

**No pisa una clave que funciona.** En este tenant la clave es la real —la que hace andar el chat contra Cortex—, así que **no se probó la rotación a propósito**: rotarla habría roto el entorno para comprobar algo que la guarda ya demuestra.

**Queda en ⚠️ porque la forma de la respuesta con éxito no se midió**: haría falta un tenant sin clave. Se cierra con el próximo alta real, que es cuando importa.

Hoy `POST /admin/tenants` exige `private_key_pem`, así que por cada cliente **alguien genera un par a mano y transporta una clave privada** hasta donde se haga el alta. Verificado ese día: no hay `rsa.GenerateKey` en `internal/`.

**Es más fácil y además más seguro**, que es la combinación que no obliga a elegir: la privada nunca sale del servicio y lo que circula es la pública.


### B2.12 · Correr el materializador contra datos reales y verificar los seis estados

*Estado de la tarea: parcial.* · **Lo tiene: DESPLIEGUE**


**EL CAMINO YA EXISTE · corregido el 2026-09-28 leyendo su repositorio.**

**Lo tiene: DESPLIEGUE** · depende de B2.15 · el generador de prosa está en la rama desde `5924bf2`.

**Medido contra `de881e1` el 2026-09-29** · `DD_MATERIALIZE_PROSE_ENABLED` existe con default `false` · `dd_materializer_service.go:57`.

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

**Lo tiene: DESPLIEGUE** · depende de B2.15 · el generador de prosa está en la rama desde `5924bf2`.
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


### B2.14 · /config/solicitudes · pedir acceso a una métrica que no se ve

*Estado de la tarea: pendiente.* · **Lo tiene: PRODUCTO**


**La ruta no existe** · medido el 2026-09-28: `GET /config/solicitudes` da **404**.

**Lo tiene: PRODUCTO** · decidir si existe una ruta de solicitud. **La mitad que nos bloqueaba llegó**: el estado ya declara razón y desbloqueo, así que F2.3 se puede construir sin CTA.

**Medido contra `de881e1` el 2026-09-29** · `GET /config/solicitudes` → **404** · y el payload `FORBIDDEN` es `{status, request_from}` y nada más.

**Bloquea F2.3.** Y el hueco tiene una forma concreta: el payload `FORBIDDEN` es hoy `{status, request_from}` **y nada más** —medido pidiéndole al token de `planner` los tres paneles que su rol oculta—. Sin `reason` ni `unlocks_with`, que es la gramática de §8 que los otros cinco estados sí traen.

**Así que son dos cosas y conviene no mezclarlas:** que el estado declare qué lo desbloquea, y que exista dónde pedirlo.


### B2.15 · Encender DD_MATERIALIZE_PROSE_ENABLED y avisar

*Estado de la tarea: pendiente.* · **Lo tiene: DESPLIEGUE**


**Que se encienda en dev y nos avisen** — lo ofrecieron ellos en `docs/RESPUESTA-2026-09-28-cinco-que-quedan.md` §5: «lo prendemos en dev en la próxima corrida diaria… Les avisamos el día que se prenda para que puedan cerrar la tarea contra dato real».

**Lo tiene: DESPLIEGUE** · prender el flag en dev después del próximo despliegue. **Fecha, no código.**

**Medido contra `de881e1` el 2026-09-29** · `ProseGeneratorEnabledFromEnv` lee el flag con default `false`.

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

