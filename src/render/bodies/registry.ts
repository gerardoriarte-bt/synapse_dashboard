/** `tipo` → cuerpo, con carga diferida y **sin `any`** · F1.13h
 *
 *  §14.4 de `nuevo-desarrollo.md` ejemplifica esto con `ComponentType<any>` y la
 *  regla 2 de §4 lo prohíbe: *«el v2 lo toleró en el registro de cuerpos; el
 *  front nuevo no»*. Las dos cosas no pueden ser ciertas a la vez, y gana la
 *  regla.
 *
 *  ── POR QUÉ HACE FALTA ESTRECHAR ALGO ────────────────────────────────────────
 *
 *  El registro no puede probar qué forma le toca a cada cuerpo. `KpiBody` acepta
 *  `escalar` y `ProseBody` acepta `prosa`, pero que el `tipo` del panel case con
 *  la `forma` de su métrica es un invariante **del catálogo**, no del sistema de
 *  tipos: lo valida el backend en `layout:validate`. Desde acá, el `value` que
 *  llega es la unión entera.
 *
 *  ── QUÉ SE ESTRECHA Y QUÉ NO ────────────────────────────────────────────────
 *
 *  Un `ComponentType<any>` entero apaga la verificación de TODAS las props, no
 *  solo de las dos que la necesitan. Eso significa que agregar una prop
 *  obligatoria a `BodyProps` compila igual y llega `undefined` en runtime — ya
 *  pasó en v2 al agregar `metrica`: el compilador marcó las pruebas y dejó pasar
 *  los tres sitios reales.
 *
 *  Acá `value` y `params` se anchan a `Value` y `unknown`, y **el resto conserva
 *  su tipo**. Agregar una prop obligatoria a `BodyProps` rompe la compilación en
 *  el sitio que monta el cuerpo, que es lo que pide el criterio.
 *
 *  La conversión vive en `adapt()` y en ningún otro lado: una línea, con su
 *  razón escrita, en vez de doce archivos tapados.
 */
import { lazy, memo } from 'react'
import type { ComponentType } from 'react'
import type { PanelType, Value } from '../../api/types'
import type { BodyProps } from '../types'
import type { TableBodyProps } from './TableBody'

/** Las props de un cuerpo visto desde afuera, sin saber cuál es. */
export type ErasedBodyProps = Omit<BodyProps<Value['forma']>, 'value' | 'params'> & {
  /** La unión completa, no `any`: quien monta pasa el valor que vino del
   *  payload y el compilador sigue exigiendo que sea UN valor del contrato. */
  value: Value
  /** `unknown` y no `any`: los params son `Record<string, unknown>` en el
   *  contrato y cada cuerpo declara los suyos. Un `unknown` no se puede leer sin
   *  estrecharlo; un `any` se lee mal en silencio. */
  params: unknown
}

export type PanelBody = ComponentType<ErasedBodyProps>

/** LA ÚNICA ESTRECHEZ DEL REGISTRO.
 *
 *  Un cuerpo concreto acepta props más estrechas que `ErasedBodyProps`, y las
 *  props de un componente son contravariantes: TypeScript rechaza la asignación
 *  con razón, porque no puede probar que el `value` que llegue sea de la forma
 *  que ese cuerpo acepta. Lo que la prueba es el catálogo, en tiempo de
 *  ejecución.
 *
 *  Así que se declara acá, una vez, con el invariante nombrado. Si alguna vez el
 *  backend deja de garantizarlo, este comentario dice exactamente qué se rompió.
 */
function adapt<F extends Value['forma'], P>(Body: ComponentType<BodyProps<F, P>>): PanelBody {
  return Body as unknown as PanelBody
}

type Loader = () => Promise<{ default: PanelBody }>

