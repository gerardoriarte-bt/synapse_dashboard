/** El rótulo del semáforo · «BIEN · ≥ 3.0X» · decisión humana del 2026-11-24
 *
 *  **El color nunca va solo**: este rótulo acompaña siempre al arco, a la barra
 *  o a la cifra pintados, y dice con palabras lo mismo que el color. Es lo que
 *  hace que el semáforo se lea en gris, impreso o con daltonismo, y que el
 *  estado no sea un juicio sin base: el corte va escrito.
 *
 *  Tiene la tipografía de `Label` —mono 10, `0.12em`, mayúsculas— y no lo usa
 *  porque `Label` es `dim` por contrato y acá el color ES el dato. Aceptable sí
 *  queda en `dim`: es el gris de siempre.
 *
 *  La marca de 8 × 8 repite el tono al lado del texto, para que el rótulo se
 *  asocie con lo pintado aunque el texto quede lejos de la marca.
 */
import type { EstadoDeUmbral } from '../semaforo'

/** Escritas enteras para que Tailwind las vea: una utilidad armada con
 *  interpolación no la encuentra el escáner y se pinta sin color. */
const TEXTO: Record<EstadoDeUmbral, string> = {
  bien: 'text-estado-bien',
  aceptable: 'text-dim',
  mal: 'text-estado-mal',
}
const MARCA: Record<EstadoDeUmbral, string> = {
  bien: 'bg-estado-bien',
  aceptable: 'bg-dim',
  mal: 'bg-estado-mal',
}

export function Semaforo({ estado, children }: { estado: EstadoDeUmbral; children: string }) {
  return (
    <span data-estado={estado} className="inline-flex items-center gap-1.5 min-w-0">
      <span aria-hidden className={`shrink-0 size-2 rounded-xs ${MARCA[estado]}`} />
      <span className={`font-mono text-label leading-rotulo tracking-rotulo uppercase m-0 ${TEXTO[estado]}`}>
        {children}
      </span>
    </span>
  )
}
