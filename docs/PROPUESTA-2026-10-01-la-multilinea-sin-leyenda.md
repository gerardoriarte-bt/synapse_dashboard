# Propuesta a diseño · tres líneas sin leyenda, y magnitudes que no se comparan

**2026-10-01 · abierta.** Sale de la auditoría de comprensión de gráficos,
`docs/AUDITORIA-2026-10-01-comprension-de-graficos.md` §3.2.

---

## Lo que se ve

`Tendencia diaria` dibujado como **multilínea** muestra tres trazos y **ninguno
dice cuál es**. La línea de BASE nombra los tres —«venta, visitas e inversión de
cada día»— pero no cuál corresponde a cuál.

Y los tres comparten **un solo eje de valores**: ventas llega a 200K y la
inversión queda pegada al piso, ilegible, porque está en otra magnitud.

## Lo primero: el dibujo tampoco tiene leyenda

**Leído del archivo, no supuesto.** `Plot/LÍNEAS · Eficiencia de medios` tiene:

```
3 paths de grilla  ·  $c-grid
3 paths de datos   ·  $fam-medios-1 · $fam-cliente-1 · $fam-medios-2
6 textos           ·  ENE MAR MAY JUL SEP NOV
```

**Tres líneas, seis rótulos de mes, y ninguna leyenda.** Así que agregarla sería
apartarse del dibujo, y eso no se resuelve en silencio: va acá.

## Pero el problema de fondo es otro, y eso cambia la pregunta

**Las tres líneas del dibujo son comparables entre sí** —es eficiencia de medios,
todas en la misma unidad— y por eso comparten un eje sin que ninguna se aplaste.

**Las tres de `Tendencia diaria` no lo son**: venta en pesos, sesiones en conteo
e inversión en pesos pero dos órdenes más abajo. En un eje común, dos de las tres
son una raya en el cero.

**O sea que el gráfico está mal elegido para ese dato, no mal dibujado.** Y hay
dos salidas que ya existen, sin tocar nada:

| | Qué hace | Dónde está |
|---|---|---|
| **`smallmult`** | Un panel por serie, cada uno con su escala, su rótulo y su cifra | Construido · es el mejor gráfico del muestrario |
| **`normalizacion: base100`** | Lleva las tres a la misma base para comparar FORMAS | Param de `series`, ya implementado |

Con dato real, `Tendencia diaria` como `smallmult` se lee entero —`VENTAS 37.711`,
`SESIONES 67.484`, `INVERSIÓN 5.987`— y como multilínea no.

---

## Las dos preguntas

### 1 · ¿Lleva leyenda la multilínea?

**Si el dibujo la omitió a propósito**, se queda como está y la respuesta al caso
de arriba es cambiar el gráfico. **Si fue porque su ejemplo no la necesitaba**, es
un agregado al dibujo y lo construimos.

**Nuestra lectura, y es sólo eso**: parece lo segundo. Tres trazos de dos familias
distintas sin nada que los nombre no se pueden leer ni en el ejemplo del dibujo —
ahí tampoco se sabe cuál es cuál.

### 2 · ¿Debería el producto frenar la combinación?

Hoy nada avisa a quien compone que tres series de magnitudes distintas en un eje
común van a dar dos rayas en el cero. **Es la misma clase que la dona sobre una
categórica** —resuelta el mismo día— pero esta vez el repertorio no puede
decidirlo: `multiline` sirve a `seriesMultiples` legítimamente, y si las
magnitudes se parecen el gráfico es correcto.

**Lo que sí se podría**: que el cuerpo mire los órdenes de magnitud y, cuando se
separen demasiado, lo diga —o aplique `base100` y lo declare—. Eso es una regla
nueva de producto, no una lectura del dibujo, y por eso se pregunta.

---

## Lo que NO estamos proponiendo

**No tocar `PlotSeries` por cuenta propia.** El dibujo manda para el literal y lo
visual, y acá el dibujo dice una cosa clara: tres líneas, sin leyenda.

Y el eje de tiempo es otro asunto: el dibujo escribe `ENE MAR MAY JUL SEP NOV` y
nosotros pintamos `20362` porque el campo `t` llega sin declarar su unidad. Eso
ya está pedido al backend como B1.34 y no es una decisión de diseño.
