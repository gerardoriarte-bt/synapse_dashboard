# CLAUDE.md

Guía para Claude Code (claude.ai/code) al trabajar en este repositorio.

## Qué es esto

El **front dinámico de Synapse**: un renderizador puro de React que no tiene
ninguna pantalla escrita. El backend manda el layout, el catálogo y los datos; el
front los dibuja. Synapse es la consola de inteligencia de negocio para tenants
de retail; el primer cliente es UA MX.

**Fase actual: traslado de `render/`.** La Fase 0 está cerrada salvo el login; la
Fase 1 es portar el motor de panel desde el repositorio archivado.

## Cadena de autoridad

| Fuente | Define | Autoridad |
|---|---|---|
| `nuevo-desarrollo.md` | Arquitectura del front dinámico | **Normativo** |
| `plan-de-trabajo.md` | Las 170 tareas con fase, estado y criterio | **Fuente del plan** |
| `contracts/synapse-api.yaml` | Forma de las respuestas del backend | **El contrato**, y su casa |
| `.cursorrules` | Idioma, estructura, convenciones de componente | Normativo |
| `tareas-front-back.md` | El desglose original del backend | Histórico · lo extiende `plan-de-trabajo.md` |

**`design/` vive acá desde el 2026-09-03**, que es el mismo camino que ya había
hecho `contracts/`. Son las dos fuentes que la puerta necesita, y tenerlas dentro
es lo que hace que un clone limpio o un runner de CI puedan correr `verify`:
antes `token-drift` y `spec-anclas` salían ⊘ BLOQUEADO, que es honesto pero no
verifica nada.

| Archivo | Qué manda |
|---|---|
| `design/design.md` | Reglas duras de producto. **Normativa** |
| `design/Synapse_v2.pen` | Los tokens. La fuente de `tokens/tokens.css` |

Los otros dos normativos siguen en el repositorio hermano
`~/Documents/GitHub/synapse_v2` (`gerardoriarte-bt/Synapse-v2`), archivado:

| Archivo | Qué manda |
|---|---|
| `handoff/parametros-front.md` | Tokens, grilla, anatomía de panel |
| `handoff/design-lint.md` | Las 15 reglas verificables L1–L15 |
| `src/render/` | El motor de panel del que se porta (F1.13a–j) |

Donde dos fuentes difieran, gana la más específica para lo que se está
implementando **y se abre una propuesta de spec**. No se resuelve en silencio, y
el agente no modifica `design.md`.

## Estructura · §4 de `nuevo-desarrollo.md`

```
src/
├── app/         Router, providers, auth guard
├── api/         client · hooks (TanStack) · types · generated.ts
├── tokens/      los 57 tokens del .pen, tema, fuentes
├── catalog/     SOLO tipos y validadores. La tabla llega por API
├── render/      PURO · Panel, bodies, plots, states, primitives, grid
└── surfaces/    console · admin · builder

tests/           TODAS las pruebas, espejando src/. Los mocks de MSW viven acá
```

**Dos fronteras que no se cruzan:**

1. **`render/` no importa VALORES de `api/`.** Los componentes reciben datos por
   props. Es lo que permite que el mismo panel sirva en la consola, en el builder
   y en la vista previa por rol.

   **`import type` sí está permitido, y no es una excepción tolerada: es la
   regla.** El panel recibe el payload por props y la forma de esas props es
   `Payload`, que vive en `api/types.ts`; sin importar ese tipo no hay manera de
   tiparlo. Lo que la frontera impide es la dependencia **en tiempo de
   ejecución** —el cliente, el fetch, el cache—, y un `import type` se borra al
   compilar: con `verbatimModuleSyntax` ni siquiera llega al bundle. Así lo
   implementa `L14` del lint en el repositorio archivado.

   Un grep que busque `from '../api'` a secas marca falsos positivos. El que
   vale excluye `import type`.
