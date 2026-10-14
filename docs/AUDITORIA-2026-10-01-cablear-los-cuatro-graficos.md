# Cablear los cuatro gráficos · lo que apareció al mirarlos · 2026-10-01

> **Histórico.** Un corte con fecha: qué se cableó y qué se encontró al abrirlo.
> No se actualiza.

**`tornado`, `grouped`, `cohort` y `calendar` se construyeron y se cablearon.**
Lo de acá no es el cableado —eso está en el código— sino **los tres defectos que
aparecieron al ir a mirarlos**, ninguno de los cuales podía ver una prueba.

---

## 0 · El punto de partida: los cuatro eran código muerto

Los cuatro plots llegaron con su batería propia —19, 14, 12 y 21 mutaciones— y
**los cuatro QA cerraron diciendo lo mismo**, cada uno por su lado:

> «las 23 pruebas demuestran que el calendario dibuja bien, **no que se dibuje**»

`ComparisonBody` tenía `DIBUJA.categoricaComparada = ['dumbbell']` y `MatrixBody`
`DIBUJA = ['heatmap']`, así que un panel con `grafico: 'calendar'` caía a
`UnknownPlotState` y el único import de `PlotGrouped` fuera de su archivo era su
prueba.

**Y la cabecera de `ComparisonBody` decía «`tornado` y `grouped` no tienen
componente» el día después de que los dos existieran** — lo declarado en prosa
que se deshace solo, otra vez.

**Ninguna prueba podía verlo**: todas montan el plot directo. Lo cierra
`graficoCableado.test.tsx`, que afirma el DIBUJO montado por `aria-label` y, de
cada caso, las dos mitades —que aparezca el pedido y que **no** aparezca el del
defecto del cuerpo—. Cinco mutaciones, cinco muertas, control nulo sobrevivido.

**Y dos casos negativos vencieron en la misma corrida.** `formasV11.test.tsx`
usaba `tornado` y `cohort` como ejemplos de «no dibuja»; los dos pasaron a
dibujar y las dos pruebas se pusieron rojas. Se reescribieron sobre los ids que
siguen sin dibujar —`slope` y `matrix`—, que es lo que hay que hacer: un caso
negativo que apunta a algo ya construido se queda verde sin verificar nada.

---

## 1 · El botón que prometía duplicar y creaba un borrador vacío

**El peor de los tres, y el que más cerca estuvo de costar caro.**

`SaveBar` ofrece «Crear borrador desde esta versión» cuando la versión abierta
está publicada. El front llamaba:

```
POST /admin/tenants/{id}/layouts   { version_id: "v1" }
```

**El cable dice, con todas las letras, «Crear un borrador VACÍO»**, y
`version_id` es cómo se va a llamar el borrador nuevo — no de dónde sale.

Medido ese día contra `:4010`, sobre un layout de **14 paneles**: el borrador
quedó con `tabs: 0`.

**Lo grave no es que no copiara, es lo que viene después.** Quien aprieta ese
botón está por componer y publicar, y publicar un layout vacío **reemplaza el
dashboard entero por nada**.

### La prueba FIJABA el defecto

Existía una prueba, y afirmaba exactamente lo que el código roto hacía:

```ts
await waitFor(() => expect(cuerpos).toEqual([{ version_id: 'v3' }]))
```

El cuerpo del `POST` y nada más. Es el patrón que la auditoría del plan persigue
por escrito —«una prueba que afirma exactamente lo que el código hace»— y acá
estaba, en el camino de una pérdida de datos.

### Y arreglarlo encontró un segundo defecto debajo

Con el `PUT` ya saliendo, el servicio contestó **500**. La causa: el cuerpo
llevaba los `id` de pestaña y de panel **del layout de origen**, así que el
servicio intentaba actualizar filas de otro layout. Una copia es composición
nueva: los ids los pone quien la guarda.

La prueba nueva afirma las tres cosas, y las tres mutaciones mueren:

| | |
|---|---|
| que el `PUT` SALE | contra el borrador nuevo, no contra el de origen |
| que lleva la composición | `tabs[0].panels.length > 0`, con el fixture arreglado para que separe los casos |
| que **no** lleva los ids | `not.toHaveProperty('id')` en pestaña y en panel |

**El fixture compartido traía `panels: []`**, así que la aserción «lleva la
composición» pasaba con cero paneles en los dos mundos. Se le agregó un panel
sólo en este caso.

---

## 2 · Un layout VÁLIDO no se podía publicar

Al validar en el servidor, la barra decía:

```
NO SE PUDO VALIDAR · CANNOT READ PROPERTIES OF NULL (READING 'MAP')
```

