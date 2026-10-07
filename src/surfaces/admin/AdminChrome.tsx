/** El chrome de administración · F4.1
 *
 *  **El alcance se declara en el chrome, y acá no es uniforme.** §7.3 de
 *  `design.md` lo pone en tabla: A1 y A3 son de alcance PLATAFORMA —cruzan
 *  clientes— y A2, A4 y A5 operan dentro de un tenant y llevan selector.
 *
 *  Es distinto de la consola, donde el alcance sale del token y vale para toda
 *  la sesión. Acá **cambia con la pantalla**, así que el chrome lo lee de la
 *  pantalla activa y no del contexto.
 *
 *  ── LA REGLA DURA DE TODA LA SUPERFICIE ─────────────────────────────────────
 *
 *  **El vocabulario de infraestructura no se muestra.** §7.3: ni nombre de base,
 *  ni rol técnico, ni warehouse, ni grant. «Esa capa la opera el equipo interno y
 *  ningún usuario de administración actúa sobre ella; mostrarla sugiere una
 *  acción que no existe y es una fuente de confusión, no de control.»
 *
 *  Lo que sí se muestra es la CONSECUENCIA: si el acceso está vigente, cuándo se
 *  verificó y qué hacer si no lo está. La única excepción es la declaración de
 *  subprocesadores, que es obligación legal.
 *
 *  ── EL ANCHO MÍNIMO ES 1280 Y NO 360 ────────────────────────────────────────
 *
 *  §ANCLA:ANCHO-1 · principio 4: «Ancho mínimo por superficie: 1280 en
 *  administración, 1600 en el builder».
 *
 *  La corrección de §4 del `.pen`: «Ancho mínimo por superficie: 1280 en
 *  administración, 1600 en el builder». El responsive de §4 describe la grilla
 *  de paneles; **las tablas no son grillas** y perdían contenido en silencio
 *  (PS-5). Por eso acá no hay colapso: hay scroll horizontal, que es visible.
 */
import { IdentityBlock } from '../IdentityBlock'
import { MenuDeTrabajo } from '../MenuDeTrabajo'
import { VolverAlDashboard } from '../VolverAlDashboard'
import { SelectorDeCliente } from '../SelectorDeCliente'
import type { Theme } from '../../tokens/theme'
import { Label } from '../../render/primitives/Label'
import { Wordmark } from '../console/Wordmark'
import { PANTALLAS } from './pantallas'
import type { PantallaId } from './pantallas'


type Props = {
  activa: PantallaId
  /** Qué pantalla se pide. La navegación es del contenedor, no del chrome. */
  onIr: (id: PantallaId) => void
  /** Ir a una RUTA · el menú de trabajo y «Volver al dashboard». Distinto de
   *  `onIr`, que elige entre las pantallas de acá. La navegación es del
   *  contenedor y no del chrome. */
  onSalir: (ruta: string) => void
  /** **El tema, que viaja hasta `IdentityBlock`** · 2026-10-02. Opcional por la
   *  misma razón que allá: sin manejador la sección no se pinta. */
  onChangeTheme?: (theme: Theme) => void

  /** Quién está mirando · **§PEN:A1 lo dibuja**: el navbar de `A1 · Clientes y
   *  plataforma` lleva un bloque `Identidad` con el ROL en `$dim` y el NOMBRE en
   *  `$ink`, los dos en mono de 9. Hasta el 2026-09-25 no se pintaba, y nada en
   *  este archivo decía que fuera a propósito: era un hueco.
   *
   *  **No es el menú de la consola.** El dibujo pone identidad, no un control:
   *  quién sos y con qué rol estás operando, que en administración es la
   *  pregunta que importa antes de tocar algo. Dónde vive la salida a otra
   *  superficie es otra decisión, y está preguntada al `.pen` en
   *  `docs/PROPUESTA-2026-09-25-navegacion-entre-superficies.md`. */
  identidad?: { rol: string; nombre: string; correo?: string }
  /** Cerrar sesión, desde el menú del nombre · sin manejador no se pinta. */
  onCerrarSesion?: () => void
  /** El tenant en contexto, para las pantallas de alcance `tenant`. */
  tenants: readonly { id: string; nombre: string }[]
  tenantActivo: string | null
  onTenant: (id: string) => void
  children: React.ReactNode
}

