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

**Y `pen-pantallas` lo hace cumplir desde el 2026-09-21**: no se construye una
pantalla dibujada sin declarar que se miró el dibujo.

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
├── tokens/      los tokens del .pen, tema, fuentes
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

**EL PRODUCTO HABLA ESPAÑOL · decidido el 2026-09-25 (humano).** Se levantó la
pregunta al ver la pantalla mezclando los dos idiomas, y **la premisa era al
revés de lo que parecía**. Medido ese día contra las cuatro fuentes:

| Fuente | Idioma | Quién la controla |
|---|---|---|
| **El `.pen`** · normativo para el literal de UI | **Español** · `Resumen ejecutivo`, `TODOS LOS CANALES`, `PERÍODO` | Diseño · no lo modificamos |
| **El catálogo de Snowflake** · el real, firmado | **Español** · `Ingresos`, «Venta total del sitio medida por Adobe Analytics…» | Datos |
| Nuestro chrome | Español | Nosotros |
| La semilla del backend | **Inglés** · `Executive summary`, `ALL CHANNELS` | Backend |
| El copy de estados · `reason`, `unlocks_with` | **Inglés** | Backend |

**El inglés que se ve en pantalla no es el producto: es la semilla, y está
derivada del dibujo.** El `.pen` dice `Resumen ejecutivo` donde la semilla dice
`Executive summary`, y `TODOS LOS CANALES` donde dice `ALL CHANNELS` — alguien
tradujo el mockup al escribirla. Cuando los dos paneles de prosa dejen de
servirse desde la semilla, el inglés se va casi solo.

Pasar todo a inglés costaría que **datos recure las diez métricas que acaba de
firmar**, que **el `.pen` se retraduzca** —y es normativo, no lo tocamos—, ~189
cadenas en 63 archivos nuestros con sus pruebas, y 43 documentos. A cambio
arreglaría **dos cosas que son del backend** y que ya están pedidas en
`docs/MENSAJE-2026-09-25-backend-chat-y-rebase.md`.

**El dueño del copy que describe datos es el CATÁLOGO**, y por eso el adaptador
no escribe copy de producto: si tradujéramos acá, el día que cambie el texto de
origen tendríamos una tabla de traducción que nadie mantiene. Un texto en inglés
en pantalla es un pedido a quien lo emite, no un arreglo nuestro.

**Lo que queda en inglés pase lo que pase**, y está bien: los identificadores,
las claves del cable —`status`, `value`, `reason`— y las capas Medallion
—`GOLD`, `SILVER`—, que son nombres propios de la arquitectura.

**El multi-idioma es una fase posterior, y su forma ya está decidida: el idioma
es del TENANT y viaja en el catálogo**, que es de donde sale todo el copy que
describe datos. Cablear inglés «por si acaso» no resuelve eso y tira el trabajo
de datos. Lo que faltaría es una capa de i18n para nuestro chrome, que hoy no
existe — ese sí sería trabajo nuestro, y no se toma hasta que haya un tenant que
lo pida.

## Tokens bajo Tailwind v4

Los tokens viven en `src/tokens/tokens.css` con el espacio de nombres que
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
| `npm run pen-pantallas` | cada pantalla dibujada en el `.pen` tiene quien la declare |
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
| `npm run afirmaciones` | lo citable de `docs/` se verifica · método+ruta, commits y tareas |
| `SYNAPSE_EMAIL=… SYNAPSE_PASSWORD=… npm run humo` | el servicio real == los dos yaml transcriptos |
| `docker compose -f dev/postgres/docker-compose.yml up -d` | **la base local** · desde el 2026-09-22 · ver `dev/postgres/README.md` |

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
las 15 reglas y `spec-anclas` ancla las suyas. Si vuelve a aparecer un ⊘, es que una
regla se quedó sin ámbito o una cita de `design.md` dejó de tener quien la
verifique — no es ruido.

