/** El esquema de params contra lo que cada cuerpo declara · en COMPILACIÓN
 *
 *  **No es una prueba: es una aserción de tipos.** No tiene `it` ni `expect` y
 *  vitest no lo recoge —no se llama `.test.ts`—. Lo corre `npm run typecheck`,
 *  que `tsconfig.test.json` extiende sobre `tests/`, y por ahí entra a la
 *  puerta.
 *
 *  ── POR QUÉ EXISTE ──────────────────────────────────────────────────────────
 *
 *  `PARAM_SCHEMAS` duplica en runtime lo que cada `*Params` declara en tipos, y
 *  esa duplicación es inevitable mientras `/config/blocks` mande sólo los
 *  NOMBRES —está escrito en `src/api/params.ts` y es propuesta de spec—. Lo que
 *  no es inevitable es que las dos mitades **deriven en silencio**.
 *
 *  Y derivaron. F1.40 mudó el rótulo, el medidor y los comparativos de
 *  `opciones` a `presentacion`; `KpiParams` pasó a declarar dos booleanos
 *  —interruptores— y el esquema se quedó diciendo `array` y `object`. Entre esa
 *  fecha y el **2026-09-22** el validador rechazó todo `{"meter": true}` que
 *  llegara: los **seis** paneles `kpi` del layout sembrado salían BLOQUEADO,
 *  y el que abría la consola leía «"medidor" tiene el valor true y espera un
 *  objeto» sin manera de saber quién de los dos tenía razón.
 *
 *  **Nada lo vio**: ni el compilador —las dos mitades no se tocaban—, ni el
 *  lint, ni las 778 pruebas, ni MSW, cuyos mocks nunca mandaron `meter`. Se
 *  midió a mano contra el servicio local.
 *
 *  ── QUÉ COMPRUEBA, Y QUÉ NO ─────────────────────────────────────────────────
 *
 *  1. **Los nombres, exactos en los dos sentidos.** Un param en el esquema que
 *     el cuerpo no lee pasa la validación y no hace nada; uno en el cuerpo que
 *     el esquema no declara se descarta como desconocido y tampoco. Las dos
 *     mitades de «lo que no se lee, no se valida».
 *  2. **El tipo que cada `kind` deja pasar.** Es lo que faltaba: `boolean`
 *     contra `object` es exactamente la deriva de arriba.
 *
 *  **Lo único que no comprueba es el CONTENIDO de `array` y `object`.**
 *  `columnas` es `string[]` en `TableParams` y el esquema sólo sabe decir «una
 *  lista», porque `ParamSpec` no describe elementos; exigir la equivalencia
 *  obligaría a inventar una gramática de esquemas para dos params. La salida
 *  buena es la que ya está propuesta: que el contrato declare tipo, valores y
 *  default, y esta tabla desaparezca. **Que sea una lista, o que sea un objeto
 *  y no un booleano, sí se comprueba** — ver `Matches`, que es donde eso estuvo
 *  mal en el primer intento.
 */
import type { ParamSchemas } from '@/api/params'
import type { BarsParams } from '@/render/bodies/BarsBody'
import type { BlockedParams } from '@/render/bodies/BlockedBody'
import type { CompositionParams } from '@/render/bodies/CompositionBody'
import type { DistributionParams } from '@/render/bodies/DistributionBody'
import type { ForecastParams } from '@/render/bodies/ForecastBody'
import type { GaugeParams } from '@/render/bodies/GaugeBody'
import type { KpiParams } from '@/render/bodies/KpiBody'
import type { ListParams } from '@/render/bodies/ListBody'
import type { ProseParams } from '@/render/bodies/ProseBody'
import type { RecoParams } from '@/render/bodies/RecoBody'
import type { SeriesParams } from '@/render/bodies/SeriesBody'
import type { TableParams } from '@/render/bodies/TableBody'

/** Qué valores deja pasar `isValid` para cada `kind`. Es la contracara en tipos
 *  de ese `switch`, y hay que moverla con él. */
