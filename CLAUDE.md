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
| `design/Synapse_v2.pen` | Los tokens **y las pantallas dibujadas**. Ver abajo |

**El `.pen` NO es solo los tokens, y creerlo costó trabajo.** Hasta el 2026-09-15
esta tabla decía «los tokens, la fuente de `tokens.css`», y con eso se
construyeron diez pantallas de admin y builder **sin abrirlo**. Adentro estaban
las quince diseñadas —B1–B6, A1–A6—, cada una con una nota de racional, más los
tres tipos de estado vacío y el de carga.

**Se lee como JSON plano**, igual que hace `tools/gen-tokens.py`:

```python
import json, pathlib
d = json.loads(pathlib.Path('design/Synapse_v2.pen').read_text())
[c['name'] for c in d['children']]          # las pantallas y sus notas
```

Los nodos `note` llevan el porqué de cada pantalla y son lo que hay que leer
**antes** de construirla: qué se deriva y qué se copia, qué es dato mock, qué S3
la originó. Los `frame` llevan el texto literal de la UI, que es más específico
que `design.md` — ahí está «SE SOLAPA CON "DOCE MESES"» donde la spec solo decía
«el panel en conflicto se marca».

**Donde el `.pen` y `design.md` difieran, gana el `.pen` para lo visual y el
literal de la UI**; `design.md` sigue mandando en las reglas duras. Y el agente
no modifica ninguno de los dos.

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
| `npm run dev` | Vite en :5173 · contra el servicio real |
| `npm run dev:mock` | Vite contra un servicio FALSO · abre `/index.dev.html` |
| `npm run typecheck` | `tsc` strict, sin excepciones |
| `npm run build` | typecheck + build de producción |
| `npm run lint` | oxlint |
| `npm test` | vitest · las pruebas viven en `tests/`, agrupadas |
| `npm run verify` | **la puerta** · `tools/gate.py` · typecheck, lint, los cuatro chequeos de diseño, test y build |
| `npm run design-lint` | las 15 reglas duras sobre `src/`, en utilidades de Tailwind |
| `npm run spec-anclas` | cada regla de `design.md` atada a su código y su aserción |
| `npm run contract-drift` | `src/api/generated.ts` == `contracts/synapse-api.yaml` |
| `npm run auth-drift` | `src/api/auth-generated.ts` == `contracts/synapse-auth.yaml` |
| `npm run console-drift` | `src/api/console-generated.ts` == `contracts/synapse-console-wire.yaml` |
| `npm run gen:auth` | regenera los tipos del servicio de acceso |
| `npm run gen:console-wire` | regenera los tipos del **cable** de la consola |
| `npm run token-drift` | `src/tokens/` == lo que el `.pen` emite, **byte a byte** |
| `npm run contraste` | contraste WCAG de los pares que el producto pinta, en los dos temas |
| `npm run carga-diferida` | un chunk por cuerpo en `dist/` · **corre después del build** |
| `npm run gen:tokens` | regenera `src/tokens/tokens.css` y `tokens.ts` desde el `.pen` |
| `npm run gen:api` | regenera `src/api/generated.ts` desde `contracts/synapse-api.yaml` |
| `npm run plan` | regenera `plan-tareas.csv` y la página desde `plan-de-trabajo.md` |
| `npm run plan:diff <export.csv>` | compara un export de la plataforma de seguimiento contra el plan |
| `npm run mocks-fuera` | ningún archivo de `src/` importa un mock · F0.8 |
| `SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… npm run humo` | el servicio real == los dos yaml transcriptos |

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

**Un wash no es un fondo: es una capa sobre uno.** `contraste.py` compone la
pila —`ink` sobre `w2` sobre `dock`— porque medir contra la superficie a secas
mide un fondo que nadie ve. No es teórico: en su primera corrida encontró que
`DegradedBadge` queda en **4.17 contra el umbral de 4.5** en tema oscuro, y
sobre `panel` sin el wash da 5.04 y pasa. El chequeo de v2 medía sin la capa y
habría dicho «conforme». Está registrada como pendiente de diseño —pregunta 13
de B0.9— y el chequeo **falla si el número se mueve**.

**Desde el 2026-09-02 la puerta sale verde sin bloqueados**: `design-lint` corre
las 15 reglas y `spec-anclas` ancla las 9. Si vuelve a aparecer un ⊘, es que una
regla se quedó sin ámbito o una cita de `design.md` dejó de tener quien la
verifique — no es ruido.

### `npm run dev:mock` · para MIRAR, no para verificar

**Existe porque media Fase 4 no se puede ver corriendo.** `/admin/*` cuelga de
`AdminOnlyMiddleware` y los usuarios que tenemos son `Planner` —el claim se
compara contra `roles.name`, y con `Planner` da 403 en cada llamada—; y las
rutas de B4.8 y B4.9 son del fork, que no está desplegado: 404. Admin y builder
están construidos y probados, y hasta el 2026-09-15 no se podían recorrer.

**Entrás con cualquier correo y contraseña**, y el usuario que devuelve es
`admin`. El estado vive en memoria: guardar, publicar y el CRUD de roles
funcionan, y recargar vuelve todo a cero.

