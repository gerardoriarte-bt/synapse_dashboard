# Para el equipo de datos · corrimos tres métricas nuevas y esto apareció · 2026-09-30

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. Sigue a `MENSAJE-2026-09-29-datos-formas-sin-metrica.md`.

**Escribimos el SQL de tres formas que faltaban y lo corrimos contra Snowflake.**
Las tres materializan bien —`available 19, errors 0`— y **al mirar lo que
devolvieron aparecieron tres cosas del dato que conviene que vean.**

Son exactamente la clase de cosa que el inventario nos habría dicho antes de
escribir una línea, así que van también como argumento de por qué lo pedimos.

---

## Lo que corrimos

Tres entradas nuevas en el registro del backend, todas sobre `GLD_PAID_MEDIA` y
**sin pedir ninguna columna que no estuviera ya**:

| Métrica | Forma | Qué hace |
|---|---|---|
| `platform_gap` | `compared_categorical` | Retorno contra inversión por plataforma, los dos en USD |
| `platform_month_matrix` | `matrix` | Inversión por plataforma × mes, doce meses |
| `spend_flow` | `flow` | El aporte de cada plataforma al total invertido |

Las filas del catálogo las sembramos a mano en **nuestra base local descartable**
sólo para probar. **Las definitivas siguen siendo suyas**, con su copy.

---

## 1 · Dieciséis plataformas tienen retorno y NO tienen costo

`platform_gap` devuelve `v` (ingresos) y `reference` (costo) por plataforma. En
dieciséis de ellas **`COST_USD` no suma nada**, así que el panel no puede mostrar
la brecha:

```
YouTube · Bing Ads · Activision · Trebel · Perion · Logan · Pulip
Propeller Ads · Spotify · Tidok · SeedTag · Pinterest · Site · Amazon
TV Azteca · Grid Media
```

**No sabemos si es un hueco o es correcto** — puede ser inversión que se registra
en otro lado, o atribución de ingresos sin costo asociado. Lo levantamos porque
un gráfico de «retorno contra inversión» con dieciséis barras sin su par se lee
como un error de la pantalla.

## 2 · `FUENTE` tiene la misma plataforma escrita de dos formas

En las 38 filas de la matriz aparecen **`Daily Motion` y `Dailymotion`** como dos
plataformas distintas. Y en el flujo, `Dailymotion` sola es **1.883.185 USD**,
que es la mayor de todas.

Cualquier agrupación por plataforma las cuenta separadas.

## 3 · Treinta y ocho plataformas no entran en un mapa de calor

La matriz salió **38 × 12 = 456 celdas**. Es correcta y es ilegible.

Nuestro repertorio declara un **mínimo** por gráfico —`filas < 2 o columnas < 2`—
pero **ningún máximo para `matriz`**, así que nada la deshabilita. Vamos a
proponer uno de nuestro lado, y mientras tanto la métrica probablemente tenga que
recortar: las diez primeras por inversión, o agrupar la cola en «Otras».

**Es una decisión de producto y no de datos**, así que va como aviso: si el corte
correcto es otro —por ejemplo, sólo las plataformas con inversión sobre un
umbral— díganlo y lo escribimos así.

---

## Lo que esto le agrega al pedido del inventario

Las tres aparecieron **corriendo la consulta**, no leyendo un esquema. Pero **las
tres estaban en los datos desde antes**, y dos de ellas —la cardinalidad de
`FUENTE` y los duplicados por escritura— son exactamente lo que pedimos en
`docs/snowflake/COMO-ENTREGAR-UNA-METRICA.md`:

> «Cardinalidad de cada dimensión · `FUENTE: 6 valores` · **decide el gráfico**.
> Seis plataformas entran en una dona; sesenta no.»

Escribimos ese pedido estimando seis plataformas, porque es lo que se ve en el
panel de `platform_return`. **Son treinta y ocho.** El panel muestra seis porque
tiene un tope, no porque haya seis.

**No lo decimos como reproche** — lo decimos porque es la mejor evidencia que
tenemos de por qué el inventario va primero: **una suposición sobre la
cardinalidad ya nos hizo escribir mal un pedido.**

Gracias.
