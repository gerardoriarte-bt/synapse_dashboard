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
import { adminApi } from './admin'
import type { TabParaGuardar } from './admin'
import type { Theme } from '../tokens/theme'
import type { Payload } from './types'

export const keys = {
  me: ['config', 'me'] as const,
  catalog: ['config', 'catalog'] as const,
  blocks: ['config', 'blocks'] as const,
  tab: (tabId: string, layoutId?: string) => ['config', 'tab', tabId, layoutId ?? null] as const,
  panels: (tabId: string, period: string) => ['panels', tabId, period] as const,
  threads: ['chat', 'hilos'] as const,

  /* ── Builder · F4.23 ─────────────────────────────────────────────────────
   *
   * **Viven acá y no en un archivo aparte a propósito.** Publicar un layout
   * tiene que invalidar la caché de la CONSOLA —`me` y `tab`—, y para eso las
   * dos familias de claves tienen que estar al alcance. Separarlas obligaría a
   * importar las de la consola desde el builder, que es la dependencia al revés.
   */
  tenants: ['admin', 'tenants'] as const,
  layouts: (tenantId: string) => ['admin', 'layouts', tenantId] as const,
  layout: (layoutId: string) => ['admin', 'layout', layoutId] as const,
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

/** El riel de hilos · F3.7. Solo los del usuario del token, y el orden lo
 *  decide el backend: llegan por `actualizadoEn`, del más reciente al más
 *  viejo. El front los agrupa por tiempo pero no los reordena. */
export function useThreads() {
  return useQuery({ queryKey: keys.threads, queryFn: api.threads })
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
    mutationFn: (theme: Theme) => api.savePreferences(theme),
    onSuccess: () => client.invalidateQueries({ queryKey: keys.me }),
  })
}


/* ══ Builder · F4.23 ═════════════════════════════════════════════════════════
 *
 * **El servidor decide.** Lo que estos hooks hacen es traer y mandar; la
 * validación del front —`catalog/blocks.ts`— es feedback inmediato para no
 * dejar componer algo imposible, pero **nunca se publica algo que el front dio
 * por bueno y el servidor no vio**. Por eso `useValidateLayout` existe y llama
 * al endpoint en vez de decidir acá.
 */

export function useTenants() {
  return useQuery({ queryKey: keys.tenants, queryFn: adminApi.tenants })
}

export function useLayouts(tenantId: string | null) {
  return useQuery({
    queryKey: keys.layouts(tenantId ?? ''),
    queryFn: () => adminApi.layouts(tenantId as string),
    enabled: tenantId !== null && tenantId !== '',
  })
}

export function useLayoutDetail(layoutId: string | null) {
  return useQuery({
    queryKey: keys.layout(layoutId ?? ''),
    queryFn: () => adminApi.layout(layoutId as string),
    enabled: layoutId !== null && layoutId !== '',
  })
}

export function useCreateDraft(tenantId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (versionId?: string) => adminApi.crearBorrador(tenantId as string, versionId),
    onSuccess: () => void qc.invalidateQueries({ queryKey: keys.layouts(tenantId ?? '') }),
  })
}

/** Guardar **reemplaza el layout entero**: el servicio no acepta parches.
 *
 *  `setQueryData` con lo que devuelve el PUT y no `invalidateQueries`: la
 *  respuesta YA es el layout guardado, así que volver a pedirlo sería un viaje
 *  para traer lo que ya está en la mano. */
export function useSaveLayout(layoutId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tabs: readonly TabParaGuardar[]) => adminApi.guardar(layoutId as string, tabs),
    onSuccess: (detalle) => qc.setQueryData(keys.layout(layoutId ?? ''), detalle),
  })
}

/** **No cachea, y es a propósito.** Validar es una pregunta sobre el estado de
 *  ESTE momento; una respuesta guardada diría «válido» sobre una composición que
 *  ya cambió. Por eso es mutación y no consulta. */
export function useValidateLayout(layoutId: string | null) {
  return useMutation({ mutationFn: () => adminApi.validar(layoutId as string) })
}

/** Publicar toca DOS cachés, y olvidar la segunda es el defecto silencioso.
 *
 *  **Publicar demota el layout publicado anterior del tenant a borrador**, así
 *  que cambia la lista de layouts —lo evidente— y también **lo que la consola
 *  está mostrando**: sus pestañas y su contexto salen del layout publicado. Sin
 *  invalidar `me` y `tab`, quien acaba de publicar sigue viendo el layout viejo
 *  en la consola y cree que no funcionó. */
export function usePublishLayout(layoutId: string | null, tenantId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (versionId?: string) => adminApi.publicar(layoutId as string, versionId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.layouts(tenantId ?? '') })
      void qc.invalidateQueries({ queryKey: keys.layout(layoutId ?? '') })
      // La consola. `me` trae las pestañas del layout publicado y `tab` su
      // composición: publicar las cambia a las dos.
      void qc.invalidateQueries({ queryKey: keys.me })
      void qc.invalidateQueries({ queryKey: ['config', 'tab'] })
    },
  })
}