### `npm run dev:mock` · para MIRAR, no para verificar

**Nació porque media Fase 4 no se podía ver corriendo**, y esa razón se achicó
el **2026-09-16**: `gerardo.riarte@buentipo.com` pasó a rol `Admin` —lo hizo el
backend, no nosotros— y `/admin/*` dejó de dar 403. El claim se compara contra
`roles.name` **normalizando la mayúscula**, así que `Admin` entra.

**Lo que sigue sin verse contra el servicio son las rutas del fork** —B4.8 y
B4.9—, que no está desplegado: 404. Para esas dos pantallas el modo mock sigue
siendo la única forma de recorrerlas.

**Y el humo de `/admin/*` ya corrió** · 2026-09-16, las ocho rutas contra
`synapse-admin-wire.yaml`, campo por campo. **El PascalCase quedó confirmado y no
deducido**: `ID`, `TenantID`, `Status`, `VersionID`, `PublishedAt`.

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

**ANTES DE CONSTRUIR UNA PANTALLA SE ABRE EL `.pen`. ES CONDICIONANTE.**

No es una recomendación y no se decide por caso: **si la pantalla está dibujada,
se mira el dibujo antes de escribir la primera línea.** Y si no se sabe si está
dibujada, se comprueba — son tres líneas de Python y están más arriba.

**La regla estaba escrita y falló dos veces.** La primera hasta el 2026-09-15:
`CLAUDE.md` decía que el `.pen` eran «los tokens» y se construyeron diez
pantallas de admin y builder sin abrirlo. Se corrigió la línea. **La segunda fue
el 2026-09-21, con la corrección puesta**: `C3 · Chat expandido`,
`C3 · Chat · historial colapsado` y `A2 · Ficha de cliente` estaban dibujadas, se
construyeron F3.3, F3.7, F3.13 y F4.4 encima, y no se abrió ninguna. La hoja del
chat mide 480 donde el `.pen` dibuja 940, con riel lateral y estado colapsado.

**Una advertencia que no se puede comprobar no es una regla**, así que desde el
2026-09-21 hay un chequeo: `npm run pen-pantallas`, en la puerta. Lista las 33
pantallas del `.pen` y **falla con cualquiera que no esté declarada** en el
registro del plan, con el archivo que la implementa o la razón por la que
todavía no. El archivo lleva el ancla `§PEN:<id>`, que se escribe mirando el
dibujo — ese es el punto.

**Lo que el chequeo NO hace es comparar el dibujo con la pantalla.** Eso no se
automatiza: que la hoja midiera 480 lo encontró un humano. Lo que garantiza es
que la comparación se haya hecho y que su resultado esté escrito. El inventario
de lo que quedó distinto está en
`docs/AUDITORIA-2026-09-21-pen-vs-chat-y-ficha.md`.

**LO QUE EXISTE PARA MIRARSE, SE ABRE.** Es la otra mitad de la regla de abajo,
y no se automatiza. El 2026-09-16 y 17 aparecieron **ocho defectos y los ocho
salieron de usar la aplicación**: el modo mock nunca se había abierto —pantalla
en negro, React Router avisando por consola—, sus payloads estaban inventados, y
el dashboard publicado se veía apilado **con doce paneles bien compuestos
detrás**, porque `readingOrder` reordenaba el DOM y CSS grid coloca en ese orden.

**Ninguno lo encontró una prueba, ninguno la puerta, y ninguno `afirmaciones`**
—que mira prosa, no pantallas—. Las pruebas cubren lo que se les pide; lo que no
se les ocurre pedirles aparece al abrirlo. Antes de dar por construida una
pantalla, **hay que verla**. Ver `docs/BITACORA-2026-09-17.md`.

**NADA SE ESCRIBE DE MEMORIA — y eso ya no es solo para los fixtures.**

