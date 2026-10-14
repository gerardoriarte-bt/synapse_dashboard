# Auditoría · el editor compone a ciegas · 2026-10-07

> **Corte** con fecha. No se actualiza: se reemplaza.

**Lo que la disparó**, del humano el 2026-10-07: «no hay una previsualización del
gráfico, entonces es como construir de memoria, y el usuario va a tener que ir
al preview seguido para ver cómo queda».

**Medido contra el servicio `7b717aa` levantado acá** —base local, usuario
`dev@synapse.local`—, el `.pen` y `design.md` leídos el mismo día, y el editor
recorrido en pantalla sobre el borrador `v4` de «UA MX».

## 0 · El diagnóstico en cuatro líneas

1. **El lienzo no dibuja ningún gráfico**: cada panel es una ficha con el tipo, la
   métrica y el tamaño. Es lo que el `.pen` dibuja, así que no es un defecto de
   construcción: es una decisión de diseño que no alcanza.
2. **Y la vista previa (B5) tampoco.** Pinta cajas con el tipo y el tamaño. Ir al
   preview «seguido» no resolvería el problema: **en ningún lugar del builder se
   ve un gráfico**.
3. **La razón por la que B5 no dibuja venció el 2026-10-01 y nadie la releyó.**
   El servicio sirve el dato de un borrador desde `d9147c3`.
4. **Con eso, el lienzo, B5 y el selector de gráfico pueden dibujar con dato
   real**, sin inventar una cifra. Es trabajo nuestro, y no le pide nada a
   backend.

## 1 · Lo que se comprobó

### 1.1 · Qué pinta hoy cada pantalla

| Pantalla | Qué se ve por panel | Qué pide `design.md` §7.2 |
|---|---|---|
| **B2 · Editor** | Tipo de bloque, nombre de la métrica y `N col × M filas`. Nada más | Grilla, biblioteca, arrastre y handles. **No pide preview** |
| **B3 · Elegir gráfico** | Nombre del gráfico, su forma, su mínimo y su tope, en texto | «Muestra los gráficos del grupo **con preview real**» |
| **B5 · Vista previa** | Tipo de bloque y `N × M`. **Sin gráfico ni cifra** | «Renderiza la composición exactamente como la verá el rol seleccionado, **con datos reales**» |

Los dos «preview real» que la spec pide **no se cumplen**, y el único lugar donde
la spec no lo pide —el lienzo— es donde el humano lo extraña.

### 1.2 · El `.pen` dibuja fichas, no paneles

`B2 · Canvas de composición` pone en el lienzo **instancias de
`Builder/Ficha de panel`**: cabecera con tipo, título y `HEREDADO`, y un pie con
`12 × 3` y la clave de la métrica. Ningún gráfico. La nota de B2 enumera «los
cuatro estados de panel que la spec pide: heredado, seleccionado con handles,
slot vacío y colisión».

**Lo construido sigue el dibujo.** Cambiarlo es una propuesta de spec, y va en §4.

### 1.3 · El lienzo nombra el BLOQUE, no el gráfico, y eso confunde

Visto en pantalla: «Cumplimiento de objetivo» dice **`BARRAS`** en el lienzo,
mientras el inspector del mismo panel dice **`BARRAS RADIALES`** y la consola lo
dibuja como un anillo. La ficha muestra el tipo de bloque (`bars`) y no el
gráfico (`radial`), así que **ni siquiera dice qué gráfico va a salir**.

Es independiente del preview, y se arregla en una línea.

### 1.4 · Por qué B5 no dibuja, y por qué esa razón venció

`src/surfaces/builder/RolePreview.tsx` lo declara: «**No trae datos reales.**
B4.9 lo decidió y lo dejó escrito: el preview va sin payloads», y por eso «los
paneles NO se dibujan con `render/Panel`: hacerlo exigiría inventarle un
payload». Era correcto cuando se escribió.

**Desde `d9147c3` —2026-10-01, «payloads en preview»— el servicio los sirve.**
`GET /admin/layouts/{layoutId}/preview` acepta `include=payloads` y `period`, y
devuelve un mapa `payloads` por panel con el mismo armado que el batch de la
consola, aplicando el rol del lente. Leído en `7b717aa`:

- `internal/adapters/handler/dd_config_handler.go:238` —`case "payloads"`—.
- `internal/core/services/dd_config_service.go:686` —`batchForRole` con el rol
  del lente y **`layout.TenantID`**—.

**Medido contra el servicio local**, sobre el borrador `v4` de «UA MX» con el
lente `admin`:

| | |
|---|---|
| Período | `2026-10` |
| Paneles en el preview | **10** |
| Payloads | **10**, los diez `DEGRADED` —el dato local es del 2026-10-02— **con cifra** |

**Ni el cable ni el adaptador lo transcribieron**: `contracts/synapse-admin-wire.yaml`
no declara `include`, `period` ni `payloads`, y `adminApi.preview` no los pide.
Es la falla de siempre —una razón escrita cuando era cierta, que envejece sin
aviso— y esta vez costó que el builder entero se use sin ver un gráfico.

### 1.5 · El dato es por métrica, no por panel · y eso destraba todo

`dd_panel_data` tiene índice único **`(tenant_id, metric_id, period)`**
—`internal/core/domain/dd_panel_data.go:19-22`—. El dato no pertenece a un
panel: pertenece a una métrica en un período. Consecuencias:

- **Un panel nuevo de un borrador tiene dato apenas se guarda**, porque su
  métrica ya está materializada. No hace falta materializar nada.
- **Cambiar el gráfico de un panel no cambia el dato**: el mismo payload sirve
  para dibujarlo como barras, como anillo o como columnas. El cambio se puede ver
  al instante, sin esperar al servidor.
- **Cambiar la métrica sí**, y hay que esperar al guardado automático (3 s) y a
  la próxima lectura.

### 1.6 · Una trampa que conviene no pisar

`POST /config/panels:batch`, el de la consola, **toma el cliente del token**. El
builder trabaja sobre un «cliente de trabajo» que puede no ser el propio, y con el
batch dibujaría el dato **de otro cliente** en silencio. **El preview usa
`layout.TenantID`**: es la ruta correcta para el builder, y la única.

### 1.7 · Lo demás que se vio en pantalla

| | Qué pasa | Por qué importa |
|---|---|---|
| **B3 vive dentro del inspector** | La hoja que el `.pen` dibuja a 1280 × 940 se abre como una caja con scroll propio dentro de los 440 px del inspector | Dos scrolls anidados, y el preview —cuando lo haya— no tendría dónde verse |
| **El inspector tapa un tercio del lienzo** | Es `fixed` a la derecha, 440 px, encima de la grilla | Tapa el panel que se está configurando si está en la columna derecha, que es justo el que hay que mirar |
| **Fichas de 368 px con tres líneas de texto** | Un panel de 4 filas es casi todo blanco | El lienzo se lee como una lista de cajas vacías, no como un dashboard |
| **La ayuda del arrastre siempre a la vista** | Una línea entera sobre el lienzo, también para quien ya sabe | Ruido permanente; podría ir en un estado vacío o en un ⓘ |

## 2 · Lo que se propone

**Una sola fuente de dato para las tres pantallas**: el preview del borrador
abierto con `include=payloads`, con el rol del lente y el período abierto. El
dibujo lo hace `render/Panel` —el mismo que la consola—, que es puro y recibe el
payload por props: §4 lo pensó para servir «en la consola, en el builder y en la
vista previa por rol».

| | Qué cambia |
|---|---|
| **Cable** | Transcribir `include`, `period` y `payloads` en `previewLayout`, con su adaptador y la prueba del adaptador de entrada |
| **B2 · lienzo** | Cada panel se dibuja con su gráfico y su cifra. La ficha —tipo, gráfico, tamaño— queda como una banda arriba del panel, y los handles al seleccionarlo. Arrastre, teclado y colisión no cambian |
| **B5 · vista previa** | Los paneles con `render/Panel` y sus payloads; los huecos siguen como hoy |
| **B3 · elegir gráfico** | Cada gráfico compatible, dibujado **con el dato real de la métrica del panel**. Y como hay dato, el tope deja de declararse y se **evalúa**: «este gráfico queda vacío con este dato» |
| **El lienzo dice el gráfico** | `Barras radiales` donde hoy dice `BARRAS` · §1.3 |

