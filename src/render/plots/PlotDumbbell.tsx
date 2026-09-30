/** Dumbbell · forma `categoricaComparada` · §PEN:Plot/DUMBBELL · Brecha contra objetivo
 *
 *  **Contesta «cuánto le falta a cada categoría», que es lo que ni el ranking ni
 *  las columnas agrupadas dicen de un vistazo.** Con dos columnas por categoría
 *  la brecha hay que medirla a ojo entre dos alturas; acá la brecha ES el trazo.
 *
 *  ── LO QUE SE MIDIÓ EN EL DIBUJO ────────────────────────────────────────────
 *
 *  Frame de 580 × 208, `layout: "none"`, todo posicionado a mano. **La página
 *  `Synapse · Plots` no tiene nodos `note`**: el frame es la única fuente, así
 *  que todo lo de acá se derivó de la geometría y cada número quedó escrito al
 *  lado para que se pueda recalcular.
 *
 *  Cinco filas con centros en y 14, 50, 86, 122 y 158 —paso 36 exacto— y ~32 px
 *  al pie ocupados por la nota de objetivo.
 *
 *  **QUÉ EXTREMO ES CUÁL, y se midió en vez de suponerlo.** Los cinco largos de
 *  `path` divididos por su delta impreso dan 5.7667 · 5.7708 · 5.7722 · 5.7692 ·
 *  5.7714 px por punto: una sola escala lineal, y `delta = segundo − primero`
 *  exacto en las cinco filas. Como el contrato define `delta` como
 *  `v − referencia`, **el escalón 0 es la `referencia` y el escalón 2 es `v`**.
 *  Las filas 3 y 4 van de derecha a izquierda —`l-103.9` y `l-75`—, que es lo
 *  que hace un delta negativo. Invertir los extremos deja un dibujo idéntico
 *  —cinco pesas simétricas— diciendo lo contrario, y de ahí que sea la primera
 *  aserción de la prueba.
 *
 *  **EL DOMINIO NO ARRANCA EN CERO, Y ESO LO DEMUESTRA EL DIBUJO.** Los diez
 *  puntos del frame caen entre 70.9 y 117.9 —span 47 pp— sobre un canal de 419
 *  px (501.2 − 82) que a 5.767 px/pp cubre 72.7 pp: los datos ocupan 0.647 del
 *  riel, o sea ~0.274 de acolchado a cada lado. Con base cero cinco índices
 *  alrededor de 100 salen como cinco pesas apretadas contra el borde derecho y
 *  la brecha —lo único que este gráfico existe para mostrar— se vuelve
 *  invisible. Y **cinco pesas apretadas se ven prolijas**: no lo detecta mirar
 *  la pantalla.
 *
 *  ── DOS COSAS QUE EL DIBUJO TIENE Y EL DATO NO ──────────────────────────────
 *
 *  1. **La vertical punteada y su nota `OBJETIVO = 100` no se dibujan.**
 *     Despejando la escala, las cinco referencias del frame son 92, 88, 96, 84 y
 *     90 y los cinco valores 104, 112, 78, 71 y 118: **ninguna referencia es
 *     100**. El 100 es un TERCER número que `ValorCategoricaComparada` no lleva
 *     por ningún campo, así que dibujarlo sería inventar una cifra. El camino
 *     para recuperarlo tiene precedente —`PlotBullet` recibe su `objetivo`
 *     suelto porque el layout lo declara en `opciones.maximo`—, así que va como
 *     propuesta de spec: `ComparisonParams.objetivo`, o un campo en la forma.
 *     Cualquiera de las dos trae además `core/Reference`, que sigue faltando.
 *  2. **«Meta» de la primera fila es la plataforma, no la palabra «objetivo».**
 *     Las cinco filas son medios —Meta, Google, Criteo, TikTok, Email—, de ahí
 *     que la familia del dibujo sea `medios`. La primera fila no tiene nada de
 *     especial.
 *
 *  ── EL ÚNICO TEXTO ES LA BRECHA, Y LLEVA SIGNO ──────────────────────────────
 *
 *  `format` que llega acá es el formateador de la BRECHA —`format.delta` más la
 *  unidad, compuesto por el cuerpo— y se aplica **sólo a `item.delta`**, porque
 *  el frame no escribe ninguna otra cifra. El signo es lo que comunica dirección
 *  (regla dura 3: prohibido verde/rojo semántico), y las dos inyecciones
 *  posibles —`format.delta` y `format.number`— tienen la misma firma
 *  `(n: number) => string`, así que **equivocarse compila**. Lo sostiene la
 *  prueba, no el compilador.
 *
 *  `delta` se usa tal como llega y **no se deriva de `v − referencia`** aunque
 *  los dos números estén a mano: «quien conoce la definición del delta
 *  —absoluto, relativo, contra qué base— es quien produjo el dato». Una fila con
 *  los dos números y sin `delta` sale sin cifra, que es honesto.
 *
 *  **El orden es el del dato.** «El cuerpo ordena y recorta; este archivo no»
 *  —`PlotLollipop`—, y el dibujo tampoco ordena: +12, +24, −18, −13, +28.
 *
 *  ── DIVERGENCIAS DECLARADAS ─────────────────────────────────────────────────
 *
 *  1. **El paso de fila es responsivo y el dibujo lo tiene fijo en 36 px**, con
 *     32 px reservados al pie para la nota. Acá las filas se reparten el alto
 *     entero porque el `<svg>` es responsivo y la nota no se dibuja. El costo
 *     está en el encabezado de riesgos: por encima de cinco filas dos puntos de
 *     12 px empiezan a tocarse, y **el repertorio no le declara `tope` a
 *     `dumbbell`** (`cap: null`), así que nada lo frena.
 *  2. **El acolchado es 0.3 parejo y el dibujo mide 0.274.** Es la misma clase
 *     de divergencia que el 0.3 de `PlotSlope` contra su 0.25/0.34 y el 0.75 de
 *     `envelope`: números puestos a mano, no un algoritmo legible.
 *  3. **El signo negativo no es el del dibujo.** El `.pen` escribió el guion
 *     —`-18 pp`— y `format.delta` emite U+2212, con su razón escrita en
 *     `format.ts`. Se elige el formateador.
 *  4. **«pp» no está en el dato.** El dibujo escribe `+12 pp`; la unidad de la
 *     métrica sería `%` y el delta de dos porcentajes se mide en puntos, y
 *     ningún campo dice eso. Es un pedido a quien emite el dato —la unidad del
 *     delta—, no un arreglo del front: traducirlo acá sería escribir copy de
 *     producto donde no corresponde.
 *  5. **`spread` y el recorte en fuente proporcional viven acá, duplicados.**
 *     `spread` está privada en `PlotSlope` —cuyo encabezado ya anticipa que
 *     «lo van a pedir `bump` y `dumbbell`»— y `BODY_ADVANCE`/`charsThatFitBody`
 *     están privados en `PlotLollipop` con toda su medición escrita. Los dos van
 *     a `core/scale.ts` y `core/axisGeometry.ts`, que son archivos compartidos y
 *     moverlos no entra en esta tarea. Es la tercera vez que el avance de la
 *     proporcional se necesita.
 *  6. **El texto de dato dentro del `<svg>` va con estilo inline.** `AxisText` no
 *     sirve: es mono 10, MAYÚSCULAS y `$dim` —el rol «rótulo» de §2.3— y acá
 *     hacen falta los roles «celda» (body 12 `$ink`) y «cifra» (mono 11 `$ink`).
 *     Son cuatro plots repitiéndolo: `PlotSlope`, `PlotLollipop`, `PlotBullet` y
 *     éste.
 *
 *  ── LO QUE NO SE RESUELVE Y NO SE INVENTA ───────────────────────────────────
 *
 *  **Una familia de dos escalones colapsa los dos extremos al mismo color**, y
 *  el color es la única marca de cuál es cuál: `familyVar` hace `step % largo` y
 *  `externo` tiene 2, así que `step: 2` cae en 0. La pesa sigue dibujada y deja
 *  de decir hacia dónde se movió. No se arregla en silencio —elegir otro color
 *  lo prohíbe la regla dura 1, y un anillo para la referencia es un cambio
 *  visual que el `.pen` no dibuja—: va como propuesta de spec con sus dos
 *  salidas nombradas (anillo, o un tercer escalón obligatorio por familia).
 *  Mientras tanto la dirección la sostiene el signo de la cifra, que es texto.
 *
 *  **`delta = 0` superpone los dos puntos** y sólo se ve el de arriba. El dibujo
 *  no tiene ese caso; la cifra `0` lo desambigua, y el de valor va último para
 *  que sea el visible.
 *
 *  **Una fila descartada por no traer `referencia` desaparece sin decírselo a un
 *  lector vidente**: lo único que lo delata es el conteo del `aria-label`. Es la
 *  misma trampa que `PlotSlope` declaró para sus series descartadas.
 */