La regla de abajo estaba acotada a las pruebas y se cumplía ahí. El 2026-09-16
esa misma falla apareció **cinco veces fuera** de las pruebas, y una de ellas
estuvo a punto de irse al equipo de backend: la tabla de quince bloques del modo
mock con las quince filas mal, «cero churn» sobre un commit con 62 borrados,
«ocho mocks» cuando eran tres, y `PUT /admin/tenants/{id}/roles` cuando el propio
yaml ya decía `/admin/roles/{roleId}`.

**No son cinco descuidos: es uno, cinco veces.** Vale para todo lo que se
afirma — un comentario, una tabla, un commit, un documento que sale del
repositorio. **Si se puede leer de la fuente, se lee.** Y si la fuente es un
endpoint, **se captura y se anota de dónde salió con qué fecha**, en vez de
transcribirla.

Lo sostiene `afirmaciones`, en la puerta desde el 2026-09-16: método+ruta contra
los contratos, commits alcanzables desde una rama, identificadores contra el
plan. **No verifica que algo sea verdadero, solo que sea citable** — lo que cubre
es citar mal lo que está a dos archivos de distancia, que es la clase barata y
frecuente.

**UN BLOQUEO ESCRITO NO SE RAZONA POR ENCIMA.** El 2026-09-16 se tomaron
F4.17–F4.20 con el plan diciendo «se construyen cuando el backend envíe esas
formas, no antes» y la instrucción diciendo «no tomar». Había un argumento —que
la razón citada había vencido— y era cierto **a medias**: de las dos razones, una
había vencido y la otra no, y era la que mandaba.

Lo grave no es la conclusión equivocada. Es haber tratado una decisión escrita
como una opinión a revisar. **Si el bloqueo parece vencido, se dice y se
pregunta; no se resuelve solo y se empieza a construir.**

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

### ⇩ ACÁ SE PARÓ · 2026-09-24 · el dashboard con dato real, esperando al materializador

**Lo que costó descubrir está en `docs/BITACORA-2026-09-24-tarde.md`** —la tarde,
que es donde el dato se volvió real y contradijo cuatro cierres— y en
`docs/BITACORA-2026-09-24.md`, la mañana. Los días anteriores en
`docs/BITACORA-2026-09-22.md` y `docs/BITACORA-2026-09-21.md`. Esto es dónde
retomar.

**EL DASHBOARD MUESTRA EL NEGOCIO, y el chat contesta.** Las dos cosas que
llevaban un mes sin verificarse contra su fuente. El camino completo corre:
vista de Snowflake → `sync-catalog` → `materialize` → `panels:batch` → pantalla,
en los doce períodos, y el selector navega entre ellos con dato distinto en cada
uno. Ver `docs/BITACORA-2026-09-24-tarde.md`.

**LO PRIMERO, Y NO ES CÓDIGO: mandar el mensaje al materializador.** Es lo único
que frena, y frena dos cosas visibles en pantalla.

| Para | Qué pide | Dónde |
|---|---|---|
| **Backend** | Que el materializador emita `presentation`; que `preserved` / `last_success_at IS NULL` degrade en vez de servirse `AVAILABLE`; y acordar el camino de los paneles de prosa | `docs/MENSAJE-2026-09-24-materializador.md` |
| **Datos** | Recurar las seis filas de `SEMANTIC_DIRECTION` que traen el código en vez del texto | El SQL ya lleva la decisión y la vista de issues las detecta sola |

**Lo que cada uno destraba:** con `presentation`, los seis KPI recuperan su
medidor y sus comparativos —hoy son una cifra sola—; con el degradado, la consola
deja de contradecirse; y con el camino de prosa acordado, se puede construir el
resumen, que es el primer panel de la pantalla.

**Los dos mensajes del 22 ya se mandaron y se resolvieron** · datos habilitó la
IP y registró la clave, backend corrigió el host en `61d16da`. Quedan como
histórico.