**Lo que el lienzo muestra mientras no hay dato, sin inventar nada:**

| Caso | Qué se ve |
|---|---|
| Panel nuevo, todavía sin guardar | La ficha, con «Se dibuja al guardar» · el guardado automático tarda 3 s |
| Cambió la métrica | El estado de carga de `render/` hasta la próxima lectura |
| Cambió sólo el gráfico | **El gráfico nuevo al instante**, con el mismo payload · §1.5 |
| La métrica está oculta para el rol del lente | El estado `FORBIDDEN` de la consola · es información, no un error |
| El dato no existe | El estado que el servidor mande —`BLOCKED`, `EMPTY`—, con su razón |

**Y el inspector deja de tapar**: o empuja el lienzo, o se abre sobre la
biblioteca. B3 vuelve a ser una hoja propia, como la dibuja el `.pen`.

## 3 · Lo que necesita una decisión humana

| # | Pregunta | Recomendación |
|---|---|---|
| D1 | ¿El lienzo dibuja siempre con dato, o con un conmutador «Fichas / Con datos»? | **Siempre con dato**, con la ficha como banda. Un conmutador es una pregunta que se hace cada vez |
| D2 | Con «Todos los roles» en el filtro, ¿con qué lente se lee el dato? | **El rol `admin`**, que ve todo. Con un rol elegido, ese rol: así el `FORBIDDEN` se ve donde se compone |
| D3 | ¿Qué período dibuja el editor? | **El abierto**, el mismo que la consola abre por defecto. Un selector de período en el editor es otra pantalla |
| D4 | ¿B2 se redibuja en el `.pen`? | Sí: va como propuesta de spec a diseño, porque cambia la anatomía de la ficha de panel |
| D5 | ¿Se reordena el trabajo: primero B5 y B3 —que la spec ya pide— y después el lienzo? | **Primero el cable y B5**: es lo que la spec pide y lo que más rápido devuelve «ver cómo queda». El lienzo reusa todo lo de B5 |

## 4 · El panel de la derecha · ¿el preview lo arregla?

Preguntado por el humano el mismo día: «quiero entender si esto también mejora la
experiencia al momento de seleccionar la información de la gráfica, ya que el
panel de la derecha que se abre no lo veo bien jerarquizado e intuitivo».

**En parte.** El preview mejora **ver el resultado** de lo que se elige. **No
arregla cómo está ordenado lo que se elige**, y hay un caso donde lo empeora si
no se toca el inspector: un lienzo con el gráfico real no sirve si el inspector
tapa justo el panel que se está configurando (§1.7).

### 4.1 · Qué dibuja el `.pen` y qué se construyó

| | El `.pen` | Lo construido |
|---|---|---|
| Forma | **Dos hojas grandes, en pasos**: B3 «Elegir gráfico» a 1280 × 940 y B4 «Elegir métrica» a 960 × 1100, con pie «Cancelar · Enlazar métrica» | **Una columna de 440 px** con todo junto, y B3 abierto adentro con su propio scroll |
| Orden | Se suelta el tipo → B3 el gráfico → B4 la métrica y sus parámetros | Tipo · Métrica · Gráfico · Tamaño · Opciones, uno debajo del otro |
| Cabecera | B4: «Elegir métrica», el contrato —`TIPO series · ACEPTA serieTemporal, seriesMultiples`— | El nombre del **tipo de bloque** —«Barras · Categorías comparadas, con su valor»— |

### 4.2 · Lo que lo hace poco intuitivo, en orden de peso

1. **«Tipo» y «Gráfico» son dos controles para una sola pregunta —«¿cómo se
   ve?»— y se llaman casi igual.** Visto en pantalla: Tipo `Barras`, Gráfico
   `BARRAS RADIALES`. El contrato los separa —el tipo es el cuerpo, `chart` es el
   dibujo— pero quien compone no tiene por qué saberlo.
