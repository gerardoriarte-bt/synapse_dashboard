/** Lollipop · formas `categorica` y `ranking` · §PEN:Plot/LOLLIPOP
 *
 *  Medido nodo por nodo sobre el frame `Plot/LOLLIPOP · Estilos con mayor venta`
 *  —580 × 208, siete filas—. Lo que el dibujo no dice con palabras y hubo que
 *  derivar está en cada constante, con su número al lado.
 *
 *  **Por qué NO se compone con las piezas de `PlotBars`, que es el atajo obvio.**
 *  `PlotBars` resuelve su columna de categorías con `CategoryAxis` —mono 10,
 *  MAYÚSCULAS, `$dim`— y sus valores con un `ValueAxis` de ticks abajo. El frame
 *  del lollipop no tiene rejilla, no tiene eje de valores, y dibuja la anatomía
 *  POR FILA: etiqueta `$font-body` 12 `$ink` alineada a la derecha, y la cifra
 *  `$font-mono` 11 `$ink` al final. Reusar `AxisText` para la cifra violaría §2.3
 *  en tres cosas a la vez —tracking, mayúsculas y tono— justo sobre una columna
 *  de siete dígitos que se comparan entre sí, que es de lo que §2.3 separa el rol
 *  «cifra» del rol «rótulo». Se sigue el frame, que es normativo para lo visual.
 *
 *  Queda anotado que `PlotBars` diverge del SUYO en exactamente lo mismo: su
 *  frame de BARRAS también dibuja etiqueta body-12 y cifra mono-11 por fila. Es
 *  material para `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md`, no algo
 *  a arreglar de paso — y mientras tanto los dos gráficos del mismo cuerpo se
 *  van a ver distintos.
 *
 *  **Sin riel de fondo, y no es un olvido.** El frame de BARRAS dibuja un `$w2`
 *  de 380 detrás de cada barra; éste no dibuja ninguno. Un riel detrás de un
 *  tallo de 2px lo convierte en una barra fantasma.
 *
 *  **El cuerpo ordena y recorta; este archivo no.** `orden` y `tope` viven en
 *  `BarsParams` y se aplican antes. Un plot que reordene rompe `orden: 'natural'`
 *  en silencio.
 */
import { useSize } from './core/useSize'
import { bandScale, linearScale } from './core/scale'
import { hue } from './core/seriesColor'
import type { PlotProps } from '../types'

/** Cuánto ancho se lleva la columna de etiquetas. Del frame: el borde derecho de
 *  las siete etiquetas cae en 140 sobre 580 ⇒ 0,241. **Proporcional y no fijo**,
 *  por la misma razón que en `PlotBars`: el mismo plot vive en un panel de
 *  colSpan 4 y en el drill-down a pantalla completa. */
const LABEL_WIDTH = 0.24

/** Lo que se reserva para la columna de cifras. Del frame: las cifras arrancan
 *  en 485,6 sobre 580 ⇒ el borde queda a 0,163 del derecho. */
const VALUE_WIDTH = 0.16

/** El aire entre la etiqueta y el origen del tallo. Del frame: 152 − 140 = 12.
 *
 *  **El mismo 12 separa el punto de la cifra**, y ahí el dibujo deja ~21. Se
 *  elige el 12 a propósito: dos aires distintos sin razón son dos constantes que
 *  se desincronizan. La divergencia declarada es ~4 % del riel. */
const GAP = 12

/** Del frame: `ellipse` de 11 × 11. */
const DOT_R = 5.5

/** Del frame: `strokeWidth: 2`, `strokeLinecap: "round"` en los siete `path`. */
const STEM_WIDTH = 2

/** Del frame: `fontSize: 12` en las siete etiquetas · es `--text-celda`. Vive
 *  como número porque el recorte se calcula con él y una `var()` no se divide. */
const LABEL_SIZE = 12

/** Ancho de un carácter de Inter, como fracción del tamaño.
 *
 *  **NO es el 0,72 de `MONO_ADVANCE`**, que es JetBrains Mono más el tracking de
 *  §2.3: aplicado acá recorta cuatro caracteres de más en cada etiqueta. Es la
 *  misma falla que ya costó una letra por etiqueta en el eje, con otro tamaño.
 *
 *  **Sale de medir el propio frame**, que es donde Pencil guardó el ancho que el
 *  navegador le dio a cada texto a `$font-body` 12: 107 caracteres en siete
 *  cajas suman 837,9px. El promedio da 0,653 em/carácter, pero una fuente
 *  proporcional no tiene un avance: los extremos medidos son 0,597
 *  —«Rival Fleece Hoodie»— y 0,727 —«HOVR Phantom 4»—.
 *
 *  **Se elige el 0,6 porque es el que reproduce el dibujo.** A 580px la columna
 *  mide 139 y la etiqueta más larga son 19 caracteres: con 0,6 entran 19 y el
 *  dibujo las muestra enteras; con el promedio 0,653 entrarían 17 y se recortaría
 *  una etiqueta que el `.pen` pinta completa. El sesgo elegido es no recortar de
 *  más, y el costo es que una etiqueta toda en mayúsculas puede desbordar. */
