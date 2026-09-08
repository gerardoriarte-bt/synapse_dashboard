// ESCRITO A MANO. A diferencia de `tokens.css`, este archivo no se genera.

export type Theme = 'dark' | 'light'

const ROOT = 'data-theme'

/** Aplica el tema. Es el switcher entero: las custom properties hacen el resto,
 *  así que no hay recálculo, ni re-render, ni estilos en JS. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute(ROOT, theme)
}

/** El tema aplicado. Sin atributo devuelve 'dark', que es el defecto que emite
 *  `tokens.css` — el producto es oscuro y las pantallas del `.pen` están fijadas
 *  a Mode:Dark. */
export function currentTheme(): Theme {
  return document.documentElement.getAttribute(ROOT) === 'light' ? 'light' : 'dark'
}

/** Invierte el tema y devuelve el que quedó. */
export function toggleTheme(): Theme {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}

// La PERSISTENCIA no vive acá y es a propósito · §2.4 de design.md: «el tema es
// preferencia de usuario, no de tenant. Se persiste por usuario.» O sea contra
// el perfil, no contra el navegador — un localStorage haría que la misma cuenta
// se viera distinta en dos máquinas.
//
// Este archivo se queda con lo puro: escribir el atributo y leerlo. Quien guarda
// es `useSaveTheme` en `api/hooks.ts` (F1.12), porque persistir es hablar con
// el servidor. El valor inicial llega en `/config/me` →
// `usuario.preferencias.tema` y lo aplica la superficie.
//
// `prefers-color-scheme` no se lee: si el tema es preferencia declarada del
// usuario, la del sistema operativo solo puede ser el valor inicial, y eso lo
// decide quien defina el alta de usuario.
