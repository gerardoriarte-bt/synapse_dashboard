/** Cerrar sesión · 2026-10-07
 *
 *  **No existía en ninguna superficie**, y apareció al separar el menú del
 *  nombre del de trabajo: el nombre quedó para lo de la persona, y salir es lo
 *  más de la persona que hay.
 *
 *  **No pasa por el servicio**: el contrato de acceso no declara una ruta de
 *  salida —`contracts/synapse-auth.yaml` tiene `login`, `token-info` y
 *  `change-password`— y el token es un JWT que vive en `localStorage`. Salir es
 *  borrarlo.
 *
 *  **Y vaciar el cache**, que es la mitad que no se ve: sin eso, quien entre
 *  después en la misma pestaña vería por un instante los datos del anterior —
 *  su identidad, su cliente, sus paneles— hasta que cada consulta vuelva.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../app/auth/session'

export function useCerrarSesion(): () => void {
  const qc = useQueryClient()
  const navegar = useNavigate()
  return () => {
    signOut()
    qc.clear()
    void navegar('/login', { replace: true })
  }
}