import { useSize } from './core/useSize'
import { bandScale, linearScale } from './core/scale'
import { hue } from './core/seriesColor'
import type { PlotProps } from '../types'

/** El borde derecho de la columna de etiquetas, como fracción del ancho. Del
 *  frame: las cinco cajas terminan en x 82 sobre 580 ⇒ 0.1414. **Proporcional y
 *  no fijo**, por la misma razón que en `PlotLollipop`: el mismo plot vive en un
 *  panel de colSpan 5 y en el drill-down a pantalla completa. */
const LABEL_WIDTH = 0.14

/** Lo reservado a la derecha para la cifra de brecha. Del frame: las cifras
 *  arrancan en x 501.2 sobre 580 ⇒ (580 − 501.2) / 580 = 0.1359. */
const DELTA_WIDTH = 0.136

/** Del frame: `ellipse` de 12 × 12 en los diez extremos. */
const DOT_R = 6

/** Del frame: `strokeWidth: 3`, `strokeLinecap: "round"` en los cinco `path`. */
const LINK_WIDTH = 3

/** El aire entre cada columna de texto y el riel. **Es nuestro: el dibujo no lo
 *  da**, porque sus extremos son data-dependientes y no hay un margen constante
 *  que medir. Sale del radio: `2 · DOT_R` deja 6 px de aire limpio entre la
 *  tinta del punto extremo y la columna vecina. Es el mismo 12 que
 *  `PlotLollipop` eligió sobre su propio frame. */
