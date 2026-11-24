/** Mosaico · forma `categorica` · §PEN:Plot/TREEMAP · 2026-09-29
 *
 *  **Lo único que un treemap promete es que el ÁREA es proporcional al valor.**
 *  Todo lo demás —el orden, el color, el rótulo— es lectura; si el área miente,
 *  el dibujo se ve perfecto y el panel está mal. Por eso el reparto vive en
 *  `squarify`, que es aritmética pura y se prueba sin montar un SVG, igual que
 *  `stack.ts`.
 *
 *  **El dibujo es de DOS niveles y el dato es de UNO, y no se inventa el que
 *  falta.** El frame se llama «Catálogo por división» y rotula tres grupos
 *  —`FOOTWEAR · 48%`, `APPAREL · 40%`, `ACCESS. · 12%`— con sus hojas adentro.
 *  `ValorCategorica` es `items: [{ etiqueta, v }]` y no trae división ni
 *  jerarquía, así que acá se dibuja UN nivel y la banda inferior de rótulos de
 *  grupo no se pinta. Con eso los 30px de esa banda vuelven al mosaico: el alto
 *  útil es `h − 2·PAD`. La división es un pedido al backend, no un cálculo
 *  nuestro.
 *
 *  **Las columnas del dibujo son filas de `squarify`, y no salen iguales.** El
 *  frame agrupa por división (4 + 3 + 2 hojas); acá el agrupador es el
 *  algoritmo, que corta la fila cuando la relación de aspecto deja de mejorar.
 *  Con nueve valores en una caja apaisada da entre una y dos hojas por columna
 *  donde el dibujo muestra cuatro. Es la consecuencia directa de que falte el
 *  nivel de arriba, no un defecto del reparto.
 *
 *  **La cuota `%` es DERIVADA, y `categorica` no la trae.** `ValorComposicion`
 *  sí declara `porcentaje`, con su razón escrita en el yaml: la calcula el
 *  backend porque la suma tiene que dar 100 y redondear en el cliente produce
 *  columnas que suman 99.9. Acá se deriva `v / Σv` y se redondea a entero —que
 *  es como el frame las escribe: «22%», «13%», «8%»—, así que **las cuotas en
 *  pantalla pueden sumar 99% o 101%**. Se justifica porque es la misma área que
 *  el rectángulo ya ocupa, escrita en números; queda como divergencia declarada.
 *
 *  **Y la cuota es de lo DIBUJADO, no de la métrica.** Si el cuerpo recortó con
 *  `tope`, la suma es la de los ítems que llegaron: un mosaico que no llena su
 *  caja miente sobre la geometría, que es lo único que este gráfico afirma. La
 *  salida real es un ítem «Otros», y eso lo tiene que mandar el backend.
 *
 *  **La hoja MÁS GRANDE es la MÁS TRANSPARENTE**, medido en el frame: 0.3 en la
 *  de arriba y 0.8 en la de abajo, en las tres columnas. No es un descuido del
 *  dibujo — es lo que impide que el bloque mayor se coma el panel.
 *
 *  **En una caja alta y angosta el reparto sale en FILAS y no se parece al
 *  dibujo**, aunque el área siga siendo correcta. Pasa a `colSpan` 4 con
 *  `rowSpan` 5. El frame sólo muestra el caso apaisado, así que el vertical no
 *  tiene fuente normativa: queda como decisión del algoritmo, declarada, y es lo
 *  primero que conviene mirar cuando la pantalla se abra.
 *
 *  **PENDIENTE DE MEDICIÓN: `ink` sobre un relleno de familia al 30–80% es un
 *  WASH y ese par no está en `contraste.py`.** El antecedente es `DegradedBadge`,
 *  que da 4.17 componiendo la pila y 5.04 midiendo contra la superficie a secas:
 *  medir sin la capa dice «conforme» y miente. Puede obligar a subir el piso de
 *  opacidad o a mover el escalón de la rampa.
 *
 *  **Y por encima de ~20 hojas el mosaico deja de decir algo**: la rampa tiene
 *  cinco escalones y la opacidad cuatro, y las hojas chicas quedan sin rótulo
 *  por la guarda de abajo. `PlotComposition` lo resuelve con un tope de 5 y
 *  «Otros»; acá no hay «Otros» que mandar, así que el tope real lo pone
 *  `BarsParams.tope` y lo elige quien compone el panel. Es límite conocido, no
 *  defecto.
 */
