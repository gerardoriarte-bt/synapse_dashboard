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
 *  **ESA TABLA ESTÁ VENCIDA Y SE DEJA COMO REGISTRO DE CÓMO SE VENCEN.** Cinco de
 *  las seis filas eran falsas al 2026-09-30: B3 (F4.21), B4 (F4.10), B5 (F4.12) y
 *  B6 (F5.19) están construidas, y la de B6 nombraba dos campos que el cable trae
 *  desde `168a761`. La única viva es B2, que espera una decisión de diseño.
 *
 *  **B6 · Historial de versiones se cableó el 2026-09-30** · §PEN:B6. Lo que la
 *  frenaba —«el cable no dice quién publicó ni qué cambió»— venció:
 *  `GET /admin/dashboards/{dashboardId}/publications` contesta 200 con
 *  `actor_user_id`, `actor_role`, `created_at` y un `diff` con resumen y detalle
 *  por panel. Medido contra `:4010` con `dev@synapse.local`: **cinco filas** en
 *  «Marca» y **cero** en «Overview».
 *
 *  **B1 · Contexto de edición está construida desde el 2026-09-15** —F4.7—: es la
 *  única de las seis con cable suficiente, y aun así sostiene dos de las cuatro
 *  cosas que §7.2 le pide.
 *
 *  Una pantalla que se declara pendiente no es lo mismo que una que no está: la
 *  primera dice qué la desbloquea, que es lo que §8 pide de cualquier estado.
 */
import { useNavigate } from 'react-router-dom'
import { useTemaGuardado } from '../useTemaGuardado'
import { useMemo, useState } from 'react'
import {
  useAdminCatalog,
  useBlocks,
  usePlots,
  useCreateDraft,
  useLayoutDetail,
  useLayouts,
  usePreview,
  usePublications,
  usePublishLayout,
  useMe,
  useRevertLayout,
  useRoles,
  useSaveLayout,
  useTenants,
  useUsers,
  useValidateLayout,
  useSaveTheme,
} from '../../api/hooks'
import { BuilderChrome } from './BuilderChrome'
import { ContextView } from './ContextView'
import { TabEditor } from './TabEditor'
import { Canvas } from './Canvas'
import { Library } from './Library'
import { PanelConfigurator } from './PanelConfigurator'
import { PublishBar } from './PublishBar'
import { RolePreview } from './RolePreview'
import { VersionHistory } from './VersionHistory'
import { createFormat, LOCALE_POR_DEFECTO } from '../../render/format'
import type { LayoutDetalle } from '../../api/admin'
import { SaveBar } from './SaveBar'
import { ValidationSummary } from './ValidationSummary'
import { validarBorrador } from './validar'
import {
  agregar,
  agregarPanel,
  asignarRoles,
  laVe,
  cambiarTipo,
  redimensionarPanel,
  reubicarPanel,
  editar,
  editarOpcion,
  editarPanel, quitarOPonerGrafico,
  mover,
  quitar,
  quitarPanel,
  sembrar,
  sucio,
} from './borrador'
import { blockTable } from '../../catalog/blocks'
import { SurfaceMessage } from '../console/SurfaceMessage'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { ApiError } from '../../api/types'
import type { TabParaGuardar } from '../../api/admin'
import type { PanelConfig } from '../../api/types'
import type { PantallaId } from './pantallas'

/** Qué espera cada pantalla. Acá y no en un comentario: la pantalla lo pinta, así
 *  que quien la abre se entera sin leer el código. */
