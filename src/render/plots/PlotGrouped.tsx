/** Columnas agrupadas · forma `categoricaComparada` · §PEN:Plot/COLUMNAS AGRUPADAS · Real contra objetivo
 *
 *  **Contesta «cuánto midió cada categoría y contra qué», y la pareja es el
 *  gráfico.** `PlotDumbbell` sirve la misma forma y contesta otra cosa: allá la
 *  brecha ES el trazo y las dos magnitudes se leen de dos puntos; acá las dos
 *  magnitudes son dos columnas desde el mismo baseline y la brecha hay que
 *  medirla a ojo. Son dos preguntas distintas sobre un mismo dato, y por eso los
 *  dos salen del mismo cuerpo y se eligen por `grafico`.
 *
 *  ── LO QUE SE MIDIÓ EN EL DIBUJO ────────────────────────────────────────────
 *
 *  Frame de 580 × 220, `layout: "none"`, 18 nodos: 3 `path` de rejilla, 8
 *  `rectangle` y 7 `text`. **La página `Synapse · Plots` no tiene nodos
 *  `note`**, así que el frame es la única fuente y cada número queda escrito
 *  acá para que se pueda recalcular.
 *
 *  Las tres rejillas van de x 40 a 574 —534 px— en y 190, 102 y 14: el baseline
 *  es 190 y el techo 14, o sea 176 px para el valor. Las tres cajas de valor son
 *  `textAlign: right`, x 0 y width 45.6, con centros en 189.8 / 101.8 / 13.8 —
 *  exactamente sobre las rejillas. Los cuatro rótulos de categoría tienen su
 *  centro en y 206.3: **16.3 px bajo el baseline**, que es de donde sale
 *  `LABEL_DROP`.
 *
 *  **La columna del eje no se copia, se deriva**: el dibujo está a tamaño fijo y
 *  este plot vive en el `rowSpan` que le toque, así que la reserva sale de
 *  `axisReserve(y.ticks(4).map(format))` y el eje se pone en `reserve − 6`,
 *  igual que `PlotColumns`.
 *
 *  **EL DOMINIO ES `ceiling` Y EL DIBUJO LO CONFIRMA.** 176 px / 5 unidades =
 *  35.2 px por unidad; el más alto de los ocho rectángulos mide 161.9 px ⇒ 4.60,
 *  y `ceiling([… 4.60])` da exactamente 5 porque `niceStep(0.92)` es 1. El techo
 *  del dibujo no es un número a mano: lo reproduce la primitiva que ya existe.
 *
 *  **Y `ceiling` se toma sobre `v` Y `referencia` juntos.** En el dibujo el
 *  máximo global es una referencia —la de T4, 4.60, contra su valor 4.42—, así
 *  que un dominio calculado sólo sobre `v` recorta la columna fantasma por
 *  arriba. Con este fixture los dos caminos dan 5, así que la mutación
 *  sobrevive: la prueba usa un fixture hecho para ella.
 *
 *  ── LA PAREJA ES A RAS Y EL AIRE VA ADENTRO ─────────────────────────────────
 *
 *  Cuatro grupos con rótulos `T1`–`T4` centrados en x 105, 235, 365 y 495: paso
 *  **130 exacto**. Cada par mide 39 + 5 + 39 = 83 sobre ese paso ⇒ **0.6385**,
 *  que es el mismo `PADDING = 0.36` de `PlotColumns`. No es coincidencia
 *  estética: el `.pen` le da al PAR de este gráfico el mismo ancho que a la
 *  columna ÚNICA de `Plot/COLUMNAS`, y por eso la constante se reusa tal cual en
 *  vez de inventar un 0.3615.
 *
 *  Las dos columnas de cada grupo arrancan en `x0` y `x0 + 44`: la primera pega
 *  con el borde izquierdo de la banda y la segunda termina en el derecho
 *  (`x0 + 83`), con los 5 px de hueco enteros en el medio ⇒ `INNER = 5 / 83`.
 *  Sobre `bandwidth = 83` eso da 39.01 y la segunda en `x0 + 104.79`, que
 *  reproduce el dibujo con 0.01 px de error.
 *
 *  **Una `bandScale` anidada con padding NO reproduce esto**, y conviene decir
 *  por qué: centra cada miembro en su sub-paso y reparte la holgura
 *  1.25 / 2.5 / 1.25, con lo que ninguna columna toca el borde de su banda y el
 *  hueco interno baja a 2.5. El dibujo pone 47 px entre grupos contra 5 adentro
 *  —9.4 a 1—, y ese contraste es lo único que hace que el par se lea como par
 *  sin leyenda.
 *
 *  ── QUÉ COLUMNA ES CUÁL, Y NO ES DERIVABLE DEL DATO ─────────────────────────
 *
 *  La primera de cada par es `$fam-demanda-1` a opacidad plena; la segunda es
 *  `$fam-demanda-0` con `opacity: 0.4`. Lo fija el título del frame —«Real
 *  contra objetivo»— y lo confirma la opacidad: **la columna fantasma es el
 *  punto de comparación, nunca la medición**. Es además coherente con
 *  `PlotDumbbell`, donde la medición del dibujo dio `referencia = escalón 0`. El
 *  dibujo no escribe ningún delta, así que esto no se deduce de la geometría:
 *  por eso es la primera aserción de la prueba, y por eso se apoya en T3, que es
 *  el único par donde `v > referencia`. En un dibujo monótono invertir los dos
 *  miembros daría un gráfico idéntico diciendo lo contrario.
 *
 *  Los ocho valores, despejados de la altura (alto ÷ 35.2):
 *
 *  | | valor (`v`) | referencia |
 *  |---|---|---|
 *  | T1 | 3.81 | 3.90 |
 *  | T2 | 4.02 | 4.10 |
 *  | T3 | **4.28** | 4.15 |
 *  | T4 | 4.42 | 4.60 |
 *
 *  ── NINGÚN NÚMERO DESNUDO, Y SIN CIFRA SOBRE LAS COLUMNAS ───────────────────
 *
 *  El dibujo no escribe ni un valor sobre las barras: la regla la cumplen el eje
 *  de magnitud —cuyas tres rejillas están las tres rotuladas— y los cuatro
 *  rótulos de categoría. Ocho cifras sobre cuatro pares de 39 px no entran, y
 *  agregarlas sería ir contra el frame, que manda en lo visual. Un lector de
 *  pantalla recibe el conteo por el `aria-label`. Por eso **este plot no pide
 *  `core/MarkLabel`**, que sí piden `PlotColumns`, `PlotBullet`, `PlotLollipop`,
 *  `PlotDumbbell` y la cascada — conviene decirlo para que nadie la agregue
 *  «porque el dato trae `delta`».
 *
 *  **`delta` llega en el tipo y no se lee.** La comparación la hacen las dos
 *  alturas. Si el backend dejara de mandarlo, acá no cambia nada.
 *
 *  ── LOS PARES SIN `referencia` SE DESCARTAN ─────────────────────────────────
 *
 *  Igual que las filas de `PlotDumbbell` y por la razón del contrato: «sin
 *  `referencia` no hay comparación, y entonces el cuerpo no debe pintar una».
 *  **No hay `?? 0` ni `?? i.v`**: con el cero la fantasma mide cero y se lee
 *  «objetivo 0»; con el propio valor mide igual y se lee «llegó a la meta». Las
 *  dos compilan y las dos se ven bien.
 *
 *  La alternativa —dibujar la columna real sola— queda **nombrada y no
 *  tomada**: conserva el número medido y a cambio deja un grupo de una sola
 *  columna cuya identidad —valor o referencia— ya no la dice la posición
 *  relativa, porque no hay con qué compararla. Es decisión escrita, no olvido.
 *
 *  ── DIVERGENCIAS DECLARADAS ─────────────────────────────────────────────────
 *
 *  1. **El paso de tick 2.5 del dibujo no existe en `niceStep`.** Sus rótulos
 *     son 0.0 / 2.5 / 5.0; `ticks(4)` sobre [0, 5] da 0 / 2 / 4: siguen siendo
 *     tres líneas, con otros números y con la de arriba dejando de coincidir con
 *     el techo. Es la misma divergencia que `PlotColumns` ya declaró, con la
 *     misma razón para no arreglarla acá —el medio paso cambiaría el eje de los
 *     24 plots— y la misma salida: propuesta de spec.
 *  2. **El decimal del eje lo decide el formateador inyectado**, no el plot. El
 *     dibujo escribe una decimal; `format.number` con el locale del tenant
 *     decide, y forzar decimales acá sería decidir presentación por el tenant.
 *  3. **La opacidad va en un `<g>` y no en cada marca**, porque `Bars` toma un
 *     solo `SeriesColor` y no sabe de opacidad. Es el cuarto plot que lo compone
 *     así —`PlotColumns` ya lo declaró para pareto, ciclo y ranking—: falta la
 *     prop en la primitiva, y tocar `core/Series.tsx` no entra en esta tarea.
 *  4. **El rótulo de categoría se centra en la BANDA**, `x(k) + bandwidth / 2`,
 *     y no en la columna de valor. En el dibujo los centros caen en 105 / 235 /
 *     365 / 495 y el centro del par en 102.3: 2.7 px de deriva de mano alzada,
 *     del mismo orden que la holgura de la banda.
 *  5. **La división del paso del dibujo tiene holgura puesta a mano.** Sobre 534
 *     px caben 4.1 bandas de 130, así que el frame deja 14 px sin usar a la
 *     derecha y su primer grupo arranca en 60.8 donde una banda derivada lo
 *     pondría en 63.4. Acá el paso sale de `bandScale` y los ~2.6 px de
 *     divergencia quedan declarados, igual que el acolchado de `PlotDumbbell` y
 *     el 0.75 de `envelope`.
 *  6. **`subBand` vive acá, privada, y no en `core/scale.ts`.** Es la primitiva
 *     que falta —`stacked`, `stacked100` y `marimekko` la van a pedir después— y
 *     su lugar es el archivo compartido; moverla no entra en esta tarea. Queda
 *     registrado como costo, no como modelo: el precedente de `spread()`,
 *     duplicada hoy entre `PlotSlope` y `PlotDumbbell`, está escrito en el
 *     encabezado de los dos.
 *
 *  ── LO QUE NO SE PUEDE RESOLVER DESDE ACÁ ───────────────────────────────────
 *
 *  **NO HAY LEYENDA, Y EL DATO NO DA CON QUÉ ESCRIBIRLA.** El frame no dibuja
 *  ninguna: la única marca de cuál columna es el valor y cuál la referencia es
 *  la opacidad y la posición. Y no se suple, porque `ValorCategoricaComparada`
 *  **no nombra las dos series** —`etiqueta` es la categoría— y el contrato
 *  define `referencia` como «el objetivo, el período anterior o la categoría
 *  contra la que se compara»: rotularla «OBJETIVO» sería copy inventado por el
 *  front y además falso en dos de los tres casos. Va como propuesta de spec con
 *  sus dos salidas nombradas: un `core/Legend` alimentado por un campo nuevo de
 *  la forma, o `ComparisonParams` declarando los dos rótulos. Mientras tanto el
 *  `aria-label` lo dice y un lector vidente lo infiere de la opacidad.
 *
 *  **Nada frena la cantidad de parejas.** El repertorio le da a `grouped`
 *  `cap: null` y un mínimo de `items < 2` —que evalúa `catalog/plots.ts` y
 *  aplica `PanelInGrid`, y este plot no repite—. El dibujo tiene cuatro parejas
 *  de 39 px; con doce cada columna baja a ~13 px y con dieciséis a ~10, y un par
 *  de dos hilos deja de leerse como par. Es el mismo riesgo abierto que
 *  `PlotDumbbell` declaró para sus filas.
 *
 *  **La fantasma al 40 % no la mide nadie.** `contraste.py` compone pilas de
 *  TEXTO sobre superficie; una marca de dato al 40 % sobre `panel` no entra en
 *  su ámbito. El 0.4 es el número del frame y se copia tal cual, pero ningún
 *  chequeo verifica que se distinga del fondo en tema oscuro.
 *
 *  **Descartar un par es invisible para un lector vidente**: la categoría
 *  desaparece del eje y lo único que lo delata es el conteo del `aria-label`. Es
 *  la misma trampa que `PlotDumbbell` declaró para sus filas.
 */
