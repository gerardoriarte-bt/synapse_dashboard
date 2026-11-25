# Auditoría de calidad de código · 2026-11-25

Pedido del humano: «auditar la calidad del código, para saber si es posible
mejorar y de paso identificar código que ya no se requiere».

Medido sobre `origin/main` en `7d2e8ef`, en un worktree limpio. **Sólo lectura**:
este documento es lo único que cambia. Cada hallazgo lleva su archivo:línea y
el comando que lo sostiene; §5 dice cómo se midió y qué no se pudo confirmar.

## 1 · Resumen

- **El código muerto es poco y chico.** De 247 archivos de `src/` (sin los
  generados) aparecieron **un archivo huérfano** (`src/surfaces/builder/grupos.ts`,
  sin importador desde `fb54f91`), **cuatro funciones sin ningún llamador**, una
  función reemplazada que sólo sostienen sus pruebas y cuatro alias de tipo sin
  uso. Ninguna dependencia de `package.json` sobra y ningún script apunta a algo
  que no existe.
- **La deuda de verdad no es código muerto: es tamaño y repetición en tres
  lugares.** `Builder()` es un solo componente de ~1.280 líneas, `src/api/admin.ts`
  tiene 2.077 líneas, y la cabecera `Authorization: Bearer` se arma **seis
  veces** en `src/api/` — que es exactamente cómo el chat pasó meses sin
  autenticar.
- **El chunk principal pesa 666 KB (191 KB gzip)** porque administración y
  builder viajan en la primera carga de la consola. Con `lazy()` en dos rutas
  baja a **456 KB (138 KB gzip)** y el aviso de Vite desaparece — medido en una
  copia, ver §3.
- **Las pruebas lentas tienen una causa común**: el `findBy*` espera 1 s por
  defecto y la consola monta cuerpos con `import()` diferido. Hoy se parchea
  prueba por prueba con `{ timeout }`.
- **Los tipos están bien**: cero `any`, cuatro `as unknown as`, ningún
  `@ts-ignore`. Lo que más vale conservar está en §4.

## 2 · Código que se puede borrar

Tres clases, como pidió el humano: **se puede borrar**, **sólo lo usan las
pruebas**, y **parece muerto pero se usa**.

### 2.1 · Se puede borrar

| Qué | Dónde | Evidencia | Riesgo |
|---|---|---|---|
| `spanInRange` | `src/catalog/blocks.ts:51` | `grep -rnw spanInRange src tests dev tools` → sólo la definición y un comentario en `src/api/adapt.ts:649`. Lo nombra la descripción de una tarea vieja en `plan-de-trabajo.md:2956` | Bajo. Actualizar el comentario de `adapt.ts:649` en el mismo cambio |
| `esUmbrales` | `src/catalog/umbrales.ts:124` | Una sola aparición en todo el repo (la definición). `problemaDeUmbrales`, que es lo que sí se usa, queda | Nulo |
| `toggleTheme` | `src/tokens/theme.ts:21` | Una sola aparición. El tema se aplica con `applyTheme` desde `src/surfaces/useTemaGuardado.ts:22` | Nulo. `src/tokens/theme.ts` está escrito a mano (no lo emite `gen-tokens.py`), así que se puede editar |
| `adaptBlocksConRechazo` como export | `src/api/adapt.ts:691` | Ningún importador; la usa sólo `adaptBlocks` en la línea 688. No se borra la función, se le quita el `export` | Nulo |
| Alias `PayloadState`, `Point`, `Pillar`, `Column` | `src/api/types.ts:32`, `:74–76` | Una aparición cada uno, sin uso en `src/`, `tests/` ni `dev/` | Nulo, y beneficio mínimo |
| `export` sin consumidor externo | `adaptarConexion`, `adaptarWarehouse`, `adaptarSolicitud`, `adaptarReporte` (`src/api/admin.ts:1586`, `:1634`, `:1716`, `:1989`); `datoDesdeTrama` (`src/api/chat.ts:340`); `ROLES_QUE_ADMINISTRAN`, `ROL_INTERNO` (`src/api/rol.ts:46`, `:64`); `ANIOS_OFRECIDOS` (`src/surfaces/admin/cargaDePeriodos.ts:19`); `RUTA_DE_REPORTES` (`src/surfaces/admin/rutasDeReportes.ts:7`); `fechasDe`, `esIdentificador`, `humanizarColumna` (`src/surfaces/console/figuraDelAgente.ts:34`, `:118`, `:125`) | Se usan dentro de su archivo y en ningún otro, ni en pruebas. Es quitar la palabra `export`, no código | Nulo. Cosmético: lo pongo para que no se lea como «muerto» |

