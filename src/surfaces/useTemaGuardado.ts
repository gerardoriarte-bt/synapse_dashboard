/** Aplicar el tema que el usuario guardó · 2026-10-02
 *
 *  **`tokens/theme.ts` declara que «el valor inicial llega en `/config/me` y lo
 *  aplica la superficie», y hasta hoy lo aplicaba UNA.** `ConsoleContainer`
 *  tenía el efecto; admin y el builder abrían siempre en oscuro aunque la
 *  persona hubiera elegido claro.
 *
 *  Se vio al poner el selector de tema en las tres —la decisión de diseño del
 *  2026-09-28— y es el mismo modo de falla con otra cara: el control existía en
 *  una sola superficie, y ahora el que no estaba era el efecto.
 *
 *  **Es un hook y no un efecto en `app/`** para no mover la decisión: la
 *  superficie sigue siendo quien aplica. Lo que se quita es la repetición, que
 *  es donde vivía el riesgo de que una se olvidara — exactamente lo que pasó.
 */
import { useEffect } from 'react'
import { applyTheme } from '../tokens/theme'
import type { Theme } from '../tokens/theme'

export function useTemaGuardado(tema: Theme | undefined): void {
  useEffect(() => {
    if (tema !== undefined) applyTheme(tema)
  }, [tema])
}
