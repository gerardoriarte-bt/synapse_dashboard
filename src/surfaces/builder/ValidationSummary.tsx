/** El resumen de composición · F4.11
 *
 *  Lo que el front puede decir **ahora**, sin una vuelta de red por tecla.
 *
 *  **Y lo que dice con la misma claridad es que no decide.** El criterio de F4.11
 *  lo escribe así: «la validación del front es feedback inmediato; **el servidor
 *  decide** (B4.6). Nunca se publica algo que el front dio por bueno y el
 *  servidor no vio». Un resumen en verde que se leyera como permiso para publicar
 *  sería justamente eso.
 *
 *  Cada problema dice **qué pestaña, qué panel y la razón** — no «composición
 *  inválida». Es la diferencia entre «arreglá esto» y «buscá cuál de los doce».
 */
import { Label } from '../../render/primitives/Label'
import type { ProblemaLocal } from './validar'

type Props = {
  problemas: readonly ProblemaLocal[]
  /** Los nombres de las pestañas, por índice, para no pintar un número. */
  nombres: readonly string[]
}

export function ValidationSummary({ problemas, nombres }: Props) {
  return (
    <div className="flex flex-col gap-1 rounded-sm bg-w2 p-3">
      <Label as="div">
        {problemas.length === 0
          ? 'Sin problemas de composición que el front pueda ver'
          : `${String(problemas.length)} problema(s) de composición`}
      </Label>

      {problemas.map((p) => (
        <Label key={`${String(p.tab)}-${String(p.panel)}-${p.campo}`} as="div">
          {`${nombres[p.tab] ?? `Pestaña ${String(p.tab + 1)}`}${
            p.panel === null ? '' : ` · panel ${String(p.panel + 1)}`
          } · ${p.mensaje}`}
        </Label>
      ))}

      {/* **Siempre, no solo cuando hay problemas.** El caso peligroso es el
          limpio: es ahí donde alguien podría leer «listo para publicar». */}
      <Label as="div">
        El servidor decide · esto es feedback inmediato y puede no conocer todas sus reglas
      </Label>
    </div>
  )
}
