/** Múltiplos pequeños · forma `seriesMultiples` · §PEN:Plot/MÚLTIPLOS · 2026-09-29
 *
 *  **Lo único que este gráfico afirma, y que ningún otro afirma, es que las
 *  divisiones son COMPARABLES.** Tres áreas una al lado de la otra se ven igual
 *  de prolijas con escala compartida que con escala propia; lo que cambia es que
 *  con escala propia las tres llenan su caja y el dibujo miente diciendo que las
 *  tres valen lo mismo. Por eso hay UNA sola escala `y` y UNA sola `x`, y cada
 *  división se coloca con un `<g transform>` en vez de llevar la suya.
 *
 *  ── EL DIBUJO LO DEMUESTRA CON NÚMEROS, Y POR ESO SE PUDO MEDIR ─────────────
 *
 *  El frame `Plot/MÚLTIPLOS · Unidades por división` cierra cada área con un
 *  `l0 …` que da su altura sobre el riel: **113.9 · 79.4 · 23**. Las cifras
 *  rotuladas dicen **8.9K · 6.2K · 1.8K**. Las razones coinciden al tercer
 *  decimal —79.4/113.9 = 0.6972 contra 6.2/8.9 = 0.6966; 23/113.9 = 0.2019
 *  contra 1.8/8.9 = 0.2022—, así que la escala es compartida **y** el dominio
 *  arranca en cero: la proporcionalidad es exacta, no afín. De ahí que `ceiling`
 *  sirva tal cual, aplicado a los valores de TODAS las series juntas.
 *
 *  **Y la cifra es el ÚLTIMO punto, no el máximo.** En la segunda división el
 *  mínimo de `y` del trazo es 68.1 —altura 81.9— y el cierre del área es 79.4;
 *  la que cuadra con 6.2K es la del cierre. En la primera coinciden por
 *  casualidad, así que la segunda es la que decide.
 *
 *  ── GEOMETRÍA, MEDIDA NODO POR NODO SOBRE EL FRAME DE 580 × 182 ────────────
 *
 *  Los tres rieles son `M8 150l178 0`, `M202 150l178 0` y `M396 150l178 0`:
 *  ancho de división 178 y separación 16 (202 − 186). Dentro de la división, el
 *  rótulo ocupa los primeros 16px —`y 0.2`, alto 16, centro en 8—, el área de
 *  dibujo va de 16 a 150, el riel está en 150 y la cifra tiene su centro en
 *  168.2, o sea 18 por debajo del riel. Con 182 de alto eso deja 134 de dibujo,
 *  que es `alto − 48`.
 *
 *  **Nada de eso es un píxel suelto acá**: el 178 sale del teselado contra el
 *  ancho medido y el 134 de restarle las dos bandas. Lo único que se escribe son
 *  las bandas, la separación y el desplome de la cifra.
 *
 *  ── LO QUE EL DIBUJO NO FIJA, Y QUEDA COMO DECISIÓN NUESTRA ────────────────
 *
 *  El `.pen` dibuja UNA fila de tres y nada más. Cuántas divisiones entran antes
 *  de envolver es del mismo tipo que el 0.75 de `envelope`: lo que el dibujo no
 *  fija es la regla. Se elige un ancho mínimo de división de 120px, que es
 *  `charsThatFit(120)` = 16 caracteres de rótulo — por debajo de eso el rótulo
 *  se recorta a nada y la división deja de decir de quién es.
 *
 *  ── TRES DIVERGENCIAS CON EL `.pen`, REUSADAS A PROPÓSITO ──────────────────
 *
 *  Van a `docs/PROPUESTA-2026-09-22-divergencias-con-el-pen.md` y no se resuelven
 *  en silencio. Son el precedente exacto de `PlotStackArea` y `PlotControl`:
 *
 *   1. El dibujo rellena OPACO y `Area` rellena al 0.16.
 *   2. El trazo del dibujo es 2.2 y `Line` es 1.5.
 *   3. El dibujo usa `$fam-demanda-1`, `$fam-demanda-0` y **`$fam-inventario-1`**
 *      —dos familias— y la regla dura 1 prohíbe elegir hue, así que se ciclan
 *      los escalones de la que llega del catálogo.
 *
 *  **La tercera tiene un argumento en contra que conviene dejar escrito:** en un
 *  múltiplo las divisiones son la MISMA métrica partida, así que variar el color
 *  entre ellas sugiere series distintas, que es lo contrario de lo que el
 *  gráfico afirma. El frame las varía y el frame manda para lo visual; si diseño
 *  responde la propuesta, el cambio es un escalón fijo y no toca nada más.
 *
 *  ── DOS COSAS QUE ESTE GRÁFICO NO PUEDE ARREGLAR ───────────────────────────
 *
 *  **`Punto.t` es una cadena libre y nadie garantiza su orden.** El eje común se
 *  arma como unión en orden de primera aparición, así que una serie cuyos `t`
 *  lleguen en otro orden ALARGA el eje en vez de alinearse. No se tapa con un
 *  `sort`, que ordenaría «S10» antes que «S2».
 *
 *  **Y el gráfico no dice cuánto vale el eje.** El dibujo no tiene eje de
 *  valores —ni ticks ni rótulos— y se copia tal cual: lo que se lee es la forma
 *  de cada división y su cifra final. Que la comparación entre divisiones sea
 *  válida depende de la escala compartida, y **eso no se ve en pantalla**.
 */
