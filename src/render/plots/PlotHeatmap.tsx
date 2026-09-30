/** Mapa de calor · forma `matriz` · §PEN:Plot/MAPA DE CALOR · Venta por día y hora · 2026-09-30
 *
 *  **Lo único que un mapa de calor promete es que el COLOR es monótono en el
 *  valor**, y de ahí salen las dos decisiones que importan. La primera: la
 *  cuantización es aritmética pura, así que vive en `levels()` y se prueba sin
 *  montar un SVG — un tablero se ve igual de prolijo cuantizando por `sqrt(v)`,
 *  anclando en cero o en ocho tramos iguales, y el ojo no distingue los cuatro.
 *  La segunda: **una celda sin dato no se pinta**, y eso no es una preferencia.
 *  El contrato lo dice con estas palabras —«pintarla con el color más frío la
 *  muestra como el peor valor de la escala, y una hora sin ventas registradas no
 *  es una hora con cero ventas»— y el `.pen` responde CÓMO se ve:
 *  `Plot/CALENDARIO · Actividad diaria`, misma página y misma forma, dibuja sus
 *  tres días sin dato como `stroke: $c-grid` de 1px **sin `fill`**, y lo rotula
 *  con su propio literal: `CONTORNO SIN RELLENO = DÍA SIN DATO CARGADO`.
 *
 *  **LA RAMPA SON OCHO NIVELES, CONTADOS EN EL FRAME.** Los 49 rectángulos usan
 *  exactamente ocho combinaciones de escalón de familia y opacidad y no más, y
 *  las dos de 0.8 se distinguen **por escalón** —`$fam-demanda-1` en `r12`,
 *  `$fam-demanda-2` en `r5`—: es la única razón por la que la escalera no se
 *  aplana en el medio. La columna `06 H` es siempre escalón 0 y la `21 H`
 *  siempre 2, que es la lectura que el dibujo quiere: la hora muerta pálida, la
 *  hora pico profunda.
 *
 *  **La escala se calcula sobre las celdas PRESENTES y con `[min, max]`.** El
 *  contrato no declara mínimo ni máximo —«porque el backend no los manda y
 *  derivarlos de otro lado sería inventar el rango»—, y `[min, max]` es lo que
 *  el frame muestra: su celda más fría es la más pálida. Queda declarado que
 *  **exagera una matriz plana** —una que varía 1 % se ve tan contrastada como
 *  una que varía diez veces— y que anclar en cero haría lo contrario, aplanar el
 *  dibujo y borrar la diferencia entre `06 H` y `21 H` que es el punto del
 *  gráfico. La leyenda de extremos que lo resolvería —`MÍN 12K · MÁX 34K`— el
 *  `.pen` no la dibuja, así que va como propuesta de spec y no se inventa acá.
 *
 *  **El frame es una maqueta de 560 × 216 y hay dos cosas que no se copian**,
 *  las dos declaradas: los 18px muertos al pie —un plot llena su `rowSpan`,
 *  porque `96·N − 16` no admite aire sobrante— y la proporción 3:1 de la celda,
 *  que en un panel de `rowSpan` 5 pasa a ~1:1. §6 le da a `matrix` `colSpan`
 *  6–12 y `rowSpan` 5–7: la caja real es más alta que la del dibujo y no hay
 *  forma de conservar las dos cosas.
 *
 *  **Lo que sí sale clavado es el eje horizontal**, y conviene decir hasta dónde:
 *  a 560 de ancho este código devuelve celdas de 66 en x = 62, 132, 202…, que
 *  son los nodos medidos. **El vertical NO**, y no por un error de cuenta: a 216
 *  de alto la primera fila arranca en y = 20 como el frame, con paso 25,1 donde
 *  el frame usa 26. La diferencia son 6px repartidos entre las siete filas —el
 *  pie se lleva `MARGIN.b` más la separación de cola, 24, donde el frame deja
 *  18—, que es la misma decisión de arriba vista desde el otro lado.
 *
 *  **Una familia de dos escalones colapsa la rampa y no avisa.** `FAMILY_STEPS`
 *  da 2 a `externo` y `familyVar` hace `step % largo`, así que con `externo` los
 *  tres niveles más calientes se pintan con el MISMO color que los dos más fríos
 *  y sólo la opacidad los separa. Sigue siendo monótono y pierde la mitad de la
 *  señal; no es un defecto de este plot ni se arregla acá, se declara.
 *
 *  **La cifra en `$bg` sobre celda caliente FALLA WCAG en tema oscuro**, medido
 *  con la composición de `contraste.py`: 3,23:1 a opacidad 1 y 2,82:1 a 0.9,
 *  contra el umbral de 4,5; `$ink` sobre ese mismo par da 4,94. En tema claro se
 *  invierte —`$bg` 6,64 y `$ink` 2,30—, y no hay token «siempre claro»:
 *  `on-acc` invierte igual y además es la tinta del acento, que no es color de
 *  datos. **Se implementa como el frame lo dibuja** y queda pendiente de diseño,
 *  exactamente como los 4,17 de `DegradedBadge`, con el par clavado en una
 *  aserción para que el día que se resuelva la prueba avise.
 *
 *  **Faltan dos primitivas y una no se puede crear desde acá.** `levels()`
 *  debería vivir en `core/matrix.ts` y la marca de celda en `core/Cells.tsx`
 *  —sería la quinta marca, porque `Bars` tiene un solo eje de magnitud y
 *  `squarify` reparte por área—, y los cuatro gráficos de `matriz` las
 *  comparten. Están acá porque crear archivos de `core/` quedó fuera del alcance
 *  de esta tarea, igual que `squarify` vive todavía en `PlotTreemap`.
 *
 *  **Y los dos ejes se escriben a mano por lo mismo.** `CategoryAxis` sirve para
 *  los dos, pero `AxisText` fija mono 10 en su `TYPOGRAPHY` y este frame rotula
 *  en **mono 9** —el tamaño de nota de §2.3—, y su `side` es `'left' | 'bottom'`
 *  cuando acá el eje de columnas va **arriba**. Son dos faltantes de la
 *  primitiva, no una excepción de este plot: pide un `size?: 9 | 10` con 10 por
 *  defecto y un `'top'` que rinda igual que `'bottom'` pero no mienta sobre
 *  dónde está. Mientras eso no se pueda tocar, acá se reproduce el mismo
 *  contrato tipográfico en `<text>`, que es la desviación que la cabecera de
 *  `Axis.tsx` ya declara para todo `render/plots/core/`.
 */
