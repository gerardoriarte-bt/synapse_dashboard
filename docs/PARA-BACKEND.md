# Lo que el front necesita del backend

**2026-09-04.** Todo lo que hoy bloquea trabajo del front, en un solo lugar, con
el bloque de yaml listo para pegar donde corresponde.

**Si solo van a leer una cosa, que sea el punto 0**: el contrato no tiene admin
ni builder, y eso bloquea la fase más grande que queda. Los once puntos que le
siguen son campos sueltos; ese es una superficie entera.

**Cómo leerlo.** Está ordenado por esfuerzo de ustedes, no por importancia: lo
primero son transcripciones de decisiones ya tomadas, después decisiones de una
línea, y al final lo que necesita conversación. Cada punto dice **qué falta, por
qué bloquea y qué desbloquea**.

**Nada de esto está esperando código del front.** Todo lo que se podía construir
sin la respuesta ya está construido, probado y en verde. Donde faltaba un campo,
el front **no inventó una forma**: dejó la tarea bloqueada y lo anotó acá. Esa es
una regla del proyecto, y la razón es concreta — una forma inventada en el front
se descubre en integración y no en compilación.

---

## De un vistazo

| # | Qué falta | Esfuerzo | Desbloquea |
|---|---|---|---|
| **0** | **El contrato entero de admin y builder** | Grande · es una superficie, no un campo | **Las 21 tareas de Fase 4**, F5.1, F5.2 |
| **1** | `ContextoDePanel` y `periodo` en `POST /config/chat` | Transcribir · ya está decidido | F3.2, F3.3 |
| **2** | `tenant.zonaHoraria` | Transcribir · decidido el 2026-09-04 | F1.13b |
| **3** | El patrón de `PeriodoId` | Transcribir · decidido el 2026-09-04 | F5.13 |
| **4** | `DatoDeRespuesta.tipo` | Una línea, una decisión | F3.6 |
| **5** | Panel y período en `HiloResumen` | Una línea, va con la 1 | La mitad de F3.7 |
| **6** | `versionModeloSemantico` sigue en `nullable: true` | Una línea | Nada · limpieza |
| **7** | `paramsDisponibles` con tipos y valores | Diseño de esquema | Borra una tabla duplicada |
| **8** | Taxonomía de `error.codigo` | **Revisión** · hay propuesta | Ramificar por tipo de error |
| **9** | El servicio de `/config/solicitudes` | Servicio, no contrato | F2.3 |
| **10** | Seed determinista · B1.16 y B1.20 | Ya está en el plan | F1.25 |
| **11** | Mínimos por gráfico · B1.21 | Ya está en el plan | F1.31 |

Y **dos que decide producto**, no ustedes, pero que les van a llegar como campos:
`locale` y moneda en `Contexto`, y `orden` en `PanelConfigurado`.

---

# 0 · Lo más grande, y hoy no está dicho en ninguna parte

## El contrato no tiene ni una línea de admin ni de builder

`contracts/synapse-api.yaml` declara **catorce endpoints y los catorce son
`/config/*`**: consola, chat y decisiones.

```
/config/me              /config/chat                /config/solicitudes
/config/catalog         /config/chat/hilos          /config/me/preferencias
/config/blocks          /config/chat/hilos/{id}     /config/panels:batch
/config/tabs/{tabId}    /config/decisiones          /config/decisiones/{id}
                        /config/accionables         /config/accionables/{id}/respuesta
```

**Ninguno de `/admin/*`.** Y la palabra `layouts` no aparece en el yaml.

El plan sí tiene las tareas —**B4.1 a B4.16**, con `GET /admin/tenants`,
`GET /admin/tenants/{id}/layouts`, `POST .../layouts` para el borrador,
`PUT /admin/layouts/{id}`, `POST /admin/layouts/{id}/publish`,
`POST /admin/layouts/{id}/validate`, el CRUD de roles y el preview por rol—.
Están escritas y ninguna llegó al contrato.

**Qué bloquea, y por qué esto es de otro orden que los once puntos de abajo:**

- **Las 21 tareas de la Fase 4.** Admin y builder son *lo genuinamente nuevo* —v2
  no tiene una sola línea de las dos superficies— y el documento de arquitectura
  las estima en **3–4 semanas de front**. Es el bloque de trabajo más grande que
  queda en todo el proyecto.
- **F5.1 y F5.2**, el selector de layout. `Contexto` no declara `layouts`, así
  que el front no puede saber si un tenant tiene más de uno.