**Lo que sigue sin verificarse contra Cortex es lo de más abajo del chat**:
F3.15 —la presencia del chat en todas las pantallas, que el `.pen` dibuja y nunca
construimos— espera que `POST /config/chat` acepte contexto de pestaña.

**Cuatro decisiones humanas del 2026-09-22, ya ejecutadas**: el contexto del chat
pasa a ser de pestaña —cierra §5 y reemplaza la del 17—, el logotipo a color va
**donde el `.pen` lo manda** y no en el chrome, los radios y el velo son los que
la escala ya tiene, y el punto de miles del `.pen` es un descuido que diseño
retipea. Las abiertas están juntas en
`docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md`.

**Antes de medir al backend, mirá qué binario está corriendo.** El de `:4010` es
el fork, y sus campos se ven como avance de ellos. La medición sólo cuenta
contra upstream limpio — el corte está en `docs/ESTADO-backend-2026-09-22.md`.

**EL CHAT FUNCIONA · 2026-09-24.** Contra Cortex de verdad, desde la consola:
el agente `SYNAPSE_UA` contesta, el markdown se pinta, el riel guarda el hilo y
la respuesta cita el panel de origen. Datos habilitó la IP y registró la clave;
backend corrigió el host en `61d16da` —con validación, mejor que el parche que
habíamos probado— y de paso el ping real y el cuerpo de los errores de Cortex.

**Y al abrirlo apareció que el chat NUNCA había autenticado.** `askSynapse` usa
`fetch` crudo —lo único que deja leer el cuerpo como stream— y al escribirlo
aparte de `client.ts` se copiaron las dos cabeceras del SSE y **no la
`Authorization`**. El servicio contestaba **401 en 170 µs** —el middleware, no
Snowflake— y el mensaje lo atribuía al agente. **MSW no podía verlo**: sus
handlers no exigen el token, así que responden igual con credencial y sin ella.
Es la familia de F1.38 con otra cara, y **lo encontró abrir la aplicación**, no
la puerta.

**Lo que el chat todavía NO hace es dibujar la cifra.** Ver §7 de
`docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md`: el agente contesta con la
forma que la pregunta necesita —`tabular`, `raw`— y F3.6 dibuja con el cuerpo del
panel de origen, que casi nunca la acepta. La rama de excepción resultó ser el
caso común.

**LO QUE FRENABA EL CHAT YA NO SON LAS MIGRACIONES · corregido el 2026-09-22.**
Hasta acá decía que lo único que frenaba era B3.11. **Venció**: la base local de
`dev/postgres` las corre con `DB_AUTO_MIGRATE=true`, y con las tablas creadas
`POST /config/chat` deja de dar 500 y devuelve **409 · «no hay agente activo
disponible para este tenant y rol»**.

**Lo que frena ahora es un agente con credenciales de Snowflake**, y es más duro:
`GET /admin/tenants/{tenantId}/agents` devuelve `[]`, un agente necesita cuenta,
usuario, rol y clave privada, y **el servicio no tiene modo sin Cortex** —
`cortex_chat.go` habla contra Cortex de verdad—. Nosotros no corremos nada en
Snowflake. Así que las once tareas cerradas de Fase 3 siguen verificadas **sólo
contra mocks**, y no hay forma de cambiarlo desde acá.

B3.11 **sigue abierta igual**: su criterio pide las nueve columnas en la base
**compartida**, y esa no responde desde acá.

**Y una trampa que casi nos cuesta caro · 2026-09-22.** Medir el backend con el
**fork corriendo** hace que nuestro propio código se vea como avance de ellos:
`measurement_window`, `open_period`, `user_count`, `last_published_at`,
`PublishedBy` y la ruta `/diff` parecían ser B1.17, B1.25, B1.27, B4.1 y B4.2
llegando, y **las seis las escribimos nosotros** en `2fafe82`. La medición sólo
cuenta contra **upstream limpio**, en un worktree aparte. El corte con la tabla
completa está en `docs/ESTADO-backend-2026-09-22.md`.

