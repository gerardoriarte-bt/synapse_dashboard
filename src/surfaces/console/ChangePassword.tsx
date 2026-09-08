/** El cambio de contraseña obligatorio · F0.13
 *
 *  Lo pide el contrato del servicio de acceso, en `/auth/login`: «si
 *  `user.password_updated` es `false` el front debe mostrar un modal bloqueante
 *  solicitando cambio de contraseña antes de acceder a la app». El servicio
 *  entrega un token válido igual —a propósito—, así que el bloqueo es nuestro.
 *
 *  **No valida la política.** El servidor la declara y la aplica: ocho
 *  caracteres, letra, número, especial, distinta de la actual. Y devuelve en
 *  `error` el criterio que falló, en prosa. Copiarla acá daría dos validaciones
 *  que se separan el día que cambien una, y la del front sería la que miente.
 *  Lo único que se declara es `minLength`, que ahorra un viaje que ya se sabe
 *  que vuelve con 400.
 */
import { useState } from 'react'
import { changePassword } from '../../api/auth'
import { ApiError } from '../../api/types'

const ROTULO = 'font-mono text-label tracking-rotulo leading-rotulo uppercase text-dim'
const CAMPO =
  'font-body text-cuerpo leading-cuerpo text-ink bg-elev border border-w3 rounded-md px-3 py-2 ' +
  'outline-none focus:border-w5'

export function ChangePassword({ onDone }: { onDone: () => void }) {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await changePassword(actual, nueva)
      onDone()
    } catch (err) {
      setError(
        err instanceof ApiError && err.message !== ''
          ? err.message
          : 'No se pudo cambiar la contraseña.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    // `role="dialog"` + `aria-modal`: es bloqueante de verdad, no una pantalla
    // que se puede saltar. No hay botón de cerrar porque no hay a dónde ir.
    <main
      role="dialog"
      aria-modal="true"
      aria-labelledby="cambio-titulo"
      className="min-h-screen flex items-center justify-center bg-bg p-6"
    >
      <form
        onSubmit={(e) => void enviar(e)}
        className="flex w-full max-w-[400px] flex-col gap-4 rounded-xl border border-w2 bg-panel p-6"
      >
        <h1
          id="cambio-titulo"
          className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0"
        >
          Cambiá tu contraseña para entrar
        </h1>
        <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
          La que estás usando te la asignaron. Mientras siga así, la consola no se
          abre.
        </p>

        <div className="flex flex-col gap-1">
          <label htmlFor="pass-actual" className={ROTULO}>
            Contraseña actual
          </label>
          <input
            id="pass-actual"
            type="password"
            required
            autoComplete="current-password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            className={CAMPO}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="pass-nueva" className={ROTULO}>
            Contraseña nueva
          </label>
          <input
            id="pass-nueva"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            className={CAMPO}
          />
        </div>

        {error === null ? null : (
          <p role="alert" className="font-body text-cuerpo leading-cuerpo text-ink m-0">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className={
            'font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 border-0 ' +
            'bg-acc text-on-acc ' +
            (enviando ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-acc-hover')
          }
        >
          {enviando ? 'Guardando' : 'Cambiar y entrar'}
        </button>
      </form>
    </main>
  )
}