const GAP = 12

/** Del frame: `fontSize: 12` en las cinco etiquetas · es `--text-celda`. Vive
 *  como número porque el recorte se calcula con él y una `var()` no se divide. */
const LABEL_SIZE = 12

/** Ancho de un carácter de Inter, como fracción del tamaño · DUPLICADO de
 *  `PlotLollipop`, donde está la medición completa: 107 caracteres en siete
 *  cajas del `.pen` suman 837.9 px a `$font-body` 12, y se elige 0.6 —no el
 *  promedio 0.653— porque es el que reproduce el dibujo sin recortar etiquetas
 *  que el `.pen` pinta enteras.
 *
 *  **NO es el 0.72 de `MONO_ADVANCE`**, que es JetBrains Mono más el tracking de
 *  §2.3: aplicado acá recorta cuatro caracteres de más por etiqueta. Es la misma
 *  falla que ya costó una letra por etiqueta en el eje, con otro tamaño. */
const BODY_ADVANCE = 0.6

/** Cuántos caracteres de Inter entran en un ancho dado. El piso de 3 es el de
 *  `charsThatFit`, y por la misma razón: una etiqueta recortada a un carácter no
 *  dice nada. */
const charsThatFitBody = (px: number) => Math.max(3, Math.floor(px / (LABEL_SIZE * BODY_ADVANCE)))

/** El dominio ACOLCHADO · DUPLICADO de `PlotSlope`, que ya anticipó este uso.
 *
 *  **No sirve `envelope`**: su 0.75 está documentado para la barra de rango y
 *  además redondea hacia afuera a pasos redondos, así que sobre cinco índices
 *  alrededor de 100 devuelve un dominio que aplasta las pesas en el centro. Y
 *  **no sirve `ceiling`**, que parte de cero, que es justo lo que este dibujo
 *  descarta.
 *
 *  El piso del span es el de `envelope` y por la misma razón: cinco filas con
 *  `delta = 0` sobre el mismo valor colapsarían el dominio y la escala dividiría
 *  por cero. */
