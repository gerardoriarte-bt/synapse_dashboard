/** El chrome del builder · F4.6, rehecho el 2026-09-15 contra el `.pen`
 *
 *  **Dos cosas no son uniformes acá, y las dos salen de `pantallas.ts`.**
 *
 *  ── EL ANCHO ───────────────────────────────────────────────────────────────
 *
 *  §ANCLA:ANCHO-1 · principio 4: «Ancho mínimo por superficie: 1280 en
 *  administración, 1600 en el builder». La excepción de B5 a 1440 está abajo.
 *
 *  §4 da dos números con dos razones: **1600** en B1–B4 y B6 —1200 de lienzo 1:1
 *  más 300 de biblioteca, «a otra escala las unidades de arrastre mentirían»— y
 *  **1440 en B5**, que muestra la consola del cliente a su ancho real.
 *
 *  **La clase es estática y el número es dato.** Tailwind poda lo que su escáner
 *  no ve escrito, así que una utilidad armada por interpolación compilaría,
 *  dejaría el atributo `class` correcto en el DOM y **nunca llegaría al CSS**.
 *  Lo cubre `tests/tokens/escala.test.ts`.
 *
 *  ── EL CHROME ──────────────────────────────────────────────────────────────
 *
 *  **El contexto va en la cabecera y es persistente**, que es la corrección del
 *  2026-09-15: el `.pen` dibuja `TENANT · ROL · PESTAÑA` arriba en B2, B4 y B6, y
 *  la primera versión de este componente los tenía en barras dentro del cuerpo.
 *  Al salir de B1 se perdía de vista sobre qué se estaba componiendo, y «3
 *  cambios sin guardar» desaparecía al cambiar de pantalla — que es justo cuando
 *  hace falta.
 *
 *  **B1 no lo muestra** porque es donde se elige: enseñar el contexto ya resuelto
 *  en la pantalla que lo resuelve es decir dos veces lo mismo, y la segunda
 *  parece un control.
 *
 *  **Y B5 no lleva chrome ninguno**: «SIN CHROME DE EDICIÓN · DATOS REALES · ASÍ
 *  SE PUBLICA». Su única banda es volver a editar, y la pinta ella.
 */
import { useLayoutEffect, useRef } from 'react'
import { IdentityBlock } from '../IdentityBlock'
import { MenuDeTrabajo } from '../MenuDeTrabajo'
import { VolverAlDashboard } from '../VolverAlDashboard'
import type { Theme } from '../../tokens/theme'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import { SelectorDeCliente } from '../SelectorDeCliente'
import { Wordmark } from '../console/Wordmark'
import { PANTALLAS } from './pantallas'
import type { FormaDeChrome, PantallaId } from './pantallas'

/** **Predicados y no comparaciones sueltas, y la razón es de TypeScript.**
 *
 *  Este componente sostiene las CUATRO formas de chrome; hoy la tabla usa tres,
 *  porque B1 tomó prestada `composicion` hasta que F4.9 mueva la composición a
 *  B2. Comparando `pantalla.chrome` en línea, el análisis de flujo lo estrecha a
 *  las tres en uso y marca la rama de `identidad` como código muerto — cierto
 *  hoy, falso con F4.9, y en el medio la puerta en rojo.
 *
 *  Un parámetro tipado no se estrecha en el sitio de llamada, así que estas dos
 *  funciones dicen lo que el componente soporta y no lo que la tabla usa hoy. */
const sinChrome = (f: FormaDeChrome) => f === 'ninguno'
const conContexto = (f: FormaDeChrome) => f === 'composicion' || f === 'contexto'
/** **`contexto` se MIRA, no se toca** · la cuarta columna de la tabla de
 *  `pantallas.ts` decía «Contexto · volver a editar» desde el 2026-09-15 y este
 *  componente no la distinguía de `composicion`: las dos caían en el mismo bloque
 *  de acciones, así que B6 pintaba `VISTA PREVIA`, `PUBLICAR` y el contador de
 *  cambios sin guardar sobre una pantalla de sólo lectura.
 *
 *  **No se vio hasta el 2026-09-30 porque B6 no estaba montada**: la única
 *  pantalla con esta forma mostraba un aviso de «Pendiente», y un aviso no tiene
 *  nada que publicar. El `.pen` lo dibuja explícito —frame `Volver`, `gwJUk`:
 *  icono `pencil` más `VOLVER A EDITAR`, y ningún otro control a la derecha—. */