**El front ya está preparado y eso hace el hueco más visible.** `useTab(tabId,
layoutId)` y el `?layoutId=` del cliente están escritos desde F1.2, esperando un
parámetro que el contrato nunca declaró. `catalog/blocks.ts` tiene los
validadores de composición —`acceptsShape`, `spanInRange`, `invalidReason`, que
devuelve la razón en la lengua del producto— listos para el builder.

**No pedimos que se implemente el servicio: pedimos el contrato.** Con los
endpoints declarados en el yaml, el front construye las dos superficies contra
MSW, que es exactamente como se construyeron la consola entera y el chat. El
servicio puede llegar después; hoy no podemos ni empezar.

**Sugerencia de orden**, si sirve: primero `GET /admin/tenants` y
`GET /admin/tenants/{id}/layouts` —con eso arranca F4.1 y F4.2—, después el
borrador y el `PUT`, y `validate` y `publish` al final. El builder se puede
construir de a poco; el admin no arranca sin los dos primeros.

---

# A · Decidido y escrito · solo falta transcribirlo al yaml

Estos tres no necesitan que nadie piense. La decisión está tomada y anotada; lo
que falta es que entre al contrato, que es su casa.

## 1 · `ContextoDePanel` y `periodo` en `POST /config/chat`

**Ya está decidido, y no por nosotros.** `nuevo-desarrollo.md:684` —que es
**normativo** en la cadena de autoridad— declara los doce campos, y la línea 146
declara el cuerpo del POST como `{ pregunta, contextoPanel, periodo, hiloId? }`.

Hoy el yaml acepta `pregunta`, `tabId` y `hiloId`, y **nada más**: no hay campo
por donde mandar desde qué panel se pregunta. `tabId` no está de más —se agregó
después y es de donde salen las `chatSugerencias`—, los tres conviven.

**Por qué `periodo` importa tanto como el contexto:** la cifra que el agente
responde depende del período. Sin él, la respuesta y el panel pueden estar
hablando de meses distintos y nada en pantalla lo delata.

En el `requestBody` de `POST /config/chat`, junto a `tabId`:

```yaml
                contextoPanel:
                  $ref: '#/components/schemas/ContextoDePanel'
                periodo:
                  $ref: '#/components/schemas/PeriodoId'
```

Y el esquema, en `components/schemas`:

```yaml
    ContextoDePanel:
      type: object
      description: |
        Desde qué panel se pregunta. Declarado en `nuevo-desarrollo.md` §
        «Contexto que el front envía»; entra al contrato para que sea una sola
        fuente.

        **Nunca lleva SQL.** El agente recibe el contexto de la métrica, no la
        consulta del panel.
      required:
        [panelId, metricId, metricKey, nombre, base, fuente, capa, familia, periodo, tipo]
      properties:
        panelId:   { type: string }
        metricId:  { type: string }
        metricKey: { type: string }
        nombre:    { type: string }
        base:      { type: string }
        fuente:    { type: string }
        capa:      { $ref: '#/components/schemas/Capa' }
        familia:   { $ref: '#/components/schemas/Familia' }
        periodo:   { $ref: '#/components/schemas/PeriodoId' }
        tipo:      { $ref: '#/components/schemas/TipoPanel' }
        valorActual:
          type: [string, number, 'null']
          description: Resumen opcional para el agente.
        dimensionesDisponibles:
          type: array
          items: { type: string }
```

- **Desbloquea** · F3.2 (construir el contexto al abrir) y la mitad de F3.3
- **Del lado del front ya está listo** · `useChat` toma el contexto y lo manda;
  hoy solo pasa `tabId` porque es lo único que el contrato acepta

## 2 · `tenant.zonaHoraria`

**Decisión del 2026-09-04 (humano): la zona horaria es del TENANT, una sola,
aunque el tenant tenga tiendas en varios países.** Todo se alinea con el tenant
de la consulta.

**Son dos zonas horarias distintas y conviene que se llamen distinto**, porque
confundirlas es el bug que este campo viene a prevenir:

| | De quién | Para qué |
|---|---|---|
| **Corte del dato** | **Del tenant** | Dónde empieza y termina el día del negocio. Entra en la cifra |
| **Presentación** | Del navegador | «HACE 3 H», el agrupado HOY/ESTA SEMANA del riel de hilos |

