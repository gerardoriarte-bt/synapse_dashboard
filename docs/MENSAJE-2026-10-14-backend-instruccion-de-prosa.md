# Para el equipo de backend · la prosa por card: cada panel con su propia instrucción · 2026-10-14

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `3651d70` el 2026-10-14**: `dd_prose_generator.go`,
`dd_materializer_service.go`, `snowflake/queries.go`, `snowflake/keys.go` y
`router.go` leídos, y en la base local el índice de `dd_panel_data`. Del lado del
front medimos lo nuestro primero: el texto explicativo escrito a mano ya se
resolvió sin pedirles nada (abajo).

Hola. Producto quiere que los paneles de prosa digan algo útil de **cada** tema,
y no sólo el resumen y las decisiones del mes. La idea es que cada card de prosa
tenga **su propia instrucción**: «explicá qué movió el ROAS de Meta», «resumí el
riesgo de inventario». Les contamos qué encontramos y qué haría falta.

---

## Lo que hay hoy

**La prosa por agente ya existe, y anda.** Con `DD_MATERIALIZE_PROSE_ENABLED`, al
materializar un período el backend llama al agente de Cortex una vez por panel de
prosa y guarda un titular y de dos a cuatro puntos. Lo probamos el 2026-09-29 y
salió en español con las cifras del período.

**Pero no es por card, por tres razones que están en el código:**

1. **La instrucción está fija en Go.** `BuildProsePrompt` elige entre dos textos
   con un `switch` sobre la clave: `month_decisions` («qué mover, qué frenar y qué
   vigilar») o, si no, el resumen ejecutivo («qué pasó con ventas, inversión y
   eficiencia»). No hay dónde escribir otra.
2. **Sólo dos métricas reciben prosa.** El materializador la genera si la clave
   está en `MetricRegistry` con forma `prose` (`dd_materializer_service.go:133`),
   y ahí sólo están `exec_resumen` y `month_decisions` (`queries.go:236` y
   `:242`). Una métrica de prosa nueva en el catálogo quedaría sin redactar.
3. **El texto se guarda por métrica, no por panel.** `dd_panel_data` tiene índice
   único `(tenant_id, metric_id, period)`, medido en la base local. Dos cards con
   la misma métrica muestran el mismo texto.

Y el contexto que recibe el agente son **sólo los KPI del mes** —actual, anterior
y el mismo mes del año pasado—, con la regla «usá solo las cifras del contexto».
Para hablar del ROAS de Meta no le alcanza.

**Algo que urge, aparte de todo lo anterior:** con `3651d70` desplegado, la semilla
de `executive_summary` y `decisions` pasa a `BLOCKED`. **Si la prosa no está
encendida en QA, esos dos paneles de UA quedan bloqueados.**

## Lo que pedimos

**La forma que proponemos** sigue la regla de siempre —un panel se ancla a una
métrica— y por eso la instrucción va **en la métrica de prosa**: cada card
distinta es una métrica de prosa distinta, con su instrucción.

1. **Encender `DD_MATERIALIZE_PROSE_ENABLED` en QA.** Es lo único que no espera a
   nada, y evita que UA pierda sus dos paneles de prosa.
2. **Una instrucción por métrica de prosa.** Un campo de texto —`prose_instruction`
   o el nombre que prefieran— que `BuildProsePrompt` use en lugar del `switch`. Si
   viene vacío, se usa el texto de hoy según la clave, así que las dos existentes
   no cambian.
3. **Que cualquier métrica de forma `prose` del catálogo reciba prosa**, y no sólo
   las dos registradas en Go. Con eso dar de alta una card de prosa nueva es una
   fila del catálogo y una instrucción, sin tocar código.
4. **Que el agente pueda consultar sus datos para esa card**, dentro del período,
   y no sólo leer los KPI del contexto. Las reglas que ya tiene siguen valiendo:
   no inventar cifras y no nombrar tablas ni columnas.
5. **Una ruta para editar la instrucción desde administración.** En `design.md`
   los campos editoriales de una métrica son de Synapse y la sincronización no los
   toca, pero hoy no hay ninguna ruta para editar el catálogo. Ustedes deciden si
   es una ruta para la instrucción o una para los campos editoriales en general.

**Una pregunta que decide el punto 3:** ¿una métrica de prosa nueva se da de alta
como fila de la vista de Snowflake —la cura datos, igual que hoy
`executive_summary`— o desde administración? Nos sirven las dos; la segunda deja
que producto cree cards sin pasar por datos.

## Lo que hicimos de nuestro lado, sin pedirles nada

**El texto explicativo escrito a mano ya está**, con la `note` del panel que
sirven desde el 2026-09-28. Se escribe en el builder y se ve en la consola bajo el
título, y entera en el ícono de información. **Guardar desde el builder la
borraba**: no la mandábamos en el `PUT`, y ustedes guardan la que llega. Ya está
corregido.

Así que la prosa generada y la nota escrita conviven: la nota dice cómo leer el
panel, y la prosa dice qué pasó este mes.

## Lo que NO medimos

- Si el agente, con permiso para consultar, respeta el formato JSON que
  `ParseProseResponse` espera. Hoy contesta bien porque sólo lee el contexto.
- Cuánto tarda la materialización con más cards de prosa: es una llamada a Cortex
  por card y por período.

Gracias.
