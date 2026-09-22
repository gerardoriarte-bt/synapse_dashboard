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

## 2 · Dos tamaños más, del mismo modo de falla · A2 §9

**Quién decide** · diseño · **Bloquea** · nada

El mismo caso, encontrado al construir `ROLES Y COMPOSICIÓN` el 2026-09-22:

| El dibujo | La escala | Se usó |
|---|---|---|
| nombre del rol · `font-display` **17** | va de `--text-titulo: 15px` a `--text-titulo-lg: 20px` | `text-titulo` |
| nombre de la pestaña · `font-body` **12.5** | va de `--text-celda: 12px` a `--text-cuerpo: 13px` | `text-celda` |

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

---

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