**Los pedidos vigentes son dos, y van a equipos distintos** · corregido el
2026-09-22 · **el agente de Cortex lo maneja DATOS, no backend**:
`docs/MENSAJE-2026-09-22-datos-agente-cortex.md` —el par de claves RSA para
`SYNAPSE_SERVICE_USER` y dos grants— y `docs/MENSAJE-2026-09-22-backend-roles-y-hallazgo.md`
—cargar el agente, la colisión de `/roles` y el hallazgo del `Tenant` embebido—. El del 21
quedó como registro: su tarea 1 sigue en pie sólo para la base compartida, y su
tarea 2 la cerró F3.6 con el tipo del panel.

**ANOTADO Y NO TOMADO · `168a761` · la Fase 5 del backend.** Llegó el 22 junto
con `55e8419` y **se decidió no trabajarlo hasta cerrar las fases previas**.
Trae nueve rutas nuevas y 62 archivos:

| Ruta | Qué abre |
|---|---|
| `POST /config/panels/{panelId}/drilldown` y `.../dimensions` | **C2 · el drill-down** · hoy F3.9, diferida por D3 |
| `/admin/tenants/{tenantId}/dashboards` · GET y POST, más `PUT /admin/dashboards/{id}` | **Multi-dashboard** · F5.1 espera justo esto |
| `GET /admin/tenants/{tenantId}/roles` y `PUT /admin/roles/{roleId}/dashboards` | Asignar dashboards por rol · B4.10 |
| `GET /admin/layouts/{layoutId}/publications` y `/admin/dashboards/{id}/publications` | **B6 · historial de versiones**, que el `.pen` dibuja y está sin construir |

**Ninguna se transcribió al cable todavía**, que es la regla: una ruta
transcrita que nadie llama envejece sin que nadie lo note.

**El servicio «real» lo levantamos nosotros** · el proxy de Vite apunta a
`localhost:4010`. Por eso esa clase de pregunta no se manda: se corre. Descubrirlo
convirtió cuatro preguntas al backend en dos tareas.

**Lo que se cerró el 2026-09-21** · dieciséis commits, y el detalle por tarea
está en el plan: el defecto del SSE (F3.12), F3.3, F3.7, F3.13, F3.14, F4.4,
F5.10, y los cuatro de forma que salieron de la auditoría del `.pen` —F5.14 a
F5.17—. **Los conteos salen de `docs/ESTADO.md`, que se genera.**

**Y el `.pen` volvió a cobrar.** `C3` y `A2` estaban dibujadas, se construyeron
cuatro tareas encima y no se abrió ninguna — con la corrección de septiembre ya
escrita. De ahí salió **`pen-pantallas`**, en la puerta: ninguna pantalla
dibujada puede quedar sin declarar quién la implementa o por qué todavía no. El
inventario de lo que quedó distinto está en
`docs/AUDITORIA-2026-09-21-pen-vs-chat-y-ficha.md`.

**La auditoría quedó cerrada el 2026-09-22** con F5.18 —`ROLES Y COMPOSICIÓN`
en A2, su §9—, salvo dos que no son ajustes sino propuestas de spec.

**Y las propuestas de spec abiertas ya no viven sueltas en comentarios.** Las
del `.pen` están juntas en `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md`
—el radio y el velo de la hoja, los dos tamaños que la escala no emite, el
logotipo a color, el punto decimal, el contexto pestaña-contra-panel y las
fuentes del evento `auditoria`—, con un índice de dónde vive cada una de las
demás. **Las del contrato NO se copiaron ahí**: siguen en
`docs/B0.9-preguntas-abiertas.md`, que es su casa, y duplicarlas era el error
del 2026-09-14.

**Al leer el `.pen`, el frame antes que la nota.** Las notas cuentan el porqué;
los frames tienen los números y a veces lo que la nota no dice — el velo de la
hoja del chat y las tres superficies aparecieron así.