import { AxisText } from './core/Axis'
import { charsThatFit } from './core/axisGeometry'
import { hue } from './core/seriesColor'
import { useSize } from './core/useSize'
import { squarify } from './core/treemap'
import type { Tile } from './core/treemap'
import type { PlotProps } from '../types'

/* ── Geometría, medida nodo por nodo sobre el frame de 580 × 226 ──────────── */

/** El frame dibuja 9,5 arriba y a la izquierda. **No cierra sus márgenes**: a la
 *  derecha deja 29,5 (el contenido termina en x 550,5 de 580). Se normaliza a
 *  padding simétrico, que es la misma clase de divergencia menor que `envelope`
 *  ya declara sobre el intervalo. */
const PAD = 10

/** Entre rectángulos, en los dos ejes: 96,6 − 93,6 = 3,0 en vertical y
 *  270,6 − 267,6 = 3,0 en horizontal. */
const GAP = 3

/** `cornerRadius: 2` en los nueve rectángulos. Es el mismo 2 que §2 fija como
 *  `r-xs` y que `core/Series.tsx` declara con el comentario «es el único lugar
 *  donde vive» — pero ahí está privado. Repetirlo acá es la segunda copia y
 *  debería exportarse de allá; no se toca porque es archivo compartido. */
const LEAF_RADIUS = 2

/** Qué escalón de la familia le toca a cada columna.
 *
 *  El frame usa `$fam-demanda-1` en la primera y `$fam-demanda-0` en la segunda,
 *  en ese orden. El arreglo conserva ese arranque y sigue por los que quedan. */
const RAMPA = [
  1, // `$fam-demanda-1` · la primera columna del frame
  0, // `$fam-demanda-0` · la segunda
  2,
  3,
  4,
] as const

/** La opacidad por RANGO dentro de la columna, del frame. Se topa en el último
 *  escalón: una columna de seis hojas repite 0.8 antes que inventar un 0.9. */
const OPACIDAD = [
  0.3, // la hoja mayor de la columna · las tres del frame arrancan acá
  0.5,
  0.7,
  0.8, // la menor · C1 la usa en «Golf», su cuarta hoja
] as const

/** El rótulo, medido contra el origen de SU rectángulo: nombre a x +8,5 con
 *  centro en y +14,2; cuota a x +8,5 con centro en y +30,6. */
const ROTULO_DX = 8.5
const NOMBRE_DY = 14.2
const CUOTA_DY = 30.6

/** **Un rótulo que no entra no se pinta, y el dibujo mismo se pasa acá**:
 *  «Golf» y su «5%» miden 19,2 + 16 dentro de un rectángulo de 16,8 de alto. La
 *  implementación no copia el desborde.
 *
 *  El alto de las dos líneas sale del propio rótulo —el centro de la cuota está
 *  a 30,6 y su caja mide 16, así que termina en 38,6—; el del nombre solo, de
 *  14,2 + 19,2/2 ≈ 24, redondeado a 22 para no perder una hoja por dos píxeles.
 *  El ancho mínimo es el inset de 8,5 por lado más tres caracteres de cuerpo 12
 *  (25,9): la columna más angosta que el frame rotula mide 62,3, bastante más. */
const ROTULO_MIN_W = 44
const NOMBRE_MIN_H = 22
const CUOTA_MIN_H = 38

/** El nombre de la hoja. **No es `AxisText`**: ese contrato es mono 10 en
 *  mayúsculas, y el frame escribe «Running», «Tops» y «Bags» en `$font-body` 12
 *  con la caja tal cual. La cuota de abajo SÍ es ese contrato exacto y por eso
 *  se compone con él en vez de escribirse a mano.
 *
 *  Queda inline como en `PlotGauge` y `PlotControl` —es el tercer lugar con el
 *  mismo `style`, que es lo que `axisReserve` documenta que costó caro—, pero
 *  extraer `core/MarkText.tsx` toca un archivo compartido. */
