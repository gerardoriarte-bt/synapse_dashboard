/** Los datos de servidor, fuera del árbol de render · F1.2.
 *
 *  TanStack Query es el dueño de la cache, no `useState`. Un `useState` con algo
 *  que vino del servidor es una segunda fuente de verdad que se desincroniza en
 *  silencio — anti-patrón declarado en §4 de `nuevo-desarrollo.md`.
 *
 *  Las claves se declaran acá y no en cada llamada para que invalidar sea
 *  posible desde afuera sin repetir el arreglo.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { Theme } from '../tokens/theme'
import type { Payload } from './types'

export const keys = {
  me: ['config', 'me'] as const,
  catalog: ['config', 'catalog'] as const,
  blocks: ['config', 'blocks'] as const,
  tab: (tabId: string, layoutId?: string) => ['config', 'tab', tabId, layoutId ?? null] as const,
  panels: (tabId: string, period: string) => ['panels', tabId, period] as const,
}

/** Contexto al montar la app. Una sola vez: no cambia con el período. */
export function useMe() {
  return useQuery({ queryKey: keys.me, queryFn: api.me })
}

export function useCatalog() {
  return useQuery({ queryKey: keys.catalog, queryFn: api.catalog })
}

export function useBlocks() {
  return useQuery({ queryKey: keys.blocks, queryFn: api.blocks })
}

/** El layout de la pestaña. **No lleva el período en la clave** — es la mitad de
 *  la garantía de §7: cambiar de período no re-pide el layout. */
export function useTab(tabId: string | null, layoutId?: string) {
  return useQuery({
    queryKey: keys.tab(tabId ?? '', layoutId),
    queryFn: () => api.tab(tabId as string, layoutId),
    enabled: tabId !== null && tabId !== '',
  })
}

/** Los payloads. La clave se ancla al `tabId` y no a la lista de panelIds: dos
 *  renders de la misma pestaña producen arreglos distintos con el mismo
 *  contenido, y eso rompía la cache sin que se notara. */
export function usePanelsBatch(tabId: string | null, panelIds: string[], period: string) {
  return useQuery({
    queryKey: keys.panels(tabId ?? '', period),
    queryFn: () => api.panelsBatch(panelIds, period),
    enabled: tabId !== null && panelIds.length > 0 && period !== '',
  })
}

/** Reintento de UN panel · F2.4.
 *
 *  **Re-pide ese panel y funde el resultado en la caché del batch.** No es una
 *  optimización: `refetch()` del batch vuelve a pedir los N paneles, y N−1
 *  habían cargado bien. El usuario que aprieta «Reintentar» en el panel que
 *  falló termina pagando con el parpadeo de todos los demás — que es
 *  exactamente lo que F2.4 prohíbe: «el reintento re-pide ESE panel, no el
 *  batch entero».
 *
 *  El endpoint es el mismo `panels:batch` con una lista de uno. No hace falta
 *  una ruta nueva: el contrato ya declara fallo parcial, así que pedir un panel
 *  es pedir un batch chico.
 *
 *  `setQueryData` y no `invalidateQueries`, y la diferencia importa: invalidar
 *  dispararía de nuevo la consulta original —los N paneles— y sería el mismo
 *  defecto por otro camino. */
export function useRetryPanel(tabId: string | null, period: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (panelId: string) => api.panelsBatch([panelId], period),
    onSuccess: (fresco) => {
      client.setQueryData(
        keys.panels(tabId ?? '', period),
        (previo: Record<string, Payload> | undefined) => ({ ...previo, ...fresco }),
      )
    },
  })
}

/** Persistir el tema · F1.12. El switcher visual no pasa por acá: lo hace
 *  `tokens/theme.ts` escribiendo un atributo. Esto solo lo guarda contra el
 *  perfil, que es lo que §2.4 exige. */
export function useSaveTheme() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (theme: Theme) => api.savePreferences({ tema: theme }),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.me }),
  })
}