import { useSize } from './core/useSize'
import { bandScale, ceiling, linearScale } from './core/scale'
import { CategoryAxis, ValueAxis } from './core/Axis'
import { MARGIN, axisReserve } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Bars } from './core/Series'
import type { BandScale } from './core/scale'
import type { PlotProps } from '../types'

/** La fracción del paso que queda como aire ENTRE grupos · del frame: paso 130 y
 *  par de 83 ⇒ 0.6385 de ocupación. Es el mismo número de `PlotColumns`, donde
 *  mide la columna única: el `.pen` le da al par el ancho que allá tiene una
 *  sola columna. El defecto de `bandScale` es 0.2 y pega los grupos entre sí. */
const PADDING = 0.36

/** El hueco de ADENTRO del par, como fracción del ancho de la banda · del
 *  frame: 5 px de hueco sobre los 83 del par. Los 47 px entre grupos contra
 *  estos 5 —9.4 a 1— son lo único que hace que la pareja se lea como pareja. */
const INNER = 5 / 83

/** La opacidad de la columna de referencia · del frame, los cuatro segundos
 *  rectángulos. Va en un `<g>` · ver la divergencia 3. */
const GHOST = 0.4

/** Cuánto bajan los rótulos de categoría respecto del baseline · del frame:
 *  centro en y 206.3 contra un baseline en 190. */
