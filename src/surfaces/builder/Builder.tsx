/** B · Builder · composición visual · F4.6
 *
 *  El contenedor. §4 separa contenedor de presentacional, así que acá van los
 *  hooks y en `BuilderChrome` no hay ninguno.
 *
 *  **Las seis pantallas de §7.2 están declaradas; cinco todavía no se pueden
 *  construir**, y cada una dice qué la desbloquea en vez de mostrarse vacía. Lo
 *  que las frena no es lo mismo en todas, y esa distinción es la que importa:
 *
 *  | | Qué falta | De qué orden |
 *  |---|---|---|
 *  | B2 · Canvas | La interacción de arrastre no está especificada en `design.md` | **Diseño**, no cable |
 *  | B3 · Selector de gráfico | `/config/plots` · B1.21 · es F4.21 | Cable |
 *  | B4 · Binder de métrica | Nada: es F4.10 y se puede tomar | Orden del plan |
 *  | B5 · Vista previa por rol | Roles por tenant · B4.9, que escribimos nosotros | Cable |
 *  | B6 · Historial | El cable no dice **quién** publicó ni **qué cambió** | Cable |
 *
 *  **B1 · Contexto de edición está construida desde el 2026-09-15** —F4.7—: es la
 *  única de las seis con cable suficiente, y aun así sostiene dos de las cuatro
 *  cosas que §7.2 le pide.
 *
 *  Una pantalla que se declara pendiente no es lo mismo que una que no está: la
 *  primera dice qué la desbloquea, que es lo que §8 pide de cualquier estado.
 */
import { useState } from 'react'
import { useLayoutDetail, useLayouts, useTenants } from '../../api/hooks'
import { BuilderChrome } from './BuilderChrome'
import { ContextView } from './ContextView'
import { SurfaceMessage } from '../console/SurfaceMessage'
import { Label } from '../../render/primitives/Label'
import { ApiError } from '../../api/types'
import type { PantallaId } from './pantallas'

/** Qué espera cada pantalla. Acá y no en un comentario: la pantalla lo pinta, así
 *  que quien la abre se entera sin leer el código. */
const PENDIENTES: Partial<Record<PantallaId, { razon: string; desbloqueaCon: string }>> = {
  canvas: {
    razon:
      'design.md describe el resultado del arrastre —slot vacío, badge HEREDADO, colisión marcada— y no la interacción: qué agarra el cursor, cómo se redimensiona, qué pasa al soltar fuera de la grilla.',
    desbloqueaCon: 'Una decisión de diseño · F4.9 no se toma sin ella',
  },
  grafico: {
    razon:
      'La biblioteca lista los gráficos por grupo y esa lista la sirve /config/plots, que no existe.',
    desbloqueaCon: 'B1.21 · la ruta /config/plots · después F4.21',
  },
  metrica: {
    razon: 'El catálogo y la tabla de bloques ya están; falta construir la pantalla.',
    desbloqueaCon: 'F4.10 · configurador de panel',
  },
  preview: {
    razon: 'Renderiza como lo verá un ROL, y no hay de dónde leer los roles del tenant.',
    desbloqueaCon: 'B4.9 · preview por rol, que escribimos nosotros en un fork',
  },
  historial: {
    razon:
      '§7.2 pide quién, cuándo y qué cambió. LayoutVersion trae cuándo y nada más: ni autor ni diferencia contra la versión anterior, y tampoco hay ruta para revertir.',
    desbloqueaCon: 'B4.10 · autor, diferencia y reversión en LayoutVersion',
  },
}

export function Builder() {
  const [pantalla, setPantalla] = useState<PantallaId>('contexto')
  const [tenant, setTenant] = useState<string | null>(null)
  const [version, setVersion] = useState<string | null>(null)

  const tenants = useTenants()
  const lista = tenants.data ?? []
  const tenantActivo = tenant ?? lista[0]?.id ?? null

  // **Los tres hooks se llaman siempre y se apagan por `enabled`.** No pueden
  // colgar de `pantalla` sin violar las reglas de hooks, y además calientan el
  // cache: cambiar de pantalla no espera una vuelta de red.
  const versiones = useLayouts(tenantActivo)
  const detalle = useLayoutDetail(version)

  if (tenants.isError) {
    // Mismo caso probable que en administración: estas rutas piden rol `admin`,
    // y un `planner` que abra `/builder` no está ante un fallo sino ante un
    // permiso que no tiene.
    return (
      <SurfaceMessage
        title="No se pudo abrir el builder"
        detail={
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
    <BuilderChrome activa={pantalla} onIr={setPantalla}>
      {pendiente !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Label as="div">{pendiente.razon}</Label>
          <Label as="div">Se desbloquea con · {pendiente.desbloqueaCon}</Label>
        </div>
      ) : (
        <ContextView
          tenants={lista}
          tenantActivo={tenantActivo}
          onTenant={(id) => {
            setTenant(id)
            // **La versión se olvida al cambiar de cliente.** Un `layoutId` de
            // otro tenant sigue resolviendo —la ruta es `/admin/layouts/{id}` y
            // no cuelga del tenant—, así que sin esto la pantalla mostraría las
            // pestañas de un cliente bajo el nombre de otro.
            setVersion(null)
          }}
          versiones={versiones.data ?? []}
          versionActiva={version}
          onVersion={setVersion}
          detalle={detalle.data}
        />
      )}
    </BuilderChrome>
  )
}
