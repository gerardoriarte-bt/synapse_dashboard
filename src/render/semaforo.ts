/** El semáforo por umbral · decisión humana del 2026-11-24
 *
 *  `docs/DECISIONES-2026-11-24-semaforos-y-eje-doble.md` §1. Lo leen tres
 *  dibujos y ninguno más: el arco (`gauge`), la barra contra objetivo (`bullet`)
 *  y la cifra de la `kpi`. **Sólo si el panel declara sus umbrales**: sin ellos
 *  los tres se dibujan como antes, con el color de su familia.
 *
 *  §ANCLA:DELTA-1 · **los deltas no pasan por acá.** La regla 7 de `design.md`
 *  vale entera para «VS MES ANTERIOR»: el semáforo juzga el VALOR contra un corte
 *  que datos definió; un delta es dirección, y su color sigue neutro.
 *
 *  §PEN:Plot/SEMÁFORO · Medidor en sus tres estados
 */
import { direccionDe, esDeDosLados, rangosDe } from '../catalog/umbrales'
import type { Umbrales } from '../catalog/umbrales'

export type EstadoDeUmbral = 'bien' | 'aceptable' | 'mal'

/** Del lado bueno del corte de `bien`, lo alcanza; del lado malo del de `mal`,
 *  lo pasa. Entre los dos, aceptable.
 *
 *  **El corte de `bien` se incluye y el de `mal` no**: un ROAS de 3,0 contra
 *  «bien desde 3,0» está bien, y uno de 2,0 contra «mal debajo de 2,0» todavía
 *  no está mal. Es lo que dice el rótulo —«≥ 3,0» y «< 2,0»—, y el rótulo y el
 *  color no pueden decir dos cosas.
 *
 *  **De dos lados vale el mismo criterio en cada borde**: un pacing de 110 %
 *  contra «bien entre 90 y 110» está bien, y uno de 120 % contra «mal fuera de
 *  80–120» todavía no está mal. Sin rango de mal, el de mal es el de bien, y
 *  todo lo que sale de bien cae en mal sin pasar por aceptable. */
export function estadoPorUmbral(v: number, u: Umbrales): EstadoDeUmbral {
  if (esDeDosLados(u)) {
    const { bien, mal } = rangosDe(u)
    if (v >= bien[0] && v <= bien[1]) return 'bien'
    if (v < mal[0] || v > mal[1]) return 'mal'
    return 'aceptable'
  }
  if (direccionDe(u) === 'masAltoMejor') {
    if (v >= u.bien) return 'bien'
    if (v < u.mal) return 'mal'
    return 'aceptable'
  }
  if (v <= u.bien) return 'bien'
  if (v > u.mal) return 'mal'
  return 'aceptable'
}

const NOMBRE: Record<EstadoDeUmbral, string> = { bien: 'Bien', aceptable: 'Aceptable', mal: 'Mal' }

/** «Bien · ≥ 3.0x» · **el color nunca va solo**: el estado se escribe, con el
 *  corte que lo decide. `cifra` es el formateador del tenant con la unidad
 *  compuesta — `render/` no formatea por su cuenta.
 *
 *  **Recibe el valor y no el estado**: de dos lados, «mal» no alcanza para
 *  escribirlo —hay que decir si es por debajo o por encima—, y el lado sale del
 *  valor. Calcular el estado acá, con la misma función que da el color, es lo
 *  que impide que el texto y el color digan dos cosas.
 *
 *  **El lado se escribe con palabras del front, no con las de datos**: el
 *  catálogo de Terpel llama «Sobregasto» al pacing alto, y ese es copy de dato
 *  que no le toca a `render/` repetir. «Por encima de 110 %» dice lo mismo. */
export function textoDeEstado(v: number, u: Umbrales, cifra: (v: number) => string): string {
  const estado = estadoPorUmbral(v, u)
  if (esDeDosLados(u)) {
    const { bien, mal } = rangosDe(u)
    const corte =
      estado === 'bien'
        ? `entre ${cifra(bien[0])} y ${cifra(bien[1])}`
        : estado === 'mal'
          ? v < mal[0]
            ? `por debajo de ${cifra(mal[0])}`
            : `por encima de ${cifra(mal[1])}`
          : v < bien[0]
            ? `entre ${cifra(mal[0])} y ${cifra(bien[0])}`
            : `entre ${cifra(bien[1])} y ${cifra(mal[1])}`
    return `${NOMBRE[estado]} · ${corte}`
  }
  const alto = direccionDe(u) === 'masAltoMejor'
  const corte =
    estado === 'bien'
      ? `${alto ? '≥' : '≤'} ${cifra(u.bien)}`
      : estado === 'mal'
        ? `${alto ? '<' : '>'} ${cifra(u.mal)}`
        : `entre ${cifra(Math.min(u.bien, u.mal))} y ${cifra(Math.max(u.bien, u.mal))}`
  return `${NOMBRE[estado]} · ${corte}`
}

/** El color de la MARCA —el arco, la barra— en cada estado.
 *
 *  **Aceptable es el gris de siempre, `dim`**, y no el color de la familia: con
 *  umbrales declarados el color pasa a ser el juicio, y dejar la familia en el
 *  tramo del medio la haría leerse como un cuarto estado. Ámbar, nunca. */
export const TONO_DE_MARCA: Record<EstadoDeUmbral, string> = {
  bien: 'var(--color-estado-bien)',
  aceptable: 'var(--color-dim)',
  mal: 'var(--color-estado-mal)',
}
