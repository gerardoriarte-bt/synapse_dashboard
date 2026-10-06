# Donde el `.pen` y lo construido difieren · 2026-09-22

> **Propuesta de spec abierta, con fecha.** Lo que las fuentes normativas no
> resuelven y el código no puede inventar. **El agente no modifica `design.md`
> ni el `.pen`**: acá se deja la divergencia escrita y la decisión la toma un
> humano.

## Por qué este documento y no otro

`CLAUDE.md` fija el mecanismo: *«Donde dos fuentes difieran, gana la más
específica para lo que se está implementando **y se abre una propuesta de
spec**. No se resuelve en silencio.»* Cada vez que eso pasó, la divergencia
quedó anotada **en el comentario del archivo donde apareció**. Eso sirve para
quien lee ese archivo y no sirve para decidirlas: nadie las ve juntas.

**Pero no se juntan todas acá, y esa es la parte que importa.** Las que son del
**contrato** ya tienen casa —`docs/B0.9-preguntas-abiertas.md`— y copiarlas
sería el error del 2026-09-14: cuatro documentos diciendo lo mismo y el más
viejo mintiendo. Al final de este hay un índice de dónde vive cada una.

**Lo que se junta acá son las del `.pen`**, que no tienen ninguna: el dibujo y lo
construido difieren, y hace falta decidir **cuál de los dos se corrige**.

Ninguna bloquea código. Todas tienen una lectura implementada y escrita al lado.

---

## 1 · Dos valores que el `.pen` escribe y su propia escala no puede emitir

**Quién decide** · diseño · **Bloquea** · nada

El frame `Chat` de §PEN:C3 lleva dos literales crudos mientras los otros nodos
de esa misma pantalla usan tokens:

| El dibujo | La escala que el `.pen` emite | Se usó |
|---|---|---|
| `radius [16, 0, 0, 16]` | termina en `--radius-xl: 10px` | el token · `rounded-l-xl` |
| velo `#0B0B0CCC` | no hay color de velo | `shad`, el único negro translúcido del sistema |

El segundo tiene un argumento extra: **«un hex literal es un bug» es regla
dura**, y `shad` se invierte con el tema, que un hex fijo no hace.

### ✅ DECIDIDA · 2026-09-22 · se usan los que ya hay

«Usá los que hay.» **Sin cambio de código**: es lo que la hoja ya hace desde
F5.17, y lo que cambia es que deja de ser un apaño y pasa a ser la forma
correcta.

Queda anotado para el día que alguien mire el dibujo y vea un 16: **el `.pen`
ahí se pide a sí mismo algo que no puede emitir**, y quien manda es la escala.

**EJECUTADA EN EL DIBUJO el 2026-09-28.** Hasta ese día la decisión vivía sólo del
lado del código y el `.pen` seguía con los literales — así que quien abriera el
dibujo veía el 16 y el hex, y la auditoría del 28 encontró que **el velo era hex en
tres pantallas y no en una**: C2, C3 expandido y C3 colapsado.

Con el permiso de `docs/INSTRUCCIONES-2026-09-28-diseno-en-el-pen.md`, los cinco
nodos quedaron retipeados: los tres velos a **`$shad`** y los dos radios a
**`[$r-xl, 0, 0, $r-xl]`**. El velo del dibujo se aclara —`$shad` es 55% de negro
donde el hex era 80%— y eso es la consecuencia de la decisión, no un efecto
colateral: es el único negro translúcido del sistema y se invierte con el tema.

En el dibujo quedan **nueve hex** y ninguno es un bug. **Los nueve viven en
`Synapse · Identidad`**: siete en `Sec · Logo / Versiones / Sobre claro`, que es
una pieza en tema claro sin importar el tema, y dos son los chips de
`Sec · Naranja / Comparación`, que existen para mostrar el valor del naranja en
cada tema y por eso son literales.

La primera redacción decía «los chips de color del sistema de diseño», y está
mal: la auditoría del 2026-09-28 los ubicó en Identidad y se remidió acá nodo por
nodo, con su cadena de padres. Son colores de **marca**, que es justo lo que la
auditoría pide que nadie «arregle».

## 2 · Dos tamaños más, del mismo modo de falla · A2 §9

