/** Las props de todo lo que vive en `render/`.
 *
 *  `render/` es PURO: recibe props, pinta, y emite eventos hacia arriba. No hace
 *  fetch, no lee contexto global, no sabe qué tenant es ni qué rol mira. Es lo
 *  que permite que el mismo panel sirva en la consola, en el builder y en la
 *  vista previa por rol sin una rama.
 */
import type { Actions, ChartId, Family, Presentation, Value } from '../api/types'
import type { Placement } from '../catalog/types'
import type { Formatter } from './format'

/** Lo que recibe todo CUERPO (`Body`).
 *
 *  `Extract` lo ata a su forma: un cuerpo de `categorica` no puede leer campos
 *  de una serie temporal, y eso lo verifica el compilador — no una prueba.
 *
 *  `P` son los params de LAYOUT (`PanelConfig.opciones`): interruptores de
 *  composición, no datos. Cada cuerpo declara los suyos con nombres y valores
 *  concretos, nunca `Record<string, unknown>`: un param mal escrito tiene que
 *  fallar, no ignorarse en silencio.
 */
/** Con qué se pinta: la familia del catálogo, o `consulta` · 2026-10-09.
 *
 *  `consulta` NO es una familia del catálogo y no se elige acá: la pone la
 *  superficie cuando el dato no es una métrica —una consulta libre del
 *  agente— y por eso no trae familia. Es la rampa neutra de
 *  `tokens/decisiones.css`, decisión humana mientras diseño decide (§14 de
 *  `PROPUESTA-2026-09-22-divergencias-con-el-pen.md`). Un cuerpo la trata como
 *  a cualquier otra: la pasa a `hue` y no sabe cuál le tocó. */
export type FamiliaDeDibujo = Family | 'consulta'

export type BodyProps<F extends Value['forma'], P = Record<string, never>> = {
  value: Extract<Value, { forma: F }>
  params: P
  span: Placement
  /** Del catálogo. El cuerpo pinta con el hue que le llega y NO SABE CUÁL ES
   *  · regla dura 1: la familia se lee del catálogo, nunca se elige acá. */
  family: FamiliaDeDibujo
  /** **Qué VARIANTE dibujar** · del layout, no del dato · 2026-09-28.
   *
   *  `tipo` eligió este cuerpo; esto elige el dibujo de adentro. Hacen falta los
   *  dos porque 16 de los 49 gráficos sirven a más de una forma.
   *
   *  **Ausente significa el gráfico por defecto del cuerpo**, que es lo que
   *  hacen los paneles publicados hoy. Y uno que el cuerpo no sepa dibujar
   *  **no cae al de por defecto**: se declara. Ver `UnknownPlotState`. */
  grafico?: ChartId
  /** Rótulos y cifras de apoyo, redactados por el backend. Viajan con el dato y
   *  no con el layout porque dependen del período. */
  presentation?: Presentation
  /** La unidad de la métrica, para las cifras. Viene de la MÉTRICA y no del
   *  valor: es una propiedad de lo que se mide, no de la medición de este mes.
   *  Escribirla en las dos partes habilitaba que dijeran distinto. */
  unit?: string
  /** El formateador del tenant · F1.13b. Se inyecta y no se importa: el locale
   *  no lo decide `render/`, que no sabe de qué tenant se trata. */
  format: Formatter
  /** Qué se puede hacer con cada ítem. Entra por props y sale por callback: el
   *  cuerpo no sabe quién persiste la respuesta. Ausente en la mayoría, que son
   *  de solo lectura. */
  actions?: Actions
  /** **Lleva el `accionableId`, no el `ref`.** El nombre decía `ref` y el cuerpo
   *  pasaba el id desde siempre: el que lo recibe tiene que llamar a
   *  `POST /config/accionables/{id}/respuesta`, así que el id del accionable es
   *  lo único que sirve. Corregido el 2026-09-04, al escribir la prueba que
   *  faltaba — un tipo que promete una cosa y entrega otra es cómo alguien pasa
   *  el `ref` un día y el 404 aparece en producción.
   *
   *  Que `Acciones` esté keyeado por `ref` es otra cosa y sigue igual: es lo que
   *  ata cada acción a su ítem cuando `tope` ya recortó la lista. */
  onRespond?: (accionableId: string, response: 'aceptado' | 'rechazado') => void
  /** El nombre de la métrica. **No se pinta**: el shell ya lo muestra como
   *  título y repetirlo sería ruido. Es para el árbol de accesibilidad — una
   *  cifra dentro de una fila se entiende a la vista por su columna, pero un
   *  lector de pantalla la encuentra suelta. */
  metric: string
}

/** Lo que recibe todo PLOT.
 *
 *  Un plot es SVG y nada más: no conoce la métrica, no conoce el período, no
 *  formatea por su cuenta. `format` se inyecta para que el locale lo decida
 *  quien sabe de qué tenant se trata — en v2 esto era una constante `es-MX`
 *  hardcodeada y por eso se declara acá desde el principio.
 */
export type PlotProps<F extends Value['forma']> = {
  value: Extract<Value, { forma: F }>
  family: FamiliaDeDibujo
  /** **Obligatorio, y ahí está el punto.** En v2 esta prop era opcional y cada
   *  plot caía a `formatearCifra`, que traía consigo el `es-MX` de módulo: la
   *  prop existía y estaba muerta. Exigirla es lo que hace que «ningún plot
   *  importa el formateador» sea verificable por el compilador y no por un
   *  grep. */
  format: (v: number) => string
}
