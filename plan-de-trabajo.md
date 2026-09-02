# Plan de trabajo · Synapse front dinámico

**2026-09-01** · Deriva de `nuevo-desarrollo.md` (normativo) y **extiende**
`tareas-front-back.md`, que sigue siendo válido: se conservan sus identificadores
`B*` / `F*` para no perder el hilo. Lo que este documento agrega va marcado `➕`.

## Una sola fuente

**Este archivo es la fuente. Todo lo demás se genera con `npm run plan`.**

| Archivo | Rol |
|---|---|
| `plan-de-trabajo.md` | **FUENTE.** Se edita a mano |
| `plan-tareas.csv` | derivado · las 170 tareas, una por fila, para importar |
| `tools/plan-synapse.html` | derivado · la página navegable |

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
**Descripción.** Toda respuesta viaja como `{ success: true, data }` o
`{ success: false, error: { codigo, mensaje, campo?, desbloqueaCon? } }`.
**Criterio de aceptación.**
- No hay endpoint que devuelva el objeto pelado sin envelope.
- `mensaje` está escrito desde el lado del usuario. §8 de `design.md`: los
  errores no se disculpan y nunca son vagos — «El feed de inventario tiene 31
  horas», no «Error al obtener snapshot».
- `codigo` es estable y sirve para decidir en código.

### B0.5 ✅ Contrato de consola
**Descripción.** `contracts/synapse-api.yaml` ya existe y cubre los endpoints de
consola: `me`, `catalog`, `blocks`, `tabs/{tabId}`, `panels:batch`, `chat`,
`chat/hilos`, `me/preferencias`, más `decisiones`, `accionables` y
`solicitudes`. Fue escrito por el front derivándolo de §4 y de lo que C1 consume.
**Criterio de aceptación.**
- El backend lo revisa y lo adopta, o marca las diferencias en el propio archivo.
- Al adoptarse deja de ser propuesta del front y pasa a ser fuente de los dos
  lados (T1).

### B0.6 ⬜ Extender el contrato con admin y builder
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

### ➕ B0.9 ⬜ Contestar las cinco `# PREGUNTA:` del contrato
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

### B1.1 ⬜ `GET /config/me`
**Descripción.** Contexto de arranque: `user` (con `capacidades` y
`preferencias`), `tenant`, `role` (con `puedeAprobar`), `tabs` **sin paneles**,
`periodos`, `catalogVersion`, `alcance` y —si hay más de uno— `layouts`.
**Criterio de aceptación.**
- Las pestañas llegan **ya filtradas** por el rol del token y en su orden.
- Cada `Periodo` declara su `grano` (`dia` | `semana` | `mes`): sin él el front
  sabe que una métrica es mensual pero no si `2026-W32` es una semana.
- No incluye paneles: pedirlos es `GET /config/tabs/{tabId}`.
- Con `alcance: plataforma` incluye `tenantsDisponibles`; con `usuario`, no.

### B1.2 ⬜ `GET /config/catalog`
**Descripción.** Las métricas del tenant filtradas por el rol del token.
**Criterio de aceptación.**
- Una métrica oculta para el rol **no aparece**, ni siquiera con `estado`
  restringido: ocultar no es permitir, pero tampoco es mostrar el nombre.
- Cada métrica trae `base` obligatorio (ver D6), `familia`, `forma`, `capa`,
  `fuente`, `ventana`, `granoMinimo`, `dimensiones` y `catalogVersion`.
- `direccionSemantica` viene solo en las compuestas, y es la frase que se pinta.

### B1.3 ⬜ `GET /config/blocks`
**Descripción.** La tabla tipo ↔ formas aceptadas ↔ rangos de `colSpan` y
`rowSpan`, para los 15 tipos.
**Criterio de aceptación.**
- Los 15 tipos están, incluidos los que ninguna métrica usa hoy
  (`comparison`, `matrix`, `graph`): el builder los ofrece.
- El front la consume con `catalog/blocks.ts`, que ya está escrito, sin
  reescribir la tabla del lado del cliente.

### B1.4 ⬜ `PUT /config/me/preferencias`
**Descripción.** Persistir el tema del usuario.
**Criterio de aceptación.**
- El tema se guarda contra el **perfil**, no contra el tenant ni el navegador:
  §2.4 lo declara preferencia de usuario, y la misma cuenta se ve igual en dos
  máquinas.