**El rebase se rehízo sobre `6e595e3` el 2026-09-25 y ESTÁ EMPUJADO**, en
`rebase-6e595e3` de `~/Documents/GitHub/synapse-api-go-fork` —`rebase-a643cfe` y
`rebase-prueba` quedan intactas—. Limpio y sin conflictos: `go build` ✓,
`go vet` ✓, y **+283 −13 en archivos de ellos**, idéntico al rebase anterior, que
es el número que dice que no se coló nada.

**`go test ./...` falla UNA prueba, y no es una regresión**:
`TestPreviewConMetricasOcultasDevuelveMenosPaneles`, por la compuerta de
`dd_config_service.go:415`. Se comprobó que sigue siendo esa línea — la lección
de los dos rebases previos es que **lo que rompe no es lo que conflictúa**, así
que después de un rebase limpio se corre `vet` y la suite entera igual.

**Y el fork se achicó solo, que era el objetivo.** Upstream absorbió dos de las
cinco partes del segundo commit: B4.2 —`168a761` trae auditoría de publicaciones
con acción, actor y rol, **y su propio `diff.go`**— y B4.4. Ese commit **se
reescribió** el 2026-09-24 con las tres que quedan —B1.25, B1.27 y B4.1— y son
dos commits sobre `a643cfe`:

| | |
|---|---|
| Churn total | **1400 inserciones, 13 borrados** |
| En archivos de ELLOS | **+283, −13** · los 13 son los cambios de firma que B4.1 obliga |
| `go build` y `go vet` | limpios |
| `go test` | **una** falla, y es la colisión de diseño de abajo |

**`ListForAdmin` va en `TenantRepository` y no en un repo nuevo**, para no
tocarles la firma del constructor. El costo es que la interfaz se propaga a
cuatro de sus mocks: se les agregó el método devolviendo vacío y nada más.

**Y `gofmt -w` sobre una carpeta suya volvió a morder** —tercera vez—: reformateó
`access_request_mailer_test.go`, 7 líneas que nadie había tocado. Se revirtió. La
regla sigue siendo **no formatear archivos de ellos**, y el modo de falla es
correr el formateador sobre un directorio en vez de sobre los archivos propios.

**La colisión de `/roles` se resolvió como propusimos**: nuestro listado se corrió
a `GET /admin/tenants/{tenantId}/roles/composition` y el suyo no se tocó.

**Pero apareció una segunda colisión, y es de diseño.** `168a761` agregó en
`resolveLayout` una compuerta —`if layout.Status != published &&
!isAdminRoleName(role.Name) { return nil, nil }`— que **rompe el preview por
rol**: el preview pasa el rol SIMULADO, que no es admin, así que un borrador se
rechaza. Confunde quién pregunta con a quién se simula. No lo muestra el
conflicto ni el compilador: lo encontró una prueba nuestra. **Es una decisión
pendiente**, no un arreglo.

**El rebase viejo sigue en `rebase-prueba`**, sobre `82da946`. Son dos hunks de
adyacencia pura más un rompimiento que el conflicto no muestra: su commit agregó
`FindByID` a `ports.DDPanelRepository` y nuestro mock no lo implementaba —
**`go build` pasaba; lo encontró `go vet`**. La receta está en
`docs/PLAN-INTEGRACION-2026-09-17.md`.

**`backend-drift` sale ✗ a propósito.** La línea `commit` del cable declara
`733c13c` y ellos están en `82da946`. Se transcribieron **tres rutas** de ese
commit —`/config/chat`, `/config/chat/threads` y `chat-suggestions`— marcadas
`x-origen: 82da946`; las otras seis del cable no se reverificaron, así que mover
la línea diría que sí. La herramienta no sabe expresar «reverificado en parte».

---

