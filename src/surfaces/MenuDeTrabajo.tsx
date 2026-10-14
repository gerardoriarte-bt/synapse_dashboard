/** El menú hamburguesa · las opciones de TRABAJO · 2026-10-07
 *
 *  Decisión humana del 2026-10-07: el nombre despliega lo de la persona, y esto
 *  despliega lo de administración y construcción de dashboards, **con acceso
 *  directo a cada pantalla**. Qué ofrece sale de `gruposDeTrabajo`, que lee los
 *  dos registros de pantallas: una pantalla nueva aparece acá sola.
 *
 *  **Va en las tres superficies, en el mismo lugar** —al final de la fila, a la
 *  derecha; empezó antes del logotipo y se pidió moverlo el mismo día—, y
 *  marca dónde se está. Que sea el mismo componente en las tres es lo que
 *  sostiene la simetría que el «← Consola» de septiembre no tenía.
 *
 *  **Sin entradas no se pinta**: quien no administra no tiene a dónde ir, y un
 *  botón que abre un menú vacío promete algo que no existe.
 *
 *  **Se monta sin router**: la navegación es del contenedor, igual que en
 *  `IdentityBlock`.
 */
import { useEffect, useRef, useState } from 'react'
import { Note } from '../render/primitives/Note'
import { gruposDeTrabajo } from './trabajo'

type Props = {
  esAdmin: boolean
  /** La ruta que se está mirando · marca la entrada activa. */
  rutaActual: string
  onIr: (ruta: string) => void
}

export function MenuDeTrabajo({ esAdmin, rutaActual, onIr }: Props) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const grupos = gruposDeTrabajo(esAdmin)

  // Escape y clic afuera · el contenedor entero, para que el botón que lo abrió
  // quede adentro y no lo reabra al apretarlo de vuelta.
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

  if (grupos.length === 0) return null

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label="Menú de trabajo"
        className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-w4 bg-transparent text-ink hover:bg-w2"
      >
        {/* `menu` de línea · iconografía §1, hereda el color. */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M4 6h16" />
          <path d="M4 12h16" />
          <path d="M4 18h16" />
        </svg>
      </button>

      {abierto && (
        <div
          role="menu"
          aria-label="Menú de trabajo"
          className="absolute top-full right-0 z-40 mt-2 flex w-72 flex-col gap-4 rounded-xl border border-w3 bg-panel p-4 shadow-[0_8px_24px_var(--color-shad)]"
        >
          {grupos.map((g) => (
            <div key={g.superficie} role="group" aria-label={g.titulo} className="flex flex-col gap-1">
              <Note as="div">{g.titulo}</Note>
              {g.entradas.map((e) => {
                const actual = e.ruta === rutaActual
                return (
                  <button
                    key={e.ruta}
                    type="button"
                    role="menuitem"
                    {...(actual ? { 'aria-current': 'page' as const } : {})}
                    onClick={() => {
                      setAbierto(false)
                      onIr(e.ruta)
                    }}
                    className={
                      'w-full cursor-pointer rounded-sm border-0 border-l-2 bg-transparent px-2 py-1.5 text-left font-body text-cuerpo hover:bg-elev ' +
                      (actual ? 'border-acc font-semibold text-ink' : 'border-transparent font-medium text-dim hover:text-ink')
                    }
                  >
                    {e.nombre}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
