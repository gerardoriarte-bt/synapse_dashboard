/** Barra de avance contra objetivo · forma `escalar` · §PEN:Plot/BULLET · Avance contra objetivo
 *
 *  **Lo que este gráfico existe para mostrar es el DESBORDE**, y es lo que lo
 *  separa del arco. `PlotGauge` clampea a 1 —`Math.min(1, …)`—, así que un 103 %
 *  y un 100 % dibujan el mismo arco cerrado y la diferencia sólo vive en la
 *  cifra. Acá la barra pasa la marca, que es exactamente lo que el dibujo hace.
 *
 *  ── LO QUE DICE EL DIBUJO, MEDIDO NODO POR NODO ─────────────────────────────
 *
 *  Frame 580×208, cuatro filas en y = 7, 53, 99, 145. **El plot dibuja UNA**:
 *  `escalar` trae un número y un panel se ancla a un `metricId`; las cuatro del
 *  `.pen` son cuatro métricas distintas —VENTAS, ÓRDENES, ROAS, INVERSIÓN, cada
 *  una con su familia—. Es el mismo precedente que `Plot/INTERVALO`.
 *
 *  Por fila: riel de 92 → 432 = **340 px, y ese ancho ES el objetivo**; alto 22,
 *  `cornerRadius` 2. Encima la barra de medida de alto 12 en y + 5, con anchos
 *  350,2 · 329,8 · 323 · 326,4 = 340 × 1,03 / 0,97 / 0,95 / 0,96 — **el
 *  porcentaje impreso al lado, sin redondeo intermedio**. La de 103 % termina en
 *  442,2: diez píxeles **después** del riel. Y la marca es `M432 4 l0 28`, o sea
 *  vertical en el extremo del riel, 3 px por encima y 3 por debajo, `$ink` de
 *  2,4 con tapa redonda.
 *
 *  **Las dos franjas son `$w1` las DOS, superpuestas** —340 y 272, y 272/340 es
 *  0,80 exacto—. `$w1` es un wash con alfa, así que superponerlas oscurece el
 *  tramo 0–80 %: son dos rangos cualitativos, no un rect dibujado dos veces.
 *
 *  ── LO QUE EL DIBUJO NO TIENE Y ESTÁ DECLARADO ──────────────────────────────
 *
 *  **`HEADROOM` es una decisión, no un número del `.pen`.** Allá el lienzo es
 *  fijo y la barra de 103 % puede desbordar el riel porque todavía le sobran
 *  147 px hasta el borde; acá el `<svg>` recorta a su viewport, así que con el
 *  objetivo en `W` la barra se cortaría **justo en la marca** y el desborde —lo
 *  único que este gráfico existe para mostrar— desaparecería sin avisar. El aire
 *  entre la marca y la cifra da ~13,5 % del riel en el dibujo; 15 % queda apenas
 *  por encima. Es la misma clase de divergencia declarada que el `0.75` de
 *  `envelope`.
 *
 *  **La marca queda en x fija sin importar el valor.** Es lo que hace
 *  comparables dos paneles y lo que el dibujo muestra: las cuatro filas
 *  comparten x = 432 con cuatro avances distintos. Escalar el dominio contra
 *  `Math.max(v, objetivo)` se vería bien y mentiría en cada fila.
 *
 *  **Y no escribe una línea de texto.** El rótulo, la cifra y el «N % DEL
 *  OBJETIVO» los compone el cuerpo con `Label`, `Value` y `Note` — la regla que
 *  `PlotInterval` ya dejó escrita: un plot que escriba sus propios rótulos se
 *  saltea los primitivos y «ningún número desnudo» deja de ser verificable en un
 *  solo lugar.
 */
import { useSize } from './core/useSize'
import { hue } from './core/seriesColor'
import type { PlotProps } from '../types'

/** Alto del riel · 22 en el `.pen`. */
const RAIL = 22
/** Alto de la barra de medida · 12, centrada en el riel (y + 5). */
const BAR = 12
/** Cuánto sobresale la marca del riel · `M432 4 l0 28` contra un riel de 7 a 29. */
const OVERHANG = 3
/** El corte de la franja cualitativa interior · 272 / 340 = 0,80 exacto. */
const QUALITATIVE = 0.8
/** El aire reservado DESPUÉS de la marca, para que un sobrecumplimiento se vea
 *  en vez de quedar recortado por el viewport. Ver la cabecera: es nuestro. */
const HEADROOM = 0.15
/** `--radius-xs` · §ANCLA:RADIO-1. En SVG el radio va como número, así que el 2
 *  se repite acá con el mismo comentario que `BAR_RADIUS` en `core/Series`. */
const R = 2

export function PlotBullet({
  value,
  objetivo,
  family,
  format,
}: PlotProps<'escalar'> & {
  /** **Viaja aparte porque el contrato no lo trae en el valor.** `ValorEscalar`
   *  es `{ forma, v }` y nada más: el denominador lo declara el layout en
   *  `opciones.maximo`, que es la misma razón por la que `PlotGauge` recibe
   *  `max` suelto. El cuerpo ya garantizó que es mayor que cero. */
  objetivo: number
}) {
  const { ref, w, h } = useSize()

  // La marca no se mueve con el valor: el objetivo SIEMPRE cae acá.
  const targetX = w / (1 + HEADROOM)
  const y = Math.max(0, (h - RAIL) / 2)

  // `Math.max(0, …)` es la misma trampa que `PlotComposition` y `PlotInterval`
  // ya anotan: un ancho negativo hace desaparecer el rect entero sin avisar.
  // El `Math.min(w, …)` sólo actúa por encima del 115 %, y de ahí para arriba el
  // exceso lo dice la cifra — mismo criterio que el medidor de `KpiBody`.
  const bar = Math.min(w, Math.max(0, (targetX * value.v) / objetivo))

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          // Distinto del de `PlotGauge` —`${format(value)} de ${format(max)}`—
          // para que una prueba pueda afirmar CUÁL de las dos geometrías se
          // montó. Con el mismo nombre, olvidar el despacho se ve perfecto.
          aria-label={`Avance contra objetivo · ${format(value.v)} de ${format(objetivo)}`}
        >
          {/* Las dos franjas cualitativas. Superpuestas, porque `$w1` es un wash
              con alfa y el tramo 0–80 % se lee más oscuro. */}
          <rect x={0} y={y} width={targetX} height={RAIL} rx={R} fill="var(--color-w1)" />
          <rect
            x={0}
            y={y}
            width={QUALITATIVE * targetX}
            height={RAIL}
            rx={R}
            fill="var(--color-w1)"
          />
          <rect
            x={0}
            y={y + (RAIL - BAR) / 2}
            width={bar}
            height={BAR}
            rx={R}
            fill={hue({ family })}
          />
          {/* El umbral. **No lleva familia**: un objetivo no es una serie, y
              pintarlo con el hue se leería como una segunda medida. Falta una
              primitiva `core/Reference` —`tornado`, `pareto` y `waterfall` la
              piden igual—; `core/Grid` es lo contrario (1px, `c-grid`,
              `aria-hidden`: la rejilla es papel, un umbral es dato). */}
          <line
            x1={targetX}
            x2={targetX}
            y1={y - OVERHANG}
            y2={y + RAIL + OVERHANG}
            stroke="var(--color-ink)"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  )
}
