/** El chrome del builder · F4.6
 *
 *  **Lo que el chrome tiene que sostener acá es el ANCHO**, y por eso lee la
 *  pantalla activa igual que `AdminChrome` lee el alcance. §4 de `design.md` da
 *  dos números y dos razones distintas: 1600 en B1–B4 y B6 —1200 de lienzo 1:1
 *  más 300 de biblioteca— y **1440 en B5**, que muestra la consola del cliente a
 *  su ancho real. El detalle está en `pantallas.ts`.
 *
 *  **La clase es estática y el número es dato.** Tailwind poda lo que su escáner
 *  no ve escrito, así que una utilidad armada por interpolación compilaría, dejaría
 *  el atributo `class` correcto en el DOM y **nunca llegaría al CSS**: el mismo
 *  silencio que una utilidad con el nombre de token mal escrito. La tabla de abajo
 *  tiene una entrada por ancho declarado y una prueba verifica que no falte ninguna.
 *
 *  ── LO QUE NO ESTÁ ACÁ TODAVÍA, A PROPÓSITO ─────────────────────────────────
 *
 *  §7.2 B2 pide «guardado explícito, con indicador de cambios sin guardar», y el
 *  indicador es del chrome porque tiene que verse desde cualquier pantalla. **No
 *  se declara la prop todavía**: hoy no hay borrador que pueda estar sucio, y una
 *  prop que nadie pasa es el modo de falla de `BodyProps.presentation` —
 *  documentada meses, sin un solo consumidor. Entra con F4.13, que es la que
 *  guarda.
 */
import { Label } from '../../render/primitives/Label'
import { PANTALLAS } from './pantallas'
import type { PantallaId } from './pantallas'

/** Una entrada por ancho de `pantallas.ts`. Escritas, no interpoladas: el
 *  escáner de Tailwind tiene que poder leerlas. */
const ANCHO: Readonly<Record<number, string>> = {
  1600: 'min-w-[1600px]',
  1440: 'min-w-[1440px]',
}

type Props = {
  activa: PantallaId
  onIr: (id: PantallaId) => void
  children: React.ReactNode
}

export function BuilderChrome({ activa, onIr, children }: Props) {
  const pantalla = PANTALLAS.find((p) => p.id === activa) ?? PANTALLAS[0]

  return (
    <div className="min-h-screen bg-bg">
      {/* Sin colapso · §4: «no son grids y declaran ancho mínimo en vez de
          colapso». Abajo del mínimo hay scroll, que es visible; escalar el
          lienzo haría mentir a las unidades de arrastre. */}
      <div className={ANCHO[pantalla.ancho] ?? ANCHO[1600]}>
        <header className="flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-w4">
          <div className="flex items-baseline justify-between gap-6">
            <h1 className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0">
              {pantalla.nombre}
            </h1>
            {/* **El ancho, dicho.** No es decoración: explica por qué esta
                pantalla se ve más angosta que la anterior, que si no se lee como
                un defecto de maquetado. */}
            <Label>
              {pantalla.ancho === 1440
                ? 'Ancho 1440 · la consola del cliente a su ancho real'
                : 'Ancho 1600 · lienzo 1:1 a 1200 más 300 de biblioteca'}
            </Label>
          </div>

          <nav className="flex gap-1" aria-label="Builder">
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