Si la zona del **dato** saliera del navegador, el mismo panel mostraría cifras
distintas a dos personas: «ventas de hoy» sería un número en Ciudad de México y
otro en Baltimore. Una cifra que cambia según quién la mira no es auditable, y
`base` deja de significar algo.

La de **presentación** ya funciona con el huso del navegador y el contrato la
sanciona explícitamente para el riel de hilos —«depende del huso del usuario»—,
así que no hay que declararla.

En `Contexto.tenant`, junto a `vertical`:

```yaml
            zonaHoraria:
              type: string
              description: |
                IANA. **Dónde empieza el día del negocio de este tenant**, y por
                lo tanto cómo se cortan día, semana y mes en toda cifra.

                Es del tenant y es UNA, aunque el tenant tenga tiendas en varios
                países (decisión del 2026-09-04, humano). Con la zona del
                navegador, el mismo panel mostraría números distintos a dos
                personas y `base` dejaría de significar algo.

                NO es la zona de presentación: «HACE 3 H» y el agrupado del riel
                de hilos salen del huso del navegador y no de acá.
              examples: ['America/Mexico_City']
```

- **Desbloquea** · la mitad de F1.13b
- **Lo que NO cierra** · la moneda. Un tenant multi-país vende en más de una, y
  sumarlas necesita moneda de reporte, tipo de cambio y fecha de corte. Es otro
  problema y sigue abierto

## 3 · El patrón de `PeriodoId`

**Decisión del 2026-09-04 (humano): se va con manejo de períodos libres.** El
usuario elige un rango y la consola lo contesta.

El patrón de hoy no lo permite — y **se contradice con el propio contrato en dos
lugares**, así que esto es además una corrección:

```
pattern: ^\d{4}-(0[1-9]|1[0-2]|W\d{2})$

  2026-07     acepta        2026-07-15   RECHAZA
  2026-W32    acepta        2026-Q3      RECHAZA
```

- **`grano` declara `[dia, semana, mes]`** y su propia descripción dice que el
  front deduce «`2026-07-15` día». El patrón rechaza los días. El front ya
  maneja `dia`; el contrato no deja que llegue.
- Esa misma descripción justifica que `grano` exista diciendo «deducir del id es
  frágil en cuanto aparezca un período con nombre propio (un trimestre, una
  temporada)» — y el patrón rechaza exactamente eso.

**Relajar el patrón, no agregar un campo.** `periodo` ya es una clave única que
atraviesa el batch, la clave de caché, los payloads y el hilo del chat. Un
`rango: {desde, hasta}` en paralelo obligaría a cada consumidor a entender dos
formas de decir «cuándo».

```yaml
    PeriodoId:
      type: string
      description: |
        Clave absoluta, nunca relativa: `2026-07` y no `actual`. Con clave
        relativa el selector de período obliga a reconstruir el índice.

        Cinco formas: mes, semana ISO, trimestre, día, y rango libre
        `desde_hasta` con los dos extremos inclusive.
      pattern: '^\d{4}-(0[1-9]|1[0-2]|W(0[1-9]|[1-4]\d|5[0-3])|Q[1-4]|(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(_\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))?)$'
      examples: ['2026-07', '2026-W32', '2026-Q3', '2026-07-15', '2026-07-01_2026-07-17']
```

**De paso acota dos cosas que el patrón viejo dejaba pasar**: el día queda en
01–31 y la semana ISO en 01–53. Antes `W\d{2}` aceptaba `2026-W99`. Probado
contra 25 casos, 11 que tienen que entrar y 14 que no.

**Un rango libre declara `grano: dia`. No hace falta un valor nuevo en el
enum** — un rango se corta en días, así que una métrica con `granoMinimo: 'mes'`
no lo puede contestar, y el selector del front **ya** deshabilita eso con la
razón visible. Esa lógica está escrita desde F1.7 y no hay que tocarla.

- **Desbloquea** · F5.13
- **El costo real de esta decisión es de ustedes** · los períodos de hoy son
  snapshots materializados —`estado: 'MTD CERRADO'`, `'CERRADO'`— y un rango
  arbitrario hay que calcularlo a demanda, con lo que implica de caché e
  invalidación

---

# B · Decisiones de una línea

## 4 · `DatoDeRespuesta` no declara con qué panel se dibuja

`DatoDeRespuesta` trae `valor`, `familia`, `presentacion`, `metricId` y `titulo`,
más `Gobierno` intersectado — **la procedencia viaja pegada a la cifra, que es la
mitad difícil y ya está resuelta.** Lo que falta es con qué tipo de panel se
dibuja.

