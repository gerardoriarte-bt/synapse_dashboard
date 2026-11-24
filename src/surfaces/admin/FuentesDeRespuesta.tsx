/** De dónde sale cada cifra de una respuesta · §PEN:A7 · la «Procedencia» de
 *  «A7 · Validar respuestas» y de «A7 · El correo del reporte»
 *
 *  **Construida mirando el dibujo**: un chip y una línea mono, una por fuente.
 *  El chip dice la capa —`GOLD`— y, si la fuente está vencida, `DEGRADADO` en
 *  gris, que es como el correo dibuja «si la fuente está vencida a la hora del
 *  envío». La línea dice la fuente, el mes y cuándo se cargó.
 *
 *  **De dónde sale cada parte** · `5b917f7`, leído en `dd_report_sources.go`:
 *  - `GOLD` porque `source` sólo puede ser una de las tablas Gold del entorno:
 *    el servicio busca en el SQL esas y ninguna otra.
 *  - El mes es `period`, con el nombre del mes y no el id del cable.
 *  - «Cargado» es `freshness`, el `last_load_at` del feed. **Vacío no es
 *    «recién»**: sólo dos tablas tienen feed, y las demás lo dicen.
 *
 *  **Lo que se aparta del dibujo, y por qué:**
 *  - **La fuente se nombra con la tabla, no con el catálogo.** El dibujo dice
 *    «Reporte de pauta DataTerpel»; el servicio manda `GLD_PAID_MEDIA…`. No se
 *    traduce acá: el dueño del copy que describe datos es el catálogo, y una
 *    tabla de traducción en el front es la que nadie mantiene.
 *  - **Sin fuentes no se inventan.** El servicio manda la lista vacía cuando el
 *    agente no consultó datos, y la pantalla lo dice en vez de callarlo.
 */
import type { FuenteDeRespuesta } from '../../api/admin'
import type { Formatter } from '../../render/format'
import { Label } from '../../render/primitives/Label'
import { StatusChip } from './StatusChip'

type Props = {
  fuentes: readonly FuenteDeRespuesta[]
  /** Con el huso del CLIENTE ya puesto: lo arma `Reportes`. */
  format: Formatter
  /** **Qué se dice cuando no hay fuentes**, que depende de dónde. En una
   *  validación es «el agente no consultó datos»; en un envío viejo no se sabe,
   *  porque las corridas de antes de `5b917f7` no guardaban fuentes. Visto en
   *  `dev:mock` el 2026-11-24: el envío de septiembre decía que el agente no
   *  había consultado nada. */
  sinFuentes?: string
}

/** La línea de una fuente, en el orden del dibujo: fuente · mes · carga. */
export function lineaDeFuente(f: FuenteDeRespuesta, format: Formatter): string {
  const carga =
    f.cargadaEn === null
      ? 'sin fecha de carga'
      : `${f.vencida ? 'última carga el' : 'cargado el'} ${format.calendar(f.cargadaEn)} ${format.clock(f.cargadaEn)}`
  return [f.fuente, format.periodName(f.periodo), carga].join(' · ')
}

export function FuentesDeRespuesta({ fuentes, format, sinFuentes = 'No cita ninguna fuente' }: Props) {
  if (fuentes.length === 0) {
    return <Label as="div">{sinFuentes}</Label>
  }
  return (
    <ul aria-label="Procedencia" className="m-0 flex list-none flex-col gap-2 p-0">
      {fuentes.map((f) => (
        <li key={f.fuente} className="flex flex-wrap items-center gap-2">
          <StatusChip tono={f.vencida ? 'apagado' : 'neutro'}>{f.vencida ? 'Degradado' : 'Gold'}</StatusChip>
          <Label>{lineaDeFuente(f, format)}</Label>
        </li>
      ))}
    </ul>
  )
}