/** Cómo se trae cada cuerpo · §8, «no se descarga lo que no se muestra».
 *
 *  Cada entrada es un `import()`, así que el cuerpo **y los plots que arrastra**
 *  viajan en su propio chunk. Una pestaña usa cinco o seis tipos de los quince;
 *  el resto no se descarga.
 *
 *  **El `memo` se aplica acá y no en cada archivo.** Los cuerpos son funciones
 *  puras por contrato (§5.1) y son los que dibujan SVG, así que memoizarlos es
 *  trivial y efectivo. `lazy` invoca el cargador UNA vez y guarda el resultado,
 *  de modo que el `memo` se construye una sola vez y la identidad del componente
 *  es estable — que es lo que hace que memoizar sirva para algo.
 *
 *  Va en el registro porque **todos los sitios que renderizan un cuerpo pasan
 *  por `bodyFor`**: la grilla de la consola, el drill-down y el chat. Un solo
 *  lugar los cubre a los tres.
 *
 *  La comparación de `memo` es superficial: si algún día un cuerpo recibe un
 *  objeto construido en el render del padre, deja de servir en silencio.
 *
 *  ── **`Record` COMPLETO Y NO `Partial`, DESDE EL 2026-09-30 · F4.20** ────────
 *
 *  Con `Partial` un tipo nuevo en el enumerado del contrato compilaba sin cuerpo
 *  y se descubría en runtime, con `bodyFor` devolviendo `undefined`. Con el
 *  `Record` entero **no compila**, que es el mecanismo que `NOMBRE_DE_FORMA` de
 *  `adapt.ts` ya usaba para las formas y que su comentario anticipaba para acá:
 *  «es el mismo mecanismo que el criterio de F4.20 pide para el registro de
 *  cuerpos, acá donde sí se puede sostener hoy». Ahora se sostiene en los dos.
 *
 *  **`bodyFor` sigue devolviendo `PanelBody | undefined`** y eso no es
 *  redundante: su argumento sale de `block_type`, que en el cable es una cadena
 *  libre. `esTipo` lo filtra en el adaptador, pero el `undefined` es la red del
 *  día que alguien llame con un tipo que no pasó por ahí.
 */
export const LOADERS: Record<PanelType, Loader> = {
  kpi: () => import('./KpiBody').then((m) => ({ default: memo(adapt(m.KpiBody)) })),
  prose: () => import('./ProseBody').then((m) => ({ default: memo(adapt(m.ProseBody)) })),
  series: () => import('./SeriesBody').then((m) => ({ default: memo(adapt(m.SeriesBody)) })),
  bars: () => import('./BarsBody').then((m) => ({ default: memo(adapt(m.BarsBody)) })),
  table: () => import('./TableBody').then((m) => ({ default: memo(adapt(m.TableBody)) })),
  gauge: () => import('./GaugeBody').then((m) => ({ default: memo(adapt(m.GaugeBody)) })),
  forecast: () => import('./ForecastBody').then((m) => ({ default: memo(adapt(m.ForecastBody)) })),
  list: () => import('./ListBody').then((m) => ({ default: memo(adapt(m.ListBody)) })),
  reco: () => import('./RecoBody').then((m) => ({ default: memo(adapt(m.RecoBody)) })),
  composition: () =>
    import('./CompositionBody').then((m) => ({ default: memo(adapt(m.CompositionBody)) })),
  distribution: () =>
    import('./DistributionBody').then((m) => ({ default: memo(adapt(m.DistributionBody)) })),
  blocked: () => import('./BlockedBody').then((m) => ({ default: memo(adapt(m.BlockedBody)) })),
  // Los tres de las formas v1.1 · F4.17, F4.18 y F4.19, construidos el
  // 2026-09-30 contra las tres métricas que corrimos en Snowflake.
  comparison: () =>
    import('./ComparisonBody').then((m) => ({ default: memo(adapt(m.ComparisonBody)) })),
  matrix: () => import('./MatrixBody').then((m) => ({ default: memo(adapt(m.MatrixBody)) })),
  graph: () => import('./GraphBody').then((m) => ({ default: memo(adapt(m.GraphBody)) })),
}

