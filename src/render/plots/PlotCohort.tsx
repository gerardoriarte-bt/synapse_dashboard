/** Cohortes · forma `matriz` · §PEN:Plot/COHORTES · Recompra por cohorte · 2026-10-01
 *
 *  **Es la misma rejilla que el mapa de calor con otra lectura, y las
 *  diferencias están TODAS medidas sobre el frame de 560 × 208 y sus 61 hijos.**
 *  Heredar los números del hermano se habría visto perfecto, que es la razón por
 *  la que cada uno se escribe acá con lo que lo fija:
 *
 *   · **La rampa son CINCO niveles, no ocho.** Los 20 rectángulos con valor usan
 *     exactamente cinco pares de (escalón, opacidad) —`fam-0 @ 0.5`, `fam-0 @
 *     0.6`, `fam-1 @ 0.6`, `fam-1 @ 0.7`, `fam-2 @ 0.7`— y ninguna opacidad
 *     fuera de {0.5, 0.6, 0.7}. Nunca escalón 3 ni 4.
 *   · **El `GAP` es 5, no 4.** Las columnas van en x = 62, 145, 228… con ancho
 *     78 —paso 83— y las filas en y = 22, 55, 88… con alto 28 —paso 33—.
 *   · **TODA celda presente lleva su cifra.** El mapa de calor rotula los dos
 *     niveles más calientes; acá las 20 presentes están rotuladas y las 10
 *     vacías no. Es la diferencia más grande entre los dos, y la que se vería
 *     bien estando mal.
 *   · **La cifra es mono 11 y SIN `letterSpacing`**: ninguno de los 20 nodos lo
 *     trae, donde el mapa de calor le pone 0.12em a la suya en mono 10.
 *   · **La tinta se invierte en el nivel más alto y SOLO ahí**: las 6 cifras de
 *     nivel 4 —46, 47, 48, 49, 51, 52— van en `$ink` y las 14 restantes en
 *     `$bg`. Medido celda por celda.
 *
 *  Lo que sí se comparte sale igual: `HEADER` pasa de 20 a **22** porque la
 *  primera celda arranca ahí, y la canaleta de filas da los MISMOS `LABEL_GAP`
 *  12 y `LABEL_MIN` 50 —el rótulo va en x = 6.2 con ancho 43.8 y `textAlign:
 *  right`, o sea termina en 50, y la celda arranca en 62—.
 *
 *  **LA ESCALERA ES DATO, NO UNA REGLA DE DIBUJO.** Las 10 celdas sin valor
 *  forman un triángulo inferior-derecho perfecto —MAR 6 cifras, ABR 5, MAY 4,
 *  JUN 3, JUL 2— porque una cohorte de julio todavía no tiene 180 días
 *  observados. Eso llega como `null` en el payload: acá **no se suprime ninguna
 *  celda por su posición**, y hay una prueba con los `null` FUERA del triángulo
 *  justo porque un fixture triangular no puede atrapar a un plot que lo da por
 *  hecho.
 *
 *  **Y la celda sin dato no se pinta**, que es la decisión que el contrato
 *  encabeza —«pintarla con el color más frío la muestra como el peor valor de la
 *  escala»—: contorno `$c-grid` de 1px y ningún `fill`, igual que
 *  `Plot/CALENDARIO` dibuja sus días sin cargar. **Pero acá NO va su leyenda.**
 *  `CONTORNO SIN RELLENO = SIN DATO CARGADO` sería falso: en una cohorte la
 *  celda vacía es el **futuro no observado**, no un feed sin cargar. El frame no
 *  trae ninguna leyenda y la escalera se explica sola, así que no se inventa.
 *  Queda abierto que un contorno signifique dos cosas distintas en dos gráficos
 *  de la misma forma — es una pregunta a diseño, no una rama.
 *
 *  **LOS CORTES DE LA RAMPA DEL FRAME SON A MANO Y NO SE REPRODUCEN.** La
 *  cuantización lineal acierta el ORDEN de las 20 celdas y los dos extremos, y
 *  falla en tres: el 24 cae en 0 donde el dibujo pinta 1, el 32 en 1 donde pinta
 *  2, el 39 en 3 donde pinta 2. Tampoco son quintiles por rango —los tramos del
 *  dibujo tienen 3, 3, 4, 3 y 6 celdas—. Se implementa lineal, que es lo único
 *  que un gráfico de cohortes promete: que el color sea monótono en el valor. Si
 *  diseño quiere el dibujo clavado tiene que declarar los cortes: propuesta de
 *  spec. **La prueba comprueba monotonía y extremos, no igualdad celda por
 *  celda**, y los 6 `$ink` salen igual porque el nivel 4 lineal coincide con los
 *  seis del dibujo.
 *
 *  **La escala se calcula sobre las celdas PRESENTES y con `[min, max]`**, igual
 *  que el mapa de calor y por la misma razón: el contrato no declara mínimo ni
 *  máximo para `matriz` y derivarlos de otro lado sería inventar el rango. Queda
 *  declarado que **exagera una cohorte plana** —una tabla que se mueve de 50 % a
 *  52 % se ve tan contrastada como una que va de 5 % a 50 %— y que anclar en
 *  cero haría lo contrario: aplanar la curva de retención, que es el punto del
 *  gráfico. La leyenda de extremos que lo resolvería —`MÍN 19% · MÁX 52%`— el
 *  `.pen` no la dibuja.
 *
 *  **LA UNIDAD NO ES DE ACÁ.** El frame rotula `22%` y el `%` no lo pone este
 *  plot: llega adentro del closure `format` que arma el cuerpo con la `unit` de
 *  la MÉTRICA, igual que en `CompositionBody` y `ForecastBody`. Si la métrica no
 *  declara unidad la cifra sale `22`, desnuda de símbolo, y eso es un hueco del
 *  catálogo — concatenar un `%` acá lo taparía y mentiría en toda métrica que no
 *  sea un porcentaje.
 *
 *  **DOS COSAS DEL FRAME NO SE COPIAN, y las dos están declaradas:** los **26 px
 *  muertos al pie** —182 es el borde de la última fila y el frame mide 208—,
 *  porque un plot llena su `rowSpan` y `96·N − 16` no admite aire sobrante; y la
 *  proporción **2,79:1** de la celda (78 × 28), que con el `colSpan` 6–12 y el
 *  `rowSpan` 5–7 que §6 le da a esta forma se acerca a 1:1. La caja real es más
 *  alta que el dibujo y no hay forma de conservar las dos cosas. Misma no-copia
 *  que el mapa de calor declara con sus 18 px y su 3:1.
 *
 *  **El dato del frame es MAQUETA.** `MAR…JUL × 30D…180D` con la escalera
 *  perfecta es mock: nada dice que la matriz real sea triangular, ni que las
 *  antigüedades o las cohortes lleguen ordenadas. Las filas y las columnas se
 *  dibujan **en el orden en que el contrato las manda** y acá no se ordena nada.
 *
 *  **El contraste de la cifra falla en los cuatro niveles pálidos, y el `.pen`
 *  lo dibuja así.** Medido componiendo sobre `panel` como hace `contraste.py`,
 *  contra el umbral de 4,5 · TEMA OSCURO: nivel 0 `$bg` **4,41**, nivel 1 5,74
 *  ✓, nivel 2 **3,44**, nivel 3 **4,20**, nivel 4 `$ink` 7,46 ✓ · TEMA CLARO:
 *  **1,42 · 1,58 · 2,30 · 2,69** y nivel 4 `$ink` **4,12**. En claro la tinta
 *  correcta sería la opuesta en los cuatro pálidos (10,70 / 9,67 / 6,62 / 5,67)
 *  y **no hay token «siempre oscuro»**: `on-acc` invierte igual y además es la
 *  tinta del acento, que no es color de datos. Se implementa como el frame lo
 *  dibuja y el par queda clavado en una aserción para que el día que diseño lo
 *  resuelva la prueba avise, exactamente como los 4,17 de `DegradedBadge`.
 *
 *  **Una familia de dos escalones colapsa la rampa y no avisa.** `FAMILY_STEPS`
 *  da 2 a `externo` y `familyVar` hace `step % largo`, así que con `externo` el
 *  nivel 4 —escalón 2— se pinta con el MISMO color que el nivel 0 —escalón 0— y
 *  sólo la opacidad los separa: 0.7 contra 0.5. Sigue siendo monótono y pierde
 *  la mitad de la señal. No es un defecto de este plot ni se arregla acá.
 *
 *  ── LAS PRIMITIVAS QUE FALTAN, Y POR QUÉ `levels` ESTÁ DUPLICADO ────────────
 *
 *  **`levels`, `rowReserve`, `padFor` y `recorte` tendrían que vivir en
 *  `core/matrix.ts`**, que es lo que la cabecera de `PlotHeatmap` ya declara —
 *  «y los cuatro gráficos de `matriz` las comparten»—. Este es el segundo de los
 *  cuatro, así que el faltante dejó de ser teórico: acá están **copiadas**, y
 *  eso es exactamente lo que `axisGeometry.ts` cuenta que ya costó una vez
 *  —`axisReserve` estaba escrita tres veces, dos con el defecto—. **No se
 *  importan de `PlotHeatmap`** porque eso ata un plot a otro, que el README de
 *  `plots/` prohíbe de hecho; y no se movieron porque mover toca
 *  `PlotHeatmap.tsx` y `tests/render/plots/mapaDeCalor.test.tsx`, dos archivos
 *  compartidos que esta tarea no puede escribir. **Queda anotado como lo
 *  primero a hacer cuando se pueda tocar `core/`**: hoy un arreglo en una copia
 *  no llega a la otra.
 *
 *  **La marca de celda tendría que ser `core/Cells.tsx`**, la quinta marca
 *  cartesiana —`Bars` tiene un solo eje de magnitud y `squarify` reparte por
 *  área—. Los dos plots de `matriz` repiten el mismo par `<rect rx fill
 *  fillOpacity>` / `fill:none stroke:c-grid` con su `<title>`. Es menos urgente
 *  que `matrix.ts` porque la regla de cifra difiere entre los dos —el mapa de
 *  calor rotula los dos niveles más calientes, la cohorte rotula TODAS las
 *  presentes, en mono 11 y con la tinta invertida arriba—, así que la marca
 *  necesitaría esas tres cosas por prop.
 *
 *  **Y los dos ejes se escriben a mano, los mismos dos huecos que el mapa de
 *  calor declaró y nadie llenó.** `AxisText` fija mono **10** en su `TYPOGRAPHY`
 *  y este frame rotula en mono **9**, y su `side` es `'left' | 'bottom'` cuando
 *  el eje de columnas va **arriba**. Pide un `size?: 9 | 10` con 10 por defecto
 *  y un `'top'` que rinda igual que `'bottom'` pero no mienta sobre dónde está.
 *  Mientras no se pueda tocar, acá se reproduce el mismo contrato tipográfico en
 *  `<text>`, que es la desviación que la cabecera de `Axis.tsx` ya declara para
 *  todo `render/plots/core/`.
 *
 *  **Y `bandScale` recibe el aire como FRACCIÓN del paso**, así que los cuatro
 *  gráficos de `matriz` traducen un gap en píxeles a mano. Un `gap?: number` en
 *  píxeles lo resolvería. No bloquea · anotado.
 */
