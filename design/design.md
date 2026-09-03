# Synapse · Especificación de Diseño

**Versión 1.1 · Agosto 2026 · Lo.Bueno Group**
Documento fuente para la construcción de pantallas en Pencil.

Este documento define el sistema, el modelo de objetos y el inventario de pantallas de la
consola Synapse. Es normativo: donde dice "obligatorio" o "prohibido", no admite variación
sin actualizar este documento primero.

**Alcance de v1.1** — dos superficies: la consola que ve el cliente y el panel de
construcción del super-admin. El asistente de generación de reportes (Cortex propone
gráficos) queda mapeado en §7.4 pero no se construye en esta fase.

### Cambios de v1.0 a v1.1 · 2026-08-14

Las doce entradas salieron de **construir C1 y romperlo**, no de revisar el documento. Cada
una se decidió en sesión y está implementada y verificada en `design/Synapse_v2.pen`; el detalle de
cómo se llegó a ellas vive en `design/design-review.md`.

| § | Cambio | Por qué |
|---|---|---|
| **5** | `cuadrantes` entra en `distribucion`; forma nueva `perfilMultiatributo` → `radar` | Los dos gráficos existían terminados y ninguna forma los listaba: el builder no podía ofrecerlos |
| **6** | Tres tipos nuevos: `composition`, `comparison`, `distribution` | Tres formas de §5 no tenían tipo que las renderizara, y con ellas 16 de los 43 gráficos eran inalcanzables |
| **6.1** | Shell compacto para encabezados que no entran en una línea | La anatomía de §6 no cabe a colSpan 3: el badge de procedencia mide más que el interior |
| **6.2** | Reglas de contenido a colSpan 3 | §2.3 fija el KPI en 44px y §6 permite colSpan 3: eran incompatibles con cifras reales |
| **7.1** | Menú horizontal en vez de sidebar colapsable | Decisión de producto. Conserva la columna de 80px centrando el canvas |
| **7.3 · 3.5** | Los super-admins se administran en A1, que pasa a ser de alcance plataforma | `SuperAdmin` es la única entidad sin `tenantId`: no cabe en A3, donde el tenant es obligatorio y no editable |
| **4** | Ancho mínimo por superficie: 1280 en administración, 1600 en el builder | El responsive de §4 describe el grid de paneles; las tablas y el lienzo de composición no son grids y perdían contenido en silencio (PS-5) |
| **7.3** | El alcance por pantalla se declara en tabla: A1 y A3 plataforma, A2/A4/A5 tenant | La línea anterior decía «A2–A5 operan dentro de un tenant» y contradecía el propio texto de A3, que es una lista filtrable **por tenant** |
| **7.3** | El vocabulario de infraestructura no se muestra: A2 declara el estado del acceso, no el mapeo a base y rol técnico | Ningún usuario de administración opera esa capa. Mostrarla sugiere una acción inexistente y confunde en vez de dar control |
| **7.1** | Se quitan exportar e imprimir de la consola del cliente | Una cifra exportada pierde BASE, procedencia, frescura y dirección semántica — los cuatro respaldos que §1.3 hace obligatorios |
| **1.3.16 · 7.1** | La recomendación se **aprueba o rechaza** y declara quién la propone; `EJECUTAR` desaparece | Synapse no puede ejecutar: su arquitectura es de lectura. El registro de la decisión es lo que da a C4 contra qué medir |
| **3.4 · 4** | Regla de reflujo por rol: layout propio del rol, reflujo como red, hueco solo en el builder | Faltaba por completo. Sin ella, el código generado desde el `.pen` adivina — y adivina distinto en cada tenant |

**Lo que no cambió y conviene subrayar:** ninguna de las cinco cede una regla dura. El piso
tipográfico sigue en 44px, los rangos de span siguen siendo el contrato, la procedencia sigue
siendo obligatoria y §5 sigue impidiendo composiciones inválidas — ahora sin dejar formas
huérfanas.

---

## 1 · Principios

### 1.1 Tesis

No estás diseñando un dashboard. Un dashboard describe estado; una consola de inteligencia
toma posición. Cada pantalla responde una pregunta operativa concreta y deja al usuario más
cerca de una decisión que de un reporte. Si un panel no cambia lo que alguien hace el lunes,
sobra.

Synapse no compite contra herramientas de BI: compite contra la latencia entre el dato y la
decisión. La interfaz hace visible esa tesis — todo número trae su procedencia, su ventana y
su límite. Ninguna cifra pide fe.

### 1.2 Principios de presentación

1. **Dark mode nativo.** Contraste por capas de oscuridad, jamás por color. Existe tema
   claro; nunca se mezclan en la misma pantalla.
2. **El color vívido es solo para datos.** Series, categorías, estados. Nunca para chrome.
3. **Persistencia cromática absoluta.** Una entidad conserva su color exacto en menú, tarjeta,
   tabla, gráfico y grafo. Es el mecanismo principal de asociación entre vistas.
4. **Densidad con aire.** Padding **24–32px dentro de un panel** y **12–16px en una fila de
   tabla**. Nunca comprimir para meter más.

   Los dos rangos existen porque un panel y una fila hacen cosas distintas: el panel aloja una
   cifra que tiene que respirar, la fila es una unidad de una lista que se escanea. A 24 de
   padding vertical una fila mide 56px de alto y una tabla de 40 usuarios pasa de 2.240px: el
   aire que hace legible a un panel asfixia a una tabla. El rango de fila se declaró el
   2026-08-21 (PS-9) después de que la misma observación se registrara **cuatro veces** en el
   loop de revisión —una por cada pantalla de administración— sin que nadie resolviera la duda
   que la primera ya traía entre paréntesis.
5. **Protagonismo de los números.** La tipografía y el chrome se hacen invisibles.
6. **Ningún número desnudo.** Todo valor lleva label en mayúsculas, mono, gris.
7. **Deltas en color neutro.** El signo textual comunica dirección; el color no codifica
   juicio. Prohibido verde/rojo semántico en deltas.
8. **Toda métrica declara su BASE** — denominador y ventana — en label arriba a la derecha.
9. **Toda métrica declara su PROCEDENCIA** — capa Medallion, fuente, frescura. No es letra
   chica: es la prueba de que la plataforma integra fuentes y de que la cifra es trazable.
10. **Toda métrica compuesta declara su dirección semántica** ("MÁS ALTO = MEJOR"). El
    usuario nunca adivina si subir es bueno.
11. **Listas largas con scroll interno propio.** Nunca estiran el alto de la página.
12. **Iconografía de línea**, monocromática, hereda el color del texto.

### 1.3 Principios de integridad del dato

13. **Prohibida la estimación puntual sin intervalo.** Todo valor predicho se muestra como
    centro + banda. Un pronóstico sin banda no se publica.
14. **Prohibidos los scores de confianza de origen LLM.** Toda probabilidad declara su base
    empírica: n de casos, ventana histórica, métrica de calibración. Sin base, se muestra el
    hallazgo sin número.
15. **Degradación declarada.** Si un feed está vencido o una precondición no se cumple, el
    panel NO muestra un número aproximado: muestra el estado, la razón, qué lo desbloquea y
    un CTA. El límite es parte del diseño, no una falla.
