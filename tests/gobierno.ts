/** Abrir la BASE y la procedencia de un panel · 2026-10-06
 *
 *  **Desde ese día viven detrás del ⓘ** —decisión humana contra las reglas 8 y
 *  9 de `design.md`, ver `src/render/Panel/MetaInfo.tsx`—. Las pruebas que
 *  afirmaban «la BASE sigue visible en los siete estados» no se borraron: la
 *  invariante pasó a ser «sigue DECLARADA en el shell en los siete estados», y
 *  para leerla hay que abrir el ícono, igual que un usuario.
 *
 *  `click` y no `hover`: el toque deja la ficha fijada, que es el camino que no
 *  depende de un puntero. */
import { fireEvent, screen, within } from '@testing-library/react'

export async function abrirGobierno(scope?: HTMLElement): Promise<HTMLElement> {
  const donde = scope === undefined ? screen : within(scope)
  fireEvent.click(await donde.findByRole('button', { name: 'Base y procedencia' }))
  return donde.getByRole('tooltip')
}

/** Abre las de TODOS los paneles en pantalla, para las pruebas que leen la
 *  procedencia de la superficie entera. */
export async function abrirTodas(): Promise<void> {
  const botones = await screen.findAllByRole('button', { name: 'Base y procedencia' })
  for (const b of botones) fireEvent.click(b)
}
