/** Cómo se puede mostrar un dato · 2026-11-10
 *
 *  **El editor empieza por el dato, no por el gráfico.** Decisión humana de ese
 *  día: «debería mostrar de primera mano qué dato se quiere graficar y luego sí
 *  elegir el tipo de gráfico», porque cada cliente tiene datos distintos que se
 *  muestran de formas distintas. La biblioteca dejó de ser de tipos.
 *
 *  **Función pura y no lógica de componente**: es la misma pregunta que contesta
 *  «Cómo se ve» del configurador —dado el dato, qué tipos y qué gráficos—, con
 *  las mismas fuentes: los bloques de `/config/blocks` dicen qué formas acepta
 *  cada tipo y `/config/plots` qué gráficos dibujan cada forma.
 *
 *  **Lo que no sirve se devuelve igual, con su razón.** Decidido el mismo día:
 *  desactivado y explicado, no escondido. Un gráfico que falta sin decir por qué
 *  se lee como un defecto; uno desactivado que dice «es una cifra sola» enseña
 *  cómo funciona el sistema. Es lo que el `.pen` ya hacía en B3 y B4.
 *
 *  **Con el dato a mano, el tope y el mínimo se evalúan** —«la dona admite
 *  cinco partes»—. Sin él, sólo se sabe por la forma: hoy el dato llega por
 *  panel, así que se tiene para las métricas que ya están en el lienzo.
 */
import { invalidPlotReason } from '../../catalog/plots'
import { nombreDeForma, nombreDeTipo } from './rotulos'
import type { PlotTable } from '../../catalog/plots'
import type { ChartId } from '../../catalog/types'
import type { Block, Metric, Payload, Plot } from '../../api/types'
import { hasValue } from '../../render/state'

export type OpcionDeGrafico = {
  /** `undefined` es «el de por defecto del tipo». */
  grafico: ChartId | undefined
  nombre: string
  /** Por qué no se puede elegir con este dato, o `null`. */
  razon: string | null
}

export type ComoMostrarlo = {
  tipo: string
  /** `null` si el tipo dibuja la forma del dato. */
  razon: string | null
  opciones: OpcionDeGrafico[]
}

export function comoMostrar(
  metrica: Metric,
  bloques: readonly Block[],
  plots: readonly Plot[],
  repertorio: PlotTable,
  payload: Payload | undefined,
): ComoMostrarlo[] {
  const conDato = payload !== undefined && hasValue(payload) ? payload : undefined
  const graficos = plots.filter((x) => x.formas.includes(metrica.forma as never))

  const out = bloques
    .filter((b) => b.tipo !== 'blocked')
    .map((b): ComoMostrarlo => {
      if (!b.formasAceptadas.includes(metrica.forma)) {
        return {
          tipo: b.tipo,
          razon: `Dibuja ${b.formasAceptadas.map(nombreDeForma).join(' o ')} · este dato es ${nombreDeForma(metrica.forma)}`,
          opciones: [],
        }
      }
      const opciones: OpcionDeGrafico[] = [undefined, ...graficos.map((x) => x.id as ChartId)].map(
        (id) => {
          const problema =
            id === undefined || conDato === undefined
              ? null
              : invalidPlotReason(repertorio, id, conDato.valor)
          return {
            grafico: id,
            nombre:
              id === undefined
                ? `${nombreDeTipo(b.tipo)} · el de por defecto`
                : (plots.find((x) => x.id === id)?.nombre ?? id),
            // «Indeterminado» no desactiva: no se pudo evaluar, y desactivar por
            // no saber sería esconder una opción que puede servir.
            razon: problema === null || problema.clase === 'indeterminado' ? null : problema.razon,
          }
        },
      )
      return { tipo: b.tipo, razon: null, opciones }
    })

  // Primero lo que sirve: es lo que se viene a elegir.
  return [...out.filter((t) => t.razon === null), ...out.filter((t) => t.razon !== null)]
}
