# Dos formas que el mapa promete y el contrato no lleva · 2026-09-28

> **Para diseño, producto y backend.** §5 de `design.md` mapea **seis gráficos** a
> formas cuyo objeto no puede transportar su dato. No se pueden dibujar aunque se
> construya el componente: no hay dónde poner las cifras.
>
> **Los seis son de MMM**, y dos de ellos son los que convierten el análisis en
> una decisión. Esto frena el dashboard de MMM más que cualquier cosa que le
> hayamos pedido a datos.

## Cómo apareció

No se buscó: salió de preparar el pedido a datos. Al cruzar «qué gráfico necesita
qué forma» contra los diecisiete esquemas `Valor*`, dos filas de §5 no cerraron.

**Y el segundo lo confirmó el dato real.** `MMM_RESULTS_CHANNELS` en Snowflake
—leída en sólo lectura el 2026-09-28— es exactamente la forma que falta, con sus
siete canales y sus intervalos bootstrap.

---

## Forma A · `dispersion` · pares `(x, y)`

### Qué la pide

| Gráfico | Dibujado en el `.pen` como |
|---|---|
| `scatter` | `Plot/DISPERSIÓN · CPA contra ROAS por campaña` · 24 puntos |
| `bubble` | `Plot/BURBUJAS · Categorías: venta, margen y unidades` · 6 puntos |
| `cuadrantes` | `Plot/CUADRANTES · Cartera de estilos` · 6 puntos |

### Por qué `distribucion` no sirve

```
ValorDistribucion { forma, cortes: [{ etiqueta, v }] }
```

**Eso es un histograma o una caja**: una variable, repartida en tramos. Los otros
dos gráficos de esa fila —`histogram` y `box`— sí la comen. Una dispersión es
**dos variables por observación**, y no hay forma de escribir la segunda.

### El objeto que se propone

```
ValorDispersion {
  forma: 'dispersion'
  puntos: [{ etiqueta?, x: number, y: number, r?: number }]
  ejeX: { rotulo: string, unidad?: string }
  ejeY: { rotulo: string, unidad?: string }
  cuadrantes?: { cortaEnX: number, cortaEnY: number,
                 rotulos: { supIzq, supDer, infIzq, infDer } }
}
```

### Las cuatro decisiones, con lo que las sostiene

**1 · Cada eje declara su rótulo y su unidad, y eso es nuevo.**

Ninguna forma anterior lo necesitaba: una métrica tiene **una** `unidad`. Acá hay
dos —el dibujo rotula `CPA` en USD contra ROAS en `x`— y **sin declararlas el
panel no puede rotular sus ejes**, que es «ningún número desnudo» aplicado a un
eje. `metric.unidad` no alcanza porque describe una sola de las dos.

**2 · `etiqueta` es OPCIONAL, y el dibujo es la razón.**

Los 24 puntos de `DISPERSIÓN` no llevan rótulo; los 6 de `BURBUJAS` y
`CUADRANTES` sí. Obligarla llenaría de texto un gráfico de cien campañas;
prohibirla dejaría sin nombre a los seis estilos de la cartera, que es lo que el
gráfico existe para señalar.

**3 · `r` es el ÁREA, no el radio · y el `.pen` lo dice literal.**

El frame declara **«ÁREA = UNIDADES VENDIDAS»**. Si `r` se tomara como radio, una
categoría con el doble de unidades se vería **cuatro veces** más grande. El
componente calcula `√r` para el radio: eso es presentación, y el dato viaja como
la magnitud que representa.

**4 · El corte de los cuadrantes LO DECLARA QUIEN PRODUCE EL DATO. No se
deriva.**

Es la decisión que más importa de toda la propuesta. El dibujo rotula las cuatro
zonas —**`INVERTIR`, `REVISAR PRECIO`, `ESCALAR`, `DEFENDER`**—, o sea que la
posición de un producto **es una recomendación de negocio**.

**Si el corte fuera la mediana de lo que llegó, las fronteras se moverían con el
dato**: el mismo producto, con el mismo desempeño, pasaría de `ESCALAR` a
`DEFENDER` porque otro producto mejoró. Una recomendación que cambia sin que
cambie aquello sobre lo que recomienda no es auditable — es la misma razón por la
que la zona horaria del negocio es del tenant y no del navegador.

**Y los cuatro rótulos vienen con el dato, no cableados en el componente.** Son
copy de producto, y el dueño del copy es quien emite el dato.

### Lo que esta forma NO lleva, a propósito

**La línea de ajuste.** El frame de `DISPERSIÓN` la dibuja y la rotula —«LÍNEA
PUNTEADA = AJUSTE LINEAL»— y **no se declara acá**.

Una regresión no es presentación: es un modelo. El front no la calcula —«el
adaptador renombra y reformatea; no calcula»— y además caería en lo que la regla
dura 6 prohíbe para los pronósticos: **una línea de ajuste sin su incertidumbre
declarada es una estimación puntual sin intervalo.**

**Queda como pregunta abierta**: o el backend la manda con su banda, o el gráfico
se dibuja sin ella. No se resuelve acá.

---

## Forma B · `categoricaConIntervalo` · N estimaciones, cada una con su rango

### Qué la pide, y ya existe el dato

