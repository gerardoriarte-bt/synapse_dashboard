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
import {
  useAdminCatalog,
  useBlocks,
  useCreateDraft,
  useLayoutDetail,
  useLayouts,
  usePreview,
  usePublishLayout,
  useRoles,
  useSaveLayout,
  useTenants,
  useValidateLayout,
} from '../../api/hooks'
import { BuilderChrome } from './BuilderChrome'
import { ContextView } from './ContextView'
import { TabEditor } from './TabEditor'
import { PanelConfigurator } from './PanelConfigurator'
import { PublishBar } from './PublishBar'
import { RolePreview } from './RolePreview'
import { SaveBar } from './SaveBar'
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
import type { Metric, PanelConfig } from '../../api/types'
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
  historial: {
    razon:
      '§7.2 pide quién, cuándo y qué cambió. LayoutVersion trae cuándo y nada más: ni autor ni diferencia contra la versión anterior, y tampoco hay ruta para revertir.',
    desbloqueaCon: 'B4.10 · autor, diferencia y reversión en LayoutVersion',
  },
}

/** Pantallas de §7.2 que SÍ están construidas y **viven en otra**. No es lo
 *  mismo que pendiente, y decirlo «Pendiente» sería mentir sobre trabajo hecho.
 *
 *  `design.md` describe B4 como pantalla propia. Acá vive dentro de B1 porque
 *  **configurar un panel exige tenerlo elegido**, y elegirlo es de B1: una
 *  pantalla suelta obligaría a duplicar la selección de pestaña y de panel para
 *  llegar al mismo formulario. Es una desviación de la spec y va dicha. */
