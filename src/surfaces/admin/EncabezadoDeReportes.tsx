import { Label } from '../../render/primitives/Label'
import { Ayuda } from '../../render/primitives/Ayuda'

/** La pregunta, el alcance y el conteo · lo comparten la lista y su error.
 *  `null` no pinta conteo: mientras carga no se sabe. El dibujo del error
 *  («A7 · Reportes · no cargó») escribe «Sin datos». */
export function EncabezadoDeReportes({ conteo }: { conteo: string | null }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <Ayuda>¿Qué le llega por correo a quién, y cuándo?</Ayuda>
      <div className="flex flex-col items-end gap-1">
        <span className="rounded-xs bg-w3 px-1 py-0.5">
          <Label>Alcance · cliente</Label>
        </span>
        {conteo !== null && <Label>{conteo}</Label>}
      </div>
    </header>
  )
}