const soloContexto = (f: FormaDeChrome) => f === 'contexto'

/** Una entrada por ancho de `pantallas.ts`. Escritas, no interpoladas. */
const ANCHO: Readonly<Record<number, string>> = {
  1600: 'min-w-[1600px]',
  1440: 'min-w-[1440px]',
}

export type ContextoDeEdicion = {
  tenant: string | null
  /** El dashboard que se edita · 2026-10-07, Cliente → Dashboard → Editor. */
  dashboard: string | null
  /** «Borrador v4» / «Publicada v3» · la versión que tiene el editor abierta. */
  version: string | null
  rol: string | null
  pestana: string | null
  /** Cuántas pestañas tienen cambios sin guardar. `0` = limpio. */
  cambios: number
}

/** **El estado del guardado, siempre a la vista** · 2026-10-07.
 *
 *  Decisión humana (D2 de `docs/AUDITORIA-2026-10-07-flujo-de-edicion.md`):
 *  guardado automático y explícito a la vez, «mostrando los estados del botón
 *  cuando quede guardado». Hasta hoy «Guardar» aparecía sólo con cambios y
 *  desaparecía al guardar, que se ve igual que un botón roto. */
export type EstadoDeGuardado = {
  estado: 'sin-borrador' | 'lectura' | 'limpio' | 'sucio' | 'guardando' | 'error'
  /** La hora del último guardado de esta sesión, ya formateada · `null` si no
   *  se guardó todavía. */
  ultimo: string | null
  error: string | null
  onGuardar: () => void
}

/** El tilde de «Guardado», de línea · iconografía §1, hereda el color. Una caja
 *  y no el glifo ✓: el subconjunto latin de Inter no lo trae. */
function Tilde() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5l3.2 3L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** **Guardar va acá aunque el `.pen` no dibuje el botón.**
 *
 *  El diseño muestra «3 CAMBIOS SIN GUARDAR» en la cabecera y, al lado, solo
 *  `VISTA PREVIA` y `PUBLICAR`. §7.2 sí exige el guardado explícito —«guardado
 *  explícito, con indicador de cambios sin guardar»—, así que el botón hace
 *  falta y el único lugar coherente es junto al indicador que lo motiva.
 *
 *  Va dicho porque es una desviación: si el diseño resolvió el guardado de otra
 *  forma que no llegó al `.pen`, esto es lo que hay que cambiar. */
const NOTA_GUARDAR = 'Guardar'

type Props = {
  activa: PantallaId
  onIr: (id: PantallaId) => void
  /** Volver a la consola · `undefined` no pinta el control. */
  /** Quién compone · el bloque de identidad de `B2`. Sin él no se pinta: el
   *  chrome no inventa un nombre. */
  identidad?: { rol: string; nombre: string; correo?: string } | undefined
  /** Ir a una RUTA · el menú de trabajo y «Volver al dashboard». La navegación
   *  es del contenedor. */
  onSalir: (ruta: string) => void
  /** Cerrar sesión, desde el menú del nombre · sin manejador no se pinta. */
  onCerrarSesion?: (() => void) | undefined
  /** **El tema, que viaja hasta `IdentityBlock`** · 2026-10-02. Opcional por la
   *  misma razón que allá: sin manejador la sección no se pinta. */
  onChangeTheme?: (theme: Theme) => void

  contexto: ContextoDeEdicion
  /** **El cliente de trabajo, en la cabecera y destacado** · 2026-10-06. Es el
   *  único lugar del builder donde se elige. */
  clientes: readonly { id: string; nombre: string }[]
  clienteActivo: string | null
  onCliente: (id: string) => void
  /** `null` sin versión: no hay nada que previsualizar. */
  onVistaPrevia: (() => void) | null
  /** `null` cuando no hay nada que publicar todavía · la razón la da la pantalla. */
  onPublicar: (() => void) | null
  guardado: EstadoDeGuardado
  /** **Validar vive al lado de guardar y publicar** · 2026-10-06. Estaba en el
   *  cuerpo, a media página, y publicar obligaba a ir y volver entre la cabecera
   *  y el medio de la pantalla para una sola intención · §2.4 de la auditoría.
   *  `null` cuando no corresponde validar: hay cambios sin guardar, o la versión
   *  ya está publicada. */
  onValidar?: (() => void) | null
  validando?: boolean
  /** Por qué no se puede publicar todavía, en una frase · `null` si se puede o
   *  si no corresponde decirlo. */
  porQueNoPublicar?: string | null
  children: React.ReactNode
}

