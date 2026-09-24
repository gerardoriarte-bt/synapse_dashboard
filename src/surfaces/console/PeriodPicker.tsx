/** El selector de período · F1.7 · §PEN:C1
 *
 *  **Agrupa por `grano` y deshabilita lo que la pestaña no puede contestar.**
 *  Verificado contra Snowflake: las métricas de marca son mensuales
 *  —`BR_MONTH_TD`, `REPORT_MONTH`— y las de ecommerce diarias. Con el selector
 *  en una semana, una pestaña de marca no tiene nada que mostrar.
 *
 *  Decisión del 2026-08-19: **la métrica lo declara y el selector deshabilita lo
 *  que no aplica, con la razón visible.** Ofrecer un período que la métrica no
 *  puede contestar es el mismo problema que un panel sin BASE: promete algo que
 *  no puede cumplir.
 *
 *  ── POR QUÉ UN DESPLEGABLE Y NO UN RIEL · 2026-09-24 ────────────────────────
 *
 *  Hasta hoy eran doce chips en fila. **Y el riel era invención nuestra**: el
 *  frame de §PEN:C1 tiene un `Header` con `Titles` a la izquierda y un `Rango` a
 *  la derecha —`PERÍODO` arriba y `1 – 31 JUL 2026 · MTD CERRADO` debajo—, **de
 *  sólo lectura**. No dibuja ningún control: el único «CAMBIAR PERÍODO» del
 *  archivo es el CTA de un estado vacío.
 *
 *  El riel se notó cuando el dato se volvió real. Doce chips aprietan la
 *  cabecera, y con el mes en curso marcado —F1.42— uno de ellos creció y el
 *  problema se vio.
 *
 *  **El desplegable conserva la anatomía del dibujo** —el rótulo arriba, el
 *  valor debajo— y suma lo que el dibujo no resuelve: cómo se cambia. Es
 *  decisión de producto del 2026-09-24, y queda anotada acá porque el `.pen` no
 *  la declara.
 *
 *  ── POR QUÉ `select` NATIVO ────────────────────────────────────────────────
 *
 *  Porque los tres comportamientos que hay que sostener ya vienen puestos:
 *  `optgroup` agrupa por grano, `disabled` sobre el grupo apaga el grano entero,
 *  y el teclado —abrir, recorrer, elegir, Escape— funciona sin una línea. Un
 *  menú a mano sería más control sobre el aspecto y una trampa de accesibilidad
 *  que hay que mantener.
 */
import { Label } from '../../render/primitives/Label'
import { GRAINS, GRAIN_LABEL, coarsestRequired, grainOf } from './periodGrain'
import type { Metric, Period } from '../../api/types'

type Props = {
  periods: readonly Period[]
  activeId: string | undefined
  /** Las métricas de la pestaña activa. De acá sale qué granos son ofrecibles. */
  metrics: readonly Metric[]
  onSelect: (id: string) => void
}

export function PeriodPicker({ periods, activeId, metrics, onSelect }: Props) {
  const required = coarsestRequired(metrics)
  const requiredIndex = GRAINS.indexOf(required)

  const byGrain = GRAINS.map((grain) => ({
    grain,
    // Un grano más fino que el que exige la pestaña no se puede contestar.
    usable: GRAINS.indexOf(grain) <= requiredIndex,
    items: periods.filter((p) => grainOf(p) === grain),
  })).filter((g) => g.items.length > 0)

  if (byGrain.length === 0) return null

  const activo = periods.find((p) => p.id === activeId)
  const hayApagados = byGrain.some((g) => !g.usable)

  return (
    <div className="flex flex-col items-end gap-1">
      <Label as="div">Período</Label>

      <select
        value={activeId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        aria-label="Período"
        className={
          'font-mono text-label leading-rotulo tracking-rotulo uppercase text-ink ' +
          'bg-transparent border border-w3 rounded-md px-2 py-1 cursor-pointer hover:border-w4'
        }
      >
        {byGrain.map(({ grain, usable, items }) => (
          <optgroup
            key={grain}
            label={
              usable
                ? GRAIN_LABEL[grain]
                : // §8: la razón va en el propio grupo apagado. Un control
                  // deshabilitado sin explicación es peor que uno ausente — no
                  // se sabe si es un permiso, un error o el dato.
                  `${GRAIN_LABEL[grain]} · no aplica, alguna métrica se mide por ${required}`
            }
            disabled={!usable}
          >
            {items.map((p) => (
              <option key={p.id} value={p.id}>
                {/* El mes en curso se marca acá también · F1.42. Elegirlo es
                    legítimo; verlo igual que uno cerrado, no. */}
                {p.enCurso === true ? `${p.etiqueta} · en curso` : p.etiqueta}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* El rango, debajo del control, que es donde el dibujo lo pone. Sale del
          período y no se compone acá: sin `rango` no se inventa uno. */}
      {activo?.rango !== undefined && <Label as="div">{activo.rango}</Label>}

      {activo?.enCurso === true && (
        <Label as="div">Período en curso · incompleto, no compara contra uno cerrado</Label>
      )}

      {hayApagados && (
        // La razón también afuera: dentro del desplegable sólo se ve al
        // abrirlo, y quien no lo abre no se entera de que hay granos apagados.
        <Label as="div">{`Algún grano no aplica · alguna métrica se mide por ${required}`}</Label>
      )}
    </div>
  )
}