16. **Toda recomendación trae acción, ventana de acción y consecuencia económica estimada.**
    Un insight sin acción es un reporte. Además declara **quién la propone** y se resuelve con
    **aprobar o rechazar**, quedando registrada con autor y fecha.

    Synapse **no ejecuta**: mover pauta pasa en la plataforma de medios, reponer stock en el
    sistema de abastecimiento. Un botón «ejecutar» prometería algo que la plataforma no puede
    cumplir —toda su arquitectura es de lectura (§1.4.19)—. Lo que sí puede es registrar la
    decisión, y eso es lo que alimenta C4: sin un acto de aprobación con fecha no hay contra
    qué comparar el resultado observado.

    **Una recomendación rechazada es tan valiosa como una aprobada.** El motivo del rechazo es
    lo que calibra las propuestas siguientes.

### 1.4 Principios de composición

17. **El layout se declara, no se escribe.** Ningún panel está hardcodeado. La consola se
    renderiza recorriendo una configuración y resolviendo cada panel contra el catálogo.
18. **El panel es la unidad atómica configurable.** No se configura el interior de un panel;
    se elige su tipo, su métrica y sus parámetros.
19. **El catálogo gobierna, el asistente propone.** Ninguna métrica llega a un panel sin
    pasar por el catálogo. Un panel se ancla a un `metricId`, jamás a un SQL.
20. **Ocultar no es permitir.** Que un panel no se renderice no es un control de acceso. El
    permiso se aplica en el backend; la composición solo decide qué se muestra de lo que ya
    está permitido.

---

## 2 · Sistema visual

### 2.1 Chrome — nunca para datos

| Token | Oscuro | Claro |
|---|---|---|
| `--bg` fondo base | `#0F0F10` | `#F2F0EA` |
| `--panel` | `#17171A` | `#FFFFFF` |
| `--panel-raised` activo, hover | `#1F1F23` | `#EDEAE3` |
| `--border` | `rgba(255,255,255,0.07)` | `rgba(0,0,0,0.08)` |
| `--divider` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.06)` |
| `--ink` texto primario | `#EDEAE3` | `#1A1A1C` |
| `--ink-dim` texto secundario | `#8A8880` | `#6B6963` |
| `--accent` marca | `#FF5A1F` | `#E2500F` |
| `--accent-soft` énfasis | `#FFA26B` | `#C24309` |

**Regla dura.** El naranja no es color de datos. No aparece en ninguna serie, barra, celda de
matriz ni nodo de grafo. Su exclusividad como color de acción es lo que lo hace legible.
Usos permitidos: CTAs, estado activo, enlaces, cifras resaltadas dentro de un titular en
prosa, barra lateral del ítem activo.

**Radio.** 10px en paneles, 2px en barras y bullets de datos. Sin excepciones.

### 2.2 Familias cromáticas — solo para datos

Cada entidad primaria tiene un hue. Cada subentidad, una luminosidad del mismo hue. El color
comunica dos niveles a la vez: a qué grupo pertenece y cuál es dentro del grupo.

| Familia | Entidad | Oscuro `[li:0, li:1, li:2]` | Claro |
|---|---|---|---|
| `demanda` | Demanda y ventas | `#BAE6FD` `#38BDF8` `#0369A1` | `#38BDF8` `#0284C7` `#075985` |
| `medios` | Medios e inversión | `#A7F3D0` `#34D399` `#047857` | `#34D399` `#059669` `#065F46` |
| `inventario` | Inventario y fulfillment | `#E9D5FF` `#C084FC` `#7E22CE` | `#C084FC` `#9333EA` `#6B21A8` |
| `cliente` | Cliente e identidad | `#FBCFE8` `#F472B6` `#BE185D` | `#F472B6` `#DB2777` `#9D174D` |
| `externo` | Señales externas | `#A3E635` `#67E8F9` | `#65A30D` `#0891B2` |

**Ámbar y amarillo: prohibidos.** Colisionan con el naranja de marca.

La asignación de familia vive en el catálogo, no en el componente. Un panel pinta con el hue
que le llega, sin saber cuál es.

### 2.3 Tipografía

| Rol | Familia | Tratamiento |
|---|---|---|
| Display y títulos | Space Grotesk 500 | tracking -0.02em |
| Cuerpo y datos | Inter / system-ui | — |
| Labels, badges, metadatos | JetBrains Mono | **siempre mayúsculas**, 10px, letter-spacing 0.12em, `--ink-dim` |
| KPIs | Inter 700 | 44–60px, `font-variant-numeric: tabular-nums` |
| Celdas numéricas | JetBrains Mono | 12px, tabular-nums, alineadas a la derecha |

Itálicas: solo en placeholders de formulario.

**La escala mono tiene cuatro roles, no uno.** La tabla de arriba declaraba dos —el label a 10
y la celda numérica a 12— y el diseño usa cuatro tamaños de forma sistemática. Lo que los
separa no es el tamaño sino **si el texto es un rótulo o una cifra**: un rótulo se abre para
leerse a tamaño chico, una cifra no, porque el tracking separa los dígitos y rompe la
comparación de columna a columna.

| Rol | Tamaño | Tracking | Dónde |
|---|---|---|---|
| **Label, badge, metadato** | 10px | **0.12em** | el rótulo obligatorio de todo valor (§1.3) |
| **Nota y pie** | 9px | **0.12em** | notas de panel, base metodológica, pies de gráfico |
| **Cifra en gráfico** | 11px | **sin tracking** | valores dibujados dentro de un plot |
| **Celda numérica** | 12px | **sin tracking** | tablas, alineada a la derecha |

Los dos roles de rótulo van **siempre en mayúsculas**; los dos de cifra, como venga el número.

**Ningún otro tamaño mono.** 13 y 14px existían en dos nodos del módulo de tipos y no
corresponden a ningún rol: una cifra con unidad dentro de un panel compacto es una celda
numérica, o sea 12.

### 2.4 Tema

El tema es **preferencia de usuario**, no de tenant. Se persiste por usuario. Ambos temas son
de primera clase: ninguna pantalla se diseña asumiendo oscuro y se adapta después.

---

## 3 · Modelo de objetos

### 3.1 Jerarquía

```
Tenant  (cliente: UA MX, Terpel)
  └── Rol  (CEO · CMO · Planner — definidos por tenant)
        └── Pestaña  (Overview, Brand, Product, Inventory…)
              └── Panel  (unidad atómica: tipo + métrica + params + posición)
```

Un **usuario pertenece a exactamente un tenant**. Sin excepciones, sin usuarios
multi-tenant, sin "usuario con permisos extendidos". Esta regla no se relaja nunca.

### 3.2 Dos planos de identidad

| Plano | Quién | Alcance | Autenticación |
|---|---|---|---|
| **Operación** | Usuarios de cliente | Un tenant, siempre | Login del tenant |
| **Plataforma** | Super-admin (Lo.Bueno) | Cross-tenant por diseño | Login separado, MFA obligatorio |

Son tablas distintas y sesiones distintas. Todo acceso cross-tenant del plano plataforma se
audita: quién, qué tenant, cuándo, qué acción.

### 3.3 Rol — un campo, dos aplicaciones

El rol determina simultáneamente:

- **Presentación** — qué pestañas y paneles ve → se resuelve en configuración
- **Acceso** — qué filas y columnas puede leer → se resuelve en el rol de Snowflake

