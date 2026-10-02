# Para el equipo de datos · el modelo de datos de productos de UA · 2026-10-02

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

**Una sola cosa: `GLD_PRODUCTO_ANALYTICS` no tiene con qué agrupar un producto.**

---

## El problema

La tabla expone dos dimensiones: `PRODUCT_ID`, que está al grano de **talla**, y
`TITULO_PRODUCTO`, que es una cadena con todo adentro.

```
Tenis para correr UA Charged Assert 10 para hombre Black US 10.5 - MX 8.5
 └ tipo          └ modelo              └ género   └ color └ talla
```

**El modelo sólo existe como texto dentro del título.** No hay columna por la
que agrupar.

Con ese grano, septiembre tiene **1.641 productos** y un top 10 puede ser el
mismo zapato en diez tallas.

## Lo que necesitamos

**Una columna de agrupación y su rótulo legible.**

Y antes, una decisión de ustedes: **a qué nivel es «un producto» para UA.**

| Nivel | Ejemplo | Qué pasa con un modelo que vende en hombre y en mujer |
|---|---|---|
| Modelo | `UA Charged Assert 10` | Suma: una fila |
| Modelo + género | `… para hombre` | Dos filas |
| Modelo + género + color | `… para hombre Black` | Varias filas |

**No son equivalentes y no lo podemos elegir nosotros.** Díganos cuál es, y el
nombre de la columna —`STYLE_ID`, `MODELO`, `COLORWAY_ID`, el que sea—.

**Si ya existe y no la vimos, con el nombre alcanza.**

## Por qué no lo resolvemos del lado nuestro

Se podría cortar el título con un patrón. **No lo vamos a hacer**: funcionaría
hasta el primer título con otra forma y después fallaría sin ruido — un top 10
con filas plausibles y mal agrupadas. Es la misma razón por la que el front no
calcula nada que el dato no declare.

## Mientras tanto

**`top_products_revenue` no se publica.** Un ranking por talla rotulado «top
productos» se ve bien y contesta otra cosa.

El backend ya tiene la consulta escrita y corrida; cambiar el `GROUP BY` es una
línea el día que exista la columna.
