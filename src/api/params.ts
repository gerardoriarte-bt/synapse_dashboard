/** Validación de los params de layout · F1.29
 *
 *  `PanelConfigurado.opciones` llega como `Record<string, unknown>`. Hoy un
 *  tenant que configure `orden: "ascending"` en vez de `"asc"` **no falla: se
 *  ignora**, el cuerpo aplica su default y el panel se ve correcto mostrando
 *  algo distinto de lo que alguien pidió. Con composición por tenant eso deja de
 *  ser hipotético.
 *
 *  ── DÓNDE VIVE, Y POR QUÉ ACÁ ───────────────────────────────────────────────
 *
 *  **En `api/`, no en `render/`.** Es la frontera de §4: un cuerpo recibe props
 *  ya resueltas y no valida su entrada, porque si validara tendría que decidir
 *  qué hacer cuando falla — y esa decisión es de la superficie. Acá se valida una
 *  vez, al adaptar la respuesta, y lo que baja está limpio.
 *
 *  ── DE DÓNDE SALE EL ESQUEMA ────────────────────────────────────────────────
 *
 *  **A medias del contrato, y hay que decirlo.** `/config/blocks` declara
 *  `paramsDisponibles` como `string[]`: los NOMBRES válidos por tipo, y nada
 *  más. No trae ni los valores admitidos ni los defaults.
 *
 *  Así que la validación se parte en dos, con distinta autoridad:
 *
 *  - **Qué params existen** → lo dice el backend. `unknownParams` compara contra
 *    `paramsDisponibles` y un nombre que no está se descarta.
 *  - **Qué valores son válidos** → lo dice esta tabla, porque el contrato no lo
 *    declara. Es duplicación con lo que cada cuerpo acepta en TypeScript, y es
 *    inevitable: los tipos se borran al compilar y `opciones` llega en runtime.
 *
 *  **Propuesta de spec:** que `paramsDisponibles` deje de ser `string[]` y pase a
 *  declarar tipo, valores y default por param. Ahí esta tabla desaparece y el
 *  drift entre front y backend se vuelve imposible en vez de verificable. Va con
 *  B0.9.
 */
import type { Block, PanelConfig, PanelType } from './types'

export type ParamSpec =
  | { kind: 'enum'; values: readonly string[] }
  | { kind: 'number'; min?: number; integer?: boolean }
  | { kind: 'string' }
  | { kind: 'boolean' }
  | { kind: 'array' }
  | { kind: 'object' }

/** Lo que cada cuerpo REALMENTE lee. No es la lista de §7 de
 *  `nuevo-desarrollo.md`: esa enumera params de diseño que en varios tipos
 *  todavía no están implementados —`marca` en bars, `estadisticos` en
 *  distribution—, y declararlos acá haría pasar como válido algo que ningún
 *  componente mira. Lo que no se lee, no se valida: se descarta como
 *  desconocido, que es información. */
const SCHEMAS = {
  // **Los dos son INTERRUPTORES, no contenido** · corregido el 2026-09-22.
  // Hasta hoy decían `array` y `object`, que era cierto antes de F1.40: el
  // rótulo, el medidor y los comparativos venían en `opciones`. F1.40 los mudó
  // a `presentacion` —los escribe el backend, no quien compone el layout— y el
  // param quedó siendo lo único que el layout sigue decidiendo: si se muestran.
  // Así los declara `KpiParams` desde entonces; esta tabla no se actualizó.
  //
  // El servicio manda `{"meter": true, "comparative": true}` —capturado el
  // 2026-09-22 de `/config/tabs/{id}` contra el binario local— y con el esquema
  // viejo los SEIS paneles `kpi` del layout sembrado salían BLOQUEADO.
  //
  // **MSW no lo delataba**: nuestros mocks nunca mandaron `meter`.
  kpi: {
    comparativo: { kind: 'boolean' },
    medidor: { kind: 'boolean' },
  },
  prose: { pilares: { kind: 'number', min: 1, integer: true } },
  series: { normalizacion: { kind: 'enum', values: ['ninguna', 'base100'] } },
  bars: {
    orden: { kind: 'enum', values: ['desc', 'asc', 'natural'] },
    tope: { kind: 'number', min: 1, integer: true },
  },
  table: {
    columnas: { kind: 'array' },
    orden: { kind: 'object' },
  },
  gauge: {
    maximo: { kind: 'number', min: 0 },
    banda: { kind: 'object' },
  },
  forecast: {
    horizonte: { kind: 'string' },
    corte: { kind: 'number', min: 0, integer: true },
  },
  list: {
    tope: { kind: 'number', min: 1, integer: true },
    orden: { kind: 'enum', values: ['posicion', 'desc', 'asc'] },
  },
  reco: {
    tope: { kind: 'number', min: 1, integer: true },
    ventana: { kind: 'string' },
  },
  composition: { orden: { kind: 'enum', values: ['desc', 'natural'] } },
  distribution: { bins: { kind: 'number', min: 1, integer: true } },
  blocked: {
    razon: { kind: 'string' },
    desbloqueaCon: { kind: 'string' },
  },
  // **`as const satisfies` y no una anotación** · 2026-09-22. Con la anotación,
  // `medidor` era `ParamSpec` a secas y el `kind` se perdía: ningún tipo podía
  // enterarse de que el esquema decía `object` donde `KpiParams` dice `boolean`.
  // Conservando el literal, `tests/api/params-esquema.ts` cruza esta tabla
  // contra los `*Params` de cada cuerpo **en tiempo de compilación**, y la
  // deriva que hubo que medir a mano hoy pasa a romper `typecheck`.
} as const satisfies Partial<Record<PanelType, Record<string, ParamSpec>>>

