/** Combinado · forma `seriesMultiples` · §PEN:Plot/COMBINADO · Inversión y ROAS
 *
 *  **Existe porque las dos series NO comparten unidad, y eso es lo único que lo
 *  justifica.** Una inversión en millones y un ROAS de 4 sobre la misma escala
 *  dejan a la segunda pegada al piso: se ve un gráfico de columnas impecable con
 *  una línea que parece constante. Por eso el combinado tiene **dos escalas**, y
 *  por eso `normalizacion: 'base100'` no le aplica —llevar las dos a base 100
 *  borra exactamente la diferencia que lo hace existir, y la cifra anotada diría
 *  `100` en cualquier métrica.
 *
 *  ── LO QUE SE MIDIÓ EN EL DIBUJO ────────────────────────────────────────────
 *
 *  Frame 580 × 208, `layout: none`. Las tres rejillas corren `M40 … l512 0`: el
 *  área útil va de x 40 a 552 y la base está en y 176 con el techo en 16 → 160
 *  de alto. La reserva izquierda de 40 la produce sola `axisReserve` sobre
 *  `0.0M` · `0.6M` · `1.2M`; el margen derecho **no es `MARGIN.r`**, es el ancho
 *  que se le reserva a la anotación (ver abajo).
 *
 *  **Las columnas.** Doce, `x` de 48.5 a 517.9, ancho 25.6, paso 42.67: la
 *  columna ocupa 0.6 del paso, o sea `padding = 0.4` y no el 0.2 que `bandScale`
 *  trae por defecto. Es el doble de aire que en `PlotBars` y **no es
 *  decorativo**: es el hueco por donde se lee la línea. `cornerRadius: 2` —el
 *  `BAR_RADIUS` que `Bars` ya pone— y `opacity: 0.7` en las doce, que es lo que
 *  deja ver la rejilla y la línea por encima de la columna.
 *
 *  **Dos escalas, las dos desde cero, y sólo una rotulada.** La razón no tiene
 *  eje, y eso se comprobó midiendo: los doce puntos caen entre y 42.6 y 114.6
 *  sobre base 176 y techo 16; con dominio `[0, 8]` el punto anotado —`4.1x`—
 *  cae en y 94, y (176 − 94) / 160 × 8 = **4.1 clavado**. Y 8 es justo lo que
 *  devuelve `ceiling([6.67])`. O sea `[0, ceiling(valores)]` para cada serie,
 *  las dos sobre el mismo alto, y el eje de valores rotula la de las columnas.
 *
 *  **La línea se apoya en los CENTROS DE BANDA**, no en un índice de borde a
 *  borde: el primer punto está en x 61.3 y el centro de la primera columna es
 *  48.5 + 12.8 = 61.3. Es la diferencia con `PlotSeries`, que estira
 *  `linearScale([0, n−1], [0, width])` y dejaría el primer punto en x 0, con su
 *  columna colgando medio ancho de banda a la derecha.
 *
 *  **La anotación es el ÚLTIMO punto, no el máximo.** Lo fija la tarjeta que
 *  instancia el frame (`Librería de gráficos`, ref `X0nA8`): sus dos valores de
 *  leyenda son `USD 1.04M` y `4.1x`, y 1.04M es la altura de la duodécima
 *  columna —138.7 / 160 × 1.2M—, no la de la más alta. Sin eje derecho el único
 *  valor legible de la razón es el último, y el dibujo lo eligió así.
 *
 *  ── CUATRO DESVIACIONES DECLARADAS ──────────────────────────────────────────
 *
 *  1. **El 0.7 va en un `<g>` y no en cada `<rect>`.** `Bars` escribe
 *     `fill={hue(color)}` y no sabe de opacidad; `fill-opacity` es heredada, así
 *     que el grupo la propaga. Lo correcto es una prop `fillOpacity` en `Bars`
 *     con default 1 —así `PlotBars` no cambia un píxel— y **tocar
 *     `core/Series.tsx` no entra en esta tarea**: es la misma desviación que
 *     `PlotColumns` ya declaró con su opacidad apagada.
 *  2. **El ralo se logra angostando el DOMINIO, no el eje.** `CategoryAxis`
 *     itera `scale.domain` entero y acá imprimiría los doce meses donde el
 *     dibujo pone cinco. Se le pasa la misma escala con el dominio recortado, así
 *     que las posiciones siguen saliendo de la escala completa. La prop `keys`
 *     sigue faltando en la primitiva, igual que para `PlotColumns`.
 *  3. **La línea va a 1.5 y el dibujo a 2.6.** `Line` fija el 1.5 y cambiarlo
 *     movería los cuatro plots que ya la usan: es la misma divergencia que
 *     `PlotStackArea` declaró con su 1.8.
 *  4. **El dibujo pone tres rejillas y `Grid` emite `ticks()`**, que sobre el
 *     `ceiling` de este dato da cuatro. No es una elección: es la función, y es
 *     la misma en todo el repertorio.
 *
 *  ── Y DOS COSAS QUE EL DIBUJO PIDE Y EL DATO NO DA ──────────────────────────
 *
 *  **El dibujo usa dos FAMILIAS** —`$fam-medios-2` en las columnas y
 *  `$fam-demanda-1` en la línea— y acá se usan dos escalones de UNA: la familia
 *  se lee del catálogo y elegir la segunda sería elegir color · regla dura 1.
 *  Ahí el `2` de `$fam-medios-2` es el escalón, que sí se copia.
 *
 *  **Y la unidad por serie no existe en el contrato.** La tarjeta muestra
 *  `USD 1.04M` y `4.1x`; nosotros recibimos un solo `format` y un `unit` que es
 *  de la MÉTRICA, no de la serie. Así que la anotación sale `format(v)` a secas:
 *  el `x` **no se inventa**, ni acá ni en el adaptador. Se ve `4.1` donde el
 *  dibujo dice `4.1x`, y eso es un pedido a quien emite el dato.
 *
 *  **Lo que sí se agrega sobre el dibujo es el NOMBRE de la serie de línea**,
 *  porque el `Legend Item` del `.pen` no existe en `src/` y sin él la cifra
 *  queda desnuda — y eso es regla dura, no preferencia. Va en mono 10 `dim` con
 *  su tracking, que es el contrato de `AxisText`.
 *
 *  ── EL EJE DOBLE · decisión humana del 2026-11-24 ───────────────────────────
 *
 *  §PEN:Plot/COMBINADO · Dos ejes: visitas y conversión
 *
 *  `docs/DECISIONES-2026-11-24-semaforos-y-eje-doble.md` §2. **Con exactamente
 *  dos series de unidades distintas, declaradas en el cable**, la razón deja de
 *  no tener eje: cada serie tiene el suyo, y la unidad va ESCRITA en cada uno.
 *  Lo decide el cuerpo —`SeriesBody` pasa `ejes` sólo en ese caso— y con una
 *  sola unidad, o sin declarar, o con tres series, el dibujo es el de arriba.
 *
 *  **Cada serie se asocia a su eje dos veces**, porque un eje doble que se lee
 *  al revés es el defecto clásico del gráfico:
 *
 *   · **por posición** · las columnas van contra el eje izquierdo y la línea
 *     contra el derecho, siempre, que es el orden del payload;
 *   · **por rótulo** · arriba de cada eje, su serie y su unidad —«VISITAS ·
 *     SESIONES» a la izquierda, «CVR · %» a la derecha— con la MARCA de su
 *     dibujo al lado: un cuadro del color de las columnas, un punto del color
 *     de la línea.
 *
 *  **La anotación del último punto se va**: existía porque la razón no tenía
 *  eje —«sin eje derecho el único valor legible de la razón es el último»—, y
 *  con el eje derecho ese valor se lee contra su escala. Dejarla le quitaba al
 *  área el ancho que ahora necesita el segundo eje.
 */
