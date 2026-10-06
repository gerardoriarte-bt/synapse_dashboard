/** El cliente sobre el que se trabaja, destacado en la cabecera · 2026-10-06
 *
 *  Pedido humano: «en el header se debe destacar bien el tenant que se está
 *  trabajando, porque hoy se siente confuso». Era un `<select>` de 12px al lado
 *  de un rótulo de alcance en administración, y en el builder vivía en el cuerpo
 *  de B1 y en la cabecera como texto chico: dos lugares con el mismo rótulo, uno
 *  que se tocaba y otro que no.
 *
 *  **Uno solo, y grande**: el nombre del cliente en `font-display` al tamaño de
 *  título, dentro de un control con caja que se lee como elegible. Es el mismo
 *  componente en administración y en el builder, y los dos leen y escriben el
 *  mismo cliente de trabajo · `useClienteDeTrabajo`.
 */
import { Label } from '../render/primitives/Label'

type Props = {
  clientes: readonly { id: string; nombre: string }[]
  activo: string | null
  onElegir: (id: string) => void
}

export function SelectorDeCliente({ clientes, activo, onElegir }: Props) {
  const nombre = clientes.find((c) => c.id === activo)?.nombre ?? null
  return (
    <div className="flex items-center gap-3">
      <Label id="selector-de-cliente">Cliente</Label>
      {clientes.length <= 1 ? (
        // Con uno solo no hay nada que elegir: se nombra, sin caja.
        <span className="font-display text-titulo leading-titulo tracking-titulo font-medium text-ink">
          {nombre ?? '—'}
        </span>
      ) : (
        <select
          aria-labelledby="selector-de-cliente"
          value={activo ?? ''}
          onChange={(e) => onElegir(e.target.value)}
          className="h-9 cursor-pointer rounded-md border border-acc bg-w2 px-3 font-display text-titulo leading-titulo tracking-titulo font-medium text-ink"
        >
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