**Regla no negociable:** si un rol no debe ver una métrica, el backend no envía el payload.
Nunca se envía el dato confiando en que la UI lo oculte.

Los roles son **definidos por tenant**, no globales. Un tenant puede tener CEO, CMO y
Planner; otro puede tener otros. El super-admin define el criterio para cada cliente.

Baseline sugerido (ajustable por cliente):

| Rol | Decide | Ve |
|---|---|---|
| **CEO** | Dirección y asignación macro | Resumen ejecutivo, objetivos, tendencia. Sin detalle SKU |
| **CMO** | Presupuesto y mix de medios | Medios, marca, atribución, costos |
| **Planner** | Reposición y demanda | Inventario, demanda, feed, **y presupuesto** |

### 3.4 Herencia de composición

Con 3 roles × N pestañas × N clientes, componer todo desde cero no escala. La composición se
resuelve en cascada, guardando solo el delta:

```
Plantilla de vertical  (retail/apparel · combustibles)
    └── override por tenant  (UA MX)
            └── override por rol  (CMO)
```

En el builder, todo panel heredado se marca visualmente como tal. Editarlo crea el override;
existe una acción "volver a heredar" que elimina el delta.

**Qué pasa con la grilla cuando un rol no recibe un panel.** `ocultoPara` saca el panel de la
composición de ese rol (§3.3) y deja su lugar vacío. La regla tiene tres capas, en orden:

1. **Composición propia del rol.** El delta de rol puede declarar `colStart` y `colSpan`, no
   solo `ocultoPara`. **Es el camino previsto**: §1.4.17 dice que el layout se declara, y una
   grilla que resulta de quitar paneles no está declarada, está emergiendo.
2. **Reflujo como red de seguridad.** Si el rol no declara layout, los paneles suben
   preservando `orden`. **El reflujo mueve, nunca redimensiona:** `colSpan` es parte del
   contrato del tipo de panel (§6) y estirarlo para tapar un hueco puede sacarlo de su rango
   permitido. Un panel mal dimensionado es peor que una fila corta.
3. **El hueco se muestra en el builder, nunca en la consola.** B5 dibuja los huecos en su
   posición original —es la vista de diagnóstico, y por eso avisa cuántos hay y de qué ancho—.
   La consola del cliente aplica el reflujo y no muestra agujeros: un hueco le dice al usuario
   «acá hay algo que no podés ver», que es ruido, no información.

La consecuencia práctica: **publicar sin componer el rol no rompe nada, pero el builder lo
declara como pendiente.** El reflujo es una red, no un destino.

### 3.5 Esquemas

```
Tenant        { id, nombre, vertical, plantillaOrigen, estado, catalogVersion }

Rol           { id, tenantId, nombre, descripcion, snowflakeRole, orden }

Usuario       { id, tenantId, rolId, nombre, email, estado, ultimoAcceso,
                preferencias: { tema } }

SuperAdmin    { id, nombre, email, mfaActivo, ultimoAcceso, accesoPorTenant[] }

Pestaña       { id, tenantId, rolId, nombre, icono, pregunta, orden,
                heredadaDe, chatSugerencias[] }

Panel         { id, pestañaId, tipo, metricId, params,
                colStart, colSpan, rowSpan, colapsado, heredadoDe }

Métrica       { id, tenantId, nombre, entidad, familia, forma, dimensiones[],
                unidad, capa, fuente, frescura, ventana, direccionSemantica,
                base, intervalo, estado, catalogVersion }
```

**Campos de gobierno obligatorios en toda métrica:** `capa` (BRONZE·SILVER·GOLD), `fuente`,
`frescura`, `base`, `estado`. Sin ellos la métrica no se promueve al catálogo.

`estado` ∈ `DISPONIBLE` · `DEGRADADO` · `BLOQUEADO` — dispara el principio 15.

`SuperAdmin` es la única entidad **sin `tenantId`**: opera sobre la plataforma, no dentro de
un cliente. Por eso se administra en A1 y no en A3 (§7.3), y por eso `accesoPorTenant[]`
registra su entrada a los datos de cada tenant — el privilegio transversal se compensa con
trazabilidad.

`catalogVersion` viaja en cada payload. Cuando cambia la definición de una métrica, los
registros históricos siguen apuntando a la versión vigente cuando se generaron.

---

## 4 · Grilla y unidades

**12 columnas. Gap 16px. Fila base 80px.**

El alto se declara en `rowSpan` (múltiplos enteros de fila + gap), **nunca en píxeles
sueltos**. Esto es lo que hace posible redimensionar arrastrando sin romper la alineación
horizontal.

**A una columna el `rowSpan` es un piso, no una medida** (2026-08-21). La razón del alto fijo
es la alineación horizontal, y a una sola columna **no hay con qué alinearse**: sostenerlo igual
recorta contenido. Medido a 360px, el resumen ejecutivo necesita catorce líneas de prosa y en
368px entran nueve. El panel arranca en su alto declarado y solo crece si su cuerpo lo pide, así
que sigue siendo `rowSpan` y no un píxel suelto.

```
alto = rowSpan × 80 + (rowSpan − 1) × 16
```

| rowSpan | Alto | Uso típico |
|---|---|---|
| 2 | 176px | Tira de KPIs compacta |
| 3 | 272px | KPI compacto, prosa breve |
| 4 | 368px | KPI, barras, tabla corta, gauge, forecast |
| 5 | 464px | Serie, tabla larga, lista, reco |
| 6 | 560px | Matriz mediana |
| 7 | 656px | Grafo, matriz completa |

**Spans permitidos por tipo:** cada tipo de panel declara sus `colSpan` y `rowSpan`
mínimos y máximos (§6). El builder no permite salir de rango — un `kpi` en 12 columnas es un
error de composición, no una preferencia.

### 4.1 Mapeo desde alturas libres

Los prototipos previos usan alturas en píxeles sueltos. La conversión es hacia arriba: se
elige el rowSpan inmediatamente superior. Los paneles crecen; ninguno se comprime.

| Alto anterior | rowSpan | Alto nuevo | Delta |
|---|---|---|---|
| 268 | 3 | 272 | +4 |
| 330 | 4 | 368 | +38 |
| 340 | 4 | 368 | +28 |
| 348 | 4 | 368 | +20 |
| 360 | 4 | 368 | +8 |

**Por qué hacia arriba y no hacia abajo.** Comprimir un panel de KPI de 348 a 272 deja sin
espacio al medidor y a las tres filas de contexto — el panel deja de cumplir el principio 6.
Crecer 20–38px cuesta scroll y no rompe nada: el principio 4 pide densidad *con* aire, y las
alturas anteriores ya estaban ajustadas.

**Consecuencia a verificar tras la migración:** una fila de cuatro KPIs pasa de 348 a 368.
Si el contenido queda flotando arriba con un vacío abajo, el ajuste correcto es de
distribución interna del panel, no volver a alturas libres.

**Reflujo por rol:** cuando un rol no recibe un panel, la grilla se recompone según §3.4 — el
rol puede declarar su propio layout, y si no lo hace los paneles suben preservando `orden` sin
cambiar de `colSpan`.

