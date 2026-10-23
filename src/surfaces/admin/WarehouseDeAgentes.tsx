/** El warehouse con el que consulta cada agente · A2 · F5.56, 2026-10-23
 *
 *  **Vive en el agente, no en el cliente**, y no es un detalle: la consulta
 *  usa el warehouse del agente que resuelve, y un cliente con varios agentes
 *  tiene uno por agente. Por eso es una lista y no un campo más de
 *  «Corregir la conexión». Cambiar el usuario y olvidar un agente deja ese
 *  agente consultando con un warehouse que el rol nuevo quizá no puede usar.
 *
 *  **Un valor en blanco no viaja**: el servicio no lo valida —medido, `""`
 *  da 200 y deja al agente sin warehouse—, así que lo frena el front.
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
import type { WarehouseDeAgente } from '../../api/admin'

type Props = {
  /** `undefined` mientras se lee. */
  agentes: WarehouseDeAgente[] | undefined
  errorDeLectura: string | null
  /** El agente que se está guardando · `null` si ninguno. */
  guardando: string | null
  /** El error del último guardado, con el agente al que corresponde. */
  error: { agentId: string; mensaje: string } | null
  onGuardar: (agentId: string, warehouse: string) => void
}

export function WarehouseDeAgentes({
  agentes,
  errorDeLectura,
  guardando,
  error,
  onGuardar,
}: Props) {
  const [valores, setValores] = useState<Record<string, string>>({})
  // **Al cambiar lo guardado se vacía lo escrito**, como en `ConexionDeDatos`:
  // si el servicio contesta mal, lo escrito queda para corregirlo.
  const [agentesVistos, setAgentesVistos] = useState(agentes)
  if (agentes !== agentesVistos) {
    setAgentesVistos(agentes)
    setValores({})
  }

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-6"
      aria-label="Almacén virtual de cada agente"
    >
      <div className="flex flex-col gap-1">
        <Label as="div">Almacén virtual de cada agente</Label>
        <Ayuda>
          Cada agente consulta con el suyo. Al cambiar de usuario, el rol nuevo tiene que poder
          usarlo.
        </Ayuda>
      </div>

      {errorDeLectura !== null ? (
        <Ayuda>{`No se pudieron leer los agentes: ${errorDeLectura}`}</Ayuda>
      ) : agentes === undefined ? (
        <span className="font-body text-celda text-dim">Leyendo los agentes…</span>
      ) : agentes.length === 0 ? (
        <span className="font-body text-celda text-ink">Este cliente no tiene agentes.</span>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {agentes.map((a) => {
            const escrito = (valores[a.id] ?? '').trim()
            const cambia = escrito !== '' && escrito !== a.warehouse
            const actual = a.warehouse
            return (
              <li key={a.id} className="flex flex-col gap-1 border-t border-w2 pt-3">
                <span className="font-body text-celda text-ink">
                  {`${a.nombre} · ${a.rol}${a.activo ? '' : ' · inactivo'}`}
                </span>
                <form
                  className="flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (cambia) onGuardar(a.id, escrito)
                  }}
                >
                  <input
                    aria-label={`Nuevo para ${a.nombre}`}
                    value={valores[a.id] ?? ''}
                    onChange={(e) => setValores((v) => ({ ...v, [a.id]: e.target.value }))}
                    placeholder={a.warehouse === '' ? 'Sin asignar' : a.warehouse}
                    autoComplete="off"
                    spellCheck={false}
                    className="h-8 min-w-0 flex-1 rounded-md border border-w4 bg-transparent px-2 font-body text-cuerpo text-ink"
                  />
                  <Accion
                    tamano="compacta"
                    tipo="submit"
                    deshabilitada={guardando !== null || !cambia}
                  >
                    {guardando === a.id ? 'Guardando…' : 'Guardar'}
                  </Accion>
                </form>
                <Ayuda>{a.warehouse === '' ? 'Hoy no tiene.' : `Hoy usa ${actual}.`}</Ayuda>
                {error !== null && error.agentId === a.id && <Ayuda>{error.mensaje}</Ayuda>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
