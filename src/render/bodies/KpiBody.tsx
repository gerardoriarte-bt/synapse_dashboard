/** `kpi` · forma `escalar` · colSpan 3–4, rowSpan 3–4 · F1.13g */
import { Label } from '../primitives/Label'
import { Value } from '../primitives/Value'
import { hue } from '../plots/core/seriesColor'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY.
 *
 *  **`kpi` es de los seis que no son plots**: es cómo el cuerpo dibuja SIN
 *  gráfico —la cifra grande—, y por eso es también el valor por defecto de
 *  `escalar`. Declararlo no es redundante: hace que pedirlo explícitamente y no
 *  pedir nada dibujen lo mismo, que es lo único coherente.
 *
 *  Los otros cuatro de `escalar` —`gauge`, `bullet`, `rings`, `spark`— se
 *  declaran. **El medidor de `presentation` no es `gauge`**: es una barra de
 *  progreso que acompaña a la cifra, y el arco lo dibuja `GaugeBody`. */
const DIBUJA = ['kpi'] as const

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
/** Hasta dónde se reescala el riel cuando la cifra pasa la meta. Más allá, el
 *  marcador quedaría tan a la izquierda que el riel dejaría de leerse como
 *  «cuánto de la meta»: se llena entero y el número dice cuánto. */
const TOPE_DE_ESCALA = 200

export function KpiBody({
  value,
  params,
  presentation,
  family,
  grafico,
  unit,
  format,
}: BodyProps<'escalar', KpiParams>) {
  // La comprobación va ANTES de dibujar, no dentro de una rama · mismo idioma
  // que `SeriesBody` y `ForecastBody`: resuelta abajo, la rama que se olvide se
  // ve bien.
  const conocidos: readonly string[] = DIBUJA
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

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
          <Medidor porcentaje={medidor.porcentaje} family={family} />
          {medidor.nota !== undefined && <Label>{medidor.nota}</Label>}
        </div>
      )}

      {comparativo.length > 0 && (
        <div className="flex flex-col gap-1 mt-auto">
          {comparativo.map((c) => (
            <div key={c.label} className="flex items-baseline justify-between gap-2">
              {/* **Parcial cuando el mes está abierto** · F5.22: el delta es del
                  servicio y compara contra un período completo. Se dice al lado,
                  no se esconde ni se recalcula. */}
              <Label>{c.parcial === true ? `${c.label} · mes incompleto` : c.label}</Label>
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

/** **El riel del medidor, con el 100 % marcado** · EV-008 de la evaluación de
 *  UX, 2026-11-10: «153 % de la meta con una barra simplemente llena, sin
 *  marcar el 100 %».
 *
 *  **El marcador es del `.pen`, no un agregado**: `Panel/Medidor` dibuja un
 *  `Marker` de 2 × 11 en tinta al final del riel, y un riel de 7 de alto. Al
 *  portarlo quedaron afuera los dos —el riel medía 4 y no había marcador—.
 *
 *  **Pasada la meta, el riel se reescala** hasta `TOPE_DE_ESCALA`, para que el
 *  marcador quede a la vista y el excedente se vea como un tramo aparte, en
 *  otro escalón de la misma familia: el color sigue saliendo del catálogo
 *  (regla dura 1). El dibujo no dice qué hacer por encima de 100; va en la
 *  PROPUESTA del 2026-11-10. */
function Medidor({ porcentaje, family }: { porcentaje: number; family: string }) {
  const p = Math.max(0, porcentaje)
  const escala = Math.min(TOPE_DE_ESCALA, Math.max(FULL, p))
  const meta = (FULL / escala) * FULL
  const lleno = (Math.min(p, escala) / escala) * FULL
  const enMeta = Math.min(lleno, meta)
  return (
    <div className="relative h-2.75 flex items-center">
      <div className="relative w-full h-1.75 rounded-xs bg-w2 overflow-hidden">
        <div
          data-tramo="hasta-la-meta"
          className="absolute inset-y-0 left-0"
          // La familia llega del catálogo y el cuerpo no sabe cuál es · regla dura 1.
          style={{ width: `${String(enMeta)}%`, background: hue({ family }) }}
        />
        {lleno > meta && (
          <div
            data-tramo="excedente"
            className="absolute inset-y-0"
            style={{ left: `${String(meta)}%`, width: `${String(lleno - meta)}%`, background: hue({ family, step: 3 }) }}
          />
        )}
      </div>
      <div
        data-marca="meta"
        aria-hidden
        className="absolute inset-y-0 w-0.5 bg-ink -translate-x-1/2"
        style={{ left: `${String(meta)}%` }}
      />
    </div>
  )
}
