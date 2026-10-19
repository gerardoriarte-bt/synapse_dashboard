/** El acceso rápido «Volver al dashboard» · 2026-10-07
 *
 *  Decisión humana del 2026-10-07: «en el header debe aparecer un acceso rápido
 *  para volver al dashboard». Va en administración y en el builder; en la
 *  consola no, porque ya se está en el dashboard.
 *
 *  Lleva a la consola, que abre el dashboard activo del usuario. **Es el mismo
 *  destino desde las dos superficies**: desde el builder no abre el que se está
 *  componiendo, porque la consola muestra lo publicado y eso confundiría «lo
 *  que estoy editando» con «lo que ven los usuarios».
 */
import { Accion } from '../render/primitives/Accion'
import { RUTA_DEL_DASHBOARD } from './trabajo'

/** **Dice adónde va cuando el cliente de trabajo no es el propio** · F5.40,
 *  2026-10-19. La consola muestra el cliente de la SESIÓN —su cliente es el del
 *  token— y el botón llevaba ahí sin decirlo: se venía trabajando sobre otro y
 *  se terminaba mirando el propio. `alCliente` es el nombre del propio, y sólo
 *  llega cuando difiere del de trabajo. */
export function VolverAlDashboard({ onIr, alCliente }: { onIr: (ruta: string) => void; alCliente?: string | undefined }) {
  return (
    <Accion
      tamano="compacta"
      onClick={() => onIr(RUTA_DEL_DASHBOARD)}
      {...(alCliente === undefined ? {} : { etiqueta: `Volver a la consola de ${alCliente}, el cliente de tu sesión` })}
    >
      {/* `arrow-left` de línea · hereda el color. */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </svg>
      {alCliente === undefined ? 'Volver al dashboard' : `Volver a la consola de ${alCliente}`}
    </Accion>
  )
}