2. **`src/api/generated.ts` y `src/tokens/` se generan** —con `npm run gen:api` y
   `npm run gen:tokens`. Editarlos a mano se pierde en la próxima corrida y
   produce deriva silenciosa. Desde F0.12 `token-drift` lo verifica regenerando
   y comparando byte a byte, así que un comentario cambiado también se ve: es
   donde viven `§ANCLA:RADIO-1` y `§ANCLA:TIPO-2`.

## Idioma

- **Identificadores en inglés** — archivos, carpetas, componentes, funciones,
  tipos: `Console.tsx`, `panelStyle()`, `usePanelsBatch`, `BodyProps`.
- **Comentarios y documentación en español.** Es la lengua del equipo, y
  `.cursorrules` cuenta los comentarios como documentación.
- **Textos de UI en español**, que es la lengua del producto.
- **Las claves del contrato NO se traducen.** `payload.valor`, `metric.familia`,
  `panel.tipo`, `estado: 'DISPONIBLE'` llegan como los declara el yaml.
  Traducirlas obligaría a una capa de mapeo en cada frontera, y el contrato es
  compartido con el backend. Se lee `metric.familia` y `panel.colSpan` en la
  misma línea: el lado izquierdo es nuestro, el derecho es del contrato.

## Tokens bajo Tailwind v4

Los 57 tokens viven en `src/tokens/tokens.css` con el espacio de nombres que
Tailwind exige: `--color-panel` genera `bg-panel`, `--radius-xl` genera
`rounded-xl`, `--spacing: 4px` hace que `p-6` sean los 24px de padding de panel.

**`@theme static` — el `static` no es opcional.** Sin él Tailwind poda del
`:root` toda variable que ninguna utilidad mencione **por escrito**, y las rampas
de familia se arman en runtime: `var(--color-fam-${family}-1)`, con la familia
que vino del catálogo, que el escáner no ve nunca. Medido el 2026-08-31:
sobrevivían **6 de 43**, y el tema oscuro se quedaba sin colores de datos
mientras el claro los conservaba, porque el bloque de tema claro es CSS plano
fuera de `@theme`.

**La escala tipográfica también es token, desde F1.28.** Ni `text-[13px]` ni
`text-sm`: las dos se saltan el sistema, y la segunda es más fácil de escribir.
Nueve tamaños, tres trackings y cuatro alturas de línea, con dos procedencias
distintas que conviene no mezclar: **los cuatro mono —nota 9, label 10, cifra 11,
celda 12— los declara §2.3 y los cierra** («Ningún otro tamaño mono»), mientras
que los cinco que no son mono salen del censo de nodos del `.pen`, porque
`design.md` no declara ni un tamaño de `font-body` ni de `font-display`. La regla
`tipografia` de `design-lint` persigue las dos formas y `TIPO-2` ancla la cita.

**El tracking va en `em`.** El `.pen` guarda 1.2px sobre el label de 10 y 1.08px
sobre la nota de 9: son el mismo 0.12em. En px harían falta dos variables y una
de las dos se olvidaría el día que alguien cambie un tamaño.

**Y una utilidad que nombra un token inexistente no es un error, es silencio.**
`text-labell` compila, pasa el lint, se pinta sin tamaño y se ve casi igual —el
mismo modo de falla que el spread condicional con una prop mal escrita. Lo cubre
`tests/tokens/escala.test.ts`, que cruza cada utilidad de `src/` contra las
variables declaradas.

**`render/` no acepta `className` desde afuera.** §4 regla 9 pide que todo color,
radio y espaciado salga de tokens, y una clase inyectada por el llamador es el
agujero por donde entra un valor que no lo es — **y uno que el lint no puede
tapar de otra forma**, porque mira el archivo donde la clase se escribe y no
donde se aplica. El componente es dueño de su apariencia. Decidido el 2026-09-02;
con eso se borró `lib/cn.ts` y sus dos dependencias, que no tenían qué fusionar.