/** La tabla con los `kind` SIN ensanchar. **Es un tipo y no un valor**: lo
 *  consume el cruce de `tests/api/params-esquema.ts` contra los `*Params` de
 *  cada cuerpo, y nadie más. */
export type ParamSchemas = typeof SCHEMAS

/** La tabla como la usa el código: ensanchada, indexable por cualquier
 *  `PanelType`. El literal no lo es —sólo declara los tipos que tienen params—
 *  y todo consumidor indexa con la unión entera. */
export const PARAM_SCHEMAS: Partial<Record<PanelType, Record<string, ParamSpec>>> = SCHEMAS

/** Qué valores acepta un param, en la lengua del producto.
 *
 *  **Exportada desde F4.10**, para que el configurador del builder muestre
 *  exactamente lo que el validador acepta. Si el builder escribiera su propia
 *  descripción, la pantalla diría «desc, asc» el día que el esquema sume
 *  «natural» y nadie se enteraría hasta que un panel saliera degradado. */
export function describirParam(spec: ParamSpec): string {
  switch (spec.kind) {
    case 'enum':
      return spec.values.map((v) => `«${v}»`).join(', ')
    case 'number':
      return `un número${spec.integer === true ? ' entero' : ''}${spec.min === undefined ? '' : ` de ${spec.min} en adelante`}`
    case 'string':
      return 'un texto'
    case 'boolean':
      return '«true» o «false»'
    case 'array':
      return 'una lista'
    case 'object':
      return 'un objeto'
  }
}

function isValid(spec: ParamSpec, value: unknown): boolean {
  switch (spec.kind) {
    case 'enum':
      return typeof value === 'string' && spec.values.includes(value)
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) return false
      if (spec.integer === true && !Number.isInteger(value)) return false
      return spec.min === undefined || value >= spec.min
    case 'string':
      return typeof value === 'string'
    case 'boolean':
      return typeof value === 'boolean'
    case 'array':
      return Array.isArray(value)
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value)
  }
}

export type ParamProblem = { param: string; reason: string }

export type ValidatedParams = {
  /** Lo que baja al cuerpo. Solo lo conocido y válido. */
  params: Record<string, unknown>
  /** Nombres que nadie lee. Se descartan; en desarrollo se avisan. */
  unknown: string[]
  /** Nombres conocidos con un valor que el cuerpo no puede usar. **Degradan el
   *  panel**: usar el default sería mostrar algo distinto de lo que se pidió y
   *  no decirlo. */
  invalid: ParamProblem[]
}

/** Valida `opciones` contra el esquema del tipo y contra `paramsDisponibles`.
 *
 *  `available` sale de `/config/blocks`. Si no llegó —el catálogo de bloques es
 *  una llamada aparte y puede fallar sola— se valida solo contra el esquema
 *  local: menos cobertura, pero mejor que no validar. */
export function validateParams(
  type: PanelType,
  options: Record<string, unknown> | undefined,
  available?: readonly string[],
): ValidatedParams {
  const schema = PARAM_SCHEMAS[type] ?? {}
  const out: ValidatedParams = { params: {}, unknown: [], invalid: [] }

  for (const [param, value] of Object.entries(options ?? {})) {
    const spec = schema[param]
    const declared = available === undefined || available.includes(param)

    if (spec === undefined || !declared) {
      out.unknown.push(param)
      continue
    }

    if (!isValid(spec, value)) {
      out.invalid.push({
        param,
        reason: `«${param}» tiene el valor ${JSON.stringify(value)} y espera ${describirParam(spec)}`,
      })
      continue
    }

    out.params[param] = value
  }

  return out
}

/** Adapta un panel: devuelve sus params limpios, o la razón por la que no se
 *  puede componer.
 *
 *  **Un param inválido no se ignora ni se reemplaza por el default.** Ignorarlo
 *  es el defecto que esta tarea arregla; reemplazarlo en silencio es peor,
 *  porque el panel se ve bien mostrando otra cosa. El panel se degrada con la
 *  razón visible, que es lo que §8 pide: qué pasa, por qué, y qué lo desbloquea.
 */
export function adaptPanelParams(
  panel: PanelConfig,
  blocks: readonly Block[] | undefined,
): ValidatedParams {
  const block = blocks?.find((b) => b.tipo === panel.tipo)
  const result = validateParams(panel.tipo, panel.opciones, block?.paramsDisponibles)

  // El aviso es de DESARROLLO. En producción un param desconocido ya se
  // descartó, y llenar la consola del navegador del usuario con un problema
  // que solo puede resolver quien compone el layout no le sirve a nadie.
  if (import.meta.env.DEV && result.unknown.length > 0) {
    console.warn(
      `[synapse] panel ${panel.id} (${panel.tipo}): params desconocidos, descartados: ` +
        result.unknown.join(', '),
    )
  }

  return result
}

/** Los nombres que este front sabe leer para un tipo. Existe para que un chequeo
 *  pueda compararlos con `paramsDisponibles` y detectar la deriva entre las dos
 *  mitades del esquema — la que declara el backend y la que declara esta tabla. */
export function knownParams(type: PanelType): string[] {
  return Object.keys(PARAM_SCHEMAS[type] ?? {})
}
