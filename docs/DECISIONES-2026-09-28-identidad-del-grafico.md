# Dónde vive la identidad del gráfico · decisión · 2026-09-28

> **Contesta `docs/PROPUESTA-2026-09-28-identidad-del-grafico.md`.** Decisión
> humana del 2026-09-28.
>
> **Se escribe después de construirla, y eso es un defecto del orden, no de la
> decisión.** La propuesta se aprobó en conversación —«seguí con las variantes»,
> que la implica— y se implementó: `PanelConfigurado.grafico` está en el
> contrato, `BodyProps.grafico` en `render/`, y tres variantes lo consumen. Un
> campo del contrato sin decisión escrita es exactamente lo que este par de
> documentos existe para que no pase.

## Qué se decidió

**`grafico` va JUNTO A `tipo`, no en su lugar.**

- **`tipo` elige el CUERPO** · qué forma se lee, y qué shell, estados, BASE y
  procedencia se pintan.
- **`grafico` elige el dibujo de adentro** · cuál de los 49 del repertorio.

## Lo que lo decidió, y no fue una preferencia

La salida más limpia habría sido que **`grafico` reemplazara a `tipo`** y el
cuerpo se derivara: un solo campo, sin posibilidad de que discrepen.

**La descarta una medición: 16 de los 49 gráficos de §5 sirven a más de una
forma.**

| Gráfico | Sirve a |
|---|---|
| `donut` | `categorica` **y** `composicion` |
| `network` | `flujo` **y** `grafo` |
| `forecast` | `escalarConIntervalo` **y** `serieConBanda` |
| `tornado` | `escalarConIntervalo` **y** `categoricaComparada` |
| `columns` | `serieTemporal` **y** `categorica` |

…y once más. **Un `donut` no dice si el cuerpo tiene que leer una `categorica` o
una `composicion`**, que son objetos distintos. El gráfico solo no alcanza para
elegir cuerpo.

Y la tercera salida —que `TipoPanel` creciera a 49— rompe lo que `tipo` hace hoy:
`registry.ts` mapea `tipo → cuerpo`, y con 49 tipos sobre 12 cuerpos haría falta
una tabla intermedia, que es el campo que esa opción decía evitar.

## Las cuatro decisiones de adentro

**1 · Es OPCIONAL, y ausente significa el gráfico por defecto del cuerpo.** Los
doce paneles publicados no lo declaran y **no se migran**. El cambio es aditivo:
un campo obligatorio habría obligado a tocar cada layout antes de ver el primer
gráfico nuevo. Hay prueba de que sin `grafico` se dibuja lo de siempre.

**2 · Un `grafico` DESCONOCIDO se declara, no se sustituye.** El panel lo dice
con la gramática de §8 —`UnknownPlotState`— y no cae al de por defecto. **Es la
regla del valor a prueba de fallo contra el plausible**: una cascada dibujada
como dona se ve perfecta y miente sobre qué se está mirando. Mismo modo de falla
que `presentation` y que el spread condicional.

**Y la comprobación va antes del `switch`, no dentro de cada rama.** Resuelta
abajo, cada rama nueva tendría que acordarse de no caer al de por defecto, y la
que se olvide se ve bien.

**3 · Es un enum cerrado de nuestro lado, y lo cierra el ADAPTADOR.** En el cable
llegará como `string` libre, igual que `shape`, `family`, `layer` y `block_type`,
que ya se cierran ahí. Los 49 ids no se inventaron: los nombra §5.

**4 · La comprobación de qué sabe dibujar un cuerpo es POR FORMA, no por cuerpo.**
`ForecastBody` hospeda dos formas y `SeriesBody` también: pedir `control` sobre un
escalar no tiene serie que dibujar, aunque `control` sea legítimo en el
repertorio.

## Lo que esta decisión NO resuelve

**Dónde viven los parámetros propios de un gráfico.** Un histograma necesita
cortes; una dispersión, saber qué va en cada eje. Hoy `params` es
`Record<string, unknown>` y un param mal escrito **se ignora en silencio** —F1.29
lo iba a resolver validando en el adaptador—. Con 49 gráficos deja de ser un
pendiente y pasa a ser parte del diseño de esto.

**Si los rangos de span son del tipo o del gráfico.** §6 los declara por tipo, y
una cascada y una dona no necesitan el mismo ancho mínimo.

## Lo que ya está construido sobre esto

`PanelConfigurado.grafico` y `GraficoId` en el contrato; `BodyProps.grafico`;
`UnknownPlotState`; y tres variantes con sus pruebas y sus mutaciones:
`control` e `interval` en `ForecastBody`, `stackarea` en `SeriesBody`.

**Lo que todavía no se puede ver en la aplicación**: el cable no trae `grafico`
—y no se agregó, porque el cable transcribe lo que el servicio emite—, así que
hasta que el backend lo mande las variantes sólo viven en pruebas. Va en el
próximo pedido al backend, con el repertorio adjunto.
