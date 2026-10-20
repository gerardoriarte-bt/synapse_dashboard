/** Cómo se distingue a un cliente de otro con el mismo nombre · 2026-10-09
 *
 *  La forma corta, o el comienzo del id si nadie la cargó. En la base local hay
 *  dos «Under Armour México» —uno alimenta la versión anterior de Synapse— y
 *  sin esto la lista, el filtro de usuarios y la aprobación de una solicitud
 *  ofrecían dos opciones idénticas.
 *
 *  **Desde el 2026-10-20 es la misma regla de la barra del cliente** ·
 *  `formaCortaVisible`. Eran dos funciones con dos criterios —ésta no miraba si
 *  la forma corta repetía el nombre, ni la pasaba a mayúsculas— y la lista y la
 *  barra podían decir cosas distintas del mismo cliente. */
import type { Tenant } from '../../api/admin'
import { formaCortaVisible } from '../clienteVisible'

export function distintivo(t: Pick<Tenant, 'id' | 'nombre' | 'formaCorta'>): string {
  return formaCortaVisible(t)
}
