/** Barras radiales · forma `categorica` · §PEN:Plot/BARRAS RADIALES · Cumplimiento por región
 *
 *  Medido nodo por nodo sobre el frame `Plot/BARRAS RADIALES · Cumplimiento por
 *  región` (420×272, centro de los anillos en 170,150, radio exterior 108). Acá
 *  sólo está lo que el dibujo NO dice con palabras y hubo que deducir midiendo;
 *  lo que el código ya dice no se repite.
 *
 *  **La escala es contra el MAYOR del conjunto, y es una limitación del dato.**
 *  El dibujo escribe «103%» de cumplimiento, que es una razón contra una meta, y
 *  `ValorCategorica` es `{ etiqueta, v }` y nada más: el cable no manda objetivo
 *  ni máximo, y `presentation` tampoco lo trae. La consecuencia hay que decirla
 *  porque no se ve: **cuatro regiones al 40% dibujan exactamente los mismos
 *  arcos que cuatro al 100%**. El día que el backend mande un objetivo, la
 *  escala pasa a ser contra la meta y el arco puede pasarse del riel.
 *
 *  **El `.pen` pinta CUATRO FAMILIAS distintas** —`$fam-demanda-1`,
 *  `$fam-demanda-0`, `$fam-inventario-1`, `$fam-cliente-1`— y acá la familia es
 *  UNA y llega por prop, porque la regla dura 1 dice que se lee del catálogo y
 *  nunca se elige en el componente. Lo que varía entre pistas es el ESCALÓN de
 *  la rampa, que es la misma resolución que ya tomó `PlotRings`.
 *
 *  **El promedio del centro es SIMPLE, sin ponderar.** Es lo que hace el frame:
 *  (103+96+88+74)/4 = 90,25 y escribe «90%». Si la métrica fuera absoluta, o
 *  fueran tasas de bases distintas, ese promedio está mal — y el dato no trae
 *  con qué ponderarlo. Se dibuja lo que el frame dibuja, con su rótulo
 *  PROMEDIO al lado, que es lo que impide leerlo como un total.
 *
 *  DIVERGENCIA DECLARADA, en el idioma de `envelope()`: el `.pen` deja el disco
 *  más chico de lo que su caja permite —R=108 contra un medio lado de 136, con
 *  42px de aire arriba y 14 abajo—, y esos márgenes están puestos a mano, no son
 *  una regla que se pueda leer. Acá el disco usa el alto disponible.
 *
 *  DIVERGENCIA DECLARADA (2): las filas de la leyenda son mono 11 en `$ink`,
 *  que es lo que manda el frame porque esta leyenda ES la lectura del dato y no
 *  el rótulo de un eje. `AxisText` está cerrado en mono 10 `dim` —su
 *  `TYPOGRAPHY` es una constante de módulo—, así que el `<text>` va escrito acá
 *  reproduciendo el contrato del frame. La primitiva que faltaría —`ValueText`
 *  al lado de `AxisText`— vive en un archivo compartido que esta tarea no toca.
 */
import { Arc, ArcRail } from './core/Arc'
import { useSize } from './core/useSize'
import { charsThatFit } from './core/axisGeometry'
import type { FamilyStep } from '../../tokens/tokens'
import type { PlotProps } from '../types'

/** Cuánto barre el riel. **342° medidos**: el extremo del riel de r=108 cae en
 *  (136,6 · 47,3), que son −18° desde el tope. El hueco de arriba es lo que hace
 *  que el anillo no se lea como un círculo cerrado. */
const RAIL_SWEEP = 0.95

/** Cuánto barre el arco del MAYOR. **320° medidos** sobre el arco de 103%:
 *  extremo (100,9 · 67). Es decir que ni el mayor toca el final de su propio
 *  riel —quedan 22° de riel a la vista—, y eso importa: un arco que cierra su
 *  anillo se lee como «completo», y `categorica` no autoriza esa afirmación
 *  porque no hay contra qué estar completo.
 *
 *  Los cuatro arcos dan 320,0° · 298,5° · 273,5° · 230,0° para 103 · 96 · 88 ·
 *  74: el cociente vuelta÷valor es 0,008635 en las cuatro con cuatro cifras, así
 *  que la vuelta es **exactamente proporcional al valor**. */
