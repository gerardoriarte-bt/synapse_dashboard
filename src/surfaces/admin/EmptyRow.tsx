/** El vacío de una tabla de administración · §8 y el `.pen`
 *
 *  **Son TRES cosas distintas y la salida cambia con la causa.** Es lo que las
 *  notas de los tres frames vacíos del `.pen` repiten: «un estado sin salida es
 *  una queja (…) los tres tipos de vacío declaran qué pasó y qué se puede hacer,
 *  y la salida cambia con la causa».
 *
 *  | | Qué pasó | La salida |
 *  |---|---|---|
 *  | `sistema` | Nadie dio de alta nada todavía | Crear el primero |
 *  | `filtro` | Los datos están · el filtro los esconde | **Deshacer lo que uno hizo** |
 *  | `alta` | El cliente es nuevo y el trabajo está por hacerse | El siguiente paso del alta |
 *
 *  Tratarlos como uno solo manda a alguien a crear lo que ya existe, que es el
 *  caso del vacío de filtro leído como vacío de sistema.
 *
 *  ── EL ENCABEZADO SE CONSERVA ───────────────────────────────────────────────
 *
 *  «Las columnas siguen diciendo qué habría acá», dicen las tres notas. Por eso
 *  esto es una FILA de la tabla y no un reemplazo de la tabla: una pantalla que
 *  se vacía entera pierde lo único que explicaba qué falta.
 *
 *  ── Y EL CONTEO DICE CUÁNTOS HAY EN TOTAL ───────────────────────────────────
 *
 *  «0 MÉTRICAS CON ESTE FILTRO · 28 EN TOTAL». El total es la mitad que evita
 *  creer que se perdieron: sin él, cero con filtro y cero sin nada se leen igual.
 *  Lo pinta cada pantalla en su conteo; acá va la salida.
 *
 *  **§PEN:A1** y **§PEN:A4** · los dos vacíos dibujados, y son el mismo
 *  componente a propósito: «A1 · Clientes · sin ningún cliente» y
 *  «A4 · Métricas · filtro sin resultados». El `.pen` los dibuja con la misma
 *  anatomía y distinto texto, que es exactamente lo que este componente hace.
 */
import { Label } from '../../render/primitives/Label'

export type ClaseDeVacio = 'sistema' | 'filtro' | 'alta'

type Props = {
  clase: ClaseDeVacio
  columnas: number
  /** Qué pasó, en la lengua del producto. */
  razon: string
  /** El siguiente paso · para `sistema` y `alta`. */
  salida: string
  /** Solo para `filtro`: deshacer lo que uno hizo. */
  onLimpiarFiltro?: () => void
}

export function EmptyRow({ clase, columnas, razon, salida, onLimpiarFiltro }: Props) {
  return (
    <tr>
      {/* Ocupa el ancho entero **sin tocar el encabezado**: las columnas siguen
          arriba, diciendo qué habría acá. */}
      <td colSpan={columnas} className="py-6">
        <div className="flex flex-col gap-2 items-start">
          <Label as="div">{razon}</Label>
          <Label as="div">{salida}</Label>
          {clase === 'filtro' && onLimpiarFiltro !== undefined && (
            // **La salida del vacío de filtro es deshacer**, no crear: los datos
            // están y el filtro los esconde. Un CTA de alta acá manda a crear lo
            // que ya existe.
            <button
              type="button"
              onClick={onLimpiarFiltro}
              className="font-mono text-label tracking-rotulo uppercase rounded-md px-3 py-1 cursor-pointer border border-w4 bg-transparent text-ink hover:bg-w2"
            >
              Limpiar el filtro
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
