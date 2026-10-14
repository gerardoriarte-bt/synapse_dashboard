/** Cómo se distingue a un cliente de otro con el mismo nombre · 2026-10-09
 *
 *  La forma corta, o el comienzo del id si nadie la cargó. En la base local hay
 *  dos «Under Armour México» —uno alimenta la versión anterior de Synapse— y
 *  sin esto la lista, el filtro de usuarios y la aprobación de una solicitud
 *  ofrecían dos opciones idénticas. */
import type { Tenant } from '../../api/admin'

export function distintivo(t: Pick<Tenant, 'id' | 'formaCorta'>): string {
  return t.formaCorta !== '' ? t.formaCorta : t.id.slice(0, 8)
}
