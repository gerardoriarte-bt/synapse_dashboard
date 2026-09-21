# Plan de trabajo · Synapse front dinámico

**2026-09-01** · Deriva de `nuevo-desarrollo.md` (normativo) y **extiende**
`tareas-front-back.md`, que sigue siendo válido: se conservan sus identificadores
`B*` / `F*` para no perder el hilo. Lo que este documento agrega va marcado `➕`.

## Una sola fuente

**Este archivo es la fuente. Todo lo demás se genera con `npm run plan`.**

| Archivo | Rol |
|---|---|
| `tareas-front-back.md` | **ANCESTRO** · el espacio de identificadores, compartido con el backend |
| `plan-de-trabajo.md` | **FUENTE.** Se edita a mano |
| `plan-tareas.csv` | derivado · una fila por tarea, para importar |
| `tools/plan-synapse.html` | derivado · la página navegable |
| `docs/PARA-BACKEND.md` | derivado · **lo que se le manda al backend** |

### Y nada más. Los documentos no se acumulan

El 2026-09-14 había **cuatro documentos** diciendo qué le falta al backend —uno
escrito a mano en `docs/`, la §4 de otro, un estado por tarea y los de
Snowflake— y el más viejo anunciaba como faltantes ocho rutas que ya estaban
servidas. **Un documento para otro equipo que miente es peor que no tenerlo**: se
lee, se planifica contra él, y el error aparece semanas después.

La regla es la misma que ya regía para el CSV: **lo que se le pide al backend
vive en la tarea que lo espera**, con un marcador, y el documento sale de ahí.

```
**Espera del backend.** <qué falta> · <por qué bloquea>
```

`npm run para-backend` lo recoge y regenera `docs/PARA-BACKEND.md` entero. Una
tarea que se desbloquea saca su pedido sola, y **una tarea en `✅` que todavía
pide algo es una contradicción que el chequeo reporta** — o no estaba cerrada, o
el pedido se cumplió y quedó el marcador. Corre en la puerta; verificado por
mutación colgándole un pedido a `F1.37`.

El marcador **no viaja al CSV**: no es un criterio de aceptación sino una
dependencia, y contarlo como prosa rompería el agrupado de las tareas que
comparten bloque. Lo que sí hace es marcar la tarea como bloqueada, que es lo que
el ticket necesita saber.

### El estado de las tareas `B*` lo mueve el front · 2026-09-14

**Decisión.** El front hace la integración final de todo lo que entrega el
backend, así que **es el front quien marca una tarea `B*` como hecha** — y solo
después de verificarla **contra el servicio corriendo**, no copiando el estado de
`docs/dynamic-dashboard-backend.md`.

**Por qué, y no es desconfianza.** Su documento marca `B1.13` como hecha —
`Presentation` opcional— y es cierto para dos de las nueve formas. Ninguno de los
dos está equivocado: ellos entregaron lo que su tarea decía, y el criterio de la
nuestra pide más. **La única forma de saber cuál de las dos cosas está en la
pantalla es mirarla.**

**La consecuencia es una obligación nuestra:** una tarea `B*` en `✅` o `⚠️` lleva
escrito **cómo se verificó** — qué endpoint, qué respondió, qué fecha. Una sin
eso es una suposición con forma de hecho, y `docs/ESTADO.md` la va a publicar
como avance.

Mientras una `B*` no se haya verificado se queda en `⬜`, **aunque ellos la den
por cerrada**. Eso hace que el número de backend de `ESTADO.md` salga bajo, y es
correcto que salga bajo: mide lo que el front pudo comprobar, no lo que el
backend construyó. El documento lo dice en su propia sección.

### Auditar el plan · a demanda, no en loop

Los chequeos deterministas corren solos en la puerta —`plan:ancestro`,
`para-backend`, `docs-registro`, y `plan:diff` contra un export—. Lo que ellos no
pueden contestar es **si un `✅` está sostenido de verdad** y **si dos documentos
dicen lo mismo**: eso necesita juicio, y va en la skill `auditoria-plan`.

**A demanda y no en loop**, por dos razones. Un agente que confirma que nada
cambió el 95% de las veces gasta sin devolver, y —peor— un agente que opina
sobre el estado se vuelve **una segunda fuente**, que es la enfermedad que todo
este bloque existe para curar. Se corre al cerrar un tramo o antes de informar
avances. **Reporta; no corrige**: cambiar el estado de una tarea es una decisión
de quien la pidió.

### Registro de documentos · lo que `docs/` puede contener

**Esta tabla es la lista blanca, y una máquina la hace cumplir.**
`npm run docs-registro` recorre `docs/` y **falla con cualquier archivo que no
caiga en un patrón de acá**. Es el freno a lo que pasó el 2026-09-14: cuatro
documentos diciendo lo mismo y el más viejo mintiendo.

Agregar un documento es legítimo — lo que no es legítimo es agregarlo **sin
decir qué rol cumple**, porque ahí empieza la superposición.

| Patrón | Rol |
|---|---|
| `docs/ESTADO.md` | **GENERADO** · el estado del proyecto. **Lo que se consulta y se reenvía** |
| `docs/PARA-BACKEND.md` | **GENERADO** · lo que el front espera del backend |
| `docs/snowflake/*` | Entregable a **ingeniería de datos**, no al backend. Instrucción y SQL |
| `docs/PLAN-INTEGRACION-*.md` | El **análisis** que fundamenta los pedidos, campo por campo |
| `docs/ESTADO-*-*.md` | Un **corte** verificado contra el servicio, con fecha. No se actualiza: se reemplaza |
| `docs/BITACORA-*.md` | **Histórico.** Lo que costó descubrir. No se tocan |
| `docs/AUDITORIA-*.md` | **Histórico.** Un cruce puntual, con fecha |
| `docs/ENTREGA-*.md` | **Histórico.** Qué se entregó y cuándo |
| `docs/MENSAJE-*-*.md` | **Histórico.** Un mensaje mandado, con fecha. Qué se pidió y con qué evidencia |
| `docs/B0.9-preguntas-abiertas.md` | Las preguntas del contrato, con su resolución |
| `docs/PROPUESTA-*-*.md` | Una **propuesta de spec** abierta, con fecha. Lo que `design.md` no declara y el código no puede inventar |
| `docs/F1.28-escala-tipografica.md` | La bitácora de una tarea que cambió el sistema |
| `docs/FOLDER_STRUCTURE.md` | La estructura de `src/`, para quien llega |
| `docs/historico/*` | Documentos **vencidos**, con el aviso adentro. No se consultan para planificar |
| `docs/backdocs/*` | Material del equipo de backend · **ignorado por git** |

Los dos derivados **se pisan enteros** en cada corrida: editarlos a mano es
trabajo que se pierde. Un solo parser produce los dos —`tools/plan-a-csv.py`
emite el JSON que consume `tools/plan-a-html.py`— para que no puedan
desincronizarse entre sí.

`npm run plan` **falla** si alguna tarea quedó sin criterio de aceptación. La
regla de este documento la hace cumplir una máquina, no la revisión.

Lo que no es una tarea —decisiones, convención, camino crítico, transversales—
**no tiene fila en el CSV** y vive solo acá.

### La plataforma de seguimiento refleja; no manda

**Decisión del 2026-09-01: este archivo sigue siendo la fuente también después
del import.** La plataforma se usa para operar —asignar, mover, comentar— pero el
estado de una tarea se cambia acá y se vuelve a exportar.

Eso tiene un modo de fallo conocido: alguien mueve un ticket en la plataforma, el
`.md` no se entera, y a partir de ahí los dos dicen cosas distintas sin que nadie
lo note. **La regla no se sostiene sola, así que se verifica.**

```
npm run plan                    regenera CSV y página desde este archivo
npm run plan:diff <export.csv>  compara un export de la plataforma contra este archivo
```

`plan:diff` sale con **0** si están alineados y **1** si hay deriva, la misma
convención que `make verify`. Reporta cuatro cosas:

| | Qué significa |
|---|---|
| **Ticket sin tarea** | Se creó en la plataforma y no existe acá. O se agrega al `.md`, o se borra allá |
| **Tarea sin ticket** | Está acá y no se importó. Falta correr el import |
| **Estado distinto** | Alguien lo movió en la plataforma. Se decide cuál gana y se corrige el otro |
| **Título distinto** | Se editó de un solo lado |

El import es **idempotente**: la columna `ID` es la clave externa, así que volver
a importar el CSV actualiza los tickets existentes en vez de duplicarlos.
Configurar ese campo en la plataforma es parte de T6.

### Los identificadores salen del ancestro, y eso ahora se verifica

**`tareas-front-back.md` es el ancestro común de los dos planes.** Está en la
raíz de este repositorio y en la de `synapse-api-go`, **byte a byte iguales**
—mismo md5, comprobado el 2026-09-14—. Este archivo declara desde su primera
línea que conserva sus `B*` / `F*` «para no perder el hilo», y lo cumple: los 151
identificadores siguen acá, 144 con tarea propia y 7 absorbidos por otra que dice
cuál.

**Esa promesa no la verificaba nadie hasta hoy**, y el día que se miró apareció
por qué importa: `docs/dynamic-dashboard-backend.md` del backend **renumeró desde
`B1.4`** y comprimió las 19 tareas de Fase 1 en 14. Su `B1.13` es el `B1.18` de
acá. Con los códigos ya cargados en la plataforma, un ticket que diga «B1.13
hecho» se entiende como «presentación lista» o como «catálogo sincronizado» según
quién lo lea.

**Un identificador que significa dos cosas es peor que dos identificadores**: se
lee, se entiende al revés, y nadie se entera hasta que alguien entrega otra cosa.

```
npm run plan:ancestro     los IDs del plan == los del ancestro
```

Corre en la puerta. Falla si un ID del ancestro **desaparece sin dejar dicho
dónde fue** — o tiene encabezado propio, o alguien escribió qué tarea lo
absorbió. Lo que agregamos nosotros —los `➕`— se informa y no se marca: sumar
tareas es normal, reasignar identificadores no.

Verificado por mutación renumerando `B1.13`, que es exactamente lo que pasó del
otro lado.

**Lo que se le pidió al backend** está en
`docs/ESTADO-B1.13-B1.19-2026-09-14.md`: volver a los IDs del ancestro, o
agregar una columna de equivalencia. Es edición de un documento; no hace falta
que toquen su historia.

## Cómo leer el estado

| | |
|---|---|
| ✅ | hecho y verificado (`tsc -b`, `oxlint` y `build` en verde) |
| ⚠️ | parcial — el criterio de aceptación no se cumple entero |
| ⬜ | pendiente |
| 🕓 | **diferida** — fuera del alcance actual; entra cuando el backend llegue a ese tramo (D3) |
| ➕ | **no estaba en `tareas-front-back.md`.** Se agrega acá |
| 🔒 | bloqueada, con la dependencia declarada al lado |

Toda tarea lleva **título**, **descripción** y **criterio de aceptación**. Una
tarea sin criterio verificable no entra al plan.

---

## 0 · Decisiones tomadas · 2026-09-01

Las seis del 2026-09-01 quedaron resueltas, y D7 se agregó el 2026-09-02. Se
conservan acá con su resolución porque explican por qué el plan tiene las tareas
que tiene.

### D7 · `.cursorrules` se reconcilia con §4 · **2026-09-02**

Auditando la estructura contra los ejemplos del §14 aparecieron **tres reglas de
`.cursorrules` que contradicen a `nuevo-desarrollo.md`**, y el código seguía a
`nuevo-desarrollo.md` en dos de ellas sin que estuviera escrito por qué.

| `.cursorrules` decía | §4 dice | Resuelto |
|---|---|---|
| Carpeta por componente + `.types.ts` + `index.ts` | Regla 3: «un componente, **un archivo**, una exportación nombrada», y los 19 ejemplos de §14 dan rutas planas | Archivos planos |
| «Variantes vía props (`variant`, `size`)» | Regla 4 nombra `variant="compact"` **como el anti-patrón**: «rama explícita documentada, no un flag suelto» | Composición |
| «Soportar `className` para extensión desde el exterior» | Regla 9: «todo color, radio y espaciado sale de custom properties en `tokens/`» | **`render/` no acepta `className`** |

**Gana `nuevo-desarrollo.md`**, que es la fuente específica de este front;
`.cursorrules` traía la convención genérica de un scaffold de Tailwind.

**La tercera es la que tenía consecuencia real.** Una clase inyectada por el
llamador es el agujero por donde entra un valor que no es token, y es un agujero
que el lint **no puede tapar de otra forma**: `design-lint` mira el archivo donde
la clase se escribe, no dónde se aplica, así que un `bg-slate-800` pasado como
prop desde una superficie esquiva L1 y `token-drift` sin dejar rastro.

Se agregó como chequeo **fuera de las 15** —el precedente lo sienta
`design-lint.md` con `repertorio`—, así que la decisión es verificable y no
aspiracional. Con ella se borró `src/lib/cn.ts` y sus dos dependencias, `clsx` y
`tailwind-merge`: sin clases externas que fusionar, `cn()` no tenía qué hacer. El
front queda en **siete dependencias de runtime**.

**La regla 3 también se volvió verificable.** «Un componente, un archivo, una
exportación nombrada» estaba en §4 desde el principio y no la miraba nadie:
`states/States.tsx` tenía cinco, contra la ruta explícita de §14.11
(`states/EstadoCargando.tsx`). Se partió en seis archivos —los cinco estados más
`StateBody` e `Icon`— y se agregó el chequeo, también fuera de las 15.

`render/plots/core/` queda excluido con la razón escrita: §6.2 nombra a las
primitivas de dibujo como un JUEGO —«las seis primitivas»— y `Bars`, `Line`,
`Area` y `Dots` comparten helpers privados; separarlas obligaría a exportarlos.

**Partir el archivo destapó dos defectos que la co-ubicación escondía.**

1. `ErrorState` pasaba `onRetry` donde `Exit` espera `onClick`, y el spread de
   JSX lo dejó pasar sin que el compilador lo viera: **el botón de reintentar se
   pintaba y no llamaba a nada**. Es el mismo agujero que ya había aparecido con
   `onChat`. Ahora hay una prueba por cada estado que verifica que el CTA
   DISPARE, no que exista.
2. `DegradedBadge` armaba un label a mano con las utilidades de §2.3, y L15 no lo
   veía porque compartía archivo con `Provenance`, que sí importa `Label` — el
   detector mira el archivo entero. Solo, quedó a la vista. Ahora compone
   `<Label>` y se queda solo con el fondo, que es lo único propio del badge.

Es una propiedad del chequeo que vale anotar: **un componente por archivo hace
más preciso a L15**, porque su guarda «si el archivo importa `Label`, no marques»
deja de cubrir a los vecinos.

Queda una salvedad escrita: la restricción de `className` es de `render/`. `admin/` y `builder/`
son otras superficies y pueden necesitar componentes genéricos con `className`;
eso es Fase 4 y se decide ahí.

### D1 · El colapso responsive **entra**

§3.1 de `design.md` declara tres pisos de ancho —768 la consola colapsando el
grid, 1280 administración, 1600 el builder— y por debajo de 768 no se degrada: no
se soporta. En v2 está implementado, con ancla de spec y prueba.

**Resolución: entra.** `columnsFor()` ya está escrita en `render/grid.ts`; falta
cablearla. **Desbloquea F1.30.**

### D2 · El layout declara el gráfico — y primero se declaran los mínimos

La pregunta era si `PanelConfigurado` debía llevar el gráfico además del tipo de
bloque. La observación que la acompañó es la que ordena la respuesta: *los
gráficos dependen de los datos, y hay que establecer los datos mínimos para
construir el gráfico*.

**Resolución: sí, el layout declara el gráfico. Pero el entregable importante no
es el campo — es la tabla de mínimos, y va primero.**

Por qué en ese orden:

1. Agregar `plot?: PlotId` al layout es barato y no rompe nada: ausente ⇒ el
   gráfico por defecto del tipo, que es exactamente lo que se dibuja hoy.
2. Lo que hace que esa elección sea **segura** todavía no existe.
   `contracts/synapse-plots.js` declara `formas` (qué formas acepta cada
   gráfico), `soportaBanda` y `tope` (el límite superior que lo deshabilita, con
   su razón). **No declara mínimos.**
3. Sin mínimos, un gráfico elegido en el builder puede recibir dos puntos donde
   necesita cinco y **dibujar algo que engaña**. Con mínimos, el panel degrada
   honestamente —«este corte necesita al menos tres categorías; llegaron dos»—,
   que es lo que §8 pide de un estado vacío: invitación a actuar, no un error.
4. Y los mínimos sirven **aunque D2 se hubiera resuelto que no**. Hoy, con un
   solo gráfico por tipo, nada impide que `bars` reciba un ítem y dibuje una
   barra sola. El problema ya existe; elegir gráfico solo lo multiplica.

Cada entrada del repertorio queda declarando cuatro cosas:

| Campo | Estado | Qué dice |
|---|---|---|
| `formas[]` | ya existe | qué formas de dato sabe dibujar |
| `soportaBanda` | ya existe | regla dura: `serieConBanda` solo va a gráficos con banda |
| **`minimos`** | **falta** | cuántos puntos, categorías o partes necesita, **y la razón** |
| `tope` | ya existe | el límite superior, con la razón que se muestra |

Ejemplos de mínimo: una serie necesita ≥2 puntos —con uno no hay línea, hay un
punto—; una composición ≥2 partes, porque un 100% de una sola parte no informa;
una distribución ≥3 cortes; un ranking ≥3 ítems.

**Quién valida: los tres, desde la misma tabla.** El builder en tiempo real para
no dejar componer algo imposible; `layouts/{id}/validate` del lado del servidor,
que es el que decide; y el adaptador del front, que detecta en desarrollo que
llegó un layout malo. Ninguno lleva la tabla escrita adentro.

**Agrega B1.21** (los mínimos, Fase 1 — sirven ya) y **F4.21** (el selector de
gráfico del builder). **Reescribe B4.16 y desbloquea F1.31.**

### D3 · Las cuatro superficies de v2 quedan **diferidas**

Drill-down C2, hallazgos C4 con el framework de accionables `PS-17`, el viaje de
solicitud de acceso, y el módulo MMM.

**Resolución: no se descartan y no se planifican todavía. Quedan anotadas como
diferidas, y entran cuando el backend llegue a ese tramo.** El contrato ya las
cubre —`/config/decisiones`, `/config/accionables`,
`/config/accionables/{id}/respuesta` y `/config/solicitudes` están en el yaml—,
así que lo que falta es el servicio, no el diseño.

Llevan estado propio **`diferida`** para que en la plataforma de seguimiento no
se confundan con lo pendiente del sprint: **F3.9, F3.10, F3.11, F5.4, B5.4.**

### D4 · TypeScript baja a 5.9 · **hecho**

El andamio pinaba `typescript@~6.0.2` y `openapi-typescript@7` declara peer
`^5.x`, así que `npm install` lo rechazaba y la generación corría por `npx`.
`nuevo-desarrollo.md` §4 exige que `api/types.ts` se genere desde OpenAPI, así
que la cadena de generación manda sobre la versión del compilador.

**Resolución: `typescript@~5.9.3`.** Se quitó `ignoreDeprecations: "6.0"` del
`tsconfig.app.json`, que solo existe en TS 6. Verificado el 2026-09-01:
`npm install` sin `--legacy-peer-deps`, `npm run gen:api` corre desde el
`package.json`, y `tsc -b`, `build` y `lint` en verde. **Cierra F0.10.**

### D5 · La puerta de calidad **se porta**

`nuevo-desarrollo.md` no la menciona, y con razón: **es de nuestro lado, no del
desarrollador del backend.** Por eso no la contempla, no porque la descarte.

**Resolución: se porta.** `design-lint` reapuntado a Tailwind, `spec-anclas`,
`token-drift` y `contract-drift`. El antecedente es concreto: el 2026-08-20 en v2
el colapso responsive violaba §3.1 de tres formas distintas **con 184 pruebas en
verde**, porque estaban escritas mirando el código. **Desbloquea F0.11 y F0.12.**

### D6 · `Metrica.base` — **se cierra la propuesta de spec**

§6.2 y §17 del documento declaran `base` obligatorio en el catálogo. El yaml ya
lo tiene en `required`; `design.md` todavía no.

**Resolución: se cierra, para mantener las tres fuentes alineadas.** La propuesta
sube al humano —el agente no modifica `design.md`— y al aprobarse, catálogo, yaml
y spec dicen lo mismo. **Cierra T8.** Consecuencia directa: un panel `BLOQUEADO`,
que no lleva `Gobierno`, **puede** mostrar su BASE, y eso es lo que hace posible
el criterio de F2.6 y F1.13e.

---

## Convención de identificadores

**La fase va en el identificador.** Es lo que permite que una tarea llegue sola a
la plataforma de seguimiento sin perder su lugar en el plan.

```
B 1 . 6        F 1.13 a
│ │   │        │ │    └── sub-tarea de un traslado partido
│ │   └─ número dentro de la fase
│ └───── FASE (0–5)
└─────── EQUIPO · B backend · F front
```

`B1.6` es **backend, fase 1, tarea 6**. `F1.13a` es **front, fase 1, tarea 13,
parte a**. Las transversales van `T*` y no llevan fase porque no son de una.

Cada tarea exporta además su fase como campo propio en `plan-tareas.csv`, junto
con el epic al que pertenece.

## Estados

| Estado | Qué significa en la plataforma |
|---|---|
| `hecho` | Cerrada y verificada |
| `parcial` | Abierta — parte del criterio se cumple |
| `pendiente` | Abierta, sin empezar, sin bloqueo |
| `bloqueada` | Abierta, con dependencia declarada que hay que cerrar antes |
| `diferida` | **Fuera del alcance actual.** Entra cuando el backend llegue a ese tramo (D3). No se planifica ni se estima todavía |

---

# Backend

## Fase 0 — Fundamentos e infraestructura

### B0.1 ⬜ Esquema Postgres
**Descripción.** Modelar el almacenamiento: `tenants`, `roles`, `users`,
`layout_versions`, `tabs`, `panels`, `panel_options`, `panel_data`,
`catalog_metrics`, `agent_configs`. `panel_data` es el snapshot materializado y
no una vista sobre Snowflake.
**Criterio de aceptación.**
- Las migraciones corren de cero sobre una base vacía y son reversibles.
- Un panel se ancla a `metric_id`; **ninguna tabla guarda SQL ni nombre de tabla
  de Snowflake** asociado a un panel.
- `panel_data` tiene clave `(tenant_id, metric_id, periodo)` y columnas para el
  gobierno completo: `base`, `capa`, `fuente`, `frescura`, `catalog_version`.
- Existe un diagrama o un `schema.sql` versionado en el repo del backend.

### B0.2 ⬜ Versionado de layout
**Descripción.** Un layout tiene versiones con estado `draft` | `published`.
Publicar congela una versión, le asigna `versionId` y sella `publishedAt`.
**Criterio de aceptación.**
- Editar un layout publicado crea un borrador nuevo; **nunca muta el publicado**.
- Un tenant tiene como máximo un layout publicado por dashboard en un momento.
- Se puede consultar el histórico de versiones con quién publicó y cuándo.
- Publicar invalida la cache de layout de ese tenant (ver B2.8).

### B0.3 ⬜ Autenticación JWT
**Descripción.** Emitir y validar tokens con claims `tenant_id`, `role_id`,
`user_id` y `aud` (`usuario` | `platform`). El front **no decodifica el token**:
recibe todo resuelto en `/config/me`.
**Criterio de aceptación.**
- Todo endpoint bajo `/api/v1` rechaza sin `Authorization: Bearer` con `401`.
- El token expira y hay refresh o re-login declarado.
- Ningún endpoint devuelve `tenant_id` como identificador que el front deba
  reenviar: la pertenencia se resuelve del token.

### B0.4 ⬜ Middleware de auth y envelope
**Espera del backend.** **El envelope de error estructurado de §4.1.** Hoy `error` es una cadena, así que el front no puede distinguir «error de campo» de «regla de negocio» de «fallo técnico». La propuesta está en el yaml desde el 2026-09-03 y es barata: `FAMILIA_DETALLE`, con la familia como prefijo hasta el primer `_`. **El front solo necesita el prefijo**, nunca la lista completa, así que pueden agregar códigos sin que nos desincronicemos.
**Descripción.** Toda respuesta viaja como `{ success: true, data }` o
`{ success: false, error: { codigo, mensaje, campo?, desbloqueaCon? } }`.
**Criterio de aceptación.**
- No hay endpoint que devuelva el objeto pelado sin envelope.
- `mensaje` está escrito desde el lado del usuario. §8 de `design.md`: los
  errores no se disculpan y nunca son vagos — «El feed de inventario tiene 31
  horas», no «Error al obtener snapshot».
- `codigo` es estable y sirve para decidir en código.

### B0.5 ✅ Contrato de consola
**Verificado el 2026-09-14** · no contra el servicio, porque no produce una ruta sino un documento: lo sostiene `contracts/synapse-api.yaml`, que existe, y `contract-drift` en la puerta. **Una `B*` que no se observa en el servicio declara qué la sostiene**, y eso también es evidencia.
**Descripción.** `contracts/synapse-api.yaml` ya existe y cubre los endpoints de
consola: `me`, `catalog`, `blocks`, `tabs/{tabId}`, `panels:batch`, `chat`,
`chat/hilos`, `me/preferencias`, más `decisiones`, `accionables` y
`solicitudes`. Fue escrito por el front derivándolo de §4 y de lo que C1 consume.
**Criterio de aceptación.**
- El backend lo revisa y lo adopta, o marca las diferencias en el propio archivo.
- Al adoptarse deja de ser propuesta del front y pasa a ser fuente de los dos
  lados (T1).

### B0.6 ⬜ Extender el contrato con admin y builder
**Espera del backend.** **Cerrar su B0.7: declarar `/config/*` y `/admin/layouts/*` en el OpenAPI que el binario ya embebe.** Mientras no esté, el front mantiene `contracts/synapse-console-wire.yaml`, que es una **transcripción nuestra leyendo structs de Go** — y eso ya costó un error con el servicio de acceso. Con el spec emitido, ese archivo se reemplaza por el suyo y `console-drift` lo verifica solo.
**Descripción.** Agregar al yaml los endpoints de §5: `/admin/tenants`,
`/admin/tenants/{id}/layouts`, `/admin/layouts/{id}`, `.../publish`,
`.../validate`, `/admin/tenants/{id}/catalog`, `/admin/tenants/{id}/agents`.
**Criterio de aceptación.**
- Los esquemas de admin **reutilizan** `PanelConfigurado`, `Metrica` y `Bloque`;
  no se declaran versiones paralelas.
- `openapi-typescript` genera sin errores y el front compila contra los tipos.
- Cada endpoint declara qué `aud` del token acepta.

### B0.7 ⬜ Tipos de servidor desde OpenAPI
**Descripción.** Generar los tipos del backend desde el mismo yaml, o compartir
el contrato de modo que una divergencia rompa el build de alguno de los dos.
**Criterio de aceptación.**
- Cambiar un campo en el yaml sin actualizar el backend falla en CI.
- No hay un segundo lugar donde estén escritos los mismos tipos a mano.

### B0.8 ⬜ Secret manager para credenciales Snowflake
**Descripción.** Las credenciales por tenant salen de un gestor de secretos.
**Criterio de aceptación.**
- Ninguna credencial en código, en variables de entorno del front ni en ninguna
  respuesta de API.
- La configuración de agente que el superadmin edita **no incluye** la
  credencial: la referencia por identificador.

### ➕ B0.9 ⚠️ Contestar las cinco `# PREGUNTA:` del contrato
**Verificado el 2026-09-14** · igual que B0.5, lo sostiene un documento y no una respuesta: las cinco `# PREGUNTA:` están contestadas en el yaml con su bloque `DECIDIDO`, y el inventario en `docs/B0.9-preguntas-abiertas.md`. Sigue en ⚠️ porque una de las trece quedó sin decidir.
**Descripción.** El yaml lleva cinco decisiones marcadas que el front no puede
tomar. Contestarlas **en el propio archivo** es suficiente.

| Línea | Qué hay que decidir |
|---|---|
| 430 | Falta `versionModeloSemantico` en el evento `auditoria` del chat. Sin él, el veredicto `inconcluso` no se calcula. ¿Lo emite el chat o lo resuelve el `DECISION_LOG` al re-medir? |
| 531 | ¿El backend expone `actor` o lo deriva del token? El front necesita saber si lo manda o se infiere |
| 754 | Taxonomía de `codigo` de error. El front solo necesita distinguir error de campo / regla de negocio / fallo técnico |
| 981 | ¿Cómo pasa un token de plataforma el tenant a `/config/*`? `/platform/t/{tenantId}/console/*` o cabecera `X-Tenant-Id` con `aud: platform` |
| 1171 | ¿El batch emite `DEGRADADO` y `SIN_PERMISO`? Si el catálogo ya viene filtrado por rol, un panel sin permiso no llegaría nunca — pero C5 existe como pantalla |

**Criterio de aceptación.**
- Las cinco marcas `# PREGUNTA:` desaparecen del yaml, reemplazadas por la
  decisión escrita.
- La 1171 en particular determina qué estados tiene que renderizar F2.1–F2.3.

**Cuatro de cinco contestadas el 2026-09-03.** Quedan escritas en el yaml, en
el lugar de la marca, con la fecha y el porqué:

| Línea | Decisión |
|---|---|
| 430 | **Lo emite Snowflake**, y el evento lo estampa al responder. `inconcluso` compara dos momentos y el primero no se reconstruye después |
| 531 | **Lo deriva del token.** El front no manda `actor`, y es lo que sostiene el seguro de atribución |
| 981 | **En el path**, `/platform/t/{tenantId}/console/*`. Gana por el criterio que la pregunta fijaba: sin tenant no hay ruta |
| 1171 | **Sí, los dos.** El catálogo no es el único filtro, C5 es alcanzable, y **esto destraba F2.1, F2.3 y B2.7** |

**Queda abierta la 754**, la taxonomía de `error.codigo`: hay que revisarla. El
front dejó una propuesta escrita en el yaml para que la revisión tenga contra qué
reaccionar —`FAMILIA_DETALLE` con la familia en el prefijo, que es lo que permite
que el backend agregue códigos sin que el front cambie.

**Estas cinco son las del yaml; el documento junta diez.** El front sumó tres en
la Fase 1 y F1.28 dejó dos de diseño, que no están marcadas `# PREGUNTA:` en
ningún lado porque su fuente es `design.md`. Las diez, con quién decide cada una
y qué frena, en `docs/B0.9-preguntas-abiertas.md`. Solo tres bloquean trabajo.

### ➕ B0.10 ⬜ Endpoint de login
**Descripción.** `tareas-front-back.md` pide en F0.5 «login → guardar JWT →
redirigir», y **ninguna tarea de backend lo expone**. B0.3 define el JWT pero no
la ruta que lo emite.
**Criterio de aceptación.**
- Existe `POST /api/v1/auth/login` (o la ruta que el backend decida) declarado en
  el yaml, con su forma de request y de respuesta.
- Declara qué pasa con credenciales inválidas y con cuenta bloqueada, con
  `codigo` estable.
- El front puede implementar F0.5 sin inventar la forma del request.

---

## Fase 1 — API de consola

### B1.1 ⚠️ `GET /config/me`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `GET /config/me` responde con `user`, `tenant`, `role`, `tabs`, `periods` y `catalog_version`. **Parcial** porque faltan `theme` —el campo existe en `users` y el `PUT` lo escribe— y el resto del contexto que declara el contrato.
**Espera del backend.** **`theme` en la respuesta.** El campo existe en `users`, la migración lo creó y `PUT /config/me/preferences` ya lo escribe — pero `/config/me` no lo devuelve, así que **la preferencia se guarda y no se puede leer**. El front la necesita antes del primer pixel: leerla en una segunda llamada haría que la consola pinte oscura y cambie a clara a la vista del usuario. Y falta el resto del contexto: `alcance`, `tenant.etiqueta` y `vertical`, `role.puedeAprobar`, `user.capabilities`, y en la pestaña `key`, `icon` y `chat_suggestions`.
**Descripción.** Contexto de arranque: `user` (con `capacidades` y
`preferencias`), `tenant`, `role` (con `puedeAprobar`), `tabs` **sin paneles**,
`periodos`, `catalogVersion`, `alcance` y —si hay más de uno— `layouts`.
**Criterio de aceptación.**
- Las pestañas llegan **ya filtradas** por el rol del token y en su orden.
- Cada `Periodo` declara su `grano` (`dia` | `semana` | `mes`): sin él el front
  sabe que una métrica es mensual pero no si `2026-W32` es una semana.
- No incluye paneles: pedirlos es `GET /config/tabs/{tabId}`.
- Con `alcance: plataforma` incluye `tenantsDisponibles`; con `usuario`, no.

### B1.2 ✅ `GET /config/catalog`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `GET /config/catalog` devuelve 12 métricas con sus quince campos. El filtrado por rol es B1.19 y se audita aparte.
**Descripción.** Las métricas del tenant filtradas por el rol del token.
**Criterio de aceptación.**
- Una métrica oculta para el rol **no aparece**, ni siquiera con `estado`
  restringido: ocultar no es permitir, pero tampoco es mostrar el nombre.
- Cada métrica trae `base` obligatorio (ver D6), `familia`, `forma`, `capa`,
  `fuente`, `ventana`, `granoMinimo`, `dimensiones` y `catalogVersion`.
- `direccionSemantica` viene solo en las compuestas, y es la frase que se pinta.

### B1.3 ✅ `GET /config/blocks`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `GET /config/blocks` devuelve **los quince tipos** —de `kpi` a `graph`— con `accepted_shapes`, los cuatro rangos de span y `layout_params`.
**Descripción.** La tabla tipo ↔ formas aceptadas ↔ rangos de `colSpan` y
`rowSpan`, para los 15 tipos.
**Criterio de aceptación.**
- Los 15 tipos están, incluidos los que ninguna métrica usa hoy
  (`comparison`, `matrix`, `graph`): el builder los ofrece.
- El front la consume con `catalog/blocks.ts`, que ya está escrito, sin
  reescribir la tabla del lado del cliente.

### B1.4 ✅ `PUT /config/me/preferencias`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `PUT /config/me/preferences` responde **200** con `{ theme }`. Lo que falta —leerlo de vuelta en `/config/me`— es B1.1.
**Descripción.** Persistir el tema del usuario.
**Criterio de aceptación.**
- El tema se guarda contra el **perfil**, no contra el tenant ni el navegador:
  §2.4 lo declara preferencia de usuario, y la misma cuenta se ve igual en dos
  máquinas.
- El valor inicial vuelve en `/config/me` → `user.preferencias.tema`.

### B1.5 ✅ `GET /config/tabs/{tabId}`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `GET /config/tabs/{tabId}` devuelve la pestaña y sus **12 paneles**, con `col_start`, `col_span`, `row_span` y `options`.
**Descripción.** `{ tab, panels[] }` — el layout, sin datos. Acepta
`?layoutId=` para multi-dashboard.
**Criterio de aceptación.**
- Un `tabId` que no pertenece al tenant y rol del token devuelve **`404`, no
  `403`**: no se revela la existencia.
- La respuesta no contiene una sola cifra: cambiar de período no la invalida.
- Cada panel trae `id`, `tipo`, `metricId`, `colStart`, `colSpan`, `rowSpan` y
  `opciones?`.

### B1.6 ⚠️ `POST /config/panels:batch`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. `POST /config/panels:batch` devuelve los 12 payloads y la consola los pinta. **Parcial** por `unlocks_with` vacío en `BLOCKED` y `request_from` como constante.
**Espera del backend.** **`unlocks_with` en `BLOCKED`** —hoy llega vacío; el servicio solo lo escribe al derivar `DEGRADED`, y §8 pide estado, razón **y qué lo desbloquea**— y **`request_from` real** en `FORBIDDEN`, que hoy es la constante `"administrator"` escrita en el código y no el rol que decide sobre la métrica.
**Descripción.** Un request por pestaña, no uno por panel. Body
`{ panelIds, periodo }` → `{ [panelId]: Payload }`.
**Criterio de aceptación.**
- **Fallo parcial:** un panel que no resuelve llega con `estado: ERROR` y el
  resto vuelve normal. No se falla el batch entero.
- Ocho paneles se resuelven en una llamada.
- No devuelve payload de una métrica oculta para el rol (B1.9).

### B1.7 ⬜ Resolver el layout publicado
### B1.8 ⬜ Filtrar pestañas por visibilidad de rol
### B1.9 ⬜ Filtrar paneles por `hiddenMetricIds` — **ocultar ≠ permitir**
### B1.10 ⬜ Aplicar `layoutOverrides` por rol
**Descripción (las cuatro).** La resolución que ocurre antes de responder:
tomar el layout publicado, filtrar pestañas y paneles por rol, aplicar overrides.
**Criterio de aceptación.**
- El front recibe **solo lo resuelto** y no aplica ningún filtro.
- Una métrica oculta no llega ni en `tabs`, ni en `catalog`, ni en `batch`.
- Un rol con override ve su composición propia sin huecos en la grilla.

### B1.11 ⬜ Unión discriminada de `Payload`
**Descripción.** Cinco estados por `estado`: `DISPONIBLE`, `DEGRADADO`,
`BLOQUEADO`, `SIN_PERMISO`, `ERROR`.
**Criterio de aceptación.**
- `BLOQUEADO` **no lleva `valor`**. Es estructural, no una convención.
- Ningún estado lleva campos de otro.
- `CARGANDO` **no existe** del lado del servidor: es del cliente.

### B1.12 ✅ `Gobierno` obligatorio en `DISPONIBLE` y `DEGRADADO`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. Los payloads con cifra traen `governance` con sus cinco campos: `base`, `layer`, `source`, `freshness` y `catalog_version`. La procedencia se pinta en los doce paneles.
**Descripción.** `base`, `capa`, `fuente`, `frescura`, `catalogVersion`
intersectados en los dos estados que muestran número.
**Criterio de aceptación.**
- **Un valor sin procedencia es imposible de construir** en el tipo, no algo que
  se recuerde poner.
- `frescura` es ISO 8601 y refleja **cuándo se materializó**, no «ahora» (B2.10).

### B1.13 ⬜ `Presentacion` opcional
**Espera del backend.** **Solo la `nota` de panel.** El pedido grande que había acá —«`presentation` para las siete formas que no son escalares»— **se retira: estaba mal**, y lo corrigió leer nuestro propio código el 2026-09-15.

**`presentation` la lee UN solo cuerpo: `KpiBody`.** Ningún otro la toca — verificado con un grep sobre `src/render/bodies/`. Y no es un olvido: los demás sacan sus rótulos **del propio valor**. `BarsBody` hace `value.items.map(i => i.etiqueta)`; cada ítem viaja con su etiqueta. **«Ningún número desnudo» lo cumple la estructura del dato, no `presentation`.**

Así que `PresentationFromRows` devolviendo `nil` para las otras siete **es correcto**, y pedirlas habría sido pedir un campo que nadie lee — el mismo modo de falla de `BodyProps.presentation`, que existió meses sin un solo consumidor.

Lo que sí falta es la **`nota` de panel** —la lectura al pie, distinta de la `note` que va dentro del `medidor`—: el contrato la declara y el cable no la trae. Es un campo, no siete.
**Descripción.** Los rótulos y cifras de apoyo que el panel pinta alrededor del
valor: `label`, `medidor`, `comparativo`, `nota`. **Viajan con el dato, no con el
layout**, porque dependen del período.
**Criterio de aceptación.**
- El backend devuelve los rótulos **ya redactados**; el front no los compone.
- `label` lleva la unidad («USD · TOTAL»), y por eso la cifra grande no la lleva
  pegada: a 44px «USD 4.28M» no entra en un panel de colSpan 3.

### B1.14 ⬜ Transformar a las formas de `Valor`
**Espera del backend.** **`decimals` y `unit` por columna en `tabular`**, y las siete formas que `TransformValue` no produce.

**NO depende de Snowflake.** Es código Go: las tablas Gold que el materializador consulta ya existen con sus quince columnas, verificado el 2026-09-14.

**Y las siete no son un solo trabajo, son dos.** El contrato declara dieciséis formas en el enum `Forma` pero **solo once tienen esquema de `Valor`**:

- **`distribucion` y `serieConBanda` tienen esquema** y las puede hacer el backend hoy: un caso más en el `switch` de `internal/core/dashboard/materialize/transform.go`, emitiendo `{shape, cuts:[{label, v}]}` y `{shape, level, points:[{t, v, lo, hi}]}`.
- **`categoricaComparada`, `perfilMultiatributo`, `matriz`, `flujo` y `grafo` NO tienen esquema.** Antes de que alguien las materialice hay que declararlas en el contrato, y **eso es trabajo nuestro**, no suyo. Hasta entonces no hay contra qué implementar.

**Ninguna de las siete es urgente**, y conviene decirlo: sus consumidores son los cuerpos `comparison`, `matrix`, `graph` y `distribution`, que el front tampoco va a construir hasta que exista una métrica que los use. **Entran juntos o no entran.**

Lo que sí sirve ya es `decimals` y `unit` por columna: sin `decimals`, una columna de ROAS sale «4.2 · 4.5 · 3.5 · 3» y la coma deja de alinearse.
**Descripción.** Las 11 formas que el contrato ya declara, con las reglas
mínimas de §8 del documento.
**Criterio de aceptación.**
- `escalarConIntervalo` y `serieConBanda` traen `lo`, `hi` y `nivel`
  obligatorios: **prohibida la estimación puntual sin intervalo**.
- `composicion` trae `porcentaje` calculado por el backend, y suma 100.
- `ranking` trae `posicion` ≥ 1.
- `prosa` trae pilares como **objetos**, nunca cadenas parseables.
- `tabular` declara por columna si es numérica, con `decimales` y `unidad`.

### B1.15 ⬜ Validar reglas mínimas por forma antes de enviar
**Espera del backend.** **`percentage` siempre en `composition`**, y la banda completa en `scalar_with_interval`.

**NO depende de Snowflake.** La validación vive en el servicio y en el transformador, no en la vista.

**Qué hay que hacer, concretamente:**

1. En `composition`, que `percentage` salga **siempre**. Hoy `transformComposition` solo lo escribe si venía en la fila. Lo puede calcular el backend —la suma de las partes es conocida ahí— y **el front no**: el contrato dice por qué, la suma tiene que dar 100 y redondear en el cliente produce columnas que suman 99,9.
2. En `scalar_with_interval`, exigir `lo`, `hi` y `level` antes de escribir en `panel_data`. Sin los tres, el front rechaza: «un pronóstico sin banda no se publica» es regla dura 6.

**Un aviso para que no lo prioricen mal: hoy ninguna métrica del seed usa `composition`**, así que este caso no se está ejercitando en ninguna pantalla. Es prevención, no un defecto que alguien esté viendo.
**Criterio de aceptación.**
- Un panel `gauge` sin `maximo` en `opciones` no se sirve como `DISPONIBLE`.
- Una `serieTemporal` con cero puntos llega como `DISPONIBLE` con `vacioRazon` y
  `vacioDesbloqueaCon`, no como un array vacío: §8 pide que el vacío sea
  invitación a actuar, y un array vacío no alcanza para escribir «el período
  cierra el 1 de septiembre».

### B1.16 ⚠️ Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. El seed deja un layout publicado con **12 paneles y 6 tipos** —`prose`, `kpi`, `bars`, `series`, `table`, `reco`— sobre 12 métricas. Excede los 4–6 que pedía. **Parcial** solo por «Brand Momentum».
**Espera del backend.** **La métrica «Brand Momentum»**, que esta tarea pide por nombre y el seed no incluye. Si el requisito quedó viejo, conviene sacarlo de `tareas-front-back.md` —que es de los dos equipos—: mientras esté escrito, el próximo que lea la tarea la va a dar por incompleta.
### ➕ B1.20 ⬜ Seed determinista para desarrollo del front
**Descripción.** B1.16 pide datos de demo. Esto pide que sean **estables**: el
front necesita que la misma llamada devuelva lo mismo para poder escribir
pruebas de integración contra HTTP.
**Criterio de aceptación.**
- Un script recrea el seed de cero.
- Con el seed cargado, `panels:batch` devuelve los mismos valores en dos
  corridas.
- El seed cubre al menos un panel por cada estado: `DISPONIBLE`, `DEGRADADO`,
  `BLOQUEADO`, `ERROR`. Sin eso, F2.1–F2.4 no se pueden probar contra el backend.

### ➕ B1.21 ⬜ Declarar los mínimos de datos por gráfico
**Espera del backend.** **La ruta `/config/plots` con el repertorio de gráficos y sus mínimos.** Bloquea F1.31 y F4.21.

**NO depende de Snowflake.** No toca datos: es una tabla de reglas y un endpoint, como `/config/blocks`.

**Pero la primera mitad es NUESTRA y todavía no está.** El repertorio declara hoy `formas`, `soportaBanda` y `tope` —el límite superior— y **no declara mínimos**. Decidir cuántos puntos necesita una serie, cuántas categorías una barra y cuántas partes una composición para no engañar es trabajo de producto y front, no de backend.

**El orden que proponemos:**

1. El front declara los mínimos por gráfico y los propone en el contrato.
2. El backend los sirve en `/config/plots`, con la misma figura que `/config/blocks`: una tabla global, no por tenant.

**Sirve desde el primer día aunque haya un gráfico por tipo**, que es por qué está en Fase 1 y no en Fase 4: hoy nada impide que `bars` reciba un ítem y dibuje una barra sola.
**Descripción.** D2: *los gráficos dependen de los datos, y hay que establecer los
datos mínimos para construir el gráfico*. `contracts/synapse-plots.js` declara
hoy `formas`, `soportaBanda` y `tope` —el límite superior— pero **no declara
mínimos**, así que nada impide que un gráfico reciba menos datos de los que
necesita y dibuje algo que engaña.

Va en Fase 1 y no en Fase 4 porque **sirve ya**, aun con un solo gráfico por
tipo: hoy `bars` puede recibir un ítem y dibujar una barra sola.
**Criterio de aceptación.**
- Cada entrada del repertorio declara `minimos` con su **razón**, no solo un
  número: la razón es lo que se muestra en pantalla.
- Se expone en `GET /config/plots`, con la misma forma con la que
  `/config/blocks` expone la tabla de bloques.
- Los mínimos son verificables contra el fixture: una serie de un punto, una
  composición de una parte y un ranking de dos ítems disparan el estado vacío con
  su razón.
- La tabla vive **en un solo lugar** y la consumen los tres que validan: el
  builder, `layouts/{id}/validate` y el adaptador del front.

### B1.17 ⬜ Modelo `Metrica`
**Espera del backend.** **`window` en el catálogo** — el único de esta lista que se ve en pantalla. El shell pinta `Base · {base} · {window}` en los doce paneles y en los siete estados, y sin él la línea queda `Base · COMPLETED · MONTH ·` con el separador colgando.

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
### B1.18 ⬜ Sincronizar el catálogo con las semantic views de Snowflake
**Espera del backend.** **La vista `SYNAPSE_METRIC_CATALOG`.** No existe en ninguna base de la cuenta —verificado con `SHOW OBJECTS`, cero filas—, así que `make sync-catalog` falla y el catálogo sale del seed de Postgres.

**ESTA ES LA QUE DEPENDE DE SNOWFLAKE**, y es la única de este bloque. Las otras cuatro son código.

**Qué hay que hacer, en orden:**

1. **Ingeniería de datos** corre `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` en el `db.schema` del agente del tenant —para UA MX, `DB_BT_UA.BT_UA_MART_ANALYTICS`—. Crea tres objetos: la tabla de curaduría, la vista que ustedes leen, y una tercera que lista lo que está mal con su razón.
2. **Producto y datos** escriben los campos marcados `⟨REVISAR⟩`: `BASE`, `MEASUREMENT_WINDOW` y `SOURCE`. Son texto que se pinta literal, así que se redactan.
3. **Grant de `SELECT`** para el rol del agente. Sin esto `sync-catalog` falla con un error de permisos que no dice qué falta.
4. **Backend** agrega `MEASUREMENT_WINDOW` al `SELECT` de `dd_catalog_sync_service.go` — ver B1.17.
5. Correr `make sync-catalog TENANT_ID=<uuid>`.

**El paso que se rompe en silencio es la clave.** `METRIC_KEY` tiene que caer en `MetricRegistry` o en el alias de `keys.go`: una clave que no está **sincroniza bien y después todos los paneles salen `BLOCKED`** sin que nada lo explique. Nos pasó al escribir la primera versión de ese SQL.

Los pasos completos están en `docs/snowflake/INSTRUCCION-ALTA-TENANT.md`. **Nosotros no corremos nada en Snowflake.**
### B1.19 ⬜ Filtrar el catálogo por permisos de rol
**Espera del backend.** **Un usuario de prueba con un rol restringido.** El mecanismo está en el código, pero con el usuario que tenemos —rol `Planner`— el catálogo devuelve las doce métricas, incluidas `executive_summary`, `roas` y `decisions`, que su propio documento dice que `planner` oculta. No decimos que esté roto: no se puede comprobar. Con un usuario así se cierran las dos mitades en un minuto — el catálogo recortado y un panel en `FORBIDDEN`.
**Criterio de aceptación (los tres).**
- El catálogo declara `granoMinimo` por métrica: el período más fino que puede
  contestar.
- Una métrica cuyo insumo está en `SILVER` no declara `GOLD`: la compuesta
  hereda la peor capa.
- Cambiar el catálogo incrementa `catalogVersion`, y ese número viaja en cada
  payload.

### El catálogo en Snowflake · 2026-09-14

**Verificado el 2026-09-11 con consultas de solo lectura contra la cuenta.** Las
dos tablas Gold que el materializador consulta existen y tienen las quince
columnas que su SQL nombra: `GLD_ECOMM_DAILY_PERFORMANCE` (11/11) y
`GLD_PAID_MEDIA` (4/4). **No falta ninguna tabla.**

Lo que falta es **`SYNAPSE_METRIC_CATALOG`, que no existe en ninguna base de la
cuenta**. Por eso `make sync-catalog` falla y el catálogo que sirve la API sale
de un seed de Postgres en vez de Snowflake.

**El front no ejecuta nada de esto.** Las tareas quedan registradas acá porque
bloquean trabajo nuestro; las corre y las revisa quien es dueño de la cuenta. El
SQL está escrito en `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` y la instrucción
paso a paso en `docs/snowflake/INSTRUCCION-ALTA-TENANT.md`.

**Y no hay ningún prompt que construir.** El catálogo y la materialización son
SQL de punta a punta: el agente de Cortex solo aporta credenciales y el
`db.schema` donde buscar. El agente se usa en `/chat/stream`, que es otro
producto.

#### ➕ B1.22 ⚠️ Crear el catálogo de métricas en Snowflake
**Verificado el 2026-09-15 contra el servicio corriendo.** **El lado de Snowflake está HECHO** —lo entrega `docs/snowflake/synapse-catalogo-metricas.md`, del equipo de datos: la vista `SYNAPSE_METRIC_CATALOG` existe en `DB_BT_UA.BT_UA_MART_ANALYTICS`, con `DD_METRIC_CURATION` detrás, la vista de validación `SYNAPSE_METRIC_CATALOG_ISSUES` en cero filas y el grant para `SYNAPSE_APP_ROLE`.

**Queda en ⚠️ y no en ✅ porque `make sync-catalog` NO se corrió**, y eso se ve desde acá sin preguntarle a nadie: `GET /config/catalog` devuelve **doce métricas con las claves de la semilla de Postgres** —`sales`, `investment`, `visits`, `goals_vs_actual`, `executive_summary`, `decisions`…— y no las **diez** que la vista de Snowflake declara —`revenue`, `spend`, `sessions`, `goal_attainment`, `platform_return`, `media_efficiency_12m`…—. El catálogo que la consola consume **sigue saliendo del seed**.

**Y hay una consecuencia que conviene ver antes de correrlo, no después:** de las doce de hoy, **`executive_summary` y `decisions` no están** en las diez de Snowflake. Son los paneles de prosa y de recomendación. Después del sync, o se agregan a `DD_METRIC_CURATION` o esos dos paneles se quedan sin métrica.

**Descripción.** Los tres objetos en el mismo `db.schema` que tiene configurado
el agente del tenant —para UA MX, `DB_BT_UA.BT_UA_MART_ANALYTICS`—, más el grant
de lectura para el rol del agente.

`DD_METRIC_CURATION` es una tabla y lleva lo editorial; `SYNAPSE_METRIC_CATALOG`
es la vista que el backend lee, con las once columnas de su `SELECT` y esos
nombres exactos; `SYNAPSE_METRIC_CATALOG_ISSUES` lista lo que está mal con su
razón.

Son tres y no uno porque `INFORMATION_SCHEMA.SEMANTIC_METRICS` da nombre,
expresión y tipo de dato, y **ningún** campo de gobierno: esos son editoriales y
necesitan dónde escribirse. Y la tercera existe porque Snowflake **no hace
cumplir un `CHECK`**, así que los enumerados cerrados se verifican o no se
verifican.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §4 paso 1 y paso 4 · el SQL listo para correr en `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` secciones 1 a 3.

**Criterio de aceptación.**
- `SELECT * FROM SYNAPSE_METRIC_CATALOG` devuelve filas desde el `db.schema` del
  agente, no desde una ruta fija: el backend califica la vista con lo que dice
  `agents`, y una vista en el schema equivocado no se encuentra.
- `SHOW GRANTS ON VIEW SYNAPSE_METRIC_CATALOG` muestra `SELECT` para el rol de
  `tenants.snowflake_role`. Sin esto `sync-catalog` falla con un error de
  permisos que no dice qué falta.
- Las once columnas salen con los nombres que el `SELECT` de Go espera. Una
  renombrada hace fallar la sincronización entera, no una métrica.
- **La vista de issues NO filtra la vista principal.** Un catálogo que se arregla
  descartando en silencio la fila mala hace que la métrica desaparezca del
  dashboard sin que nadie sepa por qué.

#### ➕ B1.23 ⬜ Escribir el gobierno de las métricas
**Descripción.** La semilla deja las filas con `BASE`, `MEASUREMENT_WINDOW` y
`SOURCE` marcados `⟨REVISAR⟩`. Son **texto que se pinta literal en pantalla**, así
que se redactan, no se generan. También hay que revisar `FAMILY` —de ahí sale el
color de cada serie— y `SEMANTIC_DIRECTION`, que se propusieron desde la
expresión SQL.

Van con marcador y no con un valor plausible por una razón: **una BASE inventada
se lee bien y miente**, y nadie la audita después.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §4 paso 2 · la semilla con los campos marcados `⟨REVISAR⟩` está en `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql` sección 4.

**Criterio de aceptación.**
- `SELECT * FROM SYNAPSE_METRIC_CATALOG_ISSUES` devuelve **cero filas**. Mientras
  devuelva algo, dice qué métrica y por qué.
- Ninguna fila activa conserva el marcador `⟨REVISAR⟩` en los tres campos.
- `BASE` declara un denominador, no una descripción: «312 SKU críticos sobre
  18.240 activos» y no «ventas del período».
- `MEASUREMENT_WINDOW` declara **el período que mide la métrica**, no el de la
  consulta. Son cosas distintas y confundirlas es el bug.
- `FAMILY` cae en las cinco que tienen rampa de color. Una sexta pinta la serie
  sin color y no falla: es el mismo modo de silencio que una utilidad que nombra
  un token inexistente.
- Cada fila lleva `CURATED_BY`: un campo de gobierno sin quién lo firmó no es
  auditable, que es justamente lo que estos campos existen para sostener.

#### ➕ B1.24 ⬜ Alinear las claves del catálogo con el registro de queries
**Descripción.** `METRIC_KEY` no es un nombre libre. El materializador tiene doce
queries en un mapa de Go (`MetricRegistry`) y las busca **por esa clave**, con un
mapa de alias en `snowflake/keys.go` como único puente.

**Es el paso que se rompe en silencio:** una clave que no está en el mapa
sincroniza bien, compone bien, y después sale `BLOQUEADO` sin que nada explique
por qué. Es el mismo modo de falla que el spread condicional con una prop mal
escrita, tres capas más abajo.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §4 paso 3, que trae la tabla de las doce claves y los ocho alias · el porqué, en `docs/snowflake/CONTRATO-DE-TENANT.md`.

**Criterio de aceptación.**
- Toda `METRIC_KEY` activa resuelve a una entrada de `MetricRegistry`, directo o
  por alias. Verificado corriendo el materializador, no leyendo las dos listas.
- Una clave nueva entra con su alias en `keys.go` **en la misma jugada**. Las dos
  mitades se mueven juntas o no se mueven.
- `exec_resumen` y `month_decisions` **no se curan todavía**: el materializador
  ya las trae con `Blocked: true` y la razón escrita —«Requires
  BT_UA_DECISION_LOG actionable framework»—. Curarlas publicaría dos paneles que
  solo pueden salir bloqueados.
- Queda escrito que las claves de `SV_SYNAPSE_UA_ANALYTICS` **no sirven**: el
  materializador no lee la capa semántica, lee las tablas Gold directo. Es el
  error que ya se cometió una vez al escribir la primera semilla.

#### ➕ B1.25 ⚠️ `ventana` de punta a punta · de la vista al payload
**Espera del backend.** **Ya no espera a Snowflake: espera dos líneas de Go.** Verificado el 2026-09-15.

`MEASUREMENT_WINDOW` **existe en la vista, con valor en las diez métricas y sin nulos** —lo entrega el equipo de datos en `docs/snowflake/synapse-catalogo-metricas.md` §8—, y con ese nombre justamente para no chocar con `WINDOW`, reservada en ANSI. Falta lo de siempre: leerla en el `SELECT` de `dd_catalog_sync_service.go` y exponerla en `GET /config/catalog`.

**Comprobado contra el servicio corriendo:** las claves de una métrica de `/config/catalog` son `base, catalog_version, created_at, dimensions, family, id, key, layer, min_grain, name, semantic_direction, shape, source, tenant_id, updated_at`. **No hay ningún campo de ventana**, ni `measurement_window` ni `window`.

**Y la pregunta que el equipo de datos nos devuelve, contestada:** el nombre del campo JSON lo acordamos backend y front, y **al front le da igual** — el adaptador de F1.33 renombra, es lo que hace con los catorce campos que ya traduce. **Que sea `measurement_window`**, igual que la columna: un tercer nombre para el mismo dato es una traducción más que mantener, y el cable ya sale en snake_case.

**Descripción.** Lo único de este bloque que es código y no Snowflake, y es de una
línea en dos lugares: agregar `MEASUREMENT_WINDOW` al `SELECT` de
`dd_catalog_sync_service.go`, y el campo a `DDCatalogMetric` para que salga por
`GET /config/catalog`.

**Sin esto la consola no se puede entregar.** `PanelShell` pinta
`Base · {base} · {ventana}` en la cabecera de **todos** los paneles y en **todos**
sus estados —es shell, no cuerpo, así que no se reemplaza nunca— y el template
literal imprime la cadena `undefined`, no un hueco.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §4 paso 5.

**Criterio de aceptación.**
- `GET /config/catalog` devuelve el campo para cada métrica.
- Ningún panel de la consola muestra `undefined` en la línea de BASE, en ninguno
  de los siete estados.
- La columna se llama `MEASUREMENT_WINDOW` y no `WINDOW`: `WINDOW` es reservada
  en ANSI y obligaría a citarla en la vista, en el `SELECT` de Go y en cada
  consulta a mano. Si se prefiere `WINDOW`, se decide **antes** de escribir el
  campo, no después.
- El front lo consume por el adaptador de F1.33 sin lógica nueva: es un renombre,
  no un cálculo.

#### ➕ B1.27 ⚠️ El período declara si está cerrado
**Espera del backend.** **Un campo en `Periodo`** que diga si el período está cerrado o en curso — pedido el 2026-09-15.

`availablePeriods()` emite los últimos doce meses **contando el actual**, y el actual está incompleto. Hoy los trece llegan iguales: una cadena `2026-09`. La consola los ofrece todos con la misma pinta, y quien compare el mes en curso contra el anterior lee una caída que es «todavía no terminó».

**Es barato de los dos lados**: el backend ya sabe cuál es el mes en curso al generarlos. Y con eso el front lo marca —el `.pen` lo dibuja en B5: «1 – 31 JUL 2026 · **MTD CERRADO**»— sin comparar contra el reloj del navegador, que sería el error: el corte del día es **del tenant y su huso**, no de quien mira.

**Lo pidió el equipo de datos sin saberlo.** Su aviso decía «si la consola deja elegir meses futuros, mostrará 0 y roas 0x». Los futuros no se ofrecen —verificado en `availablePeriods()`—, pero el mes en curso sí, y es el mismo problema en chico.

#### ➕ B1.26 ⬜ Decidir cómo escala el registro, antes del segundo tenant
**Descripción.** El catálogo vive en Snowflake y el registro de queries en Go:
**dos mitades del mismo hecho, en dos lugares, que se pueden separar sin que nadie
se entere.** El puente es el mapa de alias de `keys.go`, escrito a mano.

Un tenant cuyo catálogo declare `ventas` no tiene alias, no encuentra query, y la
métrica sale bloqueada. Con un tenant se sostiene; con el segundo deja de
sostenerse.

**A · contrato de forma:** todo tenant expone dos objetos con las quince columnas,
vía una vista que renombre lo que ya tenga. Barato y rígido — sin `BUDGET_TARGET`
no hay `goal_attainment`.
**B · el registro pasa a ser dato:** `MetricRegistry` sale de Go a una tabla por
tenant. Caro y flexible — la clave del catálogo **es** la del registro y el alias
desaparece.
**Guía:** `docs/snowflake/CONTRATO-DE-TENANT.md` §7 y `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §7, con los dos caminos y su costo.

**Criterio de aceptación.**
- La decisión queda escrita con su razón, no elegida por omisión al dar de alta
  el segundo tenant.
- Si se elige A, **B queda declarado como destino y con fecha**. A sin fecha para
  B es cómo el mapa de alias termina con cuarenta entradas.
- Si se elige A, queda escrito qué pasa con un tenant al que le falta una columna:
  hoy el panel sale bloqueado sin razón, y §8 pide estado, razón y qué lo
  desbloquea.
- La decisión nombra quién es dueño de la vista por tenant: hoy `sync-catalog`
  asume que existe y falla sin decir que falta.


---

## Fase 2 — Materialización y cache

### B2.1 ⬜ Tabla `panel_data`
**Descripción.** El snapshot materializado con gobierno completo por
`(tenant_id, metric_id, periodo)`. Es la fuente del batch y sobrevive reinicios.
**Criterio de aceptación.**
- Guarda el `Valor` ya transformado a su forma, no el resultado crudo de la
  query.
- Guarda `frescura` como el instante de materialización.
- Se puede auditar: qué había en un panel el mes pasado es consultable.

### B2.2 ⬜ Job de materialización
**Descripción.** Por cada tenant × métrica × período activo: consultar
Snowflake o el semantic layer, transformar a `Valor + Gobierno + Presentacion`,
escribir en `panel_data`.
**Criterio de aceptación.**
- Un dashboard de 30 paneles **no dispara 30 queries a Snowflake al cargar la
  página**: el batch lee cache.
- El job es idempotente: correrlo dos veces sobre el mismo período no duplica.
- Un fallo en una métrica no aborta el resto del job.

### B2.3 ⬜ El batch lee de `panel_data`, no de Snowflake
### B2.4 ⬜ Redis opcional encima de Postgres
**Criterio de aceptación.**
- `batch → Redis hit? → return` · `miss → Postgres → populate → return`.
- **Redis no es fuente de verdad.** Vaciarlo no pierde datos: los repuebla desde
  Postgres.
- TTL corto, 5–15 minutos.

### B2.5 ✅ Estado `DEGRADADO`
**Verificado el 2026-09-14 contra el servicio corriendo** · commit `733c13c`. Los doce paneles llegan en `DEGRADED` con razón redactada por el servidor —«Stale data: last materialization is older than 3 days»— y `unlocks_with`. **El front no decide que algo está degradado**: lo deriva `isDegraded` del servicio.
**Descripción.** Si `frescura > cadencia × tolerancia`, el panel se marca
degradado con `razon` y `desbloqueaCon`.
**Criterio de aceptación.**
- **El backend decide**, no el front: `nuevo-desarrollo.md` §1.3 dice que el
  front no calcula degradación.
- `DEGRADADO` **sí lleva valor**: muestra la cifra y declara la limitación. No
  es un estado sin dato.
- La cadencia y la tolerancia son configurables por métrica, no una constante.

### B2.6 ⬜ Estado `BLOQUEADO`
**Criterio de aceptación.**
- Job fallido o precondición incumplida → **sin valor**, con `razon` y
  `desbloqueaCon`.
- **No se inventa un número aproximado.** §8 de `design.md`: si un feed está
  vencido, el panel muestra estado, razón y qué lo desbloquea.

### B2.7 ⬜ Estado `SIN_PERMISO` en el batch · 🔒 depende de B0.9 (línea 1171)
### B2.8 ⬜ Invalidar cache al publicar layout
### B2.9 ⬜ Invalidar cache al completar materialización
### B2.10 ⬜ `frescura` = instante de materialización, nunca «ahora»
### B2.11 ⬜ Filtrado por rol también en el batch
**Criterio de aceptación (los cinco).**
- Publicar un layout deja de servir el anterior en la siguiente request.
- Un panel recién materializado se ve con su frescura nueva sin esperar el TTL.
- Un rol sin permiso sobre una métrica no recibe su payload aunque conozca el
  `panelId`.

#### ➕ B2.12 ⬜ Correr el materializador contra datos reales y verificar los seis estados
**Descripción.** Con el catálogo ya en Snowflake (B1.22–B1.24), correr
`make materialize TENANT_ID=<uuid> PERIOD=<YYYY-MM>` y comprobar que la consola
pinta datos del negocio y no los del fixture del seed.

Es la primera vez que el camino completo se ejercita de punta a punta: vista →
`sync-catalog` → `dd_catalog_metrics` → `materialize` → `dd_panel_data` →
`panels:batch` → panel.
**Guía:** `docs/snowflake/INSTRUCCION-ALTA-TENANT.md` §5, la verificación de punta a punta.

**Criterio de aceptación.**
- `POST /config/panels:batch` devuelve `AVAILABLE` con **valores distintos a los
  del fixture**. Que conteste 200 no alcanza: el seed también contesta 200.
- **Si llegan todos en `BLOCKED`, es B1.24** —las claves no caen en el registro—
  y no un problema de datos. Queda escrito, porque el síntoma no lo dice.
- Los seis estados se verifican contra el servicio real y no contra MSW:
  `DEGRADED` envejeciendo `materialized_at` en la base, `BLOCKED` pidiendo un
  período sin materializar, `FORBIDDEN` con el rol `planner`, `ERROR` con un
  `gauge` sin `maximum`.
- Las nueve formas que el transformador produce se ven en pantalla al menos una
  vez. Las siete que no produce quedan anotadas como no alcanzables, con la
  razón: no es un panel roto, es una forma que el backend no materializa.
- Queda registrado contra qué commit del backend y con qué período se verificó.
  Un «funcionó» sin eso no se puede repetir.

#### ➕ B2.13 ⬜ Salud de feeds por fuente · de acá sale el ESTADO de cada métrica
**Espera del backend.** **Una ruta que liste, por fuente del tenant: última carga, frescura, cadencia y tolerancia.** Más, si existen, filas procesadas y filas que fallaron la validación Silver→Gold.

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
**Descripción.** Exponer la salud de las fuentes de datos del tenant, que hoy no
sale por ninguna ruta.
**Criterio de aceptación.**
- Por fuente: identificador legible, última carga, frescura, cadencia y
  tolerancia. Sin vocabulario de infraestructura · §7.3.
- La frescura es el **instante de materialización**, nunca «ahora» · misma regla
  que B2.10.
- El front deriva el estado y **el backend no lo manda**: un estado guardado y
  una frescura real son dos fuentes del mismo hecho.


---

## Fase 3 — Chat contextual

### B3.1 ⬜ `POST /config/chat` con SSE
**Espera del backend.** **La ruta ya está escrita** — `82da946` la trae con `panel_context: {panel_id, period}`, y con eso se cerró la transversal T4. Lo que falta es **poder verificarla**: sin las migraciones de B3.11 el handler escribe contra columnas que no existen. Lo pendiente del chat son los dos campos del evento `data` que pide F3.6 — la BASE de la cifra y su frescura—, detallados en `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`. El chat que el servicio ya tenía antes es **otro producto** —decidido el 2026-09-08—: el nuestro se abre desde un panel y lleva su métrica.
**Descripción.** Body `{ pregunta, contextoPanel, periodo, hiloId? }`, respuesta
por Server-Sent Events.
**Criterio de aceptación.**
- Emite los eventos en orden: `pensando` → `fragmento` → `dato` → `sql` →
  `fin`, y `error` en cualquier punto.
- El esquema `EventoDeChat` del yaml ya declara la unión; se respeta.
- Una conexión cortada por el cliente no deja la query colgada.

### B3.2 ⬜ `GET /config/chat/hilos` — historial
### B3.10 ⬜ Persistir hilos y mensajes en Postgres
**Criterio de aceptación.**
- El historial es del usuario y del tenant; nunca cruza tenants.
- Un hilo guarda el contexto de panel con el que se abrió.

### B3.3 ⬜ Modelo `AgenteTenant`
### B3.4 ⬜ Resolver el agente del tenant desde el JWT
**Descripción.** `snowflakeAccount`, `warehouse`, `semanticViews[]`,
`systemPromptBase`. El front solo conoce que existe un tenant; el backend
resuelve el agente.
**Criterio de aceptación.**
- Cada tenant puede tener semantic views, vocabulario y restricciones distintas.
- El front **nunca** recibe la configuración del agente ni la lista de vistas.

### B3.5 ⬜ Inyectar `ContextoDePanel` en el system prompt
**Criterio de aceptación.**
- El agente recibe el contexto de la métrica: `metricId`, `metricKey`, `nombre`,
  `base`, `fuente`, `capa`, `familia`, `periodo`, `tipo`.
- **No recibe el SQL del panel.** El panel se ancla a un `metricId`, y el agente
  también.

### B3.6 ⬜ Consulta a Snowflake en vivo para el chat
**Descripción.** El chat sí puede ir en vivo: es una consulta puntual iniciada
por el usuario, no un dashboard entero.
**Criterio de aceptación.**
- Solo contra las semantic views aprobadas del tenant.
- Con timeout y con tope de filas declarados.

### B3.7 ⬜ Formato de eventos SSE acordado con el front (T3)
### B3.8 ⬜ La respuesta puede incluir `{ forma, datos, procedencia }`
**Criterio de aceptación.**
- Cuando el agente devuelve un dato estructurado, viene con la **misma unión
  `Valor` + `Gobierno`** que un panel, para que el front lo dibuje con el mismo
  cuerpo. Es un solo modelo de datos, no dos.

### B3.9 ⬜ CRUD `/admin/tenants/{id}/agents`
**Espera del backend.** **La ruta entera** — pedida el 2026-09-15, cuando F4.4 quedó sin nada que consumir.

Existe `POST /admin/agents` y **nada más**: no hay forma de leer la configuración de un tenant ni de editarla. Las seis rutas de `/admin/*` que el servicio sirve no incluyen ninguna de agente.

**Y lo que el front necesita no es la configuración, es su CONSECUENCIA.** §7.3 prohíbe mostrar vocabulario de infraestructura —ni base, ni rol técnico, ni warehouse, ni grant— y pide en su lugar: **si el acceso a datos está vigente, cuándo se verificó por última vez, y qué hacer si no lo está.** Tres campos, no un CRUD.

Con esos tres, F4.4 y la mitad que le falta a la ficha de cliente se cierran. El CRUD completo de B3.9 es otra cosa y puede esperar: **lo que bloquea es el estado, no la edición.**

**Descripción.** El superadmin configura el agente de cada tenant: cuenta,
warehouse, vistas semánticas permitidas y prompt base.
**Criterio de aceptación.**
- Solo accesible con `aud: platform`.
- La credencial **no se edita acá**: se referencia por identificador del gestor de
  secretos (B0.8), y ninguna respuesta la incluye.
- Cambiar las vistas permitidas surte efecto en la siguiente pregunta, sin
  reiniciar el servicio.

### ➕ B3.11 ⬜ Aplicar las migraciones de `82da946` sobre la base compartida
**Espera del backend.** **Que corran las migraciones manuales de `82da946`** — pedido el 2026-09-21 en `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`, tarea 1.

Medido ese día contra la base compartida, con una consulta de sólo lectura sobre `information_schema`: **faltan las nueve columnas y el índice.** Las agrega `internal/adapters/repository/manual_migrations.go` y corren sólo con `DB_AUTO_MIGRATE=true`, que no activamos sobre esa base: es un cambio de esquema en una base compartida y la decisión no es nuestra.

Sin ellas `POST /config/chat` no puede guardar el hilo, y eso se ve como un **500, no como un 404**: la ruta existe, lo que falta es la columna.

| Tabla | Columnas | De qué tarea son |
|---|---|---|
| `user_threads` | `panel_id`, `period`, `deleted_at` | B3.1 y B3.10 |
| `agents` | `is_active`, `semantic_views`, `system_prompt_base` | B3.3 y B3.9 |
| `dd_panel_data` | `last_error`, `last_error_at`, `last_success_at` + índice `idx_dd_panel_data_tenant_metric_period` | Materialización · B2.12 |

**Descripción.** Aplicar las columnas que el commit escribe, y el índice.

**La tabla va ARRIBA de `Descripción` a propósito.** `para-backend.py` corta el
bloque en `**Descripción` o `**Criterio`, así que lo que quede debajo **no llega
a `docs/PARA-BACKEND.md`**, que es el documento que ellos leen. Abajo, las nueve
columnas se quedaban acá.

**Y el nombre del mensaje va sin enlace, también a propósito.** El generador
copia el texto verbatim, sin reescribir rutas: `](docs/…)` es correcto desde la
raíz y apunta a `docs/docs/…` una vez dentro de `docs/PARA-BACKEND.md`. El mismo
texto vive a dos profundidades, así que no hay ruta relativa que sirva en las
dos.

**Qué frena en el front.** No frena la construcción: frena la **verificación
contra el servicio**. F3.12 y F3.3 no se pueden abrir contra el chat real, F3.7
no puede mostrar con qué panel se abrió un hilo, y F4.4 se construye contra MSW
pero no se verifica.

**Criterio de aceptación.**
- La consulta del mensaje sobre `information_schema` devuelve **las nueve**
  columnas, las tres tablas incluidas. **La corremos nosotros**, contra la base
  compartida y con fecha: el aviso de que se corrieron no alcanza para
  cerrarla.
- El índice único existe, o hay una razón escrita de por qué no. El código de
  ellos **no lo crea si encuentra duplicados** y lo avisa por log, así que su
  ausencia no es necesariamente un error.
- `POST /config/chat` contra el servicio con `panel_context` guarda el hilo, y
  `GET /config/chat/threads` lo devuelve con su panel y su período.

---

## Fase 4 — Admin y Builder

### B4.1 ⚠️ `GET /admin/tenants`
**Espera del backend.** **Cinco campos en `GET /admin/tenants`**: `status`, `vertical`, `user_count`, `oldest_feed_freshness` y `last_published_at`.

Hoy devuelve `ports.TenantPublicOption` —`id` y `name`—, que nació para llenar un
selector. **§7.3 de `design.md` describe la banda de clientes de A1 con seis
columnas**, así que la pantalla muestra una y declara que faltan cinco.

No bloquea: la lista funciona y el builder puede elegir tenant. Lo que falta es
lo que convierte una lista en una pantalla de administración — saber de un
vistazo qué cliente tiene el feed más atrasado es la mitad de para qué existe.

### B4.2 ⚠️ `GET /admin/tenants/{id}/layouts`
**Espera del backend.** **Autor, diferencia y reversión en `LayoutVersion`** — pedido el 2026-09-15, cuando F4.6 declaró B6.

§7.2 describe el historial de versiones en una línea: «**quién, cuándo, qué cambió. Permite revertir.** Sin esto, un error de composición en producción no tiene vuelta atrás». La respuesta de hoy trae **cuándo** y nada más.

- **Quién.** El criterio compartido de B4.2–B4.7 ya dice que publicar «registra quién publicó», así que el dato existe del lado de ustedes; lo que falta es que salga en la respuesta.
- **Qué cambió.** Contra la versión publicada anterior. No hace falta un diff estructural: alcanza con qué pestañas y qué paneles se agregaron, se quitaron o se movieron.
- **Revertir.** No hay ruta. `POST /admin/tenants/{id}/layouts` acepta un `version_id` de origen, así que puede que ya alcance con documentar que duplicar una versión vieja **es** revertir — si es así, es una línea de documentación y no código.

**No bloquea el builder**, bloquea B6. Y B6 es la pantalla que hace reversible un error de composición en producción: sin ella, la única salida es recomponer a mano.

### B4.3 ⬜ `POST /admin/tenants/{id}/layouts` — crear borrador
### B4.4 ⚠️ `PUT /admin/layouts/{id}` — editar pestañas y paneles
**Espera del backend.** **`chat_suggestions` e `icon` en la pestaña** — pedido el 2026-09-15, cuando F4.8 construyó el editor.

Los dos están en el modelo de §2 de `design.md` y en `Pestana` del contrato, y no están en `DDTab` ni en `TabInput`: **no hay dónde escribirlos ni de dónde leerlos**. `chatSugerencias[]` es lo que C3 pinta como «chips de consulta sugerida por pestaña», así que sin el campo el chat abre en un vacío sin sugerencias. `icono` es menor y va de paso, porque es la misma línea.

**Y una pregunta que es de ustedes, no un pedido.** `OperationalQuestion` no es requerido y el servicio acepta la cadena vacía. El producto dice lo contrario —«una pestaña que no contesta una pregunta no se compone», §7.2 y la descripción de `Pestana`—, así que hoy **la regla la sostiene el front solo**: el editor marca la pestaña, la cuenta y no la deja componer. Si además la rechazara el `validate` o el `publish`, la regla dejaría de depender de qué cliente haga el PUT. Es B4.15 quien decidiría.

### B4.5 ⬜ `POST /admin/layouts/{id}/publish`
### B4.7 ⬜ `GET /admin/tenants/{id}/catalog`
**Criterio de aceptación (los seis).**
- Solo accesibles con `aud: platform`; con token de usuario devuelven `403`.
- Publicar genera `versionId`, sella `publishedAt`, registra quién publicó e
  invalida la cache del tenant.
- Editar nunca muta la versión publicada.

### B4.6 ⬜ `POST /admin/layouts/{id}/validate`
### B4.11 ⬜ Validar que `metricId` existe en el catálogo del tenant
### B4.12 ⬜ Validar que `tipo` es compatible con la `forma` de la métrica
### B4.13 ⬜ Validar rangos de `colSpan` / `rowSpan` por tipo
### B4.14 ⬜ Validar opciones de layout (`maximo` obligatorio en gauge)
### B4.15 ⬜ Rechazar la publicación si hay paneles inválidos
**Descripción.** La validación de composición, del lado del servidor. El front
la replica para dar feedback inmediato, pero **el servidor es el que decide**.
**Criterio de aceptación.**
- Un panel `gauge` sobre una métrica de forma `serieTemporal` no publica.
- Un `kpi` con `colSpan 8` no publica: su rango es 3–4.
- El error dice **cuál** panel y **por qué**, en la lengua del producto: «un
  bloque gauge no sabe dibujar la forma serieTemporal», no «validación fallida».
- La regla dura de `serieConBanda` se verifica: solo gráficos con banda.

### B4.8 ⚠️ CRUD de roles por tenant · **LO IMPLEMENTA EL FRONT** · 2026-09-15
**Decidido el 2026-09-15 (humano): esta la escribimos nosotros, en Go.**

**Y eso revierte una regla, así que va con su antecedente.** El 2026-09-08 se
había abierto `AntPack-dev/synapse-api-go#1` con dos cambios chicos y se
**revirtió** —commit `2de76de`— con un criterio que sigue valiendo en general:
«tocar el código de otro equipo desde afuera les saca la decisión de las manos y
parte en dos el lugar donde se revisa». Lo que proponíamos se describía y lo
aplicaban ellos.

**La excepción es de alcance, no de criterio.** B4.8 bloquea F4.3, y F4.3 es
superficie de admin que hoy no se puede ni empezar. Esperar un CRUD de roles para
construir la pantalla que lo consume deja parada una fase entera por un trabajo
que son cuatro endpoints sobre una tabla que ya existe.

**Sale de `docs/PARA-BACKEND.md`**: dejó de ser algo que esperamos.

**Qué hay que implementar.** Cuatro operaciones sobre `roles`, que ya tiene las
tres columnas desde B0.3 —`tab_ids uuid[]`, `hidden_metric_ids uuid[]`,
`layout_overrides jsonb`—, bajo `AdminOnlyMiddleware` como el resto de
`/admin/*`:

| | |
|---|---|
| `GET /admin/tenants/:tenantId/roles` | Listar, con las tres columnas |
| `POST /admin/tenants/:tenantId/roles` | Crear |
| `PUT /admin/roles/:roleId` | Editar las tres |
| `DELETE /admin/roles/:roleId` | Borrar · **rechazar si hay usuarios asignados** |

**Dos cosas que no son obvias y hay que respetar:**

- **`hidden_metric_ids` oculta y NO permite.** §1.4.20: el servidor vuelve a
  verificar en `/config/catalog` y en el batch. Un rol que oculta una métrica no
  es un rol que no puede pedirla — eso ya está implementado y no se toca.
- **`layout_overrides` no muta el layout publicado.** `GetTab` los aplica al
  responder. Un CRUD que los escriba mal recompone la consola de otro rol sin
  que nadie publique nada.

**Dónde vive el código: en un FORK.** Decidido el 2026-09-15 (humano). Un fork de
`AntPack-dev/synapse-api-go` sobre `feature/dynamic-dashboard-backend`, y ahí se
escriben B4.8 y B4.9.

**Es coherente con `2de76de` y no lo contradice.** Esa regla dice que no se toca
el repositorio de otro equipo *desde afuera*; un fork no lo toca. Escribimos en
nuestro lado y la decisión de integrarlo sigue siendo de ellos — que era el punto
de la regla: «les saca la decisión de las manos».

**Lo que un fork trae, y hay que sostenerlo:**

- **Deriva.** Su rama avanza y la nuestra no se entera sola. El aviso ya existe:
  `npm run backend-drift` compara el commit que el cable declara contra la cabeza
  de su rama. **Antes de tocar el fork se corre**, y si se movieron, primero se
  rebasa.
- **Un fork que nunca vuelve es un segundo backend.** Ese es el riesgo real, no
  el técnico: dos servicios que hacen casi lo mismo y divergen.

  **DECIDIDO el 2026-09-15 (humano): vuelve DESDE nuestro repositorio.** No se
  abre PR contra el suyo. El fork es la fuente y ellos lo toman cuando quieran —
  que es exactamente lo que `2de76de` protegía: «tocar el código de otro equipo
  desde afuera les saca la decisión de las manos». Acá la decisión de integrar
  sigue siendo de ellos, entera.

  **Lo que eso nos obliga a sostener**, porque el costo se muda a nuestro lado:

  1. **La rama se mantiene rebasada sobre la suya.** `npm run backend-drift`
     avisa cuando su cabeza se movió, y se corre **antes de tocar el fork**. Un
     fork escrito sobre una base vieja no se puede integrar sin rehacerlo.
  2. **El commit tiene que explicarse solo.** Nadie de su lado estuvo en la
     conversación donde se decidió: el mensaje lleva qué rutas, por qué se
     escribieron desde acá, y las decisiones que no son obvias.
  3. **Cero churn en su código.** Esto ya costó una corrección: ampliar
     `RoleRepository` rompía ocho mocks de `auth`, `user` y `agent`. Un puerto
     nuevo no rompe nada. **En un fork que tiene que volver, el churn evitable es
     lo que lo vuelve inmergeable.**
- **El despliegue no cambia hoy.** El servicio que corre sigue siendo el suyo. Si
  algún día se despliega el fork, esa es otra decisión y no esta.

**Criterio de aceptación.**
- Las cuatro operaciones existen bajo `AdminOnlyMiddleware` y responden con el
  envelope del servicio, no con uno nuestro.
- Borrar un rol con usuarios asignados **falla con razón**, no en cascada.
- `hidden_metric_ids` sigue siendo filtro de composición y no de permiso: el
  servidor verifica igual, y hay una prueba que lo demuestra pidiendo una métrica
  oculta directamente.
- `layout_overrides` escrito por el CRUD se refleja en `GET /config/tabs/:tabId`
  del rol afectado **sin republicar el layout**.
- El fork está rebasado sobre su rama **al empezar** —`npm run backend-drift` en
  verde— y se vuelve a rebasar antes de proponer el código de vuelta. Un fork
  escrito sobre una base vieja no se puede integrar sin rehacerlo.
### B4.9 ⚠️ Preview por rol · **LO IMPLEMENTA EL FRONT** · 2026-09-15
**Decidido el 2026-09-15 (humano), junto con B4.8** y por la misma razón: son
vecinas, tienen la misma forma, y las dos bloquean superficie de admin que hoy no
se puede empezar. El antecedente y el alcance de la excepción están escritos en
B4.8 y no se repiten acá. **Sale de `docs/PARA-BACKEND.md`.**

**Qué hay que implementar.** Una forma de resolver una pestaña *como la vería otro
rol*, bajo `AdminOnlyMiddleware`. Dos caminos y conviene elegir con cuidado:

| | |
|---|---|
| `GET /admin/layouts/:layoutId/preview?roleId=` | Ruta propia. Más explícita, y no toca `/config/*` |
| `GET /config/tabs/:tabId?asRoleId=` | Un parámetro en la ruta que ya existe. Menos código, **pero mete una capacidad de admin en el namespace de la consola** |

**La recomendación es la primera**, y no por gusto: `/config/*` lo sirve
`RequireUser` y su invariante es «lo que ves es lo tuyo». Un parámetro que lo
rompa es la clase de cosa que un día se llama sin `AdminOnlyMiddleware` delante.

**Y la propiedad que hace que esto sirva o no sirva:**

> **El preview tiene que pasar por el MISMO código de filtrado que la consola.**

`GetTab` ya aplica `roles.tab_ids`, `hidden_metric_ids` y `layout_overrides`. El
preview resuelve el rol de otra forma —del parámetro y no del JWT— y **de ahí en
adelante es la misma función**. Reimplementar el filtrado en paralelo es cómo el
preview termina mostrando algo que la consola no muestra, y un preview que miente
es peor que no tenerlo: se publica confiando en él.

Es la misma razón por la que F4.12 dice que no se puede simular en el cliente —
«filtrar en el front lo que ya se tiene probaría el filtro del front, que no
existe».

**Criterio de aceptación.**
- Bajo `AdminOnlyMiddleware`. Un usuario de consola que la llame recibe 403.
- **Reusa `GetTab`**, no una copia: verificable porque cambiar el filtrado en un
  solo lugar cambia la consola y el preview a la vez.
- Para un rol con `hidden_metric_ids`, el preview devuelve **menos paneles** que
  para uno sin ellos, y los `layout_overrides` de ese rol están aplicados.
- Un `roleId` de otro tenant devuelve **404 y no 403**: no se revela que existe,
  igual que `GET /config/tabs/:tabId`.
- **Queda escrito si el preview incluye payloads o solo el layout.** Con solo el
  layout alcanza para «CEO vs Planner», que es lo que F4.12 pide; con payloads
  hay que decidir qué período usa y si un panel oculto llega como `SIN_PERMISO` o
  no llega. Decidirlo antes, no durante.
### B4.8 y B4.9 escritas el 2026-09-15 · en el fork, y en ⚠️ y no en ✅

**El código está y las dos quedan PARCIALES**, que es lo que la regla de este
repositorio obliga: «el estado de una tarea de backend lo mueve el front, y solo
después de verificarlo **contra el servicio corriendo**». El fork no está
desplegado, así que no hay servicio contra el cual verificar. Marcarlas ✅ sería
exactamente la suposición con forma de hecho que esa regla persigue.

**Dónde está:** `gerardoriarte-bt/synapse-api-go`, rama `feature/roles-y-preview`,
partida de `feature/dynamic-dashboard-backend` en `733c13c` — el mismo commit que
`backend-drift` declara, verificado en verde antes de empezar. El fork es
**privado**, porque el repositorio de origen lo es. **No se abrió PR**: cómo
vuelve el código a ellos sigue sin decidirse, y esa decisión es anterior al
primer merge.

**18 pruebas nuevas, once mutaciones muertas, y las suyas siguen pasando sin
tocar una sola.**

### Cuatro decisiones del lado de Go que no son obvias

**Un puerto NUEVO en vez de ampliar el que estaba.** La primera versión le agregó
los cinco métodos a `RoleRepository` y **rompió ocho mocks** de `auth`, `user` y
`agent` que no tienen nada que ver con esta tarea. `DDRoleRepository` aparte,
implementado por el mismo adaptador, no rompe nada — y es la misma separación que
ya existe entre `dd_repositories.go` y `repositories.go`. **En un fork que tiene
que volver, el churn evitable es lo que lo hace inmergeable.**

**`Updates` con cuatro columnas, no `Save`.** Un `Save` de GORM manda el struct
entero, incluido `tenant_id`. Un rol no cambia de cliente, y dejar esa puerta
abierta es cómo un rol termina en otro.

**Borrar con usuarios se rechaza con la razón y el número.** La FK ya tiene
`OnDelete:RESTRICT`, así que fallaría igual — **como un error de Postgres
convertido en 500 que no le dice a nadie qué hacer**. Y en cascada sería peor:
dejaría usuarios sin rol, que es un usuario que no puede entrar a ninguna
pestaña. El `user_count` viaja además en el listado, para que la pantalla lo diga
antes de ofrecer el botón y no después del 409.

**`layout_overrides` ausente se escribe como `{}`, no como nil.** En un UPDATE
parcial, nil deja la columna intacta: «sin overrides» es un estado, no una
omisión.

### B4.9 · lo que salió gratis, y la decisión que había que tomar

**`GetTab` ya recibe el `roleID` por parámetro y no del JWT.** Eso hace que
«reusa `GetTab`, no una copia» no cueste nada: el preview resuelve el rol de otra
forma y de ahí en adelante es literalmente la misma función. Hay una prueba con
un espía que lo verifica llamada por llamada — si alguien reimplementara el
filtrado, el espía vería cero.

**Y va bajo `/admin/*` y no como `?asRoleId=` en `/config/tabs/:tabId`.** Ese
namespace lo sirve `RequireUser` y su invariante es «lo que ves es lo tuyo». Un
parámetro que lo rompa es la clase de cosa que un día se llama sin
`AdminOnlyMiddleware` delante.

**Decidido: el preview va SIN payloads**, que es lo que el criterio pedía
resolver antes y no durante. Con el layout alcanza para «CEO vs Planner». Con
payloads habría que decidir qué período usa y si un panel oculto llega como
`SIN_PERMISO` —dos decisiones de producto para una pantalla que no existe— y
materializar costaría lo mismo que la consola real. La respuesta lo declara en
`without_payloads`, para que nadie dibuje un cuerpo vacío creyendo que el panel
está en blanco.

### Las cinco rutas entran al cable marcadas como nuestras

`contracts/synapse-admin-wire.yaml` declara ahora **dos cosas distintas**: las
ocho de ellos y las cinco del fork, cada una con `x-origen: fork` y el aviso de
que **el servicio desplegado devuelve 404**. Están ahí porque F4.3 y F4.12 se
construyen contra MSW, igual que se construyó la consola entera antes de que
existiera el servicio.

### Una prueba que dice qué NO demuestra

`TestEditarNoTocaElTenantDelRol` prueba que el **servicio** no toca `TenantID`.
**No** prueba la otra mitad —que el repositorio escriba solo cuatro columnas—
porque el mock reemplaza el rol entero y esa mitad necesita una base de datos. Se
dejó dicho en el comentario en vez de dejar que el nombre prometiera de más.

### Lo que falta para cerrarlas en ✅

Un despliegue del fork, o que el código vuelva a su rama y se despliegue el suyo.
Recién ahí `humo.py` puede verificarlas contra un servicio corriendo — y para las
rutas de admin hace falta además **un usuario `admin`**, que sigue siendo el
mismo pedido que dejó `synapse-admin-wire.yaml` sin confirmar.

### B4.10 ⬜ Asignación de layout publicado a roles
**Espera del backend.** **Tres etiquetas `json:`** en `DDLayoutVersion`, `DDTab` y `DDPanel`, y un **`json:"-"`** en sus campos `Tenant` / `LayoutVersion` / `Tab`.

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
**Criterio de aceptación.**
- Un rol declara `tabIds[]`, `hiddenMetricIds[]` y `layoutOverrides` opcionales.
- El preview devuelve **exactamente** lo que ese rol vería, resuelto por el
  mismo código que sirve `/config/me`. No una simulación aparte.

### ➕ B4.16 ⬜ Declarar el gráfico en el layout
**Descripción.** D2 lo resolvió a favor. `PanelConfigurado` gana `plot?: PlotId`.
Depende de B1.21: **primero los mínimos, después el campo** — elegir gráfico sin
saber qué necesita cada uno es multiplicar el problema, no resolverlo.
**Criterio de aceptación.**
- `plot` es **opcional**: ausente ⇒ el gráfico por defecto del `tipo`, que es
  exactamente lo que se dibuja hoy. El cambio no mueve ninguna pantalla existente.
- `layouts/{id}/validate` verifica tres cosas contra el repertorio:
  compatibilidad gráfico ↔ forma, la regla dura de banda, y que la métrica pueda
  alcanzar los mínimos del gráfico en el grano que declara.
- Un layout con un gráfico incompatible **no publica**, y el error dice cuál
  panel y por qué.

---

## Fase 5 — Multi-dashboard y pulido

### B5.1 ⬜ Varios layouts por tenant
**Espera del backend.** **La lista de layouts que el usuario puede ver, en `/config/me`.** `GET /config/tabs/:tabId?layoutId=` ya funciona, pero no hay forma de saber qué layouts le tocan a alguien, así que el selector de F5.1 no se puede construir: no se ofrece una elección que no se sabe si existe.
**Descripción.** Un tenant puede tener más de un dashboard publicado —
«Operaciones», «Marca», «Ejecutivo»— cada uno con sus pestañas.
**Criterio de aceptación.**
- Cada layout versiona por separado: publicar «Marca» no toca «Operaciones».
- `/config/me` devuelve `layouts` solo cuando el usuario tiene más de uno
  asignado; con uno, el campo no viaja.

### B5.2 ⬜ Asignar layout por rol, o dejar elegir si el usuario tiene varios
**Criterio de aceptación.**
- El superadmin asigna qué layout ve cada rol.
- `GET /config/tabs/{tabId}?layoutId=` resuelve contra el layout pedido, y
  verifica que ese layout esté asignado al rol del token: si no, `404`.

### B5.3 ⬜ Formas v1.1 cuando haya datos
**Descripción.** `categoricaComparada`, `perfilMultiatributo`, `matriz`, `grafo`
y `flujo`.
**Criterio de aceptación.**
- Se activan **cuando exista el dato**, no antes. Construir contra formas que
  ningún endpoint devuelve es escribir a ciegas.
- Cada una entra con su regla mínima declarada, igual que las once actuales.

### B5.4 🕓 Endpoint de drill-down bajo demanda
**Descripción.** Desagregación de un panel por las `dimensiones` que declara su
métrica, contra Snowflake en vivo — la misma figura que el chat.
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando
el backend llegue a ese tramo. El contrato ya cubre la superficie que la consume,
así que lo que falta es el servicio, no el diseño.
**Criterio de aceptación.**
- Las dimensiones disponibles salen del catálogo de la métrica, no de una lista
  aparte.
- Con timeout y tope de filas declarados, igual que el chat.

### B5.5 ⬜ Auditoría de publicaciones de layout
**Criterio de aceptación.** Queda registrado quién publicó, cuándo y qué cambió
respecto de la versión anterior. Consultable desde admin.

### B5.6 ⬜ Tests de integración por endpoint de consola
**Criterio de aceptación.** Cada endpoint tiene un test que verifica el envelope,
el `401` sin token y el filtrado por rol.

### B5.7 ⬜ Tests del job de materialización con fixtures de Snowflake
**Criterio de aceptación.**
- El job se prueba sin tocar Snowflake, contra respuestas fijas.
- Se cubre el camino de fallo: una métrica que falla deja `BLOQUEADO` con razón y
  **no aborta el resto del job**.

---

# Frontend

## Fase 0 — Fundamentos

### F0.1 ✅ Estructura de carpetas según §4
**Descripción.** `app/`, `api/`, `tokens/`, `catalog/`, `render/`, `surfaces/`.
Se retiraron `components/`, `features/`, `pages/`, `services/`, `types/`,
`hooks/` y `styles/` del andamio, que §4 reemplaza.
**Criterio de aceptación.** ✅ Cumplido.
- El árbol coincide con §4; `docs/FOLDER_STRUCTURE.md` lo documenta.
- Cada subcarpeta de `render/` lleva un README con su contrato.
- `.cursorrules` quedó reconciliado: su tabla de capas ya no contradice §4.

### F0.2 ✅ React 19 + TypeScript strict
**Descripción.** «Strict sin excepciones» no es solo `strict: true`: el sistema
descansa en uniones discriminadas y hay cuatro flags fuera de `strict` que las
sostienen.
**Criterio de aceptación.** ✅ Cumplido.
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`
  e `isolatedModules` activos. Sin el primero, `panels[0]` miente sobre existir.
- Cero `any` en props. `npx tsc -b` en verde.

### F0.3 ✅ TanStack Query
**Criterio de aceptación.** ✅ Cumplido.
- `QueryClientProvider` en `app/providers/AppProviders.tsx`.
- Defaults declarados y justificados: `refetchOnWindowFocus: false` porque una
  consola de datos vive en una pestaña abierta todo el día y revalidar al volver
  al foco pedía el batch entero cada vez que alguien cambiaba de ventana.

### F0.4 ✅ React Router: `/`, `/admin/*`, `/builder/*`
### F0.5 ✅ Auth guard
**Descripción.** Guard de sesión y almacenamiento del token, hechos. Faltaba la
pantalla de login y el POST, que no existían en el contrato.
**Criterio de aceptación.**
- ✅ `AuthGuard` verifica que **haya** token, no qué permite: los permisos los
  aplica el backend.
- ✅ El front **no decodifica el JWT**: recibe todo resuelto en `/config/me`.
- ✅ Pantalla de login que consume el servicio de acceso y redirige al `from`.
- ✅ Un `401` de cualquier endpoint limpia la sesión y vuelve al login.

**Cerrada el 2026-09-08, contra un servicio que no estaba en el plan.** El login
no lo sirve la API de la consola: lo sirve **`AntPack-dev/synapse-api-go`**, un
despliegue aparte. B0.10 pedía que la API de la consola lo expusiera y la
respuesta resultó ser otra — existe, en otro lado.

**Las tres preguntas de integración que F0.5 tenía abiertas las contestó el
código, no una reunión:**

| Pregunta | Respuesta, verificada leyendo el servicio |
|---|---|
| ¿Con qué clave se guarda el token? | La decide el front. Sigue en `synapse.token` |
| ¿El login vive en otro origen? | **Sí**, es otro despliegue — pero su CORS es `Access-Control-Allow-Origin: *`, y con `*` no viajan credenciales, así que el token va por cabecera y `localStorage` alcanza |
| ¿Adónde redirige un `401`? | Se decidió acá: borra la sesión y va a `/login` |

**Dos bases de URL, no una.** Los dos servicios publican bajo `/api/v1`, así que
sin separarlas el front no le puede hablar a los dos. `VITE_AUTH_URL` cae a
`VITE_API_URL` a propósito: si mañana quedan detrás del mismo origen, no hay que
tocar nada.

**El envelope de error del servicio de Go no es el de §4.1, y falla en
silencio.** Ahí `error` es una cadena; en el contrato es un objeto. Pasado por
`api/client.ts` da `code: undefined` y `message: ""` —medido— o sea una pantalla
de error sin una palabra. Por eso hay un `api/auth.ts` que desenvuelve por su
cuenta, y por eso está anotado en `docs/PARA-BACKEND.md`: si adoptan §4.1, ese
archivo se borra.

**El guardia redirigía a una ruta que no existía.** `/login` no estaba en el
router: mandaba a una pantalla en blanco. Es de las cosas que solo se ven cuando
alguien intenta usarlas.

**Y quedaron dos cosas anotadas y NO hechas**, las dos a propósito:

- **`password_updated: false` no bloquea nada, y debería.** Es **F0.13**. Se
  anotó como decisión de producto pendiente y no lo es: el OpenAPI del servicio
  lo declara —«si `user.password_updated` es `false` el front debe mostrar un
  modal bloqueante»—. El servicio entrega el token a propósito; el bloqueo es
  nuestro.
- **El usuario que devuelve el login NO se guarda.** Trae nombre, rol y tenant, y
  es tentador usarlo para pintar el navbar sin esperar a `/config/me`. Sería una
  segunda fuente de verdad que se desincroniza en cuanto alguien cambie de rol.
  Hay una prueba que lo fija.

### ➕ F0.16 ✅ Solicitar acceso
**Descripción.** Sale de
`docs/access-request-registration-frontend-integration.md` del servicio. Con
esto **el flujo de acceso queda consumido entero**: login, token-info, cambio de
contraseña, recuperación y solicitud.

**No crea una cuenta: abre una solicitud que un admin aprueba.** La pantalla lo
dice; prometer «ya podés entrar» dejaría a alguien probando credenciales que no
existen.
**Criterio de aceptación.**
- Los ocho campos del contrato, con el correo normalizado.
- **No manda `tenant_id`** — el documento del servicio lo quitó: «el tenant se
  asigna más adelante, en el panel admin, al aprobar».
- Los dos consentimientos son `required`: el servicio rechaza con 400 si llegan
  en `false`, así que declararlo evita un viaje que ya se sabe cómo termina.
- La solicitud creada que devuelve el 201 **no se pinta**.

**Cerrada el 2026-09-08.** Igual que en F0.15, lo que no sube no se puede
filtrar: `requestAccess` devuelve `void` y descarta la respuesta, que trae id,
tenant y estado.

**`GET /access-requests/tenants` NO se consume, y es correcto.** El documento del
servicio lo dice: «ya no es necesario llamarlo en el modal de registro». Quien
solicita escribe el nombre de su empresa en texto libre. Queda anotado para que
nadie lo vea en la lista de rutas sin usar y lo tome por un olvido.

### ➕ F0.15 ✅ Recuperar contraseña
**Descripción.** Sale de `docs/password-reset-frontend-integration.md` del
servicio de acceso —607 líneas—, que la auditoría del 2026-09-08 encontró sin
tarea. Decidido que va: el servicio ya la soporta y no depende de nadie.

**No es un enlace de reseteo.** `POST /password-reset-requests` crea una
solicitud en la misma cola que los registros, y **un admin tiene que
aprobarla**. La pantalla no puede prometer «revisá tu correo», porque no llega
ningún correo con un enlace.
**Criterio de aceptación.**
- **Registrado y no registrado dan exactamente la misma pantalla.** El servicio
  responde 201 con el mismo `message` en los dos casos y solo agrega `request`
  cuando el correo existe; si la pantalla mostrara esa diferencia, el formulario
  se volvería un verificador de correos.
- El mensaje sale del servicio · §8.
- El `409` —ya hay una solicitud pendiente— se muestra y se puede reintentar.
- El correo se normaliza antes de mandarlo.

**Cerrada el 2026-09-08.** La protección se resuelve **en el cliente y no en la
pantalla**: `requestPasswordReset` devuelve solo el `message` y descarta
`request`. Lo que no llega arriba no se puede filtrar por accidente, ni hoy ni
cuando alguien toque el componente. Verificado por mutación: exponer el
`request` rompe dos pruebas.

**Una prueba estuvo mal escrita y vale anotarlo.** Verificaba que la pantalla no
contuviera la palabra «enlace», y falló con el texto correcto: la pantalla dice
«no se envía un enlace automático», que es justo lo que hay que decir. Se
reescribió para verificar la PROMESA —que no diga «revisá tu correo», «te
enviamos», «recibirás»— y no el vocabulario.

**Y apareció un hueco del proxy.** `password-reset-requests` está fuera del
prefijo `/auth`, así que el proxy de desarrollo devolvía 404 y parecía que el
endpoint no existía. Ahora lista las tres rutas públicas del servicio, una por
una.

### ➕ F0.13 ✅ Modal bloqueante de cambio de contraseña
**Descripción.** El OpenAPI de `synapse-api-go` lo declara en `/auth/login`: «si
`user.password_updated` es `false` el front debe mostrar un modal bloqueante
solicitando cambio de contraseña antes de acceder a la app». El servicio entrega
un token válido igual —a propósito—, así que el bloqueo es del front.

**No está bloqueada por nadie.** `POST /auth/change-password` existe, está en el
spec, y el campo llega en la respuesta del login.
**Criterio de aceptación.**
- Con `password_updated: false` no se llega a la consola, ni escribiendo la URL:
  el bloqueo va donde ya está la decisión de sesión, no en la pantalla de login.
- El cambio consume `POST /auth/change-password`, que devuelve el usuario con
  `password_updated: true`.
- El mensaje sale del servicio · §8. La política de contraseña la valida él
  —`password_policy` está en su repositorio—, así que el front no la reimplementa.

**Cerrada el 2026-09-08.** La decisión que la define es **dónde va el bloqueo**:
en el `AuthGuard` y no en la pantalla de login. En el login sería decorativo —
quien ya tiene token en `localStorage` no vuelve a pasar por ahí, así que
escribir la URL lo esquiva. Por el guardia pasan las tres superficies.

**Y de dónde sale `password_updated`, que era el problema interesante.** El front
**no guarda el usuario** a propósito, así que no lo tenía. Sale de
`GET /auth/token-info`: el servicio lee «los datos del usuario en BD y los claims
del JWT activo», así que después de un cambio dice `true` aunque el token sea el
viejo. Guardarlo en `localStorage` al entrar habría sido más barato y habría
dejado a alguien afuera para siempre si cambiaba la contraseña desde otro lado.

**Mientras se verifica, la superficie no se pinta.** Dejarla pasar «mientras
tanto» convierte el bloqueo en un parpadeo que se puede aprovechar. Verificado
por mutación.

**Un fallo que no es 401 ni cierra la sesión ni deja pasar**: lo dice y ofrece
reintentar. Las dos alternativas serían mentira. El 401 lo sigue manejando el
`queryCache`.

La política de contraseña **no se copió**: el servidor la declara —ocho
caracteres, letra, número, especial, distinta de la actual— y devuelve en `error`
el criterio que falló, en prosa. Dos validaciones se separan el día que cambien
una, y la del front sería la que miente.

### ➕ F0.14 ✅ Generar los tipos del servicio de acceso desde SU OpenAPI
**Descripción.** `api/auth.ts` tiene los tipos **escritos a mano**, leídos de las
estructuras de Go. El servicio publica un OpenAPI de 1.796 líneas —embebido en
el binario, servido en `/docs/openapi.yaml`— así que hay un contrato y no lo
estamos usando.

Es la misma regla que ya sostiene `gen:api` para la consola: «todo lo que viaja
por la red sale de `generated.ts`». Un tipo escrito a mano desde una
implementación es exactamente el fixture escrito de memoria que la Fase 5 nos
enseñó a no hacer — y ya costó una: el spec declaraba lo del modal bloqueante y
nosotros lo anotamos como decisión pendiente.
**Criterio de aceptación.**
- Los tipos de `api/auth.ts` salen de un generador, no de la lectura de structs.
- Hay un chequeo de deriva, como `contract-drift`: si el servicio cambia su spec
  y nadie regenera, la puerta lo dice.
- Queda decidido **de dónde se lee el spec**: una copia versionada acá, como
  `design/`, o un fetch contra el servicio. Lo segundo es más fresco y hace la
  puerta dependiente de la red.

**Cerrada el 2026-09-08 · copia versionada**, en `contracts/synapse-auth.yaml`,
por la misma razón por la que `design/` se mudó al repositorio: un chequeo que
necesita la red no corre en un clone limpio ni en CI, y sale BLOQUEADO en vez de
verificar. La cabecera del archivo dice que no es nuestro, de dónde salió y con
qué sha256.

**`contract-drift` se parametrizó en vez de duplicarse.** Dos comparadores del
mismo tipo derivan; ahora es uno con `--auth` y la salida dice cuál contrato
verificó. La puerta pasó a once chequeos ese día; el conteo vigente sale de `docs/ESTADO.md`.

**El generador encontró algo del spec ajeno.** `ErrorResponse.success` está
declarado como `boolean` OPCIONAL en vez de un literal `false`, así que la unión
**no discrimina** y `body.success !== true` no estrecha nada. El código de Go sí
lo pone siempre; es el spec el que quedó flojo. Se resolvió mirando el status
HTTP, que además es más confiable: un 401 es un 401 aunque el cuerpo venga vacío
o no sea JSON.

Verificado por mutación en los dos sentidos: editar el `.ts` generado a mano, y
cambiar el yaml sin regenerar.

### F0.6 ✅ Generar `src/api/types.ts` desde OpenAPI
**Criterio de aceptación.** ✅ Cumplido con salvedad (D4).
- `src/api/generated.ts` son 2.034 líneas generadas del yaml, y `api/types.ts`
  solo les pone nombre.
- ✅ `npm run gen:api` corre desde el `package.json` (F0.10, cerrada por D4).

### F0.7 ✅ Reutilizar los tokens del v2
**Criterio de aceptación.** ✅ Cumplido.
- Los tokens en `@theme static`, con el espacio de nombres de Tailwind:
  `--color-panel` → `bg-panel`, `--radius-xl` → `rounded-xl`, `--spacing: 4px`
  para que `p-6` sean los 24px de padding de panel.
- **`static` no es opcional.** Sin él Tailwind poda toda variable que ninguna
  utilidad mencione por escrito, y las rampas de familia se arman en runtime.
  Medido: sobrevivían 6 de 43, y el tema oscuro se quedaba sin colores de datos
  mientras el claro los conservaba.
- Las tres tipografías autohospedadas; el switcher de tema es un atributo.

### F0.8 ✅ Sacar mocks y defaults del bundle
**Criterio de aceptación.** ✅ Cumplido por construcción: `synapse-tenants.js`,
`synapse-data.js`, `api/mock/*` y los defaults `ua_mx`/`ceo` nunca entraron.

### ➕ F0.9 ✅ Runner de pruebas
**Descripción.** `tareas-front-back.md` exige en F5.5–F5.9 y en el checklist por
componente «al menos una prueba de render mínimo», y **no tiene una tarea que
configure el runner**. Sin esto la Definition of Done es inejecutable desde la
Fase 1.
**Criterio de aceptación.** ✅ Cumplido el 2026-09-02.
- ✅ `vitest` + `@testing-library/react` + `jsdom` instalados y `npm test` corre.
- ✅ `msw` instalado: los contenedores se prueban con **HTTP mockeado**, no con
  fixtures JS importados — importar un fixture desde una superficie es el
  anti-patrón que §4 declara.
- ✅ `npm test` está en la puerta junto a `lint` y `build`.

**Cómo quedó.** Las pruebas se agrupan en `tests/` —fuera de `src/`— espejando la
estructura del código: `tests/render/grid.test.ts` prueba `src/render/grid.ts`.
Se aparta de `.cursorrules`, que admite «junto al código o en `__tests__/`», y lo
hace por una razón que vale más que la convención: **los handlers de MSW son
datos falsos y no puede existir una ruta de import desde una superficie hasta
ellos.** Es F0.8 sostenida por la estructura en vez de por la revisión.

El entorno por defecto es `node`; el archivo que renderiza pide jsdom con
`// @vitest-environment jsdom` en su primera línea. El servidor de MSW corre con
`onUnhandledRequest: 'error'`: una petición sin handler falla nombrando la URL,
en vez de colgarse hasta el timeout —que se lee igual que un bug de la
implementación.

`npm run verify` encadena la puerta: `typecheck && lint && test && build`.

**Verificado por mutación, no por el verde.** Con `GAP` a 20 en `grid.ts` caen
tres pruebas de la fórmula `96·N − 16`; mandando el bearer sin sesión cae la del
`Authorization`. Es el chequeo que faltó el 2026-08-20: una suite que nunca vio
fallar no demostró nada.

### ➕ F0.10 ✅ Bajar a TypeScript 5.9 para que la generación funcione
**Descripción.** El andamio pinaba `typescript@~6.0.2` y `openapi-typescript@7`
declara peer `^5.x`. Como §4 exige que `api/types.ts` se genere desde OpenAPI, la
cadena de generación manda sobre la versión del compilador (D4).
**Criterio de aceptación.** ✅ Cumplido el 2026-09-01.
- `npm install` corre sin `--legacy-peer-deps`.
- `npm run gen:api` regenera `src/api/generated.ts` desde el `package.json`.
- Se quitó `ignoreDeprecations: "6.0"` del `tsconfig.app.json`, que solo existe
  en TS 6. `tsc -b`, `build` y `lint` siguen en verde con las cuatro flags
  estrictas puestas.

### ➕ F0.11 ✅ Portar la puerta de calidad
**Descripción.** `make verify` de v2 con sus chequeos, adaptados al stack nuevo.
`nuevo-desarrollo.md` no la menciona porque **es de nuestro lado, no del
desarrollador del backend** (D5). No es opcional si se quiere evitar el fallo del
2026-08-20: 184 pruebas verdes sobre una implementación que violaba §3.1 de tres
formas distintas.
**Criterio de aceptación.** ✅ Cumplido el 2026-09-02.
- ✅ `design-lint` reapuntado a Tailwind: las 15 reglas verifican utilidades de
  token en vez de `.module.css`. Un hex literal en JSX o en CSS falla.
- ✅ `spec-anclas` porta sus anclas: cada regla numérica de `design.md` con su
  cita **textual**, el marcador `§ANCLA:<id>` en el archivo que la implementa, y
  su aserción. **La aserción se escribe desde la cita, no mirando el código.**
- ✅ `contract-drift`: `src/api/generated.ts` == `contracts/synapse-api.yaml`.
- ✅ `token-drift`: `src/tokens/tokens.css` == variables del `.pen`.
- ✅ Cada chequeo sale con 0 conforme, 1 violación, 2 bloqueado — y un bloqueado
  se cuenta aparte, en `tools/gate.py`, que es `npm run verify`.

**Lo que cambió al reapuntar `design-lint` a Tailwind.** En v2 el color y la
tipografía se verificaban sobre `.module.css`. Acá el estilo vive en el atributo
`class`, así que cada detector mira utilidades — y aparece **una fuga que en v2
no podía existir**: la paleta de fábrica de Tailwind. `bg-slate-800` no es un hex
y se salta el sistema de tokens igual de bien; no invierte con el tema y
`token-drift` no la ve. L1 la persigue con el mismo rigor que a un hex, y por lo
mismo `bg-amber-400` le dio dientes a L3. Los altos arbitrarios se buscan en sus
dos escrituras: `height: 348` y `h-[348px]`.

**Dos chequeos salen BLOQUEADOS, y es el resultado correcto.**

- `design-lint` corre **13 de 15** reglas: L2 y L6 tienen el ámbito vacío
  —`render/bodies/` y `render/plots/` no existen hasta F1.13— y una regla que no
  miró un solo archivo no informa nada. Declararlas conformes sería exactamente
  la mentira que la convención del 2 existe para impedir.
- `spec-anclas` ancla **6 de 9** reglas. Las otras tres están citadas y sin
  implementar: RESP-2 y RESP-3 las cierra F1.30, TIPO-1 la cierra F1.13c. Se
  declaran igual, porque una regla que no está escrita en ningún lado no la
  reclama nadie.

**`contract-drift` deja de estar bloqueado, y esto es lo que lo desbloquea.** En
v2 su mitad de API sale con 2 desde el 2026-09-01 porque el yaml se mudó a este
repositorio. Acá la fuente y el generado viven juntos, así que la comparación por
fin corre: 2.034 líneas idénticas.

**`token-drift` compara por variable y no byte a byte.** El de v2 regenera en
memoria con `gen-tokens.py` y compara el archivo entero; ese generador todavía no
está reapuntado —es F0.12—, así que este verifica que cada una de las 57
variables del `.pen` esté en `tokens.css` con su valor en los dos temas, con la
traducción de espacio de nombres de Tailwind declarada y verificada. Cobertura
menor que el byte a byte, mayor que nada. Hallazgo: **el port a mano de F0.7 no
tiene deriva** — las 57 coinciden.

**Verificado por mutación, los cuatro.** Un dígito en `--color-panel` y un
`--radius-xl` a 12px los detecta `token-drift`; una línea editada en
`generated.ts`, `contract-drift`; un marcador `§ANCLA` borrado y una cita
alterada, `spec-anclas`; y una sonda con hex, `bg-slate-800`, `amber`,
`h-[348px]`, SQL, import de valor desde `api/` y label inline produjo 9 hallazgos
en 7 reglas —sin marcar el `import type`, que es la regla y no la excepción.

### ➕ F0.12 ✅ Reapuntar el generador de tokens
**Descripción.** `tokens.css` y `tokens.ts` están **portados a mano**. En v2 los
emite `tools/gen-tokens.py` leyendo el `.pen`, y `token-drift` verifica que no se
separen. Hasta reapuntarlo, un cambio de token en el diseño no llega solo.
**Criterio de aceptación.**
- El generador emite el archivo con `@theme static` y el espacio de nombres de
  Tailwind, incluidos los cuatro tokens de marca y las 22 rampas de familia.
- Correrlo dos veces produce el mismo archivo byte a byte.
- Las cabeceras «PORTADO A MANO · PENDIENTE» desaparecen.

**Cerrada el 2026-09-03.** Lo que la desbloqueó no fue escribir el script sino
el traslado de `design/`: el generador de v2 ya leía `RAIZ / "design" /
"Synapse_v2.pen"`, o sea exactamente la ruta que ahora existe.

**La decisión que había que tomar era dónde queda la prosa.** `tokens.css` son
195 líneas y casi la mitad es texto: por qué `@theme static` no es opcional, de
dónde sale cada tamaño de la escala, y **los marcadores `§ANCLA:RADIO-1` y
`§ANCLA:TIPO-2`, que `spec-anclas` lee del archivo**. Un generador que escribe
el archivo entero se los lleva puestos y la puerta se pone roja en dos anclas.

Las salidas eran tres —mover la prosa al generador, partir el archivo en uno
generado y uno a mano, o respetar bloques marcados— y se eligió la primera,
porque **el generador ya es el lugar donde vive el porqué de cada traducción**.
El comentario que explica que el tracking va en `em` describe una decisión de
ese script. Las otras dos dejan dos archivos que hay que mantener
sincronizados, que es el problema que el generador viene a resolver.

**Hallazgo: el port a mano no tenía deriva, y ahora está probado de verdad.**
El generador reproduce el `tokens.css` escrito a mano **byte a byte**, salvo la
cabecera —que cambió a propósito— y el comentario del tracking del KPI, que se
movió a su sección al agrupar por prefijo.

**`token-drift` cambió de método, y era lo que su propia nota anunciaba.** Pasó
de comparar variable por variable a regenerar en memoria y comparar el texto
entero. La diferencia no es teórica: el chequeo viejo **no veía un comentario
cambiado** —y ahí viven las dos anclas—, no veía el orden, y repetía la
traducción de espacios de nombres en dos lugares, así que un error en la
traducción entraba igual porque los dos se equivocaban igual. Verificado por
mutación: borrar `§ANCLA:TIPO-2` del CSS ahora se detecta y antes no.

El generador además se planta en dos casos en vez de emitir algo silencioso: si
la escala de espaciado deja de ser 4·N no la colapsa a `--spacing`, y si el
`.pen` trae un token que no encaja en ninguna sección no lo tira, avisa. Los dos
verificados contra un `.pen` roto a propósito.

---

## Fase 1 — Consola y el traslado de `render/`

**Esto es el grueso del trabajo.** `render/` en v2 son **~2.800 líneas de código
de producción en 39 archivos**, más ~1.150 de pruebas. Ya es conforme a las
reglas duras y pasó por el loop de revisión. F1.13 de `tareas-front-back.md` lo
resume en una línea —«copiar/adaptar»— y no lo es: hay que traducir CSS Modules a
Tailwind, renombrar al inglés y resolver dos cosas que en v2 quedaron mal. Va
desglosado en diez tareas.

### Capa API — hecha

#### F1.1 ✅ `api/client.ts` — el cliente HTTP
**Descripción.** fetch + bearer + envelope, sin un solo import de mock.
**Criterio de aceptación.** ✅ El envelope se desenvuelve en un único lugar: un hook que reciba `{ success, data }` es un hook que dejó entrar la forma del transporte a la capa de datos.

#### F1.2 ✅ `api/hooks.ts` — los hooks de datos
**Descripción.** `useMe`, `useCatalog`, `useBlocks`, `useTab`, `usePanelsBatch`, `useSaveTheme`.
**Criterio de aceptación.** ✅ La clave del batch se ancla al `tabId`, no al arreglo de `panelIds`: dos renders de la misma pestaña producen arreglos distintos con el mismo contenido, y eso rompía la cache sin que se notara.

#### F1.3 ✅ `catalog/blocks.ts` — validadores de composición
**Descripción.** `acceptsShape`, `spanInRange`, `invalidReason` sobre la tabla de `/config/blocks`.
**Criterio de aceptación.** ✅ `invalidReason` devuelve la razón y no un booleano, porque el builder tiene que **mostrarla**: «un bloque gauge no sabe dibujar la forma serieTemporal» ayuda, «composición inválida» no.

#### F1.4 ✅ `catalog/types.ts` — tipos del catálogo
**Descripción.** Re-exporta desde `api/` para que `render/` pueda importar `Family` o `PanelType` sin cruzar la frontera de §4.
**Criterio de aceptación.** ✅ `catalog/` no tiene tablas de datos: el catálogo llega por API.

#### F1.14 ✅ `render/grid.ts` — la grilla
**Descripción.** `span()`, `gridStyle()`, `panelStyle()`, con `px = 96·N − 16`.
**Criterio de aceptación.** ✅ `gridAutoRows` en 80px es lo que hace que la fórmula se cumpla de verdad: sin eso, `grid-row: span N` reparte altura automática y `96·N − 16` queda escrito pero no aplicado.

#### F1.27 ✅ `metricsById` — resolver `metricId` → métrica
**Criterio de aceptación.** ✅ El catálogo llega ya filtrado por rol; el front no filtra nada.

---

### El traslado

#### F1.13a ✅ Portar las primitivas de gráfico (`plots/core/`)
**Descripción.** Siete archivos, ~635 líneas: `scale.ts` (escalas y `techo`),
`useSize.ts` (`ResizeObserver`), `Axis.tsx`, `Grid.tsx`, `Series.tsx`,
`Band.tsx`, `Arco.tsx`. Es la base de los seis plots y no depende de nada más.
**Criterio de aceptación.**
- Ningún archivo de `core/` importa de `api/` ni conoce una métrica.
- `useSize` mide con `ResizeObserver` — es el único estado local permitido en
  `render/`, porque es de layout y no de negocio.
- Las pruebas de `scale` y `useSize` viajan con ellos y pasan.
- La reserva del eje sale del **rótulo más largo**, no del rótulo del máximo: con
  techo 1M el máximo es «1M» de dos caracteres y el tick «500K» son cuatro, y
  calculado sobre el máximo se salía por la izquierda y se leía «00K».

#### F1.13b ⚠️ Portar `format.ts` e **inyectar el locale** · 🔒 `Contexto` no trae locale, moneda ni zona
**Descripción.** El formateo de cifras, en un solo lugar. En v2 `LOCALE` es la
constante `'es-MX'` y **cinco de los seis plots importan el formateador directo**
en vez de recibirlo, así que la prop existe y está muerta.
**Criterio de aceptación.**
- `PlotProps.format` se usa: **ningún plot importa el formateador**. Verificable
  con un grep, y candidato a regla de `design-lint`.
- El locale, la moneda y la zona horaria salen del tenant vía `/config/me` y
  bajan por props.
- La abreviatura no tiene escalón para mil millones: «B» es *billion* en inglés y
  un billón en español son 10¹², así que 2.5e9 sale «2,500M» — largo pero sin
  ambigüedad.
- Se conservan sus pruebas.

#### F1.13c ✅ Portar los primitivos `Label` y `Value`
**Descripción.** `Label` es por donde pasa **todo** texto de meta: mono 10px,
`0.12em`, mayúsculas, `text-dim`. Existe porque §1.3 no admite un número desnudo.
**Criterio de aceptación.**
- Traducidos a utilidades de Tailwind sobre tokens; cero hex, cero valor
  arbitrario que no salga de un token.
- `Value` aplica `cifra` (tabular-nums) y **recibe el texto ya formateado**: no
  formatea, porque el locale es del tenant.
- El andamio de `Console.tsx` que hoy usa `text-[10px] tracking-[0.12em]` a mano
  pasa a usar `Label`.

#### F1.13d ✅ Portar los seis estados
**Descripción.** `EstadoCargando`, `EstadoVacio`, `EstadoDegradado`,
`EstadoBloqueado`, `EstadoSinPermiso`, `EstadoError` → `LoadingState`,
`EmptyState`, `DegradedState`, `BlockedState`, `NoAccessState`, `ErrorState`.
**Criterio de aceptación.**
- **Reemplazan el cuerpo, nunca el shell.** Título, BASE y procedencia siguen
  visibles mientras el panel carga, falla o está bloqueado.
- `LoadingState` es un esqueleto **con la forma del tipo**, no un spinner
  genérico.
- `EmptyState` es invitación a actuar con `vacioRazon`, no un error.
- `DegradedState` **muestra la cifra**: lo que cambia es el badge del shell.
- `BlockedState` no muestra número ni aproximación.
- Cada uno tiene una prueba que verifica que la anatomía del shell sigue ahí.

#### F1.13e ✅ Portar el shell del panel (`Panel` + `PanelShell` + `Provenance`)
**Descripción.** ~275 líneas. La anatomía obligatoria de §9: bullet de familia,
título, BASE, procedencia con frescura relativa, dirección semántica, CTA y
chevron. Cubre F1.15 y F1.16.
**Criterio de aceptación.**
- El shell recibe el cuerpo por `children` y **no lo conoce**: un estado no puede
  borrar la cabecera porque no la tiene.
- BASE = denominador + ventana. Con `BLOQUEADO` sale de `Metric.base` (D6).
- La frescura relativa recibe el `ahora` por props, para que no dependa del reloj
  de quien renderiza y las pruebas sean deterministas.
- La dirección semántica se pinta **solo si la métrica la declara**: ponerla
  donde no aplica la vacía de sentido.
- El título es `h2`: el único nivel por encima es el `h1` de la pregunta de la
  pestaña, y saltarse un nivel rompe la navegación por encabezados, que es como
  se recorre una pantalla de doce paneles con un lector.
- Shell compacto en `colSpan ≤ 3` (F1.16): misma información, otro reparto — la
  meta baja a dos líneas. Es una rama documentada, no un flag suelto.

**Cerradas el 2026-09-02 · F1.13b, c, d, e, i.** El panel ya es real de punta a
punta: `Console.tsx` monta `<Panel>` con el payload que devuelve el backend y los
siete estados salen de ahí. Lo que falta para que pinte una cifra es el registro
(F1.13h) y los cuerpos (F1.13g), que se montan en el slot que el shell ya expone.

**F1.13b queda en ⚠️ y no en ✅, por el contrato.** La inyección está hecha
—`createFormat(locale)` y `PlotProps.format`, ningún componente importa el
formateador— pero el criterio pide que «el locale, la moneda y la zona horaria
salgan del tenant vía `/config/me`», y **`Contexto` no declara esos tres campos**.
Hoy se deciden en una sola línea de `Console.tsx`, marcada como supuesto. Cuando
el yaml los tenga se cambia esa línea y nada más. Va con las preguntas de B0.9.

**Dos huecos de v2 que el contrato de acá cierra.** `Metrica.base` es requerido,
así que `resolveGovernance` cae al catálogo y **un panel bloqueado declara su
denominador** —en v2 mostraba la ventana sin la base—. Y `Value` ya no formatea:
recibe el texto hecho, que es lo que sacó `es-MX` de adentro de `render/`.

**Cobertura ganada en la puerta.** `render/Panel/` y `render/states/` le
devolvieron ámbito a L5 y L15 del lint, y `Label` cerró el ancla TIPO-1:
`spec-anclas` pasó de 6 a 7 de 9. Los dos chequeos siguen BLOQUEADOS por L2, L6
—que esperan a `render/plots/` y `render/bodies/`— y por RESP-2 y RESP-3.

#### F1.13f ✅ Portar los seis plots
**Descripción.** `PlotBars`, `PlotSeries`, `PlotGauge`, `PlotForecast`,
`PlotComposition`, `PlotDistribution`. Cubre F1.21.
**Criterio de aceptación.**
- Todos aceptan `PlotProps<F>`. En v2 **solo uno lo hacía** y los otros cinco
  tenían firma propia, lo que hacía imposible indexarlos en un registro.
- El color llega como `family` y el plot **no sabe cuál le tocó**: usa
  `var(--color-fam-${family}-N)`.
- Responsivos dentro de su panel; no asumen un ancho.
- Un plot vacío no rompe: cero series o cero puntos rinden sin excepción.

#### F1.13g ✅ Portar los doce cuerpos que existen en v2
**Descripción.** `KpiBody`, `SeriesBody`, `BarsBody`, `TableBody`, `ProseBody`,
`RecoBody`, `GaugeBody`, `ForecastBody`, `ListBody`, `CompositionBody`,
`DistributionBody`, `BlockedBody`. Cubre F1.18.

**Doce de quince, y la diferencia no es un recorte.** El enum `TipoPanel` del
contrato tiene **quince** valores y §7 de `nuevo-desarrollo.md` exige
implementarlos todos. Doce existen en `synapse_v2/src/render/bodies/` y se
portan acá; los tres que faltan —**`comparison`, `matrix` y `graph`**— nunca se
escribieron en v2 porque son las formas v1.1 de §8.12, que ningún backend emite
todavía. Se construyen de cero en **F4.17, F4.18 y F4.19**, y F4.20 los registra.

La consecuencia para F1.13h: hasta que estén los quince, el registro es un
`Partial<Record<PanelType, …>>` y un tipo sin cuerpo **tiene que dar error
explícito**, no un fallback silencioso. Recién con los tres de Fase 4 pasa a
`Record` completo y agregar un tipo al enumerado sin su cuerpo deja de compilar.
**Criterio de aceptación.**
- Cada uno acepta `BodyProps<F, P>` con **sus params concretos**, nunca
  `Record<string, unknown>`.
- Función pura: sin `useState` de negocio, sin `useEffect` de fetch, sin contexto
  global.
- `GaugeBody` sin `maximo` en `opciones` no dibuja el arco y lo dice; no inventa
  una escala.
- `ProseBody` y `RecoBody` reciben pilares como objetos y **no parsean texto**.
- Cada cuerpo tiene una prueba de render con props mínimas válidas del contrato.

#### F1.13h ✅ Escribir el registro **sin `any`** (F1.17, F1.22)
**Descripción.** `registry.ts` mapea `PanelType` → componente con `React.lazy`,
para que una pestaña no descargue los cuerpos que no usa, y aplica `memo` en un
solo lugar. §14.4 del documento lo ejemplifica con `ComponentType<any>` y §4
regla 2 lo prohíbe: *«el v2 lo toleró en el registro de cuerpos; el front nuevo
no»*. Las dos cosas no pueden ser ciertas a la vez.
**Descripción del problema.** El registro no puede probar qué forma le toca a
cada cuerpo —eso depende de que el `tipo` del panel case con la `forma` de la
métrica, que es un invariante del catálogo y no del tipo. Pero un
`ComponentType<any>` entero significa que agregar una prop obligatoria a
`BodyProps` compila igual y llega `undefined` en runtime. Ya pasó en v2.
**Criterio de aceptación.**
- La estrechez vive en **un** adaptador tipado y documentado, no repartida en
  doce archivos ni tapada con `any`.
- Agregar una prop obligatoria a `BodyProps` **no compila** hasta actualizar los
  sitios que montan un cuerpo.
- Un `tipo` sin cuerpo registrado produce **error explícito**, no un fallback
  silencioso (F1.22, y §1 principio 6).
- `preloadBodies(tipos)` trae los chunks en paralelo con `panels:batch`, en
  cuanto `/config/tabs` dice qué tipos tiene la pestaña. Sin eso el `lazy` recién
  pide el chunk cuando ya llegó el dato, y el panel parpadea por una descarga que
  se podía haber hecho mientras tanto.
- Una prueba resuelve cada cargador y verifica que lo que sale es un `memo`.

**Avance del 2026-09-02 · F1.13a y F1.13h cerradas, F1.13g en ⚠️.**

`plots/core/` completo: `scale.ts`, `useSize.ts`, `axisGeometry.ts`, `Axis.tsx`,
`Grid.tsx`, `Series.tsx`, `seriesColor.ts`, `Band.tsx`, `Arc.tsx`, `arcPath.ts`.
Se partió en más archivos que en v2 porque un módulo que exporta componentes y
funciones rompe el fast refresh de Vite, y `.cursorrules` ya pedía un componente
por archivo.

**El registro no tiene un solo `any`.** §14.4 lo ejemplifica con
`ComponentType<any>` y §4 regla 2 lo prohíbe; gana la regla. La estrechez vive en
`adapt()`: una línea con su razón escrita. `value` se ancha a la unión `Value`
—no a `any`— y `params` a `unknown`, **y el resto de las props conserva su
tipo**, que es lo que hace que agregar una prop obligatoria a `BodyProps` rompa
la compilación en el sitio que monta el cuerpo. En v2 un `ComponentType<any>`
entero dejó pasar tres sitios reales al agregar `metrica`.

**Tres cuerpos de doce**: `KpiBody`, `ProseBody`, `BlockedBody` — los que no
dependen de un plot. Faltan nueve, y con ellos F1.13f.

**Bug encontrado al probar la inyección del locale.** `formatearCifra` de v2
escribía la abreviatura con `String(Number(...))`, así que **la cifra abreviada
siempre salía con punto decimal** mientras la entera pasaba por `Intl`. Con el
locale fijo en `es-MX` las dos coincidían y el defecto era invisible; con
`createFormat('de-DE')` aparece en el primer render. Corregido, y la
comprobación de exactitud ahora se hace sobre el número y no sobre el texto
—`Number('4,28')` es `NaN` en cuanto el locale usa coma, así que con la
comparación anterior no se habría abreviado nada nunca.

**`design-lint` pasó a verde con las 15 reglas.** `render/bodies/` le devolvió
ámbito a L6, que era la última sin cobertura. La puerta queda con un solo
bloqueado: `spec-anclas`, por RESP-2 y RESP-3, que espera a F1.30.

**F1.13 CERRADA · 2026-09-02.** Las diez partes, a–j. `render/` es el motor
completo: primitivas de gráfico, formateo con locale inyectado, los primitivos,
los siete estados, el shell, los seis plots, los doce cuerpos, el registro y la
medición del presupuesto.

**Ningún plot importa el formateador, y ahora lo verifica el compilador.**
`PlotProps.format` pasó de opcional a **obligatorio**: en v2 era opcional y cada
plot caía a `formatearCifra`, que traía consigo el `es-MX` de módulo — la prop
existía y estaba muerta. Exigirla convierte «ningún plot importa el formateador»
de grep en error de compilación.

**El code splitting funciona, verificado en el build**: doce chunks de cuerpo
—de 0,26 kB a 2,4 kB— más los compartidos. Una pestaña que usa cinco tipos no
descarga los otros siete.

**Una duplicación que v2 tenía y acá no.** `<Arc>` y `<PlotComposition>` repartían
tramos con la misma suma prefija escrita dos veces, las dos con un acumulador que
se reasignaba durante el render. Salió a `plots/core/stack.ts`: es aritmética, no
render, se prueba sin montar un SVG, y las dos formas de apilar ya no pueden
separarse.

**`budget.ts` agrega el flag que v2 no tenía.** El criterio pide que no se active
en producción salvo bajo bandera: `import.meta.env.DEV || VITE_BUDGET === '1'`.
Medir cuesta poco pero no cuesta nada, y las entradas de User Timing se acumulan
en una consola que vive abierta todo el día.

**Lo que queda de F1.13 es lo que el backend todavía no manda**: `comparison`,
`matrix` y `graph`, que son las formas v1.1 de §8.12 y las cierran F4.17–F4.19.
`MISSING_TYPES` los declara y una prueba verifica que construidos + faltantes
sean exactamente los quince del contrato.

#### F1.13i ✅ Portar `state.ts` — la derivación del estado visual
**Descripción.** `estadoVisual`, `resolverGobierno`, `tieneValor`. Vive en
`render/` y no en `api/` porque el predicado lo necesita quien **lee** el
payload, no quien lo declara — y `render/` no puede importar valores de `api/`.
**Criterio de aceptación.**
- `VACIO` se deriva del valor y cae en el mismo `switch` que los estados que sí
  vienen del backend.
- `DEGRADADO` cae con `DISPONIBLE` al elegir cuerpo: sí muestra cifra, y la
  diferencia la pinta el shell como badge.
- **Nada más se deriva.** Degradación, permisos y filtrado son del backend.

#### F1.13j ✅ Portar `budget.ts` — el presupuesto de render
**Descripción.** La medición de cuánto tarda una pestaña en componer y pintar.
Es lo que convierte «la consola va lenta» en un número.
**Criterio de aceptación.**
- Mide desde que llega la config de la pestaña hasta el commit y hasta el
  pintado.
- No se activa en producción salvo bajo un flag.

---

### Superficie de consola

#### F1.5 ✅ `surfaces/console/Console.tsx` — orquestación
**Descripción.** Cadena `/config/me` → `/config/tabs/{id}` → `panels:batch`,
cableada. Falta reemplazar el andamio por paneles reales.
**Criterio de aceptación.**
- ✅ Ningún panel, métrica ni posición aparece literal en el archivo.
- ✅ La primera pestaña y el primer período salen del backend (F1.10).
- ⬜ El componente queda por debajo de 300 líneas: si crece, se parte en
  contenedor y presentacional. En v2 `Consola.tsx` llegó a 671 y ahí se le
  metieron ramas `if (metricId === 'mmm_canales')`, que es el anti-patrón
  que §4 nombra.

#### F1.6 ✅ `ConsoleContainer` — separar hooks de render
#### F1.7 ✅ `Topbar` — tenant, selector de período, tema
#### F1.8 ✅ `Tabs` — pestañas desde `ctx.tabs`
**Criterio de aceptación.**
- El selector de período agrupa por `grano` y respeta el `granoMinimo` de las
  métricas de la pestaña: ofrecer un día a una métrica mensual es ofrecer un
  error.
- Con `alcance: plataforma` el topbar muestra el selector de tenant y declara que
  el acceso queda auditado; con `usuario`, el nombre del tenant.

#### F1.9 ✅ `PanelInGrid` — el puente
**Descripción.** Recibe `panel` + `metric` + `payload` y decide: shell siempre,
y adentro el estado o el cuerpo. Reemplaza el andamio marcado
`data-pendiente="F1.9"`.
**Criterio de aceptación.**
- Sin payload todavía → shell con esqueleto. **El estado de carga no borra la
  anatomía.**
- El `Suspense` del chunk usa el **mismo** esqueleto que el estado de carga: un
  chunk en vuelo y un dato en vuelo son indistinguibles para quien mira.
- Emite `onDrill`, `onChat`, `onRetry` hacia arriba. **El cuerpo no navega ni
  abre modales por su cuenta.**

**La superficie de consola, cerrada el 2026-09-02 · F1.5–F1.9, F1.12, F1.26.**

`ConsoleContainer` tiene los hooks; `Console` no tiene ninguno y recibe todo por
props, así que se puede montar con datos fijos en el builder y en la vista previa
por rol sin tocar la red. Ese era el punto de separarlos.

**El `Suspense` del chunk usa el MISMO esqueleto que el estado de carga.** Lo
había puesto en `null` con el argumento de que la precarga lo hace innecesario;
el criterio de F1.9 dice lo contrario y tiene razón: para quien mira, un chunk en
vuelo y un dato en vuelo son indistinguibles, y un panel vacío durante la
descarga se ve roto por una diferencia que es interna.

**El selector de período deshabilita lo que la pestaña no puede contestar.** Se
toma el grano más grueso que exige alguna de sus métricas —el panel más
restrictivo manda—, y el control deshabilitado **declara la razón**: uno sin
explicación es peor que uno ausente, porque no se sabe si es permiso, error o
límite del dato. La lógica vive en `periodGrain.ts`, fuera del componente, y se
prueba sin montar nada.

**Un fallo del batch NO tira la pantalla.** Contexto y catálogo son la pantalla;
el batch son los datos de cada panel. Si falla el batch, los shells siguen en pie
con su título, su BASE y su procedencia, y cada uno muestra su estado de error
con reintento por panel. Verificado contra MSW.

**Falso positivo corregido en `design-lint`.** L5 marcaba `ConsoleContainer` por
importar de `render/bodies/`, cuando lo único que importa es `preloadBodies`, que
dispara la descarga del chunk y no puede renderizar nada. El detector de v2
buscaba cualquier import de esa carpeta; ahora busca a quien MONTA un cuerpo
—`bodyFor()` o un `*Body`—, que es lo que la regla quiere decir. Verificado por
mutación: una sonda que monta `KpiBody` sin shell sigue cayendo.

#### F1.11 ✅ Cambiar de período no re-pide el layout
**Criterio de aceptación.** ✅ Cumplido: la clave de `useTab` no lleva el
período, así que es estructural y no una disciplina.

#### F1.12 ✅ Persistir el tema
**Criterio de aceptación.**
- ✅ `api.savePreferences` y `useSaveTheme` escritos.
- ⬜ Control de tema en el topbar; el valor inicial llega en `/config/me` y lo
  aplica la superficie.
- El switcher visual **no pasa por la API**: es un atributo en la raíz, y las
  custom properties hacen el resto. Cero recálculo, cero re-render.

#### F1.19 ✅ Estados en la superficie · cubierto por F1.13d
#### F1.20 ✅ Primitivos · cubierto por F1.13c
#### F1.23 ✅ `memo` en cuerpos y plots · cubierto por F1.13h
#### F1.24 ✅ Cero hex literal
**Criterio de aceptación.** Verificado por `design-lint` (F0.11), no por
revisión manual.

#### F1.25 ⬜ Conectar a la API real · 🔒 depende de B1.16 y B1.20
**Descripción.** Apuntar el front al backend y sacar cualquier respuesta simulada
del camino, aunque el backend devuelva una sola pestaña.
**Criterio de aceptación.**
- La consola carga contra el backend real vía `VITE_API_URL`.
- Cero fixtures en el bundle de producción, verificado sobre el output del build.
- Un `401` limpia la sesión; un `500` muestra el estado de error de la superficie
  sin dejar pantalla en blanco.

#### F1.26 ✅ Carga y error a nivel de superficie, no en los cuerpos
**Descripción.** La superficie decide qué se muestra mientras el contexto o el
catálogo vuelan, y qué se muestra si fallan. Un cuerpo nunca maneja eso.
**Criterio de aceptación.**
- Ningún componente de `render/` lee `isLoading` ni `isError`: recibe un
  `Payload` y nada más.
- Si falla `/config/me` o `/config/catalog` la pantalla lo dice; si falla solo el
  batch, los shells siguen visibles con su estado de error por panel.

---

### Tareas nuevas de Fase 1

#### ➕ F1.28 ✅ Traducir los CSS Modules de v2 a Tailwind
**Descripción.** v2 tiene ~10 `.module.css`. El stack nuevo es Tailwind y
`.cursorrules` prohíbe CSS Modules salvo excepción justificada. La traducción es
mecánica pero no trivial: hay medidas que **no** deben volverse valores
arbitrarios sino tokens.
**Criterio de aceptación.**
- Cero `.module.css` en `render/`, salvo excepción escrita y justificada.
- Cero hex literal y cero valor arbitrario `[...]` que corresponda a un token
  existente. `text-[10px]` de un `Label` es un token que falta, no una utilidad.
- Las medidas del sistema —label 10, celda 12, cuerpo 13— entran como tokens de
  tipografía en `@theme`, no como arbitrarios repetidos.

**Cerrada el 2026-09-03.** No había un solo `.module.css`: el traslado de la
Fase 1 los tradujo sobre la marcha, así que la mitad mecánica ya estaba hecha.
Lo que quedaba eran **29 medidas sin declarar** —23 arbitrarios y 6 utilidades de
la escala de fábrica de Tailwind, que el criterio no nombraba y son la misma
fuga: `leading-relaxed` son 1.625 y el `.pen` usa 1.5—, hoy **16 tokens** en
`@theme static`.

**Hacer esto obligaba a decidir dónde vive la escala tipográfica**, porque
`token-drift` compara en las dos direcciones y de tipografía el `.pen` declaraba
solo las tres familias: el primer token nuevo ponía la puerta en rojo. Se
resolvió por donde manda la cadena de autoridad —el `.pen` es la fuente,
`tokens.css` la refleja—, y las 16 variables se agregaron ahí.

Cuatro divergencias, ninguna resuelta en silencio, todas en
`docs/F1.28-escala-tipografica.md`: el tracking del KPI no salía de ninguna
fuente y ahora sale del `.pen`; los tres títulos de display no llevaban el
-0.02em que §2.3 les declara; las alturas de línea eran las de Tailwind y no las
del `.pen`; y **`design.md` no declara ningún tamaño de `font-body` ni de
`font-display`** —los cuatro mono son normativos, los otros cinco salen del censo
de nodos, que es más débil. Ese último es propuesta de spec.

Se agregaron una regla de lint (`tipografia`), un ancla (`TIPO-2`) y
`tests/tokens/escala.test.ts`, verificados los tres rompiendo el código a
propósito. La prueba que más importa es la de huérfanas: **una utilidad que
nombra un token inexistente no es un error, es silencio** — `text-labell`
compila, pasa el lint y se pinta sin tamaño.

**`design/` se mudó al repositorio**, con lo que `token-drift` y `spec-anclas`
dejan de depender de un repositorio hermano que un clone limpio no tiene. Es lo
que cierra el hueco que quedaba de F0.12; ver el bloque de comandos.

#### ➕ F1.29 ✅ Validar los params de layout
**Descripción.** `PanelConfig.opciones` llega como `Record<string, unknown>`. Hoy
un cliente que configure `orden: "ascending"` en vez de `"asc"` **no falla: se
ignora**. Con configuración por tenant eso deja de ser hipotético.
**Criterio de aceptación.** ✅ Cumplido el 2026-09-02.
- ⚠️ Cada tipo declara su esquema de params —valores válidos y defaults—
  derivado de `paramsDisponibles` de `/config/blocks`. **Derivado a medias, y el
  contrato es el límite.** Ver abajo.
- ✅ La validación ocurre en el **adaptador de `api/`**: `api/params.ts`. Ni la
  superficie ni `render/` la tocan; el cuerpo recibe params ya limpios.
- ✅ Un param desconocido se descarta con aviso en desarrollo; uno inválido
  **degrada el panel con razón visible**. Nunca se ignora en silencio.

**El esquema está partido en dos, con distinta autoridad, y no por gusto.**
`/config/blocks` declara `paramsDisponibles` como `string[]`: los NOMBRES válidos
por tipo, y nada más. No trae valores admitidos ni defaults. Así que:

- **Qué params existen** lo dice el backend, y un nombre fuera de esa lista se
  descarta.
- **Qué valores son válidos** lo dice `PARAM_SCHEMAS` en el front, porque el
  contrato no lo declara. Es duplicación con lo que cada cuerpo acepta en
  TypeScript, y es inevitable: los tipos se borran al compilar y `opciones` llega
  en runtime.

**Propuesta de spec:** que `paramsDisponibles` deje de ser `string[]` y declare
tipo, valores y default por param. Ahí `PARAM_SCHEMAS` desaparece y la deriva
entre front y backend se vuelve imposible en vez de verificable. **Va con B0.9.**

**Desconocido y descartado ≠ conocido e inválido**, y la diferencia es de
consecuencia. Un param de más es ruido de configuración: se descarta y el panel
dibuja igual. Un param conocido con un valor que el cuerpo no puede usar
**degrada el panel**, porque aplicar el default sería mostrar algo distinto de lo
que se pidió sin decirlo — que es exactamente el defecto que esta tarea arregla,
solo que peor.

Sale como `BLOQUEADO` y no como `ERROR`: no es un fallo del sistema, es una
composición que no se puede dibujar, con razón y con quien la arregle. El shell
conserva título, BASE y procedencia · §5.2.

**`PARAM_SCHEMAS` declara lo que los cuerpos REALMENTE leen, no la lista de §7.**
§7 de `nuevo-desarrollo.md` enumera params de diseño que varios tipos no
implementan —`marca` en bars, `estadisticos` en distribution, `componentes` en
gauge—. Declararlos haría pasar como válido algo que ningún componente mira. Lo
que no se lee se descarta como desconocido, que es información y no un silencio.

#### ➕ F1.30 ✅ Colapso responsive
**Descripción.** Cablear `columnsFor()`, que ya está escrita en `render/grid.ts`,
y el reordenamiento por `colStart` al colapsar. **D1 lo resolvió a favor:** es una
regla normativa vigente con ancla de spec y prueba en v2.
**Criterio de aceptación.** ✅ Cumplido el 2026-09-02.
- ✅ **El colapso no lo puede hacer solo el CSS.** El span se resuelve en JS
  —`spanFor`— y se suelta el `colStart`. `useColumns` escucha el viewport.
- ⚠️ **El mínimo NO es 768: son 360.** Ver abajo.
- ✅ La prueba se escribe desde la cita de §3.1, y las cuatro que verifican la
  división caen si se vuelve a `Math.min`. Verificado por mutación.

**El defecto que esto arregla, y que estaba en el código desde el port.**
`panelStyle` recortaba con `Math.min(colSpan, columns)` donde §4 pide **dividir a
la mitad, redondeando hacia arriba**. Coinciden solo cuando el span excede las
columnas, que era el único caso probado: a seis columnas, un `colSpan` 4 quedaba
en 4 —dos tercios del ancho— donde la spec pide 2, un tercio. Un layout de tres
paneles de 4 se veía como uno de tres paneles de 12. Lo detectó `spec-anclas` al
declarar RESP-2, no una prueba.

**DIVERGENCIA 1 · el criterio de esta tarea decía 768 y design.md dice 360.**
Este plan pedía «por debajo de 768 no se degrada: no se soporta». `design.md`
—normativo, y más reciente: PS-12, 2026-08-21— dice lo contrario con todas las
letras: «El mínimo de la consola es 360 desde el 2026-08-21. Antes decía 768, y
§3.1 definía con precisión el escalón de una columna **por debajo de ese
mínimo**: la spec describía un ancho que ella misma declaraba fuera de soporte.
El escalón está implementado, probado y dibujado, así que **lo que sobraba era el
mínimo, no el escalón**.»

Se implementó según `design.md`, que es la fuente más específica para esta regla.
`MIN_WIDTH = 360` y el escalón de una columna a 767 **sí se soporta**. Queda
anotado acá y no se tocó `design.md`.

Con el mínimo en 360 hay una consecuencia declarada que `design.md` ya nombra y
**no está resuelta**: las hojas laterales. C2 abre al 60% del viewport y C3 a
940px fijos; a 360 la primera son 216px —menos que un panel— y la segunda no
entra. Es trabajo de v1.1 y va con F3.1.

**DIVERGENCIA 2 · §4 nombra `orden` y el contrato no lo tiene.** La regla dice
«orden de lectura según `colStart` + `orden`», y `PanelConfigurado` declara
`id, tipo, metricId, colStart, colSpan, rowSpan, opciones` — sin `orden`, que
existe en `Pestana` y no en el panel. `readingOrder` desempata por la posición en
el arreglo, que es el orden que el backend declaró. Funciona, y no es lo que la
regla dice: mientras el campo no exista, dos paneles con el mismo `colStart`
dependen de un orden que el contrato no promete estable. **Propuesta de spec para
B0.9.**

#### ➕ F1.31 ⬜ Registro de gráficos y verificación de mínimos · 🔒 `/config/plots` da 404
**Descripción.** D2 lo resolvió a favor. Dos piezas: `catalog/plots.ts` con los
validadores sobre el repertorio que llega de `/config/plots` —la misma figura que
`catalog/blocks.ts`, sin la tabla escrita adentro—, y
`render/plots/registry.ts` con `lazy` + `memo` y `plotFor(id)`, igual que el
registro de cuerpos.

Lo primero que hay que construir **no es el selector, es la verificación de
mínimos**: cuántos puntos, categorías o partes necesita un gráfico para no
engañar. Sirve desde hoy, aun con un gráfico por tipo — hoy nada impide que
`bars` reciba un ítem y dibuje una barra sola.
**Criterio de aceptación.**
- Ausente `plot` en el layout se dibuja **exactamente** lo que se dibuja hoy: el
  cambio no mueve ninguna pantalla existente.
- Un valor por debajo del mínimo del gráfico no se dibuja: el panel muestra el
  estado vacío con la razón —«este corte necesita al menos tres categorías;
  llegaron dos»— que es lo que §8 pide, invitación a actuar y no un error.
- Un valor por encima del `tope` tampoco: se muestra el motivo declarado en el
  repertorio, no un gráfico ilegible con ochenta barras.
- Un gráfico incompatible con la forma se rechaza en el adaptador **con razón**;
  no se dibuja mal ni se cambia por otro en silencio.
- La regla dura se sostiene: `serieConBanda` solo admite gráficos con banda.
- La tabla no está en el front: llega por API, igual que los bloques.

### La integración con el backend real · 2026-09-11

**El backend de la consola existe** —rama `feature/dynamic-dashboard-backend` de
`AntPack-dev/synapse-api-go`, el mismo binario que ya sirve el login— y **no
implementó el contrato**: claves en inglés snake_case, `error` como cadena,
arreglos desnudos donde el contrato declara un objeto, estados en inglés,
`Gobierno` anidado y el discriminador de `Valor` llamado `shape`.

La decisión es **un adaptador en `src/api/`**: el contrato sigue siendo la forma
interna y `render/` no se toca. El análisis completo, campo por campo, está en
`docs/PLAN-INTEGRACION-2026-09-11.md`; las preguntas al backend, en §4 de ese
documento.

La regla del adaptador: **renombra y reformatea; no calcula, no inventa una cifra
y no escribe copy de producto.** Donde el cable no trae el campo, el campo queda
ausente y la tarea que depende de él sigue bloqueada.

#### ➕ F1.32 ✅ Transcribir el cable de consola a un contrato versionado
**Descripción.** `contracts/synapse-console-wire.yaml` con la forma que el
servicio de Go realmente sirve en `/config/*`, más `npm run gen:console-wire` y
`npm run console-drift`. Es el mismo tratamiento que ya recibió
`contracts/synapse-auth.yaml`, y por la misma razón: **no se escriben tipos a
mano contra un servicio.**

El OpenAPI que el binario embebe no declara ni una ruta `/config/*` —es la tarea
B0.7 de su plan, sin marcar—, así que esta primera versión es una transcripción
nuestra leyendo `ports/dd_config_service.go`, `dashboard/blocks.go` y
`domain/dd_*.go`.
**Criterio de aceptación.**
- El yaml lleva escrito adentro que es una transcripción del front y no un
  contrato firmado, con la fecha y el commit desde el que se transcribió.
- `console-drift` falla si `src/api/console-generated.ts` deja de coincidir con
  el yaml, con la misma convención de salida que los otros chequeos: 0 conforme,
  1 violación, 2 BLOQUEADO.
- Cuando el backend cierre B0.7, el yaml se reemplaza por el suyo y no cambia
  nada más: el adaptador ya tipa contra los tipos generados.
- La puerta lo corre. La puerta lo corre, sin bloqueados.

**Cerrada el 2026-09-14.** `contracts/synapse-console-wire.yaml` · seis rutas,
catorce esquemas, transcrito del commit `733c13c` de
`feature/dynamic-dashboard-backend`. El yaml nombra adentro los ocho archivos de
Go que se leyeron y declara que **ellos son la autoridad si esto difiere**.

**No se duplicó el comparador.** `contract-drift.py` ya estaba escrito para
varios contratos —su propio comentario dice que duplicarlo «habría creado dos
comparadores que derivan»— así que el cable entró como un tercer par
`yaml → .ts` y no como un script nuevo. Eso destapó una deuda del propio
chequeo: los dos mensajes de «cómo arreglarlo» decían `npm run gen:api` fijo,
así que el contrato de acceso venía recomendando el generador equivocado desde
F0.14. Ahora sale del contrato que falló.

**Verificada por mutación, cuatro casos:** editar el generado a mano (✗ 1),
cambiar el yaml sin regenerar (✗ 1, y nombra las tres líneas), borrar el
generado (⊘ 2 BLOQUEADO, no verde) y restaurar (✓ 0).

**Lo que el yaml declara y el contrato no**, que es la lista que F1.33–F1.36 van
a consumir: `error` como cadena; `data` como arreglo desnudo en `/catalog` y
`/blocks`; `periods` como cadenas sueltas de los últimos doce meses del
calendario; `governance` anidado; `status` en inglés; `presentation` solo para
las dos formas escalares; `unlocks_with` vacío en `BLOCKED`; `request_from` como
la constante `"administrator"`; `options` de `kpi` como interruptores y no datos;
y `shape`, `family` y `layer` como `string` libre.

**Las cinco rutas que el servicio NO tiene no se transcribieron** —`/config/chat`,
`/config/chat/hilos`, `/config/decisiones`, `/config/accionables`,
`/config/solicitudes`—: declarar una ruta que nadie sirve es el mismo problema
que un chequeo que pasa porque no encontró nada.

#### ➕ F1.33 ✅ `api/adapt.ts` · contexto, catálogo, bloques y pestaña
**Descripción.** Las cuatro respuestas que no llevan datos. Traduce nombres
—`col_span` a `colSpan`, `operational_question` a `pregunta`—, compone `nombre`
desde `first_name` y `last_name`, y mapea por tabla los tres enumerados que
cambian de idioma: `shape`, `family` y `min_grain`.
**Hereda dos correcciones de F1.36** (2026-09-14): `/config/catalog` y
`/config/blocks` devuelven **un arreglo desnudo** en `data`, no `{ metrics }` ni
`{ blocks }`. Se mudaron acá porque cambian el tipo de retorno del cliente, y
quien lo recibe es este adaptador.

**Criterio de aceptación.**
- `render/` y `catalog/` no cambian ni una línea: la frontera de §4 se sostiene.
- Lo que el cable no trae queda **ausente**, nunca inventado. `alcance`,
  `tenant.etiqueta`, `role.puedeAprobar`, `tabs[].key` y `user.capacidades` no
  se rellenan con un valor plausible.
- El mapeo de familia es explícito y verificado: las cinco familias del cable
  producen las cinco del contrato, que son las que nombran los tokens
  `--color-fam-*`.
- Una prueba por cada una de las cuatro respuestas, con el fixture escrito desde
  `synapse-console-wire.yaml` y no de memoria.

**Cerrada el 2026-09-14.** `src/api/adapt.ts`, conectado en el borde de
`client.ts`: `request<…>` pide el tipo del CABLE y lo que sale de `api.*` es el
tipo del CONTRATO. **`render/` y `catalog/` no cambiaron ni una línea CON ESTA TAREA** —
`git diff --stat` sobre las dos carpetas salía vacío el 2026-09-14—, y con ellas
las 15 reglas de `design-lint` y las 10 anclas. *(F1.40 sí tocó `KpiBody.tsx`
más tarde, y con razón: era un defecto de render. La afirmación es de esta tarea
y no una promesa permanente — anclada por la auditoría del 2026-09-14.)*

**Las dos heredadas de F1.36 entraron acá**: `/config/catalog` y `/config/blocks`
llegan como arreglo desnudo.

**Los mocks pasaron al cable, y eso es lo que hizo el trabajo.** Mientras
`handlers.ts` hablaba el idioma del contrato, el adaptador no se ejecutaba en
ninguna prueba. Al cambiarlos **fallaron 16 solas**, y cada una señaló algo real:
la ventana que no llega, los períodos como cadenas, la pestaña que el mock
emitía como spread en vez de `{ tab, panels }`.

**Y una de esas 16 encontró un bug MÍO.** Había fijado `grano: 'mes'` en vez de
deducirlo de la forma del id, que es lo que el contrato sanciona explícitamente.
Con eso, un período semanal se ofrecía como mensual y el selector no lo
deshabilitaba — la garantía de F1.7 rota en silencio. La prueba del grano existía
desde antes y la agarró.

**Lo que NO se rellenó, y con qué queda en su lugar:**

| Campo | Qué pasa | Por qué |
|---|---|---|
| `alcance` | `usuario` | Es el único que este servicio sostiene: `plataforma` necesita `tenantsDisponibles`, que tampoco existe |
| `role.puedeAprobar` | `false` | Dirección a prueba de fallo. Con `true` el panel pinta APROBAR para todos |
| `tenant.etiqueta` | El nombre completo | Fallback VISIBLE —se ve largo— y no una etiqueta recortada por nosotros |
| `tabs[].key` | El id | Estable y único, que es para lo que sirve. Un slug del nombre se rompe al renombrar |
| `metric.ventana` | **Vacía** | No se deriva del período: dos métricas con el mismo mes pueden tener ventanas distintas · B1.25 |
| `periodo.etiqueta` | El id crudo | «AGO 2026» necesita un locale, y `Contexto.locale` tampoco llega |
| `direccionSemantica` | El código, tal cual | Traducir a «MÁS ALTO = MEJOR» es escribir copy de producto |
| `capacidades`, `preferencias`, `icono`, `chatSugerencias` | Ausentes | No llegan y no se inventan |

**Y una consecuencia visible que hay que decir:** la línea de BASE sale
`Base · 48 tiendas sobre 52 ·`, con el separador colgando, porque falta la
ventana. Hay una prueba que lo AFIRMA —`la ventana llega VACÍA`— en vez de borrar
la aserción vieja: una prueba borrada no avisa cuando el campo aparece; esta
falla el día que B1.25 llegue.

**Verificada por mutación, cinco casos:** familia mapeada mal, lo desconocido
descartado en silencio, el grano fijo en vez de deducido, `colStart` ignorado y
**la ventana inventada**. Las cinco rompen pruebas. La cuarta enseñó algo aparte:
la primera corrida del arnés no la detectó porque el `sed` tenía la indentación
mal — la mutación que «pasa» hay que verificarla también.

#### ➕ F1.34 ✅ `api/adapt.ts` · payload, valor y presentación
**Descripción.** Los cinco estados —`AVAILABLE`, `DEGRADED`, `BLOCKED`,
`FORBIDDEN`, `ERROR`—, el `Gobierno` que viene anidado en `governance`, las nueve
formas de `Valor` que el backend materializa y la `Presentacion` de las dos que
la tienen.
**Criterio de aceptación.**
- Los cinco estados producen las cinco variantes de la unión discriminada, y el
  `switch` exhaustivo de `Panel.tsx` sigue compilando sin cambios.
- Las nueve formas se verifican una por una contra el fixture del cable. Las
  siete que el backend no materializa —`distribucion`, `serieConBanda`,
  `categoricaComparada`, `perfilMultiatributo`, `matriz`, `grafo`, `flujo`—
  quedan declaradas como no alcanzables hoy, con la razón.
- **`porcentaje` ausente en una composición no se deriva.** El contrato dice que
  lo calcula el backend porque redondear en el cliente da columnas que suman
  99,9. Sin él, el panel entra en `ERROR` con la razón escrita.
- `BLOQUEADO` sin `unlocks_with` no se inventa un «qué lo desbloquea».
- Verificada por mutación: cambiar un nombre de campo en el adaptador tiene que
  romper una prueba.

**Cerrada el 2026-09-14.** Los cinco estados, las nueve formas y la presentación.
**las pruebas del repositorio**, y `render/` y `catalog/` siguen sin una línea tocada.

**El cable NO es una unión discriminada, y ahí está el trabajo real.**
`ports.DDPayloadDTO` es un struct con campos `omitempty`: su tipo permite un
`AVAILABLE` sin `governance` y un `BLOCKED` con valor. El contrato lo hace
imposible de construir. **El adaptador es donde eso se vuelve a cerrar**, y por
eso puede fallar: un payload que no cumple la variante sale como `ERROR` con la
razón escrita, nunca como una variante a medias. `ERROR` y no `BLOQUEADO` a
propósito — bloqueado es «no hay dato y no puede haberlo», esto es un dato que
llegó mal, y el usuario tiene que poder distinguirlos.

**Lo que NO se deriva, con la cita que lo prohíbe:**

- **`porcentaje` de una composición.** El contrato: «lo calcula el backend y no
  el front: la suma tiene que dar 100 y redondear en el cliente produce columnas
  que suman 99,9». En el cable es opcional, así que su ausencia rompe la
  composición entera en vez de producir una que casi suma.
- **La banda de un pronóstico.** Regla dura 6: «prohibida la estimación puntual
  sin intervalo». Sin `lo`/`hi`/`nivel` el panel entra en `ERROR`.
- **El «qué lo desbloquea» de un `BLOQUEADO`.** El servicio deja `unlocks_with`
  vacío ahí; solo lo escribe al derivar `DEGRADED`.
- **El `solicitarA` de un `SIN_PERMISO`.** Pasa la constante `"administrator"`
  tal cual: mejorarla sería inventar a quién pedirle.

**Las siete formas no alcanzables quedan declaradas con una prueba propia** que
recorre `distribution`, `series_with_band`, `compared_categorical`,
`multi_attribute_profile`, `matrix`, `graph` y `flow`. No son paneles rotos: son
formas que el `switch` de `TransformValue` no produce. El día que alguna llegue,
esa prueba falla y alguien decide qué se pinta.

**Dos huecos más quedaron atestiguados por pruebas en vez de tapados**, igual que
la `ventana` de F1.33: `BLOQUEADO` no promete un desbloqueo —con su par, que
comprueba que SÍ se pinta cuando el servicio lo manda, para que el hueco quede
del lado correcto— y un panel no escalar llega sin `presentacion`, que es §4 ask
13 contra la regla dura de «ningún número desnudo».

**Verificada por mutación, seis casos:** `label` leído como `etiqueta`, el
porcentaje derivado, un desbloqueo inventado, el gobierno sin aplanar, el
pronóstico sin banda publicado, y el pilar leyendo `valor` en vez de `value`.
Las seis rompen pruebas.

**Y el arnés de mutación volvió a fallar por comillas**, igual que en F1.33 con
la indentación. Dos de las seis dijeron «pasa» sin haberse aplicado. **Una
mutación que pasa hay que verificarla también**: ahora el script sale con 1 si el
texto a reemplazar no está.

#### ➕ F1.35 ✅ Los enumerados cerrados no se abren en el cable
**Descripción.** En el cable `shape`, `family`, `layer` y `block_type` son
`string` libre; en el contrato son enumerados cerrados. `make sync-catalog` hace
upsert de lo que diga una vista de Snowflake, así que un valor desconocido no es
hipotético. El adaptador es el único lugar donde se puede detectar.
**Criterio de aceptación.**
- Una `family` fuera del enumerado **no pasa**. Si pasara, el color de la serie
  sería `var(--color-fam-vendors-1)`, que no existe: la serie se pinta sin color
  y nadie se entera. Es el mismo modo de falla que `text-labell`.
- Una `shape` o un `block_type` desconocidos ponen ese panel en `ERROR` con la
  razón —qué valor llegó y qué valores hay—, no rompen la pestaña entera ni se
  sustituyen por un default.
- El error es explícito. **Nunca se arregla un valor inválido en silencio**:
  principio 6 de §1.
- Verificada por mutación con una familia inventada en el fixture.

**Cerrada el 2026-09-15.** La mitad estaba desde F1.33 —`adaptCatalog` ya
separaba lo que no podía adaptar en `rejected`— y **lo que faltaba era que la
razón llegara a la pantalla**. Un arreglo de rechazos que nadie lee deja un panel
que no dibuja y no explica, que es la misma falla con otra cara.

**Ahora la pantalla nombra el valor que llegó**: «Métrica no dibujable ·
ventas_dia · familia desconocida: «vendors»» en vez de «Métrica no resuelta» a
secas. **Y las dos siguen siendo distintas a propósito**: una métrica ausente del
catálogo probablemente sea un layout que referencia algo que este rol no ve
—problema de permisos—, y una rechazada es un valor fuera del enumerado.
Confundirlas manda a buscar al lugar equivocado.

**Y apareció un cast que era una afirmación sin evidencia.** `adaptBlocks` hacía
`b.type as Block['tipo']` sobre un dato de red: el compilador se calla y un tipo
inventado entra a la tabla como si fuera bueno. Ahora se comprueba contra una
lista de los quince **en runtime**, porque `PanelType` es una unión de TypeScript
y se borra al compilar.

Esa lista es una copia del enumerado del contrato, así que lleva **su prueba de
paridad contra el yaml** —`enumOf('TipoPanel')`, el mismo camino que ya usa
`registry.test.tsx`—. Una copia a mano sin esa prueba se desactualiza con el
contrato adelante.

**Verificada por mutación, tres casos:** una familia inventada que pasa (5
fallas), un tipo faltante en la lista de runtime (1), y la razón que no llega a la
pantalla (2).

##### Corrección del 2026-09-15 · una sola tabla contestaba dos preguntas

Al medir `/config/blocks` contra el servicio corriendo apareció que el mapa de
nombres de forma tenía **nueve de dieciséis** entradas, y que las que faltaban se
descartaban **en silencio**: `flatMap` sobre un `undefined` devuelve `[]` y no
deja rechazo ni razón. Consecuencia concreta: tres de los quince bloques llegaban
a la biblioteca del builder con la lista de formas vacía.

No lo vio ninguna prueba porque todas ejercitaban `bars`, cuyas dos formas sí
estaban. **Un fixture que solo recorre el caso que funciona no cubre nada.**

**Lo que estaba pasando es que una tabla contestaba dos preguntas.** «Cómo se
llama esta forma en el cable» es una tabla de nombres y tiene que estar completa;
«el backend sabe materializar esta forma» es un hecho sobre su `transform.go`,
que tiene nueve casos. Mientras coincidieran, faltar en una significaba faltar en
la otra.

Al separarlas, la prueba `una forma que el backend no materializa tampoco pasa`
—que estaba bien escrita— falló, y ahí se vio que el rechazo del catálogo salía
de la ausencia en el mapa y no de una comprobación. **Se hizo explícita.**

Ahora el mapa es `Record<Shape, string>` completo: agregar una forma al contrato
sin su nombre de cable **deja de compilar**. Es el mismo mecanismo que pide el
criterio de F4.20 para el registro de cuerpos, puesto donde hoy sí se sostiene.

**Verificada por mutación, diez casos sobre línea de base verde:** cinco formas
que pierden su nombre de cable, `flujo` y `grafo` cruzados, la puerta de
materializable apagada, `distribucion` declarada materializable, el comodín de
`blocked` expandido a las dieciséis y recortado, y las formas aceptadas
descartadas enteras. Mueren las diez.

**Y el mock de desarrollo estaba escrito de memoria.** Las quince filas de
`dev/mocks/datos.ts` diferían del servicio: cinco `accepted_shapes` equivocadas,
los quince `ui_name` traducidos al español —el cable los manda en inglés— y casi
todos los rangos de span. Las formas son lo que importa, porque son lo que decide
`invalidReason`: componer contra el mock daba una validación que el servidor no
da. Reemplazadas por la captura del servicio, con su fecha y su endpoint escritos
en el archivo. Es la otra mitad de lo que ya dice `BITACORA-2026-09-14.md` —«un
mock que habla el idioma de tu capa interna no prueba la frontera, la esconde»—:
uno que habla mal el idioma del cable tampoco.

#### ➕ F1.36 ✅ `client.ts` contra las rutas, los cuerpos y el error de este servicio
**Descripción.** Seis correcciones: el batch manda `{ panel_ids, period }` y no
`{ panelIds, periodo }` —los dos son `required` en el binding, así que hoy
devuelve 400—; las preferencias van a `/config/me/preferences` con `{ theme }`;
el catálogo y los bloques llegan como arreglo desnudo; los hilos apuntan a un
endpoint que no existe; y **el envelope de error de este servicio es
`{ success: false, error: "cadena" }`**, no el objeto de §4.1.
**Criterio de aceptación.**
- Ninguna llamada de la consola devuelve 400 ni 404 por forma del request contra
  el servicio real.
- Un error del servicio produce un `ApiError` con `message` legible. Hoy
  `body.error.codigo` sobre una cadena da `code: undefined` y `message: ""` —una
  pantalla de error sin una palabra—, que es el defecto exacto por el que existe
  `api/auth.ts`.
- El desenvolvimiento del envelope sigue ocurriendo **en un solo lugar**.
- Mientras el servicio no emita códigos, el `code` es explícitamente desconocido
  y el front no decide sobre él.

**Cerrada el 2026-09-14, en dos tramos.** Cuatro correcciones entraron con la
tarea —el cuerpo del batch (`panel_ids` / `period`), la ruta y la clave de
preferencias (`/config/me/preferences`, `{ theme }`), el envelope de error como
cadena, y `threads()` documentado contra un endpoint que el servicio no tiene— y
**las dos de respuesta entraron con F1.33**, donde el tipo de retorno tiene quien
lo reciba: el catálogo y los bloques llegan como arreglo desnudo.

Se partió así y no por tiempo. Hacerlas antes del adaptador dejaba dos salidas y
las dos malas: el árbol en rojo hasta que existiera `adapt.ts`, o un
`request<Metric[]>` afirmando que el cable devuelve el tipo del contrato — un
cast que miente y que el compilador deja pasar.

**Los cuatro criterios, verificados y no asumidos:**

| | Cómo se comprobó |
|---|---|
| Ninguna llamada difiere del cable | Cruzando las rutas y los cuerpos de `client.ts` contra `synapse-console-wire.yaml`. Las seis coinciden |
| El error produce un `message` legible | Prueba con el envelope del cable, más la mutación que descarta el mensaje |
| El envelope se desenvuelve en UN lugar | `grep` de `res.json()` y `body.success` sobre `src/`: una sola vez, en `client.ts` |
| El `code` es explícitamente desconocido | `SIN_CODIGO`, y una prueba afirma que su familia NO es `CAMPO`, `REGLA` ni `FALLO` |

**La única ruta que no existe es `/config/chat/hilos`, y no la llama nadie**:
`useThreads` no tiene consumidor en `src/`. Se conserva porque F3.7 está escrita
y bloqueada, no equivocada — lo que no se hace es montarla en la consola, que un
riel que pide un 404 al abrir es peor que un riel ausente.

**Y al cerrarla apareció algo que conviene decidir, no hacer de pasada.** La
razón por la que `api/auth.ts` existe aparte era su envelope: «§4.1 declara el
error como objeto y el servicio como cadena, y pasarlo por `client.ts` daba
`code: undefined`». **Eso dejó de distinguirlos**: ahora `client.ts` lee el mismo
envelope de cadena, así que los dos archivos hacen lo mismo con la misma forma.

Lo que todavía los separa es poco: `auth.ts` asigna códigos con sentido
—`AUTH_CREDENCIALES` frente a `AUTH_FALLO` según el 401— donde el cliente pone
`SIN_CODIGO`, y estrecha los opcionales del spec. Es candidato a fundirse, y no
se hizo acá porque toca el flujo de acceso entero —F0.5, F0.13, F0.15 y F0.16,
las cuatro cerradas y probadas— y eso es una tarea con su propio criterio, no un
arreglo al pasar.

**Y esa separación ya costó un defecto, encontrado el mismo día levantando la
app.** La guarda de JSON de F1.36 quedó solo en `client.ts`; `auth.ts` hacía
`await res.json()` **cinco veces sin un `try`**. Con el backend apagado, el proxy
devuelve un 502 vacío y la PRIMERA pantalla —`AuthGuard` llama a `tokenInfo()` al
montar— decía «Failed to execute 'json' on 'Response': Unexpected end of JSON
input»: un mensaje sobre el parser y no sobre el servicio que no está.

Arreglado con un helper en `auth.ts`, y con tres pruebas: 502 vacío, 502 con
HTML, y la que impide que la guarda se trague el error real —si lo hiciera,
«credenciales inválidas» se volvería «respondió sin cuerpo»—. Verificado por
mutación y en pantalla: ahora dice «El servicio de acceso respondió 502 sin
cuerpo».

**Lo encontró correr la aplicación, no una prueba.** Ninguna de las 406 lo
cubría porque todas responden JSON: MSW no tiene forma de devolver un cuerpo
vacío si nadie se lo pide. Es el mismo hueco que los mocks de F1.38, un nivel más
abajo — el transporte también tiene estados que los fixtures no imitan por
defecto.

**El `code` es `SIN_CODIGO`**, y la familia `SIN` no es ninguna de las tres de
§4.1 a propósito: ninguna rama futura sobre `CAMPO_`, `REGLA_` o `FALLO_` lo va a
agarrar por accidente. Lo que sí queda es `httpStatus`, que el transporte declara.

**Apareció una quinta corrección que no estaba en la lista**: `res.json()` tira
cuando el 502 del proxy o un panic de Go devuelven HTML, y el mensaje que veía el
usuario hablaba del parser y no de que el servicio no está.

**Y el helper `fail()` de MSW emitía la forma del contrato** —es la razón por la
que `body.error.codigo` sobrevivió meses sin que ninguna prueba se quejara: los
mocks le daban de comer exactamente lo que esperaba—. Es F1.38 en chico, y
confirma por qué esa tarea no se deja para el final.

**Verificada por mutación, cuatro casos**, cada uno rompiendo una corrección:
claves viejas del batch, ruta vieja de preferencias, mensaje del servicio
descartado, y el `try` del JSON quitado. Las cuatro hacen fallar una prueba.

#### ➕ F1.37 ✅ Una sola base de API
**Descripción.** `/auth/*`, `/config/*` y `/admin/*` los sirve el mismo binario
bajo el mismo `/api/v1`. Las dos bases del front dejan de tener razón de ser.
**Criterio de aceptación.**
- `VITE_AUTH_URL` ausente cae a `VITE_API_URL`, que es el comportamiento que ya
  estaba previsto «si algún día quedan detrás del mismo origen».
- Un `.env.example` declara las variables con el puerto real del servicio
  (`4010`) y el `README` dice cómo levantar los dos lados.
- `CLAUDE.md` deja de decir «son DOS servicios».

**Cerrada el 2026-09-14.** La caída de `VITE_AUTH_URL` a `VITE_API_URL` ya estaba
escrita desde F0.5 «por si algún día quedan detrás del mismo origen»; lo que
faltaba era todo lo demás, que seguía asumiendo dos destinos.

**El proxy de Vite enumeraba prefijos, uno por uno**, con la razón escrita: «la
API de la consola es otro servicio y va a tener otro destino». Resultó no serlo.
Enumerar ya había costado una vez —`password-reset-requests` cae fuera de `/auth`
y el proxy devolvía 404, así que parecía que el endpoint no existía— y con
`/config/*` y `/admin/*` la lista solo se alargaba. Ahora es `/api/v1` entero.

`API_ORIGIN` reemplaza a `AUTH_ORIGIN`, que **sigue funcionando** para no romper
entornos que ya lo tienen puesto.

**El encabezado de `api/auth.ts` afirmaba que era otro servicio y ya no lo es.**
Se corrigió dejando escrito qué se sabía cuando se escribió. Lo que NO cambia es
que el archivo siga existiendo: su razón de ser es el envelope de error, y que
sea un solo servicio no lo arregla.

#### ➕ F1.38 ✅ MSW responde la forma del cable, no la del contrato
**Descripción.** Hoy `tests/mocks/handlers.ts` responde la forma del contrato.
Si se queda así, **el adaptador no se ejecuta en ninguna prueba y las 350 siguen
verdes con el adaptador roto** — el modo de falla exacto del 2026-08-20, cuando
el colapso responsive violaba §3.1 de tres formas con 184 pruebas en verde.
**Criterio de aceptación.**
- Los handlers responden lo que responde Go: snake_case, `error` como cadena,
  arreglos desnudos, estados en inglés, `governance` anidado, `shape` como
  discriminador.
- El adaptador queda en el camino de **toda** prueba de superficie: no hay ruta
  por la que una prueba vea la forma del contrato sin pasar por él.
- Los fixtures se escriben desde `synapse-console-wire.yaml`. Un fixture
  inventado verifica el fixture.
- Verificada por mutación: romper el adaptador tiene que romper pruebas de
  superficie, no solo las del propio adaptador.

**Cerrada el 2026-09-15, y la mayor parte se había hecho sola.** Los handlers
pasaron al cable en F1.33 y F1.34 porque **no había otra forma de ejercitar el
adaptador**: mientras hablaban el idioma del contrato, no se ejecutaba en ninguna
prueba. Ahí fallaron 16 solas y una encontró un bug propio.

Lo que faltaba era la garantía, no la migración. **Auditado: ni un solo fixture
HTTP habla el idioma del contrato.** Las dos apariciones que quedan están en
`tests/render/state.test.ts`, que es una prueba unitaria de `render/` — y `render/`
habla el contrato por diseño. Son correctas.

**Y lo que impide que vuelva atrás es el COMPILADOR, no una revisión.** Los
fixtures compartidos ya estaban tipados contra `WireContext`, `WireMetric` y
`WirePanel`; los seis payloads de `states.test.tsx` y los de `tab.test.tsx` no lo
estaban. Ahora van contra `WirePayload`, así que escribir `estado` en vez de
`status` **deja de compilar**:

    error TS2353: Object literal may only specify known properties,
    and 'estado' does not exist in type '{ status: "AVAILABLE" | … }'

Verificado por mutación devolviendo `SIN_PERMISO` al idioma del contrato. Lo
sostiene `tsc`, que ya corre en la puerta — **una garantía que no necesita que
nadie se acuerde.**

#### ➕ F1.39 ✅ Humo contra el servicio real
**Descripción.** Una corrida contra el servicio levantado con su seed —login,
`/config/me`, `/config/catalog`, `/config/blocks`, `/config/tabs/:tabId`,
`panels:batch`— que compare lo que llega contra
`contracts/synapse-console-wire.yaml`. Una prueba verde contra MSW demuestra que
el adaptador es coherente con lo que nosotros creemos del cable, no con el cable.
**Criterio de aceptación.**
- Se corre a mano con credenciales y no forma parte de `npm run verify`: la
  puerta no puede depender de un servicio externo.
- Sale con 2 —BLOQUEADO— si no hay servicio al que apuntar, nunca con 0. Un
  chequeo que pasa por falta de fuente miente sobre su cobertura.
- Una diferencia entre el cable real y el yaml transcripto se reporta con el
  campo y los dos valores, y **se corrige el yaml**, que es lo que puede estar
  mal: el yaml es nuestra transcripción, el servicio es el hecho.
- Queda registrado qué se verificó y con qué commit del backend.

**Cerrada el 2026-09-15.**

`tools/humo.py` pide las cinco rutas al servicio y compara la respuesta contra
los `required` de cada esquema del yaml, más las dos propiedades que no son de
campos sino de forma: que `/config/catalog` y `/config/blocks` devuelvan
**arreglo desnudo** y que `panels:batch` devuelva un **mapa**.

**Verificado en sus dos caminos de BLOQUEADO**, que es la mitad del criterio: sin
credenciales y sin servicio sale con **2**, nunca con 0, y las dos veces dice que
no es un fallo del front. Un chequeo que pasa por falta de fuente miente sobre su
cobertura.

**LA CORRIDA, REGISTRADA · 2026-09-15 · las cinco rutas conformes.**

| Endpoint | Esquema | Requeridos |
|---|---|---|
| `/config/me` | `ContextResponse` | 6 / 6 |
| `/config/catalog[0]` | `CatalogMetric` | 12 / 12 |
| `/config/blocks[0]` | `BlockRule` | 7 / 7 |
| `/config/tabs/{id}` | `TabWithPanels` | 2 / 2 |
| `panels[0]` | `PanelDTO` | 6 / 6 |
| `panels:batch[0]` | `Payload` | 1 / 1 |
| `governance` | `Governance` | 5 / 5 |

**Contra `AntPack-dev/synapse-api-go` en `733c13c`** —`feature/dynamic-dashboard-backend`,
del 2026-09-11, confirmado con `npm run backend-drift`—, con el seed de UA MX.
Cero diferencias: el yaml transcripto describe lo que el servicio sirve.

**Y eso no era obvio.** La corrida a mano del 2026-09-14 había encontrado una
—`semantic_direction` es texto ya redactado y no un código, al revés del
comentario de Go del que se transcribió—. Se corrigió el yaml ese día; esta
corrida confirma que no quedó ninguna otra.

    SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… npm run humo

**No entra a la puerta**, y esa es una decisión: necesita el servicio levantado y
credenciales, así que en CI saldría ⊘ todos los días — y un bloqueado cotidiano
es cómo se deja de mirar un chequeo.


#### ➕ F1.40 ✅ `Presentacion` llega al cuerpo · hoy está declarada y nadie la pasa
**Descripción.** `BodyProps.presentation` existe en `render/types.ts`, está
documentada correctamente —«rótulos y cifras de apoyo, redactados por el backend;
viajan con el dato y no con el layout porque dependen del período»— y **ningún
cuerpo la lee, ninguna superficie la pasa**. `KpiBody` toma `label`,
`comparativo` y `medidor` de `params`, o sea de `PanelConfigurado.opciones`, que
es el layout.

**Es nuestro, no del backend, y contradice nuestro propio contrato.** `Presentacion`
declara esos tres campos y dice por qué van en el payload: «el medidor marca 61%
este mes y otra cosa el siguiente». Con el layout de por medio, el rótulo del KPI
queda congelado en la composición.

MSW lo tapaba porque los fixtures escribían el rótulo en `opciones`. El cable lo
destapa: manda `options: { comparative: true, meter: true }` —interruptores— y
los datos en `presentation`.
**Criterio de aceptación.**
- `Panel` pasa `presentation` al cuerpo, y `KpiBody` lee de ahí `label`,
  `medidor` y `comparativo`. En `params` quedan los interruptores, que es lo que
  el contrato llama «interruptores de composición, no datos».
- Un KPI cuyo medidor cambia de período cambia en pantalla **sin republicar el
  layout**. Es la garantía que justifica que `Presentacion` exista.
- Verificada por mutación: mover el rótulo de vuelta a `opciones` tiene que
  romper una prueba.
- **Queda UN solo lugar que la pasa y uno solo que la lee.** Los doce cuerpos
  comparten `BodyProps`, así que `PanelInGrid` se la pasa a todos y la
  declaración de quién la usa es **destructurarla o no**: hoy solo `KpiBody`.
  Verificable con `grep`, y esa es la forma correcta del criterio — el que se
  escribió primero pedía «el que no la usa no la recibe», que con un tipo de
  props compartido no se puede cumplir sin partirlo en dos, y partirlo sería
  peor: el día que un segundo cuerpo la use no habría nada que cambiar.
  *Criterio corregido por la auditoría del 2026-09-14; el cierre lo
  reinterpretaba y un criterio que el cierre reinterpreta no es un criterio.*

**Cerrada el 2026-09-14, y dejó de ser teórica ese mismo día.** Al correr la
consola contra el servicio real apareció la evidencia: el payload traía

    "presentation": { "label": "USD · TOTAL",
                      "meter": { "label": "PERFORMANCE WEIGHT", "percentage": 61,
                                 "note": "USD 2.61M OF USD 4.28M" },
                      "comparative": [ { "label": "VS PREVIOUS MONTH", "delta": 6.4 },
                                       { "label": "VS PRIOR YEAR",     "delta": 11.2 } ] }

y la pantalla mostraba **`TOTAL` y `4.28M`**, nada más. `TOTAL` ni siquiera era
ese label: era el default de `KpiBody`. El dato llegaba, el adaptador lo
traducía, y se perdía en el último salto.

**El arreglo son dos líneas y un cambio de tipo.** `PanelInGrid` pasa
`payload.presentacion`, y `KpiParams` deja de llevar datos —`label`,
`comparativo`, `medidor` con su contenido— para llevar los dos interruptores que
el layout sí decide. Ausente muestra lo que el payload traiga; solo un `false`
explícito oculta. Con el interruptor en `true` y sin dato no se inventa nada: el
interruptor dice «acá va», no «inventá uno».

**Las pruebas del cuerpo fijaban el defecto.** `KpiBody.test.tsx` metía el
rótulo y el medidor en `params`, así que pasaban con el cuerpo leyendo del
layout — la prueba verificaba que el bug funcionara. Movido el helper a
`presentation`, y agregada la que faltaba: **el mismo layout con otro payload
cambia el medidor**, que es la garantía por la que `Presentacion` existe.

**Y una de superficie, porque un cuerpo solo no puede verla.** `KpiBody` prueba
que pinta lo que le pasan; lo que faltaba era que ALGUIEN se lo pasara. La cadena
`batch → adaptPayload → ConsoleContainer → PanelInGrid → Body` son cuatro saltos
—la que `CLAUDE.md` nombra— y ninguna prueba la recorría entera con presentación.

**Verificada por mutación, tres casos:** nadie pasa la presentación (el estado de
ayer, 1 falla), el rótulo vuelve al layout (4 fallas), el medidor se descarta (6
fallas). Y confirmada en pantalla contra el servicio real.

**Sobre el criterio de «el que no la usa no la recibe»:** los doce cuerpos
comparten `BodyProps`, así que `PanelInGrid` la pasa a todos y la declaración es
no destructurarla. Once no la tocan. Dejarlo así y no partir el tipo es lo
correcto mientras `Presentacion` siga siendo opcional en el contrato — el día que
un segundo cuerpo la use, no hay nada que cambiar.

#### ➕ F1.41 ✅ Los nombres de los params, del cable al contrato
**Descripción.** `PARAM_SCHEMAS` espera los params en español —`maximo`,
`horizonte`, `orden`, `tope`, `normalizacion`, `pilares`, `columnas`, `banda`,
`corte`, `ventana`— y el cable los manda en inglés: `maximum`, `horizon`,
`order`, `cap`, `normalization`, `pillars`, `columns`, `band`, `cut`, `window`.
La tabla `blocks` los declara en `layout_params`.

**El caso que lo hace urgente es `gauge`.** El backend **exige**
`options.maximum` y emite `ERROR` si falta, así que el panel siempre llega con
`{ maximum: 100 }`. `GaugeBody` espera `maximo`. `adaptPanelParams` descartaba
`maximum` por desconocido y **el panel mostraba «Sin máximo declarado» teniendo
el dato en la mano**.

*Corregido el 2026-09-15 al escribir la prueba:* esta descripción decía antes que
«el arco se dibuja contra otro máximo, en silencio». **Era falso.** `GaugeBody`
comprueba `maximo === undefined` y **se niega a dibujar** — que es lo correcto, y
por eso el defecto se veía en pantalla en vez de esconderse. El error era del
diagnóstico, no del código. Lo mismo `forecast` con
`horizon`.
**Criterio de aceptación.**
- El mapeo vive en el adaptador de `api/` y en un solo lugar, junto al de
  familias y formas.
- Un param del cable que el mapeo no conoce **se reporta**, no se descarta: es la
  misma regla que `unknownParams` ya aplica, y ahora con dos vocabularios hay el
  doble de superficie para que uno se pierda.
- `paramsDisponibles` que llega de `/config/blocks` se traduce con la misma
  tabla, para que la validación compare peras con peras.
- Un `gauge` del seed dibuja su medidor contra el `maximum` que mandó el
  backend. Verificado cambiando el valor en el fixture y viendo moverse el arco.
- Queda declarado qué params del cable **no tienen contraparte** —`brand`,
  `components`, `interval_level`, `stats`, `scale`, `clustering`, `reference`,
  `profile_cap`, `cuts`— y por qué: son de los tres cuerpos que no existen y de
  opciones que ningún cuerpo lee todavía.

**Cerrada el 2026-09-15.** La tabla vive en `api/adapt.ts` **junto a la de formas
y la de familias**, que era la mitad del criterio: tres tablas de traducción en
tres archivos es cómo una se queda atrás.

Trece nombres traducidos, y los nueve sin contraparte **pasan sin tocar** para que
`validateParams` los reporte. Descartarlos en el adaptador habría sido peor: el
panel se vería igual y quien compone no sabría por qué su opción no hace nada.

**`paramsDisponibles` se traduce con la MISMA tabla**, y eso no es simetría
estética: `validateParams` exige que el param esté en el esquema **y** en esa
lista, así que traducir un lado y no el otro haría que todo saliera desconocido —
el mismo síntoma que no traducir nada, y más difícil de encontrar.

**Y el fixture de `ConsoleContainer` dejó de mentir.** Tenía `layout_params` en
español con la deuda anotada al lado —«no es fiel al cable»—, puesta ahí cuando
se escribió F1.33. Ahora manda `order` y `cap`, como el servicio.

**Verificada por mutación, tres casos:** sin el mapeo de `maximum` (3 fallas),
`cuts` traducido por descuido (1), y traducir el panel pero no la lista (2).

### La corrección que trajo esta tarea

**«El arco se dibuja contra otro máximo, en silencio» era falso**, y se repitió
en el plan, en `CLAUDE.md` y en el análisis desde que se abrió F1.41.

`GaugeBody` comprueba `maximo === undefined` y **se niega a dibujar**: muestra
«Sin máximo declarado · no se puede leer como proporción». El defecto real era
otro y peor de explicar aunque mejor de detectar — el backend manda el máximo, el
adaptador no lo traducía, y **el panel declaraba que no lo tenía teniéndolo**.

Lo encontró **leer el cuerpo al escribir su prueba**, no una revisión. Es el
recordatorio de por qué las pruebas se escriben desde el contrato y el código y
no desde lo que uno cree que pasa: el diagnóstico venía repitiéndose sin que
nadie abriera el archivo.


---

#### ➕ F1.42 ⬜ El mes en curso está incompleto y el selector no lo dice · 🔒 el período llega como cadena suelta
**Descripción.** El equipo de datos avisó el 2026-09-15 que
`GLD_ECOMM_DAILY_PERFORMANCE` tiene filas hasta **dic-2028 con valores en 0**
—metas de planeación— y que **el mes en curso está incompleto**.

**La mitad de ese aviso no aplica, y conviene devolvérselo.** Lo verificamos
contra el código: `availablePeriods()` genera los **últimos doce meses contando
el actual** y nunca uno futuro, así que la consola no puede ofrecer dic-2028. Esa
preocupación es real para quien consulte Snowflake a mano, no para el front.

**La otra mitad sí, y es nuestra.** El mes en curso se ofrece igual que los
cerrados, y `PeriodPicker` no lo distingue: alguien compara septiembre contra
agosto y lee una caída que es «el mes todavía no terminó». Es el mismo problema
que un panel degradado mostrando un número aproximado — **la cifra es correcta y
la lectura es falsa**.

El `.pen` ya lo dibuja en B5: «PERÍODO · 1 – 31 JUL 2026 · **MTD CERRADO**».
**Criterio de aceptación.**
- El período en curso se marca como **parcial**, con qué parte del mes cubre. No
  se deshabilita: mirar el mes en curso es legítimo, lo que no es legítimo es que
  se vea igual que uno cerrado.
- El texto sale de lo que el período declara, **no de comparar contra `new
  Date()` en el front**: el corte del día es del tenant y su huso, no del
  navegador · la regla de las dos zonas horarias.
- **Eso lo hace esperar un campo**: hoy `Periodo` no declara si está cerrado. Va
  pedido a backend.

## Fase 2 — Los estados de materialización en pantalla

Depende de B2.5–B2.7 para los estados REALES: hasta que el backend los emita,
solo se pueden probar contra el seed (B1.20) o contra MSW.

**Arrancada el 2026-09-03**, en cuanto B0.9 contestó la 1171. Lo primero que
apareció al abrirla: **MSW emitía únicamente `DISPONIBLE`**, así que los otros
cinco estados nunca habían atravesado el contenedor, el adaptador de params ni
el registro de cuerpos. Estaban probados a nivel de componente —con payloads
montados a mano— y ni una vez de punta a punta. Eso es
`tests/surfaces/console/states.test.tsx`, 29 pruebas.

### F2.1 ✅ `DEGRADADO`
**Criterio de aceptación.** Muestra **la cifra**, más `razon` y `desbloqueaCon`.
El badge lo pinta el shell. El front **no decide** si algo está degradado.

**Cerrada el 2026-09-03.** Ya estaba implementado desde F1.13d; lo que faltaba
era la prueba de punta a punta. La aserción que la hace valer es la negativa:
el mismo `valor` con estado `DISPONIBLE` **no** pinta el badge, que es lo que
demuestra que sale del `estado` del backend y no de una heurística del front.

### F2.2 ✅ `BLOQUEADO`
**Criterio de aceptación.** Sin cifra y sin aproximación. Razón, qué lo
desbloquea y CTA. El shell conserva título y BASE.

**Cerrada el 2026-09-03**, con una salvedad escrita: **el CTA no se pinta**, y
es correcto. La consola no pasa `onUnblock`, y la regla del CTA muerto dice que
un botón sin manejador no se dibuja —«un botón que se aprieta y no hace nada es
peor que uno ausente»—. El estado no queda sin salida: el detalle sigue
diciendo qué lo desbloquea. Cuando exista a dónde mandar el desbloqueo, se
cablea.

La prueba de «sin aproximación» no busca un texto: busca que no haya **ninguna
forma de cifra** en el panel —ni `USD `, ni `4.28M`, ni miles con separador—,
porque un número aproximado que se cuele no va a llamarse como el fixture.

### F2.3 ⚠️ `SIN_PERMISO` · B0.9 (línea 1171) contestada · 🔒 `/config/solicitudes` da 404
**Criterio de aceptación.** Muestra `solicitarA` y ofrece pedir acceso. Si D3
resuelve conservar el viaje de solicitud, se cablea contra
`/config/solicitudes`: la solicitud ya hecha sale del servidor y **no de estado
local** —con estado local, recargar borraba el pedido y la consola volvía a
ofrecer el CTA como si nada.

**Parcial el 2026-09-03.** La mitad que se puede hacer sin backend está hecha y
probada: el estado llega del batch y nombra el rol que decide. **Falta el CTA**,
y falta entero: `/config/solicitudes` ya existe en el contrato —línea 591,
`operationId: solicitarAcceso`—, así que lo que queda es cablearlo y leer del
servidor las solicitudes ya hechas. Hay una prueba que fija el estado actual:
verifica que el botón **no** esté, para que aparezca el día que se cablee y no
antes.

### F2.4 ✅ `ERROR` con reintento por panel
**Criterio de aceptación.** El reintento re-pide **ese** panel, no el batch
entero. El mensaje es el del backend, no uno inventado por el front.

**Cerrada el 2026-09-03, y era un defecto real.** `ConsoleContainer` pasaba
`onRetryPanels={() => void batch.refetch()}`: apretar «Reintentar» en el panel
que falló volvía a pedir **los N paneles**, y los N−1 que habían cargado bien
parpadeaban. Se reemplazó por `useRetryPanel`, que pide ese panel —el mismo
endpoint con una lista de uno, que el contrato ya soporta porque declara fallo
parcial— y funde el resultado con `setQueryData`. **No `invalidateQueries`**:
invalidar dispara de nuevo la consulta original, o sea los N, que es el mismo
defecto por otro camino.

La prueba necesita **dos** paneles: con uno solo, «re-pedir el batch» y
«re-pedir ese panel» son la misma llamada y no distinguen nada. Verificada por
mutación: con el `refetch()` viejo llegaban `['p-1','p-2']` donde va `['p-1']`.

### F2.5 ✅ Frescura relativa en la procedencia
**Criterio de aceptación.** «hace 3 h» calculado contra el `ahora` que baja por
props. Refleja cuándo se materializó (B2.10), no cuándo se abrió la página.

**Cerrada el 2026-09-03.** Ya venía de F1.13e: `format.freshness` lee
`payload.frescura` —que es cuándo se materializó— contra un `now` único por
pantalla. Faltaba la prueba de punta a punta, y se escribió con la distancia
calculada en el momento y no con una fecha quemada: una fecha fija diría «HACE
8000 H» el año que viene y habría que tocarla.

### F2.6 ✅ Gobierno visible en los seis estados
**Criterio de aceptación.** Incluso cargando: la BASE sale de `Metric.base` del
catálogo (D6). Es la garantía de §5.2 verificada estado por estado.

**Cerrada el 2026-09-03.** La prueba que la hace valer de verdad es una sola:
`BLOQUEADO`, `SIN_PERMISO` y `ERROR` **no llevan `Gobierno`** —el contrato lo
intersecta solo en los dos estados con cifra—, así que si la BASE sigue en
pantalla con un payload que no la trae, es porque salió del catálogo. Eso es D6
verificada y no declarada. La prueba además **afirma que el fixture no trae
`base` ni `capa`**, para que agregárselos no la deje verde sin verificar nada.

---

## Fase 3 — Chat contextual

### F3.1 ✅ `ChatOverlay` — la hoja lateral
**Criterio de aceptación.** Escape cierra. El foco entra al abrir y vuelve al
disparador al cerrar. Una sola hoja abierta a la vez: apilarlas deja al usuario
sin saber qué cierra el Escape.

**Cerrada el 2026-09-03, sin `<dialog>` nativo y con la razón escrita.**
`showModal()` daría Escape, trampa de foco y devolución del foco gratis, pero
**jsdom no lo implementa** —verificado— así que las pruebas tendrían que
polirrellenarlo y estarían verificando el polyfill en vez de la hoja. Hecho a
mano, el retorno del foco queda explícito en vez de confiado al navegador.

Lo de «una sola hoja» es estructural: la consola sostiene un único estado. El
contador del componente es la red por si alguien monta una segunda desde otro
lado, y **avisa en vez de fallar en silencio**.

### F3.2 ✅ Construir `ContextoDePanel` al abrir
**Criterio de aceptación.** Manda `panelId` y `periodo`. **Nunca SQL.**

**El criterio se REESCRIBIÓ el 2026-09-17**, por decisión humana sobre el
informe de `82da946`. Pedía doce campos —`metricId`, `metricKey`, `nombre`,
`base`, `fuente`, `capa`, `familia`, `tipo`, `valorActual`,
`dimensionesDisponibles`— porque cuando se escribió no había ningún campo por
donde mandar el panel y se asumió que habría que transcribirlo entero.

**El backend lo resolvió al revés y mejor:** `panel_context: {panel_id, period}`,
y el servicio arma el resto leyendo el panel por su id. Transcribir doce campos
desde el front habría sido mandarle al backend datos que él ya tiene, con la
posibilidad de que difirieran.

**Construida el 2026-09-21** en `src/api/chat.ts` —`alCable()`— y
`src/api/useChat.ts` —`PanelContext`—. Lo prueba
`tests/api/chat.test.ts`, contra el cable transcripto y no contra nuestro
vocabulario interno.

### F3.3 ✅ «Ver detalle» y «Preguntar» en el shell del panel
**Criterio de aceptación.**
- Los dos son CALLBACKS del shell, no navegación escrita adentro: `render/` no
  sabe a dónde llevan y la superficie es dueña del viaje.
- **Sin manejador no se pinta el botón.** Es la regla del CTA muerto, que el
  shell ya aplica: «Ver detalle» está diferido por D3, así que hoy no se pinta
  ninguno de los dos y eso es correcto.
- «Preguntar» abre la hoja con el panel desde el que se preguntó.

**Ya no espera a T4**, que se cerró el 2026-09-17: el contexto del panel viaja
como `panel_context: {panel_id, period}` y `useChat` ya lo recibe. Lo que falta
es puramente de este lado — el callback en el shell y la superficie que abre la
hoja con el panel desde el que se preguntó.

**Hecha el 2026-09-21.** `Console` recibe `onAskPanel` y lo baja como `onChat`;
`ConsoleContainer` sostiene **un solo** `askingPanelId` y monta `PanelChat`, la
hoja atada a un panel. El lado de `render/` ya estaba: el shell pinta
«Preguntar» sólo si hay manejador —la regla del CTA muerto— y sigue sin saber a
dónde lleva.

**«Ver detalle» sigue sin pintarse, y es correcto**: D3 lo difirió, así que no
hay manejador que pasarle. El criterio decía «hoy no se pinta ninguno de los
dos»; pasó a ser «hoy se pinta uno».

**El campo donde se escribe la pregunta no tenía tarea.** F3.1 es la hoja, F3.5
son los mensajes, F3.8 es el hook: ninguna es el compositor. Se descubrió acá,
porque sin él «Preguntar» abre una hoja que invita a preguntar y no deja. Vive
en `PanelChat`.

**La prueba es que la pregunta LLEGUE con el panel correcto**, no que el botón
exista: son cinco saltos con spread condicional —`ConsoleContainer → Console →
PanelInGrid → Panel → PanelShell`— y ahí una prop mal nombrada compila.
Verificada rompiendo el código: cinco mutaciones, las cinco muertas. **Una
sobrevivió primero** y mostró que la prueba del arrastre de turnos cerraba la
hoja antes de saltar de panel, con lo cual React desmontaba igual y la `key` no
se estaba verificando. La hoja NO tapa la pantalla: se puede saltar de panel sin
cerrarla, y ése es el caso que la `key` defiende.

**Y se abrió en el navegador**, que es la mitad que no se automatiza. Modo mock,
apretando «Preguntar» en el SEGUNDO panel: la hoja se tituló con su métrica, el
texto llegó de a fragmentos, el botón dijo «Esperando» mientras transmitía y
«Cómo se calculó» quedó al pie. **Ahí apareció F3.13**, que ninguna prueba vio.

El modo mock tiene handler de chat desde hoy, y **responde el cable** —`event:`
+ `data:`— porque uno que hablara nuestro dialecto volvería a esconder la
frontera.

### F3.4 ✅ Cliente SSE
**Criterio de aceptación.** Lee los seis eventos que declara el contrato.
Cerrar la hoja aborta el stream. Un `error` a mitad deja lo ya recibido visible
y dice qué pasó.

**El criterio decía otros nombres y estaba equivocado.** Pedía «`pensando`,
`fragmento`, `dato`, `sql`, `error`, `fin`», que salía de `tareas-front-back.md`.
El contrato declara `texto`, `dato`, `auditoria`, `sugerencias`, `fin` y `error`:
`pensando` no existe, `fragmento` es `texto`, `sql` es `auditoria`, y
**`sugerencias` faltaba en el plan**. Gana el contrato, que es su casa. Corregido
acá el 2026-09-03.

**Cerrada el 2026-09-03.** Dos decisiones de implementación que el criterio no
anticipaba:

**No se usa `EventSource`.** `POST /config/chat` lleva la pregunta en el cuerpo
y `EventSource` solo hace GET sin cuerpo: la pregunta tendría que viajar en la
URL, donde queda en logs de proxy y en el historial del navegador. Se usa `fetch`
con `ReadableStream`, que además da `AbortController` de verdad. (El criterio de
F3.8 menciona «no deja el `EventSource` abierto»; lo que hay que no dejar
abierto es el cuerpo de la respuesta.)

**El parseo trocea por `\n\n`, no por chunk.** Un chunk de la red no es un
evento: puede partir un JSON al medio, traer tres juntos, o terminar sin cerrar
el último. Un parser escrito «un chunk, un evento» funciona en desarrollo —donde
el servidor local manda cada evento entero— y falla detrás de un proxy. Las
pruebas arman las tramas partidas en lugares incómodos a propósito, y las dos
mutaciones lo confirman.

### F3.5 ✅ UI de mensajes con estado de streaming
**Criterio de aceptación.**
- Recibe una lista de turnos y un estado. **No sabe qué es SSE**, no abre nada y
  no acumula: se puede montar con turnos fijos, sin conexión.
- El estado de streaming se anuncia por `aria-live`, y la región viva es la
  RESPUESTA y no el turno entero: envolviendo todo, un lector de pantalla
  relee la pregunta con cada fragmento.
- **Ningún spinner** · la casa usa esqueleto o nada.
- §7.1: toda respuesta muestra su SQL en un desplegable, cerrado por defecto, y
  con el límite declarado al lado.
- Un corte dice si lo recibido sigue valiendo. **El criterio decía «leyendo
  `parcial` del backend» y desde el 2026-09-21 eso es falso**: el frame `error`
  del cable manda `{code, message}` y no declara nada. Lo deriva `api/chat.ts`
  de si ya se entregó contenido, apoyado en que el servicio persiste la
  respuesta acumulada antes de cerrar. Pedido como campo en
  `docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md`.

**Cerrada el 2026-09-03.** El indicador de streaming resultó ser menos de lo que
parecía: **la prosa que aparece ES el indicador**, así que lo único que hace
falta cubrir es el hueco ANTES del primer fragmento, cuando el agente está
consultando Gold y no hay nada que mostrar.

### F3.6 ⬜ Reutilizar cuerpos de panel para respuestas estructuradas · 🔒 **bloqueada**
**Criterio de aceptación.** Si llega `{ forma, datos, procedencia }`, se renderiza
con el **mismo** cuerpo que un panel — un solo modelo de datos. Y con la misma
anatomía: una cifra en el chat también declara BASE y procedencia.

**Bloqueada por el contrato, descubierto el 2026-09-03.** `DatoDeRespuesta` trae
`valor`, `familia`, `presentacion`, `metricId` y `titulo`, más `Gobierno`
intersectado — o sea que la procedencia sí viaja pegada a la cifra, que es la
mitad difícil. Lo que **no declara es con qué tipo de panel se dibuja**.

Y no se puede derivar: `Bloque.formasAceptadas` es de muchos a muchos —varios
tipos aceptan `escalar`— así que el front tendría que ELEGIR uno. Eso es
inventar una decisión que el contrato no tomó, y el color de una cifra del chat
ya se inventó una vez: el front tenía `familia` cableada a `demanda` porque el
evento no la traía. Se arregló agregando el campo al contrato, que es lo que
corresponde acá también.

Cuidado con el nombre: `EventoDato.tipo` es `'dato'` —el discriminador de la
unión de eventos— y no un `TipoPanel`. Es fácil leerlo como si el campo ya
existiera.

Mientras tanto la UI **declara cuántas cifras trajo la respuesta** en vez de
pintar una con un cuerpo elegido a dedo. Es la pregunta 11 de B0.9.

**Sigue bloqueada, y desde el 2026-09-21 se sabe por qué con precisión.** El
backend ya manda el evento `data` con `{shape, data, provenance}`, que de lejos
parece lo que el criterio pide. Medido contra `82da946`, no alcanza:

`EventoDato` exige `familia` más los cinco campos de `Gobierno`. **Cuatro se
podrían cruzar del catálogo por `metric_key`** —`familia`, `capa`, `fuente` y
`catalogVersion`—, y **dos no**, y son los que sostienen la garantía:

- **`base`.** El catálogo trae la BASE de la MÉTRICA. La cifra que compuso el
  agente puede tener otro denominador: si filtró a una tienda, «48 tiendas sobre
  52» es falso. Copiarla es declarar un denominador que nadie calculó.
- **`frescura`.** La cifra del chat no se materializó — la calculó el agente al
  vuelo—, y el catálogo no tiene fecha que sirva.

Y cuando el agente compone una métrica que no está en el catálogo —caso que el
contrato contempla con `metricId: null`— no hay ni fila contra la cual cruzar.

Pedido concreto al backend en
[`MENSAJE-2026-09-21-dos-tareas-del-chat.md`](docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md).
Mientras tanto `src/api/chat.ts` **descarta** las tramas `data`, con una prueba
que lo atestigua: el chat contesta en prosa y con el SQL a la vista.

### F3.7 ✅ Historial de hilos
**Descripción.** Listado de conversaciones previas del usuario, desde
`GET /config/chat/hilos`.
**Criterio de aceptación.**
- Cada hilo muestra con qué panel y período se abrió.
- Retomar un hilo reenvía su contexto; no arranca uno nuevo en silencio.

**Parcial el 2026-09-04.** El riel está hecho: agrupado por tiempo, título
entero, badge de decisión, hilo activo marcado y selección que dispara con su
`id`. Retomar funciona —`useChat` ya manda `hiloId`, así que continúa la
conversación en vez de arrancar una nueva.

**La primera mitad del criterio se DESTRABÓ el 2026-09-17.** Estaba bloqueada
porque `HiloResumen` trae `id`, `titulo`, `creadoEn`, `actualizadoEn`,
`esDecision` y `decisionId` — **ni panel ni período**—, que era el mismo hueco
que T4 por el otro lado: si el contexto del panel no viajaba al abrir, tampoco
volvía al listar.

`82da946` lo cierra: `GET /config/chat/threads` devuelve `thread_name`,
`tab_name`, `metric_name`, `metric_key` y `period`. Lo que queda es trabajo de
este lado — transcribir esa ruta al cable y adaptarla, que hoy **no está
transcrita** a propósito: una ruta transcrita que nadie llama envejece sin que
nadie lo note.

**Cerrada el 2026-09-21.** `/config/chat/threads` transcrita al cable con
`x-origen: 82da946`, `adaptThread` en el adaptador, el riel montado dentro de la
hoja del panel y `useChat.resume`.

**Los DOS IDS eran el riesgo, no el listado.** El cable manda `id` —uuid, con el
que se piden los mensajes de un hilo— y `thread_id` —entero, con el que se
continúa la conversación—. Después del adaptador los dos son `string`, así que
**el compilador no los distingue**: pasar `resume` directo como `onSelect` del
riel compila y manda el uuid donde va el entero. Da 400, y el síntoma es
«retomar no hace nada». Hay una prueba que mira **qué número sale por la red**.

`HiloResumen` ganó cinco campos y el segundo id · **propuesta de spec ejecutada,
anotada en el yaml**: el criterio pedía mostrar el panel y el período y no había
dónde ponerlos. Era el mismo hueco que T4 por el otro lado.

**El filtro por panel lo aplica el SERVICIO**, y va en la clave de caché además
de en la petición: sin eso, abrir el chat de otro panel muestra la lista del
anterior hasta que conteste la red.

**Una fila sin contexto se dibuja igual.** Los hilos abiertos antes de que
existiera el contexto de panel no lo traen, y el servicio los declara
`omitempty`: la línea desaparece en vez de quedar con un separador colgando, que
es el defecto que la línea de BASE tuvo con `ventana`.

Verificada rompiendo el código: seis mutaciones, las seis muertas. **Una
sobrevivió primero** —la cadena vacía del cable— y mostró que la prueba de
superficie no la podía ver, porque el riel filtra las vacías igual: se probó
donde vive, en `adaptThread`.

**Se abrió en el navegador:** tres hilos agrupados en HOY, AGOSTO y JULIO, cada
uno con su métrica y **su** período, y el viejo sin línea de contexto.

**Lo que NO hace, y es del criterio:** retomar no trae los mensajes del hilo.
Eso es `GET /config/chat/threads/{id}/messages`, otra ruta, y el criterio pide
que retomar **reenvíe el contexto** — no que muestre la conversación. El riel
dice de qué se hablaba; la hoja arranca vacía y sigue el mismo hilo. Esa ruta no
se transcribe hasta que alguien la llame.

**El agrupado por tiempo es la excepción a que el front no calcule**, y el
contrato la concede explícitamente: «el agrupado por tiempo —HOY, ESTA SEMANA,
JULIO— lo hace el front: es presentación y depende del huso del usuario».

Dos decisiones que el criterio no anticipaba:

- **«Hoy» se mide contra medianoche LOCAL, no contra «hace 24 horas».** A las
  15:00, un hilo de las 02:00 de hoy es de hoy y uno de las 23:00 de ayer no lo
  es. Con una ventana de 24 horas los dos caerían mal.
- **El mes lleva el año cuando no es el corriente.** La retención es de 12 meses
  y el contrato nombra «reabrir la consulta del mismo mes del año previo»: sin
  el año, dos grupos se llamarían «julio» y no habría cómo distinguirlos.

El riel **no reordena**: el backend manda por `actualizadoEn` y esa decisión es
suya. Una lista que llegue desordenada deja dos bloques del mismo mes **a la
vista**, en vez de fundirlos y esconder que el backend mandó algo raro.

### F3.8 ✅ `useChat(contextoPanel)` — envío y stream fuera de la UI
**Descripción.** La lógica de envío, acumulación de fragmentos y cierre del
stream, separada del componente que la pinta.
**Criterio de aceptación.**
- El componente de mensajes recibe una lista y un estado; no conoce SSE.
- Desmontar la hoja aborta el stream y no deja el `EventSource` abierto.

**Cerrada el 2026-09-03**, sin el `contextoPanel` del nombre: ese parámetro era
F3.2 y esperaba a T4, así que el hook tomaba `tabId`.

**Desde el 2026-09-21 el nombre de la tarea es literal.** T4 se cerró y F3.2 se
construyó: `useChat` toma `PanelContext` —`panelId` + `periodo`— y `tabId`
desapareció del cuerpo, porque el cable no lo acepta. Lo que la tarea cerró
—dónde vive el envío y la acumulación— no cambió.

`apply` —toda la acumulación— quedó **pura y exportada**, y por eso sus nueve
pruebas no montan nada ni abren una conexión. Si probarla necesitara React, la
separación que pide el criterio no existiría de verdad.

Tres decisiones que la acumulación tuvo que tomar:

- **Las cifras van aparte de la prosa**, no intercaladas, porque cada una se
  pinta con el cuerpo de panel que le toca · F3.6. Y se guarda el evento
  entero, no solo `valor`: es lo que conserva la procedencia pegada a la cifra.
- **Las sugerencias reemplazan, no se acumulan.** El evento manda la lista
  completa; acumularlas dejaría en pantalla sugerencias de una vuelta anterior.
- **`fin` y `error` no tocan la respuesta**, solo el estado del turno. Mezclarlos
  haría que `apply` decidiera dos cosas distintas.

Y una del hook: **abortar no es un error del agente.** Si la señal está abortada
se sale en silencio — pintarle «algo salió mal» a quien acaba de cerrar la hoja
sería mentir.

Qué se conserva de lo recibido lo decide `parcial`, y **acá decía que venía del
backend, que era cierto del contrato y dejó de serlo del cable**: el frame
`error` de `82da946` manda `{code, message}`. Hoy lo deriva `api/chat.ts` y está
pedido como campo. Ver F3.5.

### ➕ F3.9 🕓 Drill-down C2
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando el backend llegue a ese tramo. El contrato ya la cubre, así que lo que falta es el servicio, no el diseño.
**Descripción.** v2 tiene 128 líneas construidas: desagregación por las
`dimensiones` que declara la métrica. `nuevo-desarrollo.md` lo baja a F5.4.
**Criterio de aceptación.** Las dimensiones salen del catálogo, no de una lista
escrita en el front.

### ➕ F3.10 🕓 Accionables y hallazgos C4
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando el backend llegue a ese tramo. El contrato ya la cubre, así que lo que falta es el servicio, no el diseño.
**Descripción.** El framework de `PS-17`: responder aceptado/rechazado sobre un
ítem, promover un hallazgo con autor y fecha, y medirlo después. El contrato ya
lo cubre: `/config/accionables`, `/config/accionables/{id}/respuesta`,
`/config/decisiones`.
**Criterio de aceptación.** El cuerpo declara qué se decidió y
sobre cuál **por callback**, y la superficie es dueña del viaje. `render/` sigue
sin importar de `api/`. El ítem se identifica por su `ref` opaco, no por índice:
el `tope` del panel recorta antes de pintar, así que la posición no identifica
nada.

### ➕ F3.11 🕓 Módulo MMM
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando el backend llegue a ese tramo. El contrato ya la cubre, así que lo que falta es el servicio, no el diseño.
**Descripción.** Monitor y controlador. `nuevo-desarrollo.md` lo cita solo como
anti-patrón —la rama `if (metricId === 'mmm_canales')` en la consola— y la
crítica es correcta, pero el reemplazo necesita destino: o es un `tipo` de panel
propio, o es configuración de layout.
**Criterio de aceptación.** Cero ramas por `metricId` en la superficie. Y **Synapse no ejecuta** (§1.3.16): promueve un accionable con su
autor y su fecha, no aplica un reparto.

### ➕ F3.12 ✅ El cliente SSE habla el cable, no nuestro vocabulario
**Descripción.** Traducir las tramas de `POST /config/chat` al `EventoDeChat`
del contrato, y mandar el cuerpo con los nombres que el servicio declara.

**No reabre F3.4.** Su criterio —«lee los seis eventos que declara el
contrato»— se cumplió y sigue cumpliéndose. Lo que cambió es el cable. Es la
hermana de F1.38 para el chat, y por eso es una tarea nueva y no una
corrección de aquélla.

**Criterio de aceptación.**
- El discriminador se lee de la línea `event:` de la trama, no de adentro del
  JSON. **Es el defecto concreto**: hasta el 2026-09-21 la línea se descartaba
  a propósito y `useChat` conmutaba sobre `undefined` — el chat no pintaba una
  sola palabra.
- El cuerpo viaja como `question` + `panel_context: {panel_id, period}`, que es
  lo que pide el binding. El anterior habría dado 400 aunque el parseo
  estuviera bien.
- **Las pruebas emiten tramas del CABLE**, no del vocabulario interno. Una
  prueba que emite el dialecto propio pasa en verde con el chat roto: es el
  mismo modo de falla que F1.38 encontró en `panels:batch`.
- Lo que el cable no permite traducir se descarta **con una prueba que lo
  atestigua**, no en silencio: `data` por F3.6 y `thinking` por no tener
  equivalente.

**Hecha el 2026-09-21.** `src/api/chat.ts` y `tests/api/chat.test.ts`, con
`/config/chat` transcrito en `contracts/synapse-console-wire.yaml`. Verificada
rompiendo el código: cuatro mutaciones, las cuatro muertas.

**Lo que NO demuestra, y está dicho a propósito:** no se abrió contra el
servicio. Para eso hacen falta F3.3 —que no hay por dónde entrar al chat— y las
migraciones de B3.11, pedidas en la tarea 1 de
[`MENSAJE-2026-09-21-dos-tareas-del-chat.md`](docs/MENSAJE-2026-09-21-dos-tareas-del-chat.md).

### ➕ F3.13 ✅ La respuesta del agente es MARKDOWN y se pinta literal
**Descripción.** Renderizar el markdown que el agente devuelve, en vez de
volcarlo como texto plano.

**Encontrado el 2026-09-21 al ABRIR el chat**, no por una prueba. En pantalla se
lee `### Límite declarado` con los tres numerales incluidos. El `openapi.yaml`
de `82da946` lo declara: la respuesta es «markdown en español que abre con una
conclusión de 1-2 frases y, cuando aplica, las secciones `### Puntos de
lectura`, `### Fuentes consultadas` y `### Límite declarado`».

**No reabre F3.5**, cuyo criterio se cumplió: se escribió antes de saber que el
agente contesta markdown, y ninguna de sus aserciones es falsa hoy. Es la misma
distinción que F3.12 con F3.4 — lo que cambió es el cable.

**Criterio de aceptación.**
- Encabezados, listas y énfasis se pintan con los tokens de la escala
  tipográfica. **Ni `text-[13px]` ni `text-sm`**: las dos se saltan el sistema.
- **No se inyecta HTML del agente.** El texto lo compone un modelo que consulta
  datos del tenant; pintarlo con `dangerouslySetInnerHTML` convierte una
  respuesta en un vector.
- Las tres secciones que el backend declara se ven como secciones y no como una
  línea más de prosa. §7.1 pide el límite declarado **al lado** del SQL.
- `[SIN_COMPETENCIA]` en la primera línea no se muestra crudo: el backend lo usa
  para decir que no puede responder con las fuentes que tiene.

**Hecha el 2026-09-21.** `parseMarkdown.ts` —puro, probado sin React— y
`Markdown.tsx`, que decide con qué token se pinta cada bloque.

**Un parser propio y mínimo, y la razón no es el peso.** Un renderizador general
emite HTML: encabezados con tamaños que no son los nuestros, enlaces que el
agente podría inventar, imágenes. El parser devuelve una estructura cerrada
—sección, párrafo, lista— y **no existe ruta por la que llegue marcado del
agente a la pantalla**. Hay una prueba que le da `<img onerror>` y comprueba que
no haya ni un `<img>` en el DOM.

**Los `###` se pintan con el rótulo de la casa**, no con un encabezado grande:
la escala tipográfica tiene nueve tamaños y ninguno es «subtítulo dentro de una
respuesta de chat». Es el mismo rótulo que llevan «Preguntaste» y «Cómo se
calculó» en esa hoja.

**La mitad de las pruebas son de texto A MEDIO LLEGAR**, que es la mitad que
importa: la prosa entra por fragmentos, así que el parser corre sobre cada
estado intermedio. Un marcador sin cerrar se pinta literal en vez de tragarse el
resto — esperar el cierre haría que media frase desapareciera y volviera
mientras se escribe. Una prueba recorre **todos los prefijos** del mismo texto.

**Y esa prueba encontró un defecto antes de que lo hiciera una pantalla:** `###`
a secas, recién tecleado por el stream, caía a párrafo y los tres numerales se
veían — el defecto de esta misma tarea en chico.

Verificada rompiendo el código: cinco mutaciones, las cinco muertas. **Dos no
contaron la primera vez** y hubo que rehacerlas: una rompía el JSX —o sea que el
archivo no compilaba y la prueba no corría, que se lee igual que una prueba
débil— y la otra dejaba el índice retrocediendo, así que colgaba en vez de
fallar.

**Se abrió en el navegador**: `### Límite declarado` se lee «LÍMITE DECLARADO».

**Lo que NO hace, y es una decisión:** no extrae la sección «Límite declarado»
del markdown para moverla al lado del SQL, que es donde §7.1 la quiere. Hacerlo
sería reconocer un encabezado por su texto, y el día que el agente lo escriba
distinto la sección **desaparecería en silencio**. El lugar del contrato para eso
es `auditoria.limiteDeclarado`, que el cable todavía no manda y ya está pedido.

---

## Fase 4 — Admin y Builder

Es lo genuinamente nuevo: v2 **no tiene una sola línea** de estas dos
superficies. El documento las estima en 3–4 semanas de front y es la única
estimación que no bajaría.

### F4.1 ✅ `surfaces/admin/` — layout base y navegación
### F4.2 ✅ Lista de tenants
### F4.3 ⚠️ Gestión de usuarios y roles por tenant · 🔒 `/admin/users` y `/admin/roles` dan 404
### F4.4 ✅ Configuración de agente Snowflake por tenant
### F4.5 ✅ Vista del catálogo de métricas del tenant
**Criterio de aceptación (los cinco).**
- **No se muestra vocabulario de infraestructura** (§7.3 de `design.md`): ni
  base, ni rol técnico, ni grants, ni warehouse. Se declara la consecuencia
  —acceso vigente, última verificación— no la plomería. Única excepción: la lista
  de subprocesadores, que es obligación legal.
- La credencial de Snowflake **no se muestra ni se edita** desde acá: se
  referencia por identificador del gestor de secretos.
- Un usuario ve su propia fila marcada «sin acción sobre tu cuenta».

**F4.1 y F4.2 cerradas el 2026-09-15.** `AdminChrome`, `pantallas.ts`,
`TenantList` y el contenedor `Admin`. 449 pruebas.

**Las cinco pantallas de §7.3 están declaradas con su alcance**, y eso es lo que
esta superficie tiene de distinto: en la consola el alcance sale del token y vale
para toda la sesión; **acá cambia con la pantalla**. A1 y A3 cruzan clientes y no
llevan selector; A2, A4 y A5 operan dentro de un tenant y sí. A3 es la que parece
incoherente y §7.3 explica por qué no lo es: «cruza clientes porque su regla dura
—el tenant de un usuario no se edita— solo es visible cuando el tenant es una
columna que se compara».

**F4.4 se destrabó con alcance recortado el 2026-09-17**, por decisión humana
sobre el informe de `82da946`. Estaba esperando a B3.9, de la que solo existía
`POST /admin/agents`; ahora hay CRUD completo por tenant —listar, crear, leer,
actualizar y un `DELETE` que es baja lógica— más `semantic_views` y
`system_prompt_base`.

**Se construye con eso, mostrando activo/inactivo. Lo que NO se construye es el
estado del acceso** —si está vigente y cuándo se verificó—, que es justo lo que
§7.3 pide con «se declara la consecuencia, no la plomería». Eso se declara
**pendiente en la pantalla**, no se deduce: `is_active` es una baja lógica que
alguien apretó, no una verificación de que la credencial funcione, y leer uno
como el otro sería decir «acceso vigente» porque nadie apagó el interruptor.

**Hecha el 2026-09-21**, contra MSW. `/admin/tenants/{tenantId}/agents`
transcrita al cable con `x-origen: 82da946`, `adaptAgent` y `AgentConfig` dentro
de A2.

**Lo que la pantalla NO muestra es la decisión, no lo que muestra.** El cable
manda `snowflake_db`, `snowflake_schema`, `warehouse` y los nombres de las
vistas semánticas; §7.3 prohíbe los cuatro. **Se recortan en el ADAPTADOR**, no
en el componente: si llegaran al render, taparlos sería una decisión de cada
pantalla que los use y alcanza con que una se olvide. De las vistas sobrevive
**cuántas son**, que contesta «¿tiene datos asignados?» sin nombrar ninguna.

**El estado del acceso se declara pendiente, y ahí está el cuidado.** Dos campos
se parecen y no lo son: `is_active` es una baja lógica que alguien apretó y
`updated_at` dice cuándo se editó la fila. Leer cualquiera como «acceso vigente»
es afirmar algo que nadie verificó — la columna dice **«Sin verificar»**, y
debajo se declara qué falta y qué lo desbloquea. Es lo que §7.3 pide con «se
declara la consecuencia, no la plomería».

Verificada rompiendo el código: cuatro mutaciones, las cuatro muertas. **Una
sobrevivió primero** —esconder la declaración con `hidden`— porque la aserción
miraba `textContent`, que incluye lo oculto: la prueba leía un texto que nadie
ve. Ahora usa `toBeVisible`.

**Y al abrirla apareció una duplicación que ninguna prueba veía:** la lista de
«lo que §7.3 pide y no llega» de `RoleEditor` ya declaraba el estado del acceso,
así que la ficha lo decía **dos veces**, y la versión vieja era la más vaga. Sale
de esa lista —que pasó de tres a dos, con el conteo derivado de `.length`— y
queda solo en el bloque del agente. Hay una prueba que cuenta las apariciones.

**Lo que NO se construyó, y es alcance:** no se edita ni se da de baja un agente
desde acá. El criterio de las cinco pantallas no lo pide, y un `DELETE` que es
baja lógica merece su propia decisión de producto.

**Contra el servicio no se puede verificar todavía**: las tres columnas que ese
CRUD escribe no existen en la base compartida, medido el 2026-09-21, así que da
**500 y no 404**. Espera **B3.11**. La pantalla lo contempla: si la petición
falla, el bloque del agente se pinta igual con la razón, porque un bloque que
desaparece haría parecer que el cliente no tiene agente.

**El ancho mínimo es 1280 y no hay colapso**, que es la corrección de §4 del
`.pen`: «las tablas no son grillas» y perdían contenido en silencio (PS-5). Hay
scroll, que es visible.

**Tres pantallas se declaran pendientes en vez de mostrarse vacías**, cada una
con qué la desbloquea. Una pantalla que dice qué le falta no es lo mismo que una
en blanco.

### F4.3 parcial el 2026-09-15 · la mitad de roles, no la de usuarios

`RoleEditor` y el cliente de las rutas del fork. **590 pruebas**, doce nuevas,
once mutaciones muertas.

**Queda en ⚠️ y no en ✅ porque su título nombra dos cosas.** El CRUD de roles
está —A2 lo sostiene entero—; **la lista de usuarios de A3 no**, y no por orden
del plan: **ninguna ruta lista usuarios.** Existe `POST /admin/users` y nada más,
así que §7.3 —«lista filtrable por tenant y rol, CRUD»— no tiene de dónde leer.

### Las dos aserciones que sostienen esta tarea son de VOCABULARIO

**`pestañas` vacío significa «ve TODAS», no «no ve ninguna».** Es la diferencia
entre un rol recién creado —que ve todo hasta que alguien lo acote— y un rol
tapiado. Pintar «0 pestañas» diría lo segundo, y quien administra actuaría sobre
eso.

**Ocultar una métrica NO es un permiso** · §1.4.20. El servidor vuelve a
verificar en `/config/catalog` y en el batch, así que un rol con
`hidden_metric_ids` **no es un rol que no pueda pedir esa métrica**. La pantalla
lo declara una vez y siempre — no por fila, que la volvería decoración—, porque
quien no lo sepa va a usar el campo como si fuera un permiso, y eso se descubre
en una auditoría y no antes.

**Ni los UUID de pestaña ni los de métrica se pintan**, que es la misma regla
dura de §7.3 aplicada a otro campo.

### Borrar, y por qué el conteo viaja en el listado

Un rol con usuarios no se puede borrar. **El botón no aparece**, y en su lugar se
dice qué lo impide y qué lo desbloquea — reasignar a los usuarios. Es la misma
regla que `puedeResponder` en `RecoBody`: «un botón que se aprieta y devuelve 403
es peor que un botón ausente». Para eso `user_count` viaja en el listado y no se
descubre con el 409.

### Dos pruebas que pasaban por el motivo equivocado

**El fixture de layouts tenía el publicado en la posición 0.** La mutación que
cambiaba «el publicado» por «el primero de la lista» sobrevivía, porque eran el
mismo. Con el borrador primero, se separan.

**Y el helper `base()` de MSW registraba los overrides AL FINAL.** `server.use`
antepone los handlers y, entre los de una misma llamada, gana el primero — así
que un override de una ruta que la base ya declaraba **nunca se aplicaba**. La
prueba de «no ofrece las pestañas de un borrador» estaba escrita y no corría.
Corregido en los tres archivos que usan ese helper, y los arneses de F4.13,
F4.14 y F4.15 se volvieron a correr para confirmar que no dependían del bug.

**Es la quinta vez en dos días que el arnés de mutación encuentra algo que las
pruebas no podían ver**, y las cinco tienen la misma raíz: el fixture no
distinguía los dos casos.

**Verificadas por mutación, once casos:** «vacío» pintado como «ninguna», los
UUID de pestaña, los ids de métrica, la advertencia de permiso borrada, borrar
ofrecido con usuarios, el formulario sin precargar, guardar sin nombre, las
pestañas de cualquier layout, el 404 como error genérico, el cuerpo sin métricas
ocultas, y el 204 tratado como JSON.

### El choque de F4.2, y cómo se resolvió

**§7.3 pide seis columnas para la banda de clientes y el cable trae dos.**
`GET /admin/tenants` devuelve `ports.TenantPublicOption` —`id` y `name`—, que se
llama «public option» porque nació para llenar un selector, no para sostener una
tabla de administración. Faltan estado, vertical, cantidad de usuarios, frescura
del feed más atrasado y última publicación.

**Las cinco no se inventan ni se omiten.** Omitirlas daría una tabla que parece
completa: quien la mire concluiría que no hay nada que saber del estado de un
cliente. **La pantalla las declara ausentes**, con la gramática de §8 —qué falta,
por qué, y que se desbloquea con B4.1—, que es la misma que el producto usa para
un feed vencido.

Por eso F4.2 queda cerrada **como lo que se puede construir hoy** y su carencia
está registrada como pedido, no como deuda oculta.

### Dos defectos propios que encontraron las herramientas

**`design-lint` rechazó `AdminChrome` en su primera corrida**: exportaba
`PANTALLAS` junto al componente y §4 regla 3 pide uno por archivo. Movido a
`pantallas.ts` — que además deja que una prueba verifique la tabla de alcances
sin montar nada, y silencia el aviso de fast-refresh de oxlint.

**Y `tests/tokens/escala.test.ts` encontró `tracking-label`, un token que no
existe.** Los que hay son `tracking-rotulo`, `tracking-titulo` y `tracking-kpi`.
Es exactamente el silencio que esa prueba persigue —«una utilidad que nombra un
token inexistente no es un error, es silencio: compila, pasa el lint y se pinta
sin tracking»— y **no lo vio el typecheck ni el lint**: lo vio el chequeo que
cruza cada utilidad contra las variables declaradas.

**Verificadas por mutación, tres casos:** A3 pasada a alcance tenant, el selector
apareciendo en una pantalla de plataforma (7 fallas), y las columnas faltantes
omitidas en silencio.

### F4.5 cerrada el 2026-09-15 · y lo que encontró

`CatalogView` y el contenedor `Catalogo` dentro de `Admin`. **462 pruebas**, trece
de ellas nuevas, seis mutaciones muertas.

**A4 es la única de las cuatro pantallas de tenant que tiene ruta**, y §7.3 le
pide ocho campos por métrica. `GET /admin/tenants/{tenantId}/catalog` sostiene
cuatro: forma, capa, fuente y dirección semántica.

**Los otros cuatro no se rellenan, y dos de ellos son la trampa de esta
pantalla.** `frescura` y «en cuántos paneles se usa» simplemente no están y se
declaran como tales. Pero `ventana` y `estado` **sí existen en el tipo `Metrica`,
compilan y tienen valor**: el adaptador de F1.33 escribe `ventana: ''` y `estado:
'DISPONIBLE'` fijo porque el contrato los exige como obligatorios y el cable no
los trae. Una columna «Estado» con doce `DISPONIBLE` idénticos se ve exactamente
igual que un catálogo verificado, y no lo es.

**Es el mismo modo de falla que el spread condicional y que `text-labell`**: algo
que compila, pasa el lint y miente. Por eso la lista de ausentes de esta pantalla
se escribió mirando `adaptCatalog`, no el tipo — el tipo dice que los ocho campos
están.

**El filtro por estado que §7.3 pide no se puede ofrecer**, y en su lugar hay uno
por capa **que declara que no es el que el diseño pide**. Sustituirlo en silencio
daría una pantalla que parece cumplir §7.3 y no cumple.

**El origen de cada columna se declara** —derivado o editorial—, que es lo que
§7.3 pide con PS-13: «sincronizar y editar no compiten, cada campo tiene un solo
dueño», y A4 muestra los derivados con su origen. Editar no se ofrece: **ninguna
de las seis rutas de `synapse-admin-wire.yaml` escribe sobre el catálogo**, así
que el aviso de «qué paneles afecta» que §7.3 pide antes de guardar no tiene
dónde dispararse. Tampoco la acción de sincronizar: hoy es `make sync-catalog`,
un CLI, no una ruta.

**Las métricas rechazadas por el adaptador se nombran con su razón.** Acá pesa
más que en la consola: una forma fuera del enumerado no solo no se dibuja,
tampoco se puede asignar a un panel, y quien compone tiene que saber por qué no
está en la lista.

**Lo que NO se hizo, con la razón escrita.** Contar los paneles que usan cada
métrica sobre el layout **publicado** es un `GET` más y da un número — y sería el
número equivocado: una métrica usada solo en un borrador saldría en cero, y quien
la mire va a leer «no se usa» y va a considerar retirarla. Contarlo bien exige
recorrer todos los layouts del tenant, uno por borrador, y esa es una decisión de
costo que no corresponde tomar en una vista.

**Y esta tarea cambió una decisión de B1.17.** Ese pedido decía que `state` y
`state_reason` «no los pedimos: hoy no los lee nadie en el front». Dejó de ser
cierto el día que A4 existe — §7.3 le pide filtro por estado. Queda pedido.

**Verificadas por mutación, seis casos:** una columna de `estado` agregada a la
tabla, el filtro devolviendo todo, el encabezado sin su origen, uno de los cuatro
ausentes borrado de la lista, las rechazadas ocultas, y el hueco de dirección
semántica en blanco en vez de «—». Las seis mueren.

### F4.6 ✅ `surfaces/builder/` — composición visual
### F4.7 ✅ Selector de tenant y plantilla base
### F4.8 ✅ Editor de pestañas: nombre, pregunta operativa, orden, sugerencias
### F4.9 ✅ Canvas de 12 columnas — arrastrar y colocar
### F4.10 ✅ Configurador de panel: métrica, tipo, spans, opciones
### F4.11 ✅ Validación en tiempo real contra `/config/blocks`
### F4.12 ⚠️ Preview por rol · 🔒 la ruta es del fork y no está desplegada
### F4.13 ✅ Guardar borrador
### F4.14 ✅ Validar antes de publicar
### F4.15 ✅ Publicar sin deploy
### F4.16 ✅ Hooks dedicados: `useLayouts`, `useLayoutEditor`, `usePublishLayout`
**Criterio de aceptación destacado.**
- F4.8: **una pestaña que no contesta una pregunta no se compone.** La pregunta
  operativa es obligatoria, no un subtítulo opcional.
- F4.11: usa `catalog/blocks.ts`, que ya está escrito. Un tipo incompatible con
  la forma de la métrica se marca **con la razón**, no con «inválido».
- F4.11: la validación del front es feedback inmediato; **el servidor decide**
  (B4.6). Nunca se publica algo que el front dio por bueno y el servidor no vio.

### F4.6 cerrada el 2026-09-15 · el ancho, que no es uniforme

`pantallas.ts`, `BuilderChrome` y el contenedor `Builder` reemplazan el stub de
una línea que `routes.tsx` ya importaba. **472 pruebas**, diez nuevas, seis
mutaciones muertas.

**En administración lo que cambia con la pantalla es el alcance; acá cambia el
ancho mínimo**, y §4 da dos números con dos razones que conviene no fundir:

- **1600 en B1–B4 y B6** = 1200 de lienzo 1:1 más 300 de biblioteca. Si el lienzo
  se escala, un panel de `colSpan` 4 deja de medir cuatro columnas en pantalla y
  **el arrastre pierde su unidad**.
- **1440 en B5**, que es la excepción que §4 escribe: la vista previa no es una
  maqueta del builder, es la consola del cliente a su ancho real. A 1600 se
  mostraría a un ancho que ningún usuario tiene.

Ninguno colapsa: §4 gobierna el grid de paneles y «las otras dos superficies no
son grids y declaran ancho mínimo en vez de colapso».

### Un modo de falla nuevo, que encontró la mutación

**Una utilidad de Tailwind armada por interpolación compila, deja el atributo
`class` correcto en el DOM y nunca llega al CSS.** Es el hermano de
`text-labell`: aquel nombra un token que no existe, éste arma un nombre que el
escáner no puede leer.

Lo encontró una mutación que cambiaba la tabla de anchos de `BuilderChrome` por
`min-w-[${ancho}px]`: **sobrevivía a las diez pruebas de la superficie**, porque en
jsdom las dos formas producen exactamente el mismo atributo. Lo que cambia es el
build, no el DOM — y ninguna prueba de render puede verlo.

Quedó cubierto en `tests/tokens/escala.test.ts`, que es donde vive el otro medio
silencio: cruza toda plantilla que va a `className` y falla si un `${…}` queda
pegado dentro de una utilidad. Un `${…}` entre espacios sí vale — ahí la
interpolación aporta la utilidad entera y las dos ramas están escritas.

**Y el propio chequeo encontró algo**: `text-labell` escrito en un comentario de
`BuilderChrome` lo disparó. El escáner no distingue comentario de código, así que
esa prueba no puede citar literalmente el token roto. Reescrito el comentario.

### Las cinco pantallas pendientes, y qué frena a cada una

Lo que las frena **no es lo mismo**, y esa distinción es la que importa:

| | Qué falta | De qué orden |
|---|---|---|
| B2 · Canvas | La interacción de arrastre no está en `design.md` | **Diseño**, no cable |
| B3 · Selector de gráfico | `/config/plots` · B1.21 · es F4.21 | Cable |
| B4 · Binder de métrica | Nada: es F4.10 y se puede tomar | Orden del plan |
| B5 · Vista previa por rol | Roles por tenant · B4.9, que escribimos nosotros | Cable |
| B6 · Historial | Ni **quién** publicó ni **qué cambió** · pedido en B4.2 | Cable |

**B2 es la que hay que mirar dos veces.** §7.2 describe el RESULTADO del arrastre
—slot vacío con su label, badge `HEREDADO`, colisión marcada, nada se suelta
encima— y no la INTERACCIÓN: qué agarra el cursor, cómo se redimensiona por
handles, qué pasa al soltar fuera de la grilla. F4.9 no se toma sin esa decisión,
y decirlo en la pantalla es lo que impide que alguien la invente creyendo que
solo falta cable.

**Verificadas por mutación, seis casos:** B5 perdiendo su excepción de ancho, el
ancho interpolado, el chrome sin decir el ancho, B2 diciendo que espera código en
vez de diseño, B6 sin nombrar lo que falta, y una pantalla pendiente mostrándose
vacía.

### F4.7 cerrada el 2026-09-15 · dos de las cuatro cosas que B1 pide

`ContextView` más el estado del contenedor. **484 pruebas**, doce nuevas, ocho
mutaciones muertas.

§7.2 le pide a B1 cuatro cosas: «elegir **tenant y rol**; muestra qué pestañas
existen, cuáles **heredan de la plantilla de vertical** y cuáles tienen
**override**». El cable sostiene el tenant y las pestañas.

**El selector de rol es el que había que mirar dos veces, porque sí se podría
armar.** `LayoutDetail` trae `RoleIDs` por pestaña, así que la unión de todas
llena un `select` sin pedir nada a nadie. Y sería la lista equivocada por dos
razones distintas:

1. **Son IDs, no nombres.** Ninguna ruta resuelve un `RoleIDs` a un nombre, así
   que el selector ofrecería UUID — que es exactamente la plomería en pantalla
   que §7.3 prohíbe del otro lado.
2. **Le faltaría justo el rol que importa.** La unión de los roles que las
   pestañas nombran deja afuera a **todo rol que todavía no tiene pestaña**, y
   ése es el rol para el que uno abre el builder. Un selector que esconde el caso
   de uso se ve igual que uno completo.

**Y la herencia de plantilla no existe en ningún lado.** Supone tres cosas que el
cable no tiene: que el tenant declare una vertical —no está ni en `TenantOption`
ni en la ficha—, que exista una plantilla por vertical, y que una pestaña sepa si
es propia o heredada. Con dos de tres se pintaría mal.

**Tres cosas que la pantalla sí dice y que no son obvias.** Un borrador muestra
«sin publicar» y no una fecha de creación. Una pestaña con `roles` vacío muestra
«todos los roles», que no es lo mismo que «ninguno» — y es la mitad del dato. Y
una pestaña sin pregunta operativa se declara: el cable deja el campo en cadena
vacía y el producto dice que «una pestaña que no contesta una pregunta no se
compone», así que una celda en blanco se leería como un dato que falta y no como
una regla violada.

**El bug que la prueba encontró antes de que existiera.** `/admin/layouts/{id}`
no cuelga del tenant, así que un `layoutId` del cliente anterior **sigue
resolviendo**: sin limpiarlo al cambiar de cliente, la pantalla mostraría las
pestañas de un cliente bajo el nombre de otro. No lo ve el typecheck ni el lint.

### El arnés de mutación necesita una línea de base verde

**Encontrado el 2026-09-15, y es un modo de falla nuevo de los tres ya
anotados.** Las ocho mutaciones de F4.7 salieron «✓ muere» en su primera corrida
y **ninguna lo había demostrado**: el arnés corría todo
`tests/surfaces/builder/`, y ahí adentro `builder.test.tsx` ya estaba en rojo
—B1 había pasado a traer datos y su prueba montaba el componente sin proveedor—.
Con el árbol roto, cualquier mutación «mata» algo.

Es primo del que ya estaba escrito —«una mutación que pasa sin haberse aplicado
se lee igual que una prueba débil»— pero al revés: **una mutación que muere sobre
un árbol roto se lee igual que una prueba fuerte**. El arnés ahora corre la línea
de base primero y sale 2 si no está verde, que es la misma convención de
BLOQUEADO de la puerta: no hay contra qué comparar todavía.

**Verificadas por mutación, ocho casos, con la línea de base en verde:** cambiar
de cliente sin efecto, la versión no olvidada, las pestañas en el orden del
arreglo, un borrador con fecha, la pestaña sin pregunta en blanco, «vacío» pintado
como «ninguno», los UUID de rol en pantalla, y uno de los tres faltantes borrado.

### F4.8 cerrada el 2026-09-15 · el reemplazo completo, y lo que borraría

`borrador.ts` —funciones puras— y `TabEditor`, colgando de B1. **509 pruebas**,
veinticinco nuevas, doce mutaciones muertas.

**Vive en B1 y no en una pantalla propia.** §7.2 tiene seis y ninguna es «editor
de pestañas»; B1 ya «muestra qué pestañas existen», así que hacer esa lista
editable es el único lugar donde cabe sin inventar una séptima. La tabla de solo
lectura de F4.7 se fue: dos vistas del mismo dato es la otra forma de deriva, y
sus aserciones se mudaron a `editor.test.tsx` en vez de borrarse.

### La trampa: un PUT de reemplazo completo con un editor parcial

**`PUT /admin/layouts/{id}` manda el layout entero y lo que no venga se borra.**
§7.2 le pide a F4.8 cuatro campos —nombre, pregunta, orden, sugerencias—, así que
el editor natural produce un cuerpo de tres campos… y **renombrar una pestaña le
borraría sus paneles y su asignación de roles**. Con 200 y sin aviso.

Por eso el borrador tiene la forma de `TabParaGuardar` —que es exactamente el
cuerpo del PUT— y **arrastra lo que no edita**. No hay una segunda traducción
donde perder un campo, y la pantalla lo declara por pestaña: «1 panel(es) · todos
los roles · se conservan al guardar».

**La segunda mitad de la trampa es `id`.** Una pestaña sin `id` **genera una
nueva** en vez de editar la existente. Así que ausente no significa «no sé»:
significa «creá una», y solo `agregar` lo produce — y la pantalla lo dice,
«Nueva · se crea al guardar».

### La pregunta operativa la sostiene el front solo

`OperationalQuestion` no es requerido en el cable y el servicio acepta la cadena
vacía. §7.2 y el contrato dicen lo contrario con la misma frase: «una pestaña que
no contesta una pregunta no se compone». La diferencia entre lo que el servicio
acepta y lo que el producto permite se sostiene en `problemas()`: la pestaña se
marca, **se cuenta** y bloquea la composición. No en un borde rojo —§2 lo
prohíbe, y de todas formas un color no dice qué hacer—. Queda anotado en B4.4
como una pregunta para ellos, no como un pedido.

### Dos pruebas que no demostraban nada, y la mutación las encontró

**`mover` fuera de rango, con dos pestañas.** Sin la guarda, `splice(0, 1)` y
después `splice(-1, 0, …)` inserta antes del último — y **con dos elementos eso
devuelve el mismo arreglo**. La prueba pasaba con la guarda y sin ella. Hacen
falta tres para verlo: sin guarda, `[A,B,C]` mover A hacia arriba da `[B,A,C]`.

**El borrador atado a su versión, probado cambiando de CLIENTE.** Ahí la versión
se limpia a `null`, el detalle vuelve `undefined` y el editor desaparece entero,
así que la prueba pasaba con o sin la atadura. Lo que la destapa es cambiar entre
**dos versiones del mismo cliente**: el editor sigue en pantalla, y sin el
`layoutId` adentro del borrador la segunda versión mostraría las pestañas
editadas de la primera.

Las dos son la misma forma: **una prueba escrita sobre el caso más fácil de
montar, no sobre el caso que distingue**.

**Verificadas por mutación, doce casos:** roles no arrastrados, paneles no
arrastrados, `roles` compartido en vez de copiado, `sembrar` sin ordenar,
`agregar` naciendo con id, `quitar` dejando huecos, `mover` sin guarda, la
pregunta vacía dejando de ser problema, `sucio` contando pulsaciones, el campo de
nombre sin `onChange`, el editor sin contar las inválidas, y el borrador sin atar
a su versión.

### F4.10 cerrada el 2026-09-15 · el rechazo explicado

`PanelConfigurator` más las cinco operaciones de panel en `borrador.ts`. **543
pruebas**, treinta y cuatro nuevas, veinte mutaciones muertas.

**La frase de §7.2 que decide la pantalla no es la primera, es la última:** «las
incompatibles aparecen listadas y deshabilitadas con la razón. **El rechazo
explicado es lo que enseña el sistema**». Filtrar las incompatibles sería más
corto, más limpio y no enseñaría nada — quien compone aprendería que «esa métrica
no aparece» en vez de que un medidor no dibuja una serie temporal. Aparecen todas,
en el mismo orden, y las que no sirven dicen por qué con `invalidReason`, que ya
estaba escrito desde F1.3.

**Y la razón se pregunta con los spans del BLOQUE, no con los del panel.** Si el
panel tuviera un span fuera de rango —posible mientras el layout venga del
servidor— todas las métricas saldrían rechazadas por una razón que no es de la
métrica: «ocupa entre 3 y 4 columnas y se pidieron 8». La lista contestaría la
pregunta equivocada.

### Cuatro autoridades distintas en una sola pantalla

| | Quién manda |
|---|---|
| Qué formas acepta un tipo | `/config/blocks` |
| Qué rangos de span | La misma tabla |
| Qué params **existen** por tipo | La misma tabla · `paramsDisponibles` |
| Qué **valores** acepta cada param | `PARAM_SCHEMAS`, del front |

La última es la duplicación declarada de F1.29, y acá se vuelve visible: el
configurador muestra lo que el validador acepta llamando a `describirParam` —que
se exportó para esto—, no una descripción escrita a mano. Si el esquema suma un
valor, la pantalla lo dice sola. **Un param que el backend declara disponible y
el front no sabe describir no se ofrece**: se declara, porque un campo libre ahí
produce un param que `validateParams` descarta.

### Cambiar el tipo borra las opciones, y eso no se ve venir

Recortar los spans al rango nuevo es obvio. Lo otro no: **los params son por
tipo** —`maximo` es de `gauge`, `bins` de `distribution`—, así que conservarlos al
cambiar de tipo deja en el cuerpo del PUT un param que el tipo nuevo no lee.
`validateParams` lo descartaría **al leerlo de vuelta**, pero entre medio se
guarda y se publica basura. `cambiarTipo` los borra.

### Lo que no se hizo, con la razón

**`colStart` no se edita.** §7.2 lo pone en B2 —el canvas, F4.9— y un número
elegido en un formulario es una columna que nadie eligió mirando. Se muestra y se
declara de dónde va a salir.

**Las opciones se editan acá y no en F4.11**, aunque el primer cierre de esta
tarea las dejó solo listadas. Es lo que `npm run verify` no mira: «opciones» está
en el título de F4.10, así que empujarlas a la tarea siguiente era el criterio
cumplido a medias sin bajar el estado a ⚠️ — el modo de falla que la auditoría del
plan persigue. Corregido en la misma jornada, antes de tomar F4.11.

Un param de `enum`, `number` o `string` se edita. Los de `array` y `object`
**no**, y no es lo mismo que un param sin esquema: acá el esquema existe, pero son
estructuras —`columnas` es una lista de definiciones de columna, `banda` un objeto
con umbrales—. Un textarea de JSON compilaría y sería la peor salida: el error
aparecería al publicar.

**Y el vacío de un enum es «sin declarar», no un valor.** El default lo aplica el
cuerpo; escribirlo en el layout lo congelaría el día que el cuerpo cambie de
opinión.

**Y el param de desagregación que §7.2 pide no existe en ningún lado** —ni en
`paramsDisponibles`, ni en `PARAM_SCHEMAS`, ni en ningún cuerpo de `render/`—.
`dimensiones[]` llega por métrica pero su único consumidor previsto es el
drill-down de F5.4, diferido. **Es una decisión de diseño, no un campo que falte
en un extremo**: quedó como la pregunta 14 de `docs/B0.9-preguntas-abiertas.md`,
con las tres salidas posibles. No frena nada.

### Una mutación que no se podía matar desde el DOM, y qué se hizo

**El campo de un param numérico manda `Number(texto)` y no el texto**, porque
`opciones` viaja como JSON y `validateParams` pide `typeof === 'number'`: un
`"10"` compila, viaja igual y **recién degradaría el panel la próxima vez que
alguien lo abriera**.

La mutación que quitaba la coerción **sobrevivía**, y no porque la prueba fuera
floja: el valor mostrado es idéntico con `Number()` y sin él —`String(valor)` los
iguala—, así que **el DOM del campo no distingue**. No era una prueba débil ni un
cambio sin efecto: era un efecto real fuera del alcance de la superficie.

La salida no fue una aserción más astuta sino **terminar el diseño**: el
configurador corre `validateParams` sobre lo que el panel tendría si se guardara
así, y pinta la razón. Con eso el número se vuelve observable —un `"10"` aparece
como «espera un número entero»— y de paso la pantalla gana lo que §7.2 pide de
ella: el rechazo explicado, también para los valores.

**Verificadas por mutación, veinte casos:** las incompatibles filtradas, las
incompatibles habilitadas, la razón no pintada, el rango que no acota el campo, la
fórmula de altura cambiada, el panel sin métrica sin declararse, un param sin
esquema ofrecido como si se supiera, un valor inválido sin explicar, `cambiarTipo`
sin recortar, `cambiarTipo` conservando opciones, `cambiarTipo` perdiendo el id, el
panel nuevo naciendo con métrica, `editarPanel` pisando el id, la selección sin
resolver a `null` sobre un hueco, un param de estructura ofrecido como campo
libre, el enum sin «sin declarar», borrar la opción dejando un objeto vacío
colgado, `editarOpcion` pisando las otras, el número mandado como texto, y el
botón de panel sin decir que le falta métrica.

### F4.11 cerrada el 2026-09-15 · feedback inmediato que no decide

`validar.ts` y `ValidationSummary`. **560 pruebas**, diecisiete nuevas, doce
mutaciones muertas.

**No reimplementa reglas.** Corre `invalidReason` de `catalog/blocks.ts` y
`validateParams` de `api/params.ts` —las mismas que la consola usa para detectar
un layout mal formado— sobre el borrador entero. Es lo que hace que el builder y
el renderizador no puedan opinar distinto.

**Y lo que dice con la misma claridad es que no decide.** El criterio lo escribe
así: «la validación del front es feedback inmediato; **el servidor decide**
(B4.6). Nunca se publica algo que el front dio por bueno y el servidor no vio». Por
eso el aviso está **siempre**, no solo cuando hay problemas: **el caso peligroso
es el limpio**, porque es donde alguien podría leer «listo para publicar».

Cada problema dice qué pestaña, qué panel y la razón. Y se direcciona por
**índice, no por id**: una pestaña o un panel recién agregados no tienen id
todavía — lo asigna el servidor al guardar. Los problemas que devuelve `validate`
sí vienen por id, y juntarlos es trabajo de F4.14.

### Tres lugares que muestran lo mismo, una sola cuenta

La pantalla marca composición en tres sitios —junto a la pestaña, en el botón del
panel y en el resumen— y al principio cada uno lo calculaba por su cuenta:
`TabEditor` llamaba a `problemas()`, `PanelConfigurator` a `validateParams()` y el
resumen a `validarBorrador()`. **Tres cálculos que pueden discrepar es peor que
un mensaje repetido**, así que `validarBorrador` corre una vez en el contenedor y
los tres leen de ahí. Que la misma frase aparezca junto al campo y en el resumen
es deliberado: son dos preguntas distintas —«¿este valor sirve?» y «¿qué bloquea
publicar?»— y ahora no pueden contestarse distinto.

### Una regla que se escribió y se sacó

«Una pestaña sin paneles no contesta su pregunta con nada» era la regla obvia de
agregar, y **no está escrita en ningún lado** — §7.2 B2 hasta contempla el slot
vacío como estado legítimo del canvas. Inventarla haría que el front **bloqueara
una publicación que el servidor acepta**, que es la falla de F4.11 al revés: no
darse por bueno a uno mismo, pero tampoco ponerse más estricto que la autoridad.
Quedó el comentario donde estaba el código, y una prueba que afirma que no es un
problema.

### Y una mutación que pedía una prueba que no existía

`const invalidas = new Set(problemas.map((p) => p.tab)).size` cambiado por
`problemas.length` **sobrevivía**: todos los fixtures tenían un problema por
pestaña, así que las dos cuentas daban el mismo número. Hace falta una pestaña con
dos problemas para que se separen. Es la tercera vez en dos días que el arnés
encuentra lo mismo — **una prueba escrita sobre el caso más fácil de montar, no
sobre el que distingue**.

**Verificadas por mutación, doce casos:** el tipo sin validar contra la forma, el
panel sin métrica sin marcar, una métrica fuera del catálogo pasando, el id de la
métrica borrada pintado, los params sin validar, un param desconocido callado, los
problemas de la pestaña sin recoger, la regla inventada de vuelta, el resumen sin
decir que el servidor decide, el resumen sin decir en qué pestaña, el botón del
panel sin marcar, y el contador contando problemas en vez de pestañas.

### F4.13 cerrada el 2026-09-15 · el defecto que aparece la SEGUNDA vez

`SaveBar` y el cableado de `useSaveLayout`. **568 pruebas**, ocho nuevas, ocho
mutaciones muertas.

**El borrador local se descarta al guardar, y eso es la tarea.** El PUT devuelve
el layout con los `id` que el servidor acaba de asignar a las pestañas y paneles
nuevos. Si el borrador sobreviviera, esos **seguirían sin `id`** y el guardado
siguiente los crearía otra vez: duplicados. `useSaveLayout` ya deja el detalle
fresco en el cache, así que soltar el borrador hace que la pantalla lea de ahí.

**El síntoma solo aparece la segunda vez**, que es lo que lo hace peligroso: el
primer guardado se ve perfecto. La prueba guarda dos veces y mira los dos cuerpos
del PUT — `[tab-a, undefined]` y después `[tab-a, tab-nueva]`.

### Tres decisiones sobre qué se bloquea y qué se avisa

**Una versión publicada no se edita, y se dice antes de intentar.** El servicio
contesta 409; dejar apretar para que falle es enseñar que el botón a veces no
anda. Y la salida existe —duplicar la versión en un borrador nuevo, mandando su
`versionId` de origen—, así que se ofrece ahí mismo y la pantalla salta al
borrador creado.

**El 409 igual puede llegar**, porque alguien puede publicar entre que la
pantalla leyó la versión y el PUT sale. Se nombra con su causa y su salida, no
como «error al guardar» — que taparía la única acción que desatasca.

**Los problemas de composición NO bloquean guardar.** Un borrador es justamente
donde una composición a medias puede vivir; lo que no se puede es publicarla, y
eso lo deciden F4.14 y F4.15 contra el servidor. Se avisa cuántos quedan.

**Y el indicador de «sin guardar» se mudó del editor a la barra**, que es donde
está el botón: dos indicadores del mismo hecho envejecen igual que dos contadores.

### La cuarta vez que la mutación pide la prueba que distingue

`disabled={!sucio || guardando || publicada}` sin `publicada` **sobrevivía**:
todas las pruebas de versión publicada tenían el borrador limpio, así que
`!sucio` ya deshabilitaba el botón y las dos razones nunca se separaban. Hace
falta editar una versión publicada para verlo.

**Verificadas por mutación, ocho casos:** el borrador sobreviviendo al guardado,
guardar habilitado sin cambios, una versión publicada dejando apretar, la versión
publicada sin declararse, los problemas bloqueando, el 409 como error genérico,
duplicar sin mandar el `versionId` de origen, y duplicar sin saltar al borrador
nuevo.

### F4.14, F4.15 y F4.16 cerradas el 2026-09-15 · publicar es una secuencia

`PublishBar` y el cableado de `useValidateLayout` y `usePublishLayout`. **578
pruebas**, diez nuevas, diez mutaciones muertas.

**«Nunca se publica algo que el front dio por bueno y el servidor no vio.»** Eso
hace que publicar no sea un botón sino el final de tres pasos, y cada uno
invalida al siguiente:

1. **Guardar.** `POST /validate` valida lo que está **guardado**, no lo que se ve
   en pantalla. Con cambios sin guardar, un «válido» estaría contestando sobre
   otra composición — así que validar se deshabilita mientras el borrador esté
   sucio, y se dice por qué.
2. **Validar.** Y acá está la trampa del servicio: **responde 200 aunque la
   composición sea inválida.** El 200 dice que la validación corrió, no que el
   layout esté bien; lo que decide es `valido`. Leer el status sería dar por
   bueno cualquier cosa.
3. **Publicar**, solo si el servidor dijo `valido`. **Cualquier edición posterior
   retira el permiso**, y guardar también: el veredicto era sobre lo que había.

**El estado por defecto no es «listo».** Sin veredicto la pantalla dice «el
servidor todavía no vio esta composición», porque el silencio se lee como
aprobación. Es la misma razón por la que el resumen de F4.11 declara siempre que
el servidor decide.

**Los problemas del servidor vienen por id y acá ya no es un problema**: solo se
valida lo guardado, y lo guardado tiene id. Se resuelven contra el detalle para
nombrar la pestaña en vez de pintar su UUID.

**El 422 de publicar es información, no un fallo** · B4.15: el servidor rechaza
la publicación si hay paneles inválidos, y decirlo así es lo que distingue «hay
algo que arreglar» de «se rompió el sistema».

**Y publicar no despliega**, que la pantalla declara: es un cambio de dato sobre
qué layout sirve la consola, no un build. Por eso `usePublishLayout` invalida
también `me` y `tab` — las dos cachés de la consola—, que es el defecto silencioso
que F4.23 había anticipado y que `tests/api/admin.test.tsx` sostiene.

### F4.16 · los hooks estaban, y ahora tienen consumidor

`useLayouts`, `useLayoutDetail`, `useCreateDraft`, `useSaveLayout`,
`useValidateLayout` y `usePublishLayout` se escribieron en F4.23. **Lo que
cambió hoy es que los ocho tienen consumidor**, que es la diferencia entre un
hook y `BodyProps.presentation` — declarada meses, sin un solo llamador.

**Una desviación de nombre, dicha:** el plan pedía `useLayoutEditor` y lo que hay
son dos, `useLayoutDetail` para leer y `useSaveLayout` para escribir. Fundirlos en
uno habría mezclado una consulta con una mutación, que en TanStack son cosas
distintas con cachés distintos. La intención del nombre está cubierta; el nombre
no.

**Verificadas por mutación, diez casos:** publicar autorizando con que el servidor
haya contestado, editar sin retirar el permiso, validar con cambios sin guardar, el
motivo sin decirse, el silencio leído como aprobación, los problemas del servidor
sin listar, el UUID pintado en vez del nombre, guardar sin invalidar el veredicto,
el 422 como error genérico, y publicar sin mandar el `versionId`.
- F4.12: el preview llama al endpoint con rol simulado (B4.9). No se simula del
  lado del cliente filtrando lo que ya se tiene: eso probaría el filtro del
  front, que no existe.
- F4.15: publicar surte efecto sin deploy, y se ve en la consola en la siguiente
  carga.

### ➕ F4.21 ⬜ Selector de gráfico en el builder · 🔒 `/config/plots` da 404
**Descripción.** El configurador de panel ofrece los gráficos **compatibles con
la forma de la métrica elegida**, no los 49. Consume `/config/plots` vía
`catalog/plots.ts`.
**Criterio de aceptación.**
- La lista se filtra por `formas`; los incompatibles no se muestran, no se
  muestran deshabilitados sin explicación.
- Cada opción declara su mínimo y su tope, para que quien compone sepa antes de
  publicar que el gráfico va a quedar vacío en un tenant chico.
- Con `serieConBanda`, solo aparecen gráficos con `soportaBanda`.
- No elegir nada es válido: el panel usa el gráfico por defecto de su tipo.

### F4.12 parcial el 2026-09-15 · la composición, no las cifras

`RolePreview` y el cableado de `usePreview`. **604 pruebas**, doce nuevas, once
mutaciones muertas.

**Queda en ⚠️ por una razón que decidimos nosotros y está escrita.** §7.2 pide
«renderiza la composición exactamente como la verá el rol, **con datos reales**»,
y B4.9 decidió que el preview va **sin payloads**: con el layout alcanza para
«CEO vs Planner», con payloads habría que fijar qué período usa y si un panel
oculto llega como `SIN_PERMISO`, y materializar costaría lo mismo que la consola
real. La mitad que falta es deliberada, no un olvido — y la pantalla la declara.

**Los paneles NO se dibujan con `render/Panel`, y esa es la decisión del día.**
Hacerlo exigiría inventarle un payload: un `BLOQUEADO` que ningún servidor emitió,
o un `CARGANDO` que no está cargando. Compila, se ve bien y miente — que es
exactamente lo que este repositorio persigue. Se dibuja **la grilla con las
posiciones reales** —`gridStyle`, `panelStyle` y `readingOrder` de
`render/grid.ts`, así que la colocación es la misma que la consola aplica— y cada
hueco dice qué métrica va ahí y de qué tamaño. Hay una prueba que verifica que
ninguno de los cuatro nombres de estado aparezca en pantalla.

**El recorte lo hace el servidor y las pruebas lo respetan.** Los fixtures
devuelven lo que `/admin/layouts/:id/preview?roleId=` contestaría, ya filtrado, y
hay una prueba de que cambiar de rol **pide otro preview** en vez de filtrar acá.
«Filtrar en el front lo que ya se tiene probaría el filtro del front, que no
existe.» La clave de cache lleva los dos ids: un preview servido desde el cache de
otro rol es la mentira que B4.9 existe para no cometer.

### Un campo que nadie leía, encontrado por mutación

`sinPayloads` viajaba desde el cable, se adaptaba… **y no lo leía nadie**: el
aviso de «esta vista no trae cifras» estaba escrito fijo. Es el modo de falla de
`BodyProps.presentation` —declarada meses, sin un solo consumidor— y la mutación
que lo ponía en `false` sobrevivía.

Ahora el aviso cuelga del campo. **El día que el servicio empiece a mandar cifras,
el aviso se apaga solo**; escrito fijo habría seguido diciendo que no las hay, y
nadie lo habría notado hasta mirar.

### Y B4 · el binder dejó de declararse «pendiente»

Su razón decía «falta construir la pantalla · F4.10» y eso era falso desde que
F4.10 cerró: el binder existe y **vive dentro de B1**, porque configurar un panel
exige tenerlo elegido y elegirlo es de B1. Una pantalla suelta obligaría a
duplicar la selección de pestaña y de panel para llegar al mismo formulario.

**Es una desviación de §7.2, que lo describe como pantalla propia, y va dicha**:
la pantalla ahora dice «está construida, en otra pantalla» y dónde. Decirle
«Pendiente» a algo hecho miente sobre trabajo hecho, que es el mismo error que
marcar ✅ algo a medias, por el otro lado.

**Verificadas por mutación, once casos:** el cache compartido entre roles, el
aviso de «sin cifras» borrado, el aviso escrito fijo, el toggle que no dispara, la
posición sin pintar, el id de métrica en vez del nombre, el rol vacío sin
declarar, el 404 como error genérico, sin roles sin mandar a definirlos, el
adaptador perdiendo `sinPayloads`, y el adaptador leyendo el preview en
PascalCase.

### El chrome del builder, rehecho el 2026-09-15 contra el `.pen`

**Divergencia 1 de la auditoría.** `BuilderChrome`, `pantallas.ts`, `SaveBar` y
`PublishBar`. **609 pruebas**, cuatro nuevas, diez mutaciones muertas.

**El contexto va en la cabecera y es persistente.** El `.pen` dibuja
`TENANT · ROL · PESTAÑA` arriba en B2, B4 y B6, con «3 CAMBIOS SIN GUARDAR`,
`VISTA PREVIA` y `PUBLICAR`. F4.6–F4.15 los habían puesto en barras dentro del
cuerpo, y eso tiene dos consecuencias: **al salir de B1 se perdía de vista sobre
qué cliente y qué rol se estaba componiendo**, y el aviso de cambios sin guardar
desaparecía al cambiar de pantalla — que es justo cuando hace falta.

**El chrome tiene cuatro formas y cada pantalla declara la suya**, igual que el
ancho: `identidad` (B1, que elige el contexto y por eso no lo muestra resuelto),
`composicion` (contexto + guardar + vista previa + publicar), `contexto` (B6, que
mira y no toca) y `ninguno` — **B5, que pinta la consola del cliente**: «SIN
CHROME DE EDICIÓN · DATOS REALES · ASÍ SE PUBLICA».

**B1 usa `composicion` prestada, y está dicho en una línea.** En el `.pen` B1 solo
elige el contexto y la composición ocurre en B2; acá B1 hospeda además el editor
porque **B2 no existe todavía** — es F4.9. Sin el contador y el botón de guardar,
la pantalla donde se edita no tiene cómo guardar. **El día que F4.9 mueva la
composición a B2, vuelve a `identidad`** y el cambio es esa línea.

### El selector de rol, que F4.7 declaró imposible y ahora es posible

**F4.7 tenía razón entonces y dejó de tenerla.** El único origen de roles era
`RoleIDs` de `LayoutDetail`: UUID sin nombre, y su unión deja afuera a todo rol
que todavía no tiene pestaña — justo el rol para el que uno abre el builder.
**B4.8 lo desbloqueó**: `GET /admin/tenants/:id/roles` devuelve todos, con nombre.

El `.pen` confirma que va en B1: «EL TENANT DEFINE EL CATÁLOGO Y LA PLANTILLA · EL
ROL DEFINE QUÉ PESTAÑAS SE EDITAN». Y la prueba usa un fixture con un rol **sin
ninguna pestaña asignada**, que es el que la vieja aproximación no habría
encontrado nunca.

### Dos cosas que dijo el compilador y no una prueba

**El rótulo de «ancho 1440» era código muerto.** Al estrechar por la forma de
chrome, TypeScript marcó que `pantalla.ancho === 1440` no puede ser cierto dentro
de la cabecera: **la única pantalla de 1440 es B5, y B5 no lleva cabecera.** El
1440 sigue declarado y verificado en `pantallas.ts`; lo que no existe es un lugar
en la UI donde decirlo.

**Y la rama de `identidad` quedó marcada como muerta también**, porque hoy
ninguna pantalla la usa. Ahí la respuesta no era borrarla —vuelve con F4.9— sino
**preguntar por predicados tipados en vez de comparar en línea**: un parámetro no
se estrecha en el sitio de llamada, así que `sinChrome(forma)` y
`conContexto(forma)` dicen lo que el componente soporta y no lo que la tabla usa
hoy.

### Una desviación del `.pen` que va dicha

**El `.pen` no dibuja un botón de guardar.** Muestra «3 CAMBIOS SIN GUARDAR» y, al
lado, solo `VISTA PREVIA` y `PUBLICAR`. §7.2 sí exige el guardado explícito, así
que el botón hace falta y el único lugar coherente es junto al indicador que lo
motiva. Queda anotado en el componente: si diseño resolvió el guardado de otra
forma que no llegó al `.pen`, eso es lo que hay que cambiar.

**Verificadas por mutación, diez casos:** B5 recuperando chrome, el contexto sin
persistir, el contexto sin rótulos, el contador ausente, el contador contando
pulsaciones, guardar ofrecido sin cambios, guardar sobre una versión publicada,
publicar sin veredicto, el selector de rol desaparecido, y el vacío de roles sin
decir a dónde ir.

### F4.9 cerrada el 2026-09-15 · el canvas

`disposicion.ts`, `grupos.ts`, `Library`, `Canvas`, más `reubicarPanel` y
`redimensionarPanel` en el borrador. **656 pruebas**, cuarenta y siete nuevas,
veintiuna mutaciones muertas.

**La propuesta se aprobó y se revisó contra el `.pen`** —
`docs/PROPUESTA-CANVAS-2026-09-15.md`—, con una condición del humano: «debe ser
fácil y clara la interacción». Eso se tradujo en dos cosas concretas que el frame
`B2` ya dibujaba: la grilla visible con guías, y el aviso de colisión que
**nombra el panel** en vez de solo marcarlo.

### El hecho del modelo que condicionó todo

**`PanelConfigurado` no tiene `rowStart`.** Declara `colStart`, `colSpan` y
`rowSpan`; la fila la resuelve la colocación automática de CSS y el único control
sobre ella es **el orden de los paneles**. Dos consecuencias que el canvas no
puede esquivar:

1. **Mover hacia arriba o hacia abajo es reordenar**, no fijar una fila. Soltar en
   la fila 5 se traduce a una posición del arreglo · `ordenPara`.
2. **No se puede dejar un hueco a propósito.** Los huecos que se ven son los que
   la colocación dejó, y por eso se **derivan** en vez de guardarse.

Y para saber qué panel está bajo el cursor hay que saber en qué fila cayó cada
uno — eso lo decide el navegador, así que `disposicion.ts` **repite el algoritmo
de `grid-auto-flow: row`**: orden del documento, primera fila libre desde un
cursor que no retrocede. No es `dense`, y hay una prueba de que un hueco que quedó
atrás no se rellena.

### Las celdas son elementos, y eso borra toda la matemática de píxeles

El lienzo pinta **12 × N celdas reales** detrás de los paneles, y cada una es su
propio destino de soltado. «En qué celda cayó el cursor» lo contesta el navegador
y no una cuenta con `getBoundingClientRect` —que además habría que recalcular en
cada scroll—. **Y esas mismas celdas son las guías** que §7.2 pide. Una cosa para
las dos, y en jsdom se puede probar, que con píxeles no: ahí todo mide cero.

### Tres cosas que el arnés encontró y no eran pruebas débiles

**Una guarda que dependía de un estado que a veces miente.** La verificación del
borde usaba `arrastrando` —el estado que marca el ítem en vuelo— en vez del dato
que el navegador entrega al soltar. Una prueba que soltaba sin pasar por la
biblioteca pasaba igual. Ahora el estado solo alimenta la vista previa; las
decisiones salen del `dataTransfer`.

**Una verificación multifila que no se podía alcanzar.** La colocación revisaba
las `rowSpan` filas antes de aceptar una posición, y la mutación que la reducía a
una sola **sobrevivía**. No era una prueba floja: es que **alcanza con la primera
fila, y se puede demostrar** — un panel que bloqueara una fila posterior sin
bloquear la primera tendría que empezar más abajo que el cursor, y el cursor no
retrocede. Comprobado además por fuerza bruta sobre **531.441 combinaciones de
cuatro paneles: cero diferencias**. Se sacó el código en vez de inventarle un
caso: **código defensivo que no se puede ejercitar es código que nadie va a
mantener bien.**

**Y un fixture que no distinguía.** Las pruebas de reubicación movían paneles en
horizontal, donde el orden no cambia el resultado. La mutación que quitaba el
reordenamiento sobrevivía; hace falta un movimiento vertical para verla.

### El agrupado de la biblioteca vive en el front, y es una deuda declarada

§7.2 nombra los cinco grupos y no dice qué tipo va en cuál; el reparto sale del
`.pen`. **`/config/blocks` no manda el grupo**, así que la tabla está acá — la
misma clase de duplicación que `PARAM_SCHEMAS`, y merece la misma propuesta de
spec. Mientras tanto, **un tipo que el backend agregue no desaparece**: sale
aparte, con su rótulo, igual que `adaptCatalog` hace con una forma desconocida.

### Lo que no se implementó, con la razón

**El arrastre continuo del handle.** Los handles redimensionan de a una celda por
pulsación, y `shift` + flechas hace lo mismo. Un arrastre continuo que termina
redondeando a la celda **no agrega ninguna posición alcanzable**: agrega la
sensación del gesto. Es una mejora de interacción, no una capacidad que falte.

**Y el badge `HEREDADO` sigue fuera**, como F4.7 ya había declarado: el cable no
tiene herencia — ni vertical del tenant, ni plantillas, ni un campo que diga de
dónde viene un panel.

**Verificadas por mutación, veintiuna:** el alto sin marcar, el cursor
retrocediendo, el `colStart` sin recortar, `choqueCon` sin ignorar el movido,
pegado contado como encima, los huecos sin fundir, los huecos inventados abajo, la
colisión sin nombrar, el borde sin verificar, el span sin salir del bloque, el
teclado saltándose las reglas, `shift` sin redimensionar, `Escape` sin
deseleccionar, la vista previa apagada, la fórmula de altura cambiada, los handles
sin seleccionar, un tipo desconocido tragado, un grupo vacío desaparecido, el
rango del tipo ignorado, reubicar sin reordenar, y la biblioteca sin declarar el
rango.

### El estado de carga de administración · divergencia 3, cerrada el 2026-09-15

`SkeletonRows` y el cableado en A1, A2 y A4. **666 pruebas**, diez nuevas, doce
mutaciones muertas.

**Esqueleto y nunca spinner**, que es lo que la nota de `A1 · Clientes ·
cargando` escribe: «la tabla ya sabe cuántas columnas tiene y de qué ancho, así
que **puede prometer la forma que va a llegar**. Un spinner solo dice "esperá"».
Es la misma decisión que `render/states/LoadingState` toma para un panel, con una
vuelta de tuerca: una tabla promete más, porque su encabezado ya dice qué columnas
van a venir.

**Lo que cambió no es solo el widget: es qué se reemplaza.** Antes la pantalla
entera se sustituía por «Cargando el catálogo…», y eso **tira información que ya
estaba lista** — el encabezado, los filtros, los CTA y la declaración de los
cuatro campos que §7.3 pide y el cable no trae no dependen de los datos. Ahora se
pinta la pantalla y solo las filas son esqueleto.

**Y los conteos dicen CARGANDO, no una cifra.** «3 clientes» mientras carga
afirma algo que todavía no llegó — la misma regla que impide pintar un número
aproximado en un panel degradado.

**Una sola variante para las cuatro**, como pide la nota: el esqueleto no sabe de
qué tabla es, recibe cuántas columnas tiene. A2 no es una tabla y lleva tarjetas
con forma de ficha de rol — misma idea, otra forma.

### Dos afirmaciones que el código hacía y nadie comprobaba

**«Las barras no son todas del mismo ancho»**, que el componente justifica con
que «una grilla de barras idénticas se lee como un patrón y no como texto que va a
llegar». La mutación que las igualaba **sobrevivía**: el comentario decía algo que
ninguna prueba miraba. Ahora hay una que cuenta anchos distintos.

**Y el esqueleto de A4 no estaba verificado**: la prueba miraba `aria-busy` y no
las filas, así que la tabla podía quedar vacía y marcada como ocupada.

Es la misma forma que el arnés viene encontrando toda la jornada — **una
aserción que mira el borde del efecto y no el efecto**.

### Los tres tipos de vacío · divergencia 4, cerrada el 2026-09-15

`EmptyRow`, más la búsqueda de A4. **673 pruebas**, siete nuevas, once mutaciones
muertas.

**Son tres cosas distintas y la salida cambia con la causa**, que es lo que las
tres notas de vacío del `.pen` repiten: «un estado sin salida es una queja».

| | Qué pasó | La salida |
|---|---|---|
| `sistema` | Nadie dio de alta nada todavía | Crear el primero |
| `filtro` | Los datos están · el filtro los esconde | **Deshacer lo que uno hizo** |
| `alta` | El cliente es nuevo y el trabajo está por hacerse | El siguiente paso |

**Confundir el de filtro con el de sistema manda a crear lo que ya existe**, y
es el error concreto que esto evita. Por eso el conteo lleva el total —«0
métricas con este filtro · 28 en total»—: sin él, cero con filtro y cero sin nada
se leen igual.

**Y el encabezado se conserva en los tres.** «Las columnas siguen diciendo qué
habría acá», así que el vacío es una FILA con `colSpan` y no un reemplazo de la
pantalla. Antes A1 y A4 se salían de la tabla y perdían lo único que explicaba
qué falta.

### El vacío de filtro era INALCANZABLE, y lo encontró la prueba

`CatalogView` filtraba solo por capa, **y el selector de capas se arma con las
capas que hay**: elegir una siempre devuelve al menos una métrica. El estado que
se estaba implementando no podía ocurrir.

La salida no fue relajar la prueba sino **completar la pantalla**: el `.pen` pone
«BUSCAR» al lado de los dos selectores, y una búsqueda sí puede dejar la tabla en
cero. Con eso el estado existe de verdad y la prueba lo alcanza.

**Es la segunda vez en la jornada que aparece código para un estado imposible** —
la primera fue la verificación multifila de la colocación. Las dos veces el arnés
lo mostró como una mutación que sobrevivía, y las dos veces la pregunta correcta
fue «¿esto puede pasar?» y no «¿cómo lo pruebo?».

### Y una guarda redundante, demostrable

`filtroVacio` preguntaba además si había un filtro puesto. Sobra: sin filtro,
`visibles` es `metrics` entero, así que con métricas cargadas la única forma de
que `visibles` quede en cero es que algún filtro esté activo. Se sacó.

**Verificadas por mutación, once:** el vacío de filtro sin deshacer, el vacío sin
`colSpan`, el vacío sin salida, A1 saliéndose de la tabla, A4 confundiendo los dos
vacíos, el conteo sin el total, el vacío mostrándose con la tabla llena, limpiar
sin limpiar la búsqueda, la búsqueda sin filtrar, A2 sin distinguir el de alta, y
A2 sin decir la consecuencia.

### El agrupado del binder · divergencia 2, cerrada el 2026-09-15

`PanelConfigurator`. **677 pruebas**, seis nuevas, once mutaciones muertas.

**Dos cambios, y el segundo es el que importa con treinta y cuatro métricas.**

**Uno · la razón se escribe desde la MÉTRICA.** El `.pen`: «REQUIERE
serieTemporal · ESTA ES escalar». `invalidReason` la dice desde el bloque —«un
bloque kpi no sabe dibujar la forma escalar»— y **ahí está bien y no se tocó**:
lo consume también la consola, donde el sujeto es el panel que no pudo dibujar.
Acá el sujeto es la métrica que se está por elegir, y la frase tiene que
contestar «¿por qué no puedo usar ésta?».

**Dos · las incompatibles van agrupadas.** «30 · AGRUPADAS POR RAZÓN», y después
«+ 24 MÁS · escalar (13) · prosa (2) · categorica (2)…». Seis individuales con su
razón **enseñan la regla**; treinta la esconden. Con dos métricas el agrupado no
se ve, y por eso la prueba usa un catálogo de veinticuatro: es el tamaño donde la
diferencia existe.

La razón de agrupar por **forma** y no por el mensaje completo: todas las
escalares fallan por lo mismo contra un tipo dado, así que agrupar por el mensaje
daría los mismos grupos con un rótulo más largo.

### Y tres cosas del `.pen` que faltaban

**Qué acepta el tipo, declarado** —«TIPO series · ACEPTA serieTemporal ·
seriesMultiples»—, que es la regla que gobierna las dos listas. **Que §5 la
gobierna**, dicho: «el binder no ofrece lo que el tipo no puede renderizar». Y
**la procedencia de cada métrica compatible** —«seriesMultiples · GOLD · ERP +
GA4»—, que es lo que deja elegir entre dos que sirven las dos.

**Verificadas por mutación, once:** las incompatibles filtradas, la razón desde el
bloque, sin agrupar, el resumen sin conteos, el resumen con cero, sin declarar qué
acepta el tipo, sin decir que §5 gobierna, el conteo sin el total, la métrica sin
procedencia, la lista en blanco cuando ninguna sirve, y las incompatibles
elegibles.

### La columna `USO` de A4 · divergencia 6, cerrada el 2026-09-15

`uso.ts` y la celda en `CatalogView`. **690 pruebas**, trece nuevas, diez
mutaciones muertas.

**F4.5 la había declarado ausente con un argumento que sigue siendo válido**:
contarla sobre el layout publicado le da **cero** a una métrica que solo se usa
en un borrador, y quien lo lea va a concluir «no se usa» y considerar retirarla.

**Lo que cambió no es el argumento sino qué está en la mano.** Desde F4.3, la
ficha de cliente ya pide el layout publicado y los roles del tenant, así que el
conteo **no cuesta un viaje más**. Y el problema del cero se resuelve diciendo
sobre qué se contó: la columna se rotula «del layout publicado», y una métrica
que no aparece dice **«sin uso publicado · puede estar en un borrador»** en vez
de «0».

**Los borradores no se recorren**, y es una decisión de costo declarada: serían N
viajes, uno por versión, para un dato que no cambia lo que los usuarios ven hoy.

### Y el conteo sirve para lo que §7.3 realmente pide

El `.pen` no muestra solo un número: la celda dice «2 · PANELES» y al desplegar,
«PEGA EN · Inventory & Shopping» y **«EDITAR SU NOMBRE, FAMILIA O TIPO CAMBIA LO
QUE VEN 2 ROLES»**. Ese aviso es lo que §7.3 pide antes de guardar una edición —
«editar una métrica en uso advierte qué paneles afecta antes de guardar»— y es lo
que hace útil al conteo **mientras editar todavía no existe**.

**La regla que se aplica mal, y tiene prueba:** un rol con `pestanas` vacío **las
ve todas**. Leerlo como «no ve ninguna» haría que A4 dijera que editar una
métrica no afecta a nadie, que es lo contrario de lo que el aviso existe para
decir.

### Los faltantes de A4 bajan de cuatro a tres

Y los tres que quedan cambiaron de razón con lo que se aprendió hoy: **frescura y
estado ya no esperan un campo del catálogo sino la salud de feeds** · B2.13. La
ventana sigue igual · B1.17 y B1.25.

**Verificadas por mutación, diez:** el rol sin pestañas dejando de ver todas, las
pestañas repetidas, el rol repetido, un panel sin métrica contado, los paneles sin
sumar, el «0» a secas, el aviso de roles borrado, la columna sin declarar sobre
qué contó, las pestañas sin nombrar, y el uso calculado sobre otro layout.

### El humo llega a `/admin/*`, y un modo para mirar · 2026-09-15

**Tres usuarios probados contra el servicio real, ninguno es `admin`.**
`gerardo.riarte@buentipo.com` y `rolando.aleman@underarmour.com` entran y son
`Planner`; `jose.rodriguez@lobueno.co` da **401**, y se descartó que fuera el
arnés —la contraseña llega intacta y el mismo script con otro usuario devuelve
200—, así que o la clave no es ésa o ese usuario no está en la base que corre.

**Lo que hace falta, con precisión:** el middleware compara el claim `role`
contra `"admin"`, y ese claim sale de **`user.Role.Name`** — el nombre del rol en
la tabla `roles`, en minúsculas y sin espacios. No es un permiso aparte ni un
flag: hace falta un usuario cuyo rol **se llame** `admin`.

**`npm run humo` ya cubre `/admin/*`** y **sale 2 · BLOQUEADO** cuando el usuario
no es admin, con la consola verificada igual y dicho aparte — «un chequeo que
pasa por falta de fuente miente sobre su cobertura». El día que exista el usuario
es correr el comando.

**Dos rutas se saltean a propósito.** `publish` demota el layout publicado del
tenant y cambia lo que la consola sirve: un chequeo de humo no toca producción. Y
las del fork dan 404 por diseño, así que contarlas como diferencia sería llorar
por algo que ya sabemos.

### `npm run dev:mock` · la Fase 4, navegable

Un servicio falso completo —consola, admin, builder y las cinco rutas del fork—
con estado en memoria: se compone, se guarda, se valida y se publica. Uno de cada
cuatro paneles llega degradado y otro bloqueado, porque con todo en `DISPONIBLE`
los siete estados de §8 no se ven nunca.

**Vive en `dev/`, con entrada propia**, y eso no es comodidad: F0.8 está
«cumplida por construcción» y la construcción es que **no exista ruta de import
desde `src/` hasta un mock**. Un import condicionado por `import.meta.env.DEV`
compila, anda, y deja el bundle a merced del tree-shaking.

**Y ahora hay una máquina que lo sostiene.** `mocks-fuera` recorre `src/**` y
falla si algún import —relativo o por alias, **incluido `import type`**— cae en
`tests/` o en `dev/`. Verificado rompiéndolo: con la ruta puesta sale 1 y la
nombra. La puerta suma un chequeo más · el conteo sale de `npm run verify`.

**Una garantía que depende de que nadie escriba una línea es una convención, no
una garantía** — y este repositorio ya había pagado por esa diferencia con
`plan:ancestro` y con `docs-registro`.

### Segunda tanda en el fork · 2026-09-15 · B1.25, B1.27, B4.1, B4.2 y B4.4

**Decidido por el humano tras ver el alcance:** el front escribe también estas
cinco, en el mismo fork. Commit `6f10b8e`, once pruebas nuevas, nueve mutaciones
muertas, y las suyas verdes sin tocar una sola línea que no fuera una firma que
cambió.

**El commit cambió de hash el 2026-09-16 · era `b13fccd`.** Se reescribió para
sacarle 44 líneas de reindentación: `gofmt` alinea bloques de campos
**contiguos**, así que un comentario metido en medio de un struct parte el bloque
y realinea líneas que nadie tocó. Los campos nuevos ahora van al final del
struct, con su comentario, formando su propio grupo. **De 63 borrados a 19**, y
los 19 que quedan son cambios de firma que se propagan a los mocks de ellos.

**Y se aprendió algo que vale para la próxima:** su repositorio **no está
`gofmt`-limpio** —hay varios archivos que `go fmt ./...` cambiaría hoy—, así que
correr el formateador sobre archivos suyos mete ruido ajeno al cambio. Es la
segunda vez que pasa: la primera se revirtieron tres archivos enteros. **La regla
es no formatear archivos de ellos**, aunque el editor lo ofrezca.

**Las cinco quedan en ⚠️, no en ✅**, por la misma regla que B4.8 y B4.9: una
`B*` pasa a ✅ **verificada contra el servicio corriendo**, y el fork no está
desplegado.

**Cinco columnas nuevas, y las migraciones NO las corrimos.** Son campos en los
structs, así que las aplica `AutoMigrate` — y la base es **la RDS compartida de
producción**. Escribir el campo es código; correrlo es un cambio de esquema en
producción, y esa decisión no es nuestra. Las cinco son aditivas y con default,
así que el servicio viejo sigue funcionando contra el esquema nuevo.

### Tres cosas que salieron de leer su código, no de escribirlo

**Una de seguridad.** B4.1 pedía cinco campos en `/admin/tenants`, y esa lista la
sirve `ListPublicOptions` — **que también alimenta el flujo PÚBLICO de solicitud
de acceso**. Sumarle `user_count` ahí filtraría cuántos usuarios tiene cada
cliente a quien todavía no es usuario de ninguno. Va en un DTO aparte. Es la
tercera vez que la misma forma aparece —`RoleRepository`, `TenantPublicOption`—:
**una estructura compartida se ensancha para todos sus consumidores, y no todos
tienen el mismo permiso.**

**Una que retira un pedido nuestro.** B1.13 pedía `presentation` para las siete
formas que no son escalares, «porque choca con ningún número desnudo».
**Estaba mal**: `presentation` la lee **un solo cuerpo, `KpiBody`**, y los demás
sacan sus rótulos del propio valor —`BarsBody` usa `i.etiqueta` de cada ítem—.
`PresentationFromRows` devolviendo `nil` para las otras siete **es correcto**.
Pedirlas habría sido pedir un campo que nadie lee.

**Y una de alcance.** De los cinco campos de B4.1, solo dos se pueden calcular:
`status` y `vertical` no existen como columna y la frescura del feed más atrasado
necesita B2.13. Se entregan los dos y se dice cuáles faltan.

### Lo que NO tomamos, y por qué

| | Por qué |
|---|---|
| B2.13 · salud de feeds | Crear la entidad exige acordar el modelo con el equipo de datos y una ingesta que no existe |
| B3.9 · estado del acceso | Exige saber cómo se verifica ese acceso hoy |
| B1.21 · mínimos por gráfico | Es una decisión de producto |
| Correr `sync-catalog` y `materialize` | Es operar su servicio contra Snowflake productivo |

**Y la regla que nos pusimos: paramos acá hasta que tomen lo que hay.** «Un fork
que nunca vuelve es un segundo backend»; con dos endpoints era una excepción, con
siete es una implementación paralela que alguien va a tener que reconciliar.

### Por qué F4.9 no se toma · y una trampa del propio parser

**La interacción del arrastre no está declarada, y el bloqueo NO es del
backend.** §7.2 describe el RESULTADO —slot vacío con su label, badge
`HEREDADO`, colisión marcada, nada se suelta encima— y no qué hace el cursor: qué
agarra, cómo se redimensiona, qué pasa al soltar fuera de la grilla, si hay
teclado.

**Hay propuesta escrita:** `docs/PROPUESTA-CANVAS-2026-09-15.md`, con cinco
puntos, la razón de cada uno y la alternativa descartada. Espera revisión de
diseño.

**Y la mitad de `HEREDADO` queda fuera igual**, aunque el arrastre se decida: el
cable no tiene herencia —ni vertical del tenant, ni plantillas, ni un campo que
diga de dónde viene un panel—, que es la misma carencia que F4.7 declaró en B1.

### Dos formas de escribir esto mal, y las dos se cometieron primero

**Una.** El bloqueo se marcó con `**Espera del backend.**`, que era la única
forma que el plan tenía de decir «esta tarea no se puede tomar y la razón no es
nuestra». Eso metió F4.9 en `docs/PARA-BACKEND.md` — **el documento que se le
manda al equipo de backend**. Una pregunta de diseño no es de ellos. El `🔒` del
título alcanza: `plan-a-csv.py` lo lee y marca la tarea bloqueada sin generar un
pedido.

**Dos, y es del parser.** Puesta la explicación como `**Descripción.**` debajo del
encabezado de F4.9, **se la quedaron también F4.6, F4.7 y F4.8**. No es un bug:
es la regla de agrupado —«varias tareas pueden compartir un bloque de descripción;
acá se les reparte a todas»— y F4.6 a F4.9 son cuatro encabezados seguidos sin
cuerpo. Darle cuerpo al último se lo da a los cuatro, y tres de ellos estaban
cerradas.

**La regla que queda escrita: en una corrida de encabezados, el cuerpo es de
todos.** Para decir algo de una sola tarea del grupo hay dos caminos —darle
cuerpo propio a cada una, o escribirlo en una sección de evidencia como ésta, que
el parser no reparte—. Se eligió el segundo, que es el que ya usan las once
tareas cerradas de esta fase.

### F4.17 ⬜ `ComparisonBody` + `ComparePlot` · 🔒 `Valor` no declara `categoricaComparada`
### F4.18 ⬜ `MatrixBody` + `HeatmapPlot` · 🔒 `Valor` no declara `matriz`
### F4.19 ⬜ `GraphBody` + `GraphPlot` · 🔒 `Valor` no declara `grafo` ni `flujo`
### F4.20 ⬜ Registrar los tres con carga diferida · 🔒 espera a F4.17–F4.19
**Criterio de aceptación.**
- Se construyen **cuando el backend envíe esas formas** (B5.3), no antes. Hoy
  ninguna métrica las usa; existen para que el builder pueda ofrecerlas.
- Al estar los quince, el registro pasa de `Partial<Record<PanelType, …>>` a
  `Record` completo, y **agregar un tipo al enumerado sin su cuerpo deja de
  compilar**.

#### La lista de «se puede tomar hoy» decía el doble de lo que era · 2026-09-15

**Ocho de las dieciséis que `docs/ESTADO.md` ofrecía estaban bloqueadas**, y el
documento no podía saberlo: `estado.py` lee `🔒` en el título o
`**Espera del backend.**` en el cuerpo, **y de nada más** —está escrito en su
propia cabecera—. La razón de cada una vivía en prosa, y la prosa no llega a la
herramienta.

Es el mismo modo de falla que ya está registrado con «once chequeos» cuando ya
eran quince: un dato escrito a mano que se vence sin que nadie lo note. Acá era
peor que un número desactualizado, porque **la lista es lo que alguien lee para
decidir qué hacer después**, y ofrecía trabajo imposible.

Las ocho, cada una verificada hoy y no deducida:

| Tarea | Qué la frena | Cómo se comprobó |
|---|---|---|
| F1.13b | `Contexto` no trae locale, moneda ni zona | `/config/me` devuelve `tenant: {id, name}` y nada más |
| F1.31 | `/config/plots` | **404** contra el servicio corriendo |
| F4.17–F4.19 | `Valor` no declara sus formas | El yaml, con su decisión del 2026-08-19 |
| F4.20 | Espera a las tres de arriba | — |
| F4.21 | `/config/plots` | **404**, la misma corrida |
| F5.3 | Los plots de F4.17–F4.19 | — |

Y al verificar las ocho que quedaban, **las ocho también estaban bloqueadas**.
La lista quedó en **cero**, que es el número real.

| Tarea | Qué la frena | Cómo se comprobó |
|---|---|---|
| F1.42 | El período llega como cadena suelta | `/config/me` manda `['2026-09', '2026-08', …]`: sin `estado` ni cobertura. Y el criterio **prohíbe** derivarlo de `new Date()` en el front |
| F2.3 | `/config/solicitudes` | **404** |
| F3.3 | La mitad que queda espera a T4 | La otra mitad ya está bien: «hoy no se pinta ninguno de los dos y eso es correcto», dice su propio criterio |
| F3.7 | `HiloResumen` no trae panel ni período | El yaml. Es el mismo hueco que T4, por el otro lado |
| F4.3 | Ninguna ruta lista usuarios | `/admin/users` **404**, `/admin/roles` **404** |
| F4.12 | La ruta es del fork, sin desplegar | `/admin/roles` **404** |
| F5.1 | `Contexto` no declara `layouts` | El yaml, y `/config/layouts` **404** |
| F5.10 | La casilla 13 espera a T4 | `POST /config/chat` no tiene campo para el panel · **vencido: T4 cerró el 2026-09-17 y la casilla el 21** |

**No se marcó ninguna sin medirla.** Las que dicen 404 se probaron contra el
servicio corriendo el 2026-09-15 con un token válido; las que dicen «el yaml» se
leyeron del contrato.

#### Y eso deja el front sin trabajo tomable · 2026-09-15

> **Corte con fecha · vencido.** Se conserva porque explica cómo se midió, no
> porque siga siendo cierto: el 2026-09-17 el backend cerró T4 y el 2026-09-21 se
> ejecutaron las decisiones. **El número de hoy sale de `docs/ESTADO.md`**, que
> se genera. Las tres palancas de abajo se movieron: T4 está cerrada, el fork
> sigue sin desplegar y `/config/plots` sigue sin existir.

**Cero no es un error del conteo: es el estado.** Lo que queda del front son
veintiocho tareas y **ninguna depende de nosotros**. Tres cosas las desbloquean,
y en este orden de rendimiento:

1. **T4 · el contexto del panel en `POST /config/chat`.** Desbloquea F3.2, la
   mitad de F3.3, la casilla 13 de §17 —y con ella F5.10— y la primera mitad de
   F3.7. Es **un campo en el cuerpo del endpoint**. *(Cerrada el 2026-09-17: el
   campo llegó, y las cuatro se cerraron entre el 17 y el 21.)*
2. **Que tomen el fork.** Desbloquea F4.12 entera y la mitad de roles de F4.3.
   El código está escrito y probado; falta desplegarlo.
3. **`/config/plots`** · desbloquea F1.31, F4.21 y F5.3.

Lo demás son campos sueltos: `layouts` en `Contexto` (F5.1), locale y moneda en
`tenant` (F1.13b), el estado del período (F1.42), panel y período en
`HiloResumen` (F3.7), una ruta que liste usuarios (F4.3).

**Las cinco formas de `Valor` (F4.17–F4.20) son las únicas que no conviene pedir
todavía**, y por la razón que el propio yaml escribe: no hay métrica que las
declare, así que declararlas sería agregar una forma que ningún endpoint
devuelve.

#### Se intentaron el 2026-09-15 y siguen cerradas · con la razón medida

**El argumento para tomarlas era que la primera razón del plan había vencido.**
«Su único consumidor es el builder, que no se puede empezar» dejó de ser cierto:
el builder está construido y la biblioteca ofrece los quince tipos. De ahí salía
que la consola no puede dibujar tres de los que el builder ofrece.

**La segunda razón no venció, y es la que manda.** `Valor` no declara
`categoricaComparada`, `perfilMultiatributo`, `matriz`, `flujo` ni `grafo` —lo
dice el propio yaml, con su decisión fechada el 2026-08-19—, así que escribir los
tres cuerpos sería escribir contra formas inventadas. Es lo mismo que ya está
escrito en `registry.ts` sobre `MISSING_TYPES`.

**Y el hueco que motivaba tomarlas no existe.** Medido contra el servicio
corriendo, `GET /config/blocks` declara que esos tres tipos aceptan **solo** esas
cinco formas —`comparison` → `compared_categorical` y
`multi_attribute_profile`; `matrix` → `matrix`; `graph` → `graph` y `flow`—, y
ninguna métrica del catálogo declara ninguna. `invalidReason` rechaza el panel
antes de publicar, así que la consola no recibe un tipo que no sabe dibujar.

**Lo que la medición sí encontró está abajo**, y es de otra tarea.

### La integración con el builder real · 2026-09-11

**Las ocho rutas existen** en la rama `feature/dynamic-dashboard-backend`:
`GET /admin/tenants`, `GET/POST /admin/tenants/:tenantId/layouts`,
`GET/PUT /admin/layouts/:layoutId`, `POST /admin/layouts/:layoutId/validate`,
`POST /admin/layouts/:layoutId/publish` y `GET /admin/tenants/:tenantId/catalog`.
Con eso **trece de las veintiuna tareas de esta fase dejan de estar bloqueadas**.

Siguen bloqueadas dos. **F4.3 y F4.12 ya no esperan a otro equipo**: B4.8 —el
CRUD de roles por tenant—, **F4.12** espera B4.9 —el preview por rol—, **F4.21**
espera `/config/plots` y B1.21, y **F4.4** espera decidir si `POST /admin/agents`
y `GET /admin/agents` alcanzan para la configuración de agente.

**F4.17–F4.20 no se mueven**, y ahora con dos razones en vez de una: su único
consumidor es el builder, y el backend tampoco materializa sus formas —
`transform.go` tiene nueve casos y las tres que estas tareas necesitan no están.

#### ➕ F4.22 ✅ Transcribir el cable de admin y builder
**Descripción.** Las ocho rutas en `contracts/synapse-admin-wire.yaml`, con el
mismo tratamiento que F1.32. Los **cuerpos** de `PUT /admin/layouts/:id` son
snake_case y razonables; las **respuestas** de `GET /admin/layouts/:id`,
`POST .../layouts` y `POST .../publish` serializan structs de dominio de Go sin
etiquetas `json:`, así que llegan en PascalCase: `ID`, `Status`, `ColStart`.
**Criterio de aceptación.**
- La deuda de PascalCase queda **declarada en el yaml**, no absorbida en
  silencio: es una pregunta abierta al backend, no una convención nuestra.
- El yaml declara que rompe los propios tests de Postman del backend
  —`scriptCreateDraft` afirma `lv.status === 'draft'` y lo que llega es
  `Status`— para que la pregunta tenga evidencia y no sea una preferencia.
- `admin-drift` verifica que los tipos generados no deriven del yaml.
- `DDLayoutValidationResult` y `DDCatalogMetric` sí traen etiquetas `json:` y se
  transcriben tal cual.

**Confirmado contra el servicio el 2026-09-16.** Hasta esa fecha este yaml era la
única de las cuatro transcripciones **sin verificar contra el servicio corriendo**
—las rutas piden rol `admin` y nuestro usuario era `planner`—, así que estaba
deducido del código de Go. El backend cambió el rol de
`gerardo.riarte@buentipo.com` a `Admin` y `npm run humo` recorrió las ocho rutas
campo por campo: **coinciden**.

**El PascalCase es real.** `GET /admin/tenants/{id}/layouts` devuelve `ID`,
`TenantID`, `Status`, `VersionID` y `PublishedAt`. La deuda que el yaml declaraba
como pregunta abierta tiene respuesta, y la respuesta es que sí.

**Dos quedan sin probar, y a propósito**: `publish` demotaría el layout publicado
del tenant, y las del fork devuelven 404 porque no está desplegado. El humo las
imprime como ⊘, que es distinto de verde.

**Y apareció algo que no es nuestro pero conviene que sepan.** Esa respuesta trae
un `Tenant` embebido que hoy llega en cero; `domain.Tenant` serializa
`PrivateKeyPEM`, `PrivateKeyPassphrase` y `KmsKeyArn` **sin `json:"-"`**, así que
un `Preload("Tenant")` en esa consulta mandaría la llave privada al navegador.
Hoy no pasa. Va en el mensaje del 2026-09-16 como latente, no como urgente.

**Cerrada el 2026-09-15.** `contracts/synapse-admin-wire.yaml` — seis rutas, ocho
operaciones, trece esquemas. Cuarto contrato del repositorio, con su
`gen:admin-wire` y su `admin-drift` en la puerta, que ahora son dieciséis
chequeos.

**Y una diferencia con F1.32 que hay que declarar: este NO se pudo verificar.**
El cable de la consola se transcribió igual y después `npm run humo` lo confirmó
contra el servicio, cero diferencias. Las ocho rutas de admin cuelgan de
`AdminOnlyMiddleware` y el usuario de prueba disponible es `Planner`, así que
`GET /admin/tenants` devuelve **403** — comprobado. **Este archivo describe lo
que el código de Go dice que devuelve, no lo que se vio llegar**, y eso está
escrito en su cabecera. Con un usuario `admin` se extiende `tools/humo.py` a
estas rutas.

**La deuda de PascalCase quedó declarada, no absorbida en silencio**, con su
evidencia: rompe los propios tests de Postman del backend —`scriptCreateDraft`
compara `lv.status` contra `'draft'` y lo que llega es `Status`—, que es lo que
demuestra que es un descuido y no una convención.

**Tres trampas que el yaml documenta y que no avisa nada:**

- **`PUT /admin/layouts/:id` es un REEMPLAZO COMPLETO**, no un parche. Lo que no
  venga se borra.
- **Una tab sin `id` genera una NUEVA.** Mandar el UUID existente conserva el id
  al reemplazar el contenido; omitirlo recrea. Es la diferencia entre editar y
  duplicar.
- **`validate` responde 200 aunque la composición sea inválida.** El resultado
  va en `data.valid`; un 200 quiere decir que la validación corrió, no que esté
  bien.

**Verificado por mutación** en los dos casos —generado editado a mano, yaml
cambiado sin regenerar— y comprobando que los otros tres contratos siguen
conformes.

#### ➕ F4.23 ✅ Los hooks del builder contra el cable
**Descripción.** `useTenants`, `useLayouts`, `useLayoutDetail`, `useSaveLayout`,
`useValidateLayout` y `usePublishLayout`, con su adaptador, siguiendo la figura
de F4.16. El ciclo del builder es `crear borrador → PUT → validate → publish`, y
solo un `draft` es editable: un `PUT` sobre un publicado devuelve 409.
**Criterio de aceptación.**
- **El servidor decide.** La validación del front es feedback inmediato; nunca se
  publica algo que el front dio por bueno y el servidor no vio — es el criterio
  que F4.11 ya declara y acá se sostiene con `POST .../validate` real.
- Publicar invalida la caché de la consola: `/config/me` y las pestañas se
  vuelven a pedir, porque publicar **demota el layout publicado anterior a
  borrador** y lo que estaba en pantalla dejó de ser el layout vigente.
- Un 409 sobre un layout publicado se muestra con la razón —«este layout ya está
  publicado; duplicalo para editarlo»—, no como «error al guardar».
- Los `errors[]` de validate se muestran **por panel**, que es como vienen
  (`tab_id`, `panel_id`, `field`, `message`), y no como una lista suelta al pie.
- El `PUT` es un **reemplazo completo** de tabs y paneles: se envía el layout
  entero, y mandar una tab sin `id` genera una nueva. Queda escrito donde se
  llama, porque es la clase de cosa que se descubre borrando el trabajo de
  alguien.

**Cerrada el 2026-09-15.** `src/api/admin.ts` —cliente y adaptador— más seis
hooks en `hooks.ts`. 437 pruebas.

**Los hooks del builder viven en `hooks.ts` y no en un archivo aparte**, y no es
comodidad: **publicar tiene que invalidar la caché de la CONSOLA**, y para eso
las dos familias de claves tienen que estar al alcance. Separarlas obligaría a
importar las de la consola desde el builder, que es la dependencia al revés.

**Ese es el defecto silencioso de esta tarea y tiene su prueba.** Publicar demota
el layout publicado anterior del tenant a borrador, así que cambia la lista de
layouts —lo evidente— y también **lo que la consola está mostrando**: sus
pestañas y su contexto salen del layout publicado. Sin invalidar `me` y `tab`,
quien acaba de publicar sigue viendo el layout viejo y cree que no funcionó:
**todo responde 200 y la pantalla no cambia.**

**La forma que sale del adaptador es una PROPUESTA, no el contrato.**
`synapse-api.yaml` declara en su alcance que admin y builder entran «cuando esas
superficies prueben qué necesitan». Así que esto es lo que va a proponerse en
B0.6, y sigue las convenciones del contrato: español, camelCase, y **reusa
`PanelConfig`** — un panel del builder es el mismo que la consola dibuja, y darle
dos formas sería garantizar que se separen.

**Tres decisiones que quedaron escritas donde se toman:**

- **El 409 tiene código propio** —`REGLA_LAYOUT_PUBLICADO`—. Sin distinguirlo, el
  builder diría «error al guardar» sobre algo que tiene una salida concreta:
  duplicar el layout.
- **Un `Status` desconocido cae en `borrador`, no en `publicado`.** Es la lectura
  segura: un layout del que no se sabe si está publicado no se trata como
  publicado. La dirección importa.
- **`validar` no cachea.** Es una pregunta sobre el estado de ESTE momento; una
  respuesta guardada diría «válido» sobre una composición que ya cambió. Por eso
  es mutación y no consulta.

**Verificada por mutación, y la cuarta enseñó algo.** Tres rompieron pruebas:
publicar sin invalidar la consola, el 409 sin su código, y un estado desconocido
leído como publicado. **La cuarta —quitar el spread condicional del `id`— no
rompió ninguna, y no era una prueba débil**: `JSON.stringify` descarta las claves
`undefined`, así que mandar `id: undefined` produce el mismo JSON. El spread es
una garantía de TIPO —`exactOptionalPropertyTypes`— y no de cable. Corregido el
comentario, que decía otra cosa.

Es la tercera forma de «una mutación que pasa»: no que el arnés fallara ni que la
prueba fuera débil, sino que **el cambio no tenía efecto observable**. Las tres
se distinguen mirando; ninguna se puede dar por buena sin hacerlo.


---

### B1 y B2 contra el `.pen` · 2026-09-16

**Revisado frame por frame** después de que la revisión humana dijera «no veo la
serie de pantallas B». **B2 estaba construido**: las guías de doce, la regla
—«Grilla 12 · columna 80 · gap 16 · fila base 80»—, el slot vacío, los handles y
la colisión. Lo que no estaba era **cómo llegar**.

**El `.pen` lo dice y nosotros no lo teníamos.** La nota de B1 lo llama «el punto
de entrada del builder» y cada pestaña lleva su CTA `COMPONER ‹PESTAÑA›` con el
rótulo `AL ENTRAR SE ABRE B2 CON ESTE CONTEXTO`. Sin eso había que elegir versión
y después acordarse de ir a «Canvas» por la navegación; quien no hacía las dos
cosas veía «Elegí una versión…» y concluía que el canvas no existía.

**Ahora el gesto hace las dos cosas** —fija la pestaña y cambia de pantalla—, que
es lo que la prueba fija: cada mitad por separado se ve bien y no resuelve nada.
Verificado por mutación, seis casos sobre línea de base verde.

**Sin conteo en el CTA**, y lo destapó una prueba: la fila ya declara «N panel(es)
· N rol(es)» y el `.pen` dice `COMPONER ECOMMERCE OVERVIEW` a secas. Repetirlo
hacía que dos elementos de la misma fila dijeran lo mismo.

#### Lo que queda de B1 y B2, y las dos esperan al backend

**Ningún contrato declara herencia.** Ni `PanelConfigurado` ni `LayoutPanel`
tienen un campo que diga si un panel viene de la plantilla o es propio del
tenant, y sin eso no se pueden pintar:

- **La proporción heredados/propios por pestaña** que B1 dibuja —«11 HEREDADOS DE
  LA PLANTILLA · 1 PROPIO»—. Ya estaba declarado como hueco en `ContextView`.
- **El estado `heredado` del panel en el canvas.** La nota de B2 pide cuatro
  estados —heredado, seleccionado con handles, slot vacío y colisión— y tenemos
  tres.

**No se rellenan.** Inventar la distinción haría que el builder afirmara algo que
el dato no sostiene, y un panel marcado «propio» que en realidad se hereda es
peor que ninguna marca.

### La navegación entre superficies · decidida el 2026-09-16

**El `.pen` no la dibuja.** Recorridos los quince frames uno por uno: cada
superficie se declara a sí misma con su chip —`ADMINISTRACIÓN`, `BUILDER`— y
navega hacia adentro con su nav horizontal, y **ninguna navega hacia al lado**.
No hay «ir a administración» en la consola ni «volver» en el builder.

**Decisión humana: el builder y administración los ve solo el admin.**

**Dónde vive, y por qué ahí.** `design.md` §7.1 ya declaraba que el punto de
usuario «abre un panel con nombre, correo, rol con su descripción y cliente». Ese
panel estaba especificado y el código tenía el nombre suelto como rótulo. Las dos
entradas cuelgan de ahí: es el lugar que el diseño ya tenía abierto, en vez de un
control nuevo en el navbar —que sí habría sido inventar—.

**Y esconder no es proteger.** `esAdmin` decide si se PINTA la entrada, no si se
puede entrar: el permiso lo aplica `AdminOnlyMiddleware` con un 403, y quien
escriba `/admin` a mano llega igual a la pantalla. Es la regla de siempre —«un
botón que se aprieta y devuelve 403 es peor que un botón ausente»— y por eso **no
va en `AuthGuard`**, que a propósito no decide por rol.

**Se normaliza la mayúscula porque el servicio la normaliza.** El rol llega como
`Admin` y `/admin/tenants` le responde 200; comparar contra `'admin'` a secas
habría escondido una entrada que el servidor sí habilita.

**Tres cosas que salieron al construirlo:**

- **El chrome no navega.** El primer intento puso `useNavigate` dentro de
  `AdminChrome`, y **rompió doce pruebas que lo montan sin router**. Tenían
  razón: el propio archivo ya declaraba «la navegación es del contenedor, no del
  chrome». Ahora es un callback, y `undefined` no pinta el control.
- **Las pruebas de contenedor ahora montan en un `MemoryRouter`**, que es lo que
  la app real hace. Montarlos afuera probaba una app que no existe.
- **El modo mock decía dos cosas distintas del mismo usuario**: el login devolvía
  `role: 'admin'` y `/config/me` devolvía `CEO`. La consola lee el segundo, así
  que el menú escondía las dos salidas — justo lo que ese modo existe para poder
  recorrer. Corregido con id propio: el super-admin es del plano plataforma, no
  un rol del cliente.

**Verificada por mutación, nueve casos sobre línea de base verde.** Las entradas
a cualquier rol, a ninguno, el rol sin normalizar, **la entrada que se pinta y no
navega** —el botón muerto—, las dos al mismo destino, el panel sin correo, sin
cliente, el nombre que deja de abrir y Escape que no cierra. Mueren las nueve.

---

## Fase 5 — Multi-dashboard, pruebas y pulido

### F5.1 ⬜ Selector de layout cuando hay más de uno · 🔒 `Contexto` no declara `layouts`
**Descripción.** Un tenant puede tener varios dashboards —«Operaciones»,
«Marca», «Ejecutivo»—. El selector aparece solo si `ctx.layouts.length > 1`.
**Criterio de aceptación.**
- Con un solo layout no hay selector: no se ofrece una elección que no existe.
- Cambiar de layout reinicia la pestaña activa, porque la pestaña de un layout no
  existe en el otro.

### F5.2 ✅ Pasar `layoutId` a `GET /config/tabs/{tabId}`
**Criterio de aceptación.**
- El `layoutId` entra en la clave de cache de la pestaña: dos layouts no comparten
  entrada.
- Sin `layoutId` el backend resuelve el layout por defecto del rol.

**Cerrada el 2026-09-15 · el código estaba y la prueba que importaba no.**
`api.tab` ya aceptaba el `layoutId` y `keys.tab` ya lo ponía en la clave, desde
que se escribieron los hooks del builder. Lo que había era **media prueba**:
`client.test.ts` verificaba la URL —«escapa el tabId y agrega el layoutId solo si
vino»— y nada verificaba la clave, que es el punto del criterio.

**No son la misma mitad.** La URL puede estar perfecta y la clave estar mal: si
`keys.tab` ignorara el `layoutId`, la segunda pestaña se leería del cache **sin
pedir nada**, con una URL correcta escrita en un fetch que nunca ocurre. El
síntoma sería el builder mostrando el borrador donde va lo publicado, y los dos
se ven igual de bien.

`tests/api/useTab.test.tsx` lo afirma sobre lo observable a los dos lados —qué
URLs se pidieron y qué datos llegó a cada hook—, no sobre el arreglo que
`keys.tab` devuelve: una aserción sobre la clave fija la forma de la clave, no su
consecuencia.

**Y hubo que congelar la frescura para que el conteo hablara de la clave.** Con
el `staleTime: 0` de fábrica una entrada COMPARTIDA se vuelve a pedir igual —el
segundo hook lee del cache y dispara un refetch de fondo—, así que la red se ve
idéntica compartiendo entrada y no compartiéndola. Medido: la prueba del mismo
layout salía `['layout-a', 'layout-a']` con el código correcto. Contar llamadas
medía la política de frescura y no la clave.

**Verificada por mutación, siete casos sobre línea de base verde.** Seis mueren
de entrada; el séptimo —sacar el `tabId` de la clave— **sobrevivía**, porque las
tres primeras pruebas usaban una sola pestaña. La clave tiene dos partes
variables y solo una estaba sostenida. Se agregó la cuarta prueba y muere.

### F5.3 ⬜ Completar los plots que falten · 🔒 espera a F4.17–F4.19
**Descripción.** Los gráficos que necesiten los cuerpos v1.1 (F4.17–F4.19).
**Criterio de aceptación.**
- Cada uno acepta `PlotProps<F>` y compone primitivas de `core/`. Si necesita algo
  que no está en `core/`, **falta una primitiva, no sobra un componente a medida**.

### F5.4 🕓 Overlay de drill-down
**Estado: diferida** (D3). No se descarta ni se planifica todavía; entra cuando el backend llegue a ese tramo. El contrato ya la cubre, así que lo que falta es el servicio, no el diseño.
**Descripción.** Cubierto por F3.9; queda acá el enganche desde el CTA «Ver
detalle» del shell.
**Criterio de aceptación.**
- Se abre con el `panelId` y las `dimensiones` que declara la métrica en el
  catálogo, nunca con una lista escrita en el front.

### F5.5 ✅ Prueba por cuerpo, con props mínimas válidas
### F5.6 ✅ Prueba: cada `PanelType` del contrato tiene componente registrado
### F5.7 ✅ Prueba: cada `Payload.estado` muestra el estado correcto
### F5.8 ✅ Pruebas de contenedor con MSW
### F5.9 ✅ E2E de una pestaña completa con fixtures HTTP
**Criterio de aceptación (los cinco).**
- **Las pruebas se escriben desde el contrato y desde la cita de la spec, no
  mirando la implementación.** Una prueba escrita desde el código fija lo que el
  código hace y no puede fallar nunca, ni cuando el código está mal. Es lo que
  pasó el 2026-08-20 con 184 pruebas en verde.
- F5.6 es un chequeo de paridad, no una lista escrita a mano: recorre el
  enumerado del contrato.
- F5.8 y F5.9 usan **HTTP mockeado**, nunca fixtures JS importados.

**Auditadas contra las 297 pruebas el 2026-09-04.** Dos estaban cumplidas y se
cierran; tres no, y en un caso la prueba que parecía cubrirlo tiene el defecto
exacto que el criterio nombra.

**F5.7 ✅.** `Panel.test.tsx` recorre los siete estados con `it.each` y
`states.test.tsx` los seis que llegan del batch, de punta a punta. Pero lo que
la cierra de verdad no es la cobertura: **el `switch` de `Panel.tsx` es
exhaustivo**, así que un estado nuevo en el contrato deja de compilar hasta que
alguien decida qué se pinta. La paridad la sostiene el compilador, que es más
fuerte que una prueba.

**F5.8 ✅.** `ConsoleContainer.test.tsx` y `states.test.tsx` montan el contenedor
y lo dejan hacer los mismos `fetch` que en producción; lo único distinto es quién
responde. Cero fixtures JS importados por la superficie: los datos entran como
respuesta HTTP.

**F5.5 ✅ · cerrada el 2026-09-04.** Faltaban seis de doce —`BarsBody`,
`BlockedBody`, `DistributionBody`, `ProseBody`, `RecoBody` y `SeriesBody`— y
ahora los doce tienen prueba. Los tres que dibujan un plot se verifican por lo
que le PASAN al plot —ordenar, recortar, normalizar— porque el SVG en jsdom no
tiene tamaño y no dibuja nada.

**Y encontró un tipo que prometía una cosa y entregaba otra.** `BodyProps`
declaraba `onRespond?: (ref: string, ...)` y `RecoBody` pasaba el
`accionableId` desde siempre — que es lo correcto, porque quien lo recibe llama
a `POST /config/accionables/{id}/respuesta`. Se corrigió el nombre del
parámetro: un tipo que miente es cómo alguien pasa el `ref` un día y el 404
aparece en producción.

**F5.6 ✅ · la prueba que existía tenía el defecto que el criterio nombra.**
`registry.test.tsx` comparaba contra `CONTRACT_TYPES`, **un arreglo de quince
escrito a mano en el propio archivo**, con un comentario que decía «no leídos
del registro: si se leyeran, la prueba no podría detectar que falta uno». La
intención era correcta y se quedó a mitad de camino: una copia a mano del yaml
se desactualiza igual que el registro.

No se puede resolver con tipos —`PanelType` es una unión de TypeScript y se
borra al compilar—, así que la paridad sale del yaml: `tests/contract.ts` lee el
enum de `TipoPanel`, como ya hacen `spec-anclas` con `design.md` y `token-drift`
con el `.pen`. Verificado por mutación agregando `sankey` al contrato: **la
prueba nueva falla y la vieja habría pasado.**

Leer el yaml destapó dos trampas, las dos cerradas: el contrato tiene un
`components/responses/NoExiste` —el 404— así que buscar por nombre en el archivo
entero encontraba una respuesta creyendo que era un esquema; y el `enum:` hay
que acotarlo al nivel del esquema, porque si no agarra el de una propiedad
anidada.

**F5.9 ✅ · cinco paneles, cinco tipos, cinco formas.** Lo que un panel solo no
puede verificar: que cada panel resuelva SU métrica y no la del vecino, que la
grilla los coloque donde dice el layout, que cinco tipos carguen cinco cuerpos
distintos, y que un panel en `ERROR` no arrastre a los otros cuatro.

**Los fixtures se escribieron de memoria y el contrato pilló dos.**
`columnas` pide `titulo` y `numerica` —se había escrito `etiqueta`— y los
pilares de `prosa` piden `label`, no `etiqueta`. El segundo es el que más
enseña: el rótulo salía vacío y **la prueba de `ProseBody` pasaba igual**,
porque solo miraba el `valor`. Ahora verifica los dos.

Dos cosas del entorno que parecían fallos y no lo eran: jsdom abre en 1024px, o
sea seis columnas, así que la grilla colapsaba —F1.30 funcionando— y el alto no
es un `height` sino `gridRow: span N` sobre `gridAutoRows`. Y la celda se busca
por su panel y no por índice, porque `readingOrder` ordena el DOM.

### ➕ F5.13 ⬜ Períodos libres en el selector · 🔒 espera el patrón de `PeriodoId`
**Descripción.** Decisión del 2026-09-04 (humano): **se va con manejo de períodos
libres.** El usuario elige un rango y la consola lo contesta, en vez de elegir de
una lista cerrada que manda el backend.

**Lo que YA está resuelto y no hay que rehacer.** El selector no tiene ni un
período escrito: agrupa por `grano`, deshabilita lo que la pestaña no puede
contestar y declara la razón. Un rango libre declara `grano: dia` —se corta en
días— así que `coarsestRequired` **ya** sabe que una métrica mensual no lo puede
contestar. La lógica difícil está escrita desde F1.7.

**Criterio de aceptación.**
- Un rango libre viaja como `PeriodoId` —`2026-07-01_2026-07-17`— y **no** como
  un campo paralelo. `periodo` ya es una clave única que atraviesa el batch, la
  caché, los payloads y el hilo del chat: dos formas de decir «cuándo» obligan a
  cada consumidor a entender las dos.
- **La superficie sostiene el período elegido como objeto, no como id.** Hoy
  `ConsoleContainer` lo busca en `Contexto.periodos` y cae al primero si no está;
  un rango libre nunca va a estar en esa lista.
- **Se valida MIENTRAS se elige, no después.** Con la lista cerrada el selector
  deshabilita antes de que el usuario toque nada; con rango libre elige y recién
  ahí se entera de que media pestaña quedó vacía. Se valida contra
  `coarsestRequired`, que ya existe.
- El rango entra en la clave de caché como cualquier otro período.

**Bloqueada.** El patrón de `PeriodoId` rechaza días, trimestres y rangos —y se
contradice con la descripción de `grano`, que dice que el front deduce
`2026-07-15` como día. Es la pregunta 12 de B0.9, con el patrón propuesto listo.

**El costo real de esta decisión es de backend, no de front:** los períodos de
hoy son snapshots materializados —`estado: 'MTD CERRADO'`, `'CERRADO'`— y un
rango arbitrario hay que calcularlo a demanda.

### F5.10 ✅ Checklist de conformidad §17 por tipo de bloque integrado
### F5.11 ✅ Verificar tema oscuro y claro en todo componente
### F5.12 ✅ Verificar la carga diferida
**Criterio de aceptación.**
- F5.11: automatizable — el chequeo de contraste de v2 (`tools/contraste.py`)
  verifica los pares de tokens en los dos temas y corre en cada build.
- F5.12: una pestaña que usa cinco tipos descarga cinco chunks de cuerpo, no
  quince. Verificable sobre el output del build.

**F5.10 auditada el 2026-09-04 · once de trece**, después de cerrar dos que la
propia auditoría destapó: la garantía del período, que no verificaba nadie, y la
prueba de render mínimo, que era F5.5. §17 tiene trece casillas.
Verificadas hoy, y por quién:

| Casilla | Quién la sostiene |
|---|---|
| Layout de `GET /config/tabs`, no de código | `states.test.tsx` contra MSW |
| Payload de `panels:batch`, no de fixture | ídem |
| Catálogo de `GET /config/catalog` | ídem |
| Gobierno visible en los 6 estados | F2.6 · la prueba del payload sin `Gobierno` |
| Ningún hex literal | `design-lint` L1 |
| `render/` no importa `api/` | `design-lint` L14 |
| Sin `any`, props según `BodyProps` | `typecheck` + `registry.test.tsx` |
| Cuerpos y plots puros | L14 + las pruebas de cuerpo |
| Eventos suben por callbacks | `states.test.tsx`, `Panel.test.tsx` |

**Faltaban dos, y ninguna dependía de nosotros. Las dos se cerraron:**

- **«Cambiar tenant/rol recomponen sin deploy»** · el 2026-09-15, abajo.
- **«Clic abre chat con `metricId` + contexto»** · el 2026-09-21, abajo del
  todo. Esperaba a F3.2, que esperaba a T4.

##### Doce de trece desde el 2026-09-15 · la casilla del tenant y el rol

**La razón por la que estaba bloqueada venció.** «Necesita el contrato de admin y
builder, que no existe» se escribió el 2026-09-04; el contrato existe desde F4.22
—`contracts/synapse-admin-wire.yaml`, con `admin-drift` en la puerta— y la vista
previa por rol está construida en F4.12. Lo que faltaba era la prueba.

**Y no la cubría la casilla 1.** «Layout viene de `GET /config/tabs`, no de
código» dice que la composición llega del servidor; ésta dice que **el tenant y
el rol son los que la mueven**. Un front que pintara el layout que llega y además
tuviera escrito «si el rol es CEO, esta pestaña no» cumpliría la primera y
fallaría ésta — y la diferencia solo se ve cambiando el rol.

`tests/surfaces/console/porRolYTenant.test.tsx` monta **el mismo componente dos
veces** contra dos contextos distintos: otro tenant, otro rol, otra pestaña, otra
pregunta operativa, otra métrica, otro tipo de panel y otra cifra. Sin build en
el medio. La segunda prueba aísla el eje del rol —mismo tenant, dos paneles
contra uno, porque `hidden_metric_ids` ya se aplicó del lado del servidor— y la
tercera fija que **el front no reimplementa el filtro**: un panel cuya métrica
este rol no ve se dice, no se esconde. Esconderlo sería lo mismo que
`RolePreview` explica que no hay que simular.

##### Trece de trece desde el 2026-09-21 · la casilla del chat

**Lo que la destrabó fueron F3.2 y F3.3**, no un cambio en esta tarea: T4 se
cerró el 2026-09-17, el contexto del panel viaja y «Preguntar» existe en el
shell.

**La casilla dice `metricId` y el cable pide `panel_id`, y eso NO se resolvió en
silencio.** §17 de `nuevo-desarrollo.md` se escribió antes de que existiera
`POST /config/chat`; el 2026-09-17 se decidió —decisión humana sobre el informe
de `82da946`— adoptar la forma del backend, que es
`panel_context: {panel_id, period}`, y el servicio resuelve la métrica leyendo
el panel por su id. **Queda como propuesta de spec sobre §17**, que es un
documento normativo y no se edita desde acá.

**Lo que la casilla protege sigue en pie, y es lo que se verifica**: que el chat
quede anclado a la métrica del panel que se apretó. Un front que mandara el
panel equivocado cumpliría «manda un panel_id» y abriría una conversación sobre
otra cifra — y eso no lo ve ninguna prueba que solo mire que el botón existe.

`tests/surfaces/console/preguntar.test.tsx` lo verifica **de punta a punta y no
por partes**: lee el título de la hoja, busca en el catálogo qué métrica se
llama así, busca qué panel la lleva, y exige que sea **ese** el `panel_id` que
salió por la red. Más el período. La segunda prueba cubre la otra línea de §17
—«el componente no navega solo»—: montada la consola y sin apretar nada, no hay
hoja.

**Verificada por mutación**: anclar el chat al primer panel del catálogo en vez
de al apretado mata cuatro de las nueve.

**Verificada por mutación, seis casos sobre línea de base verde.** La pregunta
operativa escrita en el front, el nombre de la métrica escrito en el adaptador,
los paneles recortados a uno, el filtro por rol reimplementado, el orden de
lectura ignorado y el catálogo cayendo a una métrica fija. Mueren los seis.

**Queda una, y sigue 🔒 de verdad.** «Clic abre chat con `metricId` + contexto»
es F3.2 y espera a **T4**: `POST /config/chat` acepta `pregunta`, `tabId` y
`hiloId`, y **no hay campo por donde mandar el panel**. La cadena de callbacks
está construida hasta el botón —`Console → PanelInGrid → Panel → PanelShell`—;
lo que no existe es el manejador arriba, y por la regla de este repositorio un
CTA sin manejador **no se pinta**. Inventar el campo sería escribir contra un
contrato que no lo declara.
- ~~«Cambiar período no re-fetch layout»~~ · **cerrada el mismo día que la
  auditoría la encontró.** Estaba implementada —`keys.tab` no lleva el período—
  y escrita en un comentario de `hooks.ts`, pero **ninguna prueba la sostenía**:
  se cumplía por accidente de quien la escribió, que es como se pierde una
  garantía en la siguiente refactorización. Ahora hay una prueba que cambia de
  período y comprueba que el layout se pidió UNA vez y el batch dos. Verificada
  por mutación metiendo el período en la clave del layout.
- ~~«Prueba de render mínimo con props válidas»~~ · **cerrada con F5.5** el
  mismo día: los doce cuerpos tienen prueba.

**F5.11 cerrada el 2026-09-04, y encontró una violación real en su primera
corrida.** El port agrega una cosa al de v2: **el fondo puede ser una PILA.** Un
wash no es un fondo, es una capa sobre uno — la pestaña activa, el hilo activo
del riel y el badge de degradado se pintan sobre `w2`/`w3` encima de la
superficie, así que medir contra la superficie a secas mide un fondo que nadie
ve.

Y eso es exactamente lo que encontró: **`DegradedBadge` queda en 4.17 contra el
umbral de 4.5 en tema oscuro.** Es un `<Label>` —mono 10px, `dim`— sobre
`bg-w3`. Sobre `panel` a secas da 5.04 y pasa; **es el wash lo que lo hunde**, y
el chequeo de v2 medía sin la capa, así que habría dicho «conforme». En tema
claro da 4.60, que pasa raspando.

Queda REGISTRADA, no arreglada: los tokens salen del `.pen` y las tres salidas
—subir `dim`, bajar el alfa de `w3`, o que el badge deje de usar `dim`— son
decisiones de diseño que tocan más cosas que este badge. Es la pregunta 13 de
B0.9. El chequeo sale verde imprimiéndola como pendiente, y **falla si el
número se mueve**: verificado por mutación, junto con una desviación nueva y con
el caso arreglado.

**F5.12 ✅ · `tools/carga-diferida.py`, sobre `dist/`.** Lo que había verificaba
`preloadBodies`, que es la FUNCIÓN. Lo que decide si el usuario descarga cinco
cuerpos o quince es si el bundler los separó, y eso solo se ve en el build.

**Lo que se cuenta es la existencia de un chunk por cuerpo**, y es la métrica
correcta por cómo falla esto de verdad: nadie escribe «cargá los quince», lo que
pasa es que alguien importa un cuerpo de forma normal —para una prueba de tipos,
para reusar una constante— y Vite, que ve un import estático, lo mete en el
chunk principal. **El `lazy()` sigue ahí y ya no sirve: el código viaja igual, y
el síntoma es que el chunk desaparece.**

Verificado por mutación con un `import { KpiBody }` desde `Console.tsx`: el
chequeo lo detecta y nombra el cuerpo. Sin `dist/` sale BLOQUEADO en vez de
pasar. Corre **después** del build en la puerta, que ahora son diez chequeos.

---

# Transversales

| ID | Tarea | Responsable | Criterio de aceptación |
|---|---|---|---|
| **T1** | `contracts/synapse-api.yaml` es la fuente de verdad | Backend escribe · front consume | Un cambio en el yaml que el backend no implemente rompe CI de alguno de los dos |
| **T2** | Documentar las reglas de los 15 bloques | Backend valida · front muestra | La tabla vive en un solo lugar y se sirve por `/config/blocks` |
| **T3** | Acordar el formato de eventos SSE | Backend | Los seis eventos con su forma, en el yaml |
| ✅ **T4** | Acordar `ContextoDePanel` · **CERRADA el 2026-09-17** | Ambos | Declarado en el cable del backend: `panel_context: {panel_id, period}`. Lo resolvieron ellos en `82da946` y la decisión humana del 2026-09-17 fue adoptar **su** forma en vez de los doce campos que pedía F3.2 — el servicio arma el resto leyendo el panel por su id. Transcrito en `contracts/synapse-console-wire.yaml` |
| **T5** | Seed de demo | Backend | Ver B1.16 y B1.20 |
| **T6** | Ambiente de desarrollo: backend + front + Postgres | Ambos | Un comando levanta los tres. El front apunta a `VITE_API_URL` |
| **T7** | Revisión de conformidad con `design.md` y `parametros-front.md` | Front | Automatizada en F0.11, no manual |
| ➕ **T8** | Cerrar D6: `Metrica.base` a `design.md` · **decidido, falta ejecutar** | Front propone · humano aprueba | `design.md`, el yaml y el catálogo dicen lo mismo. Un panel `BLOQUEADO` puede mostrar su BASE |
| ➕ **T9** | Destino de las cuatro superficies de v2 · **cerrada por D3** | Humano | Quedan diferidas: se retoman cuando el backend llegue a ese tramo |

---

# Camino crítico

**Lo que bloquea a más gente, primero.** Las seis decisiones se cerraron el
2026-09-01, así que lo que queda son dependencias reales de trabajo.

1. **B0.9** — las cinco preguntas abiertas del contrato. Bloquean F2.1, F2.3 y el
   diseño de estados. Es lo más barato del plan y lo que más desbloquea.
2. **B0.10** — endpoint de login. Sin él F0.5 no cierra y el front no entra a la
   aplicación.
3. **F0.9 + F0.11** — runner de pruebas y puerta de calidad, **antes** del
   traslado. Portar 2.800 líneas sin puerta es repetir el fallo del 2026-08-20.
4. **F1.13a → F1.13j** — el traslado, en ese orden: las primitivas no dependen de
   nada y los cuerpos dependen de todo lo anterior.
5. **B1.16 + B1.20** — seed determinista. Desbloquea F1.25 y toda la Fase 2 del
   front.
6. **B1.21** — los mínimos por gráfico. Habilita F1.31, y F1.31 habilita B4.16 y
   F4.21. Es el orden que fija D2: primero qué necesita cada gráfico, después
   quién lo elige.
7. **T8** — cerrar `Metrica.base` en `design.md`. No bloquea código, pero mientras
   siga abierto las tres fuentes de autoridad dicen cosas distintas.

**Lo que puede correr en paralelo desde el día uno:** B0.1–B0.4 del backend y
F1.13a–F1.13d del front, que no dependen de nada.

# Sobre las estimaciones

`tareas-front-back.md` estima la Fase 1 de front en 2–3 semanas. **Con `render/`
portado, la Fase 1 de front es integración, no construcción** — el motor de panel
ya existe, es conforme y pasó por el loop de revisión. Lo que sí es de cero es
admin + builder, que el documento estima en 3–4 semanas y es la parte que v2 no
tiene en absoluto.

Las tres tareas que agrego a Fase 0 —runner, puerta de calidad, generador de
tokens— suman trabajo por delante y lo devuelven en la primera semana del
traslado: son las que hacen que una violación de spec falle en vez de pasar.
