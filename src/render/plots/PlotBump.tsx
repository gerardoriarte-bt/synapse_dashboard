/** Bump · ranking a lo largo del tiempo · forma `seriesMultiples` · §PEN:Plot/RANKING
 *
 *  Medido nodo por nodo sobre el frame `Plot/RANKING · Ranking de plataformas`
 *  —600 × 206, `layout: "none"`, cuatro series y seis períodos—.
 *
 *  ── QUÉ CONTESTA, Y QUÉ TIRA PARA CONTESTARLO ───────────────────────────────
 *
 *  **Un bump borra la magnitud.** Sus cuatro rieles están a 50px exactos uno de
 *  otro en el dibujo, así que #1 y #2 se ven igual de separados si difieren en
 *  1 % o en 40×. La forma `seriesMultiples` trae el `v` y acá se convierte en una
 *  posición; lo que queda es «quién va adelante y quién lo pasó». Un panel que
 *  tenga que contestar «cuánto» pide `multiline` o `stackarea`.
 *
 *  **Y el #1 asume que MÁS ES MEJOR.** El plot ordena descendente por `v`, que
 *  para un CPA o un costo por adquisición pondría al peor arriba.
 *  `direccionSemantica` es del CATÁLOGO y **no llega a `BodyProps`** —sólo
 *  `PanelShell` la lee, del `metric`—, así que acá no hay cómo saberlo y no se
 *  adivina: inventar un param de layout sería el front rellenando un hueco del
 *  contrato. Queda como propuesta de spec.
 *
 *  ── LOS NÚMEROS DEL DIBUJO Y POR QUÉ NO SE COPIAN TODOS ──────────────────────
 *
 *  · Cuatro `path` de `$c-grid` de 1px, en y 22 · 72 · 122 · 172, de x 66 a 520.
 *    **Un riel por PUESTO, no por serie**: son las filas #1–#4.
 *  · 20 `path` de `strokeWidth 2.5`, `strokeLinecap: round`, en cinco tramos de
 *    90,8px. Un tramo horizontal es «no se movió»; uno de ±50 en y, «subió o
 *    bajó un puesto».
 *  · 24 `ellipse` de 10 × 10 ⇒ r = 5, del color de su serie y a opacidad plena.
 *  · Rótulo de puesto a la izquierda, mono 10 / `letterSpacing 1.2px` = 0.12em /
 *    `$dim`, alineado a la derecha. Su caja termina en 50 y el riel arranca en
 *    66: 16px de canaleta.
 *  · Rótulo de serie a la derecha, mismo contrato tipográfico pero **con el color
 *    de SU serie**. El dibujo los coloca a mano en dos x distintas —534 para META
 *    y 524.8 para los otros tres—: es un descuido de dibujo, no una regla, así
 *    que acá se ancla uno solo.
 *  · Eje de períodos abajo, centrado bajo cada columna.
 *
 *  **Tres divergencias declaradas, y las tres son del mismo tipo** —el dibujo
 *  tiene números puestos a mano y el repertorio tiene constantes compartidas—:
 *  la reserva izquierda sale de `axisReserve` (~28px) y no de los 66 del dibujo,
 *  cuya caja de 38,4 sobra para dos caracteres; el margen inferior es `MARGIN.b`
 *  y no los 34 del dibujo, porque darle margen propio a un plot lo saca del único
 *  lugar donde vive la geometría de ejes; y la separación entre rieles sale de
 *  repartir el alto disponible, no de los 50px fijos, porque el panel mide lo que
 *  su `rowSpan` le deja y el dibujo mide 206 siempre.
 *
 *  **Una cuarta, que es la que conviene leer despacio: el color se asigna por
 *  ORDEN DE ENTRADA y no por puesto final.** El dibujo le da el escalón 1 —el
 *  trazo principal— a META, que termina #1. Copiar eso haría que una serie cambie
 *  de color cuando cambia el período, que es justo lo contrario de la
 *  persistencia cromática de §2.2. Acá el paso sale del índice en `value.series`,
 *  que es estable. Es una divergencia visible contra el dibujo y es la correcta.
 *
 *  ── EL EJE DE PERÍODOS VA A DECIR `20362`, Y ES A PROPÓSITO ──────────────────
 *
 *  El `.pen` dibuja FEB MAR ABR, y el contrato midió el 2026-09-29 que `Punto.t`
 *  es **días desde epoch en una cadena** («20362» = 2025-10-01), no una etiqueta
 *  pintable. Nunca se notó porque **ningún plot del repertorio pinta el eje X**:
 *  éste es el primero que lo necesita. Interpretarlo acá es exactamente la
 *  interpretación que el cable no declara y que el propio contrato rechaza para
 *  la trama del degradado. Queda pedido en B1.34; hasta entonces el eje se ve feo
 *  y es honesto, y se cae solo el día que el backend mande una etiqueta.
 *
 *  ── DOS TOPES QUE ESTE ARCHIVO NO PUEDE PONER ───────────────────────────────
 *
 *  `familyVar` ajusta el escalón con `step % largo` y `FAMILY_STEPS` dice que
 *  `externo` tiene 2: cinco series sobre `externo` dan los colores 0,1,0,1,0, o
 *  sea tres pares de líneas idénticas que además se CRUZAN, que es justo lo que
 *  el bump existe para mostrar. `PlotStackArea` sobrevive al mismo tope porque
 *  sus bandas no se cruzan y la posición desambigua; acá no. Y con `rowSpan` 4 y
 *  ocho series la separación entre rieles cae debajo de 20px, con dos puntos de
 *  r = 5 casi tocándose. El tope real del bump es `FAMILY_STEPS[familia]` y es un
 *  `tope` de `SYNAPSE_PLOTS` (B1.21) que hoy nadie declara — el plot **no se
 *  inventa un umbral ni se apaga solo**, que sería rellenar un hueco del
 *  contrato.
 *
 *  ── POR QUÉ ESTE ARCHIVO DIBUJA SVG CRUDO DONDE HAY PRIMITIVA ───────────────
 *
 *  `Line` tiene `strokeWidth={1.5}` escrito adentro y el dibujo pide 2.5; `Dots`
 *  confunde «tiene radio» con «es burbuja» —`fillOpacity={p.r === undefined ? 1 :
 *  0.55}`— así que pasarle el r = 5 del dibujo devolvería puntos al 55 %, un
 *  color que ningún token eligió; y `AxisText` fija el fill en `--color-dim`,
 *  que está bien para un rótulo de eje y no para el de la derecha, que es lo
 *  único que nombra la fila y cuyo color es lo que la ata a su línea cuando
 *  cuatro líneas se cruzan.
 *
 *  Las tres piden un cambio en `core/`, que esta tanda no toca. **Queda anotado
 *  que es un rodeo, y que `PlotControl` ya rodeó el mismo hueco de `Dots` con un
 *  `<circle>` crudo: dos rodeos son la señal de que falta la primitiva**, no de
 *  que sobre un componente a medida. La deuda concreta es `width?: number` en
 *  `Line` —que además cierra la divergencia ya escrita y no aplicada de
 *  `PlotStackArea`, «1.8px en el dibujo» pasando sin grosor—, separar burbuja de
 *  radio en `Dots`, y un `core/SeriesLabel.tsx` que sirve igual a `multiline` y a
 *  `slope`.
 */
