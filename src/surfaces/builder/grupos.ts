/** Los cinco grupos de la biblioteca de tipos · F4.9
 *
 *  §7.2: «Panel lateral izquierdo con la biblioteca de gráficos agrupada
 *  (Comparación · Composición · Evolución · Distribución · Estado)».
 *
 *  **La spec nombra los grupos y no dice qué tipo va en cuál.** El reparto sale
 *  del frame `B2 · Canvas de composición` del `.pen`, que los tiene dibujados uno
 *  por uno.
 *
 *  ── ESTA TABLA ES DEL FRONT, Y ESO ES UNA DEUDA DECLARADA ───────────────────
 *
 *  `/config/blocks` manda los quince tipos con sus formas aceptadas y sus rangos
 *  de span, **y no manda el grupo**. Así que el agrupado vive acá, igual que
 *  `PARAM_SCHEMAS` vive acá porque el contrato no declara los valores de cada
 *  param. Es la misma clase de duplicación y merece la misma propuesta de spec:
 *  que `/config/blocks` gane un `grupo` por tipo.
 *
 *  **Mientras tanto, un tipo nuevo del backend NO desaparece.** `agrupar` deja
 *  fuera de los cinco a lo que no conoce y lo devuelve aparte: un tipo que el
 *  servicio agregue y esta tabla no tenga se ve, con su rótulo, en vez de no
 *  existir. Es la misma decisión que `adaptCatalog` toma con una forma
 *  desconocida — no se descarta en silencio.
 */
import type { Block } from '../../api/types'

export const GRUPOS = ['Comparación', 'Composición', 'Evolución', 'Distribución', 'Estado'] as const

export type Grupo = (typeof GRUPOS)[number]

/** Del `.pen` · frame `B2 · Canvas de composición`, panel «Biblioteca». */
const DE_TIPO: Readonly<Record<string, Grupo>> = {
  bars: 'Comparación',
  comparison: 'Comparación',
  table: 'Comparación',
  list: 'Comparación',

  composition: 'Composición',

  series: 'Evolución',
  forecast: 'Evolución',

  distribution: 'Distribución',
  matrix: 'Distribución',
  graph: 'Distribución',

  kpi: 'Estado',
  gauge: 'Estado',
  prose: 'Estado',
  reco: 'Estado',
  blocked: 'Estado',
}

export type Biblioteca = {
  grupos: { grupo: Grupo; bloques: Block[] }[]
  /** Tipos que el servicio manda y esta tabla no conoce. **No se descartan.** */
  sinGrupo: Block[]
}

export function agrupar(bloques: readonly Block[]): Biblioteca {
  const porGrupo = new Map<Grupo, Block[]>(GRUPOS.map((g) => [g, []]))
  const sinGrupo: Block[] = []

  for (const b of bloques) {
    const g = DE_TIPO[b.tipo]
    if (g === undefined) sinGrupo.push(b)
    else porGrupo.get(g)?.push(b)
  }

  return {
    // **Los cinco van siempre, en el orden de §7.2**, incluso vacíos: un grupo
    // que desaparece porque el servicio no mandó ninguno de sus tipos se lee
    // como que ese grupo no existe.
    grupos: GRUPOS.map((grupo) => ({ grupo, bloques: porGrupo.get(grupo) ?? [] })),
    sinGrupo,
  }
}
