/** Pareto · forma `categorica` · §PEN:Plot/PARETO · Causas de rechazo del feed
 *
 *  **Un pareto no es «barras ordenadas»: lo que comunica es la CONCENTRACIÓN.**
 *  Las barras dicen cuánto pesa cada causa y la curva dice cuánto llevás
 *  acumulado — que es la única forma de contestar «¿con cuántas causas arreglo
 *  la mitad del problema?». Sin la curva son columnas con otro orden.
 *
 *  ── LO QUE SE MIDIÓ EN EL DIBUJO ────────────────────────────────────────────
 *
 *  El frame son 580 × 210. Tres reglas en `$c-grid` de x 44 a 548 —y 164, 90 y
 *  16—, o sea base en 164 y tope del área en 16, con **46 px por debajo de la
 *  base** para las dos filas del pie. Las cinco barras arrancan en 60.1 · 160.9
 *  · 261.7 · 362.5 · 463.3 → paso 100.8, que es (548−44)/5, y miden 68.5 de
 *  ancho: `padding = 1 − 68.5/100.8 = 0.32`, contra el 0.2 que `bandScale` trae
 *  por defecto. Las cinco apoyan en 164 exacto.
 *
 *  74 px valen 250 unidades y los valores son 417.8 · 306 · 284 · 166.9 · 61.1:
 *  `ceiling(418)` da 500, que es **exactamente** el tope dibujado. La escala del
 *  `.pen` y la del repositorio coinciden sin tocar nada.
 *
 *  La curva va anclada al CENTRO de cada banda —94.4 · 195.2 · 296 · 396.8 ·
 *  497.6, que es x + 68.5/2— y sus y son 113.9 · 77.3 · 43.3 · 23.3 · 16.0:
 *  sobre el mismo alto del área, 34 · 59 · 82 · 95 · 100 %. **El 100 % cae en
 *  y=16, el tope**, así que son dos escalas sobre el MISMO alto: la magnitud
 *  contra `ceiling` y el acumulado contra 100.
 *
 *  ── EL ACUMULADO LO CALCULA EL PLOT, Y NO ES UN CÁLCULO DE NEGOCIO ──────────
 *
 *  `ValorCategorica` es `{ etiqueta, v }` y nada más: en el cable no hay
 *  porcentaje. El acumulado es la aritmética del propio dibujo —ordenar, sumar,
 *  dividir por el total de lo que se recibe—, no una cifra que el backend
 *  debería mandar. **El riesgo está río arriba**: si el servicio ya recortó las
 *  causas, la curva cierra en 100 % sobre un subconjunto, y no hay campo en el
 *  cable que diga si recortó.
 *
 *  ── POR QUÉ EL PLOT ORDENA Y NO SE LO DEJA AL CUERPO ────────────────────────
 *
 *  Un pareto ES el orden descendente, así que el orden no es una opción de
 *  layout acá: un `orden: 'asc'` dibujaría una escalera creciente con la curva
 *  arrancando en el 3 %, y eso deja de ser el gráfico. Por eso ordena adentro y
 *  no confía en que le llegue ordenado. Por la misma razón el despacho del
 *  cuerpo tiene que ir **antes** de su `tope`: recortar a N y dejar que la curva
 *  cierre en 100 % afirma que las N mostradas son todas las causas.
 *
 *  ── CINCO DESVIACIONES CON EL DIBUJO, DECLARADAS ────────────────────────────
 *
 *  1. **Los ticks 0 / 250 / 500 no son emitibles.** `niceStep` sólo da 1, 2, 5 o
 *     10 por década: sobre [0,500] con `count=4` salen 0 / 200 / 400. Se usa el
 *     defecto del repositorio; cambiar `niceStep` para servir a un plot mueve el
 *     eje de los otros diez.
 *
 *     **Y arrastra una consecuencia visual que conviene decir**, porque se ve y
 *     no está en los rótulos: en el frame la regla de arriba ES el techo —500 en
 *     y=16, donde la curva cierra—, y acá el techo sigue siendo 500 pero la
 *     última regla cae en 400. Medido rindiendo el plot a 580 × 210, el tamaño
 *     del frame: reglas en y 164 · 101.6 · 39.2 contra 164 · 90 · 16 dibujadas.
 *     La base coincide al píxel; el techo queda sin regla.
 *  2. **La curva va en la MISMA familia, escalón 3.** El dibujo la pinta en
 *     `$fam-demanda-1` sobre barras `$fam-inventario` — una segunda familia, y
 *     la regla dura 1 prohíbe elegir familia en el componente. Es la divergencia
 *     que `PlotControl` ya declaró para sus violaciones, y acá se resuelve
 *     distinto **a propósito**: allá la marca es una anotación y va en `ink`;
 *     acá la curva ES dato, así que sale del catálogo. El escalón 3 es el único
 *     legible en los dos temas; el 4 desaparece sobre el panel oscuro.
 *  3. **La fila de categorías va en mono 10 MAYÚSCULAS** vía `CategoryAxis`, no
 *     en mono 9 caja mixta: es lo que hacen los otros plots, lo que §2.3 pide de
 *     un label, y lo que trae el recorte por ancho ya resuelto. El dibujo deja
 *     «Precio inconsistente» desbordar su banda; acá se recorta con elipsis.
 *  4. **El trazo va en 1.5 px**, el de `Line`, no en 2.2; y el vértice en 3.5 de
 *     radio, no en 3.6. Mismo criterio que `PlotControl`, que tenía 2 px.
 *  5. **No hay eje derecho de porcentaje** porque el dibujo no lo tiene: la fila
 *     del pie lo reemplaza.
 *
 *  ── DOS PRIMITIVAS QUE FALTAN, Y NO SE TOCAN EN ESTA TAREA ──────────────────
 *
 *  `Bars` no admite opacidad —el dibujo pinta las cuatro no destacadas al 0.7— y
 *  `AxisText` es `dim` y punto —la fila de acumulados del frame es `$ink`—. Lo
 *  correcto es `fillOpacity?` en `core/Series.tsx` y `tone?` en `core/Axis.tsx`,
 *  las dos opcionales con el defecto de hoy; `core/` es compartido y su cambio
 *  es una fase aparte. Mientras tanto la opacidad se compone con un `<g>`
 *  —igual que `PlotColumns`— y la fila de acumulados es un `<text>` propio que
 *  repite el contrato tipográfico. Queda anotado: **falta una primitiva, no
 *  sobra un componente a medida.**
 *
 *  ── LO QUE EL DIBUJO NO TIENE Y NO SE INVENTA ───────────────────────────────
 *
 *  Un pareto suele llevar la línea del 80 % que parte las causas «pocas y
 *  vitales» de las demás. **El `.pen` no la dibuja** y `design.md` no declara el
 *  umbral, así que no se agrega: sería inventar un corte. Si diseño la quiere,
 *  es una línea de referencia sobre la escala de acumulado y una propuesta de
 *  spec.
 */
