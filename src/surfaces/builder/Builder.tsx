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
import { useAdminCatalog, useBlocks, useLayoutDetail, useLayouts, useTenants } from '../../api/hooks'
import { BuilderChrome } from './BuilderChrome'
import { ContextView } from './ContextView'
import { TabEditor } from './TabEditor'
import { PanelConfigurator } from './PanelConfigurator'
import { ValidationSummary } from './ValidationSummary'
import { validarBorrador } from './validar'
import {
  agregar,
  agregarPanel,
  cambiarTipo,
  editar,
  editarOpcion,
  editarPanel,
  mover,
  quitar,
  quitarPanel,
  sembrar,
  sucio,
} from './borrador'
import { blockTable } from '../../catalog/blocks'
import { SurfaceMessage } from '../console/SurfaceMessage'
import { Label } from '../../render/primitives/Label'
import { ApiError } from '../../api/types'
import type { TabParaGuardar } from '../../api/admin'
import type { PanelConfig } from '../../api/types'
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

  // **El borrador se ata al layout que lo originó y se deriva en el render.**
  // Sin el `layoutId` adentro, elegir otra versión mostraría las pestañas de la
  // anterior hasta que algo volviera a montar; con un `useEffect` que lo
  // sincronice, el primer render pinta el borrador viejo y el segundo lo
  // corrige, que es un parpadeo y una ventana donde `sucio` miente.
  const [borrador, setBorrador] = useState<{ layoutId: string; tabs: TabParaGuardar[] } | null>(null)
  const [seleccion, setSeleccion] = useState<{ tab: number; panel: number } | null>(null)

  // **Las dos tablas que el binder necesita** · F4.10. `/config/blocks` manda qué
  // formas acepta cada tipo y qué spans; el catálogo de admin manda las métricas
  // del tenant SIN filtrar por rol, que es la lista que quien compone necesita.
  const bloques = useBlocks()
  const catalogo = useAdminCatalog(tenantActivo)
  const semilla = detalle.data === undefined ? null : sembrar(detalle.data)
  const tabs =
    borrador !== null && borrador.layoutId === version ? borrador.tabs : (semilla ?? [])

  // `api.blocks` devuelve `{ blocks }`, no un arreglo.
  const listaDeBloques = bloques.data?.blocks ?? []
  const tabla = blockTable(listaDeBloques)
  // **El panel elegido se resuelve por índice contra el borrador vigente**, y
  // puede no existir: quitar una pestaña deja una selección apuntando a un hueco.
  // Devolver `null` ahí es lo que impide un `undefined` que se propague hasta el
  // configurador y explote al leer `panel.tipo`.
  const configurable =
    seleccion === null ? null : (tabs[seleccion.tab]?.panels[seleccion.panel] ?? null)

  // **Se recalcula en cada render y eso es el punto** · F4.11: es feedback
  // inmediato. Memorizarlo por `tabs` sería la optimización obvia y la trampa
  // conocida — el borrador es un objeto nuevo en cada cambio, así que la memo
  // nunca acertaría y solo agregaría una comparación.
  const problemas = validarBorrador(tabs, tabla, catalogo.data?.metrics ?? [])

  // Elegir otra versión no necesita limpiar el borrador: se descarta por
  // identidad, porque su `layoutId` deja de coincidir.
  const cambiar = (siguiente: TabParaGuardar[]) => {
    if (version === null) return
    setBorrador({ layoutId: version, tabs: siguiente })
  }

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
        >
          {semilla === null ? null : (
            <TabEditor
              tabs={tabs}
              onEditar={(i, campo, valor) => cambiar(editar(tabs, i, campo, valor))}
              onAgregar={() => cambiar(agregar(tabs))}
              onQuitar={(i) => cambiar(quitar(tabs, i))}
              onMover={(i, d) => cambiar(mover(tabs, i, d))}
              onPanel={(tab, panel) => setSeleccion({ tab, panel })}
              onAgregarPanel={(i) => {
                const primero = listaDeBloques[0]
                if (primero === undefined) return
                // **El primer tipo de la tabla y sus mínimos, no un default
                // escrito acá.** `col_span` en 0 lo reemplaza el servicio por 3,
                // y 3 puede estar fuera del rango del tipo.
                cambiar(agregarPanel(tabs, i, primero.tipo, primero.colSpanMin, primero.rowSpanMin))
                setSeleccion({ tab: i, panel: tabs[i]?.panels.length ?? 0 })
              }}
              seleccion={seleccion}
              problemas={problemas}
              sucio={sucio(tabs, semilla)}
            />
          )}
          {semilla === null ? null : (
            <ValidationSummary problemas={problemas} nombres={tabs.map((t) => t.nombre)} />
          )}

          {configurable !== null && (
            <PanelConfigurator
              panel={configurable}
              bloques={listaDeBloques}
              tabla={tabla}
              metrics={catalogo.data?.metrics ?? []}
              problemas={problemas.filter(
                (p) => p.tab === seleccion?.tab && p.panel === seleccion.panel,
              )}
              onTipo={(tipo) => {
                const b = tabla.get(tipo as PanelConfig['tipo'])
                if (b === undefined || seleccion === null) return
                cambiar(
                  cambiarTipo(
                    tabs,
                    seleccion.tab,
                    seleccion.panel,
                    tipo,
                    b.colSpanMin,
                    b.colSpanMax,
                    b.rowSpanMin,
                    b.rowSpanMax,
                  ),
                )
              }}
              onMetrica={(metricId) => {
                if (seleccion === null) return
                cambiar(editarPanel(tabs, seleccion.tab, seleccion.panel, { metricId }))
              }}
              onSpan={(campo, valor) => {
                if (seleccion === null) return
                cambiar(editarPanel(tabs, seleccion.tab, seleccion.panel, { [campo]: valor }))
              }}
              onOpcion={(nombre, valor) => {
                if (seleccion === null) return
                cambiar(editarOpcion(tabs, seleccion.tab, seleccion.panel, nombre, valor))
              }}
              onQuitar={() => {
                if (seleccion === null) return
                cambiar(quitarPanel(tabs, seleccion.tab, seleccion.panel))
                setSeleccion(null)
              }}
            />
          )}
        </ContextView>
      )}
    </BuilderChrome>
  )
}