/** **También `Record` completo**, y se construye recorriendo `LOADERS` en vez de
 *  con `Object.fromEntries`.
 *
 *  `fromEntries` devuelve `{ [k: string]: T }` y hacen falta DOS casts para
 *  llegar a un `Record` completo —el compilador avisa que los tipos «no se
 *  superponen»—, y un cast doble no lo verifica nadie. Recorriendo las claves de
 *  una fuente que YA es completa, el único cast es el del acumulador vacío, y lo
 *  que lo hace verdadero está a la vista en la línea siguiente: el bucle visita
 *  todas las claves de `LOADERS`, que es el `Record` completo de arriba. */
export const BODIES: Record<PanelType, PanelBody> = (() => {
  const out = {} as Record<PanelType, PanelBody>
  for (const type of Object.keys(LOADERS) as PanelType[]) out[type] = lazy(LOADERS[type])
  return out
})()

export const BUILT_TYPES = Object.keys(BODIES) as PanelType[]

/** **La tabla, montable sin familia** · 2026-10-09 · la usa `ChatFigure`.
 *
 *  Es LA MISMA instancia de `BODIES.table` —mismo chunk, mismo `memo`—, vista
 *  con un tipo que admite `family: null`. El cast tiene su invariante a la
 *  vista en la línea de abajo: `TableBodyProps` acepta `null`, y si alguien
 *  vuelve a hacer la familia obligatoria en `TableBody`, `_AceptaNull` deja de
 *  ser `true` y esto no compila. Es un `import type`, así que no arrastra el
 *  cuerpo al bundle principal. */
type _AceptaNull = null extends TableBodyProps['family'] ? true : never
const _aceptaNull: _AceptaNull = true
void _aceptaNull

export const TableWithoutFamily = BODIES.table as unknown as ComponentType<
  Omit<ErasedBodyProps, 'family'> & { family: null }
>

/** **VACÍA DESDE EL 2026-09-30, y se queda como lista.**
 *
 *  Tenía los tres de las formas v1.1 —`comparison`, `matrix`, `graph`— con la
 *  razón de que ningún endpoint las devolvía. Las tres métricas que las emiten se
 *  escribieron y corrieron contra Snowflake el 2026-09-30 —`platform_gap`,
 *  `platform_month_matrix` y `spend_flow`—, así que la razón venció y los tres
 *  cuerpos existen.
 *
 *  **No se borra**, y no es por compatibilidad: es el enunciado del que
 *  `registry.test.tsx` deriva la paridad contra el enumerado del contrato. Vacía
 *  afirma algo —«ningún tipo del contrato se quedó sin cuerpo»— y el día que el
 *  contrato gane uno, la única forma de volver a compilar es agregarlo a
 *  `LOADERS` o declararlo acá con su razón.
 *
 *  **Lo que sí hay que cuidar es su prueba.** Un caso negativo cuyo ejemplo
 *  desaparece queda verificando una lista vacía, que es el patrón que en este
 *  repositorio apareció tres veces en un día. Está resuelto en
 *  `registry.test.tsx`, con un tipo inventado en lugar de uno de esta lista. */
export const MISSING_TYPES: PanelType[] = []

/** Un tipo sin cuerpo registrado da `undefined` y **quien llama decide**.
 *
 *  No hay fallback silencioso · F1.22 y §1 principio 6: pintar el cuerpo de otro
 *  tipo, o una caja vacía, convierte un error de composición en una pantalla que
 *  parece correcta. La superficie muestra el error con el tipo adentro. */
export function bodyFor(type: PanelType): PanelBody | undefined {
  return BODIES[type]
}

/** Trae los cuerpos de estos tipos ANTES de que haya datos que dibujar.
 *
 *  Sin esto, `lazy` recién pide el chunk cuando el panel intenta renderizar el
 *  cuerpo —o sea cuando ya llegó el dato— y el panel parpadea en esqueleto un
 *  rato más por una descarga que se podía haber hecho mientras tanto.
 *
 *  Con esto, en cuanto `/config/tabs` dice qué tipos tiene la pestaña, los
 *  chunks viajan EN PARALELO con `panels:batch`. Cuando llega el dato, el cuerpo
 *  ya está. Es lo que hace que partir en chunks no compre latencia. */
export function preloadBodies(types: readonly PanelType[]): void {
  for (const type of new Set(types)) void LOADERS[type]?.()
}
