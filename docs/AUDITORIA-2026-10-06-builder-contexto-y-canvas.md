# Auditoría de UX · Builder · contexto de edición y canvas · 2026-10-06

**Pedido (humano):** «lo veo muy complicado de comprender y, en términos
generales, hay poca diferenciación entre lo que es texto informativo y texto
seleccionable».

**Medido contra `2019099`** (más el árbol de trabajo de hoy, que en el builder
sólo toca el logotipo de `BuilderChrome`), en `npm run dev:mock`, tema oscuro,
ventana de 1568 px. Recorrido: login → Builder → «Contexto de edición» → elegir
`BORRADOR v4` → elegir un panel → bajar hasta el configurador → «Componer
eCommerce Overview» → canvas → pestaña «Selector de gráfico». Contrastado con los
frames `B1 · Selector de contexto` y `B2 · Canvas de composición` del `.pen` y
sus notas.

**Lo que NO se midió:** ningún usuario real lo usó; el tema claro; el teclado y
el lector de pantalla (no es una auditoría de accesibilidad); los datos son los
del mock.

---

## 0 · El diagnóstico en tres líneas

1. **Un solo registro tipográfico hace seis trabajos.** Rótulo, instrucción,
   estado, error, nota de desarrollo **y** acción se pintan igual: mono de 10 px,
   mayúsculas, tracking de 0.12em, gris. La percepción que se reportó no es una
   impresión: es literal.
2. **«Contexto de edición» no es una pantalla: son cinco apiladas.** El selector
   de contexto (B1), el editor de pestañas, el binder de métrica (B4), el
   selector de gráfico (B3) y el ciclo guardar-validar-publicar viven en un mismo
   scroll de unas cinco alturas de ventana, en ese orden y sin jerarquía.
3. **El canvas y el contexto editan el mismo objeto con capacidades
   distintas.** En el canvas se mueve y se redimensiona un panel pero no se le
   puede cambiar la métrica ni el tipo; para eso hay que volver a la otra
   pantalla, buscar el chip y bajar hasta el configurador.

---

## 1 · Informativo contra seleccionable · el pedido central

### 1.1 · Lo que se midió en el código

| Archivo | `<Label>` | `<button>` | Botones con la misma clase de rótulo (`tracking-rotulo uppercase`) |
|---|---:|---:|---:|
| `PanelConfigurator.tsx` | 27 | 5 | 3 |
| `ContextView.tsx` | 10 | 1 | 0 · pero el botón **contiene** `<Label>` |
| `TabEditor.tsx` | 10 | 7 | 7 |
| `PublishBar.tsx` | 7 | 1 | 1 |
| `BuilderChrome.tsx` | 7 | 5 | 5 |
| `Canvas.tsx` | 7 | 1 | 1 |
| `Library.tsx` | 7 | 0 | 0 · los ítems arrastrables son `<li>` |
| `SaveBar.tsx` | 3 | 1 | 1 |
| `ValidationSummary.tsx` | 3 | 0 | 0 |
| **Total** | **81** | **21** | **18 de 21** |

Ochenta y un textos informativos y veintiún controles, y **dieciocho de esos
controles visten el traje del rótulo**. Lo único que los separa es, en algunos,
un borde `w4` de un píxel; en otros, nada hasta que se pasa el cursor.

Y no hay un primitivo de botón: `src/render/primitives/` tiene `Label`, `Note` y
`Value`. Cada botón del builder escribe su clase a mano, y en `src/surfaces/builder/`
hay **dieciséis variantes distintas** — algunas sin `cursor-pointer`, otras con
`rounded-sm` donde las vecinas usan `rounded-md`.

### 1.2 · Los casos donde se confunde, vistos en pantalla

| Dónde | Qué se ve | Qué es |
|---|---|---|
| Lista de versiones | `PUBLICADO v3 2026-09-10T12:00:00Z` | **Un botón.** No tiene borde ni fondo hasta elegirlo; adentro son tres `Label` |
| Cabecera de cada pestaña | `ORDEN 1  SUBIR  BAJAR` | El primero es rótulo, los otros dos son botones. **Mismo tamaño, mismo gris, misma caja** |
| Paneles de la pestaña | `KPI  KPI  SERIES  BARS  FORECAST` | Botones que abren el configurador. Se leen como etiquetas de una lista |
| Panel con problemas | `LIST ·` | El ` ·` final es **la única marca** de que el panel está mal. No se ve |
| Cabecera del chrome | `VISTA PREVIA` · `PUBLICAR · FALTA VALIDAR EN EL SERVIDOR` | El primero es botón; el segundo **ocupa el lugar del botón** y es texto |
| Canvas · panel elegido | `ANGOSTAR  ENSANCHAR  ACHICAR  AGRANDAR` | Cuatro botones que se leen como un rótulo más del panel |
| Configurador · métricas | `Ventas 1 ESCALAR · GOLD · ERP` | Una fila elegible; la elegida se distingue por un fondo `w3` contra `w2` |
| Configurador · opciones | `COMPARATIVO · ESPERA «TRUE» O «FALSE»` y un campo vacío | Un booleano pedido como texto libre |

