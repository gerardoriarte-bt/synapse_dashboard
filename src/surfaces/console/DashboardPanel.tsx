/** El selector de dashboard · §PEN:C6 · 2026-09-28
 *
 *  Reemplaza el `<select>` que F5.1 puso en el navbar. **Lo que cambió no es la
 *  forma sino el lugar**, y la nota del dibujo da la razón: «el dashboard NO es
 *  un noveno control del navbar · §7.1 ya avisa que de ocho elementos a 768 no
 *  entra. Lo abre el chevron del bloque de cliente, que ya estaba dibujado, y
 *  por eso el navbar no crece».
 *
 *  Y por qué cuelga de ahí y no del punto de identidad: «un dashboard es
 *  contexto, igual que el cliente; en el punto de identidad viven la persona, su
 *  rol, el tema y las salidas a las otras superficies».
 *
 *  ── SIN VELO, Y ESO SE DECIDIÓ MIRÁNDOLO ────────────────────────────────────
 *
 *  La primera versión del dibujo copió el patrón de la hoja de C3 —velo de
 *  pantalla completa en `$shad`— y al abrir el render se vio el problema: **un
 *  velo oscurece la aplicación entera y eso dice MODAL**, que es lo que una hoja
 *  es y un desplegable no.
 *
 *  Acá el panel se separa con su **sombra** y el dashboard de atrás queda
 *  legible, que es lo correcto para un control del que se sale haciendo clic
 *  afuera. Por eso tampoco lleva `role="dialog"`: no atrapa el foco.
 *
 *  ── LA PALABRA ──────────────────────────────────────────────────────────────
 *
 *  «**Dashboard** es lo que se elige; **layout** es su composición publicada. El
 *  rótulo dice DASHBOARD y ninguna pantalla dice layout.» Queda fijado por el
 *  dibujo, que era la cuarta pregunta de la propuesta del 2026-09-26.
 *
 *  ── LA SUBLÍNEA QUE NO SE PUEDE PINTAR ──────────────────────────────────────
 *
 *  El dibujo pone bajo cada nombre **«4 PESTAÑAS · 12 PANELES»**, y bajo el que
 *  no está compuesto **«TODAVÍA NO SE COMPUSO»**.
 *
 *  **De los tres datos sólo hay uno, y sólo del activo.** `Contexto.dashboards`
 *  trae `{id, nombre, esDefault}`; las pestañas que llegan son las del dashboard
 *  ACTIVO, y los paneles sólo los de la pestaña abierta. De los demás no se sabe
 *  ni cuántas pestañas tienen ni si están compuestos.
 *
 *  Así que se pinta lo que se sabe y **no se inventa lo que no**: un «0 paneles»
 *  o un «sin componer» deducido de la ausencia sería exactamente el defecto que
 *  este producto persigue. Va pedido al backend.
 */
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { Label } from '../../render/primitives/Label'
import { Note } from '../../render/primitives/Note'
import type { AppContext } from '../../api/types'

type Props = {
  context: AppContext
  /** Las pestañas del dashboard ACTIVO · lo único que se puede contar. */
  pestanasActivas: number
  /** El chevron que lo abrió. **Se excluye del clic-afuera, y no es un detalle
   *  de implementación**: sin esto el documento cierra en `mousedown` y el
   *  `onClick` del botón lo vuelve a abrir, así que el chevron no cierra nunca.
   *  Lo encontró una prueba antes de que se viera. */
  disparador: RefObject<HTMLElement | null>
  onSelect: (id: string) => void
  onCerrar: () => void
}

export function DashboardPanel({ context, pestanasActivas, disparador, onSelect, onCerrar }: Props) {
  const panel = useRef<HTMLDivElement>(null)

  // **Escape y clic afuera**, que es lo que la nota pide de un desplegable: «un
  // control del que se puede salir haciendo clic afuera».
  //
  // **`mousedown` y no `click`, y conviene decir hasta dónde llega esa razón.**
  // La primera versión lo justificaba diciendo que con `click` el chevron se
  // reabre solo — y era cierto hasta que el chevron pasó a excluirse por su
  // `ref`. Con la exclusión puesta, las dos formas se comportan igual en todo lo
  // que una prueba puede observar, así que **no hay mutación que las
  // distinga**: se deja `mousedown` porque cierra al apretar y no al soltar, que
  // es lo que hace el resto de los desplegables, y se dice que es convención y
  // no una guarda.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    const afuera = (e: MouseEvent) => {
      const blanco = e.target as Node
      const dentro = panel.current?.contains(blanco) === true
      const enElChevron = disparador.current?.contains(blanco) === true
      if (!dentro && !enElChevron) onCerrar()
    }
    document.addEventListener('keydown', tecla)
    document.addEventListener('mousedown', afuera)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('mousedown', afuera)
    }
  }, [onCerrar, disparador])

  return (
    <div
      ref={panel}
      // 300 de ancho —`w-75`, que son 300 con `--spacing: 4px`— · «a 768 y a 360
      // el panel no cambia de forma: mantiene sus 300, que entran en los 360 con
      // los 16 de margen. Lo que se achica es el bloque de cliente, no el panel».
      //
      // **La sombra sale del token de color y los números del dibujo** —8 de
      // desplazamiento, 24 de difuminado—. Mismo idioma que la hoja del chat,
      // que es el otro lugar del producto con sombra: el color nunca es literal,
      // la geometría sí, porque no hay token de sombra y los tokens se generan
      // del `.pen`.
      className="absolute top-full left-0 z-20 mt-2 w-75 rounded-xl border border-w3 bg-panel p-3 shadow-[0_8px_24px_var(--color-shad)]"
    >
      <Note as="div">Dashboard</Note>
      <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
        {context.dashboards.map((d) => {
          const activo = d.id === context.dashboardActivoId
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onSelect(d.id)}
                aria-current={activo ? 'true' : undefined}
                className={[
                  'flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md border-0 px-2 py-2 text-left',
                  activo ? 'bg-elev' : 'bg-transparent hover:bg-elev',
                ].join(' ')}
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-celda text-ink">{d.nombre}</span>
                  {/* **Sólo del activo, y sólo las pestañas.** Ver la cabecera:
                      de los demás no llega ni el conteo ni si están compuestos, y
                      deducirlo de la ausencia sería inventar. */}
                  {activo && <Note as="span">{`${String(pestanasActivas)} pestañas`}</Note>}
                </span>
                <span className="flex-1" />
                {/* El punto de 13 en `$acc` del dibujo. `aria-current` ya lo
                    dice para quien no lo ve, así que acá va oculto. */}
                {activo && <span aria-hidden className="h-3.25 w-3.25 rounded-full bg-acc" />}
              </button>
            </li>
          )
        })}
      </ul>
      {/* El hueco declarado, con la gramática de §8: qué falta y de quién es. */}
      <Label as="div">Sin pestañas ni paneles de los demás · falta en el contexto</Label>
    </div>
  )
}
