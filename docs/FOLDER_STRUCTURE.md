# Estructura del proyecto

Deriva de **§4 de `nuevo-desarrollo.md`**, que es normativo. Si esta guía y ese
documento difieren, manda el documento.

```
src/
├── main.tsx                punto de entrada · monta App con los providers
├── app/                    Router, providers, auth guard
│   ├── App.tsx
│   ├── auth/               session.ts (token) · AuthGuard.tsx (F0.5)
│   ├── providers/          QueryClientProvider + BrowserRouter (F0.3)
│   └── router/             routes.tsx: / · /admin/* · /builder/* (F0.4)
├── api/                    HTTP, cache y tipos. NO conoce JSX
│   ├── client.ts           fetch + bearer + envelope — SIN imports de mock
│   ├── hooks.ts            TanStack Query
│   ├── types.ts            los nombres del contrato + lo que no viaja
│   └── generated.ts        GENERADO desde el yaml — NO EDITAR A MANO
├── tokens/                 el sistema de diseño
│   ├── tokens.css          los 57 tokens en @theme static + tema claro
│   ├── base.css            fondo, cifras tabulares, anillo de foco
│   ├── fonts.css           Inter · Space Grotesk · JetBrains Mono
│   ├── tokens.ts           espejo en TS + familyVar()
│   └── theme.ts            el switcher: un atributo, cero JS de estilo
├── catalog/                SOLO tipos y validadores. La tabla llega por API
│   ├── blocks.ts           tipo ↔ forma ↔ span, sobre /config/blocks
│   └── types.ts
├── render/                 PURO — sin valores de api/ (sí `import type`)
│   ├── grid.ts             colSpan/rowSpan → px = 96·N − 16
│   ├── types.ts            BodyProps<F,P> y PlotProps<F>
│   ├── Panel/              shell con la anatomía obligatoria     · F1.15
│   ├── primitives/         Label · Valor · BadgeProcedencia      · F1.20
│   ├── bodies/             los 15 cuerpos, uno por TipoPanel     · F1.17-18
│   ├── plots/              SVG responsivo, y core/ de primitivas · F1.21
│   └── states/             los 6 estados                          · F1.19
├── surfaces/
│   ├── console/            C1 · el dashboard del usuario final
│   ├── admin/              superadmin: tenants, usuarios, catálogo · F4.1
│   └── builder/            composición visual de dashboards        · F4.6
├── lib/                    fuera de §4 · lo que pide el stack
│   └── cn.ts               clsx + tailwind-merge
└── assets/                 fuera de §4 · estáticos importados por el bundler
    ├── fonts/              VACÍA · las tres tipografías vienen de @fontsource
    └── images/             VACÍA

tools/                      la puerta de calidad                  · F0.11
├── gate.py                 el corredor · 0 conforme, 1 rojo, 2 BLOQUEADO
├── design-lint.py          las 15 reglas duras sobre utilidades de Tailwind
├── spec-anclas.py          cada regla de design.md ↔ su código ↔ su aserción
├── contract-drift.py       generated.ts == synapse-api.yaml
└── token-drift.py          tokens.css == las 57 variables del .pen

tests/                      TODAS las pruebas, espejando src/     · F0.9
├── setup.ts                MSW + los dobles de jsdom
├── mocks/                  handlers.ts · server.ts
├── api/                    client.test.ts
└── render/                 grid.test.ts
```

**`lib/` y `assets/` quedan fuera de §4.** `cn.ts` es la fusión de clases de
Tailwind (`clsx` + `tailwind-merge`) y existe solo porque el stack lo pide.
`assets/` son los estáticos que el bundler resuelve por import; hoy está vacía
—las tres tipografías se sirven desde `@fontsource`, no desde el repo— y se
conserva con `.gitkeep` para que el primer SVG de producto tenga adónde ir.

**`tests/` vive fuera de `src/` a propósito · F0.9.** Espeja la estructura del
código: `tests/render/grid.test.ts` prueba `src/render/grid.ts`. La carpeta
separada no es preferencia: los handlers de MSW son datos falsos, y con ellos
afuera **no existe ruta de import desde una superficie hasta un mock**. Es la
regla de `api/client.ts` —«sin imports de mock»— sostenida por la estructura en
vez de por la revisión. Detalle en `tests/README.md`.