**Responsive:** por debajo de 1280px el grid colapsa a 6 columnas (los spans se dividen a la
mitad, redondeando hacia arriba); por debajo de 768px a 1 columna, orden de lectura según
`colStart` + `orden`.

**Esta regla gobierna el grid de paneles, que es la consola del cliente (§7.1).** Las otras dos
superficies no son grids y declaran ancho mínimo en vez de colapso:

| Superficie | Ancho | Mínimo | Por qué |
|---|---|---|---|
| Consola del cliente · §7.1 | 1440 | **360** | Grid de 12: colapsa según la regla de arriba. A 360 es una columna |
| Administración · §7.3 | 1600 | **1280** | Son tablas. Abajo de 1280 se pierden columnas, y la degradación por columnas no es expresable sin scroll horizontal |
| Builder · §7.2 | 1600 | **1600** | El lienzo del cliente se renderiza **1:1 a 1200px** más 300 de biblioteca: a otra escala las unidades de arrastre mentirían. La excepción es B5, que va a 1440 porque muestra la consola del cliente a su ancho real |

**El mínimo de la consola es 360 desde el 2026-08-21** (PS-12). Antes decía 768, y §3.1 definía
con precisión el escalón de una columna **por debajo de ese mínimo**: la spec describía un ancho
que ella misma declaraba fuera de soporte. El escalón está implementado, probado y dibujado, así
que lo que sobraba era el mínimo, no el escalón.

> **Lo que falta para cumplirlo: las hojas laterales.** C2 abre al 60% del viewport y C3 a 940px
> fijos. A 360 la primera son 216px —menos que un panel— y la segunda no entra. **Es trabajo de
> v1.1** y está declarado como tal: hasta entonces, la consola a 360 responde con sus paneles y
> las hojas necesitan un ancho mayor. Decirlo acá es preferible a dejar la spec prometiendo algo
> que la pantalla no hace.

**Por debajo del mínimo no se degrada: no se soporta.** Dar de alta un tenant, revocar a un
super-admin o componer una pestaña no son acciones de teléfono, y una tabla que esconde su
columna de acciones es peor que una pantalla que dice que no cabe.

---

## 5 · Mapa forma → gráfico

Esta tabla es el contrato que impide composiciones inválidas. El binder del builder solo
ofrece los gráficos compatibles con la `forma` de la métrica seleccionada; los incompatibles
se muestran deshabilitados **con la razón visible**.

| Forma de dato | Gráficos compatibles |
|---|---|
| `escalar` | kpi, gauge, bullet, rings, spark |
| `escalarConIntervalo` | interval, forecast, tornado |
| `serieTemporal` | columns, area, step, multiline, spark, cycle, candle, control |
| `serieConBanda` | **forecast, control, interval** (obligatorio: nunca una línea sola) |
| `seriesMultiples` | multiline, stackarea, combo, smallmult, bump, slope |
| `categorica` | bars, columns, lollipop, donut, treemap, radial, pareto |
| `categoricaComparada` | grouped, dumbbell, tornado, slope |
| `composicion` | stacked, stacked100, donut, treemap, marimekko, waterfall, funnel |
| `matriz` | heatmap, cohort, calendar, matrix |
| `distribucion` | histogram, box, scatter, bubble, **cuadrantes** |
| `flujo` | sankey, network, funnel |
| `ranking` | bars, lollipop, bump, list, table |
| `tabular` | table |
| `prosa` | prose, reco |
| `grafo` | network |
| `perfilMultiatributo` | **radar** |

**Reglas duras del mapa:**

- `serieConBanda` **nunca** se renderiza como línea simple. Si el gráfico elegido no soporta
  banda, no está disponible para esa forma.