import { useSize } from './core/useSize'
import { linearScale } from './core/scale'
import { AxisText } from './core/Axis'
import { MARGIN, axisReserve, charsThatFit } from './core/axisGeometry'
import { Grid } from './core/Grid'
import { hue } from './core/seriesColor'
import type { PlotProps } from '../types'

/** Del frame: `ellipse` de 10 × 10. */
const DOT = 5

/** Del frame: `strokeWidth: 2.5` en los veinte tramos. Es más grueso que el 1.5
 *  del repertorio a propósito: acá las líneas se CRUZAN, y seguir una con la
 *  vista a través de un cruce es lo único que el gráfico pide hacer. */
const LINE_WIDTH = 2.5

/** La rampa tiene cinco escalones · el mismo tope que la composición y el
 *  apilado. El dibujo usa cuatro de los cinco —`-1`, `-2`, `-3`, `-0`—. */
const RAMP = 5

/** El aire entre el riel y sus rótulos. El dibujo deja 16 a la izquierda y ~14 a
 *  la derecha; se elige uno solo, por la misma razón que en `PlotLollipop`: dos
 *  aires distintos sin razón son dos constantes que se desincronizan. */
const GAP = 8

/** Cuánto del ancho puede llevarse la columna de rótulos de serie. El tope es
 *  proporcional y no fijo en caracteres por la misma razón escrita en
 *  `CategoryAxis`: un tope fijo se sale en cuanto el panel se angosta. */
