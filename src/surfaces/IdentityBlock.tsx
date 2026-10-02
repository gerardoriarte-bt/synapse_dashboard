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
 *  **Lo que sí se comparte es el registro de superficies**, que es donde vivía
 *  el riesgo de divergir.
 */
import { useEffect, useRef, useState } from 'react'
import { Note } from '../render/primitives/Note'
import { ThemeOptions } from './ThemeOptions'
import { salidasDesde } from './superficies'
import type { Theme } from '../tokens/theme'
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
  /** **Opcional, y su ausencia apaga la sección entera** · mismo idioma que
   *  `UserMenu`. Un selector de tema que no escribe la preferencia promete algo
   *  que no hace, y «un CTA sin manejador no se pinta». */
  onChangeTheme?: (theme: Theme) => void
}

export function IdentityBlock({ rol, nombre, desde, esAdmin, onIr, onChangeTheme }: Props) {
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

      {/* **Abre si hay ALGO adentro, no sólo salidas** · 2026-10-02. La
          condición era `salidas.length > 0`, que con el tema adentro dejaba la
          preferencia inalcanzable para quien no administra: el chevron se
          pintaba y no abría nada. */}
      {abierto && (salidas.length > 0 || onChangeTheme !== undefined) && (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-2 flex w-60 flex-col gap-1 rounded-xl border border-w3 bg-panel p-3 shadow-[0_8px_24px_var(--color-shad)]"
        >
          {/* **El TEMA va primero** · el dibujo lo pone entre el separador y
              `IR A` dentro de `Console/Panel de usuario`. Se reusa el mismo
              componente que la consola, no una copia: dos selectores del mismo
              estado se separan el día que uno cambie. */}
          {onChangeTheme !== undefined && (
            <div className="flex flex-col gap-1">
              <Note as="div">Tema</Note>
              <ThemeOptions onChange={onChangeTheme} />
            </div>
          )}

          {/* **El separador sólo si hay las dos cosas.** Una línea sobre una
              sección sola es un borde que no separa nada. */}
          {onChangeTheme !== undefined && salidas.length > 0 && <div className="h-px bg-w2" />}

          {salidas.length > 0 && <Note as="div">Ir a</Note>}
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