import { useSize } from './core/useSize'
import { bandScale, ceiling, linearScale } from './core/scale'
import { AxisText, CategoryAxis, ValueAxis } from './core/Axis'
import { MARGIN, axisReserve, charsThatFit, textWidth } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Bars, Dots, Line } from './core/Series'
import { hue } from './core/seriesColor'
import type { BandScale } from './core/scale'
import type { DrawableSeries } from './PlotSeries'
import type { FamiliaDeDibujo } from '../types'

/** La fracción del paso que queda como aire · medida en el `.pen`: paso 42.67 y
 *  columna 25.6, o sea 0.6 de banda. El defecto de `bandScale` es 0.2 y no deja
 *  hueco por donde leer la línea. */
const PADDING = 0.4

/** El escalón de la familia que llevan las columnas · el `2` de `$fam-medios-2`.
 *  La línea se queda con el 1, que es el defecto de `hue`. */
const COLUMN_STEP = 2

/** Cada cuántas bandas se rotula · el dibujo pone ENE, ABR, JUL, OCT y DIC sobre
 *  doce, que son las bandas 1, 4, 7, 10 **y la última**. */
const EVERY = 3

/** Lo que la anotación se separa del último punto, y lo que la etiqueta se eleva
 *  sobre la cifra. El dibujo arranca la caja en x 516.8 con el punto en 530.7 —
 *  la caja se solapa porque allá tiene ancho fijo; acá se ancla al `start`. */