const LABEL_MAX = 0.25

/** El contrato tipográfico de §2.3 para el rol «rótulo»: mono 10, 0.12em,
 *  mayúsculas. Lo replica `AxisText` para los rótulos de eje; acá se repite
 *  porque el rótulo de serie necesita el fill de SU serie y `AxisText` lo tiene
 *  fijo en `dim`. **Es la cuarta copia del contrato y por eso está anotada**: lo
 *  que corresponde es que viva en `core/axisGeometry.ts`, que es donde su propio
 *  comentario dice que viven «funciones y constantes». */
const LABEL_TYPOGRAPHY = {
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--text-label)',
  letterSpacing: '0.12em',
} as const

export function PlotBump({ value, family }: PlotProps<'seriesMultiples'>) {
  const { ref, w, h } = useSize()

  const series = value.series
  const n = series.length

  // El eje de períodos es la UNIÓN por orden de aparición, no los puntos de la
  // primera serie: una serie que arranca tarde tiene que poder entrar al ranking
  // sin que el eje la ignore.
  const eje: string[] = []
  for (const s of series) {
    for (const p of s.puntos) if (!eje.includes(p.t)) eje.push(p.t)
  }

  const porT = series.map((s) => new Map(s.puntos.map((p) => [p.t, p.v])))

  /** El puesto de cada serie EN CADA PERÍODO, recalculado columna por columna —
   *  que es lo único que un bump muestra: un ranking congelado en el primer
   *  instante acierta la primera columna y miente en todas las demás.
   *
   *  **Una serie sin punto en ese `t` no entra**, en vez de entrar con `?? 0` y
   *  quedar última: un ausente rankeado último es una afirmación sobre un dato
   *  que no existe. El idioma `?? 0` que usa `PlotStackArea` es correcto allá
   *  —no aportar a un total es cero— y es mentira acá.
   *
   *  **Y el empate no apila.** `sort` es estable, así que dos series con el mismo
   *  `v` conservan su orden de entrada y ocupan filas distintas. La fórmula
   *  natural del ranking competitivo —«1 + cuántas valen más»— les daría el mismo
   *  puesto, una taparía a la otra y el dibujo perdería una serie sin avisar. */
  const puestos = eje.map((t) => {
    const presentes = porT
      .map((m, i) => ({ i, v: m.get(t) }))
      .filter((e): e is { i: number; v: number } => e.v !== undefined)
    presentes.sort((a, b) => b.v - a.v)
    return new Map(presentes.map((e, k) => [e.i, k + 1]))
  })

  const height = Math.max(0, h - MARGIN.t - MARGIN.b)

  // **La escala de puestos NO se invierte**, que es al revés de todos los ejes de
  // valor del repertorio: allá `[height, 0]` pone el cero abajo, acá el #1 va
  // arriba. El inset de `DOT` a los dos lados es lo que impide que el punto del
  // primero y el del último se corten contra el borde.
  const puesto = linearScale([1, n], [DOT, Math.max(DOT, height - DOT)])

  const rotulos = Array.from({ length: n }, (_, i) => `#${i + 1}`)
  const reserveL = axisReserve(rotulos)
  const etiquetas = series.map((s) => s.etiqueta)
  const reserveR = Math.min(axisReserve(etiquetas), w * LABEL_MAX)
  const cap = charsThatFit(reserveR - GAP)

  const width = Math.max(0, w - reserveL - reserveR)
  const x = linearScale([0, Math.max(1, eje.length - 1)], [0, width])

  return (
    <div ref={ref} className="w-full h-full min-h-0">
      {/* Sin tamaño medido todavía no hay nada que dibujar: el primer frame
          renderiza el contenedor y el ResizeObserver dispara el segundo. */}
      {w > 0 && h > 0 && (
        // **El nombre no puede ser subconjunto de los otros dos de este cuerpo**
        // —`N series` y `N series apiladas`—: `graficoDeclarado` busca con
        // `/series/` y una etiqueta descuidada le cambia el sentido a una prueba
        // ajena.
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`Ranking de ${n} series en ${eje.length} períodos`}
        >
          <g transform={`translate(${reserveL},${MARGIN.t})`}>
            {/* **El `count` explícito importa**: el default de `Grid` es 4 y
                dibujaría cuatro rieles para seis series, o cuatro para tres. */}
            <Grid
              scale={puesto}
              orientation="horizontal"
              length={width}
              count={Math.max(0, n - 1)}
            />
            {series.map((s, i) => {
              const step = (i % RAMP) as 0 | 1 | 2 | 3 | 4
              const color = hue({ family, step })
              const marcas = eje
                .map((t, j) => ({ t, j, p: puestos[j]?.get(i) }))
                .filter((m): m is { t: string; j: number; p: number } => m.p !== undefined)
                .map((m) => ({ t: m.t, cx: x(m.j), cy: puesto(m.p) }))
              const last = marcas[marcas.length - 1]
              const texto = s.etiqueta.toUpperCase()
              return (
                <g key={s.etiqueta}>
                  {marcas.length > 0 && (
                    <path
                      d={marcas.map((m, k) => `${k === 0 ? 'M' : 'L'}${m.cx},${m.cy}`).join(' ')}
                      fill="none"
                      stroke={color}
                      strokeWidth={LINE_WIDTH}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  )}
                  {marcas.map((m) => (
                    <circle key={m.t} cx={m.cx} cy={m.cy} r={DOT} fill={color} />
                  ))}
                  {last !== undefined && (
                    <text
                      x={width + GAP}
                      y={last.cy}
                      textAnchor="start"
                      dominantBaseline="middle"
                      // `fill` va como ATRIBUTO de presentación y no dentro del
                      // `style`, al revés de `AxisText`: es lo que deja leerlo sin
                      // depender de qué propiedades CSS soporta el entorno.
                      fill={color}
                      style={LABEL_TYPOGRAPHY}
                    >
                      {texto.length > cap ? `${texto.slice(0, cap - 1)}…` : texto}
                    </text>
                  )}
                </g>
              )
            })}
            {/* El eje de períodos. `t` se pinta TAL CUAL LLEGA · ver cabecera. */}
            <g aria-hidden>
              {eje.map((t, j) => (
                <AxisText key={t} x={x(j)} y={height + 12} anchor="middle">
                  {t}
                </AxisText>
              ))}
            </g>
          </g>
          <g transform={`translate(0,${MARGIN.t})`} aria-hidden>
            {rotulos.map((r, i) => (
              <AxisText key={r} x={reserveL - GAP} y={puesto(i + 1)} anchor="end">
                {r}
              </AxisText>
            ))}
          </g>
        </svg>
      )}
    </div>
  )
}
