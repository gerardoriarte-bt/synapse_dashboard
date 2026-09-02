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

**Tres normativos viven en el repositorio hermano** `~/Documents/GitHub/synapse_v2`
(`gerardoriarte-bt/Synapse-v2`), que está archivado pero **sigue siendo la fuente
de las reglas de producto**:

| Archivo | Qué manda |
|---|---|
| `design/design.md` | Reglas duras de producto. Normativa |
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
2. **`src/api/generated.ts` se genera** con `npm run gen:api`. Editarlo a mano se
   pierde en la próxima corrida y produce deriva silenciosa.

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

**`render/` no acepta `className` desde afuera.** §4 regla 9 pide que todo color,
radio y espaciado salga de tokens, y una clase inyectada por el llamador es el
agujero por donde entra un valor que no lo es — **y uno que el lint no puede
tapar de otra forma**, porque mira el archivo donde la clase se escribe y no
donde se aplica. El componente es dueño de su apariencia. Decidido el 2026-09-02;
con eso se borró `lib/cn.ts` y sus dos dependencias, que no tenían qué fusionar.

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
| `npm run token-drift` | `src/tokens/tokens.css` == las 57 variables del `.pen` |
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

**Las dos fuentes normativas del hermano son requisito de la puerta.**
`spec-anclas` necesita `design.md` y `token-drift` necesita el `.pen`, los dos en
`~/Documents/GitHub/synapse_v2/design/`. Sin ellos los chequeos salen BLOQUEADOS
en vez de mentir; se reapuntan con `SYNAPSE_DESIGN` y `SYNAPSE_PEN`.

**Una regla nueva se verifica rompiendo el código a propósito**, igual que una
prueba. El antecedente es concreto:
el 2026-08-20, en el repositorio archivado, el colapso responsive violaba §3.1 de
tres formas distintas **con 184 pruebas en verde**, porque estaban escritas
mirando el código. Una prueba escrita desde la implementación no puede fallar
nunca, ni cuando el código está mal.

## Dónde retomar

Leer `plan-de-trabajo.md`: las seis decisiones cerradas explican por qué el plan
tiene las tareas que tiene, y el camino crítico dice qué desbloquea a más gente.

Abierto ahora mismo:

1. **F0.5 y B0.10** — el login lo coloca el backend, reciclado de otro front.
   Faltan tres respuestas de integración: con qué clave se guarda el token, si el
   login vive en otro origen (`localStorage` no cruza orígenes), y adónde
   redirige un `401`.
2. **F1.13a → F1.13j · el traslado de `render/`**, ya con puerta y runner
   detrás: F0.9 y F0.11 cerraron el 2026-09-02. Van en ese orden —las primitivas
   no dependen de nada, los cuerpos dependen de todo lo anterior—, y cada tarea
   que llene `render/bodies/` o `render/plots/` le devuelve cobertura a L2 y L6.
3. **La rebanada vertical** — shell + `Label`/`Value` + dos cuerpos sobre los
   handlers de MSW que ya existen en `tests/mocks/`, para ver la consola dibujar
   de punta a punta antes de que exista el backend.
4. **B0.9** — las cinco `# PREGUNTA:` abiertas del contrato.
