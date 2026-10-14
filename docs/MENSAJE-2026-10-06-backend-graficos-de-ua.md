# Para el equipo de backend · lo que hace ilegibles tres gráficos de UA · 2026-10-06

> **Histórico.** Un mensaje con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Medido contra `7b717aa` el 2026-10-06**: el SQL y los pivotes leídos en
`internal/core/dashboard/snowflake/queries.go` y
`internal/core/dashboard/materialize/fixtures.go`, y los diez paneles de UA
pedidos al servicio de QA con un usuario admin, para octubre, septiembre, agosto
y julio.

Hola. Mirando QA, el humano dijo de tres gráficos que «no se entiende qué está
mostrando». **La mitad era nuestra y ya está arreglada**: los gráficos de líneas
no tenían leyenda, ni fechas en el eje, ni forma de leer un monto, y las barras
no mostraban su `%`. Lo que queda es del dato, y por orden de gravedad es esto.

## 1 · Agosto muestra cifras de la semilla como si fueran del negocio

Pedido el período `2026-08`, cuatro paneles de UA llegan **`DEGRADED` con
números**, con frescura `2026-09-10T16:35:12Z`:

| Panel | Lo que trae |
|---|---|
| `daily_trend` | 8 puntos con `t` = `jan`, `feb`… |
| `roas`, `orders`, `units` | Una cifra cada uno |

`jan`…`aug` es `fixtureMonths` de `materialize/fixtures.go`. **Son las filas de
la semilla**, que nunca se rematerializaron para ese período. Los otros seis
paneles de agosto llegan `BLOCKED` («No hay datos calculados para este
período»), que es lo correcto.

**Es lo más grave de la lista**: un `DEGRADED` le dice al usuario que la cifra
es real pero vieja, y ésta no es real. Pedimos que las filas sembradas de un
tenant con Snowflake **se borren o pasen a `BLOCKED`**, en todos los períodos y
no sólo en agosto.

## 2 · «ROAS ×100» falsea la cifra para que entre en el eje

`pivotMonthlyEfficiency` multiplica el ROAS por 100 y lo emite como tercera
serie de `media_efficiency_12m`:

```go
{"ROAS ×100", []string{"ROAS", "roas"}},
…
if sc.label == "ROAS ×100" { v = v * 100 }
```

En pantalla, un ROAS de 11.1 se lee **1,111**. El rótulo lo avisa, pero el
número que se ve al pasar el cursor no es el ROAS. Y aun multiplicado queda
pegado al cero, porque comparte eje con ventas de 2,7 millones.

**Pedimos emitir el ROAS como ratio**, sin multiplicar. Cómo se dibujan dos
magnitudes distintas es nuestro problema: el repertorio tiene `combo` (columnas
y línea en dos ejes) y `smallmult` (una serie por división).

## 3 · Las series de `multi_series` no dicen su unidad

`daily_trend` mezcla Ventas (USD), Sesiones (conteo) e Inversión (USD), y
`media_efficiency_12m` mezcla USD con un ratio. La unidad del catálogo es una por
métrica —`daily_trend` la tiene vacía, y es correcto, porque no hay una sola—,
así que al leer un punto mostramos «12,470» sin decir si son dólares o sesiones.

**Pedimos un `unit` opcional por serie** en `multi_series`, igual que
`platform_return` ya lo declara por columna (`Unit: "USD"`, `Unit: "x"`). Si no
viene, seguimos sin unidad: no la inventamos.

## 4 · Rematerializar septiembre y octubre de `daily_trend` y `media_efficiency_12m`

Desde `c8b9247` las fechas salen en ISO, pero las filas de UA en QA siguen con
días desde epoch: `"20727"`, `"20697"`. **Del lado nuestro ya lo resolvimos**:
el front convierte esos números a ISO citando su `formatDateLabel`, así que no
se ve roto. Lo pedimos igual, porque dos formatos conviviendo es una trampa para
el próximo que lea el cable.

## 5 · Dos menores

- **El último mes de `media_efficiency_12m` es el mes en curso, incompleto.**
  Con 6 días de octubre las ventas caen de 1,3 M a 105 K y el gráfico muestra un
  desplome. La BASE dice «hasta el mes seleccionado», así que no es un error,
  pero ¿pueden marcar el punto como parcial? Un `partial: true` por punto
  alcanza; el dibujo lo hacemos nosotros.
- **`platform_return` titula sus columnas en inglés** —`Platform`,
  `Investment`, `Sales`— dentro de un panel que habla español.
