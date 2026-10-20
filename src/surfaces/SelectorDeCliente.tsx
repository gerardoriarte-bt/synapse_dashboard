/** «Cambiar de cliente» · a la derecha de la barra del cliente activo · 2026-10-20
 *
 *  **Era un `<select>` con el nombre del cliente adentro** —2026-10-06— y ahí
 *  estaba el problema: el nombre es lo único que mostraba cada opción, y en local
 *  los dos clientes se llaman «Under Armour México». Al cambiar, el control
 *  decía exactamente lo mismo antes y después.
 *
 *  Ahora el cliente activo lo nombra la barra —`BarraDeCliente`— y esto es sólo
 *  la acción de cambiarlo. Cada opción lleva la identidad entera —placa, nombre
 *  y forma corta—, que es lo que separa a dos clientes con el mismo nombre.
 *
 *  **Sin «tu cliente»** · decisión humana del 2026-10-20: al cambiar de
 *  cliente, todo el entorno pasa a ser de ese cliente. Marcar uno «de la sesión»
 *  y otro «de trabajo» era lo que confundía.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { PlacaDeCliente } from './PlacaDeCliente'
import { formaCortaVisible } from './clienteVisible'
import type { ClienteVisible } from './clienteVisible'

/** A partir de cuántos clientes se ofrece buscar. Con pocos, el campo es ruido. */
const CON_BUSQUEDA = 7

type Props = {
  clientes: readonly ClienteVisible[]
  activo: string | null
  onElegir: (id: string) => void
}

export function SelectorDeCliente({ clientes, activo, onElegir }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const caja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    const afuera = (e: MouseEvent) => {
      if (caja.current !== null && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    document.addEventListener('keydown', tecla)
    document.addEventListener('mousedown', afuera)
    return () => {
      document.removeEventListener('keydown', tecla)
      document.removeEventListener('mousedown', afuera)
    }
  }, [abierto])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (q === '') return clientes
    return clientes.filter(
      (c) => c.nombre.toLowerCase().includes(q) || formaCortaVisible(c).toLowerCase().includes(q),
    )
  }, [clientes, busqueda])

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-w4 bg-transparent px-3 font-mono text-nota leading-rotulo tracking-rotulo uppercase text-ink hover:bg-w2"
      >
        {/* `arrow-left-right` de línea · hereda el color. */}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dim" aria-hidden>
          <path d="M8 3 4 7l4 4" />
          <path d="M4 7h16" />
          <path d="m16 21 4-4-4-4" />
          <path d="M20 17H4" />
        </svg>
        Cambiar de cliente
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dim" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute top-full right-0 z-40 mt-2 flex w-96 flex-col gap-1 rounded-xl border border-w4 bg-panel p-2 shadow-[0_8px_24px_var(--color-shad)]">
          {clientes.length >= CON_BUSQUEDA && (
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar cliente"
              placeholder="Buscar cliente"
              className="mb-1 h-8 rounded-md border-0 bg-elev px-3 font-body text-celda text-ink placeholder:text-dim"
            />
          )}
          <div role="menu" aria-label="Clientes" className="flex max-h-96 flex-col gap-1 overflow-y-auto">
            {visibles.map((c) => {
              const actual = c.id === activo
              return (
                <button
                  key={c.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={actual}
                  onClick={() => {
                    setAbierto(false)
                    setBusqueda('')
                    if (!actual) onElegir(c.id)
                  }}
                  className={
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-md border-0 px-2.5 py-2 text-left hover:bg-elev ' +
                    (actual ? 'bg-elev' : 'bg-transparent')
                  }
                >
                  <PlacaDeCliente nombre={c.nombre} tamano="chica" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-body text-cuerpo font-medium text-ink">{c.nombre}</span>
                    <span className="font-mono text-nota leading-rotulo tracking-rotulo uppercase text-dim">
                      {formaCortaVisible(c)}
                    </span>
                  </span>
                  {actual && (
                    // `check` de línea en `acc` · «estado activo», uno de sus usos permitidos.
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-acc" aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
            {visibles.length === 0 && (
              <span className="px-2.5 py-2 font-body text-celda text-dim">Ningún cliente con «{busqueda.trim()}».</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