export function AdminChrome({ activa, onIr, onSalir, identidad, tenants, tenantActivo, onTenant, onChangeTheme, onCerrarSesion, children }: Props) {
  const pantalla = PANTALLAS.find((p) => p.id === activa) ?? PANTALLAS[0]
  const porTenant = pantalla.alcance === 'tenant'

  return (
    // `min-w-[1280px]` y no un colapso · §4 del `.pen`. Una tabla que se achica
    // pierde columnas sin decirlo; el scroll es visible.
    <div className="min-h-screen bg-bg">
      <div className="min-w-[1280px]">
        <header className="flex flex-col gap-4 px-6 pt-6 border-b border-w4">
          {/* §PEN:A1 y §PEN:A2 encabezan con «Synapse · ADMINISTRACIÓN», y
              recién debajo va la pantalla. Faltaban las dos cosas. */}
          {/* ── EL NAVBAR · decisión humana del 2026-10-07 ─────────────────
              A la derecha, con aire: el acceso rápido al dashboard, la persona
              y el menú de trabajo —el hamburguesa, con cada pantalla de
              administración y del builder—, que empezó a la izquierda y se
              pidió moverlo el mismo día. La identidad subió a esta
              fila, que es donde el navbar de A1 la dibuja. */}
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Wordmark variante="marca" />
              <Label>Administración</Label>
            </div>
            {/* Con aire entre los tres, y el menú de trabajo AL FINAL · decisión
                humana del 2026-10-07. */}
            <div className="flex items-center gap-6">
              <VolverAlDashboard onIr={onSalir} />
              {identidad !== undefined && (
                <IdentityBlock
                  rol={identidad.rol}
                  nombre={identidad.nombre}
                  {...(identidad.correo === undefined ? {} : { correo: identidad.correo })}
                  {...(onChangeTheme === undefined ? {} : { onChangeTheme })}
                  {...(onCerrarSesion === undefined ? {} : { onCerrarSesion })}
                />
              )}
              <MenuDeTrabajo esAdmin rutaActual={pantalla.ruta} onIr={onSalir} />
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-6">
            {/* **`titulo-lg`, no `titulo`** · 2026-09-28. El dibujo pone los
                títulos de superficie de admin en el mismo tamaño que la pregunta
                operativa de la consola, y el token que los sirve a los dos es
                éste. Estaba en `titulo` —15— porque el token medía 20 con dos
                nodos; al remedirlo contra los 36 que existen quedó en 26.

                **Y acá vive EL título de la pantalla, uno solo.** Las vistas ya
                no pintan el suyo — ver abajo. */}
            <h1 className="font-display text-titulo-lg tracking-titulo leading-titulo text-ink m-0">
              {pantalla.nombre}
            </h1>

            {/* **El alcance, dicho.** Una pantalla de plataforma cruza clientes y
                eso tiene consecuencias —lo que se hace acá afecta a todos—, así
                que no se deduce del contenido: se declara. */}
            <div className="flex items-center gap-4">
              {/* **El cliente de trabajo, destacado y el mismo del builder** ·
                  2026-10-06. Antes era un `<select>` de 12px junto a un rótulo de
                  alcance. Las pantallas de plataforma cruzan todas las cuentas y lo
                  dicen. */}
              {porTenant ? (
                <SelectorDeCliente clientes={tenants} activo={tenantActivo} onElegir={onTenant} />
              ) : (
                <Label>Alcance · todas las cuentas</Label>
              )}
            </div>
          </div>

          {/* **La navegación en registro de acción, como la del builder** ·
              2026-10-06. Vestía el traje del rótulo —mono, mayúsculas, gris— y
              se leía como un encabezado más. Ahora es Inter, y la activa se
              marca con el borde `acc` —«estado activo», uno de sus usos
              permitidos— y el peso, no sólo con un fondo. */}
          <nav className="flex gap-1 -mb-px" aria-label="Administración">
            {PANTALLAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onIr(p.id)}
                aria-current={p.id === activa ? 'page' : undefined}
                className={
                  'px-3 py-3 font-body text-cuerpo cursor-pointer border-b-2 ' +
                  (p.id === activa
                    ? 'border-acc text-ink font-semibold'
                    : 'border-transparent text-dim font-medium hover:text-ink')
                }
              >
                {p.nombre}
              </button>
            ))}
          </nav>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
