# Auditoría · lo que el `.pen` dice y lo que se construyó

**Corte del 2026-09-15.** Histórico: no se actualiza, se reemplaza.

**Qué la originó.** Al validar la propuesta del canvas contra
`design/Synapse_v2.pen` apareció que ese archivo **no es solo los tokens**: tiene
las quince pantallas de admin y builder dibujadas, cada una con una nota de
racional, más los tres tipos de estado vacío y el de carga.

**`CLAUDE.md` lo describía como «los tokens, la fuente de `tokens.css`»**, y con
esa lectura se construyeron diez pantallas —F4.1 a F4.15— sin abrirlo. La
corrección de esa línea es lo primero que se hizo; esto es el inventario de lo
que quedó distinto.

**Ninguna de las divergencias es un defecto de funcionamiento.** Todo lo
construido pasa la puerta y hace lo que dice. Lo que difiere es **qué se muestra
y cómo se dice**, que en este producto es la mitad del trabajo.

---

## 1 · El chrome del builder · B1–B5

**El `.pen`** pone el contexto y las acciones en la cabecera, en las cuatro
pantallas: `TENANT · ROL · PESTAÑA`, un contador «3 CAMBIOS SIN GUARDAR», y los
botones `VISTA PREVIA` y `PUBLICAR`.

**Lo construido** tiene el cliente y la versión en B1, el contador y guardar en
una `SaveBar` dentro del cuerpo, y validar/publicar en una `PublishBar` debajo.

**Por qué importa y no es cosmético.** En el diseño el contexto es **persistente**:
se ve desde cualquier pantalla del builder qué rol y qué pestaña se está
componiendo. En lo construido, al salir de B1 se pierde de vista. Y «3 cambios sin
guardar» en la cabecera es un aviso que sigue al usuario; en una barra del cuerpo
desaparece al cambiar de pantalla, que es justo cuando hace falta.

**Alcance del arreglo:** `BuilderChrome` gana el contexto y las tres acciones;
`SaveBar` y `PublishBar` se vacían o se reducen a lo que no es global.

## 2 · Cómo se explica un rechazo · B4

**El `.pen`**: «REQUIERE serieTemporal · ESTA ES escalar», y las no compatibles
van **agrupadas por razón**: «30 · AGRUPADAS POR RAZÓN · escalar (13) · prosa (2)
· categorica (2) · tabular (4) · ranking (2) · composicion (1)».

**Lo construido** lista las 34 planas, cada una con «Un bloque «kpi» no sabe
dibujar la forma «serieTemporal»».

**Dos diferencias, y la segunda es la que enseña.** La forma del mensaje está
escrita **desde la métrica** —«ESTA ES escalar»— y no desde el bloque; y el
agrupado convierte un muro de 30 líneas en seis. Con 34 métricas lo construido es
ilegible, que es lo contrario de «el rechazo explicado es lo que enseña el
sistema».

**Alcance:** `PanelConfigurator` agrupa las incompatibles por forma y cambia el
literal. `invalidReason` de `catalog/blocks.ts` **no se toca**: lo consume también
la consola, y ahí el mensaje desde el bloque es el correcto.

## 3 · El estado de carga · las cuatro tablas de admin

**El `.pen`** tiene una pantalla dedicada —`A1 · Clientes · cargando`— y su nota
dice que es **el patrón para las cuatro**: «Esqueleto y NUNCA spinner (…) la
tabla ya sabe cuántas columnas tiene y de qué ancho, así que puede prometer la
forma que va a llegar. Un spinner solo dice "esperá"». Y: «el encabezado se pinta
completo desde el principio y los conteos dicen CARGANDO en vez de una cifra:
decir "3 TENANTS" mientras carga sería afirmar algo que todavía no llegó».

**Lo construido** pinta un texto: «Cargando el catálogo…», «Cargando los roles…».

**Alcance:** un primitivo de esqueleto de tabla, usado por las cuatro. Es la
divergencia más barata de arreglar y la que más se nota.

## 4 · Los vacíos son TRES cosas, no una

**El `.pen`** distingue **vacío de sistema** (nadie dio de alta nada todavía),
**vacío de filtro** (los 17 usuarios siguen ahí, el conteo lo dice) y **vacío de
alta** (el cliente es nuevo y el trabajo está por hacerse). «Un estado sin salida
es una queja (…) la salida cambia con la causa.» Y en los tres **el encabezado de
la tabla se conserva**: «las columnas siguen diciendo qué habría acá».

**Lo construido** tiene un vacío por pantalla, con una salida, y sin encabezado.

## 5 · A4 · el estado se DERIVA · **ya corregido**

**El `.pen`**: «24 disponibles, 3 degradadas y 1 bloqueada (…) feed_vs_sales
figura DISPONIBLE en el catálogo y sale DEGRADADA acá porque la frescura de su
fuente la baja».

**Lo construido** declaró el estado ausente y **pidió al backend un campo
`state`**. Era el pedido equivocado: el estado sale de `frescura > cadencia ×
tolerancia`, y los tres términos son de la **fuente**.

**Ya está corregido**: el pedido se retiró de B1.17 y se abrió **B2.13 · salud de
feeds por fuente**, que desbloquea A5 entera y la columna de estado de A4. Es la
única divergencia de esta lista que salía del repositorio hacia el backend, y por
eso se arregló primero.

## 6 · A4 · dos columnas que sí se pueden

El `.pen` muestra `USO · 2 PANELES` y `PROCEDENCIA · FRESCURA`, y un botón
`SINCRONIZAR CATÁLOGO`. F4.5 los declaró ausentes a los tres. **Dos de las tres
razones siguen en pie** —frescura viene de B2.13, sincronizar no tiene ruta— pero
el conteo de paneles **sale del layout**, que sí tenemos: se descartó por costo
—N+1 sobre los borradores— y el diseño lo pide igual.

## 7 · B1 · la herencia, con un número

El `.pen` pide que la barra de cada pestaña muestre «la proporción real entre
paneles heredados de la plantilla y propios del tenant» — «UA MX hereda 11 de 12
paneles en su overview». F4.7 declaró la herencia ausente, **y eso sigue siendo
correcto**: el cable no la tiene. Lo que cambia es que ahora se sabe **qué forma
tiene que tener el dato** cuando llegue, y el pedido de B4.2 se puede escribir con
esa precisión.

---

## Qué NO cambia

Las decisiones duras que se tomaron leyendo `design.md` **quedaron bien** y el
`.pen` las confirma: el ancho mínimo 1280 en admin y 1600 en builder, la fórmula
`96·N − 16` —«COLUMNA 80 · GAP 16 · FILA BASE 80», y «3 × 4 · 272 × 368», que da
exacto—, «ocultar no es permitir», nada de vocabulario de infraestructura, y que
el alcance de A3 sea plataforma.

## El aprendizaje, que es de proceso y no de producto

**Un archivo de diseño descrito como «los tokens» no se abre.** La línea de
`CLAUDE.md` era verdadera y estaba incompleta, y ninguna de las herramientas de la
puerta podía detectarlo: `token-drift` verifica los tokens contra el `.pen` y
sale en verde, porque los tokens estaban bien. **Un chequeo que verifica una
parte no dice nada de las otras, y su verde se lee como si lo dijera.**

*Synapse · front dinámico · auditoría del 2026-09-15*
*Fuente · `design/Synapse_v2.pen`, `plan-de-trabajo.md`, el código de F4.1–F4.15*