- `composicion` con más de 5 categorías: donut queda deshabilitado (razón: "más de cinco
  partes, ilegible en dona").
- `categorica` con etiquetas de más de 16 caracteres: columns deshabilitado, bars sugerido.
- `perfilMultiatributo` **nunca más de tres perfiles**: por encima de tres, los polígonos se
  superponen y ninguno se lee. Es el mismo tipo de tope que el de donut.
- `distribucion` con `cuadrantes` exige que los **cuatro cuadrantes estén rotulados**: el
  gráfico promete una decisión por zona y sin rótulo no la entrega.
- Toda métrica con `estado: BLOQUEADO` solo admite el tipo `blocked`.

---

## 6 · Tipos de panel

**Quince tipos.** Cada uno es una función pura: recibe `(métrica, params, span)` y devuelve el
panel. Ninguno contiene literales.

**Regla de cierre entre §5 y §6:** toda forma declarada en §5 tiene al menos un tipo que la
renderiza. Si se agrega una forma al mapa sin tipo que la hospede, sus gráficos quedan
inalcanzables desde el builder — que es lo que pasó con `composicion`,
`categoricaComparada` y `distribucion` hasta agosto de 2026.

| Tipo | Qué muestra | Formas que acepta | colSpan | rowSpan |
|---|---|---|---|---|
| `kpi` | Valor grande + medidor + 3 filas de contexto | escalar | 3–4 | 3–4 |
| `prose` | Titular en prosa + pilares. Cifras clave en acento | prosa | 8–12 | 3–4 |
| `series` | Una o más series normalizadas | serieTemporal, seriesMultiples | 5–7 | 4–5 |
| `bars` | Barras horizontales con label, valor y sublínea | categorica, ranking | 4–8 | 4–5 |
| `table` | Header sticky, numéricos a la derecha, hover elevado | tabular | 5–8 | 4–5 |
| `gauge` | Compuesto 0–100 con banda y desglose de componentes | escalar | 3–7 | 4 |
| `forecast` | Centro + banda + base metodológica | escalarConIntervalo, serieConBanda | 4–6 | 4–5 |
| `list` | Lista rankeada con scroll interno y contador | ranking | 3–5 | 4–5 |
| `reco` | Acción + ventana + impacto + base empírica | prosa | 4–5 | 4–5 |
| `blocked` | Razón, qué desbloquea, CTA | cualquiera con estado BLOQUEADO | 4–6 | 4 |
| `matrix` | Celdas con score e intensidad, header sticky | matriz | 6–12 | 5–7 |
| `graph` | Force-directed, clustering por familia | grafo, flujo | 6–12 | 7 |
| `composition` | Partes de un todo. **Declara el total repartido** | composicion | 4–8 | 4–5 |
| `comparison` | Dos medidas por categoría o dos perfiles. **Declara la brecha agregada** | categoricaComparada, perfilMultiatributo | 5–8 | 4–5 |
| `distribution` | Forma de la distribución. **Declara n y los cuartiles** | distribucion | 5–8 | 4–5 |

Los tres últimos existen porque cada uno declara algo que ningún otro tipo declara. Sin esa
obligación serían `bars` con otro nombre:

- **Una composición sin su denominador es un reparto de nada.** `composition` muestra el total
  sobre el que se reparte, y sin él no se compone.
- **Comparar sin decir cuánto separa deja el trabajo al ojo.** `comparison` declara la brecha,
  que es el dato — no el nivel de cada serie. Hospeda también `perfilMultiatributo`: un radar
  de dos perfiles es una comparación, y su brecha es tan declarable como la de un dumbbell.
- **Una distribución sin su `n` es una silueta.** `distribution` declara el tamaño de muestra y
  los cuartiles; sin ellos la forma no se puede leer.

**Anatomía obligatoria de todo panel:**

```
┌─────────────────────────────────────────────────┐
│ ● Título                        BASE · [base]   │  ← bullet de familia
│                                 [capa] · [fuente] · [frescura]
│                                                 │
│              cuerpo del panel                   │
│                                                 │
│ [dirección semántica si aplica]      [chevron]  │  ← colapsar
└─────────────────────────────────────────────────┘
```

El badge de procedencia (`GOLD · ERP · HACE 4 H`) es obligatorio. No es opcional ni
configurable por el super-admin.

El pie lleva además el **CTA de detalle**, que es desde donde se abre C2 (§7.1). Un panel sin
él es terminal: se lee y no lleva a ninguna parte.

### 6.1 Shell compacto — cuando el encabezado no entra en una línea

La anatomía de arriba supone que el título a la izquierda y la meta a la derecha caben en la
misma línea. **A colSpan 3 no caben**: el interior son 216px y solo el badge de procedencia
mide unos 230 cuando la fuente es compuesta (`ERP + Ads API`).

**Shell compacto:** misma anatomía, con la meta **apilada bajo el título** y alineada a la
izquierda. En el pie, el CTA de detalle queda reducido a su flecha.

```
┌───────────────────────┐
│ ● Título              │
│ BASE · [base]         │
│ [capa]·[fuente]·[fres]│
│                       │
│    cuerpo del panel   │
│                       │
│ [dirección]      [→ ⌄]│
└───────────────────────┘
```

**El criterio es de contenido, no de span.** El mismo choque aparece en colSpan 5 con un BASE
largo. Se usa el shell compacto **cuando el título y la meta no entran en una línea**, lo que
depende del ancho, del largo del BASE y de la fuente. Se decide al componer, mirando el render.

Para que una mala elección no rompa nada, el título de ambos shells **envuelve** en vez de
desbordar sobre la meta: el peor caso es feo, nunca ilegible.

### 6.2 Reglas de contenido a colSpan 3

El ancho más angosto que §6 permite impone dos reglas que no son de estilo sino de
composición. Ambas salieron de romper el panel en construcción, no de la teoría:

**La unidad se va al label.** §2.3 fija el valor del `kpi` en 44px como piso, y una cifra de
nueve caracteres a ese tamaño pide unos 230px contra los 216 disponibles: no cabe, y no hay
forma de que quepa. `USD 12.4M` se compone como valor **`12.4M`** con label **`USD · TOTAL`**.
El principio 6 ya exige ese label, así que la unidad tiene dónde vivir sin ceder ni el piso
tipográfico ni el rango de spans.

**La BASE entra en una línea** — unos 30 caracteres. Si envuelve, empuja el cuerpo y la última
fila de contexto se monta sobre el pie. Se acorta la BASE sin perder lo que §1.2.8 exige:
denominador y ventana.

**Un `kpi` con badge de degradación no cabe a colSpan 3 × rowSpan 4.** El badge suma una línea
y §6 fija el máximo del tipo en rowSpan 4. Se gana esa línea plegando la nota del medidor
dentro de su propio label, que es la línea menos informativa del cuerpo; así se conservan las
tres filas de contexto que este documento especifica.

---

## 7 · Inventario de pantallas

### 7.1 Consola de cliente — 5 pantallas

**C1 · Dashboard**
La pantalla principal, en cuatro bandas sobre 1440:

| Banda | Alto | Contenido |
|---|---|---|
| Navbar | 60 | Wordmark · **selector de tenant** · rol activo · **tema** · selector de período · notificaciones · CTA de chat · **punto de usuario** |
| Cabecera | 96 | Breadcrumb, **la pregunta operativa de la pestaña** y el rango del período |
| Menú | 52 | **Las pestañas del rol, horizontales** |
| Canvas | — | Paneles en grid de 12, **1200 centrados**, padding 32 |
| Barra inferior | 56 | Preguntar a Synapse · indicador de contexto |

**La barra inferior no exporta ni imprime**, y esa ausencia es la decisión: la fila de arriba
las listaba hasta el 2026-08-20 por haber quedado escrita antes de que se quitaran. Ver más
abajo.

**El chrome también colapsa.** §4 define qué hace la grilla de paneles a 1280 y a 768, y hasta
el 2026-08-21 no decía nada de lo que hay alrededor — así que la consola colapsaba los paneles
y dejaba arriba un navbar de ocho elementos que a 768 no entra. El bloque de tenant solo mide
unos 280px.

| Banda | ≥1280 | 768–1279 | ≤767 |
|---|---|---|---|
| **Navbar** | los ocho elementos | wordmark · tenant · rol · período · CTA · **menú** · usuario | wordmark · **menú** · usuario |
| **Cabecera** | pregunta + rango | pregunta + rango | **solo la pregunta** |
| **Menú de pestañas** | las pestañas, horizontales | las pestañas, horizontales | **un selector** |
| **Barra inferior** | preguntar + contexto + decisiones | igual | **sin el contexto** de tenant y período |

Tres reglas detrás de esa tabla:

1. **La pregunta no se suelta nunca.** §1.1 la hace obligatoria: es lo que dice qué responde la
   pantalla, y una consola sin ella es una grilla de números.
2. **El punto de usuario tampoco**, y por lo mismo que existe: con `alcance: plataforma` es lo
   único que declara con qué identidad se entró.
3. **Lo que se pliega en un menú no desaparece: se agrupa, y sigue siendo un control.** El rol
   dentro del menú es el mismo `select`, no un rótulo de solo lectura: plegar no es quitar.
   Ocultar sin destino sería el problema que §8 nombra.
4. **El contexto del pie sí se suelta**, y solo él: el tenant y el período ya los declara el
   navbar, así que repetirlos abajo es lo primero que sobra cuando falta ancho.

**El menú es horizontal, no una sidebar.** Sin sidebar, el canvas de 1200 se centra en los
1440 con márgenes de 120 — deliberado: mantiene la columna en **exactamente 80px**, que es lo
que hace que `colSpan N` y `rowSpan N` midan lo mismo (§4). Ensanchar el canvas a 1376 daría
columnas de 100px y rompería esa equivalencia.

La cabecera lleva la **pregunta operativa** porque §1.1 la exige: cada pantalla responde una
pregunta concreta, y el usuario debe verla antes que los números. El rango del período vive
ahí como contexto de lectura, no como segundo control — el control es el de la navbar.

El **selector de tenant** declara que el tenant es una dimensión y no un título. Sin él, la
navbar afirma que la consola es de un solo cliente.

El **interruptor de tema** es un icono, no un rótulo, y muestra a dónde lleva y no dónde se
está: en oscuro se ve un sol. Es la convención de todo interruptor de tema, y la inversa hace
dudar en cada uso. Su etiqueta accesible sí dice las dos cosas, porque quien la escucha no
tiene el contexto visual que hace obvio el icono. El tema es preferencia de usuario y se
persiste por usuario (§2.4).

El **punto de usuario** declara con qué identidad se entró. Es **redondo**, y esa es toda su
diferencia con el avatar de tenant que tiene al lado: los dos miden 30px y la forma es lo
único que separa «el cliente» de «vos» sin agregar un rótulo. Abre un panel con nombre,
correo, rol con su descripción y cliente.

Existe por dos razones y la segunda pesa más. La primera es la simetría: **administración ya
declaraba la identidad** con su chip `SUPER-ADMIN · NOMBRE`, y la consola era la única
superficie sin ella. La segunda es el alcance. Con `alcance: plataforma` —equipo interno
mirando la consola de un cliente— el chrome declaraba de qué cliente se trata pero no con qué
identidad se entró ni que el acceso queda auditado; el panel lo dice, y **solo en ese
alcance**, porque con alcance de usuario no hay nada excepcional que declarar.

Ninguno de los dos muestra vocabulario de infraestructura: §7.3 sigue en pie.

Cambiar el período recalcula todos los paneles sin recomponer el layout. **Cambiar de tenant
sí recompone** (§3.4): otras pestañas, otros paneles.

- *Estados:* cargando (esqueleto por panel, nunca spinner global) · panel degradado · panel
  bloqueado · sin datos para el período · error de carga por panel.

**C2 · Drill-down de panel**
Se abre desde el CTA de un panel. Overlay lateral ancho (60% de viewport) o vista completa
según el tipo. Muestra la métrica desagregada, la tabla origen y el linaje hasta la fuente
cruda.

**C3 · Chat expandido**
Overlay lateral. Selector de contexto (pestaña activa), chips de consulta sugerida por
pestaña, campo anclado abajo con **entrada por voz**. La respuesta trae: titular en prosa,
figura principal, descomposición en barras, puntos de lectura, fuentes consultadas y
**límite declarado**. Toda respuesta muestra el SQL generado en un desplegable — es la
auditabilidad que sostiene el producto.

- *Estados:* vacío con sugerencias · escuchando (voz) · pensando · respuesta · sin
  competencia ("esa pregunta requiere un feed que no está conectado").

**C4 · Detalle de hallazgo**
Un hallazgo con su hipótesis, la acción propuesta, la ventana de medición y —si ya cerró— el
resultado observado contra lo estimado. Es la pantalla que hace visible el ciclo de
aprendizaje.

Se alimenta de las decisiones **aprobadas o rechazadas** en el panel de recomendaciones
(§1.3.16): sin ese registro no hay fecha de compromiso ni autor, y el «observado contra
estimado» no tiene contra qué medirse.

El panel de recomendaciones crece hacia una **cola de accionables que registra el equipo de
growth**, no solo propuestas derivadas del modelo. Por eso cada ítem declara su autor: aprobar
sin saber quién propone no es una decisión, es un trámite.

**C5 · Sin permiso**
Pantalla honesta: qué se pidió, por qué no está disponible para este rol, a quién solicitar
acceso. No es un 403 genérico.

**Interacción del usuario de cliente: dos ejes, y no se mezclan** (`PS-15`, 2026-08-21).

*Con la consola* puede: cambiar período, expandir un panel colapsado, abrir drill-down,
chatear (texto o voz), cambiar tema. **No puede** mover, redimensionar, agregar ni quitar
paneles. El layout es estado de configuración, no preferencia de usuario.

*Sobre lo que la consola le propone* puede **registrar una decisión**: aprobar o rechazar una
recomendación. Toda decisión declara **autor, fecha y razón**, y **no se renegocia** una vez
conocido el resultado — el criterio se fija antes, no después.

La separación no es formal. La primera lista protege una sola cosa —que el cliente no
reconfigure la consola— y por eso sus cinco ítems son maneras de mirar. Una decisión no
reconfigura nada: es un acto de negocio que queda registrado, y por eso necesita reglas que
una lista de interacciones no sabe expresar. Mezclarlos fue lo que dejó la aprobación fuera de
la enumeración durante toda la v1.0, **aun estando concedida en la regla dura 1.3.16 y en la
definición de C4**, que sin ella no tiene contra qué medir.

**Tampoco exporta ni imprime** (decisión de producto, 2026-08-15). Una cifra fuera de Synapse
pierde lo que la hace confiable: su BASE, su procedencia, su frescura y su dirección
semántica. Todo §1.3 existe para que ningún número circule sin esos cuatro respaldos, y un
archivo exportado los deja atrás en el primer reenvío. Si el dato tiene que salir, sale por
una integración que los conserve — no por un botón que produce una cifra huérfana.

Incluye **descargar la tabla origen desde el drill-down**: si la cifra publicada no puede salir
sin sus respaldos, las filas crudas menos todavía. C2 sirve para **auditar dentro** de la
consola, no para sacar el dato de ella.

### 7.2 Builder — 6 pantallas

**B1 · Selector de contexto de edición**
Elegir tenant y rol. Muestra qué pestañas existen, cuáles heredan de la plantilla de vertical
y cuáles tienen override. Punto de entrada de todo el builder.

**B2 · Canvas de composición**
La pantalla central. Grid de 12 visible con guías. Panel lateral izquierdo con la biblioteca
de gráficos agrupada (Comparación · Composición · Evolución · Distribución · Estado). Los
paneles se arrastran, se mueven y se redimensionan por handles, siempre en unidades de grilla.

- Slot vacío: rectángulo punteado con label `SLOT VACÍO · 4×4` y CTA a la biblioteca.
- Panel heredado: borde punteado tenue + badge `HEREDADO`. Editarlo crea el override.
- Colisión: el panel en conflicto se marca; no se permite soltar encima.
- Guardado explícito, con indicador de cambios sin guardar.

**B3 · Selector de gráfico**
Se abre al soltar un tipo de la biblioteca. Muestra los gráficos del grupo con preview real.
Cada uno declara qué forma de dato acepta.

**B4 · Binder de métrica**
El corazón del control de calidad. Elegido el tipo de panel, lista **solo** las métricas del
catálogo compatibles con su forma. Las incompatibles aparecen listadas y deshabilitadas
**con la razón** ("requiere serie temporal · esta métrica es categórica"). El rechazo
explicado es lo que enseña el sistema.

Debajo, los parámetros del panel: ventana, corte, dimensión de desagregación, orden, límite
de filas. Todos acotados por lo que la métrica declara en `dimensiones[]`.

**B5 · Vista previa por rol**
Renderiza la composición exactamente como la verá el rol seleccionado, con datos reales y sin
chrome de edición. Un toggle vuelve a edición. Es la validación antes de publicar.

**B6 · Historial de versiones**
Lista de publicaciones de una pestaña: quién, cuándo, qué cambió. Permite revertir. Sin
esto, un error de composición en producción no tiene vuelta atrás.

### 7.3 Administración — 5 pantallas

El alcance no es uniforme y cada pantalla lo declara en su chrome:

| Pantalla | Alcance | Se ve en |
|---|---|---|
| **A1 · Clientes y plataforma** | plataforma | sin selector de tenant |
| **A2 · Ficha de cliente** | tenant | selector de tenant en el navbar |
| **A3 · Usuarios** | plataforma | sin selector; el tenant es una **columna y un filtro** |
| **A4 · Catálogo de métricas** | tenant | selector de tenant |
| **A5 · Salud de feeds** | tenant | selector de tenant |

A3 cruza clientes porque su regla dura —el tenant de un usuario no se edita— solo es visible
cuando el tenant es una columna que se compara, no un contexto implícito.

**Regla dura de toda la superficie: el vocabulario de infraestructura no se muestra.** Nombres
de base, de rol técnico, de warehouse o de grant no aparecen en ninguna pantalla. Esa capa la
opera el equipo interno y ningún usuario de administración actúa sobre ella; mostrarla sugiere
una acción que no existe y es una fuente de confusión, no de control. Lo que sí se muestra es
la **consecuencia**: si el acceso está vigente, cuándo se verificó y qué hacer si no lo está.
La única excepción es la declaración de **subprocesadores**, que es una obligación legal de
nombrar a quién procesa el dato — no una palanca operativa.

**A1 · Clientes y plataforma**
Es la única pantalla de **alcance plataforma**; A2–A5 operan dentro de un tenant. Dos bandas:

*Clientes.* Lista de tenants con estado, vertical, cantidad de usuarios, frescura del feed más
atrasado y última publicación. CRUD completo. Crear un tenant exige elegir plantilla de
vertical.

*Super-admins.* Quiénes pueden operar la plataforma misma. Por cada uno: nombre, correo,
**MFA** y último acceso. Un `SuperAdmin` no tiene `tenantId`, así que no puede vivir en A3,
donde el tenant es obligatorio y no editable — vive acá.

Esta banda concentra el privilegio más alto del producto, así que declara sus propias reglas
en pantalla y no solo en el backend:

- **Un super-admin sin MFA se muestra como degradado**, con la misma gramática de §8 que un
  feed vencido: estado, razón y qué lo desbloquea. No es una fila normal con un ícono gris.
- **No se puede quedar sin super-admins**: revocar el último se bloquea y dice por qué.
- **Nadie se revoca a sí mismo** — la fila propia va marcada y sin acción destructiva.
- Alta por invitación con MFA obligatorio antes del primer acceso, nunca con contraseña fijada
  por quien invita.
- El acceso de un super-admin a los datos de un tenant es **auditable**: la ficha declara
  cuándo entró por última vez a cada uno.

**A2 · Ficha de cliente**
Datos del tenant, roles definidos con su descripción, pestañas por rol, estado del acceso a
datos y subprocesadores. Es donde el super-admin define el criterio de acceso por rol.

**No expone el mapeo a la infraestructura de datos.** El estado se declara —acceso vigente,
última verificación, CTA para reverificar— sin nombres de base ni de rol técnico.

**A3 · Usuarios**
Lista filtrable por tenant y rol. CRUD. El campo tenant es obligatorio y no editable después
de crear — cambiar de tenant a un usuario es eliminarlo y crear otro. Alta con invitación por
correo.

**A4 · Catálogo de métricas**
El inventario de lo que la plataforma puede afirmar sobre un cliente. Por métrica: forma,
capa, fuente, frescura, ventana, dirección semántica, estado y en cuántos paneles se usa.
Filtro por estado. Acción de sincronizar desde el modelo semántico.

Editar una métrica en uso advierte qué paneles afecta antes de guardar.

**Sincronizar y editar no compiten: cada campo tiene un solo dueño** (2026-08-21, PS-13). La
semantic view sabe que `REV_TOTAL` es una medida en USD sobre `VW_ECOMM_DAILY_SOT` con dimensión
`DATE_TD`; **no sabe que se llama «Ventas», que es de la familia `demanda`, que se dibuja como
`kpi` ni que más alto es mejor**. Esa segunda capa es lo que Synapse agrega, y es la única que
se edita.

| Grupo | Campos | Quién escribe |
|---|---|---|
| **Derivado** | `entidad` · `forma` · `unidad` · `dimensiones` · `capa` · `fuente` · `granoMinimo` · `estado` · `bloqueoRazon` | la **sincronización**. A4 los muestra con su origen y **no los ofrece editar** |
| **Editorial** | `nombre` · `familia` · `tipoPanel` · `direccionSemantica` · `notaLectura` · `ventana` · `alcance` | la **edición**. La sincronización no los toca |
| **Del sistema** | `id` · `catalogVersion` | ninguno de los dos |

La regla es de **propiedad, no de fusión**: no hace falta resolver conflictos porque no pueden
ocurrir. Con dos precisiones:

1. **Un campo editorial puede estar restringido por uno derivado**, y la restricción se verifica
   al guardar: `tipoPanel` tiene que ser compatible con `forma` (§5) y `ventana` tiene que ser
   expresable en el `granoMinimo` de la fuente. Si una sincronización cambia `forma` y el
   `tipoPanel` elegido deja de valer, **la métrica queda pendiente de recomposición** — la
   plataforma no elige un tipo por el humano.
2. **`estado` es derivado con un override acotado**, y es el molde de cualquier excepción
   futura: se deriva de frescura contra cadencia por tolerancia, y una métrica puede
   **endurecerlo** —de degradado a bloqueado— **pero nunca ablandarlo**. Acotado, en una sola
   dirección y declarado.

**A5 · Salud de feeds**
Estado por fuente: última carga, frescura, filas procesadas, filas que fallaron validación
Silver→Gold. Es la pantalla que explica por qué una métrica está degradada o bloqueada.

**A6 · Cola de accionables** (`PS-16`, 2026-08-21)
La bitácora de lo que se decidió y si funcionó. Por accionable: la acción, su hipótesis, la
métrica con que se medirá, la ventana del experimento, el estado en su ciclo y —al cerrar— el
resultado contra lo estimado, con su veredicto.

**El registro no empieza acá: empieza en el hallazgo.** Un accionable nace de una consulta —el
chat de C3 es el origen esperado— y se promueve **en el momento de verlo**, declarando ahí mismo
hipótesis, métrica y plazo. A6 administra la cola; no es donde se la llena. La regla de cobertura
—toda observación se resuelve, ninguna queda en el limbo— solo se cumple si promover ocurre donde
está la observación.

**Promover es interno.** Requiere una capacidad que el super-admin asigna **por usuario**, no por
rol: §1.4.20 ya separa permiso de composición, y esta vive en el eje del permiso. Un usuario sin
la capacidad no ve la acción y el backend no le acepta la escritura.

**Lo que el cliente ve es la consecuencia, no la administración**: la cola de sus accionables y
sus resultados, **positivos o negativos**, en el panel de recomendaciones de C1 y en el detalle
de C4. Un resultado negativo no se oculta — es lo que hace creíble a la bitácora.

### 7.4 Asistente de reporte — mapeado, fuera de v1.0

Cuatro pantallas: intención → propuesta de Cortex → verificación y ajuste → promoción al
catálogo.

**El flujo tiene un paso de promoción obligatorio en el medio.** Cortex propone SQL, forma de
dato y gráficos compatibles. El super-admin verifica y ajusta. Solo entonces se registra como
métrica del catálogo con todos sus campos de gobierno. El panel se ancla al `metricId`, nunca
al SQL.

Sin ese paso, el asistente multiplica métricas fuera del modelo semántico y el diferenciador
del producto se pierde. Cortex propone, el catálogo gobierna.

---

## 8 · Estados obligatorios

Toda pantalla que carga datos implementa estos seis. Ninguno es opcional.

| Estado | Tratamiento |
|---|---|
| **Cargando** | Esqueleto con la forma del panel final. Nunca spinner global: los paneles cargan en paralelo y aparecen a medida que llegan |
| **Vacío** | Invitación a actuar, no un mensaje de error. Dice qué falta y cómo conseguirlo |
| **Degradado** | El panel muestra el dato con un badge que declara la limitación y su alcance |
| **Bloqueado** | Sin número. Razón, qué lo desbloquea, CTA. Fondo levemente distinto |
| **Sin permiso** | Qué se pidió, por qué no está disponible para este rol, a quién pedirlo |
| **Error** | Qué falló y qué hacer. Reintentar por panel, nunca recargar toda la vista |

**Copy de estados.** Los errores no se disculpan y nunca son vagos. Se escriben desde el lado
del usuario: "El feed de inventario tiene 31 horas" y no "Error al obtener snapshot".

---

## 9 · Contratos de datos

Cuatro objetos gobiernan todo el render. Ningún número vive en el markup.

### 9.1 `SYNAPSE_CATALOG` — qué puede afirmar la plataforma

```js
{
  id: 'inv_riesgo',
  nombre: 'Venta diaria en riesgo',
  entidad: 'inventario',
  familia: 'inventario',
  li: 1,
  forma: 'escalarConIntervalo',
  dimensiones: ['division', 'genero', 'region'],
  unidad: 'USD',
  capa: 'GOLD',
  fuente: 'ERP + Analítica de sitio',
  frescura: '2026-08-11T06:40:00Z',
  ventana: 'Venta media 30 días',
  base: '312 SKU críticos sobre 18.240 activos',
  direccionSemantica: 'MÁS BAJO = MEJOR',
  intervalo: { lo: 31, hi: 46, nivel: 0.80 },
  estado: 'DISPONIBLE',
  catalogVersion: 12
}
```

### 9.2 `SYNAPSE_BLOCKS` — qué acepta cada tipo de panel

```js
{
  tipo: 'forecast',
  formasAceptadas: ['escalarConIntervalo', 'serieConBanda'],
  colSpanMin: 4, colSpanMax: 6,
  rowSpanMin: 4, rowSpanMax: 5,
  paramsDisponibles: ['horizonte', 'nivelIntervalo', 'corte']
}
```

### 9.3 `SYNAPSE_TENANTS` — la composición vigente

```js
{
  id: 'ua_mx',
  nombre: 'Under Armour México',
  vertical: 'retail_apparel',
  plantillaOrigen: 'retail_apparel_v2',
  roles: [{
    id: 'planner',
    nombre: 'Planner',
    snowflakeRole: 'RL_BT_UA_CLIENT_BI',
    pestañas: [{
      id: 'inventory',
      nombre: 'Inventory & Shopping',
      icono: 'box',
      pregunta: '¿Tenemos stock y lo estamos mostrando?',
      chatSugerencias: ['Cuánto perdemos al día si no repongo los 312 SKU críticos'],
      paneles: [
        { id:'p1', tipo:'kpi', metricId:'inv_kpi', colStart:1, colSpan:4, rowSpan:4 },
        { id:'p2', tipo:'forecast', metricId:'inv_riesgo', colStart:5, colSpan:4, rowSpan:4 },
        { id:'p3', tipo:'blocked', metricId:'feed_gap', colStart:9, colSpan:4, rowSpan:4 }
      ]
    }]
  }]
}
```

### 9.4 `SYNAPSE_DATA` — los valores

Indexado por `metricId` + `periodo`. Cada nodo trae sus campos de gobierno:

```js
{ valor, base, capa, fuente, frescura, intervalo, catalogVersion }
```

**Regla de separación.** El catálogo define; los datos valorizan. En Pencil hoy están
mezclados (`CAT` contiene `p1`/`p0`). Separarlos es el primer refactor: cuando llegue
Snowflake, `SYNAPSE_DATA` se reemplaza por respuestas de API sin tocar una línea de layout.

---

## Anexo · Secuencia de construcción

Cuatro brechas separan el prototipo actual de esta especificación. **El orden importa**: cada
paso apoya sobre el anterior, y hacer el 4 primero significa envolver una estructura que
todavía va a cambiar.

### Paso 1 · Migrar el alto a rowSpan

Toca `CHAPTERS[].layout`. Reemplazar `{ id, span, h }` por
`{ id, tipo, metricId, colStart, colSpan, rowSpan }`.

Aplicar la tabla de conversión de §4.1. Verificar después que los rangos de cada tipo (§6) se
respeten: un `series` en rowSpan 3 queda fuera de rango.

**Por qué primero.** Es la base estructural. Sin unidades de grilla enteras, el builder no
puede redimensionar arrastrando, y ese es el caso de uso central del super-admin.

### Paso 2 · Separar catálogo de datos

Hoy `CAT[].p1` y `CAT[].p0` mezclan definición con valores. Partirlo en dos:

- **`SYNAPSE_CATALOG`** — definición pura, sin un solo número (§9.1)
- **`SYNAPSE_DATA`** — valores indexados por `metricId` + período (§9.4)

**Decisión que hay que tomar acá: la clave de período.** `p1`/`p0` son posiciones relativas
("actual" y "anterior"). En el modelo real son fechas. Migrar a identificador absoluto
(`2026-07`, `2026-06`) durante este paso, no después — cuando llegue el selector de semanas,
una clave relativa obliga a rehacer el índice completo.

```js
SYNAPSE_DATA = {
  'revenue': {
    '2026-07': { valor:'USD 4.28M', base:'…', capa:'GOLD', … },
    '2026-06': { valor:'USD 4.02M', base:'…', capa:'GOLD', … }
  }
}
```

### Paso 3 · Agregar procedencia

Sobre el catálogo ya separado, completar los campos de gobierno de cada métrica: `capa`,
`fuente`, `frescura`, `base`, `estado`, `direccionSemantica`, `forma`.

`forma` es el más importante y el que no existe hoy: gobierna qué gráficos son válidos (§5) y
es lo que hace posible el binder del builder. Sin él, el super-admin puede anclar una métrica
categórica a un gráfico de serie temporal.

Renderizar el badge de procedencia en la anatomía de panel (§6). Es obligatorio y no
configurable.

### Paso 4 · Introducir tenant y rol

Envolver todo lo anterior en `SYNAPSE_TENANTS` (§9.3). Dos tenants con **composiciones
distintas**, no solo números distintos:

- **UA MX** — retail/apparel. Cuatro pestañas, layout completo.
- **Terpel** — combustibles. Menos pestañas, sin inventario por categoría de apparel, y con
  al menos una métrica en estado `BLOQUEADO` para ejercitar el principio 15.

Cambiar el tenant en el selector debe recomponer visiblemente la pantalla: paneles que
desaparecen, paneles nuevos que entran, pestañas del menú que cambian. **Es la prueba
funcional de que la arquitectura configurable funciona** — más importante que cualquier
detalle estético del prototipo.

---

### Verificación de cierre

Antes de dar la migración por terminada:

- [ ] Ningún `h:` en píxeles queda en el layout
- [ ] Ningún número vive dentro de `SYNAPSE_CATALOG`
- [ ] Toda métrica declara `forma`, `capa`, `fuente`, `frescura` y `estado`
- [ ] Todo panel renderiza su badge de procedencia
- [ ] Cambiar de tenant recompone la pantalla, no solo los valores
- [ ] Los seis estados de §8 tienen al menos un caso visible en el prototipo
- [ ] Ningún panel queda fuera de los rangos de span de §6