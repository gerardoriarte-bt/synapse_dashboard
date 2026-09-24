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
import { Label } from '../primitives/Label'
import { DegradedBadge } from './DegradedBadge'
import { Provenance } from './Provenance'
import { resolveGovernance, visualState } from '../state'
import { panelStyle, COLUMNS } from '../grid'
import { familyVar } from '../../tokens/tokens'
import type { Formatter } from '../format'
import type { Placement } from '../../catalog/types'
import type { Metric, Payload } from '../../api/types'

/** Debajo de este colSpan la anatomía no entra en una línea y el shell apila la
 *  meta bajo el título · §4.1. Es una VARIANTE del mismo componente, no otro
 *  componente: misma información, otro reparto. */
const COMPACT_UP_TO = 4

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

  // El compacto también depende del colapso: a una columna TODO panel es
  // angosto, sin importar el colSpan que declare.
  const effectiveSpan = Math.min(placement.colSpan, columns)
  const compact = effectiveSpan <= COMPACT_UP_TO

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
      {/* **El título tiene PISO y la meta cede** · corregido el 2026-09-24.
          §PEN:§6 dibuja el `Título` con `width: fill_container` y la `Meta`
          abrazando su contenido, y así estaba escrito: `min-w-0` a la izquierda
          y `shrink-0` a la derecha. Con el texto del dibujo funciona.

          **Con la gobernanza real no.** El día que el catálogo salió de
          Snowflake, la BASE de un panel pasó a medir tres veces más —«Venta,
          visitas e inversión de cada día, sin agregar · GOLD · Reporte diario
          de ecommerce del cliente · …»— y como la meta no cedía, el título se
          encogió a cero: `truncate` sobre una caja de ancho cero no pinta ni
          una letra. **El panel se quedó sin nombre y nadie lo vio hasta
          abrirlo con datos del negocio.**

          El dibujo no puede expresar «abrazá, pero no más de esto», así que la
          regla la pone el producto: **el nombre del panel es su identidad y la
          BASE es contexto**. El título no baja de `min-w-32` —128px, de la
          escala de espaciado— y la meta se achica y envuelve. La BASE sigue
          entera, que es regla dura: no se trunca, se acomoda. */}
      <header className={compact ? 'flex flex-col gap-2' : 'flex items-start justify-between gap-4'}>
        <div className={compact ? 'flex items-center gap-2 min-w-0' : 'flex items-center gap-2 min-w-32 flex-1'}>
          {/* La familia se LEE del catálogo, nunca se elige acá · regla dura 1.
              Va como estilo en línea y no como utilidad porque el nombre de la
              familia llega en runtime desde el catálogo: Tailwind no puede
              generar una clase que su escáner nunca vio. Es el mismo motivo por
              el que `tokens.css` necesita `@theme static`. */}
          <span
            className="w-2 h-2 rounded-xs shrink-0"
            style={{ background: familyVar(metric.familia) }}
            aria-hidden
          />
          {/* h2 y no h3: el único nivel por encima es el h1 de la pregunta de la
              pestaña, y saltarse un nivel rompe la navegación por encabezados,
              que es como se recorre una pantalla de doce paneles con un lector. */}
          {/* `title` porque con nombres reales truncar pasó a ser lo normal, no
              la excepción: «Tendencia diaria» no entra en el piso de 128px
              cuando la BASE ocupa el resto. El nombre completo ya viaja en el
              `aria-label` del panel —así que un lector de pantalla nunca lo
              pierde—, y esto lo alcanza también con el mouse.

              **El piso de 128px es una elección, no una medida del dibujo**, y
              queda por ajustar: más ancho muestra más nombre y empuja la BASE a
              una línea más, que come alto del cuerpo. Con doce paneles reales
              delante conviene mirarlo antes de moverlo. */}
          <h2
            title={metric.nombre}
            className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0 truncate"
          >
            {metric.nombre}
          </h2>
        </div>

        <div className={compact ? 'flex flex-col gap-1' : 'flex flex-col items-end gap-1 min-w-0 text-right'}>
          {/* BASE = denominador + ventana. Los dos, siempre: el denominador del
              payload cuando hay cifra y del catálogo cuando no. */}
          <Label>{`Base · ${governance.base} · ${governance.ventana}`}</Label>
          <Provenance
            capa={governance.capa}
            fuente={governance.fuente}
            frescura={governance.frescura}
            format={format}
            now={now}
          />
          {state === 'DEGRADADO' && <DegradedBadge>Degradado</DegradedBadge>}
        </div>
      </header>

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
