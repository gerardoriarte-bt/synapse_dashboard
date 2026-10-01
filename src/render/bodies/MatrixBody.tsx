/** `matrix` · forma `matriz` · colSpan 6–12, rowSpan 5–7 · F4.18
 *
 *  ── LA GUARDIA DE DENSIDAD ES DE ACÁ, Y ESTABA ANOTADA COMO PENDIENTE ───────
 *
 *  `ValorMatriz` declara una matriz **densa**: «una fila por cada `filas`, en el
 *  mismo orden, y dentro una celda por cada `columnas` … si faltan filas o
 *  columnas respecto de las etiquetas, el cuerpo no puede dibujarla y lo dice».
 *
 *  `PlotHeatmap` cumple su mitad —una celda ausente no se pinta, y su comentario
 *  explica por qué `celdas[r]?.[c] ?? null` sería peor: pintaría un tablero
 *  prolijo donde el contorno afirma «no hay dato cargado» cuando lo que hay es
 *  una matriz rala—, y deja la declaración para este cuerpo. Acá está.
 *
 *  **`null` y AUSENTE no son lo mismo, y la distinción es la misma que ya costó
 *  en A5 y en A1.** `null` es una celda que el backend declara sin dato y se
 *  dibuja con su contorno; una celda que **falta** es un payload mal formado, y
 *  eso no es un hueco del negocio sino un error del que produjo el dato. Por eso
 *  la fila corta no se rellena con `null`: se dice.
 *
 *  ── EL MÍNIMO NO SE COMPRUEBA ACÁ, Y NO ES UN OLVIDO ────────────────────────
 *
 *  El repertorio declara `filas < 2 o columnas < 2 → «una matriz de una fila es
 *  un gráfico de barras»` para los cuatro gráficos de esta forma, y **lo hace
 *  cumplir la consola**: `plotProblemOf` en `ConsoleContainer` evalúa el
 *  repertorio contra el valor y reemplaza el cuerpo antes de montarlo. Repetirlo
 *  acá pondría el umbral en dos lugares, y el día que el repertorio lo cambie
 *  uno de los dos se queda viejo.
 *
 *  ── TRES DE LOS CUATRO, Y EL CUARTO DECLARADO ───────────────────────────────
 *
 *  `matriz` es la forma con más gráficos: `heatmap`, `cohort`, `calendar` y
 *  `matrix`. **`cohort` y `calendar` se construyeron el 2026-10-01** y se
 *  cablean acá; `matrix` —la tabla cruda— sigue sin componente y se declara con
 *  `UnknownPlotState`.
 *
 *  Los cuatro son **la misma rejilla con otra lectura** —cohortes por
 *  antigüedad, calendario por día del año, la tabla cruda— y por eso ninguno cae
 *  a `heatmap`: se vería correcto y sería otra cosa. Esa es la razón de que la
 *  lista sea blanca y no un `default`.
 *
 *  **Y el cableado llegó tarde a propósito de nada.** Los dos plots quedaron
 *  escritos y probados mientras `DIBUJA` seguía en `['heatmap']`, así que un
 *  panel con `grafico: 'calendar'` caía a `UnknownPlotState` y los dos
 *  componentes eran inalcanzables desde la aplicación. Lo dijeron sus propios QA
 *  —«las 23 pruebas demuestran que el calendario dibuja bien, no que se
 *  dibuje»—; ninguna prueba del plot podía verlo, porque todas lo montan
 *  directo.
 *
 *  ── `scale` NO SE LEE ───────────────────────────────────────────────────────
 *
 *  El único `layout_param` del bloque, y el que decidiría si la rampa cuantiza
 *  lineal o logarítmica. **`levels()` cuantiza lineal y eso está clavado en
 *  `PlotHeatmap`**, con su prueba; leer el param acá sin que el plot sepa
 *  cambiarlo sería declararlo válido para que no haga nada. Queda desconocido con
 *  aviso, que es información.
 *
 *  Y con este dato la escala logarítmica no es teórica: la matriz real de paid
 *  media va de `0,04` a `9.099.434` en la misma rejilla, así que la lineal deja
 *  casi todo en el primer escalón. Es una propuesta de spec, no una rama.
 */
import { PlotCalendar } from '../plots/PlotCalendar'
import { PlotCohort } from '../plots/PlotCohort'
import { PlotHeatmap } from '../plots/PlotHeatmap'
import { ErrorState } from '../states/ErrorState'
import { UnknownPlotState } from '../states/UnknownPlotState'
import type { BodyProps } from '../types'

/** Los gráficos que este cuerpo sabe dibujar HOY. Tres de los cuatro de `matriz`. */
const DIBUJA = ['heatmap', 'cohort', 'calendar'] as const

/** **`heatmap` es el de por defecto porque es el que no asume nada del eje.**
 *  `cohort` lee las columnas como ANTIGÜEDAD —períodos desde el alta— y
 *  `calendar` como DÍAS DEL AÑO; las dos son lecturas del eje que el payload no
 *  declara, así que elegirlas es de quien compone el panel. */
const DEFECTO = 'heatmap'

export type MatrixParams = Record<string, never>

export function MatrixBody({ value, family, grafico, format }: BodyProps<'matriz', MatrixParams>) {
  // La comprobación va ANTES de dibujar y con lista blanca · mismo idioma que
  // `DistributionBody`: resuelta dentro de una rama, la rama que se olvide se ve
  // bien.
  const conocidos: readonly string[] = DIBUJA
  if (grafico !== undefined && !conocidos.includes(grafico)) {
    return <UnknownPlotState grafico={grafico} />
  }

  // **Se compara contra las DOS listas de etiquetas**, no sólo contra el largo de
  // `celdas`. Una matriz con las filas justas y una fila corta pasa el primer
  // control y pierde columnas en silencio, que es el caso que hay que atajar.
  //
  // **Es `ErrorState` y no `EmptyState`**, y la diferencia importa: «Sin datos»
  // le atribuiría al negocio un hueco que es del payload. Una fila corta no es
  // una hora sin ventas: es una matriz mal formada, y su dueño es quien la
  // produjo. El detalle fijo de ese estado —«el resto de los paneles cargó
  // normalmente»— es cierto acá, porque un valor mal formado no afecta a los
  // demás.
  const filaCorta = value.celdas.findIndex((f) => f.length !== value.columnas.length)
  if (value.celdas.length !== value.filas.length) {
    return (
      <ErrorState
        message={`La matriz llegó incompleta · ${value.filas.length} etiquetas de fila y ${value.celdas.length} filas de celdas`}
      />
    )
  }
  if (filaCorta !== -1) {
    return (
      <ErrorState
        message={`La matriz llegó incompleta · la fila ${filaCorta + 1} trae ${value.celdas[filaCorta]?.length ?? 0} celdas y hay ${value.columnas.length} columnas`}
      />
    )
  }

  const figure = (v: number) => format.number(v, { abbreviate: true })

  // El defecto se resuelve una vez y por la constante, no por el orden de las
  // ramas · mismo idioma que `ComparisonBody`.
  const elegido = grafico ?? DEFECTO

  if (elegido === 'cohort') {
    return (
      <div className="h-full min-h-0">
        <PlotCohort value={value} family={family} format={figure} />
      </div>
    )
  }

  if (elegido === 'calendar') {
    return (
      <div className="h-full min-h-0">
        <PlotCalendar value={value} family={family} format={figure} />
      </div>
    )
  }

  return (
    <div className="h-full min-h-0">
      <PlotHeatmap value={value} family={family} format={figure} />
    </div>
  )
}