const LABEL_DROP = 16

/** Un miembro de la banda, A RAS y con el aire adentro.
 *
 *  **Es la primitiva que falta en `core/scale.ts`** —`bandScale` da una banda por
 *  categoría y `Bars` pinta en `band(k)` con ancho `band.bandwidth`, así que no
 *  hay forma de subdividirla— y vive acá privada sólo porque mover un archivo
 *  compartido no entra en esta tarea. Ver la divergencia 6.
 *
 *  Devuelve una `BandScale` para que `Bars` se reuse tal cual: `barW =
 *  (bandwidth − gap · (n − 1)) / n` y el miembro `index` en
 *  `band(k) + index · (barW + gap)`. Con `n = 2` el primero arranca en el borde
 *  izquierdo de la banda y el segundo termina en el derecho. */
function subBand(band: BandScale, index: number, n: number, inner: number): BandScale {
  const gap = band.bandwidth * inner
  const barW = (band.bandwidth - gap * (n - 1)) / n
  return Object.assign((k: string) => band(k) + index * (barW + gap), {
    domain: band.domain,
    bandwidth: barW,
    step: band.step,
  }) as BandScale
}

export function PlotGrouped({ value, family, format }: PlotProps<'categoricaComparada'>) {
  const { ref, w, h } = useSize()

  // Sólo los pares que tienen contra qué compararse · ver el encabezado: no hay
  // `?? 0` ni `?? i.v`, y las dos salidas de esa decisión están escritas allá.
  const pares = value.items.flatMap((i) =>
    i.referencia === undefined ? [] : [{ k: i.etiqueta, v: i.v, ref: i.referencia }],
  )

  const height = Math.max(0, h - MARGIN.t - MARGIN.b)
  // Sobre las DOS series: el máximo global del dibujo es una referencia, así que
  // un techo calculado sólo sobre `v` corta la columna fantasma por arriba.
  const y = linearScale([0, ceiling(pares.flatMap((p) => [p.v, p.ref]))], [height, 0])
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)
  const x = bandScale(
    pares.map((p) => p.k),
    [0, width],
    PADDING,
  )

  const valor = subBand(x, 0, 2, INNER)
  const referencia = subBand(x, 1, 2, INNER)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && pares.length > 0 && (
        // El nombre tiene que ser DISTINGUIBLE del de `PlotDumbbell` —«N
        // categorías con su referencia y su brecha»—, que sale del MISMO cuerpo
        // y de la MISMA forma: con el mismo texto, olvidar el despacho se ve
        // perfecto y ninguna prueba lo nota. Sin la palabra «brecha», que acá no
        // se dibuja.
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`${pares.length} categorías · valor y referencia en columnas pareadas`}
        >
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={y} orientation="horizontal" length={width} />
            {/* La MEDICIÓN primero, a opacidad plena y en el escalón 1. */}
            <Bars
              items={pares.map((p) => ({ k: p.k, v: p.v }))}
              band={valor}
              value={y}
              orientation="vertical"
              base={y(0)}
              family={family}
              step={1}
            />
            {/* La fantasma: escalón 0 al 40 %. Los escalones son 0 y 1 y no 1 y
                2 porque `externo` tiene dos: `familyVar` hace `step % largo`, y
                con `step: 2` las dos columnas quedarían del mismo color y la
                pareja dejaría de decir cuál es cuál. Es el riesgo que
                `PlotDumbbell` declaró y no pudo evitar. */}
            <g opacity={GHOST}>
              <Bars
                items={pares.map((p) => ({ k: p.k, v: p.ref }))}
                band={referencia}
                value={y}
                orientation="vertical"
                base={y(0)}
                family={family}
                step={0}
              />
            </g>
            <CategoryAxis
              scale={x}
              side="bottom"
              at={height + LABEL_DROP}
              width={x.step}
            />
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <ValueAxis scale={y} side="left" at={reserve - 6} format={format} />
          </g>
        </svg>
      )}
    </div>
  )
}
