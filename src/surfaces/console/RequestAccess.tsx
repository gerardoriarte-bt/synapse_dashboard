/** Solicitar acceso · F0.16
 *
 *  **No crea una cuenta: abre una solicitud que un admin aprueba.** Igual que la
 *  recuperación de contraseña, y la pantalla lo dice — prometer «ya podés
 *  entrar» dejaría a alguien probando credenciales que todavía no existen.
 *
 *  **No pide la empresa de una lista.** El documento de integración del servicio
 *  lo cambió: «el tenant se asigna más adelante, en el panel admin, al
 *  aprobar». Quien solicita escribe el nombre y alguien lo resuelve después, así
 *  que no hay un select que mantener ni una llamada más antes de mostrar el
 *  formulario.
 *
 *  **Los dos consentimientos son campos del contrato, no adorno.** El servicio
 *  rechaza con 400 si llegan en `false`, así que el `required` del checkbox no
 *  es una validación nuestra duplicada: es lo mismo que el servidor exige,
 *  declarado donde el usuario lo puede corregir sin un viaje.
 */
import { useState } from 'react'
import { requestAccess } from '../../api/auth'
import { ApiError } from '../../api/types'

const ROTULO = 'font-mono text-label tracking-rotulo leading-rotulo uppercase text-dim'
const CAMPO =
  'font-body text-cuerpo leading-cuerpo text-ink bg-elev border border-w3 rounded-md px-3 py-2 ' +
  'outline-none focus:border-w5'

/** (clave, rótulo, tipo). El orden es el del formulario. */
const CAMPOS = [
  ['full_name', 'Nombre completo', 'text'],
  ['email', 'Correo', 'email'],
  ['company_name', 'Empresa', 'text'],
  ['phone', 'Teléfono', 'tel'],
  ['job_title', 'Cargo', 'text'],
  ['info_use', 'Para qué vas a usar la información', 'text'],
] as const

export function RequestAccess({ onClose }: { onClose: () => void }) {
  const [campos, setCampos] = useState<Record<string, string>>({})
  const [terminos, setTerminos] = useState(false)
  const [privacidad, setPrivacidad] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await requestAccess({
        company_name: campos['company_name'] ?? '',
        full_name: campos['full_name'] ?? '',
        email: campos['email'] ?? '',
        phone: campos['phone'] ?? '',
        job_title: campos['job_title'] ?? '',
        info_use: campos['info_use'] ?? '',
        accepted_terms: terminos,
        accepted_privacy_policy: privacidad,
      })
      setEnviado(true)
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
      aria-labelledby="acceso-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg/80 p-6"
    >
      <div className="flex w-full max-w-[420px] flex-col gap-4 rounded-xl border border-w2 bg-panel p-6">
        <h2
          id="acceso-titulo"
          className="font-display text-titulo tracking-titulo leading-titulo text-ink m-0"
        >
          Solicitar acceso
        </h2>

        {enviado ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="font-body text-cuerpo leading-cuerpo text-ink m-0">
              Tu solicitud quedó registrada. El equipo la revisa y te avisa cuando
              esté aprobada.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="self-start font-mono text-label tracking-rotulo uppercase rounded-md px-4 py-2 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
            >
              Volver
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void enviar(e)} className="flex flex-col gap-3">
            <p className="font-body text-cuerpo leading-cuerpo text-dim m-0">
              No crea una cuenta al instante: el equipo revisa la solicitud.
            </p>

            {CAMPOS.map(([clave, rotulo, tipo]) => (
              <div key={clave} className="flex flex-col gap-1">
                <label htmlFor={`acceso-${clave}`} className={ROTULO}>
                  {rotulo}
                </label>
                <input
                  id={`acceso-${clave}`}
                  type={tipo}
                  required
                  value={campos[clave] ?? ''}
                  onChange={(e) => setCampos((c) => ({ ...c, [clave]: e.target.value }))}
                  className={CAMPO}
                />
              </div>
            ))}

            {/* `required` en los dos: el servicio rechaza con 400 si llegan en
                `false`, así que declararlo acá evita un viaje que ya se sabe
                cómo termina. No es una regla nuestra: es la suya, dicha donde
                se puede corregir. */}
            <label className="flex items-start gap-2 font-body text-cuerpo leading-cuerpo text-dim">
              <input
                type="checkbox"
                required
                checked={terminos}
                onChange={(e) => setTerminos(e.target.checked)}
              />
              Acepto los términos y condiciones
            </label>
            <label className="flex items-start gap-2 font-body text-cuerpo leading-cuerpo text-dim">
              <input
                type="checkbox"
                required
                checked={privacidad}
                onChange={(e) => setPrivacidad(e.target.checked)}
              />
              Acepto la política de privacidad
            </label>

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
        )}
      </div>
    </div>
  )
}
