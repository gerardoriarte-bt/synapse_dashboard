/** `kpi` · forma `escalar` · colSpan 3–4, rowSpan 3–4 · F1.13g */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { hue } from '../plots/core/seriesColor'
import type { BodyProps } from '../types'

export type KpiParams = {
  /** Qué dice el label sobre la cifra. El `.pen` mete ahí la unidad —«USD ·
   *  TOTAL»— en vez de pegarla al número. */
  label?: string
  /** Comparaciones contra otro período. El signo comunica dirección; el color
   *  no, que es la regla dura 3. */
  comparativo?: { label: string; delta: number; unidad?: string }[]
  /** Avance contra un objetivo. `nota` explica qué es el 100%. */
  medidor?: { label: string; porcentaje: number; nota?: string }
}

const FULL = 100

export function KpiBody({ value, params, family, unit, format }: BodyProps<'escalar', KpiParams>) {
  const { comparativo = [], medidor, label = 'Total' } = params

  // La unidad va en la cifra SOLO si el label no la lleva ya. El `.pen` escribe
  // «USD · TOTAL» arriba y «12.4M» abajo, y no por gusto: a 44px «USD 4.28M» no
  // entra en un panel de colSpan 3 y parte en dos líneas.
  const unitInLabel = unit !== undefined && label.toUpperCase().includes(unit.toUpperCase())
  const figure = format.number(value.v, { abbreviate: true })

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <Value label={label} size="kpi">
        {unitInLabel ? figure : format.withUnit(figure, unit)}
      </Value>

      {medidor !== undefined && (
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <Label>{medidor.label}</Label>
            <Label>{`${format.number(medidor.porcentaje, { decimals: 0 })}%`}</Label>
          </div>
          <div className="h-1 rounded-xs bg-w2 overflow-hidden">
            <div
              className="h-full rounded-xs"
              style={{
                // Por encima de 100 la barra se llena, no se desborda: el exceso
                // ya lo dice la cifra de arriba.
                width: `${Math.min(FULL, Math.max(0, medidor.porcentaje))}%`,
                // La familia llega del catálogo y el cuerpo no sabe cuál es
                // · regla dura 1.
                background: hue({ family }),
              }}
            />
          </div>
          {medidor.nota !== undefined && <Label>{medidor.nota}</Label>}
        </div>
      )}

      {comparativo.length > 0 && (
        <div className="flex flex-col gap-1 mt-auto">
          {comparativo.map((c) => (
            <div key={c.label} className="flex items-baseline justify-between gap-2">
              <Label>{c.label}</Label>
              {/* El delta va en texto y en color neutro · regla dura 3: el signo
                  comunica la dirección, y prohibido verde/rojo semántico. */}
              <Label>{format.delta(c.delta, { decimals: 1 }) + (c.unidad ?? '%')}</Label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