**Quién decide** · diseño · **Bloquea** · nada

El mismo caso, encontrado al construir `ROLES Y COMPOSICIÓN` el 2026-09-22:

| El dibujo | La escala | Se usó |
|---|---|---|
| nombre del rol · `font-display` **17** | va de `--text-titulo: 15px` a `--text-titulo-lg: 20px` | `text-titulo` |
| nombre de la pestaña · `font-body` **12.5** | va de `--text-celda: 12px` a `--text-cuerpo: 13px` | `text-celda` |
| título del selector de gráfico · `font-display` **19** · §PEN:B3 | el mismo hueco, del otro lado: `--text-titulo: 15px` a `--text-titulo-lg: 20px` | `text-titulo-lg` · agregado el 2026-09-29 |

**Y con el tercero el patrón deja de poder leerse como descuido.** Los dos
primeros salieron de una pantalla; el del 2026-09-29 sale de otra, dibujada en
otro momento, y cae **en el mismo hueco de `font-display`** — entre 15 y 20. Tres
nodos en ese rango es la evidencia que faltaba: o la escala gana un escalón ahí,
o el `.pen` se alinea a los dos que ya tiene.

**Esto NO es una pregunta nueva: es evidencia para la 9 de B0.9**, que ya
pregunta si §2.3 gana una tabla para `font-body` y `font-display`. Ahí está
anotado que `--text-lead` y `--text-titulo-lg` se apoyan en **dos nodos cada
uno** y que con dos no se distingue una decisión de un descuido.

Estos dos tamaños son el otro lado de la misma moneda: nodos del `.pen` que
**no** llegaron a ser token.

### ✅ DECIDIDA · 2026-09-22 · se usan los tokens vecinos

Delegada al front —«usá lo que consideres mejor para no perder estructura»— y
resuelta así, con dos razones:

**La primera es material.** La escala la emite `tools/gen-tokens.py` desde
variables declaradas **dentro del `.pen`** (prefijo `ts-`). Sumar un 17 o un
12.5 exige editar el dibujo, y el agente no lo edita. Con los tokens que hay, la
elección es entre el vecino de arriba y el de abajo.

**La segunda es de estructura, que es lo que se pidió no perder.** Lo que
sostiene una jerarquía es el **escalón**, no el valor absoluto:

| | El dibujo | Elegido | Efecto sobre el escalón |
|---|---|---|---|
| Nombre del rol contra su cifra | 17 contra 20 | **15** contra 20 | El escalón **crece**: la cifra domina más, que es lo que la tarjeta quiere decir |
| Nombre de pestaña contra su pregunta | 12.5 contra 9 | **12** contra 9 | Medio píxel · el escalón no se mueve |

Ninguna de las dos invierte una relación ni acerca dos niveles que el dibujo
separa. **Si algún día §2.3 gana su tabla y la escala suma el 17**, esto se
revierte cambiando un token y nada más.

## 3 · El logotipo a color no entra en una superficie con datos

**Quién decide** · diseño · **Bloquea** · nada

El `.pen` empieza los tres chromes con la marca, y hasta hoy acá decía que la
versión a color «choca con las familias cromáticas: su azul y su violeta son los
de `demanda` e `inventario`».

**Se midió el 2026-09-22 y la afirmación era demasiado fuerte.** Los matices, en
grados:

| | Matiz | Saturación | Distancia a la familia |
|---|---|---|---|
| `brand-azul` `#4842fa` | 242° | 95% | **42–44° de `demanda`** (198–200°) · no chocan |
| `brand-violeta` `#846dc5` | 256° | **43%** | **14–16° de `inventario`** (270–271°) · mismo matiz |

**El azul no choca: son colores distintos.** Un índigo saturado contra un celeste
no se confunden ni de lejos.

**El violeta sí comparte matiz** con `inventario`, pero a **43% de saturación
contra 81–95%**: es mucho más apagado que cualquier dato, que es justamente lo
que lo hace leer como marca y no como serie.

### ✅ DECIDIDA · 2026-09-22 · va el color, y el `.pen` dice DÓNDE

«Va el color.» Al ir a ejecutarlo apareció que **la regla no era mía**: el
capítulo `Identidad` del `.pen` declara **tres** versiones y para qué superficie
es cada una, y es normativo.