**No se puede derivar en el front.** `Bloque.formasAceptadas` va de muchos a
muchos: varios tipos aceptan `escalar`, así que el front tendría que **elegir**
uno. Elegirlo es inventar una decisión que el contrato no tomó — y el color de
una cifra del chat **ya se inventó una vez**: el front tenía `familia` cableada a
`demanda` porque el evento no la traía. Se arregló agregando el campo el
2026-08-19, y corresponde lo mismo acá.

```yaml
# En DatoDeRespuesta, junto a `titulo`
            tipo:
              $ref: '#/components/schemas/TipoPanel'
              description: |
                Con qué cuerpo de panel se dibuja esta cifra. Sin él el front
                tendría que elegirlo, porque `formasAceptadas` va de muchos a
                muchos, y elegirlo es inventar una decisión del contrato.
```

**Cuidado con el nombre al mirarlo:** `EventoDato.tipo` ya existe y vale
`'dato'` — es el discriminador de la unión de eventos, no un `TipoPanel`. Es
fácil leerlo como si el campo ya estuviera.

- **Desbloquea** · F3.6
- **Apaño de hoy** · ninguno, a propósito. La hoja del chat declara cuántas
  cifras trajo la respuesta en vez de pintar una con un tipo elegido a dedo:
  pintarla mal se vería bien y sería mentira

## 5 · `HiloResumen` no dice de qué panel salió la conversación

`HiloResumen` trae `id`, `titulo`, `creadoEn`, `actualizadoEn`, `esDecision` y
`decisionId`. **Ni panel ni período.** Y `Hilo` es `HiloResumen` + `mensajes`,
así que tampoco.

Es el punto 1 visto desde el otro extremo: si el contexto del panel no viaja al
preguntar, tampoco vuelve al listar. Se resuelve junto con aquel — que el hilo
guarde con qué contexto se abrió.

```yaml
# En HiloResumen, junto a `decisionId`
        panelId:  { type: [string, 'null'] }
        metricId: { type: [string, 'null'] }
        periodo:
          type: [string, 'null']
          description: |
            Con qué panel y período se abrió el hilo. Nulos cuando se preguntó
            desde el chrome y no desde un panel. Cuando no es nulo tiene la
            forma de `PeriodoId`.
```

- **Desbloquea** · la mitad de F3.7. El riel ya funciona: agrupa por tiempo,
  marca las decisiones y retoma el hilo. Lo que no puede es decir de qué panel
  salió

## 6 · `versionModeloSemantico` sigue en `nullable: true`

Quedó abierto al contestar la pregunta de la línea 430 el 2026-09-03. Si
Snowflake lo emite **siempre**, el campo pasa a requerido dentro de `snapshot` y
`inconcluso` deja de tener un tercer caso —«no sé con qué versión se
respondió»— que hoy el tipo permite.

No bloquea nada. Es cerrar bien lo que ya se decidió.

## 7 · `paramsDisponibles` es solo una lista de nombres

`Bloque.paramsDisponibles` es `string[]`: los **nombres** válidos por tipo, sin
tipos, valores admitidos ni defaults. Así que los valores válidos viven
**duplicados** en `PARAM_SCHEMAS` del front.

Es duplicación inevitable hoy y verificable, no un defecto: F1.29 la cerró
validando en el adaptador de `api/`, y un param inválido degrada el panel a
`BLOQUEADO` con la razón. Pero mientras el contrato no declare los valores, dos
tablas pueden derivar.

**La propuesta:** que `paramsDisponibles` declare tipo, valores y default por
param. Ahí `PARAM_SCHEMAS` desaparece y la deriva se vuelve imposible en vez de
verificable.

- **No bloquea nada** · hay una tabla duplicada y una prueba que la sostiene

---

# C · Necesita revisión, no una decisión

## 8 · La taxonomía de `error.codigo`

**Es la única marca `# PREGUNTA:` que queda en el yaml.** Las otras cuatro se
contestaron el 2026-09-03 y están escritas en el lugar donde estaba la marca.

El front no necesita la lista completa: necesita distinguir **error de campo** de
**regla de negocio** de **fallo técnico**. Dejamos una propuesta escrita en el
yaml para que la revisión tenga contra qué reaccionar:

