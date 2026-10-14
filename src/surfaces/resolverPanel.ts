/** Lo que una superficie resuelve de un panel antes de dibujarlo · 2026-10-07
 *
 *  **Nació en `ConsoleContainer` y se mudó acá** cuando el builder empezó a
 *  dibujar con dato —el lienzo, la vista previa y el selector de gráfico—
 *  (`docs/AUDITORIA-2026-10-07-editor-sin-previsualizacion.md`). Cuatro
 *  superficies con la misma regla escrita cuatro veces es cómo una se queda
 *  vieja: si el repertorio cambia cómo evalúa un tope, el builder mostraría un
 *  gráfico que la consola apaga.
 *
 *  Son decisiones de SUPERFICIE y no de `render/`, por lo que `api/params.ts`
 *  declara en su cabecera: un cuerpo no valida su entrada, porque si validara
 *  tendría que decidir qué hacer cuando falla.
 */
import { adaptPanelParams } from '../api/params'
import { hasValue } from '../render/state'
import { invalidPlotReason } from '../catalog/plots'
import type { PlotProblem, PlotTable } from '../catalog/plots'
import type { Block, PanelConfig, Payload } from '../api/types'

/** Los params YA validados, y el payload degradado si alguno es inválido · F1.29.
 *
 *  **Un param inválido DEGRADA el panel, no se ignora ni se reemplaza por el
 *  default.** Ignorarlo es el defecto que F1.29 arregla; reemplazarlo en
 *  silencio es peor, porque el panel se ve bien mostrando otra cosa.
 *
 *  Sale como `BLOQUEADO` y no como `ERROR` porque no es un fallo del sistema: es
 *  una composición que no se puede dibujar, tiene razón y tiene quien la
 *  arregle. El shell conserva título, BASE y procedencia · §5.2. */
export function conParams(
  panel: PanelConfig,
  payload: Payload,
  bloques: readonly Block[] | undefined,
): { payload: Payload; params: Record<string, unknown> } {
  const { params, invalid } = adaptPanelParams(panel, bloques)
  if (invalid.length === 0) return { payload, params }
  return {
    params,
    payload: {
      estado: 'BLOQUEADO',
      razon: `La composición de este panel no es válida · ${invalid.map((i) => i.reason).join(' · ')}`,
      desbloqueaCon: 'Corregir las opciones del panel en el builder',
    } as Payload,
  }
}

/** Por qué el gráfico de un panel no puede dibujar su valor · F1.31. `undefined`
 *  si puede, o si todavía no hay con qué decidir.
 *
 *  **Mientras el repertorio no llegó, NO se bloquea nada.** `/config/plots` es
 *  una consulta aparte y puede fallar sola, y un panel apagado por una tabla que
 *  no cargó es peor que uno dibujado sin verificar.
 *
 *  **`indeterminado` tampoco se propaga**: apagar un panel porque este build no
 *  sabe contar un sustantivo nuevo del repertorio sería castigar al usuario por
 *  una deriva entre las dos mitades. Se avisa en desarrollo y se dibuja. */
export function problemaDeGrafico(
  repertorio: PlotTable,
  panel: PanelConfig,
  payload: Payload,
): PlotProblem | undefined {
  if (panel.grafico === undefined || repertorio.size === 0 || !hasValue(payload)) return undefined
  const problema = invalidPlotReason(repertorio, panel.grafico, payload.valor)
  if (problema === null) return undefined
  if (problema.clase === 'indeterminado') {
    if (import.meta.env.DEV) {
      console.warn(`[synapse] panel ${panel.id} (${panel.grafico}): ${problema.razon}`)
    }
    return undefined
  }
  return problema
}
