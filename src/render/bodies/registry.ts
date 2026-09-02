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
 */
export const LOADERS: Partial<Record<PanelType, Loader>> = {
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
}

export const BODIES: Partial<Record<PanelType, PanelBody>> = Object.fromEntries(
  Object.entries(LOADERS).map(([type, load]) => [type, lazy(load)]),
)

export const BUILT_TYPES = Object.keys(BODIES) as PanelType[]

/** Los tres del contrato que todavía no tienen cuerpo.
 *
 *  **DOCE DE QUINCE, y los doce son todos los que alguna pestaña usa.** Los tres
 *  que faltan —`comparison`, `matrix`, `graph`— son las formas v1.1 de §8.12:
 *  ningún endpoint las devuelve todavía, así que construirlos hoy sería escribir
 *  contra formas inventadas. Los cierran F4.17, F4.18 y F4.19.
 *
 *  Se declaran para que una prueba pueda afirmar que los que faltan son
 *  exactamente estos, y no que se perdió uno sin que nadie lo note. Cuando estén
 *  los quince, `BODIES` pasa a `Record<PanelType, PanelBody>` completo y agregar
 *  un tipo al enumerado sin su cuerpo deja de compilar — que es lo que pide §2.4
 *  y lo que cierra F4.20. */
export const MISSING_TYPES: PanelType[] = ['comparison', 'matrix', 'graph']

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
