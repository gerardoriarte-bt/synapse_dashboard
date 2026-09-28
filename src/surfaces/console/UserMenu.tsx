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
 *  ── ERA UNA INVENCIÓN NUESTRA, Y EL DIBUJO LA SANCIONÓ ──────────────────────
 *
 *  Hasta el 2026-09-28 esto decía que «ninguno de los quince frames del `.pen`
 *  dibuja cómo ir de una superficie a otra», y era cierto: se recorrieron uno
 *  por uno el 2026-09-16 y nada navegaba hacia al lado. La decisión humana de
 *  ese día puso las entradas acá, **en el lugar que el diseño ya tenía
 *  abierto** —un panel que cuelga de la identidad— en vez de un control nuevo
 *  en el navbar, que sí habría sido inventar.
 *
 *  **`Console/Panel de usuario` ahora lo dibuja** · `Ln6ST`: una sección `IR A`
 *  con `ADMINISTRACIÓN` y `BUILDER`, cada una con su `arrow-right` de 13 en
 *  `$dim`. Eligió la misma vecindad, así que la apuesta salió bien — y con ella
 *  llegó **el TEMA**, que estaba suelto en el navbar y pasa a vivir acá.
 *
 *  **Decisión humana del 2026-09-16: el builder y administración los ve solo el
 *  admin.**
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
import { Note } from '../../render/primitives/Note'
import { ThemeOptions } from './ThemeOptions'
import { esAdmin } from '../../api/rol'
/** **El registro, no una lista propia** · 2026-09-25. Acá vivían dos entradas
 *  escritas a mano —«son dos y agregar una tercera es una decisión»— y esa
 *  decisión ya estaba tomada en `app/router/routes.tsx`, que monta las mismas
 *  rutas. Dos fuentes del mismo hecho: la que se olvidara dejaba una superficie
 *  montada y sin forma de llegar. */
import { salidasDesde } from '../superficies'
import type { AppContext } from '../../api/types'
import type { Theme } from '../../tokens/theme'


type Props = {
  context: AppContext
  /** **Sin él no se pinta el tema.** Misma regla que el resto del producto: un
   *  control que no tiene quien atienda su cambio no se ofrece. El builder monta
   *  esta consola sin poder persistir la preferencia. */
  onChangeTheme?: ((theme: Theme) => void) | undefined
}

export function UserMenu({ context, onChangeTheme }: Props) {
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
          {/* **El nombre va en 13 y el correo en nota**, que es lo que el
              dibujo les da: la identidad es lo primero y lo más grande del
              panel. */}
          <div className="flex flex-col gap-1">
            <span className="text-ink text-cuerpo">{context.user.nombre}</span>
            <Note as="div">{context.user.email}</Note>
          </div>

          <div className="h-px bg-w2" />

          {/* **Rótulo ARRIBA y valor abajo**, no `Rol · CEO` en una línea. El
              dibujo los separa porque el rótulo es nota y el valor es celda: son
              dos roles tipográficos distintos, y en una sola línea el rótulo
              tenía que compartir el del valor. */}
          <div className="flex flex-col gap-1">
            <Note as="div">Rol</Note>
            <span className="text-ink text-celda">{context.role.nombre}</span>
          </div>

          <div className="flex flex-col gap-1">
            <Note as="div">Cliente</Note>
            <span className="text-ink text-celda">{context.tenant.nombre}</span>
          </div>

          {/* **Sólo con alcance de plataforma**, como lo rotula el dibujo. Es el
              mismo dato que el navbar declara al lado del selector de tenant —«el
              acceso queda auditado»— y acá va completo. */}
          {context.alcance === 'plataforma' && (
            <div className="flex flex-col gap-1">
              <Note as="div">Acceso</Note>
              <Note as="div">
                Estás entrando como equipo interno · este acceso queda registrado
              </Note>
            </div>
          )}

          <div className="h-px bg-w2" />

          {/* **El TEMA vive acá desde el 2026-09-28**, no suelto en el navbar.
              El dibujo lo pone entre la identidad y las salidas, que es donde
              pertenece: es una preferencia de la persona, igual que el rol que
              tiene y las superficies a las que puede entrar. */}
          {onChangeTheme !== undefined && (
            <div className="flex flex-col gap-1">
              <Note as="div">Tema</Note>
              <ThemeOptions onChange={onChangeTheme} />
            </div>
          )}

          {/* **Las superficies, solo para el admin.** Sin esto el panel es la
              identidad que §7.1 ya pedía; con esto es además por dónde se sale. */}
          {admin && (
            <div className="flex flex-col gap-1">
              <Note as="div">Ir a</Note>
              {salidasDesde('consola', admin).map((s) => (
                <button
                  key={s.ruta}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAbierto(false)
                    void navegar(s.ruta)
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-1 py-1 text-left font-mono text-label tracking-rotulo text-ink uppercase hover:bg-elev"
                >
                  {s.nombre}
                  <span className="flex-1" />
                  {/* `arrow-right` de 13 en `$dim` · el del dibujo. Va
                      `aria-hidden`: el texto ya dice a dónde lleva. */}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dim" aria-hidden>
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
