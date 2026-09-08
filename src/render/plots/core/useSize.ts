/** El tamaño real del contenedor · F1.13a
 *
 *  Es la pieza que hace responsivo el porte del `.pen`: allá los plots tienen
 *  geometría fija y no escalan; acá se dibujan contra el alto y el ancho que el
 *  panel les deja, que dependen del `rowSpan` y de la columna del viewport.
 *
 *  **Es el único estado local permitido en `render/`**, porque es de layout y no
 *  de negocio: medir no es conocer el dato.
 */
import { useEffect, useRef, useState } from 'react'

export type Size = { w: number; h: number }

/* ── UN SOLO ResizeObserver para todos los plots ───────────────────────────
 *
 * §8 lo pide explícito: «uno por canvas, no uno por plot». Antes cada `useSize`
 * creaba el suyo, así que una pestaña de ocho paneles tenía ocho observers
 * mirando ocho elementos — y el drill-down y el chat agregaban los suyos.
 *
 * Un observer con muchos targets es UNA suscripción al ciclo de layout del
 * navegador; ocho observers son ocho. La diferencia no se nota con seis plots y
 * sí con cuarenta y cinco, que es a donde va esto.
 *
 * Se crea perezosamente al primer uso y no se destruye: vive lo que vive la
 * aplicación, igual que el ciclo de layout que observa.
 */

type Notify = (size: Size) => void

const subscribed = new WeakMap<Element, Notify>()
let observer: ResizeObserver | null = null

function theObserver(): ResizeObserver | null {
  // Sin `ResizeObserver` —Node, o un jsdom sin el doble— el hook devuelve 0×0 y
  // el plot no dibuja, en vez de reventar el render entero.
  if (typeof ResizeObserver === 'undefined') return null
  observer ??= new ResizeObserver((entries) => {
    for (const entry of entries) {
      const notify = subscribed.get(entry.target)
      if (notify === undefined) continue
      const { width, height } = entry.contentRect
      notify({ w: Math.round(width), h: Math.round(height) })
    }
  })
  return observer
}

function observe(node: Element, notify: Notify): () => void {
  const o = theObserver()
  if (o === null) return () => {}
  subscribed.set(node, notify)
  o.observe(node)
  return () => {
    subscribed.delete(node)
    o.unobserve(node)
  }
}

export function useSize<T extends Element = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<Size>({ w: 0, h: 0 })

  useEffect(() => {
    const node = ref.current
    if (node === null) return
    return observe(node, setSize)
  }, [])

  return { ref, ...size }
}

/** Solo para pruebas: reinicia el observer compartido entre archivos. */
export function _resetObserver(): void {
  observer = null
}
