import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ApiError } from '../../api/types'
import { signOut } from '../auth/session'
import { ClienteDeTrabajoProvider } from '../../surfaces/ClienteDeTrabajoProvider'

/** Cache de servidor con defaults declarados · F0.3.
 *
 *  Los defaults NO son los de la librería a propósito. Una consola de data se
 *  mira en una pestaña abierta todo el día: revalidar al volver al foco pedía el
 *  batch entero cada vez que alguien cambiaba de ventana. El dato se invalida
 *  por período y por publicación de layout, que son eventos que conocemos, no
 *  por el foco del navegador.
 */
/** **Un 4xx no se reintenta** · 2026-11-23.
 *
 *  Visto en QA con los reportes, cuya ruta todavía no está desplegada: la lista
 *  pidió una vez, recibió 404 y **se quedó en filas esqueleto para siempre**,
 *  sin reintento y sin error. TanStack **pausa** el reintento mientras la
 *  pestaña no tiene el foco, así que el `retry: 1` de antes dejaba la consulta
 *  colgada en «cargando» hasta que alguien volviera a la ventana — y el estado
 *  de error de la pantalla nunca llegaba.
 *
 *  Una respuesta 4xx no cambia por repetirla: la ruta no existe, el permiso no
 *  alcanza, el pedido está mal. Se reintenta una vez lo que puede ser pasajero
 *  —red, 5xx— y nada más. El 408 y el 429 son de la primera clase aunque
 *  empiecen con 4. */
export function reintentar(fallas: number, error: Error): boolean {
  if (error instanceof ApiError) {
    const s = error.httpStatus
    if (s >= 400 && s < 500 && s !== 408 && s !== 429) return false
  }
  return fallas < 1
}

const client = new QueryClient({
  /** Un `401` cierra la sesión, en un solo lugar · F0.5.
   *
   *  **Acá y no en `api/client.ts`.** El cliente es transporte: hacerlo navegar
   *  le daría una segunda responsabilidad y lo volvería imposible de probar sin
   *  un router. Acá se ven TODOS los errores de consulta, que es donde la
   *  decisión pertenece.
   *
   *  Se borra el token y se recarga contra `/`. La recarga es a propósito: el
   *  `AuthGuard` ya sabe mandar a `/login` cuando no hay sesión, así que en vez
   *  de duplicar esa decisión se lo deja decidir a él. Y limpia la cache de
   *  TanStack de paso — un token vencido deja datos del usuario anterior en
   *  memoria, y eso es peor que un viaje de más.
   *
   *  Un 401 no se reintenta: es un 4xx · ver `reintentar`.
   */
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.httpStatus === 401) {
        signOut()
        if (window.location.pathname !== '/login') window.location.assign('/login')
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: reintentar,
    },
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      {/* El cliente de trabajo, compartido entre administración y builder ·
          2026-10-06. Ver `surfaces/clienteDeTrabajo.ts`. */}
      {/* **Adentro del router desde el 2026-10-19** · F5.38: el cliente de
          trabajo viaja en la URL, y para leerla el proveedor tiene que estar
          debajo del `BrowserRouter`. */}
      <BrowserRouter>
        <ClienteDeTrabajoProvider>{children}</ClienteDeTrabajoProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
