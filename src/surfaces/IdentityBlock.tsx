/** El punto de identidad de admin y del builder · §PEN «A1/Identidad» y
 *  «B2/Identidad» · 2026-09-28
 *
 *  **Vive acá y no dentro de una superficie porque el dibujo lo pone en las
 *  dos**, con los mismos nodos: un bloque de 26 en `$elev` con el rol en nota
 *  `$dim`, el nombre en nota `$ink` y un `chevrons-up-down` de 13.
 *
 *  ── LO QUE REEMPLAZA, Y POR QUÉ ERA UN PROBLEMA ─────────────────────────────
 *
 *  Administración tenía un **«← Consola»** y el builder no tenía nada. Los dos
 *  eran invención nuestra y **la asimetría era el defecto**: desde la consola se
 *  salía por el panel de identidad, desde admin por una flecha, y desde el
 *  builder no se salía. Tres formas para la misma acción, y una faltante.
 *
 *  Ahora las tres superficies se salen por el mismo lugar — el punto de
 *  identidad— y lo que se ofrece sale de `salidasDesde`, que ya excluye la que
 *  se está mirando. **Una sola fuente, y la simetría se cumple por construcción
 *  y no por acordarse.**
 *
 *  ── POR QUÉ NO ES EL `UserMenu` DE LA CONSOLA ───────────────────────────────
 *
 *  Aquel pinta además rol con su descripción, cliente y acceso, porque §7.1
 *  declara ese contenido **para la consola**. Copiar el de la consola habría
 *  sido pintar un cliente en una pantalla de alcance plataforma, donde no hay
 *  uno solo.
 *
 *  **El TEMA sí es común a las tres** · 2026-10-02. La decisión del 2026-09-28
 *  es «todo vive dentro del punto de identidad», y el dibujo de
 *  `Console/Panel de usuario` lo pone **entre el separador y las salidas**, que
 *  es el orden que esto respeta. Hasta hoy el tema existía sólo en la consola:
 *  admin y builder tenían identidad y salidas, y ninguna forma de cambiarlo.
 *
 *  ── **SÓLO LO DE LA PERSONA** · decisión humana del 2026-10-07 ─────────────
 *
 *  Las salidas a otras superficies —la sección «IR A»— se fueron al menú
 *  hamburguesa, `MenuDeTrabajo`, junto con el acceso directo a cada pantalla.
 *  Acá queda quién sos —nombre, correo, rol—, el tema y **cerrar sesión**, que
 *  no existía en ninguna superficie. Ver
 *  `docs/PROPUESTA-2026-10-07-header-usuario-y-trabajo.md`.
 */
import { useEffect, useRef, useState } from 'react'
import { Note } from '../render/primitives/Note'
import { ThemeOptions } from './ThemeOptions'
import { ChipDeUsuario } from './ChipDeUsuario'
import { DISPARADOR_DE_USUARIO } from './usuario'
import type { Theme } from '../tokens/theme'

type Props = {
  /** Quién es · rol y nombre, en ese orden, como el dibujo los pone. */
  rol: string
  nombre: string
  /** Se pinta dentro del panel, debajo del nombre · opcional porque el cable
   *  de identidad de las superficies no siempre lo baja. */
  correo?: string
  /** **Opcional, y su ausencia apaga la sección entera** · mismo idioma que
   *  `UserMenu`. Un selector de tema que no escribe la preferencia promete algo
   *  que no hace, y «un CTA sin manejador no se pinta». */
  onChangeTheme?: (theme: Theme) => void
  /** Cerrar sesión · **del contenedor**, que es quien navega y limpia el cache.
   *  Sin manejador no se pinta. */
  onCerrarSesion?: () => void
}

export function IdentityBlock({ rol, nombre, correo, onChangeTheme, onCerrarSesion }: Props) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)

  // Cerrar con Escape y con clic afuera. **El contenedor entero**, no sólo el
  // panel: así el chevron que lo abrió queda adentro y no se reabre solo al
  // apretarlo de vuelta — el defecto que apareció construyendo C6.
  useEffect(() => {
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
  }, [])

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        aria-label={`Identidad · ${nombre}`}
        className={DISPARADOR_DE_USUARIO}
      >
        {/* **Con presencia** · decisión humana del 2026-10-07: el nombre en
            nota de 9 se leía como un dato más de la barra. */}
        <ChipDeUsuario nombre={nombre} rol={rol} />
      </button>

      {/* **Siempre abre**: la identidad misma es contenido —nombre, correo,
          rol—, no sólo las preferencias. */}
      {abierto && (
        <div
          role="menu"
          aria-label={`Usuario · ${nombre}`}
          className="absolute top-full right-0 z-40 mt-2 flex w-64 flex-col gap-3 rounded-xl border border-w3 bg-panel p-4 shadow-[0_8px_24px_var(--color-shad)]"
        >
          <div className="flex flex-col gap-1">
            <span className="text-ink text-cuerpo">{nombre}</span>
            {correo !== undefined && <Note as="div">{correo}</Note>}
          </div>
          <div className="flex flex-col gap-1">
            <Note as="div">Rol</Note>
            <span className="text-ink text-celda">{rol}</span>
          </div>

          {onChangeTheme !== undefined && (
            <>
              <div className="h-px bg-w2" />
              <div className="flex flex-col gap-1">
                <Note as="div">Tema</Note>
                <ThemeOptions onChange={onChangeTheme} />
              </div>
            </>
          )}

          {onCerrarSesion !== undefined && (
            <>
              <div className="h-px bg-w2" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAbierto(false)
                  onCerrarSesion()
                }}
                className="-mx-1 cursor-pointer rounded-sm border-0 bg-transparent px-1 py-1 text-left font-body text-cuerpo font-medium text-ink hover:bg-elev"
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