| Versión | Para | Arte |
|---|---|---|
| **Lockup completo** · wordmark blanco con Lo.Bueno en naranja | «Oscura sin datos» · superficies de marca. «No introduce azul ni violeta» | `synapse-logo-dark.png` |
| **Monocromo, sin bajada** | «La del **navbar y el pie**, en los DOS temas» | `wordmark.png` + máscara |
| **Degradado** · «naranja a violeta a azul» | «Reservado a superficies **sin datos**: portada de export, **login**, materiales» | `synapse-logo-light.png` |

Y la regla dura, textual:

> **NO · NUNCA EN DATOS NI EN CHROME DE PANEL.** «El azul #4842FA y el violeta
> #846DC5 caen sobre las familias demanda e inventario. Usarlos como chrome
> rompería la **persistencia cromática**, que es el mecanismo de asociación
> entre vistas.»

**Mi medición no alcanza para mover eso, y conviene decirlo.** Es cierto que el
azul de marca está a 42–44° de `demanda` y que no se confunden a la vista. Pero
el argumento del `.pen` **no es de matiz sino de sistema**: en Synapse un color
significa una familia, y meter un cuarto azul en el chrome enseña que a veces no
significa nada. Una regla de sistema no se refuta con una distancia de matiz.

**Ejecutado así:** el degradado entra donde el `.pen` lo manda y **el login era
el caso más flagrante** — ahí había texto plano, ni siquiera el monocromo. El
chrome de la consola conserva el monocromo.

**Si la intención era el chrome**, eso sí es una decisión de marca que cambia el
capítulo `Identidad`, y el agente no lo edita: se dice y se decide.

### ⚠️ REABIERTA Y DECIDIDA · 2026-10-06 (humano) · el degradado va también al chrome

Llegó el arte real del logotipo —`design/SYNAPSE BT COLORS - LIGHT BKG (3).png`— y
con él la instrucción de usarlo en el header. **Se le señaló la regla del `.pen`
antes de ejecutar** —«NUNCA EN DATOS NI EN CHROME DE PANEL»— y la decisión fue
llevar el degradado igual a los tres navbars: consola, admin y builder.

**Contradice el capítulo `Identidad`, y por eso es un pedido a diseño:** que el
`.pen` lo refleje, o que lo discuta. El agente no edita el `.pen`.

Lo que cambió en el código, en `src/surfaces/console/Wordmark.tsx`:

- **La letra es la real.** La máscara anterior era una grotesca portada de
  `synapse_v2`; la nueva sale del arte, recortada a la palabra.
- **El degradado es el del arte, no tres tokens.** Es en dos ejes —el naranja se
  aclara hacia abajo— y un `linear-gradient` de tres paradas no lo reproduce.
- **La bajada «A LICENSED SOLUTION BY LO.BUENO GROUP» queda afuera**: va en azul
  marino, desaparece en tema oscuro y a 20px no se lee.

## 4 · El punto decimal, que el `.pen` usa para las dos cosas

**Quién decide** · diseño · **Bloquea** · nada

Ninguna fuente normativa fija el formato numérico, y **el `.pen` se contradice
consigo mismo**: usa el punto como decimal en **85** lugares —«USD 4.28M»,
«6.4%»— y como separador de miles en **12** —«1.284.500»—, a veces en la misma
pantalla. Un punto no puede significar las dos cosas.

Se resolvió con `es-MX`, que es lo que corresponde al primer cliente.

### ✅ DECIDIDA · 2026-09-22 · es un descuido y se unifica

«Descuido, debemos unificarlos de manera correcta.» Antes de pasarlo a diseño se
recontó, porque **el número que teníamos escrito estaba mal y la forma también**:

| | Nodos | Pantallas |
|---|---|---|
| Punto como **decimal** · la convención que gana | **151** | 33 |
| Punto como **miles** | **10** | 3 |
| Coma como **decimal** | **13** | 5 |

`format.ts` decía «12 lugares». Son **10**, y —lo que importa más— **no están
desparramados: se agrupan en tres pantallas**, y dentro de cada una la otra
convención se aplica de forma **coherente**:

| Pantalla | Qué usa |
|---|---|
| **C2 · Drill-down de panel** | `1.284.500 FILAS`, `18.380 filas… 1,4% del lote` · es-ES entero |
| **A6 · Cola de accionables** | `+9,4%`, `ESTIMADO +8,0%`, `-1,1%` · coma decimal en las nueve |
| **A5 · Salud de feeds** | `48.210` y `VS 47,9 K` |

No es un descuido repetido: **son tres pantallas dibujadas con la otra
convención**, cada una consistente consigo misma. Eso cambia el arreglo — no es
corregir diez caracteres sino retipear tres pantallas.

**Y sale barato: ninguna de las tres está construida.** C2 es F3.9, diferida;
A6 no tiene tarea; A5 espera a B2.13, que da 404. Arreglar el dibujo hoy no
toca una línea de código.

**Del lado del front no hay nada que hacer**: `createFormat('es-MX')` ya emite la
convención que gana. Lo que queda es el retipeo en el `.pen`, que es de diseño.

Ojo con no confundirla con la 3 de B0.9, que es otra cosa: **de dónde sale el
locale** —hoy está clavado porque `Contexto` no lo declara—. Ésta era **cuál es
el formato correcto**.

## 5 · El contexto del chat · la pestaña o el panel

**Quién decide** · producto · **Bloquea** · **la presencia del chat en la
consola** · ver abajo

La única de esta lista donde **el `.pen` no gana**, y por eso está escrita.

**El dibujo** encabeza la hoja con `PREGUNTAR A SYNAPSE` y debajo
`CONTEXTO · UA MX · ECOMMERCE OVERVIEW · JUL 2026 · 12 PANELES`. El campo dice
«Preguntá sobre esta pestaña», y cada hilo del riel declara `DESDE ECOMMERCE
OVERVIEW`.

**Lo construido** titula la hoja con el nombre de la métrica del panel, y lo que
viaja es `panel_context: {panel_id, period}`.

**Por qué no la resuelve el `.pen`.** Su autoridad es lo visual y el literal de
la UI; acá lo que difiere es **qué viaja en la petición**, y eso lo decidió un
humano el **2026-09-17** sobre la forma del backend: el chat es del panel. El
riel del dibujo es coherente con su propia lectura —si el contexto es la pestaña,
el hilo se nombra por pestaña—, así que **adoptar el literal sin la decisión
dejaría una etiqueta que miente**.

### Y desde el 2026-09-22 esto BLOQUEA, que antes no

Pedido humano: *«el chat debe tener presencia, es una funcionalidad importante,
no un complemento — algo flotante o una persiana que abre sobre el dashboard»*.

**El `.pen` ya lo dibuja, en las dos formas, y en TODAS las pantallas de
consola** —C1 ×5, C2, C3 ×2, C4 ×2, C5 y los dos responsive—. No se construyó
ninguna de las dos:

| Dónde | Qué |
|---|---|
| `Navbar/CTA Synapse` | Botón `PREGUNTAR` · alto 32 · fondo `$acc` · icono `sparkles` 14 en `$on-acc` · mono 10 w500 |
| `Barra inferior` | Banda de **56 de alto**, ancho completo, `$dock` con borde superior `$w2`. A la izquierda `PREGUNTAR A SYNAPSE` —alto 32, borde `$w3`, `sparkles` en `$dim`—; a la derecha un punto de 7 en `$fam-medios-1` y el contexto |

O sea: **la persiana ya existe** —`ChatOverlay`, la hoja de 940 con velo que
cierra F5.17— y lo que falta es **la presencia**, que es exactamente lo que se
pidió.

**Pero no se puede construir sin resolver esta pregunta.** La línea de contexto
de la barra inferior dice, literal:

> `CONTEXTO · UA MX · ECOMMERCE OVERVIEW · JUL 2026 · 12 PANELES`

Eso es **de pestaña**. Y el cable exige `panel_context: {panel_id, period}` con
`binding:"required"`. **Un chat abierto desde la barra inferior no tiene
panel.** Las salidas son tres y ninguna es gratis:

| | Qué implica |
|---|---|
| **a · El contexto pasa a ser de pestaña** | Pedirle al backend que acepte contexto de pestaña. Adopta el dibujo entero, literales incluidos, y **reabre** lo que se decidió el 2026-09-17 |
| **b · La barra pide elegir panel** | No hace falta backend. Contradice el dibujo —que ya declara el contexto— y mete un paso antes de preguntar |
| **c · La barra usa un panel representativo** | Anda hoy, y **el front elegiría por el usuario**: es inventar una decisión que nadie tomó, que es lo que el adaptador tiene prohibido |

**La recomendación del front es (a)**, y no por el dibujo: un chat que es «de la
pestaña» es el que tiene presencia permanente, y uno que es «del panel» no puede
tenerla — el panel es el que da el contexto. La decisión del 17 se tomó
*sobre la forma que el backend ya tenía*, no sobre qué era mejor.

**Y (a) no borra lo del panel:** el `PREGUNTAR` de cada panel sigue existiendo y
es más específico. Serían dos entradas con dos alcances, que es lo que el `.pen`
dibuja.

## 6 · Las fuentes del evento `auditoria` · acá el que difiere es el cable

**Quién decide** · backend · **Bloquea** · nada

La única que no es del `.pen`, y va acá porque tampoco tiene casa: no es una
pregunta del contrato sino una diferencia entre el contrato y el cable.

**El `.pen` y el contrato coinciden**: las fuentes consultadas son **estructura**
—una tabla de fuente + capa + frescura, `ERP · GOLD · 2 H`—, y `EventoAuditoria`
declara `fuentesConsultadas` y `limiteDeclarado` como campos.

**El que difiere es el cable**: el agente las manda como secciones de markdown
dentro del texto, y por eso F3.13 las pinta como rótulos de sección.

**Refuerza un pedido que ya existe** y le agrega un campo: además de la BASE y la
frescura de la cifra, **las fuentes con su capa y su frescura deberían viajar en
el evento `auditoria`, no dentro de la prosa**. Va con el pedido del chat.

## 7 · Con qué cuerpo se dibuja una cifra del agente · lo que la realidad dijo

**Quién decide** · producto · **Bloquea** · nada, pero deja F3.6 casi sin efecto

**Abierta el 2026-09-24, la primera vez que el chat habló contra Cortex de
verdad.** No es una divergencia con el `.pen`: es una decisión nuestra que la
realidad puso a prueba y no pasó.

F3.6 resolvió «¿con qué cuerpo se dibuja una cifra del agente?» usando **el tipo
del panel desde el que se preguntó**, y sólo si ese tipo acepta la forma que
llegó —`acceptsShape`—. Con mocks se veía bien: el mock mandaba un escalar y el
panel era un `kpi`.

**Contra el agente real, una pregunta desde un panel `kpi` devolvió tres eventos
`data` con formas `tabular`, `tabular` y `raw`.** Ninguna de las tres la acepta
un `kpi`, así que las tres caen en la rama de «este panel no puede dibujar».

**Y tiene sentido que sea así**, que es lo que lo vuelve un problema de diseño y
no un bug: el agente contesta con **la forma que la pregunta necesita**, no con
la del panel de origen. Preguntar «cuánto vendimos» desde un KPI puede devolver
un escalar; preguntar «dame las ventas por plataforma» devuelve una tabla —y es
legítimo preguntarlo desde cualquier panel.

**La rama de «no puedo dibujarlo» dejó de ser el caso raro y pasó a ser el
común.**

Tres salidas, y la decisión es de producto:

| | |
|---|---|
| **a** · El chat dibuja por la **forma** y no por el panel | Un `tabular` se dibuja con `TableBody`, venga de donde venga. Es lo que el dato pide; deja sin usar el contexto del panel |
| **b** · El evento declara su tipo de panel | Es la pregunta 11 de B0.9, que se cerró usando el panel de origen. Vuelve a abrirse, ahora con evidencia |
| **c** · Queda como está | La cifra casi nunca se dibuja y el chat contesta sólo en prosa, que es lo que hace hoy |

**Lo medido, para que la decisión no sea a ojo:** una pregunta, tres eventos
`data`, cero dibujables. Capturado el 2026-09-24 contra `SYNAPSE_UA`.

## 8 · `semantic_direction` · una pregunta que se cerró contra el fixture

**Quién decide** · producto · **RESUELTA el 2026-09-24**

Va acá porque enseña algo, no porque siga abierta.

