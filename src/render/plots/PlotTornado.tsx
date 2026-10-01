/** Tornado · forma `categoricaComparada` · §PEN:Plot/TORNADO · Sensibilidad del pronóstico
 *
 *  **Contesta «qué factor mueve más el pronóstico, y hacia dónde», que es lo que
 *  ni el dumbbell ni las columnas agrupadas dicen.** La pesa muestra la brecha
 *  entre dos niveles; acá los dos efectos de un mismo factor salen del cero en
 *  sentidos opuestos, así que el upside y el downside se comparan a la vez
 *  —entre sí y contra los de las otras filas— sin medir nada a ojo.
 *
 *  ── LO QUE SE MIDIÓ EN EL DIBUJO ────────────────────────────────────────────
 *
 *  Frame de 580 × 200, `layout: "none"`, todo posicionado a mano. **La página
 *  `Synapse · Plots` no tiene nodos `note`**: el frame es la única fuente, así
 *  que cada número de acá se derivó de la geometría y queda escrito al lado para
 *  que se pueda recalcular.
 *
 *  **EL CERO ESTÁ EN EL CENTRO DEL CANAL, NO DONDE CAE EL DOMINIO DEL DATO.** El
 *  `path` del eje es `M290 8 l0 168` y 290 es 580/2 exacto. El dato es
 *  asimétrico —máximo derecho 42K, izquierdo 34K— y el eje sigue en el centro:
 *  ⇒ el dominio es **`[−m, +m]` con `m = max |valor|`**, no `[min, max]`. Es la
 *  diferencia entre un gráfico que se lee de un vistazo y uno donde el cero se
 *  corre fila a fila.
 *
 *  **UNA SOLA ESCALA PARA LOS DOS LADOS, Y SE MIDIÓ EN VEZ DE SUPONERLO.** Largo
 *  de barra ÷ cifra impresa: derecha 126/42, 93/31, 66/22, 24/8; izquierda
 *  114/38, 87/29, 72/24, 102/34. **Las ocho dan 3.000 px por millar.** No hay
 *  dos escalas, hay una simétrica alrededor del cero — y escalar cada lado
 *  contra su propio máximo deja un dibujo que se ve perfecto diciendo que un
 *  −34K pesa lo mismo que un +42K.
 *
 *  **CUATRO FILAS, PASO 40, BARRA 22.** Barras en y 9, 49, 89, 129 —paso 40
 *  exacto— con `height: 22` ⇒ la barra es **0.55 del paso** y va al TOPE de la
 *  fila; los 18 de abajo son el canal del rótulo. `cornerRadius: 2`, que es el
 *  `BAR_RADIUS` que `core/Series` ya tiene.
 *
 *  **EL LADO LO DECIDE EL SIGNO, NO EL CAMPO.** Los cuatro rectángulos de la
 *  derecha son `$fam-demanda-1` opacos y arrancan en x 290; los de la izquierda
 *  son `$fam-demanda-0` a `opacity: 0.6` y terminan en 290. Las cifras derechas
 *  son positivas y las izquierdas negativas en las cuatro filas, así que **en
 *  este dibujo campo y lado coinciden** — y codificarlo por campo (`v` a la
 *  derecha, `referencia` a la izquierda) reproduce el dibujo exacto y miente con
 *  cualquier otro dato. Por eso el lado sale de `Bars`, que resuelve
 *  `from = min(p, base)`: la barra se va al lado que diga el signo sin una sola
 *  rama escrita acá.
 *
 *  **LAS CIFRAS CUELGAN DEL EXTREMO DE SU BARRA, A 10 px, Y NO DE UNA COLUMNA.**
 *  Derechas: x 426, 393, 366, 324 contra fines de barra 416, 383, 356, 314 ⇒ +10
 *  en las cuatro, ancladas `start`. Izquierdas: bordes derechos en 166, 193,
 *  208, 178 contra arranques 176, 203, 218, 188 ⇒ −10 en las cuatro, ancladas
 *  `end`. **No es la columna fija de `PlotBars`**: acá la cifra sigue a la barra,
 *  y alinearlas rompería la lectura de «hasta dónde llega este efecto».
 *
 *  **EL RÓTULO VA DEBAJO DE SU BARRA Y CENTRADO EN EL CERO**, no en una columna
 *  izquierda: los centros x de las cuatro cajas son 289.95, 289.95, 290, 289.95.
 *  El emparejamiento rótulo↔fila se comprobó por semántica además de por
 *  posición: la fila asimétrica (+8K / −34K) es la cuarta y el cuarto rótulo es
 *  `Stock crítico`, el único factor con upside chico y downside grande.
 *
 *  ── POR QUÉ LA BANDA VA CORRIDA ─────────────────────────────────────────────
 *
 *  `bandScale` CENTRA la banda en su paso y `Bars` lee `band(k)`/`bandwidth` tal
 *  cual. Sin el corrimiento de `−corr` en el rango, la barra queda centrada, el
 *  canal del rótulo se parte en dos mitades de 0.225·paso y **el rótulo de la
 *  última fila cae exactamente en `y = h` y se corta**. Con el corrimiento la
 *  barra queda al tope como en el dibujo y al último rótulo le quedan 0.225·paso
 *  de aire abajo —11.25 px a h=200, n=4—, que alcanza para un glifo de 10. Es un
 *  defecto que sólo se ve mirando el borde de abajo de un panel, y por eso lo
 *  cubre una aserción.
 *
 *  ── LO QUE FALTA EN `core/` Y SE SORTEA DESDE AFUERA ────────────────────────
 *
 *  1. **La REGLA DE REFERENCIA.** `PlotBullet` ya la dejó anotada —«falta una
 *     primitiva `core/Reference`; `tornado`, `pareto` y `waterfall` la piden
 *     igual»— y éste es el que la pide. Mientras no exista, el eje cero va como
 *     un `<line>` inline. Cuando se escriba tiene que recibir el TOKEN y el
 *     grosor por prop: acá es papel —`$w5`, 1px— y en `PlotBullet` es dato
 *     —`$ink`, 2.4px—. **`core/Grid` no sirve**: dibuja los ticks de una escala y
 *     va `aria-hidden`.
 *  2. **`Bars` no tiene `opacity` ni ancla dentro de la banda.** Las dos se
 *     sortean desde afuera —un `<g opacity={0.6}>` y el rango corrido— y las dos
 *     son de la primitiva: agregarle `opacity` y un `anchor: 'start' | 'center'`
 *     toca los tres plots que la comparten, y por eso no entra acá. Queda
 *     declarado, que es la diferencia con resolverlo en silencio.
 *  3. **El texto de CIFRA dentro del `<svg>`.** `AxisText` no sirve: es `$dim` y
 *     MAYÚSCULAS. `PlotSlope`, `PlotLollipop`, `PlotBullet`, `PlotDumbbell` y
 *     `PlotBars` ya repiten el mismo objeto de estilo inline; éste es el sexto, y
 *     la divergencia 6 de `PlotDumbbell` ya pedía moverlo a `core/`.
 *
 *  ── DIVERGENCIAS DECLARADAS ─────────────────────────────────────────────────
 *
 *  1. **LA CIFRA VA EN MONO 10 CON TRACKING, QUE ES LO QUE DICE EL FRAME Y NO EL
 *     ROL «CIFRA» DE §2.3.** §2.3 le da a una cifra mono 11 SIN tracking, con una
 *     razón escrita —«el tracking separa los dígitos y rompe la comparación de
 *     columna a columna»— que acá aplica: hay ocho cifras que se comparan entre
 *     filas. `PlotBars` y `PlotDumbbell` usan `--text-cifra`. El frame es
 *     normativo para lo visual, así que se dibuja como el frame —`fontSize: 10`,
 *     `letterSpacing: 1.2` = 0.12em— y se mitiga con `tabular-nums`. **Queda como
 *     propuesta de spec**: o el frame retipea a 11 sin tracking, o el rol «cifra
 *     en gráfico» admite el tamaño de label. No se resuelve en silencio en
 *     ninguna de las dos direcciones.
 *  2. **El rótulo sale en MAYÚSCULAS y el frame lo dibuja en caja mixta.**
 *     `AxisText` mayusculiza, y se usa igual porque **el texto del frame es dato
 *     mock, no literal de UI**: el rótulo sale de `items[].etiqueta`, que lo
 *     escribe el catálogo. Todo eje de categorías del repertorio mayusculiza por
 *     la misma primitiva, y la tipografía del frame —mono 10, 0.12em, `$dim`— es
 *     exactamente el rol «rótulo» de §2.3.
 *  3. **El dibujo se solapa consigo mismo y acá no.** Su caja de rótulo mide 16 y
 *     arranca 9 px bajo su barra, así que termina 7 px DENTRO de la barra
 *     siguiente —rótulo 1 en y 40–56, barra 2 en y 49–71; paso 40 contra
 *     22+9+16 = 47—. No se reproduce: el rótulo va centrado en su canal. Es la
 *     misma clase de imprecisión de mano que el acolchado 0.274 de
 *     `PlotDumbbell`.
 *  4. **La escala del frame está elegida a mano y la nuestra llena el canal.** 3
 *     px por millar deja ~100 px de aire a cada lado sobre 580; acá el máximo
 *     absoluto se estira hasta la reserva de la cifra, así que las barras salen
 *     más largas. Es lo que hace que el mismo plot sirva en un panel de colSpan 5
 *     y en el drill-down, y es la misma divergencia que el paso fijo de 36 de
 *     `PlotDumbbell`.
 *  5. **El eje cubre `0 → h` y el frame va de 8 a 176.** Allá eso es exactamente
 *     el alto de la tinta —del tope de la primera barra al pie del último
 *     rótulo—; acá la tinta ocupa el alto entero porque el `<svg>` es
 *     responsivo, así que es el mismo recorrido por otro medio.
 *  6. **El signo negativo no es el del dibujo.** El `.pen` escribió el guion
 *     —`-38K`— y `format.delta` emite U+2212, con su razón escrita en
 *     `format.ts`. Se elige el formateador.
 *
 *  ── LO QUE NO SE DIBUJA Y NO SE INVENTA ─────────────────────────────────────
 *
 *  **El orden es el del dato, y acá importa más que en el resto.** El dibujo
 *  tiene las amplitudes en 80, 60, 46, 42 —descendente—, que es lo que le da
 *  forma de embudo y lo que hace que se lea «qué factor pesa más». Este archivo
 *  NO ordena: la autoridad del orden es el `ORDER BY` de la consulta y
 *  `ComparisonBody` ya decidió no leer el param `order` para no poner dos
 *  autoridades sobre lo mismo. Con un payload sin ordenar el gráfico sigue siendo
 *  correcto y deja de ser legible — **es un pedido a quien emite el dato**, no un
 *  sort escondido acá.
 *
 *  **`delta` no se dibuja y no se deriva.** El contrato lo define como
 *  `v − referencia`, que acá es la amplitud total (80, 60, 46, 42 en el dibujo), y
 *  el frame no la escribe. Tampoco se calcula para ordenar, porque no se ordena.
 *
 *  **No hay leyenda posible y no se inventa una.** `v` y `referencia` no traen
 *  nombre: no se puede escribir «escenario alto / escenario bajo» sin inventar
 *  copy de producto. El frame tampoco dibuja leyenda, y lo que sostiene la
 *  lectura es el signo de la cifra, que es texto. `presentation` —donde el
 *  backend redacta rótulos— **no llega a un plot**: `PlotProps` no lo declara.
 *  Propuesta de spec: o un par de rótulos en la forma, o `presentation` bajando
 *  al plot; las dos son cambio de contrato.
 *
 *  **Una fila sin `referencia` se descarta, sin `?? 0`.** Con el cero aparece una
 *  barra de largo cero pegada al eje, que se lee «el downside es cero» y es
 *  mentira; descartarla dice «no se sabe». El costo está declarado: **un lector
 *  vidente no se entera** —lo único que lo delata es el conteo del `aria-label`—,
 *  que es la misma trampa que `PlotSlope` y `PlotDumbbell` ya declararon.
 *
 *  ── RIESGOS HEREDADOS ───────────────────────────────────────────────────────
 *
 *  **Por encima de seis filas el rótulo no entra.** A h=200 y n=6 el paso baja a
 *  33 y el canal a 15, que con un glifo de 10 deja 2.5 px de aire; a n=8
 *  colisiona. **El repertorio no le declara `tope` a `tornado`** (`cap: null`) y
 *  su único mínimo es `items < 2`, así que nada lo frena: es un pedido de `cap`,
 *  medido, igual que el que `dumbbell` dejó abierto.
 *
 *  **Dos ítems con la misma `etiqueta` colapsan.** `bandScale` indexa por clave
 *  con un `Map` y `Bars` keyea por `k`: dos filas homónimas se dibujan una sobre
 *  la otra y la segunda desaparece sin aviso. Heredado de la primitiva y
 *  compartido con `PlotDumbbell`; se nombra para que no se descubra con dato
 *  real.
 *
 *  **Dos valores del MISMO signo se superponen en su franja.** Es consecuencia
 *  directa de que el lado lo decida el signo —que es lo correcto— y el dibujo no
 *  tiene ese caso. La de `v` se pinta arriba y opaca, así que la visible es la
 *  del valor; el downside queda detrás y lo delata su cifra, que es texto.
 */