import { AxisText } from './core/Axis'
import { charsThatFit } from './core/axisGeometry'
import { ceiling, linearScale } from './core/scale'
import { Area, Line } from './core/Series'
import { useSize } from './core/useSize'
import type { FamiliaDeDibujo } from '../types'

export type FacetSeries = { etiqueta: string; puntos: readonly { t: string; v: number }[] }

/** Separación entre divisiones · 202 − 186 en el frame, y la misma en vertical
 *  cuando hay más de una fila. */
const GAP = 16

/** Las dos bandas que la división reserva fuera del dibujo: el rótulo arriba
 *  —alto 16, centro en 8— y la cifra abajo —de 150 a 182—. `alto − 48` es lo que
 *  queda para dibujar, que a 182 da los 134 que el frame usa. */
const BANDA = { rotulo: 16, cifra: 32 } as const

/** La cifra cuelga 18 del riel: centro en 168.2 con el riel en 150. */
const CIFRA_DY = 18

/** El ancho mínimo de una división antes de envolver a otra fila.
 *  **No es un número elegido mirando la pantalla**: es el ancho en el que
 *  `charsThatFit` deja 16 caracteres de rótulo, que es donde un nombre de
 *  división todavía se lee. */
const MIN_FACET = 120

/** Qué escalón de la familia le toca a cada división.
 *
 *  El frame arranca en `-1` y sigue en `-0`; el resto de la rampa completa el
 *  ciclo. Es el mismo arreglo que `PlotTreemap` declara, y por la misma razón:
 *  conservar el arranque que el dibujo eligió sin elegir el hue. */
const RAMPA = [
  1, // `$fam-demanda-1` · la primera división del frame
  0, // `$fam-demanda-0` · la segunda
  2, // la tercera es `$fam-inventario-1` en el frame · otra familia, y no se copia
  3,
  4,
] as const

export type FacetRect = { x: number; y: number; w: number; h: number }

/** El teselado de las divisiones.
 *
 *  **Vive acá y no en `core/` por una restricción de la tanda, no por diseño.**
 *  `cycle`, `cohort`, `calendar` y `matrix` van a pedir exactamente esto, así
 *  que su casa es `core/facets.ts` — está anotado como pendiente. Se exporta
 *  suelta, igual que `squarify` en `PlotTreemap`, porque es aritmética pura y se
 *  prueba sin montar un SVG: un teselado mal repartido se ve prolijo.
 */
export function facetRects(n: number, w: number, h: number): FacetRect[] {
  if (n <= 0 || w <= 0 || h <= 0) return []
  const columns = Math.max(1, Math.min(n, Math.floor((w + GAP) / (MIN_FACET + GAP))))
  const rows = Math.ceil(n / columns)
  const fw = (w - (columns - 1) * GAP) / columns
  const fh = (h - (rows - 1) * GAP) / rows
  return Array.from({ length: n }, (_, i) => ({
    x: (i % columns) * (fw + GAP),
    y: Math.floor(i / columns) * (fh + GAP),
    w: fw,
    h: fh,
  }))
}

