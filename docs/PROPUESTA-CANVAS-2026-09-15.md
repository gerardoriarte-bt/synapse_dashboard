# Propuesta de spec · la interacción del canvas (B2 · F4.9)

**Estado: APROBADA el 2026-09-15 (humano), con una condición: «debe ser fácil y
clara la interacción para el armado de dashboard».** Y con una corrección de
fuente que cambió la mitad del documento — ver abajo.

**El `.pen` tenía B2 dibujada y este documento no lo sabía.** Se escribió leyendo
solo `design.md` §7.2, que describe el resultado del arrastre y no la
interacción. `design/Synapse_v2.pen` tiene el frame `B2 · Canvas de composición`
—1600 × 1279, con los quince tipos en biblioteca— y su nota de racional. **Donde
los dos hablan, gana el `.pen`**: es más específico y trae el literal de la UI.

Lo que sigue quedó revisado contra él. Los cinco puntos se sostienen; tres ganan
precisión y dos números salieron confirmados.

**Por qué existe.** `design/design.md` §7.2 describe B2 con precisión —y describe
el **resultado** del arrastre, no el arrastre:

> «Grid de 12 visible con guías. Panel lateral izquierdo con la biblioteca de
> gráficos agrupada. Los paneles se arrastran, se mueven y se redimensionan por
> handles, **siempre en unidades de grilla**.
> · Slot vacío: rectángulo punteado con label `SLOT VACÍO · 4×4` y CTA a la
>   biblioteca.
> · Panel heredado: borde punteado tenue + badge `HEREDADO`. Editarlo crea el
>   override.
> · Colisión: el panel en conflicto se marca; **no se permite soltar encima**.
> · Guardado explícito, con indicador de cambios sin guardar.»

Eso fija cuatro invariantes y deja abierto **qué hace el cursor**. CLAUDE.md es
explícito sobre qué corresponde acá: «donde dos fuentes difieran, gana la más
específica para lo que se está implementando **y se abre una propuesta de spec**.
No se resuelve en silencio, y el agente no modifica `design.md`».

---

## Lo que ya estaba decidido, y esta propuesta no toca

| | Fuente |
|---|---|
| Todo se mueve en **unidades de grilla**, nunca en píxeles | §7.2 y el `.pen`: «EL ALTO SE DECLARA EN rowSpan · NUNCA EN PÍXELES» |
| Un panel se **redimensiona por handles** | §7.2, y el `.pen` dibuja el estado «seleccionado con handles» |
| **No se suelta encima** de otro | El `.pen` es más literal: «SE SOLAPA CON "DOCE MESES" · NO SE PUEDE SOLTAR AQUÍ» |
| Un slot vacío es un **estado legítimo** | El `.pen`: «SLOT VACÍO · 3 × 4» con CTA «ELEGIR TIPO» |
| El guardado es **explícito** | §7.2 y F4.13, ya implementado |
| La altura sale de `rowSpan` | **Confirmado por el `.pen`**: «COLUMNA 80 · GAP 16 · FILA BASE 80», y un panel «3 × 4 · 272 × 368». Nuestro `96·N − 16` da 368 exacto, y `3·80 + 2·16` da 272 |
| Ancho mínimo 1600, el lienzo **1:1 a 1200** | §4, la nota de B2, y F4.6 |
| **El span se ajusta al rango del tipo al soltar** | Del `.pen`, y no estaba en §7.2: «ARRASTRAR AL LIENZO · EL SPAN SE AJUSTA AL RANGO DEL TIPO». Ya lo hacen `agregarPanel` y `cambiarTipo` de F4.10 |

---

## Los cinco puntos a decidir

### 1 · Qué agarra el cursor

**Propuesta.** El **cuerpo del panel** arrastra y **mueve**; ocho handles en
bordes y esquinas **redimensionan**. Presionar sobre un control interno del panel
—un botón, un select del configurador— no inicia arrastre.

**Por qué.** §7.2 nombra los handles solo para redimensionar, así que mover tiene
que ser otra cosa, y el cuerpo es lo único que queda. La excepción de los
controles internos no es un detalle: sin ella, elegir una métrica en un panel
seleccionado empezaría a arrastrarlo.

**Alternativa descartada: una manija de arrastre dedicada** (un asa en la cabecera).
Es más seguro y menos directo, y **§4 ya gastó el espacio de cabecera**: título,
BASE y procedencia son shell que nunca se reemplaza. Un asa ahí compite con la
anatomía del panel, que es normativa.

### 2 · En qué unidad se mueve, y qué se ve mientras

**Propuesta.** El arrastre calcula la celda de grilla bajo el cursor y **solo
cambia `colStart` y la fila cuando esa celda cambia**. El panel que se arrastra
sigue al cursor en píxeles —si no, se siente roto—, pero **la vista previa de
destino es siempre una celda entera**, dibujada sobre la guía.

**Por qué.** «Siempre en unidades de grilla» es de §7.2 y no admite un estado
intermedio en píxeles **en el dato**. Lo que sí admite es que el gesto se vea
continuo: lo que se guarda es la celda.

**Alternativa descartada: mover el panel de a saltos de celda.** Cumple la letra y
se siente trabado a 1200px de ancho, donde una columna son 100px.

### 3 · Qué pasa al soltar

**Propuesta, tres casos:**

