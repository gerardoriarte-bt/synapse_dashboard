/** Calendario de actividad · forma `matriz` · §PEN:Plot/CALENDARIO · Actividad diaria · 2026-10-01
 *
 *  **Es la misma rejilla que el mapa de calor y NO es el mismo gráfico**, y la
 *  diferencia se lee en el frame antes que en cualquier spec: 340 × 232, 84
 *  rectángulos de 20 × 20 y **doce textos, ninguno dentro de una celda** —7 días
 *  + 4 semanas + 1 leyenda, contados sobre los nodos `t85`–`t96` del frame. La
 *  especificación dice trece y está mal; esta cabecera la había transcripto en
 *  vez de leerla, que es la clase exacta que «nada se escribe de memoria»
 *  persigue, en el único lugar del archivo que nadie verifica. Lo encontró el QA
 *  contándolos a mano. El
 *  mapa de calor imprime la cifra en sus dos niveles más calientes; acá el valor
 *  no se ve, se lee —va en el `<title>`—, y eso no es una omisión: un calendario
 *  dice *cuándo* pasó algo, y 84 cifras de doce semanas no se comparan de a
 *  pares. Si esto reprodujera la rama `conCifra` del hermano sería un mapa de
 *  calor con otro `aria-label`.
 *
 *  **Las otras dos diferencias estructurales también salen medidas del frame:**
 *
 *  1. **El eje de semanas va ABAJO.** Sus cuatro textos —`S21`, `S24`, `S27`,
 *     `S30`— tienen el centro vertical en y = 200.9, o sea 15 por debajo del
 *     borde inferior de la rejilla (186). El del mapa de calor va arriba, en una
 *     banda de cabecera. Acá arriba no hay nada: el frame deja 22px de aire
 *     muerto que **no se copian**, porque un plot llena su `rowSpan` y
 *     `96·N − 16` no admite sobrante. El techo es `MARGIN.t`, y el costo medido
 *     es que a 232 de alto el paso de fila sale 25,43 donde el frame usa 24. Es
 *     la misma decisión que el heatmap tomó con sus 18px al pie, tomada en el
 *     otro extremo del dibujo.
 *  2. **La canaleta de rótulos mide 46 y no 62.** El texto de día va en x = 1.4
 *     con ancho 30.6 y `textAlign: right`, así que termina en x = 32, y la
 *     primera celda arranca en 46: son `LABEL_MIN = 32` y `LABEL_GAP = 14`,
 *     distintos de los 50 y 12 del heatmap porque éste rotula con UNA letra y
 *     aquél con tres. Copiar los del hermano corre la rejilla entera 18px.
 *
 *  **LA RAMPA SON SIETE NIVELES, CONTADOS EN EL FRAME, Y EL SIETE ES DERIVADO.**
 *  Las 81 celdas pintadas usan exactamente siete pares de escalón y opacidad:
 *  `(0, 0.5) (1, 0.6) (1, 0.7) (1, 0.8) (2, 0.8) (2, 0.9) (2, 1)`. El heatmap
 *  tiene ocho porque su frame incluye además `(0, 0.4)`; acá la celda más pálida
 *  es `(0, 0.5)`. Y como `levels()` manda siempre el mínimo al índice 0, **el
 *  largo de la rampa queda forzado por qué par aparece en el extremo frío**: con
 *  ocho niveles el mínimo se pintaría a 0.4, que este frame no dibuja nunca. O
 *  sea que la rampa de acá es la del heatmap sin su primer escalón, y eso se
 *  midió, no se eligió.
 *
 *  **Y el calendario NO SABE QUÉ DÍA ES NINGUNA CELDA.** `ValorMatriz` trae
 *  `filas`, `columnas` y `celdas`: etiquetas de texto ya redactadas por quien
 *  produjo el dato, sin fechas ISO, sin número de semana y sin año. De ahí sale
 *  que no se dibuje **nada de lo que un calendario suele dibujar** —el corte de
 *  mes, el borde del año, el día de hoy, el feriado—: no se puede derivar de un
 *  dato que no llega. Las dos `M` de martes y miércoles son ambiguas **y así
 *  está dibujado**; arreglarlo pide un campo nuevo en el contrato, no una
 *  derivación del front. Por la misma razón los siete rótulos se pintan tal como
 *  llegan, en mayúsculas, y el plot no inventa nombres de día.
 *
 *  **El raleado del eje tiene PISO 3 y el 3 no se deriva del ancho.** A 24 de
 *  paso, `S21` mide 19,44 en mono 9 y el criterio del ancho —el de
 *  `PlotColumns`— daría `every = 2`, o sea seis rótulos; el frame dibuja cuatro.
 *  Así que el piso está medido en el dibujo —y tiene precedente: `PlotCombo` usa
 *  un `EVERY` fijo de 3 con la razón escrita de que hacen falta «tres pasos de
 *  aire, no uno»— y el término del ancho sólo lo puede SUBIR. Las dos mitades
 *  hacen falta: sin el piso, al tamaño del frame salen seis rótulos; sin el
 *  ancho, un rótulo de once caracteres se solapa con su vecino.
 *
 *  **La leyenda se centra y el frame no la centra**, y conviene decirlo porque es
 *  la única divergencia elegida. Va en x = 24.4 de 340, que no coincide con la
 *  rejilla (46), ni con la columna de rótulos (1.4), ni con el centro óptico
 *  —su corrida de 43 caracteres mide 278,6 y centrarla daría 30,7—. Centrada es
 *  la única regla que degrada parejo cuando el panel se angosta siendo el literal
 *  de largo fijo; la divergencia es de 6,3px al tamaño del frame. Y tiene un
 *  piso: por debajo de ~287px de ancho útil el literal no entra.
 *
 *  **La celda cuadrada tampoco se conserva, y acá pesa más que en un mapa de
 *  calor.** El frame dibuja 20 × 20; §6 le da a `matriz` `colSpan` 6–12 y
 *  `rowSpan` 5–7, así que en un panel de colSpan 8 × rowSpan 5 las celdas salen
 *  ~70 × 55. No se fuerza el cuadrado porque centrar la rejilla y dejar aire a
 *  los costados es una regla que el dibujo no declara. **Es propuesta de spec**:
 *  en un calendario el cuadrado es convención y no decoración, pero si diseño lo
 *  quiere hay que decir adónde va el aire.
 *
 *  **La escala es `[min, max]` sobre las presentes y exagera un mes plano.** El
 *  contrato no declara mínimo ni máximo, y `[min, max]` es lo que el frame
 *  muestra: su celda más fría es la más pálida. Un mes que varía 1 % se ve tan
 *  contrastado como uno que varía diez veces; anclar en cero haría lo contrario,
 *  aplanar el dibujo. La leyenda de extremos que lo resolvería —`MÍN 12K · MÁX
 *  34K`— el `.pen` no la dibuja. Y con dato real la cuantización LINEAL deja casi
 *  todo en el primer escalón: la matriz de paid media va de 0,04 a 9.099.434 en
 *  la misma rejilla. El `layout_param` `scale` sería el que decide lineal contra
 *  logarítmica, pero `levels()` sólo sabe lineal, así que el param queda
 *  **desconocido con aviso** — leerlo sin que el plot sepa cambiarlo sería
 *  declararlo válido para que no haga nada. Las dos son propuestas de spec.
 *
 *  **Una familia de dos escalones colapsa la rampa y no avisa.** `FAMILY_STEPS`
 *  da 2 a `externo` y `familyVar` hace `step % largo`, así que con `externo` los
 *  tres niveles más calientes se pintan con el MISMO color que los más fríos y
 *  sólo la opacidad los separa. Sigue siendo monótono y pierde la mitad de la
 *  señal; con 84 celdas y sin cifras se nota MÁS que en el heatmap, que al menos
 *  imprime la cifra de las dos más calientes. No es un defecto de este plot ni se
 *  arregla acá, se declara.
 *
 *  **FALTAN TRES PRIMITIVAS Y NINGUNA SE PUEDE CREAR DESDE ACÁ**, así que lo que
 *  se hizo fue no duplicar lo único que ya existe:
 *
 *  - `core/matrix.ts` con `levels()`, `RAMPA`, `GAP`, `RADIO`, `padFor()` y
 *    `rowReserve()`. Con un SEGUNDO gráfico de `matriz` la razón del heatmap
 *    —«crear archivos de `core/` quedó fuera del alcance»— se vence: copiarlas
 *    pondría la rampa en dos archivos y el día que diseño mueva un escalón uno
 *    de los dos queda viejo sin que nada avise. **Mientras el archivo no exista,
 *    `levels()` se IMPORTA de `PlotHeatmap` en vez de copiarse** —es la única de
 *    las seis que ya está exportada— y las otras se declaran acá con sus números
 *    medidos en ESTE frame, que son distintos. Que un plot importe de otro es la
 *    deuda, no la solución: cuando `core/matrix.ts` exista, las dos se reapuntan.
 *  - `core/Cells.tsx` con la marca de celda: `rect` con `rx`, el par
 *    `(fill, fillOpacity)` cuando hay nivel, el `fill: none` + `stroke` de 1px
 *    cuando no, y su `<title>`. Sería la quinta marca —`Bars` tiene un solo eje
 *    de magnitud y `squarify` reparte por área— y la comparten los cuatro
 *    gráficos de `matriz`. Acá va inline, igual que en el heatmap; lo que no se
 *    admite es escribirla dos veces sin decirlo.
 *  - En `core/Axis.tsx`, y ya son tres faltantes acumuladas: (a) `AxisText` fija
 *    mono 10 en su `TYPOGRAPHY` y este frame rotula en mono **9**, el tamaño de
 *    nota de §2.3 → pide un `size?: 9 | 10` con 10 por defecto; (b) el `side:
 *    'bottom'` de `CategoryAxis` sí sirve acá, por primera vez entre los dos
 *    gráficos de `matriz`; pero (c) **le falta `every`**, el raleado, que
 *    `PlotColumns` resuelve con su `narrowed()` local y `PlotCombo` con un
 *    `EVERY` fijo. Con el calendario son TRES llamadores que ralean a mano.
 *    Mientras no se pueda tocar, acá se reproduce el mismo contrato tipográfico
 *    en `<text>` —la desviación que la cabecera de `core/Axis.tsx` ya declara
 *    para todo `render/plots/core/`— y se ralea con el idioma de `PlotColumns`.
 *
 *  **No se usa `core/Grid`**: un calendario no lleva rejilla de fondo porque las
 *  celdas SON la rejilla, y el frame no dibuja ni una línea.
 */