### 1.3 · Por qué pasa, que no es descuido

`Label` existe por «ningún número desnudo»: es el rótulo **de un dato** en un
panel de la consola. El builder lo adoptó como **el** texto secundario, y desde
ahí todo lo que no es un valor se volvió `Label` — instrucciones, avisos, estados,
errores, notas de lo que falta. En la consola funciona porque casi todo lo que
hay es dato con su rótulo. En una superficie de edición, donde la mayoría de los
elementos se **operan**, el mismo registro borra la diferencia.

**Y el `.pen` lo hace a medias.** B1 y B2 también rotulan casi todo en mono de
9–10 px gris, pero tienen mucho menos texto y resuelven las acciones con forma:
`COMPONER ECOMMERCE OVERVIEW` va **relleno en `acc`** con texto `on-acc`, `VER
COMO PLANNER` va como botón secundario con caja, y las tarjetas de tenant y rol
son **tarjetas**, no un `<select>` al lado de un rótulo.

### 1.4 · Propuesta · cuatro registros con los tokens que ya existen

No hace falta un token nuevo. Hace falta que cada rol tenga **una** forma y que
no se preste:

| Registro | Para qué | Forma propuesta | Hoy |
|---|---|---|---|
| **Rótulo** | Nombra un dato o un campo | `Label` tal cual · mono 10, mayúsculas, `dim` | `Label` |
| **Ayuda** | Instrucción, explicación, aviso | `font-body text-celda text-dim`, **frase normal, sin mayúsculas** | `Label` |
| **Acción** | Ejecuta algo | Primitivo nuevo `Accion` con tres variantes —primaria (`bg-acc` + `on-acc`), secundaria (caja `w4`), destructiva— y **siempre** con caja visible | 16 variantes a mano |
| **Opción** | Se elige de un conjunto | Fila o chip con caja visible en reposo y una marca explícita de elegido (borde `acc`, que es «estado activo» y está permitido) | Fondo `w2`/`w3` |

Con eso, la regla que el ojo aprende es simple: **mayúsculas mono = nombre de
algo; frase = explicación; caja = se toca**.

Dos notas sobre las reglas de color:

- **El borde `acc` como marca de selección está dentro de los usos permitidos**
  —«estado activo»— y el canvas ya lo usa para el panel elegido. Extenderlo a
  las opciones es coherencia, no un uso nuevo.
- **`QUITAR` y `QUITAR PANEL` hoy van en `acc`**, el mismo naranja que el CTA
  principal. Una acción destructiva con el color de «adelante» invierte la señal.
  Cómo se pinta lo destructivo sin rojo semántico es una **decisión de diseño**
  —ver §5.

---

## 2 · Navegación

### 2.1 · Seis pestañas, y tres no son lo que dicen

| Pestaña | Qué pasa al tocarla |
|---|---|
| Contexto de edición | La pantalla larga de §3 |
| Canvas | El lienzo |
| **Selector de gráfico** | «Está construida, en otra pantalla · Está en "Contexto de edición"…» |
| **Binder de métrica** | Lo mismo |
| **Vista previa por rol** | Lo mismo que el botón `VISTA PREVIA` del chrome, que está a 40 px |
| Historial de versiones | B6 |

Dos pestañas llevan a un texto que dice que la pantalla está en otro lado, y una
duplica un botón. **El usuario aprende que las pestañas no son confiables** en
el primer minuto. La razón de mantenerlas —que `pantallas.ts` declara las seis
de §7.2 y `pen-pantallas` pide declararlas— es de **nuestro** registro, no del
usuario: declarar una pantalla no obliga a ofrecerle una pestaña.

### 2.2 · El contexto se elige dos veces y se muestra tres

- **Cliente y rol** están como texto en el chrome **y** como `<select>` en el
  cuerpo de «Contexto de edición». Dos lugares con el mismo nombre, uno que se
  toca y otro que no, con el mismo rótulo `CLIENTE`.
