/** `prose` · forma `prosa` · colSpan 8–12, rowSpan 3–4 · F1.13g
 *
 *  **Las cifras del pilar llegan ya formateadas del backend, no como números.**
 *  Es el único cuerpo donde eso es correcto: el pilar cita una cifra que ya
 *  aparece en el titular, y reformatearla podría hacer que las dos digan
 *  distinto. Por eso este cuerpo no usa `format` aunque lo reciba.
 */
import { Label } from '../primitives/Label'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY.
 *
 *  **`prose` es de los seis que no son plots**: es cómo el cuerpo dibuja SIN
 *  gráfico —el titular con sus pilares—, y por eso es un valor por defecto de
 *  `prosa`.
 *
 *  **El otro que §5 le da a `prosa` es `reco`, y NO se dibuja acá.** Comparten
 *  forma y no anatomía: `prose` sostiene un titular con tres cifras y `reco`
 *  enumera acciones que alguien aprueba o rechaza. Servir una recomendación como
 *  prosa borraría los botones sin decir nada. */
const DIBUJA = ['prose'] as const

export type ProseParams = {
  /** Cuántos pilares mostrar. El `.pen` usa tres: por encima dejan de sostener
   *  el titular y pasan a competir con él. */
  pilares?: number
}

const DEFAULT_PILLARS = 3

export function ProseBody({ value, params, grafico }: BodyProps<'prosa', ProseParams>) {
  // La comprobación va ANTES de dibujar, no dentro de una rama · mismo idioma
  // que `SeriesBody` y `ForecastBody`: resuelta abajo, la rama que se olvide se
  // ve bien.
  const conocidos: readonly string[] = DIBUJA
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  const pillars = (value.pilares ?? []).slice(0, params.pilares ?? DEFAULT_PILLARS)

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <p className="font-body text-lead leading-cuerpo text-ink m-0">{value.titular}</p>

      {pillars.length > 0 && (
        <div className="flex flex-wrap gap-6 mt-auto">
          {pillars.map((p) => (
            <div key={p.label} className="flex flex-col gap-1 min-w-0">
              <Label>{p.label}</Label>
              <span className="font-body text-cuerpo tabular-nums text-ink">{p.valor}</span>
              {p.nota !== undefined && <Label>{p.nota}</Label>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
