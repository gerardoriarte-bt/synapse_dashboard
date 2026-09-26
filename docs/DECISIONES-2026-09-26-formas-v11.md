# Las cinco formas v1.1 · decisiones tomadas · 2026-09-26

> **Qué se decidió y por qué.** El contrato las declara desde hoy; los cuerpos
> siguen sin construirse —F4.17–F4.19— y siguen esperando una métrica que las
> use. Lo que acá se fija es la FORMA, que es lo que backend dijo estar
> esperando.

## Por qué ahora

El contrato tenía esta razón escrita desde el 2026-08-19 para no declararlas:

> «Agregarlas ahora sería declarar una forma que ningún endpoint devuelve.»

**Venció a medias.** Verificado leyendo `transform_v11.go` en `8633b10`: las
cinco tienen transformador y el `switch` principal las enruta con constantes —
que es justo lo que un `grep "case \""` no ve, y por lo que el 2026-09-25 se les
mandó un mensaje diciendo que no las tenían.

Y su respuesta lo dice del otro lado: *«sobre las cinco formas v1.1: de acuerdo,
entran juntas **cuando ustedes las declaren**»*.

**La otra mitad de la razón sigue en pie**: ninguna métrica las declara. Lo que
cambió es quién espera a quién — antes el contrato esperaba al backend, ahora el
cuerpo espera al dato.

## Lo que se midió antes de decidir

| Fuente | Qué dio |
|---|---|
| `transform_v11.go` · `8633b10` | La forma exacta de las cinco, campo por campo |
| `GET /config/blocks` · servicio corriendo | `comparison` (span 5–8) toma las dos primeras · `matrix` (6–12) la tercera · `graph` (6–12) las dos últimas |
| El `.pen` · «Synapse · Plots» | Los 43 gráficos con geometría real. Las cinco tienen el suyo: `COLUMNAS AGRUPADAS` y `DUMBBELL`, `RADAR`, `MAPA DE CALOR` y `COHORTES`, `GRAFO`, `EMBUDO` y `FLUJO` |
| `GET /config/catalog` | **Ninguna de las 18 métricas declara una de las cinco** |

## Las decisiones

### 1 · `categoricaComparada` · el delta lo calcula el backend

`{items: [{etiqueta, v, referencia?, delta?}]}`

**El front no deriva `delta` aunque tenga los dos números.** Es la misma regla
que `porcentaje` en `composicion`: quien conoce la definición del delta
—absoluto, relativo, contra qué base— es quien produjo el dato.
`transform_v11.go` ya lo escribe como `v − referencia` cuando la fila no lo trae.

**Sin `referencia` no hay comparación**, y el cuerpo no debe pintar una: es una
categórica común con otro nombre, y el panel tiene que decirlo en vez de inventar
un objetivo.

### 2 · `perfilMultiatributo` · el radar asume una escala común

`{perfiles: [{etiqueta, atributos: [{clave, v}]}]}`

**Ésta es la decisión que el cable no resuelve.** Un radar con ejes en unidades
distintas —pesos en uno, porcentaje en otro— dibuja un polígono que no significa
nada: el área depende de en qué orden se pusieron los ejes.

Dos salidas posibles:

| | |
|---|---|
| **(a)** Declarar que todos los atributos comparten la unidad de la métrica | **elegida** |
| (b) Agregar un `maximo` por atributo | descartada |

**(b) se descartó porque el cable no lo manda.** Sería un campo que nadie llena
— el defecto de `BodyProps.presentation`, que existió meses documentado y sin un
solo consumidor. Si algún día hace falta un perfil con unidades mixtas, **se pide
entonces**, con el dato real enfrente.

**Lo que el cuerpo SÍ puede hacer** es escalar contra el máximo observado entre
todos los perfiles: eso es presentación y no inventa un techo que nadie declaró.

**Es una regla que no podemos verificar**, y conviene decirlo: si una métrica
llega con atributos de unidades mixtas, el radar se va a ver bien y va a mentir.
Queda para preguntar a datos cuando exista la primera.

### 3 · `matriz` · `null` es «no hay dato», no cero

`{filas: [string], columnas: [string], celdas: [[number|null]]}`

**La decisión que más importa**, y es la misma distinción que ya costó en A5 —la
frescura de un feed que nunca cargó— y en A1 —un cliente que nunca publicó—.

`transformMatrix` deja la celda en `nil` cuando ninguna fila la cubrió. **El
cuerpo tiene que dejarla vacía**: pintarla con el color más frío la muestra como
el peor valor de la escala, y una hora sin ventas registradas no es una hora con
cero ventas.

**Y una matriz con TODAS las celdas en `null` está vacía.** Las etiquetas solas
—lunes a viernes, 06 a 00 h— dibujan una grilla que parece un mapa de calor y no
tiene una sola cifra. Con una sola celda en `0` ya no lo está: un cero es un dato.

**La escala la calcula el cuerpo** sobre las celdas presentes. El contrato no
declara mínimo ni máximo porque el backend no los manda, y derivarlos de otro
lado sería inventar el rango.

### 4 · `grafo` · las posiciones no están en el contrato

`{nodos: [{id, etiqueta}], aristas: [{desde, hacia, peso?}]}`

**Dónde cae cada nodo es una decisión de dibujo** —depende del ancho del panel,
del `colSpan` y del algoritmo— y ponerla en el contrato la congelaría al tamaño
con el que se generó.

**`peso` ausente significa «todas iguales», no cero**: sin él el cuerpo dibuja
todas las aristas con el mismo grosor en vez de hacerlas invisibles.

**Un grafo se mide por sus ARISTAS**: nodos sueltos son puntos sin pregunta, y
lo que un grafo contesta es sobre relaciones.

### 5 · `flujo` · la cifra de cada etapa la calcula el backend

`{etapas: [{id, etiqueta, v}], enlaces: [{desde, hacia, v}]}`

**El front no suma los enlaces.** `transformFlow` usa la suma de lo que SALE de
la etapa, o la de lo que entra si es terminal. Sumar acá daría otro número en la
última etapa, y el panel mostraría dos totales distintos para el mismo embudo.

**La conversión entre etapas sí es del cuerpo**: es un cociente entre dos cifras
que ya están, igual que el agrupado por tiempo del riel de hilos, que el contrato
concede explícitamente como presentación.

## Lo que esto desbloquea, y lo que no

**Desbloquea** la mitad del candado de F4.17–F4.19: decía «NUESTRO contrato no
declara X» y ahora lo declara.

**No desbloquea** la otra mitad: hace falta una métrica que use una de las cinco.
Las 18 del tenant declaran `scalar`, `categorical`, `prose`, `tabular`,
`multi_series` y `time_series`. **Eso es de datos**, no del backend ni nuestro.

**Y `adapt.ts` las sigue rechazando** con su razón —«forma que el front todavía
no dibuja»— hasta que existan los cuerpos. Es correcto: una forma declarada sin
cuerpo no se puede dibujar, y dejarla pasar daría un panel en blanco sin decir
por qué.

## Un efecto que vale registrar

Al declararlas, **`isEmpty` dejó de compilar**. Su `switch` es exhaustivo y su
comentario lo dice desde que se escribió: *«cuando el contrato gane una forma,
esto deja de compilar hasta que alguien decida qué significa que esté vacía — que
es la decisión que no se puede tomar por omisión»*.

Funcionó. Las cinco decisiones de vacío están en `render/state.ts` con su razón, y
las tres que más pueden morder —la matriz en `null`, el perfil sin atributos y el
grafo sin aristas— se verificaron por mutación.