import { MARGIN, charsThatFit, textWidth } from './core/axisGeometry'
import { bandScale } from './core/scale'
import { hue } from './core/seriesColor'
import { useSize } from './core/useSize'
import type { FamilyStep } from '../../tokens/tokens'
import type { PlotProps } from '../types'

/* ── Geometría, medida nodo por nodo sobre el frame de 560 × 208 ──────────── */

/** Entre celdas, en los dos ejes · **5, y es una diferencia MEDIDA contra el
 *  mapa de calor, que usa 4**: las columnas van en x = 62, 145, 228… con ancho
 *  78 —paso 83— y las filas en y = 22, 55, 88… con alto 28 —paso 33—. No se
 *  hereda del hermano. */
const GAP = 5

/** `cornerRadius: 2` en las 30. Es el `r-xs` de §2, el mismo número que
 *  `BAR_RADIUS` declara en `core/Series.tsx` como «el único lugar donde vive» —
 *  pero ahí está privado, y exportarlo toca un archivo compartido. */
const RADIO = 2

/** La banda de cabecera: la primera celda arranca en y = 22 y los rótulos de
 *  antigüedad viven ahí arriba. El mapa de calor usa 20. */
const HEADER = 22

/** Entre el rótulo de fila y la celda: el texto termina en x = 50 —va en 6.2 con
 *  ancho 43.8 y `textAlign: right`— y la celda arranca en 62. Idéntico al mapa
 *  de calor, así que `rowReserve` sirve tal cual. */
