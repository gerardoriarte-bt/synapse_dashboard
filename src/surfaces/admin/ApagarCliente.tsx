/** Apagar el cliente · A2 · 2026-11-10
 *
 *  **Llegó con `b7c4534`**, respuesta al pedido de ordenar los clientes de QA:
 *  había dos que sobraban y ninguna forma de quitarlos. El servicio **apaga, no
 *  borra** —la fila, los usuarios, el dashboard y el catálogo se quedan— y el
 *  cliente sale de las listas y deja de actualizarse.
 *
 *  **Sólo con alcance de plataforma**, como la conexión: la ruta es de
 *  superadmin, y quién la ve lo decide `Admin`, no este componente.
 *
 *  **El `.pen` no la dibuja.** Ninguna de las tres fichas de `A2` tiene una
 *  acción para quitar al cliente; va con el resto de lo que sólo opera el
 *  equipo interno, que es donde ya divergimos del dibujo por la misma razón ·
 *  `docs/PROPUESTA-2026-10-21-conexion-del-equipo-interno.md`.
 *
 *  **Se confirma, y la confirmación dice lo que NO hace**, medido contra
 *  `4192041`: no hay ruta para volver a encenderlo, y el login no mira si el
 *  cliente está activo, así que sus usuarios pueden seguir entrando y ven
 *  datos que dejan de actualizarse. Con «Sistema», que tiene dos cuentas, eso
 *  importa.
 *
 *  §PEN:A2 · lo agrega, sólo para plataforma.
 */
import { useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'

type Props = {
  nombre: string
  /** `null` mientras cargan. */
  usuarios: number | null
  apagando: boolean
  error: string | null
  onApagar: () => void
}

export function ApagarCliente({ nombre, usuarios, apagando, error, onApagar }: Props) {
  const [confirmando, setConfirmando] = useState(false)

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-w3 bg-panel p-6"
      aria-label="Apagar el cliente"
    >
      <div className="flex flex-col gap-1">
        <Label as="div">Apagar el cliente</Label>
        <Ayuda>
          Sale de la lista de clientes y del formulario de acceso, y sus datos dejan de
          actualizarse. No se borra nada: usuarios, dashboard y métricas se quedan.
        </Ayuda>
      </div>

      {!confirmando ? (
        <div className="flex justify-end">
          <Accion variante="peligro" onClick={() => setConfirmando(true)} deshabilitada={apagando}>
            Apagar cliente
          </Accion>
        </div>
      ) : (
        <div className="flex flex-col gap-2" role="group" aria-label="Confirmar el apagado">
          <span className="font-body text-cuerpo text-ink">{`¿Apagar «${nombre}»?`}</span>
          <Ayuda>
            {usuarios === null
              ? 'Sus usuarios pueden seguir entrando, y ven datos que ya no se actualizan.'
              : usuarios === 0
                ? 'No tiene usuarios.'
                : usuarios === 1
                  ? 'Su único usuario puede seguir entrando, y ve datos que ya no se actualizan.'
                  : `Sus ${String(usuarios)} usuarios pueden seguir entrando, y ven datos que ya no se actualizan.`}{' '}
            Desde acá no se puede volver a encender.
          </Ayuda>
          <div className="flex justify-end gap-2">
            <Accion onClick={() => setConfirmando(false)}>Cancelar</Accion>
            <Accion variante="peligro" onClick={onApagar} deshabilitada={apagando}>
              {apagando ? 'Apagando…' : `Sí, apagar «${nombre}»`}
            </Accion>
          </div>
        </div>
      )}

      {error === null ? null : <Ayuda>{error}</Ayuda>}
    </section>
  )
}