**`MMM_RESULTS_CHANNELS`**, leída el 2026-09-28: siete canales, cada uno con
`CONTRIBUTION_USD`, `ROAS_ADJUSTED` y **`BOOTSTRAP_P025 / P50 / P975`**.

Es el corazón del dashboard de MMM: cuánto aportó cada canal **y con cuánta
certeza**.

**Y el `.pen` ya la dibuja.** `Plot/INTERVALO · Estimaciones con rango` tiene
**cuatro filas**, cada una con su etiqueta, su cifra y su rango —«384» y
«351–417»—, sobre un riel con el rango relleno.

**Eso se leyó mal el 2026-09-28 por la mañana**: se supuso que la biblioteca
repetía el componente cuatro veces. Con `MMM_RESULTS_CHANNELS` enfrente se lee
distinto — **el dibujo ya era esta forma, y diseño la tenía clara antes que
nosotros.**

### Por qué ninguna de las que hay alcanza

| Forma | Por qué no |
|---|---|
| `escalarConIntervalo` | Es **una** cifra con rango, no N |
| `categoricaComparada` | Tiene N ítems, pero sus campos son `referencia` y `delta` — **una comparación contra un objetivo, no una incertidumbre** |
| `perfilMultiatributo` | N atributos sin rango |

**Extender `categoricaComparada` con `lo`/`hi` sería juntar dos significados en
un objeto**: «cuánto me falta para la meta» y «cuánto confío en esta cifra» son
preguntas distintas, y un cuerpo que reciba las dos tiene que adivinar cuál
pintar.

### El objeto que se propone

```
ValorCategoricaConIntervalo {
  forma: 'categoricaConIntervalo'
  items: [{ etiqueta, v, lo, hi }]
  nivel: number
}
```

### Las dos decisiones

**1 · `lo` y `hi` son obligatorios en cada ítem, y `nivel` en la raíz.**

Es la misma regla dura 6 que ya gobierna `serieConBanda` y `escalarConIntervalo`:
un ítem sin banda volvería a ser una `categorica` y el panel estaría prometiendo
una certeza que no declara. **El nivel es uno solo para todos los ítems**: son la
salida del mismo modelo con el mismo bootstrap, y uno por ítem invitaría a
mezclar niveles en un gráfico donde las barras se comparan entre sí.

**2 · Un intervalo que CONTIENE al cero no es un detalle de dibujo.**

Cuatro de los siete canales del MMM tienen `BOOTSTRAP_P025 = 0`, y `FB_Brand` da
contribución **0** con intervalo `[0, 0.34]`. El modelo **no descarta que su
efecto sea nulo**, y `MMM_ALERTAS` lo dice con nombre cinco semanas seguidas.

**El cuerpo tiene que poder distinguirlo**, porque pintar «Criteo: USD 264K»
igual que un canal cuyo intervalo no toca el cero es afirmar una certeza que no
existe. **Cómo se marca es de diseño** —no está dibujado— y va con esta
propuesta.

---

## Lo que esto cuesta, sin maquillar

Una forma nueva no es un `type` más. Toca, en orden:

| | Qué |
|---|---|
| 1 | `Forma` gana dos valores · `Valor` gana dos ramas en su `oneOf` y su discriminador |
| 2 | **`isEmpty` deja de compilar**, que es para lo que su `switch` está escrito exhaustivo. Hay que decidir qué significa vacío en cada una |
| 3 | **§6 pide un TIPO que hospede cada forma.** `distribution` puede tomar `dispersion`; `comparison` puede tomar `categoricaConIntervalo` — las dos ya declaran formas hermanas |
| 4 | `/config/blocks` declara las formas por tipo · dos filas cambian |
| 5 | **§5 de `design.md` cambia**, y ese archivo no lo tocamos: es parte de lo que se pide acá |
| 6 | Los mínimos de B1.21 ganan dos filas · `dispersion` y `categoricaConIntervalo` |
| 7 | **El backend las emite** · `transform_v11.go` gana dos casos |
| 8 | Los cuerpos y los seis gráficos · trabajo nuestro, y es el único que no espera a nadie |

**Del 1 al 6 es nuestro y de diseño. El 7 es del backend. El 8 no empieza hasta
que el 1 esté.**

## Lo que decide cada quién

**Diseño**

1. **Cómo se marca un intervalo que contiene al cero.** No está dibujado y es lo
   que hace publicable el dashboard de MMM.
2. **Si la línea de ajuste se dibuja** sin banda, o no se dibuja.
3. **§5**: aceptar que `scatter`, `bubble` y `cuadrantes` cuelgan de `dispersion`
   y no de `distribucion`, y agregar la fila de `categoricaConIntervalo`.

**Producto y datos**

4. **De dónde sale el corte de los cuadrantes**, que es una decisión de negocio y
   no un percentil.
5. **Los cuatro rótulos**, que son copy.

**Backend**

6. Emitir las dos formas cuando el catálogo declare una métrica que las use.

## Lo que NO se pide todavía

**No se le pidió a datos ninguna métrica de estas dos formas**, y es a propósito:
pedir una forma que nuestro propio contrato no sabe recibir es cómo se llena un
catálogo de filas que nadie puede dibujar. Está dicho en §3 de
`docs/snowflake/PEDIDO-2026-09-28-metricas-mmm-y-forecast.md`.

**El orden es: esto primero, el pedido después.**