import { MARGIN, charsThatFit, textWidth } from './core/axisGeometry'
import { bandScale } from './core/scale'
import { hue } from './core/seriesColor'
import { useSize } from './core/useSize'
import { levels } from './PlotHeatmap'
import type { FamilyStep } from '../../tokens/tokens'
import type { PlotProps } from '../types'

/* ── Geometría, medida nodo por nodo sobre el frame de 340 × 232 ──────────── */

/** Entre celdas, en los dos ejes: las columnas van en x = 46, 70, 94… con ancho
 *  20 —paso 24— y las filas en y = 22, 46, 70… con alto 20 —el mismo paso 24—.
 *  Es el mismo 4 del heatmap, y conviene que lo sea: son la misma rejilla. */
const GAP = 4

/** `cornerRadius: 2` en las 84. Es el `r-xs` de §2, el mismo número que
 *  `BAR_RADIUS` declara en `core/Series.tsx` como «el único lugar donde vive» —
 *  pero ahí está privado, y exportarlo toca un archivo compartido. */
const RADIO = 2

/** Entre el rótulo de fila y la celda: el texto termina en x = 32 y la celda
 *  arranca en 46. **Catorce y no los doce del heatmap**, que reserva para
 *  rótulos de tres letras. */
const LABEL_GAP = 14