2. **La cabecera nombra el bloque, no el panel.** Dice «Barras» y no
   «Cumplimiento de objetivo», que es lo que el panel muestra y lo que se busca
   con la vista en el lienzo.
3. **Todo pesa lo mismo.** Cada sección abre con el mismo rótulo mono de 9:
   las dos decisiones que definen el panel —qué métrica y qué gráfico— se ven
   igual que tamaño y opciones, que son ajustes. Y el tamaño repite lo que los
   handles del lienzo ya hacen.
4. **Cada métrica ocupa tres líneas de procedencia** —forma, capa y fuente en
   mono— y el nombre compite con ellas. La procedencia sirve para decidir entre
   dos parecidas, no para leer la lista.
5. **El selector de gráfico vive dentro de la columna**, con scroll dentro del
   scroll: lo que el `.pen` dibuja a 1280 de ancho entra en 440.
6. **«Opciones de este tipo»** muestra nombres de parámetro crudos —`ORDEN ·
   Por defecto`— y, para los que no se pueden editar, «esta opción todavía no se
   puede editar desde acá».
7. **Los problemas del panel van al final**, después de las opciones: lo que
   impide publicar se lee último.

### 4.3 · Qué aporta el preview a esto, y qué no

| | ¿Lo resuelve el preview? |
|---|---|
| Ver cómo queda al cambiar métrica, gráfico o tamaño | **Sí**, en el lienzo, **si el inspector no lo tapa** |
| Elegir gráfico viendo cada opción con el dato de la métrica | **Sí**, es B3 con preview real |
| Tipo y Gráfico como dos preguntas | No · es de estructura |
| La cabecera, el peso, la densidad, las opciones crudas | No · es de jerarquía |

### 4.4 · Lo que se propone para el inspector

```
┌ Cumplimiento de objetivo ──────────────── [Quitar] ┐   ← la métrica es el título
│ Barras radiales · 6 × 4                             │   ← cómo se ve, en una línea
│ ⚠ 1 problema: falta la meta mensual                 │   ← lo que impide publicar, ARRIBA
├─────────────────────────────────────────────────────┤
│ 1 · QUÉ MUESTRA                                     │
│   Cumplimiento de objetivo           [Cambiar]      │   ← la lista se abre al pedirla
├─────────────────────────────────────────────────────┤
│ 2 · CÓMO SE VE                                      │
│   [anillo] [barras] [columnas] [bala] …             │   ← dibujados con SU dato
│   (el tipo de bloque sale del gráfico elegido)      │
├─────────────────────────────────────────────────────┤
│ ▸ Ajustes · tamaño, orden, límite                   │   ← plegado
└─────────────────────────────────────────────────────┘
```

- **Una pregunta por sección**, y las dos que definen el panel primero.
- **«Cómo se ve» junta Tipo y Gráfico**: se elige un dibujo y el tipo se
  deduce. **Hay que verificar que la deducción sea única** —el repertorio filtra
  gráficos por forma, no por tipo, y dos tipos pueden aceptar la misma forma—;
  si no lo es, el tipo queda como agrupador de la grilla y no como control
  aparte.
- **La métrica se cambia en una lista que se abre**, con la procedencia en una
  segunda línea más tenue y las no compatibles plegadas, como hoy.
- **El inspector no tapa el lienzo**: o lo empuja, o se abre sobre la
  biblioteca —que mientras se configura un panel no se usa—.

### 4.5 · Lo que necesita una decisión humana

| # | Pregunta | Recomendación |
|---|---|---|
| D6 | ¿El inspector sigue siendo una columna, o se vuelve a las dos hojas del `.pen` (B3, B4)? | **Columna**, reordenada. Las hojas tapan el lienzo entero, que es justo lo que el preview quiere mostrar |
| D7 | ¿Tipo y Gráfico se juntan en «Cómo se ve»? | **Sí**, si la deducción del tipo resulta única · ver arriba |
| D8 | ¿La biblioteca se esconde mientras se configura un panel, y el inspector ocupa su lugar? | **Sí**: el lienzo queda entero a la vista |

