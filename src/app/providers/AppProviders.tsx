import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ApiError } from '../../api/types'
import { signOut } from '../auth/session'

/** Cache de servidor con defaults declarados · F0.3.
 *
 *  Los defaults NO son los de la librería a propósito. Una consola de data se
 *  mira en una pestaña abierta todo el día: revalidar al volver al foco pedía el
 *  batch entero cada vez que alguien cambiaba de ventana. El dato se invalida
 *  por período y por publicación de layout, que son eventos que conocemos, no
 *  por el foco del navegador.
 */
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
   *  `retry: 1` está arriba y no molesta: un 401 se reintenta una vez y vuelve
   *  401. Reintentar credenciales vencidas no las revive, pero tampoco hace
   *  daño y no vale una excepción en los defaults.
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
      retry: 1,
    },
  },
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  )
}