- El valor inicial vuelve en `/config/me` → `user.preferencias.tema`.

### B1.5 ⬜ `GET /config/tabs/{tabId}`
**Descripción.** `{ tab, panels[] }` — el layout, sin datos. Acepta
`?layoutId=` para multi-dashboard.
**Criterio de aceptación.**
- Un `tabId` que no pertenece al tenant y rol del token devuelve **`404`, no
  `403`**: no se revela la existencia.
- La respuesta no contiene una sola cifra: cambiar de período no la invalida.
- Cada panel trae `id`, `tipo`, `metricId`, `colStart`, `colSpan`, `rowSpan` y
  `opciones?`.

### B1.6 ⬜ `POST /config/panels:batch`
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

### B1.12 ⬜ `Gobierno` obligatorio en `DISPONIBLE` y `DEGRADADO`
**Descripción.** `base`, `capa`, `fuente`, `frescura`, `catalogVersion`
intersectados en los dos estados que muestran número.
**Criterio de aceptación.**
- **Un valor sin procedencia es imposible de construir** en el tipo, no algo que
  se recuerde poner.
- `frescura` es ISO 8601 y refleja **cuándo se materializó**, no «ahora» (B2.10).

### B1.13 ⬜ `Presentacion` opcional
**Descripción.** Los rótulos y cifras de apoyo que el panel pinta alrededor del
valor: `label`, `medidor`, `comparativo`, `nota`. **Viajan con el dato, no con el
layout**, porque dependen del período.
**Criterio de aceptación.**
- El backend devuelve los rótulos **ya redactados**; el front no los compone.
- `label` lleva la unidad («USD · TOTAL»), y por eso la cifra grande no la lleva
  pegada: a 44px «USD 4.28M» no entra en un panel de colSpan 3.

### B1.14 ⬜ Transformar a las formas de `Valor`
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
**Criterio de aceptación.**
- Un panel `gauge` sin `maximo` en `opciones` no se sirve como `DISPONIBLE`.
- Una `serieTemporal` con cero puntos llega como `DISPONIBLE` con `vacioRazon` y
  `vacioDesbloqueaCon`, no como un array vacío: §8 pide que el vacío sea
  invitación a actuar, y un array vacío no alcanza para escribir «el período
  cierra el 1 de septiembre».

### B1.16 ⬜ Seed de demo: 1 tenant, 1 layout, 1 pestaña, 4–6 paneles
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
### B1.18 ⬜ Sincronizar el catálogo con las semantic views de Snowflake
### B1.19 ⬜ Filtrar el catálogo por permisos de rol
**Criterio de aceptación (los tres).**
- El catálogo declara `granoMinimo` por métrica: el período más fino que puede
  contestar.
- Una métrica cuyo insumo está en `SILVER` no declara `GOLD`: la compuesta
  hereda la peor capa.
- Cambiar el catálogo incrementa `catalogVersion`, y ese número viaja en cada
  payload.

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

### B2.5 ⬜ Estado `DEGRADADO`
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

---

## Fase 3 — Chat contextual

### B3.1 ⬜ `POST /config/chat` con SSE
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
**Descripción.** El superadmin configura el agente de cada tenant: cuenta,
warehouse, vistas semánticas permitidas y prompt base.
**Criterio de aceptación.**
- Solo accesible con `aud: platform`.
- La credencial **no se edita acá**: se referencia por identificador del gestor de
  secretos (B0.8), y ninguna respuesta la incluye.
- Cambiar las vistas permitidas surte efecto en la siguiente pregunta, sin
  reiniciar el servicio.

---

## Fase 4 — Admin y Builder

### B4.1 ⬜ `GET /admin/tenants`
### B4.2 ⬜ `GET /admin/tenants/{id}/layouts`
### B4.3 ⬜ `POST /admin/tenants/{id}/layouts` — crear borrador
### B4.4 ⬜ `PUT /admin/layouts/{id}` — editar pestañas y paneles
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

