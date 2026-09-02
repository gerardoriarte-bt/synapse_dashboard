/** Las pestañas del rol · F1.8
 *
 *  Salen de `ctx.tabs`, que llega **ya filtrado por rol**: el front no filtra
 *  nada. Ninguna pestaña aparece escrita en este archivo.
 */
import type { Tab } from '../../api/types'

type Props = {
  tabs: readonly Tab[]
  activeId: string | undefined
  onSelect: (id: string) => void
}

export function Tabs({ tabs, activeId, onSelect }: Props) {
  // Con una sola pestaña no se ofrece una elección que no existe · el mismo
  // criterio que F5.1 le aplica al selector de layout.
  if (tabs.length <= 1) return null

  return (
    <nav aria-label="Pestañas">
      <ul className="flex items-center gap-1 m-0 p-0 list-none">
        {[...tabs]
          .sort((a, b) => a.orden - b.orden)
          .map((tab) => {
            const active = tab.id === activeId
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onSelect(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'font-mono text-[10px] tracking-[0.12em] uppercase rounded-md px-3 py-2',
                    'cursor-pointer bg-transparent border-0',
                    // El acento marca el estado activo: es uso de ACCIÓN, que es
                    // donde la regla dura 1 sí lo permite.
                    active ? 'text-acc' : 'text-dim hover:text-ink',
                  ].join(' ')}
                >
                  {tab.nombre}
                </button>
              </li>
            )
          })}
      </ul>
    </nav>
  )
}
