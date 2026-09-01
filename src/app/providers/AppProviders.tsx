import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'

/** Cache de servidor con defaults declarados · F0.3.
 *
 *  Los defaults NO son los de la librería a propósito. Una consola de data se
 *  mira en una pestaña abierta todo el día: revalidar al volver al foco pedía el
 *  batch entero cada vez que alguien cambiaba de ventana. El dato se invalida
 *  por período y por publicación de layout, que son eventos que conocemos, no
 *  por el foco del navegador.
 */
const client = new QueryClient({
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