/** La cifra de la división · mono 11, `ink`, anclada al borde derecho.
 *
 *  **`AxisText` no sirve y la diferencia no es cosmética**: es mono 10 con
 *  0.12em y en `dim`, que es el contrato de un RÓTULO. El frame pinta la cifra
 *  en `$ink`, a 11 y sin `letterSpacing` — el tracking separa los dígitos y
 *  estas tres cifras existen para compararse entre sí. Es el mismo `<text>`
 *  propio que `PlotColumns` y `PlotLollipop` ya escriben, con la misma razón.
 *
 *  No se exporta: su casa es `core/Axis.tsx`, que es donde vive el contrato
 *  tipográfico restablecido en SVG. Queda anotado como pendiente.
 */
function FigureText({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      dominantBaseline="middle"
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-cifra)',
        fontVariantNumeric: 'tabular-nums',
        fill: 'var(--color-ink)',
      }}
    >
      {children}
    </text>
  )
}

export function PlotSmallMult({
  series,
  family,
  format,
  unit,
}: {
  series: readonly FacetSeries[]
  family: FamiliaDeDibujo
  /** Inyectado · el locale es del tenant y un plot no sabe de qué tenant se
   *  trata. */
  format: (v: number) => string
  /** De la MÉTRICA, no del valor. Es lo que completa el «8.9K u.» del frame.
   *  Sin ella la cifra sale sin unidad y no queda desnuda —el rótulo de la
   *  división es su label—, pero el literal del dibujo no se reproduce. */
  unit?: string
}) {
  const { ref, w, h } = useSize()

  // **El eje es COMÚN a todas las divisiones**, y por eso se arma acá arriba:
  // indexar por posición dentro de cada serie haría que el punto 2 de una
  // división caiga en la x del punto 2 de otra aunque sean meses distintos, y
  // eso se ve perfecto. Es la lección del apilado con otra geometría.
  const eje: string[] = []
  const indice = new Map<string, number>()
  for (const s of series) {
    for (const p of s.puntos) {
      if (indice.has(p.t)) continue
      indice.set(p.t, eje.length)
      eje.push(p.t)
    }
  }

  const rects = facetRects(series.length, w, h)
  const celda = rects[0]

  // **UNA sola `y` y UNA sola `x`, fuera del `.map`.** Que no haya una por
  // división ES la escala compartida; escribirlas acá lo hace estructural en vez
  // de depender de que nadie las mueva adentro.
  const altoDibujo = Math.max(0, (celda?.h ?? 0) - BANDA.rotulo - BANDA.cifra)
  const techo = ceiling(series.flatMap((s) => s.puntos.map((p) => p.v)))
  const y = linearScale([0, techo], [altoDibujo, 0])
  const x = linearScale([0, Math.max(1, eje.length - 1)], [0, celda?.w ?? 0])
  const base = y(0)
  const cap = charsThatFit(celda?.w ?? 0)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && celda !== undefined && (
        <svg width={w} height={h} role="img" aria-label={`${series.length} divisiones`}>
          {rects.map((r, i) => {
            const s = series[i]
            if (s === undefined) return null
            const puntos = s.puntos.map((p) => ({ x: indice.get(p.t) ?? 0, y: p.v }))
            const step = RAMPA[i % RAMPA.length] ?? 1
            const ultimo = s.puntos[s.puntos.length - 1]?.v
            const rotulo = s.etiqueta.length > cap ? `${s.etiqueta.slice(0, cap - 1)}…` : s.etiqueta
            return (
              <g key={`${i}·${s.etiqueta}`} transform={`translate(${r.x},${r.y})`}>
                <AxisText x={0} y={BANDA.rotulo / 2} anchor="start">
                  {rotulo}
                </AxisText>
                <g transform={`translate(0,${BANDA.rotulo})`}>
                  <Area points={puntos} x={x} y={y} base={base} family={family} step={step} />
                  <Line points={puntos} x={x} y={y} family={family} step={step} />
                  {/* El riel de cero. Es papel y no dato —el mismo trato que
                      `Grid` le da a la rejilla—, así que va en `c-grid` y no
                      lleva familia. `Grid` dibuja en los ticks de una escala y
                      acá hace falta una línea sola. */}
                  <line
                    x1={0}
                    x2={r.w}
                    y1={base}
                    y2={base}
                    stroke="var(--color-c-grid)"
                    strokeWidth={1}
                    strokeLinecap="round"
                  />
                </g>
                {ultimo !== undefined && (
                  <FigureText x={r.w} y={BANDA.rotulo + base + CIFRA_DY}>
                    {unit === undefined ? format(ultimo) : `${format(ultimo)} ${unit}`}
                  </FigureText>
                )}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
