/** Micro tendencia · `spark` sobre `serieTemporal` · §PEN:Plot/MICRO TENDENCIA
 *
 *  ── LO QUE DICE EL DIBUJO, MEDIDO NODO POR NODO ─────────────────────────────
 *
 *  El frame mide 580×200 y dibuja **cuatro filas** —VENTAS, ROAS, CONVERSIÓN,
 *  COBERTURA—, cada una con su label mono a la izquierda, su sparkline al
 *  medio, su cifra y su delta. Las reglas separadoras caen en y = 60, 108, 156 y
 *  204: **paso 48**, y la cuarta se sale del alto del frame.
 *
 *  **Las cuatro filas son cuatro FAMILIAS distintas** —`$fam-demanda-1`,
 *  `$fam-medios-1`, `$fam-cliente-1`, `$fam-inventario-1`—, así que lo que el
 *  frame muestra es este plot instanciado cuatro veces dentro del panel que lo
 *  hospeda, **no un plot que dibuja cuatro series**: un panel se ancla a UN
 *  `metricId` y recibe UNA familia del catálogo. Acá se construye UNA fila.
 *
 *  Tomando cada fila como la franja que termina en su regla —alto 48— las
 *  cuatro coinciden en coordenadas locales, y eso es lo que las vuelve una
 *  regla y no cuatro números:
 *
 *  │ techo de la banda      │  2 │ piso de la banda │ 32 │
 *  │ base del relleno       │ 36 │ regla            │ 48 │
 *
 *  **La banda mide 30px en las cuatro**, con datos de magnitudes que no tienen
 *  nada que ver entre sí: fila 1 recorre y 14→44, fila 2 62→92, fila 3 110→140,
 *  fila 4 158→188. Comprobado sumando los `dy` de cada `geometry`.
 *
 *  ── DE AHÍ SALE LO ÚNICO QUE HAY QUE ENTENDER DE ESTE GRÁFICO ───────────────
 *
 *  **El dominio es `[min, max]` de su PROPIA serie, no `[0, techo]`.** Treinta
 *  píxeles exactos con cuatro magnitudes distintas sólo se explican si cada
 *  spark se escala contra sí mismo. Es lo único que distingue un sparkline de un
 *  área chica, y por eso `ceiling` —que todos los demás plots llaman y que
 *  siempre parte de cero— **no se usa acá**. Con `ceiling` el gráfico se ve
 *  perfecto y miente: una serie que se mueve entre 100 y 102 queda plana.
 *
 *  La base del relleno queda **4px por debajo del punto más bajo** (fila 1:
 *  mínimo en 44, cierre en 48), no en el mínimo.
 *
 *  Horizontal, sobre los 560px de contenido: el spark va de x 152 a 400 —248 de
 *  ancho, doce puntos y once tramos de ~22.55— y el punto final cae **sobre el
 *  último punto de la serie**, comprobado en las cuatro (e13 en (400, 14), que
 *  es el último de p6).
 *
 *  ── LO QUE ESTE COMPONENTE **NO** DIBUJA, Y POR QUÉ ─────────────────────────
 *
 *  El plot es SVG y **no dibuja texto**. El label de la fila es el nombre de la
 *  métrica, que el shell del panel ya pinta como título; la cifra y el delta
 *  salen de `presentation` —`label`, `comparativo`—, que `PlotProps` no recibe.
 *  Recalcular el delta desde la serie sería una cifra NUESTRA que puede
 *  contradecir la que el backend redactó. **Declarado como divergencia.**
 *
 *  La regla separadora tampoco: separa filas, y acá hay una sola.
 *
 *  ── TRES DIVERGENCIAS MÁS, DECLARADAS Y NO RESUELTAS EN SILENCIO ────────────
 *
 *  1 · **El relleno del `.pen` es OPACO** —los cuatro `path` de relleno no
 *      declaran `fillOpacity`— y `Area` rellena al 0.16. Subirlo es tocar un
 *      archivo compartido que usa `PlotSeries`, así que se acepta el 0.16.
 *  2 · **El trazo del dibujo es de 2px** y `Line` lo fija en 1.5. Mismo caso y
 *      mismo antecedente que `PlotControl`, que leyó 2 y aceptó el 1.5.
 *  3 · **Las cuatro familias de la tarjeta.** La familia se lee del catálogo y
 *      nunca se elige en el componente · regla dura 1.
 *
 *  ── Y UNA COSA QUE NO SE USA A PROPÓSITO ────────────────────────────────────
 *
 *  **`Punto.t` no se toca**, y por eso el cambio de formato no lo afectó. Llegaba
 *  como días desde epoch en una cadena —`"20362"`— y desde `c8b9247` llega en ISO
 *  —`"2026-09-01"`—; este plot no tiene eje X, así que la `x` sale del ÍNDICE
 *  del punto, igual que en `PlotSeries`. Eso asume **puntos equiespaciados**,
 *  que es lo que el frame dibuja —once tramos idénticos— y lo que el resto del
 *  repertorio ya asume. Con puntos irregulares el dibujo mentiría sobre el
 *  ritmo, y eso no se arregla hasta que `t` sea interpretable.
 */