import { AxisText } from './core/Axis'
import { Bars } from './core/Series'
import { bandScale, linearScale } from './core/scale'
import { charsThatFit, textWidth } from './core/axisGeometry'
import { useSize } from './core/useSize'
import type { PlotProps } from '../types'

/** Los 10 px entre el extremo de la barra y su cifra. Del frame, y ocho veces:
 *  +10 en las cuatro cifras derechas y −10 en las cuatro izquierdas. */
const GAP = 10

/** La barra como fracción de su franja. Del frame: `height: 22` sobre paso 40. */
const BAR = 0.55

/** §2.3 le daría mono 11 sin tracking al rol «cifra». Esto es lo que dice el
 *  frame —`fontSize: 10`, `letterSpacing: 1.2` = 0.12em— y el frame es normativo
 *  para lo visual. `tabular-nums` es la mitigación: el tracking separa los
 *  dígitos y acá hay ocho cifras que se comparan entre filas. */
const CIFRA = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-label)',
  letterSpacing: 'var(--tracking-rotulo)',
  fontVariantNumeric: 'tabular-nums',
  fill: 'var(--color-ink)',
} as const

export function PlotTornado({ value, family, format }: PlotProps<'categoricaComparada'>) {
  const { ref, w, h } = useSize()

  // Sólo las filas que tienen contra qué compararse. El `?? 0` que parece
  // inofensivo dibuja una barra de largo cero pegada al eje y dice «el downside
  // es cero», que no es lo que falta saber.
  const filas = value.items.flatMap((i) =>
    i.referencia === undefined ? [] : [{ k: i.etiqueta, v: i.v, ref: i.referencia }],
  )

  const cero = w / 2

  // La reserva sale de la cifra MÁS LARGA de las 2n, no de la del máximo: con
  // «+8K» de tres caracteres y «−34K» de cuatro, calculada sobre el máximo la
  // cifra de la fila corta se sale por el borde. Es lo mismo que `axisReserve`
  // ya aprendió para el eje de valores.
  const anchoCifra = Math.max(0, ...filas.flatMap((f) => [format(f.v).length, format(f.ref).length]))
  // Simétrica a los dos lados: es lo que mantiene el cero en el centro del canal
  // aunque el dato sea asimétrico, que es lo que el frame fija.
  const medio = Math.max(0, cero - GAP - textWidth(anchoCifra))

  // El dominio es [−m, +m]. El piso de 1 es sólo para el payload de puros ceros:
  // con `m = 0` el ancho del dominio es cero y `linearScale` manda todo al
  // arranque del rango, o sea al borde izquierdo en vez del centro.
  const amplitud = Math.max(0, ...filas.flatMap((f) => [Math.abs(f.v), Math.abs(f.ref)]))
  const m = amplitud === 0 ? 1 : amplitud
  const x = linearScale([-m, m], [cero - medio, cero + medio])

  // La barra va al TOPE de su franja y no centrada en ella: el rango corrido en
  // `−corr` es lo que lo consigue sin tocar `bandScale`, y lo que deja el canal
  // del rótulo entero abajo en vez de partido en dos mitades.
  const paso = h / Math.max(1, filas.length)
  const alto = BAR * paso
  const corr = (paso - alto) / 2
  const y = bandScale(
    filas.map((f) => f.k),
    [-corr, h - corr],
    1 - BAR,
  )

  // El rótulo vive en su propio canal, así que dispone del ancho entero.
  const cap = charsThatFit(w)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && filas.length > 0 && (
        // El nombre tiene que ser DISTINGUIBLE del de `PlotDumbbell` y del de
        // `PlotGrouped`, que salen del MISMO cuerpo y de la MISMA forma: con el
        // mismo texto, olvidar el despacho se ve perfecto y ninguna prueba lo
        // nota.
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`${filas.length} factores con su efecto en los dos sentidos`}
        >
          {/* El eje cero es PAPEL, no dato: `$w5` y sin familia. Un cero con hue
              se leería como una tercera medida — la misma razón por la que el
              conector de `PlotDumbbell` y el umbral de `PlotBullet` no la llevan. */}
          <line
            x1={cero}
            y1={0}
            x2={cero}
            y2={h}
            stroke="var(--color-w5)"
            strokeWidth={1}
            strokeLinecap="round"
          />
          {/* La referencia primero y al 0.6, como la dibuja el frame; el valor
              después, opaco y arriba. Las dos pasadas comparten banda y escala:
              es lo que hace que los dos lados midan con la misma vara. */}
          <g opacity={0.6}>
            <Bars
              items={filas.map((f) => ({ k: f.k, v: f.ref }))}
              band={y}
              value={x}
              orientation="horizontal"
              base={x(0)}
              family={family}
              step={0}
            />
          </g>
          <Bars
            items={filas.map((f) => ({ k: f.k, v: f.v }))}
            band={y}
            value={x}
            orientation="horizontal"
            base={x(0)}
            family={family}
            step={1}
          />
          {filas.map((f) => {
            // La cifra se centra en la barra, como en el frame: cajas de texto en
            // y 12..28 contra barras en 9..31, los dos con centro en 20.
            const cy = y(f.k) + y.bandwidth / 2
            const rotuloY = y(f.k) + y.bandwidth + (y.step - y.bandwidth) / 2
            return (
              <g key={f.k}>
                <text
                  x={f.v >= 0 ? x(f.v) + GAP : x(f.v) - GAP}
                  y={cy}
                  textAnchor={f.v >= 0 ? 'start' : 'end'}
                  dominantBaseline="middle"
                  style={CIFRA}
                >
                  {format(f.v)}
                </text>
                <text
                  x={f.ref >= 0 ? x(f.ref) + GAP : x(f.ref) - GAP}
                  y={cy}
                  textAnchor={f.ref >= 0 ? 'start' : 'end'}
                  dominantBaseline="middle"
                  style={CIFRA}
                >
                  {format(f.ref)}
                </text>
                {/* Ningún número desnudo: la fila dice de qué factor es. Va
                    centrado en el cero, que es donde lo pone el frame —centros x
                    en 289.95, 289.95, 290, 289.95 sobre 580— y no en una columna
                    izquierda tipo `CategoryAxis`. */}
                <AxisText x={cero} y={rotuloY} anchor="middle">
                  {f.k.length > cap ? `${f.k.slice(0, cap - 1)}…` : f.k}
                </AxisText>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
