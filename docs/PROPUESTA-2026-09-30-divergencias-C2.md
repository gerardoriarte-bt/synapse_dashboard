# Propuesta de spec · lo que `C2 · Drill-down` dibuja y el dato no sostiene

**2026-09-30 · abierta.** Sale de construir F3.9 contra el servicio real. Son
**cuatro preguntas a diseño** y **tres pedidos**, y están separadas a propósito:
las primeras cambian el dibujo, los segundos cambian el cable.

La pantalla está construida en `src/surfaces/console/DrillSheet.tsx` —§PEN:C2— y
**cada divergencia de acá está atada por una aserción** en
`tests/surfaces/console/drilldown.test.tsx`. Eso es deliberado: una divergencia
que vive sólo en prosa se deshace en silencio el día que alguien la «arregle».

---

## Contra qué se midió

| | |
|---|---|
| Servicio | el binario de `:4010`, levantado desde el fork |
| Usuario | `dev@synapse.local`, rol `admin` |
| Tenant · dashboard · período | Under Armour México · `overview` · `2026-09` |
| Panel | `80158182-f729-51ef-a7d0-76584c92cdb1` · métrica `sales` |
| **Las dos rutas son de ELLOS** | `168a761` · y `8633b10` es el más nuevo de los suyos que toca el camino |

**Las dos rutas son suyas y no nuestras**, comprobado con `git log --` sobre los
cinco archivos del camino de lectura —`drilldown.go`,
`dd_drilldown_service.go`, `dd_drilldown_handler.go`, `dd_drilldown_service.go`
de `ports` y `transform.go`—: **ninguno lleva un commit nuestro**. Se comprueba
porque la trampa del 2026-09-22 ya costó leer seis campos nuestros como avance
suyo, y la única defensa es mirar quién firmó el archivo.

---

## Las tres cifras que abren todo

Medidas el 2026-09-30 sobre ese panel y ese período, las tres dimensiones una
por una:

| Qué | Cuánto |
|---|---|
| La cifra **publicada** del panel | **1 232 721** · `freshness: 2026-09-30T17:37:34Z` |
| La desagregación por `day` | 30 ítems · suma **1 282 259** |
| La desagregación por `week` | 5 ítems · suma **1 282 259** |
| La desagregación por `platform` | 37 ítems · `row_count: 39` · suma **968 169,49** · **29 en cero** |

**No cierra en ninguna de las tres, y por dos razones distintas:**

1. **`platform` sale de otra tabla y mide otra cosa.** `day` y `week` agregan el
   hecho de ecommerce; `platform` agrupa por fuente sobre la tabla de medios
   pagos. No es un error de redondeo: es el ingreso atribuido a medios pagos
   contra el total del sitio, que es justo lo que la BASE del panel declara.
2. **El panel es una foto y el corte es en vivo.** La materialización es de horas
   antes y el mes está en curso, así que la lectura de ahora da más.
   `queried_at` y `freshness` no son lo mismo.

De acá salen las dos primeras preguntas.

---

## Pregunta 1 · la frase de cierre afirma algo que es falso

**El frame escribe:** `LOS CINCO CANALES SUMAN USD 4.28M · LA DESAGREGACIÓN
CIERRA CONTRA EL TOTAL`.

**No cierra.** Y hay una segunda razón para no pintarla aunque cerrara: es una
frase compuesta y un cálculo, y el adaptador no escribe copy de producto ni
inventa una cifra.

**Qué se pinta hoy en su lugar: nada.** La ausencia está atada por la aserción
«no se afirma que la desagregación cierre contra el total».

**Lo que preguntamos:** ¿la frase es una afirmación de producto o era una nota de
la maqueta? Si es de producto, hace falta que el servicio la haga verdadera —ver
el pedido 1— porque hoy la pantalla no puede decirla sin mentir.

**Nuestra lectura, y es sólo eso:** el dibujo da por sentado que una
desagregación cierra contra su total, que es una propiedad razonable de esperar y
que este dato no tiene. La frase describe una invariante, no un texto.

## Pregunta 2 · el porcentaje por fila tiene el denominador equivocado

**El frame escribe** `56.3%`, `22.9%`, `12.1%`, `5.6%`, `3.1%`, y el ancho de
cada barra es esa misma cuota: medido contra la pista de 800, `450/800 = 56,25`,
`183/800 = 22,9`, `97/800 = 12,1`, `45/800 = 5,6`, `25/800 = 3,1`. **Los cinco
calzan**, así que la cuota es sobre el **total**, no sobre el máximo.

El problema es cuál total. El denominador que el dibujo implica es la cifra
publicada, y la suma de los ítems es otra. Un porcentaje sobre ese denominador
afirmaría una cuota de un total que la pantalla misma muestra distinto.

**Hoy se pinta la cifra de cada ítem y no su cuota.** Atado por «no hay un solo
`%` en la sección de la desagregación».

**Lo que preguntamos:** si el pedido 1 se resuelve y el servicio emite el total
que desagregó, la cuota pasa a ser derivable de dos campos del mismo cable y deja
de ser una invención. ¿Es ése el camino, o la cuota se calcula del lado del
servicio?

## Pregunta 3 · la lista de cuotas no está en el repertorio

El dibujo pide una lista de nombre, cifra y cuota, con pista de 6px en `$w2` y
barra en el color de familia. **Ese visual no existe en el repertorio**: de los
siete ids que la tabla da a una forma categórica —`columns`, `bars`, `lollipop`,
`donut`, `treemap`, `radial`, `pareto`— ninguno es ése.

**Hoy la desagregación se dibuja con el cuerpo que el registro ya tiene.** La
razón para no seguir el dibujo es dura y medida, no de comodidad: la cuota que
esa lista pinta es justamente la de la pregunta 2.

