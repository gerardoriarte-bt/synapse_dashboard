/** Pendiente · forma `seriesMultiples` · §PEN:Plot/PENDIENTE · Participación 2025 contra 2026
 *
 *  **Contesta «quién cambió de lugar», que es lo único que ni la multilínea ni
 *  el área apilada dicen de un vistazo.** Con doce meses en pantalla el cruce
 *  entre dos participaciones queda enterrado entre veinte vértices; acá son dos
 *  columnas y un segmento por fila, y el cruce es literalmente el dibujo.
 *
 *  El precio está declarado abajo y no se puede evitar: **descarta los puntos
 *  intermedios**. Quien elige `slope` sobre una serie larga está eligiendo eso.
 *
 *  ── LO QUE SE MIDIÓ EN EL DIBUJO ────────────────────────────────────────────
 *
 *  Frame de 580 × 218, `layout: none`, todo posicionado a mano.
 *
 *  Los dos rieles van en x 150 y x 430 sobre 580 —0.2586 y 0.7414—, con los dos
 *  canales laterales iguales: se toman **0.26 y 0.74**, que los deja iguales de
 *  verdad. De y 12 a y 188: arriba es el margen de siempre y abajo son 30 px, más
 *  que los 20 de `MARGIN.b`, porque ahí van los rótulos de período. Por eso el
 *  margen inferior es propio y se llama `AXIS_ROW`.
 *
 *  **EL DOMINIO NO ARRANCA EN CERO, Y ESO NO ES ESTÉTICA.** Los seis nodos del
 *  dibujo caen sobre una sola recta —52 % → y 44.3, 38 % → y 79.7, 10 % → y
 *  150.7, o sea 2.5286 px por punto porcentual, que predice exactamente el 54 %
 *  en y 39.2 y el 36 % en y 84.8—. Extrapolada a los extremos del riel, esa
 *  recta da un dominio de ≈ [−4.8, 64.8] sobre datos de [10, 54]: los datos
 *  ocupan el 60 % del riel, con 0.25 de aire arriba y 0.34 abajo.
 *
 *  Con base cero —`ceiling`— tres participaciones entre 48 y 54 salen como tres
 *  rectas planas y paralelas apretadas contra el techo, y el cruce, que es lo
 *  único que una pendiente agrega, desaparece.
 *
 *  ── LAS CIFRAS, Y POR QUÉ SON ASIMÉTRICAS ───────────────────────────────────
 *
 *  A la izquierda `Footwear  52%` en `font-body` 12, `ink`, alineado a la
 *  derecha contra x 136 = riel − 14. A la derecha `54%` sola, en `font-mono` 11,
 *  `ink`, desde x 444 = riel + 14. **Es asimétrico y es lo que el dibujo hace**;
 *  el `.pen` manda en lo visual. Queda como candidata a propuesta de spec: una
 *  cifra en fuente proporcional no alinea de fila a fila, que es exactamente lo
 *  que §2.3 evita dándole mono a las cifras.
 *
 *  El doble espacio del dibujo no sobrevive a SVG —se colapsa—, así que va uno.
 *
 *  ── POR QUÉ SE COTEJA EL `t` Y NO LA POSICIÓN ───────────────────────────────
 *
 *  Es la lección de `stackarea` con otra cara. Tomando el primero y el último de
 *  cada serie sin mirar QUÉ instante son, una serie que compara enero contra
 *  enero se dibujaría bajo dos rótulos que dicen julio, y se vería impecable.
 *  Las columnas las fija la primera serie dibujable y las demás tienen que
 *  coincidir; la que no, no se dibuja.
 *
 *  **El hueco es silencioso y hay que saberlo**: una serie descartada —por tener
 *  un solo punto o por comparar otros dos instantes— desaparece sin decir nada
 *  a un lector vidente. Lo único que lo delata es el conteo del `aria-label`.
 *
 *  ── DIVERGENCIAS DECLARADAS ─────────────────────────────────────────────────
 *
 *  1. **El trazo va en 1.5 y el dibujo pide 2.5.** Lo fija `Line` y no se toca
 *     acá: cambiarlo movería `PlotSeries`, `PlotStackArea` y `PlotControl`. Este
 *     gráfico es el que más lo nota, porque 1.5 se lee fino contra extremos de
 *     5 px de radio. Es la misma divergencia que `PlotStackArea` ya declaró para
 *     su borde de 1.8.
 *  2. **El acolchado es 0.3 parejo y el dibujo tiene 0.25 arriba y 0.34 abajo.**
 *     Son números puestos a mano, no un algoritmo legible; se elige uno solo y
 *     se declara, igual que el 0.75 de `envelope`.
 *  3. **El dibujo usa dos familias —`demanda` e `inventario`— y acá se usan los
 *     escalones de una.** Es la convención que `PlotComposition` ya declara y
 *     que la regla dura 1 obliga: la familia la trae el catálogo, elegir dos
 *     sería elegir color.
 *  4. **`spread` y el texto de dato viven acá y no en `core/`.** Los dos son
 *     piezas compartidas —`spread` lo van a pedir `bump` y `dumbbell`, y el
 *     texto de dato dentro de un `<svg>` lo piden cascada, bullet y lollipop—
 *     pero `core/scale.ts` y `core/Axis.tsx` son archivos compartidos y moverlos
 *     no entra en esta tarea.
 *
 *  ── LO QUE NO SE RESUELVE Y NO SE INVENTA ───────────────────────────────────
 *
 *  Con dos participaciones a un punto de distancia los dos rótulos de 12 px se
 *  montan, y no hay desempate: es candidato a propuesta de spec —¿se empujan, se
 *  colapsan, se recorta la lista?—, no un arreglo silencioso. Y a partir de la
 *  sexta fila dos comparten escalón; sobre `externo`, que tiene dos, el choque
 *  empieza en la tercera.
 */
