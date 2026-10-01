# Para el equipo de backend · la última etapa de un flujo muestra el número de la anterior · 2026-10-01

> **Histórico.** Un mensaje mandado, con fecha: qué se pidió y con qué evidencia.
> No se actualiza.

Hola. **Un pedido chico y muy acotado**, y es lo único que traba el único flujo
que de verdad tiene sentido con el dato que hay.

---

## Lo que pasa

`transformFlow` calcula el valor de cada etapa desde su flujo **SALIENTE**, y cae
al entrante sólo cuando la etapa no tiene salida.

Para un flujo donde cada nodo reparte hacia varios, eso está bien. **Para un
embudo no**, y el embudo es el caso que importa acá:

```
VISITAS  ──────▶  SESIONES  ──────▶  ÓRDENES
```

- `VISITAS` toma su valor de su salida → muestra **sesiones**.
- `SESIONES` toma su valor de su salida → muestra **órdenes**.
- `ÓRDENES` no tiene salida → cae al entrante → muestra **órdenes**. Ésta sí.

**Las dos primeras etapas muestran el número de la siguiente.** Y no falla
ruidosamente: dibuja un embudo perfectamente prolijo con las cifras corridas un
lugar, que es la clase de error que nadie nota mirando.

**Está medido de nuestro lado** y escrito en la prueba de contrato que les
dejamos con las tres métricas nuevas —`TestSpendFlow_CadaEtapaValeLoSuyo`—: ahí
el caso funciona **porque cada plataforma tiene una sola salida con su propia
inversión**, no porque la regla sea la correcta para un embudo.

## Lo que pedimos

**Que el valor de una etapa sea su volumen, no el de lo que sale de ella.**

Cómo resolverlo es de ustedes. Dos formas que se nos ocurren, por si ayudan:

| | |
|---|---|
| **a** · Que el valor de la etapa salga del ENTRANTE cuando lo tiene, y del saliente sólo en la primera | Es el cambio más chico, y arregla el embudo sin tocar el caso que hoy funciona |
| **b** · Que las etapas puedan declarar su propio valor | Más explícito y no depende de la topología; cuesta un campo más |

**Nos sirve cualquiera de las dos.** Lo que no sirve es la de hoy: con ella no se
puede dibujar un embudo correcto, y el embudo es lo que §5 le asigna a la forma
`flow` junto con el sankey.

---

## Por qué lo pedimos ahora

**Porque sacamos un panel por esto.** Habíamos puesto `spend_flow` —cada
plataforma hacia un nodo «total»— y al mirarlo con dato real no comunica nada:
son 22 enlaces al mismo destino, y ese destino es la suma de los otros 22. **Es
un gráfico de barras dibujado como sankey**, y repite una tabla que ya está en el
mismo dashboard.

Lo detectó quien lo miró, no una prueba: «no entiendo bien qué sería inversión
hacia el total». Tenía razón.

**El flujo que sí se entiende solo es el embudo**, y es el que esta regla traba.
`GraphBody` y `PlotSankey` están construidos y probados; lo que falta es tener un
flujo de verdad que dibujar.

## Lo que NO estamos pidiendo

**No pedimos una métrica nueva.** El embudo sale de la tabla diaria que ustedes
ya consultan —visitas, sesiones y órdenes están las tres ahí— y la entrada del
registro la escribimos nosotros, como las otras tres. Lo único que necesitamos de
ustedes es la regla.

Gracias.
