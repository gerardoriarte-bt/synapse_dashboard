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
 *  **Con qué panel y período se abrió el hilo SÍ se muestra desde el
 *  2026-09-21**, que es la mitad del criterio que estuvo bloqueada desde el
 *  2026-09-03. `HiloResumen` no tenía dónde ponerlo hasta que `82da946` empezó
 *  a mandarlo y el contrato ganó los campos.
 *
 *  **El período es el DEL HILO, no el de hoy.** Reabrir en octubre una consulta
 *  de septiembre tiene que decir septiembre, o la respuesta guardada se lee
 *  contra el período equivocado.
 *
 *  **Y una fila sin contexto se dibuja igual.** Los hilos abiertos antes de que
 *  existiera el contexto de panel no lo traen, y el servicio declara esos
 *  campos `omitempty`: la línea desaparece en vez de quedar con un separador
 *  colgando, que es el defecto que la línea de BASE tuvo con `ventana`.
 */
import { Label } from '../../render/primitives/Label'
import type { ThreadGroup } from './threads'
import type { Formatter } from '../../render/format'
import type { ThreadSummary } from '../../api/types'

type Props = {
  groups: readonly ThreadGroup[]
  activeId?: string
  onSelect: (threadId: string) => void
  /** Para la marca de tiempo de cada fila · §PEN:C3 la dibuja en todas. */
  format: Formatter
  /** «Nueva consulta» · §PEN:C3 lo pone en la cabecera del riel. **Sin
   *  manejador no se pinta**, que es la regla del CTA muerto. */
  onNueva?: () => void
}

export function ThreadRail({ groups, activeId, onSelect, format, onNueva }: Props) {
  // Un solo `now` para todas las filas: dos llamadas distintas podrían caer a
  // los dos lados de la medianoche y dejar dos formatos en la misma lista.
  const ahora = new Date()

  if (groups.length === 0) {
    return (
      <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
        Todavía no preguntaste nada.
      </p>
    )
  }

  return (
    <nav aria-label="Conversaciones anteriores" className="flex flex-col gap-4">
      {/* **`HISTORIAL` y `NUEVA CONSULTA`** · §PEN:C3 los pone en la cabecera
          del riel, y su estado colapsado dice que los dos sobreviven. */}
      <div className="flex items-baseline justify-between gap-2">
        <Label as="div">Historial</Label>
        {onNueva === undefined ? null : (
          <button
            type="button"
            onClick={onNueva}
            className="font-mono text-label tracking-rotulo uppercase text-acc hover:text-acc-hover cursor-pointer bg-transparent border-0 p-0"
          >
            Nueva consulta
          </button>
        )}
      </div>

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
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{thread.titulo}</span>
                    {/* La procedencia del hilo, en el rótulo de la casa. Solo
                        las partes que llegaron: un hilo viejo no tiene
                        ninguna, y un separador sin nada a la derecha es peor
                        que no escribir la línea. */}
                    {contexto(thread) === null ? null : (
                      <Label as="span">{contexto(thread)}</Label>
                    )}
                  </span>
                  {/* El badge marca la traza de una decisión de C4. El contrato
                      además prohíbe borrar estos hilos; el riel no ofrece
                      borrar ninguno todavía, así que acá solo se declara. */}
                  {thread.esDecision ? <Label as="span">Decisión</Label> : null}
                  {/* La hora si es de hoy, el día y el mes si no · §PEN:C3. */}
                  <Label as="span">{format.threadStamp(thread.actualizadoEn, ahora)}</Label>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {/* **El pie dice quién puede leer lo que se preguntó** · §PEN:C3, con
          este literal. No es decorativo: es la clase de cosa que se pregunta
          una vez y se contesta mal si no está escrita. */}
      <div className="flex flex-col gap-1 border-t border-w2 pt-2">
        <Label as="div">Las consultas quedan en el tenant</Label>
        <Label as="div">Visibles solo para tu rol</Label>
      </div>
    </nav>
  )
}

/** «VENTA DIARIA · 2026-09», con lo que haya. `null` si no llegó nada. */
function contexto(thread: ThreadSummary): string | null {
  const partes = [thread.metricaNombre, thread.periodo].filter(
    (p): p is string => p != null && p !== '',
  )
  return partes.length === 0 ? null : partes.join(' · ')
}