**Unos 100 tipos exportados más** salen como «sin importador» en knip (§5). Son
casi todos tipos de props o de payload que se usan dentro de su archivo; quitarles
el `export` no compra nada y no lo propongo.

### 2.2 · Sólo lo usan las pruebas

| Qué | Dónde | Evidencia | Propuesta |
|---|---|---|---|
| **`grupos.ts` entero** (`GRUPOS`, `agrupar`, `DE_TIPO`) | `src/surfaces/builder/grupos.ts` | `fb54f91` («La biblioteca del editor es de datos…») borró el único import (`import { agrupar } from './grupos'` en `Library.tsx`). Desde ahí lo importa sólo `tests/surfaces/builder/grupos.test.ts:8`. Lo sigue nombrando la descripción de una tarea vieja en `plan-de-trabajo.md:6530` | **Borrar el archivo y su prueba**, y anotar en el plan que se borró. Riesgo bajo: la biblioteca ya agrupa por familia del catálogo, no por estos cinco grupos |
| `redimensionarPanel` | `src/surfaces/builder/borrador.ts:364` | El builder redimensiona con `cambioDeTamano` de `disposicion.ts` (`Builder.tsx:78`). `redimensionarPanel` sólo aparece en `tests/surfaces/builder/borrador.test.ts` | Borrar la función y sus casos de prueba. Riesgo bajo |
| `porPestana` | `src/surfaces/builder/validar.ts:129` | Sólo `tests/surfaces/builder/validar.test.ts` | Borrar, o usarla donde se cuentan problemas por pestaña. Riesgo bajo |
| `knownParams` | `src/api/params.ts:264` | Sólo `tests/api/params.test.ts` | Revisar si la validación real la reemplazó; si sí, borrar |
| `supportsBand` | `src/catalog/plots.ts:54` | Sólo `tests/catalog/plots.test.ts` | Igual que la anterior |
| `timeScale` | `src/render/plots/core/scale.ts:80` | Sólo `tests/render/plots/core/scale.test.ts`; los plots importan `linearScale`, `bandScale` y `ceiling` | Borrar con su prueba si ningún plot temporal la va a usar |
| `isGridMeasure`, `fitsInGrid`, `MIN_WIDTH` | `src/render/grid.ts:30`, `:102`, `:228` | Sólo `tests/render/grid.test.ts` | **No tocar**: anclan reglas de §3 de `design.md` (el mínimo de 360 px, la medida de grilla). Ver §4 |
| `BUDGET_MS`, `BUILT_TYPES`, `MISSING_TYPES`, `TIPOS_DE_PANEL`, `_resetObserver`, `isEmpty` | `src/render/budget.ts:38`, `src/render/bodies/registry.ts:138`, `:174`, `src/api/adapt.ts:171`, `src/render/plots/core/useSize.ts:73`, `src/render/state.ts:41` | Exportados para que la prueba afirme la regla o reinicie estado | **No tocar**: son ganchos de prueba deliberados |

### 2.3 · Parece muerto pero se usa

| Qué | Por qué parece muerto | Quién lo usa |
|---|---|---|
| `tests/api/params-esquema.ts` | knip lo da como archivo sin uso | No es una prueba: es una aserción de tipos que corre `npm run typecheck` vía `tsconfig.test.json`. Lo dice su cabecera |
| Los `*Params` de los cuerpos (`KpiParams`, `SeriesParams`…) | knip los da sin importador | Los importa `params-esquema.ts` (líneas 47–58) |
| `@fontsource-variable/*` y `tailwindcss` | knip las da como dependencias sin uso | Se importan desde CSS: `src/tokens/fonts.css:29–92` y `src/tokens/tokens.css:14`. knip no lee CSS |
| Los seis `chart-spec-*.json` de `tests/api/fixtures/` | grep por nombre completo encuentra uno solo | `tests/api/vegaLite.test.ts:291` los carga con `import()` de plantilla |
| `PENDIENTES` vacío en `Admin.tsx:114` y `Builder.tsx:154`; `MISSING_TYPES = []` | Mapas y listas vacías | Se conservan por decisión escrita en su comentario: es la forma con la que una pantalla pendiente dice qué falta |
| `TENANT`, `TAB_A`…`TAB_C`, `LAYOUT_DRAFT` en `dev/mocks/datos.ts:29–37`; `metrics` y `blocks` en `tests/mocks/handlers.ts:154–155` | Exports sin importador | Se usan dentro de su archivo. Sólo sobra el `export` |
| Las 28 herramientas de `tools/` | — | Las 28 tienen quien las llame: `package.json`, `tools/gate.py` o otra herramienta (`plan_fuente.py`, `pen-graficos.json`, `plan-plantilla.html`) |