**Qué hace el campo.** Es la regla 10 de `design.md`: «Toda métrica compuesta
declara su dirección semántica ("MÁS ALTO = MEJOR"). **El usuario nunca adivina
si subir es bueno.**» Se pinta al pie del panel. En ROAS más alto es mejor; en
CPA más alto es **peor**. Sin la declaración, un «+14%» se lee al revés.

**Por qué es texto y no un enumerado** · decisión humana del 2026-08-19: «un
enumerado de dos valores habría deformado dos de los cinco casos que el catálogo
ya declara». Hay métricas donde lo mejor no es «alto» sino «cerca de la meta» o
«estable». Y la consecuencia buscada era **no tener tabla de traducción que
mantener**.

### Lo que enseña, que es por lo que está escrito

La pregunta existió —ask 7 del plan de integración— y **se cerró el 2026-09-14**:

> ~~«`semantic_direction`: ¿código o texto?»~~ **CERRADA contra el servicio
> real.** Es texto ya redactado: las doce métricas del tenant mandan
> `HIGHER = BETTER`. **Nada que pedir.**

**Se cerró contra la SEMILLA de Postgres, no contra Snowflake.** El 2026-09-24,
la primera vez que `sync-catalog` trajo el catálogo real, seis métricas llegaron
con `HIGHER_IS_BETTER` — y salieron en pantalla con guiones bajos.

«Verificado contra el servicio real» y «verificado contra la fuente real» son
dos afirmaciones distintas, y la primera se dice sola. **Es la misma lección que
la sección 5 de la bitácora del 22**, en otro campo y diez días después.

### Resuelto

**La vista manda el texto**, que es lo que el contrato ya declaraba. No se
traduce en el front: hacerlo reintroduce la tabla que la decisión del 19-08
quiso evitar, y se rompe con el primer caso que no sea alto/bajo.

Ejecutado en `docs/snowflake/SYNAPSE_METRIC_CATALOG.sql`, que es el archivo que
datos corre: el comentario de la columna pasó de «PENDIENTE DE DECISIÓN» a la
decisión, y las seis filas de la semilla dejaron de cargar el código.

**Y la vista de issues aprendió a detectarlo**, para que no dependa de que
alguien mire la pantalla: una `SEMANTIC_DIRECTION` toda en mayúsculas y sin
espacios es un código, y aparece en `SYNAPSE_METRIC_CATALOG_ISSUES` con su
razón. Es el mismo mecanismo que ya tenían `SHAPE`, `FAMILY` y `LAYER`.

**Queda un pedido a datos**: recurar las seis filas que ya están en
`DD_METRIC_CURATION`. Hasta que lo hagan, el panel sigue mostrando el código —
**a propósito**: el front no escribe copy de producto, y un campo sin curar que
se ve es lo que la instrucción de alta pide con sus marcadores `⟨REVISAR⟩`.

---

## 9 · `MICRO TENDENCIA` no es un sparkline · lo encontró abrirlo · 2026-09-29

**El plot se construyó el 2026-09-29 y pasó su QA. Después se abrió el modo mock
y el dibujo decía otra cosa.**

`Plot/MICRO TENDENCIA · Indicadores con sparkline` —580×200— no dibuja **un**
sparkline. Dibuja **cuatro filas de indicador**, a 48 px una de otra, y cada fila
tiene cinco piezas:

| Pieza | Dónde, en el frame |
|---|---|
| El rótulo | `x: 0`, `$dim` · `VENTAS`, `ROAS`, `CONVERSIÓN`, `COBERTURA` |
| El sparkline | de `x: 152` a `x: 400` · 248 de ancho sobre una banda de ~34 |
| El punto de familia | `x: 396.4`, ⌀7.2 · uno por familia: `$fam-demanda-1`, `$fam-medios-1`, `$fam-cliente-1`, `$fam-inventario-1` |
| La cifra | `x: 444`, `$ink` · `USD 4.28M`, `4.1x`, `1.31%`, `18 días` |
| El delta | `x: 478–500`, `$dim` · `+6.4%`, `+0.2x`, `-0.04 pp`, `-1 día` |

**`PlotSpark` dibuja sólo la línea, a alto de panel completo.** Sin rótulo, sin
cifra, sin delta y sin punto — y ocupando cuatro veces la banda que el dibujo le
da.