```
FAMILIA_DETALLE · y la familia es el prefijo hasta el primer «_»

  CAMPO_*   error de campo      · SIEMPRE lleva `campo`
  REGLA_*   regla de negocio    · puede llevar `desbloqueaCon`
  FALLO_*   fallo técnico       · NUNCA lleva `campo`
```

**Lo único que importa del formato es que la familia sea el prefijo.** Eso hace
que el front decida sobre el prefijo y **nunca necesite la lista completa**: el
backend agrega códigos y el front no cambia ni se desincroniza. Es la misma
propiedad que ya hace verificable a `estado` en el batch.

Los códigos concretos —`CAMPO_REQUERIDO`, `REGLA_PERIODO_CERRADO`,
`FALLO_UPSTREAM`— son ejemplos y los eligen ustedes. `REGLA_VIOLADA`, que ya
estaba en el yaml, encaja sin cambiarlo.

**Lo que hay que revisar son las tres invariantes**, no los códigos: son lo que
el front puede verificar y lo que se rompería en silencio si no se cumplen.

- **Bloquea** · ramificar por tipo de error
- **Apaño de hoy** · todo error se trata igual y se muestra el mensaje del
  backend

---

# D · Servicio, no contrato

## 9 · `/config/solicitudes`

El contrato **ya lo declara**: `GET` para las solicitudes del usuario y `POST`
`solicitarAcceso`, con el 409 cuando ya hay una pendiente. Lo que el front no
sabe es si el servicio existe.

**Mientras no exista, el CTA no se pinta**, y es deliberado: un botón que se
aprieta y devuelve 403 es peor que uno ausente. El estado no queda sin salida —el
detalle sigue diciendo qué rol decide— pero no promete una acción que no está.

Cuando el servicio esté, avísennos: **la solicitud ya hecha tiene que salir del
servidor y no de estado local.** Con estado local, recargar borra el pedido y la
consola vuelve a ofrecer el CTA como si nada.

- **Desbloquea** · F2.3

## 10 y 11 · Seed y mínimos por gráfico

Ya están en el plan y no hace falta agregar nada; van acá para que se vea qué
esperan.

- **B1.16 + B1.20** · seed determinista → desbloquea **F1.25**, conectar a la API
  real. Hoy la consola dibuja de punta a punta contra MSW
- **B1.21** · los mínimos de datos por gráfico → desbloquea **F1.31**

---

# E · Lo que decide producto y a ustedes les llega como campo

No son de ustedes, pero conviene que sepan que vienen.

- **`locale` y moneda en `Contexto`** · la zona horaria se decidió, estos dos no.
  La moneda de un tenant multi-país es un problema de verdad: sumar ventas en dos
  monedas necesita moneda de reporte, tipo de cambio y fecha de corte
- **`orden` en `PanelConfigurado`** · §4 lo nombra para el orden de lectura al
  colapsar a una columna. Hoy el front desempata por `colStart`, que funciona
  pero el contrato no lo promete

---

# Dos detalles del yaml que vimos al escribir esto

**`nullable: true` es sintaxis de OpenAPI 3.0 y el documento declara 3.1.**
Aparece 7 veces —`versionModeloSemantico`, `resultadoMedido`, `veredicto`,
`respuestaCliente` y algunas más— mientras el resto del archivo usa la forma
3.1, `type: [string, 'null']`.

**Hoy no está roto**: `openapi-typescript` lo honra igual y los tipos generados
salen con `| null`. Lo verificamos. Pero es un keyword que 3.1 no define, así
que **otra herramienta lo ignora en silencio** y esos campos dejarían de ser
nulables sin que nadie lo note. Son dos formas de decir lo mismo en un archivo
que en todo lo demás dice una sola.

No bloquea nada. Es limpieza, y va con el punto 6.

---

# Una cosa que no es del yaml

**`nuevo-desarrollo.md` quedó viejo con los nombres de los eventos de chat.** La
línea 703 los lista como «pensando, fragmento, dato, sql, error, fin»; el
contrato declara `texto`, `dato`, `auditoria`, `sugerencias`, `fin` y `error`.

Gana el contrato, que es su casa para lo que viaja por la red — el front ya está
escrito contra los seis correctos. Pero conviene que alguien corrija ese
documento: **el plan de trabajo heredó los nombres viejos de ahí**, y va a seguir
contagiando a quien lo lea.

---

*Synapse · front dinámico · el detalle largo de cada punto está en
`docs/B0.9-preguntas-abiertas.md`*
