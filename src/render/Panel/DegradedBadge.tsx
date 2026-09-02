/** El badge de degradado · §8 · F1.13e
 *
 *  El degradado **muestra el dato** con un badge que declara la limitación. La
 *  razón y el CTA los pone el shell debajo; el badge solo marca.
 *
 *  Es un `<Label>` con fondo, y no un label escrito a mano. §2.3 le da a los
 *  badges el mismo tratamiento tipográfico que a los labels —mono 10,
 *  mayúsculas, 0.12em—, así que reescribir esas utilidades acá sería duplicar la
 *  definición del rol: el día que §2.3 cambie, este badge no se enteraría. Lo
 *  único propio del badge es el fondo.
 *
 *  Estuvo escrito a mano hasta el 2026-09-02 y L15 no lo veía, porque vivía en
 *  el mismo archivo que `Provenance`, que sí importa `Label` — el detector mira
 *  el archivo entero. Separarlo lo dejó a la vista.
 *
 *  El fondo es `--color-w3` y no un color semántico: la regla dura 3 prohíbe que
 *  el color cargue el juicio, y un badge ámbar además está prohibido de plano.
 */
import { Label } from '../primitives/Label'

export function DegradedBadge({ children }: { children: string }) {
  return (
    <span className="bg-w3 rounded-xs px-1 py-0.5">
      <Label>{children}</Label>
    </span>
  )
}
