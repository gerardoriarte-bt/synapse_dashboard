/** Las filas de esqueleto de una tabla de administración · corrección del `.pen`
 *
 *  **Esqueleto y NUNCA spinner**, que es lo que el `.pen` escribe en la nota de
 *  `A1 · Clientes · cargando`:
 *
 *  > «La tabla ya sabe cuántas columnas tiene y de qué ancho, así que **puede
 *  > prometer la forma que va a llegar**. Un spinner solo dice "esperá".»
 *
 *  Es la misma decisión que `render/states/LoadingState` toma para un panel, y
 *  por la misma razón — con la vuelta de tuerca de que una tabla promete más: el
 *  encabezado ya dice qué columnas van a venir.
 *
 *  ── LO QUE SE PINTA Y LO QUE NO ─────────────────────────────────────────────
 *
 *  **El encabezado va completo desde el principio**: no depende de los datos.
 *  Lo mismo los filtros, los CTA y las reglas al pie. Lo único que se reemplaza
 *  son las FILAS, que es lo único que está en vuelo.
 *
 *  **Y los conteos dicen CARGANDO, no una cifra.** Decir «3 clientes» mientras
 *  carga es afirmar algo que todavía no llegó — la misma regla que impide pintar
 *  un número aproximado en un panel degradado.
 *
 *  ── UNA SOLA VARIANTE PARA LAS CUATRO PANTALLAS ─────────────────────────────
 *
 *  La nota lo dice: «Esta es el patrón para las cuatro: no hace falta una
 *  variante por pantalla». El esqueleto no sabe de qué tabla es — recibe cuántas
 *  columnas tiene y nada más.
 *
 *  **Sin animación**, igual que el de la consola. Un pulso sincronizado en
 *  cuatro tablas es ruido, y no dice nada que la forma no diga ya.
 */

/** Cuatro, como el `.pen`: «4 filas de esqueleto». Suficiente para que la tabla
 *  tenga cuerpo y no tantas como para prometer cuántas van a llegar. */
const FILAS = 4

type Props = {
  columnas: number
}

export function SkeletonRows({ columnas }: Props) {
  return (
    <>
      {Array.from({ length: FILAS }, (_, f) => (
        <tr key={f} className="border-b border-w3" aria-hidden="true">
          {Array.from({ length: columnas }, (_, c) => (
            <td key={c} className="py-3 pr-4">
              {/* Anchos distintos por columna: una grilla de barras idénticas se
                  lee como un patrón y no como texto que va a llegar. */}
              <div
                className={
                  'bg-w2 rounded-xs h-3 ' + (c === 0 ? 'w-3/4' : c % 2 === 0 ? 'w-1/2' : 'w-2/3')
                }
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