/** Lo mínimo que se reserva para los rótulos de fila. Sale de los dos números
 *  del frame: el texto va en x = 1.4 con ancho 30.6 alineado a la derecha, o sea
 *  que la canaleta termina en 32. Con una letra en mono 9 —6,48— el piso es lo
 *  único que reproduce el dibujo. */
const LABEL_MIN = 32

/** **El techo NO sale del frame**, que sólo dibuja rótulos de una letra: sin
 *  tope, `MIÉRCOLES` por siete filas se come un tercio del panel. Es el mismo
 *  tercio que el heatmap elige y por la misma razón —por debajo de dos tercios
 *  las celdas dejan de ser celdas—; lo que no entra se recorta con `…`. */
const LABEL_MAX_SHARE = 1 / 3

/** Los doce rótulos: mono 9 con `letterSpacing: 1.08` sobre cuerpo 9, que es el
 *  mismo 0.12em de §2.3. En `em` y no en px: el frame guarda 1.2px sobre los
 *  labels de 10 y 1.08 sobre las notas de 9, y son el mismo tracking. */
const EJE_SIZE = 9

/** Del borde inferior de la rejilla —186— al centro vertical del rótulo de
 *  semana —200.9. **Abajo, no arriba**: es la diferencia estructural con el
 *  heatmap, que pone su eje en una banda de cabecera. */
