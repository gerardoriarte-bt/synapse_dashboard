/** ¿Este rol administra? · ver `src/api/rol.ts`.
 *
 *  **«superadmin» se agregó el 2026-10-20**, medido en QA: el backend creó el rol
 *  y con él `/admin/*` contesta 200 y cruza clientes. Sólo con «admin», el front
 *  escondía el menú de trabajo a quien el servidor sí habilita.
 */
import { describe, expect, it } from 'vitest'
import { esAdmin } from '@/api/rol'

const rol = (nombre: string) => ({ id: 'r-1', nombre }) as never

describe('esAdmin', () => {
  it('«admin» en cualquier caja, como lo compara el servicio', () => {
    expect(esAdmin(rol('admin'))).toBe(true)
    expect(esAdmin(rol('Admin'))).toBe(true)
  })
  it('«superadmin» también · es el rol con el que QA cruza clientes', () => {
    expect(esAdmin(rol('superadmin'))).toBe(true)
    expect(esAdmin(rol(' SuperAdmin '))).toBe(true)
  })
  it('un planner no', () => {
    expect(esAdmin(rol('Planner'))).toBe(false)
  })
  it('sin rol todavía, no', () => {
    expect(esAdmin(undefined)).toBe(false)
  })
})
