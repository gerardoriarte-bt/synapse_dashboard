/** A · Administración de plataforma · F4.1
 *
 *  El contenedor: trae los datos y decide qué pantalla va en el chrome. §4 separa
 *  contenedor de presentacional, así que acá viven los hooks y en `AdminChrome`,
 *  `TenantList` y `CatalogView` no hay ninguno.
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
 *  **A4 · Catálogo está construida desde el 2026-09-15** —F4.5—: es la única de
 *  las cuatro de tenant que tiene ruta. Muestra lo que el cable sostiene y declara
 *  los cuatro campos de §7.3 que no puede afirmar.
 *
 *  Una pantalla que se declara pendiente **no es lo mismo que una que no está**:
 *  la primera dice qué la desbloquea, que es lo que §8 pide de cualquier estado.
 */
import { useState } from 'react'
import { useAdminCatalog, useTenants } from '../../api/hooks'
import { AdminChrome } from './AdminChrome'
import { CatalogView } from './CatalogView'
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
  feeds: {
    razon: 'Ningún endpoint declara la frescura por feed ni qué lo desbloquea.',
    desbloqueaCon: 'Sin tarea de backend todavía · va a PARA-BACKEND',
  },
}

export function Admin() {
  const [pantalla, setPantalla] = useState<PantallaId>('clientes')
  const [tenant, setTenant] = useState<string | null>(null)
  const tenants = useTenants()

  const lista = tenants.data ?? []
  const activo = tenant ?? lista[0]?.id ?? null

  // **El hook del catálogo se llama siempre y se apaga por `enabled`**, que es lo
  // que las reglas de hooks exigen: no puede colgar de `pantalla`. Mientras A4 no
  // esté abierta el `queryKey` ya está calentando el cache, y eso es deseable —
  // abrir la pestaña no espera una vuelta de red.
  const catalogo = useAdminCatalog(activo)

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

  const pendiente = PENDIENTES[pantalla]

  return (
    <AdminChrome
      activa={pantalla}
      onIr={setPantalla}
      tenants={lista}
      tenantActivo={activo}
      onTenant={setTenant}
    >
      {pendiente !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Label as="div">{pendiente.razon}</Label>
          <Label as="div">Se desbloquea con · {pendiente.desbloqueaCon}</Label>
        </div>
      ) : pantalla === 'catalogo' ? (
        <Catalogo query={catalogo} />
      ) : (
        <TenantList tenants={lista} onAbrir={() => setPantalla('cliente')} />
      )}
    </AdminChrome>
  )
}

/** Los tres estados de A4 dentro del chrome. **No usa `SurfaceMessage`**: aquello
 *  es de superficie entera y pinta su propio `<main>`; acá el chrome sigue en pie
 *  y lo que cambia es el contenido, igual que un estado de panel no reemplaza el
 *  shell. */
function Catalogo({ query }: { query: ReturnType<typeof useAdminCatalog> }) {
  if (query.isError) {
    return (
      <div className="flex flex-col gap-2">
        <Label as="div">No se pudo cargar el catálogo de este cliente</Label>
        <Label as="div">
          {query.error instanceof ApiError && query.error.httpStatus === 403
            ? 'Esta pantalla pide rol de administrador.'
            : (query.error.message === '' ? 'Sin detalle del servidor' : query.error.message)}
        </Label>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="self-start font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (query.data === undefined) return <Label as="div">Cargando el catálogo…</Label>

  return <CatalogView metrics={query.data.metrics} rejected={query.data.rejected} />
}
