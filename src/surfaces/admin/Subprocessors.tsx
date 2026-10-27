/** A2 · subprocesadores · §PEN:A2 · F5.20
 *
 *  El cuarto bloque de `A2 · Ficha · tenant en alta`: quién trata los datos del
 *  cliente, con su función y su región. §7.3 lo pide como parte de la ficha y lo
 *  llama por su nombre: «una obligación legal de nombrar a quién procesa el dato
 *  — no una palanca operativa».
 *
 *  ── POR QUÉ ES UNA CONSTANTE Y NO UN VIAJE ──────────────────────────────────
 *
 *  Porque **no depende del cliente**. La nota del dibujo lo dice con precisión:
 *  «los subprocesadores en cambio aplican desde el alta», y el pie del bloque lo
 *  repite en la pantalla. Son de plataforma: los mismos tres antes de que exista
 *  un solo rol y después. Un viaje por cliente prometería que la lista varía.
 *
 *  ── LO QUE ESTE FRAME OMITE, Y OMITIRLO ES LA DECISIÓN ──────────────────────
 *
 *  La ficha del cliente en servicio dibuja **una tercera línea por fila** —la
 *  fecha de revisión del acuerdo— y cierra con un pie distinto. El frame de alta
 *  no dibuja ninguna de las dos, y es coherente: **no hay fecha que citar**. Un
 *  cliente que se acaba de dar de alta no tiene una revisión anterior, y pintar
 *  la del dibujo sería inventar una fecha — que es exactamente la clase de
 *  afirmación que esta pantalla existe para no hacer.
 *
 *  ── Y UNA ADVERTENCIA QUE NO ES DE CÓDIGO ───────────────────────────────────
 *
 *  **Estas tres filas son una afirmación legal y salen de un dibujo.** La nota de
 *  la ficha normal dice, con estas palabras, que la lista es inventada; las
 *  regiones y el «sin retención» no son decisiones de diseño. Construirlas como
 *  el dibujo las escribe es lo correcto —es el literal normativo— pero **darlas
 *  por verificadas no lo es**: la confirmación se levanta con quien sea dueño del
 *  acuerdo de tratamiento antes de que esto lo vea un cliente. Está anotado en la
 *  tarea que construyó esta pantalla.
 */
import { useId, useState } from 'react'
import { Label } from '../../render/primitives/Label'
import { Note } from '../../render/primitives/Note'

/** Los tres, en el orden del dibujo y con su texto literal. */
const SUBPROCESADORES = [
  { nombre: 'Snowflake Inc.', funcion: 'Almacenamiento y cómputo', region: 'US-EAST-1' },
  { nombre: 'Amazon Web Services', funcion: 'Infraestructura', region: 'US-EAST-1' },
  { nombre: 'Anthropic', funcion: 'Asistente Synapse · sin retención', region: 'US' },
] as const

export function Subprocessors() {
  /** **Plegada, con los nombres a la vista** · 2026-10-20. Son de plataforma y
   *  casi no cambian, así que el detalle —función y región— se abre. **Los
   *  nombres no se esconden**: nombrar a quién procesa el dato es la obligación
   *  legal por la que esta sección existe, y tiene que leerse sin tocar nada. */
  const [abierta, setAbierta] = useState(false)
  const detalle = useId()
  return (
    <section className="flex flex-col gap-3" aria-label="Subprocesadores">
      <Label as="div">Subprocesadores</Label>

      <div className="rounded-xl border border-w3 bg-panel flex flex-col">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <span className="font-body text-celda leading-cuerpo text-ink">
            {SUBPROCESADORES.map((s) => s.nombre).join(' · ')}
          </span>
          <span className="ml-auto text-dim">
            <Note as="span">De plataforma · aplican desde el alta</Note>
          </span>
          <button
            type="button"
            onClick={() => setAbierta((v) => !v)}
            aria-expanded={abierta}
            aria-controls={detalle}
            className="cursor-pointer rounded-md border border-w5 bg-transparent px-2 h-7 font-body text-celda font-semibold text-ink hover:bg-w2 transition-colors duration-rapida ease-salida"
          >
            {abierta ? 'Ocultar detalle' : 'Ver detalle'}
          </button>
        </div>

        {/* El detalle entra con un fundido; la altura, en seco · 2026-10-27,
            como el de `RoleCard`. */}
        {abierta && (
          <ul id={detalle} className="flex flex-col gap-3.5 m-0 border-t border-w2 px-5 py-4 list-none transition-opacity duration-base ease-salida starting:opacity-0">
            {SUBPROCESADORES.map((s) => (
              <li key={s.nombre} className="flex w-full items-start justify-between gap-3">
                <div className="flex flex-col gap-0.75 text-dim">
                  <span className="font-body text-celda leading-cuerpo text-ink m-0">{s.nombre}</span>
                  <Note as="div">{s.funcion}</Note>
                </div>
                {/* La región es el dato duro de la fila, y va a la derecha: es lo
                    que una revisión legal busca primero. */}
                <div className="text-dim">
                  <Note as="div">{s.region}</Note>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
