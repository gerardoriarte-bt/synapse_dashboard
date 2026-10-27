/** La barra del cliente activo · el sub header de las tres superficies · 2026-10-20
 *
 *  Pedido humano: «que el sub header sea un indicador del cliente activo en el
 *  que está parado el usuario, ahí mismo poder colocar el logo, y el selector de
 *  clientes a la derecha. La idea es que si cambia de cliente, todo el entorno
 *  es de uso exclusivo de ese cliente.»
 *
 *  **Es la misma en consola, administración y builder**, y en el mismo lugar:
 *  debajo del navbar. Hasta acá el cliente vivía en tres lugares distintos —un
 *  rótulo junto al logotipo en la consola, un selector a la derecha del título en
 *  administración, una caja junto al logotipo en el builder— y ninguno decía lo
 *  mismo. Ver §4 de `docs/PROPUESTA-2026-10-20-identidad-del-cliente-y-ficha.md`.
 *
 *  **Sin selector cuando no hay nada que elegir**: quien tiene un solo cliente
 *  ve la misma barra, sin la acción.
 */
import { PlacaDeCliente } from './PlacaDeCliente'
import { SelectorDeCliente } from './SelectorDeCliente'
import { formaCortaVisible } from './clienteVisible'
import type { ClienteVisible } from './clienteVisible'

type Props = {
  /** `null` mientras carga: no se afirma un cliente que todavía no se sabe. */
  activo: ClienteVisible | null
  clientes: readonly ClienteVisible[]
  onElegir?: ((id: string) => void) | undefined
}

export function BarraDeCliente({ activo, clientes, onElegir }: Props) {
  const conSelector = onElegir !== undefined && clientes.length > 1
  return (
    <section
      aria-label="Cliente activo"
      className="flex h-16 shrink-0 items-center gap-3.5 border-b border-w3 bg-panel px-6"
    >
      {activo === null ? (
        <span aria-hidden className="h-9 w-56 rounded-md bg-w2" />
      ) : (
        // **Al cambiar de cliente, el nombre entra con un fundido** · 2026-10-27,
        // punto 3 de `docs/PROPUESTA-2026-10-20-microinteracciones.md`: en seco
        // se puede no notar que el cliente cambió. La `key` es lo que lo vuelve
        // a montar, y `starting:` es lo que hace que aparezca en vez de estar.
        <div
          key={activo.id}
          className="flex min-w-0 items-center gap-3.5 transition-opacity duration-base ease-salida starting:opacity-0"
        >
          <PlacaDeCliente nombre={activo.nombre} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
              {activo.nombre}
            </span>
            <span className="font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim">
              {formaCortaVisible(activo)}
            </span>
          </div>
        </div>
      )}
      <div className="flex-1" />
      {conSelector && <SelectorDeCliente clientes={clientes} activo={activo?.id ?? null} onElegir={onElegir} />}
    </section>
  )
}