### B4.8 ⬜ CRUD de roles por tenant
### B4.9 ⬜ Preview por rol
### B4.10 ⬜ Asignación de layout publicado a roles
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
### F0.5 ⚠️ Auth guard · 🔒 depende de B0.10
**Descripción.** Guard de sesión y almacenamiento del token, hechos. Falta la
pantalla de login y el POST, que **no existen en el contrato**.
**Criterio de aceptación.**
- ✅ `AuthGuard` verifica que **haya** token, no qué permite: los permisos los
  aplica el backend.
- ✅ El front **no decodifica el JWT**: recibe todo resuelto en `/config/me`.
- ⬜ Pantalla de login que consume B0.10 y redirige al `from` guardado.
- ⬜ Un `401` de cualquier endpoint limpia la sesión y vuelve al login.

### F0.6 ✅ Generar `src/api/types.ts` desde OpenAPI
**Criterio de aceptación.** ✅ Cumplido con salvedad (D4).
- `src/api/generated.ts` son 2.034 líneas generadas del yaml, y `api/types.ts`
  solo les pone nombre.
- ✅ `npm run gen:api` corre desde el `package.json` (F0.10, cerrada por D4).

### F0.7 ✅ Reutilizar los tokens del v2
**Criterio de aceptación.** ✅ Cumplido.
- Los 57 tokens en `@theme static`, con el espacio de nombres de Tailwind:
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

### ➕ F0.12 ⬜ Reapuntar el generador de tokens
**Descripción.** `tokens.css` y `tokens.ts` están **portados a mano**. En v2 los
emite `tools/gen-tokens.py` leyendo el `.pen`, y `token-drift` verifica que no se
separen. Hasta reapuntarlo, un cambio de token en el diseño no llega solo.
**Criterio de aceptación.**
- El generador emite el archivo con `@theme static` y el espacio de nombres de
  Tailwind, incluidos los cuatro tokens de marca y las 22 rampas de familia.
- Correrlo dos veces produce el mismo archivo byte a byte.
- Las cabeceras «PORTADO A MANO · PENDIENTE» desaparecen.

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

#### F1.13b ⚠️ Portar `format.ts` e **inyectar el locale**
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

#### ➕ F1.28 ⬜ Traducir los CSS Modules de v2 a Tailwind
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

#### ➕ F1.31 ⬜ Registro de gráficos y verificación de mínimos
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

---

## Fase 2 — Los estados de materialización en pantalla

Depende de B2.5–B2.7: hasta que el backend emita `DEGRADADO` y `BLOQUEADO`
reales, estos estados solo se pueden probar contra el seed (B1.20).

### F2.1 ⬜ `DEGRADADO`
**Criterio de aceptación.** Muestra **la cifra**, más `razon` y `desbloqueaCon`.
El badge lo pinta el shell. El front **no decide** si algo está degradado.

### F2.2 ⬜ `BLOQUEADO`
**Criterio de aceptación.** Sin cifra y sin aproximación. Razón, qué lo
desbloquea y CTA. El shell conserva título y BASE.

### F2.3 ⬜ `SIN_PERMISO` · 🔒 depende de B0.9 (línea 1171)
**Criterio de aceptación.** Muestra `solicitarA` y ofrece pedir acceso. Si D3
resuelve conservar el viaje de solicitud, se cablea contra
`/config/solicitudes`: la solicitud ya hecha sale del servidor y **no de estado
local** —con estado local, recargar borraba el pedido y la consola volvía a
ofrecer el CTA como si nada.

### F2.4 ⬜ `ERROR` con reintento por panel
**Criterio de aceptación.** El reintento re-pide **ese** panel, no el batch
entero. El mensaje es el del backend, no uno inventado por el front.

### F2.5 ⬜ Frescura relativa en la procedencia
**Criterio de aceptación.** «hace 3 h» calculado contra el `ahora` que baja por
props. Refleja cuándo se materializó (B2.10), no cuándo se abrió la página.

### F2.6 ⬜ Gobierno visible en los seis estados
**Criterio de aceptación.** Incluso cargando: la BASE sale de `Metric.base` del
catálogo (D6). Es la garantía de §5.2 verificada estado por estado.

---

## Fase 3 — Chat contextual

### F3.1 ⬜ `ChatOverlay` — la hoja lateral
**Criterio de aceptación.** Escape cierra. El foco entra al abrir y vuelve al
disparador al cerrar. Una sola hoja abierta a la vez: apilarlas deja al usuario
sin saber qué cierra el Escape.

