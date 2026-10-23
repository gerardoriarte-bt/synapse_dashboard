/** La llave del usuario de servicio del cliente · A2 · F5.56, 2026-10-23
 *
 *  **Existe para cambiar de usuario sin pasar una privada de mano en mano.**
 *  Datos creó un usuario de servicio por cliente y propuso que backend genere
 *  el par con openssl y lo cargue en su secreto. El servicio ya lo hace solo
 *  —`POST /admin/tenants/{tenantId}/service-key`—: genera el par, guarda la
 *  privada cifrada en el cliente y devuelve la pública. **La privada no sale
 *  nunca del servidor**, y lo único que viaja a datos es lo que esta sección
 *  muestra para copiar.
 *
 *  **Reemplazar corta la conexión**, y por eso pide confirmación: la consulta
 *  firma con la privada nueva y el usuario de Snowflake sigue con la pública
 *  vieja hasta que datos registre la nueva.
 *
 *  Como `ConexionDeDatos`, se pinta sólo con alcance de plataforma, y **quién
 *  la ve lo decide `Admin`**.
 *
 *  §PEN:A2 · A2 · el bloque «ACCESO A DATOS» · lo agrega, sólo para plataforma.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import type { LlaveDeServicio as Llave } from '../../api/admin'

type Props = {
  /** `undefined` mientras se lee · `null` si el cliente no tiene llave. */
  llave: Llave | null | undefined
  /** La lectura falló · no es «sin llave». */
  errorDeLectura: string | null
  generando: boolean
  error: string | null
  /** `true` reemplaza la que hay. */
  onGenerar: (reemplazar: boolean) => void
}

/** El orden en que se cambia de usuario. **Es el orden, no una lista**: con
 *  la llave nueva y el usuario viejo, el cliente queda sin conexión. */
const PASOS = [
  'Generar la llave acá.',
  'Pasarle a datos la pública y la huella, para que la registren en el usuario nuevo.',
  'Cambiar el usuario y el rol en «Corregir la conexión».',
  'Cambiar el almacén virtual de cada agente, abajo.',
  'Verificar.',
] as const

export function LlaveDeServicio({ llave, errorDeLectura, generando, error, onGenerar }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [copiada, setCopiada] = useState(false)
  // **Al cambiar la llave se vuelve al estado de reposo**: la confirmación y el
  // «copiada» eran de la anterior. En el render y no en un efecto, igual que
  // el formulario de `ConexionDeDatos`.
  const [llaveVista, setLlaveVista] = useState(llave)
  if (llave !== llaveVista) {
    setLlaveVista(llave)
    setConfirmando(false)
    setCopiada(false)
  }

  const copiar = (texto: string) => {
    // Sin portapapeles —un navegador sin permiso, o sin contexto seguro— el
    // texto sigue seleccionable: no se promete «copiada» si no se copió.
    void navigator.clipboard?.writeText(texto).then(
      () => setCopiada(true),
      () => setCopiada(false),
    )
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-6"
      aria-label="Llave de servicio"
    >
      <div className="flex flex-col gap-1">
        <Label as="div">Llave de servicio</Label>
        <Ayuda>
          La privada la genera y la guarda el servicio, y no sale de ahí. Lo que se copia es la
          pública.
        </Ayuda>
      </div>

      <ol className="m-0 flex list-decimal flex-col gap-0.5 pl-5" aria-label="Para cambiar de usuario">
        {PASOS.map((paso) => (
          <li key={paso} className="font-body text-celda text-dim">
            {paso}
          </li>
        ))}
      </ol>

      {errorDeLectura !== null ? (
        <Ayuda>{`No se pudo leer la llave: ${errorDeLectura}`}</Ayuda>
      ) : llave === undefined ? (
        <span className="font-body text-celda text-dim">Leyendo la llave…</span>
      ) : llave === null ? (
        <span className="font-body text-celda text-ink">Este cliente no tiene llave.</span>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Label as="span">Huella</Label>
            {/* **Sin `Note`**, que pasa a mayúsculas: la huella es base64 y
                cambiar la caja la cambia. */}
            <span className="break-all font-mono text-celda text-ink">{llave.huella}</span>
            <Ayuda>
              Datos la compara con la que Snowflake muestra en el usuario: si coinciden, registraron
              la correcta.
            </Ayuda>
          </div>
          <label className="flex flex-col gap-1">
            <Label as="span">Pública, para registrar</Label>
            <textarea
              readOnly
              value={llave.paraRegistrar}
              rows={4}
              spellCheck={false}
              onFocus={(e) => e.currentTarget.select()}
              className="resize-none break-all rounded-md border border-w4 bg-transparent p-2 font-mono text-celda text-ink"
            />
            <Ayuda>Sin los delimitadores, que es como Snowflake la pide.</Ayuda>
          </label>
          {/* **Copiar y reemplazar en la misma fila**, y copiar a la derecha:
              es lo que se hace casi siempre. Mientras se confirma el
              reemplazo, la fila queda sólo con copiar. */}
          <div className="flex justify-end gap-2">
            {!confirmando && (
              <Accion tamano="compacta" deshabilitada={generando} onClick={() => setConfirmando(true)}>
                Reemplazar la llave
              </Accion>
            )}
            <Accion tamano="compacta" onClick={() => copiar(llave.paraRegistrar)}>
              {copiada ? 'Copiada' : 'Copiar la pública'}
            </Accion>
          </div>
        </div>
      )}

      {error !== null && <Ayuda>{error}</Ayuda>}

      {llave === null && (
        <div className="flex justify-end">
          <Accion
            tamano="compacta"
            variante="primaria"
            deshabilitada={generando}
            onClick={() => onGenerar(false)}
          >
            {generando ? 'Generando…' : 'Generar llave'}
          </Accion>
        </div>
      )}

      {llave !== null && llave !== undefined && confirmando && (
        <div className="flex flex-col gap-2 border-t border-w2 pt-3">
          <Ayuda>
            Reemplazarla deja al cliente sin conexión hasta que datos registre la nueva en su
            usuario. Si el usuario actual no es el que va a quedar, conviene hacerlo junto con el
            cambio de usuario.
          </Ayuda>
          <div className="flex justify-end gap-2">
            <Accion tamano="compacta" onClick={() => setConfirmando(false)}>
              Cancelar
            </Accion>
            <Accion
              tamano="compacta"
              variante="peligro"
              deshabilitada={generando}
              onClick={() => onGenerar(true)}
            >
              {generando ? 'Reemplazando…' : 'Sí, reemplazar'}
            </Accion>
          </div>
        </div>
      )}
    </section>
  )
}
