# Para el equipo de datos · las once formas que no tienen métrica · 2026-09-29

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. Este pedido **empezó siendo para el equipo de backend y la medición lo
mandó para acá**, así que va con la corrección adelante.

**Lo que creíamos:** que faltaba que el backend materializara cinco formas de
dato. **Lo medido hoy contra `de881e1`:** el backend las materializa todas, y lo
que falta es que exista **una métrica que las declare**.

---

## 1 · Lo que ya está, y por eso el pedido es corto

Las cuatro piezas de la cadena, medidas una por una:

| Pieza | Estado | Cómo se midió |
|---|---|---|
| El transformador del backend | **Las 16 formas** | `TransformValue` de `materialize/transform.go` tiene quince `case` y cubre las dieciséis —`categorical` y `ranking` comparten uno—. **Sin lista blanca**: `Materialize` transforma lo que le llegue |
| Nuestro contrato | **Las 16** | Los dieciséis objetos `Valor*` de `contracts/synapse-api.yaml`, incluidos `ValorMatriz`, `ValorGrafo` y `ValorFlujo` |
| `GET /config/blocks` | **Las 16** | Las `accepted_shapes` de la tabla de bloques, contra el servicio corriendo |
| **El catálogo de métricas** | **5 de 16** | `GET /config/catalog` · las 18 métricas del tenant declaran `scalar`, `multi_series`, `categorical`, `prose` y `tabular`. Y nada más |

**El hueco está en el último renglón, y es el único.** Tres capas saben recibir
once formas que ninguna métrica emite.

---

## 2 · Las once formas sin una sola métrica

Están en dos grupos, y la diferencia importa para priorizar:

### A · Cuatro que BLOQUEAN pantallas sin construir

Sin una métrica de estas formas no hay contra qué construir el cuerpo del panel,
y sin ese cuerpo el gráfico correspondiente del repertorio no se puede dibujar
aunque esté declarado.

| Forma | Qué desbloquea | Gráficos que esperan |
|---|---|---|
| `compared_categorical` | `ComparisonBody` | `TORNADO`, `COLUMNAS AGRUPADAS`, `DUMBBELL`, `PENDIENTE` |
| `multi_attribute_profile` | el mismo cuerpo | `RADAR` |
| `matrix` | `MatrixBody` | `MAPA DE CALOR`, `COHORTES`, `CALENDARIO` |
| `graph` y `flow` | `GraphBody` | `GRAFO`, `FLUJO`, `EMBUDO` |

### B · Siete que ya tienen cuerpo construido y nunca se ejercitaron con dato real

Éstas **sí se dibujan** —el cuerpo existe y tiene pruebas—, pero sólo contra
mocks. Una métrica real de cada una convertiría «probado» en «visto».

`scalar_with_interval` · `series_with_band` · `time_series` · `ranking` ·
`composition` · `distribution`

**Y eso no es una formalidad.** En una tarde de la semana pasada el dato real
contradijo cuatro cosas que dábamos por cerradas contra mocks.

---

## 3 · Qué columnas tiene que devolver la consulta de cada forma

**Esto es lo que más sirve de este mensaje**, y está leído del transformador del
backend —`materialize/transform.go` y `transform_v11.go` en `de881e1`—, no de
nuestra documentación.

**Acepta alias en español y en inglés** para casi todas las claves, que es una
generosidad que conviene conocer antes de pelearse con un nombre.

| Forma | Claves que la consulta debe traer |
|---|---|
| `scalar` | `v` |
| `scalar_with_interval` | `v`, `lo`, `hi`, `level` |
| `categorical` · `ranking` | `label`, `v`, y `position` para el ranking |
| `time_series` | `t`, `v` |
| `multi_series` | `series`, `t`, `v` |
| `composition` | `label`, `v`, `percentage` |
| `distribution` | `bin`/`label`, `v`/`count`, y `lo`/`hi` —o `min`/`max`, o `desde`/`hasta`— |
| `series_with_band` | `t`/`date`/`fecha`/`period`, `v`, `lo`/`lower`/`inferior`, `hi`/`upper`/`superior`, y `level`/`nivel`/`confidence` |
| `compared_categorical` | `label`/`etiqueta`, `v`/`valor`/`value`, `ref`/`reference`/`referencia`, `delta` |
| `multi_attribute_profile` | `profile`/`perfil`, `attribute`/`atributo`/`clave`/`key`, `v`/`valor`/`value` |
| `matrix` | `row`/`fila`, `column`/`col`/`columna`, `v`/`valor`/`value` |
| `graph` | los nodos con `id` y `label`; las aristas con `from`/`source`/`desde`/`origen`, `to`/`target`/`hacia`/`destino` y `weight`/`peso`/`v` |
| `flow` | igual que `graph`, más `stages`/etapas · los enlaces llevan las mismas claves |
| `tabular` | las columnas se declaran aparte, en la configuración del panel |
| `prose` | `headline`, y por pilar `pillar_label`, `pillar_value`, `pillar_note` |

---

## 4 · Lo que pedimos, en orden

1. **Una métrica de cada una de las cuatro del grupo A.** Con una alcanza para
   construir el cuerpo: no hace falta la familia entera.
2. **Después, las siete del grupo B**, para poder mirar contra dato del negocio
   lo que hoy sólo está probado contra mocks.

**No pedimos que sean métricas definitivas.** Una que devuelva el cruce que ya
existe en Gold, con las columnas de arriba, alcanza para desbloquear el trabajo;
la métrica que el producto necesite se define después y el cuerpo ya está.

---

## 5 · Y dos cosas que NO pedimos, para que no se busquen

- **Nada del backend.** Su transformador cubre las dieciséis y no tiene compuerta
  por forma. Si algo falla al materializar una de éstas, es un dato que no
  corresponde a las claves de la tabla de arriba, no una forma sin soporte.
- **Nada del contrato.** Las dieciséis `Valor*` están declaradas de nuestro lado
  desde antes de este mensaje.

---

## 6 · Lo que sigue abierto del mensaje anterior

Las **seis filas con `SEMANTIC_DIRECTION` como código** en vez de texto
redactado, medidas hoy sobre el catálogo recién sincronizado:

```
goal_attainment · orders · revenue · roas · sessions · units   → HIGHER_IS_BETTER
```

Las otras ocho traen `HIGHER = BETTER`, que es lo correcto. Sale en pantalla con
guiones bajos.

**Y una que apareció hoy**, del mismo tipo: `daily_trend` declara
`MIN_GRAIN = month` y viene de Snowflake con fuente «Reporte **diario** de
ecommerce del cliente», y su panel sirve 28 puntos diarios. Hoy no se ve porque
todos los períodos son mensuales; se va a ver el día que haya un selector de
rango. Las dieciocho métricas declaran `month`, así que conviene mirar si la
columna se está llenando con un valor por defecto.

Gracias.
