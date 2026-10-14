/** La anatomía obligatoria de §4.1, y la garantía de §5.2 · F1.13e
 *
 *  **UN ESTADO REEMPLAZA EL CUERPO, NUNCA EL SHELL.** Acá está garantizado por
 *  construcción y no por disciplina: el shell pinta título, BASE, procedencia,
 *  dirección y acciones, y lo único que recibe de afuera es lo que va en el slot
 *  del medio. Un estado no puede borrar la cabecera porque no la conoce.
 *
 *  Este componente es la razón de que L5 del lint se pueda verificar buscando un
 *  import: si todo panel pasa por acá, «sin BASE y sin procedencia no se
 *  renderiza» deja de ser una regla que alguien puede olvidar.
 */
import type { ReactNode } from 'react'
import { DegradedBadge } from './DegradedBadge'
import { DegradedNote } from './DegradedNote'
import { MetaInfo } from './MetaInfo'
import { Label } from '../primitives/Label'
import { resolveGovernance, visualState } from '../state'
import { panelStyle, COLUMNS } from '../grid'
import { familyVar } from '../../tokens/tokens'
import type { Formatter } from '../format'
import type { Placement } from '../../catalog/types'
import type { Metric, Payload } from '../../api/types'

type Props = {
  metric: Metric
  payload: Payload
  placement: Placement
  columns?: number
  format: Formatter
  now: Date
  onDrill?: () => void
  /** «Preguntar» · §4.1 pone las acciones en el shell, no en el cuerpo. El
   *  overlay del chat es F3.1; acá vive solo el disparador, que es lo que
   *  F1.9 pide emitir hacia arriba. */
  onChat?: () => void
  onCollapse?: () => void
  children: ReactNode
}

export function PanelShell({
  metric,
  payload,
  placement,
  columns = COLUMNS,
  format,
  now,
  onDrill,
  onChat,
  onCollapse,
  children,
}: Props) {
  const state = visualState(payload)
  const governance = resolveGovernance(metric, payload)

  return (
    <section
      className={[
        'flex flex-col gap-4 min-w-0 rounded-xl border p-6 bg-panel',
        // El bloqueado se distingue por el borde y no por un fondo de color:
        // un panel teñido compite con los datos de sus vecinos.
        state === 'BLOQUEADO' ? 'border-w4' : 'border-w2',
      ].join(' ')}
      style={panelStyle(placement, columns)}
      aria-label={metric.nombre}
    >
      {/* ── LA CABECERA ES UNA LÍNEA · 2026-10-06 ──────────────────────────────
          Título a lo ancho, y a la derecha el estado y el ⓘ. **La BASE y la
          procedencia se fueron a `MetaInfo`** por decisión humana, contra las
          reglas 8 y 9 de `design.md`: ver la cabecera de ese archivo, que dice
          qué se midió y qué se eligió.

          Con eso se cae lo que esta cabecera arrastraba desde el 2026-09-24
          —el piso de 128px del título, el reparto con una meta de tres
          líneas— y también la variante compacta de la cabecera: §6.1 apilaba la
          meta bajo el título porque no entraban en una línea, y sin meta
          visible entran siempre.

          **El título envuelve en vez de truncar**, que es lo que §6.1 pide para
          los dos shells: «el peor caso es feo, nunca ilegible». Con el ancho
          entero, envolver es raro; truncar era lo normal. */}
      <header className="flex items-start gap-2">
        {/* La familia se LEE del catálogo, nunca se elige acá · regla dura 1.
            Va como estilo en línea y no como utilidad porque el nombre de la
            familia llega en runtime desde el catálogo: Tailwind no puede
            generar una clase que su escáner nunca vio. Es el mismo motivo por
            el que `tokens.css` necesita `@theme static`. */}
        <span
          className="w-2 h-2 rounded-xs shrink-0 mt-2"
          style={{ background: familyVar(metric.familia) }}
          aria-hidden
        />
        {/* h2 y no h3: el único nivel por encima es el h1 de la pregunta de la
            pestaña, y saltarse un nivel rompe la navegación por encabezados,
            que es como se recorre una pantalla de doce paneles con un lector. */}
        <h2 className="flex-1 min-w-0 font-display text-titulo tracking-titulo leading-titulo text-ink m-0">
          {metric.nombre}
        </h2>
        {/* El degradado NO se esconde: es estado, no procedencia. */}
        {state === 'DEGRADADO' && <DegradedBadge>Degradado</DegradedBadge>}
        <MetaInfo
          base={governance.base}
          ventana={governance.ventana}
          capa={governance.capa}
          fuente={governance.fuente}
          frescura={governance.frescura}
          format={format}
          now={now}
        />
      </header>

      {/* La limitación del degradado · §8 pide que el badge «declare la
          limitación y su alcance», y el alcance es el texto de `razon`. Va
          entre la cabecera y el cuerpo porque es del shell —el degradado no
          reemplaza el cuerpo— y porque una frase necesita el ancho entero. */}
      {state === 'DEGRADADO' && 'razon' in payload && (
        <DegradedNote reason={payload.razon} unblockedBy={payload.desbloqueaCon} />
      )}

      {/* El slot. `min-h-0` es lo que impide que un cuerpo alto estire el panel
          por encima de su `rowSpan` y rompa la fila entera. */}
      <div className="flex-1 min-h-0">{children}</div>

      <footer className="flex items-center justify-between gap-2">
        {/* La dirección semántica solo si la métrica la declara: §1.3 la exige
            en las compuestas, y ponerla donde no aplica la vacía de sentido. */}
        {metric.direccionSemantica != null ? <Label>{metric.direccionSemantica}</Label> : <span />}

        <div className="flex items-center gap-1">
          {onDrill !== undefined && (
            <button
              type="button"
              onClick={onDrill}
              className="flex items-center gap-1 font-mono text-label tracking-rotulo uppercase text-acc hover:text-acc-hover cursor-pointer bg-transparent border-0 p-0"
            >
              Ver detalle
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          )}
          {onChat !== undefined && (
            <button
              type="button"
              onClick={onChat}
              // Mismo motivo que el CTA de la barra · F3.15: tres botones dicen
              // «Preguntar» en la misma pantalla. Éste ya está agrupado bajo el
              // `aria-label` del panel, y nombrarlo igual lo vuelve inequívoco
              // también fuera de ese grupo.
              aria-label={`Preguntar sobre ${metric.nombre}`}
              className="font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0"
            >
              Preguntar
            </button>
          )}
          {onCollapse !== undefined && (
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Colapsar panel"
              className="text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          )}
        </div>
      </footer>
    </section>
  )
}
