/** El dueño del cliente de trabajo · ver `clienteDeTrabajo.ts`.
 *
 *  **Viaja en la URL desde el 2026-10-19** · F5.38. Vivía sólo en memoria:
 *  recargar, abrir una pestaña nueva o compartir un enlace volvía al cliente
 *  propio sin aviso —`docs/AUDITORIA-2026-10-19-cambio-de-cliente.md`—. Ahora
 *  administración y builder llevan `?cliente=<id>`, y una URL con el parámetro
 *  arranca en ese cliente.
 *
 *  **La consola no lo lleva**: su cliente es el del token y ninguna ruta de
 *  `/config/*` acepta otro. Poner el parámetro ahí prometería algo que no hace.
 *
 *  **Un id que no está en la lista se ignora**, igual que antes: lo resuelve
 *  `useClienteDeTrabajo`, que sólo acepta los que `GET /admin/tenants` devolvió.
 */
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { ContextoDeCliente } from './clienteDeTrabajo'

const PARAMETRO = 'cliente'
const LLEVA_CLIENTE = /^\/(admin|builder)(\/|$)/

export function ClienteDeTrabajoProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const enUrl = params.get(PARAMETRO)
  // Arranca en el de la URL: así una recarga no pasa un render por el propio.
  const [elegido, elegir] = useState<string | null>(enUrl)

  useEffect(() => {
    if (!LLEVA_CLIENTE.test(pathname)) return
    // Navegar entre pantallas pierde la query: se repone sin sumar historial.
    if (elegido !== null && enUrl !== elegido) {
      const siguiente = new URLSearchParams(params)
      siguiente.set(PARAMETRO, elegido)
      setParams(siguiente, { replace: true })
    }
  }, [pathname, enUrl, elegido, params, setParams])

  const valor = useMemo(() => ({ elegido, elegir }), [elegido])
  return <ContextoDeCliente.Provider value={valor}>{children}</ContextoDeCliente.Provider>
}
