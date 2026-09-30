/** Las líneas de diff de una publicación · §PEN:B6
 *
 *  **Función PURA, y vive fuera del componente a propósito.** Es donde muerden
 *  las mutaciones: el `?? []` del adaptador y el reparto de los tres glifos son
 *  las dos cosas que pueden estar mal sin que nada falle a la vista.
 *
 *  ── LOS TRES GLIFOS DEL DIBUJO CUBREN LAS OCHO LISTAS ───────────────────────
 *
 *  El `.pen` dibuja exactamente tres —`+`, `~`, `!`— y **no se inventa un
 *  cuarto**. El reparto sale de lo que el dibujo hace con cada uno:
 *
 *  | Glifo | Qué | Del dibujo |
 *  |---|---|---|
 *  | `+` | lo que se AGREGÓ | «AÑADIDO · kpi «Unidades»…», en `$fam-medios-1` |
 *  | `~` | lo que CAMBIÓ de lugar, de tipo o de parámetro | «MOVIDO · …», «PARÁMETRO · …» |
 *  | `!` | lo DESTRUCTIVO | v2: «LA PESTAÑA DEJA DE SER 100% HEREDADA» |
 *
 *  **El `!` no quedó sin uso.** El dibujo lo usa dos veces y una es para la línea
 *  `RAZÓN · …`, que **no existe en el cable** —es el porqué de una decisión
 *  humana— y no se compone. La otra es el aviso de v2, que sí es un hecho: una
 *  pestaña dejó de ser heredada. Así que `!` va a los hechos destructivos que el
 *  cable manda —`tabs_removed` y `panels_removed`—, que es el mismo tono.
 *
 *  ── EL ORDEN NO ES EL DEL CABLE ────────────────────────────────────────────
 *
 *  El servicio ordena cada lista por dentro —alfabético por pestaña y métrica,
 *  leído en `DiffLayouts`— pero no dice en qué orden van las ocho listas entre
 *  sí. Acá van **añadido → quitado → cambiado → reordenado**, que es el orden en
 *  que el dibujo las pinta: lo nuevo arriba y el detalle abajo.
 *
 *  ── LO QUE ESTA FUNCIÓN NO HACE ────────────────────────────────────────────
 *
 *  **No arma la frase.** Devuelve datos estructurados con un rótulo de chrome y
 *  el JSX los pinta. El nombre de la métrica lo pone la pantalla con el catálogo,
 *  porque el diff trae `metricId` y ningún nombre.
 *
 *  **Y el rótulo es chrome nuestro sobre valores del cable**, no traducción de
 *  una clave del contrato: `panels_moved` sigue llamándose así en el tipo.
 */
import type { DiffDePublicacion, GeometriaDePanel } from '../../api/admin'

/** Los tres del dibujo. Cerrado a propósito: un cuarto glifo sería una decisión
 *  visual que el `.pen` no tomó. */
export type Glifo = '+' | '~' | '!'

export type RotuloDeCambio =
  | 'PESTAÑA AÑADIDA'
  | 'AÑADIDO'
  | 'PESTAÑA QUITADA'
  | 'QUITADO'
  | 'MOVIDO'
  | 'RETIPADO'
  | 'PARÁMETRO'
  | 'PESTAÑAS REORDENADAS'

export type Cambio = {
  glifo: Glifo
  rotulo: RotuloDeCambio
  /** El NOMBRE normalizado de la pestaña · ver `RefDePanel` en `api/admin.ts`.
   *  No es su `key` ni su id, y cruzarlo como tal no encuentra nada. */
  pestana: string
  /** Ausente en las entradas de PESTAÑA: una pestaña no tiene tipo de panel. */
  tipo?: string
  /** Ausente en las entradas de pestaña. Cuando está, el nombre lo resuelve la
   *  pantalla contra el catálogo. */
  metricId?: string
  desde?: GeometriaDePanel
  hasta?: GeometriaDePanel
  tipoAnterior?: string
}

/** Las ocho listas del diff, en una sola lista ordenada de entradas.
 *
 *  Vacío cuando no hubo ningún cambio de composición — y la tarjeta lo dice con
 *  un rótulo, en vez de pintar el contenedor del diff con su borde superior
 *  colgando y nada abajo. Es el mismo defecto que la línea de BASE con el
 *  separador suelto. */
export function cambios(diff: DiffDePublicacion): Cambio[] {
  const fuera: Cambio[] = []

  for (const pestana of diff.pestanasAnadidas) {
    fuera.push({ glifo: '+', rotulo: 'PESTAÑA AÑADIDA', pestana })
  }
  for (const p of diff.panelesAnadidos) {
    fuera.push({ glifo: '+', rotulo: 'AÑADIDO', pestana: p.pestana, tipo: p.tipo, metricId: p.metricId })
  }
  for (const pestana of diff.pestanasQuitadas) {
    fuera.push({ glifo: '!', rotulo: 'PESTAÑA QUITADA', pestana })
  }
  for (const p of diff.panelesQuitados) {
    fuera.push({ glifo: '!', rotulo: 'QUITADO', pestana: p.pestana, tipo: p.tipo, metricId: p.metricId })
  }
  for (const p of diff.panelesMovidos) {
    fuera.push({
      glifo: '~',
      rotulo: 'MOVIDO',
      pestana: p.pestana,
      tipo: p.tipo,
      metricId: p.metricId,
      desde: p.desde,
      hasta: p.hasta,
    })
  }
  for (const p of diff.panelesRetipados) {
    fuera.push({
      glifo: '~',
      rotulo: 'RETIPADO',
      pestana: p.pestana,
      tipo: p.tipo,
      metricId: p.metricId,
      tipoAnterior: p.tipoAnterior,
    })
  }
  for (const p of diff.panelesConParametroCambiado) {
    fuera.push({ glifo: '~', rotulo: 'PARÁMETRO', pestana: p.pestana, tipo: p.tipo, metricId: p.metricId })
  }
  // **Va última y el resumen no la cuenta.** El cable lo dice: `summary` no tiene
  // contador de reordenamiento. Así que la suma de las entradas `~` DE PANEL es
  // `contadores.panelesCambiados`, y ésta queda afuera de ese cruce a propósito
  // — si se sumara, el único control que el servicio permite dejaría de cerrar.
  for (const pestana of diff.pestanasReordenadas) {
    fuera.push({ glifo: '~', rotulo: 'PESTAÑAS REORDENADAS', pestana })
  }

  return fuera
}