const EJE_DY = 15

/** Del centro del rótulo de semana —200.9— al de la leyenda —213.7 + 7.2 de
 *  medio renglón = 220.9. */
const LEYENDA_DY = 20

/** Del centro del último texto al borde inferior del frame: 232 − 220.9. Con eso
 *  la cola bajo la rejilla sale 46 cuando hay leyenda —15 + 20 + 11— y 26 cuando
 *  no la hay, que es el aire que el dibujo deja al pie en cada caso. */
const BORDE = 11

/** El aire mínimo entre dos rótulos de semana vecinos, en píxeles. Es el mismo
 *  `LABEL_GAP` de `PlotColumns`, que resuelve el mismo problema. */
const EJE_GAP = 8

/** **Un rótulo de semana cada tres columnas, y el tres está MEDIDO en el frame,
 *  no derivado.** Sus cuatro textos caen en los centros de las columnas 0, 3, 6 y
 *  9; con el criterio del ancho a solas saldría 2, o sea seis rótulos. Tiene
 *  precedente: `PlotCombo` usa un `EVERY` fijo de 3 con la razón escrita. Acá es
 *  un PISO y no un fijo, porque un rótulo largo tiene que poder subirlo. */
const EVERY_MIN = 3

/** De nivel a `(escalón de familia, opacidad)`.
 *
 *  **Son los SIETE pares del frame, en el orden en que son monótonos en
 *  intensidad**, y el largo es derivado: `levels()` manda el mínimo al índice 0,
 *  así que agregarle el `(0, 0.4)` del heatmap pintaría la celda más fría a una
 *  opacidad que este dibujo no usa nunca. El `step` es lo que distingue los dos
 *  0.8 —`$fam-demanda-1` en la columna 2, `$fam-demanda-2` en la 3—: sin él la
 *  escalera se aplana justo en el medio, que es donde un calendario de doce
 *  semanas tiene que decir más. La casa de esto es `core/matrix.ts`. */
const RAMPA: readonly { step: FamilyStep; op: number }[] = [
  { step: 0, op: 0.5 },
  { step: 1, op: 0.6 },
  { step: 1, op: 0.7 },
  { step: 1, op: 0.8 },
  { step: 2, op: 0.8 },
  { step: 2, op: 0.9 },
  { step: 2, op: 1 },
]

/** El contrato tipográfico de los doce textos · mono 9, 0.12em, `dim`.
 *
 *  No es `AxisText` porque ése fija mono 10, y no es `<Label>` porque dentro de
 *  un `<svg>` no hay HTML. Es la misma regla por otro medio, y es cómo se
 *  sostiene «ningún número desnudo» en un plot que no pinta ninguna cifra. */
const EJE = {
  fontFamily: 'var(--font-mono)',
  fontSize: EJE_SIZE,
  letterSpacing: '0.12em',
  fill: 'var(--color-dim)',
} as const

/** El literal de la leyenda, **del frame y verbatim**. Lleva «DÍA» porque acá la
 *  celda ES un día; la variante sin el sustantivo que escribió `PlotHeatmap` es
 *  derivada y es para sus horas. Copiarla acá sería reusar el archivo hermano en
 *  el único lugar donde el `.pen` manda sin discusión: el literal de UI. */
const LEYENDA_VACIA = 'CONTORNO SIN RELLENO = DÍA SIN DATO CARGADO'

