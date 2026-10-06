/** El cliente sobre el que trabaja la superficie · ver `clienteDeTrabajo.ts`.
 *
 *  **El defecto es el cliente PROPIO, no el primero de la lista.** Quien entra
 *  a administración o al builder casi siempre viene a trabajar sobre su cliente,
 *  y es el mismo que le muestra la consola: arrancar ahí es lo que hace que las
 *  tres superficies digan lo mismo hasta que alguien elija otro.
 *
 *  Una elección que ya no está en la lista —otro usuario, otro ambiente— se
 *  ignora en vez de pedir datos de un cliente que no se puede ver.
 *
 *  **Sin provider funciona igual**, con estado propio: las pruebas montan una
 *  superficie suelta, y una superficie no tiene por qué saber dónde la montan.
 */
import { useContext, useState } from 'react'
import { ContextoDeCliente } from './clienteDeTrabajo'

export function useClienteDeTrabajo(
  lista: readonly { id: string }[],
  propio: string | null,
): [string | null, (id: string) => void] {
  const compartido = useContext(ContextoDeCliente)
  const [local, setLocal] = useState<string | null>(null)
  const elegido = compartido === null ? local : compartido.elegido
  const elegir = compartido === null ? setLocal : compartido.elegir

  const existe = (id: string | null) => id !== null && lista.some((t) => t.id === id)
  const activo = existe(elegido) ? elegido : existe(propio) ? propio : (lista[0]?.id ?? null)
  return [activo, elegir]
}