- **Pestaña** está en el chrome como texto, y en el canvas además como
  `COMPONIENDO [select]`. En «Contexto de edición» el chrome dice `PESTAÑA
  Todas`, y cambia a un nombre al elegir un chip de panel — sin que el usuario
  haya elegido una pestaña.
- **El selector de rol no cambia nada en esta pantalla.** El `.pen` dice «EL ROL
  DEFINE QUÉ PESTAÑAS SE EDITAN», pero `TabEditor` lista todas las pestañas sea
  cual sea el rol; el rol sólo lo usa la vista previa. Un control que se mueve y
  no produce efecto visible se lee como roto.

### 2.3 · Elegir un panel no muestra nada donde se mira

Al tocar un chip de panel (arriba, en la pestaña) el configurador aparece **al
final de la página**, debajo de cuatro cajas grises —«Cada pestaña va a poder
declarar más cosas», el aviso de problemas, la barra de validar y el resumen de
problemas—. En la ventana medida eso son **más de dos alturas de scroll**, y lo
único que cambia a la vista es el fondo del chip y el nombre en el chrome.

### 2.4 · El ciclo de publicar está repartido en dos lugares y tres pasos

`GUARDAR` está en el chrome; `VALIDAR EN EL SERVIDOR` está en el cuerpo, a
media página; `PUBLICAR` vuelve al chrome y **sólo aparece como botón después de
validar** — antes es el texto «Publicar · falta validar en el servidor». Es
correcto que publicar exija validar, pero el camino obliga a ir y volver entre
la cabecera y la mitad de la página para una sola intención.

### 2.5 · Los problemas se cuentan tres veces

`2 PESTAÑA(S) CON PROBLEMAS DE COMPOSICIÓN` arriba, `5 PROBLEMA(S) DE
COMPOSICIÓN · SE GUARDAN IGUAL, NO SE PUBLICAN` en la `SaveBar`, y `5
PROBLEMA(S) DE COMPOSICIÓN` con su lista en `ValidationSummary`, dos cajas más
abajo. Y la lista nombra «panel 3» de «Repertorio de gráficos» sin un enlace que
lo elija: hay que contar chips.

---

## 3 · Coherencia entre el canvas y el contexto

### 3.1 · El canvas no configura

En el canvas un panel se elige, se mueve y se redimensiona. **No** se le cambia
la métrica, el tipo, el gráfico ni las opciones: eso vive sólo en el
configurador de «Contexto de edición». El `.pen` de B2 apunta a lo contrario —un
`SLOT VACÍO · 3 × 4` con `ELEGIR TIPO` adentro—: el lienzo es donde se compone.

Hoy la selección **sí** viaja entre las dos pantallas (el panel elegido en el
contexto llega con borde `acc` al canvas), lo cual es bueno. Lo que falta es que
el canvas tenga su propio panel de configuración —un inspector a la derecha—, y
eso choca con «1200 de lienzo 1:1 + 300 de biblioteca = 1600»: es una
**decisión de diseño**, no un ajuste (ver §5).

### 3.2 · Los handles no entran en un panel angosto

En un panel de 3 columnas, `ANGOSTAR ENSANCHAR ACHICAR AGRANDAR` desborda el
borde y el último se corta en `AGRANDA`. Visto en `Ventas 1` (KPI, 3 × 4). Son
cuatro palabras donde el patrón habitual son cuatro flechas o manijas en los
bordes, y el `.pen` dibuja handles, no palabras.

### 3.3 · Nombres crudos donde va el nombre de producto

- La biblioteca y los chips dicen `bars`, `comparison`, `forecast`, `KPI`,
  `SERIES`: los ids del contrato. El `<select>` de tipo dice `kpi`.
- Las formas salen como `ESCALARCONINTERVALO`, `SERIESMULTIPLES`,
  `CATEGORICACOMPARADA`: el enum sin separar.
- La versión sale `2026-09-10T12:00:00Z`. Ya estaba en
  `AUDITORIA-2026-09-30-usabilidad.md` §2.4 y sigue.

El nombre del tipo de panel sí es contrato y no se traduce en el cable; lo que
falta es **su rótulo de producto**, que es otra cosa y hoy no existe en ningún
lado (`/config/blocks` no lo trae). Ver §5.

### 3.4 · Notas nuestras pintadas como interfaz

`copy-producto` sale ✓ —«2101 cadenas de 55 componentes · ninguna nombra
plomería»— y **en el builder se pintan cuatro que sí la nombran**:

