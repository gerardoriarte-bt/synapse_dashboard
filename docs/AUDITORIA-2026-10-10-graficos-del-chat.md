# Auditoría · los gráficos del chat, ¿se entienden? · 2026-10-10

> **Histórico.** Una revisión con fecha: qué se miró, contra qué, y qué se
> encontró. No se actualiza; lo que se arregle se anota en su commit.

**Pregunta del humano:** «validar que los gráficos que llegan y que se
reproducen tienen toda la información necesaria y clara para comprenderlos».

**Contra qué se midió.** Los **siete `chart_spec` reales** que hay guardados en
la base local (`user_thread_messages.structured_data`, del 2026-09-24 al
2026-10-09), producidos por el agente `SYNAPSE_UA` contra Snowflake, y cada uno
**abierto en la aplicación** contra `9dc481e` en `:4010`, con el front de
`main` más el PR #11 (gráficos sin familia en neutro).

## Lo que llega

| Fecha | Marca | Qué es | Del spec |
|---|---|---|---|
| 09-24 | `bar` + `color` + `xOffset` | Ventas por plataforma, 3 meses · **barras agrupadas** | Ejes «Mes» y «Ventas (USD)» |
| 10-07 ×2 | `line` | Ingresos mensuales, 6 meses | «Mes», «Ingresos (USD)» |
| 10-08 | `line` + `color` | Ingreso de paid media por plataforma, 8 meses | «Mes», «Ingreso (USD)», «Plataforma» |
| 10-08 | `line` + `color` | Lo mismo, con **dos `null`** de TikTok | idem |
| 10-09 ×2 | `bar` horizontal | Inversión por plataforma, agosto | «Inversión (USD)», «Plataforma», `sort: -x` |

**Todos traen** título con período y unidad, nombre y unidad de cada eje,
formato de números, y tooltip. `deVegaLite` conserva **los datos, la marca y el
título**; descarta todo lo demás.

## Lo que se dibuja bien

- Título, eje de tiempo rotulado («MAY 26»), eje de valores abreviado
  («1.5M»), lectura con hover y con flechas, leyenda con el nombre de cada serie.
- BASE y procedencia declaradas: «la consulta no la declara · hace 2 d».
- Sin familia, se dibuja en neutro y lo dice (#11).

## Lo que falla, por gravedad

| # | Qué | Efecto en quien lee | De quién |
|---|---|---|---|
| 1 | **Dos de siete gráficos DESAPARECEN sin aviso.** Las barras agrupadas (`bar` + `color`) y la serie con dos `null` hacen que `deVegaLite` devuelva `null`; la trama no adapta y `datoDesdeTrama` la descarta | Una respuesta que dice «aquí la gráfica» y no muestra nada. Viola «degradación declarada» | Front |
| 2 | **El mes en curso no se marca.** «Ingresos mensuales May–Oct» cae de 1,3M a ~130K en octubre, que llevaba una semana | Se lee un desplome que no existió. **Es el más engañoso** | Front · el dato existe: `open_period` en `/config/me` |
| 3 | **Los ejes no dicen qué miden.** «Ventas (USD)», «Plataforma», «Mes» se descartan; la unidad sobrevive sólo si el agente la puso en el título | Un eje «1.5M» sin unidad; ningún número desnudo depende de la redacción del agente | Front |
| 4 | **La cifra de la leyenda no dice de cuándo es.** «GOOGLE 613,386.49» es el valor de agosto, sin decirlo | Un número sin rótulo | Front |
| 5 | **En neutro, dos series se confunden.** Google y TikTok salen en grises vecinos (escalones 0 y 2), y la primera serie no es la más marcada | Hay que ir a la leyenda para separar líneas | Front · y diseño, §14 |
| 6 | **Un `null` es «sin dato», no una fila rota.** En el spec de paid media TikTok trae `null` en abril y junio: Vega-Lite lo dibuja como hueco | Es la causa de la mitad del punto 1 | Front |
| 7 | **La narración interna del agente se cuela en la respuesta**, en inglés: «I need to use the logical column names (p_date, p_fuente) in the SELECT so they get resolved» | Texto técnico en mitad de la conclusión | Agente · lo configura DATOS |

## Lo que no se miró

- **El tema oscuro de los gráficos en neutro**: el contraste se calculó
  (`decisiones.css`), pero no se abrió en pantalla.
- **El tooltip de las barras**: usa el `title` nativo (§11 de las
  divergencias), no se probó acá.
- **QA**: todo lo de arriba es local; el front con el #11 no está desplegado.

## Lo que se propone, en orden

1. **Declarar en vez de desaparecer** (1) y **tratar el `null` como hueco**
   (6). Lo primero es una línea; lo segundo pide que el cuerpo de series sepa
   cortar la línea.
2. **Marcar el mes en curso** (2) con `open_period`, que el servicio ya
   declara: el último punto en otro trazo y un rótulo «mes en curso».
3. **Llevar los títulos de eje del spec** (3) hasta el cuerpo. No es inventar:
   es el rótulo que el agente escribió.
4. **Decir de cuándo es la cifra de la leyenda** (4).
5. **Las barras agrupadas** (1, segunda mitad): `PlotGrouped` existe para
   `categoricaComparada`; traducir `bar` + `color` a esa forma respeta la marca.
6. **Separar series en neutro** (5): es de diseño, se suma a la §14.
7. **La narración en inglés** (7): pedido a datos, con la captura.

## Lo que se hizo el mismo día · PR #12, encima del #11

Con una consigna del humano: **que valga para cualquier gráfico que llegue**, no
sólo para los siete. Por eso el traductor pasó a ser una tabla de traducciones
por PAPEL —medida, dimensión, serie— y no una lista de casos.

| # | Estado |
|---|---|
| 1 | **Resuelto.** Nada desaparece: lo que no se dibuja como gráfico se muestra como tabla, con la razón |
| 2 | **Resuelto como aviso.** «oct 26 es el mes en curso · su cifra está incompleta». Marcar el tramo en el trazo queda pendiente |
| 3 | **Resuelto.** «Ingresos (USD) · por mes · por plataforma», con las palabras del agente |
| 4 | **Resuelto.** La leyenda dice de cuándo: «ago 26 · Google 613,386.49». También en la consola |
| 5 | **Sigue abierto** · de diseño, §14 |
| 6 | **Resuelto a medias.** Una cifra que falta ya no se toma como fila rota: el gráfico va como tabla y nombra lo que falta. **El hueco dibujado** pide que `Punto.v` admita `null` en todo el repertorio de series |
| 7 | **Sigue abierto** · de datos |