function spread(values: readonly number[], pad = 0.3): [number, number] {
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = Math.max(hi - lo, Math.abs(hi) / 10, 1)
  return [lo - pad * span, hi + pad * span]
}

export function PlotDumbbell({ value, family, format }: PlotProps<'categoricaComparada'>) {
  const { ref, w, h } = useSize()

  // Sólo las filas que tienen contra qué compararse. **No hay `?? 0` ni
  // `?? item.v`**: con el cero el conector saldría del origen, que es
  // literalmente «inventar un objetivo», y con el propio valor la pesa mediría
  // cero y se leería «llegó a la meta».
  const filas = value.items.flatMap((i) =>
    i.referencia === undefined
      ? []
      : [{ k: i.etiqueta, v: i.v, ref: i.referencia, delta: i.delta }],
  )

  const left = Math.round(w * LABEL_WIDTH)
  const deltaX = w - Math.round(w * DELTA_WIDTH)
  // El punto se para SOBRE el fin del riel, así que su radio sale de los dos
  // extremos: sin restarlo, la pesa más larga mete media marca dentro de la
  // columna de al lado. Es lo que `PlotLollipop` ya anotó para su tallo.
  const x = linearScale(spread(filas.flatMap((f) => [f.ref, f.v])), [
    left + GAP + DOT_R,
    Math.max(left + GAP + DOT_R, deltaX - GAP - DOT_R),
  ])

  // Las filas se reparten el alto entero: el dibujo tiene paso fijo 36 y reserva
  // 32 px al pie para una nota que acá no se dibuja. El `padding` de la banda da
  // igual porque sólo se lee su centro.
  const y = bandScale(
    filas.map((f) => f.k),
    [0, h],
  )
  const cap = charsThatFitBody(left)

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && filas.length > 0 && (
        // El nombre tiene que ser DISTINGUIBLE del de `PlotGrouped`, que sale del
        // MISMO cuerpo y de la MISMA forma: con el mismo texto, olvidar el
        // despacho se ve perfecto y ninguna prueba lo nota.
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`${filas.length} categorías con su referencia y su brecha`}
        >
          {filas.map((f) => {
            const cy = y(f.k) + y.bandwidth / 2
            return (
              <g key={f.k}>
                {/* El conector es PAPEL, no dato: `$w5` y sin familia. Un
                    conector con hue se leería como una tercera medida, que es la
                    misma razón por la que el umbral de `PlotBullet` no la lleva. */}
                <path
                  d={`M${x(f.ref)},${cy}L${x(f.v)},${cy}`}
                  stroke="var(--color-w5)"
                  strokeWidth={LINK_WIDTH}
                  strokeLinecap="round"
                  fill="none"
                />
                {/* Orden de pintado: referencia y después valor. El de valor
                    queda arriba, que es lo que hace visible el caso
                    `delta = 0` —los dos puntos superpuestos. */}
                <circle cx={x(f.ref)} cy={cy} r={DOT_R} fill={hue({ family, step: 0 })} />
                <circle cx={x(f.v)} cy={cy} r={DOT_R} fill={hue({ family, step: 2 })} />
                <text
                  x={left}
                  y={cy}
                  textAnchor="end"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 'var(--text-celda)',
                    fill: 'var(--color-ink)',
                  }}
                >
                  {f.k.length > cap ? `${f.k.slice(0, cap - 1)}…` : f.k}
                </text>
                {/* §2.3 · el rol «cifra en gráfico»: mono 11 SIN tracking, porque
                    el tracking separa los dígitos y rompe la comparación de fila
                    a fila — y acá hay cinco brechas que se comparan entre sí.
                    Ausente cuando el backend no manda el delta: no se deriva. */}
                {f.delta !== undefined && (
                  <text
                    x={deltaX}
                    y={cy}
                    textAnchor="start"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 'var(--text-cifra)',
                      fontVariantNumeric: 'tabular-nums',
                      fill: 'var(--color-ink)',
                    }}
                  >
                    {format(f.delta)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}