**Dos zonas horarias, y confundirlas es el bug.** Decidido el 2026-09-04: el
corte del día del negocio es **del tenant, uno solo, aunque el tenant tenga
tiendas en varios países** — todo se alinea con el tenant de la consulta. Si la
zona del dato saliera del navegador, «ventas de hoy» sería un número en Ciudad
de México y otro en Baltimore, y una cifra que cambia según quién la mira no es
auditable. La **presentación** —«HACE 3 H», el agrupado HOY/ESTA SEMANA del riel
de hilos— sí sale del huso del navegador, y el contrato lo sanciona
explícitamente para el riel. Que se llamen distinto en el contrato: un solo campo
«timezone» es cómo alguien, en seis meses, calcula un período con el huso
equivocado.

**Reglas duras de color** (de `design.md`, y no son negociables):

- **Un hex literal es un bug.** Todo color sale de un token.
- **El naranja `--color-acc` no es color de datos.** Nunca en una serie, barra,
  celda o nodo. Solo CTAs, estado activo, enlaces y cifras resaltadas en prosa.
- **Ámbar y amarillo: prohibidos.**
- **Deltas en color neutro.** El signo comunica dirección; prohibido verde/rojo
  semántico.
- La familia cromática **se lee del catálogo, nunca se elige en el componente**.

## Reglas de panel que el código tiene que sostener

- **Ningún número desnudo:** todo valor lleva label en mayúsculas, mono 10px,
  `0.12em`, gris. Por eso existe el primitivo `Label`.
- **Toda métrica declara su BASE** (denominador + ventana) y su **PROCEDENCIA**
  (capa Medallion, fuente, frescura).
- **Un estado reemplaza el cuerpo, nunca el shell.** Título, BASE y procedencia
  siguen visibles mientras el panel carga, falla o está bloqueado.
- **Toda altura de panel es un `rowSpan`:** `px = 96·N − 16`. Ninguna altura en
  píxeles sueltos — sale de `render/grid.ts` y de ningún otro lado.
- **Un panel se ancla a un `metricId`**, jamás a un SQL ni a un nombre de tabla.
- **Prohibida la estimación puntual sin intervalo.** Un pronóstico sin banda no
  se publica.
- **Degradación declarada:** si un feed está vencido, el panel no muestra un
  número aproximado — muestra estado, razón, qué lo desbloquea y CTA.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Vite en :5173 |
| `npm run typecheck` | `tsc` strict, sin excepciones |
| `npm run build` | typecheck + build de producción |
| `npm run lint` | oxlint |
| `npm test` | vitest · las pruebas viven en `tests/`, agrupadas |
| `npm run verify` | **la puerta** · `tools/gate.py` · typecheck, lint, los cuatro chequeos de diseño, test y build |
| `npm run design-lint` | las 15 reglas duras sobre `src/`, en utilidades de Tailwind |
| `npm run spec-anclas` | cada regla de `design.md` atada a su código y su aserción |
| `npm run contract-drift` | `src/api/generated.ts` == el yaml |
| `npm run token-drift` | `src/tokens/` == lo que el `.pen` emite, **byte a byte** |
| `npm run gen:tokens` | regenera `src/tokens/tokens.css` y `tokens.ts` desde el `.pen` |
| `npm run gen:api` | regenera `src/api/generated.ts` desde `contracts/synapse-api.yaml` |
| `npm run plan` | regenera `plan-tareas.csv` y la página desde `plan-de-trabajo.md` |
| `npm run plan:diff <export.csv>` | compara un export de la plataforma de seguimiento contra el plan |

## El plan de trabajo

**`plan-de-trabajo.md` es la fuente. Todo lo demás se genera.** El CSV y la
página se pisan enteros en cada corrida; editarlos a mano es trabajo que se
pierde. Un solo parser produce los dos, para que no puedan desincronizarse.

`npm run plan` **falla** si una tarea quedó sin criterio de aceptación.

Los identificadores llevan la fase adentro: `B1.6` es **backend, fase 1, tarea
6**; `F1.13a` es **front, fase 1, tarea 13, parte a**.