**Lo que este modo NO demuestra, y la consola lo dice al arrancar:** que la app
ande contra los mocks no dice nada del servicio real. Los mocks responden lo que
*nosotros creemos* del cable. Eso lo cierra `npm run humo`.

**Vive en `dev/`, fuera de `src/`, con su propia entrada** —`dev/main.tsx` y
`index.dev.html`—. Un `if (import.meta.env.DEV)` dentro de `main.tsx` habría sido
más corto y habría cambiado una garantía por una confianza en el tree-shaking:
F0.8 dice que los mocks no entran al bundle, y la garantía **es que no exista
ruta de import desde `src/`**. Desde que hay dos directorios de mocks eso lo
verifica `mocks-fuera`, en la puerta.

**Las pruebas se agrupan en `tests/`, fuera de `src/`.** Espeja la estructura del
código, y la carpeta separada no es preferencia: los handlers de MSW son datos
falsos, y con ellos afuera **no existe ruta de import desde una superficie hasta
un mock** —F0.8 sostenida por la estructura y no por la revisión. El entorno por
defecto es `node`; el archivo que renderiza pide jsdom con
`// @vitest-environment jsdom` en la primera línea. Ver `tests/README.md`.

**Una prueba nueva se verifica rompiendo el código a propósito.** Si no la viste
fallar, no demostró nada.

**Y la mutación se corre sobre una línea de base VERDE.** Las dos mitades fallan
distinto y las dos ya ocurrieron acá: una mutación que **no se aplicó** —por
indentación o por comillas— se lee igual que una prueba débil, y una mutación que
corre sobre un árbol **ya roto** se lee igual que una prueba fuerte, porque mata
algo que ya estaba muerto. El 2026-09-15 las ocho mutaciones de F4.7 salieron en
verde sin demostrar nada: el arnés corría toda la carpeta y ahí adentro había una
prueba rota por otra razón. El arnés corre la base primero, sale 1 si el texto a
mutar no está, y sale 2 si la base no está verde.

**Y el fixture se escribe desde el contrato, no de memoria.** El 2026-09-04, al
escribir las pruebas que faltaban, se escribieron de memoria tres fixtures y el
yaml corrigió los tres: `columnas` pide `titulo` y `numerica` —no `etiqueta`—, y
los pilares de `prosa` piden `label`. El tercero es el que enseña: el rótulo
salía vacío y **la prueba pasaba igual**, porque solo miraba el `valor`. Una
prueba escrita desde un fixture inventado verifica el fixture.

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

**La consola corre contra el servicio real desde el 2026-09-14.** Doce paneles
con datos del negocio, cero en `ERROR`. Para levantarla hacen falta los dos
lados: `npm run dev` acá y, en `~/Documents/GitHub/synapse-api-go` (rama
`feature/dynamic-dashboard-backend`), `make run` — **nunca con
`DB_AUTO_MIGRATE=true`**, que la base es una RDS compartida y no una local.

**Es UN servicio, no dos.** `/auth/*`, `/config/*` y `/admin/*` cuelgan del mismo
`/api/v1` del mismo binario, y el proxy de Vite manda `/api/v1` entero a `:4010`.

**El backend no implementó `contracts/synapse-api.yaml`, y la diferencia la
absorbe `src/api/adapt.ts`.** El contrato sigue siendo la forma interna: lleva
`ventana`, `base`, `grano` y `direccionSemantica`, que son los campos sobre los
que se sostienen «ningún número desnudo» y «toda métrica declara su BASE».
`render/` y `catalog/` no cambiaron ni una línea.

**La regla del adaptador: renombra y reformatea; no calcula, no inventa una cifra
y no escribe copy de producto.** Donde el cable no trae el campo, el campo queda
ausente y hay **una prueba que lo atestigua** en vez de una aserción borrada —
una prueba borrada no avisa cuando el campo aparece.

### Hecho

**F1.32–F1.37 y F1.40.** El cable transcripto (`contracts/synapse-console-wire.yaml`,
con `console-drift` en la puerta), el adaptador entero, las rutas y el envelope de
error, una sola base de API, y la presentación llegando al cuerpo.

**El conteo de tareas, pruebas y chequeos no se escribe acá**: sale de
`docs/ESTADO.md`, que se genera. Un número citado en prosa se vence sin que nadie
lo note — lo encontró la auditoría del 2026-09-14 con «once chequeos» cuando ya
eran quince.

**F1.39 está hecha de hecho aunque figure pendiente**: el humo contra el servicio
real se corrió y encontró **una sola diferencia** con el yaml —
`semantic_direction` es texto ya redactado (`HIGHER = BETTER`) y no un código—,
ya corregida. Falta escribir su cierre.

### Lo que sigue

**La Fase 4 está en 13 de 23**, cerrada el 2026-09-15 hasta donde el cable y el
diseño alcanzan. Las cuentas exactas salen de `docs/ESTADO.md`, que se genera —
no se escriben acá, que es como se vencen sin que nadie lo note.