import { MARGIN, charsThatFit, textWidth } from './core/axisGeometry'
import { bandScale } from './core/scale'
import { hue } from './core/seriesColor'
import { useSize } from './core/useSize'
import type { FamilyStep } from '../../tokens/tokens'
import type { PlotProps } from '../types'

/* ── Geometría, medida nodo por nodo sobre el frame de 560 × 216 ──────────── */

/** Entre celdas, en los dos ejes: las columnas van en x = 62, 132, 202… con
 *  ancho 66 —paso 70— y las filas en y = 20, 46, 72… con alto 22 —paso 26—. */
const GAP = 4

/** `cornerRadius: 2` en las 49. Es el `r-xs` de §2, el mismo número que
 *  `BAR_RADIUS` declara en `core/Series.tsx` como «el único lugar donde vive» —
 *  pero ahí está privado, y exportarlo toca un archivo compartido. */
const RADIO = 2

/** La banda de cabecera: la primera celda arranca en y = 20 y los rótulos de
 *  hora viven ahí arriba. */
const HEADER = 20

/** Entre el rótulo de fila y la celda: el texto termina en x = 50 —va en 6.2 con
 *  ancho 43.8 y `textAlign: right`— y la celda arranca en 62. */
const LABEL_GAP = 12

/** Lo mínimo que se reserva para los rótulos de fila. El frame reservó de sobra:
 *  `LUN` en mono 9 mide 19,4 y la canaleta mide 62, así que el piso es lo que
 *  reproduce el dibujo con rótulos cortos. */
const LABEL_MIN = 50

/** **Y el techo NO sale del frame**, que sólo dibuja rótulos de tres letras: sin
 *  tope, veinte caracteres se comen un tercio del panel y con cuarenta la
 *  rejilla desaparece. Se elige un tercio del ancho —el frame gasta 11 %— porque
 *  por debajo de dos tercios las celdas dejan de ser celdas. Divergencia
 *  declarada; lo que no entra se recorta con `…`. */
const LABEL_MAX_SHARE = 1 / 3

/** Los catorce rótulos de eje: mono 9 con `letterSpacing: 1.08` sobre cuerpo 9,
 *  que es el mismo 0.12em de §2.3 — en `em` y no en px porque el mismo tracking
 *  aparece como 1.2 sobre las cifras de 10. */
