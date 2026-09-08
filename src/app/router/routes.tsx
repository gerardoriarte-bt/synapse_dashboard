import type { RouteObject } from 'react-router-dom'
import { AuthGuard } from '../auth/AuthGuard'
import { ConsoleContainer } from '../../surfaces/console/ConsoleContainer'
import { Login } from '../../surfaces/console/Login'
import { Admin } from '../../surfaces/admin/Admin'
import { Builder } from '../../surfaces/builder/Builder'

/** Las tres superficies de §4 · F0.4.
 *
 *  `/admin` y `/builder` son de plataforma: quién puede abrirlas lo decide el
 *  backend por el token, no una condición acá.
 */
export const routes: RouteObject[] = [
  {
    // **Sin guardia, y es la única.** El guardia manda acá cuando no hay
    // sesión; ponerle guardia sería un bucle. Hasta F0.5 esta ruta no existía
    // y el guardia redirigía a una pantalla en blanco.
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <ConsoleContainer />
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