/** ── LAS DOS ENTRADAS ESTABAN VENCIDAS Y SE PINTAN EN LA PANTALLA · 2026-09-30 ──
 *
 *  Esto no es un comentario: es copy que el cliente lee. Las dos filas decían
 *  algo falso y llevaban días diciéndolo.
 *
 *  · `grafico` decía «esa lista la sirve /config/plots, que no existe».
 *    **Existe desde el 2026-09-29** —la escribimos nosotros, `b6f0e09`— y
 *    `PlotPicker` está construido (F4.21). No era una pantalla pendiente: era
 *    una pantalla **que vive en otra**, igual que el binder. Se mudó abajo.
 *  · `historial` decía que no hay autor, ni diferencia, ni ruta para revertir.
 *    **Las tres son falsas**: `GET /admin/layouts/{id}/publications` contesta
 *    200 con `actor_user_id`, `actor_role`, `created_at` y un `diff` con
 *    resumen y detalle por panel, y `POST /admin/layouts/{id}/revert` existe.
 *    Medido contra el servicio el 2026-09-30.
 *
 *  **Y el copy cambió de idioma**, que es la otra mitad. Decía «§7.2 pide» y
 *  «LayoutVersion trae» en la pantalla de un cliente — está levantado en
 *  `docs/AUDITORIA-2026-09-30-usabilidad.md` §1.1. Lo que falta se sigue
 *  declarando; lo que cambia es a quién se le habla.
 *
 *  ── Y QUEDÓ VACÍO EL MISMO DÍA · B6 CABLEADA ───────────────────────────────
 *
 *  La entrada de `historial` decía «Está en construcción» con la pantalla ya
 *  escrita —`VersionHistory`, `VersionCard`, `cambios`— y sin montar: un aviso de
 *  andamio en la superficie de un cliente. **Un aviso que describe el estado del
 *  trabajo y no el del producto es un defecto**, igual que las dos entradas de
 *  arriba.
 *
 *  **La forma se deja declarada y no se borra**, mismo criterio que `Admin.tsx`
 *  desde el 2026-09-25: es la que hace que una pantalla pendiente diga qué falta
 *  en vez de mostrarse vacía, y la próxima que se declare la usa. */
const PENDIENTES: Partial<Record<PantallaId, { razon: string; desbloqueaCon: string }>> = {}

/** Pantallas de §7.2 que SÍ están construidas y **viven en otra**. No es lo
 *  mismo que pendiente, y decirlo «Pendiente» sería mentir sobre trabajo hecho.
 *
 *  `design.md` describe B4 como pantalla propia. Acá vive dentro de B1 porque
 *  **configurar un panel exige tenerlo elegido**, y elegirlo es de B1: una
 *  pantalla suelta obligaría a duplicar la selección de pestaña y de panel para
 *  llegar al mismo formulario. Es una desviación de la spec y va dicha. */
const EN_OTRA_PANTALLA: Partial<Record<PantallaId, string>> = {
  // **2026-10-06 · se mudaron al inspector del canvas** y salieron de la
  // navegación (D3). F4.10 y F4.21 siguen siendo una desviación de §7.2, que las
  // describe como pantallas propias, y va dicha: configurar un panel exige
  // tenerlo elegido, y donde se lo elige es el lienzo.
  metrica: 'La métrica de un panel se elige en el lienzo: tocá un panel y se abre su configuración a la derecha.',
  grafico: 'El gráfico de un panel se elige en el lienzo: tocá un panel y se abre su configuración a la derecha.',
}