Un `TypeError` nuestro mostrado como resultado de validación — que se lee como
«tu composición está mal» cuando el servicio acababa de decir lo contrario:

```json
{"success":true,"data":{"valid":true,"errors":null}}
```

**`errors` llega `null` cuando no hay ninguno**, no `[]` — un slice de Go sin
inicializar. El cable declaraba `type: array` a secas y `adaptarValidacion`,
escrito desde ese yaml, hacía `w.errors.map(...)`.

**Es la cuarta vez que la distinción `null`-contra-vacío cobra acá** —A5, A1, el
historial de publicaciones— y **la primera en el camino feliz**, que es por qué
sobrevivió: la pantalla se prueba con problemas, porque es el caso que tiene algo
que mostrar.

Corregido en el cable con su razón escrita, regenerado, y con
`tests/api/validacion.test.ts` desde la captura.

---

## 3 · Dos tenants con el MISMO nombre en el selector

El builder abre en «Under Armour México» y hay **dos**:

```
11111111-1111-4111-8111-111111111111   Under Armour México
e65f81ae-50ba-4ceb-bb11-d4c0bb76d111   Under Armour México   ← el de los datos
```

**El nombre no los distingue, y el por defecto es el equivocado.** Me hizo leer
«12 paneles» donde el layout real tiene 14 y estuve a punto de reportarlo como un
defecto del builder. Lo atajó mirar la pestaña de red: las llamadas iban al otro
tenant.

**No se arregla acá**: son dos filas en la base del backend. Lo que sí es
nuestro es que el selector no da con qué distinguirlas — queda anotado para la
auditoría de usabilidad, no cerrado.

---

## 4 · Lo que se vio con dato real, y es lo que sigue

Publicados `tornado` y `cohort` sobre los dos paneles que sirven esas formas, con
el 2026 materializado y período `2026-09`:

### 4.1 · Los dos dibujan, y los dos son ilegibles con este dato

**`tornado` sobre `platform_gap`** · 22 plataformas en un panel de `rowSpan 5`:

- los rótulos de categoría se montan sobre las cifras;
- **los dos valores de cada fila se superponen en su franja** —`85.134,28` y
  `502.449,76` impresos uno encima del otro—, que es **exactamente el riesgo que
  su QA dejó declarado y sin cubrir a propósito**: «dos valores del mismo signo
  se superponen en su franja … quedan nombrados para que no se descubran con dato
  real». Se descubrieron con dato real el mismo día;
- las últimas filas se salen por abajo del panel.

**`cohort` sobre `platform_month_matrix`** · 30 plataformas × 12 meses: los
rótulos de fila se montan entre sí y las celdas quedan en líneas de un píxel.

### 4.2 · Pero el diagnóstico NO es «el plot está mal»

Son dos cosas distintas y conviene no mezclarlas:

| | Qué pasa | De quién |
|---|---|---|
| **El dato no es el del gráfico** | Un tornado es para efectos CON SIGNO; `platform_gap` es todo positivo. Y las columnas de un cohorte son ANTIGÜEDAD, no meses calendario: `2025-10 … 2026-09` es la lectura del mapa de calor | De quien compone · el repertorio no puede saberlo |
| **El repertorio no declara `tope`** | `tornado`, `cohort` y `calendar` tienen `tope: null`, así que nada frena un payload de 22 o 30 elementos | **Nuestro** · se arregla en `gen-plots.py`, como se arregló `donut`/`treemap` |

**Y la densidad no la trajeron estos cuatro**: `heatmap` con el mismo payload ya
mostraba los rótulos montados antes de tocar nada. Es de la familia `matriz`
entera.

**Es la misma clase que la dona sobre una categórica**, resuelta el mismo día: el
repertorio valida la ESTRUCTURA del dato y no su SIGNIFICADO, y el builder ofrece
todo lo que el repertorio permite.

---

## 5 · Lo que yo haría primero

1. **Un `tope` para los tres** · `tornado`, `cohort` y `calendar` · es lo mismo
   que ya hace `donut` con cinco partes, y saca de circulación el panel ilegible
   antes de que alguien lo componga.
2. **El selector de cliente tiene que distinguir los dos tenants** · hoy el por
   defecto es el equivocado y el nombre es idéntico.
3. **Un panel propio para cada uno de los cuatro** · los dos que hay son el dato
   del dumbbell y del mapa de calor. Para verlos bien hace falta el dato que les
   corresponde, y eso es un pedido a datos, no un arreglo nuestro.

**Lo que NO haría**: tocar los plots. Los cuatro dibujan lo que les toca; lo que
falta es que no se los pueda elegir para un dato que no es el suyo.
