import { useQuery } from '@tanstack/react-query'
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { tokenInfo } from '../../api/auth'
import { ChangePassword } from '../../surfaces/console/ChangePassword'
import { SurfaceMessage } from '../../surfaces/console/SurfaceMessage'
import { currentToken, hasSession } from './session'

/** Puerta de sesión · F0.5, F0.13.
 *
 *  Verifica que HAYA token, no qué permite. Los permisos los aplica el backend:
 *  si un rol no debe ver algo, no llega ni en el layout ni en el batch. Un
 *  guardia que decidiera por rol sería lógica de negocio en el front.
 *
 *  ── EL BLOQUEO POR CONTRASEÑA VA ACÁ, Y NO EN EL LOGIN · F0.13 ─────────────
 *
 *  El contrato del servicio de acceso lo pide: «si `user.password_updated` es
 *  `false` el front debe mostrar un modal bloqueante antes de acceder a la
 *  app». Ponerlo en la pantalla de login lo dejaría **esquivable escribiendo la
 *  URL** — quien ya tiene token en `localStorage` no vuelve a pasar por ahí.
 *  Acá pasan las tres superficies, así que no hay puerta de atrás.
 *
 *  ── DE DÓNDE SALE `password_updated` ──────────────────────────────────────
 *
 *  De `/auth/token-info`, no de guardarlo al entrar. El login lo devuelve y
 *  sería más barato meterlo en `localStorage`, pero eso es una segunda fuente
 *  de verdad: quedaría en `false` para siempre si alguien cambia la contraseña
 *  desde otro lado, y el usuario no podría entrar nunca más. El servicio lee la
 *  BD, así que después de un cambio dice `true` aunque el token sea el viejo.
 *
 *  Es un viaje por sesión, no por navegación: TanStack lo cachea con el token
 *  como clave.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation()
  const token = currentToken()

  const sesion = useQuery({
    queryKey: ['auth', 'token-info', token],
    queryFn: () => tokenInfo(token as string),
    enabled: token !== null,
    // La sesión no cambia sola mientras la pestaña está abierta, y un 401 ya lo
    // maneja el `queryCache` de `AppProviders` cerrando la sesión.
    staleTime: Infinity,
    retry: false,
  })

  if (!hasSession()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  // Mientras se sabe si la contraseña sigue siendo la asignada NO se pinta la
  // superficie. Dejarla pasar «mientras tanto» convierte el bloqueo en un
  // parpadeo que se puede aprovechar.
  if (sesion.isLoading) {
    return <SurfaceMessage title="Verificando tu sesión" detail="Servicio de acceso" />
  }

  // Un fallo que NO es 401 —el servicio caído, por ejemplo— no cierra la sesión
  // ni deja pasar: decirlo es lo único honesto. El 401 lo maneja el
  // `queryCache`, que borra el token y manda al login.
  if (sesion.isError) {
    return (
      <SurfaceMessage
        title="No se pudo verificar tu sesión"
        detail={sesion.error.message !== '' ? sesion.error.message : 'Sin detalle del servicio'}
        onRetry={() => void sesion.refetch()}
      />
    )
  }

  if (sesion.data?.user.password_updated === false) {
    return <ChangePassword onDone={() => void sesion.refetch()} />
  }

  return <>{children}</>
}