**La plataforma de seguimiento refleja; no manda.** Decisión del 2026-09-01: el
markdown sigue siendo la fuente después del import, y `plan:diff` verifica que no
hayan derivado.

## Trampas verificadas

- **TypeScript queda en 5.9.** `openapi-typescript@7` declara peer `^5.x`; con TS
  6 `npm install` lo rechaza y `gen:api` no corre. Por eso también se quitó
  `ignoreDeprecations: "6.0"` del `tsconfig.app.json`.
- **El colapso responsive no lo puede hacer solo el CSS.** Cambiar
  `grid-template-columns` a menos columnas no achica nada: un panel con
  `grid-column: 1 / span 12` crea columnas implícitas y la grilla se **ensancha**.
  Medido: a «seis columnas» un panel de colSpan 12 seguía midiendo 1.852px. El
  span se resuelve en JS. Ver `render/grid.ts`.
- **Y el span se DIVIDE, no se recorta.** §4 pide «los spans se dividen a la
  mitad, redondeando hacia arriba», y `Math.min(colSpan, columns)` coincide solo
  cuando el span excede las columnas: a seis columnas un `colSpan` 4 quedaba en 4
  donde va 2. Estuvo mal desde el port hasta el 2026-09-02 y lo detectó
  `spec-anclas`, no una prueba. Sale de `spanFor`.
- **El mínimo de la consola son 360px, no 768** (PS-12, 2026-08-21). El escalón
  de una columna a 767 **sí se soporta**: lo que sobraba era el mínimo, no el
  escalón.
- **Sin `gridAutoRows` la fórmula `96·N − 16` queda escrita y no aplicada.**
- **El spread condicional de JSX apaga el chequeo de props en exceso.** El idioma
  `{...(x === undefined ? {} : { x })}` es obligatorio con
  `exactOptionalPropertyTypes` —no se puede pasar `undefined` a una prop
  opcional—, y tiene un costo: **una prop mal nombrada compila.** Pasó tres veces
  el 2026-09-02: `onChat` a un cuerpo que no lo declara, `onRetry` donde `Exit`
  espera `onClick`, y un CTA que se pintaba sin llamar a nada.

  El síntoma es siempre el mismo —un callback que no se dispara— y no lo ve el
  compilador ni el lint. **La regla de prueba es: verificar que el callback
  DISPARE, no que el botón exista.** Un botón muerto se ve igual que uno que
  funciona. Vale para toda cadena de callbacks, y cuanto más larga, más:
  `Console → PanelInGrid → Panel → ErrorState` son cuatro saltos y cada uno usa
  el spread.
- **Un CTA sin manejador no se pinta.** Misma razón que `puedeResponder` en
  `RecoBody`: «un botón que se aprieta y devuelve 403 es peor que un botón
  ausente». El estado no queda sin salida —el detalle sigue diciendo qué
  hacer—, pero no promete una acción que no existe.
- **`params` de layout llega como `Record<string, unknown>`.** Un param mal
  escrito hoy se ignora en silencio; F1.29 lo resuelve validando en el adaptador
  de `api/`, no en `render/`.

## Antes de dar algo por terminado

```
npm run verify
```

Corre `tools/gate.py`: typecheck, lint, los cuatro chequeos de diseño, test y
build. Cada uno sigue existiendo suelto para iterar.

**Dos convenciones de salida, y mezclarlas ya dejó pasar errores.** Las
herramientas NUESTRAS salen con 0 conforme, 1 violación y **2 BLOQUEADO** —«no
hay contra qué comparar todavía»—, y un bloqueado **se cuenta aparte**: un
chequeo que pasa por falta de fuente miente sobre su cobertura. Las AJENAS no
siguen esa convención: `tsc` sale con 2 cuando hay errores de tipo, y leerlo como
BLOQUEADO dejó pasar dos errores con la puerta en verde. Para ellas, cualquier
código distinto de cero es rojo.