const EJE_SIZE = 9

/** Las nueve cifras de celda: mono 10 con `letterSpacing: 1.2`, `fill: $bg`. */
const CIFRA_SIZE = 10

/** El centro vertical de los rótulos de hora cae en y ≈ 8.7, o sea 11 por
 *  encima del borde superior de la primera fila. */
const AXIS_DY = 11

/** Una cifra mono 10 no entra en una celda de veinte píxeles de alto, y el
 *  desborde es el que `PlotTreemap` declara no copiar. */
const CIFRA_MIN_H = 14

/** El aire que la cifra necesita a los costados, además de su propio ancho. */
const CIFRA_PAD = 4

/** De nivel a `(escalón de familia, opacidad)`.
 *
 *  **Son las ocho combinaciones del frame y en el orden en que son monótonas en
 *  intensidad.** El `step` es lo que distingue los dos 0.8: sin él la escalera
 *  se aplana justo en el medio, que es donde un mapa de calor tiene que decir
 *  más. La casa de esto es `core/Cells.tsx` —los cuatro gráficos de `matriz` la
 *  comparten— y por eso queda en una constante y no repartida en el JSX. */
const RAMPA: readonly { step: FamilyStep; op: number }[] = [
  { step: 0, op: 0.4 },
  { step: 0, op: 0.5 },
  { step: 1, op: 0.6 },
  { step: 1, op: 0.7 },
  { step: 1, op: 0.8 },
  { step: 2, op: 0.8 },
  { step: 2, op: 0.9 },
  { step: 2, op: 1 },
]

/** Desde qué nivel se imprime la cifra dentro de la celda: los DOS más
 *  calientes, que es lo que el frame rotula. */
const CIFRA_DESDE = RAMPA.length - 2

/** El contrato tipográfico de los rótulos de eje · mono 9, 0.12em, `dim`.
 *
 *  No es `AxisText` porque ese fija mono 10, y no es `<Label>` porque dentro de
 *  un `<svg>` no hay HTML. Es la misma regla por otro medio. */
const EJE = {
  fontFamily: 'var(--font-mono)',
  fontSize: EJE_SIZE,
  letterSpacing: '0.12em',
  fill: 'var(--color-dim)',
} as const

/** La cifra de celda · mono 10, 0.12em, `$bg`. Ver la cabecera: este par de
 *  contraste es una divergencia registrada, no un descuido. */
const CIFRA = {
  fontFamily: 'var(--font-mono)',
  fontSize: CIFRA_SIZE,
  letterSpacing: '0.12em',
  fill: 'var(--color-bg)',
} as const

/** El literal de la leyenda · DERIVADO del frame hermano `Plot/CALENDARIO`, que
 *  escribe `CONTORNO SIN RELLENO = DÍA SIN DATO CARGADO`. Acá «DÍA» no aplica
 *  —la celda es una hora de un día— así que se cae el sustantivo y nada más.
 *  Queda para que diseño lo confirme: el `.pen` manda en el literal de UI y esta
 *  variante no está dibujada. Lo que NO es derivado es el tratamiento visual. */
const LEYENDA_VACIA = 'CONTORNO SIN RELLENO = SIN DATO CARGADO'

/** El nivel de cada celda, o `null` donde no hay dato · aritmética pura.
 *
 *  Vive afuera del componente por la misma razón que `squarify`: se prueba sin
 *  montar un SVG, y es donde puede estar el defecto que el dibujo no muestra.
 *
 *  **El `Math.min(n - 1, …)` no es defensa decorativa.** Sin él el máximo da
 *  índice `n` , `RAMPA[n]` es `undefined` y la celda se pinta **sin color y sin
 *  error**, que es el modo de falla que `familyVar` ya documenta.
 *
 *  **Con `max === min` nadie es el más caliente y nadie el más frío**: todas las
 *  presentes van al nivel MEDIO, porque mandarlas a un extremo afirma un piso o
 *  un techo que el dato no tiene. Y sin esa rama la división por `max - min` da
 *  `NaN` y una celda sin opacidad.
 */