### 2.4 · Comentarios que describen código que ya no está

Buscado con un script que toma cada identificador entre comillas invertidas
dentro de un comentario de `src/` y lo cruza contra el código sin comentarios.
De 25 nombres que no aparecen como código, la mayoría son del backend en Go
(`availablePeriods`, `isDegraded`, `indexTabs`) o historia contada a propósito
(«era un booleano `labelOculto`»). Quedan **dos que mienten**:

| Dónde | Qué dice | Qué pasa |
|---|---|---|
| `src/surfaces/IdentityBlock.tsx:16` | «lo que se ofrece sale de `salidasDesde`» | `src/surfaces/superficies.ts:8` dice que `salidasDesde` se borró el 2026-10-07 |
| `src/api/params.ts:24` | «`unknownParams` compara contra `paramsDisponibles`» | No existe `unknownParams`; la validación vive en `validateParams` (`params.ts:197`) |

Y la cabecera de `grupos.ts` describe una biblioteca que ya no existe, que es otra razón para borrarlo.

## 3 · Mejoras priorizadas

| # | Qué | Impacto | Esfuerzo | Propuesta |
|---|---|---|---|---|
| 1 | **Rutas de admin y builder diferidas** | Alto · todo usuario de consola baja hoy 210 KB de código de administración que no usa | Bajo · un archivo | `lazy()` + `Suspense` para `Admin` y `Builder` en `src/app/router/routes.tsx:5–6`. Medido en una copia: el chunk principal pasa de **666,17 KB / 191,02 KB gzip** a **455,75 KB / 138,02 KB gzip**, con `Admin` (114 KB) y `Builder` (87 KB) aparte, y `carga-diferida` sigue en ✓. Falta decidir qué se pinta durante la carga y probar el arranque directo en `/admin` |
| 2 | **Un solo lugar que pone el token** | Alto · es la clase de defecto que ya ocurrió: `askSynapse` se escribió aparte de `client.ts` y no copió la cabecera | Bajo | La cabecera se arma en `src/api/client.ts:62`, `src/api/admin.ts:68` y `:1311`, `src/api/chat.ts:158`, `src/api/auth.ts:150`, `:182` y `:215`. Un `conSesion(headers)` en `api/` que todos llamen. Los envelopes pueden seguir separados — la nota de `admin.ts:59` justifica eso, no la cabecera. De paso, `auth.ts:215` llama `currentToken()` dos veces con un `as string` |
| 3 | **Las esperas de las pruebas, una vez** | Medio-alto · son las que fallan con la máquina cargada (`graficoViaja`, `historialCableado`, `conexion`, `degradacionComun`, `tab`) | Bajo | 58 archivos usan 701 `findBy*`, con la espera de 1 s de testing-library. Hoy se parchea por prueba: `tests/surfaces/console/tab.test.tsx:164` (`lento = { timeout: 4000 }`), `tests/surfaces/admin/admin.test.tsx:503` y `:553`. Propuesta: `configure({ asyncUtilTimeout: 5000 })` en `tests/setup.ts`, y precargar los `LOADERS` de `render/bodies/registry.ts` en un `beforeAll` del bloque con DOM, para que el primer cuerpo no pague el `import()` dentro de la espera. No lo pude probar sin tocar `tests/` |
| 4 | **Partir `Builder()`** | Medio · un componente de ~1.280 líneas (`Builder.tsx:193–1469`), 14 `useState`, 3 `useEffect` y un `exhaustive-deps` apagado en `:592`. | Medio-alto | No partir por partir: extraer **el estado del borrador** (historial, autoguardado cada `AUTOGUARDADO_MS`, deshacer) a un hook `useBorrador` y **la navegación por pantallas** a su propio componente. `Canvas.tsx`, `PanelConfigurator.tsx` y `borrador.ts` ya muestran que la lógica pura sale bien a archivos aparte |
| 5 | **Partir `src/api/admin.ts` por recurso** | Medio · 2.077 líneas, 1.133 de código. El objeto `adminApi` solo va de la línea 919 a la 1578 | Medio | Un archivo por recurso —layouts y publicaciones, roles, usuarios y solicitudes, conexión y llaves, reportes— que reexporte `adminApi` desde `admin.ts` para no tocar a ningún consumidor. `adapt.ts` (1.535) puede esperar: la mitad es comentario y está organizado por forma |
| 6 | **Las tres copias de los gráficos de `matriz`** | Medio · un arreglo en una copia no llega a las otras, y ya pasó con `axisReserve` | Bajo-medio | `rowReserve`, `padFor` y `recorte` están definidas en `PlotHeatmap.tsx`, `PlotCalendar.tsx` y `PlotCohort.tsx` (`grep -lE "(function\|const) rowReserve"`). El bloque repetido entre `PlotCohort.tsx:275` y `PlotHeatmap.tsx:216` es el más largo que encontró el detector (§5). La propia cabecera de `PlotCohort.tsx:109–120` lo anota como «lo primero a hacer cuando se pueda tocar `core/`»: va a `core/matrix.ts`, donde ya vive `levels` |
| 7 | **Formato sin verificar** | Bajo-medio · `npm run format` existe y la puerta no lo mira: `prettier --check` marca **114 archivos de `src/`** | Bajo el cambio, alto el roce | Decidir una de dos: un commit de formato y `prettier --check` en `gate.py`, o borrar el script `format` y `.prettierrc`. El commit de formato toca medio `src/` y conviene hacerlo sin otra sesión abierta |
| 8 | **Idioma de los identificadores** | Bajo · `CLAUDE.md` dice «identificadores en inglés» y el código ya no lo cumple: 19 `function adapt*` contra 23 `function adaptar*`, y 22 de los 45 archivos de `src/surfaces/admin/` con nombre en español | Bajo si se decide; alto si se renombra | **No renombrar en masa.** Es decisión humana: o la regla se reescribe para describir lo que hay, o vale sólo para código nuevo. Hoy la regla y el código se contradicen y ninguno de los dos avisa |
| 9 | **Claves de cache escritas a mano** | Bajo | Bajo | `src/api/hooks.ts` invalida por prefijo literal en `:261`, `:596`, `:715`, `:821`, `:850` y `:908` (`['admin', 'usuarios']`, `['config', 'tab']`…) junto a la fábrica `keys`. Si una clave de `keys` cambia de prefijo, esas invalidaciones dejan de pegar en silencio. Agregar a `keys` las raíces y usarlas |
| 10 | **Dos `as unknown as` en el borde de administración** | Bajo | Bajo | `src/api/admin.ts:899` y `:966` pasan un payload del cable de admin por `adaptPayload` del cable de consola forzando el tipo. Si los dos yaml describen la misma forma, que la compartan; si no, el cast esconde la diferencia |
| 11 | **Dependencia transitiva usada directo** | Bajo | Trivial | `tests/surfaces/builder/binder.test.tsx:32` y `canvas.test.tsx:18` importan `@testing-library/dom`, que llega como peer de `@testing-library/react` y no está en `package.json`. Declararla |
| 12 | **Los dos comentarios que mienten** de §2.4 | Bajo | Trivial | Corregirlos |

