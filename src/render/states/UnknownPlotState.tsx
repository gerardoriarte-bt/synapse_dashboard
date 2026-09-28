/** El gráfico que este cuerpo no sabe dibujar · 2026-09-28
 *
 *  **No es un error del servidor ni un panel vacío: es una versión del front que
 *  se quedó corta.** El layout pide un gráfico que existe en el repertorio y
 *  este build no implementa.
 *
 *  **Existe para que NO se caiga al gráfico por defecto**, que es el modo de
 *  falla que esto previene: una cascada dibujada como dona se ve perfecta y
 *  miente sobre qué se está mirando. Es la misma familia que `presentation` y
 *  que el spread condicional — plausible en vez de a prueba de fallo.
 *
 *  El shell sigue arriba: título, BASE y procedencia no se tocan, porque un
 *  estado reemplaza el cuerpo y nunca el shell.
 */
import { Icon } from './Icon'
import { StateBody } from './StateBody'

export function UnknownPlotState({ grafico }: { grafico: string }) {
  return (
    <StateBody
      name="Gráfico no disponible"
      mark={
        <Icon>
          <path d="M3 3v18h18" />
          <path d="M7 14l3-3 3 3 4-5" />
          <path d="M15 4l6 6M21 4l-6 6" />
        </Icon>
      }
      phrase={`Este panel pide «${grafico}» y esta versión todavía no lo dibuja`}
      detail="La cifra está disponible · lo que falta es el dibujo"
    />
  )
}