export function levels(
  celdas: readonly (readonly (number | null)[])[],
  n: number,
): (number | null)[][] {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  let presentes = 0
  for (const fila of celdas) {
    for (const v of fila) {
      // `null` es «nunca» y queda FUERA del rango: adentro, el hueco se pinta
      // como el peor valor de la escala y además corre todos los demás niveles.
      if (v === null || !Number.isFinite(v)) continue
      presentes += 1
      if (v < min) min = v
      if (v > max) max = v
    }
  }

  const medio = Math.floor((n - 1) / 2)
  return celdas.map((fila) =>
    fila.map((v) => {
      if (v === null || !Number.isFinite(v)) return null
      if (presentes === 0 || max === min) return medio
      return Math.min(n - 1, Math.floor(((v - min) / (max - min)) * n))
    }),
  )
}

/** Cuánto ancho se lleva la columna de rótulos de fila.
 *
 *  Sale del rótulo MÁS LARGO —igual que `axisReserve`, y por la misma razón que
 *  ahí está escrita: calculado sobre otro, el eje se sale por la izquierda— con
 *  el piso del frame y el techo declarado arriba. */
function rowReserve(filas: readonly string[], w: number): number {
  const masLargo = Math.max(0, ...filas.map((f) => f.length))
  const pedido = Math.max(LABEL_MIN, textWidth(masLargo, EJE_SIZE)) + LABEL_GAP
  return Math.min(pedido, Math.max(LABEL_MIN + LABEL_GAP, w * LABEL_MAX_SHARE))
}

/** El `padding` de `bandScale` que produce una separación de `GAP` píxeles.
 *
 *  `bandScale` recibe el aire como FRACCIÓN del paso, así que el absoluto del
 *  frame se traduce: `GAP / (largo / n)`. Queda anotado que un `gap` en píxeles
 *  sería más directo —lo quieren los cuatro gráficos de `matriz`— pero no hace
 *  falta tocar la primitiva para esto.
 *
 *  **Con celdas más chicas que el `GAP` el tope evita un `bandwidth` negativo**,
 *  que hace desaparecer el `rect` del SVG sin ningún error. */
const padFor = (largo: number, n: number) =>
  largo <= 0 ? 0 : Math.min(0.9, (GAP * Math.max(1, n)) / largo)

/** El recortador de un eje, dado su tope de caracteres. **Es una fábrica y no
 *  una función de dos argumentos** para que no se pueda llamar con el tope del
 *  otro eje: el `cap` equivocado es exactamente el defecto que esto reemplaza. */
const recorte = (cap: number) => (s: string) => (s.length > cap ? `${s.slice(0, cap - 1)}…` : s)