const LABEL_GAP = 12

/** Lo mínimo que se reserva para los rótulos de cohorte. El frame reservó de
 *  sobra: `MAR` en mono 9 mide 19,4 y la canaleta mide 62, así que el piso es lo
 *  que reproduce el dibujo con rótulos cortos. */
const LABEL_MIN = 50

/** **Y el techo NO sale del frame**, que sólo dibuja rótulos de tres letras: sin
 *  tope, un nombre de cohorte largo se come un tercio del panel. Se elige un
 *  tercio del ancho —el frame gasta 11 %—; lo que no entra se recorta con `…`.
 *  Divergencia declarada, la misma que el mapa de calor. */
const LABEL_MAX_SHARE = 1 / 3

/** Los once rótulos de los dos ejes: mono 9 con `letterSpacing: 1.08` sobre
 *  cuerpo 9, que es el mismo 0.12em de §2.3 — en `em` y no en px porque el mismo
 *  tracking aparece como 1.2 sobre un label de 10. */
const EJE_SIZE = 9

/** Las veinte cifras de celda: mono **11** —`--text-cifra`— y **sin tracking**.
 *  Las dos cosas están medidas: el mapa de calor usa mono 10 con 0.12em. */
const CIFRA_SIZE = 11

/** El centro vertical de los rótulos de antigüedad cae en y = 10.4, o sea 11,6
 *  por encima del borde superior de la primera fila, que está en 22. El mapa de
 *  calor mide 11. */
