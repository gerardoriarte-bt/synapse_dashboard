/** La conexión de Snowflake del cliente · A2 · F5.55, 2026-10-21
 *
 *  **Es la plomería que §7.3 saca de administración**, y por eso se pinta sólo
 *  con alcance de plataforma. La regla dice «esa capa la opera el equipo
 *  interno», y la decisión humana del 2026-10-20 es que el `superadmin` es
 *  exactamente eso: de asignación interna, nunca de un cliente. Un admin de un
 *  cliente sigue viendo la ficha del `.pen`, con la consecuencia y sin la
 *  plomería. **Quién la ve lo decide `Admin`**, no este componente.
 *
 *  **El `.pen` dibuja lo contrario al pie del bloque** —«ESTA PANTALLA NO LA
 *  MODIFICA»—, y la divergencia está escrita como propuesta de spec en
 *  `docs/PROPUESTA-2026-10-21-conexion-del-equipo-interno.md`.
 *
 *  **Por qué existe**: Keralty y Terpel no mostraban datos porque consultaban
 *  con el rol de UA, y corregirlo era un `curl`. Con `26eae4b` el `PUT` acepta
 *  cuenta, usuario, rol y URL, y `schema-check` dice con qué rol miró. Esto es
 *  el circuito entero: corregir y verificar en el mismo lugar.
 *
 *  **Un campo en blanco no viaja.** El servicio trata la cadena vacía como 400 y
 *  no borra lo anterior, así que en blanco es «queda como está», y se dice.
 *
 *  **Lo que se sabe de la conexión actual sale de dos lados**, porque ninguna
 *  lectura la trae: el usuario y el rol, de la última verificación; los cuatro,
 *  de lo que el `PUT` devolvió al guardar.
 *
 *  §PEN:A2 · A2 · el bloque «ACCESO A DATOS» · lo agrega, sólo para plataforma.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import type { CambioDeConexion, ConexionGuardada, VerificacionDeAcceso } from '../../api/admin'

type Campo = keyof Required<CambioDeConexion>

/** En el orden en que se diagnostica: el rol es lo que falló con Keralty. */
const CAMPOS: readonly { campo: Campo; rotulo: string; ayuda: string }[] = [
  { campo: 'rol', rotulo: 'Rol de Snowflake', ayuda: 'El rol con el que se consulta. Si va vacío, Snowflake usa el rol por defecto del usuario.' },
  { campo: 'usuario', rotulo: 'Usuario de servicio', ayuda: 'El usuario con el que se conecta.' },
  { campo: 'cuenta', rotulo: 'Cuenta', ayuda: 'El identificador de la cuenta de Snowflake.' },
  { campo: 'url', rotulo: 'URL', ayuda: 'Un host de snowflakecomputing.com. Una URL de Snowsight no sirve.' },
]

const VACIO: Record<Campo, string> = { rol: '', usuario: '', cuenta: '', url: '' }

type Props = {
  /** Cómo quedó al último guardado de esta sesión · `null` si no se guardó. */
  guardada: ConexionGuardada | null
  /** La identidad y los objetos de la última verificación · `null` sin verificar. */
  verificada: VerificacionDeAcceso['infraestructura'] | null
  guardando: boolean
  error: string | null
  /** Obligatoria: sin ella esta sección no tiene para qué existir. */
  onGuardar: (cambio: CambioDeConexion) => void
}