import { useSize } from './core/useSize'
import { linearScale } from './core/scale'
import { AxisText } from './core/Axis'
import { MARGIN, charsThatFit } from './core/axisGeometry'
import { Line } from './core/Series'
import { hue } from './core/seriesColor'
import type { PlotProps } from '../types'

/** Dónde caen las dos columnas, como fracción del ancho · medido en el `.pen`:
 *  150 y 430 sobre 580. Los dos canales laterales se igualan. */
const LEFT = 0.26
const RIGHT = 0.74

/** La franja de abajo, reservada a los rótulos de período. Es PROPIA y no
 *  `MARGIN.b`: el dibujo deja 30 px —218 − 188— donde el margen estándar son 20,
 *  porque acá el eje inferior no son ticks sino dos períodos con tracking. */
const AXIS_ROW = 30

/** Cuánto se separa el texto de su riel · 14 px en el dibujo, a los dos lados
 *  (136 = 150 − 14 y 444 = 430 + 14). */
const GUTTER = 14

/** El radio del extremo · elipses de 10 × 10 en el dibujo. */
const KNOB = 5

/** El centro vertical de los rótulos de período · y 206.7 sobre 218. */
const PERIOD_ROW = 11

/** La rampa tiene cinco escalones · el mismo tope que la composición. */
const RAMP = 5

/** El dominio ACOLCHADO de una pendiente.
 *
 *  **No se puede reusar `envelope`**: su 0.75 está documentado para la barra de
 *  rango y además redondea hacia afuera a pasos redondos, así que sobre [10, 54]
 *  devuelve [−40, 100] y los tres segmentos quedan apretados en el tercio
 *  central del riel. Y `ceiling` parte de cero, que es justo lo que este dibujo
 *  descarta.
 *
 *  El piso del span es el mismo de `envelope` y por la misma razón: una fila
 *  plana —o tres filas con el mismo valor— colapsaría el dominio y la escala
 *  dividiría por cero.
 */
function spread(values: readonly number[], pad = 0.3): [number, number] {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = Math.max(hi - lo, Math.abs(hi) / 10, 1)
  return [lo - pad * span, hi + pad * span]
}