export function Builder() {
  const navegar = useNavigate()
  // El tema se escribe igual que en la consola · `useSaveTheme` invalida `me`.
  const saveTheme = useSaveTheme()
  const yo = useMe()
  // El tema guardado lo aplica la superficie · ver `useTemaGuardado`.
  useTemaGuardado(yo.data?.user.preferencias?.tema)
  const [pantalla, irAPantalla] = useState<PantallaId>('contexto')
  /** **Cambiar de pantalla vuelve arriba** · visto el 2026-10-06: «Componer»
   *  se aprieta al fondo de B1 y el lienzo abría con el scroll de B1, a media
   *  grilla. Asignación y no `scrollTo`, que jsdom no implementa. */
  const setPantalla = (p: PantallaId) => {
    irAPantalla(p)
    document.documentElement.scrollTop = 0
  }
  const [tenant, setTenant] = useState<string | null>(null)
  const [versionElegida, setVersion] = useState<string | null>(null)

  const tenants = useTenants()
  const lista = tenants.data ?? []
  const tenantActivo = tenant ?? lista[0]?.id ?? null

  // **Los tres hooks se llaman siempre y se apagan por `enabled`.** No pueden
  // colgar de `pantalla` sin violar las reglas de hooks, y además calientan el
  // cache: cambiar de pantalla no espera una vuelta de red.
  const versiones = useLayouts(tenantActivo)
  /** **La versión se elige sola si nadie eligió** · 2026-10-06. B1 abría con la
   *  lista de versiones y nada más, y el canvas decía «Elegí una versión»: dos
   *  pasos antes de ver una pestaña. El borrador es casi siempre lo que se viene
   *  a editar; si no hay, la más reciente. Elegir otra sigue a un toque. */
  const version =
    versionElegida ??
    (versiones.data?.find((v) => v.estado === 'borrador') ?? versiones.data?.[0])?.id ??
    null
  const detalle = useLayoutDetail(version)

  // **El borrador se ata al layout que lo originó y se deriva en el render.**
  // Sin el `layoutId` adentro, elegir otra versión mostraría las pestañas de la
  // anterior hasta que algo volviera a montar; con un `useEffect` que lo
  // sincronice, el primer render pinta el borrador viejo y el segundo lo
  // corrige, que es un parpadeo y una ventana donde `sucio` miente.
  const [borrador, setBorrador] = useState<{ layoutId: string; tabs: TabParaGuardar[] } | null>(null)
  const [seleccion, setSeleccion] = useState<{ tab: number; panel: number } | null>(null)
  /** **La pestaña que se compone en B2.** El `.pen` la pone en el chrome —
   *  `PESTAÑA · eCommerce Overview`— porque el canvas compone UNA, no todas: un
   *  lienzo con los paneles de las cuatro pestañas encimados no es una
   *  composición, es una superposición. */
  const [tabActiva, setTabActiva] = useState(0)
  const [arrastrando, setArrastrando] = useState<string | null>(null)

  // **Las dos tablas que el binder necesita** · F4.10. `/config/blocks` manda qué
  // formas acepta cada tipo y qué spans; el catálogo de admin manda las métricas
  // del tenant SIN filtrar por rol, que es la lista que quien compone necesita.
  const bloques = useBlocks()
  // El repertorio · F4.21. Arriba con los demás hooks, y no junto a su uso:
  // puesto abajo quedaría después de los retornos tempranos, que es como se
  // rompió el contenedor de la consola el mismo día.
  const plots = usePlots()
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
  /** **`null` es «todos los roles»**, el filtro apagado · D5 de la auditoría
   *  del 2026-10-06. Hasta hoy caía al primer rol, y el selector se movía sin
   *  cambiar nada en pantalla. Ahora filtra las pestañas de B1 y del canvas. */
  const rolActivo = rol !== null && roles.data?.some((r) => r.id === rol) === true ? rol : null
  /** **B5 sí necesita UN rol**: previsualizar «todos» no es una vista de nadie. */
  const rolDePreview = rolActivo ?? roles.data?.[0]?.id ?? null
  const preview = usePreview(pantalla === 'preview' ? version : null, rolDePreview)

  const guardar = useSaveLayout(version)
  const validar = useValidateLayout(version)
  const publicar = usePublishLayout(version, tenantActivo)
  const duplicar = useCreateDraft(tenantActivo)
  const publicada = detalle.data?.layout.estado === 'publicado'

  /* ── B6 · EL HISTORIAL Y LA REVERSIÓN · §PEN:B6 · 2026-09-30 ───────────────
   *
   * **El dashboard sale de la versión abierta, y es el único camino.** El
   * historial se pide por dashboard —`GET /admin/dashboards/{id}/publications`,
   * cinco filas contra una de la ruta por layout— y lo que B1 elige es un
   * LAYOUT. `adaptarVersion` tiraba `dashboard_id` hasta hoy, así que hasta hoy
   * no había forma de llegar de lo elegido a lo que hay que pedir.
   *
   * Los tres hooks se llaman siempre y se apagan por `enabled`, como los de
   * arriba: no pueden colgar de `pantalla` sin violar las reglas de hooks.
   */
  const dashboardId = detalle.data?.layout.dashboardId ?? null
  const publicaciones = usePublications(dashboardId)
  const usuarios = useUsers(tenantActivo)
  const revertir = useRevertLayout(tenantActivo, dashboardId)

  /** **El locale de QUIEN MIRA**, igual que en administración y por la misma
   *  razón escrita en `Admin.tsx`: el builder CRUZA clientes —B1 los elige, y
   *  cada uno trae el suyo—, así que formatear con el del cliente haría que la
   *  misma columna de fechas cambiara de formato al cambiar de selector. En la
   *  consola es al revés porque ahí todo es de un tenant. */
  const format = useMemo(
    () => createFormat(yo.data?.tenant.locale || LOCALE_POR_DEFECTO),
    [yo.data?.tenant.locale],
  )

  /** El nombre del dashboard · **puede no resolverse, y se dice en vez de
   *  inventarse**.
   *
   *  `/config/me` es el único cable transcripto que trae nombres de dashboard, y
   *  es del usuario que MIRA: sirve mientras se compone el cliente propio. Para
   *  uno ajeno haría falta `GET /admin/tenants/{tenantId}/dashboards`, que el
   *  servicio tiene desde `168a761` y **nuestro cable no declara** — eso es
   *  trabajo nuestro, no un hueco suyo.
   *
   *  **El caso se ve de entrada**, medido el 2026-09-30: la base local tiene dos
   *  clientes con el nombre «Under Armour México» y el que el builder elige por
   *  defecto —`lista[0]`— no es el del usuario sembrado. */
  const dashboardNombre =
    yo.data === undefined || yo.data.tenant.id !== tenantActivo || dashboardId === null
      ? null
      : (yo.data.dashboards.find((d) => d.id === dashboardId)?.nombre ?? null)

  /** El cliente, por nombre. `null` mientras `GET /admin/tenants` no volvió. */
  const clienteNombre = lista.find((t) => t.id === tenantActivo)?.nombre ?? null

  /** **El mensaje del servidor y no uno nuestro.** El envelope trae `error` como
   *  cadena ya redactada en español desde `f70cec2`, así que traducir los códigos
   *  acá sería una segunda fuente para el mismo texto. Lo único propio es el
   *  caso en que la cadena viene vacía. */
  const errorAlRevertir =
    revertir.error === null
      ? null
      : revertir.error.message === ''
        ? 'No se pudo revertir'
        : revertir.error.message

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

  /** Las pestañas que ve el rol del filtro, con su índice en el borrador
   *  entero · D5. El filtro sólo decide qué se pinta. */
  const visibles = tabs.map((t, i) => ({ t, i })).filter(({ t }) => laVe(t, rolActivo))
  /** La pestaña del lienzo · si la elegida quedó fuera del filtro, la primera
   *  visible. Sin esto, cambiar de rol dejaba el lienzo en una pestaña que el
   *  selector ya no ofrece. */
  const tabEnLienzo = visibles.some(({ i }) => i === tabActiva) ? tabActiva : (visibles[0]?.i ?? 0)

  /** Ir a un problema · lleva al panel en el lienzo, o a B1 si es de la
   *  pestaña. Es lo que la lista de problemas no tenía. */
  const irA = (tab: number, panel: number | null) => {
    setTabActiva(tab)
    if (panel === null) {
      setSeleccion(null)
      setPantalla('contexto')
    } else {
      setSeleccion({ tab, panel })
      setPantalla('canvas')
    }
  }

  const revisionDelBorrador =
    semilla === null ? null : (
      <>
        <SaveBar
          publicada={publicada}
          error={errorAlGuardar}
          onDuplicar={() => {
            const v = detalle.data?.layout.versionId
            duplicar.mutate({ ...(v === undefined ? {} : { versionId: v }), tabs }, {
              onSuccess: (nuevo) => {
                setBorrador(null)
                setSeleccion(null)
                setVersion(nuevo.id)
              },
            })
          }}
          duplicando={duplicar.isPending}
        />
        <PublishBar
          sucio={sucio(tabs, semilla)}
          publicada={publicada}
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
                // fallo de red: se dice con las palabras del caso.
                publicar.error instanceof ApiError && publicar.error.httpStatus === 422
                ? 'El servidor rechazó la publicación: hay paneles inválidos'
                : `No se pudo publicar · ${publicar.error.message}`
          }
        />
        <ValidationSummary problemas={problemas} nombres={tabs.map((t) => t.nombre)} onIr={irA} />
      </>
    )

  const configurador =
    configurable === null ? null : (
      <PanelConfigurator
        plots={plots.data ?? []}
        onGrafico={(id) => {
          if (seleccion === null) return
          cambiar(quitarOPonerGrafico(tabs, seleccion.tab, seleccion.panel, id))
        }}
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
    )

  return (
    <BuilderChrome
      onChangeTheme={(theme) => saveTheme.mutate(theme)}
      // **La identidad sale del mismo `/config/me` que la consola y admin**:
      // no hay una fuente de identidad por superficie. Sin contexto no se pinta
      // el bloque — el chrome no inventa un nombre.
      onSalir={(ruta) => void navegar(ruta)}
      {...(yo.data === undefined
        ? {}
        : { identidad: { rol: yo.data.role.nombre, nombre: yo.data.user.nombre } })}
      activa={pantalla}
      onIr={setPantalla}
      contexto={{
        tenant: lista.find((t) => t.id === tenantActivo)?.nombre ?? null,
        rol: roles.data?.find((r) => r.id === rolActivo)?.nombre ?? null,
        // La pestaña en foco sale de qué panel se está configurando. Sin
        // selección no hay una: se dice «Todas», que es lo que el editor muestra.
        pestana:
          pantalla === 'canvas'
            ? (tabs[tabActiva]?.nombre ?? null)
            : seleccion === null
              ? null
              : (tabs[seleccion.tab]?.nombre ?? null),
        // **Cuenta pestañas tocadas, no pulsaciones.** Un contador de teclas
        // diría «47 cambios» por escribir un nombre.
        cambios: semilla === null ? 0 : tabs.filter((t, i) => JSON.stringify(t) !== JSON.stringify(semilla[i])).length,
      }}
      onGuardar={
        semilla !== null && sucio(tabs, semilla) && !publicada ? guardarBorrador : null
      }
      guardando={guardar.isPending}
      onValidar={
        semilla !== null && !sucio(tabs, semilla) && !publicada ? () => validar.mutate() : null
      }
      validando={validar.isPending}
      porQueNoPublicar={
        semilla === null || publicada
          ? null
          : sucio(tabs, semilla)
            ? 'Para publicar, guardá y validá.'
            : validar.data?.valido === false
              ? 'El servidor encontró problemas.'
              : 'Para publicar, validá.'
      }
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
        <div className="flex flex-col items-start gap-3">
          <Ayuda>{reubicada}</Ayuda>
          <Accion onClick={() => setPantalla('canvas')}>Ir al lienzo</Accion>
        </div>
      ) : pendiente !== undefined ? (
        <div className="flex flex-col gap-2">
          <Label as="div">Pendiente</Label>
          <Ayuda>{pendiente.razon}</Ayuda>
          <Ayuda>{`Se desbloquea con: ${pendiente.desbloqueaCon}`}</Ayuda>
        </div>
      ) : pantalla === 'canvas' ? (
        semilla === null ? (
          <div className="flex flex-col items-start gap-3">
            <Ayuda>Elegí una versión en «Contexto de edición» para componerla.</Ayuda>
            <Accion onClick={() => setPantalla('contexto')}>Ir a contexto de edición</Accion>
          </div>
        ) : visibles.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <Ayuda>
              {tabs.length === 0
                ? 'Esta versión no tiene pestañas. Se agregan en «Contexto de edición».'
                : 'Este rol no ve ninguna pestaña de esta versión.'}
            </Ayuda>
            <Accion onClick={() => setPantalla('contexto')}>Ir a contexto de edición</Accion>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {revisionDelBorrador}
            <div className="flex gap-6">
              <Library
                bloques={listaDeBloques}
                arrastrando={arrastrando}
                onArrastrar={setArrastrando}
                onAgregar={(tipo) => {
                  const b = tabla.get(tipo as PanelConfig['tipo'])
                  if (b === undefined) return
                  const conNuevo = agregarPanel(tabs, tabEnLienzo, tipo, b.colSpanMin, b.rowSpanMin)
                  cambiar(conNuevo)
                  setSeleccion({ tab: tabEnLienzo, panel: (conNuevo[tabEnLienzo]?.panels.length ?? 1) - 1 })
                }}
              />
              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div className="flex items-center gap-3">
                  <Label id="canvas-pestana">Componiendo</Label>
                  {/* Sólo las pestañas que ve el rol del filtro · D5. */}
                  <select
                    aria-labelledby="canvas-pestana"
                    className="h-8 bg-w2 text-ink text-cuerpo font-medium rounded-md px-3 border border-w5 cursor-pointer"
                    value={String(tabEnLienzo)}
                    onChange={(e) => {
                      setTabActiva(Number(e.target.value))
                      // La selección era de otra pestaña: su índice de panel no
                      // significa nada acá.
                      setSeleccion(null)
                    }}
                  >
                    {visibles.map(({ t, i }) => (
                      <option key={t.id ?? `nueva-${String(i)}`} value={String(i)}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <Canvas
                  panels={tabs[tabEnLienzo]?.panels ?? []}
                  tabla={tabla}
                  metricas={catalogo.data?.metrics ?? []}
                  seleccionado={seleccion?.tab === tabEnLienzo ? seleccion.panel : null}
                  onSeleccionar={(i) =>
                    setSeleccion(i === null ? null : { tab: tabEnLienzo, panel: i })
                  }
                  onReubicar={(i, colStart, destino) =>
                    cambiar(reubicarPanel(tabs, tabEnLienzo, i, colStart, destino))
                  }
                  onRedimensionar={(i, campo, delta) => {
                    const p = tabs[tabEnLienzo]?.panels[i]
                    const b = p === undefined ? undefined : tabla.get(p.tipo as PanelConfig['tipo'])
                    if (b === undefined) return
                    cambiar(
                      redimensionarPanel(
                        tabs,
                        tabEnLienzo,
                        i,
                        campo,
                        delta,
                        campo === 'colSpan' ? b.colSpanMin : b.rowSpanMin,
                        campo === 'colSpan' ? b.colSpanMax : b.rowSpanMax,
                      ),
                    )
                  }}
                  onSoltarTipo={(tipo, colStart, destino) => {
                    const b = tabla.get(tipo as PanelConfig['tipo'])
                    if (b === undefined) return
                    const conNuevo = agregarPanel(tabs, tabEnLienzo, tipo, b.colSpanMin, b.rowSpanMin)
                    const ultimo = (conNuevo[tabEnLienzo]?.panels.length ?? 1) - 1
                    cambiar(reubicarPanel(conNuevo, tabEnLienzo, ultimo, colStart, destino))
                    setSeleccion({ tab: tabEnLienzo, panel: ultimo })
                    setArrastrando(null)
                  }}
                  arrastrando={arrastrando}
                />
              </div>
            </div>

            {/* ── EL INSPECTOR · D1 de la auditoría del 2026-10-06 ─────────────
             *
             * **El canvas no configuraba**: movía y redimensionaba, y para
             * cambiar la métrica había que volver a B1 y bajar dos alturas de
             * scroll. Ahora el panel elegido se configura acá.
             *
             * **Encima del lienzo y no al costado**, porque al costado achicaría
             * los 1200 del lienzo 1:1 —«a otra escala las unidades de arrastre
             * mentirían»— y la cuenta 1200 + 300 = 1600 es del `.pen`. Tapa el
             * borde derecho mientras está abierto; `Escape` o «Cerrar» lo
             * cierran, y el panel sigue elegido en el lienzo. */}
            {configurable !== null && seleccion !== null && seleccion.tab === tabEnLienzo && (
              <aside
                aria-label="Configuración del panel"
                className="fixed right-0 top-0 bottom-0 z-20 w-[440px] overflow-y-auto border-l border-w4 bg-panel p-6 shadow-2xl"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSeleccion(null)
                }}
              >
                <div className="flex justify-end pb-2">
                  <Accion tamano="compacta" onClick={() => setSeleccion(null)} etiqueta="Cerrar la configuración del panel">
                    Cerrar
                  </Accion>
                </div>
                {configurador}
              </aside>
            )}
          </div>
        )
      ) : pantalla === 'preview' ? (
        <Preview
          roles={roles.data ?? []}
          rolActivo={rolDePreview}
          onRol={setRol}
          query={preview}
          onVolver={() => setPantalla('contexto')}
          hayVersion={version !== null}
          {...(detalle.data === undefined ? {} : { completo: detalle.data })}
        />
      ) : pantalla === 'historial' ? (
        /* ── B6 · §PEN:B6 ──────────────────────────────────────────────────
         *
         * **Los tres estados los decide el contenedor**, y eso lo declara el
         * propio `VersionHistory`: el `.pen` no dibuja carga ni error para B6
         * —sus vacíos y su esqueleto son de TABLAS de administración, y B6 es
         * una lista de tarjetas—. El vacío SÍ lo pinta la pantalla, porque
         * «cero publicaciones» es un dato y no una espera.
         */
        version === null ? (
          // Mismo vacío con salida que los dos de B5, y por la misma razón:
          // un texto que manda a otra pantalla sin forma de llegar es «un
          // estado sin salida», que §8 llama una queja.
          <div className="flex flex-col items-start gap-3">
            <Ayuda>Elegí una versión en «Contexto de edición» para ver su historial.</Ayuda>
            <Accion onClick={() => setPantalla('contexto')}>Ir a contexto de edición</Accion>
          </div>
        ) : publicaciones.isError ? (
          <SurfaceMessage
            title="No se pudo traer el historial"
            detail={
              publicaciones.error.message === ''
                ? 'Sin detalle del servidor'
                : publicaciones.error.message
            }
            onRetry={() => void publicaciones.refetch()}
          />
        ) : publicaciones.data === undefined || clienteNombre === null ? (
          <Label as="div">Trayendo el historial…</Label>
        ) : (
          <div className="flex flex-col gap-3">
            {/* El fallo de la reversión va ARRIBA de la lista y no dentro de la
                tarjeta: la acción cambia la lista entera, así que su resultado
                no es de una fila. */}
            {errorAlRevertir !== null && <Label as="div">{errorAlRevertir}</Label>}
            {revertir.isPending && <Label as="div">Revirtiendo…</Label>}
            <VersionHistory
              publicaciones={publicaciones.data}
              layouts={versiones.data ?? []}
              dashboardNombre={dashboardNombre}
              clienteNombre={clienteNombre}
              usuarios={usuarios.data ?? []}
              metricas={catalogo.data?.metrics ?? []}
              format={format}
              // **Los dos ids se pasan TAL CUAL.** El `layoutId` es el publicado
              // y el `toLayoutId` el destino, y los dos salen de la fila que se
              // apretó: derivar acá cuál es el publicado sería la segunda
              // derivación de lo mismo, que es cómo una se queda vieja.
              //
              // La guarda de `isPending` evita dos reversiones por dos clics:
              // cada una PUBLICA una versión nueva, así que la segunda no es
              // idempotente.
              onRevertir={(v) => {
                if (revertir.isPending) return
                revertir.mutate(v)
              }}
            />
          </div>
        )
      ) : (
        <div className="flex flex-col gap-6">
          {revisionDelBorrador}
          <ContextView
            tenants={lista}
            tenantActivo={tenantActivo}
            onTenant={(id) => {
              setTenant(id)
              setVersion(null)
              setRol(null)
            }}
            roles={roles.data ?? []}
            rolActivo={rolActivo}
            onRol={(id) => {
              setRol(id)
              setSeleccion(null)
            }}
            versiones={versiones.data ?? []}
            versionActiva={version}
            onVersion={setVersion}
            fecha={(iso) => format.calendar(iso)}
          >
            {semilla === null ? null : (
              <TabEditor
                tabs={tabs}
                roles={roles.data ?? []}
                rolActivo={rolActivo}
                onEditar={(i, campo, valor) => cambiar(editar(tabs, i, campo, valor))}
                onAgregar={() => cambiar(agregar(tabs, rolActivo === null ? [] : [rolActivo]))}
                onQuitar={(i) => cambiar(quitar(tabs, i))}
                onMover={(i, d) => cambiar(mover(tabs, i, d))}
                onRoles={(i, r) => cambiar(asignarRoles(tabs, i, r))}
                onComponer={(i) => {
                  setTabActiva(i)
                  setSeleccion(null)
                  setPantalla('canvas')
                }}
                problemas={problemas.filter((p) => p.panel === null)}
              />
            )}
          </ContextView>
        </div>
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
  onVolver,
  hayVersion,
  completo,
}: {
  roles: readonly { id: string; nombre: string }[]
  rolActivo: string | null
  onRol: (id: string) => void
  query: ReturnType<typeof usePreview>
  onVolver: () => void
  hayVersion: boolean
  /** El layout SIN lente · de acá salen los huecos, por diferencia contra lo
   *  que el preview devuelve. Ya está cargado para el editor, así que no cuesta
   *  una consulta más. */
  completo?: LayoutDetalle | undefined
}) {
  // ── LOS DOS VACÍOS DE B5 LLEVAN SALIDA · 2026-09-25 ────────────────────────
  //
  // **B5 no tiene chrome, y eso es del dibujo**: `sinChrome(forma)` en
  // `BuilderChrome` — el `.pen` dibuja «Vista previa · rol Planner sin componer»
  // sin cabecera. Lo que NO es del dibujo es que estos dos vacíos mandaran a
  // «Contexto de edición» sin ninguna forma de llegar: medido el 2026-09-25,
  // nueve botones antes de entrar y **cero** después. El texto pedía ir a un
  // lugar inalcanzable sin escribir la URL.
  //
  // «Un estado sin salida es una queja» · §8, y es la misma frase que
  // `StateBody` lleva escrita. El manejador ya venía pasado —`onVolver`— y sólo
  // lo usaba la rama con datos, así que el CTA no promete nada que no exista:
  // es la regla del CTA muerto cumplida, no esquivada.
  if (!hayVersion) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Ayuda>Elegí una versión en «Contexto de edición» para previsualizarla.</Ayuda>
        <Accion onClick={onVolver}>Ir a contexto de edición</Accion>
      </div>
    )
  }
  if (roles.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Ayuda>Este cliente todavía no tiene roles. Se definen en su ficha, en administración.</Ayuda>
        <Accion onClick={onVolver}>Ir a contexto de edición</Accion>
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
              ? // La ruta de vista previa por rol está escrita en nuestro fork y el servicio
      // desplegado no la sirve · B4.9.
      'La vista previa por rol todavía no se puede consultar'
              : (query.error.message === '' ? 'Sin detalle del servidor' : query.error.message)}
          </Label>
        </div>
      ) : query.data === undefined ? (
        <Label as="div">Resolviendo el preview…</Label>
      ) : (
        <RolePreview
          preview={query.data}
          {...(completo === undefined ? {} : { completo })}
          onVolver={onVolver}
        />
      )}
    </div>
  )
}