**Lo que no encontré**: ramas para formas o rutas que el contrato ya no tiene.
Los `switch` sobre `Forma`, `TipoPanel` y `GraficoId` están tipados con las
uniones generadas, y TypeScript rechaza un `case` con un literal que la unión no
contiene, así que `npm run typecheck` ya cubre esa clase. No revisé a mano cada
`if` sobre cadenas sueltas.

## 4 · Lo que conviene no tocar

- **Las fronteras**: `render/` sin valores de `api/`, mocks fuera de `src/`,
  `import type` como regla. `mocks-fuera` y el lint las sostienen y la
  auditoría no encontró ninguna violación.
- **Los tipos**: cero `any` (`grep -nE ":\s*any\b|<any>|as any\b"` sobre `src/`
  sin generados), ningún `@ts-ignore`, `strict` con
  `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`. Los 83 `as Tipo`
  están concentrados en el borde (`admin.ts` 9, `adapt.ts` 8) y en la lectura de
  JSON, donde se valida después (`src/surfaces/builder/eleccion.ts:22`).
- **La carga diferida de los cuerpos** (`src/render/bodies/registry.ts:100–120`):
  15 cuerpos en 15 chunks, verificada por `carga-diferida`.
- **El manejo de errores en el cliente**: el envelope se desenvuelve en un lugar
  por cable, un cuerpo que no es JSON da un mensaje que dice qué pasó, y
  `src/app/errores.ts` registra sin datos del usuario y con tope por carga.
