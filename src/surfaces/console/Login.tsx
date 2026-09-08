/** La pantalla de entrada · F0.5
 *
 *  Vive en `surfaces/` y no en `app/`: es una pantalla con anatomía y tokens,
 *  y `app/` es router, providers y sesión. Lo que sí es de `app/` es DÓNDE se
 *  guarda el token, y eso sigue en `auth/session.ts`.
 *
 *  **No decodifica el token ni guarda el usuario que devuelve el login.** El
 *  servicio manda `user` con nombre, rol y tenant, y es tentador guardarlo para
 *  pintar el navbar sin esperar a `/config/me`. Sería una segunda fuente de
 *  verdad que se desincroniza en silencio en cuanto alguien cambie de rol —el
 *  mismo anti-patrón que §4 prohíbe con `useState` sobre datos de servidor.
 */
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../api/auth'
import { saveToken } from '../../app/auth/session'
import { ApiError } from '../../api/types'
import { PasswordReset } from './PasswordReset'

/** El rótulo de un campo es un `<label>` de verdad, no un `<Label>`.
 *
 *  El primitivo pinta un `span` —es el rótulo de un VALOR, no de un input— y un
 *  span no se asocia con nada: un lector de pantalla anuncia «cuadro de texto»
 *  sin decir cuál, y hacer clic en el rótulo no enfoca el campo. Lo encontró la
 *  prueba, que no podía hallar los campos por su nombre accesible.
 *
 *  Las utilidades son las mismas que usa `Label`; lo que cambia es el elemento.
 *  L15 prohíbe el `<label>` nativo solo en `render/`, y esto es una superficie. */
const ROTULO = 'font-mono text-label tracking-rotulo leading-rotulo uppercase text-dim'

const CAMPO =
  'font-body text-cuerpo leading-cuerpo text-ink bg-elev border border-w3 rounded-md px-3 py-2 ' +
  'outline-none focus:border-w5'

export function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [recuperando, setRecuperando] = useState(false)

  // A dónde volver: el guardia guarda de dónde te sacó.
  const destino = (location.state as { from?: string } | null)?.from ?? '/'

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      const { token } = await login(email, password)
      saveToken(token)
      navigate(destino, { replace: true })
    } catch (err) {
      // El mensaje es el del servicio · §8: no se inventa uno vago encima de
      // uno concreto. Solo se cubre el caso sin mensaje, que sería una pantalla
      // muda.
      setError(
        err instanceof ApiError && err.message !== ''
          ? err.message
          : 'No se pudo conectar con el servicio de acceso.',
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-6">
      <form
        onSubmit={(e) => void enviar(e)}
        className="flex w-full max-w-[360px] flex-col gap-4 rounded-xl border border-w2 bg-panel p-6"
      >
        <h1 className="font-display text-titulo-lg tracking-titulo leading-titulo text-ink m-0">
          Synapse
        </h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="login-email" className={ROTULO}>
            Correo
          </label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CAMPO}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="login-password" className={ROTULO}>
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            required
            // El servicio exige seis · `binding:"required,min=6"`. Declararlo
            // acá evita un viaje que ya se sabe que vuelve con 400.
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={CAMPO}
          />
        </div>

        {error === null ? null : (
          // `role="alert"` y no un párrafo suelto: quien usa lector de pantalla
          // se entera de que el intento falló sin volver a recorrer el
          // formulario.
          <p role="alert" className="font-body text-cuerpo leading-cuerpo text-ink m-0">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => setRecuperando(true)}
          className="self-start font-mono text-label tracking-rotulo uppercase text-dim hover:text-ink cursor-pointer bg-transparent border-0 p-0"
        >
          Olvidé mi contraseña
        </button>

        <button
          type="submit"
          disabled={enviando}
          className={
            'font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 border-0 ' +
            'bg-acc text-on-acc ' +
            (enviando ? 'cursor-wait opacity-60' : 'cursor-pointer hover:bg-acc-hover')
          }
        >
          {enviando ? 'Entrando' : 'Entrar'}
        </button>
      </form>

      {recuperando ? <PasswordReset onClose={() => setRecuperando(false)} /> : null}
    </main>
  )
}
