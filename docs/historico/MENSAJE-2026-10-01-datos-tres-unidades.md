# Para el equipo de datos · tres métricas sin `UNIT`, y una de ellas está bien · 2026-10-01

> **VENCIDO Y EQUIVOCADO · NUNCA SE ENVIÓ.** Pedía que
> `media_efficiency_12m` y `platform_return` declararan `UNIT = 'x'`, y están
> bien sin unidad.
>
> Lo corrigió la planilla de datos —`docs/snowflake/Metricas.xlsx`, leída el
> mismo día—: en sus 16 filas la regla forma→unidad es consistente y sin
> solapamiento. **`multi_series`, `tabular` y `flow` no llevan unidad** porque
> cargan varias series, columnas o etapas, cada una con la suya; `scalar`,
> `categorical`, `composition`, `matrix`, `ranking` y `time_series` sí.
>
> `media_efficiency_12m` es `multi_series` y `platform_return` es `tabular`:
> las dos correctas. No había ningún olvido que pedir.


> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Un pedido chico y una observación que les puede servir.**

Producto decidió hoy que **la unidad de una cifra la define el catálogo, por
métrica** — lo que venga en `UNIT`, así se muestra. No se deduce del país del
cliente ni se elige en el front.

**Eso ya funciona**, y queríamos decirlo: la cadena `UNIT` → `sync-catalog` →
`/config/catalog` → pantalla está medida de punta a punta, y el front antepone
`USD`, pega `%` y `x`, y manda los sustantivos al rótulo. **No hace falta que
hagan nada para que ande.**

---

## Lo que medimos

`GET /config/catalog` contra el servicio, hoy. De las métricas que ustedes
curaron:

| `catalog_version` | Métricas | Con `UNIT` |
|---|---|---|
| **4** · la curación más reciente | 9 | **9 · el 100 %** |
| **3** | 4 | 1 —`spend`— |

**La v4 está completa.** Las tres que quedan sin unidad son de la v3:

| Métrica | Qué creemos |
|---|---|
| `media_efficiency_12m` | Es ROAS · le correspondería **`x`**, igual que `roas`, que sí lo declara |
| `platform_return` | ROAS reportado por la plataforma · igual, **`x`** |
| `daily_trend` | **Creemos que está BIEN sin unidad** · ver abajo |

## El pedido

**Que `media_efficiency_12m` y `platform_return` declaren `UNIT = 'x'`.** Si
estamos equivocados y la unidad es otra, mejor saberlo: la pantalla la escribe
tal cual venga.

## Y la observación, que es la que puede servirles

**`daily_trend` no tiene unidad porque mezcla tres magnitudes** —venta, visitas e
inversión en una sola métrica—, y eso es correcto: no hay UNA unidad que
declarar.

Lo interesante es que **el catálogo nos lo estaba avisando antes de que lo
viéramos en pantalla.** Una auditoría nuestra de hace unos días encontró que ese
panel, dibujado como multilínea, es ilegible: las tres series comparten un eje y
dos quedan pegadas al cero porque están en órdenes de magnitud distintos. Lo
encontró alguien mirando el gráfico.

**`UNIT` vacío sobre una métrica que no es prosa es esa misma señal, legible sin
abrir la pantalla.** No les pedimos nada con esto —`daily_trend` está bien como
está— pero si alguna vez arman una regla de validación más, «métrica numérica sin
`UNIT`» separa dos casos que valen la pena distinguir: la que olvidó declararla y
la que mezcla magnitudes y debería partirse en tres.

Gracias.