| Archivo y línea | Texto en pantalla |
|---|---|
| `PanelConfigurator.tsx:185` | «§5 gobierna esta lista · el binder no ofrece lo que el tipo no puede renderizar» |
| `PanelConfigurator.tsx:336` | «1 · se coloca en el canvas · F4.9» |
| `ContextView.tsx:113` | «Sin roles definidos · se definen en la ficha de cliente · F4.3» |
| `Builder.tsx:761` | «Se definen en la ficha de cliente de administración · F4.3» |

> **Corregido el mismo día, al implementarlo.** Acá decía que las cuatro eran un
> agujero del chequeo. **Tres sí lo eran y una no**: «§5 gobierna esta lista»
> estaba **eximida a propósito** en `copy-producto.py`, con su razón —es literal
> del `.pen` de B4— y su propuesta abierta,
> `PROPUESTA-2026-09-30-citas-de-spec-en-el-pen.md`. Se escribió sin abrir la
> lista de exenciones, que es la falla de «nada se escribe de memoria».
>
> Los dos agujeros reales eran de **forma**: una plantilla con `${…}` —el patrón
> excluía el `$`— y un texto JSX en la misma línea que su etiqueta —la regla del
> texto suelto salteaba toda línea que empieza con `<`—. Los dos se taparon y se
> comprobaron reintroduciendo las fugas.

Y hay otra clase que el chequeo no puede ver porque no nombra plomería pero es
igual de nuestra: textos que le explican **al equipo** cómo está hecho el
builder.

| Texto | Para quién es |
|---|---|
| «Ancho 1600 · lienzo 1:1 a 1200 más 300 de biblioteca» (chrome, siempre) | Para quien implementa |
| «Esta pantalla va a crecer» + tres faltantes | Para el plan |
| «Cada pestaña va a poder declarar más cosas» + tres faltantes | Para el plan |
| «El servidor decide · esto es feedback inmediato y puede no conocer todas sus reglas» | Defendible, pero en el registro equivocado |
| «Publicar no despliega · cambia qué layout sirve la consola» | Ídem |

`GRILLA 12 · COLUMNA 80 · GAP 16 · FILA BASE 80` y `EL ALTO SE DECLARA EN
rowSpan · NUNCA EN PÍXELES` **son literales del `.pen`**, así que se quedan
—donde el `.pen` y `design.md` difieren, gana el `.pen` en el literal—. Pero
conviene preguntarle a diseño si están para el usuario o para el handoff: `rowSpan`
es un nombre de campo.

---

## 4 · El dibujo contra lo construido

| | `.pen` B1 | Construido |
|---|---|---|
| Pregunta de la pantalla | «¿Sobre qué se va a componer?» en `font-display` 26 | No hay título |
| Tenant y rol | Tarjetas con nombre, plantilla y conteo | Dos `<select>` |
| Pestañas | Lista con barra heredado/propio y **un** CTA `COMPONER …` | Formulario completo por pestaña, con chips de panel |
| Configurar un panel | No está en B1 | Está en B1, al fondo |
| Guardar / validar / publicar | En el chrome de B2 | Repartido entre chrome y cuerpo |
| Salida | `AL ENTRAR SE ABRE B2 CON ESTE CONTEXTO` | Un botón por pestaña, alineado a la derecha, con caja de 1 px |

**La desviación más grande no es visual: es de alcance.** B1 en el `.pen` es una
pantalla de **decisión** —elegir sobre qué trabajar— que termina en una sola
acción. La construida absorbió B3 y B4 —decisión registrada en
`EN_OTRA_PANTALLA` de `Builder.tsx`, con su razón: «configurar un panel exige
tenerlo elegido»— y el editor de pestañas. La razón sigue siendo buena; el lugar
elegido es el que produce el scroll de §2.3.

---

## 5 · Lo que haría, en orden

### Sin decisión de nadie · se puede tomar ya

1. **Los cuatro registros de §1.4**, empezando por un primitivo `Accion` en
   `render/primitives/` y una variante de ayuda en frase normal. Reemplazar las
   dieciséis variantes de botón. Es lo que contesta directamente el pedido.
2. **Opciones con caja y marca de elegido**: versiones, chips de panel, filas de
   métrica. Y el panel con problemas marcado con algo que se vea, no con ` ·`.
3. **Sacar las cuatro fugas de §3.4 y tapar el agujero de `copy-producto`**, con
   la mutación que lo demuestre.
4. **Sacar del chrome «Ancho 1600 · …»** y mover los dos bloques «va a crecer» a
   comentario: describen el plan, no el producto.
5. **Arreglar el desborde de los handles** en paneles angostos.
6. **Un solo resumen de problemas**, con cada línea como enlace que elige el
   panel o la pestaña.
