/** El chrome del builder · F4.6, rehecho el 2026-09-15 contra el `.pen`
 *
 *  **Dos cosas no son uniformes acá, y las dos salen de `pantallas.ts`.**
 *
 *  ── EL ANCHO ───────────────────────────────────────────────────────────────
 *
 *  §4 da dos números con dos razones: **1600** en B1–B4 y B6 —1200 de lienzo 1:1
 *  más 300 de biblioteca, «a otra escala las unidades de arrastre mentirían»— y
 *  **1440 en B5**, que muestra la consola del cliente a su ancho real.
 *
 *  **La clase es estática y el número es dato.** Tailwind poda lo que su escáner
 *  no ve escrito, así que una utilidad armada por interpolación compilaría,
 *  dejaría el atributo `class` correcto en el DOM y **nunca llegaría al CSS**.
 *  Lo cubre `tests/tokens/escala.test.ts`.
 *
 *  ── EL CHROME ──────────────────────────────────────────────────────────────
 *
 *  **El contexto va en la cabecera y es persistente**, que es la corrección del
 *  2026-09-15: el `.pen` dibuja `TENANT · ROL · PESTAÑA` arriba en B2, B4 y B6, y
 *  la primera versión de este componente los tenía en barras dentro del cuerpo.
 *  Al salir de B1 se perdía de vista sobre qué se estaba componiendo, y «3
 *  cambios sin guardar» desaparecía al cambiar de pantalla — que es justo cuando
 *  hace falta.
 *
 *  **B1 no lo muestra** porque es donde se elige: enseñar el contexto ya resuelto
 *  en la pantalla que lo resuelve es decir dos veces lo mismo, y la segunda
 *  parece un control.
 *
 *  **Y B5 no lleva chrome ninguno**: «SIN CHROME DE EDICIÓN · DATOS REALES · ASÍ
 *  SE PUBLICA». Su única banda es volver a editar, y la pinta ella.
 */
import { Label } from '../../render/primitives/Label'
import { PANTALLAS } from './pantallas'
import type { FormaDeChrome, PantallaId } from './pantallas'

/** **Predicados y no comparaciones sueltas, y la razón es de TypeScript.**
 *
 *  Este componente sostiene las CUATRO formas de chrome; hoy la tabla usa tres,
 *  porque B1 tomó prestada `composicion` hasta que F4.9 mueva la composición a
 *  B2. Comparando `pantalla.chrome` en línea, el análisis de flujo lo estrecha a
 *  las tres en uso y marca la rama de `identidad` como código muerto — cierto
 *  hoy, falso con F4.9, y en el medio la puerta en rojo.
 *
 *  Un parámetro tipado no se estrecha en el sitio de llamada, así que estas dos
 *  funciones dicen lo que el componente soporta y no lo que la tabla usa hoy. */
const sinChrome = (f: FormaDeChrome) => f === 'ninguno'
const conContexto = (f: FormaDeChrome) => f === 'composicion' || f === 'contexto'

/** Una entrada por ancho de `pantallas.ts`. Escritas, no interpoladas. */
const ANCHO: Readonly<Record<number, string>> = {
  1600: 'min-w-[1600px]',
  1440: 'min-w-[1440px]',
}

export type ContextoDeEdicion = {
  tenant: string | null
  rol: string | null
  pestana: string | null
  /** Cuántos cambios sin guardar. `0` = limpio. */
  cambios: number
}

/** **Guardar va acá aunque el `.pen` no dibuje el botón.**
 *
 *  El diseño muestra «3 CAMBIOS SIN GUARDAR» en la cabecera y, al lado, solo
 *  `VISTA PREVIA` y `PUBLICAR`. §7.2 sí exige el guardado explícito —«guardado
 *  explícito, con indicador de cambios sin guardar»—, así que el botón hace
 *  falta y el único lugar coherente es junto al indicador que lo motiva.
 *
 *  Va dicho porque es una desviación: si el diseño resolvió el guardado de otra
 *  forma que no llegó al `.pen`, esto es lo que hay que cambiar. */