type Passes<S> = S extends { kind: 'enum'; values: readonly (infer V)[] }
  ? V
  : S extends { kind: 'number' }
    ? number
    : S extends { kind: 'string' }
      ? string
      : S extends { kind: 'boolean' }
        ? boolean
        : S extends { kind: 'array' }
          ? readonly unknown[]
          : S extends { kind: 'object' }
            ? object
            : ['kind que `Passes` no conoce', S]

/** El `kind` contra el tipo del cuerpo. Devuelve `true` o el porqué, para que
 *  el error de compilación diga qué no coincide en vez de «no asignable».
 *
 *  **`array` y `object` se comparan por categoría, no por contenido**, y esa
 *  línea hay que trazarla fina. La primera versión eximía los dos enteros y
 *  **la mutación que importaba sobrevivió**: con `medidor: { kind: 'object' }`
 *  contra `medidor?: boolean` —la deriva real del 2026-09-22— el primer brazo
 *  devolvía `true` y el chequeo se quedaba mirando. Lo que el esquema no puede
 *  describir son los ELEMENTOS de la lista y los CAMPOS del objeto; que sea una
 *  lista, o que sea un objeto y no un booleano, sí lo puede afirmar. */
type Matches<S, T> = S extends { kind: 'array' }
  ? T extends readonly unknown[]
    ? true
    : ['el esquema deja pasar una lista', 'y el cuerpo espera', T]
  : S extends { kind: 'object' }
    ? T extends readonly unknown[]
      ? ['el esquema deja pasar un objeto', 'y el cuerpo espera una lista', T]
      : T extends object
        ? true
        : ['el esquema deja pasar un objeto', 'y el cuerpo espera', T]
    : Passes<S> extends T
      ? true
      : ['el esquema deja pasar', Passes<S>, 'y el cuerpo espera', T]

type Compare<T extends keyof ParamSchemas, P> =
  Exclude<keyof ParamSchemas[T], keyof P> extends never
    ? Exclude<keyof P, keyof ParamSchemas[T]> extends never
      ? {
          [K in keyof ParamSchemas[T] & keyof P]: Matches<ParamSchemas[T][K], NonNullable<P[K]>>
        }
      : ['el cuerpo lee params que el esquema no declara', Exclude<keyof P, keyof ParamSchemas[T]>]
    : ['el esquema declara params que el cuerpo no lee', Exclude<keyof ParamSchemas[T], keyof P>]

type Ok<X> = X extends Record<string, true> ? true : X

/** El constraint es la aserción: si `Compare` devolvió una tupla en vez de
 *  puros `true`, no extiende `true` y **la compilación falla mostrando la
 *  tupla**. */
type Expect<X extends true> = X

/* Un tipo por cuerpo. Se exportan porque `noUnusedLocals` está encendido, y
   porque el nombre es lo que se lee en el error. */
export type EsquemaKpi = Expect<Ok<Compare<'kpi', KpiParams>>>
export type EsquemaProse = Expect<Ok<Compare<'prose', ProseParams>>>
export type EsquemaSeries = Expect<Ok<Compare<'series', SeriesParams>>>
export type EsquemaBars = Expect<Ok<Compare<'bars', BarsParams>>>
export type EsquemaTable = Expect<Ok<Compare<'table', TableParams>>>
export type EsquemaGauge = Expect<Ok<Compare<'gauge', GaugeParams>>>
export type EsquemaForecast = Expect<Ok<Compare<'forecast', ForecastParams>>>
export type EsquemaList = Expect<Ok<Compare<'list', ListParams>>>
export type EsquemaReco = Expect<Ok<Compare<'reco', RecoParams>>>
export type EsquemaComposition = Expect<Ok<Compare<'composition', CompositionParams>>>
export type EsquemaDistribution = Expect<Ok<Compare<'distribution', DistributionParams>>>
export type EsquemaBlocked = Expect<Ok<Compare<'blocked', BlockedParams>>>