const VALUE_SWEEP = 0.889

/** El hueco central, como fracción del radio exterior: 27/108. Es lo que deja
 *  lugar a la cifra; sin él la pista interior se come el centro. */
const HOLE = 0.25

/** Separación entre pistas como fracción del grosor: 7/15 medidos (el radio
 *  interior de la pista de 108 es 93 y la siguiente arranca en 86). */
const GAP_RATIO = 7 / 15

/** Lo que se lleva la columna de la leyenda: 120/420. **Proporcional y no fijo**,
 *  por la misma razón que `LABEL_WIDTH` en `PlotBars`: el mismo plot vive en un
 *  panel de colSpan 4 y en el drill-down a pantalla completa. */
const LEGEND_WIDTH = 0.29

/** El paso entre filas del `.pen`: y = 45 · 75 · 105 · 135. Es un TECHO, no una
 *  constante: con muchos ítems el paso se achica para que ninguna fila quede
 *  fuera, en vez de recortarse en silencio. */
const LEGEND_STEP = 30

/** 22px de cifra sobre un radio exterior de 108 ⇒ 0,2037. El 22 no está en la
 *  escala tipográfica —emite 20 y 44—, así que escala con el disco como ya hace
 *  `PlotGauge` con la suya. El piso 14 es lo mínimo legible. */
const FIGURE_RATIO = 0.2
const FIGURE_MIN = 14

/** Dónde caen las dos líneas del centro respecto del centro geométrico, en
 *  fracciones del radio: la cifra tiene su centro en y=147,2 (cy − 0,03·R) y
 *  PROMEDIO en y=170,9 (cy + 0,19·R). */
const FIGURE_DY = -0.03
const CAPTION_DY = 0.19

/** El tamaño de la fila de leyenda, en px. Es `--text-cifra`, y va como número
 *  porque `charsThatFit` necesita medirlo. */
const LEGEND_SIZE = 11

export type Track = { outer: number; thickness: number }

/** La geometría concéntrica: dados N ítems y el radio exterior, el radio de
 *  cada pista y su grosor.
 *
 *  Sale de las proporciones del frame y no de sus píxeles: hueco = 0,25·R, el
 *  anillado ocupa el 0,75·R que queda, y la separación es 7/15 del grosor. Para
 *  N=4 y R=108 devuelve exactamente el dibujo —108 · 86 · 64 · 42, grosor 15,
 *  separación 7— y por eso las medidas del `.pen` sirven de prueba.
 *
 *  No se exporta: `react/only-export-components` marca todo export que no sea un
 *  componente, y la primitiva que correspondería —`core/radialTracks.ts`— es un
 *  archivo que esta tarea no crea. La prueba la verifica a través de los rieles
 *  dibujados, que además demuestra que el plot la usa. */
function radialTracks(n: number, r: number): Track[] {
  if (n <= 0 || r <= 0) return []
  const thickness = (r * (1 - HOLE)) / (n + GAP_RATIO * (n - 1))
  const step = thickness * (1 + GAP_RATIO)
  return Array.from({ length: n }, (_, i) => ({ outer: r - i * step, thickness }))
}

/** Recorta un rótulo a lo que entra, con elipsis. Mismo criterio que
 *  `CategoryAxis`: un tope fijo en caracteres se sale del panel angosto. */
const clamp = (text: string, cap: number) =>
  text.length > cap ? `${text.slice(0, Math.max(1, cap - 1))}…` : text