**Lo que queda y qué lo frena, que no es lo mismo en cada una:**

| | Espera |
|---|---|
| **F4.9 · canvas** | Una **decisión de diseño**. Hay propuesta escrita: `docs/PROPUESTA-CANVAS-2026-09-15.md` |
| F4.4 · agente Snowflake | B3.9 · existe `POST /admin/agents` y nada más. Lo que falta no es el CRUD sino **el estado del acceso**: vigente, cuándo se verificó, qué hacer si no |
| F4.17–F4.21 | Formas que el backend no materializa, y `/config/plots` |

**F4.3 y F4.12 están construidas y en ⚠️**, contra el cable del fork y con MSW.
Lo que les falta para ✅ es distinto en cada una: F4.3 no tiene la lista de
usuarios de A3 —**ninguna ruta lista usuarios**, solo existe `POST /admin/users`—
y F4.12 no trae cifras, que es una decisión de B4.9 con su razón escrita, no un
olvido.

**B4.8 y B4.9 están escritas y en ⚠️, no en ✅.** El código vive en
`gerardoriarte-bt/synapse-api-go`, rama `feature/roles-y-preview`, partida del
mismo commit que `backend-drift` declara. **No hay PR**: cómo vuelve el código a
ellos sigue sin decidirse, y esa decisión va antes del primer merge. Se quedan en
parcial porque la regla de este repositorio es que una `B*` solo pasa a ✅
**verificada contra el servicio corriendo**, y el fork no está desplegado.

**Las cinco rutas del fork SÍ están en el cable**, marcadas `x-origen: fork` y
con el aviso de que el servicio desplegado devuelve 404. Es lo que deja construir
F4.3 y F4.12 contra MSW, igual que se construyó la consola entera.

**Lo que NO conviene tomar todavía:** F1.13b, F1.31 y F4.21 esperan campos o
rutas que siguen en `docs/PARA-BACKEND.md`.
### Lo que se ve mal y es del backend

La línea de BASE sale `Base · COMPLETED · MONTH ·` con el separador colgando
porque falta `ventana` (B1.25). Los períodos salen como ids crudos —`2026-09`—
porque no hay locale ni etiqueta. Y ningún panel que no sea escalar trae
`presentacion`, que choca con «ningún número desnudo».

**El estado de B1.13–B1.19 está en `docs/ESTADO-B1.13-B1.19-2026-09-14.md`**,
verificado contra el servicio corriendo y con la tabla que mapea nuestra
numeración contra la de ellos, que **no coincide**.

### Del lado de datos

**Snowflake ya está hecho, y lo que falta es correr el sync.** El equipo de datos
entregó B1.22–B1.24 el 2026-09-15 —`docs/snowflake/synapse-catalogo-metricas.md`—:
la vista `SYNAPSE_METRIC_CATALOG` existe en `DB_BT_UA.BT_UA_MART_ANALYTICS`, con
sus textos de gobierno firmados, la vista de validación en cero filas y el grant
para `SYNAPSE_APP_ROLE`.

**Y `make sync-catalog` no se corrió**, lo cual se ve desde acá: `/config/catalog`
devuelve las **doce** claves de la semilla de Postgres —`sales`, `investment`,
`executive_summary`…— y no las **diez** de Snowflake —`revenue`, `spend`,
`platform_return`…—. Dos de las doce de hoy **no están** en Snowflake:
`executive_summary` y `decisions`, que son los paneles de prosa y recomendación.

**`MEASUREMENT_WINDOW` existe en la vista con valor en las diez**, así que B1.25
ya no espera a Snowflake: espera dos líneas de Go. Y el nombre del campo JSON lo
acordamos nosotros — **que sea `measurement_window`**, igual que la columna: al
adaptador le da lo mismo y un tercer nombre es una traducción más que mantener.

**Nosotros no corremos nada en Snowflake.**

### Pendiente que no es código · diferido a propósito

**Rotar las credenciales de `docs/backdocs/environments.txt`** — contraseña de la
RDS de producción, `JWT_SECRET`, `DATA_ENCRYPTION_KEY` y llaves de AWS activas.
**Nunca llegaron al historial de git**, verificado con `git log -S`, y el archivo
está ignorado desde el 2026-09-14. Pero circularon por un archivo compartido.

**Decidido el 2026-09-15 (humano): se hace más adelante.** Queda escrito acá y no
en el plan porque no es una tarea del front — es operación. **Está diferido, no
olvidado**: si alguien lo vuelve a levantar, ya se decidió.

**Para el contexto de cómo se llegó hasta acá**, las bitácoras cuentan lo que
costó descubrir y no está en el log: `docs/BITACORA-2026-09-02.md` la jornada que
cerró la Fase 1, `docs/BITACORA-2026-09-04.md` los dos días que dejaron el front
esperando al contrato, y **`docs/BITACORA-2026-09-14.md` los días en que apareció
el backend y resultó hablar otro idioma** — ahí están los aprendizajes de la
integración, incluido el que más sirve: **un mock que habla el idioma de tu capa
interna no prueba la frontera, la esconde.**
