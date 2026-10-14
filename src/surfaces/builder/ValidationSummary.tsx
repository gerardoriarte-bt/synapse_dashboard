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
import { Ayuda } from '../../render/primitives/Ayuda'
import { Accion } from '../../render/primitives/Accion'
import type { ProblemaLocal } from './validar'

type Props = {
  problemas: readonly ProblemaLocal[]
  nombres: readonly string[]
  /** **Cada problema lleva a su lugar** · 2026-10-06. La lista nombraba «panel
   *  3» de una pestaña y había que contar chips para encontrarlo · §2.5 de la
   *  auditoría. `panel` es `null` cuando el problema es de la pestaña. */
  onIr: (tab: number, panel: number | null) => void
}

export function ValidationSummary({ problemas, nombres, onIr }: Props) {
  // Sin problemas no se pinta una caja: la frase de abajo la dice el chrome
  // cuando hace falta, que es al querer publicar.
  if (problemas.length === 0) return null

  return (
    // **Plegada por defecto** · visto en pantalla el 2026-10-06: abierta, la
    // lista empujaba la decisión de B1 y el lienzo media pantalla hacia abajo.
    // El resumen queda a la vista; el detalle, a un toque.
    <details className="group flex flex-col gap-3 rounded-xl border border-w4 bg-panel p-4">
      <summary className="flex cursor-pointer flex-col gap-1 list-none">
        <span className="flex items-center gap-2">
          <Label as="span">
            {`${String(problemas.length)} ${problemas.length === 1 ? 'problema' : 'problemas'} de composición`}
          </Label>
          <span className="font-body text-celda font-semibold text-ink underline underline-offset-2 group-open:hidden">
            Ver
          </span>
          <span className="hidden font-body text-celda font-semibold text-ink underline underline-offset-2 group-open:inline">
            Ocultar
          </span>
        </span>
        {/* **El caso peligroso es el limpio**, y por eso esto se decía siempre.
            Ahora va junto a los problemas: con la lista vacía el resumen no se
            pinta, y publicar sigue exigiendo que el servidor valide. */}
        <Ayuda>Se puede guardar igual; no se publica hasta corregirlos. El servidor tiene la última palabra.</Ayuda>
      </summary>

      <ul className="flex flex-col gap-2 m-0 mt-3 p-0 list-none">
        {problemas.map((p) => (
          <li key={`${String(p.tab)}-${String(p.panel)}-${p.campo}`} className="flex items-center gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <Label as="div">
                {`${nombres[p.tab] ?? `Pestaña ${String(p.tab + 1)}`}${
                  p.panel === null ? '' : ` · panel ${String(p.panel + 1)}`
                }`}
              </Label>
              <Ayuda as="span">{p.mensaje}</Ayuda>
            </div>
            <div className="ml-auto">
              <Accion tamano="compacta" onClick={() => onIr(p.tab, p.panel)}>
                {p.panel === null ? 'Ir a la pestaña' : 'Ir al panel'}
              </Accion>
            </div>
          </li>
        ))}
      </ul>
    </details>
  )
}
