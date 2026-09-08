/** El agrupado del riel de hilos · F3.7
 *
 *  **El contrato delega esto al front, y lo dice con todas las letras:** «el
 *  agrupado por tiempo —HOY, ESTA SEMANA, JULIO— lo hace el front: es
 *  presentación y depende del huso del usuario». Es la excepción a que el front
 *  no calcule nada: lo que se calcula acá no es un dato, es dónde va una fila.
 *
 *  **No reordena.** El backend devuelve los hilos por `actualizadoEn`, del más
 *  reciente al más viejo, y esa decisión es suya. Acá se PARTE esa lista
 *  conservando el orden dentro de cada grupo; ordenar de nuevo sería tomar una
 *  decisión que ya está tomada y arriesgarse a tomarla distinto.
 */
import type { Formatter } from '../../render/format'
import type { ThreadSummary } from '../../api/types'

export type ThreadGroup = {
  label: string
  threads: ThreadSummary[]
}

const DIA = 86_400_000

/** Medianoche local del día de `fecha`. Local y no UTC a propósito: «HOY» es el
 *  día del usuario, y a las 21:00 en México ya es mañana en UTC. */
function inicioDelDia(fecha: Date): number {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
}

export function groupByRecency(
  threads: readonly ThreadSummary[],
  now: Date,
  format: Formatter,
): ThreadGroup[] {
  const hoy = inicioDelDia(now)
  const grupos: ThreadGroup[] = []

  for (const thread of threads) {
    const cuando = inicioDelDia(new Date(thread.actualizadoEn))
    const label =
      cuando >= hoy
        ? 'Hoy'
        : cuando > hoy - 7 * DIA
          ? 'Esta semana'
          : format.monthLabel(thread.actualizadoEn, now)

    // Se busca el ÚLTIMO grupo y no cualquiera con esa etiqueta: si la lista
    // viniera desordenada, dos bloques de «JULIO» separados serían visibles en
    // vez de fundirse en silencio. Fundirlos escondería que el backend mandó
    // algo raro.
    const ultimo = grupos[grupos.length - 1]
    if (ultimo !== undefined && ultimo.label === label) ultimo.threads.push(thread)
    else grupos.push({ label, threads: [thread] })
  }

  return grupos
}
