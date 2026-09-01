import type { RouteObject } from 'react-router-dom'
import { AuthGuard } from '../auth/AuthGuard'
import { Console } from '../../surfaces/console/Console'
import { Admin } from '../../surfaces/admin/Admin'
import { Builder } from '../../surfaces/builder/Builder'

/** Las tres superficies de §4 · F0.4.
 *
 *  `/admin` y `/builder` son de plataforma: quién puede abrirlas lo decide el
 *  backend por el token, no una condición acá.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <AuthGuard>
        <Console />
      </AuthGuard>
    ),
  },
  {
    path: '/admin/*',
    element: (
      <AuthGuard>
        <Admin />
      </AuthGuard>
    ),
  },
  {
    path: '/builder/*',
    element: (
      <AuthGuard>
        <Builder />
      </AuthGuard>
    ),
  },
]
