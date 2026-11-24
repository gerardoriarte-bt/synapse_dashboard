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
import { direccionDe } from '../catalog/umbrales'
import type { Umbrales } from '../catalog/umbrales'

export type EstadoDeUmbral = 'bien' | 'aceptable' | 'mal'

/** Del lado bueno del corte de `bien`, lo alcanza; del lado malo del de `mal`,
 *  lo pasa. Entre los dos, aceptable.
 *
 *  **El corte de `bien` se incluye y el de `mal` no**: un ROAS de 3,0 contra
 *  «bien desde 3,0» está bien, y uno de 2,0 contra «mal debajo de 2,0» todavía
 *  no está mal. Es lo que dice el rótulo —«≥ 3,0» y «< 2,0»—, y el rótulo y el
 *  color no pueden decir dos cosas. */
export function estadoPorUmbral(v: number, u: Umbrales): EstadoDeUmbral {
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
 *  compuesta — `render/` no formatea por su cuenta. */
export function textoDeEstado(estado: EstadoDeUmbral, u: Umbrales, cifra: (v: number) => string): string {
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
