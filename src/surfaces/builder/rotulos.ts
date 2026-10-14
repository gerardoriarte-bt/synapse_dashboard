/** Los rótulos de producto de los tipos de panel y de las formas · 2026-10-06
 *
 *  **D6 de la auditoría, decidido por el humano: «Definirlo».** Hasta hoy el
 *  builder pintaba los ids del contrato —`bars`, `comparison`,
 *  `ESCALARCONINTERVALO`— porque ningún lado declaraba otro nombre:
 *  `/config/blocks` no trae rótulo y el catálogo es dueño del copy que describe
 *  DATOS, no del que describe la caja donde se pintan.
 *
 *  **El id del contrato no se traduce y no se toca**: `panel.tipo` sigue
 *  diciendo `bars` en el cable y en el borrador. Esto es sólo cómo se lo
 *  NOMBRA en pantalla, y vive en el builder porque es la única superficie que
 *  nombra tipos — la consola dibuja el panel, no habla de él.
 *
 *  Las descripciones salen de la tabla de §6 de `design.md`, recortadas a lo
 *  que ayuda a elegir.
 *
 *  **`Record` sobre la unión del contrato, a propósito**: el día que el yaml
 *  agregue un tipo o una forma, esto deja de compilar en vez de pintar el id
 *  crudo en silencio. Lo que llegue por el cable y la unión todavía no conozca
 *  —un tipo nuevo del servicio— cae al id, que es mejor que nada.
 */
import type { PanelType, Shape } from '../../api/types'

export const TIPOS: Readonly<Record<PanelType, { nombre: string; descripcion: string }>> = {
  kpi: { nombre: 'Indicador', descripcion: 'Una cifra grande con su medidor y su contexto' },
  prose: { nombre: 'Resumen en prosa', descripcion: 'Un titular y sus pilares, con las cifras clave' },
  series: { nombre: 'Serie temporal', descripcion: 'Una o más series a lo largo del tiempo' },
  bars: { nombre: 'Barras', descripcion: 'Categorías comparadas, con su valor' },
  table: { nombre: 'Tabla', descripcion: 'Filas y columnas, con los números a la derecha' },
  gauge: { nombre: 'Medidor', descripcion: 'Un índice de 0 a 100 con su banda y su desglose' },
  forecast: { nombre: 'Pronóstico', descripcion: 'Centro y banda de confianza, con su base' },
  list: { nombre: 'Lista ordenada', descripcion: 'Un ranking con desplazamiento y contador' },
  reco: { nombre: 'Recomendación', descripcion: 'Una acción con su ventana, su impacto y su base' },
  composition: { nombre: 'Composición', descripcion: 'Las partes de un total, que se declara' },
  comparison: { nombre: 'Comparación', descripcion: 'Dos medidas o dos perfiles, con la brecha' },
  distribution: { nombre: 'Distribución', descripcion: 'La forma de los datos, con n y cuartiles' },
  blocked: { nombre: 'Bloqueado', descripcion: 'La razón, qué lo desbloquea y la acción' },
  matrix: { nombre: 'Matriz', descripcion: 'Celdas con puntaje e intensidad' },
  graph: { nombre: 'Red', descripcion: 'Nodos y relaciones, agrupados por familia' },
}

export const FORMAS: Readonly<Record<Shape, string>> = {
  escalar: 'Cifra única',
  escalarConIntervalo: 'Cifra con intervalo',
  serieTemporal: 'Serie temporal',
  serieConBanda: 'Serie con banda',
  seriesMultiples: 'Varias series',
  categorica: 'Por categoría',
  categoricaComparada: 'Categorías comparadas',
  perfilMultiatributo: 'Perfil de varios atributos',
  composicion: 'Partes de un total',
  distribucion: 'Distribución',
  matriz: 'Matriz',
  flujo: 'Flujo',
  grafo: 'Red de relaciones',
  ranking: 'Ranking',
  tabular: 'Tabla',
  prosa: 'Texto',
}

/** El nombre de un tipo · el id cuando el servicio manda uno que no conocemos. */
export function nombreDeTipo(tipo: string): string {
  return (TIPOS as Readonly<Record<string, { nombre: string } | undefined>>)[tipo]?.nombre ?? tipo
}

export function descripcionDeTipo(tipo: string): string | null {
  return (
    (TIPOS as Readonly<Record<string, { descripcion: string } | undefined>>)[tipo]?.descripcion ??
    null
  )
}

/** El nombre de una forma · el id cuando no la conocemos. */
export function nombreDeForma(forma: string): string {
  return (FORMAS as Readonly<Record<string, string | undefined>>)[forma] ?? forma
}
