/** A · Administración de plataforma · F4.1
 *
 *  El contenedor: trae los datos y decide qué pantalla va en el chrome. §4 separa
 *  contenedor de presentacional, así que acá viven los hooks y en `AdminChrome`
 *  y `TenantList` no hay ninguno.
 *
 *  **Las cinco pantallas de §7.3 están declaradas; tres todavía no se pueden
 *  construir**, y cada una dice por qué en vez de mostrarse vacía:
 *
 *  | | Qué falta |
 *  |---|---|
 *  | A2 · Ficha de cliente | Roles por tenant · B4.8, que ahora escribimos nosotros |
 *  | A3 · Usuarios | Lo mismo: sin CRUD de roles no hay qué mostrar |
 *  | A5 · Salud de feeds | No hay endpoint de frescura por feed |
 *
 *  **A4 · Catálogo sí se puede** —`GET /admin/tenants/:id/catalog` existe— y es
 *  F4.5, que va aparte.
 *
 *  Una pantalla que se declara pendiente **no es lo mismo que una que no está**:
 *  la primera dice qué la desbloquea, que es lo que §8 pide de cualquier estado.
 */
import { useState } from 'react'
import { useTenants } from '../../api/hooks'
import { AdminChrome } from './AdminChrome'
import { TenantList } from './TenantList'
import { SurfaceMessage } from '../console/SurfaceMessage'
import { Label } from '../../render/primitives/Label'
import { ApiError } from '../../api/types'
import type { PantallaId } from './pantallas'

/** Lo que cada pantalla pendiente espera. Acá y no en un comentario: la pantalla
 *  lo pinta, así que quien la abre se entera sin leer el código. */
const PENDIENTES: Partial<Record<PantallaId, { razon: string; desbloqueaCon: string }>> = {
  cliente: {
    razon: 'La ficha declara los roles del tenant y sus pestañas, y no hay de dónde leerlos.',
    desbloqueaCon: 'B4.8 · CRUD de roles por tenant',
  },
  usuarios: {
    razon: 'Sin CRUD de roles no hay permisos que mostrar por usuario.',
    desbloqueaCon: 'B4.8 · CRUD de roles por tenant',
  },
  catalogo: {
    razon: 'El endpoint existe; la pantalla es F4.5 y todavía no se construyó.',
    desbloqueaCon: 'F4.5 · vista del catálogo de métricas',
  },
  feeds: {
    razon: 'Ningún endpoint declara la frescura por feed ni qué lo desbloquea.',
    desbloqueaCon: 'Sin tarea de backend todavía · va a PARA-BACKEND',
  },
}

export function Admin() {
  const [pantalla, setPantalla] = useState<PantallaId>('clientes')
  const [tenant, setTenant] = useState<string | null>(null)
  const tenants = useTenants()

  if (tenants.isError) {
    // El 403 es el caso probable y tiene una causa concreta que conviene decir:
    // estas rutas piden rol `admin`, y un `planner` que abra `/admin` no está
    // ante un fallo del sistema sino ante un permiso que no tiene.
    return (
      <SurfaceMessage
        title="No se pudo cargar la administración"
        detail={
          // `ApiError` y no `Error`: el 403 es el caso probable y el genérico
          // no lo distingue.
          tenants.error instanceof ApiError && tenants.error.httpStatus === 403
            ? 'Esta superficie pide rol de administrador.'
            : (tenants.error.message ?? 'Sin detalle del servidor')
        }
        onRetry={() => void tenants.refetch()}
      />
    )
  }

  const lista = tenants.data ?? []
  const activo = tenant ?? lista[0]?.id ?? null
  const pendiente = PENDIENTES[pantalla]

  return (
    <AdminChrome
      activa={pantalla}
      onIr={setPantalla}
      tenants={lista}
      tenantActivo={activo}
      onTenant={setTenant}
    >
      {pendiente === undefined ? (
        <TenantList tenants={lista} onAbrir={() => setPantalla('cliente')} />
      ) : (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Label as="div">{pendiente.razon}</Label>
          <Label as="div">Se desbloquea con · {pendiente.desbloqueaCon}</Label>
        </div>
      )}
    </AdminChrome>
  )
}
