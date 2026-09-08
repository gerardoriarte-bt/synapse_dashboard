/** Los ejes · F1.13a */
import { charsThatFit } from './axisGeometry'
import type { BandScale, LinearScale } from './scale'

/** DESVIACIÓN DECLARADA · §6.2 dice «ejes con ticks y labels en `<Label>`».
 *  `<Label>` renderiza un `<span>` y dentro de un `<svg>` no hay HTML, así que
 *  el rótulo de eje es un `<text>` que reproduce el mismo contrato tipográfico:
 *  mono 10, 0.12em, mayúsculas, `dim`. Es la misma regla por otro medio.
 *
 *  L15 del lint no lo ve como `<Label>` y por eso `render/plots/core/` está
 *  excluido de su ámbito — la exclusión está declarada en `design-lint.py`, no
 *  es un olvido. */
const TYPOGRAPHY = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.12em',
  fill: 'var(--color-dim)',
} as const

export function AxisText({
  x,
  y,
  anchor = 'middle',
  children,
}: {
  x: number
  y: number
  anchor?: 'start' | 'middle' | 'end'
  children: string
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="middle" style={TYPOGRAPHY}>
      {children.toUpperCase()}
    </text>
  )
}

export function CategoryAxis({
  scale,
  side,
  at,
  width,
}: {
  scale: BandScale
  /** `left` para barras horizontales, `bottom` para columnas. */
  side: 'left' | 'bottom'
  at: number
  /** El ancho disponible para la etiqueta, en píxeles. El recorte se calcula de
   *  acá: un tope fijo en caracteres se sale por la izquierda en cuanto el panel
   *  se angosta. */
  width: number
}) {
  const cap = charsThatFit(width)
  return (
    <g aria-hidden>
      {scale.domain.map((k) => {
        const center = scale(k) + scale.bandwidth / 2
        const text = k.length > cap ? `${k.slice(0, cap - 1)}…` : k
        return side === 'left' ? (
          <AxisText key={k} x={at} y={center} anchor="end">
            {text}
          </AxisText>
        ) : (
          <AxisText key={k} x={center} y={at} anchor="middle">
            {text}
          </AxisText>
        )
      })}
    </g>
  )
}

export function ValueAxis({
  scale,
  side,
  at,
  format,
  count = 4,
}: {
  scale: LinearScale
  side: 'bottom' | 'left'
  /** La coordenada fija del eje: la `y` si va abajo, la `x` si va a la izquierda. */
  at: number
  /** Inyectado · F1.13b. Un plot no formatea por su cuenta: el locale es del
   *  tenant y un plot no sabe de qué tenant se trata. */
  format: (v: number) => string
  count?: number
}) {
  return (
    <g aria-hidden>
      {scale.ticks(count).map((v, i, all) =>
        side === 'bottom' ? (
          // El primero y el último se anclan hacia adentro: centrados se salían
          // medio rótulo por cada borde del plot.
          <AxisText
            key={v}
            x={scale(v)}
            y={at}
            anchor={i === 0 ? 'start' : i === all.length - 1 ? 'end' : 'middle'}
          >
            {format(v)}
          </AxisText>
        ) : (
          <AxisText key={v} x={at} y={scale(v)} anchor="end">
            {format(v)}
          </AxisText>
        ),
      )}
    </g>
  )
}