const AXIS_DY = 11.6

/** Una cifra mono 11 no entra en una celda de quince píxeles de alto, y el
 *  desborde es el que `PlotTreemap` declara no copiar. El frame le da 28 de alto
 *  a un bloque de texto de 17,6. */
const CIFRA_MIN_H = 15

/** El aire que la cifra necesita a los costados, además de su propio ancho. */
const CIFRA_PAD = 4

/** De nivel a `(escalón de familia, opacidad)`.
 *
 *  **Son los CINCO pares del frame, contados en sus 20 rectángulos con valor, y
 *  en el orden en que son monótonos en intensidad.** Los dos 0.6 y los dos 0.7
 *  se distinguen **por escalón**: sin eso la escalera se aplana en el medio, que
 *  es donde una cohorte tiene que decir más. Nunca escalón 3 ni 4 de la familia,
 *  y ninguna opacidad fuera de {0.5, 0.6, 0.7} — heredar los ocho niveles del
 *  mapa de calor habría pasado el lint y dibujado otra cosa. */
const RAMPA: readonly { step: FamilyStep; op: number }[] = [
  { step: 0, op: 0.5 },
  { step: 0, op: 0.6 },
  { step: 1, op: 0.6 },
  { step: 1, op: 0.7 },
  { step: 2, op: 0.7 },
]

/** Desde qué nivel la cifra se invierte a `$ink`: **sólo el más caliente**. Las
 *  6 celdas de nivel 4 del frame —46, 47, 48, 49, 51, 52— van en `$ink` y las 14
 *  restantes en `$bg`, medido celda por celda. Ver la cabecera: el par de
 *  contraste es una divergencia registrada, no un descuido. */
const INVIERTE_DESDE = RAMPA.length - 1

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

/** La cifra de celda · mono 11 y **sin `letterSpacing`**, que es lo que los 20
 *  nodos del frame traen. La tinta la pone cada celda según su nivel. */
const CIFRA = {
  fontFamily: 'var(--font-mono)',
  fontSize: CIFRA_SIZE,
} as const

/** El nivel de cada celda, o `null` donde no hay dato · aritmética pura.
 *
 *  **COPIA DECLARADA de `PlotHeatmap.levels`**, cuya casa es `core/matrix.ts` ·
 *  ver la cabecera. Vive afuera del componente por la misma razón que `squarify`:
 *  se prueba sin montar un SVG, y es donde puede estar el defecto que el dibujo
 *  no muestra — una cohorte se ve igual de prolija cuantizando bien y mal.
 *
 *  **El `Math.min(n - 1, …)` no es defensa decorativa.** Sin él el máximo da
 *  índice `n`, `RAMPA[n]` es `undefined` y la celda se pinta **sin color y sin
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
      // `null` es «el futuro no observado» y queda FUERA del rango: adentro, el
      // hueco se pinta como el peor valor de la escala y además corre todos los
      // demás niveles.
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

/** Cuánto ancho se lleva la columna de rótulos de cohorte.
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
 *  frame se traduce: `GAP / (largo / n)`.
 *
 *  **Con celdas más chicas que el `GAP` el tope evita un `bandwidth` negativo**,
 *  que hace desaparecer el `rect` del SVG sin ningún error. */
const padFor = (largo: number, n: number) =>
  largo <= 0 ? 0 : Math.min(0.9, (GAP * Math.max(1, n)) / largo)

