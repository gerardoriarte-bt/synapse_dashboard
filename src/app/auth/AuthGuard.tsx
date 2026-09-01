import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { hasSession } from './session'

/** Puerta de sesión · F0.5.
 *
 *  Verifica que HAYA token, no qué permite. Los permisos los aplica el backend:
 *  si un rol no debe ver algo, no llega ni en el layout ni en el batch. Un
 *  guardia que decidiera por rol sería lógica de negocio en el front.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation()

  if (!hasSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
