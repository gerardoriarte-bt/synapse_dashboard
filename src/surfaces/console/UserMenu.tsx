/** El punto de usuario · y por dónde se sale de la consola · 2026-09-16
 *
 *  ── EL CONTENIDO NO SE INVENTÓ: `design.md` LO DECLARA ──────────────────────
 *
 *  «Abre un panel con **nombre, correo, rol con su descripción y cliente**». El
 *  panel ya estaba especificado; lo que había en el código era el nombre suelto
 *  como rótulo, sin nada que abrir.
 *
 *  La descripción del rol **no se pinta porque el cable no la manda**. Queda el
 *  hueco visible, no un texto inventado.
 *
 *  ── Y ACÁ SE RESUELVE ALGO QUE EL DISEÑO NO TENÍA ───────────────────────────
 *
 *  **Ninguno de los quince frames del `.pen` dibuja cómo ir de una superficie a
 *  otra.** Recorridos uno por uno el 2026-09-16: la consola no tiene «ir a
 *  administración», el builder no tiene «volver a la consola». Cada superficie
 *  se declara a sí misma con su chip —`ADMINISTRACIÓN`, `BUILDER`— y navega
 *  hacia adentro, y nada navega hacia al lado.
 *
 *  **Decisión humana del 2026-09-16: el builder y administración los ve solo el
 *  admin**, y las entradas viven acá. Es el lugar que el diseño ya tenía abierto
 *  —un panel que cuelga de la identidad— en vez de un control nuevo en el
 *  navbar, que sí habría sido inventar.
 *
 *  ── ESCONDER NO ES PROTEGER, Y ESTÁ BIEN ────────────────────────────────────
 *
 *  Las entradas aparecen solo si `esAdmin`, y eso **no es el permiso**: el
 *  permiso lo aplica `AdminOnlyMiddleware` con un 403. Lo de acá es la regla de
 *  siempre —«un botón que se aprieta y devuelve 403 es peor que un botón
 *  ausente»—. Quien escriba `/admin` a mano llega igual a la pantalla, y sus
 *  llamadas fallan igual. Ocultar no es permitir.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Label } from '../../render/primitives/Label'
import { esAdmin } from '../../api/rol'
import type { AppContext } from '../../api/types'

/** Las dos superficies que cuelgan de acá, con su ruta. Escritas, no derivadas:
 *  son dos y agregar una tercera es una decisión, no un descubrimiento. */
const SUPERFICIES = [
  { ruta: '/admin', nombre: 'Administración' },
  { ruta: '/builder', nombre: 'Builder' },
] as const

type Props = { context: AppContext }

export function UserMenu({ context }: Props) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const navegar = useNavigate()
  const admin = esAdmin(context.role)

  // Cerrar al hacer clic afuera y con Escape. Sin esto el panel queda abierto
  // tapando la grilla, que es el modo en que un menú se vuelve molesto.
  useEffect(() => {
    if (!abierto) return
    const fuera = (e: MouseEvent) => {
      if (caja.current !== null && !caja.current.contains(e.target as Node)) setAbierto(false)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierto])

  return (
    <div className="relative" ref={caja}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0"
      >
        {context.user.nombre}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 z-10 flex flex-col gap-3 rounded-xl bg-panel border border-w4 p-6 min-w-[260px]"
        >
          <div className="flex flex-col gap-1">
            <span className="text-ink text-celda">{context.user.nombre}</span>
            <Label as="div">{context.user.email}</Label>
          </div>

          <div className="flex flex-col gap-1">
            <Label as="div">{`Rol · ${context.role.nombre}`}</Label>
            <Label as="div">{`Cliente · ${context.tenant.nombre}`}</Label>
          </div>

          {/* **Las superficies, solo para el admin.** Sin esto el panel es la
              identidad que §7.1 ya pedía; con esto es además por dónde se sale. */}
          {admin && (
            <div className="flex flex-col gap-1 pt-3 border-t border-w4">
              <Label as="div">Ir a</Label>
              {SUPERFICIES.map((s) => (
                <button
                  key={s.ruta}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAbierto(false)
                    void navegar(s.ruta)
                  }}
                  className="text-left font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0"
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
