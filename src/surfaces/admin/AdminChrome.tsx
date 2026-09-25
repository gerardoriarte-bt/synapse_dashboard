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
import { Label } from '../../render/primitives/Label'
import { Wordmark } from '../console/Wordmark'
import { PANTALLAS } from './pantallas'
import type { PantallaId } from './pantallas'


type Props = {
  activa: PantallaId
  /** Qué pantalla se pide. La navegación es del contenedor, no del chrome. */
  onIr: (id: PantallaId) => void
  /** Volver a la consola · `undefined` no pinta el control, que es la regla del
   *  CTA sin manejador. */
  onVolver?: () => void
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
  identidad?: { rol: string; nombre: string }
  /** El tenant en contexto, para las pantallas de alcance `tenant`. */
  tenants: readonly { id: string; nombre: string }[]
  tenantActivo: string | null
  onTenant: (id: string) => void
  children: React.ReactNode
}

/** Mono 9 · el tamaño `nota` de §2.3, que es el que el dibujo usa acá. Mismo
 *  literal que `RoleCard`, que ya lo necesitaba. */
const NOTA = 'font-mono text-nota leading-rotulo tracking-rotulo uppercase m-0'

export function AdminChrome({ activa, onIr, onVolver, identidad, tenants, tenantActivo, onTenant, children }: Props) {
  const pantalla = PANTALLAS.find((p) => p.id === activa) ?? PANTALLAS[0]
  const porTenant = pantalla.alcance === 'tenant'

  return (
    // `min-w-[1280px]` y no un colapso · §4 del `.pen`. Una tabla que se achica
    // pierde columnas sin decirlo; el scroll es visible.
    <div className="min-h-screen bg-bg">
      <div className="min-w-[1280px]">
        <header className="flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-w4">
          {/* §PEN:A1 y §PEN:A2 encabezan con «Synapse · ADMINISTRACIÓN», y
              recién debajo va la pantalla. Faltaban las dos cosas. */}
          <div className="flex items-center gap-3">
            <Wordmark />
            <Label>Administración</Label>
          </div>

          <div className="flex items-baseline justify-between gap-6">
            <h1 className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0">
              {pantalla.nombre}
            </h1>

            {/* **El alcance, dicho.** Una pantalla de plataforma cruza clientes y
                eso tiene consecuencias —lo que se hace acá afecta a todos—, así
                que no se deduce del contenido: se declara. */}
            <div className="flex items-center gap-4">
              {/* **La vuelta a la consola.** El `.pen` no la dibuja —ninguna de las
                  quince pantallas navega hacia otra superficie— y sin ella se
                  entra acá y no se sale sin escribir la URL.

                  **Es un callback y no un `useNavigate` acá adentro**, que es la
                  regla que este archivo ya declaraba arriba: «la navegación es
                  del contenedor, no del chrome». Escrito con el hook, además,
                  rompía doce pruebas que montan el chrome sin router — y tenían
                  razón en romperse. */}
              {/* La identidad va PRIMERO en la fila, como en el dibujo: el
                  navbar de A1 la pone antes que nada a la derecha. Y con
                  `gap-2` entre rol y nombre, que son los 7 del `.pen`. */}
              {identidad !== undefined && (
                <span className="flex items-baseline gap-2">
                  <span className={`${NOTA} text-dim`}>{identidad.rol}</span>
                  <span className={`${NOTA} text-ink`}>{identidad.nombre}</span>
                </span>
              )}
              {onVolver !== undefined && (
                <button
                  type="button"
                  onClick={onVolver}
                  className="font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0"
                >
                  ← Consola
                </button>
              )}
              <Label>{porTenant ? 'Alcance · cliente' : 'Alcance · plataforma'}</Label>
              {porTenant ? (
                <select
                  aria-label="Cliente"
                  className="bg-w2 text-ink text-celda rounded-sm px-2 py-1 border border-w4"
                  value={tenantActivo ?? ''}
                  onChange={(e) => onTenant(e.target.value)}
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                // **Sin selector, y se dice por qué.** A1 y A3 cruzan clientes:
                // un selector ahí sugeriría que se está mirando uno solo.
                <Label>Todas las cuentas</Label>
              )}
            </div>
          </div>

          <nav className="flex gap-1" aria-label="Administración">
            {PANTALLAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onIr(p.id)}
                aria-current={p.id === activa ? 'page' : undefined}
                className={
                  'text-label tracking-rotulo uppercase px-3 py-2 rounded-sm ' +
                  (p.id === activa ? 'bg-w3 text-ink' : 'text-dim hover:bg-w2')
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