export function PlotRadial({
  value,
  family,
  format,
  unit,
}: PlotProps<'categorica'> & { unit?: string }) {
  const { ref, w, h } = useSize()

  const items = value.items
  /** El denominador de la escala, y los dos guardas que lleva hacen falta por
   *  razones DISTINTAS —escritos como uno solo, uno de los dos queda muerto y
   *  ninguna prueba puede demostrarlo—:
   *
   *  · el piso de 0 es por los NEGATIVOS. `Math.max(-5, -3)` es −3, y `−5 / −3`
   *    da 1,67: el peor valor del conjunto cerraría su anillo entero y se leería
   *    como el más cumplido. Con el piso, una serie con signo no dibuja arco.
   *  · el `=== 0` es por la división. Sin él, cuatro ceros dan `0/0` = NaN, y
   *    `arcPath` escribe NaN en el trazo — que en SVG no rompe: dibuja nada y no
   *    avisa. */
  const max = Math.max(0, ...items.map((i) => i.v))

  const discW = w * (1 - LEGEND_WIDTH)
  const r = Math.max(0, Math.min(discW, h) / 2 - 4)
  const cx = discW / 2
  const cy = h / 2
  const tracks = radialTracks(items.length, r)

  const average =
    items.length === 0 ? 0 : items.reduce((acc, i) => acc + i.v, 0) / items.length
  // Sólo un símbolo se pega a la cifra. La unidad larga es del shell, igual que
  // en `PlotGauge`.
  const suffix = unit === '%' ? '%' : ''

  const legendStep = Math.min(LEGEND_STEP, h / (items.length + 1))
  const legendTop = h / 2 - ((items.length - 1) * legendStep) / 2
  const legendRoom = Math.max(0, w - discW - 4)
  const legendCap = charsThatFit(legendRoom, LEGEND_SIZE)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {w > 0 && h > 0 && r > 0 && items.length > 0 && (
        <svg width={w} height={h} role="img" aria-label={`${items.length} barras radiales`}>
          {tracks.map((t, i) => {
            const item = items[i]
            if (item === undefined) return null
            return (
              <g key={item.etiqueta}>
                {/* El riel dice cuánto FALTA, no sólo cuánto hay · una pista por
                    ítem, no uno solo en la de afuera. */}
                <ArcRail
                  cx={cx}
                  cy={cy}
                  radius={t.outer}
                  thickness={t.thickness}
                  totalSweep={RAIL_SWEEP}
                  from={0}
                />
                <Arc
                  cx={cx}
                  cy={cy}
                  radius={t.outer}
                  thickness={t.thickness}
                  family={family}
                  totalSweep={VALUE_SWEEP}
                  from={0}
                  segments={[
                    {
                      k: item.etiqueta,
                      fraction: max === 0 ? 0 : item.v / max,
                      // EXPLÍCITO, y no es adorno: `Arc` cae a `i % 5` con el
                      // índice DENTRO de sus segmentos, y acá cada pista es un
                      // `<Arc>` de un solo segmento. Sin esto las cuatro salen
                      // del mismo escalón y el dibujo queda monocromo.
                      step: (i % 5) as FamilyStep,
                    },
                  ]}
                />
              </g>
            )
          })}

          <text
            x={cx}
            y={cy + r * FIGURE_DY}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: Math.max(FIGURE_MIN, r * FIGURE_RATIO),
              letterSpacing: 'var(--tracking-titulo)',
              fill: 'var(--color-ink)',
            }}
          >
            {format(Math.round(average))}
            {suffix}
          </text>
          {/* Ningún número desnudo: la cifra del centro es un promedio y hay que
              decirlo, porque un número solo en el medio de un disco se lee como
              el total. */}
          <text
            x={cx}
            y={cy + r * CAPTION_DY}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-nota)',
              letterSpacing: 'var(--tracking-rotulo)',
              fill: 'var(--color-dim)',
            }}
          >
            PROMEDIO
          </text>

          {/* La leyenda no es opcional. El frame no dibuja muestra de color, así
              que anillo y fila se corresponden por ORDEN; y como el anillo de
              afuera pinta 2,6× más tinta que el de adentro para la misma
              fracción, la cifra escrita es lo único que hace comparable el
              dibujo. */}
          {items.map((item, i) => {
            const figure = `${format(item.v)}${suffix}`
            // El piso de 3 es el mismo de `charsThatFit`: una fila angosta recorta el
                // rótulo, nunca lo borra.
                const label = clamp(
                  item.etiqueta.toUpperCase(),
                  Math.max(3, legendCap - figure.length - 2),
                )
            return (
              <text
                key={`l-${item.etiqueta}`}
                x={discW}
                y={legendTop + i * legendStep}
                textAnchor="start"
                dominantBaseline="central"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--text-cifra)',
                  fill: 'var(--color-ink)',
                }}
              >
                {`${label}  ${figure}`}
              </text>
            )
          })}
        </svg>
      )}
    </div>
  )
}