import { useSize } from './core/useSize'
import { linearScale } from './core/scale'
import { Area, Dots, Line } from './core/Series'
import type { PlotProps } from '../types'

/** El radio del punto final (3.5, el de `Dots` sin `r`) más medio trazo. Sin
 *  este aire el punto se recorta contra el borde derecho. Coincide con los 4px
 *  que el frame deja entre el mínimo dibujado y la base del relleno. */
const INSET = 4

/** La proporción de la banda del `.pen`: 248 de ancho por 30 de alto. */
const RATIO = 248 / 30

/** El piso de la banda. Por debajo de esto el sparkline deja de tener forma. */
const MIN_BAND = 12

export function PlotSpark({ value, family, format }: PlotProps<'serieTemporal'>) {
  const { ref, w, h } = useSize()

  const puntos = value.puntos
  const last = puntos[puntos.length - 1]

  const values = puntos.map((p) => p.v)
  const min = Math.min(...values)
  const max = Math.max(...values)

  // **La banda se TOPA, no llena la caja.** Un sparkline estirado a los 200px de
  // un `rowSpan` 4 deja de ser un sparkline y se vuelve indistinguible de
  // `area` — que es el modo de falla que `UnknownPlotState` existe para
  // impedir, con otra cara.
  const band = Math.max(MIN_BAND, Math.min(h - 2 * INSET, w / RATIO))
  // Centrada. El frame apoya la banda contra su regla; con una sola fila no hay
  // regla contra qué apoyar, y centrar es la elección neutra.
  const top = (h - band) / 2

  const x = linearScale([0, Math.max(1, puntos.length - 1)], [INSET, w - INSET])
  // Invertida: la y del SVG crece hacia abajo.
  //
  // **El caso plano no es decorativo.** `linearScale` con ancho de dominio 0
  // devuelve `r0` para todo, o sea el PISO de la banda: una serie sin
  // movimiento se leería como una métrica clavada en su mínimo histórico. Con
  // `[min-1, max+1]` cae exacto en el centro.
  const y = linearScale(max === min ? [min - 1, max + 1] : [min, max], [top + band, top])

  const points = puntos.map((p, i) => ({ x: i, y: p.v }))

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && puntos.length >= 2 && last !== undefined && (
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`Micro tendencia · ${puntos.length} puntos · último ${format(last.v)}`}
        >
          <Area points={points} x={x} y={y} base={top + band + INSET} family={family} />
          <Line points={points} x={x} y={y} family={family} />
          {/* **Sin `r`, y no es un detalle:** `Dots` aplica `fillOpacity` 0.55
              cuando el radio viene y 1 cuando no, así que pasarle el 3.6 del
              frame daría un punto translúcido. Sin `r` da 3.5 opaco — 0.1px de
              diferencia contra el dibujo a cambio de la opacidad correcta. */}
          <Dots
            points={[{ x: puntos.length - 1, y: last.v, k: 'last' }]}
            x={x}
            y={y}
            family={family}
          />
        </svg>
      )}
    </div>
  )
}