const BODY_ADVANCE = 0.6

/** Cuántos caracteres de Inter entran en un ancho dado. Gemelo de `charsThatFit`
 *  con el avance de la otra fuente; el piso de 3 es el mismo, porque una
 *  etiqueta recortada a un carácter no dice nada. */
const charsThatFitBody = (px: number) => Math.max(3, Math.floor(px / (LABEL_SIZE * BODY_ADVANCE)))

/** El bandeo en tercios del dibujo. Medido en DOS frames: LOLLIPOP con 7 filas
 *  descendentes usa `1,1,0,0,2,2,2` y BARRAS con 6 usa `1,1,0,0,2,2`. La regla
 *  que los dos cumplen es: grupos de `floor(n/3)`, el resto al último, escalones
 *  `[1, 0, 2]`.
 *
 *  **`1,0,2` es medio, claro, oscuro — no es monótono en luminosidad**, así que
 *  nadie puede leerlo como magnitud: bandea el ranking en tercios y nada más. Se
 *  reproduce porque el frame es normativo para lo visual y porque es sistemático
 *  en dos pantallas, no un descuido de una. Queda como propuesta de spec. */
const BANDS = [1, 0, 2] as const

function rampStep(i: number, n: number): 0 | 1 | 2 {
  const size = Math.max(1, Math.floor(n / 3))
  return BANDS[Math.min(BANDS.length - 1, Math.floor(i / size))] ?? 1
}

export function PlotLollipop({ value, family, format }: PlotProps<'categorica'>) {
  const { ref, w, h } = useSize()

  const items = value.items.map((i) => ({ k: i.etiqueta, v: i.v }))
  const left = Math.round(w * LABEL_WIDTH)
  const originX = left + GAP
  const valueX = w - Math.round(w * VALUE_WIDTH)
  // El punto se para SOBRE el fin del tallo, así que su radio sale del riel: sin
  // restarlo, el tallo más largo mete media marca dentro de la columna de cifras.
  const trackW = Math.max(0, valueX - GAP - DOT_R - originX)

  // **El origen es CERO y el máximo llena el riel.** Medido: largo ÷ valor da
  // 1,670 en las siete filas del frame, idéntico, así que el dominio arranca en
  // cero. Y NO se usa `ceiling`: existe para que un eje diga 0 · 20 · 40 y acá no
  // hay eje —la lectura de cada fila es su cifra escrita al lado—, así que
  // redondear el techo a 200 dejaría el tallo más largo al 92 % sin que nada lo
  // explique. El mínimo con cero adentro es lo que deja salir un negativo hacia
  // la izquierda: el dibujo no tiene ninguno y el contrato los permite.
  const vals = items.map((i) => i.v)
  const x = linearScale([Math.min(0, ...vals), Math.max(0, ...vals)], [0, trackW])
  const base = x(0)

  // Las filas se reparten el alto entero: el dibujo deja 19px muertos abajo y
  // responsivamente el paso se estira. El `padding` de la banda da igual porque
  // sólo se lee su centro.
  const y = bandScale(
    items.map((i) => i.k),
    [0, h],
  )
  const cap = charsThatFitBody(left)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        // El nombre tiene que ser DISTINGUIBLE del de `PlotBars` —`N categorías`
        // a secas—: es por él que una prueba de despacho sabe cuál de los dos se
        // montó, y los dos salen del mismo cuerpo.
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`${items.length} categorías con marca y cifra`}
        >
          {items.map(({ k, v }, i) => {
            const cy = y(k) + y.bandwidth / 2
            const tip = originX + x(v)
            const color = hue({ family, step: rampStep(i, items.length) })
            return (
              <g key={k}>
                <path
                  d={`M${originX + base},${cy}L${tip},${cy}`}
                  stroke={color}
                  strokeWidth={STEM_WIDTH}
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx={tip} cy={cy} r={DOT_R} fill={color} />
                <text
                  x={left}
                  y={cy}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-celda)',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {k.length > cap ? `${k.slice(0, cap - 1)}…` : k}
                </text>
                {/* §2.3 · el rol «cifra en gráfico»: mono 11 SIN tracking, porque
                    el tracking separa los dígitos y rompe la comparación de
                    columna a columna — y acá hay siete cifras que se comparan. */}
                <text
                  x={valueX}
                  y={cy}
                  textAnchor="start"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-cifra)',
                    fontVariantNumeric: 'tabular-nums',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {format(v)}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