**Las dos lecturas posibles, y por eso es propuesta y no arreglo:**

1. **El frame es una HOJA que muestra el patrón aplicado a cuatro métricas**, y
   el plot es **una fila**. Encaja con que el repertorio le dé `escalar` y
   `serieTemporal`: una cifra con su micro tendencia al lado.
2. **El frame es el plot entero**, y `spark` dibuja varias métricas juntas.

**La segunda no se puede recibir.** Cuatro métricas con serie, cifra y delta cada
una no es ninguna de las dieciséis formas del contrato — es exactamente el
problema que §3 de `docs/ENTREGA-2026-09-29-repertorio-de-graficos.md` levanta
para `DISPERSIÓN`, `BURBUJAS` y `CUADRANTES`: el mapa agrupó por la pregunta que
contesta y no por el objeto que necesita.

**Y la primera deja a `spark` sin poder dibujarse sobre `escalar`**, que es una
de las dos formas que el repertorio le asigna: `ValorEscalar` es `{ forma, v }`
y un sparkline necesita puntos. Hoy sólo se sostiene sobre `serieTemporal`, que
es sobre lo que se lo miró.

**Lo que esto enseña, que vale más que el gráfico:** el plot tenía pruebas, tenía
su mutación muerta y `pen-graficos` salía verde — y las tres cosas son ciegas
acá. Las pruebas leen los números **ya transcriptos** del frame al componente,
así que si la transcripción es mala las dos capas coinciden igual; y
`pen-graficos` verifica que el dibujo no cambió sin declararse, no que el
componente se parezca al dibujo. Es el mismo hueco que la hoja del chat de 480
contra 940, y lo encontró lo mismo: abrirlo.

## 10 · El selector de agente del admin, que el `.pen` no dibuja · 2026-10-06

**Quién decide** · diseño · **Bloquea** · nada, ya está construido

En QA un admin de UA no podía preguntar nada: sin `agent_id`, el servicio
busca el agente del rol `admin` en el tenant del usuario, y UA sólo tiene uno
`Planner`. **Medido el 2026-10-06**: 409 sin el campo, 200 con él.

El backend resolvió dejar elegir al admin —`GET /chat/agents` y `agent_id`
en `POST /config/chat`, en `7b717aa`— y **C3 no dibuja dónde se elige**. Se
construyó lo mínimo, en `ChatSheet.tsx`: un `<select>` bajo la línea de
contexto, con el rótulo `AGENTE` y la etiqueta que sugiere el backend
—`TENANT · AGENTE · ROL`—, que sólo ve quien es admin.

**Lo que diseño tendría que decidir:** dónde va y cómo se ve, y si cambiar
de agente a mitad de una conversación debe avisar que empieza otra. Hoy
empieza otra **sin avisar**, porque el servicio fija el agente al crear el
hilo; el riel lo muestra como una fila nueva.

## 11 · Leer un gráfico: el hover que el `.pen` no dibuja · 2026-10-06

**Quién decide** · diseño · **Bloquea** · nada, ya está construido

El humano, mirando los gráficos de UA en QA: «no se entiende qué está
mostrando, desde el título hasta los detalles […] debería haber hovers que
indiquen los montos y detallar qué son los ejes». Se construyeron cinco cosas, y
no todas son divergencias:

| | Qué | ¿Del `.pen`? |
|---|---|---|
| Leyenda | Trazo de 18×3, nombre y valor | **Sí**: «Legend Item» de «Componentes de gráfico». No se había portado |
| Eje del tiempo | «1 OCT», «NOV 25» | El dibujo lo tiene en los plots; `PlotSeries` no lo pintaba |
| Unidad en barras | «26.5%» | Regla dura: ningún número desnudo |
| **Hover con lectura** | Guía vertical, un punto por serie y una caja con la fecha y la cifra **entera** de cada serie; también con flechas del teclado | **No.** Ni el `.pen` ni `design.md` dibujan una interacción así. Decisión humana |
| **Título del panel** | ~~Ancho natural hasta la mitad del panel~~ · **superado el mismo día por §12**: sin meta visible, el título toma la línea entera | §6 pone título y meta lado a lado; la Chart Card los apila |