**Lo que preguntamos:** ¿se agrega como una fila nueva del repertorio? Un gráfico
que la tabla no declara no se puede validar contra ella, que es el silencio exacto
que la validación del repertorio existe para cerrar — así que construirlo sin
declararlo sería peor que no construirlo.

## Pregunta 4 · las dos secciones ausentes necesitan su copy

El dibujo dibuja `TABLA ORIGEN` y `LINAJE HASTA LA FUENTE CRUDA` **llenas**, y no
dibuja qué dice la pantalla cuando no hay con qué llenarlas. Hoy las dos están
**declaradas ausentes** —se dice qué falta, que es la gramática de los estados— y
el texto lo escribimos nosotros.

**Lo que preguntamos:** el texto de esa declaración. Con dos restricciones que ya
están puestas y conviene no perder:

- **No nombra una ruta, un método, una sección de la spec ni una tarea.** Le
  piden al lector un contexto que no tiene. Lo persigue `copy-producto`, en la
  puerta, y hay una aserción que lo exige.
- **No promete una acción que no existe.** No hay nada que apretar acá.

---

## Los tres pedidos

Los tres se midieron contra `8633b10` el 2026-09-30.

### Pedido 1 · que la desagregación cierre, o que diga contra qué cierra

**Lo tiene: BACKEND.** Dos salidas, y la segunda es más barata:

- que el corte se calcule contra la cifra publicada, o
- que la respuesta **emita el total que desagregó**, para que la hoja declare los
  dos números sin afirmar nada sobre su relación.

Con lo segundo, la pregunta 1 y la 2 se cierran solas: la frase pasa a ser
verdadera o innecesaria, y la cuota pasa a ser derivable.

### Pedido 2 · las filas crudas y el linaje

**Lo tiene: BACKEND.** Son las dos secciones de la pregunta 4, y **no son un
hueco nuestro**:

- **Las filas crudas.** El dibujo pide fecha, canal, órdenes, unidades y USD por
  fila. Ninguna de las lecturas del tenant devuelve filas crudas, y las que se
  acercan cuelgan de administración, así que un CEO o un planner no las alcanza.
  Lo que llega es la desagregación ya agregada: una etiqueta y un número.
- **Las cuatro capas y el descarte.** De las cuatro llega **una** —capa, fuente y
  frescura—, y ya es el badge de procedencia del encabezado. El descarte de
  bronce a plata —«18.380 filas … 1,4% del lote»— no existe en ningún campo, y
  componerlo sería inventar una cifra.

### Pedido 3 · dos campos chicos que ya existen de su lado

**Lo tiene: BACKEND.** Los dos son de una línea y los dos evitan que el front
escriba una tabla que nadie mantiene.

**a · El rótulo legible de cada dimensión.** El dibujo escribe `CANAL`,
`DIVISIÓN`, `GÉNERO`, `REGIÓN`; lo que viaja son las claves `day`, `week`,
`platform`. **El rótulo existe de su lado**: `DrillDimension` declara `Label` con
`"Día"`, `"Semana"` y `"Plataforma"`, y `DimensionKeys()` lo tira porque el DTO
es `Dimensions []string`. Acá no se escribe un diccionario: el día que aparezca
una quinta dimensión, la tabla del front se queda atrás sin que nadie lo note.

**b · `dimensiones` del catálogo, que está vacía en las 21.** La nota del `.pen`
dice que los ejes salen del catálogo; nuestro contrato declara
`Metrica.dimensiones` y el cable manda `dimensions`. **Medido: 0 de 21 métricas
declaran alguna**, así que hoy la fuente real es la lectura de dimensiones.

Y esto además arregla algo que hoy es ruido declarado: pintar el CTA cuesta
**una lectura por panel** —quince en la pestaña— porque «un CTA sin manejador no
se pinta» exige saber `supported` **antes** de dibujar el pie. Son baratas
—resolver las dimensiones no toca Snowflake— y se dedupean, pero con
`dimensions` en el catálogo o en la lectura de la pestaña **desaparecen las
quince**.

---

## Lo que NO estamos preguntando

**El velo y las medidas de la hoja no son una divergencia.** El frame la dibuja
en `x=576 width=864` sobre 1440 —el 60%, que es lo que `design.md` declara— en
`$panel` con filete `$w3`, **sin radio y sin filo**, y el velo es `$shad`, que es
un token. A diferencia de C3, acá no hay nada que proponer: se construyó así.

**Que a 360 no entre tampoco.** `design.md` lo declara con todas las letras: al
60% son 216px, menos que un panel, y **es trabajo de v1.1**. No se inventa un
mínimo.

**El inglés en pantalla no es un pedido de esta propuesta.** El encabezado se
titula con el nombre del catálogo y hoy dice `Sales` donde el dibujo dice
`Ventas`; igual `BASE · ALL CHANNELS` y `HIGHER = BETTER`. **El dueño del copy
que describe datos es el catálogo**, y traducirlo acá sería la tabla de
traducción que nadie mantiene. Es un pedido a quien lo emite, y ya está escrito
donde corresponde.

**Y el 12,5 del dibujo ya está decidido**: va a `text-celda`, por la decisión del
2026-09-22 —«medio píxel · el escalón no se mueve»—.

---

## Una trampa que conviene dejar anotada

**`row_count` no es la cantidad de ítems.** Medido: `platform` devuelve
`row_count: 39` con **37 ítems**. Su transformación saltea en silencio toda fila
sin etiqueta o sin valor.

No es un pedido —el campo cuenta lo que dice contar— pero **quien lo pinte tiene
que rotularlo por lo que es**: las filas que la consulta devolvió, nunca
«mostrando N». Está atado por una aserción, y el adaptador lo pasa con su nombre
propio sin derivar nada de él.
