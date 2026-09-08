/** Recuperar contraseña · F0.15
 *
 *  **No manda un enlace: abre una solicitud que un admin aprueba.** El servicio
 *  crea un `password_reset` en la misma cola que los registros, así que la
 *  pantalla no puede prometer «revisá tu correo» — no llega ningún correo con un
 *  enlace, y prometerlo dejaría a la gente esperando algo que no existe. Dice lo
 *  que de verdad pasa: alguien la revisa.
 *
 *  **El mensaje de éxito es el mismo exista o no el correo, y es deliberado.**
 *  El servicio responde igual en los dos casos para no revelar quién está
 *  registrado. Si la pantalla dijera «no encontramos ese correo», convertiría el
 *  formulario en un verificador: se prueba una lista y se ve cuáles son
 *  clientes. Por eso el mensaje sale del servicio y no se ramifica acá.
 */
import { useState } from 'react'
import { requestPasswordReset } from '../../api/auth'
import { ApiError } from '../../api/types'

const ROTULO = 'font-mono text-label tracking-rotulo leading-rotulo uppercase text-dim'
const CAMPO =
  'font-body text-cuerpo leading-cuerpo text-ink bg-elev border border-w3 rounded-md px-3 py-2 ' +
  'outline-none focus:border-w5'

export function PasswordReset({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      setEnviado(await requestPasswordReset(email))
    } catch (err) {
      setError(
        err instanceof ApiError && err.message !== ''
          ? err.message
          : 'No se pudo enviar la solicitud.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-6"
    >
      <div className="flex w-full max-w-[400px] flex-col gap-4 rounded-xl border border-w2 bg-panel p-6">
        <h2 id="reset-titulo" className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0">
          Recuperar contraseña
        </h2>

        {enviado === null ? (
          <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-4">
            <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
              Dejá tu correo y el equipo revisa la solicitud. No se envía un enlace
              automático.
            </p>

            <div className="flex flex-col gap-1">
              <label htmlFor="reset-email" className={ROTULO}>
                Correo
              </label>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={CAMPO}
              />
            </div>

            {error === null ? null : (
              <p role="alert" className="font-body text-cuerpo leading-cuerpo text-ink m-0">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={enviando}
                className={
                  'font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 border-0 ' +
                  'bg-acc text-on-acc ' +
                  (enviando ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-acc-hover')
                }
              >
                {enviando ? 'Enviando' : 'Enviar solicitud'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 px-2"
              >
                Volver
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            {/* El mensaje del servicio, tal cual. Es el mismo exista o no el
                correo, y ahí está la protección: la pantalla no puede decir
                más de lo que el servicio decidió decir. */}
            <p role="status" className="font-body text-cuerpo leading-cuerpo text-ink m-0">
              {enviado}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="self-start font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
            >
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