/** El dominio de las dos escalas son los ÍNDICES, **y eso lo obliga el dibujo**.
 *
 *  `bandScale` indexa su dominio con un `Map<string, number>`, así que dos
 *  etiquetas iguales colapsan en la misma banda. El frame rotula los días con UNA
 *  letra y escribe `M` **dos veces** —martes y miércoles—, de modo que con las
 *  etiquetas crudas el martes se dibuja encima del miércoles y la segunda fila
 *  queda vacía. Medido con los siete rótulos del dibujo: `row('M')` devolvía la
 *  posición de la fila 2 para las filas 1 y 2.
 *
 *  El heatmap no lo sufre porque sus rótulos son únicos —`LUN`…`DOM`, `06 H`…—,
 *  pero el defecto es de la primitiva y no de este plot: un `bandScale` por
 *  índice con los rótulos aparte es lo que debería existir en `core/scale.ts`.
 *  Mientras no se pueda tocar, acá se le pasa el índice como clave y la etiqueta
 *  se lee del array. Las semanas van igual por simetría: `S21` repetida es menos
 *  probable y no por eso legítima. */
const keys = (n: number) => Array.from({ length: n }, (_, i) => String(i))

/** Cuánto ancho se lleva la columna de rótulos de día.
 *
 *  Sale del rótulo MÁS LARGO —igual que `axisReserve`, y por la misma razón que
 *  ahí está escrita: calculado sobre otro, el eje se sale por la izquierda— con
 *  el piso del frame y el techo declarado arriba. Con una letra da
 *  `max(32, 6.48) + 14 = 46`, que es el nodo medido. */
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
 *  que hace desaparecer el `rect` del SVG sin ningún error: el panel se ve vacío
 *  y nada lo explica. Con 84 celdas y `rowSpan` 5 eso está más cerca que en una
 *  rejilla de 49. */
const padFor = (largo: number, n: number) =>
  largo <= 0 ? 0 : Math.min(0.9, (GAP * Math.max(1, n)) / largo)

/** El recortador de un eje, dado su tope de caracteres. **Es una fábrica y no
 *  una función de dos argumentos** para que no se pueda llamar con el tope del
 *  otro eje: el `cap` equivocado es el defecto que una mutación SOBREVIVIDA
 *  encontró en el heatmap, donde los dos ejes compartían presupuesto. */
const recorte = (cap: number) => (s: string) => (s.length > cap ? `${s.slice(0, cap - 1)}…` : s)