### F3.2 ⬜ Construir `ContextoDePanel` al abrir
**Criterio de aceptación.** Manda `panelId`, `metricId`, `metricKey`, `nombre`,
`base`, `fuente`, `capa`, `familia`, `periodo`, `tipo`, y opcionalmente
`valorActual` y `dimensionesDisponibles`. **Nunca SQL.**

### F3.3 ⬜ «Ver detalle» y «Preguntar» en el shell del panel
### F3.4 ⬜ Cliente SSE
**Criterio de aceptación.** Lee `pensando`, `fragmento`, `dato`, `sql`, `error`,
`fin`. Cerrar la hoja aborta el stream. Un `error` a mitad deja lo ya recibido
visible y dice qué pasó.

### F3.5 ⬜ UI de mensajes con estado de streaming
### F3.6 ⬜ Reutilizar cuerpos de panel para respuestas estructuradas
**Criterio de aceptación.** Si llega `{ forma, datos, procedencia }`, se renderiza
con el **mismo** cuerpo que un panel — un solo modelo de datos. Y con la misma
anatomía: una cifra en el chat también declara BASE y procedencia.

### F3.7 ⬜ Historial de hilos
**Descripción.** Listado de conversaciones previas del usuario, desde
`GET /config/chat/hilos`.
**Criterio de aceptación.**
- Cada hilo muestra con qué panel y período se abrió.
- Retomar un hilo reenvía su contexto; no arranca uno nuevo en silencio.

### F3.8 ⬜ `useChat(contextoPanel)` — envío y stream fuera de la UI
**Descripción.** La lógica de envío, acumulación de fragmentos y cierre del
stream, separada del componente que la pinta.
**Criterio de aceptación.**
- El componente de mensajes recibe una lista y un estado; no conoce SSE.
- Desmontar la hoja aborta el stream y no deja el `EventSource` abierto.

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

---

## Fase 4 — Admin y Builder

Es lo genuinamente nuevo: v2 **no tiene una sola línea** de estas dos
superficies. El documento las estima en 3–4 semanas de front y es la única
estimación que no bajaría.

### F4.1 ⬜ `surfaces/admin/` — layout base y navegación
### F4.2 ⬜ Lista de tenants
### F4.3 ⬜ Gestión de usuarios y roles por tenant
### F4.4 ⬜ Configuración de agente Snowflake por tenant
### F4.5 ⬜ Vista del catálogo de métricas del tenant
**Criterio de aceptación (los cinco).**
- **No se muestra vocabulario de infraestructura** (§7.3 de `design.md`): ni
  base, ni rol técnico, ni grants, ni warehouse. Se declara la consecuencia
  —acceso vigente, última verificación— no la plomería. Única excepción: la lista
  de subprocesadores, que es obligación legal.
- La credencial de Snowflake **no se muestra ni se edita** desde acá: se
  referencia por identificador del gestor de secretos.
- Un usuario ve su propia fila marcada «sin acción sobre tu cuenta».

### F4.6 ⬜ `surfaces/builder/` — composición visual
### F4.7 ⬜ Selector de tenant y plantilla base
### F4.8 ⬜ Editor de pestañas: nombre, pregunta operativa, orden, sugerencias
### F4.9 ⬜ Canvas de 12 columnas — arrastrar y colocar
### F4.10 ⬜ Configurador de panel: métrica, tipo, spans, opciones
### F4.11 ⬜ Validación en tiempo real contra `/config/blocks`
### F4.12 ⬜ Preview por rol
### F4.13 ⬜ Guardar borrador
### F4.14 ⬜ Validar antes de publicar
### F4.15 ⬜ Publicar sin deploy
### F4.16 ⬜ Hooks dedicados: `useLayouts`, `useLayoutEditor`, `usePublishLayout`
**Criterio de aceptación destacado.**
- F4.8: **una pestaña que no contesta una pregunta no se compone.** La pregunta
  operativa es obligatoria, no un subtítulo opcional.
- F4.11: usa `catalog/blocks.ts`, que ya está escrito. Un tipo incompatible con
  la forma de la métrica se marca **con la razón**, no con «inválido».