import { useSize } from './core/useSize'
import { bandScale, ceiling, linearScale } from './core/scale'
import { CategoryAxis, ValueAxis } from './core/Axis'
import { MARGIN, axisReserve } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { Bars, Dots, Line } from './core/Series'
import type { PlotProps } from '../types'

/** El aire entre barras · medido: paso 100.8 y barra 68.5. El defecto de
 *  `bandScale` es 0.2 y produce un apilado sin aire. */
const PADDING = 0.32

/** Las dos filas del pie · 210 − 164 en el frame. `MARGIN.b` son 20 y alcanza
 *  para una fila sola; acá van la categoría y su acumulado. */
const FOOT = 46

/** Cuánto baja cada fila del pie respecto de la base · 18.9 y 32.4 en el frame,
 *  medidos al CENTRO del texto, que es donde `dominantBaseline="middle"` ancla. */
const CATEGORY_DROP = 19
const PERCENT_DROP = 32

/** El contrato tipográfico de un label · §2.3. Se repite acá porque `AxisText`
 *  es `dim` fijo y esta fila es `$ink` — ver la nota de las primitivas. */
const PERCENT_TYPE = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-label)',
  letterSpacing: 'var(--tracking-rotulo)',
  fill: 'var(--color-ink)',
} as const

export function PlotPareto({ value, family, format }: PlotProps<'categorica'>) {
  const { ref, w, h } = useSize()

  // Copia antes de ordenar: `sort` muta, y el arreglo viene del payload que
  // TanStack Query tiene en cache. Y ordena ACÁ aunque el cuerpo ya ordene: un
  // pareto sobre datos desordenados no es un pareto mal dibujado, es otro
  // gráfico.
  const items = [...value.items]
    .sort((a, b) => b.v - a.v)
    .map((i) => ({ k: i.etiqueta, v: i.v }))

  const total = items.reduce((s, i) => s + i.v, 0)

  // Sin total no hay acumulado: dividir por cero pone `NaN` en cada `cy` y en la
  // `d` de la curva, y un `NaN` en un atributo de SVG no falla, no se dibuja.
  // Misma guarda que `PlotGauge` con `max <= 0`.
  const cumulative: number[] = []
  if (total > 0) {
    let running = 0
    for (const i of items) {
      running += i.v
      cumulative.push((running / total) * 100)
    }
  }

  const height = Math.max(0, h - MARGIN.t - FOOT)
  const y = linearScale([0, ceiling(items.map((i) => i.v))], [height, 0])
  const reserve = axisReserve(y.ticks(4).map(format))
  const width = Math.max(0, w - reserve - MARGIN.r)
  const band = bandScale(
    items.map((i) => i.k),
    [0, width],
    PADDING,
  )

  // La segunda escala, sobre el MISMO alto: el 100 % cae en el tope del área y
  // el 0 % en la base, que es lo que el frame dibuja.
  const pct = linearScale([0, 100], [height, 0])

  // Los centros de banda como escala x. Es lineal porque el paso de banda es
  // constante, así que no hace falta una primitiva nueva.
  const first = items[0]
  const last = items[items.length - 1]
  const center = (k: string) => band(k) + band.bandwidth / 2
  const x = linearScale(
    [0, Math.max(1, items.length - 1)],
    first === undefined || last === undefined ? [0, 0] : [center(first.k), center(last.k)],
  )

  const [head, ...rest] = items

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        <svg width={w} height={h} role="img" aria-label={`Pareto · ${items.length} categorías`}>
          <g transform={`translate(${reserve},${MARGIN.t})`}>
            <Grid scale={y} orientation="horizontal" length={width} />
            {/* Las no destacadas y la primera, en dos llamadas sobre la MISMA
                banda —que está armada sobre el dominio completo, así que las
                posiciones no cambian. Ver la nota de las primitivas. */}
            <g opacity={0.7}>
              <Bars
                items={rest}
                band={band}
                value={y}
                orientation="vertical"
                base={y(0)}
                family={family}
                step={1}
              />
            </g>
            {head !== undefined && (
              <Bars
                items={[head]}
                band={band}
                value={y}
                orientation="vertical"
                base={y(0)}
                family={family}
                step={2}
              />
            )}
            {cumulative.length > 0 && (
              <>
                <Line
                  points={cumulative.map((v, i) => ({ x: i, y: v }))}
                  x={x}
                  y={pct}
                  family={family}
                  step={3}
                />
                <Dots
                  points={cumulative.map((v, i) => ({
                    x: i,
                    y: v,
                    k: items[i]?.k ?? String(i),
                  }))}
                  x={x}
                  y={pct}
                  family={family}
                  step={3}
                />
              </>
            )}
            <CategoryAxis
              scale={band}
              side="bottom"
              at={height + CATEGORY_DROP}
              width={band.step}
            />
            {/* Cada acumulado lleva su categoría encima · «ningún número
                desnudo» lo cumple la fila de arriba, no un rótulo aparte. */}
            {cumulative.map((v, i) => {
              const k = items[i]?.k
              return k === undefined ? null : (
                <text
                  key={k}
                  x={center(k)}
                  y={height + PERCENT_DROP}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={PERCENT_TYPE}
                >
                  {`${String(Math.round(v))}%`}
                </text>
              )
            })}
          </g>
          <g transform={`translate(0,${MARGIN.t})`}>
            <ValueAxis scale={y} side="left" at={reserve - 6} format={format} />
          </g>
        </svg>
      )}
    </div>
  )
}