const GAP = 8

/** El tamaño de la cifra anotada · `--text-cifra`. Va como número porque es
 *  geometría de SVG y el token no sirve para medir. */
const CIFRA = 11

/** El alto de la fila de rótulos de eje, cuando hay dos. **24 y no 16**: con
 *  16 el rótulo y la cifra más alta de cada eje quedaban a dos píxeles y se
 *  leían como una sola línea · visto en el dibujo del `.pen` el 2026-11-24. */
const TITULO = 24

/** El lado de la marca que acompaña a cada rótulo de eje. */
const MARCA = 8

/** La MISMA escala con el dominio recortado · el mismo recurso que `PlotColumns`.
 *
 *  Las posiciones siguen saliendo de la escala completa —`x(k)` no cambia— así
 *  que esto no mueve nada: sólo le dice al eje cuáles rotular. */
function narrowed(scale: BandScale, domain: readonly string[]): BandScale {
  return Object.assign((k: string) => scale(k), {
    domain,
    bandwidth: scale.bandwidth,
    step: scale.step,
  }) as BandScale
}

export function PlotCombo({
  columns,
  line,
  family,
  format,
  ejes,
}: {
  /** La serie que va en columnas, sobre el eje rotulado. **El reparto de roles
   *  lo hace el cuerpo**: acá llegan las dos partes ya separadas y no un
   *  arreglo, para que «combinado con una sola serie» no sea construible. */
  columns: DrawableSeries
  /** La razón, sobre su propia escala y sin eje. */
  line: DrawableSeries
  family: FamiliaDeDibujo
  format: (v: number) => string
  /** **El eje doble** · las unidades de cada serie, cuando son dos y distintas.
   *  Ausente, el combinado de siempre: un eje rotulado y la razón anotada. */
  ejes?: { columnas: string; linea: string }
}) {
  const { ref, w, h } = useSize()

  if (ejes !== undefined) {
    return (
      <div ref={ref} className="w-full h-full min-h-0">
        {w > 0 && h > 0 && <DosEjes columns={columns} line={line} family={family} format={format} ejes={ejes} w={w} h={h} />}
      </div>
    )
  }

  const items = columns.puntos.map((p) => ({ k: p.t, v: p.v }))
  const last = line.puntos[line.puntos.length - 1]

  // Las dos cifras que se escriben a la derecha del último punto. Se calculan
  // antes de la geometría porque **el margen derecho sale de su ancho**: con
  // `MARGIN.r` la cifra se corta contra el borde del SVG.
  const cifra = last === undefined ? '' : format(last.v)
  const nombre = line.etiqueta.toUpperCase()
  const right =
    last === undefined ? MARGIN.r : Math.max(textWidth(cifra.length, CIFRA), textWidth(nombre.length)) + GAP

  const height = Math.max(0, h - MARGIN.t - MARGIN.b)

  // Dos escalas sobre el MISMO alto, cada una con el techo de SU serie.
  const yColumnas = linearScale([0, ceiling(items.map((i) => i.v))], [height, 0])
  const yLinea = linearScale([0, ceiling(line.puntos.map((p) => p.v))], [height, 0])

  const reserve = axisReserve(yColumnas.ticks(4).map(format))
  const width = Math.max(0, w - reserve - right)

  const banda = bandScale(
    items.map((i) => i.k),
    [0, width],
    PADDING,
  )
  // Los centros de banda son lineales en el índice —`step/2 + i·step`— así que
  // la línea se apoya en ellos con una escala lineal recortada medio paso por
  // lado, y no con el `[0, n−1] → [0, width]` de borde a borde de `PlotSeries`.
  const x = linearScale([0, Math.max(1, items.length - 1)], [banda.step / 2, width - banda.step / 2])

  const rotulados = items.filter((_, i) => i % EVERY === 0 || i === items.length - 1).map((i) => i.k)

  // La anotación se mantiene dentro del área: con el último punto contra el
  // techo, la etiqueta de arriba se saldría del SVG.
  const anclaY = last === undefined ? 0 : Math.min(Math.max(yLinea(last.v), GAP + 3), height)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`Combinado · ${columns.etiqueta} en columnas y ${line.etiqueta} en línea`}
        >
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={yColumnas} orientation="horizontal" length={width} />
            {/* El 0.7 del dibujo, heredado por las doce · ver la desviación 1. */}
            <g fillOpacity={0.7}>
              <Bars
                items={items}
                band={banda}
                value={yColumnas}
                orientation="vertical"
                base={yColumnas(0)}
                family={family}
                step={COLUMN_STEP}
              />
            </g>
            <Line
              points={line.puntos.map((p, i) => ({ x: i, y: p.v }))}
              x={x}
              y={yLinea}
              family={family}
            />
            <Dots
              points={line.puntos.map((p, i) => ({ x: i, y: p.v, k: p.t }))}
              x={x}
              y={yLinea}
              family={family}
            />
            {last !== undefined && (
              <>
                {/* Ningún número desnudo: el nombre de la serie va con su cifra,
                    porque el `Legend Item` que el dibujo usa no existe todavía. */}
                <AxisText x={x(line.puntos.length - 1) + GAP} y={anclaY - GAP - 3} anchor="start">
                  {nombre}
                </AxisText>
                <text
                  x={x(line.puntos.length - 1) + GAP}
                  y={anclaY}
                  textAnchor="start"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-cifra)',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {cifra}
                </text>
              </>
            )}
            {/* El ralo le deja a cada rótulo tres pasos de aire, no uno: dos de
                cada tres bandas quedan sin rotular. */}
            <CategoryAxis
              scale={narrowed(banda, rotulados)}
              side="bottom"
              at={height + 12}
              width={banda.step * EVERY}
            />
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <ValueAxis scale={yColumnas} side="left" at={reserve - 6} format={format} />
          </g>
        </svg>
      )}
    </div>
  )
}