export function PlotSlope({ value, family, format }: PlotProps<'seriesMultiples'>) {
  const { ref, w, h } = useSize()

  // Sólo las que tienen con qué comparar. Una serie de un punto no se completa
  // con su propio punto: un segmento horizontal se lee «no cambió», y lo que
  // pasa es que no hay segundo instante.
  //
  // **Y el caso que este filtro tapa de verdad es que la PRIMERA tenga un punto
  // solo**, porque es la que fija las columnas: sin él las dos saldrían con el
  // mismo `t` —«JUL 2025 contra JUL 2025»— y el cotejo de abajo tiraría a todas
  // las demás, que sí tenían dos instantes. Para las que no son la primera, ese
  // cotejo ya alcanza; lo descubrió una mutación que sobrevivió.
  const comparables = value.series
    .map((s) => ({ etiqueta: s.etiqueta, desde: s.puntos[0], hasta: s.puntos[s.puntos.length - 1] }))
    .filter((s) => s.desde !== undefined && s.hasta !== undefined && s.desde !== s.hasta)

  // Las columnas las fija la PRIMERA dibujable y las demás tienen que coincidir.
  const primera = comparables[0]
  const filas = comparables.filter(
    (s) => s.desde?.t === primera?.desde?.t && s.hasta?.t === primera?.hasta?.t,
  )

  // **El dominio sale de los extremos y de nada más.** Con los intermedios
  // adentro, un pico de un mes aplasta las seis filas contra el centro y el
  // gráfico se ve prolijo diciendo otra cosa.
  const extremos = filas.flatMap((s) => [s.desde?.v ?? 0, s.hasta?.v ?? 0])

  const x = linearScale([0, 1], [LEFT * w, RIGHT * w])
  const y = linearScale(spread(extremos), [h - AXIS_ROW, MARGIN.t])

  // El recorte se calcula con el avance de la mono, que a 12 px de Inter es
  // conservador: recorta antes de tiempo. Lo correcto sería un avance por
  // familia tipográfica en `axisGeometry.ts`, que hoy no existe.
  const cap = charsThatFit(Math.max(0, x(0) - GUTTER), 12)

  const desde = primera?.desde?.t ?? ''
  const hasta = primera?.hasta?.t ?? ''

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && filas.length > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`${filas.length} series · ${desde} → ${hasta}`}
        >
          {/* Los dos rieles · son papel, no dato: `c-grid` y sin familia. No
              salen de `Grid` porque no son ticks de una escala de valores sino
              las dos columnas, y `Grid` sólo sabe pedirle posiciones a `ticks`. */}
          <g aria-hidden>
            {[x(0), x(1)].map((at) => (
              <line
                key={at}
                x1={at}
                x2={at}
                y1={MARGIN.t}
                y2={h - AXIS_ROW}
                stroke="var(--color-c-grid)"
                strokeWidth={1}
                strokeLinecap="round"
              />
            ))}
          </g>
          {filas.map((s, i) => {
            const step = (i % RAMP) as 0 | 1 | 2 | 3 | 4
            const a = s.desde?.v ?? 0
            const b = s.hasta?.v ?? 0
            const cifra = format(a)
            const nombre =
              s.etiqueta.length > Math.max(3, cap - cifra.length - 1)
                ? `${s.etiqueta.slice(0, Math.max(2, cap - cifra.length - 2))}…`
                : s.etiqueta
            return (
              <g key={s.etiqueta}>
                <Line
                  points={[
                    { x: 0, y: a },
                    { x: 1, y: b },
                  ]}
                  x={x}
                  y={y}
                  family={family}
                  step={step}
                />
                {/* Los extremos no salen de `Dots`: pone `fillOpacity 0.55` en
                    cuanto el radio es explícito —«una burbuja lleva opacidad»— y
                    el dibujo los quiere opacos. */}
                <circle cx={x(0)} cy={y(a)} r={KNOB} fill={hue({ family, step })} />
                <circle cx={x(1)} cy={y(b)} r={KNOB} fill={hue({ family, step })} />
                {/* Ningún número desnudo: la fila lleva su nombre y su cifra de
                    origen en el mismo nodo, como en el dibujo. */}
                <text
                  x={x(0) - GUTTER}
                  y={y(a)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-celda)',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {`${nombre} ${cifra}`}
                </text>
                <text
                  x={x(1) + GUTTER}
                  y={y(b)}
                  textAnchor="start"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-cifra)',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {format(b)}
                </text>
              </g>
            )
          })}
          {/* QUÉ dos instantes se comparan · es la única defensa contra
              descartar los intermedios en silencio. */}
          <g aria-hidden>
            <AxisText x={x(0)} y={h - PERIOD_ROW}>
              {desde}
            </AxisText>
            <AxisText x={x(1)} y={h - PERIOD_ROW}>
              {hasta}
            </AxisText>
          </g>
        </svg>
      )}
    </div>
  )
}