## Reglas de capa

| Capa | Puede | No puede |
|---|---|---|
| `render/` | recibir props, formatear, pintar | fetch, contexto global, conocer el tenant |
| `surfaces/` | fetch, estado de UI, routing | lógica de negocio, SQL, filtrar permisos |
| `api/` | HTTP, cache, tipos | conocer JSX |

Las dos fronteras que no se cruzan:

1. **`render/` no importa VALORES de `api/`.** Los componentes reciben datos por
   props. Es lo que permite que el mismo panel funcione con la API real, con MSW
   y dentro del builder.

   **`import type` sí está permitido, y no es una excepción tolerada: es la
   regla.** El panel recibe el payload por props y la forma de esas props es
   `Payload`, que vive en `api/types.ts`; sin importar ese tipo no hay manera de
   tiparlo. Lo que la frontera impide es la dependencia **en tiempo de
   ejecución** —el cliente, el fetch, el cache—, y un `import type` se borra al
   compilar: con `verbatimModuleSyntax` ni siquiera llega al bundle.

   Un grep que busque `from '../api'` a secas marca falsos positivos —hoy
   marcaría `render/types.ts`, que está bien. El que vale excluye `import type`,
   y así lo implementa `L14` del lint en el repositorio archivado.
2. **`api/generated.ts` se genera.** Una edición a mano se pierde en la próxima
   corrida de `npm run gen:api` y produce deriva silenciosa.

## Tokens bajo Tailwind

Los 57 tokens del `.pen` viven en `@theme static` con el espacio de nombres que
Tailwind exige: `--color-panel` genera `bg-panel`, `--radius-xl` genera
`rounded-xl`, `--spacing: 4px` hace que `p-6` sean los 24px de padding de panel.

**El `static` no es opcional.** Sin él Tailwind poda toda variable que ninguna
utilidad mencione por escrito, y las rampas de familia se construyen en runtime
—`var(--color-fam-${familia}-1)`, con la familia que vino del catálogo—, así que
el escáner no las ve. Medido: sin `static` sobrevivían 6 de 43.

**Un hex literal es un bug.** Todo color sale de una utilidad de token o de
`var(--color-*)`. No hay excepción para «un gris rápido».

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Vite en :5173 |
| `npm run typecheck` | `tsc` en modo strict sin excepciones |
| `npm run build` | typecheck + build de producción |
| `npm run lint` | oxlint |
| `npm test` | vitest · corre lo de `tests/` |
| `npm run verify` | la puerta · `tools/gate.py` |
| `npm run design-lint` | las 15 reglas duras, en utilidades de Tailwind |
| `npm run spec-anclas` | `design.md` atado a su código y su aserción |
| `npm run contract-drift` | `generated.ts` == el yaml |
| `npm run token-drift` | `tokens.css` == las 57 variables del `.pen` |
| `npm run gen:api` | regenera `src/api/generated.ts` desde `../contracts/synapse-api.yaml` |

## Idioma

Decisión del 2026-08-31, y viene de `.cursorrules`:

- **Identificadores en inglés** — archivos, carpetas, componentes, funciones,
  tipos: `Console.tsx`, `panelStyle()`, `usePanelsBatch`, `BodyProps`.
- **Comentarios y documentación en español**, que es la lengua del equipo.
- **Textos de UI en español**, que es la lengua del producto.
- **Las claves del contrato NO se traducen.** `payload.valor`, `metric.familia`,
  `panel.tipo`, `estado: 'DISPONIBLE'` llegan como los declara el yaml.
  Renombrarlas crearía una capa de traducción en cada frontera, y el contrato es
  compartido con el backend.

Consecuencia visible: se lee `metric.familia` y `panel.colSpan` en la misma
línea. Es lo esperado — el lado izquierdo es nuestro, el derecho es del contrato.

**`tareas-front-back.md` nombra los cuerpos en español** (F1.18: `CuerpoKpi`,
`CuerpoGauge`, `CuerpoTable`). Bajo esta decisión son `KpiBody`, `GaugeBody`,
`TableBody`. Los IDs de tarea no cambian.