export function PlotHeatmap({ value, family, format }: PlotProps<'matriz'>) {
  const { ref, w, h } = useSize()
  const { filas, columnas, celdas } = value

  const reserve = rowReserve(filas, w)
  const gridW = Math.max(0, w - reserve - MARGIN.r)
  const gridH = Math.max(0, h - HEADER - MARGIN.b)

  /* El rango se corre GAP/2 hacia atrás porque `bandScale` centra el aire dentro
     del paso: sin eso la primera celda arrancaría en 64 donde el frame la dibuja
     en 62, y la rejilla entera quedaría corrida media separación. Con el corrimiento,
     al tamaño del frame salen exactamente sus nodos. */
  const col = bandScale(
    columnas,
    [reserve - GAP / 2, reserve + gridW - GAP / 2],
    padFor(gridW, columnas.length),
  )
  const row = bandScale(
    filas,
    [HEADER - GAP / 2, HEADER + gridH - GAP / 2],
    padFor(gridH, filas.length),
  )

  const nivel = levels(celdas, RAMPA.length)
  const hayVacias = celdas.some((fila) => fila.some((v) => v === null))
  /* **Cada eje se recorta contra SU PROPIO presupuesto, y hasta el 2026-09-30
     los dos usaban el de las filas.** Había un solo `cap`, sacado de la canaleta
     de rótulos de FILA, y con él se recortaba también el eje de COLUMNAS —que no
     vive en la canaleta sino centrado en su celda—. Miente en las dos
     direcciones, y las dos se midieron: con filas de 30 caracteres la canaleta
     sale 200, el tope sube a 29 y los rótulos de columna pasan enteros con 149px
     sobre celdas de 52, solapando casi tres; con filas cortas la canaleta son 62
     y un rótulo de columna se recorta a siete caracteres aunque su celda mida
     261. Lo encontró una mutación que SOBREVIVIÓ: ningún fixture tenía las dos
     longitudes desacopladas, así que el error no podía salir. */
  const recortarFila = recorte(charsThatFit(reserve - LABEL_GAP, EJE_SIZE))
  const recortarColumna = recorte(charsThatFit(col.bandwidth, EJE_SIZE))

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          /* **Distinguible a propósito**, como el «N categorías en mosaico» del
             treemap: los cuatro gráficos de `matriz` hospedan la misma forma, y
             sin nombres distintos ninguna prueba puede afirmar CUÁL se montó —
             que es justo lo que se rompe cuando un despacho cae al gráfico por
             defecto. */
          aria-label={`${filas.length} × ${columnas.length} celdas en mapa de calor`}
        >
          {/* Arriba, una etiqueta por columna, centrada en su celda. */}
          <g aria-hidden>
            {columnas.map((columna, c) => (
              <text
                key={`c${c}`}
                x={col(columna) + col.bandwidth / 2}
                y={HEADER - AXIS_DY}
                textAnchor="middle"
                dominantBaseline="middle"
                style={EJE}
              >
                {recortarColumna(columna).toUpperCase()}
              </text>
            ))}
          </g>

          {/* A la izquierda, una por fila, alineada a la derecha de la canaleta. */}
          <g aria-hidden>
            {filas.map((fila, r) => (
              <text
                key={`f${r}`}
                x={reserve - LABEL_GAP}
                y={row(fila) + row.bandwidth / 2}
                textAnchor="end"
                dominantBaseline="middle"
                style={EJE}
              >
                {recortarFila(fila).toUpperCase()}
              </text>
            ))}
          </g>

          {filas.map((fila, r) =>
            columnas.map((columna, c) => {
              const v = celdas[r]?.[c]
              /* **Un hueco de PAYLOAD no es una celda sin dato**, y por eso acá
                 no se dibuja nada: `celdas[r]?.[c] ?? null` pintaría un tablero
                 prolijo donde el contorno afirma «no hay dato cargado» cuando lo
                 que hay es una matriz rala. La guardia que lo declara es del
                 cuerpo —`MatrixBody`, que todavía no existe— y está anotada como
                 pendiente. */
              if (v === undefined) return null

              const nv = nivel[r]?.[c] ?? null
              const paso = nv === null ? undefined : RAMPA[nv]
              const x = col(columna)
              const y = row(fila)
              const cifra = v === null ? null : format(v)
              const conCifra =
                cifra !== null &&
                nv !== null &&
                nv >= CIFRA_DESDE &&
                col.bandwidth >= textWidth(cifra.length, CIFRA_SIZE) + CIFRA_PAD &&
                row.bandwidth >= CIFRA_MIN_H

              return (
                <g key={`${r}-${c}`}>
                  <rect
                    x={x}
                    y={y}
                    width={col.bandwidth}
                    height={row.bandwidth}
                    rx={RADIO}
                    {...(paso === undefined
                      ? // La celda sin dato: contorno `$c-grid` de 1px y ningún
                        // relleno, que es lo que dibuja `Plot/CALENDARIO`.
                        { fill: 'none', stroke: 'var(--color-c-grid)', strokeWidth: 1 }
                      : { fill: hue({ family, step: paso.step }), fillOpacity: paso.op })}
                  >
                    {/* Ningún número desnudo, tampoco para un lector de
                        pantalla: la celda se entiende a la vista por su fila y su
                        columna, y suelta en el árbol de accesibilidad no dice
                        nada. La cifra va FORMATEADA — el crudo trae el locale de
                        `toString`, que no es el del tenant. */}
                    <title>{`${fila} · ${columna} · ${cifra ?? 'sin dato'}`}</title>
                  </rect>
                  {conCifra && (
                    <text
                      x={x + col.bandwidth / 2}
                      y={y + row.bandwidth / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={CIFRA}
                    >
                      {cifra}
                    </text>
                  )}
                </g>
              )
            }),
          )}

          {/* Un hueco que nadie explica se lee como un defecto de render, así que
              la leyenda aparece sólo cuando hay al menos una celda sin dato. */}
          {hayVacias && (
            <text
              x={reserve}
              y={h - MARGIN.b / 2}
              textAnchor="start"
              dominantBaseline="middle"
              style={EJE}
            >
              {LEYENDA_VACIA}
            </text>
          )}
        </svg>
      )}
    </div>
  )
}