## 6 · Lo decidido y lo construido · mismo día

**Las decisiones, del humano:** D1–D5 y D7–D8 como se recomendaron. **D6 cambió**:
«se podría hacer una serie de columnas que se van abriendo según la profundidad
e información o algo quizás escalonado, la idea es no perder de vista el
lienzo».

| | Qué se hizo |
|---|---|
| **El cable** | `include`, `period` y `payloads` transcriptos en `previewLayout`, medidos contra `7b717aa`; el adaptador usa el mismo `adaptPayload` de la consola. Y **el adaptador tiraba `chart`**: con dato, B5 habría dibujado el gráfico por defecto en vez del elegido |
| **Una sola regla de panel** | Lo que la consola resolvía por panel —params validados, si el gráfico puede dibujar el valor— pasó a `src/surfaces/resolverPanel.ts`, y lo usan la consola, el lienzo, B5 y «Cómo se ve» |
| **B5** | Dibuja cada panel con su cifra y el gráfico elegido, y dice de qué período es |
| **El lienzo** | Cada panel con su dato, con una banda que dice el gráfico y el tamaño. Un panel nuevo con una métrica ya presente se dibuja sin esperar al guardado; si no, «se dibuja al guardar»; lo que el rol del filtro no ve, lo dice |
| **Configurar** | Columnas que se abren: «Panel» resume y lleva a **Qué muestra · Cómo se ve · Ajustes**. Ocupan el lugar de la biblioteca y quedan fijas; **el lienzo se recorre al lado**, a su ancho 1:1, y trae el panel elegido a la vista |
| **Cómo se ve** | Tipo y gráfico en un solo control, agrupado por tipo: con la métrica elegida quedan uno o dos tipos posibles. Cada opción dibujada con el dato real; **el tope y el mínimo se evalúan** con ese dato y la opción que no sirve pierde la muestra y dice por qué |
| **Qué muestra** | Las métricas de otra forma ya no se prohíben: dicen «se va a dibujar como …» y elegirlas cambia el tipo |

**Lo que apareció al construirlo, y no estaba en la auditoría:**

- **El lienzo nunca fue 1:1.** Filas de 96 **más** la separación de 16: el
  espacio entre filas se contaba dos veces y un panel de 4 filas medía 432 en vez
  de 368. Con la ficha no se notaba; con el panel real adentro quedaba un hueco.
  Ahora usa las constantes de `render/grid`.
- **El preview del modo mock no podía funcionar**: leía `roleId` y devolvía la
  forma del fork de septiembre. Se rehízo con la forma medida.
- **El dato en el preview lo habíamos pedido nosotros** —
  `docs/MENSAJE-2026-09-30-backend-payload-en-el-preview.md`—, backend lo entregó
  al día siguiente en `d9147c3`, y **no se consumió en seis días**. Es la falla
  de las respuestas que llegan y nadie lee contra lo que se pidió.
- **Sin roles el lienzo no puede pedir el dato** —la ruta exige `role_id`— y lo
  dice, en vez de «Trayendo el dato…» para siempre.

**Y la regla dura 5 cobró en «Cómo se ve»**: las muestras se dibujaban sin el
marco del panel, y `design-lint` lo marcó —una cifra no viaja sin su BASE y su
procedencia—. Ahora cada muestra las lleva abajo, como hace `ChatFigure`. **El
costo es repetirlas en cada opción** de la misma métrica: es una pregunta para
diseño, en la propuesta.

`PlotPicker.tsx` se borró: «Cómo se ve» lo reemplaza, y el registro de
`pen-pantallas` apunta B3 y su variante con tope a `PanelConfigurator.tsx`. Lo
que diverge del dibujo va en `PROPUESTA-2026-10-07-editor-con-dato.md`.

## 5 · Lo que NO se hizo

- **Al escribirse, no se tocó código**: la auditoría fue primero. Lo construido
  después está en §6.
- **No se modificó el `.pen`.**
- **No se le pide nada a backend**: la ruta existe, el dato también, y se midió.
