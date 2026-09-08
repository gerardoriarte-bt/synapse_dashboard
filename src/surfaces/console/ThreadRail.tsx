/** El riel de hilos · F3.7
 *
 *  Presentacional: recibe los grupos ya armados y un callback. No pide nada.
 *
 *  **`titulo` se muestra tal cual.** El contrato lo dice: «el riel la muestra
 *  tal cual, así que no se resume ni se recorta acá: el front decide cuánto
 *  entra en 220px». Lo decide con CSS —`truncate`— y no cortando la cadena, que
 *  es lo que deja «Por qué subió el R…» en el árbol de accesibilidad además de
 *  en la pantalla.
 *
 *  **Con qué panel y período se abrió el hilo NO se muestra, y el criterio lo
 *  pide.** `HiloResumen` trae `id`, `titulo`, `creadoEn`, `actualizadoEn`,
 *  `esDecision` y `decisionId`, y ninguno dice de qué panel salió. Inventarlo
 *  no se puede y deducirlo tampoco. Queda anotado en el plan.
 */
import { Label } from '../../render/primitives/Label'
import type { ThreadGroup } from './threads'

type Props = {
  groups: readonly ThreadGroup[]
  activeId?: string
  onSelect: (threadId: string) => void
}

export function ThreadRail({ groups, activeId, onSelect }: Props) {
  if (groups.length === 0) {
    return (
      <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
        Todavía no preguntaste nada.
      </p>
    )
  }

  return (
    <nav aria-label="Conversaciones anteriores" className="flex flex-col gap-4">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-1">
          {/* Encabezado y no `<Label>`: el primitivo acepta span, div y dt
              porque es el rótulo de un valor, y esto es el título de una
              sección del riel. Un lector de pantalla lo salta si no es
              heading. Las utilidades son las mismas, que es lo que hacen
              `Topbar` y `Tabs` con sus rótulos. */}
          <h3 className="font-mono text-label tracking-rotulo leading-rotulo uppercase text-dim m-0">
            {group.label}
          </h3>
          <ul className="flex list-none flex-col p-0 m-0">
            {group.threads.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => onSelect(thread.id)}
                  aria-current={thread.id === activeId ? 'true' : undefined}
                  className={
                    'flex w-full items-center gap-2 rounded-md px-2 py-1 text-left cursor-pointer border-0 ' +
                    'font-body text-cuerpo leading-cuerpo ' +
                    (thread.id === activeId ? 'bg-w2 text-ink' : 'bg-transparent text-dim hover:text-ink')
                  }
                >
                  <span className="min-w-0 flex-1 truncate">{thread.titulo}</span>
                  {/* El badge marca la traza de una decisión de C4. El contrato
                      además prohíbe borrar estos hilos; el riel no ofrece
                      borrar ninguno todavía, así que acá solo se declara. */}
                  {thread.esDecision ? <Label as="span">Decisión</Label> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}
