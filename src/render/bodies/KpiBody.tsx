/** `kpi` · forma `escalar` · colSpan 3–4, rowSpan 3–4 · F1.13g */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { hue } from '../plots/core/seriesColor'
import type { BodyProps } from '../types'

/** **Interruptores, no datos** · F1.40.
 *
 *  Hasta hoy acá vivían `label`, `comparativo` y `medidor` con su CONTENIDO, y
 *  eso contradecía al contrato: `Presentacion` los declara en el payload y dice
 *  por qué —«el medidor marca 61% este mes y otra cosa el siguiente»—. Con los
 *  rótulos en el layout, la cifra cambiaba de mes y el rótulo no.
 *
 *  Lo que queda son los dos interruptores que el layout sí decide: si este panel
 *  compone medidor y comparativo. **Ausente = se muestra lo que el payload
 *  traiga**; solo un `false` explícito lo oculta. Con `true` y sin dato en el
 *  payload no se pinta nada, que es lo correcto: el interruptor dice «acá va»,
 *  no «inventá uno». */
export type KpiParams = {
  medidor?: boolean
  comparativo?: boolean
}

const FULL = 100

export function KpiBody({
  value,
  params,
  presentation,
  family,
  unit,
  format,
}: BodyProps<'escalar', KpiParams>) {
  // **El rótulo y las cifras de apoyo salen del PAYLOAD** · F1.40. Del layout
  // salen solo los interruptores.
  const label = presentation?.label ?? 'Total'
  const medidor = params.medidor === false ? undefined : presentation?.medidor
  const comparativo = params.comparativo === false ? [] : (presentation?.comparativo ?? [])

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