- **Los ganchos de prueba de §2.2** (`MIN_WIDTH`, `BUDGET_MS`, `_resetObserver`,
  `MISSING_TYPES`…) y **los `PENDIENTES` vacíos**: están para que una regla tenga
  quien la afirme.
- **Los archivos generados y las 28 herramientas de `tools/`**: todas tienen
  consumidor.
- **La densidad de comentarios** (~43 % de las líneas de `src/`) es la
  convención del equipo y explica casi todas las rarezas que encontré. Lo único
  que pido es lo de §2.4: que un comentario que nombra código se corrija cuando
  ese código se borra.
- **El `.skip`**: no hay ninguno, ni `.only` ni `.todo`, en `tests/`.

## 5 · Cómo se midió

Todo sobre `7d2e8ef`, en el worktree `docs/auditoria-calidad-de-codigo`.

| Qué | Comando |
|---|---|
| Exports, archivos y dependencias sin uso | `npx knip@5` (**5.88.1**), sin agregarlo a `package.json`, con tres configuraciones en un directorio temporal: (a) entradas `src/main.tsx`, `dev/main.tsx`, `tests/**/*.test.{ts,tsx}` y `tests/setup.ts`; (b) la misma más `tests/api/params-esquema.ts`; (c) `--production` con sólo `src/main.tsx`, que es lo que separa «sólo lo usan las pruebas» |
| Verificación de cada candidato | `grep -rlw <símbolo> src dev tests tools` y `grep -cw <símbolo> <archivo>`: una sola aparición en su archivo y ninguna afuera es «muerto»; dos o más en su archivo y ninguna afuera es «sobra el `export`» |
| El huérfano `grupos.ts` | `git log -S"from './grupos'" -- src` → `fb54f91`; `git show fb54f91 -- src/surfaces/builder/Library.tsx` muestra el import borrado |
| Comentarios obsoletos | Script propio: identificadores entre comillas invertidas en comentarios de `src/` que no aparecen en el código sin comentarios |
| Tamaños | `wc -l` y un script que cuenta líneas de código sin comentarios ni líneas vacías |
| Duplicación | Script propio de ventanas de 10 líneas normalizadas sobre `src/` sin generados. **No pude correr `jscpd`**: el permiso para bajar ese paquete fue denegado en esta sesión, así que la detección es más gruesa que la de una herramienta dedicada |
| Tipos débiles | `grep` de `any`, `as unknown as`, `as Tipo`, `@ts-ignore`, `eslint-disable` sobre `src/` sin generados |
| Bundle | `npx vite build` en el worktree; el experimento de rutas diferidas se hizo **en una copia aparte** de `src/` con `routes.tsx` editado, y sobre ella se corrió `tools/carga-diferida.py` |
| Formato | `npx prettier --list-different "src/**/*.{ts,tsx,css}"` |
| Pruebas frágiles | `grep -c 'findBy\|findAllBy'` por archivo y `grep -rn "timeout:" tests`. **No reproduje las fallas por tiempo**: las cito como las reportó quien pidió la auditoría |

**Lo que no confirmé**: que borrar `knownParams`, `supportsBand` y `timeScale`
no rompa una intención escrita en el plan (las tres sólo tienen pruebas como
consumidor, pero no leí la historia de cada una); y que la propuesta 3 baje las
fallas por tiempo — requiere tocar `tests/setup.ts`.