export function ConexionDeDatos({ guardada, verificada, guardando, error, onGuardar }: Props) {
  const [valores, setValores] = useState(VACIO)
  // **Al guardar bien se vacía el formulario**, y no al apretar: si el servicio
  // contesta 400, lo escrito sigue ahí para corregirlo. Se detecta en el render
  // —lo guardado cambió— y no en un efecto, que pintaría una vez de más.
  const [guardadaVista, setGuardadaVista] = useState(guardada)
  if (guardada !== guardadaVista) {
    setGuardadaVista(guardada)
    setValores(VACIO)
  }

  const escritos = CAMPOS.filter(({ campo }) => valores[campo].trim() !== '')
  const actual = (campo: Campo): string | null => {
    if (guardada !== null && guardada[campo] !== '') return guardada[campo]
    if (campo === 'usuario') return verificada?.usuario ?? null
    if (campo === 'rol') return verificada?.rol ?? null
    return null
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-6" aria-label="Conexión del equipo interno">
      <div className="flex flex-col gap-1">
        <Label as="div">Conexión · equipo interno</Label>
        <Ayuda>
          Solo la ve quien opera la plataforma. Un admin del cliente ve el acceso sin esta
          parte.
        </Ayuda>
      </div>

      {/* ── CON QUÉ SE MIRÓ ──────────────────────────────────────────────────
          Es lo primero porque es lo que hacía falta para Keralty: el error
          decía `RL_BT_UA_BI` y no había dónde ver con qué rol se consultaba. */}
      <div className="flex flex-col gap-1">
        <Label as="div">Con qué se verificó</Label>
        {verificada === null ? (
          <span className="font-body text-celda text-dim">Sin verificar en esta sesión</span>
        ) : verificada.rol === null && verificada.usuario === null ? (
          <span className="font-body text-celda text-dim">El servicio no dice con qué rol verificó.</span>
        ) : (
          <span className="font-body text-celda text-ink">
            {`${verificada.usuario ?? 'Usuario sin informar'} · ${verificada.rol ?? 'rol por defecto del usuario'}`}
          </span>
        )}
      </div>

      {verificada !== null && verificada.objetos.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0" aria-label="Lo que el producto lee">
          {verificada.objetos.map((o) => (
            <li key={o.nombre} className="flex flex-col gap-0.5">
              <span className="font-body text-celda text-ink">
                {`${o.nombre} · ${o.tipo === 'vista' ? 'vista' : 'tabla'} · `}
                {/* **«o este rol no la ve»**, porque el servicio no los separa:
                    `exists: false` es las dos cosas. Decir «no existe» era
                    exactamente el diagnóstico equivocado de Keralty. */}
                {o.existe
                  ? o.faltan.length === 0
                    ? 'Está'
                    : `Le faltan ${o.faltan.join(', ')}`
                  : 'No está, o este rol no la ve'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-col gap-3 border-t border-w2 pt-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (escritos.length === 0) return
          onGuardar(Object.fromEntries(escritos.map(({ campo }) => [campo, valores[campo].trim()])))
        }}
      >
        <Label as="div">Corregir la conexión</Label>
        <div className="grid grid-cols-2 gap-3">
          {CAMPOS.map(({ campo, rotulo, ayuda }) => (
            <label key={campo} className="flex flex-col gap-1">
              <Label as="span">{rotulo}</Label>
              <input
                value={valores[campo]}
                onChange={(e) => setValores((v) => ({ ...v, [campo]: e.target.value }))}
                placeholder={actual(campo) ?? 'Sin cambio'}
                autoComplete="off"
                spellCheck={false}
                className="h-8 rounded-md border border-w4 bg-transparent px-2 font-body text-cuerpo text-ink"
              />
              <Ayuda>{ayuda}</Ayuda>
            </label>
          ))}
        </div>
        <Ayuda>
          Cada campo se guarda solo si se escribe; en blanco queda como está. La clave privada
          no se cambia acá.
        </Ayuda>
        {error !== null && <Ayuda>{error}</Ayuda>}
        <div className="flex justify-end">
          <Accion
            tamano="compacta"
            variante="primaria"
            tipo="submit"
            deshabilitada={guardando || escritos.length === 0}
          >
            {guardando ? 'Guardando…' : 'Guardar y verificar'}
          </Accion>
        </div>
      </form>

      {guardada !== null && (
        <div className="flex flex-col gap-1 border-t border-w2 pt-3">
          <Label as="div">Quedó guardada</Label>
          <span className="font-body text-celda text-ink">
            {`${guardada.cuenta} · ${guardada.usuario} · ${guardada.rol === '' ? 'rol por defecto del usuario' : guardada.rol}`}
          </span>
          {/* **Sin `Note`**, que pasa a mayúsculas: una URL se muestra como es. */}
          <span className="font-body text-celda text-dim">
            {`${guardada.url === '' ? 'Sin URL · se deriva de la cuenta' : guardada.url} · ${guardada.tieneClave ? 'clave cargada' : 'sin clave'}`}
          </span>
        </div>
      )}
    </section>
  )
}