const NOMBRE = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 'normal',
  fill: 'var(--color-ink)',
} as const

/** La opacidad de cada hoja: su rango por área DENTRO de su columna.
 *
 *  Por área y no por posición en el arreglo, para que la regla siga valiendo
 *  cuando el cuerpo pide `orden: 'natural'` y la lista no viene ordenada. */
function opacityByRank(tiles: readonly Tile[]): number[] {
  const last = OPACIDAD[OPACIDAD.length - 1] ?? 1
  const out = tiles.map(() => last)
  const columns = new Map<number, number[]>()
  tiles.forEach((t, i) => {
    const column = columns.get(t.group)
    if (column === undefined) columns.set(t.group, [i])
    else column.push(i)
  })
  for (const column of columns.values()) {
    const byArea = [...column].sort(
      (a, b) => (tiles[b]?.w ?? 0) * (tiles[b]?.h ?? 0) - (tiles[a]?.w ?? 0) * (tiles[a]?.h ?? 0),
    )
    byArea.forEach((index, rank) => {
      out[index] = OPACIDAD[Math.min(rank, OPACIDAD.length - 1)] ?? last
    })
  }
  return out
}

export function PlotTreemap({ value, family, format }: PlotProps<'categorica'>) {
  const { ref, w, h } = useSize()

  // Una hoja sin área no se dibuja y sí consumiría un escalón de la rampa y un
  // `gap`. El contrato declara `v: number` sin mínimo, así que puede llegar.
  const items = value.items.filter((i) => Number.isFinite(i.v) && i.v > 0)
  const total = items.reduce((sum, i) => sum + i.v, 0)

  const box = { w: Math.max(0, w - PAD * 2), h: Math.max(0, h - PAD * 2) }
  const tiles = squarify(
    items.map((i) => i.v),
    box,
    GAP,
  )
  const opacity = opacityByRank(tiles)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          /* **Distinto del «N categorías» de `PlotBars` a propósito.** Los dos
             cuerpos hospedan la misma forma, así que sin nombres distintos
             ninguna prueba puede afirmar CUÁL de los dos se montó — y un
             despacho que cae al gráfico por defecto se ve perfecto. */
          aria-label={`${items.length} categorías en mosaico`}
        >
          <g transform={`translate(${PAD},${PAD})`}>
            {tiles.map((t, i) => {
              const item = items[i]
              if (item === undefined) return null
              const share = total > 0 ? (item.v / total) * 100 : 0
              const conNombre = t.w >= ROTULO_MIN_W && t.h >= NOMBRE_MIN_H
              const conCuota = conNombre && t.h >= CUOTA_MIN_H
              const cap = charsThatFit(t.w - ROTULO_DX * 2, 12)
              const name =
                item.etiqueta.length > cap ? `${item.etiqueta.slice(0, cap - 1)}…` : item.etiqueta
              return (
                <g key={`${item.etiqueta}-${i}`}>
                  <rect
                    x={t.x}
                    y={t.y}
                    width={t.w}
                    height={t.h}
                    rx={LEAF_RADIUS}
                    fill={hue({ family, step: RAMPA[t.group % RAMPA.length] ?? 1 })}
                    fillOpacity={opacity[i]}
                  />
                  {conNombre && (
                    <text
                      x={t.x + ROTULO_DX}
                      y={t.y + NOMBRE_DY}
                      dominantBaseline="middle"
                      style={NOMBRE}
                    >
                      {name}
                    </text>
                  )}
                  {/* Ningún número desnudo: la cuota es el contrato de label de
                      §2.3 —mono 10, 0.12em, `dim`— y por eso se compone con
                      `AxisText` en vez de escribirse a mano. */}
                  {conCuota && (
                    <AxisText x={t.x + ROTULO_DX} y={t.y + CUOTA_DY} anchor="start">
                      {`${format(Math.round(share))}%`}
                    </AxisText>
                  )}
                </g>
              )
            })}
          </g>
        </svg>
      )}
    </div>
  )
}
