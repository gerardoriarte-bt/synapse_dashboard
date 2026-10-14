/** El chip de estado · §PEN:A2 · F5.20
 *
 *  El dibujo `A2 · Ficha · tenant en alta` lo usa **dos veces y con dos tonos**,
 *  que es la razón de que exista un componente y no dos bloques de utilidades:
 *
 *  · `EN ALTA` · borde `$w4`, texto `$ink` — el estado del cliente, neutro.
 *  · `BLOQUEADO` · borde `$acc`, texto `$acc` — el acceso a datos, que reclama
 *    una acción. Es uno de los cinco usos que §2.1 le permite al acento: el chip
 *    no dice «malo», dice «esto está esperando que alguien lo haga».
 *
 *  Los dos van **sin relleno** y con las mismas medidas: alto 22, padding lateral
 *  9, radio `$r-sm`. `h-5.5` y `px-2.25` son esos dos números sobre el
 *  `--spacing: 4px` de la escala, no medidas elegidas mirando la pantalla.
 *
 *  ── POR QUÉ NO ES `DegradedBadge` ───────────────────────────────────────────
 *
 *  Se parecen —chip sin relleno, borde de color, texto mono 9— y son dos cosas.
 *  Aquél lleva el icono `triangle-alert` que este frame no dibuja, sólo existe en
 *  naranja, y **vive en `render/`**: traerlo acá lo volvería un componente de
 *  panel usado por una superficie de administración.
 *
 *  ── EL TEXTO VA POR `Note`, NO POR `Label` ──────────────────────────────────
 *
 *  §2.3 declara cuatro tamaños mono y `Label` es el de **10** por definición de
 *  rol. El dibujo pide **9**, que es el de nota. Envolverlo en `Label` pintaría
 *  10; escribir las utilidades a mano acá es justo lo que L15 persigue. El color
 *  lo pone el chip y la nota lo hereda, que es la diferencia entre las dos
 *  primitivas.
 */
import { Note } from '../../render/primitives/Note'

/** Neutro o de acción. **No es un color, es un rol**: quien usa el chip no elige
 *  un naranja, elige si lo que el chip dice espera una acción. */
export type TonoDeChip = 'neutro' | 'accion'

const CHIP = 'inline-flex h-5.5 shrink-0 items-center rounded-sm border px-2.25'

const TONOS: Record<TonoDeChip, string> = {
  neutro: 'border-w4 text-ink',
  accion: 'border-acc text-acc',
}

export function StatusChip({
  children,
  tono = 'neutro',
}: {
  children: string
  tono?: TonoDeChip
}) {
  return (
    <span className={`${CHIP} ${TONOS[tono]}`}>
      <Note>{children}</Note>
    </span>
  )
}