/** El combinado con un eje por serie · ver «EL EJE DOBLE» en la cabecera.
 *
 *  Comparte con el de arriba todo lo que no es el eje —el aire de las columnas,
 *  el escalón, la línea sobre los centros de banda, el ralo del eje de
 *  categorías— y por eso usa las mismas constantes. Lo que cambia es la
 *  reserva: hay una a cada lado, y arriba una fila para los dos rótulos. */
function DosEjes({
  columns,
  line,
  family,
  format,
  ejes,
  w,
  h,
}: {
  columns: DrawableSeries
  line: DrawableSeries
  family: FamiliaDeDibujo
  format: (v: number) => string
  ejes: { columnas: string; linea: string }
  w: number
  h: number
}) {
  const items = columns.puntos.map((p) => ({ k: p.t, v: p.v }))
  const top = MARGIN.t + TITULO
  const height = Math.max(0, h - top - MARGIN.b)

  const yColumnas = linearScale([0, ceiling(items.map((i) => i.v))], [height, 0])
  const yLinea = linearScale([0, ceiling(line.puntos.map((p) => p.v))], [height, 0])

  const izquierda = axisReserve(yColumnas.ticks(4).map(format))
  const derecha = axisReserve(yLinea.ticks(4).map(format))
  const width = Math.max(0, w - izquierda - derecha)

  const banda = bandScale(
    items.map((i) => i.k),
    [0, width],
    PADDING,
  )
  const x = linearScale([0, Math.max(1, items.length - 1)], [banda.step / 2, width - banda.step / 2])
  const rotulados = items.filter((_, i) => i % EVERY === 0 || i === items.length - 1).map((i) => i.k)

  // Cada rótulo tiene la mitad del ancho menos su marca: a la izquierda y a la
  // derecha a la vez, en un panel angosto se pisarían en el medio.
  const cabe = charsThatFit(w / 2 - MARCA - 2 * GAP)
  const recortar = (t: string) => (t.length > cabe ? `${t.slice(0, cabe - 1)}…` : t)
  const rotuloIzquierdo = recortar(`${columns.etiqueta} · ${ejes.columnas}`)
  const rotuloDerecho = recortar(`${line.etiqueta} · ${ejes.linea}`)
  const yRotulo = MARGIN.t + MARCA / 2

  return (
    <svg
      width={w}
      height={h}
      role="img"
      aria-label={`Combinado con dos ejes · ${columns.etiqueta} en columnas, eje izquierdo en ${ejes.columnas} · ${line.etiqueta} en línea, eje derecho en ${ejes.linea}`}
    >
      {/* Los dos rótulos de eje, cada uno con la marca de su dibujo. */}
      <g data-rotulo-de-eje="izquierdo">
        <rect x={0} y={MARGIN.t} width={MARCA} height={MARCA} rx={2} fill={hue({ family, step: COLUMN_STEP })} fillOpacity={0.7} />
        <AxisText x={MARCA + GAP / 2} y={yRotulo} anchor="start">
          {rotuloIzquierdo}
        </AxisText>
      </g>
      <g data-rotulo-de-eje="derecho">
        <circle cx={w - MARCA / 2} cy={yRotulo} r={MARCA / 2 - 1} fill={hue({ family })} />
        <AxisText x={w - MARCA - GAP / 2} y={yRotulo} anchor="end">
          {rotuloDerecho}
        </AxisText>
      </g>
      <g transform={`translate(${izquierda},${top})`}>
        <Grid scale={yColumnas} orientation="horizontal" length={width} />
        <g fillOpacity={0.7}>
          <Bars
            items={items}
            band={banda}
            value={yColumnas}
            orientation="vertical"
            base={yColumnas(0)}
            family={family}
            step={COLUMN_STEP}
          />
        </g>
        <Line points={line.puntos.map((p, i) => ({ x: i, y: p.v }))} x={x} y={yLinea} family={family} />
        <Dots points={line.puntos.map((p, i) => ({ x: i, y: p.v, k: p.t }))} x={x} y={yLinea} family={family} />
        <CategoryAxis scale={narrowed(banda, rotulados)} side="bottom" at={height + 12} width={banda.step * EVERY} />
      </g>
      <g transform={`translate(0,${top})`}>
        <g data-eje="izquierdo">
          <ValueAxis scale={yColumnas} side="left" at={izquierda - 6} format={format} />
        </g>
        <g data-eje="derecho">
          <ValueAxis scale={yLinea} side="right" at={izquierda + width + 6} format={format} />
        </g>
      </g>
    </svg>
  )
}
