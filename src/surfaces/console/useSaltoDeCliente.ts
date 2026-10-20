/** El salto de cliente de la consola · 2026-10-20 · `d794a3e`.
 *
 *  **La consola sirve el cliente del TOKEN**, y eso no cambió: ninguna ruta de
 *  `/config/*` recibe el cliente. Lo que cambió es que un `superadmin` puede
 *  pedir un token de otro cliente —`POST /auth/switch-tenant`—, y con ese token
 *  la consola entera es la de ese cliente. Ver
 *  `docs/RESPUESTA-2026-10-20-backend-consola-por-cliente.md`.
 *
 *  **El orden es el que importa**: primero el token nuevo, después vaciar.
 *  Si se vaciara antes, las consultas que vuelven a pedirse saldrían con el
 *  token viejo y traerían otra vez el cliente anterior. Y si el salto falla, no
 *  se toca nada: la sesión y la pantalla siguen en el mismo cliente.
 *
 *  **Vaciar es en dos pasos, y el orden lo encontró una prueba.** Con un
 *  `resetQueries` de todo, la consulta de la pestaña ACTIVA se volvía a pedir
 *  en el acto —con el id de la pestaña del cliente anterior y el token del
 *  nuevo—, porque el contexto todavía no había cambiado cuando se disparó.
 *  Primero se saca del cache todo lo que no es el contexto, sin volver a
 *  pedirlo; después se reinicia el contexto, que deja a la consola cargando y
 *  sin pestaña activa. Lo demás se pide recién cuando el contexto nuevo dice
 *  qué pestañas hay.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { switchTenant } from '../../api/auth'
import { keys } from '../../api/hooks'
import { saveToken } from '../../app/auth/session'

export function useSaltoDeCliente(alSaltar: () => void) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tenantId: string) => switchTenant(tenantId),
    onSuccess: async ({ token }) => {
      saveToken(token)
      // Lo de la pantalla —pestaña, período, hojas abiertas— es del cliente
      // anterior: sus ids no existen en el nuevo.
      alSaltar()
      const esElContexto = (k: readonly unknown[]) => k[0] === keys.me[0] && k[1] === keys.me[1]
      qc.removeQueries({ predicate: (q) => !esElContexto(q.queryKey) })
      await qc.resetQueries({ queryKey: keys.me, exact: true })
    },
  })
}
