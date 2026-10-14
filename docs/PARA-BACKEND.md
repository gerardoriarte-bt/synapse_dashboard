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

## Antes de leer: 0 de 3 son del backend

**El resto está acá porque nos frena a NOSOTROS, no porque haya que
construirlo del lado del backend.** Se listan igual —una tarea trabada
es información— pero con el dueño adelante, para no hacer perder
tiempo buscando qué implementar.


| Dueño | Pedidos |
|---|---|
| **BACKEND** · código | 0 |
| DESPLIEGUE | 2 |
| PRODUCTO | 1 |


---

## Lo que esperamos · 3 pedido(s)


### B2.12 · Correr el materializador contra datos reales y verificar los seis estados

*Estado de la tarea: parcial.* · **Lo tiene: DESPLIEGUE**


**EL CAMINO YA EXISTE · corregido el 2026-09-28 leyendo su repositorio.**

**Lo tiene: DESPLIEGUE** · depende de B2.15 · el generador de prosa está en la rama desde `5924bf2`.

**Medido contra `de881e1` el 2026-09-29** · `DD_MATERIALIZE_PROSE_ENABLED` existe con default `false` · `dd_materializer_service.go:57`.

**Medido contra `9dc481e` el 2026-10-09** · el flag sigue con default `false` (`dd_materializer_service.go:55-58`). Lo que queda es lo mismo: encenderlo, que es B2.15.

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

**Lo pedido, y ya entregado y medido.** **Una fila que NUNCA se materializó no puede servirse

**Remedido contra `9dc481e` el 2026-10-09 · ENTREGADO, con un matiz.** Llegó en `6e595e3`: `PanelDegradation` sirve `DEGRADED` una fila sin `last_success_at` **si hubo un intento fallido**. Una fila sólo-semilla **sin** intento sigue saliendo `AVAILABLE` —decisión suya, escrita: «una fila solo-seed sin intento (tenant sin Gold) NO degrada»—. No se midió en el servicio: el dashboard activo no tiene paneles de prosa.

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

**Medido contra `9dc481e` el 2026-10-09** · `/config/solicitudes` sigue sin estar en `router.go` —lo que hay es `/access-requests`, que es pedir una CUENTA, no una métrica—. `FORBIDDEN` trae `reason` y `unlocks_with` (`dd_config_service.go:384-387`), que es la mitad que ya había llegado. **Sigue siendo decisión de producto.**

**Bloquea F2.3.** Y el hueco tiene una forma concreta: el payload `FORBIDDEN` es hoy `{status, request_from}` **y nada más** —medido pidiéndole al token de `planner` los tres paneles que su rol oculta—. Sin `reason` ni `unlocks_with`, que es la gramática de §8 que los otros cinco estados sí traen.

**Así que son dos cosas y conviene no mezclarlas:** que el estado declare qué lo desbloquea, y que exista dónde pedirlo.


### B2.15 · Encender DD_MATERIALIZE_PROSE_ENABLED y avisar

*Estado de la tarea: parcial.* · **Lo tiene: DESPLIEGUE**


**Que se encienda en dev y nos avisen** — lo ofrecieron ellos en `docs/RESPUESTA-2026-09-28-cinco-que-quedan.md` §5: «lo prendemos en dev en la próxima corrida diaria… Les avisamos el día que se prenda para que puedan cerrar la tarea contra dato real».

**Lo tiene: DESPLIEGUE** · prender el flag en dev después del próximo despliegue. **Fecha, no código.**

**Medido contra `de881e1` el 2026-09-29** · `ProseGeneratorEnabledFromEnv` lee el flag con default `false`.

**Medido contra `9dc481e` el 2026-10-09** · `ProseGeneratorEnabledFromEnv` sigue leyendo el flag con default `false` (`dd_materializer_service.go:55-58`). **Si ya está encendido en dev no se ve desde el código**, y no lo medimos: sigue en pie el «avísennos».

Hasta entonces los dos paneles de prosa se sirven con el valor de la semilla, **en inglés**, y salen `DEGRADED`.


---

## Y esto frena al front · 4 tarea(s)

**No todo lo de acá es suyo**, y por eso no está arriba: son los
bloqueos que las tareas del front declaran en su título, tal cual
los escribieron. Se listan enteros **por si alguno lo es** —es más
barato que lo descarten ustedes a que se nos pase—.

Lo de arriba son pedidos; esto es información.


| Tarea | Qué la frena |
|---|---|
| **F1.42** · El mes en curso está incompleto y el selector no lo dice | el período no declara QUÉ PARTE del mes cubre |
| **F1.44** · El orden de una tabla se anuncia, no se aplica | `cut` de `series` no lo lee nadie |
| **F5.3** · Completar los plots que falten | espera a F4.17–F4.19 |
| **F5.13** · Períodos libres en el selector | espera el patrón de `PeriodoId` |


---

## Cómo avisar que algo llegó

No hace falta tocar este archivo. Con decirlo alcanza: el front quita el
marcador de la tarea, la desbloquea y este documento se regenera sin ese
punto. **Si un pedido sigue acá, es que sigue faltando.**