const EN_OTRA_PANTALLA: Partial<Record<PantallaId, string>> = {
  metrica:
    'El binder está construido —F4.10— y vive en «Contexto de edición»: se elige un panel de una pestaña y se configura ahí. Configurar un panel exige tenerlo elegido, y elegirlo es de B1.',
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

  /** **El rol es del CONTEXTO de edición, no de B5.** Lo elige B1 —«el rol
   *  define qué pestañas se editan», dice el `.pen`— y B5 lo usa para pedir su
   *  preview. Tenerlo acá arriba es lo que deja pintarlo en el chrome de todas
   *  las pantallas de composición. */
  const [rol, setRol] = useState<string | null>(null)
  const roles = useRoles(tenantActivo)
  const rolActivo = rol ?? roles.data?.[0]?.id ?? null
  const preview = usePreview(pantalla === 'preview' ? version : null, rolActivo)

  const guardar = useSaveLayout(version)
  const validar = useValidateLayout(version)
  const publicar = usePublishLayout(version, tenantActivo)
  const duplicar = useCreateDraft(tenantActivo)
  const publicada = detalle.data?.layout.estado === 'publicado'

  /** El 409 tiene nombre propio y una salida concreta; el resto, lo que diga el
   *  servicio. Sin distinguirlos, «error al guardar» taparía la única acción que
   *  desatasca. */
  const errorAlGuardar =
    guardar.error === null
      ? null
      : guardar.error instanceof ApiError && guardar.error.code === 'REGLA_LAYOUT_PUBLICADO'
        ? 'Alguien publicó esta versión mientras la editabas · duplicala para conservar los cambios'
        : (guardar.error.message === '' ? 'No se pudo guardar' : guardar.error.message)

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
  const reubicada = EN_OTRA_PANTALLA[pantalla]

  /** **Guardar invalida el veredicto anterior**, y **el borrador local se
   *  descarta**. Lo segundo es lo que importa: la respuesta trae los `id` que el
   *  servidor acaba de asignar a lo nuevo, y si el borrador sobreviviera esos
   *  seguirían sin `id` — el guardado siguiente los crearía otra vez. */
  const guardarBorrador = () => {
    validar.reset()
    guardar.mutate(tabs, {
      onSuccess: () => {
        setBorrador(null)
        setSeleccion(null)
      },
    })
  }

  return (
    <BuilderChrome
      activa={pantalla}
      onIr={setPantalla}
      contexto={{
        tenant: lista.find((t) => t.id === tenantActivo)?.nombre ?? null,
        rol: roles.data?.find((r) => r.id === rolActivo)?.nombre ?? null,
        // La pestaña en foco sale de qué panel se está configurando. Sin
        // selección no hay una: se dice «Todas», que es lo que el editor muestra.
        pestana: seleccion === null ? null : (tabs[seleccion.tab]?.nombre ?? null),
        // **Cuenta pestañas tocadas, no pulsaciones.** Un contador de teclas
        // diría «47 cambios» por escribir un nombre.
        cambios: semilla === null ? 0 : tabs.filter((t, i) => JSON.stringify(t) !== JSON.stringify(semilla[i])).length,
      }}
      onGuardar={
        semilla !== null && sucio(tabs, semilla) && !publicada ? guardarBorrador : null
      }
      guardando={guardar.isPending}
      onPublicar={
        // El permiso es el mismo que usa `PublishBar`: el servidor dijo válido y
        // no se tocó nada desde entonces. Sin él, el chrome dice por qué en vez
        // de ofrecer un botón que no puede cumplir.
        validar.data?.valido === true && semilla !== null && !sucio(tabs, semilla) && !publicada
          ? () => publicar.mutate(detalle.data?.layout.versionId)
          : null
      }
    >
      {reubicada !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Está construida, en otra pantalla</Label>
          <Label as="div">{reubicada}</Label>
        </div>
      ) : pendiente !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Label as="div">{pendiente.razon}</Label>
          <Label as="div">Se desbloquea con · {pendiente.desbloqueaCon}</Label>
        </div>
      ) : pantalla === 'preview' ? (
        <Preview
          roles={roles.data ?? []}
          rolActivo={rolActivo}
          onRol={setRol}
          query={preview}
          metricas={catalogo.data?.metrics ?? []}
          onVolver={() => setPantalla('contexto')}
          hayVersion={version !== null}
        />
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
          roles={roles.data ?? []}
          rolActivo={rolActivo}
          onRol={setRol}
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
            />
          )}
          {semilla === null ? null : (
            <SaveBar
              problemas={problemas.length}
              publicada={publicada}
              error={errorAlGuardar}
              onDuplicar={() => {
                duplicar.mutate(detalle.data?.layout.versionId, {
                  onSuccess: (nuevo) => {
                    setBorrador(null)
                    setSeleccion(null)
                    setVersion(nuevo.id)
                  },
                })
              }}
              duplicando={duplicar.isPending}
            />
          )}

          {semilla === null ? null : (
            <PublishBar
              sucio={sucio(tabs, semilla)}
              publicada={publicada}
              validando={validar.isPending}
              veredicto={
                validar.data === undefined
                  ? null
                  : { valido: validar.data.valido, problemas: validar.data.problemas }
              }
              nombreDeTab={(tabId) =>
                detalle.data?.tabs.find((t) => t.tab.id === tabId)?.tab.nombre ?? 'El layout'
              }
              error={
                publicar.error === null
                  ? validar.error === null
                    ? null
                    : `No se pudo validar · ${validar.error.message}`
                  : // 422 es «hay paneles inválidos», que es información, no un
                    // fallo del sistema · B4.15.
                    publicar.error instanceof ApiError && publicar.error.httpStatus === 422
                    ? 'El servidor rechazó la publicación: hay paneles inválidos'
                    : `No se pudo publicar · ${publicar.error.message}`
              }
              onValidar={() => validar.mutate()}
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

/** B5 dentro del chrome · el selector de rol más los tres estados del preview.
 *
 *  **El selector de rol vive acá y no en `RolePreview`**: aquel pinta lo que el
 *  servidor devolvió y no decide de quién. §4 separa contenedor de
 *  presentacional, y acá la separación además evita que la vista previa —que
 *  §7.2 pide «sin chrome de edición»— tenga adentro un control de edición. */
function Preview({
  roles,
  rolActivo,
  onRol,
  query,
  metricas,
  onVolver,
  hayVersion,
}: {
  roles: readonly { id: string; nombre: string }[]
  rolActivo: string | null
  onRol: (id: string) => void
  query: ReturnType<typeof usePreview>
  metricas: readonly Metric[]
  onVolver: () => void
  hayVersion: boolean
}) {
  if (!hayVersion) {
    return <Label as="div">Elegí una versión en «Contexto de edición» para previsualizarla</Label>
  }
  if (roles.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Label as="div">Este cliente no tiene roles definidos</Label>
        <Label as="div">Se definen en la ficha de cliente de administración · F4.3</Label>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Label id="preview-rol">Rol</Label>
        <select
          aria-labelledby="preview-rol"
          className="bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
          value={rolActivo ?? ''}
          onChange={(e) => onRol(e.target.value)}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
      </div>

      {query.isError ? (
        <div className="flex flex-col gap-2">
          <Label as="div">No se pudo resolver el preview</Label>
          <Label as="div">
            {query.error instanceof ApiError && query.error.httpStatus === 404
              ? 'El servicio desplegado todavía no sirve esta ruta · está escrita en el fork · B4.9'
              : (query.error.message === '' ? 'Sin detalle del servidor' : query.error.message)}
          </Label>
        </div>
      ) : query.data === undefined ? (
        <Label as="div">Resolviendo el preview…</Label>
      ) : (
        <RolePreview preview={query.data} metricas={metricas} onVolver={onVolver} />
      )}
    </div>
  )
}