**Desde el 2026-09-02 la puerta sale verde sin bloqueados**: `design-lint` corre
las 15 reglas y `spec-anclas` ancla las 9. Si vuelve a aparecer un ⊘, es que una
regla se quedó sin ámbito o una cita de `design.md` dejó de tener quien la
verifique — no es ruido.

**Las pruebas se agrupan en `tests/`, fuera de `src/`.** Espeja la estructura del
código, y la carpeta separada no es preferencia: los handlers de MSW son datos
falsos, y con ellos afuera **no existe ruta de import desde una superficie hasta
un mock** —F0.8 sostenida por la estructura y no por la revisión. El entorno por
defecto es `node`; el archivo que renderiza pide jsdom con
`// @vitest-environment jsdom` en la primera línea. Ver `tests/README.md`.

**Una prueba nueva se verifica rompiendo el código a propósito.** Si no la viste
fallar, no demostró nada.

**Las dos fuentes normativas son requisito de la puerta**, y desde el
2026-09-03 están en `design/`, adentro. `spec-anclas` necesita `design.md` y
`token-drift` necesita el `.pen`. Los dos resuelven en el mismo orden: la
variable de entorno —`SYNAPSE_DESIGN`, `SYNAPSE_PEN`— gana sobre todo; después
`design/`; y si acá no está, se mira el hermano archivado, para que un checkout
viejo no se rompa. Sin ninguna de las tres el chequeo sale BLOQUEADO en vez de
mentir.

**Una regla nueva se verifica rompiendo el código a propósito**, igual que una
prueba. El antecedente es concreto:
el 2026-08-20, en el repositorio archivado, el colapso responsive violaba §3.1 de
tres formas distintas **con 184 pruebas en verde**, porque estaban escritas
mirando el código. Una prueba escrita desde la implementación no puede fallar
nunca, ni cuando el código está mal.

## Dónde retomar

Leer `plan-de-trabajo.md`: las siete decisiones cerradas explican por qué el plan
tiene las tareas que tiene, y el camino crítico dice qué desbloquea a más gente.
`docs/BITACORA-2026-09-02.md` cuenta qué pasó en la jornada que cerró la Fase 1.

**Estado al 2026-09-03.** El motor de panel está portado entero y la consola
dibuja de punta a punta contra MSW, **los seis estados incluidos** — hasta hoy
MSW solo emitía `DISPONIBLE` y los otros cinco jamás habían atravesado el
contenedor. La puerta sale verde **sin bloqueados**, y
desde el 2026-09-03 sale verde también en un clone limpio: `design/` está
adentro. Fase 1 está cerrada salvo lo que depende del backend.

**La Fase 2 dejó de estar bloqueada el 2026-09-03.** Se contestaron cuatro de
las cinco `# PREGUNTA:` del contrato, y la de la línea 1171 era la que la
frenaba entera: **el batch emite `DEGRADADO` y `SIN_PERMISO`**. Que
`SIN_PERMISO` exista quiere decir que el catálogo no es el único filtro y que
**C5 es una pantalla alcanzable**, no escrita al vacío. Destraba F2.1, F2.3 y
B2.7. Las otras tres: `actor` se deriva del token, `versionModeloSemantico` lo
emite Snowflake y el evento lo estampa al responder, y el tenant de plataforma
va **en el path** (`/platform/t/{tenantId}/console/*`).

Abierto ahora mismo:

1. **La Fase 2, lo que queda: F2.3.** Cinco de las seis se cerraron el
   2026-09-03; la que falta es el CTA de «solicitar acceso» contra
   `/config/solicitudes`, que ya existe en el contrato. La solicitud ya hecha
   tiene que salir del servidor y **no de estado local**: con estado local,
   recargar borra el pedido y la consola vuelve a ofrecer el CTA como si nada.

   Lo mismo vale para el CTA de `BLOQUEADO`: hoy no se pinta, y es correcto —la
   consola no pasa `onUnblock` y un botón sin manejador no se dibuja—, pero
   sigue faltando a dónde mandarlo.
