/** El selector de período · F1.7
 *
 *  **Agrupa por `grano` y deshabilita lo que la pestaña no puede contestar.**
 *  Verificado contra Snowflake: las métricas de marca son mensuales
 *  —`BR_MONTH_TD`, `REPORT_MONTH`— y las de ecommerce diarias. Con el selector
 *  en una semana, una pestaña de marca no tiene nada que mostrar.
 *
 *  Decisión del 2026-08-19: **la métrica lo declara y el selector deshabilita lo
 *  que no aplica, con la razón visible.** Ofrecer un período que la métrica no
 *  puede contestar es el mismo problema que un panel sin BASE: promete algo que
 *  no puede cumplir.
 */
import { Label } from '../../render/primitives/Label'
import { GRAINS, GRAIN_LABEL, coarsestRequired, grainOf } from './periodGrain'
import type { Metric, Period } from '../../api/types'

type Props = {
  periods: readonly Period[]
  activeId: string | undefined
  /** Las métricas de la pestaña activa. De acá sale qué granos son ofrecibles. */
  metrics: readonly Metric[]
  onSelect: (id: string) => void
}

export function PeriodPicker({ periods, activeId, metrics, onSelect }: Props) {
  const required = coarsestRequired(metrics)
  const requiredIndex = GRAINS.indexOf(required)

  const byGrain = GRAINS.map((grain) => ({
    grain,
    // Un grano más fino que el que exige la pestaña no se puede contestar.
    usable: GRAINS.indexOf(grain) <= requiredIndex,
    items: periods.filter((p) => grainOf(p) === grain),
  })).filter((g) => g.items.length > 0)

  if (byGrain.length === 0) return null

  return (
    <div className="flex items-start gap-4">
      {byGrain.map(({ grain, usable, items }) => (
        <div key={grain} className="flex flex-col gap-1">
          <Label>{GRAIN_LABEL[grain]}</Label>
          <div className="flex items-center gap-1">
            {items.map((p) => {
              const active = p.id === activeId
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!usable}
                  onClick={() => onSelect(p.id)}
                  aria-current={active ? 'true' : undefined}
                  title={
                    usable
                      ? (p.rango ?? p.etiqueta)
                      : `Esta pestaña no se puede leer por ${GRAIN_LABEL[grain].toLowerCase()}: alguna de sus métricas se mide por ${required}`
                  }
                  className={[
                    'font-mono text-label tracking-rotulo uppercase rounded-md px-2 py-1',
                    'bg-transparent border-0',
                    usable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                    active ? 'text-acc' : 'text-dim hover:text-ink',
                  ].join(' ')}
                >
                  {p.etiqueta}
                </button>
              )
            })}
          </div>
          {!usable && (
            // §8: se declara la razón. Un control deshabilitado sin explicación
            // es peor que uno ausente — el usuario no sabe si es un permiso, un
            // error o una limitación del dato.
            <Label>{`No aplica · alguna métrica se mide por ${required}`}</Label>
          )}
        </div>
      ))}
    </div>
  )
}