**Lo que diseño tendría que decidir:** cómo se ve la caja de lectura (hoy
`$elev` con borde `w3`, mono de 10 para la fecha y de 11 para la cifra, igual
que «Legend Item»), y si en barras alcanza con el `title` nativo, que es lo que
hay hoy.

## 12 · La BASE y la procedencia detrás de un ⓘ · 2026-10-06 · CONTRA DOS REGLAS DURAS

**Quién decide** · diseño, sobre `design.md` §1.2 y §6 · **Bloquea** · nada, ya está construido

**Es la divergencia más grande de este documento, y es deliberada.** `design.md`
pide que toda métrica declare su BASE «en label arriba a la derecha» (regla 8) y
su procedencia, que «no es letra chica» (regla 9), y §6 dice que el badge «es
obligatorio. No es opcional». **El humano decidió el 2026-10-06 esconder las dos
detrás de un ícono `info`**, mirando los diez paneles de UA en QA: «ensucian la
lectura […] mientras más pequeña es la card es más molesto».

**Lo que se midió antes de decidir**, en los diez paneles:

| | `design.md` pide | El catálogo firmado manda |
|---|---|---|
| BASE | «unos 30 caracteres», una línea (§6.2) | **51 a 147** |
| Fuente del badge | `ERP`, `Ads API` | **39 a 94** |

Son descripciones donde la spec espera rótulos. Se ofrecieron tres salidas
—dos capas (ventana y badge cortos visibles, la descripción en la ficha), todo
detrás del ícono, o pedir a datos rótulos cortos sin tocar la interfaz— y se
eligió **todo detrás del ícono**.

**Cómo quedó** · `src/render/Panel/MetaInfo.tsx`:

- La cabecera es una línea: bullet de familia, título a lo ancho, y el ⓘ.
- La ficha se abre **pasando el cursor, con el foco del teclado o con un toque**
  (que la deja fijada hasta tocar afuera o Escape). Trae BASE, ventana y
  procedencia completas, sin recortar.
- **El badge de DEGRADADO sigue visible**: es estado, no procedencia, y no
  puede depender de que alguien abra algo.
- La variante compacta de la cabecera (§6.1) se cayó sola: apilaba la meta
  porque no entraba en una línea, y sin meta visible entra siempre.

**Lo que conviene que diseño decida, porque cambia la spec:** reescribir las
reglas 8 y 9 y la anatomía de §6, o volver a dos capas cuando datos entregue
rótulos cortos. Las pruebas de §5.2 no se borraron: ahora afirman que la
gobernanza sigue **declarada** en los siete estados, abriendo el ícono.

## Dónde vive cada una de las demás

Para que este documento no crezca hasta pisar a los otros:

| Divergencia | Dónde vive |
|---|---|
| `Contexto` no declara locale, moneda ni zona | **B0.9 · 3** |
| `paramsDisponibles` es sólo una lista de nombres | **B0.9 · 5** |
| `PanelConfigurado` no declara `orden` | **B0.9 · 6** |
| §2.3 declara la escala mono y no la otra | **B0.9 · 9** · y ver §2 de acá |
| El tracking del KPI | **B0.9 · 10** |
| Con qué tipo de panel se dibuja una cifra del agente | **B0.9 · 11** · resuelta por F3.6 |
| `PeriodoId` no admite días, trimestres ni rangos | **B0.9 · 12** |
| El badge de degradado no llega a AA en tema oscuro | **B0.9 · 13** |
| §7.2 pide un param de desagregación que ningún tipo declara | **B0.9 · 14** |
| La interacción del canvas de composición · B2 · F4.9 | `docs/PROPUESTA-CANVAS-2026-09-15.md` |
| `Metrica.base` a `design.md` · **decidido, falta ejecutar** | el plan · **T8** |
| `Columna` sin `decimales` ni `unidad` | el plan · **B1.14**, como pedido |
| `/config/blocks` sin un `grupo` por tipo | el plan · junto a B1.21 |

**Y una que no es de spec sino de operación**, para que no se pierda entre
éstas: rotar las credenciales de `docs/backdocs/environments.txt`. Decidido el
2026-09-15 que se hace más adelante — **diferido, no olvidado**, y está en
`CLAUDE.md`.