export function PlotCalendar({ value, family, format }: PlotProps<'matriz'>) {
  const { ref, w, h } = useSize()
  const { filas, columnas, celdas } = value

  /* Un hueco que nadie explica se lee como un defecto de render, así que la
     leyenda aparece sólo cuando hay al menos una celda sin dato — y como ocupa
     renglón, la cola bajo la rejilla depende de ella. */
  const hayVacias = celdas.some((fila) => fila.some((v) => v === null))
  const cola = EJE_DY + BORDE + (hayVacias ? LEYENDA_DY : 0)

  const reserve = rowReserve(filas, w)
  const gridW = Math.max(0, w - reserve - MARGIN.r)
  /* **Arriba no se reserva nada más que `MARGIN.t`**, aunque el frame deje 22px
     de aire muerto: ahí no hay nada dibujado —el eje está abajo— y un plot llena
     su `rowSpan` porque `96·N − 16` no admite sobrante. */
  const gridH = Math.max(0, h - MARGIN.t - cola)

  /* El rango se corre GAP/2 hacia atrás porque `bandScale` centra el aire dentro
     del paso: sin eso la primera celda arrancaría en 48 donde el frame la dibuja
     en 46. Con el corrimiento, a 340 de ancho salen exactamente sus nodos —paso
     23,83, ancho 19,83, primera celda en 46 y segunda en 69,83. */
  const col = bandScale(
    keys(columnas.length),
    [reserve - GAP / 2, reserve + gridW - GAP / 2],
    padFor(gridW, columnas.length),
  )
  const row = bandScale(
    keys(filas.length),
    [MARGIN.t - GAP / 2, MARGIN.t + gridH - GAP / 2],
    padFor(gridH, filas.length),
  )

  const nivel = levels(celdas, RAMPA.length)

  /* Cada cuántas semanas cabe un rótulo entero, con el piso del frame. Sale de la
     más larga porque es la que choca primero con su vecina. */
  const masLargo = Math.max(0, ...columnas.map((c) => c.length))
  const every =
    col.step > 0
      ? Math.max(EVERY_MIN, Math.ceil((textWidth(masLargo, EJE_SIZE) + EJE_GAP) / col.step))
      : EVERY_MIN

  const ejeY = MARGIN.t + gridH + EJE_DY
  /* Cada eje se recorta contra SU PROPIO presupuesto: el de día vive en la
     canaleta, el de semana tiene el aire que el raleado le dejó. */
  const recortarFila = recorte(charsThatFit(reserve - LABEL_GAP, EJE_SIZE))
  const recortarColumna = recorte(charsThatFit(col.step * every, EJE_SIZE))

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        <svg
          width={w}
          height={h}
          role="img"
          /* **Distinguible del heatmap a propósito.** Los cuatro gráficos de
             `matriz` hospedan la misma forma, y sin nombres distintos ninguna
             prueba puede afirmar CUÁL se montó — que es justo lo que se rompe
             cuando un despacho cae al gráfico por defecto y se ve perfecto. */
          aria-label={`${filas.length} × ${columnas.length} celdas en calendario de actividad`}
        >
          {/* A la izquierda, los días: uno por fila, alineado a la derecha de la
              canaleta y centrado en su fila. Se pintan TAL COMO LLEGAN, en
              mayúsculas — el plot no sabe qué día es ninguna celda. */}
          <g aria-hidden>
            {filas.map((fila, r) => (
              <text
                key={`f${r}`}
                x={reserve - LABEL_GAP}
                y={row(String(r)) + row.bandwidth / 2}
                textAnchor="end"
                dominantBaseline="middle"
                style={EJE}
              >
                {recortarFila(fila).toUpperCase()}
              </text>
            ))}
          </g>

          {/* Abajo, las semanas: una cada `every` columnas arrancando en la
              primera, centrada en su columna. */}
          <g aria-hidden>
            {columnas.map((columna, c) =>
              c % every === 0 ? (
                <text
                  key={`c${c}`}
                  x={col(String(c)) + col.bandwidth / 2}
                  y={ejeY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={EJE}
                >
                  {recortarColumna(columna).toUpperCase()}
                </text>
              ) : null,
            )}
          </g>

          {filas.map((fila, r) =>
            columnas.map((columna, c) => {
              const v = celdas[r]?.[c]
              /* **Un hueco de PAYLOAD no es una celda sin dato**, y por eso acá
                 no se dibuja nada: `celdas[r]?.[c] ?? null` pintaría un contorno
                 que afirma «no hay dato cargado» cuando lo que hay es una matriz
                 rala, o sea le atribuiría al negocio un hueco que es de quien
                 produjo el dato. La distinción es la que ya costó en A5 y en A1:
                 `null` es «nunca» y ausente es un error. La guardia que lo
                 declara es del cuerpo, antes de montar. */
              if (v === undefined) return null

              const nv = nivel[r]?.[c] ?? null
              const paso = nv === null ? undefined : RAMPA[nv]
              const cifra = v === null ? null : format(v)

              return (
                <rect
                  key={`${r}-${c}`}
                  x={col(String(c))}
                  y={row(String(r))}
                  width={col.bandwidth}
                  height={row.bandwidth}
                  rx={RADIO}
                  {...(paso === undefined
                    ? // La celda sin dato: contorno `$c-grid` de 1px y ningún
                      // relleno, que es lo que el frame dibuja en sus tres de la
                      // última semana y lo que la leyenda rotula.
                      { fill: 'none', stroke: 'var(--color-c-grid)', strokeWidth: 1 }
                    : { fill: hue({ family, step: paso.step }), fillOpacity: paso.op })}
                >
                  {/* **Acá el valor no se ve: se lee.** Es cómo el calendario
                      cumple «ningún número desnudo» sin pintar un solo número, y
                      la cifra va FORMATEADA — la cruda trae el locale de
                      `toString`, que no es el del tenant. */}
                  <title>{`${fila} · ${columna} · ${cifra ?? 'sin dato'}`}</title>
                </rect>
              )
            }),
          )}

          {hayVacias && (
            /* Centrada, que NO es donde el frame la pone —x = 24.4 de 340—:
               divergencia declarada en la cabecera, 6,3px al tamaño del dibujo. */
            <text
              x={w / 2}
              y={ejeY + LEYENDA_DY}
              textAnchor="middle"
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
