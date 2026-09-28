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
 *  Aquel pinta además rol con su descripción, cliente, acceso y el tema, porque
 *  §7.1 declara ese contenido **para la consola**. El dibujo de A1 y B2 muestra
 *  sólo el bloque, así que acá va sólo lo que el dibujo pide más las salidas.
 *  Copiar el de la consola habría sido pintar un cliente en una pantalla de
 *  alcance plataforma, donde no hay uno solo.
 *
 *  **Lo que sí se comparte es el registro de superficies**, que es donde vivía
 *  el riesgo de divergir.
 */
import { useEffect, useRef, useState } from 'react'
import { Note } from '../render/primitives/Note'
import { salidasDesde } from './superficies'
import type { Superficie } from './superficies'

type Props = {
  /** Quién es · rol y nombre, en ese orden, como el dibujo los pone. */
  rol: string
  nombre: string
  /** Desde dónde se mira · decide qué salidas se ofrecen. */
  desde: Superficie['id']
  /** **Sin esto no hay salidas**, y no es lo mismo que una lista vacía: quien no
   *  administra no ve entradas a superficies que le devolverían 403. Ocultar no
   *  es permitir — el permiso lo aplica el servidor. */
  esAdmin: boolean
  /** **Navegar es del CONTENEDOR, no del chrome.** `BuilderChrome` ya lo
   *  declaraba: escribir el hook adentro «rompía doce pruebas que montan el
   *  chrome sin router — y tenían razón en romperse». Un bloque de chrome que
   *  navega solo no se puede montar sin un router, y eso lo vuelve imposible de
   *  probar aislado. */
  onIr: (ruta: string) => void
}

export function IdentityBlock({ rol, nombre, desde, esAdmin, onIr }: Props) {
  const [abierto, setAbierto] = useState(false)
  const caja = useRef<HTMLDivElement>(null)
  const salidas = salidasDesde(desde, esAdmin)

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
        className="flex h-6.5 cursor-pointer items-center gap-2 rounded-sm border-0 bg-elev px-2"
      >
        <Note as="span">{rol}</Note>
        <span className="font-mono text-nota leading-rotulo tracking-rotulo text-ink uppercase">
          {nombre}
        </span>
        {/* `chevrons-up-down` de 13 en `$dim` · el mismo del bloque de cliente
            de C1, que es el control de contexto del producto. */}
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-dim"
          aria-hidden
        >
          <path d="m7 15 5 5 5-5" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      </button>

      {abierto && salidas.length > 0 && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 flex w-60 flex-col gap-1 rounded-xl border border-w3 bg-panel p-3 shadow-[0_8px_24px_var(--color-shad)]"
        >
          <Note as="div">Ir a</Note>
          {salidas.map((s) => (
            <button
              key={s.ruta}
              type="button"
              role="menuitem"
              onClick={() => {
                setAbierto(false)
                onIr(s.ruta)
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-1 py-1 text-left font-mono text-label tracking-rotulo text-ink uppercase hover:bg-elev"
            >
              {s.nombre}
              <span className="flex-1" />
              {/* `arrow-right` de 13 · el texto ya dice a dónde lleva. */}
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-dim"
                aria-hidden
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