7. **El configurador junto a lo elegido**: como mínimo, llevar el foco y el
   scroll al configurador al tocar un chip; mejor, moverlo arriba del bloque de
   publicar.

### Con decisión de diseño o de producto

Las respuestas son del humano, el mismo 2026-10-06, y se transcriben literales.

| # | Pregunta | Por qué no la decidimos nosotros | Respuesta (humano) | Cómo se implementó |
|---|---|---|---|---|
| D1 | ¿El canvas lleva un **inspector** del panel elegido? | Rompe la cuenta 1200 + 300 = 1600 del `.pen`, o pide escala distinta de 1:1 | «Si no genera ninguna mejora importante en la experiencia y configuración, quitarla» | **Sí la genera**, y es la mayor: era la única forma de que el canvas configure. Va **encima** del lienzo, a la derecha, para no achicar los 1200 |
| D2 | ¿Se parte «Contexto de edición» en **B1 como está dibujada** (decidir) + edición de pestañas + configurador? | Es una reestructura que el `.pen` sugiere pero no dibuja entera | «Hay que completarla como debe quedar» | B1 es la pantalla de decisión del `.pen`: título, cliente, rol, versión y tarjetas de pestaña con `Componer`. El configurador se mudó al inspector |
| D3 | ¿Se ocultan las pestañas «Selector de gráfico», «Binder de métrica» y «Vista previa por rol»? | `pantallas.ts` las declara por §7.2; quitarlas de la navegación es una lectura de la spec | «Quitarlas si no suman» | Las tres salen del nav (`enNav: false`). Siguen declaradas para `pen-pantallas`; la vista previa se abre con su botón |
| D4 | ¿Cómo se pinta lo **destructivo** sin rojo y sin el naranja de los CTA? | Regla dura de color de `design.md` | «Creo que debemos implementar el rojo, es lo mejor en entendimiento visual» | Token `peligro` en `src/tokens/decisiones.css` —escrito a mano, porque `tokens.css` lo genera el `.pen`—, medido por `contraste` en los dos temas. Es color de **acción**, nunca de dato |
| D5 | ¿Qué hace el **selector de rol** en la pantalla de contexto? | El `.pen` dice que define qué pestañas se editan; hoy no filtra nada | «Debería funcionar como un filtro para poder seleccionar y editar los dashboard por cada rol dentro del cliente, en este momento no está bien comprensible, hay que mejorar» | Filtro con «Todos los roles» + cada rol; filtra B1 y el selector del canvas. Cada pestaña dice quién la ve y lo deja cambiar; la pestaña nueva nace para el rol filtrado |
| D6 | **Rótulos de producto** para los tipos de panel y las formas (`bars` → «Barras») | El dueño del copy que describe datos es el catálogo; el de tipos de panel no está definido | «Definirlo» | `src/surfaces/builder/rotulos.ts`, sobre la unión del contrato: un tipo nuevo del yaml deja de compilar en vez de pintarse crudo |
| D7 | ¿Las reglas de grilla del `.pen` (`rowSpan`, `GAP 16`) son para el usuario? | Literal del `.pen`, que no modificamos | «Lo que consideres mejor para la usabilidad» | Fuera: hablan del handoff. En su lugar, una frase con los gestos. «Slot vacío» **se queda**, que es literal del `.pen` y no regla de grilla |

Y una decisión más, sobre la tipografía, que no estaba en la tabla: **se mantienen
las tres familias y se usan sus ejes**. Inter, JetBrains Mono y Space Grotesk ya
son variables; lo que faltaba era una escala de pesos —en todo `src/` había tres
`font-medium` y dos `font-bold`—. El alcance es builder y administración; la
consola, que es casi toda dato con su rótulo, queda como está.

D1, D2 y D3 se pueden juntar en una sola propuesta: son la misma pregunta —**dónde
vive la edición de un panel**— vista desde tres lados.

---

## 6 · Cómo reproducirlo

```
npm run dev:mock                     # abre /index.dev.html
# cualquier correo · contraseña de 6 caracteres o más
# Identidad → Builder → BORRADOR v4 → chip KPI → bajar
# → COMPONER ECOMMERCE OVERVIEW
```

Los conteos de §1.1 salen de:

```
for f in ContextView TabEditor PanelConfigurator SaveBar PublishBar \
         ValidationSummary Canvas Library BuilderChrome; do
  grep -c '<Label' src/surfaces/builder/$f.tsx
  grep -c '<button' src/surfaces/builder/$f.tsx
  grep -c 'tracking-rotulo uppercase' src/surfaces/builder/$f.tsx
done
```