**Desde el 2026-09-22 la base es LOCAL, en Docker.** La RDS compartida dejó de
responder desde acá y el equipo de backend recomendó el cambio. La receta entera
está en `dev/postgres/README.md`; en corto son cuatro pasos y **no hace falta
bajar ningún dump**: con `DB_AUTO_MIGRATE=true` el binario crea el esquema, corre
las migraciones y siembra los doce paneles.

**Y ahí `DB_AUTO_MIGRATE=true` deja de estar prohibido.** La regla decía «nunca»
y su razón era la RDS compartida —correr migraciones ahí es un cambio de esquema
en producción—. **En un contenedor descartable esa razón no existe**, y es lo que
destrabó un mes de trabajo sin verificar. Contra la RDS la prohibición sigue en
pie; lo que cambió es contra qué base se corre.

**La consola se verificó contra el servicio el 2026-09-14** —doce paneles, cero
en `ERROR`— y de nuevo el 22 contra el local, con `npm run humo` pasando las
cinco rutas de consola y las de admin campo por campo.

**Y DESDE LA TARDE DEL 2026-09-24 EL DATO ES DEL NEGOCIO.** Hasta esa mañana los
doce paneles pintaban **la maqueta del `.pen` sembrada en Postgres** —cero
corridas de materialización, `0 de 72` filas con `last_success_at`, las doce
claves de la semilla y no las diez de la vista— y llevaba diez días sin decirse.
Con el host corregido en `61d16da`, `sync-catalog` corrió —`created=6 updated=4
catalog_version=2`— y detrás los doce períodos, todos `available=16 blocked=2
errors=0`.

**Lo que enseñó, y es lo que conviene no perder:** «verificado contra el servicio
real» y «verificado con datos reales» son dos afirmaciones distintas, **y la
primera se dice sola**. En una tarde el camino real contradijo **cuatro** cosas
dadas por cerradas —`semantic_direction`, `presentation`, las claves del catálogo
y la cabecera del panel—, y dos de esos cierres llevaban la misma fecha: el
2026-09-14, el día en que apareció el backend y todo se verificó contra lo que
ese backend traía puesto.

**De ahí sale una regla de cierre:** una tarea cerrada dice **contra qué** se
cerró. «CERRADA contra el servicio real» se lee como definitivo y era una foto de
la semilla.

**Lo que el dato real todavía no trae** está pedido en
`docs/MENSAJE-2026-09-24-materializador.md`: el materializador no emite
`presentation` **y al correr pisa la que traía la semilla**, así que los seis
paneles `kpi` quedaron como una cifra sola; y las dos filas que Snowflake no
tiene —`executive_summary` y `decisions`— siguen sirviéndose `AVAILABLE` con el
valor viejo, así que el resumen dice «4.28M» en los doce meses mientras las
cifras de al lado cambian todas.

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

**Siete tareas de backend están escritas en un fork, y las siete en ⚠️.** El
código vive en `gerardoriarte-bt/synapse-api-go`, rama `feature/roles-y-preview`:

| Commit | Qué |
|---|---|
| `d326ebf` | B4.8 · CRUD de roles · y B4.9 · preview por rol |
| `6f10b8e` | B1.25, B1.27, B4.1, B4.2 y B4.4 |

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

**Quedan en ⚠️ y no en ✅** porque la regla de este repositorio es que una `B*`
solo pasa a ✅ **verificada contra el servicio corriendo**, y el fork no está
desplegado.

**La segunda tanda agrega cinco columnas, y las migraciones NO se corrieron.** Las
aplica `AutoMigrate` y **la base es la RDS compartida de producción**: escribir el
campo es código, correrlo es un cambio de esquema en producción y esa decisión no
es nuestra. Las cinco son aditivas y con default.

**No hay PR contra su repositorio ni lo va a haber**: decidido el 2026-09-15,
**el código vuelve DESDE nuestro repositorio** y ellos lo toman cuando quieran.