- F4.11: la validación del front es feedback inmediato; **el servidor decide**
  (B4.6). Nunca se publica algo que el front dio por bueno y el servidor no vio.
- F4.12: el preview llama al endpoint con rol simulado (B4.9). No se simula del
  lado del cliente filtrando lo que ya se tiene: eso probaría el filtro del
  front, que no existe.
- F4.15: publicar surte efecto sin deploy, y se ve en la consola en la siguiente
  carga.

### ➕ F4.21 ⬜ Selector de gráfico en el builder
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

### F4.17 ⬜ `ComparisonBody` + `ComparePlot`
### F4.18 ⬜ `MatrixBody` + `HeatmapPlot`
### F4.19 ⬜ `GraphBody` + `GraphPlot`
### F4.20 ⬜ Registrar los tres con carga diferida
**Criterio de aceptación.**
- Se construyen **cuando el backend envíe esas formas** (B5.3), no antes. Hoy
  ninguna métrica las usa; existen para que el builder pueda ofrecerlas.
- Al estar los quince, el registro pasa de `Partial<Record<PanelType, …>>` a
  `Record` completo, y **agregar un tipo al enumerado sin su cuerpo deja de
  compilar**.

---

## Fase 5 — Multi-dashboard, pruebas y pulido

### F5.1 ⬜ Selector de layout cuando hay más de uno
**Descripción.** Un tenant puede tener varios dashboards —«Operaciones»,
«Marca», «Ejecutivo»—. El selector aparece solo si `ctx.layouts.length > 1`.
**Criterio de aceptación.**
- Con un solo layout no hay selector: no se ofrece una elección que no existe.
- Cambiar de layout reinicia la pestaña activa, porque la pestaña de un layout no
  existe en el otro.

### F5.2 ⬜ Pasar `layoutId` a `GET /config/tabs/{tabId}`
**Criterio de aceptación.**
- El `layoutId` entra en la clave de cache de la pestaña: dos layouts no comparten
  entrada.
- Sin `layoutId` el backend resuelve el layout por defecto del rol.

### F5.3 ⬜ Completar los plots que falten
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

### F5.5 ⬜ Prueba por cuerpo, con props mínimas válidas
### F5.6 ⬜ Prueba: cada `PanelType` del contrato tiene componente registrado
### F5.7 ⬜ Prueba: cada `Payload.estado` muestra el estado correcto
### F5.8 ⬜ Pruebas de contenedor con MSW
### F5.9 ⬜ E2E de una pestaña completa con fixtures HTTP
**Criterio de aceptación (los cinco).**
- **Las pruebas se escriben desde el contrato y desde la cita de la spec, no
  mirando la implementación.** Una prueba escrita desde el código fija lo que el
  código hace y no puede fallar nunca, ni cuando el código está mal. Es lo que
  pasó el 2026-08-20 con 184 pruebas en verde.
- F5.6 es un chequeo de paridad, no una lista escrita a mano: recorre el
  enumerado del contrato.
- F5.8 y F5.9 usan **HTTP mockeado**, nunca fixtures JS importados.

### F5.10 ⬜ Checklist de conformidad §17 por tipo de bloque integrado
### F5.11 ⬜ Verificar tema oscuro y claro en todo componente
### F5.12 ⬜ Verificar la carga diferida
**Criterio de aceptación.**
- F5.11: automatizable — el chequeo de contraste de v2 (`tools/contraste.py`)
  verifica los pares de tokens en los dos temas y corre en cada build.
- F5.12: una pestaña que usa cinco tipos descarga cinco chunks de cuerpo, no
  quince. Verificable sobre el output del build.

---

# Transversales

| ID | Tarea | Responsable | Criterio de aceptación |
|---|---|---|---|
| **T1** | `contracts/synapse-api.yaml` es la fuente de verdad | Backend escribe · front consume | Un cambio en el yaml que el backend no implemente rompe CI de alguno de los dos |
| **T2** | Documentar las reglas de los 15 bloques | Backend valida · front muestra | La tabla vive en un solo lugar y se sirve por `/config/blocks` |
| **T3** | Acordar el formato de eventos SSE | Backend | Los seis eventos con su forma, en el yaml |
| **T4** | Acordar `ContextoDePanel` | Ambos | Declarado en el yaml, no en un documento aparte |
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