export function BuilderChrome({
  activa,
  onIr,
  identidad,
  onSalir,
  onCerrarSesion,
  onChangeTheme,
  contexto,
  clientes,
  clienteActivo,
  onCliente,
  onVistaPrevia,
  onPublicar,
  guardado,
  onValidar = null,
  validando = false,
  porQueNoPublicar = null,
  children,
}: Props) {
  const pantalla = PANTALLAS.find((p) => p.id === activa) ?? PANTALLAS[0]
  const forma = pantalla.chrome

  /** **La altura de la cabecera, publicada como variable CSS** · 2026-10-07.
   *  El inspector del editor es `fixed` a la derecha y, a toda la altura,
   *  tapaba la cabecera —y con ella el estado del guardado, justo mientras se
   *  edita—. Ahora abre debajo. La altura cambia cuando la fila de acciones se
   *  parte en dos, así que se mide; sin `ResizeObserver` (jsdom) queda en 0. */
  const cabecera = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const el = cabecera.current
    if (el === null || typeof ResizeObserver === 'undefined') return
    const publicar = () =>
      document.documentElement.style.setProperty('--alto-cabecera-builder', `${String(el.offsetHeight)}px`)
    publicar()
    const ro = new ResizeObserver(publicar)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      {/* Sin colapso · §4: «no son grids y declaran ancho mínimo en vez de
          colapso». Abajo del mínimo hay scroll, que es visible. */}
      <div className={ANCHO[pantalla.ancho] ?? ANCHO[1600]}>
        {sinChrome(forma) ? null : (
          // **Fija arriba**: el editor es largo, y el estado del guardado tiene
          // que verse mientras se baja por el lienzo.
          <header ref={cabecera} className="sticky top-0 z-30 flex flex-col gap-4 px-6 pt-5 border-b border-w4 bg-bg">
            <div className="flex items-center justify-between gap-6">
              {/* **Era la palabra en `font-display`, y ésa es la invención que
                  el capítulo `Identidad` corrige**: el logotipo tiene su propia
                  tipografía, no la del producto. Ahora es el arte.

                  `marca` y no `mono`: decisión humana del 2026-10-06, escrita en
                  la §3 de `PROPUESTA-2026-09-22-divergencias-con-el-pen.md`. */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Wordmark variante="marca" />
                  <Label>Builder</Label>
                </div>
                <span aria-hidden className="h-6 w-px shrink-0 bg-w3" />
                <SelectorDeCliente clientes={clientes} activo={clienteActivo} onElegir={onCliente} />
              </div>

              {/* «Ancho 1600 · lienzo 1:1 a 1200 más 300 de biblioteca» vivía
                  acá, siempre a la vista. Es la regla de §4 para quien
                  implementa, no para quien compone · §3.4 de la auditoría del
                  2026-10-06. Sigue en `pantallas.ts`, que es donde sirve. */}
              {/* A la derecha, con aire: el acceso rápido al dashboard, la
                  persona y el menú de trabajo al final · decisión humana del
                  2026-10-07. */}
              <div className="flex items-center gap-6">
                <VolverAlDashboard onIr={onSalir} />
                {identidad !== undefined && (
                  <IdentityBlock
                    rol={identidad.rol}
                    nombre={identidad.nombre}
                    {...(identidad.correo === undefined ? {} : { correo: identidad.correo })}
                    {...(onChangeTheme === undefined ? {} : { onChangeTheme })}
                    {...(onCerrarSesion === undefined ? {} : { onCerrarSesion })}
                  />
                )}
                <MenuDeTrabajo esAdmin rutaActual={pantalla.ruta} onIr={onSalir} />
              </div>
            </div>

            {conContexto(forma) && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {/* El contexto, **salvo en B1**: ahí son los controles del
                    cuerpo, y repetirlos arriba como texto con el mismo rótulo
                    hacía que uno pareciera un control y el otro no. La pestaña
                    tampoco va: en el canvas es el selector del cuerpo. */}
                {/* El cliente ya no se repite acá: está arriba, en el selector. */}
                {activa !== 'contexto' && (
                  <>
                    {contexto.dashboard !== null && (
                      <div className="flex items-center gap-2">
                        <Label>Dashboard</Label>
                        <span className="font-body text-cuerpo font-medium text-ink">{contexto.dashboard}</span>
                        {contexto.version !== null && <Label>{contexto.version}</Label>}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Label>Rol</Label>
                      <span className="font-body text-cuerpo font-medium text-ink">{contexto.rol ?? 'Todos los roles'}</span>
                    </div>
                  </>
                )}

                {/* **En «Dashboards» no hay acciones de edición**: todavía no se
                    eligió qué editar. Guardar, validar y publicar son del
                    editor · visto en pantalla el 2026-10-07. */}
                {activa === 'contexto' ? null : soloContexto(forma) ? (
                  /* **La única acción de B6, y es la del dibujo.** Una pantalla
                     que se mira no ofrece guardar ni publicar: lo que ofrece es
                     la vuelta a la que sí compone. El literal es del `.pen`. */
                  <div className="ml-auto">
                    <Accion onClick={() => onIr('canvas')}>Volver a editar</Accion>
                  </div>
                ) : (
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {/* **El guardado, con sus cuatro estados** · el botón no
                        desaparece nunca mientras haya un borrador: cambia de
                        texto. §7.2: «guardado explícito, con indicador de
                        cambios sin guardar». */}
                    {guardado.estado === 'sucio' && (
                      <>
                        <Ayuda as="span">
                          {`${contexto.cambios === 1 ? '1 pestaña' : `${String(contexto.cambios)} pestañas`} con cambios · se guarda solo en unos segundos`}
                        </Ayuda>
                        <Accion variante="primaria" onClick={guardado.onGuardar}>
                          {NOTA_GUARDAR}
                        </Accion>
                      </>
                    )}
                    {guardado.estado === 'guardando' && (
                      <Accion onClick={guardado.onGuardar} deshabilitada>
                        Guardando…
                      </Accion>
                    )}
                    {guardado.estado === 'limpio' && (
                      <>
                        {guardado.ultimo !== null && <Ayuda as="span">{`Guardado a las ${guardado.ultimo}`}</Ayuda>}
                        <Accion onClick={guardado.onGuardar} deshabilitada>
                          <Tilde />
                          Guardado
                        </Accion>
                      </>
                    )}
                    {guardado.estado === 'error' && (
                      <>
                        <Ayuda as="span">{guardado.error ?? 'No se pudo guardar.'}</Ayuda>
                        <Accion variante="primaria" onClick={guardado.onGuardar}>
                          Reintentar
                        </Accion>
                      </>
                    )}
                    {onValidar !== null && (
                      <Accion onClick={onValidar} deshabilitada={validando}>
                        {validando ? 'Validando…' : 'Validar'}
                      </Accion>
                    )}
                    {onVistaPrevia !== null && <Accion onClick={onVistaPrevia}>Vista previa</Accion>}
                    {/* **Un CTA sin manejador no se pinta** · la misma regla que
                        `RecoBody`. En su lugar, en el registro de ayuda —antes
                        era un rótulo en el lugar exacto del botón, y se leía
                        como uno—, qué falta para poder publicar. */}
                    {onPublicar === null ? (
                      porQueNoPublicar === null ? null : <Ayuda as="span">{porQueNoPublicar}</Ayuda>
                    ) : (
                      <Accion variante="primaria" onClick={onPublicar}>
                        Publicar
                      </Accion>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* **Sólo las pantallas que se navegan** · D3. Las demás siguen
                declaradas en `pantallas.ts`. */}
            <nav className="flex gap-1 -mb-px" aria-label="Builder">
              {PANTALLAS.filter((p) => p.enNav).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onIr(p.id)}
                  aria-current={p.id === activa ? 'page' : undefined}
                  className={
                    'px-3 py-3 font-body text-cuerpo cursor-pointer border-b-2 ' +
                    (p.id === activa
                      ? 'border-acc text-ink font-semibold'
                      : 'border-transparent text-dim font-medium hover:text-ink')
                  }
                >
                  {p.nombre}
                </button>
              ))}
            </nav>
          </header>
        )}

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