/** El recortador de un eje, dado su tope de caracteres. **Es una fábrica y no
 *  una función de dos argumentos** para que no se pueda llamar con el tope del
 *  otro eje: el `cap` equivocado es el defecto que una mutación sobreviviente
 *  encontró en el mapa de calor el 2026-09-30. */
const recorte = (cap: number) => (s: string) => (s.length > cap ? `${s.slice(0, cap - 1)}…` : s)

export function PlotCohort({ value, family, format }: PlotProps<'matriz'>) {
  const { ref, w, h } = useSize()
  const { filas, columnas, celdas } = value

  const reserve = rowReserve(filas, w)
  const gridW = Math.max(0, w - reserve - MARGIN.r)
  const gridH = Math.max(0, h - HEADER - MARGIN.b)

  /* El rango se corre GAP/2 hacia atrás porque `bandScale` centra el aire dentro
     del paso: sin eso la primera celda arrancaría en 64,5 donde el frame la
     dibuja en 62, y la rejilla entera quedaría corrida media separación. Con el
     corrimiento, a 600 × 300 y con rótulos de tres letras salen exactamente los
     nodos del dibujo: canaleta 62, primera celda en x = 62 y primera fila en
     y = 22. */
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
  /* Cada eje se recorta contra SU PROPIO presupuesto: el de cohortes vive en la
     canaleta, el de antigüedades centrado en su celda. Usar un solo `cap` miente
     en las dos direcciones, y es el defecto que el mapa de calor arrastró hasta
     que una mutación sobrevivió. */
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
          /* **Distinguible a propósito.** Los cuatro gráficos de `matriz`
             hospedan la misma forma, y sin nombres distintos ninguna prueba
             puede afirmar CUÁL se montó — que es justo lo que se rompe cuando un
             despacho cae al gráfico por defecto del cuerpo. */
          aria-label={`${filas.length} × ${columnas.length} celdas en cohortes por antigüedad`}
        >
          {/* Arriba, una etiqueta de antigüedad por columna, centrada en su celda. */}
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

          {/* A la izquierda, una de cohorte por fila, alineada al final de la canaleta. */}
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
                 prolijo donde el contorno afirma «todavía no observado» cuando lo
                 que hay es una matriz rala. La guardia que lo declara es del
                 cuerpo, `MatrixBody`, y corre ANTES del despacho porque es del
                 payload y no del gráfico. */
              if (v === undefined) return null

              const nv = nivel[r]?.[c] ?? null
              const paso = nv === null ? undefined : RAMPA[nv]
              const x = col(columna)
              const y = row(fila)
              /* La cifra llega FORMATEADA desde el cuerpo, con la unidad de la
                 métrica adentro del closure: el frame rotula `22%` y ese `%` no
                 es de acá. Ver la cabecera. */
              const cifra = v === null ? null : format(v)
              /* **TODA celda presente la lleva** —las 20 del frame—, a diferencia
                 del mapa de calor, que rotula sólo los dos niveles más calientes.
                 Lo único que la quita es que no entre. */
              const conCifra =
                cifra !== null &&
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
                        // relleno, igual que `Plot/CALENDARIO`. Sin leyenda: acá
                        // significa el futuro no observado, no un feed sin cargar.
                        { fill: 'none', stroke: 'var(--color-c-grid)', strokeWidth: 1 }
                      : { fill: hue({ family, step: paso.step }), fillOpacity: paso.op })}
                  >
                    {/* Ningún número desnudo, tampoco para un lector de
                        pantalla: la celda se entiende a la vista por su cohorte y
                        su antigüedad, y suelta en el árbol de accesibilidad no
                        dice nada. La cifra va FORMATEADA — el crudo trae el
                        locale de `toString`, que no es el del tenant. */}
                    <title>{`${fila} · ${columna} · ${cifra ?? 'sin dato'}`}</title>
                  </rect>
                  {conCifra && (
                    <text
                      x={x + col.bandwidth / 2}
                      y={y + row.bandwidth / 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        ...CIFRA,
                        // La tinta se invierte SOLO en el nivel más caliente ·
                        // divergencia de contraste registrada en la cabecera.
                        fill:
                          nv !== null && nv >= INVIERTE_DESDE
                            ? 'var(--color-ink)'
                            : 'var(--color-bg)',
                      }}
                    >
                      {cifra}
                    </text>
                  )}
                </g>
              )
            }),
          )}
        </svg>
      )}
    </div>
  )
}