const NOTA_GUARDAR = 'Guardar'

type Props = {
  activa: PantallaId
  onIr: (id: PantallaId) => void
  contexto: ContextoDeEdicion
  /** `null` cuando no hay nada que publicar todavía · la razón la da la pantalla. */
  onPublicar: (() => void) | null
  /** `null` cuando no hay cambios, o cuando la versión no admite escritura. */
  onGuardar: (() => void) | null
  guardando: boolean
  children: React.ReactNode
}

export function BuilderChrome({
  activa,
  onIr,
  contexto,
  onPublicar,
  onGuardar,
  guardando,
  children,
}: Props) {
  const pantalla = PANTALLAS.find((p) => p.id === activa) ?? PANTALLAS[0]
  const forma = pantalla.chrome

  return (
    <div className="min-h-screen bg-bg">
      {/* Sin colapso · §4: «no son grids y declaran ancho mínimo en vez de
          colapso». Abajo del mínimo hay scroll, que es visible. */}
      <div className={ANCHO[pantalla.ancho] ?? ANCHO[1600]}>
        {sinChrome(forma) ? null : (
          <header className="flex flex-col gap-4 px-6 pt-6 pb-4 border-b border-w4">
            <div className="flex items-baseline justify-between gap-6">
              <div className="flex items-baseline gap-3">
                <h1 className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0">
                  Synapse
                </h1>
                <Label>Builder</Label>
              </div>

              {/* **El ancho, dicho.** Y acá siempre es 1600: **la única pantalla
                  de 1440 es B5, que no lleva chrome** — lo dijo el compilador al
                  narrowear por `forma`, no una prueba. El 1440 sigue declarado en
                  `pantallas.ts` y verificado ahí; lo que no existe es un lugar en
                  la UI donde decirlo, porque esa pantalla no tiene cabecera. */}
              <Label>Ancho 1600 · lienzo 1:1 a 1200 más 300 de biblioteca</Label>
            </div>

            {conContexto(forma) && (
              <div className="flex items-center gap-6">
                {/* El contexto. **Cada uno con su rótulo**: sin él, tres nombres
                    seguidos no dicen cuál es cuál. */}
                <div className="flex items-center gap-2">
                  <Label>Cliente</Label>
                  <span className="text-ink text-celda">{contexto.tenant ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Rol</Label>
                  <span className="text-ink text-celda">{contexto.rol ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Pestaña</Label>
                  <span className="text-ink text-celda">{contexto.pestana ?? 'Todas'}</span>
                </div>

                {/* **El contador va acá y sigue al usuario.** Es lo que §7.2 pide
                    con «guardado explícito, con indicador de cambios sin
                    guardar», y en una barra del cuerpo se perdía al navegar. */}
                {contexto.cambios > 0 && (
                  <Label>{`${String(contexto.cambios)} cambio(s) sin guardar`}</Label>
                )}
                {onGuardar !== null && (
                  <button
                    type="button"
                    onClick={onGuardar}
                    disabled={guardando}
                    className="font-mono text-label tracking-rotulo uppercase rounded-md px-3 py-1 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2 disabled:opacity-40"
                  >
                    {guardando ? 'Guardando…' : NOTA_GUARDAR}
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => onIr('preview')}
                    className="font-mono text-label tracking-rotulo uppercase rounded-md px-3 py-1 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
                  >
                    Vista previa
                  </button>
                  {/* **Un CTA sin manejador no se pinta** · la misma regla que
                      `RecoBody`: un botón que se aprieta y no hace nada es peor
                      que uno ausente. La razón la da la pantalla, que es donde
                      hay lugar para decirla entera. */}
                  {onPublicar === null ? (
                    <Label>Publicar · falta validar en el servidor</Label>
                  ) : (
                    <button
                      type="button"
                      onClick={onPublicar}
                      className="font-mono text-label tracking-rotulo uppercase rounded-md px-3 py-1 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
                    >
                      Publicar
                    </button>
                  )}
                </div>
              </div>
            )}

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
        )}

        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