2. **B0.9, lo que queda** — de las diez del documento quedan seis, y solo una
   frena trabajo. Están en `docs/B0.9-preguntas-abiertas.md` con quién decide
   cada una:
   - **La taxonomía de `error.codigo`** es la única de las que frenaban que
     sigue abierta, y no espera una decisión sino una **revisión**: hay una
     propuesta escrita en el yaml —`FAMILIA_DETALLE`, con la familia en el
     prefijo, que es lo que permite que el backend agregue códigos sin que el
     front cambie.
   - `Contexto` no declara `locale` ni moneda. Es lo único que deja F1.13b en
     ⚠️: la inyección funciona, el valor se decide en una línea de
     `ConsoleContainer` marcada como supuesto. **La moneda de un tenant
     multi-país no es el mismo problema que la zona horaria**: sumar ventas en
     dos monedas necesita una moneda de reporte, un tipo de cambio y una fecha
     de corte.
   - **`PeriodoId` no admite días, trimestres ni rangos**, y se contradice con
     la descripción de `grano`, que dice que el front deduce `2026-07-15` como
     día. Bloquea F5.13 · pregunta 12 de B0.9, con el patrón propuesto listo.
   - `PanelConfigurado` no declara `orden`, que §4 nombra para el orden de
     lectura al colapsar.
   - `paramsDisponibles` es `string[]` —solo nombres—, así que los valores
     válidos viven duplicados en `PARAM_SCHEMAS` del front.
3. **F0.5 y B0.10** — el login lo coloca el backend. Faltan tres respuestas de
   integración: con qué clave se guarda el token, si el login vive en otro origen
   (`localStorage` no cruza orígenes), y adónde redirige un `401`.
4. **La Fase 3, el chat.** Hechas F3.4 (cliente SSE), F3.8 (acumulación), F3.1
   (la hoja), F3.5 (los mensajes) y F3.7 (el riel de hilos, parcial).
   F3.9–F3.11 siguen diferidas por D3. **Todo lo que queda de la fase espera
   al yaml.**

   **Dos están bloqueadas por el contrato, y las dos se descubrieron al abrir la
   fase.** Es el mismo patrón: el front tendría que inventar una forma que el
   backend no declara.
   - **F3.2 · T4** — `ContextoDePanel` **no existe**. `POST /config/chat` acepta
     `pregunta`, `tabId` y `hiloId`, y nada más: no hay campo por donde mandar
     desde qué panel se pregunta.
   - **F3.6 · pregunta 11 de B0.9** — `DatoDeRespuesta` no declara con qué tipo
     de panel se dibuja, y `formasAceptadas` va de muchos a muchos, así que no se
     deriva. Ojo con el nombre: `EventoDato.tipo` es `'dato'`, el discriminador
     de la unión, no un `TipoPanel`.
   - **F3.7 · la mitad de arriba** — `HiloResumen` no trae panel ni período, así
     que el riel no puede decir de qué panel salió cada conversación. Es T4 por
     el otro lado.

   **`ContextoDePanel` ya está decidido**, y eso hace a T4 una transcripción y no
   una discusión: `nuevo-desarrollo.md:684` —normativo— declara los doce campos.
   Falta que entre al yaml, que es su casa, junto con `periodo` en el cuerpo del
   POST, que `nuevo-desarrollo.md:146` declara y el contrato tampoco tiene.
5. **Las dos de diseño que abrió F1.28** — §2.3 declara la escala mono entera
   y no declara ni un tamaño de `font-body` ni de `font-display`, y el tracking
   del KPI no sale de ninguna tabla. Son las preguntas 9 y 10 de B0.9; el censo
   de nodos que las sostiene mientras tanto está en
   `docs/F1.28-escala-tipografica.md`.

Bloqueadas por el backend: **F1.25** (API real, espera el seed B1.16/B1.20) y
**F1.31** (mínimos por gráfico, espera B1.21). Lo genuinamente nuevo es **Fase
4** —admin y builder—, de lo que v2 no tiene una sola línea.