| Al soltar | Qué pasa |
|---|---|
| Sobre celdas libres | Se coloca. El borrador cambia; **no se guarda** |
| **Sobre otro panel** | **No se suelta.** Vuelve a su posición, y el aviso **nombra con cuál choca**: «SE SOLAPA CON "DOCE MESES" · NO SE PUEDE SOLTAR AQUÍ». El `.pen` es explícito en esto y la propuesta original decía solo «se marca» — nombrar el panel es la diferencia entre «no podés» y «movete tres columnas» |
| **Fuera de la grilla** | Vuelve a su posición. No se borra |

**Por qué el conflicto no desplaza al otro.** §7.2 dice «no se permite soltar
encima», no «se reacomoda». Un reacomodo automático mueve paneles que nadie tocó,
y en una grilla de 12 columnas eso se propaga: quien compone perdería la
colocación que ya había decidido.

**Por qué soltar afuera no borra.** Borrar es una acción con nombre —«Quitar
panel», que F4.10 ya tiene—. Un gesto impreciso no puede destruir trabajo;
es la misma razón por la que el guardado es explícito.

### 4 · El teclado, que no es accesorio

**Propuesta.** Con un panel seleccionado: **flechas** lo mueven una celda,
**shift + flechas** cambian su span una celda, **Escape** cancela un arrastre en
curso. Las mismas reglas de colisión y de rango aplican: el teclado no es una
puerta trasera a un estado que el mouse no permite.

**Por qué.** El arrastre **no puede ser el único camino** — y no es solo
accesibilidad: es la forma de colocar con precisión, que es exactamente lo que un
builder de layouts necesita. F4.10 ya deja editar los spans por número; esto es su
equivalente para la posición.

**Y hay una deuda que conviene nombrar:** `design.md` no declara foco visible ni
orden de tabulación para ninguna superficie. Esta propuesta asume el foco del
navegador; si diseño quiere otra cosa, es una pregunta aparte.

### 5 · Dónde vive el estado

**Propuesta.** El drop escribe en el **mismo borrador** de `borrador.ts` que ya
usan F4.8 y F4.10, con una función `moverPanel(tabs, tab, panel, colStart, fila)`.
Guardar sigue siendo explícito y el indicador de «sin guardar» ya existe.

**Por qué.** Es lo único que mantiene una sola fuente. Un estado de canvas aparte
tendría que sincronizarse con el borrador, y **el día que discrepen, lo que se
publica es el borrador** — así que la pantalla mostraría una composición y el PUT
mandaría otra.

**Consecuencia que conviene ver:** hoy `PanelConfigurador` **no edita `colStart`**
justamente porque «un número elegido en un formulario es una columna que nadie
eligió mirando». Con el canvas, esa decisión se sostiene: `colStart` se coloca
arrastrando, y el teclado es la vía precisa.

---

## Lo que esta propuesta NO resuelve

- **`HEREDADO` y el override.** §7.2 pide badge y borde punteado para un panel
  heredado, y «editarlo crea el override». **El cable no tiene herencia**: ni
  vertical del tenant, ni plantillas, ni un campo que diga de dónde viene una
  pestaña o un panel. Es la misma carencia que F4.7 declaró en B1. Sin eso, el
  canvas no puede distinguir un panel propio de uno heredado, así que esa mitad de
  B2 queda fuera de F4.9 aunque el arrastre se decida hoy.
- **La biblioteca de gráficos** del panel lateral. Sale de `/config/plots`, que no
  existe · B1.21 y F4.21.
- **El foco y la tabulación**, arriba.

## Lo que el `.pen` agregó y §7.2 no decía

**Tres cosas que no estaban en la propuesta original** y que salen del frame de
B2:

1. **La biblioteca es de TIPOS, agrupada en cinco grupos**, y cada entrada
   declara qué formas acepta y su rango de span: «bars · categorica · ranking ·
   4–8 ×4–5». Eso sale entero de `/config/blocks`, que **ya tenemos** — no de
   `/config/plots`. B3 es otra cosa: los *gráficos* de un tipo, y esa sí espera
   B1.21.
2. **El chrome del builder lleva el contexto y las acciones en la cabecera**:
   `TENANT · ROL · PESTAÑA`, «3 CAMBIOS SIN GUARDAR», `VISTA PREVIA`, `PUBLICAR`.
   F4.6 a F4.15 los pusieron en barras dentro del cuerpo. Es una divergencia real
   y está registrada aparte.
3. **La grilla se ve, con guías.** No es decoración: es lo que hace legible a
   dónde va a caer el panel mientras se arrastra, que es la mitad de «fácil y
   clara».

## Qué queda para implementar

La propuesta está aprobada, así que F4.9 se puede tomar. **Lo que la condición
del humano agrega** —«fácil y clara»— se traduce en dos cosas verificables, y las
dos están en el `.pen`: la **grilla visible con guías** mientras se arrastra, y el
aviso de colisión que **nombra el panel** en vez de solo marcarlo.

**El teclado sigue siendo del punto 4 y no está en el `.pen`.** Se mantiene como
propuesta nuestra: el arrastre no puede ser el único camino, y es además la forma
de colocar con precisión. Si diseño prefiere otra cosa, es una línea de este
documento.

*Synapse · front dinámico · propuesta abierta el 2026-09-15 con F4.9*
*Fuente · `design/design.md` §7.2 y §4, `plan-de-trabajo.md`*
