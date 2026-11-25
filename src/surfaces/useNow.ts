/** El «ahora» de una pantalla · 2026-11-25
 *
 *  **Leer el reloj en el render es impuro**, y `oxlint` 1.93 lo marca
 *  (`react(purity)`): el mismo render, repetido, da otra hora. Ocho pantallas
 *  hacían `new Date()` en el cuerpo del componente para escribir frescuras
 *  —«HACE 3 H»—, marcas del riel de hilos y el mes en curso de A5.
 *
 *  **El instante se lee al montar y se renueva con un intervalo**, no en cada
 *  render. Antes el texto relativo avanzaba sólo si algo repintaba la pantalla;
 *  ahora avanza también con la pantalla quieta. Un minuto alcanza: el texto más
 *  fino que se escribe con esto es la hora y el minuto del riel.
 *
 *  **Esto es un INSTANTE, no un huso.** Qué día o qué mes es ese instante lo
 *  decide quien lo usa: el corte del negocio es del tenant (`mesEnCurso` con
 *  su zona) y la presentación —HOY, ESTA SEMANA— es del navegador. Este hook
 *  no elige ninguno de los dos, y no tiene que.
 */
import { useEffect, useState } from 'react'

/** Cada cuánto se renueva el «ahora» por defecto. */
export const INTERVALO_DEL_RELOJ_MS = 60_000

export function useNow(intervaloMs: number = INTERVALO_DEL_RELOJ_MS): Date {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), intervaloMs)
    return () => clearInterval(reloj)
  }, [intervaloMs])
  return ahora
}
