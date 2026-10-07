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
 *  **Y desde el 2026-10-07 ya no viven acá**: se fueron a `MenuDeTrabajo`, el
 *  menú hamburguesa, con acceso directo a cada pantalla. Este panel queda para
 *  la persona —identidad, rol, cliente, tema— y gana «Cerrar sesión». Lo de
 *  abajo sobre esconder sigue valiendo, ahora para aquel menú.
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
import { Note } from '../../render/primitives/Note'
import { ThemeOptions } from '../ThemeOptions'
import { ChipDeUsuario } from '../ChipDeUsuario'
import { DISPARADOR_DE_USUARIO } from '../usuario'
import { useCerrarSesion } from '../useCerrarSesion'
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
  const cerrarSesion = useCerrarSesion()

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
        // **El nombre accesible es el nombre**, sin las iniciales del círculo,
        // que van `aria-hidden`.
        aria-label={context.user.nombre}
        className={DISPARADOR_DE_USUARIO}
      >
        {/* **Con presencia** · decisión humana del 2026-10-07: era el nombre en
            mono gris de 10 —el traje del rótulo— y no se distinguía del resto
            de la barra. */}
        <ChipDeUsuario nombre={context.user.nombre} />
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

          {/* **Las superficies se fueron al menú de trabajo** · decisión humana
              del 2026-10-07. El nombre queda para lo de la persona, y salir es
              lo más de la persona que hay: no existía en ninguna superficie. El
              separador, sólo si arriba hubo tema: si no, ya está el de antes. */}
          {onChangeTheme !== undefined && <div className="h-px bg-w2" />}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false)
              cerrarSesion()
            }}
            className="-mx-1 cursor-pointer rounded-sm border-0 bg-transparent px-1 py-1 text-left font-body text-cuerpo font-medium text-ink hover:bg-elev"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
