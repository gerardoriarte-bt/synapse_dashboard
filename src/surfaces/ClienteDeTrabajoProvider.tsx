/** El dueño del cliente de trabajo · ver `clienteDeTrabajo.ts`. */
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ContextoDeCliente } from './clienteDeTrabajo'

export function ClienteDeTrabajoProvider({ children }: { children: ReactNode }) {
  const [elegido, elegir] = useState<string | null>(null)
  const valor = useMemo(() => ({ elegido, elegir }), [elegido])
  return <ContextoDeCliente.Provider value={valor}>{children}</ContextoDeCliente.Provider>
}