**Sí hay un PR, y vive en NUESTRO fork** · 2026-09-16 ·
<https://github.com/gerardoriarte-bt/synapse-api-go/pull/1>. Va de
`feature/roles-y-preview` contra nuestra copia de su rama, y **desde el
2026-09-25 las dos están al día**: la base avanzó por fast-forward a `6e595e3` y
la cabeza se reescribió con el rebase. El PR muestra **30 archivos, +1400 −13**,
que es exactamente lo medido local.

**Ese force-push es parte del mecanismo, no un accidente**: mantener la rama
rebasada es lo que la regla pide, y el costo es que un comentario anclado a un
commit viejo se desprende. Se hace con `--force-with-lease`, y la base se mueve
aparte porque **avanzarla no reescribe nada**.

**Existe para que lo lean y comenten, no para mergear**, y no escribe una línea
en `AntPack-dev/synapse-api-go`. Es la forma de darles una revisión cómoda sin
romper la regla. Eso nos obliga a mantener
la rama rebasada (`backend-drift` antes de tocarla), a commits que se expliquen
solos, y a **cero churn en su código**.

**Y paramos acá hasta que tomen lo que hay.** «Un fork que nunca vuelve es un
segundo backend»: con dos endpoints era una excepción, con siete es una
implementación paralela que alguien va a tener que reconciliar.

**Las cinco rutas del fork SÍ están en el cable**, marcadas `x-origen: fork` y
con el aviso de que el servicio desplegado devuelve 404. Es lo que deja construir
F4.3 y F4.12 contra MSW, igual que se construyó la consola entera.

**Lo que NO conviene tomar todavía:** F1.13b, F1.31 y F4.21 esperan campos o
rutas que siguen en `docs/PARA-BACKEND.md`.
### Lo que se ve mal y es del backend

La línea de BASE sale `Base · COMPLETED · MONTH ·` con el separador colgando
porque falta `ventana` (B1.25). Los períodos salen como ids crudos —`2026-09`—
porque no hay locale ni etiqueta. Y **lo de `presentacion` era nuestro
error**: la lee solo `KpiBody`, y los demás cuerpos sacan sus rótulos del propio
valor —`BarsBody` usa `i.etiqueta` de cada ítem—. «Ningún número desnudo» lo
cumple la estructura del dato. Corregido el 2026-09-15 · ver B1.13.

**El estado de B1.13–B1.19 está en `docs/ESTADO-B1.13-B1.19-2026-09-14.md`**,
verificado contra el servicio corriendo y con la tabla que mapea nuestra
numeración contra la de ellos, que **no coincide**.

### Del lado de datos

**Snowflake está hecho y el sync YA CORRIÓ** · 2026-09-24. El equipo de datos
entregó B1.22–B1.24 el 2026-09-15 —`docs/snowflake/synapse-catalogo-metricas.md`—:
la vista `SYNAPSE_METRIC_CATALOG` existe en `DB_BT_UA.BT_UA_MART_ANALYTICS`, con
sus textos de gobierno firmados, la vista de validación en cero filas y el grant
para `SYNAPSE_APP_ROLE`.

**`/config/catalog` devuelve las diez de Snowflake** —`revenue`, `spend`,
`platform_return`…— y ya no las doce de la semilla. Las dos que no están en la
vista son `executive_summary` y `decisions`, y **eso no es un hueco de datos**:
no son métricas sino interpretación del agente, y su fila se cura **sin
expresión** porque un panel se ancla a un `metricId` y `dd_panels.metric_id` es
`NOT NULL`. Está escrito en el SQL que datos corre.

**Lo único que queda del lado de datos son seis filas**: las que traen
`SEMANTIC_DIRECTION` como código —`HIGHER_IS_BETTER`— donde va el texto
redactado. Sale en pantalla con guiones bajos. La séptima regla de
`SYNAPSE_METRIC_CATALOG_ISSUES` las detecta sola, así que no depende de que
alguien mire la consola.

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
